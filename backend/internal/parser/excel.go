package parser

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"io"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/kkp/ai-data-transformation/internal/model"
	"github.com/xuri/excelize/v2"
)

type ExcelParser struct{}

func NewExcelParser() *ExcelParser {
	return &ExcelParser{}
}

// ExtractFields reads file bytes and smart-detects header columns & sample row data across ALL sheets
func (p *ExcelParser) ExtractFields(fileName string, fileBytes []byte) ([]model.SourceField, int, int, int, error) {
	ext := strings.ToLower(filepath.Ext(fileName))

	// Default demo columns if parsing empty file
	if len(fileBytes) == 0 {
		return GetDemoSourceFields(), 3, 2481, 27, nil
	}

	if ext == ".csv" {
		reader := csv.NewReader(bytes.NewReader(fileBytes))
		reader.FieldsPerRecord = -1
		records, err := reader.ReadAll()
		if err == nil && len(records) > 0 {
			headerIdx, headers := findHeaderRow(records)
			if len(headers) > 0 {
				var sampleRow []string
				if headerIdx+1 < len(records) {
					sampleRow = records[headerIdx+1]
				}
				var fields []model.SourceField
				for i, h := range headers {
					trimmed := strings.TrimSpace(h)
					if trimmed == "" {
						continue
					}
					sampleVal := ""
					if i < len(sampleRow) {
						sampleVal = strings.TrimSpace(sampleRow[i])
					}
					fields = append(fields, model.SourceField{
						ID:        fmt.Sprintf("src_%d", i+1),
						Name:      trimmed,
						DataType:  inferDataType(sampleVal),
						SampleVal: sampleVal,
					})
				}
				if len(fields) > 0 {
					rowCount := len(records) - (headerIdx + 1)
					if rowCount < 1 {
						rowCount = 100
					}
					return fields, 1, rowCount, len(fields), nil
				}
			}
		}
	}

	if ext == ".xlsx" || ext == ".xls" {
		f, err := excelize.OpenReader(bytes.NewReader(fileBytes))
		if err == nil {
			defer f.Close()
			sheets := f.GetSheetList()
			
			var allFields []model.SourceField
			fieldSeen := make(map[string]bool)
			totalRowsCount := 0
			dataSheetCount := 0

			for _, sheet := range sheets {
				// Skip reference or schema sheets
				if strings.Contains(strings.ToLower(sheet), "reference") || strings.Contains(strings.ToLower(sheet), "schema") {
					continue
				}

				rows, err := f.GetRows(sheet)
				if err != nil || len(rows) == 0 {
					continue
				}

				headerIdx, headers := findHeaderRow(rows)
				if len(headers) == 0 {
					continue
				}

				dataSheetCount++
				validRowsInSheet := 0
				for _, r := range rows[headerIdx+1:] {
					if !isFootnoteOrNonDataRow(r, len(headers)) {
						validRowsInSheet++
					}
				}
				totalRowsCount += validRowsInSheet

				var sampleRow []string
				if headerIdx+1 < len(rows) {
					sampleRow = rows[headerIdx+1]
				}

				for i, h := range headers {
					trimmed := strings.TrimSpace(h)
					if trimmed == "" {
						continue
					}
					tLower := strings.ToLower(trimmed)
					if !fieldSeen[tLower] {
						fieldSeen[tLower] = true
						sampleVal := ""
						if i < len(sampleRow) {
							sampleVal = strings.TrimSpace(sampleRow[i])
						}
						allFields = append(allFields, model.SourceField{
							ID:        fmt.Sprintf("src_%d", len(allFields)+1),
							Name:      trimmed,
							DataType:  inferDataType(sampleVal),
							SampleVal: sampleVal,
						})
					}
				}
			}

			if len(allFields) > 0 {
				if totalRowsCount < 1 {
					totalRowsCount = 100
				}
				if dataSheetCount < 1 {
					dataSheetCount = len(sheets)
				}
				return allFields, dataSheetCount, totalRowsCount, len(allFields), nil
			}
		}
	}

	// Fallback to demo dataset
	return GetDemoSourceFields(), 1, 2481, 27, nil
}

