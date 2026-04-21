package translation

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"my-first-expo-app/backend/internal/config"
)

const openAIResponsesEndpoint = "https://api.openai.com/v1/responses"

type Service struct {
	client *http.Client
	cfg    config.OpenAIConfig
}

type TranslateRequest struct {
	SourceText      string `json:"sourceText"`
	SourceLanguage  string `json:"sourceLanguage"`
	TargetLanguage  string `json:"targetLanguage"`
	Scene           string `json:"scene"`
	Tone            string `json:"tone"`
	PreserveFormat  bool   `json:"preserveFormat"`
	Bilingual       bool   `json:"bilingual"`
	PrioritizeTerms bool   `json:"prioritizeTerms"`
}

type TranslateResponse struct {
	DetectedLanguage string               `json:"detectedLanguage"`
	TargetLanguage   string               `json:"targetLanguage"`
	Summary          string               `json:"summary"`
	Versions         []TranslationVersion `json:"versions"`
	Explanation      Explanation          `json:"explanation"`
	Model            string               `json:"model"`
}

type TranslationVersion struct {
	ID      string `json:"id"`
	Label   string `json:"label"`
	Summary string `json:"summary"`
	Text    string `json:"text"`
}

type Explanation struct {
	Rationale    []string       `json:"rationale"`
	Alternatives []string       `json:"alternatives"`
	Terminology  []GlossaryItem `json:"terminology"`
}

type GlossaryItem struct {
	Source string `json:"source"`
	Target string `json:"target"`
	Reason string `json:"reason"`
}

type openAIResponsePayload struct {
	Output []struct {
		Content []struct {
			Text string `json:"text"`
			Type string `json:"type"`
		} `json:"content"`
	} `json:"output"`
}

func NewService(cfg config.OpenAIConfig) *Service {
	return &Service{
		cfg: cfg,
		client: &http.Client{
			Timeout: cfg.RequestTimeout,
		},
	}
}

func (s *Service) Translate(ctx context.Context, request TranslateRequest) (TranslateResponse, error) {
	request = normalizeRequest(request)

	if err := s.validateRequest(request); err != nil {
		return TranslateResponse{}, err
	}

	openAIRequestBody := s.buildOpenAIRequest(request)
	bodyBytes, err := json.Marshal(openAIRequestBody)
	if err != nil {
		return TranslateResponse{}, fmt.Errorf("marshal openai request failed: %w", err)
	}

	httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, openAIResponsesEndpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return TranslateResponse{}, fmt.Errorf("build openai request failed: %w", err)
	}

	httpRequest.Header.Set("Authorization", "Bearer "+s.cfg.APIKey)
	httpRequest.Header.Set("Content-Type", "application/json")

	httpResponse, err := s.client.Do(httpRequest)
	if err != nil {
		return TranslateResponse{}, fmt.Errorf("request openai failed: %w", err)
	}
	defer httpResponse.Body.Close()

	if httpResponse.StatusCode >= 400 {
		var errorBody map[string]any
		_ = json.NewDecoder(httpResponse.Body).Decode(&errorBody)
		return TranslateResponse{}, fmt.Errorf(
			"openai request failed with status %d: %s",
			httpResponse.StatusCode,
			extractOpenAIErrorMessage(errorBody),
		)
	}

	var payload openAIResponsePayload
	if err := json.NewDecoder(httpResponse.Body).Decode(&payload); err != nil {
		return TranslateResponse{}, fmt.Errorf("decode openai response failed: %w", err)
	}

	rawText := extractOutputText(payload)
	if rawText == "" {
		return TranslateResponse{}, fmt.Errorf("openai returned empty translation payload")
	}

	var translated TranslateResponse
	if err := json.Unmarshal([]byte(rawText), &translated); err != nil {
		return TranslateResponse{}, fmt.Errorf("parse translation json failed: %w", err)
	}

	translated.Model = s.cfg.Model
	return translated, nil
}

func (s *Service) buildOpenAIRequest(request TranslateRequest) map[string]any {
	return map[string]any{
		"model": s.cfg.Model,
		"reasoning": map[string]any{
			"effort": s.cfg.ReasoningEffort,
		},
		"input": []map[string]any{
			{
				"role":    "developer",
				"content": buildDeveloperPrompt(),
			},
			{
				"role":    "user",
				"content": buildUserPrompt(request),
			},
		},
		"text": map[string]any{
			"format": map[string]any{
				"type":   "json_schema",
				"name":   "translation_response",
				"strict": true,
				"schema": translationJSONSchema(),
			},
		},
	}
}

