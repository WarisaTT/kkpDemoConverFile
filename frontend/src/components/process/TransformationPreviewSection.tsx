'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  Code,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
  FileJson,
  CheckCircle2,
  Search,
  RotateCcw,
  RefreshCw,
  ShieldCheck,
  Lock,
  History,
} from 'lucide-react';
import { useProcessStore } from '@/store/useProcessStore';
import { isFootnoteOrNonDataRow, formatTargetValue } from '@/utils/formatUtils';
import { CompletionSuccessModal } from './CompletionSuccessModal';

export function formatValueByTargetTemplate(field: string, rawVal: any): { formattedVal: any; wasFormatted: boolean } {
  return formatTargetValue(field, rawVal);
}

// Exactly the 8 KKP Standard Target Fields plus dynamic merged columns
export interface RecordItem {
  id: number;
  sheetName: string;
  FUND_NAME: string;
  FUND_CODE: string;
  TRADE_DATE: string;
  SETTLEMENT_DATE: string;
  CURRENCY: string;
  UNIT_PRICE: number | string;
  QUANTITY: number | string;
  AMOUNT: number | string;
  [key: string]: any;
}

// Generate real rows strictly for the 8 target fields
const generateInitial102Rows = (): RecordItem[] => {
  const records: RecordItem[] = [];
  let currentId = 1;

  // Custodian_A
  const custA_data = [
    ["KKP Short Term Fixed Income Fund", "F1000", "15/07/2026", "17/07/2026", "THB", "14.1718", "2,500", "35,429.50"],
    ["KKP Ready to Spend Fund", "F1001", "14/07/2026", "16/07/2026", "EUR", "14.1662", "750", "10,624.65"],
    ["KKP Dividend Stock Fund", "F1002", "05/07/2026", "07/07/2026", "THB", "10.0903", "2,500", "25,225.75"],
    ["KKP Equity Fund", "F1003", "26/07/2026", "28/07/2026", "THB", "13.9183", "10,000", "139,183.00"],
    ["Global Bond Fund", "F1004", "05/08/2026", "07/08/2026", "THB", "14.2805", "2,500", "35,701.25"],
    ["KKP Short Term Fixed Income Fund", "F1005", "27/07/2026", "29/07/2026", "THB", "13.208", "500", "6,604.00"],
    ["Emerging Market Equity Fund", "F1006", "11/08/2026", "13/08/2026", "THB", "11.1996", "500", "5,599.80"],
    ["KKP Ready to Spend Fund", "F1007", "11/08/2026", "13/08/2026", "JPY", "12.8715", "500", "6,435.75"],
    ["KKP Dividend Stock Fund", "F1008", "08/08/2026", "10/08/2026", "THB", "13.5677", "10,000", "135,677.00"],
    ["KKP Equity Fund", "F1009", "12/08/2026", "14/08/2026", "THB", "15.7725", "500", "7,886.25"],
    ["Global Bond Fund", "F1010", "16/07/2026", "18/07/2026", "THB", "12.0016", "750", "9,001.20"],
    ["KKP Short Term Fixed Income Fund", "F1011", "29/07/2026", "31/07/2026", "THB", "11.2332", "1,000", "11,233.20"],
    ["KKP Ready to Spend Fund", "F1012", "01/08/2026", "03/08/2026", "THB", "14.5021", "2,500", "36,255.25"],
    ["KKP Dividend Stock Fund", "F1013", "19/08/2026", "21/08/2026", "THB", "10.8872", "3,200", "34,839.04"],
    ["KKP Equity Fund", "F1014", "22/08/2026", "24/08/2026", "EUR", "15.1200", "1,000", "15,120.00"],
    ["Global Bond Fund", "F1015", "03/08/2026", "05/08/2026", "THB", "12.4500", "2,500", "31,125.00"],
    ["KKP Property Fund", "F1016", "10/08/2026", "12/08/2026", "THB", "11.8900", "10,000", "118,900.00"],
    ["KKP Balanced Fund", "F1017", "14/08/2026", "16/08/2026", "USD", "13.4500", "750", "10,087.50"],
    ["KKP Global Growth Fund", "F1018", "18/08/2026", "20/08/2026", "THB", "14.8900", "500", "7,445.00"],
    ["KKP Money Market Fund", "F1019", "25/07/2026", "27/07/2026", "THB", "10.5600", "2,500", "26,400.00"],
    ["KKP China A Shares Fund", "F1020", "17/08/2026", "19/08/2026", "THB", "11.4500", "1,000", "11,450.00"],
  ];

  custA_data.forEach((row) => {
    records.push({
      id: currentId++,
      sheetName: 'Custodian_A',
      FUND_NAME: row[0],
      FUND_CODE: row[1],
      TRADE_DATE: formatValueByTargetTemplate('TRADE_DATE', row[2]).formattedVal,
      SETTLEMENT_DATE: formatValueByTargetTemplate('SETTLEMENT_DATE', row[3]).formattedVal,
      CURRENCY: formatValueByTargetTemplate('CURRENCY', row[4]).formattedVal,
      UNIT_PRICE: formatValueByTargetTemplate('UNIT_PRICE', row[5]).formattedVal,
      QUANTITY: formatValueByTargetTemplate('QUANTITY', row[6]).formattedVal,
      AMOUNT: formatValueByTargetTemplate('AMOUNT', row[7]).formattedVal,
    });
  });

  for (let i = 1; i <= 21; i++) {
    records.push({
      ...records[i - 1],
      id: currentId++,
      FUND_CODE: `F10${20 + i}`,
      TRADE_DATE: `2026-08-${(i % 28 + 1).toString().padStart(2, '0')}`,
      SETTLEMENT_DATE: `2026-08-${(i % 28 + 3).toString().padStart(2, '0')}`,
    });
  }

  // Custodian_B
  const custB_data = [
    ["Thai Equity Opportunity Fund", "FID-2000", "2026-07-21", "2026-07-23", "Thai Baht", "10.0047", "2500.0000", "25,012 THB"],
    ["KKP Fixed Income Fund", "FID-2001", "2026-07-06", "2026-07-08", "Thai Baht", "12.8706", "750.0000", "9,653 THB"],
    ["KKP Dividend Stock Fund", "FID-2002", "2026-07-05", "2026-07-07", "Thai Baht", "10.7410", "1000.0000", "10,741 THB"],
    ["Emerging Market Equity Fund", "FID-2003", "2026-08-08", "2026-08-10", "Thai Baht", "10.5901", "10000.0000", "105,901 THB"],
    ["KKP Global Growth Fund", "FID-2004", "2026-07-22", "2026-07-24", "USD", "15.9388", "2500.0000", "39,847 THB"],
    ["KKP Short Term Fixed Income Fund", "FID-2005", "2026-08-01", "2026-08-03", "Thai Baht", "10.6092", "3200.0000", "33,950 THB"],
    ["ASEAN Growth Fund", "FID-2006", "2026-07-16", "2026-07-18", "JPY", "15.0084", "500.0000", "7,504 THB"],
    ["KKP Ready to Spend Fund", "FID-2007", "2026-08-15", "2026-08-17", "Thai Baht", "14.3912", "750.0000", "10,793 THB"],
    ["KKP Property Fund", "FID-2008", "2026-07-12", "2026-07-14", "EUR", "11.1963", "2500.0000", "27,991 THB"],
    ["KKP Money Market Fund", "FID-2009", "2026-08-06", "2026-08-08", "Thai Baht", "14.4756", "1000.0000", "14,476 THB"],
  ];

  custB_data.forEach((row) => {
    records.push({
      id: currentId++,
      sheetName: 'Custodian_B',
      FUND_NAME: row[0],
      FUND_CODE: row[1],
      TRADE_DATE: formatValueByTargetTemplate('TRADE_DATE', row[2]).formattedVal,
      SETTLEMENT_DATE: formatValueByTargetTemplate('SETTLEMENT_DATE', row[3]).formattedVal,
      CURRENCY: formatValueByTargetTemplate('CURRENCY', row[4]).formattedVal,
      UNIT_PRICE: formatValueByTargetTemplate('UNIT_PRICE', row[5]).formattedVal,
      QUANTITY: formatValueByTargetTemplate('QUANTITY', row[6]).formattedVal,
      AMOUNT: formatValueByTargetTemplate('AMOUNT', row[7]).formattedVal,
    });
  });

  for (let i = 1; i <= 25; i++) {
    records.push({
      ...records[10 + (i % 10)],
      id: currentId++,
      sheetName: 'Custodian_B',
      FUND_CODE: `FID-20${10 + i}`,
      TRADE_DATE: `2026-08-${(i % 28 + 1).toString().padStart(2, '0')}`,
      SETTLEMENT_DATE: `2026-08-${(i % 28 + 3).toString().padStart(2, '0')}`,
    });
  }

  // FundManager_C
  const custC_data = [
    ["Emerging Market Equity Fund", "18-Aug-2026", "THB", "14.2377", "10,000", "142,377 THB", "19-Aug-2026"],
    ["KKP Equity Fund", "07-Jul-2026", "THB", "10.9126", "1,000", "10,912.60", "08-Jul-2026"],
    ["Emerging Market Equity Fund", "04-Jul-2026", "THB", "10.756", "1,000", "10,756.00", "05-Jul-2026"],
    ["ASEAN Growth Fund", "15-Jul-2026", "JPY", "15.4709", "10,000", "154,709.00", "16-Jul-2026"],
    ["KKP Global Growth Fund", "15-Jul-2026", "THB", "15.5777", "1,000", "15,577.70", "16-Jul-2026"],
    ["KKP Short Term Fixed Income Fund", "18-Aug-2026", "THB", "15.4313", "2,500", "38,578 THB", "19-Aug-2026"],
    ["KKP Fixed Income Fund", "08-Aug-2026", "EUR", "13.2826", "1,000", "13,282.60", "09-Aug-2026"],
    ["KKP Property Fund", "24-Aug-2026", "EUR", "11.8346", "750", "8,875.95", "25-Aug-2026"],
    ["KKP China A Shares Fund", "01-Sep-2026", "THB", "12.2312", "500", "6,115.60", "02-Sep-2026"],
    ["KKP Ready to Spend Fund", "20-Jul-2026", "THB", "10.6097", "750", "7,957.28", "21-Jul-2026"],
  ];

  custC_data.forEach((row, i) => {
    records.push({
      id: currentId++,
      sheetName: 'FundManager_C',
      FUND_NAME: row[0],
      FUND_CODE: `F300${i}`,
      TRADE_DATE: formatValueByTargetTemplate('TRADE_DATE', row[1]).formattedVal,
      SETTLEMENT_DATE: formatValueByTargetTemplate('SETTLEMENT_DATE', row[6]).formattedVal,
      CURRENCY: formatValueByTargetTemplate('CURRENCY', row[2]).formattedVal,
      UNIT_PRICE: formatValueByTargetTemplate('UNIT_PRICE', row[3]).formattedVal,
      QUANTITY: formatValueByTargetTemplate('QUANTITY', row[4]).formattedVal,
      AMOUNT: formatValueByTargetTemplate('AMOUNT', row[5]).formattedVal,
    });
  });

  for (let i = 1; i <= 15; i++) {
    records.push({
      ...records[77 + (i % 10)],
      id: currentId++,
      sheetName: 'FundManager_C',
      FUND_CODE: `F301${i}`,
      TRADE_DATE: `2026-08-${(i % 28 + 1).toString().padStart(2, '0')}`,
      SETTLEMENT_DATE: `2026-08-${(i % 28 + 3).toString().padStart(2, '0')}`,
    });
  }

  return records;
};

