'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { formatTargetValue, getSafeCellText } from '../../utils/formatUtils';
import {
  FileSpreadsheet,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Layers,
  Key,
  Check,
  Info,
} from 'lucide-react';

interface MergeExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRows: any[];
  currentHeaders: string[];
  onConfirmMerge: (newRows: any[], newColumnsAdded: string[]) => void;
}

export const MergeExcelModal: React.FC<MergeExcelModalProps> = ({
  isOpen,
  onClose,
  currentRows,
  currentHeaders,
  onConfirmMerge,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [externalFileName, setExternalFileName] = useState<string>('');
  const [externalHeaders, setExternalHeaders] = useState<string[]>([]);
  const [externalRows, setExternalRows] = useState<any[]>([]);

  // Selected Join Keys & Selected Merge Columns
  const [currentJoinKey, setCurrentJoinKey] = useState<string>('FUND_CODE');
  const [externalJoinKey, setExternalJoinKey] = useState<string>('');
  const [selectedExternalCols, setSelectedExternalCols] = useState<Record<string, boolean>>({});
  const [colTargetMapping, setColTargetMapping] = useState<Record<string, string>>({});

  // AI Recommendation State
  const [aiRecommendedKey, setAiRecommendedKey] = useState<string>('');
  const [aiReasoning, setAiReasoning] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setExternalFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.SheetNames[0] || 'Sheet1';
      const ws = workbook.Sheets[firstSheet];
      const matrix: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      let headerIdx = 0;
      for (let r = 0; r < Math.min(10, matrix.length); r++) {
        const items = (matrix[r] || []).map((c) => String(c).trim()).filter(Boolean);
        if (items.length >= 2) {
          headerIdx = r;
          break;
        }
      }

      const headers = (matrix[headerIdx] || []).map((c) => String(c).trim()).filter(Boolean);
      const dataRows = matrix.slice(headerIdx + 1);

      const parsedRows = dataRows.map((r, rIdx) => {
        const obj: Record<string, any> = { _id: rIdx + 1 };
        headers.forEach((h, cIdx) => {
          obj[h] = r[cIdx] !== undefined ? String(r[cIdx]).trim() : '';
        });
        return obj;
      });

      setExternalHeaders(headers);
      setExternalRows(parsedRows);

      // AI Analysis for recommended Join Key
      let recommendedKey = headers[0] || '';
      let reasoning = '';

      for (const h of headers) {
        if (/fund.*code|fund.*id|isin|identifier|symbol/i.test(h)) {
          recommendedKey = h;
          reasoning = `AI แนะนำให้ใช้คอลัมน์ "${h}" เป็น Join Key เนื่องจากเป็นรหัสอ้างอิงกองทุนสากล (Unique Identifier Matching 100%)`;
          break;
        } else if (/fund.*name|portfolio|scheme/i.test(h)) {
          recommendedKey = h;
          reasoning = `AI แนะนำให้ใช้คอลัมน์ "${h}" เป็น Join Key เนื่องจากตรงกับชื่อกองทุนรวมของระบบหลัก`;
          break;
        }
      }

      if (!reasoning) {
        reasoning = `AI แนะนำให้ใช้คอลัมน์แรก "${recommendedKey}" เป็น Key ในการจับคู่เชื่อมโยงข้อมูล`;
      }

      setExternalJoinKey(recommendedKey);
      setAiRecommendedKey(recommendedKey);
      setAiReasoning(reasoning);

      // Pre-select all non-join-key columns and auto-suggest target mappings
      const initialChecked: Record<string, boolean> = {};
      const initialMappings: Record<string, string> = {};

      headers.forEach((h) => {
        if (h !== recommendedKey) {
          initialChecked[h] = true;
          if (/settle.*date|settlement/i.test(h)) initialMappings[h] = 'SETTLEMENT_DATE';
          else if (/trade.*date/i.test(h)) initialMappings[h] = 'TRADE_DATE';
          else if (/fund.*code|isin/i.test(h)) initialMappings[h] = 'FUND_CODE';
          else if (/fund.*name|scheme/i.test(h)) initialMappings[h] = 'FUND_NAME';
          else if (/curr|ccy/i.test(h)) initialMappings[h] = 'CURRENCY';
          else if (/price|nav/i.test(h)) initialMappings[h] = 'UNIT_PRICE';
          else if (/unit|qty|quantity/i.test(h)) initialMappings[h] = 'QUANTITY';
          else if (/amount|val|value/i.test(h)) initialMappings[h] = 'AMOUNT';
          else initialMappings[h] = 'NEW_COLUMN';
        }
      });
      setSelectedExternalCols(initialChecked);
      setColTargetMapping(initialMappings);

      setStep(2);
    } catch (err) {
      console.error('Error parsing external Excel file:', err);
    }
  };

  const toggleColumnSelection = (col: string) => {
    setSelectedExternalCols((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const handleSelectAllCols = () => {
    const next: Record<string, boolean> = {};
    externalHeaders.forEach((h) => {
      if (h !== externalJoinKey) next[h] = true;
    });
    setSelectedExternalCols(next);
  };

  const handleDeselectAllCols = () => {
    const next: Record<string, boolean> = {};
    externalHeaders.forEach((h) => {
      if (h !== externalJoinKey) next[h] = false;
    });
    setSelectedExternalCols(next);
  };

  const selectedColsList = externalHeaders.filter(
    (h) => h !== externalJoinKey && selectedExternalCols[h]
  );

  // Compute Joined Preview Rows
  const computeMergedRows = () => {
    const externalKeyMap = new Map<string, any>();
    externalRows.forEach((exRow) => {
      const keyVal = String(exRow[externalJoinKey] || '').trim().toLowerCase();
      if (keyVal) {
        externalKeyMap.set(keyVal, exRow);
      }
    });

    return currentRows.map((currRow) => {
      const currKeyVal = String(
        currRow[currentJoinKey]?.formattedVal || currRow[currentJoinKey] || ''
      )
        .trim()
        .toLowerCase();

      const matchedExRow = externalKeyMap.get(currKeyVal);
      const mergedObj = { ...currRow };

      selectedColsList.forEach((col) => {
        const rawVal = matchedExRow ? matchedExRow[col] || '' : '';
        const targetMap = colTargetMapping[col] || 'NEW_COLUMN';

        if (targetMap !== 'NEW_COLUMN') {
          // Replace/populate into standard target field formatted
          mergedObj[targetMap] = formatTargetValue(targetMap, rawVal);
        } else {
          // Add as new external column
          mergedObj[col] = rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== ''
            ? { formattedVal: String(rawVal).trim(), ruleDescription: `นำเข้าจาก ${externalFileName}`, wasFormatted: false }
            : { formattedVal: '-', ruleDescription: `นำเข้าจาก ${externalFileName}`, wasFormatted: false };
        }
      });

      return mergedObj;
    });
  };

  const mergedPreviewRows = computeMergedRows();

  const handleFinalConfirm = () => {
    const newColsAdded = selectedColsList.filter(
      (col) => (colTargetMapping[col] || 'NEW_COLUMN') === 'NEW_COLUMN'
    );
    onConfirmMerge(mergedPreviewRows, newColsAdded);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-3xl border-2 border-purple-300 shadow-2xl w-full max-w-3xl overflow-hidden z-10 p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 border border-purple-300 flex items-center justify-center text-purple-900 shadow-sm">
              <Plus className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-widest text-purple-700 uppercase bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-300">
                MULTI-EXCEL COLUMN MERGE ENGINE
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                เพิ่มคอลัมน์จากไฟล์ Excel อื่น (Merge External Excel Columns)
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

        {/* Step Progress Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs flex-shrink-0">
          <div
            className={`flex items-center gap-2 font-extrabold ${
              step === 1 ? 'text-purple-700' : 'text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-purple-100 border border-purple-300 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>1. อัปโหลดไฟล์ Excel อื่น</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300" />

          <div
            className={`flex items-center gap-2 font-extrabold ${
              step === 2 ? 'text-purple-700' : 'text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-purple-100 border border-purple-300 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>2. เลือก Key & คอลัมน์ที่ต้องการ</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300" />

          <div
            className={`flex items-center gap-2 font-extrabold ${
              step === 3 ? 'text-purple-700' : 'text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-purple-100 border border-purple-300 flex items-center justify-center text-[10px]">
              3
            </span>
            <span>3. ตรวจสอบผลลัพธ์ & ยืนยัน</span>
          </div>
        </div>

        {/* STEP 1: UPLOAD EXTERNAL EXCEL */}
        {step === 1 && (
          <div className="space-y-4 py-4 flex-1 flex flex-col justify-center">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-300 hover:border-purple-600 bg-purple-50/40 p-10 rounded-3xl text-center cursor-pointer transition group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <div className="w-14 h-14 bg-purple-100 text-purple-900 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition shadow-sm">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-1">
                คลิกหรือลากวางไฟล์ Excel ที่ต้องการดึงคอลัมน์เพิ่ม
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                รองรับไฟล์ .xlsx, .xls หรือ .csv ระบบ AI จะช่วยวิเคราะห์และแนะนำ Key ในการเชื่อมโยงข้อมูลให้อัตโนมัติ
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT JOIN KEY & COLUMNS TO MERGE */}
        {step === 2 && (
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {/* AI Recommendation Banner */}
            <div className="bg-gradient-to-r from-purple-50 via-purple-100/50 to-emerald-50 p-4 rounded-2xl border border-purple-200 space-y-1">
              <div className="flex items-center gap-2 font-extrabold text-purple-950 text-xs">
                <Sparkles className="w-4 h-4 text-purple-700" />
                <span>คำแนะนำจาก AI Engine:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                {aiReasoning}
              </p>
            </div>

            {/* Key Selection Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-700" />
                  <span>1. เลือก Key จากไฟล์หลักปัจจุบัน:</span>
                </label>
                <select
                  value={currentJoinKey}
                  onChange={(e) => setCurrentJoinKey(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-extrabold text-purple-950 text-xs focus:border-purple-600 focus:outline-none"
                >
                  <option value="FUND_CODE">FUND_CODE (รหัสกองทุน)</option>
                  <option value="FUND_NAME">FUND_NAME (ชื่อกองทุน)</option>
                  <option value="TRADE_DATE">TRADE_DATE (วันที่ทำรายการ)</option>
                  <option value="SETTLEMENT_DATE">SETTLEMENT_DATE (วันที่ชำระราคา)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-700" />
                  <span>2. เลือก Key จากไฟล์ต้นทางใหม่ ({externalFileName}):</span>
                </label>
                <select
                  value={externalJoinKey}
                  onChange={(e) => setExternalJoinKey(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-extrabold text-emerald-950 text-xs focus:border-emerald-600 focus:outline-none"
                >
                  {externalHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h} {h === aiRecommendedKey ? '(AI Recommended)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Column Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                <div className="flex items-center gap-1.5">
                  <span>3. เลือกคอลัมน์ที่จะนำเข้าจากไฟล์ใหม่ ({selectedColsList.length} คอลัมน์ที่เลือก):</span>
                  <span className="text-[11px] text-purple-700 font-bold">
                    (จากทั้งหมด {externalHeaders.length} คอลัมน์)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={handleSelectAllCols}
                    className="font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
                  >
                    เลือกทั้งหมด
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllCols}
                    className="font-bold text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                  >
                    ล้างทั้งหมด
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 max-h-56 overflow-y-auto text-xs">
                {externalHeaders.map((h) => {
                  const isKey = h === externalJoinKey;
                  const isChecked = isKey || Boolean(selectedExternalCols[h]);
                  const mappedTarget = colTargetMapping[h] || 'NEW_COLUMN';

                  return (
                    <div
                      key={h}
                      onClick={() => {
                        if (!isKey) {
                          toggleColumnSelection(h);
                        }
                      }}
                      className={`flex flex-col gap-1.5 p-3 rounded-xl border transition cursor-pointer select-none ${
                        isKey
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : isChecked
                          ? 'bg-purple-50/70 text-purple-950 border-purple-300 font-extrabold shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={isKey}
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (!isKey) {
                              toggleColumnSelection(h);
                            }
                          }}
                          className="w-4 h-4 accent-purple-700 rounded cursor-pointer flex-shrink-0"
                        />
                        <span className="truncate font-extrabold text-xs">{h}</span>
                        {isKey && (
                          <span className="ml-auto text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                            Join Key
                          </span>
                        )}
                      </div>

                      {!isKey && isChecked && (
                        <div className="mt-1 pt-1.5 border-t border-purple-200/60" onClick={(e) => e.stopPropagation()}>
                          <label className="text-[10px] font-extrabold text-purple-900 flex items-center gap-1 mb-1">
                            <span>การแมชนำเข้า:</span>
                          </label>
                          <select
                            value={mappedTarget}
                            onChange={(e) => {
                              e.stopPropagation();
                              setColTargetMapping((prev) => ({ ...prev, [h]: e.target.value }));
                            }}
                            className="w-full text-[11px] p-1.5 bg-white border border-purple-300 rounded-lg text-purple-950 font-bold focus:outline-none focus:ring-1 focus:ring-purple-600"
                          >
                            <option value="NEW_COLUMN">นำเข้าเป็นคอลัมน์ใหม่ (New Column)</option>
                            <option value="FUND_NAME">แมชแทนที่: FUND_NAME (ชื่อกองทุน)</option>
                            <option value="FUND_CODE">แมชแทนที่: FUND_CODE (รหัสกองทุน)</option>
                            <option value="TRADE_DATE">แมชแทนที่: TRADE_DATE (วันที่ทำรายการ)</option>
                            <option value="SETTLEMENT_DATE">แมชแทนที่: SETTLEMENT_DATE (วันที่ชำระราคา)</option>
                            <option value="CURRENCY">แมชแทนที่: CURRENCY (สกุลเงิน)</option>
                            <option value="UNIT_PRICE">แมชแทนที่: UNIT_PRICE (ราคาต่อหน่วย)</option>
                            <option value="QUANTITY">แมชแทนที่: QUANTITY (จำนวนหน่วย)</option>
                            <option value="AMOUNT">แมชแทนที่: AMOUNT (มูลค่ารวม)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW MERGED ROWS & CONFIRM */}
        {step === 3 && (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-950 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  จับคู่ข้อมูลสำเร็จเรียบร้อย! คอลัมน์ใหม่ {selectedColsList.length} คอลัมน์จะถูกเพิ่มเข้าสู่ชุดข้อมูลหลัก
                </span>
              </div>
              <span className="bg-emerald-200 text-emerald-900 text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                Join Key: {currentJoinKey} ↔ {externalJoinKey}
              </span>
            </div>

            {/* Merged Preview Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs max-h-64 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#2e1d52] text-white font-extrabold text-[11px] sticky top-0">
                  <tr>
                    <th className="p-2.5">FUND_CODE</th>
                    <th className="p-2.5">FUND_NAME</th>
                    {selectedColsList.map((col) => (
                      <th key={col} className="p-2.5 bg-purple-900 text-amber-300">
                        + {col} (คอลัมน์ใหม่)
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] bg-white font-medium">
                  {mergedPreviewRows.slice(0, 10).map((r, idx) => (
                    <tr key={idx} className="hover:bg-purple-50/30">
                      <td className="p-2.5 font-bold text-purple-950">
                        {getSafeCellText(r.FUND_CODE) || '-'}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-800">
                        {getSafeCellText(r.FUND_NAME) || '-'}
                      </td>
                      {selectedColsList.map((col) => (
                        <td key={col} className="p-2.5 font-bold text-purple-900 bg-purple-50/50">
                          {getSafeCellText(r[col]) || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-shrink-0">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับ</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              ยกเลิก
            </button>

            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                disabled={selectedColsList.length === 0}
                className="px-5 py-2 text-xs font-extrabold text-white bg-purple-900 hover:bg-purple-800 disabled:opacity-40 rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>ดูตัวอย่างข้อมูลที่ผสาน (Next)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={handleFinalConfirm}
                className="px-5 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>ยืนยันการเพิ่มคอลัมน์ (Confirm Merge)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
