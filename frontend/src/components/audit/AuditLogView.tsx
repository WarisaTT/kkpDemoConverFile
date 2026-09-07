'use client';

import React from 'react';
import { ShieldCheck, Search, FileText } from 'lucide-react';
import { useProcessStore } from '@/store/useProcessStore';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useProcessStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-700" />
            <h2 className="text-xl font-bold text-[#2e1d52]">บันทึกการตรวจสอบความปลอดภัย (Audit Log)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกการทำงานระดับสถาบันการเงินที่ไม่สามารถแก้ไขได้ บันทึกการยอมรับ AI การแก้ไขฟิลด์ และการสร้างไฟล์ผลลัพธ์
          </p>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาประวัติการตรวจสอบ..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
          />
        </div>
      </div>

      <div className="banking-card p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <th className="py-3 px-4">รหัสบันทึก</th>
                <th className="py-3 px-4">เวลา</th>
                <th className="py-3 px-4">ผู้ใช้งาน</th>
                <th className="py-3 px-4">การกระทำ (Action)</th>
                <th className="py-3 px-4">ชื่อไฟล์</th>
                <th className="py-3 px-4">รายละเอียดการจับคู่</th>
                <th className="py-3 px-4">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-500">{log.id}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{log.timestamp}</td>
                  <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#3c2a68] text-white text-[10px] font-bold flex items-center justify-center">
                      {log.user.charAt(0)}
                    </div>
                    {log.user}
                  </td>
                  <td className="py-3 px-4 font-semibold text-purple-900">{log.action}</td>
                  <td className="py-3 px-4 text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    {log.file}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">{log.mapping}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        log.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'Modified'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
