'use client';

import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  X,
  Info,
  ShieldCheck,
  ArrowRight,
  Filter,
  Check,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import { useProcessStore } from '@/store/useProcessStore';

interface MissingValuesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MissingValuesModal: React.FC<MissingValuesModalProps> = ({ isOpen, onClose }) => {
  const { setConfidenceFilter, setCurrentStep } = useProcessStore();

  if (!isOpen) return null;

  const missingFieldItems = [
    {
      targetField: 'SETTLEMENT_DATE',
      description: 'วันที่ชำระราคาและส่งมอบหลักทรัพย์',
      required: true,
      missingCount: 2,
      confidenceScore: '65% (Amber)',
      impact: 'Required Field — AI เติมวันที่ Settlement Date = Trade Date + 2 วันทำการ',
      status: 'Auto-Filled by AI Rule',
    },
    {
      targetField: 'CURRENCY',
      description: 'รหัสสกุลเงินมาตรฐาน ISO 4217',
      required: true,
      missingCount: 3,
      confidenceScore: '70% (Amber)',
      impact: 'Required Field — AI เติมสกุลเงิน THB อัตโนมัติสำหรับกองทุนในประเทศ',
      status: 'Auto-Filled by AI Rule',
    },
    {
      targetField: 'UNIT_PRICE',
      description: 'ราคาต่อหน่วย / NAV',
      required: true,
      missingCount: 2,
      confidenceScore: '55% (Amber)',
      impact: 'Required Field — คำนวณจาก (AMOUNT / QUANTITY) อัตโนมัติ',
      status: 'Calculated by AI Rule',
    },
    {
      targetField: 'QUANTITY',
      description: 'จำนวนหน่วยหลักทรัพย์',
      required: true,
      missingCount: 1,
      confidenceScore: '60% (Amber)',
      impact: 'Required Field — คำนวณจาก (AMOUNT / UNIT_PRICE) อัตโนมัติ',
      status: 'Calculated by AI Rule',
    },
  ];

  const handleGoToFilter = () => {
    setConfidenceFilter('Amber');
    setCurrentStep(2);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-3xl border-2 border-amber-200 shadow-2xl w-full max-w-2xl overflow-hidden z-10 p-6 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shadow-sm">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-widest text-amber-800 uppercase bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                AI MISSING VALUES ENGINE
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                สรุปข้อมูลขาดหาย & การปรับแต่ง AI (8 รายการ - Amber)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Rule Summary Banner */}
        <div className="bg-amber-50/90 p-4 rounded-2xl border border-amber-200 text-xs space-y-2 text-amber-950">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>กฎ AI Engine: Required Field ปรับ 0% / Optional Field ปรับ 20%</span>
          </div>
          <p className="text-[11px] text-amber-900 leading-relaxed">
            พบข้อมูลบางเซลล์ในไฟล์ต้นทางเว้นว่างไว้รวม <strong>8 รายการ</strong> AI ได้ดำเนินการคำนวณและเติมค่าเริ่มต้นตามกฎการเงิน KKP ให้อัตโนมัติ (ระดับความเชื่อมั่น Amber 55-70%)
          </p>
        </div>

        {/* Missing Values Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
              <tr>
                <th className="p-3">ฟิลด์เป้าหมาย</th>
                <th className="p-3">จำนวนที่ขาดหาย</th>
                <th className="p-3">คะแนนความเชื่อมั่น AI</th>
                <th className="p-3">การดำเนินการของ AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {missingFieldItems.map((item) => (
                <tr key={item.targetField} className="hover:bg-amber-50/40 transition">
                  <td className="p-3">
                    <div className="font-black text-[#2e1d52]">{item.targetField}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{item.description}</div>
                  </td>
                  <td className="p-3 font-extrabold text-amber-800">
                    {item.missingCount} รายการ
                  </td>
                  <td className="p-3">
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                      {item.confidenceScore}
                    </span>
                  </td>
                  <td className="p-3 text-[11px]">
                    <div className="font-bold text-emerald-800 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      {item.status}
                    </div>
                    <div className="text-[10px] text-slate-500">{item.impact}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            <span>ฟิลด์บังคับทั้งหมดได้รับการตรวจสอบและเติมค่าให้เรียบร้อยแล้ว</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              ยอมรับค่า AI และปิด
            </button>
            <button
              onClick={handleGoToFilter}
              className="px-4 py-2 text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Filter className="w-4 h-4" />
              <span>กรองดูเฉพาะฟิลด์ Amber (Filter Amber)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
