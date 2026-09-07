'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Check, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useProcessStore } from '@/store/useProcessStore';

export const AIExplanationDrawer: React.FC = () => {
  const {
    isDrawerOpen,
    selectedMapping,
    closeDrawer,
    acceptMapping,
    updateMappingTarget,
    checkedFieldIds = {},
  } = useProcessStore();

  const [rememberRule, setRememberRule] = useState<boolean>(true);

  if (!isDrawerOpen || !selectedMapping) return null;

  const rowId = selectedMapping.id || selectedMapping.source_field;
  const isAccepted = Boolean(checkedFieldIds[rowId]);
  const confPct = Math.round((selectedMapping.confidence || 0) * 100);

  let barColor = 'bg-emerald-500';
  let badgeText = 'ความเชื่อมั่นสูง (High Match)';
  let badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';

  if (selectedMapping.status === 'UNMATCHED' || confPct === 0) {
    barColor = 'bg-slate-400';
    badgeText = 'ยังไม่จับคู่ (Unmatched)';
    badgeBg = 'bg-slate-100 text-slate-600 border-slate-300';
  } else if (confPct < 85) {
    barColor = 'bg-amber-500';
    badgeText = 'ต้องตรวจสอบ (Needs Review)';
    badgeBg = 'bg-amber-100 text-amber-900 border-amber-300';
  }

  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTarget = e.target.value;
    updateMappingTarget(selectedMapping.source_field, newTarget);
  };

  const handleConfirm = () => {
    acceptMapping(rowId);
    closeDrawer();
  };

  const targetOptions = [
    { value: 'FUND_NAME', label: 'FUND_NAME (ชื่อกองทุนรวม) [Required]' },
    { value: 'FUND_CODE', label: 'FUND_CODE (รหัสกองทุนรวม) [Required]' },
    { value: 'TRADE_DATE', label: 'TRADE_DATE (วันที่ทำรายการ) [Required]' },
    { value: 'SETTLEMENT_DATE', label: 'SETTLEMENT_DATE (วันที่ชำระราคา) [Required]' },
    { value: 'CURRENCY', label: 'CURRENCY (รหัสสกุลเงิน) [Required]' },
    { value: 'UNIT_PRICE', label: 'UNIT_PRICE (ราคาต่อหน่วย) [Required]' },
    { value: 'QUANTITY', label: 'QUANTITY (จำนวนหน่วย) [Required]' },
    { value: 'AMOUNT', label: 'AMOUNT (มูลค่ารวม) [Required]' },
    { value: 'UNMATCHED', label: 'UNMATCHED (ไม่อยู่ในเทมเพลตมาตรฐาน / ไม่ใช้งาน)' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0 w-full h-full" onClick={closeDrawer} />

      {/* Side Panel Drawer Content */}
      <div className="relative bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-200 flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Panel Header */}
        <div className="bg-[#2e1d52] text-white p-5 flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-900 border border-purple-700 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                รายละเอียดและแก้ไขฟิลด์
              </h3>
              <p className="text-xs text-purple-200 font-medium">
                ตรวจสอบเหตุผล AI และปรับเปลี่ยนเป้าหมาย KKP
              </p>
            </div>
          </div>

          <button
            onClick={closeDrawer}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Panel Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Source Field Card (Read-only) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
               คอลัมน์ต้นทาง (SOURCE FIELD)
            </span>
            <div className="font-extrabold text-slate-900 text-lg">
              {selectedMapping.source_field}
            </div>
            <div className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-400">ตัวอย่างข้อมูล: </span>
              <span className="font-extrabold text-slate-800">{selectedMapping.source_sample || '(ไม่มีข้อมูลตัวอย่าง)'}</span>
            </div>
          </div>

          {/* AI Confidence Status */}
          <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[#2e1d52] flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                ความแม่นยำ AI (Match Confidence)
              </span>
              <span className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded-full border ${badgeBg}`}>
                {badgeText} ({confPct}%)
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${confPct}%` }} />
            </div>
          </div>

          {/* AI Reasonings */}
          <div className="space-y-2">
            <span className="font-extrabold text-slate-800 text-xs block">
               เหตุผลการวิเคราะห์ของ AI:
            </span>
            <ul className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              {selectedMapping.reasons && selectedMapping.reasons.length > 0 ? (
                selectedMapping.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700">
                    <span className="text-purple-600 font-bold">•</span>
                    <span className="font-medium leading-relaxed">{r}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-500 italic">วิเคราะห์จากชื่อคอลัมน์และประเภทข้อมูลเทียบกับเทมเพลตมาตรฐาน</li>
              )}
            </ul>
          </div>

          {/* Target Selection Dropdown */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="font-extrabold text-slate-900 text-xs block">
               จับคู่กับฟิลด์เป้าหมาย KKP:
            </label>
            <select
              value={selectedMapping.target_field}
              onChange={handleTargetChange}
              className="w-full p-3 bg-white text-slate-900 font-extrabold border-2 border-purple-300 rounded-xl focus:border-purple-600 focus:outline-none text-xs shadow-2xs"
            >
              {targetOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Remember rule checkbox */}
            <label className="flex items-center gap-2 mt-3 cursor-pointer select-none bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={rememberRule}
                onChange={(e) => setRememberRule(e.target.checked)}
                className="w-4 h-4 accent-purple-700 rounded cursor-pointer"
              />
              <span className="font-bold text-slate-800 text-xs">
                ️ จดจำการจับคู่นี้ไว้ใช้กับไฟล์ครั้งหน้า (AI Rules Engine)
              </span>
            </label>
          </div>
        </div>

        {/* Panel Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={closeDrawer}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2.5 text-xs font-extrabold text-white bg-purple-900 hover:bg-purple-800 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4 text-emerald-300" />
            <span>{isAccepted ? 'บันทึกการแก้ไข' : 'ยืนยันการจับคู่'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
