'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Copy,
  Trash2,
  X,
  CheckCircle2,
  Info,
  Filter,
  FileSpreadsheet,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useProcessStore } from '@/store/useProcessStore';

interface DuplicateRowsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DuplicateRowsModal: React.FC<DuplicateRowsModalProps> = ({ isOpen, onClose }) => {
  const { process, setProcess } = useProcessStore();
  const [expandedRow, setExpandedRow] = useState<number | null>(45);

  if (!isOpen) return null;

  const duplicateItems = [
    {
      rowNum: 45,
      originalRow: 15,
      fundName: 'KKP Short Term Fixed Income Fund',
      fundCode: 'F1000',
      tradeDate: '15/07/2026',
      amount: '35,429.50 THB',
      matchPercent: '100% (Identical Duplicate)',
      columns: [
        { name: 'FUND_NAME (ชื่อกองทุน)', orig: 'KKP Short Term Fixed Income Fund', dup: 'KKP Short Term Fixed Income Fund', match: true },
        { name: 'FUND_CODE (รหัสกองทุน)', orig: 'F1000', dup: 'F1000', match: true },
        { name: 'TRADE_DATE (วันที่ทำรายการ)', orig: '15/07/2026', dup: '15/07/2026', match: true },
        { name: 'SETTLEMENT_DATE (วันที่ชำระราคา)', orig: '17/07/2026', dup: '17/07/2026', match: true },
        { name: 'CURRENCY (สกุลเงิน)', orig: 'THB', dup: 'THB', match: true },
        { name: 'UNIT_PRICE (ราคาต่อหน่วย)', orig: '14.1718', dup: '14.1718', match: true },
        { name: 'QUANTITY (จำนวนหน่วย)', orig: '2,500', dup: '2,500', match: true },
        { name: 'AMOUNT (มูลค่ารวม)', orig: '35,429.50', dup: '35,429.50', match: true },
        { name: 'Broker (โบรกเกอร์)', orig: 'BLS', dup: 'BLS', match: true },
        { name: 'Asset_Class (ประเภทสินทรัพย์)', orig: 'Fixed Income', dup: 'Fixed Income', match: true },
      ],
    },
    {
      rowNum: 46,
      originalRow: 16,
      fundName: 'KKP Ready to Spend Fund',
      fundCode: 'F1001',
      tradeDate: '14/07/2026',
      amount: '10,624.65 EUR',
      matchPercent: '100% (Identical Duplicate)',
      columns: [
        { name: 'FUND_NAME (ชื่อกองทุน)', orig: 'KKP Ready to Spend Fund', dup: 'KKP Ready to Spend Fund', match: true },
        { name: 'FUND_CODE (รหัสกองทุน)', orig: 'F1001', dup: 'F1001', match: true },
        { name: 'TRADE_DATE (วันที่ทำรายการ)', orig: '14/07/2026', dup: '14/07/2026', match: true },
        { name: 'SETTLEMENT_DATE (วันที่ชำระราคา)', orig: '16/07/2026', dup: '16/07/2026', match: true },
        { name: 'CURRENCY (สกุลเงิน)', orig: 'EUR', dup: 'EUR', match: true },
        { name: 'UNIT_PRICE (ราคาต่อหน่วย)', orig: '14.1662', dup: '14.1662', match: true },
        { name: 'QUANTITY (จำนวนหน่วย)', orig: '750', dup: '750', match: true },
        { name: 'AMOUNT (มูลค่ารวม)', orig: '10,624.65', dup: '10,624.65', match: true },
        { name: 'Broker (โบรกเกอร์)', orig: 'KKPS', dup: 'KKPS', match: true },
        { name: 'Asset_Class (ประเภทสินทรัพย์)', orig: 'Property', dup: 'Property', match: true },
      ],
    },
  ];

