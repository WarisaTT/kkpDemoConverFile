'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Info,
  Check,
  X,
  Plus,
  ShieldCheck,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useProcessStore } from '@/store/useProcessStore';
import { FieldMapping, AILearnedRule } from '@/types';


// Top-level module helper so it is always available without hoisting/closure errors
export function getSourceFieldSample(
  sf: string,
  process?: any,
  currentActiveSheet?: string
): string {
  if (!sf || sf === 'UNMATCHED') return '';

  // 1. Search through rows of currentActiveSheet in process.sheetDataMap
  const sheetRows = process?.sheetDataMap?.[currentActiveSheet || '']?.rows || process?.extractedRecords;
  if (sheetRows && sheetRows.length > 0) {
    for (let i = 0; i < Math.min(25, sheetRows.length); i++) {
      const row = sheetRows[i];
      if (!row) continue;
      if (row[sf] !== undefined && row[sf] !== null && String(row[sf]).trim() !== '') {
        return String(row[sf]).trim();
      }
      const cleanSf = sf.trim().toLowerCase();
      for (const k of Object.keys(row)) {
        if (k.trim().toLowerCase() === cleanSf && row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
          return String(row[k]).trim();
        }
      }
    }
  }

  // 2. Search in current mappings
  const currentMappings = process?.sheetDataMap?.[currentActiveSheet || '']?.mappings || process?.mappings || [];
  const foundM = currentMappings.find(
    (m: any) => m.source_field && m.source_field.trim().toLowerCase() === sf.trim().toLowerCase()
  );
  if (foundM && foundM.source_sample && foundM.source_sample !== '-') {
    return foundM.source_sample;
  }

  // 3. Fallback mock values
  const mockDict: Record<string, string> = {
    PolicyFund: 'KKP Equity Fund',
    'Txn Date': '17.08.2026',
    'Ccy Code': 'THB',
    'Price Per Unit': '10.3906',
    'No. of Units': '2,500',
    'Net Amount': '25,976.50',
    'Dealer Code': 'SCBS',
    'Fund Class': 'Equity',
    Fund_Name: 'KKP Short Term Fixed Income Fund',
    Fund: 'Thai Equity Opportunity Fund',
    'Fund Name': 'Emerging Market Equity Fund',
    Fund_Code: 'F1000',
    'Fund Identifier': 'FID-2000',
    'Trade Date': '15/07/2026',
    Transaction_Date: '2026-07-21',
    Date: '18-Aug-2026',
    'Settlement Date': '17/07/2026',
    Settle_Date: '2026-07-23',
    'Value Date': '19-Aug-2026',
    CCY: 'THB',
    Currency: 'Thai Baht',
    'Currency Code': 'THB',
    NAV: '14.1718',
    'Net Asset Value': '10.0047',
    'Unit Price': '14.2377',
    Qty: '2,500',
    Quantity: '2500.0000',
    Units: '10,000',
    Amount: '35,429.50',
    'Trade Amount': '25,012 THB',
    'Total Value': '142,377 THB',
    Broker: 'BLS',
    Broker_Code: 'YUANTA',
    'Broker Name': 'Kiatnakin Phatra Securities',
    'Fund Type': 'Fixed Income',
    'Asset_Class': 'Fixed Income',
    'Product_Type': 'Fixed Income',
    Category: 'Money Market',
  };

  return mockDict[sf] || '';
}

export const STANDARD_KKP_TARGET_FIELDS = [
  { id: 'tf_1', name: 'FUND_NAME', data_type: 'String', required: true, format: '-', description: 'ชื่อกองทุนรวม' },
  { id: 'tf_2', name: 'FUND_CODE', data_type: 'String', required: true, format: '-', description: 'รหัสกองทุนรวม' },
  { id: 'tf_3', name: 'TRADE_DATE', data_type: 'Date', required: true, format: 'YYYY-MM-DD', description: 'วันที่ทำรายการ' },
  { id: 'tf_4', name: 'SETTLEMENT_DATE', data_type: 'Date', required: true, format: 'YYYY-MM-DD', description: 'วันที่ชำระราคา' },
  { id: 'tf_5', name: 'CURRENCY', data_type: 'String', required: true, format: 'ISO 4217', description: 'รหัสสกุลเงิน' },
  { id: 'tf_6', name: 'UNIT_PRICE', data_type: 'Decimal', required: true, format: '18,4', description: 'ราคาต่อหน่วย' },
  { id: 'tf_7', name: 'QUANTITY', data_type: 'Decimal', required: true, format: '18,4', description: 'จำนวนหน่วย' },
  { id: 'tf_8', name: 'AMOUNT', data_type: 'Decimal', required: true, format: '18,2', description: 'มูลค่ารวม' },
];


