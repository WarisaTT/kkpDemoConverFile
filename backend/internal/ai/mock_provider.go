package ai

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/kkp/ai-data-transformation/internal/model"
)

type MockAIProvider struct{}

func NewMockAIProvider() *MockAIProvider {
	return &MockAIProvider{}
}

func (m *MockAIProvider) AnalyzeSchema(ctx context.Context, fields []model.SourceField) (map[string]interface{}, error) {
	return map[string]interface{}{
		"header_detected":      true,
		"data_type_detected":   true,
		"date_format_detected": true,
		"currency_detected":    "THB",
		"potential_duplicates": 0,
		"missing_values":       0,
	}, nil
}

// Master Standard KKP Target Template Fields (Exactly 8 Main Fields)
var StandardKKPTargetFields = []model.TargetField{
	{ID: "tf_1", Name: "FUND_NAME", DataType: "String", Required: true, Format: "-", Description: "ชื่อกองทุนรวม"},
	{ID: "tf_2", Name: "FUND_CODE", DataType: "String", Required: true, Format: "-", Description: "รหัสกองทุนรวม"},
	{ID: "tf_3", Name: "TRADE_DATE", DataType: "Date", Required: true, Format: "YYYY-MM-DD", Description: "วันที่ทำรายการ"},
	{ID: "tf_4", Name: "SETTLEMENT_DATE", DataType: "Date", Required: true, Format: "YYYY-MM-DD", Description: "วันที่ชำระราคา"},
	{ID: "tf_5", Name: "CURRENCY", DataType: "String", Required: true, Format: "ISO 4217", Description: "รหัสสกุลเงิน"},
	{ID: "tf_6", Name: "UNIT_PRICE", DataType: "Decimal", Required: true, Format: "18,4", Description: "ราคาต่อหน่วย"},
	{ID: "tf_7", Name: "QUANTITY", DataType: "Decimal", Required: true, Format: "18,4", Description: "จำนวนหน่วย"},
	{ID: "tf_8", Name: "AMOUNT", DataType: "Decimal", Required: true, Format: "18,2", Description: "มูลค่ารวม"},
}

