'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, Save, AlertCircle, Sparkles, Ban } from 'lucide-react';
import { useProcessStore, calculateFieldMappingConfidence } from '@/store/useProcessStore';
import { sheetMappingMap, getSourceFieldSample } from './MappingTableSection';

const availableSourceFieldsMap: Record<string, { name: string; sample: string }[]> = {
  Custodian_A: [
    { name: 'Fund_Name', sample: 'KKP Short Term Fixed Income Fund' },
    { name: 'Fund_Code', sample: 'F1000' },
    { name: 'Trade Date', sample: '15/07/2026' },
    { name: 'Settlement Date', sample: '17/07/2026' },
    { name: 'CCY', sample: 'THB' },
    { name: 'NAV', sample: '14.1718' },
    { name: 'Qty', sample: '2,500' },
    { name: 'Amount', sample: '35,429.50' },
    { name: 'Broker', sample: 'BLS' },
    { name: 'Fund Type', sample: 'Fixed Income' },
  ],
  Custodian_B: [
    { name: 'Fund', sample: 'Thai Equity Opportunity Fund' },
    { name: 'Fund Identifier', sample: 'FID-2000' },
    { name: 'Transaction_Date', sample: '2026-07-21' },
    { name: 'Settle_Date', sample: '2026-07-23' },
    { name: 'Currency', sample: 'Thai Baht' },
    { name: 'Net Asset Value', sample: '10.0047' },
    { name: 'Quantity', sample: '2500.0000' },
    { name: 'Trade Amount', sample: '25,012 THB' },
    { name: 'Broker_Code', sample: 'YUANTA' },
    { name: 'Broker Full Name', sample: 'Yuanta Securities' },
    { name: 'Product_Type', sample: 'Fixed Income' },
  ],
  FundManager_C: [
    { name: 'Fund Name', sample: 'Emerging Market Equity Fund' },
    { name: 'Date', sample: '18-Aug-2026' },
    { name: 'Currency Code', sample: 'THB' },
    { name: 'Unit Price', sample: '14.2377' },
    { name: 'Units', sample: '10,000' },
    { name: 'Total Value', sample: '142,377 THB' },
    { name: 'Broker Name', sample: 'Kiatnakin Phatra Securities' },
    { name: 'Value Date', sample: '19-Aug-2026' },
    { name: 'Category', sample: 'Money Market' },
  ],
  Target_Format_Reference: [
    { name: 'Field Name', sample: 'FUND_CODE' },
    { name: 'Data Type', sample: 'String' },
    { name: 'Required', sample: 'Required' },
    { name: 'Format', sample: 'YYYY-MM-DD' },
    { name: 'Description', sample: 'Fund identifier' },
  ],
};

