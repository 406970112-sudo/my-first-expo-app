package tts

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"

	"my-first-expo-app/backend/internal/config"
)

type Service struct {
	cfg      config.Config
	provider Provider
}

type Provider interface {
	Synthesize(ctx context.Context, request ProviderRequest) (ProviderResult, error)
}

type SynthesizeRequest struct {
	AccessToken  string `json:"access_token,omitempty"`
	AppID        string `json:"appid,omitempty"`
	ContextText  string `json:"context_text"`
	Encoding     string `json:"encoding"`
	Endpoint     string `json:"endpoint,omitempty"`
	ResourceID   string `json:"resource_id,omitempty"`
	Text         string `json:"text"`
	UseTagParser *bool  `json:"use_tag_parser,omitempty"`
	VoiceType    string `json:"voice_type"`
}

type SynthesizeResult struct {
	FileName         string
	FilePath         string
	RelativeAudioURL string
	ResourceID       string
}

type ProviderRequest struct {
	AccessToken  string
	AppID        string
	ContextText  string
	Encoding     string
	Endpoint     string
	ResourceID   string
	Text         string
	UseTagParser *bool
	VoiceType    string
}

type ProviderResult struct {
	Audio      []byte
	ResourceID string
}

func NewService(cfg config.Config, provider Provider) *Service {
	return &Service{
		cfg:      cfg,
		provider: provider,
	}
}

func (s *Service) Synthesize(ctx context.Context, request SynthesizeRequest) (SynthesizeResult, error) {
	request = normalizeRequest(request)

	if err := s.validateRequest(request); err != nil {
		return SynthesizeResult{}, err
	}

	providerResult, err := s.provider.Synthesize(ctx, ProviderRequest{
		AccessToken:  request.AccessToken,
		AppID:        request.AppID,
		ContextText:  request.ContextText,
		Encoding:     request.Encoding,
		Endpoint:     request.Endpoint,
		ResourceID:   request.ResourceID,
		Text:         request.Text,
		UseTagParser: request.UseTagParser,
		VoiceType:    request.VoiceType,
	})
	if err != nil {
		return SynthesizeResult{}, err
	}

	if err := os.MkdirAll(s.cfg.Storage.AudioDir, 0o755); err != nil {
		return SynthesizeResult{}, fmt.Errorf("create audio dir failed: %w", err)
	}

	fileName := buildOutputFileName(request.VoiceType, request.Encoding)
	filePath := filepath.Join(s.cfg.Storage.AudioDir, fileName)

	if err := os.WriteFile(filePath, providerResult.Audio, 0o644); err != nil {
		return SynthesizeResult{}, fmt.Errorf("write audio file failed: %w", err)
	}

	return SynthesizeResult{
		FileName:         fileName,
		FilePath:         filePath,
		RelativeAudioURL: "/voice/" + fileName,
		ResourceID:       providerResult.ResourceID,
	}, nil
}

func (s *Service) validateRequest(request SynthesizeRequest) error {
	if request.VoiceType == "" {
		return fmt.Errorf("voice_type is required")
	}
	if request.Text == "" {
		return fmt.Errorf("text is required")
	}
	if request.Encoding == "" {
		return fmt.Errorf("encoding is required")
	}
	if request.Encoding != "wav" && request.Encoding != "mp3" && request.Encoding != "ogg" {
		return fmt.Errorf("encoding is invalid")
	}
	if len([]rune(request.Text)) > s.cfg.TTS.MaxTextLength {
		return fmt.Errorf("text exceeds %d characters", s.cfg.TTS.MaxTextLength)
	}
	if len([]rune(request.ContextText)) > s.cfg.TTS.MaxContextLength {
		return fmt.Errorf("context_text exceeds %d characters", s.cfg.TTS.MaxContextLength)
	}
	return nil
}

func normalizeRequest(request SynthesizeRequest) SynthesizeRequest {
	request.AccessToken = strings.TrimSpace(request.AccessToken)
	request.AppID = strings.TrimSpace(request.AppID)
	request.ContextText = strings.TrimSpace(request.ContextText)
	request.Encoding = strings.TrimSpace(strings.ToLower(request.Encoding))
	request.Endpoint = strings.TrimSpace(request.Endpoint)
	request.ResourceID = strings.TrimSpace(request.ResourceID)
	request.Text = strings.TrimSpace(request.Text)
	request.VoiceType = strings.TrimSpace(request.VoiceType)
	return request
}

func buildOutputFileName(voiceType string, encoding string) string {
	safeVoiceType := voiceType
	safeVoiceType = strings.Map(func(r rune) rune {
		switch {
		case r >= 'a' && r <= 'z':
			return r
		case r >= 'A' && r <= 'Z':
			return r
		case r >= '0' && r <= '9':
			return r
		case r == '_' || r == '-':
			return r
		default:
			return '_'
		}
	}, safeVoiceType)

	timestamp := time.Now().UTC().Format("2006-01-02T15-04-05Z")
	return fmt.Sprintf("%s_%s_%s.%s", timestamp, safeVoiceType, uuid.NewString(), encoding)
}
