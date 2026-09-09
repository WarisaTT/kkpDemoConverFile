'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, FileSpreadsheet, Sparkles, AlertCircle } from 'lucide-react';
import { TargetField, TargetTemplate } from '@/types';
import { useProcessStore } from '@/store/useProcessStore';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTemplate?: TargetTemplate | null;
  isAiSaveMode?: boolean;
  onSaveSuccess?: (savedTemplate: TargetTemplate) => void;
}

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  initialTemplate,
  isAiSaveMode = false,
  onSaveSuccess,
}) => {
  const { addTemplate, updateTemplate } = useProcessStore();
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [version, setVersion] = useState<string>('2.0');
  const [aiTrainingHints, setAiTrainingHints] = useState<string>('');
  const [fields, setFields] = useState<TargetField[]>([]);

  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name || '');
      setDescription(initialTemplate.description || '');
      setVersion(initialTemplate.version || '2.0');
      setAiTrainingHints(initialTemplate.ai_training_hints || '');
      setFields(initialTemplate.fields || []);
    } else {
      setName('');
      setDescription('');
      setVersion('1.0');
      setAiTrainingHints('คำค้นหา / คีย์เวิร์ดประจำไฟล์ (เช่น CUSTODIAN, TRADE, SETTLEMENT, NAV, BANK STATEMENT, BOND, EMAIL) เพื่อช่วยให้ AI เลือก Template นี้อัตโนมัติ');
      setFields([
        { id: 'tf_1', name: 'FUND_CODE', data_type: 'String', required: true, format: '-', description: 'รหัสอ้างอิงกองทุนรวม' },
        { id: 'tf_2', name: 'FUND_NAME', data_type: 'String', required: true, format: '-', description: 'ชื่อกองทุนรวมทางการ' },
        { id: 'tf_3', name: 'TRADE_DATE', data_type: 'Date', required: true, format: 'YYYY-MM-DD', description: 'วันที่ทำรายการซื้อขาย' },
        { id: 'tf_4', name: 'SETTLEMENT_DATE', data_type: 'Date', required: true, format: 'YYYY-MM-DD', description: 'วันที่ชำระราคา' },
        { id: 'tf_5', name: 'CURRENCY', data_type: 'String', required: true, format: 'ISO 4217', description: 'รหัสสกุลเงินมาตรฐานสากล' },
        { id: 'tf_6', name: 'UNIT_PRICE', data_type: 'Decimal', required: true, format: '18,4', description: 'ราคาต่อหน่วย' },
        { id: 'tf_7', name: 'QUANTITY', data_type: 'Decimal', required: true, format: '18,4', description: 'จำนวนหน่วย' },
        { id: 'tf_8', name: 'AMOUNT', data_type: 'Decimal', required: true, format: '18,2', description: 'มูลค่ารวม' },
      ]);
    }
  }, [initialTemplate, isOpen]);

  if (!isOpen) return null;

  const handleAddField = () => {
    const newField: TargetField = {
      id: `tf_${Date.now()}`,
      name: `NEW_FIELD_${fields.length + 1}`,
      data_type: 'String',
      required: false,
      format: '-',
      description: '',
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleFieldChange = (id: string, key: keyof TargetField, value: any) => {
    setFields(
      fields.map((f) => {
        if (f.id === id) {
          return { ...f, [key]: value };
        }
        return f;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tmplPayload: TargetTemplate = {
      id: initialTemplate?.id || `tmpl_${Date.now()}`,
      name: name.trim().toUpperCase(),
      description: description.trim() || 'รูปแบบเป้าหมายมาตรฐาน KKP',
      version: version.trim() || '1.0',
      field_count: fields.length,
      status: 'Active',
      updated_at: new Date().toLocaleDateString('th-TH'),
      ai_training_hints: aiTrainingHints.trim(),
      fields: fields.map((f) => ({
        ...f,
        name: f.name.trim().toUpperCase(),
      })),
    };

    if (initialTemplate && !isAiSaveMode) {
      await updateTemplate(initialTemplate.id, tmplPayload);
    } else {
      await addTemplate(tmplPayload);
    }

    if (onSaveSuccess) {
      onSaveSuccess(tmplPayload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col p-6 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 border border-amber-300/60 rounded-xl flex items-center justify-center text-amber-900 font-bold shadow-sm">
              {isAiSaveMode ? <Sparkles className="w-6 h-6 text-amber-600" /> : <FileSpreadsheet className="w-6 h-6 text-purple-900" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#2e1d52] text-base">
                  {isAiSaveMode
                    ? 'สรุป & ตรวจสอบการเพิ่ม Template มาตรฐานใหม่ (AI Auto-Extracted)'
                    : initialTemplate
                    ? 'แก้ไขรูปแบบเป้าหมายมาตรฐาน (Edit Target Template)'
                    : 'เพิ่มรูปแบบเป้าหมายใหม่ (Create Target Template)'}
                </h3>
                {isAiSaveMode && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                    AI Auto Summary
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAiSaveMode
                  ? 'ตรวจสอบ สรุป และปรับแก้ไขฟิลด์ก่อนกดบันทึกเป็น Template มาตรฐานใหม่ของ KKP'
                  : 'กำหนดโครงสร้างฟิลด์เป้าหมายมาตรฐานสากล KKP สำหรับใช้ในกระบวนการแปลงข้อมูล'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Summary Notification Banner */}
        {isAiSaveMode && (
          <div className="mt-3 bg-gradient-to-r from-amber-50 via-purple-50 to-amber-50 border border-amber-300 text-amber-950 p-3 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 font-medium flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
              <span>
                <strong>สรุปการอ่านข้อมูลจากไฟล์จริง:</strong> AI ได้สแกนคอลัมน์และค่าข้อมูลที่อ่านได้จริงจากไฟล์ปัจจุบัน ({fields.length} คอลัมน์) พร้อมแนะนำชื่อและประเภทข้อมูลที่เหมาะสมในแต่ละฟิลด์ — คุณสามารถปรับแก้ชื่อ กำหนดบังคับ/ทางเลือก หรือลบ/เพิ่มฟิลด์ได้ก่อนกดบันทึกจริง
              </span>
            </div>
            <span className="font-extrabold text-purple-950 bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-lg text-[11px] font-mono">
              รวม {fields.length} ฟิลด์สกัดจากไฟล์จริง
            </span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form id="create-tmpl-form" onSubmit={handleSubmit} className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
          {/* General Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อรูปแบบเป้าหมาย (Template Name) *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น KKP_CUSTODIAN_TRADE_NEW_V1"
                className="w-full text-xs font-mono font-bold p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                คำอธิบาย (Description)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="เช่น รูปแบบมาตรฐานรายงานธุรกรรมหลักทรัพย์ Custodian"
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เวอร์ชัน (Version)
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="2.0"
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
              />
            </div>

            <div className="md:col-span-3 bg-purple-50/80 p-3 rounded-xl border border-purple-200">
              <label className="block text-xs font-extrabold text-purple-950 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-700" />
                <span>ข้อมูลช่วย AI ในการเทรนคัดเลือก Template (AI Classification & Training Hints)</span>
              </label>
              <input
                type="text"
                value={aiTrainingHints}
                onChange={(e) => setAiTrainingHints(e.target.value)}
                placeholder="เช่น คีย์เวิร์ดประจำไฟล์ (CUSTODIAN, TRADE, NAV, STATEMENT, BOND, EMAIL), ชื่อคอลัมน์ หรือเงื่อนไข AI Classification"
                className="w-full text-xs p-2.5 bg-white border border-purple-300 rounded-xl focus:outline-none focus:border-purple-600 font-medium text-purple-950"
              />
              <p className="text-[10px] text-purple-700 mt-1">
                ข้อความส่วนนี้จะถูกใช้เป็น AI Training Prompt เพื่อช่วยให้ระบบเลือกรุ่น Template นี้ให้อัตโนมัติเมื่อมีการอัปโหลดไฟล์ตรงกับคีย์เวิร์ด
              </p>
            </div>
          </div>

          {/* Fields Editor Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>รายละเอียดฟิลด์เป้าหมายในเทมเพลต ({fields.length} ฟิลด์)</span>
                <span className="text-[10px] font-normal text-slate-500 lowercase">(สามารถแก้ไข ลบ หรือเพิ่มได้)</span>
              </h4>
              <button
                type="button"
                onClick={handleAddField}
                className="px-3 py-1.5 text-xs font-extrabold text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-200 rounded-xl flex items-center gap-1.5 transition shadow-xs"
              >
                <Plus className="w-4 h-4 text-purple-700" />
                เพิ่มฟิลด์ (Add Field)
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
              {/* Header row */}
              <div className="bg-slate-100 p-2.5 font-bold text-[10px] text-slate-600 uppercase flex items-center gap-3 border-b border-slate-200">
                <span className="w-6 text-center">#</span>
                <span className="flex-1 min-w-[140px]">ชื่อฟิลด์ (Field Name)</span>
                <span className="w-28">ประเภท (Data Type)</span>
                <span className="w-28">รูปแบบ (Format)</span>
                <span className="w-20 text-center">สถานะบังคับ</span>
                <span className="flex-1 min-w-[150px]">คำอธิบาย</span>
                <span className="w-8 text-center">ลบ</span>
              </div>

              {fields.map((f, idx) => (
                <div key={f.id} className="p-2.5 hover:bg-purple-50/40 flex flex-wrap items-center gap-3 text-xs transition-colors">
                  <span className="font-bold text-slate-400 w-6 text-center text-[11px]">{idx + 1}.</span>

                  {/* Field Name */}
                  <div className="flex-1 min-w-[140px]">
                    <input
                      type="text"
                      value={f.name}
                      onChange={(e) => handleFieldChange(f.id, 'name', e.target.value.toUpperCase())}
                      placeholder="FIELD_NAME"
                      className="w-full p-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-purple-600 uppercase bg-white"
                    />
                  </div>

                  {/* Data Type */}
                  <div className="w-28">
                    <select
                      value={f.data_type}
                      onChange={(e) => handleFieldChange(f.id, 'data_type', e.target.value)}
                      className="w-full p-2 text-xs font-semibold border border-slate-300 rounded-lg focus:outline-none focus:border-purple-600 bg-white"
                    >
                      <option value="String">String</option>
                      <option value="Date">Date</option>
                      <option value="Decimal">Decimal</option>
                      <option value="Integer">Integer</option>
                      <option value="Boolean">Boolean</option>
                    </select>
                  </div>

                  {/* Format */}
                  <div className="w-28">
                    <input
                      type="text"
                      value={f.format || ''}
                      onChange={(e) => handleFieldChange(f.id, 'format', e.target.value)}
                      placeholder="Format (เช่น YYYY-MM-DD)"
                      className="w-full p-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-purple-600 bg-white"
                    />
                  </div>

                  {/* Required Checkbox */}
                  <div className="w-20 flex justify-center">
                    <label className="flex items-center gap-1 text-slate-700 font-bold cursor-pointer select-none text-[11px] bg-slate-100 px-2 py-1 rounded border border-slate-200 hover:bg-purple-100">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={(e) => handleFieldChange(f.id, 'required', e.target.checked)}
                        className="rounded border-slate-300 text-purple-700 focus:ring-purple-500"
                      />
                      <span>บังคับ</span>
                    </label>
                  </div>

                  {/* Description */}
                  <div className="flex-1 min-w-[150px]">
                    <input
                      type="text"
                      value={f.description}
                      onChange={(e) => handleFieldChange(f.id, 'description', e.target.value)}
                      placeholder="คำอธิบายฟิลด์"
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-purple-600 bg-white"
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="w-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveField(f.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                      title="ลบฟิลด์นี้ออกจากเทมเพลต"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* AI Reason Per Field */}
                  {f.ai_reason && (
                    <div className="w-full bg-purple-50/80 border border-purple-200 text-purple-950 px-3 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-2 mt-1 ml-9">
                      <Sparkles className="w-3.5 h-3.5 text-purple-700 flex-shrink-0" />
                      <span><strong>AI Reason:</strong> {f.ai_reason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-shrink-0">
          <span className="text-xs font-medium text-slate-500">
            รวมทั้งหมด <strong className="text-purple-950 font-bold">{fields.length} ฟิลด์</strong> ในเทมเพลตนี้
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              form="create-tmpl-form"
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 px-6 py-2.5 text-xs font-extrabold rounded-xl shadow-lg flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              {isAiSaveMode ? 'บันทึกเป็น Template มาตรฐานใหม่' : initialTemplate ? 'บันทึกการแก้ไข Template' : 'สร้างรูปแบบเป้าหมายใหม่'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