export const ChangeMappingModal: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    selectedMapping,
    addLearnedRule,
    isChangeModalOpen,
    closeChangeModal,
    updateMapping,
    templates,
    activeSheetName,
    process,
    setProcess,
    checkedFieldIds,
    toggleCheckField,
  } = useProcessStore();

  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [customValue, setCustomValue] = useState<string>('');
  const [remember, setRemember] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [userReason, setUserReason] = useState<string>('');

  const isUnmappedTargetMode = Boolean(selectedMapping?.source_field?.includes('ไม่พบข้อมูล'));
  const currentSheetKey = activeSheetName || 'Custodian_A';

  useEffect(() => {
    if (selectedMapping) {
      setSelectedTarget(selectedMapping.target_field || '');
      setSelectedSource('');
      setCustomValue('');
    }
  }, [selectedMapping, isChangeModalOpen]);

  if (!mounted || !isChangeModalOpen || !selectedMapping) return null;

  const availableTargetFields =
    templates[0]?.fields.map((f) => f.name) || [
      'FUND_CODE',
      'FUND_NAME',
      'TRADE_DATE',
      'SETTLEMENT_DATE',
      'CURRENCY',
      'UNIT_PRICE',
      'QUANTITY',
      'AMOUNT',
    ];

  const availableSourceCols = React.useMemo(() => {
    const cols: { name: string; sample: string }[] = [];
    const added = new Set<string>();

    // 1. If original sheet headers exist directly from Excel extraction, use them!
    const sheetHeaders = process?.sheetDataMap?.[currentSheetKey]?.headers;
    if (sheetHeaders && sheetHeaders.length > 0) {
      sheetHeaders.forEach((h) => {
        if (h && !added.has(h)) {
          added.add(h);
          const sample = getSourceFieldSample(h, process, currentSheetKey) || '-';
          cols.push({ name: h, sample });
        }
      });
      return cols;
    }

    const targetNames = new Set(availableTargetFields.map((tf) => tf.toUpperCase()));

    // 2. Columns from current mappings (excluding target fields)
    const currentMappings = process?.sheetDataMap?.[currentSheetKey]?.mappings || process?.mappings || [];
    currentMappings.forEach((m) => {
      if (
        m.source_field &&
        m.source_field !== 'UNMATCHED' &&
        !m.source_field.includes('ไม่พบข้อมูล') &&
        !targetNames.has(m.source_field.toUpperCase()) &&
        !added.has(m.source_field)
      ) {
        added.add(m.source_field);
        const sample = getSourceFieldSample(m.source_field, process, currentSheetKey) || m.source_sample || '-';
        cols.push({ name: m.source_field, sample });
      }
    });

    // 3. Columns from sheet rows (excluding target fields)
    const rows = process?.sheetDataMap?.[currentSheetKey]?.rows || process?.extractedRecords;
    if (rows && rows.length > 0) {
      Object.keys(rows[0] || {}).forEach((k) => {
        if (
          k &&
          k !== 'id' &&
          k !== 'sheetName' &&
          k !== 'isEdited' &&
          !targetNames.has(k.toUpperCase()) &&
          !added.has(k)
        ) {
          added.add(k);
          const sample = getSourceFieldSample(k, process, currentSheetKey) || '-';
          cols.push({ name: k, sample });
        }
      });
    }

    // 4. Fallback map if empty
    if (cols.length === 0) {
      const fallback = availableSourceFieldsMap[currentSheetKey] || availableSourceFieldsMap.Custodian_A;
      fallback.forEach((f) => {
        if (!added.has(f.name)) {
          added.add(f.name);
          cols.push(f);
        }
      });
    }

    return cols;
  }, [process, currentSheetKey]);

  const filteredTargets = availableTargetFields.filter((tf) =>
    tf.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSources = availableSourceCols.filter((sf) =>
    sf.name.toLowerCase().includes(search.toLowerCase()) || sf.sample.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (isUnmappedTargetMode) {
      // In Unmapped Target Mode, user selects a Source Field to map into target_field (e.g. FUND_CODE)
      const sourceToMap = customValue.trim() || selectedSource;
      if (!sourceToMap) return;

      const targetField = selectedMapping.target_field;
      const sheetMappings = sheetMappingMap[currentSheetKey];

      if (sheetMappings) {
        const itemIdx = sheetMappings.findIndex((m) => m.id === selectedMapping.id || m.target_field === targetField);
        if (itemIdx !== -1) {
          const sample = customValue.trim() ? `ค่ากำหนดคงที่: ${customValue.trim()}` : (availableSourceCols.find(s => s.name === sourceToMap)?.sample || '-');
          const scoring = calculateFieldMappingConfidence(sourceToMap, targetField, sample, selectedMapping.target_data_type);
          const isMismatch = !!scoring.isTypeMismatch;
          const conf = isMismatch ? scoring.confidence : 1.0;
          const confLevel = isMismatch ? 'Low' : 'High';
          const reasonStr = isMismatch
            ? scoring.reason
            : (customValue.trim()
                ? `ผู้ใช้ระบุค่าคงที่ "${customValue.trim()}" สำหรับฟิลด์ ${targetField}`
                : `ผู้ใช้เลือกแมชคอลัมน์ต้นทาง "${sourceToMap}" เข้าสู่ฟิลด์เป้าหมาย ${targetField} ด้วยตนเอง (Manual Match 100%)`);

          sheetMappings[itemIdx] = {
            ...sheetMappings[itemIdx],
            source_field: sourceToMap,
            source_sample: sample,
            source_data_type: customValue.trim() ? 'Static Default' : (isMismatch ? `Text (ไม่ตรงกับ ${selectedMapping.target_data_type})` : 'ข้อความ (Text)'),
            confidence: conf,
            confidence_level: confLevel,
            status: isMismatch ? 'SUGGESTED' : 'ACCEPTED',
            reasons: [reasonStr],
          };
        }
      }

      // Always save to AI Learned Rules memory
      addLearnedRule({
        id: `rule_${Date.now()}`,
        column_set_pattern: `${currentSheetKey} Format`,
        source_field: sourceToMap,
        target_field: targetField,
        user_reasoning: userReason.trim() || 'ผู้ใช้ทำการระบุแมชฟิลด์ต้นทางด้วยตนเอง',
        learned_at: new Date().toLocaleDateString('th-TH'),
        is_active: true,
        remember_forever: true,
      });

      if (!checkedFieldIds[selectedMapping.id || selectedMapping.source_field]) {
        toggleCheckField(selectedMapping.id || selectedMapping.source_field);
      }

      if (process) {
        setProcess({ ...process });
      }

      closeChangeModal();
      return;
    }

    // Standard Mode: User selects Target Field for a given Source Field
    const targetToSave = selectedTarget || selectedMapping.target_field;
    if (targetToSave) {
      await updateMapping(selectedMapping.id || selectedMapping.source_field, targetToSave);

      // Update sheetMappingMap directly for instantaneous UI reactivity
      const sheetMappings = sheetMappingMap[currentSheetKey];
      if (sheetMappings) {
        const itemIdx = sheetMappings.findIndex(
          (m) => m.id === selectedMapping.id || m.source_field === selectedMapping.source_field
        );
        if (itemIdx !== -1) {
          const isUnmatched = targetToSave === 'UNMATCHED';
          const sample = selectedMapping.source_sample;
          const scoring = calculateFieldMappingConfidence(selectedMapping.source_field, targetToSave, sample);
          const isMismatch = !!scoring.isTypeMismatch;
          const conf = isUnmatched ? 0 : (isMismatch ? scoring.confidence : 0.95);
          const confLevel = isUnmatched ? 'Low' : (isMismatch ? 'Low' : 'High');
          const reasonStr = isUnmatched
            ? [`ผู้ใช้เลือกกำหนดให้คอลัมน์ "${selectedMapping.source_field}" ไม่เข้ากับฟิลด์เป้าหมายใดในเทมเพลต (UNMATCHED)`]
            : (isMismatch ? [scoring.reason] : [`ผู้ใช้ทำการปรับเปลี่ยนการจับคู่เป็น ${targetToSave} ด้วยตนเอง (Manual Override)`]);

          sheetMappings[itemIdx] = {
            ...sheetMappings[itemIdx],
            target_field: targetToSave,
            status: isUnmatched ? 'UNMATCHED' : (isMismatch ? 'SUGGESTED' : 'MODIFIED'),
            confidence: conf,
            confidence_level: confLevel,
            reasons: reasonStr,
          };
        }
      }

      // Always save to AI Learned Rules memory
      addLearnedRule({
        id: `rule_${Date.now()}`,
        column_set_pattern: `${currentSheetKey} Format`,
        source_field: selectedMapping.source_field,
        target_field: targetToSave,
        user_reasoning: userReason.trim() || 'ผู้ใช้ทำการเปลี่ยนการแมชฟิลด์เป้าหมายด้วยตนเอง',
        learned_at: new Date().toLocaleDateString('th-TH'),
        is_active: true,
        remember_forever: true,
      });

      const rowId = selectedMapping.id || selectedMapping.source_field;
      if (!checkedFieldIds[rowId]) {
        toggleCheckField(rowId);
      }

      if (process) {
        setProcess({ ...process });
      }

      closeChangeModal();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      {/* Full screen backdrop click to close */}
      <div className="absolute inset-0 w-full h-full" onClick={closeChangeModal} />

      <div className="relative z-10 bg-white border-2 border-purple-200 rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="font-extrabold text-[#2e1d52] text-base">
              {isUnmappedTargetMode
                ? `เลือกคอลัมน์ต้นทางเพื่อแมชเข้า [${selectedMapping.target_field}]`
                : 'เปลี่ยนการจับคู่ฟิลด์เป้าหมาย'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isUnmappedTargetMode
                ? `กำหนดคอลัมน์จากแผ่นงาน ${currentSheetKey} เพื่อแมชเข้าสู่ฟิลด์มาตรฐาน`
                : 'เลือกฟิลด์เป้าหมายใหม่ที่ต้องการแมช'}
            </p>
          </div>
          <button
            onClick={closeChangeModal}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Mode Display */}
        {isUnmappedTargetMode ? (
          /* UNMAPPED TARGET MODE: Select Source Column for Target Field */
          <div className="space-y-4 mb-5">
            {/* Target Field Info Box */}
            <div className="bg-purple-50/80 p-3.5 rounded-xl border border-purple-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-purple-900 font-extrabold uppercase tracking-wider">
                  ฟิลด์เป้าหมายมาตรฐาน KKP (TARGET FIELD)
                </div>
                <div className="text-base font-extrabold text-[#2e1d52] mt-0.5 font-mono">
                  {selectedMapping.target_field}
                </div>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-extrabold bg-red-100 text-red-900 rounded-md border border-red-200">
                ฟิลด์บังคับ (Required)
              </span>
            </div>

            {/* Select Source Column Dropdown List */}
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                <span>เลือกคอลัมน์ต้นทางจากแผ่นงาน {currentSheetKey}</span>
              </label>

              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาคอลัมน์ต้นทาง..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 bg-white text-slate-900 font-semibold"
                />
              </div>

              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {filteredSources.map((sf) => (
                  <button
                    key={sf.name}
                    type="button"
                    onClick={() => {
                      setSelectedSource(sf.name);
                      setCustomValue('');
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition ${
                      selectedSource === sf.name
                        ? 'bg-purple-100/90 text-purple-950 font-bold'
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-slate-900">{sf.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">ตัวอย่าง: {sf.sample}</div>
                    </div>
                    {selectedSource === sf.name && <Check className="w-4 h-4 text-purple-700 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Static Default Value Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                หรือ กำหนดค่าคงที่เริ่มต้น (Static Default Value)
              </label>
              <input
                type="text"
                value={customValue}
                onChange={(e) => {
                  setCustomValue(e.target.value);
                  setSelectedSource('');
                }}
                placeholder="เช่น DEFAULT_FUND_CODE หรือ F1000"
                className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 bg-white text-slate-900 uppercase"
              />
            </div>
          </div>
        ) : (
          /* STANDARD MODE: Select Target Field for Source Field */
          <div className="space-y-3 mb-5">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider">ฟิลด์ต้นทาง (Source Field)</div>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                {selectedMapping.source_field}
              </div>
              <div className="text-xs text-slate-600 font-medium mt-1">
                ตัวอย่างข้อมูล: <span className="font-mono font-bold text-slate-800">{selectedMapping.source_sample || '-'}</span>
              </div>
            </div>

            <div className="text-xs text-slate-700 font-medium">
              ข้อเสนอแนะปัจจุบันของ AI:{' '}
              <span className="font-extrabold text-purple-950 bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                {selectedMapping.target_field || 'UNMATCHED'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                เลือกฟิลด์เป้าหมายใหม่ (Target Field)
              </label>

              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาฟิลด์เป้าหมาย..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 bg-white text-slate-900 font-semibold"
                />
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {/* Explicit UNMATCHED Option */}
                <button
                  type="button"
                  onClick={() => setSelectedTarget('UNMATCHED')}
                  className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between transition border-b border-amber-200 ${
                    selectedTarget === 'UNMATCHED'
                      ? 'bg-amber-100/90 text-amber-950 font-extrabold'
                      : 'bg-amber-50/60 hover:bg-amber-100/60 text-amber-900 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Ban className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span> ไม่เข้ากับฟิลด์ใดเลย (UNMATCHED / ไม่แมช)</span>
                  </div>
                  {selectedTarget === 'UNMATCHED' && <Check className="w-4 h-4 text-amber-800 flex-shrink-0" />}
                </button>

                {filteredTargets.map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setSelectedTarget(tf)}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition ${
                      selectedTarget === tf
                        ? 'bg-purple-100/80 text-purple-950 font-bold'
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <span className="font-mono">{tf}</span>
                    {selectedTarget === tf && <Check className="w-4 h-4 text-purple-700 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* User Reasoning for AI Training Input */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            เหตุผลการปรับแก้ไข (เพื่อเทรนและสอน AI สำหรับรอบถัดไป)
          </label>
          <input
            type="text"
            value={userReason}
            onChange={(e) => setUserReason(e.target.value)}
            placeholder="เช่น ชื่อคอลัมน์ระบบต้นทางใช้ตัวย่อต่างจากมาตรฐาน..."
            className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 bg-white"
          />
        </div>

        {/* Checkbox */}
        <label className="flex items-center gap-2 text-xs text-slate-700 mb-6 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="rounded border-slate-300 text-purple-700 focus:ring-purple-500"
          />
          <span className="font-semibold">จดจำการจับคู่นี้สำหรับไฟล์ทางการเงินในอนาคต</span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeChangeModal}
            className="px-4 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="purple-gradient-btn px-5 py-2.5 text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-md"
          >
            <Save className="w-4 h-4" />
            บันทึกการจับคู่
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
