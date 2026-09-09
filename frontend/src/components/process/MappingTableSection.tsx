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
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useProcessStore, calculateFieldMappingConfidence, getAiDerivedFieldValue, matchTargetToSourceField, generateAiRecommendedTemplateFromFile, checkAllSheetsVerification } from '@/store/useProcessStore';
import { FieldMapping, AILearnedRule, TargetTemplate } from '@/types';
import { FullScreenStep2ConfirmationModal } from './FullScreenStep2ConfirmationModal';
import { CreateTemplateModal } from '../templates/CreateTemplateModal';


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

  // If no data found in actual rows, return empty (never guess fake values)
  return '';
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
    templates,
    switchTemplate,
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
    aiLearnedRules = [],
    addLearnedRule,
  } = useProcessStore();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [confirmedSuccessMsg, setConfirmedSuccessMsg] = useState<string | null>(null);
  const [aiTrainedAlert, setAiTrainedAlert] = useState<{ source: string; target: string } | null>(null);
  const [isFullScreenConfirmOpen, setIsFullScreenConfirmOpen] = useState<boolean>(false);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState<boolean>(false);

  React.useEffect(() => {
    if (aiTrainedAlert) {
      const timer = setTimeout(() => setAiTrainedAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [aiTrainedAlert]);

  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState<boolean>(false);

  const availableSheets: string[] = (process?.sheets && process.sheets.length > 0)
    ? process.sheets
    : [process?.file_name ? process.file_name.replace(/\.[^/.]+$/, "") : "Sheet1"];

  const currentActiveSheet = (activeSheetName && availableSheets.includes(activeSheetName))
    ? activeSheetName
    : availableSheets[0];

  const activeTemplate = React.useMemo(() => {
    return templates.find((t) => t.id === process?.target_template_id || t.name === process?.target_template) || templates[0];
  }, [templates, process]);

  const activeTargetFields = React.useMemo(() => {
    return activeTemplate?.fields && activeTemplate.fields.length > 0 ? activeTemplate.fields : STANDARD_KKP_TARGET_FIELDS;
  }, [activeTemplate]);

  // Extract ONLY original source column headers directly from uploaded raw file/sheet
  const availableSourceFields: string[] = React.useMemo(() => {
    // 1. If original sheet headers exist directly from Excel extraction, use them!
    const sheetHeaders = process?.sheetDataMap?.[currentActiveSheet]?.headers;
    if (sheetHeaders && sheetHeaders.length > 0) {
      return sheetHeaders;
    }

    const targetNames = new Set((activeTargetFields || []).map((tf) => tf.name.toUpperCase()));
    const list: string[] = [];

    // 2. Mappings source fields (excluding UNMATCHED and target template fields)
    const sheetMappings = process?.sheetDataMap?.[currentActiveSheet]?.mappings || process?.mappings || [];
    sheetMappings.forEach((m) => {
      if (
        m.source_field &&
        m.source_field !== 'UNMATCHED' &&
        !targetNames.has(m.source_field.toUpperCase()) &&
        !list.includes(m.source_field)
      ) {
        list.push(m.source_field);
      }
    });

    // 3. Original sheet rows keys (excluding augmented target fields)
    const sheetRows = process?.sheetDataMap?.[currentActiveSheet]?.rows || [];
    if (sheetRows.length > 0) {
      Object.keys(sheetRows[0] || {}).forEach((k) => {
        if (
          k &&
          k !== 'id' &&
          k !== 'sheetName' &&
          k !== 'isEdited' &&
          !targetNames.has(k.toUpperCase()) &&
          !list.includes(k)
        ) {
          list.push(k);
        }
      });
    }

    if (list.length === 0) {
      return ['Fund_Name', 'Fund_Code', 'Trade Date', 'Settlement Date', 'CCY', 'NAV', 'Qty', 'Amount', 'Broker_Code'];
    }
    return list;
  }, [process, currentActiveSheet, activeTargetFields]);

  // Helper to get sample value for any source field before and after selection
  const getFieldSample = (sf: string) => getSourceFieldSample(sf, process, currentActiveSheet);

  const targetFirstMappings: FieldMapping[] = React.useMemo(() => {
    const currentMappings = process?.sheetDataMap?.[currentActiveSheet]?.mappings || process?.mappings || [];
    const firstRow = process?.sheetDataMap?.[currentActiveSheet]?.rows?.[0] || process?.extractedRecords?.[0];

    return activeTargetFields.map((tf, idx) => {
      const match = currentMappings.find(
        (m) => m.target_field && m.target_field.trim().toUpperCase() === tf.name.toUpperCase()
      );

      if (match && match.source_field && match.source_field !== 'UNMATCHED') {
        const rawLive = (firstRow && firstRow[match.source_field] !== undefined && String(firstRow[match.source_field]).trim() !== '')
          ? String(firstRow[match.source_field]) 
          : (getSourceFieldSample(match.source_field, process, currentActiveSheet) || '');

        const liveSample = rawLive && rawLive.trim() !== '' ? getAiDerivedFieldValue(tf.name, match.source_field, rawLive, firstRow, 0) : '-';
        const scoring = calculateFieldMappingConfidence(match.source_field, tf.name, rawLive || liveSample, tf.data_type);

        const isLearned = Boolean(
          match.is_learned ||
          (aiLearnedRules || []).some(
            (r) =>
              r.is_active &&
              match.source_field &&
              r.source_field.trim().toLowerCase() === match.source_field.trim().toLowerCase() &&
              r.target_field.trim().toUpperCase() === tf.name.toUpperCase()
          )
        );

        const isExplicitlyFalse =
          checkedFieldIds[`${currentActiveSheet}::${tf.name}`] === false ||
          checkedFieldIds[tf.name] === false ||
          (match.source_field && (checkedFieldIds[`${currentActiveSheet}::${match.source_field}`] === false || checkedFieldIds[match.source_field] === false));

        const isUserVerified = !isExplicitlyFalse && Boolean(
          checkedFieldIds[`${currentActiveSheet}::${tf.name}`] ||
          checkedFieldIds[tf.name] ||
          (match.source_field && checkedFieldIds[`${currentActiveSheet}::${match.source_field}`]) ||
          (match.source_field && checkedFieldIds[match.source_field]) ||
          (match.id && (checkedFieldIds[`${currentActiveSheet}::${match.id}`] || checkedFieldIds[match.id])) ||
          isLearned ||
          match.status === 'ACCEPTED'
        );

        const isMismatch = !isUserVerified && !isLearned && !!scoring.isTypeMismatch;
        const finalConfidence = isLearned || isUserVerified 
          ? 1.0 
          : (isMismatch ? scoring.confidence : scoring.confidence);
        const finalConfLevel = isLearned || isUserVerified 
          ? 'High' 
          : (isMismatch ? 'Low' : scoring.confidenceLevel);
        const finalStatus = isLearned || isUserVerified 
          ? 'ACCEPTED' 
          : (isMismatch ? 'SUGGESTED' : (match.status === 'MODIFIED' ? 'MODIFIED' : 'SUGGESTED'));

        return {
          ...match,
          is_learned: isLearned,
          confidence: finalConfidence,
          confidence_level: finalConfLevel,
          status: finalStatus,
          source_sample: liveSample,
          target_field: tf.name,
          target_data_type: tf.data_type,
          target_required: tf.required,
          target_format: tf.format,
          reasons: isLearned
            ? [`แมชตามกฎความจำที่ผู้ใช้สอน AI (100% AI Trained Rule: ${match.source_field} -> ${tf.name})`]
            : isUserVerified
            ? ['ผู้ใช้งานตรวจสอบและยืนยันการจับคู่คอลัมน์นี้แล้ว (100% Verified)']
            : [scoring.reason || `AI วิเคราะห์ความสอดคล้องกับ '${match.source_field}'`],
        };
      }

      // If no pre-existing match found, run matchTargetToSourceField against availableSourceFields
      const aiMatch = matchTargetToSourceField(tf.name, availableSourceFields);
      const isActuallyMatched = aiMatch.matchedCol !== 'UNMATCHED';
      const chosenCol = isActuallyMatched ? aiMatch.matchedCol : 'UNMATCHED';

      const rawLive = firstRow && isActuallyMatched ? firstRow[chosenCol] : undefined;
      const derivedSample = isActuallyMatched && rawLive !== undefined && rawLive !== null && String(rawLive).trim() !== '' 
        ? getAiDerivedFieldValue(tf.name, chosenCol, rawLive, firstRow, 0) 
        : '-';
      const scoring = isActuallyMatched ? calculateFieldMappingConfidence(chosenCol, tf.name, rawLive || derivedSample, tf.data_type) : { confidence: 0, confidenceLevel: 'Unmatched' as const, reason: '', isTypeMismatch: false };

      const isLearned = Boolean(
        isActuallyMatched &&
        (aiLearnedRules || []).some(
          (r) =>
            r.is_active &&
            r.source_field.trim().toLowerCase() === chosenCol.trim().toLowerCase() &&
            r.target_field.trim().toUpperCase() === tf.name.toUpperCase()
        )
      );

      const isExplicitlyFalse2 =
        checkedFieldIds[`${currentActiveSheet}::${tf.name}`] === false ||
        checkedFieldIds[tf.name] === false ||
        (chosenCol !== 'UNMATCHED' && (checkedFieldIds[`${currentActiveSheet}::${chosenCol}`] === false || checkedFieldIds[chosenCol] === false));

      const isUserVerified = !isExplicitlyFalse2 && Boolean(
        checkedFieldIds[`${currentActiveSheet}::${tf.name}`] ||
        checkedFieldIds[tf.name] ||
        (chosenCol !== 'UNMATCHED' && (checkedFieldIds[`${currentActiveSheet}::${chosenCol}`] || checkedFieldIds[chosenCol])) ||
        isLearned
      );

      const isMismatch = !isUserVerified && !isLearned && !!scoring.isTypeMismatch;
      const finalConfidence = isLearned || isUserVerified
        ? 1.0
        : isActuallyMatched
        ? (isMismatch ? scoring.confidence : scoring.confidence)
        : 0;
      const finalConfLevel = isLearned || isUserVerified 
        ? 'High' 
        : isActuallyMatched 
        ? (isMismatch ? 'Low' : scoring.confidenceLevel) 
        : 'Unmatched';
      const finalStatus = isLearned || isUserVerified 
        ? 'ACCEPTED' 
        : isActuallyMatched 
        ? (isMismatch ? 'SUGGESTED' : 'SUGGESTED') 
        : 'UNMATCHED';

      return {
        id: `tf_map_${tf.name}`,
        process_id: process?.id || 'proc_demo',
        source_field: chosenCol,
        source_sample: derivedSample,
        source_data_type: tf.data_type === 'Decimal' ? 'Decimal' : tf.data_type === 'Date' ? 'Date' : 'String',
        target_field: tf.name,
        target_data_type: tf.data_type,
        target_required: tf.required,
        target_format: tf.format,
        is_learned: isLearned,
        confidence: finalConfidence,
        confidence_level: finalConfLevel,
        status: finalStatus,
        reasons: isLearned
          ? [`แมชตามกฎความจำที่ผู้ใช้สอน AI (100% AI Trained Rule: ${chosenCol} -> ${tf.name})`]
          : isUserVerified
          ? ['ผู้ใช้งานตรวจสอบและยืนยันการจับคู่คอลัมน์นี้แล้ว (100% Verified)']
          : [
              isActuallyMatched
                ? (scoring.reason || aiMatch.reason)
                : `ไม่พบคอลัมน์ที่สอดคล้องกับ '${tf.name}' ในไฟล์นี้ (Unmatched)`
            ],
      };
    });
  }, [process, currentActiveSheet, activeTargetFields, availableSourceFields, activeTemplate, checkedFieldIds, aiLearnedRules]);

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
    if (filter === 'High') return m.confidence >= 0.80 && m.source_field !== 'UNMATCHED';
    if (filter === 'NeedsReview' || filter === 'Amber') return (m.confidence < 0.80 && m.confidence >= 0.60 && m.source_field !== 'UNMATCHED');
    if (filter === 'Low') return (m.confidence < 0.60 && m.source_field !== 'UNMATCHED');
    if (filter === 'Unmatched') return m.source_field === 'UNMATCHED' || m.confidence === 0;

    return true;
  });

  const highCount = targetFirstMappings.filter((m) => m.confidence >= 0.80 && m.source_field !== 'UNMATCHED').length;
  const needsReviewCount = targetFirstMappings.filter((m) => m.confidence < 0.80 && m.confidence >= 0.60 && m.source_field !== 'UNMATCHED').length;
  const lowCount = targetFirstMappings.filter((m) => m.confidence < 0.60 && m.source_field !== 'UNMATCHED').length;
  const unmatchedCount = targetFirstMappings.filter((m) => m.source_field === 'UNMATCHED' || m.confidence === 0).length;
  const unmatchedRatio = totalTargetFields > 0 ? unmatchedCount / totalTargetFields : 0;
  const isUnmatchedOver40 = unmatchedRatio >= 0.4;

  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState<boolean>(false);

  const aiExtractedTemplate: TargetTemplate = React.useMemo(() => {
    return generateAiRecommendedTemplateFromFile(process, currentActiveSheet);
  }, [process, currentActiveSheet]);

  const isRowVerified = (m: FieldMapping) => {
    const isExplicitlyFalse = 
      checkedFieldIds[`${currentActiveSheet}::${m.target_field}`] === false ||
      checkedFieldIds[m.target_field] === false ||
      (m.source_field && (checkedFieldIds[`${currentActiveSheet}::${m.source_field}`] === false || checkedFieldIds[m.source_field] === false));
    if (isExplicitlyFalse) return false;

    return Boolean(
      checkedFieldIds[`${currentActiveSheet}::${m.target_field}`] ||
      checkedFieldIds[m.target_field] ||
      (m.source_field && checkedFieldIds[`${currentActiveSheet}::${m.source_field}`]) ||
      (m.source_field && checkedFieldIds[m.source_field]) ||
      (m.id && (checkedFieldIds[`${currentActiveSheet}::${m.id}`] || checkedFieldIds[m.id])) ||
      m.status === 'ACCEPTED' ||
      m.is_learned ||
      (aiLearnedRules || []).some(
        (r) =>
          r.is_active &&
          m.source_field &&
          m.source_field !== 'UNMATCHED' &&
          r.source_field.trim().toLowerCase() === m.source_field.trim().toLowerCase() &&
          r.target_field.trim().toUpperCase() === m.target_field.trim().toUpperCase()
      )
    );
  };

  const allIds = targetFirstMappings.map((m) => m.target_field);
  const checkedCount = targetFirstMappings.filter(isRowVerified).length;
  const isAllVerified = allIds.length > 0 && checkedCount === allIds.length;

  const multiSheetStatus = React.useMemo(() => {
    return checkAllSheetsVerification(process, templates, checkedFieldIds, currentActiveSheet);
  }, [process, templates, checkedFieldIds, currentActiveSheet]);

  const handleHeaderToggleCheckAll = () => {
    if (isAllVerified) {
      uncheckAllFields(allIds, currentActiveSheet);
    } else {
      checkAllFields(allIds, currentActiveSheet);
    }
  };

  const selectedMappingsToConfirm = React.useMemo(() => {
    const checkedTargets = targetFirstMappings.filter(isRowVerified).map((m) => m.target_field);
    const targetsToUse = checkedTargets.length > 0 ? checkedTargets : allIds;
    return targetFirstMappings.filter((m) => targetsToUse.includes(m.target_field));
  }, [allIds, targetFirstMappings, checkedFieldIds, currentActiveSheet]);

  const handleExecuteConfirmAll = () => {
    const targets = selectedMappingsToConfirm.map((m) => m.target_field);
    confirmAllMappings(targets);
    checkAllFields(targets, currentActiveSheet);
    setIsConfirmModalOpen(false);
    setIsFullScreenConfirmOpen(true);
    setConfirmedSuccessMsg(`ยืนยันการจับคู่คอลัมน์มาตรฐานสำเร็จครบ ${targets.length} ฟิลด์แล้ว พร้อมดำเนินการในขั้นตอนถัดไป`);
    setTimeout(() => {
      setConfirmedSuccessMsg(null);
    }, 7000);
  };

  return (
    <div className="space-y-4 w-full relative">
      {/* AI Recommendation Banner when Unmatched > 40% */}
      {isUnmatchedOver40 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-amber-500/15 border-2 border-amber-400 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md animate-in fade-in">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 bg-amber-100 border border-amber-300 rounded-2xl flex items-center justify-center text-amber-900 flex-shrink-0 shadow-xs">
              <AlertTriangle className="w-6 h-6 text-amber-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className="font-black text-[#2e1d52] text-sm">
                  AI แนะนำ: ตรวจพบฟิลด์ที่ไม่ตรงกัน (Unmatched) สูงถึง {Math.round(unmatchedRatio * 100)}% (มากกว่า 40%)
                </h4>
                <span className="bg-amber-400 text-amber-950 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  AI Recommended Action
                </span>
              </div>
              <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                โครงสร้างคอลัมน์ในไฟล์นี้แตกต่างจาก Template ปัจจุบันเกิน 40% ({unmatchedCount}/{totalTargetFields} ฟิลด์) AI ได้วิเคราะห์โครงสร้างข้อมูลจริงจากไฟล์ <strong className="text-purple-950 font-bold">{process?.file_name}</strong> (อ่านพบ {availableSourceFields.length} คอลัมน์) และแนะนำให้ <strong>สร้าง Template ใหม่เพิ่ม</strong> โดยระบบจะยึดตามคอลัมน์และค่าข้อมูลที่อ่านได้จริงจากไฟล์ พร้อมคำอธิบาย AI ในแต่ละฟิลด์
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateTemplateOpen(true)}
            className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition cursor-pointer scale-[1.02] flex-shrink-0 border border-amber-300"
          >
            <Sparkles className="w-4 h-4 text-purple-950 stroke-[2.5]" />
            <span>สร้าง Template ใหม่โดยอิงจากข้อมูลไฟล์นี้ ({availableSourceFields.length} คอลัมน์ + AI Reason)</span>
          </button>
        </div>
      )}

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

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSwitchModalOpen(true)}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-xl text-xs font-extrabold border border-amber-300 transition flex items-center gap-2 shadow-2xs cursor-pointer"
              title="หาก AI เลือก Template ผิด คลิกที่นี่เพื่อเลือกเปลี่ยน Template ที่ถูกต้อง"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-700" />
              <span>Template: <strong className="font-mono">{process?.target_template || 'KKP_CUSTODIAN_TRADE_V2'}</strong> (แก้ไข/เปลี่ยน)</span>
            </button>

            <button
              onClick={() => setIsSchemaModalOpen(true)}
              className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-950 rounded-xl text-xs font-extrabold border border-purple-300 transition flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <Eye className="w-4 h-4 text-purple-700" />
              <span>ดูโครงสร้าง KKP ({targetFirstMappings.length} ฟิลด์หลัก)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-slate-200 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 text-slate-700 text-xs font-extrabold mr-2 flex-shrink-0 select-none">
            <Layers className="w-4 h-4 text-purple-700" />
            <span>แผ่นงาน (Sheet):</span>
          </div>

          {availableSheets.map((sName, idx) => {
            const isActive = currentActiveSheet === sName || (idx === 0 && (!currentActiveSheet || !availableSheets.includes(currentActiveSheet)));
            const sp = multiSheetStatus.sheetsProgress.find((p) => p.sheetName === sName);
            const isSheetDone = sp?.isCompleted ?? false;

            return (
              <button
                key={sName}
                onClick={() => setActiveSheetName(sName)}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#2e1d52] text-white shadow-md scale-[1.01]"
                    : isSheetDone
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
                }`}
              >
                {isSheetDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <span>{sName}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-lg font-mono ${
                    isActive
                      ? "bg-purple-800 text-white font-extrabold"
                      : isSheetDone
                      ? "bg-emerald-200/80 text-emerald-950 font-extrabold"
                      : "bg-slate-200 text-slate-800 font-extrabold"
                  }`}
                >
                  {isSheetDone
                    ? `✓ ตรวจครบแล้ว (${sp?.total || 8}/${sp?.total || 8})`
                    : `${sp?.verifiedCount || 0}/${sp?.total || 8} ตรวจแล้ว (${availableSourceFields.length} ฟิลด์ต้นทาง)`}
                </span>
              </button>
            );
          })}
        </div>

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

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleHeaderToggleCheckAll}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition border cursor-pointer ${
                isAllVerified
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs'
                  : 'bg-purple-100 text-purple-950 hover:bg-purple-200 border-purple-300 shadow-2xs'
              }`}
              title="คลิกเพื่อเลือกทั้งหมดเพื่อทำเครื่องหมายว่าตรวจสอบความถูกต้องแล้ว"
            >
              <CheckCircle2 className={`w-4 h-4 ${isAllVerified ? 'text-emerald-600' : 'text-purple-700'}`} />
              <span>{isAllVerified ? '✓ ตรวจสอบครบทุกฟิลด์แล้ว (Select All)' : 'Select All เพื่อทำเครื่องหมายว่าตรวจสอบความถูกต้องแล้ว'}</span>
            </button>

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
      </div>

      {aiTrainedAlert && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white p-4 rounded-2xl shadow-xl border border-purple-400/50 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/30 border border-purple-300/40 flex items-center justify-center text-purple-200 flex-shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="font-extrabold text-sm flex items-center gap-2">
                <span>AI ได้รับการเทรนแล้ว (AI Trained & Rule Memorized)!</span>
                <span className="bg-amber-400 text-purple-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Learned Rule
                </span>
              </div>
              <p className="text-purple-200 text-xs mt-0.5 font-medium">
                AI จดจำกฎการจับคู่คอลัมน์ <span className="text-white font-bold bg-white/15 px-1.5 py-0.5 rounded">{aiTrainedAlert.source}</span> ➔ <span className="text-amber-300 font-bold bg-white/15 px-1.5 py-0.5 rounded">{aiTrainedAlert.target}</span> เรียบร้อยและจะนำไปจับคู่อัตโนมัติในทุกไฟล์ถัดไป
              </p>
            </div>
          </div>
          <button
            onClick={() => setAiTrainedAlert(null)}
            className="p-1.5 text-purple-200 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
                  100% CONFIRMED
                </span>
              </div>
              <p className="text-emerald-100 text-xs mt-0.5 font-medium">
                {confirmedSuccessMsg}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <button
              onClick={() => setIsFullScreenConfirmOpen(true)}
              className="px-5 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl text-xs font-black shadow-lg transition flex items-center gap-2 cursor-pointer scale-[1.02] ring-2 ring-white/50"
            >
              <span>ไปยัง Step 3: ตรวจสอบการจัด Format & ข้อมูล</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
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
              onClick={() => setIsFullScreenConfirmOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs shadow-lg hover:shadow-xl transition flex items-center gap-2 cursor-pointer ring-2 ring-emerald-300/40 hover:scale-[1.02]"
            >
              <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
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
                  const isChecked = isRowVerified(m);
                  const isLearned = Boolean(
                    m.is_learned ||
                    (aiLearnedRules || []).some(
                      (r) =>
                        r.is_active &&
                        m.source_field &&
                        m.source_field !== 'UNMATCHED' &&
                        r.source_field.trim().toLowerCase() === m.source_field.trim().toLowerCase() &&
                        r.target_field.trim().toUpperCase() === m.target_field.trim().toUpperCase()
                    )
                  );
                  const confPct = Math.round((m.confidence || 0) * 100);
                  const isSelected = Boolean(
                    selectedMapping && (
                      selectedMapping.target_field === m.target_field ||
                      (m.source_field && m.source_field !== 'UNMATCHED' && selectedMapping.source_field === m.source_field)
                    )
                  );

                  let confBadge = (
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300 flex items-center gap-1 w-max">
                      <span>{confPct}% (สูง)</span>
                    </span>
                  );
                  let barColor = 'bg-emerald-500';

                  if (isLearned) {
                    confBadge = (
                      <span className="px-2.5 py-0.5 text-[10px] font-black bg-purple-100 text-purple-900 rounded-full border border-purple-300 flex items-center gap-1 w-max shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-purple-700 flex-shrink-0" />
                        <span>100% (AI เรียนรู้แล้ว)</span>
                      </span>
                    );
                    barColor = 'bg-purple-600';
                  } else if (isChecked) {
                    confBadge = (
                      <span className="px-2.5 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300 flex items-center gap-1 w-max shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>100% (ตรวจสอบแล้ว)</span>
                      </span>
                    );
                    barColor = 'bg-emerald-500';
                  } else if (m.source_field === 'UNMATCHED' || confPct === 0) {
                    confBadge = (
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-slate-100 text-slate-600 rounded-full border border-slate-300 flex items-center gap-1 w-max">
                        <span>ยังไม่จับคู่ (0%)</span>
                      </span>
                    );
                    barColor = 'bg-slate-300';
                  } else if (confPct <= 30) {
                    confBadge = (
                      <span className="px-2.5 py-0.5 text-[10px] font-black bg-rose-100 text-rose-800 rounded-full border border-rose-300 flex items-center gap-1 w-max shadow-2xs">
                        <span>{confPct}% (ไทป์ไม่ตรง)</span>
                      </span>
                    );
                    barColor = 'bg-rose-500';
                  } else if (confPct < 60) {
                    confBadge = (
                      <span className="px-2.5 py-0.5 text-[10px] font-black bg-amber-100 text-amber-950 rounded-full border border-amber-400 flex items-center gap-1 w-max shadow-2xs">
                        <span>{confPct}% (ความหมายคลุมเครือ)</span>
                      </span>
                    );
                    barColor = 'bg-amber-500';
                  } else if (confPct < 85) {
                    confBadge = (
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-amber-50 text-amber-900 rounded-full border border-amber-300 flex items-center gap-1 w-max">
                        <span>{confPct}% (ปานกลาง)</span>
                      </span>
                    );
                    barColor = 'bg-amber-500';
                  }

                  return (
                    <tr
                      key={targetFieldId}
                      className={`transition ${
                        isSelected
                          ? 'bg-purple-50/80 border-l-4 border-l-purple-700'
                          : isChecked
                          ? 'bg-emerald-50/40 border-l-4 border-l-emerald-500 hover:bg-emerald-50/60'
                          : 'hover:bg-purple-50/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center select-none">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCheckField(targetFieldId, currentActiveSheet)}
                            className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
                            title={isChecked ? 'ตรวจสอบความถูกต้องแล้ว' : 'ทำเครื่องหมายว่าตรวจสอบแล้ว'}
                          />
                        </div>
                      </td>

                      {/* Target Field Standard Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-xs">
                            {m.target_field}
                          </span>
                          {isChecked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-800 rounded-md border border-emerald-300 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                              <span>ตรวจสอบแล้ว</span>
                            </span>
                          ) : m.target_required ? (
                            <span className="text-[9px] font-black bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded border border-rose-200 uppercase">
                              จำเป็น
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">
                              ทางเลือก
                            </span>
                          )}
                          {isChecked && m.target_required && (
                            <span className="text-[9px] font-bold text-slate-400">
                              (จำเป็น)
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
                              if (val && val !== 'UNMATCHED') {
                                // Auto-train AI: persist user mapping rule across files
                                addLearnedRule({
                                  id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                                  column_set_pattern: process?.file_name || 'KKP Excel Format',
                                  source_field: val,
                                  target_field: m.target_field.toUpperCase(),
                                  user_reasoning: `ผู้ใช้จับคู่คอลัมน์ '${val}' เข้ากับ '${m.target_field}' ด้วยตนเอง (AI Trained)`,
                                  learned_at: new Date().toLocaleDateString('th-TH'),
                                  is_active: true,
                                  remember_forever: true,
                                });
                                if (!checkedFieldIds[m.target_field]) {
                                  toggleCheckField(m.target_field);
                                }
                                setAiTrainedAlert({ source: val, target: m.target_field });
                              } else if (!val) {
                                if (checkedFieldIds[m.target_field]) {
                                  toggleCheckField(m.target_field);
                                }
                              }
                            }}
                            className={`w-full max-w-xs px-2.5 py-1.5 text-xs rounded-xl border font-extrabold transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                              m.source_field === 'UNMATCHED'
                                ? 'bg-slate-50 text-slate-400 border-slate-300'
                                : isChecked
                                ? 'bg-white text-emerald-950 border-emerald-300 shadow-2xs'
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
                              style={{ width: isChecked ? '100%' : `${confPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openDrawer(m)}
                          className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition inline-flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                            isChecked
                              ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300'
                              : 'text-purple-900 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-300'
                          }`}
                        >
                          {isChecked ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>ตรวจสอบแล้ว</span>
                            </>
                          ) : (
                            <>
                              <span>ดูรายละเอียด AI</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </>
                          )}
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

      {/* Create Target Template Modal (AI Auto-Extracted with Reasons) */}
      <CreateTemplateModal
        isOpen={isCreateTemplateOpen}
        onClose={() => setIsCreateTemplateOpen(false)}
        initialTemplate={aiExtractedTemplate}
        isAiSaveMode={true}
        onSaveSuccess={async (savedTmpl) => {
          await switchTemplate(savedTmpl.id);
          setIsCreateTemplateOpen(false);
          setConfirmedSuccessMsg(`สร้างและเปิดใช้งาน Template '${savedTmpl.name}' สำเร็จแล้ว ระบบได้จับคู่ฟิลด์ตามโครงสร้างไฟล์ปัจจุบัน 100%`);
        }}
      />

      {/* Full-Screen Multi-Sheet Select All Confirmation Modal */}
      <FullScreenStep2ConfirmationModal
        isOpen={isFullScreenConfirmOpen}
        onClose={() => setIsFullScreenConfirmOpen(false)}
      />

      {/* Switch Target Template Modal */}
      {isSwitchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 border border-amber-300 rounded-xl flex items-center justify-center text-amber-900 font-bold">
                  <SlidersHorizontal className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#2e1d52] text-base">
                    เลือกและแก้ไข Template เป้าหมาย (Switch Target Template)
                  </h3>
                  <p className="text-xs text-slate-500">
                    หาก AI จำแนกประเภทเลือก Template ผิด คุณสามารถเลือกเปลี่ยน Template ที่ถูกต้องได้ที่นี่ AI จะทำการ Re-map ฟิลด์ให้อัตโนมัติ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSwitchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {(templates || []).map((t) => {
                const isSelected = (process?.target_template_id === t.id) || (process?.target_template === t.name);
                return (
                  <div
                    key={t.id || t.name}
                    className={`p-4 rounded-xl border transition flex flex-wrap items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400/30'
                        : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-extrabold text-sm text-[#2e1d52]">
                          {t.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {t.field_count || t.fields?.length || 8} ฟิลด์
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ใช้งานอยู่ (Active)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mb-1">{t.description}</p>
                      {t.ai_training_hints && (
                        <div className="text-[10px] text-purple-700 font-mono flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-600 flex-shrink-0" />
                          <span>AI Hints: {t.ai_training_hints}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={async () => {
                        uncheckAllFields();
                        await switchTemplate(t.id);
                        uncheckAllFields();
                        setIsSwitchModalOpen(false);
                        setConfirmedSuccessMsg(`เปลี่ยนเป็น Template "${t.name}" เรียบร้อย! AI ทำการ Re-map ${t.fields?.length || 8} ฟิลด์ให้อัตโนมัติ (รีเซ็ตสถานะการเลือกทั้งหมดเป็น No Select)`);
                        setTimeout(() => setConfirmedSuccessMsg(null), 5000);
                      }}
                      disabled={isSelected}
                      className={`px-4 py-2 text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'purple-gradient-btn text-white shadow-md cursor-pointer'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isSelected ? 'เลือกใช้งานอยู่' : 'เลือกใช้ Template นี้ & ให้ AI Re-map'}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setIsSwitchModalOpen(false)}
                className="px-5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                ปิดหน้าต่าง
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
  const { process, templates } = useProcessStore();
  const activeTemplate = React.useMemo(() => {
    return templates.find((t) => t.id === process?.target_template_id || t.name === process?.target_template) || templates[0];
  }, [templates, process]);
  const activeTargetFields = React.useMemo(() => {
    return activeTemplate?.fields && activeTemplate.fields.length > 0 ? activeTemplate.fields : STANDARD_KKP_TARGET_FIELDS;
  }, [activeTemplate]);

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
                โครงสร้างเทมเพลตมาตรฐาน KKP ({activeTemplate?.name || 'KKP Target Standard Schema'})
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {activeTargetFields.length} ฟิลด์หลักที่ใช้แปลงไฟล์ข้อมูลตามข้อกำหนดของ KKP
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
              {activeTargetFields.map((tf, idx) => (
                <tr key={tf.id || idx} className="hover:bg-purple-50/30">
                  <td className="py-3 px-3 text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3 px-3 font-extrabold text-purple-950">{tf.name}</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{tf.data_type} ({tf.format || '-'})</td>
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
                  <td className="py-3 px-3 text-slate-600 text-xs">{tf.description || '-'}</td>
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
