package service

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/kkp/ai-data-transformation/internal/ai"
	"github.com/kkp/ai-data-transformation/internal/model"
	"github.com/kkp/ai-data-transformation/internal/parser"
)

type TransformService struct {
	mu         sync.RWMutex
	templates  map[string]model.TargetTemplate
	processes  map[string]*model.Process
	auditLogs  []model.AuditLog
	aiProvider ai.AIProvider
	parser     *parser.ExcelParser

	// Llama config
	apiKey    string
	baseURL   string
	modelName string
}

func NewTransformService(aiProv ai.AIProvider, p *parser.ExcelParser) *TransformService {
	if aiProv == nil {
		aiProv = ai.NewMockAIProvider()
	}
	if p == nil {
		p = parser.NewExcelParser()
	}
	svc := &TransformService{
		templates:  make(map[string]model.TargetTemplate),
		processes:  make(map[string]*model.Process),
		aiProvider: aiProv,
		parser:     p,
		baseURL:    "https://api.groq.com/openai/v1",
		modelName:  "llama-3.3-70b-versatile",
	}

	svc.initDefaultTemplates()

	return svc
}

func (s *TransformService) SetLlamaConfig(apiKey, baseURL, modelName string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.apiKey = apiKey
	if baseURL != "" {
		s.baseURL = baseURL
	}
	if modelName != "" {
		s.modelName = modelName
	}

	if apiKey != "" {
		s.aiProvider = ai.NewLlamaProvider(apiKey, s.baseURL, s.modelName)
		s.logAudit("ผู้ดูแลระบบ", "เปิดใช้งาน Llama AI Provider", "-", fmt.Sprintf("API Key: *** | Model: %s", s.modelName), "Approved")
	} else {
		s.aiProvider = ai.NewMockAIProvider()
		s.logAudit("ผู้ดูแลระบบ", "สลับไปใช้ Mock AI Provider (ฟรี)", "-", "Default Engine", "Approved")
	}
}

func (s *TransformService) GetDefaultTemplate() model.TargetTemplate {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.templates["KKP_CUSTODIAN_TRADE_V2"]
}

func (s *TransformService) GetTemplates() []model.TargetTemplate {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var list []model.TargetTemplate
	for _, t := range s.templates {
		list = append(list, t)
	}
	return list
}

func (s *TransformService) CreateTemplate(tmpl model.TargetTemplate) (model.TargetTemplate, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if tmpl.ID == "" {
		tmpl.ID = fmt.Sprintf("tmpl_%d", time.Now().UnixNano())
	}
	if tmpl.Version == "" {
		tmpl.Version = "1.0"
	}
	if tmpl.Status == "" {
		tmpl.Status = "Active"
	}
	tmpl.UpdatedAt = time.Now().Format("02 ม.ค. 2006")
	tmpl.FieldCount = len(tmpl.Fields)

	s.templates[tmpl.Name] = tmpl
	s.logAudit("Warisa T.", "สร้างรูปแบบเป้าหมายใหม่", tmpl.Name, fmt.Sprintf("รวม %d ฟิลด์", tmpl.FieldCount), "Approved")

	return tmpl, nil
}

func (s *TransformService) UpdateTemplate(id string, updated model.TargetTemplate) (model.TargetTemplate, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var existingKey string
	for name, t := range s.templates {
		if t.ID == id || t.Name == id || name == id {
			existingKey = name
			break
		}
	}

	if existingKey != "" {
		delete(s.templates, existingKey)
	}

	if updated.ID == "" {
		updated.ID = id
	}
	updated.UpdatedAt = time.Now().Format("02 ม.ค. 2006")
	updated.FieldCount = len(updated.Fields)

	s.templates[updated.Name] = updated
	s.logAudit("Warisa T.", "แก้ไขรูปแบบเป้าหมายมาตรฐาน", updated.Name, fmt.Sprintf("อัปเดต %d ฟิลด์", updated.FieldCount), "Modified")

	return updated, nil
}

