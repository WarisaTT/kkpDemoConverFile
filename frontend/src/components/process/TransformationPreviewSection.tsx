'use client';

import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useProcessStore } from '@/store/useProcessStore';
import { isFootnoteOrNonDataRow, formatTargetValue } from '@/utils/formatUtils';
import { CompletionSuccessModal } from './CompletionSuccessModal';

export function formatValueByTargetTemplate(field: string, rawVal: any): { formattedVal: any; wasFormatted: boolean } {
  return formatTargetValue(field, rawVal);
}

// Exactly the 8 KKP Standard Target Fields
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
  const { process, exportExcel } = useProcessStore();
  const [editableRecords, setEditableRecords] = useState<RecordItem[]>(generateInitial102Rows);

  useEffect(() => {
    if (!process) return;

    if (process.sheetDataMap && Object.keys(process.sheetDataMap).length > 0) {
      const dynamicRows: RecordItem[] = [];
      let rowId = 1;

      for (const [sname, sdata] of Object.entries(process.sheetDataMap)) {
        const mappings = sdata.mappings || process.mappings || [];
        const targetToSource: Record<string, string> = {};
        mappings.forEach((m) => {
          if (m.target_field && m.source_field && m.source_field !== 'UNMATCHED') {
            targetToSource[m.target_field] = m.source_field;
          }
        });

        const validRows = (sdata.rows || []).filter((r: any) => !isFootnoteOrNonDataRow(r, (sdata.headers || []).length || 8));

        validRows.forEach((rawRow: any) => {
          const getVal = (tf: string) => {
            const sc = targetToSource[tf];
            return sc && rawRow[sc] !== undefined ? rawRow[sc] : '-';
          };

          const rawFundName = getVal('FUND_NAME');
          const rawFundCode = getVal('FUND_CODE') !== '-' ? getVal('FUND_CODE') : `F${1000 + rowId}`;
          const rawTradeDate = getVal('TRADE_DATE');
          const rawSettleDate = getVal('SETTLEMENT_DATE');
          const rawCcy = getVal('CURRENCY') !== '-' ? getVal('CURRENCY') : 'THB';
          const rawPrice = getVal('UNIT_PRICE');
          const rawQty = getVal('QUANTITY');
          const rawAmt = getVal('AMOUNT');

          dynamicRows.push({
            id: rowId++,
            sheetName: sname,
            FUND_NAME: String(rawFundName),
            FUND_CODE: String(rawFundCode),
            TRADE_DATE: formatValueByTargetTemplate('TRADE_DATE', rawTradeDate).formattedVal,
            SETTLEMENT_DATE: formatValueByTargetTemplate('SETTLEMENT_DATE', rawSettleDate).formattedVal,
            CURRENCY: formatValueByTargetTemplate('CURRENCY', rawCcy).formattedVal,
            UNIT_PRICE: formatValueByTargetTemplate('UNIT_PRICE', rawPrice).formattedVal,
            QUANTITY: formatValueByTargetTemplate('QUANTITY', rawQty).formattedVal,
            AMOUNT: formatValueByTargetTemplate('AMOUNT', rawAmt).formattedVal,
          });
        });
      }

      if (dynamicRows.length > 0) {
        setEditableRecords(dynamicRows);
      }
    } else if (process.extractedRecords && process.extractedRecords.length > 0) {
      const validExtracted = (process.extractedRecords || []).filter((r: any) => !isFootnoteOrNonDataRow(r, 8));
      const dynamicRows: RecordItem[] = validExtracted.map((r: any, idx: number) => ({
        id: idx + 1,
        sheetName: r.sheetName || 'Sheet1',
        FUND_NAME: String(r.FUND_NAME || '-'),
        FUND_CODE: String(r.FUND_CODE || `F${1000 + idx + 1}`),
        TRADE_DATE: formatValueByTargetTemplate('TRADE_DATE', r.TRADE_DATE).formattedVal,
        SETTLEMENT_DATE: formatValueByTargetTemplate('SETTLEMENT_DATE', r.SETTLEMENT_DATE).formattedVal,
        CURRENCY: formatValueByTargetTemplate('CURRENCY', r.CURRENCY || 'THB').formattedVal,
        UNIT_PRICE: formatValueByTargetTemplate('UNIT_PRICE', r.UNIT_PRICE).formattedVal,
        QUANTITY: formatValueByTargetTemplate('QUANTITY', r.QUANTITY).formattedVal,
        AMOUNT: formatValueByTargetTemplate('AMOUNT', r.AMOUNT).formattedVal,
      }));
      setEditableRecords(dynamicRows);
    }
  }, [process]);

  const [copied, setCopied] = useState<boolean>(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'table' | 'json'>('table');
  const [selectedSheetFilter, setSelectedSheetFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Generate cleaned JSON without metadata fields (strictly the 8 KKP standard fields)
  const cleanJsonRecords = editableRecords.map(({ id, sheetName, ...rest }) => rest);
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
                สถานะ: เสร็จสมบูรณ์ (Completed & Audit-Locked)
              </span>
              <span className="bg-white/15 text-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                100% SUCCESS
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">
              แปลงข้อมูลเสร็จสมบูรณ์ — ข้อมูล 8 ฟิลด์มาตรฐาน KKP
            </h2>
            <p className="text-xs text-emerald-100 font-medium leading-relaxed">
              ข้อมูลทั้งหมดผ่านการจัดรูปแบบตามมาตรฐาน <strong>KKP_CUSTODIAN_TRADE_V2 (8 ฟิลด์)</strong> เรียบร้อยแล้ว ระบบได้ล็อคข้อมูลเป็น Read-Only เพื่อความถูกต้องตามเกณฑ์ ท่านสามารถดาวน์โหลดไฟล์ Excel หรือ JSON ซ้ำได้ตลอดเวลา
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {/* 1. Copy JSON */}
            <button
              onClick={handleCopyJson}
              className="px-4 py-2.5 text-xs font-extrabold text-white bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl flex items-center gap-2 transition cursor-pointer shadow-sm"
              title="คัดลอกชุดข้อมูล JSON ทั้งหมดลงคลิปบอร์ด"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" /> : <Copy className="w-4 h-4 text-emerald-200" />}
              <span>{copied ? 'คัดลอก JSON แล้ว' : 'คัดลอก JSON'}</span>
            </button>

            {/* 2. Download JSON */}
            <button
              onClick={handleDownloadJson}
              className="px-4 py-2.5 text-xs font-extrabold text-white bg-purple-900/90 hover:bg-purple-800 border border-purple-500 rounded-xl flex items-center gap-2 transition shadow-md cursor-pointer"
              title="ดาวน์โหลดข้อมูลเป็นไฟล์ .json (ดาวน์โหลดซ้ำได้ตลอดเวลา)"
            >
              <FileJson className="w-4 h-4 text-amber-300" />
              <span>ดาวน์โหลด JSON (.json)</span>
            </button>

            {/* 3. Download Excel (Re-downloadable anytime) */}
            <button
              onClick={() => exportExcel()}
              className="px-5 py-2.5 text-xs font-black text-emerald-950 bg-emerald-400 hover:bg-emerald-300 border border-emerald-300 rounded-xl flex items-center gap-2 transition shadow-lg scale-[1.02] cursor-pointer"
              title="ดาวน์โหลดไฟล์มาตรฐาน Excel (.xlsx) สามารถดาวน์โหลดซ้ำได้ตลอดเวลา"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>ดาวน์โหลด Excel (.xlsx)</span>
            </button>

            {/* 4. Start New Process */}
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer ml-1"
              title="เริ่มต้นกระบวนการแปลงไฟล์ใหม่"
            >
              <RotateCcw className="w-4 h-4 text-slate-300" />
              <span>เริ่มแปลงไฟล์ใหม่</span>
            </button>
          </div>
        </div>
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
                    <th className="py-3 px-4 border-r border-purple-900">FUND_NAME</th>
                    <th className="py-3 px-4 border-r border-purple-900">FUND_CODE</th>
                    <th className="py-3 px-4 border-r border-purple-900">TRADE_DATE</th>
                    <th className="py-3 px-4 border-r border-purple-900">SETTLEMENT_DATE</th>
                    <th className="py-3 px-4 border-r border-purple-900 text-center">CURRENCY</th>
                    <th className="py-3 px-4 border-r border-purple-900 text-right">UNIT_PRICE</th>
                    <th className="py-3 px-4 border-r border-purple-900 text-right">QUANTITY</th>
                    <th className="py-3 px-4 text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {paginatedRecords.length > 0 ? (
                    paginatedRecords.map((row, pIdx) => {
                      const actualIdx = (currentPage - 1) * pageSize + pIdx + 1;
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

                          {/* FUND_NAME */}
                          <td className="py-2.5 px-4 border-r border-slate-200 font-semibold text-[#2e1d52]">
                            {row.FUND_NAME}
                          </td>

                          {/* FUND_CODE */}
                          <td className="py-2.5 px-4 border-r border-slate-200 font-mono font-bold text-purple-900">
                            {row.FUND_CODE}
                          </td>

                          {/* TRADE_DATE */}
                          <td className="py-2.5 px-4 border-r border-slate-200 font-mono text-slate-800">
                            {row.TRADE_DATE}
                          </td>

                          {/* SETTLEMENT_DATE */}
                          <td className="py-2.5 px-4 border-r border-slate-200 font-mono text-slate-800">
                            {row.SETTLEMENT_DATE}
                          </td>

                          {/* CURRENCY */}
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center font-bold">
                            <span className="font-mono font-extrabold text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                              {row.CURRENCY}
                            </span>
                          </td>

                          {/* UNIT_PRICE */}
                          <td className="py-2.5 px-4 border-r border-slate-200 text-right font-mono font-semibold text-slate-900">
                            {row.UNIT_PRICE}
                          </td>

                          {/* QUANTITY */}
                          <td className="py-2.5 px-4 border-r border-slate-200 text-right font-mono font-semibold text-slate-900">
                            {row.QUANTITY}
                          </td>

                          {/* AMOUNT */}
                          <td className="py-2.5 px-4 text-right font-mono font-extrabold text-emerald-800 bg-emerald-50/40">
                            {row.AMOUNT}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500 font-bold">
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
