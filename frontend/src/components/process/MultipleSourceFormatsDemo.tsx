'use client';

import React from 'react';
import { FileSpreadsheet, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export const MultipleSourceFormatsDemo: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="banking-card p-6 bg-white">
        <div className="max-w-3xl mb-6">
          <h2 className="text-xl font-bold text-[#2e1d52] tracking-tight">
            การรองรับไฟล์ต้นทางหลายรูปแบบ (Multiple Source Formats)
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            ไฟล์ต้นทางจากแต่ละระบบ ผู้ดูแลทรัพย์สิน (Custodian) และผู้จัดการกองทุน อาจมีชื่อคอลัมน์และรูปแบบวันที่ไม่เหมือนกัน
            ระบบ AI Semantic Engine จะช่วยวิเคราะห์ความหมายและรวมข้อมูลให้อยู่ในรูปแบบมาตรฐานเดียวกันของ KKP
          </p>
        </div>

        {/* Visualization Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
          {/* Left Column: 3 Source File Cards */}
          <div className="md:col-span-3 space-y-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">ผู้ดูแลทรัพย์สิน A (Custodian A)</h4>
                  <p className="text-[11px] text-slate-500">Excel (.xlsx) • 27 ฟิลด์</p>
                  <p className="text-[10px] text-slate-400 font-mono">Fund_Name, Trade Date, CCY, NAV</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                AI จับคู่ 96%
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">ผู้ดูแลทรัพย์สิน B (Custodian B)</h4>
                  <p className="text-[11px] text-slate-500">Excel (.xls) • 31 ฟิลด์</p>
                  <p className="text-[10px] text-slate-400 font-mono">Fund, Transaction_Date, Currency, Net Asset Value</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                AI จับคู่ 92%
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">ผู้จัดการกองทุน C (Fund Manager C)</h4>
                  <p className="text-[11px] text-slate-500">CSV (.csv) • 18 ฟิลด์</p>
                  <p className="text-[10px] text-slate-400 font-mono">Fund Name, Date, Currency Code, Unit Price</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                AI จับคู่ 89%
              </span>
            </div>
          </div>

          {/* Middle Column: AI Semantic Engine Arrow */}
          <div className="md:col-span-1 flex flex-col items-center justify-center py-4">
            <div className="w-12 h-12 rounded-full bg-[#3c2a68] text-white flex items-center justify-center shadow-lg animate-pulse mb-1">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold text-[#2e1d52] text-center uppercase tracking-wider">
              AI Semantic Mapping
            </span>
            <ArrowRight className="w-6 h-6 text-purple-700 hidden md:block mt-1" />
          </div>

          {/* Right Column: Standardized KKP Target Output */}
          <div className="md:col-span-3">
            <div className="p-5 rounded-2xl border-2 border-purple-300 bg-gradient-to-b from-purple-50/50 to-white shadow-md relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-700" />
                  <h3 className="font-bold text-sm text-[#2e1d52]">
                    รูปแบบเป้าหมายมาตรฐาน KKP
                  </h3>
                </div>
                <span className="text-[10px] font-bold bg-purple-200 text-purple-900 px-2 py-0.5 rounded border border-purple-300">
                  Active V2.0
                </span>
              </div>

              <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs font-mono space-y-1 text-slate-700 shadow-inner">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-bold text-purple-900">FUND_CODE</span>
                  <span className="text-slate-400">String (ฟิลด์บังคับ)</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-bold text-purple-900">FUND_NAME</span>
                  <span className="text-slate-400">String (ฟิลด์บังคับ)</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-bold text-purple-900">TRADE_DATE</span>
                  <span className="text-slate-400">YYYY-MM-DD</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-bold text-purple-900">CURRENCY</span>
                  <span className="text-slate-400">ISO 4217</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-bold text-purple-900">UNIT_PRICE</span>
                  <span className="text-slate-400">Decimal(18,4)</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-bold text-purple-900">QUANTITY</span>
                  <span className="text-slate-400">Decimal(18,4)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-purple-900">AMOUNT</span>
                  <span className="text-slate-400">Decimal(18,2)</span>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-purple-900 font-semibold text-center bg-purple-100/70 p-2 rounded-lg border border-purple-200">
                “ไฟล์ต้นทางต่างกันได้ แต่ไฟล์ผลลัพธ์จะต้องเป็นรูปแบบมาตรฐานเดียวกันเสมอ”
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