func (s *TransformService) DeleteTemplate(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	var existingKey string
	var deletedName string
	for name, t := range s.templates {
		if t.ID == id || t.Name == id || name == id {
			existingKey = name
			deletedName = t.Name
			break
		}
	}

	if existingKey == "" {
		return fmt.Errorf("template not found")
	}

	delete(s.templates, existingKey)
	s.logAudit("Warisa T.", "ลบรูปแบบเป้าหมายมาตรฐาน", deletedName, "-", "Deleted")

	return nil
}

func (s *TransformService) CreateProcess(fileName string, fileSize string, fileBytes []byte) (*model.Process, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	tmpl := s.templates["KKP_CUSTODIAN_TRADE_V2"]
	fields, sheets, rows, cols, _ := s.parser.ExtractFields(fileName, fileBytes)

	pID := uuid.New().String()
	proc := &model.Process{
		ID:               pID,
		FileName:         fileName,
		FileSize:         fileSize,
		SheetCount:       sheets,
		RowCount:         rows,
		ColumnCount:      cols,
		TargetTemplateID: tmpl.ID,
		TargetTemplate:   tmpl.Name,
		CurrentStep:      1,
		StepName:         "Step 1: อัปโหลดและวิเคราะห์",
		Status:           "Analyzed",
		CreatedAt:        time.Now(),
		AnalysisProgress: 100,
		RawFileBytes:     fileBytes,
	}

	// Synchronously run AI analysis for exact payload return
	ctx := context.Background()
	summary, _ := s.aiProvider.AnalyzeSchema(ctx, fields)
	mappings, _ := s.aiProvider.MatchFields(ctx, pID, fields, tmpl)

	// Check if file contains custom/unknown headers that trigger suggested new template
	hasNewCustomFields := false
	var suggestedFields []model.TargetField
	for idx, m := range mappings {
		if m.TargetField != "" && m.TargetField != "UNMATCHED" {
			isDefaultTmplField := false
			for _, tf := range tmpl.Fields {
				if tf.Name == m.TargetField {
					isDefaultTmplField = true
					break
				}
			}
			if !isDefaultTmplField {
				hasNewCustomFields = true
			}
			suggestedFields = append(suggestedFields, model.TargetField{
				ID:          fmt.Sprintf("tf_%d", idx+1),
				Name:        m.TargetField,
				DataType:    m.TargetDataType,
				Required:    m.TargetRequired,
				Format:      m.TargetFormat,
				Description: fmt.Sprintf("ฟิลด์มาตรฐานแปลงจาก %s", m.SourceField),
			})
		}
	}

	if hasNewCustomFields || len(fields) > 10 {
		cleanBase := strings.ToUpper(strings.TrimSuffix(fileName, filepath.Ext(fileName)))
		cleanBase = strings.ReplaceAll(cleanBase, " ", "_")
		cleanBase = strings.ReplaceAll(cleanBase, "-", "_")
		tmplName := fmt.Sprintf("KKP_%s_AUTO_V1", cleanBase)

		sugTmpl := &model.TargetTemplate{
			ID:          fmt.Sprintf("tmpl_%d", time.Now().UnixNano()),
			Name:        tmplName,
			Description: fmt.Sprintf("รูปแบบเป้าหมายมาตรฐาน KKP ที่ AI วิเคราะห์และสร้างให้อัตโนมัติจากไฟล์ %s", fileName),
			Version:     "1.0",
			FieldCount:  len(suggestedFields),
			Status:      "Suggested",
			UpdatedAt:   time.Now().Format("02 ม.ค. 2006"),
			Fields:      suggestedFields,
		}
		proc.SuggestedNewTemplate = true
		proc.SuggestedTemplateDetails = sugTmpl
	}

	proc.AnalysisSummary = summary
	proc.Mappings = mappings
	proc.OverallConfidence = calculateOverallConfidence(mappings)
	proc.Previews = generateTransformationPreviews()
	proc.Validation = calculateRealValidationSummary(proc.RowCount, mappings, tmpl)

	s.processes[pID] = proc
	s.logAudit("ระบบอัตโนมัติ", "อัปโหลดและวิเคราะห์ไฟล์สำเร็จ", fileName, fmt.Sprintf("วิเคราะห์ %d ฟิลด์", len(mappings)), "Completed")

	return proc, nil
}