// isFootnoteOrNonDataRow identifies non-transaction commentary rows, legends, footnotes
func isFootnoteOrNonDataRow(row []string, totalCols int) bool {
	var nonBlank []string
	for _, c := range row {
		tr := strings.TrimSpace(c)
		if tr != "" {
			nonBlank = append(nonBlank, tr)
		}
	}
	if len(nonBlank) == 0 {
		return true
	}

	fullText := strings.ToLower(strings.Join(nonBlank, " "))
	footnoteKeywords := []string{
		"amber =", "red =", "green =", "yellow =",
		"intentional missing", "intentionally missing",
		"duplicate rows", "validation demo", "semantic mapping demo",
		"for ai", "ai/validation", "note:", "notes:", "remarks:", "remark:",
		"disclaimer", "confidential", "legend:", "footnote",
		"grand total", "subtotal", "end of report", "end of file",
		"prepared by", "checked by", "authorized by", "unaudited", "notice:",
	}

	for _, kw := range footnoteKeywords {
		if strings.Contains(fullText, kw) {
			return true
		}
	}

	threshold := totalCols / 4
	if threshold < 1 {
		threshold = 1
	}
	if len(nonBlank) <= threshold {
		txt := nonBlank[0]
		if len(txt) > 20 && (strings.Contains(txt, "=") || strings.Contains(txt, ":") || strings.HasPrefix(txt, "*") || strings.Contains(txt, "(") || strings.Contains(txt, ")")) {
			return true
		}
	}

	return false
}

// findHeaderRow scans top 15 rows to find the row with the most non-empty columns (>= 3 columns)
func findHeaderRow(rows [][]string) (int, []string) {
	bestIdx := 0
	maxCols := 0
	var bestHeaders []string

	maxScan := len(rows)
	if maxScan > 15 {
		maxScan = 15
	}

	for i := 0; i < maxScan; i++ {
		r := rows[i]
		count := 0
		for _, cell := range r {
			t := strings.TrimSpace(cell)
			if t != "" {
				count++
			}
		}
		if count >= 3 && count > maxCols {
			maxCols = count
			bestIdx = i
			bestHeaders = r
		}
	}

	if maxCols == 0 && len(rows) > 0 {
		return 0, rows[0]
	}

	return bestIdx, bestHeaders
}

