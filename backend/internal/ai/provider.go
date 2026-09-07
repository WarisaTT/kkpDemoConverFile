package ai

import (
	"context"
	"github.com/kkp/ai-data-transformation/internal/model"
)

// AIProvider defines the contract for semantic schema analysis and field mapping.
// Implementations can be MockAIProvider (100% free), OpenAIProvider, OllamaProvider, etc.
type AIProvider interface {
	// AnalyzeSchema analyzes raw column headers & sample data types
	AnalyzeSchema(ctx context.Context, fields []model.SourceField) (map[string]interface{}, error)
	
	// MatchFields maps source fields to target schema fields using semantic understanding
	MatchFields(ctx context.Context, processID string, sourceFields []model.SourceField, targetTemplate model.TargetTemplate) ([]model.FieldMapping, error)

	// ExplainMapping generates natural language reasoning for a specific field pair
	ExplainMapping(ctx context.Context, sourceField, targetField, sampleVal string) ([]string, float64, string, error)
}