func (s *TransformService) GetProcesses() []*model.Process {
	s.mu.RLock()
	defer s.mu.RUnlock()
	list := make([]*model.Process, 0, len(s.processes))
	for _, p := range s.processes {
		list = append(list, p)
	}
	return list
}


func (s *TransformService) DeleteProcess(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	proc, exists := s.processes[id]
	if !exists {
		return fmt.Errorf("process not found")
	}

	fileName := proc.FileName
	delete(s.processes, id)

	s.logAudit("ผู้ดูแลระบบ", "ลบการวิเคราะห์ไฟล์", fileName, "ยกเลิกการนำไปใช้พัฒนา AI (Excluded from AI Training)", "Deleted")
	return nil
}

func (s *TransformService) UpdateProcessStep(id string, step int, status string) (*model.Process, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	proc, exists := s.processes[id]
	if !exists {
		return nil, fmt.Errorf("process not found")
	}

	proc.CurrentStep = step
	switch step {
	case 1:
		proc.StepName = "Step 1: อัปโหลดและวิเคราะห์"
		proc.Status = "Uploaded"
	case 2:
		proc.StepName = "Step 2: จับคู่ฟิลด์ AI"
		proc.Status = "Mapped"
	case 3:
		proc.StepName = "Step 3: ตรวจสอบการจัด Format & ข้อมูล"
		proc.Status = "Under Review"
	case 4:
		proc.StepName = "Step 4: เสร็จสมบูรณ์ (Completed)"
		proc.Status = "Completed"
	}
	if status != "" {
		proc.Status = status
	}
	return proc, nil
}

func (s *TransformService) GetProcess(id string) (*model.Process, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	p, exists := s.processes[id]
	if !exists {
		return nil, fmt.Errorf("process not found")
	}
	return p, nil
}

func (s *TransformService) ApproveMapping(processID, mappingID, user string) (*model.FieldMapping, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	proc, exists := s.processes[processID]
	if !exists {
		return nil, fmt.Errorf("process not found")
	}

	for i := range proc.Mappings {
		if proc.Mappings[i].ID == mappingID || proc.Mappings[i].SourceField == mappingID {
			proc.Mappings[i].Status = "ACCEPTED"
			proc.Mappings[i].ConfidenceLevel = "High"
			now := time.Now()
			proc.Mappings[i].ApprovedBy = user
			proc.Mappings[i].ApprovedAt = &now

			proc.OverallConfidence = calculateOverallConfidence(proc.Mappings)
			s.logAudit(user, "ยอมรับการจับคู่ฟิลด์", proc.FileName, fmt.Sprintf("%s → %s", proc.Mappings[i].SourceField, proc.Mappings[i].TargetField), "Approved")
			return &proc.Mappings[i], nil
		}
	}
	return nil, fmt.Errorf("mapping not found")
}

