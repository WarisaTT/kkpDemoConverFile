package main

import (
	"fmt"
	"path/filepath"
	"github.com/xuri/excelize/v2"
)

func main() {
	fpath := "/Users/garfairdummn/Documents/GitHub/KKPConvertByAI/samples/KKP_Demo_Source_Files (1).xlsx"
	f, err := excelize.OpenFile(fpath)
	if err != nil {
		fmt.Printf("Err: %v\n", err)
		return
	}
	defer f.Close()

	sheets := f.GetSheetList()
	fmt.Printf("File %s has %d sheets: %v\n", filepath.Base(fpath), len(sheets), sheets)
	totalRowsCount := 0
	for _, s := range sheets {
		rows, err := f.GetRows(s)
		if err == nil {
			fmt.Printf("Sheet '%s': total raw rows = %d\n", s, len(rows))
			totalRowsCount += len(rows)
		}
	}
	fmt.Printf("Total combined raw rows across all sheets: %d\n", totalRowsCount)
}
