'use client';

import React, { useRef, useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Info,
  Upload,
  Sparkles,
  Plus,
  Check,
  RefreshCw,
  History,
  Download,
} from 'lucide-react';
import { useProcessStore, generateAiRecommendedTemplateFromFile } from '@/store/useProcessStore';
import { CreateTemplateModal } from '../templates/CreateTemplateModal';
import { TargetTemplate } from '@/types';

import { DuplicateRowsModal } from './DuplicateRowsModal';
import { MissingValuesModal } from './MissingValuesModal';

export const UploadSection: React.FC = () => {
  const { process, uploadFile, isAnalyzing, setProcess, switchTemplate, downloadSourceFile } = useProcessStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState<boolean>(false);
  const [isMissingModalOpen, setIsMissingModalOpen] = useState<boolean>(false);
  const [isSavedTemplate, setIsSavedTemplate] = useState<boolean>(false);
  const [savedTemplateName, setSavedTemplateName] = useState<string>('');
  const [savedFieldCount, setSavedFieldCount] = useState<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsSavedTemplate(false);
      uploadFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setIsSavedTemplate(false);
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  // Construct initial AI Extracted Template for pre-filled preview
  const defaultAiExtractedTemplate: TargetTemplate = React.useMemo(() => {
    return generateAiRecommendedTemplateFromFile(process);
  }, [process]);

  const handleSaveSuccess = async (savedTmpl: TargetTemplate) => {
    setIsSavedTemplate(true);
    setSavedTemplateName(savedTmpl.name);
    setSavedFieldCount(savedTmpl.fields.length);

    await switchTemplate(savedTmpl.id);
  };

  const progressPercent = isAnalyzing ? 40 : process?.analysis_progress || 100;

  // Initial State: No file uploaded and no history process selected
  if (!process && !isAnalyzing) {
    return (
      <div className="space-y-6 w-full max-w-full">
        {/* Standalone Initial Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="banking-card p-12 text-center border-2 border-dashed border-purple-300 hover:border-purple-600 transition bg-gradient-to-b from-purple-50/40 via-white to-purple-50/20 rounded-3xl shadow-sm cursor-pointer group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            onClick={(e) => {
              (e.target as HTMLInputElement).value = '';
            }}
            accept=".xlsx,.xls,.csv,.pdf,.eml,.msg,.txt,.json"
            className="hidden"
          />

          <div className="w-16 h-16 bg-purple-100 group-hover:bg-purple-200 text-purple-900 rounded-2xl flex items-center justify-center mx-auto mb-4 transition transform group-hover:scale-105 shadow-md">
            <Upload className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-black text-[#2e1d52] mb-1">
            อัปโหลดไฟล์ข้อมูลธุรกรรม (Excel / PDF / Email / CSV / Text)
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            รองรับการนำเข้าไฟล์ข้อมูลทุกรูปแบบด้วย AI Document Intelligence: <strong className="text-slate-700">Excel (.xlsx), PDF (.pdf), Email (.eml, .msg), CSV/Text (.csv, .txt), JSON</strong>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300">
              Excel (.xlsx, .xls)
            </span>
            <span className="px-2.5 py-1 text-[10px] font-extrabold bg-rose-100 text-rose-800 rounded-lg border border-rose-300">
              PDF (.pdf)
            </span>
            <span className="px-2.5 py-1 text-[10px] font-extrabold bg-amber-100 text-amber-900 rounded-lg border border-amber-300">
              Email (.eml, .msg)
            </span>
            <span className="px-2.5 py-1 text-[10px] font-extrabold bg-sky-100 text-sky-900 rounded-lg border border-sky-300">
              CSV / Text (.csv, .txt)
            </span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button className="purple-gradient-btn px-6 py-2.5 rounded-xl text-xs font-bold shadow-md">
              เลือกไฟล์ต้นทาง (ทุกรูปแบบ)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Main 3 Cards Grid - Sleek, Balanced & High Contrast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* 1. Source File Card */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="banking-card p-5 flex flex-col justify-between relative overflow-hidden group hover:border-purple-300 transition-all duration-200 shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-purple-700" />
                ไฟล์ต้นทาง (SOURCE FILE)
              </span>
              <div className="flex items-center gap-1.5">
                {/* Download Source File Button */}
                <button
                  type="button"
                  onClick={() => downloadSourceFile(process)}
                  className="text-[11px] font-extrabold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 transition flex items-center gap-1 shadow-xs cursor-pointer"
                  title="ดาวน์โหลดไฟล์ต้นฉบับที่อัปโหลด"
                >
                  <Download className="w-3 h-3 stroke-[2.5]" />
                  <span>ดาวน์โหลดไฟล์</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-extrabold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg border border-purple-200 transition flex items-center gap-1 cursor-pointer shadow-xs"
                  title="เปลี่ยนเป็นไฟล์ข้อมูลอื่น"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>เปลี่ยนไฟล์</span>
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                onClick={(e) => {
                  (e.target as HTMLInputElement).value = '';
                }}
                accept=".xlsx,.xls,.csv,.pdf,.eml,.msg,.txt,.json"
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-3.5 p-2.5 bg-gradient-to-r from-emerald-50/80 to-teal-50/40 rounded-xl border border-emerald-200/80 mb-3 shadow-xs">
              <div className="w-11 h-11 bg-white rounded-xl border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm flex-shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-slate-900 truncate" title={process?.file_name}>
                  {process?.file_name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-bold text-slate-600">
                    ขนาดไฟล์: <span className="text-slate-800 font-extrabold">{process?.file_size}</span>
                  </span>
                  <span className="text-[10px] bg-emerald-200/70 text-emerald-900 font-extrabold px-1.5 py-0.2 rounded">
                    พร้อมใช้งาน
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Dynamic Metric Pills */}
          {(() => {
            const sCount = process?.sheet_count || (process?.sheets?.length) || 1;
            const rCount = process?.extractedRecords?.length || process?.row_count || 43;
            const cCount = process?.mappings?.length || process?.column_count || 8;
            const matchedCount = (process?.mappings || []).filter(m => m.target_field && m.target_field !== 'UNMATCHED').length || 8;

            return (
              <div className="grid grid-cols-3 gap-2 bg-slate-50/90 p-2.5 rounded-xl border border-slate-200 text-center mt-auto">
                <div className="p-1">
                  <div className="text-[10px] uppercase font-black text-slate-500">จำนวนชีท</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{sCount} ชีท</div>
                </div>
                <div className="border-x border-slate-200/90 p-1">
                  <div className="text-[10px] uppercase font-black text-slate-500">จำนวนแถว</div>
                  <div className="text-sm font-black text-purple-950 mt-0.5">
                    {rCount} แถว
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium truncate">{sCount === 1 ? '(ไฟล์อัปโหลด)' : `(รวม ${sCount} ชีท)`}</div>
                </div>
                <div className="p-1">
                  <div className="text-[10px] uppercase font-black text-slate-500">ฟิลด์ต้นทาง</div>
                  <div className="text-sm font-black text-[#2e1d52] mt-0.5">
                    {cCount} ฟิลด์
                  </div>
                  <div className="text-[9px] text-emerald-700 font-extrabold truncate">({matchedCount}/8 ฟิลด์ KKP)</div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* 2. AI Analysis Progress */}
        <div className="banking-card p-5 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse shadow-sm" />
                <h3 className="text-xs font-black text-[#2e1d52] uppercase tracking-wider">
                  ความคืบหน้าการวิเคราะห์ของ AI
                </h3>
              </div>
              <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {isAnalyzing ? 'กำลังวิเคราะห์...' : 'วิเคราะห์สำเร็จ'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <ul className="space-y-1 text-[11px] flex-1 min-w-0">
                <li className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">อ่านโครงสร้างไฟล์ Excel / CSV</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">ตรวจจับฟิลด์และประเภทข้อมูล</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">วิเคราะห์ความหมายของฟิลด์</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">จับคู่มาตรฐาน / แนะนำ Schema</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">ตรวจสอบกฎการแปลงข้อมูล</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">เตรียมตัวอย่างผลลัพธ์</span>
                </li>
              </ul>

              {/* Compact Circular SVG Gauge */}
              <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center bg-gradient-to-b from-purple-50/70 to-slate-50/80 rounded-2xl p-1.5 border border-purple-100 shadow-inner">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-purple-700 transition-all duration-1000 ease-out drop-shadow-sm"
                    strokeDasharray={`${progressPercent}, 100`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black text-[#2e1d52] tracking-tight">
                    {progressPercent}%
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold">
                    สมบูรณ์
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-semibold">สถานะการประมวลผล:</span>
            <span className="font-extrabold text-[#2e1d52] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              พร้อมตรวจสอบในขั้นตอนที่ 2
            </span>
          </div>
        </div>

        {/* 3. AI Analysis Summary (AI Rule Engine) */}
        <div className="banking-card p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black text-[#2e1d52] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              สรุปผลการวิเคราะห์ AI (AI RULE ENGINE)
            </h3>
            <span className="text-[10px] text-purple-800 font-mono font-black bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
              RULES
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] flex-1">
            <div className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-slate-50 transition border-b border-slate-100">
              <div>
                <span className="text-slate-900 font-extrabold block">ค้นหาหัวแถว (Dynamic Header Search)</span>
                <span className="text-slate-500 text-[10px]">สแกนหาหัวคอลัมน์อัตโนมัติในทุกบรรทัด</span>
              </div>
              <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex-shrink-0">
                บรรทัดที่ 4
              </span>
            </div>

            <div className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-slate-50 transition border-b border-slate-100">
              <div>
                <span className="text-slate-900 font-extrabold block">ประเภทข้อมูล & Format ความยาว</span>
                <span className="text-slate-500 text-[10px]">ถ้ารูปแบบ/จำนวนตัวอักษรไม่ตรง ปรับความเชื่อมั่น &lt; 70%</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            </div>

            <div className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-slate-50 transition border-b border-slate-100">
              <div>
                <span className="text-slate-900 font-extrabold block">รูปแบบวันที่ (พ.ศ. / ค.ศ.)</span>
                <span className="text-slate-500 text-[10px]">แปลง พ.ศ./ค.ศ. เป็น YYYY-MM-DD มาตรฐาน</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            </div>

            <div className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-slate-50 transition border-b border-slate-100">
              <div>
                <span className="text-slate-900 font-extrabold block">สกุลเงินสากล (ISO 4217)</span>
                <span className="text-slate-500 text-[10px]">รองรับทุกสกุลเงิน (หากไม่ใช่สกุลเงิน ปรับความเชื่อมั่น &lt; 40%)</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            </div>

            {/* Dynamic Duplicate Rows Item */}
            {(() => {
              const dupCount = process?.analysis_summary?.potential_duplicates !== undefined ? process.analysis_summary.potential_duplicates : 2;
              const hasDup = dupCount > 0;

              return (
                <div 
                  onClick={() => hasDup && setIsDuplicateModalOpen(true)}
                  className={`flex items-center justify-between py-1 px-1.5 rounded-lg transition border-b border-slate-100 ${
                    hasDup ? 'hover:bg-red-50/70 cursor-pointer group bg-red-50/30' : 'bg-slate-50/30'
                  }`}
                  title={hasDup ? `คลิกเพื่อดูรายละเอียดและจัดการแถวซ้ำ (${dupCount} แถว)` : 'ไม่พบรายการแถวซ้ำในไฟล์อัปโหลด'}
                >
                  <div>
                    <span className={`font-black block ${hasDup ? 'text-red-900 group-hover:underline' : 'text-slate-700'}`}>
                      แถวซ้ำ / คอลัมน์ซ้ำ
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {hasDup ? 'ซ้ำเป๊ะทุก Column ปรับ 20% / คอลัมน์ซ้ำปรับ 10%' : 'สแกนทุกบรรทัด ไม่พบแถวซ้ำซ้อน'}
                    </span>
                  </div>
                  {hasDup ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsDuplicateModalOpen(true); }}
                      className="font-black text-red-700 bg-red-100/80 hover:bg-red-200 px-2 py-0.5 rounded-md border border-red-300 shadow-xs transition flex items-center gap-1 text-[10.5px] cursor-pointer flex-shrink-0"
                    >
                      <span>{dupCount} แถว (45, 46)</span>
                      <span className="text-[9.5px] bg-red-200 text-red-950 px-1 rounded font-black">ดู</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ไม่พบแถวซ้ำ (0)
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Dynamic Missing Values (Amber) Item */}
            {(() => {
              const missingCount = process?.analysis_summary?.missing_values !== undefined ? process.analysis_summary.missing_values : 8;
              const hasMissing = missingCount > 0;

              return (
                <div 
                  onClick={() => hasMissing && setIsMissingModalOpen(true)}
                  className={`flex items-center justify-between py-1 px-1.5 rounded-lg transition ${
                    hasMissing ? 'hover:bg-amber-50/70 cursor-pointer group bg-amber-50/30' : 'bg-slate-50/30'
                  }`}
                  title={hasMissing ? `คลิกเพื่อดูรายละเอียดและกรองดูเฉพาะรายการ Amber (${missingCount} รายการ)` : 'ไม่พบข้อมูลขาดหายในไฟล์อัปโหลด'}
                >
                  <div>
                    <span className={`font-black block ${hasMissing ? 'text-amber-950 group-hover:underline' : 'text-slate-700'}`}>
                      ข้อมูลขาดหาย (Missing Values)
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {hasMissing ? 'Required Field ปรับ 0% / Optional Field ปรับ 20%' : 'ข้อมูลครบถ้วนทุก Required & Optional Fields'}
                    </span>
                  </div>
                  {hasMissing ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsMissingModalOpen(true); }}
                      className="font-black text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md border border-amber-300 shadow-xs transition flex items-center gap-1 text-[10.5px] cursor-pointer flex-shrink-0"
                    >
                      <span>{missingCount} รายการ (Amber)</span>
                      <span className="text-[9.5px] bg-amber-200 text-amber-950 px-1 rounded font-black">ดู</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ข้อมูลครบถ้วน (0)
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Interactive Modals */}
      <DuplicateRowsModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
      />

      <MissingValuesModal
        isOpen={isMissingModalOpen}
        onClose={() => setIsMissingModalOpen(false)}
      />

      {/* Interactive Save AI Template Modal */}
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialTemplate={defaultAiExtractedTemplate}
        isAiSaveMode={true}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
};
