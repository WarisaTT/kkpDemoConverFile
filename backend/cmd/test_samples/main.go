
package main

import (
	"fmt"
	"io/ioutil"
	"path/filepath"
	"github.com/kkp/ai-data-transformation/internal/parser"
)

func main() {
	p := parser.NewExcelParser()
	files, _ := filepath.Glob("/Users/garfairdummn/Documents/GitHub/KKPConvertByAI/samples/*.xlsx")
	for _, fpath := range files {
		b, err := ioutil.ReadFile(fpath)
		if err != nil {
			continue
		}
		fields, sheets, rows, cols, err := p.ExtractFields(filepath.Base(fpath), b)
		fmt.Printf("=== %s ===\n", filepath.Base(fpath))
		fmt.Printf("Sheets: %d, Rows: %d, Cols: %d, Err: %v\n", sheets, rows, cols, err)
		fmt.Printf("Extracted Fields (%d):\n", len(fields))
		for i, f := range fields {
			fmt.Printf("  [%d] Name: '%s' | DataType: '%s' | Sample: '%s'\n", i+1, f.Name, f.DataType, f.SampleVal)
		}
		fmt.Println()
		break // just check first file
	}
}
