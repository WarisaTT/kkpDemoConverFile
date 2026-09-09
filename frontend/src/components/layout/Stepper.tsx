'use client';

import React from 'react';
import { useProcessStore, checkAllSheetsVerification } from '@/store/useProcessStore';
import { Check, Lock } from 'lucide-react';

export const Stepper: React.FC = () => {
  const {
    currentStep,
    setCurrentStep,
    process,
    isAnalyzing,
    templates = [],
    checkedFieldIds = {},
    activeSheetName,
  } = useProcessStore();

  const isStep1Completed = process !== null && !isAnalyzing;

  // Once finished in Step 4: "เสร็จแล้วคือเสร็จ ไม่สามารถย้อนกลับไปแก้ไข Step ก่อนหน้าได้"
  const isProcessDone = (process?.status === 'Completed') || currentStep === 4;

  const multiSheetStatus = checkAllSheetsVerification(process, templates, checkedFieldIds, activeSheetName);
  const isAllSheetsVerified = multiSheetStatus.isAllVerified;

  // Step 4 is ONLY accessible if user has confirmed review in Step 3
  // Step 3 is ONLY accessible if user has verified all sheets in Step 2
  const maxAllowedStep = !process
    ? 1
    : isProcessDone
    ? 4
    : !isAllSheetsVerified && (process.current_step || 2) < 3
    ? 2
    : Math.max(Math.min(process.current_step || 2, 3), currentStep);

  const steps = [
    { number: 1, label: '1. อัปโหลด & วิเคราะห์' },
    { number: 2, label: '2. การจับคู่ฟิลด์ AI' },
    { number: 3, label: '3. ตรวจสอบ Format & ยืนยัน' },
    { number: 4, label: '4. เสร็จสมบูรณ์ & ดาวน์โหลด' },
  ];

  return (
    <div className="w-full bg-white px-8 py-3.5 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = step.number === 1 ? isStep1Completed : step.number < currentStep || (isProcessDone && step.number <= 4);
          const isActive = step.number === currentStep;
          // If finished, steps 2 & 3 are locked to preserve audit integrity, but Step 1 (Upload/Change File) remains accessible
          const isBlockedBySheets = step.number >= 3 && !isAllSheetsVerified && (process?.current_step || 2) < 3;
          const isDisabled = isProcessDone ? (step.number !== 4 && step.number !== 1) : step.number > maxAllowedStep || isBlockedBySheets;

          let badgeStyle = 'bg-slate-100 text-slate-400';
          let labelStyle = 'text-slate-400 font-semibold';

          if (isCompleted) {
            badgeStyle = 'bg-emerald-600 text-white shadow-sm';
            labelStyle = 'text-emerald-800 font-extrabold';
          } else if (isActive) {
            badgeStyle = 'bg-[#3c2a68] text-white ring-4 ring-purple-100 shadow-sm';
            labelStyle = 'text-[#2e1d52] font-extrabold';
          } else if (!isDisabled) {
            badgeStyle = 'bg-purple-100 text-purple-900 border border-purple-300';
            labelStyle = 'text-purple-900 font-bold';
          }

          if (step.number === 1 && isAnalyzing) {
            badgeStyle = 'bg-purple-700 text-white ring-4 ring-purple-200 animate-pulse';
            labelStyle = 'text-purple-900 font-extrabold';
          }

          return (
            <React.Fragment key={step.number}>
              <button
                type="button"
                onClick={() => !isDisabled && setCurrentStep(step.number)}
                disabled={isDisabled}
                title={
                  isProcessDone && step.number !== 4 && step.number !== 1
                    ? 'กระบวนการเสร็จสมบูรณ์แล้ว ไม่สามารถย้อนกลับไปแก้ไขขั้นตอนก่อนหน้าได้ (แต่สามารถคลิกขั้นตอนที่ 1 เพื่อเปลี่ยนไฟล์ใหม่ได้)'
                    : isDisabled
                    ? 'กรุณาดำเนินการขั้นตอนก่อนหน้าให้เสร็จสิ้นก่อน'
                    : `ไปยัง ${step.label}`
                }
                className={`flex items-center gap-2.5 transition-all ${
                  isDisabled
                    ? 'cursor-not-allowed opacity-50 select-none'
                    : 'cursor-pointer group'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${badgeStyle}`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isDisabled ? (
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className={`text-xs whitespace-nowrap transition ${labelStyle}`}>
                  {step.label}
                  {step.number === 1 && isCompleted && ' ✓'}
                </span>
              </button>

              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mx-3 transition-colors ${
                    isCompleted || step.number < currentStep ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
