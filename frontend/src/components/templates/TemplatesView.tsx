'use client';

import React, { useState } from 'react';
import { Plus, FileSpreadsheet, Eye, Edit, Trash2, X, Sparkles, Layers } from 'lucide-react';
import { MultipleSourceFormatsDemo } from '@/components/process/MultipleSourceFormatsDemo';
import { useProcessStore } from '@/store/useProcessStore';
import { CreateTemplateModal } from './CreateTemplateModal';
import { TargetTemplate } from '@/types';

export const TemplatesView: React.FC = () => {
  const { templates, deleteTemplate } = useProcessStore();
  const [selectedTmpl, setSelectedTmpl] = useState<TargetTemplate | null>(null);
  const [editingTmpl, setEditingTmpl] = useState<TargetTemplate | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [deletingTmpl, setDeletingTmpl] = useState<TargetTemplate | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'templates' | 'source-demo'>('templates');

  const handleConfirmDelete = async () => {
    if (deletingTmpl) {
      await deleteTemplate(deletingTmpl.id || deletingTmpl.name);
      setDeletingTmpl(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#2e1d52]">ระบบจัดการ Template มาตรฐาน & ตัวอย่างการรองรับไฟล์</h2>
          <p className="text-xs text-slate-500">
            ข้อกำหนดโครงสร้างฟิลด์เป้าหมายมาตรฐานสากลสำหรับระบบการเงิน KKP และตัวอย่างการแปลงไฟล์ต้นทางหลายรูปแบบด้วย AI
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTmpl(null);
            setIsCreateOpen(true);
          }}
          className="purple-gradient-btn px-5 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>เพิ่ม Template มาตรฐานใหม่</span>
        </button>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-purple-200 pb-3">
        <button
          onClick={() => setActiveSubTab('templates')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition flex items-center gap-2 ${
            activeSubTab === 'templates'
              ? 'bg-[#2e1d52] text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-400" />
          <span>โครงสร้างเทมเพลตมาตรฐาน ({templates.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('source-demo')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition flex items-center gap-2 ${
            activeSubTab === 'source-demo'
              ? 'bg-[#2e1d52] text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>ตัวอย่างการรองรับไฟล์ต้นทางหลายรูปแบบ (Multiple Source Demo)</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeSubTab === 'source-demo' ? (
        <MultipleSourceFormatsDemo />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tmpl) => (
          <div key={tmpl.id || tmpl.name} className="banking-card p-6 flex flex-col justify-between border-2 border-purple-200 hover:border-purple-400 transition bg-white shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                  สถานะใช้งาน ({tmpl.status || 'Active'})
                </span>
                <span className="text-xs font-bold text-slate-400">
                  เวอร์ชัน {tmpl.version || '1.0'}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-900 font-bold flex-shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-[#2e1d52] text-sm truncate" title={tmpl.name}>
                    {tmpl.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{tmpl.description}</p>
                </div>
              </div>

              {tmpl.ai_training_hints && (
                <div className="bg-purple-50 border border-purple-200 text-purple-900 p-2 rounded-lg text-[10px] font-medium flex items-start gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-700 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    <strong className="font-bold text-purple-950">AI Hints:</strong> {tmpl.ai_training_hints}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs my-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">จำนวนฟิลด์ทั้งหมด</div>
                  <div className="font-extrabold text-slate-800">{tmpl.fields?.length || tmpl.field_count || 0} ฟิลด์</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">อัปเดตล่าสุด</div>
                  <div className="font-semibold text-slate-700">{tmpl.updated_at ? tmpl.updated_at.split('T')[0] : 'วันนี้'}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedTmpl(tmpl)}
                className="purple-gradient-btn flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                ดู Schema
              </button>

              <button
                onClick={() => {
                  setEditingTmpl(tmpl);
                  setIsCreateOpen(true);
                }}
                className="p-2 border border-slate-200 hover:bg-purple-50 text-purple-700 rounded-xl transition"
                title="แก้ไข Template นี้"
              >
                <Edit className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDeletingTmpl(tmpl)}
                className="p-2 border border-slate-200 hover:bg-red-50 text-red-600 rounded-xl transition"
                title="ลบ Template นี้"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      )}

      {/* Create / Edit Target Template Modal */}
      <CreateTemplateModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingTmpl(null);
        }}
        initialTemplate={editingTmpl}
      />

      {/* Delete Confirmation Modal */}
      {deletingTmpl && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <Trash2 className="w-6 h-6" />
              <h3 className="font-extrabold text-[#2e1d52] text-base">
                ยืนยันการลบ Template มาตรฐาน
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-6">
              คุณต้องการลบรูปแบบเป้าหมายมาตรฐาน <strong className="text-slate-900 font-mono">{deletingTmpl.name}</strong> ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingTmpl(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-xs font-extrabold rounded-xl transition shadow-md"
              >
                ยืนยันลบ Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Schema Modal */}
      {selectedTmpl && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-[#2e1d52] text-base">
                  โครงสร้างฟิลด์มาตรฐาน: {selectedTmpl.name}
                </h3>
                <p className="text-xs text-slate-500">
                  เวอร์ชัน {selectedTmpl.version} • รวมทั้งหมด {selectedTmpl.fields?.length || 0} ฟิลด์เป้าหมาย
                </p>
              </div>
              <button
                onClick={() => setSelectedTmpl(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <th className="py-2.5 px-4">ชื่อฟิลด์ (Field Name)</th>
                    <th className="py-2.5 px-4">ประเภทข้อมูล</th>
                    <th className="py-2.5 px-4">สถานะบังคับ</th>
                    <th className="py-2.5 px-4">รูปแบบ (Format)</th>
                    <th className="py-2.5 px-4">คำอธิบาย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedTmpl.fields || []).map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-[#2e1d52] font-mono">{f.name}</td>
                      <td className="py-2.5 px-4 text-slate-700 font-mono font-semibold">{f.data_type}</td>
                      <td className="py-2.5 px-4">
                        {f.required ? (
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-900 px-2 py-0.5 rounded">
                            บังคับ (Required)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">ทางเลือก (Optional)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-amber-700">{f.format || '-'}</td>
                      <td className="py-2.5 px-4 text-slate-600 font-medium">{f.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedTmpl(null)}
                className="purple-gradient-btn px-5 py-2 text-xs font-bold rounded-xl"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
