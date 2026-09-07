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
} from 'lucide-react';
import { useProcessStore } from '@/store/useProcessStore';
import { CreateTemplateModal } from '../templates/CreateTemplateModal';
import { TargetTemplate } from '@/types';

export const UploadSection: React.FC = () => {
  const { process, uploadFile, isAnalyzing, setProcess } = useProcessStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isSavedTemplate, setIsSavedTemplate] = useState<boolean>(false);
  const [savedTemplateName, setSavedTemplateName] = useState<string>('');
  const [savedFieldCount, setSavedFieldCount] = useState<number>(8);

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
  const defaultAiExtractedTemplate: TargetTemplate = {
    id: `tmpl_${Date.now()}`,
    name: `KKP_CUSTODIAN_TRADE_NEW_V1`,
    description: `รูปแบบมาตรฐานที่สกัดอัตโนมัติจากไฟล์ ${process?.file_name || 'KKP_Demo_Source_Files.xlsx'}`,
    version: '2.0',
    field_count: 8,
    status: 'Active',
    updated_at: new Date().toLocaleDateString('th-TH'),
    fields: [
      { id: 'f1', name: 'FUND_NAME', data_type: 'String', format: '-', required: true, description: 'ชื่อกองทุนรวม' },
      { id: 'f2', name: 'FUND_CODE', data_type: 'String', format: '-', required: true, description: 'รหัสกองทุนรวม' },
      { id: 'f3', name: 'TRADE_DATE', data_type: 'Date', format: 'YYYY-MM-DD', required: true, description: 'วันที่ทำรายการ' },
      { id: 'f4', name: 'SETTLEMENT_DATE', data_type: 'Date', format: 'YYYY-MM-DD', required: true, description: 'วันที่ชำระราคา' },
      { id: 'f5', name: 'CURRENCY', data_type: 'String', format: 'ISO 4217', required: true, description: 'รหัสสกุลเงิน' },
      { id: 'f6', name: 'UNIT_PRICE', data_type: 'Decimal', format: '18,4', required: true, description: 'ราคาต่อหน่วย' },
      { id: 'f7', name: 'QUANTITY', data_type: 'Decimal', format: '18,4', required: true, description: 'จำนวนหน่วย' },
      { id: 'f8', name: 'AMOUNT', data_type: 'Decimal', format: '18,2', required: true, description: 'มูลค่ารวม' },
    ],
  };

  const handleSaveSuccess = (savedTmpl: TargetTemplate) => {
    setIsSavedTemplate(true);
    setSavedTemplateName(savedTmpl.name);
    setSavedFieldCount(savedTmpl.fields.length);

    if (process) {
      setProcess({
        ...process,
        target_template: savedTmpl.name,
        target_template_id: savedTmpl.id,
      });
    }
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
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          <div className="w-16 h-16 bg-purple-100 group-hover:bg-purple-200 text-purple-900 rounded-2xl flex items-center justify-center mx-auto mb-4 transition transform group-hover:scale-105 shadow-md">
            <Upload className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-black text-[#2e1d52] mb-1">
            อัปโหลดไฟล์ข้อมูลธุรกรรม (Excel / CSV)
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            ลากและวางไฟล์ .xlsx, .xls หรือ .csv ของคุณที่นี่ หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์
          </p>

          <div className="flex items-center justify-center gap-2">
            <button className="purple-gradient-btn px-6 py-2.5 rounded-xl text-xs font-bold shadow-md">
              เลือกไฟล์ต้นทาง
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Main 3 Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Source File Card */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="banking-card p-5 flex flex-col justify-between relative overflow-hidden group hover:border-purple-300 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              ไฟล์ต้นทาง (Source File)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 hover:underline bg-purple-50 px-2 py-1 rounded-lg border border-purple-200"
              >
                <RefreshCw className="w-3 h-3" />
                เปลี่ยนไฟล์
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
          </div>

          <div className="flex items-center gap-4 my-2">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm flex-shrink-0">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-slate-900 truncate" title={process?.file_name}>
                {process?.file_name}
              </h3>
              <p className="text-xs text-slate-700 font-semibold">
                ขนาดไฟล์: {process?.file_size}
              </p>
            </div>
          </div>

          {/* 3 Dynamic Metric Pills */}
          {(() => {
            const sCount = process?.sheet_count || (process?.sheets?.length) || 1;
            const rCount = process?.extractedRecords?.length || process?.row_count || 43;
            const cCount = process?.mappings?.length || process?.column_count || 8;
            const matchedCount = (process?.mappings || []).filter(m => m.target_field && m.target_field !== 'UNMATCHED').length || 8;

            return (
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center mt-2">
                <div>
                  <div className="text-[10px] uppercase font-extrabold text-slate-700">จำนวนชีท</div>
                  <div className="text-sm font-extrabold text-slate-900">{sCount} ชีท</div>
                </div>
                <div className="border-x border-slate-200">
                  <div className="text-[10px] uppercase font-extrabold text-slate-700">จำนวนแถวข้อมูล</div>
                  <div className="text-sm font-extrabold text-purple-950">
                    {rCount} แถว
                  </div>
                  <div className="text-[9px] text-slate-500 font-semibold">{sCount === 1 ? '(ไฟล์อัปโหลด)' : `(รวม ${sCount} ชีท)`}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-extrabold text-slate-700">ฟิลด์ต้นทาง (เทียบ KKP)</div>
                  <div className="text-sm font-extrabold text-[#2e1d52]">
                    {cCount} ฟิลด์
                  </div>
                  <div className="text-[9px] text-emerald-600 font-bold">({matchedCount}/8 ฟิลด์ KKP)</div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* 2. AI Analysis Progress */}
        <div className="banking-card p-5 flex items-center justify-between">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              <h3 className="text-xs font-extrabold text-[#2e1d52] uppercase tracking-wider">
                ความคืบหน้าการวิเคราะห์ของ AI
              </h3>
            </div>

            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-2 text-slate-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>อ่านโครงสร้างไฟล์ Excel / CSV</span>
              </li>
              <li className="flex items-center gap-2 text-slate-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>ตรวจจับฟิลด์และประเภทข้อมูล</span>
              </li>
              <li className="flex items-center gap-2 text-slate-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>วิเคราะห์ความหมายของฟิลด์ด้วย AI</span>
              </li>
              <li className="flex items-center gap-2 text-slate-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>จับคู่รูปแบบมาตรฐานหรือสร้างเป้าหมายใหม่</span>
              </li>
              <li className="flex items-center gap-2 text-slate-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>ตรวจสอบกฎการแปลงข้อมูล</span>
              </li>
              <li className="flex items-center gap-2 text-slate-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>เตรียมตัวอย่างไฟล์ผลลัพธ์</span>
              </li>
            </ul>
          </div>

          {/* Circular SVG Gauge */}
          <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-purple-700 transition-all duration-1000 ease-out"
                strokeDasharray={`${progressPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl font-extrabold text-[#2e1d52]">
                {progressPercent}%
              </span>
              <span className="text-[10px] text-slate-600 font-bold">
                {isAnalyzing ? 'กำลังวิเคราะห์...' : 'วิเคราะห์สำเร็จ'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. AI Analysis Summary */}
        <div className="banking-card p-5">
          <h3 className="text-xs font-extrabold text-[#2e1d52] uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>สรุปผลการวิเคราะห์ AI (AI Rule Engine)</span>
            <span className="text-[10px] text-purple-700 font-mono font-bold bg-purple-100 px-2 py-0.5 rounded border border-purple-200">Rules</span>
          </h3>

          <div className="space-y-2 text-[11px]">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <div>
                <span className="text-slate-900 font-bold block">ค้นหาหัวแถว (Dynamic Header Search)</span>
                <span className="text-slate-500 text-[10px]">สแกนหาหัวคอลัมน์อัตโนมัติในทุกบรรทัด</span>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">บรรทัดที่ 4</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <div>
                <span className="text-slate-900 font-bold block">ประเภทข้อมูล & Format ความยาว</span>
                <span className="text-slate-500 text-[10px]">ถ้ารูปแบบ/จำนวนตัวอักษรไม่ตรง ปรับความเชื่อมั่น &lt; 70%</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <div>
                <span className="text-slate-900 font-bold block">รูปแบบวันที่ (พ.ศ. / ค.ศ.)</span>
                <span className="text-slate-500 text-[10px]">แปลง พ.ศ./ค.ศ. เป็น YYYY-MM-DD มาตรฐาน</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <div>
                <span className="text-slate-900 font-bold block">สกุลเงินสากล (ISO 4217)</span>
                <span className="text-slate-500 text-[10px]">รองรับทุกสกุลเงิน (หากไม่ใช่สกุลเงิน ปรับความเชื่อมั่น &lt; 40%)</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <div>
                <span className="text-slate-900 font-bold block text-amber-900">แถวซ้ำ / คอลัมน์ซ้ำ</span>
                <span className="text-slate-500 text-[10px]">ซ้ำเป๊ะทุก Column ปรับ 20% / คอลัมน์ซ้ำปรับ 10%</span>
              </div>
              <span className="font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">2 แถว (แถว 45, 46)</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-slate-900 font-bold block text-purple-900">ข้อมูลขาดหาย (Missing Values)</span>
                <span className="text-slate-500 text-[10px]">Required Field ปรับ 0% / Optional Field ปรับ 20%</span>
              </div>
              <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">8 รายการ (Amber)</span>
            </div>
          </div>
        </div>
      </div>

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