func (s *Service) validateRequest(request TranslateRequest) error {
	if request.SourceText == "" {
		return fmt.Errorf("sourceText is required")
	}

	if len([]rune(request.SourceText)) > s.cfg.MaxTextLength {
		return fmt.Errorf("sourceText exceeds %d characters", s.cfg.MaxTextLength)
	}

	if request.TargetLanguage == "" || request.TargetLanguage == "auto" {
		return fmt.Errorf("targetLanguage is required")
	}

	return nil
}

func normalizeRequest(request TranslateRequest) TranslateRequest {
	request.SourceText = strings.TrimSpace(request.SourceText)
	request.SourceLanguage = strings.TrimSpace(strings.ToLower(request.SourceLanguage))
	request.TargetLanguage = strings.TrimSpace(strings.ToLower(request.TargetLanguage))
	request.Scene = strings.TrimSpace(strings.ToLower(request.Scene))
	request.Tone = strings.TrimSpace(strings.ToLower(request.Tone))
	return request
}

func buildDeveloperPrompt() string {
	return strings.Join([]string{
		"You are an expert translation engine.",
		"Always translate the full source text, never partially translate or leave mixed-language fragments unless the source intentionally contains fixed product names or API identifiers.",
		"Respect the requested scene and tone.",
		"When preserveFormat is true, keep line breaks, numbering, and list structure.",
		"When bilingual is true, still return only translated text in each version; the frontend handles parallel display.",
		"When prioritizeTerms is true, keep terminology consistent across all versions.",
		"Return only JSON that matches the provided schema.",
	}, " ")
}

func buildUserPrompt(request TranslateRequest) string {
	payload := map[string]any{
		"sourceText":      request.SourceText,
		"sourceLanguage":  request.SourceLanguage,
		"targetLanguage":  request.TargetLanguage,
		"scene":           request.Scene,
		"tone":            request.Tone,
		"preserveFormat":  request.PreserveFormat,
		"bilingual":       request.Bilingual,
		"prioritizeTerms": request.PrioritizeTerms,
	}

	body, _ := json.Marshal(payload)
	return string(body)
}

func translationJSONSchema() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"detectedLanguage": map[string]any{"type": "string"},
			"targetLanguage":   map[string]any{"type": "string"},
			"summary":          map[string]any{"type": "string"},
			"versions": map[string]any{
				"type": "array",
				"items": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"id":      map[string]any{"type": "string"},
						"label":   map[string]any{"type": "string"},
						"summary": map[string]any{"type": "string"},
						"text":    map[string]any{"type": "string"},
					},
					"required":             []string{"id", "label", "summary", "text"},
					"additionalProperties": false,
				},
				"minItems": 3,
			},
			"explanation": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"rationale": map[string]any{
						"type":  "array",
						"items": map[string]any{"type": "string"},
					},
					"alternatives": map[string]any{
						"type":  "array",
						"items": map[string]any{"type": "string"},
					},
					"terminology": map[string]any{
						"type": "array",
						"items": map[string]any{
							"type": "object",
							"properties": map[string]any{
								"source": map[string]any{"type": "string"},
								"target": map[string]any{"type": "string"},
								"reason": map[string]any{"type": "string"},
							},
							"required":             []string{"source", "target", "reason"},
							"additionalProperties": false,
						},
					},
				},
				"required":             []string{"rationale", "alternatives", "terminology"},
				"additionalProperties": false,
			},
		},
		"required":             []string{"detectedLanguage", "targetLanguage", "summary", "versions", "explanation"},
		"additionalProperties": false,
	}
}

func extractOutputText(payload openAIResponsePayload) string {
	for _, item := range payload.Output {
		for _, content := range item.Content {
			if content.Type == "output_text" && strings.TrimSpace(content.Text) != "" {
				return content.Text
			}
		}
	}

	return ""
}

func extractOpenAIErrorMessage(payload map[string]any) string {
	errorValue, ok := payload["error"].(map[string]any)
	if !ok {
		return "unknown_error"
	}

	message, ok := errorValue["message"].(string)
	if !ok || strings.TrimSpace(message) == "" {
		return "unknown_error"
	}

	return message
}
