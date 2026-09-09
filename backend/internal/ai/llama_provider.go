package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kkp/ai-data-transformation/internal/model"
)

type LlamaProvider struct {
	APIKey  string
	BaseURL string
	Model   string
	client  *http.Client
	mock    *MockAIProvider
}

func NewLlamaProvider(apiKey, baseURL, modelName string) *LlamaProvider {
	if baseURL == "" {
		baseURL = "https://api.groq.com/openai/v1"
	}
	if modelName == "" {
		modelName = "llama-3.3-70b-versatile"
	}
	return &LlamaProvider{
		APIKey:  apiKey,
		BaseURL: strings.TrimRight(baseURL, "/"),
		Model:   modelName,
		client:  &http.Client{Timeout: 30 * time.Second},
		mock:    NewMockAIProvider(),
	}
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatRequest struct {
	Model       string        `json:"model"`
	Messages    []chatMessage `json:"messages"`
	Temperature float64       `json:"temperature"`
}

type chatChoice struct {
	Message chatMessage `json:"message"`
}

type chatResponse struct {
	Choices []chatChoice `json:"choices"`
}

func (l *LlamaProvider) AnalyzeSchema(ctx context.Context, fields []model.SourceField) (map[string]interface{}, error) {
	return l.mock.AnalyzeSchema(ctx, fields)
}

func (l *LlamaProvider) MatchFields(ctx context.Context, processID string, sourceFields []model.SourceField, targetTemplate model.TargetTemplate) ([]model.FieldMapping, error) {
	if strings.TrimSpace(l.APIKey) == "" {
		// Fallback to Mock AI if API key is blank
		return l.mock.MatchFields(ctx, processID, sourceFields, targetTemplate)
	}

	prompt := fmt.Sprintf(`You are an expert financial AI data transformation system for KKP Bank.
Analyze the following source fields and match each to the best target field in the target schema.

CRITICAL FINANCIAL AUDIT RULES:
1. Exact or unambiguous matches: confidence 0.85 - 0.98.
2. Generic or ambiguous terms (e.g. 'Date', 'Fund', 'Price', 'Total', 'Code', 'No', or vague abbreviations): confidence MUST BE LESS THAN 0.60 (e.g. 0.48 - 0.58).
3. Completely unrelated or unmatched fields: target_field "UNMATCHED", confidence 0.0.

Target Fields available:
%v

Source Fields to match:
%v

Respond strictly in JSON format as an array of objects:
[
  {
    "source_field": "field_name",
    "target_field": "TARGET_NAME",
    "confidence": 0.95,
    "reasons": ["เหตุผลภาษาไทยข้อ 1", "เหตุผลภาษาไทยข้อ 2"]
  }
]`, formatTargetFields(targetTemplate), formatSourceFields(sourceFields))

	reqBody := chatRequest{
		Model: l.Model,
		Messages: []chatMessage{
			{Role: "system", Content: "You are a specialized banking financial field mapping AI. Output valid JSON array only."},
			{Role: "user", Content: prompt},
		},
		Temperature: 0.1,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return l.mock.MatchFields(ctx, processID, sourceFields, targetTemplate)
	}

	url := fmt.Sprintf("%s/chat/completions", l.BaseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return l.mock.MatchFields(ctx, processID, sourceFields, targetTemplate)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", l.APIKey))

	resp, err := l.client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		// Fall back to Mock AI Provider if network or API error occurs
		return l.mock.MatchFields(ctx, processID, sourceFields, targetTemplate)
	}
	defer resp.Body.Close()

	var chatResp chatResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil || len(chatResp.Choices) == 0 {
		return l.mock.MatchFields(ctx, processID, sourceFields, targetTemplate)
	}

	content := chatResp.Choices[0].Message.Content
	// Extract JSON array string
	jsonStart := strings.Index(content, "[")
	jsonEnd := strings.LastIndex(content, "]")
	if jsonStart == -1 || jsonEnd == -1 {
		return l.mock.MatchFields(ctx, processID, sourceFields, targetTemplate)
	}
	jsonStr := content[jsonStart : jsonEnd+1]

	type llamaResult struct {
		SourceField string   `json:"source_field"`
		TargetField string   `json:"target_field"`
		Confidence  float64  `json:"confidence"`
		Reasons     []string `json:"reasons"`
	}

	var results []llamaResult
	if err := json.Unmarshal([]byte(jsonStr), &results); err != nil {
		return l.mock.MatchFields(ctx, processID, sourceFields, targetTemplate)
	}

	var mappings []model.FieldMapping
	resultMap := make(map[string]llamaResult)
	for _, r := range results {
		resultMap[strings.ToLower(r.SourceField)] = r
	}

	for _, sf := range sourceFields {
		res, found := resultMap[strings.ToLower(sf.Name)]
		targetField := "UNMATCHED"
		confidence := 0.50
		reasons := []string{"Llama AI วิเคราะห์โครงสร้างฟิลด์ข้อมูล"}

		if found {
			targetField = res.TargetField
			confidence = res.Confidence
			if len(res.Reasons) > 0 {
				reasons = res.Reasons
			}
		}

		confLevel := "High"
		if confidence >= 0.90 {
			confLevel = "High"
		} else if confidence >= 0.70 {
			confLevel = "Medium"
		} else if confidence > 0.0 {
			confLevel = "Low"
		} else {
			confLevel = "Unmatched"
		}

		mappings = append(mappings, model.FieldMapping{
			ID:              uuid.New().String(),
			ProcessID:       processID,
			SourceField:     sf.Name,
			SourceSample:    sf.SampleVal,
			SourceDataType:  sf.DataType,
			TargetField:     targetField,
			TargetDataType:  "String",
			Confidence:      confidence,
			ConfidenceLevel: confLevel,
			Status:          "SUGGESTED",
			Reasons:         reasons,
		})
	}

	return mappings, nil
}

func (l *LlamaProvider) ExplainMapping(ctx context.Context, sourceField, targetField, sampleVal string) ([]string, float64, string, error) {
	return l.mock.ExplainMapping(ctx, sourceField, targetField, sampleVal)
}

func formatTargetFields(t model.TargetTemplate) string {
	var list []string
	for _, f := range t.Fields {
		list = append(list, fmt.Sprintf("- %s (%s, %s)", f.Name, f.DataType, f.Description))
	}
	return strings.Join(list, "\n")
}

func formatSourceFields(fields []model.SourceField) string {
	var list []string
	for _, f := range fields {
		list = append(list, fmt.Sprintf("- %s (Sample: %s, Type: %s)", f.Name, f.SampleVal, f.DataType))
	}
	return strings.Join(list, "\n")
}