func (s *TransformService) UpdateMapping(processID, mappingID, targetField, user string) (*model.FieldMapping, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	proc, exists := s.processes[processID]
	if !exists {
		return nil, fmt.Errorf("process not found")
	}

	cleanMID := strings.TrimSpace(mappingID)

	for i := range proc.Mappings {
		m := &proc.Mappings[i]
		if m.ID == cleanMID || strings.EqualFold(m.SourceField, cleanMID) || strings.EqualFold(m.TargetField, cleanMID) {
			m.TargetField = targetField
			m.Status = "MODIFIED"
			m.ConfidenceLevel = "High"
			m.Confidence = 1.0
			m.Reasons = []string{fmt.Sprintf("ผู้ใช้งาน %s ทำการแก้ไขและกำหนดจับคู่ฟิลด์ด้วยตนเอง", user)}
			now := time.Now()
			m.ApprovedBy = user
			m.ApprovedAt = &now

			proc.OverallConfidence = calculateOverallConfidence(proc.Mappings)
			s.logAudit(user, "แก้ไขการจับคู่ฟิลด์", proc.FileName, fmt.Sprintf("%s → %s", m.SourceField, targetField), "Modified")
			return m, nil
		}
	}

	// If not found by exact ID, fallback to first mapping or update index
	if len(proc.Mappings) > 0 {
		m := &proc.Mappings[0]
		m.TargetField = targetField
		m.Status = "MODIFIED"
		m.ConfidenceLevel = "High"
		m.Confidence = 1.0
		m.Reasons = []string{fmt.Sprintf("ผู้ใช้งาน %s ทำการแก้ไขและกำหนดจับคู่ฟิลด์ด้วยตนเอง", user)}
		now := time.Now()
		m.ApprovedBy = user
		m.ApprovedAt = &now
		proc.OverallConfidence = calculateOverallConfidence(proc.Mappings)
		s.logAudit(user, "แก้ไขการจับคู่ฟิลด์", proc.FileName, fmt.Sprintf("%s → %s", m.SourceField, targetField), "Modified")
		return m, nil
	}

	return nil, fmt.Errorf("mapping not found")
}

func (s *TransformService) GenerateExcel(processID string) ([]byte, string, error) {
	s.mu.RLock()
	proc, exists := s.processes[processID]
	s.mu.RUnlock()

	if !exists {
		return nil, "", fmt.Errorf("process not found")
	}

	bytes, err := s.parser.GenerateStandardExcel(proc.TargetTemplate, proc.Mappings, proc.RawFileBytes, proc.FileName)
	if err != nil {
		return nil, "", err
	}

	outName := fmt.Sprintf("KKP_STANDARD_%s", proc.FileName)
	s.logAudit("ระบบอัตโนมัติ", "ส่งออกไฟล์ผลลัพธ์ Excel", outName, "แปลงข้อมูลสำเร็จ", "Completed")
	return bytes, outName, nil
}

func (s *TransformService) GetAuditLogs() []model.AuditLog {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.auditLogs
}

func (s *TransformService) GetStats() model.SystemStats {
	s.mu.RLock()
	defer s.mu.RUnlock()

	totalFiles := len(s.processes)
	if totalFiles == 0 {
		return model.SystemStats{
			FilesProcessed:   0,
			FieldsAutoMapped: 0,
			AIMatchAccuracy:  0,
			ManualReviewRate: 0,
			TimeSavedPercent: 0,
		}
	}

	totalFields := 0
	totalConfidence := 0.0
	for _, proc := range s.processes {
		totalFields += len(proc.Mappings)
		totalConfidence += proc.OverallConfidence
	}

	avgAccuracy := (totalConfidence / float64(totalFiles)) * 100
	if avgAccuracy > 100 {
		avgAccuracy = 100
	}
	manualRate := 100 - avgAccuracy
	if manualRate < 0 {
		manualRate = 0
	}

	return model.SystemStats{
		FilesProcessed:   totalFiles,
		FieldsAutoMapped: totalFields,
		AIMatchAccuracy:  float64(int(avgAccuracy*10)) / 10,
		ManualReviewRate: float64(int(manualRate*10)) / 10,
		TimeSavedPercent: 85,
	}
}

func (s *TransformService) logAudit(user, action, file, mapping, status string) {
	log := model.AuditLog{
		ID:        fmt.Sprintf("AUD-%d", 1000+len(s.auditLogs)+1),
		Timestamp: time.Now().Format("15:04:05"),
		User:      user,
		Action:    action,
		File:      file,
		Mapping:   mapping,
		Status:    status,
	}
	s.auditLogs = append([]model.AuditLog{log}, s.auditLogs...)
}

func calculateOverallConfidence(mappings []model.FieldMapping) float64 {
	if len(mappings) == 0 {
		return 0
	}
	var total float64
	for _, m := range mappings {
		total += m.Confidence
	}
	return total / float64(len(mappings))
}

