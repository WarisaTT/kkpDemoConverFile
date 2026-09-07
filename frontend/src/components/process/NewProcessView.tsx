'use client';

import React, { useState } from 'react';
import { UploadSection } from './UploadSection';
import { MappingTableSection } from './MappingTableSection';
import { ExcelPreviewSection } from './ExcelPreviewSection';
import { AIExplanationDrawer } from './AIExplanationDrawer';
import { ChangeMappingModal } from './ChangeMappingModal';
import { BottomGridSection } from './BottomGridSection';
import { TransformationPreviewSection } from './TransformationPreviewSection';
import { Step3FormatReviewSection } from './Step3FormatReviewSection';
import { useProcessStore } from '@/store/useProcessStore';
import { FileSpreadsheet, Table, Sparkles } from 'lucide-react';

export const NewProcessView: React.FC = () => {
  const { process, currentStep, isAnalyzing } = useProcessStore();
  const [activeViewMode, setActiveViewMode] = useState<'excel' | 'mapping' | 'both'>('both');

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Top upload & analysis progress section */}
      <UploadSection />

      {/* Render tables, previews and bottom summary ONLY when process is loaded or being analyzed */}
      {(process || isAnalyzing) && (
        <>
          {/* STEP 4: เสร็จสมบูรณ์ & ดาวน์โหลดไฟล์ */}
          {currentStep === 4 && (
            <TransformationPreviewSection />
          )}

          {/* STEP 3: ตรวจสอบการจัด Format ข้อมูล, ข้อมูลที่ไม่ได้ใช้ & ยืนยันความถูกต้อง */}
          {currentStep === 3 && (
            <Step3FormatReviewSection />
          )}

          {/* STEP 2: การจับคู่ฟิลด์ AI (AI Mapping) & พรีวิวไฟล์ต้นฉบับ */}
          {currentStep <= 2 && (
            <>
              {/* Step 2 View Switcher Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-[#2e1d52]">
                    พรีวิวและจับคู่ฟิลด์ (Step 2 Preview & AI Mapping):
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setActiveViewMode('both')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      activeViewMode === 'both'
                        ? 'bg-[#2e1d52] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>แสดงทั้งคู่ (Excel & Mapping)</span>
                  </button>

                  <button
                    onClick={() => setActiveViewMode('excel')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      activeViewMode === 'excel'
                        ? 'bg-[#107c41] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                    <span>หน้าต่าง Excel จริง</span>
                  </button>

                  <button
                    onClick={() => setActiveViewMode('mapping')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      activeViewMode === 'mapping'
                        ? 'bg-purple-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5 text-purple-200" />
                    <span>ตารางจับคู่ AI</span>
                  </button>
                </div>
              </div>

              {/* Real Excel File Data Preview */}
              {(activeViewMode === 'excel' || activeViewMode === 'both') && (
                <div className="w-full max-w-full">
                  <ExcelPreviewSection />
                </div>
              )}

              {/* Main Field Mapping Table (Full Screen Width) */}
              {(activeViewMode === 'mapping' || activeViewMode === 'both') && (
                <div className="w-full max-w-full">
                  <MappingTableSection />
                </div>
              )}

              {/* AI Explanation Centered Popup Modal */}
              <AIExplanationDrawer />

              {/* Change Mapping Modal */}
              <ChangeMappingModal />

              {/* Bottom Summary Grid (Step 2 Only) */}
              <BottomGridSection />
            </>
          )}
        </>
      )}
    </div>
  );
};
