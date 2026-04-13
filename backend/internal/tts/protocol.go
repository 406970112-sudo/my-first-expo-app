package tts

import (
	"bytes"
	"encoding/binary"
	"fmt"

	"github.com/gorilla/websocket"
)

const (
	eventTypeSessionFinished = 152

	msgTypeFullClientRequest  = 0b1
	msgTypeFullServerResponse = 0b1001
	msgTypeAudioOnlyServer    = 0b1011
	msgTypeError              = 0b1111

	msgFlagNoSeq       = 0
	msgFlagPositiveSeq = 0b1
	msgFlagNegativeSeq = 0b11
	msgFlagWithEvent   = 0b100

	versionBits    = 1
	headerSizeBits = 1
	serialization  = 0b1
	compression    = 0
)

type protocolMessage struct {
	Event   int32
	Flag    uint8
	Payload []byte
	Type    uint8
}

func sendFullClientRequest(conn *websocket.Conn, payload []byte) error {
	message := marshalMessage(protocolMessage{
		Flag:    msgFlagNoSeq,
		Payload: payload,
		Type:    msgTypeFullClientRequest,
	})

	return conn.WriteMessage(websocket.BinaryMessage, message)
}

func receiveMessage(conn *websocket.Conn) (protocolMessage, error) {
	_, data, err := conn.ReadMessage()
	if err != nil {
		return protocolMessage{}, err
	}

	return unmarshalMessage(data)
}

func marshalMessage(message protocolMessage) []byte {
	header := []byte{
		byte(versionBits<<4) | byte(headerSizeBits),
		byte(message.Type<<4) | byte(message.Flag),
		byte(serialization<<4) | byte(compression),
		0,
	}

	buffer := bytes.NewBuffer(header)
	_ = binary.Write(buffer, binary.BigEndian, uint32(len(message.Payload)))
	buffer.Write(message.Payload)
	return buffer.Bytes()
}

func unmarshalMessage(data []byte) (protocolMessage, error) {
	if len(data) < 8 {
		return protocolMessage{}, fmt.Errorf("message too short")
	}

	message := protocolMessage{
		Type: data[1] >> 4,
		Flag: data[1] & 0x0F,
	}

	offset := int((data[0] & 0x0F) * 4)
	if offset > len(data) {
		return protocolMessage{}, fmt.Errorf("invalid header size")
	}

	if message.Flag == msgFlagWithEvent {
		if len(data) < offset+8 {
			return protocolMessage{}, fmt.Errorf("message missing event block")
		}
		message.Event = int32(binary.BigEndian.Uint32(data[offset : offset+4]))
		offset += 4

		sessionIDSize := int(binary.BigEndian.Uint32(data[offset : offset+4]))
		offset += 4 + sessionIDSize
		if offset > len(data) {
			return protocolMessage{}, fmt.Errorf("message missing session block")
		}

		if message.Type == msgTypeFullServerResponse && (message.Event == 50 || message.Event == 51 || message.Event == 52) {
			if len(data) < offset+4 {
				return protocolMessage{}, fmt.Errorf("message missing connect block")
			}
			connectIDSize := int(binary.BigEndian.Uint32(data[offset : offset+4]))
			offset += 4 + connectIDSize
			if offset > len(data) {
				return protocolMessage{}, fmt.Errorf("message missing connect id")
			}
		}
	}

	if message.Flag == msgFlagPositiveSeq || message.Flag == msgFlagNegativeSeq {
		if len(data) < offset+4 {
			return protocolMessage{}, fmt.Errorf("message missing sequence")
		}
		offset += 4
	}

	if message.Type == msgTypeError {
		if len(data) < offset+4 {
			return protocolMessage{}, fmt.Errorf("message missing error code")
		}
		offset += 4
	}

	if len(data) < offset+4 {
		return protocolMessage{}, fmt.Errorf("message missing payload size")
	}

	payloadSize := int(binary.BigEndian.Uint32(data[offset : offset+4]))
	offset += 4
	if len(data) < offset+payloadSize {
		return protocolMessage{}, fmt.Errorf("message payload truncated")
	}

	message.Payload = append([]byte(nil), data[offset:offset+payloadSize]...)
	return message, nil
}