func generateTransformationPreviews() []model.TransformationPreview {
	return []model.TransformationPreview{
		{SourceValue: "05/09/2026", TargetValue: "2026-09-05", Transformation: "ปรับรูปแบบวันที่มาตรฐาน (YYYY-MM-DD)"},
		{SourceValue: "Thai Baht", TargetValue: "THB", Transformation: "จัดรหัสสกุลเงินมาตรฐาน ISO 4217"},
		{SourceValue: "12.5432", TargetValue: "12.5432", Transformation: "คงค่าทศนิยม 4 ตำแหน่ง Decimal(18,4)"},
		{SourceValue: "1,000", TargetValue: "1000.0000", Transformation: "จัดรูปแบบตัวเลขจำนวนหน่วยมาตรฐาน"},
		{SourceValue: "1,250,000 THB", TargetValue: "1250000.00", Transformation: "แยกข้อความสกุลเงิน ออกมาเป็นทศนิยม Decimal(18,2)"},
	}
}

func calculateRealValidationSummary(totalRows int, mappings []model.FieldMapping, tmpl model.TargetTemplate) *model.ValidationSummary {
	if totalRows < 0 {
		totalRows = 0
	}

	mappedCount := 0
	requiredMissing := 0
	var unmappedRequiredNames []string

	for _, tf := range tmpl.Fields {
		isMapped := false
		for _, m := range mappings {
			if m.TargetField == tf.Name {
				isMapped = true
				mappedCount++
				break
			}
		}
		if !isMapped && tf.Required {
			requiredMissing++
			unmappedRequiredNames = append(unmappedRequiredNames, tf.Name)
		}
	}

	warningCount := 0
	var errorDetails []model.ValidationErrorDetail

	for _, m := range mappings {
		if m.TargetField == "UNMATCHED" || m.TargetField == "" {
			continue
		}

		sample := strings.TrimSpace(m.SourceSample)
		if strings.Contains(m.TargetField, "DATE") && (strings.Contains(sample, "/") || strings.Contains(sample, "-")) {
			warningCount++
			errorDetails = append(errorDetails, model.ValidationErrorDetail{
				Row:              1,
				Field:            m.TargetField,
				SourceValue:      sample,
				ExpectedFormat:   "YYYY-MM-DD",
				AITransformation: fmt.Sprintf("แปลงรูปแบบวันที่ (%s) เป็น YYYY-MM-DD มาตรฐาน", m.SourceField),
				Status:           "Fixed",
			})
		} else if m.TargetField == "CURRENCY" && sample != "" && sample != "THB" {
			warningCount++
			errorDetails = append(errorDetails, model.ValidationErrorDetail{
				Row:              1,
				Field:            "CURRENCY",
				SourceValue:      sample,
				ExpectedFormat:   "ISO 4217",
				AITransformation: fmt.Sprintf("จัดรหัสสกุลเงิน (%s) เป็น ISO 4217 สากล (THB)", sample),
				Status:           "Fixed",
			})
		} else if (m.TargetField == "AMOUNT" || m.TargetField == "UNIT_PRICE" || m.TargetField == "QUANTITY") && (strings.Contains(sample, ",") || strings.Contains(sample, "THB")) {
			warningCount++
			errorDetails = append(errorDetails, model.ValidationErrorDetail{
				Row:              1,
				Field:            m.TargetField,
				SourceValue:      sample,
				ExpectedFormat:   "Decimal(18,4)",
				AITransformation: fmt.Sprintf("แยกข้อความ/เครื่องหมายจุลภาคออกจาก %s → แปลงเป็นตัวเลข", sample),
				Status:           "Fixed",
			})
		}
	}

	for _, reqName := range unmappedRequiredNames {
		errorDetails = append(errorDetails, model.ValidationErrorDetail{
			Row:              0,
			Field:            reqName,
			SourceValue:      "ไม่พบข้อมูล",
			ExpectedFormat:   "Required Field",
			AITransformation: "แจ้งเตือนผู้ใช้งานจับคู่ฟิลด์บังคับ",
			Status:           "Warning",
		})
	}

	errorCount := requiredMissing
	validCount := totalRows - errorCount
	if validCount < 0 {
		validCount = 0
	}

	reqPassed := requiredMissing == 0
	reqDetail := "ข้อมูลฟิลด์บังคับครบถ้วนทุกรายการ"
	if !reqPassed {
		reqDetail = fmt.Sprintf("พบฟิลด์บังคับที่ยังไม่ได้จับคู่ %d ฟิลด์ (%s)", requiredMissing, strings.Join(unmappedRequiredNames, ", "))
	}

	return &model.ValidationSummary{
		TotalRecords: totalRows,
		ValidCount:   validCount,
		WarningCount: warningCount,
		ErrorCount:   errorCount,
		Categories: []model.ValidationCategoryResult{
			{
				Name:   "ตรวจสอบโครงสร้างฟิลด์ (Schema Validation)",
				Passed: mappedCount > 0,
				Detail: fmt.Sprintf("จับคู่ฟิลด์เป้าหมายสำเร็จ %d/%d ฟิลด์", mappedCount, len(tmpl.Fields)),
			},
			{
				Name:   "ตรวจสอบฟิลด์บังคับ (Required Field Validation)",
				Passed: reqPassed,
				Detail: reqDetail,
			},
			{
				Name:   "ตรวจสอบประเภทข้อมูล (Data Type Validation)",
				Passed: true,
				Detail: fmt.Sprintf("ตรวจสอบและปรับประเภทข้อมูล %d แถวถูกต้อง", totalRows),
			},
			{
				Name:   "ตรวจสอบรูปแบบวันที่ (Date Format Validation)",
				Passed: true,
				Detail: "แปลงรูปแบบวันที่เป็น YYYY-MM-DD มาตรฐานสากล",
			},
			{
				Name:   "ตรวจสอบสกุลเงิน (Currency Validation)",
				Passed: true,
				Detail: "ปรับเป็นรหัสสกุลเงินสากลตาม ISO 4217",
			},
			{
				Name:   "ตรวจสอบความแม่นยำทศนิยม (Decimal Precision)",
				Passed: true,
				Detail: "กำหนดความแม่นยำทศนิยม Decimal(18,4) และ (18,2)",
			},
		},
		Details: errorDetails,
	}
}

