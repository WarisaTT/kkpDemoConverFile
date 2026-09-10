package model

import "time"

// SourceField represents a field extracted from an incoming source file.
type SourceField struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	DataType  string   `json:"data_type"`
	SampleVal string   `json:"sample_value"`
	Values    []string `json:"values,omitempty"`
}

// TargetField represents a field in the KKP standard schema.
type TargetField struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	DataType    string `json:"data_type"`
	Required    bool   `json:"required"`
	Format      string `json:"format,omitempty"`
	Description string `json:"description"`
}

// TargetTemplate defines standard output specs like KKP_CUSTODIAN_TRADE_V2.
type TargetTemplate struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Version     string        `json:"version"`
	FieldCount  int           `json:"field_count"`
	Status      string        `json:"status"`
	UpdatedAt   string        `json:"updated_at"`
	Fields      []TargetField `json:"fields"`
}

// FieldMapping links a SourceField to a TargetField with AI confidence.
type FieldMapping struct {
	ID              string     `json:"id"`
	ProcessID       string     `json:"process_id"`
	SourceField     string     `json:"source_field"`
	SourceSample    string     `json:"source_sample"`
	SourceDataType  string     `json:"source_data_type"`
	TargetField     string     `json:"target_field"`
	TargetDataType  string     `json:"target_data_type"`
	TargetRequired  bool       `json:"target_required"`
	TargetFormat    string     `json:"target_format,omitempty"`
	Confidence      float64    `json:"confidence"` // 0.0 - 1.0
	ConfidenceLevel string     `json:"confidence_level"` // High, Medium, Low, Unmatched
	Status          string     `json:"status"` // SUGGESTED, ACCEPTED, MODIFIED, REJECTED, UNMATCHED
	Reasons         []string   `json:"reasons"`
	ApprovedBy      string     `json:"approved_by,omitempty"`
	ApprovedAt      *time.Time `json:"approved_at,omitempty"`
}

// TransformationPreview represents before/after sample transformation.
type TransformationPreview struct {
	SourceValue    string `json:"source_value"`
	TargetValue    string `json:"target_value"`
	Transformation string `json:"transformation"`
}

// ValidationCategoryResult summarizes validation status.
type ValidationCategoryResult struct {
	Name   string `json:"name"`
	Passed bool   `json:"passed"`
	Detail string `json:"detail"`
}

// ValidationErrorDetail provides row-level validation warnings/errors.
type ValidationErrorDetail struct {
	Row              int    `json:"row"`
	Field            string `json:"field"`
	SourceValue      string `json:"source_value"`
	ExpectedFormat   string `json:"expected_format"`
	AITransformation string `json:"ai_transformation"`
	Status           string `json:"status"` // Fixed, Warning, Error
}

// ValidationSummary contains count metrics.
type ValidationSummary struct {
	TotalRecords int                        `json:"total_records"`
	ValidCount   int                        `json:"valid_count"`
	WarningCount int                        `json:"warning_count"`
	ErrorCount   int                        `json:"error_count"`
	Categories   []ValidationCategoryResult `json:"categories"`
	Details      []ValidationErrorDetail    `json:"details"`
}

// FormPair represents a key-value pair extracted from document forms (PDF, Email, etc.)
type FormPair struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

// SheetData holds per-sheet extracted data: headers, rows, mappings, and optional form pairs.
type SheetData struct {
	Headers        []string                 `json:"headers"`
	Rows           []map[string]interface{} `json:"rows"`
	Mappings       []FieldMapping           `json:"mappings"`
	IsKeyValueForm bool                     `json:"isKeyValueForm,omitempty"`
	RawFormPairs   []FormPair               `json:"rawFormPairs,omitempty"`
}

// Process represents a data transformation execution session.
type Process struct {
	RawFileBytes      []byte                  `json:"-"`
	ID                string                  `json:"id"`
	FileName          string                  `json:"file_name"`
	FileSize          string                  `json:"file_size"`
	SheetCount        int                     `json:"sheet_count"`
	Sheets            []string                `json:"sheets,omitempty"`
	RowCount          int                     `json:"row_count"`
	ColumnCount       int                     `json:"column_count"`
	TargetTemplateID  string                  `json:"target_template_id"`
	TargetTemplate    string                  `json:"target_template"`
	CurrentStep       int                     `json:"current_step"`
	StepName          string                  `json:"step_name"`
	Status            string                  `json:"status"` // Uploaded, Analyzed, Mapped, Validated, Completed
	OverallConfidence        float64                 `json:"overall_confidence"`
	InitialOverallConfidence float64                 `json:"initial_overall_confidence"`
	CreatedAt                time.Time               `json:"created_at"`
	AnalysisProgress  int                     `json:"analysis_progress"`
	AnalysisSummary   map[string]interface{} `json:"analysis_summary"`
	SuggestedNewTemplate     bool            `json:"suggested_new_template"`
	SuggestedTemplateDetails *TargetTemplate `json:"suggested_template_details,omitempty"`
	Mappings          []FieldMapping          `json:"mappings"`
	ExtractedRecords  []map[string]interface{} `json:"extractedRecords,omitempty"`
	SheetDataMap      map[string]*SheetData    `json:"sheetDataMap,omitempty"`
	Previews          []TransformationPreview `json:"previews"`
	Validation        *ValidationSummary      `json:"validation,omitempty"`
}

// AuditLog records historical actions for enterprise banking compliance.
type AuditLog struct {
	ID        string `json:"id"`
	Timestamp string `json:"timestamp"`
	User      string `json:"user"`
	Action    string `json:"action"`
	Category  string `json:"category,omitempty"`
	File      string `json:"file"`
	Mapping   string `json:"mapping"`
	Status    string `json:"status"`
	Details   string `json:"details,omitempty"`
	IPAddress string `json:"ip_address,omitempty"`
	Checksum  string `json:"checksum,omitempty"`
}

// SystemStats contains high-level KPIs for executive dashboard.
type SystemStats struct {
	FilesProcessed   int     `json:"files_processed"`
	FieldsAutoMapped int     `json:"fields_auto_mapped"`
	AIMatchAccuracy  float64 `json:"ai_match_accuracy"`
	ManualReviewRate float64 `json:"manual_review_rate"`
	TimeSavedPercent int     `json:"time_saved_percent"`
}
