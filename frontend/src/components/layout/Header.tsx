'use client';

import React from 'react';
import { Bell, ChevronDown } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-18 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg overflow-hidden border border-purple-200 shadow-xs flex-shrink-0">
          <img src="/kkp-logo.png" alt="KKP Emblem" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#2e1d52] tracking-tight">
            ระบบแปลงข้อมูลด้วยปัญญาประดิษฐ์ (AI Data Transformation)
          </h1>
          <p className="text-xs text-slate-700 font-semibold">
            แปลงไฟล์ข้อมูลต้นทางทุกรูปแบบให้อยู่ในรูปแบบมาตรฐานของ KKP ด้วย AI อัจฉริยะ
          </p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative p-2 text-slate-500 hover:text-purple-900 transition rounded-full hover:bg-slate-100" title="การแจ้งเตือน">
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-5">
          <div className="w-9 h-9 rounded-full bg-[#3c2a68] text-white flex items-center justify-center font-semibold text-sm shadow-sm">
            W
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-extrabold text-slate-900 leading-tight">
              Warisa T.
            </div>
            <div className="text-xs text-purple-900 font-bold">
              Software Engineer
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </header>
  );
};