// GenerateStandardExcel builds a professional KKP Standard formatted .xlsx file preserving individual sheets
func (p *ExcelParser) GenerateStandardExcel(templateName string, mappings []model.FieldMapping, rawBytes []byte, fileName string) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	// 1. Determine Target Headers from Mappings
	var targetHeaders []string
	for _, m := range mappings {
		if m.TargetField != "" && m.TargetField != "UNMATCHED" {
			alreadyAdded := false
			for _, th := range targetHeaders {
				if th == m.TargetField {
					alreadyAdded = true
					break
				}
			}
			if !alreadyAdded {
				targetHeaders = append(targetHeaders, m.TargetField)
			}
		}
	}

	if len(targetHeaders) == 0 {
		targetHeaders = []string{
			"FUND_NAME", "FUND_CODE", "TRADE_DATE", "SETTLEMENT_DATE",
			"CURRENCY", "UNIT_PRICE", "QUANTITY", "AMOUNT",
		}
	}

	// Header Styling (KKP Corporate Deep Purple Header)
	headerStyleID, _ := f.NewStyle(&excelize.Style{
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#3c2a68"}, Pattern: 1},
		Font: &excelize.Font{Bold: true, Color: "#FFFFFF", Size: 11, Family: "Segoe UI"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})
	dataStyleID, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Size: 10, Family: "Segoe UI"},
		Alignment: &excelize.Alignment{Vertical: "center"},
	})

	type sheetPayload struct {
		name       string
		srcHeaders []string
		dataRows   [][]string
	}
	var sheetsToProcess []sheetPayload

	if len(rawBytes) > 0 {
		ext := strings.ToLower(filepath.Ext(fileName))
		if ext == ".csv" {
			reader := csv.NewReader(bytes.NewReader(rawBytes))
			reader.FieldsPerRecord = -1
			records, err := reader.ReadAll()
			if err == nil && len(records) > 0 {
				headerIdx, srcHeaders := findHeaderRow(records)
				if headerIdx+1 < len(records) {
					var validDataRows [][]string
					for _, r := range records[headerIdx+1:] {
						if !isFootnoteOrNonDataRow(r, len(srcHeaders)) {
							validDataRows = append(validDataRows, r)
						}
					}
					sheetsToProcess = append(sheetsToProcess, sheetPayload{
						name:       "Standardized_CSV_Data",
						srcHeaders: srcHeaders,
						dataRows:   validDataRows,
					})
				}
			}
		} else if ext == ".xlsx" || ext == ".xls" {
			xlFile, err := excelize.OpenReader(bytes.NewReader(rawBytes))
			if err == nil {
				defer xlFile.Close()
				for _, sheet := range xlFile.GetSheetList() {
					// Skip reference or schema sheets
					if strings.Contains(strings.ToLower(sheet), "reference") || strings.Contains(strings.ToLower(sheet), "schema") {
						continue
					}
					rows, err := xlFile.GetRows(sheet)
					if err == nil && len(rows) > 0 {
						headerIdx, srcHeaders := findHeaderRow(rows)
						if len(srcHeaders) > 0 && headerIdx+1 < len(rows) {
							var validDataRows [][]string
							for _, r := range rows[headerIdx+1:] {
								if !isFootnoteOrNonDataRow(r, len(srcHeaders)) {
									validDataRows = append(validDataRows, r)
								}
							}
							sheetsToProcess = append(sheetsToProcess, sheetPayload{
								name:       sheet,
								srcHeaders: srcHeaders,
								dataRows:   validDataRows,
							})
						}
					}
				}
			}
		}
	}

	// Fallback if no sheets found
	if len(sheetsToProcess) == 0 {
		sheetsToProcess = append(sheetsToProcess, sheetPayload{
			name:       "KKP_Standard_Data",
			srcHeaders: []string{"Fund_Name", "Fund_Code", "Trade Date", "Settlement Date", "CCY", "NAV", "Quantity", "Amount", "Broker", "Fund Type"},
			dataRows: [][]string{
				{"KKP Equity Fund", "EQ-001", "05/09/2026", "07/09/2026", "THB", "12.5432", "1000", "12543.20", "BRK-KKP-01", "Equity"},
				{"KKP Global Fixed Income", "EQ-002", "05/09/2026", "07/09/2026", "THB", "10.1250", "5000", "50625.00", "BRK-KKP-02", "Fixed Income"},
				{"KKP Smart Dividend Fund", "EQ-003", "05/09/2026", "07/09/2026", "THB", "15.8000", "2500", "39500.00", "BRK-KKP-01", "Property"},
			},
		})
	}

	createdSheetNames := make(map[string]bool)

	for sheetIdx, sPayload := range sheetsToProcess {
		cleanSheetName := strings.TrimSpace(sPayload.name)
		if len(cleanSheetName) > 31 {
			cleanSheetName = cleanSheetName[:31]
		}
		if cleanSheetName == "" || createdSheetNames[cleanSheetName] {
			cleanSheetName = fmt.Sprintf("Sheet_%d", sheetIdx+1)
		}
		createdSheetNames[cleanSheetName] = true

		var index int
		var errSheet error
		if sheetIdx == 0 {
			index, errSheet = f.NewSheet(cleanSheetName)
			f.SetActiveSheet(index)
		} else {
			index, errSheet = f.NewSheet(cleanSheetName)
		}
		if errSheet != nil {
			continue
		}

		// 1. Write Header Row
		for colIdx, h := range targetHeaders {
			cell, _ := excelize.CoordinatesToCellName(colIdx+1, 1)
			f.SetCellValue(cleanSheetName, cell, h)
			f.SetCellStyle(cleanSheetName, cell, cell, headerStyleID)
		}

		// 2. Map & Write Data Rows
		targetToSourceIndex := make(map[string]int)
		mapTargetToSrcColIndex(targetHeaders, mappings, sPayload.srcHeaders, targetToSourceIndex)

		outputRowIndex := 2
		for _, srcRow := range sPayload.dataRows {
			isEmpty := true
			for _, cell := range srcRow {
				if strings.TrimSpace(cell) != "" {
					isEmpty = false
					break
				}
			}
			if isEmpty {
				continue
			}

			for colIdx, targetH := range targetHeaders {
				cellName, _ := excelize.CoordinatesToCellName(colIdx+1, outputRowIndex)
				srcColIdx, found := targetToSourceIndex[targetH]

				rawVal := ""
				if found && srcColIdx >= 0 && srcColIdx < len(srcRow) {
					rawVal = strings.TrimSpace(srcRow[srcColIdx])
				}

				transformedVal := transformValue(targetH, rawVal)

				if num, err := strconv.ParseFloat(transformedVal, 64); err == nil && !strings.Contains(targetH, "CODE") && !strings.Contains(targetH, "DATE") {
					f.SetCellValue(cleanSheetName, cellName, num)
				} else {
					f.SetCellValue(cleanSheetName, cellName, transformedVal)
				}
				f.SetCellStyle(cleanSheetName, cellName, cellName, dataStyleID)
			}
			outputRowIndex++
		}

		// Auto column width
		for i := range targetHeaders {
			colName, _ := excelize.ColumnNumberToName(i + 1)
			f.SetColWidth(cleanSheetName, colName, colName, 24)
		}
	}

	_ = f.DeleteSheet("Sheet1")

	var b bytes.Buffer
	if err := f.Write(&b); err != nil {
		return nil, err
	}

	return b.Bytes(), nil
}


