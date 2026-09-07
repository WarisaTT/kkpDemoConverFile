'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  ArrowRight,
  Download,
  X,
  FileCheck,
  Lock,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useProcessStore } from '@/store/useProcessStore';
import { CompletionSuccessModal } from './CompletionSuccessModal';
import { sheetMappingMap, applyLearnedRulesToMappings, ensureAllTargetFieldsPresent } from './MappingTableSection';
import { FieldMapping } from '@/types';

export const BottomGridSection: React.FC = () => {
  const { process, setCurrentStep, exportExcel, updateProcessStep, checkedFieldIds = {}, activeSheetName, aiLearnedRules = [] } = useProcessStore();
  const [showValDetails, setShowValDetails] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);

  const mappings = process?.mappings || [];
  const totalFields = mappings.length || 8;

  const highCount = mappings.filter((m) => (m.confidence || 0) >= 0.9 && m.status !== 'UNMATCHED').length;
  const medCount = mappings.filter((m) => (m.confidence || 0) >= 0.7 && (m.confidence || 0) < 0.9 && m.status !== 'UNMATCHED').length;
  const lowCount = mappings.filter((m) => (m.confidence || 0) < 0.7 && (m.confidence || 0) > 0 && m.status !== 'UNMATCHED').length;
  const unCount = mappings.filter((m) => m.status === 'UNMATCHED' || (m.confidence || 0) === 0).length;

  const donutData = [
    { name: 'ความเชื่อมั่นสูง', value: highCount, color: '#059669' },
    { name: 'ความเชื่อมั่นปานกลาง', value: medCount, color: '#f59e0b' },
    { name: 'ความเชื่อมั่นต่ำ', value: lowCount, color: '#dc2626' },
    { name: 'ยังไม่ได้จับคู่', value: unCount, color: '#94a3b8' },
  ];

  const validation = process?.validation || {
    total_records: process?.row_count || 2481,
    valid_count: 2475,
    warning_count: 4,
    error_count: 2,
    categories: [],
    details: [],
  };

  const isUnlockedForDownload = (process?.current_step || 2) >= 4;

  return (
    <>
      {/* Streamlined Essential Summary Grid (3 Essential Cards Only) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full max-w-full">
        {/* Essential Card 1: Mapping Summary Donut Chart */}
        <div className="banking-card p-5 flex flex-col justify-between">
          <h3 className="text-xs font-extrabold text-[#2e1d52] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-purple-700" />
            สรุปภาพรวมการจับคู่ (Mapping Summary)
          </h3>

          <div className="flex items-center justify-around gap-2 my-2">
            <div className="w-28 h-28 relative flex items-center justify-center flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={46}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-base font-extrabold text-[#2e1d52]">
                  {totalFields}
                </span>
                <span className="text-[9px] text-slate-500 font-bold leading-tight">
                  ฟิลด์ทั้งหมด
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 flex-shrink-0" />
                <span>{highCount} ความเชื่อมั่นสูง (≥90%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 flex-shrink-0" />
                <span>{medCount} ความเชื่อมั่นปานกลาง</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-600 flex-shrink-0" />
                <span>{lowCount} ความเชื่อมั่นต่ำ (&lt;70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 flex-shrink-0" />
                <span>{unCount} ยังไม่ได้จับคู่</span>
              </div>
            </div>
          </div>
        </div>

        {/* Essential Card 2: Validation Result */}
        <div className="banking-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold text-[#2e1d52] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ผลการตรวจสอบ (Validation)
              </h3>
              <span className="text-[11px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {validation.total_records.toLocaleString()} รายการ
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ถูกต้อง (Valid)
                </span>
                <span className="font-extrabold text-emerald-900 text-sm">
                  {validation.valid_count.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 border border-amber-200">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  เตือน (Warning)
                </span>
                <span className="font-extrabold text-amber-900 text-sm">
                  {validation.warning_count}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-red-50 border border-red-200">
                <span className="font-bold text-red-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-600" />
                  ข้อผิดพลาด (Error)
                </span>
                <span className="font-extrabold text-red-900 text-sm">
                  {validation.error_count}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowValDetails(!showValDetails)}
            className="w-full mt-3 py-2 text-xs font-extrabold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Eye className="w-4 h-4 text-purple-700" />
            ดูรายละเอียดการตรวจสอบ
          </button>
        </div>

        {/* Essential Card 3: Next Step & Export Actions */}
        <div className="banking-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-[#2e1d52] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 text-purple-700" />
              ขั้นตอนถัดไป (Next Step)
            </h3>
            <p className="text-xs text-slate-600 leading-snug mb-4 font-medium">
              พร้อมสำหรับการแปลงโครงสร้างข้อมูลและสร้างไฟล์มาตรฐาน KKP
            </p>
          </div>

          <div className="space-y-2.5">
            {(() => {
              const currentActiveSheet = activeSheetName || 'Custodian_A';
              const rawSheetMappings: FieldMapping[] =
                sheetMappingMap[currentActiveSheet] || (process?.mappings && process.mappings.length > 0 ? process.mappings : sheetMappingMap['Custodian_A']);
              const learnedMappings = applyLearnedRulesToMappings(rawSheetMappings, aiLearnedRules);
              const currentSheetMappings = ensureAllTargetFieldsPresent(learnedMappings);

              const safeMap = checkedFieldIds || {};
              const isFieldChecked = (m: FieldMapping) => {
                return Boolean(
                  (m.target_field && safeMap[m.target_field]) ||
                  (m.id && safeMap[m.id]) ||
                  (m.source_field && safeMap[m.source_field])
                );
              };
              const checkedCount = currentSheetMappings.filter(isFieldChecked).length;
              const isAllChecked = currentSheetMappings.length > 0 && checkedCount === currentSheetMappings.length;

              if (!isAllChecked) {
                return (
                  <button
                    disabled
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-2"
                    title="ติ๊กตรวจสอบหน้าหัวข้อฟิลด์ในตารางให้ครบทุกรายการก่อนกดไป Step 3"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>ติ๊กตรวจสอบให้ครบทุกฟิลด์ ({checkedCount}/{currentSheetMappings.length}) ก่อนไป Step 3</span>
                  </button>
                );
              }

              return (
                <button
                  onClick={() => {
                    updateProcessStep(3);
                    setCurrentStep(3);
                  }}
                  className="purple-gradient-btn w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg animate-in zoom-in-95 duration-150 cursor-pointer"
                >
                  <span>ไปยัง Step 3: ตรวจสอบการจัด Format & ข้อมูล</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              );
            })()}

            <button
              onClick={() => exportExcel()}
              disabled={process?.status !== 'Completed'}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 border ${
                process?.status === 'Completed'
                  ? 'text-[#3c2a68] bg-white border-purple-300 hover:bg-purple-50 shadow-xs cursor-pointer'
                  : 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed'
              }`}
              title={
                process?.status === 'Completed'
                  ? 'ดาวน์โหลดไฟล์ Excel'
                  : 'ดาวน์โหลดไฟล์ได้ใน Step ที่ 4 หลังจากกดยืนยันการตรวจสอบใน Step 3 แล้วเท่านั้น'
              }
            >
              {process?.status === 'Completed' ? (
                <Download className="w-4 h-4 text-purple-700" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>ดาวน์โหลดไฟล์ Excel {process?.status !== 'Completed' ? '(ปลดล็อกใน Step 4)' : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Validation Details Modal */}
      {showValDetails && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-extrabold text-base text-[#2e1d52] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                รายละเอียดผลการตรวจสอบ (Validation Details)
              </h3>
              <button
                onClick={() => setShowValDetails(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                <span className="font-bold text-emerald-900">รายการที่ถูกต้อง (Valid)</span>
                <span className="font-extrabold text-emerald-800 text-sm">2,475 แถว (99.7%)</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center">
                <span className="font-bold text-amber-900">รายการเตือน (Warning - ปรับแต่งอัตโนมัติแล้ว)</span>
                <span className="font-extrabold text-amber-800 text-sm">4 แถว</span>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex justify-between items-center">
                <span className="font-bold text-red-900">ข้อผิดพลาด (Error - ต้องตรวจสอบ)</span>
                <span className="font-extrabold text-red-800 text-sm">2 แถว</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowValDetails(false)}
                className="px-5 py-2 text-xs font-bold bg-[#2e1d52] text-white rounded-xl hover:bg-purple-950 transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Success Modal */}
      <CompletionSuccessModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        rowCount={
          process?.row_count || 
          (process?.sheetDataMap ? Object.values(process.sheetDataMap).reduce((a, c) => a + (c.rows?.length || 0), 0) : 0) || 
          process?.extractedRecords?.length || 
          102
        }
        fileName={process?.file_name || 'KKP_Demo_Source_Files.xlsx'}
        templateName={process?.target_template || 'KKP_CUSTODIAN_TRADE_V2'}
        onDownloadExcel={exportExcel}
        onDownloadJson={() => {
          exportExcel();
        }}
      />
    </>
  );
};

