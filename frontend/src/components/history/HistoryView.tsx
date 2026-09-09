'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  Download,
  Eye,
  Trash2,
  AlertTriangle,
  ShieldX,
  ArrowRight,
  FolderOpen,
  Lock,
  FileJson,
  X,
  Check,
  Edit3,
  Sparkles,
  Clock,
} from 'lucide-react';
import { useProcessStore } from '@/store/useProcessStore';
import { Process } from '@/types';

export const HistoryView: React.FC = () => {
  const {
    processes = [],
    exportExcel,
    setActiveTab,
    setProcess,
    deleteProcess,
    downloadSourceFile,
    updateProcessTitle,
  } = useProcessStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Selected process for full Detail & Download Modal
  const [inspectProcess, setInspectProcess] = useState<Process | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [isSavedTitleModal, setIsSavedTitleModal] = useState(false);

  // Delete modal state
  const [deletingProcess, setDeletingProcess] = useState<Process | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredProcesses = (processes || []).filter((p) =>
    (p.history_title || p.file_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.target_template.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenInspect = (p: Process) => {
    setInspectProcess(p);
    setModalTitle(p.history_title || p.file_name);
    setIsSavedTitleModal(false);
  };

  const handleSaveModalTitle = () => {
    if (inspectProcess && modalTitle.trim()) {
      updateProcessTitle(inspectProcess.id, modalTitle.trim());
      setIsSavedTitleModal(true);
      setTimeout(() => setIsSavedTitleModal(false), 2500);
      setInspectProcess({ ...inspectProcess, history_title: modalTitle.trim() });
    }
  };

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
    if (inspectProcess?.id === deletingProcess.id) {
      setInspectProcess(null);
    }
  };

  const handleDownloadProcessJson = (proc: Process) => {
    const rows = proc.extractedRecords || [];
    const jsonStr = JSON.stringify(rows, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KKP_STANDARD_${(proc.history_title || proc.file_name).replace(/\.[^/.]+$/, '')}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStepBadge = (step?: number | string, status?: string) => {
    const isCompleted = status === 'Completed' || status === 'Sealed' || Number(step) >= 4;
    if (isCompleted) {
      return (
        <span className="px-3 py-1 text-[11px] font-extrabold rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
          <span>Step 4: เสร็จสมบูรณ์</span>
        </span>
      );
    }
    const numStep = Number(step) || (status === 'Mapped' ? 2 : status === 'Validated' ? 3 : 1);
    if (numStep === 1) {
      return (
        <span className="px-3 py-1 text-[11px] font-extrabold rounded-full bg-blue-100 text-blue-900 border border-blue-300 inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
          <span>Step 1: อัปโหลด & วิเคราะห์</span>
        </span>
      );
    }
    if (numStep === 2) {
      return (
        <span className="px-3 py-1 text-[11px] font-extrabold rounded-full bg-purple-100 text-purple-900 border border-purple-300 inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs">
          <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse shrink-0" />
          <span>Step 2: จับคู่ฟิลด์ AI</span>
        </span>
      );
    }
    if (numStep === 3) {
      return (
        <span className="px-3 py-1 text-[11px] font-extrabold rounded-full bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs">
          <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
          <span>Step 3: ตรวจสอบความถูกต้อง</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-[11px] font-extrabold rounded-full bg-blue-100 text-blue-900 border border-blue-300 inline-flex items-center gap-1.5 whitespace-nowrap shadow-xs">
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
        <span>Step 1: อัปโหลด & วิเคราะห์</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#2e1d52]">ประวัติการประมวลผล (Processing History)</h2>
          <p className="text-xs text-slate-700 font-semibold">
            รายการแปลงข้อมูลย้อนหลัง — สามารถเปิดดูรายละเอียด แก้ไขชื่อบันทึก และดาวน์โหลดทั้งไฟล์ต้นทางและไฟล์ผลลัพธ์
          </p>
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อไฟล์, History หรือ Template..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 font-medium text-slate-800 shadow-xs"
          />
        </div>
      </div>

      <div className="banking-card p-5 border-slate-300 shadow-sm">
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
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[1150px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-800 font-extrabold uppercase text-[11px] border-b border-slate-300 tracking-wider">
                  <th className="py-3.5 px-4 min-w-[110px] whitespace-nowrap">รหัสประมวลผล</th>
                  <th className="py-3.5 px-4 min-w-[280px] whitespace-nowrap">ชื่อไฟล์ / ชื่อ History</th>
                  <th className="py-3.5 px-4 min-w-[200px] whitespace-nowrap">รูปแบบเป้าหมาย</th>
                  <th className="py-3.5 px-4 min-w-[120px] whitespace-nowrap">จำนวนรายการ</th>
                  <th className="py-3.5 px-4 min-w-[120px] whitespace-nowrap">ความแม่นยำ AI</th>
                  <th className="py-3.5 px-4 min-w-[180px] whitespace-nowrap">ขั้นตอนปัจจุบัน</th>
                  <th className="py-3.5 px-4 min-w-[160px] whitespace-nowrap">เวลาที่สร้าง</th>
                  <th className="py-3.5 px-4 min-w-[220px] text-right whitespace-nowrap">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredProcesses.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenInspect(item)}
                    className="hover:bg-purple-50/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap min-w-[110px]">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 text-[11px] border border-slate-200">
                        {item.id.substring(0, 8)}...
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 min-w-[280px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-bold text-slate-900 truncate max-w-[260px]" title={item.history_title || item.file_name}>
                          {item.history_title || item.file_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#2e1d52] whitespace-nowrap min-w-[200px]">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200 text-purple-950 font-bold text-xs">
                        {item.target_template}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-extrabold whitespace-nowrap min-w-[120px]">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-sm font-black text-slate-900">{item.row_count.toLocaleString()}</span>
                        <span className="text-slate-500 font-medium text-xs">แถว</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap min-w-[120px]">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
                        <Sparkles className="w-3 h-3 text-emerald-700" />
                        {Math.round((item.initial_overall_confidence ?? item.overall_confidence ?? 0.91) * 100)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap min-w-[180px]">
                      {getStepBadge(item.current_step, item.status)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold whitespace-nowrap min-w-[160px]">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(item.created_at).toLocaleString('th-TH', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })} น.
                        </span>
                      </div>
                    </td>
                    <td
                      className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(() => {
                        const isDone = (item.current_step || 1) >= 4 || item.status === 'Completed';
                        if (isDone) {
                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenInspect(item)}
                                className="px-2.5 py-1.5 rounded-lg transition font-extrabold text-xs inline-flex items-center gap-1 text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 cursor-pointer shadow-xs"
                                title="ดูรายละเอียด, แก้ไขชื่อ และดาวน์โหลดไฟล์"
                              >
                                <Eye className="w-3.5 h-3.5 text-purple-800" />
                                <span>รายละเอียด & โหลดไฟล์</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => exportExcel(item)}
                                className="px-2.5 py-1.5 rounded-lg transition font-extrabold text-xs inline-flex items-center gap-1 text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 cursor-pointer shadow-xs"
                                title="ดาวน์โหลดไฟล์ผลลัพธ์ Excel (.xlsx)"
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                                <span>.xlsx</span>
                              </button>
                            </>
                          );
                        }

                        // For items not yet completed: Allow continuing and viewing in Process page
                        return (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSelectProcess(item)}
                              className="px-2.5 py-1.5 rounded-lg transition font-extrabold text-xs inline-flex items-center gap-1 text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 cursor-pointer shadow-xs"
                              title="เปิดดูและดำเนินการแปลงข้อมูลต่อในหน้า Process"
                            >
                              <ArrowRight className="w-3.5 h-3.5 text-purple-800 stroke-[2.5]" />
                              <span>ดำเนินการต่อ</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenInspect(item)}
                              className="px-2 py-1.5 rounded-lg transition font-extrabold text-xs inline-flex items-center gap-1 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 cursor-pointer shadow-xs"
                              title="ดูรายละเอียดข้อมูลไฟล์"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>รายละเอียด</span>
                            </button>
                          </>
                        );
                      })()}

                      <button
                        type="button"
                        onClick={() => setDeletingProcess(item)}
                        className="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-800 rounded-lg transition border border-red-200 cursor-pointer"
                        title="ลบประวัติการแปลงข้อมูลนี้"
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

      {/* History Item Full Details & Downloads Modal */}
      {inspectProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setInspectProcess(null)} />

          <div className="relative bg-white rounded-3xl border-2 border-purple-200 shadow-2xl w-full max-w-2xl overflow-hidden z-10 p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>รายละเอียดรายการประวัติ</span>
                    {getStepBadge(inspectProcess.current_step, inspectProcess.status)}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold font-mono">
                    ID: {inspectProcess.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectProcess(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-slate-50 p-4 rounded-2xl border border-purple-200/80 space-y-2">
              <label className="block text-xs font-black text-[#2e1d52] uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-purple-700" />
                บันทึกชื่อไฟล์ / ชื่อ History
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveModalTitle()}
                  placeholder="ระบุชื่อเรียกใน History..."
                  className="flex-1 px-3.5 py-2 text-xs font-bold text-slate-900 bg-white border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <button
                  type="button"
                  onClick={handleSaveModalTitle}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer ${
                    isSavedTitleModal
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#2e1d52] hover:bg-[#3d276d] text-white'
                  }`}
                >
                  {isSavedTitleModal ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>บันทึกแล้ว</span>
                    </>
                  ) : (
                    <span>บันทึกชื่อ</span>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold">
                ชื่อเดิม: <span className="font-mono text-slate-700">{inspectProcess.file_name}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-500 block">เทมเพลตเป้าหมาย</span>
                <span className="text-xs font-black text-[#2e1d52] truncate block mt-0.5" title={inspectProcess.target_template}>
                  {inspectProcess.target_template}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-500 block">จำนวนแถว</span>
                <span className="text-xs font-black text-purple-950 block mt-0.5">
                  {inspectProcess.row_count.toLocaleString()} รายการ
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-500 block">ความเชื่อมั่น AI</span>
                <span className="text-xs font-black text-emerald-700 block mt-0.5">
                  {Math.round((inspectProcess.initial_overall_confidence ?? inspectProcess.overall_confidence ?? 0.91) * 100)}%
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-500 block">เวลาที่บันทึก</span>
                <span className="text-xs font-black text-slate-700 block mt-0.5">
                  {new Date(inspectProcess.created_at).toLocaleDateString('th-TH')}
                </span>
              </div>
            </div>

            {(() => {
              const isCompleted = inspectProcess.status === 'Completed' || inspectProcess.status === 'Sealed' || Number(inspectProcess.current_step) >= 4;
              const currentStepNum = Number(inspectProcess.current_step) || 1;

              if (isCompleted) {
                return (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                      ดาวน์โหลดไฟล์สำหรับรายการนี้ (Downloads)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => downloadSourceFile(inspectProcess)}
                        className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl border border-slate-700 transition flex flex-col items-center text-center gap-1.5 shadow-sm cursor-pointer group"
                        title="ดาวน์โหลดไฟล์ต้นทางดั้งเดิมที่อัปโหลด"
                      >
                        <Download className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black">ไฟล์ต้นทาง (Source)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => exportExcel(inspectProcess)}
                        className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl border border-emerald-500 transition flex flex-col items-center text-center gap-1.5 shadow-md cursor-pointer group"
                        title="ดาวน์โหลดไฟล์ผลลัพธ์มาตรฐาน Excel (.xlsx)"
                      >
                        <Download className="w-5 h-5 text-white group-hover:scale-110 transition-transform stroke-[2.5]" />
                        <span className="text-xs font-black">Excel (.xlsx)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadProcessJson(inspectProcess)}
                        className="p-3 bg-purple-900 hover:bg-purple-800 text-white rounded-xl border border-purple-600 transition flex flex-col items-center text-center gap-1.5 shadow-md cursor-pointer group"
                        title="ดาวน์โหลดไฟล์ข้อมูล .json"
                      >
                        <FileJson className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black">JSON (.json)</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-2.5 pt-2 border-t border-slate-200">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    ดาวน์โหลดไฟล์ (Downloads)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => downloadSourceFile(inspectProcess)}
                      className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl border border-slate-700 transition flex flex-col items-center text-center gap-1.5 shadow-sm cursor-pointer group"
                      title="ดาวน์โหลดไฟล์ต้นทางดั้งเดิมที่อัปโหลด"
                    >
                      <Download className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-black">ไฟล์ต้นทาง (Source)</span>
                    </button>

                    <div className="sm:col-span-2 p-3 bg-amber-50/90 border border-amber-300 rounded-xl flex items-center gap-3 text-amber-950">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4 text-amber-700" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-black text-amber-950">ยังไม่มีไฟล์ผลลัพธ์ปลายทางให้ดาวน์โหลด</div>
                        <div className="text-[11px] text-amber-800 font-medium leading-tight mt-0.5">
                          รายการนี้ยังอยู่ในขั้นตอน (Step {currentStepNum}) ต้องดำเนินการจนถึง <strong>Step 4: เสร็จสมบูรณ์</strong> จึงจะสามารถดาวน์โหลดไฟล์ผลลัพธ์ปลายทาง (.xlsx, .json) ได้
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              {((inspectProcess.current_step || 1) < 4 && inspectProcess.status !== 'Completed') ? (
                <button
                  type="button"
                  onClick={() => {
                    handleSelectProcess(inspectProcess);
                    setInspectProcess(null);
                  }}
                  className="text-xs font-extrabold text-[#2e1d52] hover:text-purple-700 flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 text-purple-700 stroke-[2.5]" />
                  <span>เปิดดูขั้นตอนและดำเนินการแปลงข้อมูลต่อ (Step {inspectProcess.current_step || 2}) →</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>กระบวนการเสร็จสมบูรณ์แล้ว (Read-Only)</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => setInspectProcess(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

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
                คุณต้องการลบข้อมูลการวิเคราะห์ของไฟล์ <span className="font-extrabold text-slate-900">"{deletingProcess.history_title || deletingProcess.file_name}"</span> ใช่หรือไม่?
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
