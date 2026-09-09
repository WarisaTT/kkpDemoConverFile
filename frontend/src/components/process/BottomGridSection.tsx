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
import { useProcessStore, checkAllSheetsVerification } from '@/store/useProcessStore';
import { FieldMapping } from '@/types';
import { CompletionSuccessModal } from './CompletionSuccessModal';
import { sheetMappingMap, applyLearnedRulesToMappings, ensureAllTargetFieldsPresent } from './MappingTableSection';
import { FullScreenStep2ConfirmationModal } from './FullScreenStep2ConfirmationModal';

export const BottomGridSection: React.FC = () => {
  const {
    process,
    setCurrentStep,
    exportExcel,
    updateProcessStep,
    checkedFieldIds = {},
    checkAllFields,
    activeSheetName,
    aiLearnedRules = [],
    templates = [],
  } = useProcessStore();
  const [showValDetails, setShowValDetails] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isFullScreenConfirmOpen, setIsFullScreenConfirmOpen] = useState(false);

  const currentActiveSheet = activeSheetName || process?.sheets?.[0] || 'Custodian_A';
  const rawSheetMappings: FieldMapping[] =
    process?.sheetDataMap?.[currentActiveSheet]?.mappings ||
    (process?.mappings && process.mappings.length > 0 ? process.mappings : sheetMappingMap[currentActiveSheet] || sheetMappingMap['Custodian_A'] || []);
  const learnedMappings = applyLearnedRulesToMappings(rawSheetMappings, aiLearnedRules);
  const currentSheetMappings = ensureAllTargetFieldsPresent(learnedMappings);

  const totalFields = currentSheetMappings.length || 8;

  const highCount = currentSheetMappings.filter((m) => (m.confidence || 0) >= 0.85 && m.status !== 'UNMATCHED').length;
  const medCount = currentSheetMappings.filter((m) => (m.confidence || 0) >= 0.60 && (m.confidence || 0) < 0.85 && m.status !== 'UNMATCHED').length;
  const lowCount = currentSheetMappings.filter((m) => (m.confidence || 0) < 0.60 && (m.confidence || 0) > 0 && m.status !== 'UNMATCHED').length;
  const unCount = currentSheetMappings.filter((m) => m.status === 'UNMATCHED' || (m.confidence || 0) === 0).length;

  const donutData = [
    { name: 'ความเชื่อมั่นสูง', value: highCount, color: '#059669' },
    { name: 'ความเชื่อมั่นปานกลาง', value: medCount, color: '#3b82f6' },
    { name: 'ความหมายคลุมเครือ', value: lowCount, color: '#f59e0b' },
    { name: 'ยังไม่ได้จับคู่', value: unCount, color: '#94a3b8' },
  ];

  const currentSheetData = process?.sheetDataMap?.[activeSheetName || ''] || null;
  const realRows = currentSheetData?.rows || process?.extractedRecords || [];
  const realTotalCount = realRows.length > 0 ? realRows.length : (process?.row_count || 25);

  const realErrorCount = process?.validation?.error_count ?? (realTotalCount >= 5 ? 2 : 0);
  const realWarningCount = process?.validation?.warning_count ?? (realTotalCount >= 5 ? 4 : 0);
  const realValidCount = Math.max(0, realTotalCount - realErrorCount - realWarningCount);
  const realValidPct = realTotalCount > 0 ? ((realValidCount / realTotalCount) * 100).toFixed(1) : '100.0';

  const validation = {
    total_records: realTotalCount,
    valid_count: realValidCount,
    warning_count: realWarningCount,
    error_count: realErrorCount,
    valid_pct: realValidPct,
  };

  const multiSheetStatus = checkAllSheetsVerification(process, templates, checkedFieldIds, currentActiveSheet);
  const currentSheetProgress = multiSheetStatus.sheetsProgress.find((sp) => sp.sheetName === currentActiveSheet) || multiSheetStatus.sheetsProgress[0];

  return (
    <>
      {/* 3 Balanced Summary & Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8 w-full items-stretch">
        {/* Card 1: Mapping Summary Donut Chart */}
        <div className="banking-card p-5 flex flex-col justify-between bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold text-[#2e1d52] uppercase tracking-wider flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 flex-shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
                <span>สรุปการจับคู่ (Mapping Summary)</span>
              </h3>
              <span className="text-[10px] font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                {totalFields} ฟิลด์
              </span>
            </div>

            <div className="flex items-center justify-around gap-2 my-2">
              <div className="w-28 h-28 relative flex items-center justify-center flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={48}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-lg font-black text-[#2e1d52] leading-none">
                    {totalFields}
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold mt-0.5">
                    ฟิลด์ทั้งหมด
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] font-bold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 flex-shrink-0" />
                  <span className="text-slate-700">{highCount} ความเชื่อมั่นสูง (≥85%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-slate-700">{medCount} ความเชื่อมั่นปานกลาง</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-slate-700">{lowCount} คลุมเครือ (&lt;60%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 flex-shrink-0" />
                  <span className="text-slate-500">{unCount} ยังไม่ได้จับคู่</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>แผ่นงานปัจจุบัน:</span>
            <span className="font-extrabold text-purple-900 font-mono bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              {currentActiveSheet}
            </span>
          </div>
        </div>

        {/* Card 2: Validation Result */}
        <div className="banking-card p-5 flex flex-col justify-between bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold text-[#2e1d52] uppercase tracking-wider flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>ผลการตรวจสอบ (Validation)</span>
              </h3>
              <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {validation.total_records.toLocaleString()} รายการ
              </span>
            </div>

            {/* Clean Progress Bar for Validity */}
            <div className="mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-[11px] font-black text-slate-700 mb-1.5">
                <span>อัตราข้อมูลถูกต้อง</span>
                <span className="text-emerald-700 font-mono text-xs">{validation.valid_pct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, parseFloat(validation.valid_pct)))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col items-center">
                <span className="font-bold text-[10px] text-emerald-800 uppercase">ถูกต้อง</span>
                <span className="font-black text-emerald-950 text-base mt-0.5">
                  {validation.valid_count.toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center">
                <span className="font-bold text-[10px] text-amber-800 uppercase">เตือน</span>
                <span className="font-black text-amber-950 text-base mt-0.5">
                  {validation.warning_count}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-red-50 border border-red-200 flex flex-col items-center">
                <span className="font-bold text-[10px] text-red-800 uppercase">ผิดพลาด</span>
                <span className="font-black text-red-950 text-base mt-0.5">
                  {validation.error_count}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowValDetails(!showValDetails)}
            className="w-full mt-3 py-2 text-xs font-black text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Eye className="w-4 h-4 text-purple-700" />
            <span>ดูรายละเอียดการตรวจสอบ ({validation.total_records} แถว)</span>
          </button>
        </div>

        {/* Card 3: Next Step & Export Actions */}
        <div className="banking-card p-5 flex flex-col justify-between bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-extrabold text-[#2e1d52] uppercase tracking-wider flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 flex-shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <span>ขั้นตอนถัดไป (Next Step)</span>
              </h3>
              {multiSheetStatus.isAllVerified ? (
                <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  พร้อมดำเนินการ
                </span>
              ) : (
                <span className="text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  รอการตรวจสอบ
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 leading-snug mb-3 font-medium">
              พร้อมสำหรับการแปลงโครงสร้างข้อมูลและสร้างไฟล์มาตรฐาน KKP
            </p>

            {/* Multi-sheet progress chips */}
            {multiSheetStatus.totalSheets > 1 && (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-3 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-600 uppercase">
                  <span>สถานะการยืนยันแผ่นงาน</span>
                  <span className="text-purple-900 font-black font-mono">
                    {multiSheetStatus.completedSheetsCount}/{multiSheetStatus.totalSheets} ชีท
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {multiSheetStatus.sheetsProgress.map((sp) => (
                    <span
                      key={sp.sheetName}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border flex items-center gap-1 ${
                        sp.isCompleted
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-900 border-amber-300'
                      }`}
                    >
                      {sp.isCompleted ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                      )}
                      <span className="truncate max-w-[90px]">{sp.sheetName}</span>
                      <span className="font-mono text-[9px]">({sp.verifiedCount}/{sp.total})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 mt-2">
            {multiSheetStatus.isAllVerified ? (
              <button
                onClick={() => setIsFullScreenConfirmOpen(true)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer scale-[1.01]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>ยืนยันครบแล้ว! ไปยัง Step 3</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  const allTargetIds = currentSheetMappings.map((m) => m.target_field || m.id);
                  checkAllFields(allTargetIds, currentActiveSheet);
                }}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-black bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                title={`คลิกเลือกทั้งหมดของชีท ${currentActiveSheet}`}
              >
                <CheckCircle2 className="w-4 h-4 text-purple-700 flex-shrink-0" />
                <span className="truncate">Select All ชีท &quot;{currentActiveSheet}&quot; ตรวจสอบแล้ว</span>
              </button>
            )}

            <button
              onClick={() => exportExcel()}
              disabled={process?.status !== 'Completed'}
              className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 border ${
                process?.status === 'Completed'
                  ? 'text-purple-950 bg-white border-purple-300 hover:bg-purple-50 shadow-xs cursor-pointer'
                  : 'text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed'
              }`}
              title={
                process?.status === 'Completed'
                  ? 'ดาวน์โหลดไฟล์ Excel'
                  : 'ดาวน์โหลดไฟล์ได้ใน Step 4 หลังจากตรวจสอบเสร็จสมบูรณ์'
              }
            >
              {process?.status === 'Completed' ? (
                <Download className="w-3.5 h-3.5 text-purple-700" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>ดาวน์โหลด Excel {process?.status !== 'Completed' ? '(ปลดล็อกใน Step 4)' : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full-Screen Multi-Sheet Select All Confirmation Modal */}
      <FullScreenStep2ConfirmationModal
        isOpen={isFullScreenConfirmOpen}
        onClose={() => setIsFullScreenConfirmOpen(false)}
      />

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
                <span className="font-extrabold text-emerald-800 text-sm">
                  {validation.valid_count.toLocaleString()} แถว ({validation.valid_pct}%)
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center">
                <span className="font-bold text-amber-900">รายการเตือน (Warning - ปรับแต่งอัตโนมัติแล้ว)</span>
                <span className="font-extrabold text-amber-800 text-sm">
                  {validation.warning_count.toLocaleString()} แถว
                </span>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex justify-between items-center">
                <span className="font-bold text-red-900">ข้อผิดพลาด (Error - ต้องตรวจสอบ)</span>
                <span className="font-extrabold text-red-800 text-sm">
                  {validation.error_count.toLocaleString()} แถว
                </span>
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

