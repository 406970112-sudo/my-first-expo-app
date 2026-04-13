package tts

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"

	"my-first-expo-app/backend/internal/config"
)

type VolcEngineProvider struct {
	cfg config.VolcConfig
}

func NewVolcEngineProvider(cfg config.VolcConfig) *VolcEngineProvider {
	return &VolcEngineProvider{cfg: cfg}
}

func (p *VolcEngineProvider) Synthesize(ctx context.Context, request ProviderRequest) (ProviderResult, error) {
	resourceID := strings.TrimSpace(p.cfg.ResourceID)
	if resourceID == "" {
		resourceID = voiceToResourceID(request.VoiceType)
	}

	headers := http.Header{}
	headers.Set("X-Api-App-Key", p.cfg.AppID)
	headers.Set("X-Api-Access-Key", p.cfg.AccessToken)
	headers.Set("X-Api-Resource-Id", resourceID)
	headers.Set("X-Api-Connect-Id", uuid.NewString())

	dialer := websocket.Dialer{}
	conn, _, err := dialer.DialContext(ctx, p.cfg.Endpoint, headers)
	if err != nil {
		return ProviderResult{}, fmt.Errorf("connect volcengine failed: %w", err)
	}
	defer conn.Close()

	additions := map[string]any{
		"disable_markdown_filter": false,
	}
	if request.UseTagParser != nil {
		additions["use_tag_parser"] = *request.UseTagParser
	}
	if request.ContextText != "" {
		additions["context_texts"] = []string{request.ContextText}
	}

	additionsJSON, err := json.Marshal(additions)
	if err != nil {
		return ProviderResult{}, fmt.Errorf("marshal additions failed: %w", err)
	}

	payload := map[string]any{
		"user": map[string]any{
			"uid": uuid.NewString(),
		},
		"req_params": map[string]any{
			"speaker": request.VoiceType,
			"text":    request.Text,
			"audio_params": map[string]any{
				"format":           request.Encoding,
				"sample_rate":      24000,
				"enable_timestamp": true,
			},
			"additions": string(additionsJSON),
		},
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return ProviderResult{}, fmt.Errorf("marshal request failed: %w", err)
	}

	if err := sendFullClientRequest(conn, payloadBytes); err != nil {
		return ProviderResult{}, fmt.Errorf("send request failed: %w", err)
	}

	audioChunks := make([][]byte, 0, 8)
	for {
		message, err := receiveMessage(conn)
		if err != nil {
			return ProviderResult{}, fmt.Errorf("receive message failed: %w", err)
		}

		switch message.Type {
		case msgTypeError:
			return ProviderResult{}, fmt.Errorf("volcengine error: %s", string(message.Payload))
		case msgTypeAudioOnlyServer:
			audioChunks = append(audioChunks, message.Payload)
		case msgTypeFullServerResponse:
			if message.Event == eventTypeSessionFinished {
				audioBytes := mergeChunks(audioChunks)
				if len(audioBytes) == 0 {
					return ProviderResult{}, fmt.Errorf("no audio received")
				}
				return ProviderResult{
					Audio:      audioBytes,
					ResourceID: resourceID,
				}, nil
			}
		default:
			return ProviderResult{}, fmt.Errorf("unexpected message type: %d", message.Type)
		}
	}
}

func voiceToResourceID(voice string) string {
	if strings.HasPrefix(voice, "S_") {
		return "volc.megatts.default"
	}
	return "volc.service_type.10029"
}

func mergeChunks(chunks [][]byte) []byte {
	total := 0
	for _, chunk := range chunks {
		total += len(chunk)
	}

	result := make([]byte, 0, total)
	for _, chunk := range chunks {
		result = append(result, chunk...)
	}
	return result
}