func (m *MockAIProvider) MatchFields(ctx context.Context, processID string, sourceFields []model.SourceField, targetTemplate model.TargetTemplate) ([]model.FieldMapping, error) {
	var mappings []model.FieldMapping

	// Target-First Mapping Logic strictly for the 8 standard KKP fields
	for _, tf := range StandardKKPTargetFields {
		bestMatchSource := ""
		bestSample := "-"
		bestDataType := "Text"
		confidence := 0.0
		var reasons []string

		for _, sf := range sourceFields {
			sfClean := strings.TrimSpace(sf.Name)
			sfLower := strings.ToLower(sfClean)

			switch tf.Name {
			case "FUND_NAME":
				if containsAny(sfLower, "fund_name", "fund name", "scheme_name", "portfolio_name", "fund_desc", "fund desc") || sfLower == "fund" {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.98
					reasons = []string{
						fmt.Sprintf("ชื่อคอลัมน์ '%s' ตรงกับฟิลด์มาตรฐาน '%s'", sfClean, tf.Name),
						fmt.Sprintf("ตัวอย่างข้อมูลจากไฟล์: '%s'", sf.SampleVal),
						"ผ่านการวิเคราะห์ AI ตามข้อกำหนดมาตรฐาน KKP",
					}
				}
			case "FUND_CODE":
				if containsAny(sfLower, "fund_code", "fund code", "fund identifier", "fund id", "fid", "fund_id", "security_code", "fund symbol", "fund_symbol") {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.97
					reasons = []string{
						fmt.Sprintf("ชื่อคอลัมน์ '%s' ตรงกับรหัสอ้างอิงกองทุน '%s'", sfClean, tf.Name),
						fmt.Sprintf("ตัวอย่างข้อมูลจากไฟล์: '%s'", sf.SampleVal),
					}
				}
			case "TRADE_DATE":
				if containsAny(sfLower, "trade date", "trade_date", "transaction_date", "trans_date", "trade dt", "order_date", "order date", "txn date", "txn_date") || (strings.Contains(sfLower, "date") && !strings.Contains(sfLower, "settle") && !strings.Contains(sfLower, "value")) {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.95
					reasons = []string{
						fmt.Sprintf("คอลัมน์วันที่ทำรายการ '%s' ตรงกับ '%s'", sfClean, tf.Name),
						fmt.Sprintf("ตัวอย่างข้อมูล: '%s' (แปลงเป็น YYYY-MM-DD)", sf.SampleVal),
					}
				}
			case "SETTLEMENT_DATE":
				if containsAny(sfLower, "settlement date", "settlement_date", "settle_date", "settle date", "value date", "value_date") {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.94
					reasons = []string{
						fmt.Sprintf("คอลัมน์วันชำระราคา '%s' ตรงกับ '%s'", sfClean, tf.Name),
						fmt.Sprintf("ตัวอย่างข้อมูล: '%s'", sf.SampleVal),
					}
				}
			case "CURRENCY":
				if sfLower == "ccy" || containsAny(sfLower, "currency", "currency code", "currency_code", "curr") {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.99
					reasons = []string{
						fmt.Sprintf("คอลัมน์สกุลเงิน '%s' ตรงกับ '%s' (ISO 4217)", sfClean, tf.Name),
						fmt.Sprintf("ตัวอย่างข้อมูล: '%s'", sf.SampleVal),
					}
				}
			case "UNIT_PRICE":
				if sfLower == "nav" || containsAny(sfLower, "net asset value", "unit price", "unit_price", "nav_price") || (strings.Contains(sfLower, "price") && !strings.Contains(sfLower, "total")) {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.88
					reasons = []string{
						fmt.Sprintf("ราคาต่อหน่วย/NAV '%s' ตรงกับ '%s'", sfClean, tf.Name),
						fmt.Sprintf("ตัวอย่างข้อมูล: '%s'", sf.SampleVal),
					}
				}
			case "QUANTITY":
				if sfLower == "qty" || containsAny(sfLower, "quantity", "units", "shares", "number_of_units") {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.95
					reasons = []string{
						fmt.Sprintf("จำนวนหน่วย '%s' ตรงกับ '%s'", sfClean, tf.Name),
						fmt.Sprintf("ตัวอย่างข้อมูล: '%s'", sf.SampleVal),
					}
				}
			case "AMOUNT":
				if containsAny(sfLower, "amount", "trade amount", "trade_amount", "total value", "total_value", "net_amount", "gross_amount") {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.94
					reasons = []string{
						fmt.Sprintf("มูลค่าการซื้อขาย '%s' ตรงกับ '%s'", sfClean, tf.Name),
						fmt.Sprintf("ตัวอย่างข้อมูล: '%s'", sf.SampleVal),
					}
				}
			}

			if bestMatchSource != "" {
				break
			}
		}

		confLevel := "High"
		status := "SUGGESTED"

		if bestMatchSource == "" {
			bestMatchSource = "UNMATCHED"
			confidence = 0.0
			confLevel = "Unmatched"
			status = "UNMATCHED"
			reasons = []string{
				fmt.Sprintf("ยังไม่พบคอลัมน์จากไฟล์อัปโหลดที่ตรงกับฟิลด์มาตรฐาน '%s'", tf.Name),
				"โปรดเลือกคอลัมน์จากไฟล์อัปโหลดเพื่อจับคู่กับฟิลด์นี้",
			}
		} else {
			if confidence >= 0.85 {
				confLevel = "High"
				status = "APPROVED"
			} else {
				confLevel = "Medium"
				status = "SUGGESTED"
			}
		}

		mappings = append(mappings, model.FieldMapping{
			ID:              uuid.New().String(),
			ProcessID:       processID,
			SourceField:     bestMatchSource,
			SourceSample:    bestSample,
			SourceDataType:  bestDataType,
			TargetField:     tf.Name,
			TargetDataType:  tf.DataType,
			TargetRequired:  tf.Required,
			TargetFormat:    tf.Format,
			Confidence:      confidence,
			ConfidenceLevel: confLevel,
			Status:          status,
			Reasons:         reasons,
		})
	}

	return mappings, nil
}

func containsAny(s string, keywords ...string) bool {
	for _, kw := range keywords {
		if strings.Contains(s, kw) {
			return true
		}
	}
	return false
}

func (m *MockAIProvider) ExplainMapping(ctx context.Context, sourceField, targetField, sampleVal string) ([]string, float64, string, error) {
	reasons := []string{
		fmt.Sprintf("วิเคราะห์ฟิลด์เป้าหมาย '%s' กับฟิลด์ต้นทาง '%s'", targetField, sourceField),
		fmt.Sprintf("ตัวอย่างข้อมูล '%s' ผ่านการตรวจสอบความสอดคล้องทางความหมาย (Semantic Similarity)", sampleVal),
		"ผ่านการเรียนรู้จากไฟล์ตัวอย่างรายงาน Custodian และ Fund Manager ของ KKP",
		"จัดรูปแบบข้อมูลและตรวจสอบข้อกำหนด Required อัตโนมัติ",
	}
	return reasons, 0.95, "High", nil
}