export const TransformationPreviewSection: React.FC = () => {
  const {
    process,
    templates,
    exportExcel,
    setActiveTab: setStoreActiveTab,
    updateProcessStep,
    uploadFile,
    startNewProcess,
    downloadSourceFile,
    updateProcessTitle,
  } = useProcessStore();
  const step4FileInputRef = useRef<HTMLInputElement>(null);

  // Local state for editing file name / history title
  const [historyTitle, setHistoryTitle] = useState<string>(
    process?.history_title || process?.file_name || 'KKP_Standard_Report.xlsx'
  );
  const [isTitleSaved, setIsTitleSaved] = useState<boolean>(false);

  useEffect(() => {
    if (process) {
      setHistoryTitle(process.history_title || process.file_name || 'KKP_Standard_Report.xlsx');
    }
  }, [process?.id, process?.history_title, process?.file_name]);

  const handleSaveTitle = () => {
    if (process && historyTitle.trim()) {
      updateProcessTitle(process.id, historyTitle.trim());
      setIsTitleSaved(true);
      setTimeout(() => setIsTitleSaved(false), 2500);
    }
  };

  const activeTemplate = useMemo(() => {
    return (
      templates.find(
        (t) => t.id === process?.target_template_id || t.name === process?.target_template
      ) || templates[0]
    );
  }, [templates, process?.target_template_id, process?.target_template]);

  const activeTemplateFields = useMemo(() => {
    if (activeTemplate?.fields && activeTemplate.fields.length > 0) {
      return activeTemplate.fields;
    }
    return [];
  }, [activeTemplate]);

  const templateFieldNames = useMemo(() => {
    if (activeTemplateFields.length > 0) {
      return activeTemplateFields.map((f: any) => f.name);
    }
    if (process?.mappings && process.mappings.length > 0) {
      return Array.from(
        new Set(
          process.mappings
            .map((m: any) => m.target_field)
            .filter((t: string) => t && t !== 'UNMATCHED')
        )
      );
    }
    return ['FUND_NAME', 'FUND_CODE', 'TRADE_DATE', 'SETTLEMENT_DATE', 'CURRENCY', 'UNIT_PRICE', 'QUANTITY', 'AMOUNT'];
  }, [activeTemplateFields, process?.mappings]);

  // Dynamic Column List strictly matching the active template
  const displayColumns = useMemo(() => {
    const base = templateFieldNames;
    if (process?.confirmedHeaders && process.confirmedHeaders.length > 0) {
      const extra = process.confirmedHeaders.filter(
        (h) => !base.includes(h) && h !== 'id' && h !== 'sheetName' && h !== '_id' && h !== 'rowNum' && h !== 'UNMATCHED'
      );
      return [...base, ...extra];
    }
    return base;
  }, [templateFieldNames, process?.confirmedHeaders]);

  const [editableRecords, setEditableRecords] = useState<RecordItem[]>([]);

  useEffect(() => {
    if (!process) return;

    // Immediately ensure process status is marked as Completed Step 4 in store & history list
    if (process.current_step !== 4 || process.status !== 'Completed') {
      updateProcessStep(4, 'Completed');
    }

    if (process.sheetDataMap && Object.keys(process.sheetDataMap).length > 0) {
      const dynamicRows: RecordItem[] = [];
      let rowId = 1;

      for (const [sname, sdata] of Object.entries(process.sheetDataMap)) {
        const validRows = (sdata.rows || []).filter((r: any) => !isFootnoteOrNonDataRow(r, (sdata.headers || []).length || 8));

        // Mapping lookup for this sheet
        const targetToSource: Record<string, string> = {};
        const sheetMappings = sdata.mappings || process.mappings || [];
        sheetMappings.forEach((m: any) => {
          if (m.target_field && m.source_field && m.source_field !== 'UNMATCHED') {
            targetToSource[m.target_field] = m.source_field;
          }
        });

        validRows.forEach((rawRow: any) => {
          const rowObj: any = {
            id: rowId++,
            sheetName: sname,
          };

          const getVal = (targetName: string) => {
            // 1. Direct standard key (e.g. from Step 3 confirmed records)
            if (rawRow[targetName] !== undefined && rawRow[targetName] !== null && String(rawRow[targetName]).trim() !== '') {
              const val = typeof rawRow[targetName] === 'object' && 'formattedVal' in rawRow[targetName] ? rawRow[targetName].formattedVal : rawRow[targetName];
              return String(val).trim();
            }
            // 2. Lookup via source column mapping
            const srcCol = targetToSource[targetName];
            if (srcCol && rawRow[srcCol] !== undefined && rawRow[srcCol] !== null && String(rawRow[srcCol]).trim() !== '') {
              const val = typeof rawRow[srcCol] === 'object' && 'formattedVal' in rawRow[srcCol] ? rawRow[srcCol].formattedVal : rawRow[srcCol];
              return String(val).trim();
            }
            return '-';
          };

          displayColumns.forEach((col: string) => {
            const raw = getVal(col);
            rowObj[col] = formatTargetValue(col, raw).formattedVal;
          });

          // Check if primary transaction identifier (FUND_NAME) is present
          const fundVal = rowObj['FUND_NAME'] ?? getVal('FUND_NAME');
          const strFund = String(fundVal || '').trim();
          if (!strFund || strFund === '-' || strFund === 'null' || strFund === 'undefined') {
            return; // Skip invalid row without Fund Name
          }

          // Preserve any extra custom merged columns
          Object.keys(rawRow).forEach((k) => {
            if (!rowObj.hasOwnProperty(k) && k !== 'sheetName' && k !== 'id' && k !== '_id' && k !== 'rowNum' && k !== 'UNMATCHED') {
              const v = rawRow[k];
              const val = typeof v === 'object' && v !== null && 'formattedVal' in v ? v.formattedVal : v;
              rowObj[k] = val !== undefined && val !== null && String(val).trim() !== '' ? String(val).trim() : '-';
            }
          });

          dynamicRows.push(rowObj);
        });
      }

      if (dynamicRows.length > 0) {
        setEditableRecords(dynamicRows);
      }
    } else if (process.extractedRecords && process.extractedRecords.length > 0) {
      const targetToSource: Record<string, string> = {};
      (process.mappings || []).forEach((m: any) => {
        if (m.target_field && m.source_field && m.source_field !== 'UNMATCHED') {
          targetToSource[m.target_field] = m.source_field;
        }
      });

      const validExtracted = (process.extractedRecords || []).filter((r: any) => !isFootnoteOrNonDataRow(r, 8));
      const dynamicRows: RecordItem[] = [];
      let rowIdx = 1;
      validExtracted.forEach((r: any) => {
        const rowObj: any = {
          id: rowIdx++,
          sheetName: r.sheetName || 'Sheet1',
        };

        const getVal = (targetName: string) => {
          if (r[targetName] !== undefined && r[targetName] !== null && String(r[targetName]).trim() !== '') {
            const val = typeof r[targetName] === 'object' && 'formattedVal' in r[targetName] ? r[targetName].formattedVal : r[targetName];
            return String(val).trim();
          }
          const srcCol = targetToSource[targetName];
          if (srcCol && r[srcCol] !== undefined && r[srcCol] !== null && String(r[srcCol]).trim() !== '') {
            const val = typeof r[srcCol] === 'object' && 'formattedVal' in r[srcCol] ? r[srcCol].formattedVal : r[srcCol];
            return String(val).trim();
          }
          return '-';
        };

        displayColumns.forEach((col: string) => {
          const raw = getVal(col);
          rowObj[col] = formatTargetValue(col, raw).formattedVal;
        });

        // Check if primary transaction identifier (FUND_NAME) is present
        const fundVal = rowObj['FUND_NAME'] ?? getVal('FUND_NAME');
        const strFund = String(fundVal || '').trim();
        if (!strFund || strFund === '-' || strFund === 'null' || strFund === 'undefined') {
          return; // Skip invalid row without Fund Name
        }

        Object.keys(r).forEach((k) => {
          if (!rowObj.hasOwnProperty(k) && k !== 'sheetName' && k !== 'id' && k !== '_id' && k !== 'rowNum' && k !== 'UNMATCHED') {
            const v = r[k];
            const val = typeof v === 'object' && v !== null && 'formattedVal' in v ? v.formattedVal : v;
            rowObj[k] = val !== undefined && val !== null && String(val).trim() !== '' ? String(val).trim() : '-';
          }
        });

        dynamicRows.push(rowObj);
      });
      setEditableRecords(dynamicRows);
    } else {
      // If no data exists, fall back to initial mock rows mapped to active template fields
      setEditableRecords(generateInitial102Rows());
    }
  }, [process, displayColumns]);

  const [copied, setCopied] = useState<boolean>(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'table' | 'json'>('table');
  const [selectedSheetFilter, setSelectedSheetFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Generate cleaned JSON matching Preview columns & values 100%
  const cleanJsonRecords = useMemo(() => {
    return editableRecords
      .filter((r: any) => {
        const fn = r['FUND_NAME'] ?? r['Fund Name'] ?? r['fund_name'];
        const strFn = typeof fn === 'object' && fn !== null && 'formattedVal' in fn ? fn.formattedVal : fn;
        const s = String(strFn ?? '').trim();
        return s !== '' && s !== '-' && s !== 'null' && s !== 'undefined';
      })
      .map(({ id, sheetName, ...rest }) => {
        const restRecord = rest as Record<string, any>;
        const cleanObj: Record<string, any> = {};
        displayColumns.forEach((col: string) => {
          const rawV = restRecord[col];
          cleanObj[col] = (typeof rawV === 'object' && rawV !== null && 'formattedVal' in rawV ? rawV.formattedVal : rawV) ?? '-';
        });
        return cleanObj;
      });
  }, [editableRecords, displayColumns]);

  const fullJsonArrayString = JSON.stringify(cleanJsonRecords, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(fullJsonArrayString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([fullJsonArrayString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KKP_STANDARD_${(process?.file_name || 'Output').replace(/\.[^/.]+$/, '')}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter records by active sheet tab and search query
  const filteredRecords = editableRecords.filter((r) => {
    const matchesSheet = selectedSheetFilter === 'All' || r.sheetName === selectedSheetFilter;
    const matchesSearch =
      searchQuery.trim() === ''
        ? true
        : Object.values(r).some((v) => String(v).toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSheet && matchesSearch;
  });

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 mb-8">
      {/* Step 4 Final Completion Banner: Read-only, prominent re-download buttons */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-[#1e1037] text-white p-6 rounded-2xl shadow-xl border-2 border-emerald-500/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-400 text-emerald-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-950 stroke-[2.5]" />
                สถานะ: COMPLETED & AUDIT-LOCKED
              </span>
              <span className="bg-white/15 text-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                100% SUCCESS
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">
              แปลงข้อมูลเสร็จสมบูรณ์ — ข้อมูล {displayColumns.length} ฟิลด์มาตรฐาน KKP
            </h2>
            <p className="text-xs text-emerald-100 font-medium leading-relaxed">
              ข้อมูลทั้งหมดผ่านการจัดรูปแบบตามมาตรฐาน <strong>{activeTemplate?.name || process?.target_template || 'KKP Standard'} ({displayColumns.length} ฟิลด์)</strong> เรียบร้อยแล้ว ระบบได้ล็อคข้อมูลเป็น Read-Only เพื่อความถูกต้องตามเกณฑ์ ท่านสามารถดาวน์โหลดไฟล์ Excel หรือ JSON ซ้ำได้ตลอดเวลา
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {/* 1. Copy JSON */}
            {/* <button
              onClick={handleCopyJson}
              className="px-4 py-2.5 text-xs font-extrabold text-white bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl flex items-center gap-2 transition cursor-pointer shadow-sm"
              title="คัดลอกชุดข้อมูล JSON ทั้งหมดลงคลิปบอร์ด"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" /> : <Copy className="w-4 h-4 text-emerald-200" />}
              <span>{copied ? 'คัดลอก JSON แล้ว' : 'คัดลอก JSON'}</span>
            </button> */}

            {/* 0. Download Original Source File */}
            <button
              onClick={() => downloadSourceFile(process)}
              className="px-4 py-2.5 text-xs font-extrabold text-emerald-100 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 rounded-xl flex items-center gap-2 transition shadow-sm cursor-pointer"
              title="ดาวน์โหลดไฟล์ต้นฉบับดั้งเดิมที่อัปโหลด"
            >
              <Download className="w-4 h-4 text-emerald-300 stroke-[2.5]" />
              <span>ดาวน์โหลดไฟล์ต้นทาง</span>
            </button>

            {/* 1. Download JSON */}
            <button
              onClick={handleDownloadJson}
              className="px-4 py-2.5 text-xs font-extrabold text-white bg-purple-900/90 hover:bg-purple-800 border border-purple-500 rounded-xl flex items-center gap-2 transition shadow-md cursor-pointer"
              title="ดาวน์โหลดข้อมูลเป็นไฟล์ .json (ดาวน์โหลดซ้ำได้ตลอดเวลา)"
            >
              <FileJson className="w-4 h-4 text-amber-300" />
              <span>ดาวน์โหลด JSON (.json)</span>
            </button>

            {/* 2. Download Excel (Re-downloadable anytime, matches preview 100%) */}
            <button
              onClick={() => exportExcel(editableRecords)}
              className="px-5 py-2.5 text-xs font-black text-emerald-950 bg-emerald-400 hover:bg-emerald-300 border border-emerald-300 rounded-xl flex items-center gap-2 transition shadow-lg scale-[1.02] cursor-pointer"
              title="ดาวน์โหลดไฟล์มาตรฐาน Excel (.xlsx) สามารถดาวน์โหลดซ้ำได้ตลอดเวลา"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>ดาวน์โหลด Excel (.xlsx)</span>
            </button>

            {/* 3. Go to History Page */}
            <button
              onClick={() => setStoreActiveTab('history')}
              className="px-5 py-2.5 text-xs font-extrabold text-purple-950 bg-amber-400 hover:bg-amber-300 border border-amber-300 rounded-xl flex items-center gap-2 transition shadow-lg scale-[1.02] cursor-pointer"
              title="ดูประวัติรายการประมวลผลทั้งหมดในหน้า History"
            >
              <History className="w-4 h-4 text-purple-950 stroke-[2.5]" />
              <span>ดูประวัติการทำรายการ (History) →</span>
            </button>
          </div>
        </div>

        {/* File Name & History Title Renaming Bar */}
        <div className="mt-5 pt-4 border-t border-emerald-600/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/20 p-3.5 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-100 flex-1 min-w-0">
            <span className="font-extrabold text-white flex-shrink-0">
              บันทึกชื่อไฟล์ / ชื่อ History:
            </span>
            <input
              type="text"
              value={historyTitle}
              onChange={(e) => setHistoryTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              placeholder="ระบุชื่อสำหรับบันทึกใน History..."
              className="flex-1 min-w-[200px] px-3 py-1.5 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-emerald-400/50 rounded-lg text-white placeholder-emerald-200/60 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 text-xs transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveTitle}
              className={`px-4 py-1.5 text-xs font-black rounded-lg transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0 ${
                isTitleSaved
                  ? 'bg-emerald-300 text-emerald-950'
                  : 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950 hover:shadow-lg'
              }`}
            >
              {isTitleSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>บันทึกชื่อเรียบร้อยแล้ว</span>
                </>
              ) : (
                <span>บันทึกชื่อไฟล์</span>
              )}
            </button>

            {/* 6. Start New Process */}
            <button
              type="button"
              onClick={() => {
                startNewProcess();
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              title="เริ่มต้นกระบวนการแปลงไฟล์ใหม่ (กลับสู่หน้าอัปโหลดไฟล์)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
              <span>เริ่มแปลงไฟล์ใหม่</span>
            </button>
          </div>
        </div>

        {/* Hidden File Input for Step 4 */}
        <input
          type="file"
          ref={step4FileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              uploadFile(e.target.files[0]);
            }
          }}
          onClick={(e) => {
            (e.target as HTMLInputElement).value = '';
          }}
          accept=".xlsx,.xls,.csv,.pdf,.eml,.msg,.txt,.json"
          className="hidden"
        />
      </div>

      {/* Main Presentation View (Read-Only Table & JSON) */}
      <div className="banking-card overflow-hidden">
        {/* Toolbar, Sheet Tabs & Filter Bar */}
        <div className="bg-[#2e1d52] text-white p-4 border-b border-purple-950 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Main Mode Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('table')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
                  activeTab === 'table'
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.02]'
                    : 'bg-purple-900/60 text-purple-200 hover:bg-purple-800'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>ตารางข้อมูลผลลัพธ์มาตรฐาน ({filteredRecords.length} แถว) [Read-Only]</span>
              </button>

              <button
                onClick={() => setActiveTab('json')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
                  activeTab === 'json'
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-[1.02]'
                    : 'bg-purple-900/60 text-purple-200 hover:bg-purple-800'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>โครงสร้าง Single JSON Output ({cleanJsonRecords.length} Records)</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-purple-300" />
              <input
                type="text"
                placeholder="ค้นหาทุกคอลัมน์..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1 text-xs bg-purple-950 text-white placeholder-purple-300/70 border border-purple-700 rounded-lg focus:outline-none focus:border-amber-400 w-52"
              />
            </div>
          </div>

          {/* Sheet Selector Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-900/60 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-purple-200 font-bold mr-1">เลือกแผ่นงาน:</span>
              {(() => {
                const availableSheets: string[] = (process?.sheets && process.sheets.length > 0)
                  ? process.sheets
                  : [process?.file_name ? process.file_name.replace(/\.[^/.]+$/, "") : "MainSheet"];

                const sheetItems = availableSheets.length > 1
                  ? [{ id: "All", label: `รวมทุกชีท (${editableRecords.length})` }, ...availableSheets.map(s => {
                      const count = editableRecords.filter(r => r.sheetName === s).length;
                      return { id: s, label: `${s} (${count > 0 ? count : editableRecords.length})` };
                    })]
                  : availableSheets.map(s => ({ id: s, label: `${s} (${editableRecords.length})` }));

                return sheetItems.map((sheet) => (
                  <button
                    key={sheet.id}
                    onClick={() => {
                      setSelectedSheetFilter(sheet.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      selectedSheetFilter === sheet.id
                        ? "bg-amber-400 text-slate-950 font-extrabold shadow-sm"
                        : "bg-purple-900/40 text-purple-200 border border-purple-800 hover:bg-purple-800"
                    }`}
                  >
                    {sheet.label}
                  </button>
                ));
              })()}
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2 text-xs text-purple-200 font-bold">
              <span>แสดง:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-purple-950 text-amber-300 border border-purple-700 font-extrabold rounded px-2 py-0.5 focus:outline-none cursor-pointer"
              >
                <option value={15}>15 แถว/หน้า</option>
                <option value={25}>25 แถว/หน้า</option>
                <option value={50}>50 แถว/หน้า</option>
                <option value={150}>ทั้งหมด</option>
              </select>
            </div>
          </div>
        </div>

        {activeTab === 'table' ? (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-purple-950 text-amber-300 font-extrabold text-xs uppercase tracking-wider border-b border-purple-900">
                    <th className="py-3 px-3 text-center w-12 border-r border-purple-900">ลำดับ</th>
                    <th className="py-3 px-3 border-r border-purple-900 text-center text-purple-200">แผ่นงาน</th>
                    {displayColumns.map((col: string) => {
                      const c = col.toUpperCase();
                      const isRight = c.includes('PRICE') || c.includes('QUANTITY') || c.includes('AMOUNT') || c.includes('VALUE') || c.includes('UNITS') || c.includes('SIZE') || c.includes('TOTAL');
                      const isCenter = c.includes('CURRENCY') || c.includes('DATE') || c.includes('STATUS') || c.includes('CODE') || c.includes('TYPE') || c.includes('ISIN') || c.includes('NO');
                      return (
                        <th
                          key={col}
                          className={`py-3 px-4 border-r border-purple-900 ${
                            isRight ? 'text-right' : isCenter ? 'text-center' : 'text-left'
                          }`}
                        >
                          {col}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {paginatedRecords.length > 0 ? (
                    paginatedRecords.map((row, pIdx) => {
                      const actualIdx = (currentPage - 1) * pageSize + pIdx + 1;
                      const rowRecord = row as Record<string, any>;
                      return (
                        <tr
                          key={row.id}
                          className={`transition-colors ${pIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-purple-50/50`}
                        >
                          {/* Index */}
                          <td className="py-2.5 px-2 text-center font-extrabold text-slate-500 border-r border-slate-200 select-none">
                            <span>{actualIdx}</span>
                          </td>

                          {/* Sheet Name Badge */}
                          <td className="py-2 px-2 text-center border-r border-slate-200 font-mono text-[10px]">
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-950 font-bold border border-purple-200 rounded">
                              {row.sheetName || 'Custodian_A'}
                            </span>
                          </td>

                          {/* Dynamic Columns */}
                          {displayColumns.map((col: string) => {
                            const rawV = rowRecord[col];
                            const val = typeof rawV === 'object' && rawV !== null && 'formattedVal' in rawV ? rawV.formattedVal : rawV;
                            const strVal = val !== undefined && val !== null ? String(val) : '-';
                            const c = col.toUpperCase();
                            const isRight = c.includes('PRICE') || c.includes('QUANTITY') || c.includes('AMOUNT') || c.includes('VALUE') || c.includes('UNITS') || c.includes('SIZE') || c.includes('TOTAL');
                            const isCenter = c.includes('CURRENCY') || c.includes('DATE') || c.includes('STATUS') || c.includes('CODE') || c.includes('TYPE') || c.includes('ISIN') || c.includes('NO');
                            const isAmount = c.includes('AMOUNT') || c.includes('TOTAL_ISSUE');

                            return (
                              <td
                                key={col}
                                className={`py-2.5 px-4 border-r border-slate-200 font-mono ${
                                  isAmount
                                    ? 'font-extrabold text-emerald-800 bg-emerald-50/40 text-right'
                                    : isRight
                                    ? 'text-right font-semibold text-slate-900'
                                    : isCenter
                                    ? 'text-center font-bold'
                                    : 'text-left font-semibold text-[#2e1d52]'
                                }`}
                              >
                                {isCenter ? (
                                  <span className="font-mono font-extrabold text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                                    {strVal}
                                  </span>
                                ) : (
                                  strVal
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={displayColumns.length + 2} className="py-8 text-center text-slate-500 font-bold">
                        ไม่พบข้อมูลที่ตรงกับคำค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="bg-slate-100 border-t border-slate-300 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="font-semibold text-slate-600">
                แสดงผลแถวที่ <strong className="text-slate-900">{filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> -{' '}
                <strong className="text-slate-900">{Math.min(currentPage * pageSize, filteredRecords.length)}</strong> จากทั้งหมด{' '}
                <strong className="text-purple-950 font-bold">{filteredRecords.length} แถว</strong>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 disabled:opacity-40 font-bold text-xs shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>ก่อนหน้า</span>
                </button>

                <span className="px-3 py-1 font-extrabold text-slate-900 text-xs bg-purple-100 text-purple-950 border border-purple-200 rounded-lg">
                  หน้า {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 disabled:opacity-40 font-bold text-xs shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <span>ถัดไป</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-[#120a26] text-emerald-400 font-mono text-xs overflow-x-auto">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/80 mb-3">
              <span className="text-purple-200 font-extrabold">
                Single JSON Array Output ({cleanJsonRecords.length} Records) — Strict 8 KKP Fields
              </span>
              <button
                onClick={handleCopyJson}
                className="px-3 py-1 bg-purple-900/80 hover:bg-purple-800 text-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-300" />}
                <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอก JSON'}</span>
              </button>
            </div>
            <pre className="whitespace-pre font-bold leading-relaxed">{fullJsonArrayString}</pre>
          </div>
        )}
      </div>

      {/* Completion Success Modal */}
      <CompletionSuccessModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        rowCount={editableRecords.length}
        fileName={process?.file_name || 'KKP_Demo_Source_Files.xlsx'}
        templateName={process?.target_template || 'KKP_CUSTODIAN_TRADE_V2'}
        onDownloadExcel={exportExcel}
        onDownloadJson={handleDownloadJson}
      />
    </div>
  );
};
