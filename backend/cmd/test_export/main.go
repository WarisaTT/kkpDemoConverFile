package main

import (
	"fmt"
	"io/ioutil"
	"path/filepath"
	"github.com/kkp/ai-data-transformation/internal/parser"
	"github.com/kkp/ai-data-transformation/internal/model"
)

func main() {
	p := parser.NewExcelParser()
	fpath := "/Users/garfairdummn/Documents/GitHub/KKPConvertByAI/samples/KKP_Demo_Source_Files (1).xlsx"
	b, err := ioutil.ReadFile(fpath)
	if err != nil {
		fmt.Printf("ReadFile err: %v\n", err)
		return
	}

	fields, _, rows, _, err := p.ExtractFields(filepath.Base(fpath), b)
	fmt.Printf("Extracted %d fields and %d rows from %s\n", len(fields), rows, filepath.Base(fpath))

	mappings := []model.FieldMapping{
		{SourceField: "Fund_Name", TargetField: "FUND_NAME"},
		{SourceField: "Fund_Code", TargetField: "FUND_CODE"},
		{SourceField: "Trade Date", TargetField: "TRADE_DATE"},
		{SourceField: "Settlement Date", TargetField: "SETTLEMENT_DATE"},
		{SourceField: "CCY", TargetField: "CURRENCY"},
		{SourceField: "NAV", TargetField: "UNIT_PRICE"},
		{SourceField: "Qty", TargetField: "QUANTITY"},
		{SourceField: "Amount", TargetField: "AMOUNT"},
		{SourceField: "Broker", TargetField: "BROKER_CODE"},
		{SourceField: "Fund Type", TargetField: "PRODUCT_TYPE"},
	}

	outBytes, err := p.GenerateStandardExcel("KKP_CUSTODIAN_TRADE_V2", mappings, b, filepath.Base(fpath))
	if err != nil {
		fmt.Printf("GenerateStandardExcel err: %v\n", err)
		return
	}

	outPath := "/Users/garfairdummn/Documents/GitHub/KKPConvertByAI/samples/TEST_OUTPUT.xlsx"
	ioutil.WriteFile(outPath, outBytes, 0644)
	fmt.Printf(" Successfully exported %d bytes to %s!\n", len(outBytes), outPath)
}
