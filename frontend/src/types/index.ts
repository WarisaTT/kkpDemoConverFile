export type NavTab = 
  | 'dashboard'
  | 'new-process'
  | 'ai-mapping'
  | 'multiple-sources'
  | 'templates'
  | 'history'
  | 'audit-log'
  | 'settings';

export interface FieldMapping {
  id: string;
  process_id: string;
  source_field: string;
  source_sample: string;
  source_data_type: string;
  target_field: string;
  target_data_type: string;
  target_required: boolean;
  target_format?: string;
  confidence: number; // 0 to 1
  confidence_level: 'High' | 'Medium' | 'Low' | 'Unmatched';
  status: 'SUGGESTED' | 'ACCEPTED' | 'MODIFIED' | 'REJECTED' | 'UNMATCHED';
  reasons: string[];
  approved_by?: string;
  approved_at?: string;
  is_learned?: boolean;
}

export interface TransformationPreview {
  source_value: string;
  target_value: string;
  transformation: string;
}

export interface ValidationErrorDetail {
  row: number;
  field: string;
  source_value: string;
  expected_format: string;
  ai_transformation: string;
  status: 'Fixed' | 'Warning' | 'Error';
}

export interface ValidationCategoryResult {
  name: string;
  passed: boolean;
  detail: string;
}

export interface ValidationSummary {
  total_records: number;
  valid_count: number;
  warning_count: number;
  error_count: number;
  categories: ValidationCategoryResult[];
  details: ValidationErrorDetail[];
}

export interface Process {
  id: string;
  file_name: string;
  file_size: string;
  sheet_count: number;
  sheets?: string[];
  row_count: number;
  column_count: number;
  target_template_id: string;
  target_template: string;
  current_step?: number;
  step_name?: string;
  status: string;
  overall_confidence: number;
  created_at: string;
  analysis_progress: number;
  analysis_summary?: {
    header_detected?: boolean;
    data_type_detected?: boolean;
    date_format_detected?: boolean;
    currency_detected?: string;
    potential_duplicates?: number;
    missing_values?: number;
  };
  suggested_new_template?: boolean;
  suggested_template_details?: TargetTemplate;
  mappings: FieldMapping[];
  previews: TransformationPreview[];
  extractedRecords?: any[];
  sheetDataMap?: Record<string, { headers: string[]; rows: any[]; mappings: FieldMapping[] }>;
  validation?: ValidationSummary;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  file: string;
  mapping: string;
  status: string;
}

export interface TargetField {
  id: string;
  name: string;
  data_type: string;
  required: boolean;
  format?: string;
  description: string;
}

export interface TargetTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  field_count: number;
  status: string;
  updated_at: string;
  fields: TargetField[];
}

export interface SystemStats {
  files_processed: number;
  fields_auto_mapped: number;
  ai_match_accuracy: number;
  manual_review_rate: number;
  time_saved_percent: number;
}

export interface AILearnedRule {
  id: string;
  column_set_pattern: string;
  source_field: string;
  target_field: string;
  user_reasoning: string;
  learned_at: string;
  is_active: boolean;
  remember_forever: boolean;
}