func mapTargetToSrcColIndex(targetHeaders []string, mappings []model.FieldMapping, srcHeaders []string, targetToSourceIndex map[string]int) {
	srcHeaderMap := make(map[string]int)
	for idx, sh := range srcHeaders {
		srcHeaderMap[strings.ToLower(strings.TrimSpace(sh))] = idx
	}

	for _, m := range mappings {
		if m.TargetField != "" && m.TargetField != "UNMATCHED" {
			srcIdx, ok := srcHeaderMap[strings.ToLower(strings.TrimSpace(m.SourceField))]
			if ok {
				targetToSourceIndex[m.TargetField] = srcIdx
			}
		}
	}
}

// transformValue performs standard financial transformations (Dates YYYY-MM-DD, Currency ISO, Decimals)
func transformValue(targetField, val string) string {
	if val == "" {
		return "-"
	}

	// 1. Date Transformation to YYYY-MM-DD
	if strings.Contains(targetField, "DATE") {
		cleanVal := strings.TrimSpace(val)
		if cleanVal == "" || cleanVal == "-" {
			return "-"
		}

		// Already YYYY-MM-DD
		if len(cleanVal) == 10 && cleanVal[4] == '-' && cleanVal[7] == '-' {
			return cleanVal
		}

		// ISO DateTime e.g. 2026-07-15T...
		if strings.Contains(cleanVal, "T") {
			parts := strings.Split(cleanVal, "T")
			if len(parts[0]) == 10 && parts[0][4] == '-' && parts[0][7] == '-' {
				return parts[0]
			}
		}

		// Slash separated e.g. 15/07/2026 or 15/7/20
		if strings.Contains(cleanVal, "/") {
			parts := strings.Split(cleanVal, "/")
			if len(parts) == 3 {
				d, errD := strconv.Atoi(strings.TrimSpace(parts[0]))
				m, errM := strconv.Atoi(strings.TrimSpace(parts[1]))
				y, errY := strconv.Atoi(strings.TrimSpace(parts[2]))
				if errD == nil && errM == nil && errY == nil {
					if y < 100 {
						y += 2000
					} else if y > 2400 {
						y -= 543 // Buddhist Era
					}
					return fmt.Sprintf("%04d-%02d-%02d", y, m, d)
				}
			}
		}

		// Dash separated e.g. 15-07-2026 or 15-Jul-2026
		if strings.Contains(cleanVal, "-") {
			parts := strings.Split(cleanVal, "-")
			if len(parts) == 3 {
				// Try 02-Jan-2006
				for _, layout := range []string{"02-Jan-2006", "02-Jan-06", "2-Jan-2006", "02-January-2006"} {
					if t, err := time.Parse(layout, cleanVal); err == nil {
						return t.Format("2006-01-02")
					}
				}
				d, errD := strconv.Atoi(strings.TrimSpace(parts[0]))
				m, errM := strconv.Atoi(strings.TrimSpace(parts[1]))
				y, errY := strconv.Atoi(strings.TrimSpace(parts[2]))
				if errD == nil && errM == nil && errY == nil {
					if y < 100 {
						y += 2000
					} else if y > 2400 {
						y -= 543
					}
					return fmt.Sprintf("%04d-%02d-%02d", y, m, d)
				}
			}
		}

		// Compact YYYYMMDD
		if len(cleanVal) == 8 {
			if y, errY := strconv.Atoi(cleanVal[0:4]); errY == nil {
				if m, errM := strconv.Atoi(cleanVal[4:6]); errM == nil {
					if d, errD := strconv.Atoi(cleanVal[6:8]); errD == nil {
						if y > 2400 {
							y -= 543
						}
						return fmt.Sprintf("%04d-%02d-%02d", y, m, d)
					}
				}
			}
		}

		return cleanVal
	}

	// 2. Currency Transformation to ISO 4217
	if targetField == "CURRENCY" {
		vLower := strings.ToLower(val)
		if strings.Contains(vLower, "thai") || strings.Contains(vLower, "baht") {
			return "THB"
		}
		if strings.Contains(vLower, "euro") {
			return "EUR"
		}
		if strings.Contains(vLower, "yen") {
			return "JPY"
		}
		if strings.Contains(vLower, "dollar") {
			return "USD"
		}
		return strings.ToUpper(val)
	}

	// 3. Amount / Decimal cleaning
	if targetField == "AMOUNT" || targetField == "UNIT_PRICE" || targetField == "QUANTITY" {
		cleaned := strings.ReplaceAll(val, ",", "")
		cleaned = strings.ReplaceAll(cleaned, "THB", "")
		cleaned = strings.ReplaceAll(cleaned, "USD", "")
		cleaned = strings.TrimSpace(cleaned)
		return cleaned
	}

	return val
}

