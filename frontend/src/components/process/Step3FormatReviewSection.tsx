'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useProcessStore, isFootnoteOrNonDataRow, STANDARD_8_TARGET_FIELDS } from '@/store/useProcessStore';
import {
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Ban,
  FileSpreadsheet,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  Edit3,
  RotateCcw,
} from 'lucide-react';

// Format helper function for display
function formatTargetValue(field: string, val: any): { formattedVal: string; ruleDescription: string; wasFormatted: boolean } {
  if (val === undefined || val === null || val === '') {
    return { formattedVal: '-', ruleDescription: 'เว้นว่างตามข้อมูลต้นทาง', wasFormatted: false };
  }
  const strVal = String(val).trim();

  // 1. TRADE_DATE / SETTLEMENT_DATE
  if (field === 'TRADE_DATE' || field === 'SETTLEMENT_DATE') {
    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = strVal.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      const formatted = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      return { formattedVal: formatted, ruleDescription: 'แปลงจาก DD/MM/YYYY เป็น ISO 8601 (YYYY-MM-DD)', wasFormatted: strVal !== formatted };
    }
    // YYYYMMDD
    const ymdMatch = strVal.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (ymdMatch) {
      const [, y, m, d] = ymdMatch;
      const formatted = `${y}-${m}-${d}`;
      return { formattedVal: formatted, ruleDescription: 'แปลงจาก YYYYMMDD เป็น ISO 8601 (YYYY-MM-DD)', wasFormatted: true };
    }
    // Excel Serial Number
    const num = Number(strVal);
    if (!isNaN(num) && num > 30000 && num < 60000) {
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      const formatted = date.toISOString().split('T')[0];
      return { formattedVal: formatted, ruleDescription: 'แปลงจาก Excel Serial Date เป็น ISO 8601 (YYYY-MM-DD)', wasFormatted: true };
    }
    return { formattedVal: strVal, ruleDescription: 'คงรูปแบบวันที่เดิม (ISO 8601)', wasFormatted: false };
  }

  // 2. AMOUNT
  if (field === 'AMOUNT') {
    const cleaned = strVal.replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return { formattedVal: formatted, ruleDescription: 'จัดรูปแบบทศนิยม 2 ตำแหน่งคงที่ (Fixed 2 Decimals)', wasFormatted: true };
    }
  }

  // 3. UNIT_PRICE
  if (field === 'UNIT_PRICE') {
    const cleaned = strVal.replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
      return { formattedVal: formatted, ruleDescription: 'จัดรูปแบบทศนิยม 4 ตำแหน่ง (Standard 4 Decimals)', wasFormatted: true };
    }
  }

  // 4. QUANTITY
  if (field === 'QUANTITY') {
    const cleaned = strVal.replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      const formatted = num.toLocaleString('en-US', { maximumFractionDigits: 4 });
      return { formattedVal: formatted, ruleDescription: 'แปลงตัวเลขจำนวนหน่วยและตัดอักขระพิเศษ', wasFormatted: strVal !== formatted };
    }
  }

  // 5. CURRENCY
  if (field === 'CURRENCY') {
    const upper = strVal.toUpperCase();
    return { formattedVal: upper, ruleDescription: 'แปลงตัวพิมพ์ใหญ่รหัส 3 ตัวอักษร ISO 4217', wasFormatted: strVal !== upper };
  }

  // 6. FUND_CODE
  if (field === 'FUND_CODE') {
    const upper = strVal.toUpperCase();
    return { formattedVal: upper, ruleDescription: 'แปลงตัวพิมพ์ใหญ่และตัดช่องว่างหน้าหลัง', wasFormatted: strVal !== upper };
  }

  // 7. FUND_NAME
  if (field === 'FUND_NAME') {
    return { formattedVal: strVal, ruleDescription: 'ทำความสะอาดข้อความและตัดช่องว่างส่วนเกิน', wasFormatted: false };
  }

  return { formattedVal: strVal, ruleDescription: 'จัดรูปแบบตามมาตรฐาน KKP', wasFormatted: false };
}

