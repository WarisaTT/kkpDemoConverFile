'use client';

import React from 'react';
import {
  CheckCircle2,
  FileSpreadsheet,
  FileJson,
  Download,
  History,
  X,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useProcessStore } from '@/store/useProcessStore';

interface CompletionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  rowCount: number;
  fileName: string;
  templateName: string;
  onDownloadExcel: () => void;
  onDownloadJson: () => void;
}

export const CompletionSuccessModal: React.FC<CompletionSuccessModalProps> = ({
  isOpen,
  onClose,
  rowCount,
  fileName,
  templateName,
  onDownloadExcel,
  onDownloadJson,
}) => {
  const { setActiveTab } = useProcessStore();

  if (!isOpen) return null;

  const handleGoToHistory = () => {
    onClose();
    setActiveTab('history');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-3xl border-2 border-emerald-200 shadow-2xl w-full max-w-xl overflow-hidden z-10 p-6 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-widest text-emerald-700 uppercase bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                SUCCESSFUL 100%
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                แปลงไฟล์และตรวจสอบข้อมูลเสร็จสมบูรณ์!
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 p-4 rounded-2xl border border-emerald-200 text-xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80">
            <span className="text-slate-600 font-semibold">ชื่อไฟล์ต้นทาง:</span>
            <span className="font-extrabold text-slate-900 flex items-center gap-1.5 font-mono">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              {fileName}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80">
            <span className="text-slate-600 font-semibold">จำนวนรายการที่ตรวจสอบแล้ว:</span>
            <span className="font-extrabold text-emerald-900 text-sm">
              {rowCount.toLocaleString()} แถวข้อมูล (สมบูรณ์ 100%)
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80">
            <span className="text-slate-600 font-semibold">Template เป้าหมาย:</span>
            <span className="font-extrabold text-[#2e1d52]">
              {templateName} (8 ฟิลด์มาตรฐาน KKP)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-semibold">สถานะการประมวลผล:</span>
            <span className="font-extrabold text-emerald-800 bg-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              เสร็จสมบูรณ์ (Completed)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={onDownloadExcel}
              className="purple-gradient-btn w-full py-3 px-4 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดไฟล์ Excel มาตรฐาน</span>
            </button>

            <button
              onClick={onDownloadJson}
              className="w-full py-3 px-4 rounded-2xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
            >
              <FileJson className="w-4 h-4" />
              <span>ดาวน์โหลดไฟล์ JSON มาตรฐาน</span>
            </button>
          </div>

          <button
            onClick={handleGoToHistory}
            className="w-full py-2.5 px-4 rounded-2xl text-xs font-extrabold text-purple-950 bg-purple-100 hover:bg-purple-200 border border-purple-300 flex items-center justify-center gap-2 transition"
          >
            <History className="w-4 h-4 text-purple-700" />
            <span>ดูประวัติการทำรายการใน History</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