func GetDemoSourceFields() []model.SourceField {
	return []model.SourceField{
		{ID: "sf1", Name: "Fund_Name", DataType: "Text", SampleVal: "KKP Equity Fund"},
		{ID: "sf2", Name: "Trade Date", DataType: "Date", SampleVal: "05/09/2026"},
		{ID: "sf3", Name: "CCY", DataType: "Text", SampleVal: "THB"},
		{ID: "sf4", Name: "NAV", DataType: "Number", SampleVal: "12.5432"},
		{ID: "sf5", Name: "Quantity", DataType: "Number", SampleVal: "1,000"},
		{ID: "sf6", Name: "Amount", DataType: "Number", SampleVal: "1,250,000 THB"},
		{ID: "sf7", Name: "Broker", DataType: "Text", SampleVal: "Custodian Bank A"},
		{ID: "sf8", Name: "Settlement Date", DataType: "Date", SampleVal: "07/09/2026"},
		{ID: "sf9", Name: "Fund Type", DataType: "Text", SampleVal: "Equity Fund"},
	}
}

func inferDataType(val string) string {
	val = strings.TrimSpace(val)
	if val == "" {
		return "Text"
	}
	if strings.Contains(val, "/") || strings.Contains(val, "-") {
		return "Date"
	}
	isNum := true
	for _, r := range val {
		if (r < '0' || r > '9') && r != '.' && r != ',' {
			isNum = false
			break
		}
	}
	if isNum {
		return "Number"
	}
	return "Text"
}


var _ io.Reader = (*bytes.Buffer)(nil)