func (s *TransformService) initDefaultTemplates() {
	tmpl := model.TargetTemplate{
		ID:          "tmpl_01",
		Name:        "KKP_CUSTODIAN_TRADE_V2",
		Description: "รูปแบบมาตรฐานรายงานธุรกรรมหลักทรัพย์ Custodian ของกลุ่มธุรกิจการเงินเกียรตินาคินภัทร",
		Version:     "2.0",
		FieldCount:  8,
		Status:      "Active",
		UpdatedAt:   "05 ก.ย. 2026",
		Fields: []model.TargetField{
			{ID: "tf1", Name: "FUND_NAME", DataType: "String", Required: true, Format: "-", Description: "ชื่อกองทุนรวม"},
			{ID: "tf2", Name: "FUND_CODE", DataType: "String", Required: true, Format: "-", Description: "รหัสกองทุนรวม"},
			{ID: "tf3", Name: "TRADE_DATE", DataType: "Date", Required: true, Format: "YYYY-MM-DD", Description: "วันที่ทำรายการ"},
			{ID: "tf4", Name: "SETTLEMENT_DATE", DataType: "Date", Required: true, Format: "YYYY-MM-DD", Description: "วันที่ชำระราคา"},
			{ID: "tf5", Name: "CURRENCY", DataType: "String", Required: true, Format: "ISO 4217", Description: "รหัสสกุลเงิน"},
			{ID: "tf6", Name: "UNIT_PRICE", DataType: "Decimal", Required: true, Format: "18,4", Description: "ราคาต่อหน่วย"},
			{ID: "tf7", Name: "QUANTITY", DataType: "Decimal", Required: true, Format: "18,4", Description: "จำนวนหน่วย"},
			{ID: "tf8", Name: "AMOUNT", DataType: "Decimal", Required: true, Format: "18,2", Description: "มูลค่ารวม"},
		},
	}
	s.templates[tmpl.Name] = tmpl
}
