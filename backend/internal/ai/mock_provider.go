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
				if sfLower == "fund" {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.54
					reasons = []string{
						fmt.Sprintf("ความหมายคลุมเครือ (Ambiguous 54%% < 60%%): คำว่า '%s' เป็นคำกว้างทั่วไป อาจหมายถึงชื่อกองทุน รหัส หรือประเภทพอร์ต", sfClean),
					}
				} else if containsAny(sfLower, "fund_name", "fund name", "scheme_name", "portfolio_name", "fund_desc", "fund desc") {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.907
					reasons = []string{
						fmt.Sprintf("วิเคราะห์บริบทการเงิน (Semantic Match 97%%): คอลัมน์ '%s' หมายถึงชื่อพอร์ตลงทุน/กองทุนรวม ตรงกับ '%s'", sfClean, tf.Name),
						fmt.Sprintf("ความเหมือนชื่อตัวอักษร (Text Similarity 25%%) | รูปแบบข้อมูล (Pattern Match 100%%: %s)", sf.SampleVal),
						"สูตรคำนวณ: (Semantic 97% × 0.6) + (Pattern 100% × 0.3) + (Text 25% × 0.1) = 90.7%",
					}
				}
			case "FUND_CODE":
				if containsAny(sfLower, "fund_code", "fund code", "fund identifier", "fund id", "fid", "fund_id", "security_code", "fund symbol", "fund_symbol", "isin") {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.902
					reasons = []string{
						fmt.Sprintf("วิเคราะห์บริบทการเงิน (Semantic Match 97%%): รหัสอ้างอิงสากล '%s' (ISIN/Fund ID) เทียบเท่ากับ '%s'", sfClean, tf.Name),
						fmt.Sprintf("ความเหมือนชื่อตัวอักษร (Text Similarity 20%%) | รูปแบบข้อมูล (Pattern Match 100%%: %s)", sf.SampleVal),
						"สูตรคำนวณ: (Semantic 97% × 0.6) + (Pattern 100% × 0.3) + (Text 20% × 0.1) = 90.2%",
					}
				}
			case "TRADE_DATE":
				if containsAny(sfLower, "trade date", "trade_date", "transaction_date", "trans_date", "trade dt", "order_date", "order date", "txn date", "txn_date") {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.900
					reasons = []string{
						fmt.Sprintf("วิเคราะห์บริบทการเงิน (Semantic Match 95%%): วันที่ส่งคำสั่งซื้อขาย '%s' ตรงกับ '%s'", sfClean, tf.Name),
						fmt.Sprintf("ความเหมือนชื่อตัวอักษร (Text Similarity 30%%) | รูปแบบข้อมูล (Pattern Match 100%%: %s)", sf.SampleVal),
						"สูตรคำนวณ: (Semantic 95% × 0.6) + (Pattern 100% × 0.3) + (Text 30% × 0.1) = 90.0%",
					}
				} else if sfLower == "date" || (strings.Contains(sfLower, "date") && !strings.Contains(sfLower, "settle") && !strings.Contains(sfLower, "value")) {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.52
					reasons = []string{
						fmt.Sprintf("ความหมายคลุมเครือ (Ambiguous 52%% < 60%%): คอลัมน์ '%s' เป็นคำกว้างทั่วไป ไม่ได้ระบุว่าเป็นวันที่ประเภทใด ต้องได้รับการตรวจสอบจากผู้ใช้", sfClean),
					}
				}
			case "SETTLEMENT_DATE":
				if containsAny(sfLower, "settlement date", "settlement_date", "settle_date", "settle date", "value date", "value_date") {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.900
					reasons = []string{
						fmt.Sprintf("วิเคราะห์บริบทการเงิน (Semantic Match 95%%): วันที่เงินเข้าชำระราคา '%s' (Value Date) ตรงกับ '%s'", sfClean, tf.Name),
						fmt.Sprintf("ความเหมือนชื่อตัวอักษร (Text Similarity 30%%) | รูปแบบข้อมูล (Pattern Match 100%%: %s)", sf.SampleVal),
						"สูตรคำนวณ: (Semantic 95% × 0.6) + (Pattern 100% × 0.3) + (Text 30% × 0.1) = 90.0%",
					}
				}
			case "CURRENCY":
				if sfLower == "ccy" || containsAny(sfLower, "currency", "currency code", "currency_code", "curr") {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.934
					reasons = []string{
						fmt.Sprintf("วิเคราะห์บริบทการเงิน (Semantic Match 99%%): ตัวย่ออักขระสากล '%s' (ISO 4217) เทียบเท่ากับ '%s'", sfClean, tf.Name),
						fmt.Sprintf("ความเหมือนชื่อตัวอักษร (Text Similarity 40%%) | รูปแบบข้อมูล (Pattern Match 100%%: %s)", sf.SampleVal),
						"สูตรคำนวณ: (Semantic 99% × 0.6) + (Pattern 100% × 0.3) + (Text 40% × 0.1) = 93.4%",
					}
				}
			case "UNIT_PRICE":
				if sfLower == "nav" || containsAny(sfLower, "net asset value", "unit price", "unit_price", "nav_price") || (strings.Contains(sfLower, "price") && !strings.Contains(sfLower, "total")) {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.903
					reasons = []string{
						fmt.Sprintf("วิเคราะห์บริบทการเงินสากล (Semantic Match 98%%): คำว่า '%s' (Net Asset Value) แม้ตัวอักษรต่างกันแต่มีความหมายคือราคาต่อหน่วย ตรงกับ '%s'", sfClean, tf.Name),
						fmt.Sprintf("ความเหมือนชื่อตัวอักษร (Text Similarity 15%%) | รูปแบบตัวเลข (Pattern Match 100%%: %s)", sf.SampleVal),
						"สูตรคำนวณ: (Semantic 98% × 0.6) + (Pattern 100% × 0.3) + (Text 15% × 0.1) = 90.3%",
					}
				}
			case "QUANTITY":
				if sfLower == "qty" || containsAny(sfLower, "quantity", "units", "shares", "number_of_units") {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.911
					reasons = []string{
						fmt.Sprintf("วิเคราะห์บริบทการเงิน (Semantic Match 96%%): ตัวย่อจำนวนหน่วย '%s' (Qty/Units) สอดคล้องกับ '%s'", sfClean, tf.Name),
						fmt.Sprintf("ความเหมือนชื่อตัวอักษร (Text Similarity 35%%) | รูปแบบข้อมูล (Pattern Match 100%%: %s)", sf.SampleVal),
						"สูตรคำนวณ: (Semantic 96% × 0.6) + (Pattern 100% × 0.3) + (Text 35% × 0.1) = 91.1%",
					}
				}
			case "AMOUNT":
				if containsAny(sfLower, "amount", "trade amount", "trade_amount", "total value", "total_value", "net_amount", "gross_amount") {
					bestMatchSource = sfClean
					bestSample = sf.SampleVal
					bestDataType = sf.DataType
					confidence = 0.911
					reasons = []string{
						fmt.Sprintf("วิเคราะห์บริบทการเงิน (Semantic Match 96%%): มูลค่ารวมธุรกรรม '%s' สอดคล้องกับ '%s'", sfClean, tf.Name),
						fmt.Sprintf("ความเหมือนชื่อตัวอักษร (Text Similarity 35%%) | รูปแบบข้อมูล (Pattern Match 100%%: %s)", sf.SampleVal),
						"สูตรคำนวณ: (Semantic 96% × 0.6) + (Pattern 100% × 0.3) + (Text 35% × 0.1) = 91.1%",
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
			// Strict Data Type Match Check
			isTypeMismatch := false
			if tf.DataType == "Date" && bestDataType != "Date" && !isDateLike(bestSample) && !strings.Contains(strings.ToLower(bestMatchSource), "date") && !strings.Contains(bestMatchSource, "วันที่") {
				isTypeMismatch = true
			}
			if (tf.DataType == "Decimal" || tf.DataType == "Number") && !isNumericLike(bestSample) {
				isTypeMismatch = true
			}

			if isTypeMismatch {
				confidence = 0.12
				confLevel = "Low"
				status = "SUGGESTED"
				reasons = []string{
					fmt.Sprintf("ไทป์ข้อมูลไม่ตรงกันอย่างยิ่ง (Type Mismatch 12%%): ฟิลด์มาตรฐาน '%s' ต้องการไทป์ '%s' แต่คอลัมน์ '%s' มีค่าตัวอย่างเป็นข้อความ ('%s') จึงปรับลดความเชื่อมั่นเหลือต่ำมาก", tf.Name, tf.DataType, bestMatchSource, bestSample),
				}
			} else if confidence >= 0.85 {
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

func isDateLike(val string) bool {
	clean := strings.TrimSpace(val)
	if clean == "" || clean == "-" {
		return true
	}
	for _, sep := range []string{"/", "-", "."} {
		if strings.Count(clean, sep) == 2 {
			return true
		}
	}
	return false
}

func isNumericLike(val string) bool {
	clean := strings.TrimSpace(val)
	if clean == "" || clean == "-" {
		return true
	}
	clean = strings.ReplaceAll(clean, ",", "")
	clean = strings.ReplaceAll(clean, "%", "")
	clean = strings.ReplaceAll(clean, "บาท", "")
	clean = strings.ReplaceAll(clean, "หน่วย", "")
	clean = strings.ReplaceAll(clean, "THB", "")
	clean = strings.ReplaceAll(clean, "USD", "")
	clean = strings.TrimSpace(clean)

	hasDigit := false
	for _, r := range clean {
		if r >= '0' && r <= '9' {
			hasDigit = true
		} else if r != '.' && r != '-' && r != '+' {
			return false
		}
	}
	return hasDigit
}

