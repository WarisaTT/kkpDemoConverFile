'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Search, Download, Eye, Trash2, AlertTriangle, ShieldX, ArrowRight, FolderOpen, Lock } from 'lucide-react';
import { useProcessStore } from '@/store/useProcessStore';
import { Process } from '@/types';

export const HistoryView: React.FC = () => {
  const { processes = [], exportExcel, setActiveTab, setProcess, deleteProcess } = useProcessStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Delete modal state
  const [deletingProcess, setDeletingProcess] = useState<Process | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredProcesses = (processes || []).filter((p) =>
    p.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.target_template.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectProcess = (p: Process) => {
    setProcess(p);
    setActiveTab('new-process');
  };

  const ConfirmDeleteProcess = async () => {
    if (!deletingProcess) return;
    setIsDeleting(true);
    await deleteProcess(deletingProcess.id);
    setIsDeleting(false);
    setDeletingProcess(null);
  };

  const getStepBadge = (step?: number, status?: string) => {
    const currentStep = step || (status === 'Completed' ? 4 : 1);
    switch (currentStep) {
      case 1:
        return (
          <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1 w-max">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            Step 1: อัปโหลดและวิเคราะห์
          </span>
        );
      case 2:
        return (
          <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1 w-max">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
            Step 2: จับคู่ฟิลด์ AI
          </span>
        );
      case 3:
        return (
          <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 w-max">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Step 3: ตรวจสอบความถูกต้อง
          </span>
        );
      case 4:
      default:
        return (
          <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 w-max">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Step 4: เสร็จสมบูรณ์
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#2e1d52]">ประวัติการประมวลผล (Processing History)</h2>
          <p className="text-xs text-slate-700 font-semibold">
            บันทึกประวัติไฟล์ที่อัปโหลดและวิเคราะห์ย้อนหลัง พร้อมติดตาม Step การทำงานในปัจจุบัน
          </p>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อไฟล์ หรือ Template..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 font-medium text-slate-800"
          />
        </div>
      </div>

      <div className="banking-card p-5 border-slate-300">
        {filteredProcesses.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-center text-purple-700 mx-auto mb-4 shadow-sm">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#2e1d52] mb-1">
              ยังไม่มีประวัติการประมวลผล (No History Records)
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mb-6 leading-relaxed font-semibold">
              เมื่อคุณทำการอัปโหลดไฟล์ Excel หรือ CSV รายงาน ข้อมูลจะถูกบันทึกเข้าประวัติและระบุ Step การทำงานทันที
            </p>
            <button
              onClick={() => setActiveTab('new-process')}
              className="purple-gradient-btn px-5 py-2.5 rounded-xl text-xs font-bold shadow-md inline-flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              อัปโหลดไฟล์และเริ่มต้นแปลงข้อมูล
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[11px] border-b border-slate-300">
                  <th className="py-3.5 px-4">รหัสประมวลผล</th>
                  <th className="py-3.5 px-4">ไฟล์ต้นทาง</th>
                  <th className="py-3.5 px-4">รูปแบบเป้าหมาย</th>
                  <th className="py-3.5 px-4">จำนวนรายการ</th>
                  <th className="py-3.5 px-4">ความแม่นยำ AI</th>
                  <th className="py-3.5 px-4">ขั้นตอนปัจจุบัน (Current Step)</th>
                  <th className="py-3.5 px-4">เวลาที่สร้าง</th>
                  <th className="py-3.5 px-4 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProcesses.map((item) => (
                  <tr key={item.id} className="hover:bg-purple-50/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {item.id.substring(0, 8)}...
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="truncate max-w-[180px]" title={item.file_name}>
                        {item.file_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#2e1d52]">{item.target_template}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-bold">
                      {item.row_count.toLocaleString()} แถว
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                      {(item.overall_confidence * 100).toFixed(0)}%
                    </td>
                    <td className="py-3.5 px-4">
                      {getStepBadge(item.current_step, item.status)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">
                      {new Date(item.created_at).toLocaleString('th-TH', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {(() => {
                        const isDone = (item.current_step || 1) >= 4 || item.status === 'Completed';
                        if (isDone) {
                          return (
                            <>
                              <span
                                className="px-2.5 py-1.5 bg-slate-100 text-slate-500 font-bold text-[11px] rounded-lg border border-slate-200 inline-flex items-center gap-1 cursor-not-allowed select-none"
                                title="กระบวนการเสร็จสมบูรณ์แล้ว ไม่อนุญาตให้เปิดดูหรือแก้ไขรายละเอียดเดิม"
                              >
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>ล็อครายละเอียด</span>
                              </span>

                              <button
                                onClick={() => exportExcel(item)}
                                className="px-3 py-1.5 rounded-lg transition font-extrabold text-xs inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 cursor-pointer shadow-xs"
                                title="ดาวน์โหลดไฟล์ผลลัพธ์ Excel ซ้ำได้ตลอดเวลา"
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                                <span>ดาวน์โหลดซ้ำ (.xlsx)</span>
                              </button>
                            </>
                          );
                        }

                        return (
                          <button
                            onClick={() => handleSelectProcess(item)}
                            className="px-2.5 py-1.5 text-purple-800 hover:bg-purple-100 rounded-lg transition font-extrabold text-xs inline-flex items-center gap-1 border border-purple-200"
                            title="ดำเนินการแปลงข้อมูลต่อ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ดำเนินการต่อ</span>
                          </button>
                        );
                      })()}

                      <button
                        onClick={() => setDeletingProcess(item)}
                        className="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-800 rounded-lg transition border border-red-200"
                        title="ลบการวิเคราะห์และไม่นำไปพัฒนา AI"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Process Confirmation Modal Dialog */}
      {deletingProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setDeletingProcess(null)} />

          <div className="relative bg-white rounded-3xl border-2 border-red-200 shadow-2xl w-full max-w-md overflow-hidden z-10 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shadow-inner">
              <ShieldX className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 mb-1">
                ยืนยันการลบผลการวิเคราะห์ของไฟล์?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                คุณต้องการลบข้อมูลการวิเคราะห์ของไฟล์ <span className="font-extrabold text-slate-900">"{deletingProcess.file_name}"</span> ใช่หรือไม่?
              </p>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-950 font-bold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>
                เมื่อลบแล้ว ข้อมูลโครงสร้างนี้จะถูกยกเลิกการบันทึกในระบบ และ **AI จะไม่นำไปใช้เป็นข้อมูลสำหรับพัฒนาการจับคู่ในอนาคตอีกต่อไป**
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
              <button
                onClick={() => setDeletingProcess(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition"
              >
                ยกเลิก
              </button>

              <button
                onClick={ConfirmDeleteProcess}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 shadow-md transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'กำลังลบข้อมูล...' : 'ลบข้อมูลและยกเลิกการพัฒนา AI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