export const sheetMappingMap: Record<string, FieldMapping[]> = {
  Custodian_A: [
    { id: "ca_1", process_id: "p1", source_field: "Fund_Name", source_sample: "Emerging Market Equity Fund", source_data_type: "ข้อความ (Text)", target_field: "FUND_NAME", target_data_type: "String", target_required: true, confidence: 0.98, confidence_level: "High", status: "SUGGESTED", reasons: ["ชื่อกองทุน"] },
    { id: "ca_2", process_id: "p1", source_field: "Fund_Code", source_sample: "EM-EQ-01", source_data_type: "ข้อความ (Text)", target_field: "FUND_CODE", target_data_type: "String", target_required: true, confidence: 0.97, confidence_level: "High", status: "SUGGESTED", reasons: ["รหัสกองทุน"] },
    { id: "ca_3", process_id: "p1", source_field: "Trade Date", source_sample: "2026-08-18", source_data_type: "วันที่ (Date)", target_field: "TRADE_DATE", target_data_type: "Date", target_required: true, confidence: 0.95, confidence_level: "High", status: "SUGGESTED", reasons: ["วันที่ทำรายการ"] },
    { id: "ca_4", process_id: "p1", source_field: "Settlement Date", source_sample: "2026-08-19", source_data_type: "วันที่ (Date)", target_field: "SETTLEMENT_DATE", target_data_type: "Date", target_required: true, confidence: 0.94, confidence_level: "High", status: "SUGGESTED", reasons: ["วันที่ชำระราคา"] },
    { id: "ca_5", process_id: "p1", source_field: "CCY", source_sample: "THB", source_data_type: "ข้อความ (Text)", target_field: "CURRENCY", target_data_type: "ISO 4217", target_required: true, confidence: 0.99, confidence_level: "High", status: "SUGGESTED", reasons: ["รหัสสกุลเงิน"] },
    { id: "ca_6", process_id: "p1", source_field: "NAV", source_sample: "14.2377", source_data_type: "ตัวเลข (Number)", target_field: "UNIT_PRICE", target_data_type: "Decimal(18,4)", target_required: true, confidence: 0.88, confidence_level: "High", status: "SUGGESTED", reasons: ["ราคาต่อหน่วย"] },
    { id: "ca_7", process_id: "p1", source_field: "Qty", source_sample: "10,000", source_data_type: "ตัวเลข (Number)", target_field: "QUANTITY", target_data_type: "Decimal(18,4)", target_required: true, confidence: 0.95, confidence_level: "High", status: "SUGGESTED", reasons: ["จำนวนหน่วย"] },
    { id: "ca_8", process_id: "p1", source_field: "Amount", source_sample: "142,377 THB", source_data_type: "ตัวเลข (Number)", target_field: "AMOUNT", target_data_type: "Decimal(18,2)", target_required: true, confidence: 0.94, confidence_level: "High", status: "SUGGESTED", reasons: ["มูลค่ารวม"] },
    { id: "ca_9", process_id: "p1", source_field: "Broker", source_sample: "Kiatnakin Phatra Securities", source_data_type: "ข้อความ (Text)", target_field: "UNMATCHED", target_data_type: "String", target_required: false, confidence: 0.0, confidence_level: "Low", status: "UNMATCHED", reasons: ["ไม่อยู่ใน 8 ฟิลด์เป้าหมายของ KKP_CUSTODIAN_TRADE_V2"] },
  ],
};