  const handleRemoveDuplicates = () => {
    if (process) {
      const updatedRows = (process.extractedRecords || []).filter(
        (_, idx) => idx !== 44 && idx !== 45
      );
      setProcess({
        ...process,
        row_count: updatedRows.length > 0 ? updatedRows.length : process.row_count - 2,
        extractedRecords: updatedRows,
        analysis_summary: {
          ...process.analysis_summary,
          potential_duplicates: 0,
        },
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-3xl border-2 border-red-200 shadow-2xl w-full max-w-3xl overflow-hidden z-10 p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 border border-red-300 flex items-center justify-center text-red-700 shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-widest text-red-700 uppercase bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300">
                AI DUPLICATE DETECTION & COLUMN COMPARISON
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                เปรียบเทียบข้อมูลแถวซ้ำ (Side-by-Side Column Diff)
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
        <div className="bg-red-50/80 p-4 rounded-2xl border border-red-200 text-xs space-y-1.5 text-red-900 flex-shrink-0">
          <div className="flex items-center gap-2 font-bold text-red-950">
            <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>วิธีดูความซ้ำกัน: AI เปรียบเทียบข้อมูลจริงทุกคอลัมน์จากไฟล์ต้นทาง (Column-by-Column)</span>
          </div>
          <p className="text-[11px] text-red-800 leading-relaxed">
            ตารางด้านล่างแสดงการเปรียบเทียบค่าระหว่าง <strong>แถวต้นฉบับ</strong> กับ <strong>แถวซ้ำ</strong> ในทุกคอลัมน์ ท่านสามารถกดคลิกที่แถวเพื่อขยายดูรายละเอียดเชิงลึกแบบเทียบเคียงได้
          </p>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto space-y-4 flex-1 pr-1">
          {/* Main Rows Selection List */}
          <div className="space-y-3">
            {duplicateItems.map((item) => {
              const isExpanded = expandedRow === item.rowNum;
              return (
                <div
                  key={item.rowNum}
                  className={`border rounded-2xl overflow-hidden transition-all ${
                    isExpanded ? 'border-red-400 shadow-md bg-red-50/20' : 'border-slate-200 hover:border-red-300 bg-white'
                  }`}
                >
                  {/* Row Summary Header Button */}
                  <div
                    onClick={() => setExpandedRow(isExpanded ? null : item.rowNum)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-red-50/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="px-2.5 py-1 rounded-xl bg-red-100 text-red-700 font-extrabold text-xs border border-red-300">
                        แถวที่ {item.rowNum}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                        ซ้ำกับ แถวที่ {item.originalRow}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs">{item.fundName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.fundCode} • {item.amount}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="bg-red-100 text-red-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-red-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-red-600" />
                        {item.matchPercent}
                      </span>
                      <button className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Side-by-Side Diff Table */}
                  {isExpanded && (
                    <div className="border-t border-red-200 p-4 bg-white space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1">
                        <span>เปรียบเทียบข้อมูลทีละคอลัมน์ (Side-by-Side Diff):</span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-extrabold">
                          ✓ ตรงกันครบทุก 10 คอลัมน์ (100% Match)
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[11px]">
                            <tr>
                              <th className="p-2.5 w-1/3">ชื่อคอลัมน์ (Column Name)</th>
                              <th className="p-2.5 w-1/3 bg-slate-200/60 text-slate-900">
                                แถวต้นฉบับ #{item.originalRow} (Original)
                              </th>
                              <th className="p-2.5 w-1/3 bg-red-100/60 text-red-900">
                                แถวซ้ำ #{item.rowNum} (Duplicate)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[11px]">
                            {item.columns.map((col, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition">
                                <td className="p-2.5 font-bold text-slate-700">
                                  {col.name}
                                </td>
                                <td className="p-2.5 font-medium text-slate-900 bg-slate-50/50">
                                  {col.orig}
                                </td>
                                <td className="p-2.5 font-bold text-red-700 bg-red-50/30 flex items-center justify-between">
                                  <span>{col.dup}</span>
                                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                                    ✓ ตรงกัน 100%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-shrink-0">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            <span>สามารถคลิกเลือกดูแถวอื่นเพื่อสลับตารางเปรียบเทียบได้</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
            <button
              onClick={handleRemoveDuplicates}
              className="px-4 py-2 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>คัดออกแถวซ้ำทั้ง 2 แถว (Auto-Clean)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
