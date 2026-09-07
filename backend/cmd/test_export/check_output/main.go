package main

import (
	"fmt"
	"github.com/xuri/excelize/v2"
)

func main() {
	f, err := excelize.OpenFile("/Users/garfairdummn/Documents/GitHub/KKPConvertByAI/samples/TEST_OUTPUT.xlsx")
	if err != nil {
		fmt.Printf("Error opening file: %v\n", err)
		return
	}
	defer f.Close()

	rows, _ := f.GetRows("KKP_Standard_Output")
	fmt.Printf("Total rows written to output Excel: %d\n", len(rows))
	for i := 0; i < 6 && i < len(rows); i++ {
		fmt.Printf("Row %d: %v\n", i+1, rows[i])
	}
}
