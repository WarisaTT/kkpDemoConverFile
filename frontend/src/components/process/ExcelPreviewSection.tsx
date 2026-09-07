'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useProcessStore, matchTargetToSourceField, isFootnoteOrNonDataRow } from '@/store/useProcessStore';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Info,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  Layers,
  Check,
} from 'lucide-react';
import { FieldMapping } from '@/types';

interface ExcelPreviewSectionProps {
  onSelectFieldForDrawer?: (mappingItem: FieldMapping) => void;
}

// 8 Standard Target Template Fields for KKP
export const KKP_MASTER_TEMPLATE_FIELDS = [
  { key: 'FUND_NAME', label: 'FUND_NAME', dataType: 'String', required: true, format: '-', description: 'ชื่อกองทุนรวม' },
  { key: 'FUND_CODE', label: 'FUND_CODE', dataType: 'String', required: true, format: '-', description: 'รหัสกองทุนรวม' },
  { key: 'TRADE_DATE', label: 'TRADE_DATE', dataType: 'Date', required: true, format: 'YYYY-MM-DD', description: 'วันที่ทำรายการ' },
  { key: 'SETTLEMENT_DATE', label: 'SETTLEMENT_DATE', dataType: 'Date', required: true, format: 'YYYY-MM-DD', description: 'วันที่ชำระราคา' },
  { key: 'CURRENCY', label: 'CURRENCY', dataType: 'String', required: true, format: 'ISO 4217', description: 'รหัสสกุลเงิน' },
  { key: 'UNIT_PRICE', label: 'UNIT_PRICE', dataType: 'Decimal', required: true, format: '18,4', description: 'ราคาต่อหน่วย / NAV' },
  { key: 'QUANTITY', label: 'QUANTITY', dataType: 'Decimal', required: true, format: '18,4', description: 'จำนวนหน่วย' },
  { key: 'AMOUNT', label: 'AMOUNT', dataType: 'Decimal', required: true, format: '18,2', description: 'มูลค่าการซื้อขาย' },
];