export function applyLearnedRulesToMappings(mappings: FieldMapping[], rules: AILearnedRule[]): FieldMapping[] {
  if (!rules || rules.length === 0) return mappings;
  const ruleMap = new Map<string, string>();
  rules.forEach((r) => {
    if (r.is_active && r.source_field && r.target_field) {
      ruleMap.set(r.source_field.trim().toLowerCase(), r.target_field);
    }
  });

  return mappings.map((m) => {
    const key = m.source_field.trim().toLowerCase();
    if (ruleMap.has(key)) {
      const target = ruleMap.get(key)!;
      return {
        ...m,
        target_field: target,
        confidence: 1.0,
        confidence_level: "High",
        status: "ACCEPTED",
        is_learned: true,
        reasons: [`แมชตามกฎเรียนรู้ของผู้ใช้ (Learned Rule: ${key} -> ${target})`],
      };
    }
    return m;
  });
}


export const MappingTableSection: React.FC = () => {
  const {
    checkedFieldIds = {},
    process,
    selectedMapping,
    openDrawer,
    confidenceFilter,
    setConfidenceFilter,
    searchQuery,
    setSearchQuery,
    activeSheetName,
    setActiveSheetName,
    toggleCheckField,
    checkAllFields,
    uncheckAllFields,
    updateMappingTarget,
    updateMappingSource,
    updateSourceSampleValue,
    confirmAllMappings,
    setCurrentStep,
    updateProcessStep,
  } = useProcessStore();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [confirmedSuccessMsg, setConfirmedSuccessMsg] = useState<string | null>(null);

  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState<boolean>(false);

  const availableSheets: string[] = (process?.sheets && process.sheets.length > 0)
    ? process.sheets
    : [process?.file_name ? process.file_name.replace(/\.[^/.]+$/, "") : "Sheet1"];

  const currentActiveSheet = (activeSheetName && availableSheets.includes(activeSheetName))
    ? activeSheetName
    : availableSheets[0];

  // Extract all original source column headers directly from uploaded raw file/sheet
  const availableSourceFields: string[] = React.useMemo(() => {
    const list: string[] = [];

    // 1. Original sheet headers
    const sheetHeaders = process?.sheetDataMap?.[currentActiveSheet]?.headers || [];
    sheetHeaders.forEach((h) => {
      if (h && !list.includes(h)) list.push(h);
    });

    // 2. Original sheet rows keys
    const sheetRows = process?.sheetDataMap?.[currentActiveSheet]?.rows || [];
    if (sheetRows.length > 0) {
      Object.keys(sheetRows[0] || {}).forEach((k) => {
        if (k && k !== 'id' && k !== 'sheetName' && k !== 'isEdited' && !list.includes(k)) {
          list.push(k);
        }
      });
    }

    // 3. Mappings source fields
    const sheetMappings = process?.sheetDataMap?.[currentActiveSheet]?.mappings || process?.mappings || [];
    sheetMappings.forEach((m) => {
      if (m.source_field && m.source_field !== 'UNMATCHED' && !list.includes(m.source_field)) {
        list.push(m.source_field);
      }
    });

    // 4. Extracted records keys
    if (process?.extractedRecords && process.extractedRecords.length > 0) {
      Object.keys(process.extractedRecords[0] || {}).forEach((k) => {
        if (k && k !== 'id' && k !== 'sheetName' && k !== 'isEdited' && !list.includes(k)) {
          list.push(k);
        }
      });
    }

    if (list.length === 0) {
      return ['Fund_Name', 'Fund_Code', 'Trade Date', 'Settlement Date', 'CCY', 'NAV', 'Qty', 'Amount', 'Broker_Code'];
    }
    return list;
  }, [process, currentActiveSheet]);

  // Helper to get sample value for any source field before and after selection
  const getFieldSample = (sf: string) => getSourceFieldSample(sf, process, currentActiveSheet);

  const targetFirstMappings: FieldMapping[] = React.useMemo(() => {
    const currentMappings = process?.sheetDataMap?.[currentActiveSheet]?.mappings || process?.mappings || [];
    const firstRow = process?.sheetDataMap?.[currentActiveSheet]?.rows?.[0] || process?.extractedRecords?.[0];

    return STANDARD_KKP_TARGET_FIELDS.map((tf) => {
      const match = currentMappings.find(
        (m) => m.target_field && m.target_field.trim().toUpperCase() === tf.name.toUpperCase()
      );

      if (match && match.source_field && match.source_field !== 'UNMATCHED') {
        const liveSample = (firstRow && firstRow[match.source_field] !== undefined && String(firstRow[match.source_field]).trim() !== '')
          ? String(firstRow[match.source_field]) 
          : (getSourceFieldSample(match.source_field) || match.source_sample || '-');

        return {
          ...match,
          source_sample: liveSample,
          target_field: tf.name,
          target_data_type: tf.data_type,
          target_required: tf.required,
          target_format: tf.format,
          reasons: match.reasons || [`จับคู่คอลัมน์ '${match.source_field}' -> ฟิลด์มาตรฐาน '${tf.name}'`],
        };
      }

      // If no match found, create an UNMATCHED entry for this target field
      return {
        id: `tf_map_${tf.name}`,
        process_id: process?.id || 'proc_demo',
        source_field: 'UNMATCHED',
        source_sample: '-',
        source_data_type: 'Text',
        target_field: tf.name,
        target_data_type: tf.data_type,
        target_required: tf.required,
        target_format: tf.format,
        confidence: 0.0,
        confidence_level: 'Unmatched',
        status: 'UNMATCHED',
        reasons: [`ยังไม่พบคอลัมน์จากไฟล์อัปโหลดที่ตรงกับฟิลด์มาตรฐาน '${tf.name}'`],
      };
    });
  }, [process, currentActiveSheet]);

  // Compute realistic overall AI accuracy and mapping counts
  const matchedRequiredCount = targetFirstMappings.filter((m) => m.target_required && m.source_field !== 'UNMATCHED').length;
  const totalMatchedCount = targetFirstMappings.filter((m) => m.source_field !== 'UNMATCHED').length;
  const totalTargetFields = targetFirstMappings.length;

  const totalConfidenceSum = targetFirstMappings.reduce((acc, m) => acc + (m.source_field !== 'UNMATCHED' ? m.confidence : 0), 0);
  const avgAccuracyPct = Math.round((totalConfidenceSum / totalTargetFields) * 100);

  // Filtered target-first mappings by filter & search query
  const filteredMappings = targetFirstMappings.filter((m) => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (q) {
      const matchSrc = m.source_field.toLowerCase().includes(q);
      const matchTgt = m.target_field.toLowerCase().includes(q);
      const matchSample = (m.source_sample || '').toLowerCase().includes(q);
      if (!matchSrc && !matchTgt && !matchSample) return false;
    }

    const filter = confidenceFilter || 'All';
    if (filter === 'High') return m.confidence >= 0.85 && m.source_field !== 'UNMATCHED';
    if (filter === 'NeedsReview') return m.confidence < 0.85 && m.source_field !== 'UNMATCHED';
    if (filter === 'Unmatched') return m.source_field === 'UNMATCHED' || m.confidence === 0;

    return true;
  });

  const highCount = targetFirstMappings.filter((m) => m.confidence >= 0.85 && m.source_field !== 'UNMATCHED').length;
  const needsReviewCount = targetFirstMappings.filter((m) => m.confidence < 0.85 && m.source_field !== 'UNMATCHED').length;
  const unmatchedCount = targetFirstMappings.filter((m) => m.source_field === 'UNMATCHED' || m.confidence === 0).length;

  const allIds = targetFirstMappings.map((m) => m.target_field);
  const checkedCount = allIds.filter((id) => Boolean(checkedFieldIds[id])).length;
  const isAllVerified = allIds.length > 0 && checkedCount === allIds.length;

  const handleHeaderToggleCheckAll = () => {
    if (isAllVerified) {
      uncheckAllFields(allIds);
    } else {
      checkAllFields(allIds);
    }
  };

  const selectedMappingsToConfirm = React.useMemo(() => {
    const checkedTargets = allIds.filter((id) => Boolean(checkedFieldIds[id]));
    const targetsToUse = checkedTargets.length > 0 ? checkedTargets : allIds;
    return targetFirstMappings.filter((m) => targetsToUse.includes(m.target_field));
  }, [allIds, checkedFieldIds, targetFirstMappings]);

  const handleExecuteConfirmAll = () => {
    const targets = selectedMappingsToConfirm.map((m) => m.target_field);
    confirmAllMappings(targets);
    setIsConfirmModalOpen(false);
    setConfirmedSuccessMsg(`ยืนยันการจับคู่คอลัมน์มาตรฐานสำเร็จครบ ${targets.length} ฟิลด์แล้ว พร้อมดำเนินการในขั้นตอนถัดไป`);
    setTimeout(() => {
      setConfirmedSuccessMsg(null);
    }, 7000);
  };

  return (
    <div className="space-y-4 w-full relative">
      {/* Top Banner & Visual Accuracy Overview */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-900 shadow-2xs">
              <Sparkles className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-[#2e1d52]">
                  ตารางจับคู่ฟิลด์อัจฉริยะ (Target-First KKP Field Mapping Table)
                </h2>
                <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs">
                  ความแม่นยำรวม AI: {avgAccuracyPct}% ({matchedRequiredCount}/8 ฟิลด์หลัก KKP)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                เลือกจับคู่คอลัมน์จากไฟล์อัปโหลดลงในตารางมาตรฐาน KKP ได้โดยตรงในตาราง หรือคลิกดูรายละเอียด AI
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSchemaModalOpen(true)}
            className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-950 rounded-xl text-xs font-extrabold border border-purple-300 transition flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <Eye className="w-4 h-4 text-purple-700" />
            <span>ดูโครงสร้าง KKP (8 ฟิลด์หลัก)</span>
          </button>
        </div>

        {/* Sheet Tabs Filter */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-200 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 text-slate-700 text-xs font-extrabold mr-2 flex-shrink-0 select-none">
            <Layers className="w-4 h-4 text-purple-700" />
            <span>แผ่นงาน (Sheet):</span>
          </div>

          {availableSheets.map((sName, idx) => {
            const isActive = currentActiveSheet === sName || (idx === 0 && (!currentActiveSheet || !availableSheets.includes(currentActiveSheet)));

            return (
              <button
                key={sName}
                onClick={() => setActiveSheetName(sName)}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#2e1d52] text-white shadow-md scale-[1.01]"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{sName}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-lg font-mono ${
                    isActive ? "bg-purple-800 text-white font-extrabold" : "bg-slate-200 text-slate-800 font-extrabold"
                  }`}
                >
                  {matchedRequiredCount}/8 ฟิลด์ KKP ({availableSourceFields.length} ฟิลด์ต้นทาง, {process?.extractedRecords?.length || process?.row_count || 43} แถว)
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Bar & Search Input (4 Segmented Controls) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'All', label: `ทั้งหมด (${totalTargetFields})` },
              { id: 'High', label: `ความเชื่อมั่นสูง (${highCount})` },
              { id: 'NeedsReview', label: `ต้องตรวจสอบ (${needsReviewCount})` },
              { id: 'Unmatched', label: `ยังไม่จับคู่ (${unmatchedCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setConfidenceFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg transition text-xs font-extrabold cursor-pointer ${
                  (confidenceFilter || 'All') === f.id
                    ? 'bg-white text-purple-950 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาฟิลด์มาตรฐาน / คอลัมน์ต้นทาง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white text-slate-900 placeholder-slate-400 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {confirmedSuccessMsg && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 rounded-2xl shadow-md border border-emerald-400 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white flex-shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-sm flex items-center gap-2">
                <span>ยืนยันการจับคู่คอลัมน์สำเร็จเรียบร้อย!</span>
                <span className="bg-white text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  100% Confirmed
                </span>
              </div>
              <p className="text-emerald-100 text-xs mt-0.5 font-medium">
                {confirmedSuccessMsg}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <button
              onClick={() => {
                updateProcessStep(3);
                setCurrentStep(3);
              }}
              className="px-4 py-2 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl text-xs font-black shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <span>ไปยัง Step 3: ตรวจสอบการจัด Format & ข้อมูล</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmedSuccessMsg(null)}
              className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Select All & Bulk Action Bar */}
      {checkedCount > 0 && (
        <div className="bg-gradient-to-r from-[#281647] via-[#381f66] to-[#1e1037] text-white p-4 rounded-2xl border border-purple-400/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-inner flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm text-white tracking-wide">
                  เลือกแล้ว {checkedCount} / {allIds.length} ฟิลด์มาตรฐาน KKP
                </span>
                {isAllVerified ? (
                  <span className="bg-emerald-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                    เลือกครบ 100% แล้ว
                  </span>
                ) : (
                  <button
                    onClick={() => checkAllFields(allIds)}
                    className="text-[11px] text-amber-300 hover:text-amber-200 underline font-bold cursor-pointer"
                  >
                    (คลิกเลือกทั้งหมด {allIds.length} ฟิลด์)
                  </button>
                )}
              </div>
              <p className="text-purple-200/80 text-xs mt-0.5 font-medium">
                กดปุ่มเพื่อยืนยันว่าการจับคู่คอลัมน์ทั้งหมดถูกต้อง เพื่อเปิดใช้งานการดูตัวอย่างและส่งออกไฟล์
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto flex-shrink-0">
            <button
              onClick={() => uncheckAllFields(allIds)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-purple-200 hover:text-white bg-purple-950/70 border border-purple-700/70 hover:bg-purple-900 transition cursor-pointer"
            >
              ยกเลิกการเลือก
            </button>

            <button
              onClick={() => setIsConfirmModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs shadow-lg hover:shadow-xl transition flex items-center gap-2 cursor-pointer ring-2 ring-emerald-300/40 hover:scale-[1.02]"
            >
              <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>ยืนยันทั้งหมดว่าถูกต้องที่ Map Column</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Target-First Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-extrabold text-[11px]">
                <th className="py-3 px-4 w-12 text-center select-none">
                  <input
                    type="checkbox"
                    checked={isAllVerified}
                    onChange={handleHeaderToggleCheckAll}
                    className="w-4 h-4 accent-purple-700 cursor-pointer rounded"
                    title="เลือกทุกแถวฟิลด์มาตรฐาน"
                  />
                </th>

                <th className="py-3 px-4 w-1/4">
                  <span>TARGET FIELD (ฟิลด์มาตรฐาน KKP)</span>
                </th>

                <th className="py-3 px-4 w-1/3">
                  <span>MAPPED SOURCE COLUMN (คอลัมน์จากไฟล์อัปโหลด)</span>
                </th>

                <th className="py-3 px-4 w-1/5">
                  <span>AI CONFIDENCE (ความแม่นยำ AI)</span>
                </th>

                <th className="py-3 px-4 text-right">
                  {checkedCount > 0 ? (
                    <button
                      onClick={() => setIsConfirmModalOpen(true)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[10px] transition inline-flex items-center gap-1 shadow-xs cursor-pointer"
                      title="ยืนยันคอลัมน์ที่เลือกทั้งหมด"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>ยืนยัน {checkedCount} ฟิลด์</span>
                    </button>
                  ) : (
                    <span>การจัดการ</span>
                  )}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredMappings.length > 0 ? (
                filteredMappings.map((m) => {
                  const targetFieldId = m.target_field;
                  const isChecked = Boolean(checkedFieldIds[targetFieldId]);
                  const isSelected = selectedMapping?.target_field === m.target_field;
                  const confPct = Math.round((m.confidence || 0) * 100);

                  let confBadge = (
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300 flex items-center gap-1 w-max">
                      <span>{confPct}% (สูง)</span>
                    </span>
                  );
                  let barColor = 'bg-emerald-500';

                  if (m.source_field === 'UNMATCHED' || confPct === 0) {
                    confBadge = (
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-slate-100 text-slate-600 rounded-full border border-slate-300 flex items-center gap-1 w-max">
                        <span>ยังไม่จับคู่</span>
                      </span>
                    );
                    barColor = 'bg-slate-300';
                  } else if (confPct < 85) {
                    confBadge = (
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-900 rounded-full border border-amber-300 flex items-center gap-1 w-max">
                        <span>{confPct}% (ต้องตรวจสอบ)</span>
                      </span>
                    );
                    barColor = 'bg-amber-500';
                  }

                  return (
                    <tr
                      key={targetFieldId}
                      className={`transition hover:bg-purple-50/40 ${
                        isSelected ? 'bg-purple-50/80 border-l-4 border-l-purple-700' : isChecked ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheckField(targetFieldId)}
                          className="w-4 h-4 accent-purple-700 cursor-pointer rounded"
                        />
                      </td>

                      {/* Target Field Standard Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-xs">
                            {m.target_field}
                          </span>
                          {m.target_required ? (
                            <span className="text-[9px] font-black bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded border border-rose-200 uppercase">
                              จำเป็น
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">
                              ทางเลือก
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          ประเภท: <span className="font-mono text-purple-900">{m.target_data_type || 'String'}</span> ({m.target_format || 'Text'})
                        </div>
                      </td>

                      {/* Mapped Source Column (Interactive Selector + Sample Value) */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1.5">
                          <select
                            value={m.source_field === 'UNMATCHED' ? '' : m.source_field}
                            onChange={(e) => {
                              const val = e.target.value;
                              const sample = getFieldSample(val);
                              updateMappingSource(m.target_field, val || 'UNMATCHED');
                              if (val && sample) {
                                updateSourceSampleValue(val, sample);
                              }
                            }}
                            className={`w-full max-w-xs px-2.5 py-1.5 text-xs rounded-xl border font-extrabold transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                              m.source_field === 'UNMATCHED'
                                ? 'bg-slate-50 text-slate-400 border-slate-300'
                                : 'bg-white text-purple-950 border-purple-300 shadow-2xs'
                            }`}
                          >
                            <option value="">[-- ไม่ใช้งาน / ไม่พบในไฟล์ --]</option>
                            {availableSourceFields.map((sf) => {
                              const sampleVal = getFieldSample(sf);
                              return (
                                <option key={sf} value={sf}>
                                  {sf} {sampleVal ? `(ตัวอย่าง: ${sampleVal})` : '(ไม่มีข้อมูลตัวอย่าง)'}
                                </option>
                              );
                            })}
                          </select>

                          <div className="text-[11px] text-slate-500 font-normal truncate flex items-center gap-1">
                            <span>ตัวอย่างข้อมูล:</span>
                            {m.source_field === 'UNMATCHED' || !m.source_field ? (
                              <span className="text-slate-400 italic">ไม่ได้จับคู่ / ไม่มีข้อมูล</span>
                            ) : (
                              <span className="text-slate-900 font-semibold font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {m.source_sample && m.source_sample !== '-'
                                  ? m.source_sample
                                  : getFieldSample(m.source_field) || '-'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* AI Confidence Progress Bar & Badge */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          {confBadge}
                          <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${barColor} transition-all duration-300`}
                              style={{ width: `${confPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openDrawer(m)}
                          className="px-3 py-1.5 text-xs font-extrabold text-purple-900 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-xl transition inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <span>ดูรายละเอียด AI</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs font-semibold">
                    ไม่พบรายการฟิลด์ที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schema Definition Modal */}
      {isSchemaModalOpen && (
        <SchemaDefinitionModal isOpen={isSchemaModalOpen} onClose={() => setIsSchemaModalOpen(false)} />
      )}

      {/* Confirmation Review Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#2e1d52] via-[#3b2468] to-[#1e1336] text-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-md">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      ยืนยันการจับคู่คอลัมน์ทั้งหมด (Confirm Column Mappings)
                    </h3>
                    <p className="text-purple-200/80 text-xs mt-0.5 font-medium">
                      กรุณาตรวจสอบความถูกต้องของฟิลด์มาตรฐาน KKP และคอลัมน์จากไฟล์ก่อนยืนยัน
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="text-purple-200 hover:text-white p-1 rounded-lg hover:bg-purple-800/60 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl text-center">
                  <div className="text-[11px] font-bold text-purple-700">ฟิลด์ที่เลือกยืนยัน</div>
                  <div className="text-xl font-black text-purple-950 mt-0.5">{selectedMappingsToConfirm.length} ฟิลด์</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                  <div className="text-[11px] font-bold text-emerald-700">จับคู่คอลัมน์แล้ว</div>
                  <div className="text-xl font-black text-emerald-900 mt-0.5">
                    {selectedMappingsToConfirm.filter(m => m.source_field && m.source_field !== 'UNMATCHED').length} ฟิลด์
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
                  <div className="text-[11px] font-bold text-amber-700">ยังไม่ระบุ (UNMATCHED)</div>
                  <div className="text-xl font-black text-amber-900 mt-0.5">
                    {selectedMappingsToConfirm.filter(m => !m.source_field || m.source_field === 'UNMATCHED').length} ฟิลด์
                  </div>
                </div>
              </div>

              {/* Warning if any unmatched */}
              {selectedMappingsToConfirm.some(m => !m.source_field || m.source_field === 'UNMATCHED') && (
                <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold">คำเตือน:</span> มีบางฟิลด์ที่ยังไม่ได้เลือกคอลัมน์ต้นทาง (UNMATCHED) หากกดยืนยัน ระบบจะใช้ค่าว่างสำหรับฟิลด์เหล่านั้น
                  </div>
                </div>
              )}

              {/* Review Mapping List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Target Field (KKP)</th>
                      <th className="py-2.5 px-3 text-center">ทิศทาง</th>
                      <th className="py-2.5 px-3">คอลัมน์จากไฟล์ต้นทาง</th>
                      <th className="py-2.5 px-3 text-right">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {selectedMappingsToConfirm.map((m) => {
                      const isMatched = m.source_field && m.source_field !== 'UNMATCHED';
                      return (
                        <tr key={m.target_field} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <span className="font-black text-purple-950">{m.target_field}</span>
                            <span className="text-[10px] text-slate-500 font-mono ml-1.5">({m.target_data_type || 'String'})</span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-400 font-bold">←</td>
                          <td className="py-2.5 px-3">
                            {isMatched ? (
                              <div>
                                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {m.source_field}
                                </span>
                                {m.source_sample && m.source_sample !== '-' && (
                                  <span className="text-[10px] text-slate-500 ml-1.5 font-mono">
                                    (ตัวอย่าง: {m.source_sample})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-rose-600 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                ไม่ได้ระบุ (UNMATCHED)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isMatched ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <Check className="w-3 h-3" />
                                 ยืนยัน
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                ค่าว่าง
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
              >
                ยกเลิก / กลับไปแก้ไข
              </button>

              <button
                onClick={handleExecuteConfirmAll}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black rounded-xl text-xs shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer ring-2 ring-emerald-300/40"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>ยืนยันความถูกต้องทั้งหมด ({selectedMappingsToConfirm.length} ฟิลด์)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export function ensureAllTargetFieldsPresent(mappings: FieldMapping[]): FieldMapping[] {
  return mappings;
}



export const SchemaDefinitionModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-purple-100 overflow-hidden space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-900 shadow-2xs">
              <Sparkles className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2e1d52]">
                โครงสร้างเทมเพลตมาตรฐาน KKP (KKP Target Standard Schema)
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                8 ฟิลด์หลักที่ใช้แปลงไฟล์ข้อมูลธุรกรรมการซื้อขายหลักทรัพย์ของ KKP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] space-y-3 pr-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">ชื่อฟิลด์มาตรฐาน</th>
                <th className="py-2.5 px-3">ประเภทข้อมูล</th>
                <th className="py-2.5 px-3">ข้อกำหนด</th>
                <th className="py-2.5 px-3">คำอธิบายรายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {STANDARD_KKP_TARGET_FIELDS.map((tf, idx) => (
                <tr key={tf.id} className="hover:bg-purple-50/30">
                  <td className="py-3 px-3 text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3 px-3 font-extrabold text-purple-950">{tf.name}</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{tf.data_type} ({tf.format})</td>
                  <td className="py-3 px-3">
                    {tf.required ? (
                      <span className="bg-rose-100 text-rose-800 text-[9px] font-black px-2 py-0.5 rounded border border-rose-200 uppercase">
                        จำเป็น
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                        ทางเลือก
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-xs">{tf.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="purple-gradient-btn px-6 py-2.5 rounded-xl text-xs font-bold shadow-md"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