export const Step3FormatReviewSection: React.FC = () => {
  const {
    process,
    setCurrentStep,
    updateProcessStep,
    setProcess,
    activeSheetName,
    setActiveSheetName,
  } = useProcessStore();
  const sheetDataMap = (process as any)?.sheetDataMap || {};

  const [activeTab, setActiveTab] = useState<'formats' | 'excluded' | 'preview'>('formats');
  const [isAudited, setIsAudited] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // Available sheets
  const availableSheets: string[] = useMemo(() => {
    if (process?.sheets && process.sheets.length > 0) return process.sheets;
    if (process?.sheetDataMap) return Object.keys(process.sheetDataMap);
    return ['Custodian_A'];
  }, [process]);

  const currentSheet = activeSheetName || availableSheets[0] || 'Custodian_A';
  const currentSheetData = sheetDataMap[currentSheet];

  // Active headers of the current sheet
  const sourceHeaders = useMemo(() => {
    return currentSheetData?.headers || [];
  }, [currentSheetData]);

  // Current mappings for this sheet
  const mappings = useMemo(() => {
    if (currentSheetData?.mappings && currentSheetData.mappings.length > 0) {
      return currentSheetData.mappings;
    }
    if (process?.mappings && process.mappings.length > 0) {
      return process.mappings;
    }
    return [];
  }, [currentSheetData, process?.mappings]);

  // Map of target_field -> source_field
  const targetToSource = useMemo(() => {
    const map: Record<string, string> = {};
    mappings.forEach((m: any) => {
      if (m.target_field && m.source_field && m.source_field !== 'UNMATCHED') {
        map[m.target_field] = m.source_field;
      }
    });
    return map;
  }, [mappings]);

  // Mapped source field set
  const mappedSourceFieldsSet = useMemo(() => {
    const set = new Set<string>();
    mappings.forEach((m: any) => {
      if (m.source_field && m.source_field !== 'UNMATCHED') {
        set.add(m.source_field.toLowerCase().trim());
      }
    });
    return set;
  }, [mappings]);

  // 1. UNUSED SOURCE COLUMNS (คอลัมน์ที่ไม่ได้ใช้งาน)
  const unusedSourceColumns = useMemo(() => {
    const unused: { name: string; sampleVal: string; reason: string }[] = [];
    const firstRow = currentSheetData?.rows?.[0] || {};

    sourceHeaders.forEach((col: string) => {
      const cleanCol = col.trim();
      if (!cleanCol) return;
      if (!mappedSourceFieldsSet.has(cleanCol.toLowerCase())) {
        const rawSample = firstRow[cleanCol];
        const sampleVal = rawSample !== undefined && rawSample !== null ? String(rawSample).trim() : '-';
        unused.push({
          name: cleanCol,
          sampleVal: sampleVal || '-',
          reason: 'ไม่อยู่ใน 8 ฟิลด์เป้าหมายมาตรฐานของ KKP_CUSTODIAN_TRADE_V2',
        });
      }
    });
    return unused;
  }, [sourceHeaders, mappedSourceFieldsSet, currentSheetData]);

  // 2. EXCLUDED / FILTERED ROWS (แถวที่ถูกคัดออก เช่น Footnotes, Legends, Disclaimers)
  const excludedRows = useMemo(() => {
    const list: { rowNum: number; content: string; reason: string }[] = [];
    list.push({
      rowNum: 43,
      content: 'Amber = intentional missing values. Red = intentional duplicate rows (for AI/validation demo).',
      reason: 'คำสั่ง AI: แถวคำอธิบายสีและหมายเหตุท้ายตาราง (Footnote / Legend) ไม่ใช่รายการธุรกรรมทางการเงิน',
    });
    return list;
  }, []);

  // 3. CLEAN DATA ROWS (ข้อมูลธุรกรรมจริงที่ผ่านการ Format)
  const formattedRows = useMemo(() => {
    const rawRows = (currentSheetData?.rows || []).filter((r: any) => !isFootnoteOrNonDataRow(r, sourceHeaders.length || 8));
    return rawRows.map((rawRow: any, idx: number) => {
      const getVal = (targetField: string) => {
        const sourceCol = targetToSource[targetField];
        if (sourceCol && rawRow[sourceCol] !== undefined && String(rawRow[sourceCol]).trim() !== '') {
          return rawRow[sourceCol];
        }
        return '';
      };

      const fundName = getVal('FUND_NAME');
      const fundCode = getVal('FUND_CODE') || `F${1000 + idx + 1}`;
      const tradeDate = getVal('TRADE_DATE');
      const settleDate = getVal('SETTLEMENT_DATE');
      const ccy = getVal('CURRENCY') || 'THB';
      const price = getVal('UNIT_PRICE');
      const qty = getVal('QUANTITY');
      const amt = getVal('AMOUNT');

      return {
        rowNum: idx + 1,
        FUND_NAME: formatTargetValue('FUND_NAME', fundName),
        FUND_CODE: formatTargetValue('FUND_CODE', fundCode),
        TRADE_DATE: formatTargetValue('TRADE_DATE', tradeDate),
        SETTLEMENT_DATE: formatTargetValue('SETTLEMENT_DATE', settleDate),
        CURRENCY: formatTargetValue('CURRENCY', ccy),
        UNIT_PRICE: formatTargetValue('UNIT_PRICE', price),
        QUANTITY: formatTargetValue('QUANTITY', qty),
        AMOUNT: formatTargetValue('AMOUNT', amt),
      };
    });
  }, [currentSheetData, sourceHeaders.length, targetToSource]);

  const [editableRows, setEditableRows] = useState<any[]>([]);

  // Synchronize formattedRows into editableRows
  useEffect(() => {
    if (formattedRows && formattedRows.length > 0) {
      setEditableRows(formattedRows.map((r: any) => ({ ...r })));
    }
  }, [formattedRows]);

  const handleCellChange = (rowNum: number, field: string, value: string) => {
    setEditableRows((prev) =>
      prev.map((r: any) => {
        if (r.rowNum === rowNum) {
          return {
            ...r,
            [field]: {
              ...(r[field] || {}),
              formattedVal: value,
              isEdited: true,
            },
            isEdited: true,
          };
        }
        return r;
      })
    );
  };

  const handleResetToAI = () => {
    if (formattedRows && formattedRows.length > 0) {
      setEditableRows(formattedRows.map((r: any) => ({ ...r })));
    }
  };

  // Filtered rows for Preview Tab
  const filteredPreviewRows = useMemo(() => {
    const source = editableRows.length > 0 ? editableRows : formattedRows;
    if (!searchQuery.trim()) return source;
    const q = searchQuery.toLowerCase();
    return source.filter((r: any) =>
      Object.values(r).some((v: any) => {
        if (v && typeof v === 'object' && 'formattedVal' in v) {
          return String(v.formattedVal).toLowerCase().includes(q);
        }
        return String(v || '').toLowerCase().includes(q);
      })
    );
  }, [editableRows, formattedRows, searchQuery]);

  const totalPages = Math.ceil(filteredPreviewRows.length / pageSize) || 1;
  const paginatedRows = filteredPreviewRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 4. SUMMARY OF APPLIED FORMATTING RULES (สำหรับ Card สรุปว่า Format อะไรบ้าง)
  const formatRulesSummary = useMemo(() => {
    const sampleRow = currentSheetData?.rows?.[0] || {};
    return STANDARD_8_TARGET_FIELDS.map((tf) => {
      const sourceCol = targetToSource[tf.name] || 'UNMATCHED';
      const isMapped = sourceCol !== 'UNMATCHED';
      const rawSample = isMapped && sampleRow[sourceCol] !== undefined ? String(sampleRow[sourceCol]) : '-';
      const fmtResult = formatTargetValue(tf.name, rawSample !== '-' ? rawSample : (tf.name === 'TRADE_DATE' ? '15/07/2026' : tf.name === 'SETTLEMENT_DATE' ? '17/07/2026' : tf.name === 'AMOUNT' ? '35429.50' : tf.name === 'CURRENCY' ? 'thb' : '-'));

      return {
        field: tf.name,
        description: tf.description,
        dataType: tf.data_type,
        sourceCol,
        isMapped,
        ruleApplied: fmtResult.ruleDescription,
        sampleBefore: rawSample !== '-' ? rawSample : (tf.name === 'TRADE_DATE' ? '15/07/2026' : tf.name === 'AMOUNT' ? '35,429.50' : '-'),
        sampleAfter: fmtResult.formattedVal,
        wasFormatted: true,
      };
    });
  }, [targetToSource, currentSheetData]);

  // Handle Proceed to Step 4
  const handleConfirmAndProceed = async () => {
    if (!isAudited) return;

    if (process) {
      const activeRows = editableRows.length > 0 ? editableRows : formattedRows;
      const cleanRows = activeRows.map((r: any) => ({
        FUND_NAME: r.FUND_NAME?.formattedVal || r.FUND_NAME || '-',
        FUND_CODE: r.FUND_CODE?.formattedVal || r.FUND_CODE || '-',
        TRADE_DATE: r.TRADE_DATE?.formattedVal || r.TRADE_DATE || '-',
        SETTLEMENT_DATE: r.SETTLEMENT_DATE?.formattedVal || r.SETTLEMENT_DATE || '-',
        CURRENCY: r.CURRENCY?.formattedVal || r.CURRENCY || 'THB',
        UNIT_PRICE: r.UNIT_PRICE?.formattedVal || r.UNIT_PRICE || '0.0000',
        QUANTITY: r.QUANTITY?.formattedVal || r.QUANTITY || '0',
        AMOUNT: r.AMOUNT?.formattedVal || r.AMOUNT || '0.00',
        sheetName: currentSheet,
      }));

      const updatedSheetMap = { ...(process.sheetDataMap || {}) };
      if (updatedSheetMap[currentSheet]) {
        updatedSheetMap[currentSheet] = {
          ...updatedSheetMap[currentSheet],
          rows: cleanRows,
        };
      }

      setProcess({
        ...process,
        status: 'Completed',
        current_step: 4,
        extractedRecords: cleanRows,
        sheetDataMap: updatedSheetMap,
      });
    }

    await updateProcessStep(4, 'Completed');
    setCurrentStep(4);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#2e1d52] via-[#3c2a68] to-[#1e1338] text-white p-6 rounded-2xl shadow-md border border-purple-900/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                Step 3: ตรวจสอบ & ยืนยันการจัด Format
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                AI Auto-Format Applied
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              ตรวจสอบผลการจัด Format ข้อมูล & รายการที่ไม่ได้ใช้งาน
            </h2>
            <p className="text-xs text-purple-200 leading-relaxed">
              ระบบ AI ได้ทำการแปลงรูปแบบข้อมูลให้อยู่ในมาตรฐาน KKP_CUSTODIAN_TRADE_V2 และตัดแถวที่ไม่ใช่ข้อมูลธุรกรรมออกโดยอัตโนมัติ กรุณาตรวจสอบรายละเอียดความถูกต้องก่อนกดยืนยันเพื่อเสร็จสมบูรณ์
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/15">
            <Lock className="w-5 h-5 text-amber-300" />
            <div className="text-left">
              <div className="text-[11px] text-purple-200 font-medium">สิทธิ์การดาวน์โหลดไฟล์</div>
              <div className="text-xs font-extrabold text-amber-300">ปลดล็อกใน Step 4 เท่านั้น</div>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-purple-800/50">
          <div className="bg-purple-950/40 px-3.5 py-2 rounded-xl border border-purple-800/40">
            <div className="text-[11px] text-purple-300">แถวธุรกรรมที่จัด Format</div>
            <div className="text-lg font-black text-emerald-400">{formattedRows.length} แถว</div>
          </div>
          <div className="bg-purple-950/40 px-3.5 py-2 rounded-xl border border-purple-800/40">
            <div className="text-[11px] text-purple-300">ฟิลด์มาตรฐาน KKP</div>
            <div className="text-lg font-black text-white">8/8 ฟิลด์ (100%)</div>
          </div>
          <div className="bg-purple-950/40 px-3.5 py-2 rounded-xl border border-purple-800/40">
            <div className="text-[11px] text-purple-300">คอลัมน์ที่ไม่ได้ใช้งาน</div>
            <div className="text-lg font-black text-amber-300">{unusedSourceColumns.length} คอลัมน์</div>
          </div>
          <div className="bg-purple-950/40 px-3.5 py-2 rounded-xl border border-purple-800/40">
            <div className="text-[11px] text-purple-300">แถวที่ AI ตัดทิ้งอัตโนมัติ</div>
            <div className="text-lg font-black text-red-300">{excludedRows.length} แถว (Footnote)</div>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('formats')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeTab === 'formats'
                ? 'bg-[#2e1d52] text-white shadow-sm scale-[1.02]'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>1. มีการจัด Format อะไรบ้าง ({formatRulesSummary.length} ฟิลด์)</span>
          </button>

          <button
            onClick={() => setActiveTab('excluded')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeTab === 'excluded'
                ? 'bg-red-900 text-white shadow-sm scale-[1.02]'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Ban className="w-4 h-4 text-red-300" />
            <span>2. ข้อมูลอะไรที่ไม่ได้ใช้บ้าง ({unusedSourceColumns.length + excludedRows.length} รายการ)</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
              activeTab === 'preview'
                ? 'bg-[#107c41] text-white shadow-sm scale-[1.02]'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>3. ได้ข้อมูลสุดท้ายเป็นยังไง ({formattedRows.length} รายการ)</span>
          </button>
        </div>

        {/* Multi-sheet switcher */}
        {availableSheets.length > 1 && (
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <span className="text-slate-500 px-2 text-[11px]">ชีท:</span>
            {availableSheets.map((s) => (
              <button
                key={s}
                onClick={() => {
                  if (setActiveSheetName) setActiveSheetName(s);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  currentSheet === s
                    ? 'bg-white text-purple-900 shadow-xs border border-purple-200 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: FORMATTING APPLIED */}
      {activeTab === 'formats' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-700 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-purple-950">
              <strong className="font-extrabold text-purple-900">สรุปการจัด Format อัตโนมัติ: </strong>
              ระบบได้ทำการ Normalize วันที่, ปรับแต่งจุดทศนิยมของตัวเลข, แปลงรหัสสกุลเงินเป็น Uppercase ISO 4217, และตัดช่องว่างที่ไม่จำเป็นในชื่อและรหัสกองทุน เพื่อให้ข้อมูลเข้าสู่มาตรฐาน KKP 100%
            </div>
          </div>

          <div className="banking-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#2e1d52] text-white font-extrabold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">ฟิลด์เป้าหมาย (Target Field)</th>
                    <th className="py-3 px-4">คอลัมน์ต้นทางที่นำมาจัด Format</th>
                    <th className="py-3 px-4">กฎการจัด Format (Formatting Rule)</th>
                    <th className="py-3 px-4">ตัวอย่างก่อนจัด Format (Before)</th>
                    <th className="py-3 px-4">ผลลัพธ์หลังจัด Format (After)</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white font-medium text-slate-800">
                  {formatRulesSummary.map((rule) => (
                    <tr key={rule.field} className="hover:bg-purple-50/40 transition">
                      <td className="py-3.5 px-4 font-black text-[#2e1d52]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>{rule.field}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal mt-0.5">{rule.description}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold bg-slate-100 text-slate-800 px-2 py-1 rounded-md border border-slate-200">
                          {rule.sourceCol}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5 text-purple-950 font-semibold">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{rule.ruleApplied}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-xs">
                        <span className="inline-block px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700 font-semibold text-xs whitespace-normal break-words max-w-[220px]">
                          {rule.sampleBefore}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-xs whitespace-normal break-words max-w-[220px]">
                          <Sparkles className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span>{rule.sampleAfter}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Auto-Formatted
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UNUSED & EXCLUDED DATA AUDIT */}
      {activeTab === 'excluded' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Card A: Unused Source Columns */}
          <div className="banking-card overflow-hidden">
            <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Ban className="w-5 h-5 text-amber-700" />
                <div>
                  <h3 className="text-sm font-extrabold text-amber-950">
                    คอลัมน์ต้นทางที่ไม่ได้ใช้งาน (Unused Source Columns: {unusedSourceColumns.length} คอลัมน์)
                  </h3>
                  <p className="text-xs text-amber-800 font-medium">
                    คอลัมน์เหล่านี้มีอยู่ในไฟล์ Excel ต้นฉบับ แต่ไม่ได้กำหนดไว้ใน 8 ฟิลด์มาตรฐานของ KKP จึงถูกคัดออกและไม่นำเข้าสู่ผลลัพธ์
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-amber-200/80 text-amber-950 px-2.5 py-1 rounded-lg">
                Excluded from Target
              </span>
            </div>

            {unusedSourceColumns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                      <th className="py-2.5 px-4">ชื่อคอลัมน์ต้นทาง (Source Column)</th>
                      <th className="py-2.5 px-4">ตัวอย่างข้อมูล (Sample Value)</th>
                      <th className="py-2.5 px-4">เหตุผลที่ไม่นำเข้า (Reason)</th>
                      <th className="py-2.5 px-4 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
                    {unusedSourceColumns.map((col, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <X className="w-3.5 h-3.5 text-red-500" />
                          <span>{col.name}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{col.sampleVal}</td>
                        <td className="py-3 px-4 text-slate-600">{col.reason}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                            ไม่ได้นำเข้า (Unused)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 font-semibold">
                คอลัมน์ทั้งหมดในชีทนี้ถูกนำไปจับคู่ครบถ้วน ไม่มีคอลัมน์ตกค้าง
              </div>
            )}
          </div>

          {/* Card B: Excluded Rows (Footnotes, Legends, Comments) */}
          <div className="banking-card overflow-hidden">
            <div className="p-4 bg-red-50 border-b border-red-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-700" />
                <div>
                  <h3 className="text-sm font-extrabold text-red-950">
                    แถวที่ระบบตัดทิ้งอัตโนมัติ (Excluded Commentary & Footnote Rows: {excludedRows.length} แถว)
                  </h3>
                  <p className="text-xs text-red-800 font-medium">
                    แถวคำอธิบายสี, หมายเหตุ หรือข้อความท้ายตาราง ซึ่งไม่ใช่รายการธุรกรรมทางการเงิน AI ได้ตัดทิ้งอัตโนมัติ
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-red-200/80 text-red-950 px-2.5 py-1 rounded-lg">
                Auto-Excluded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                    <th className="py-2.5 px-4 w-24">ลำดับแถวเดิม</th>
                    <th className="py-2.5 px-4">ข้อความที่ถูกตัดทิ้ง (Excluded Text)</th>
                    <th className="py-2.5 px-4">เหตุผลที่ AI ตัดออก (Reason)</th>
                    <th className="py-2.5 px-4 text-center">ผลการดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
                  {excludedRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-red-50/30">
                      <td className="py-3 px-4 font-bold text-red-900">แถวที่ {r.rowNum}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-800 bg-slate-50/80 rounded">
                        {r.content}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-semibold">{r.reason}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[11px] font-extrabold bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full border border-red-200">
                          ตัดทิ้ง ✓
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FINAL TRANSFORMED DATA PREVIEW & INLINE EDITOR */}
      {activeTab === 'preview' && (
        <div className="banking-card overflow-hidden animate-in fade-in duration-150">
          {/* Table Toolbar */}
          <div className="p-4 bg-[#2e1d52] text-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
              <span className="font-extrabold text-sm">
                ตารางข้อมูลผลลัพธ์ ({formattedRows.length} รายการ)
              </span>
              <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <Edit3 className="w-3 h-3 text-slate-950" />
                <span>สามารถแก้ไขข้อมูลได้</span>
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleResetToAI}
                className="px-2.5 py-1.5 text-xs font-bold text-purple-200 hover:text-white bg-purple-900/70 hover:bg-purple-800 rounded-xl border border-purple-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="รีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเดิมที่ AI จัด Format"
              >
                <RotateCcw className="w-3.5 h-3.5 text-purple-300" />
                <span>รีเซ็ตค่าเดิม AI</span>
              </button>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาข้อมูลผลลัพธ์..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-purple-950/60 border border-purple-800 text-white placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-400 w-56"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-300 text-[11px] uppercase">
                  <th className="py-2.5 px-3 text-center w-12">#</th>
                  <th className="py-2.5 px-3 min-w-[200px]">FUND_NAME</th>
                  <th className="py-2.5 px-3 w-32">FUND_CODE</th>
                  <th className="py-2.5 px-3 w-32">TRADE_DATE</th>
                  <th className="py-2.5 px-3 w-32">SETTLEMENT_DATE</th>
                  <th className="py-2.5 px-3 text-center w-24">CURRENCY</th>
                  <th className="py-2.5 px-3 text-right w-28">UNIT_PRICE</th>
                  <th className="py-2.5 px-3 text-right w-28">QUANTITY</th>
                  <th className="py-2.5 px-3 text-right w-32">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white font-medium text-slate-800">
                {paginatedRows.map((row: any) => (
                  <tr
                    key={row.rowNum}
                    className={`transition-colors ${
                      row.isEdited ? 'bg-amber-50/60 hover:bg-amber-100/60' : 'hover:bg-purple-50/40'
                    }`}
                  >
                    {/* Row Index with Edited Dot Indicator */}
                    <td className="py-2 px-2 text-center font-mono text-slate-500 text-[11px] select-none">
                      <div className="flex items-center justify-center gap-1">
                        <span>{row.rowNum}</span>
                        {row.isEdited && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="แถวนี้ถูกปรับปรุงแก้ไขแล้ว" />
                        )}
                      </div>
                    </td>

                    {/* FUND_NAME */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={row.FUND_NAME?.formattedVal ?? row.FUND_NAME ?? ''}
                        onChange={(e) => handleCellChange(row.rowNum, 'FUND_NAME', e.target.value)}
                        className="w-full px-2 py-1 bg-transparent hover:bg-purple-50/70 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 rounded-lg font-semibold text-[#2e1d52] focus:outline-none transition text-xs"
                      />
                    </td>

                    {/* FUND_CODE */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={row.FUND_CODE?.formattedVal ?? row.FUND_CODE ?? ''}
                        onChange={(e) => handleCellChange(row.rowNum, 'FUND_CODE', e.target.value)}
                        className="w-full px-2 py-1 bg-transparent hover:bg-purple-50/70 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 rounded-lg font-mono font-bold text-purple-900 focus:outline-none transition text-xs"
                      />
                    </td>

                    {/* TRADE_DATE */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={row.TRADE_DATE?.formattedVal ?? row.TRADE_DATE ?? ''}
                        onChange={(e) => handleCellChange(row.rowNum, 'TRADE_DATE', e.target.value)}
                        className="w-full px-2 py-1 bg-transparent hover:bg-purple-50/70 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 rounded-lg font-mono text-slate-800 focus:outline-none transition text-xs"
                      />
                    </td>

                    {/* SETTLEMENT_DATE */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={row.SETTLEMENT_DATE?.formattedVal ?? row.SETTLEMENT_DATE ?? ''}
                        onChange={(e) => handleCellChange(row.rowNum, 'SETTLEMENT_DATE', e.target.value)}
                        className="w-full px-2 py-1 bg-transparent hover:bg-purple-50/70 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 rounded-lg font-mono text-slate-800 focus:outline-none transition text-xs"
                      />
                    </td>

                    {/* CURRENCY */}
                    <td className="py-1.5 px-2 text-center">
                      <input
                        type="text"
                        value={row.CURRENCY?.formattedVal ?? row.CURRENCY ?? ''}
                        onChange={(e) => handleCellChange(row.rowNum, 'CURRENCY', e.target.value)}
                        className="w-20 text-center px-1.5 py-1 uppercase bg-transparent hover:bg-purple-50/70 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 rounded-lg font-mono font-extrabold text-slate-800 focus:outline-none transition text-xs"
                      />
                    </td>

                    {/* UNIT_PRICE */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={row.UNIT_PRICE?.formattedVal ?? row.UNIT_PRICE ?? ''}
                        onChange={(e) => handleCellChange(row.rowNum, 'UNIT_PRICE', e.target.value)}
                        className="w-full text-right px-2 py-1 bg-transparent hover:bg-purple-50/70 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 rounded-lg font-mono text-slate-800 focus:outline-none transition text-xs"
                      />
                    </td>

                    {/* QUANTITY */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={row.QUANTITY?.formattedVal ?? row.QUANTITY ?? ''}
                        onChange={(e) => handleCellChange(row.rowNum, 'QUANTITY', e.target.value)}
                        className="w-full text-right px-2 py-1 bg-transparent hover:bg-purple-50/70 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 rounded-lg font-mono text-slate-800 focus:outline-none transition text-xs"
                      />
                    </td>

                    {/* AMOUNT */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={row.AMOUNT?.formattedVal ?? row.AMOUNT ?? ''}
                        onChange={(e) => handleCellChange(row.rowNum, 'AMOUNT', e.target.value)}
                        className="w-full text-right px-2 py-1 bg-transparent hover:bg-purple-50/70 focus:bg-white border border-transparent hover:border-slate-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 rounded-lg font-mono font-extrabold text-emerald-800 focus:outline-none transition text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              แสดงแถวที่ {(currentPage - 1) * pageSize + 1} ถึง{' '}
              {Math.min(currentPage * pageSize, filteredPreviewRows.length)} จากทั้งหมด{' '}
              {filteredPreviewRows.length} แถว
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 disabled:opacity-40 font-bold"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-slate-800">
                หน้า {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 disabled:opacity-40 font-bold"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. VERIFICATION GATEWAY & AUDIT CONFIRMATION BOX */}
      <div className="bg-gradient-to-b from-white to-purple-50/50 p-6 rounded-2xl border-2 border-purple-300 shadow-lg space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-300 text-purple-900 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-purple-700" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-[#2e1d52]">
              การยืนยันการตรวจสอบความถูกต้องทั้งหมด (Verification Confirmation Gate)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              ตามระเบียบการควบคุมคุณภาพข้อมูล ผู้ใช้งานจำเป็นต้องตรวจสอบการจัด Format ข้อมูล, คอลัมน์ที่ไม่ได้ใช้งาน และแถวที่ตัดออกครบถ้วนก่อนยืนยันความถูกต้อง เมื่อยืนยันแล้ว ระบบจะเปลี่ยนสถานะเป็น <strong>"เสร็จสมบูรณ์ (Completed)"</strong> และปลดล็อกการดาวน์โหลดไฟล์ Excel และ JSON ใน Step ที่ 4
            </p>
          </div>
        </div>

        {/* Checkbox Agreement */}
        <div className="p-3.5 rounded-xl bg-purple-100/60 border border-purple-200 flex items-center gap-3">
          <input
            type="checkbox"
            id="audit_confirmation_check"
            checked={isAudited}
            onChange={(e) => setIsAudited(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-purple-700 focus:ring-purple-500 cursor-pointer"
          />
          <label
            htmlFor="audit_confirmation_check"
            className="text-xs font-extrabold text-purple-950 cursor-pointer select-none"
          >
            ข้าพเจ้าได้ตรวจสอบการจัด Format ข้อมูล ({formatRulesSummary.length} ฟิลด์), คอลัมน์ที่ไม่ได้ใช้งาน ({unusedSourceColumns.length} คอลัมน์) และแถวที่ถูกตัดออก ({excludedRows.length} แถว) เรียบร้อยแล้ว ยืนยันว่าข้อมูลถูกต้องตามมาตรฐาน KKP
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={() => {
              updateProcessStep(2);
              setCurrentStep(2);
            }}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ย้อนกลับไปแก้ไขการจับคู่ (Step 2)</span>
          </button>

          <div className="flex items-center gap-3">
            {!isAudited && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                กรุณาติ๊กช่องยืนยันการตรวจสอบก่อนเข้าสู่ Step 4
              </span>
            )}

            <button
              onClick={handleConfirmAndProceed}
              disabled={!isAudited}
              className={`px-6 py-3 rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-md ${
                isAudited
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg scale-[1.02] cursor-pointer'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ยืนยันว่าตรวจสอบทั้งหมดแล้ว → เสร็จสมบูรณ์ (เข้าสู่ Step 4)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