export const EXACT_EXCEL_SHEETS = {
  custodian_a: {
    id: "custodian_a",
    name: "Custodian_A",
    badge: "Source A",
    headers: ["Fund_Name", "Fund_Code", "Trade Date", "Settlement Date", "CCY", "NAV", "Qty", "Amount", "Broker", "Asset_Class"],
    defaultMappings: [
      { target_field: 'FUND_NAME', source_field: 'Fund_Name', confidence: 0.98 },
      { target_field: 'FUND_CODE', source_field: 'Fund_Code', confidence: 0.97 },
      { target_field: 'TRADE_DATE', source_field: 'Trade Date', confidence: 0.95 },
      { target_field: 'SETTLEMENT_DATE', source_field: 'Settlement Date', confidence: 0.94 },
      { target_field: 'CURRENCY', source_field: 'CCY', confidence: 0.99 },
      { target_field: 'UNIT_PRICE', source_field: 'NAV', confidence: 0.96 },
      { target_field: 'QUANTITY', source_field: 'Qty', confidence: 0.95 },
      { target_field: 'AMOUNT', source_field: 'Amount', confidence: 0.94 },
    ],
    rows: [
      ["KKP Short Term Fixed Income Fund", "F1000", "15/07/2026", "17/07/2026", "THB", "14.1718", "2,500", "35,429.50", "BLS", "Fixed Income"],
      ["KKP Ready to Spend Fund", "F1001", "14/07/2026", "16/07/2026", "EUR", "14.1662", "750", "10,624.65", "KKPS", "Property"],
      ["KKP Dividend Stock Fund", "F1002", "05/07/2026", "07/07/2026", "THB", "10.0903", "2,500", "25,225.75", "MBKET", "Property"],
      ["KKP Equity Fund", "", "26/07/2026", "28/07/2026", "", "13.9183", "", "139,183.00", "BLS", "Money Market"],
      ["Global Bond Fund", "F1004", "05/08/2026", "07/08/2026", "THB", "14.2805", "2,500", "35,701.25", "PST", "Money Market"],
      ["KKP Property Fund", "F1005", "05/08/2026", "07/08/2026", "THB", "10.8565", "500", "5,428.25", "KKPS", "Equity"],
      ["KKP Dividend Stock Fund", "F1006", "13/07/2026", "15/07/2026", "THB", "14.8392", "750", "11,129.40", "SCBS", "Equity"],
      ["KKP Ready to Spend Fund", "F1007", "28/08/2026", "30/08/2026", "USD", "10.2864", "10,000", "102,864.00", "KKPS", "Property"],
      ["KKP Money Market Fund", "F1008", "16/08/2026", "18/08/2026", "JPY", "10.7114", "1,000", "10,711.40", "KKPS", "Fixed Income"],
      ["Emerging Market Equity Fund", "F1009", "07/08/2026", "09/08/2026", "THB", "14.8885", "1,000", "14,888.50", "KSS", "Mixed"],
      ["ASEAN Growth Fund", "F1010", "16/08/2026", "18/08/2026", "THB", "11.8321", "2,500", "29,580.25", "PST", "Mixed"],
      ["KKP Ready to Spend Fund", "F1011", "10/07/2026", "12/07/2026", "JPY", "13.5004", "750", "10,125.30", "PST", "Fixed Income"],
      ["KKP Global Growth Fund", "F1012", "29/08/2026", "31/08/2026", "THB", "11.2007", "", "35,842.24", "PST", "Property"],
      ["KKP Balanced Fund", "", "11/08/2026", "13/08/2026", "THB", "10.943", "1,000", "10,943.00", "", "Mixed"],
      ["KKP Dividend Stock Fund", "F1014", "04/08/2026", "06/08/2026", "THB", "10.8292", "750", "8,121.90", "PST", "Mixed"]
    ],
    rowCount: 42,
    colCount: 10,
    note: "",
    mappingSummary: "10 ฟิลด์จับคู่สมบูรณ์ (94.2% Confidence)",
    dupRows: [45, 46]
  },
  custodian_b: {
    id: "custodian_b",
    name: "Custodian_B",
    badge: "Source B",
    headers: ["Fund", "Fund Identifier", "Transaction_Date", "Settle_Date", "Currency", "Net Asset Value", "Quantity", "Trade Amount", "Exec Broker", "Portfolio_Type", "Security_Class"],
    defaultMappings: [
      { target_field: 'FUND_NAME', source_field: 'Fund', confidence: 0.98 },
      { target_field: 'FUND_CODE', source_field: 'Fund Identifier', confidence: 0.97 },
      { target_field: 'TRADE_DATE', source_field: 'Transaction_Date', confidence: 0.96 },
      { target_field: 'SETTLEMENT_DATE', source_field: 'Settle_Date', confidence: 0.95 },
      { target_field: 'CURRENCY', source_field: 'Currency', confidence: 0.99 },
      { target_field: 'UNIT_PRICE', source_field: 'Net Asset Value', confidence: 0.94 },
      { target_field: 'QUANTITY', source_field: 'Quantity', confidence: 0.96 },
      { target_field: 'AMOUNT', source_field: 'Trade Amount', confidence: 0.95 },
    ],
    rows: [
      ["Thai Equity Opportunity Fund", "FID-2000", "2026-07-17", "2026-07-19", "THB", "15.6166", "3,200", "49,973.12", "KSS", "Mixed", "Equity"],
      ["KKP Dividend Stock Fund", "FID-2001", "2026-08-20", "2026-08-22", "THB", "14.2858", "10,000", "142,858.00", "BLS", "Equity", "Stock"],
      ["KKP Ready to Spend Fund", "FID-2002", "2026-07-18", "2026-07-20", "THB", "14.0725", "1,000", "14,072.50", "YUANTA", "Fixed Income", "Bond"],
      ["KKP Global Growth Fund", "FID-2003", "2026-08-16", "2026-08-18", "THB", "14.0205", "10,000", "140,205.00", "KKPS", "Property", "REIT"]
    ],
    rowCount: 35,
    colCount: 11,
    note: "",
    mappingSummary: "11 ฟิลด์จับคู่สมบูรณ์ (91.8% Confidence)",
    dupRows: []
  },
  fund_manager_c: {
    id: "fund_manager_c",
    name: "FundManager_C",
    badge: "Source C",
    headers: ["Fund Name", "Date", "Currency Code", "Unit Price", "Units", "Total Value", "Broker Name", "Value Date", "Category"],
    defaultMappings: [
      { target_field: 'FUND_NAME', source_field: 'Fund Name', confidence: 0.98 },
      { target_field: 'FUND_CODE', source_field: 'UNMATCHED', confidence: 0.0 },
      { target_field: 'TRADE_DATE', source_field: 'Date', confidence: 0.95 },
      { target_field: 'SETTLEMENT_DATE', source_field: 'Value Date', confidence: 0.92 },
      { target_field: 'CURRENCY', source_field: 'Currency Code', confidence: 0.99 },
      { target_field: 'UNIT_PRICE', source_field: 'Unit Price', confidence: 0.96 },
      { target_field: 'QUANTITY', source_field: 'Units', confidence: 0.95 },
      { target_field: 'AMOUNT', source_field: 'Total Value', confidence: 0.94 },
    ],
    rows: [
      ["Emerging Market Equity Fund", "18-Aug-2026", "THB", "14.2377", "10,000", "142,377 THB", "Kiatnakin Phatra Securities", "19-Aug-2026", "Money Market"],
      ["KKP Equity Fund", "07-Jul-2026", "THB", "10.9126", "1,000", "10,912.60", "Phillip Securities Thailand", "08-Jul-2026", "Equity"]
    ],
    rowCount: 25,
    colCount: 9,
    note: "",
    mappingSummary: "9 ฟิลด์จับคู่สมบูรณ์ (95.0% Confidence)",
    dupRows: []
  }
};

const getRowValue = (rowObj: Record<string, any>, fieldName: string): string => {
  if (!rowObj || !fieldName) return '';
  if (rowObj[fieldName] !== undefined && rowObj[fieldName] !== null) {
    return String(rowObj[fieldName]);
  }
  const cleanField = fieldName.trim().toLowerCase();
  for (const k of Object.keys(rowObj)) {
    if (k.trim().toLowerCase() === cleanField) {
      const val = rowObj[k];
      return val !== undefined && val !== null ? String(val) : '';
    }
  }
  return '';
};

export const ExcelPreviewSection: React.FC<ExcelPreviewSectionProps> = ({ onSelectFieldForDrawer }) => {
  const { process, activeSheetName, setActiveSheetName, openDrawer, openChangeModal, setSelectedMapping } = useProcessStore();
  const [activeSheetId, setActiveSheetId] = useState<string>('custodian_a');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'template' | 'source'>('template');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number; val: string }>({
    row: -1,
    col: -1,
    val: '',
  });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  useEffect(() => {
    if (activeSheetName) {
      const foundKey = Object.keys(EXACT_EXCEL_SHEETS).find(
        (key) => EXACT_EXCEL_SHEETS[key as keyof typeof EXACT_EXCEL_SHEETS].name.toLowerCase() === activeSheetName.toLowerCase()
      );
      if (foundKey) {
        setActiveSheetId(foundKey);
      }
    }
  }, [activeSheetName]);

  const currentSheetFallback = EXACT_EXCEL_SHEETS[activeSheetId as keyof typeof EXACT_EXCEL_SHEETS] || EXACT_EXCEL_SHEETS.custodian_a;

  // Active sheet name from store or process
  const currentSheetName = activeSheetName || (process?.sheets?.[0] || 'Custodian_A');
  const sheetData = process?.sheetDataMap?.[currentSheetName];

  // Active headers & rows for current sheet
  const activeHeaders: string[] = useMemo(() => {
    if (sheetData && sheetData.headers && sheetData.headers.length > 0) {
      return sheetData.headers;
    }
    return currentSheetFallback.headers;
  }, [sheetData, currentSheetFallback]);

  const rawRecords: Record<string, any>[] = useMemo(() => {
    let sourceRows: Record<string, any>[] = [];
    if (sheetData && sheetData.rows && sheetData.rows.length > 0) {
      sourceRows = sheetData.rows;
    } else {
      sourceRows = currentSheetFallback.rows.map((rowArr) => {
        const obj: Record<string, any> = {};
        currentSheetFallback.headers.forEach((h, idx) => {
          obj[h] = rowArr[idx] !== undefined ? rowArr[idx] : '';
        });
        return obj;
      });
    }
    return sourceRows.filter((r) => !isFootnoteOrNonDataRow(r, activeHeaders.length));
  }, [sheetData, currentSheetFallback, activeHeaders.length]);

  const sheetMappings: FieldMapping[] = useMemo(() => {
    if (sheetData?.mappings && sheetData.mappings.length > 0) {
      return sheetData.mappings;
    }
    if (process?.mappings && process.mappings.length > 0) {
      return process.mappings;
    }
    // Fallback to default demo mappings if available
    if (currentSheetFallback.defaultMappings) {
      return currentSheetFallback.defaultMappings.map((m, idx) => ({
        id: `demo_${currentSheetFallback.id}_${idx}`,
        process_id: 'proc_demo',
        source_field: m.source_field,
        source_sample: '-',
        source_data_type: 'String',
        target_field: m.target_field,
        target_data_type: 'String',
        target_required: true,
        target_format: '-',
        confidence: m.confidence,
        confidence_level: m.confidence > 0.8 ? 'High' : 'Unmatched',
        status: m.confidence > 0 ? 'ACCEPTED' : 'UNMATCHED',
        reasons: [`จับคู่ตามรูปแบบ ${m.target_field}`],
      }));
    }
    return [];
  }, [sheetData, process?.mappings, currentSheetFallback]);

  // 1. PRIMARY: FIELD TEMPLATE AS BASE COLUMNS
  // Requirements:
  // - Field ตั้งต้น Excel preview ต้องเป็น Field Template
  // - ตามด้วย Field ที่มา Map จากต้นทาง
  // - ถ้าอันไหน Map ไม่ได้ให้เว้นว่างไว้ทั้งแถว หรือขึ้น Unmatch เหมือนตารางจับคู่
  const templateColumnsInfo = useMemo(() => {
    return KKP_MASTER_TEMPLATE_FIELDS.map((tf) => {
      let match = sheetMappings.find(
        (m) => m.target_field && m.target_field.toUpperCase() === tf.key
      );

      // Smart Fallback: Auto match if missing in sheetMappings
      if (!match) {
        const auto = matchTargetToSourceField(tf.key, activeHeaders);
        const isAutoMatched = auto.matchedCol !== 'UNMATCHED';
        match = {
          id: `auto_${tf.key}`,
          process_id: process?.id || 'demo',
          source_field: auto.matchedCol,
          source_sample: '-',
          source_data_type: 'String',
          target_field: tf.key,
          target_data_type: tf.dataType,
          target_required: tf.required,
          target_format: tf.format,
          confidence: isAutoMatched ? 0.95 : 0.0,
          confidence_level: isAutoMatched ? 'High' : 'Unmatched',
          status: isAutoMatched ? 'ACCEPTED' : 'UNMATCHED',
          reasons: [auto.reason],
        };
      }

      const isMatched = !!(match && match.source_field && match.source_field !== 'UNMATCHED');
      return {
        templateField: tf,
        mapping: match || null,
        isMatched,
        sourceField: isMatched ? match!.source_field : null,
        confidence: isMatched ? Math.round((match!.confidence || 0) * 100) : 0,
      };
    });
  }, [sheetMappings, activeHeaders, process?.id]);

  // Rows formatted according to Template Fields
  const templateRows = useMemo(() => {
    return rawRecords.map((rawObj, rowIndex) => {
      const cells = templateColumnsInfo.map((col) => {
        if (!col.isMatched || !col.sourceField) {
          // ถ้าอันไหน Map ไม่ได้ให้เว้นว่างไว้ทั้งแถว
          return '';
        }
        return getRowValue(rawObj, col.sourceField);
      });
      return {
        rowNum: rowIndex + 1,
        cells,
        rawObj,
      };
    });
  }, [rawRecords, templateColumnsInfo]);

  // Rows formatted according to Raw Source Columns (Alternative View)
  const sourceRows = useMemo(() => {
    return rawRecords.map((rawObj, rowIndex) => {
      const cells = activeHeaders.map((h) => getRowValue(rawObj, h));
      return {
        rowNum: rowIndex + 1,
        cells,
        rawObj,
      };
    });
  }, [rawRecords, activeHeaders]);

  const currentDisplayRows = viewMode === 'template' ? templateRows : sourceRows;

  const filteredRows = useMemo(() => {
    if (searchQuery.trim() === '') return currentDisplayRows;
    const q = searchQuery.toLowerCase();
    return currentDisplayRows.filter((r) =>
      r.cells.some((c) => c.toLowerCase().includes(q))
    );
  }, [currentDisplayRows, searchQuery]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const availableSheets: string[] = (process?.sheets && process.sheets.length > 0)
    ? process.sheets
    : (process?.sheetDataMap ? Object.keys(process.sheetDataMap) : [currentSheetName]);

  const totalSheetsCount = availableSheets.length;

  const totalRowsAcrossSheets = useMemo(() => {
    if (process?.sheetDataMap) {
      const sum = Object.values(process.sheetDataMap).reduce((acc, curr) => {
        const validRows = (curr.rows || []).filter(
          (r: any) => !isFootnoteOrNonDataRow(r, (curr.headers || []).length || 8)
        );
        return acc + validRows.length;
      }, 0);
      if (sum > 0) return sum;
    }
    if (process?.row_count && process.row_count > 0) {
      return process.row_count;
    }
    return rawRecords.length;
  }, [process, rawRecords]);

  const currentSheetRowsCount = rawRecords.length;

  const handleSheetSwitch = (sheetName: string) => {
    if (setActiveSheetName) setActiveSheetName(sheetName);
    const foundKey = Object.keys(EXACT_EXCEL_SHEETS).find(
      (k) => EXACT_EXCEL_SHEETS[k as keyof typeof EXACT_EXCEL_SHEETS].name.toLowerCase() === sheetName.toLowerCase()
    );
    if (foundKey) setActiveSheetId(foundKey);
    setCurrentPage(1);
    setSelectedCell({ row: -1, col: -1, val: '' });
  };

  const handleCellClick = (rIdx: number, cIdx: number, val: string) => {
    const rowNum = (currentPage - 1) * pageSize + rIdx + 1;
    setSelectedCell({ row: rowNum, col: cIdx, val });
  };

  const handleHeaderClick = (mapping: FieldMapping | null) => {
    if (!mapping) return;
    if (onSelectFieldForDrawer) {
      onSelectFieldForDrawer(mapping);
    } else if (openDrawer) {
      setSelectedMapping(mapping);
      openDrawer(mapping);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-purple-200/80 overflow-hidden mb-6 transition-all duration-300">
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-[#241744] via-[#35205e] to-[#1c1233] text-white px-5 pt-4 pb-3 border-b border-purple-900/60">
        {/* Row 1: Title & File Context */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-purple-800/40">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 rounded-xl font-extrabold shadow-md flex items-center justify-center flex-shrink-0 ring-2 ring-amber-300/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-extrabold tracking-wide text-white">
                  ตัวอย่างโครงสร้างไฟล์ (Excel Sheet Preview)
                </h2>
                <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Target-First Template
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-purple-200/80 mt-1 flex-wrap font-medium">
                <span>ไฟล์: <strong className="text-white font-mono bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">{process?.file_name || "KKP_Demo_Source_Files.xlsx"}</strong></span>
                <span className="text-purple-400">•</span>
                <span>คอลัมน์หลักตั้งต้นด้วย <strong className="text-amber-300 font-semibold">8 ฟิลด์ Target Template KKP</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Search & Row Count in Fixed Group (Never wraps awkwardly) */}
          <div className="flex items-center gap-2 self-start lg:self-auto flex-shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" />
              <input
                type="text"
                placeholder="ค้นหาข้อมูลในตาราง..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 text-xs bg-purple-950/80 text-white placeholder-purple-300/50 border border-purple-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 w-44 transition"
              />
            </div>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-purple-950/80 text-white text-xs border border-purple-700/60 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value={10}>10 แถว</option>
              <option value={15}>15 แถว</option>
              <option value={25}>25 แถว</option>
              <option value={50}>50 แถว</option>
            </select>
          </div>
        </div>

        {/* Row 2: Sheet Tabs Bar & View Mode Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
          {/* Sheet Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1">
            {availableSheets.map((sName) => {
              const isActive = activeSheetName ? sName === activeSheetName : (sName === availableSheets[0]);
              const curMappings = process?.sheetDataMap?.[sName]?.mappings || process?.mappings || [];
              const matchedCount = curMappings.filter(m => m.target_field && m.target_field !== "UNMATCHED").length;
              const sRowCount = process?.sheetDataMap?.[sName]?.rows?.length || rawRecords.length;

              return (
                <button
                  key={sName}
                  onClick={() => handleSheetSwitch(sName)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 flex-shrink-0 border ${
                    isActive
                      ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black ring-2 ring-amber-300/50"
                      : "bg-purple-950/60 text-purple-200 border-purple-800/60 hover:bg-purple-900/80 hover:text-white"
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate max-w-[150px]">{sName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                      isActive ? "bg-slate-950 text-amber-300" : "bg-purple-900/80 text-purple-300"
                    }`}
                  >
                    {matchedCount || 8}/8 ฟิลด์ ({sRowCount.toLocaleString()} แถว)
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle Button Group */}
          <div className="flex items-center bg-purple-950/80 p-1 rounded-xl border border-purple-700/60 flex-shrink-0">
            <button
              onClick={() => { setViewMode('template'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'template'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-purple-200 hover:text-white'
              }`}
              title="คอลัมน์ตั้งต้นด้วย Field Template มาตรฐาน KKP 8 ฟิลด์"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Target Template (8 ฟิลด์)</span>
            </button>
            <button
              onClick={() => { setViewMode('source'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'source'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'text-purple-200 hover:text-white'
              }`}
              title="แสดงตามคอลัมน์ดิบที่อยู่ในไฟล์ต้นทาง"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>คอลัมน์ต้นทางดิบ ({activeHeaders.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sheet Summary Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {(() => {
          const matchedCount = templateColumnsInfo.filter((c) => c.isMatched).length;
          const conf = process?.overall_confidence ? Math.round(process.overall_confidence * 100) : 95;

          return (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500">แผ่นงาน:</span>
                <span className="font-extrabold text-purple-950 bg-purple-100/80 px-2.5 py-0.5 rounded-md text-xs border border-purple-200">
                  {currentSheetName}
                </span>
              </div>
              <div className="h-3.5 w-px bg-slate-300 hidden sm:block" />
              <div className="flex items-center gap-2 text-slate-700">
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ จับคู่สำเร็จ {matchedCount}/{templateColumnsInfo.length} ฟิลด์
                </span>
                <span className="text-slate-500 font-medium">
                  (คอลัมน์ต้นทาง {activeHeaders.length} ฟิลด์ • ข้อมูล {currentSheetRowsCount.toLocaleString()} แถว • ความแม่นยำ AI {conf}%)
                </span>
              </div>
            </div>
          );
        })()}

        {selectedCell.row !== -1 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1 rounded-lg font-mono text-xs shadow-2xs">
            <span className="font-bold text-amber-950">เซลล์ที่เลือก (แถว {selectedCell.row}):</span>
            <span className="truncate max-w-xs font-semibold">{selectedCell.val || '(ค่าว่าง)'}</span>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto max-h-[500px] border-b border-slate-200">
        <table className="w-full border-collapse text-left text-xs font-sans">
          <thead className="bg-[#2e1d52] text-white sticky top-0 z-20 shadow-md">
            {viewMode === 'template' ? (
              <>
                {/* Row 1: Field Template (ฟิลด์ตั้งต้นมาตรฐาน KKP) */}
                <tr className="border-b border-purple-800 font-bold text-[11px]">
                  <th className="py-2.5 px-3 text-center w-28 bg-[#1f1338] border-r border-purple-800 text-amber-300 select-none font-black text-[10px] uppercase tracking-wider">
                    Target Field (Template)
                  </th>

                  {templateColumnsInfo.map(({ templateField: tf, mapping }) => (
                    <th
                      key={tf.key}
                      onClick={() => handleHeaderClick(mapping)}
                      className="py-2 px-3 border-r border-purple-800/80 cursor-pointer hover:bg-purple-900 transition group select-none min-w-[150px]"
                      title="คลิกเพื่อปรับการจับคู่ฟิลด์นี้"
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-amber-300 text-xs tracking-wider group-hover:text-amber-200">
                            {tf.key}
                          </span>
                          {tf.required && (
                            <span className="text-[9px] bg-rose-500/30 text-rose-300 border border-rose-500/50 px-1 py-0.2 rounded font-bold">
                              จำเป็น
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-purple-200 font-mono bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-700/60">
                          {tf.dataType}
                        </span>
                      </div>
                      <div className="text-[10px] text-purple-200/80 font-normal truncate">
                        {tf.description}
                      </div>
                    </th>
                  ))}
                </tr>

                {/* Row 2: Field ที่มา Map จากต้นทาง (ถ้าอันไหน Map ไม่ได้ให้ขึ้น UNMATCHED) */}
                <tr className="bg-[#190f2d] text-[10px] font-mono border-b-2 border-amber-400">
                  <th className="py-1.5 px-3 text-center text-purple-300 bg-[#160d28] border-r border-purple-800 font-black text-[10px]">
                    Mapped Source (ต้นทาง)
                  </th>

                  {templateColumnsInfo.map(({ templateField: tf, mapping, isMatched, sourceField, confidence }) => (
                    <td
                      key={tf.key}
                      onClick={() => handleHeaderClick(mapping)}
                      className="py-1.5 px-3 border-r border-purple-800/60 cursor-pointer hover:bg-purple-900/80 transition"
                      title="คลิกเพื่อเปลี่ยนคอลัมน์ต้นทาง"
                    >
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <div className="flex items-center gap-1.5 font-bold truncate">
                          {isMatched ? (
                            <>
                              <span className="text-emerald-400 font-black text-xs">←</span>
                              <span className="text-white truncate font-semibold" title={`แมปจากคอลัมน์: ${sourceField}`}>
                                {sourceField}
                              </span>
                            </>
                          ) : (
                            <span className="text-rose-400 font-bold italic flex items-center gap-1">
                              <span>⚠️</span> UNMATCHED
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${
                            isMatched && confidence >= 90
                              ? "bg-emerald-500 text-white"
                              : isMatched && confidence >= 75
                              ? "bg-amber-400 text-slate-950 font-black"
                              : isMatched
                              ? "bg-orange-500 text-white"
                              : "bg-rose-900/90 text-rose-200 border border-rose-700 font-bold"
                          }`}
                        >
                          {isMatched ? `${confidence}%` : "0%"}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>
              </>
            ) : (
              // Source Columns View (Optional)
              <>
                <tr className="border-b border-purple-800 font-bold text-[11px]">
                  <th className="py-2.5 px-2 text-center w-12 bg-[#23153e] border-r border-purple-800/80 text-purple-300 select-none">
                    #
                  </th>
                  {activeHeaders.map((colHeader, cIdx) => (
                    <th
                      key={cIdx}
                      className="py-2.5 px-3 border-r border-purple-800/80 font-extrabold text-purple-100 select-none min-w-[130px]"
                    >
                      {colHeader}
                    </th>
                  ))}
                </tr>
              </>
            )}
          </thead>

          <tbody className="bg-white divide-y divide-slate-200 text-slate-800 font-mono text-[11px]">
            {paginatedRows.length > 0 ? (
              paginatedRows.map((rowItem, rIdxOnPage) => {
                const actualRowNum = (currentPage - 1) * pageSize + rIdxOnPage + 1;
                const isCellSelectedRow = selectedCell.row === actualRowNum;

                return (
                  <tr
                    key={rIdxOnPage}
                    className="hover:bg-slate-100/80 transition-colors"
                  >
                    <td className="py-1.5 px-3 text-center font-bold border-r border-slate-300 select-none text-[11px] sticky left-0 z-10 bg-slate-100 text-slate-500">
                      {actualRowNum}
                    </td>

                    {rowItem.cells.map((cellVal, cIdx) => {
                      const colInfo = viewMode === 'template' ? templateColumnsInfo[cIdx] : null;
                      const isSelected = isCellSelectedRow && selectedCell.col === cIdx;
                      const isEmpty = !cellVal || cellVal.trim() === '';
                      const isUnmatched = viewMode === 'template' && colInfo ? !colInfo.isMatched : false;
                      const isNumber = !isEmpty && !isNaN(Number(cellVal.replace(/,/g, '')));

                      return (
                        <td
                          key={cIdx}
                          onClick={() => handleCellClick(rIdxOnPage, cIdx, cellVal)}
                          className={`py-1.5 px-3 border-r border-slate-200 cursor-cell transition-all ${
                            isNumber ? 'text-right font-mono font-medium' : 'text-left'
                          } ${
                            isSelected
                              ? 'bg-emerald-100/90 ring-2 ring-emerald-600 font-bold text-slate-900 z-10 relative'
                              : isUnmatched
                              ? 'bg-rose-50/50 text-rose-900/40 text-center font-sans select-none'
                              : isEmpty
                              ? 'bg-amber-50/40 text-amber-700/60 text-center font-sans select-none'
                              : rIdxOnPage % 2 === 0
                              ? 'bg-white text-slate-900'
                              : 'bg-slate-50/60 text-slate-900'
                          }`}
                        >
                          {isUnmatched ? (
                            <span className="text-rose-400/80 text-[10px] italic font-semibold select-none">
                              (Unmatched / ว่าง)
                            </span>
                          ) : isEmpty ? (
                            <span className="text-amber-600/70 italic text-[10px] font-sans select-none">
                              (ค่าว่าง)
                            </span>
                          ) : (
                            cellVal
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={(viewMode === 'template' ? templateColumnsInfo.length : activeHeaders.length) + 1}
                  className="text-center py-12 text-slate-400 italic bg-slate-50 font-sans"
                >
                  {searchQuery ? `ไม่พบข้อมูลที่ตรงกับ "${searchQuery}"` : 'ไม่พบข้อมูลแถวในชีทนี้'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-slate-200 border-t border-slate-300 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4 text-[11px] font-medium text-slate-600">
          <span className="flex items-center gap-1 text-emerald-800 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> READY
          </span>
          <span className="hidden sm:inline text-slate-500">
            แผ่นงาน: <strong className="text-slate-800">{totalSheetsCount} {totalSheetsCount === 1 ? 'Sheet' : 'Sheets'}</strong>
          </span>
          <span className="hidden md:inline text-slate-500">
            รวมทุกชีท: <strong className="text-purple-950 font-bold">{totalRowsAcrossSheets.toLocaleString()} แถวข้อมูล</strong> <span className="text-[10px] text-slate-500">(ชีทปัจจุบัน: {currentSheetRowsCount.toLocaleString()} แถว)</span>
          </span>
          <span className="hidden lg:inline text-purple-900 font-bold bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
            ฟิลด์ Template: {templateColumnsInfo.length} ฟิลด์ (จับคู่สำเร็จ: {templateColumnsInfo.filter(c => c.isMatched).length} ฟิลด์)
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-2 py-0.5 rounded bg-slate-300 hover:bg-slate-400 text-slate-800 disabled:opacity-30 text-[10px] font-bold"
          >
            ◄ ก่อนหน้า
          </button>
          <span className="font-bold text-slate-700 text-[11px]">
            {currentPage}/{totalPages} หน้า
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-0.5 rounded bg-slate-300 hover:bg-slate-400 text-slate-800 disabled:opacity-30 text-[10px] font-bold"
          >
            ถัดไป ►
          </button>
        </div>
      </div>
    </div>
  );
};
