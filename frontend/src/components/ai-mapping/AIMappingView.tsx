'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Bot,
  BrainCircuit,
  Filter,
  Check,
  RefreshCw,
  X,
  Save,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useProcessStore } from '@/store/useProcessStore';
import { AILearnedRule } from '@/types';

export const AIMappingView: React.FC = () => {
  const { aiLearnedRules = [], addLearnedRule, toggleLearnedRule, deleteLearnedRule } = useProcessStore();
  const safeRules = Array.isArray(aiLearnedRules) ? aiLearnedRules : [];

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New rule form state
  const [pattern, setPattern] = useState<string>('');
  const [sourceField, setSourceField] = useState<string>('');
  const [targetField, setTargetField] = useState<string>('');
  const [reasoning, setReasoning] = useState<string>('');

  const filteredRules = safeRules.filter((r) =>
    r.column_set_pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.source_field.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.target_field.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.user_reasoning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = safeRules.filter((r) => r.is_active).length;

  const handleAddRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceField.trim() || !targetField.trim()) return;

    const newRule: AILearnedRule = {
      id: `rule_${Date.now()}`,
      column_set_pattern: pattern.trim() || 'Custom KKP Source Format',
      source_field: sourceField.trim(),
      target_field: targetField.trim().toUpperCase(),
      user_reasoning: reasoning.trim() || 'ผู้ใช้กำหนดกฎความจำ AI โดยตรง',
      learned_at: new Date().toLocaleDateString('th-TH'),
      is_active: true,
      remember_forever: true,
    };

    addLearnedRule(newRule);
    setIsAddModalOpen(false);
    setPattern('');
    setSourceField('');
    setTargetField('');
    setReasoning('');
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#2e1d52] via-[#3c2a68] to-[#1e1336] text-white p-6 rounded-3xl shadow-xl border border-purple-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-amber-400 text-slate-950 rounded-2xl font-extrabold shadow-lg flex items-center justify-center">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white tracking-wide">
                ระบบการเรียนรู้การจับคู่ฟิลด์ด้วย AI (AI Mapping Memory & Training Logs)
              </h2>
            </div>
            <p className="text-purple-200/90 text-xs mt-1">
              บันทึกและจัดการหน่วยความจำการจับคู่ฟิลด์ที่ AI จดจำจากการปรับแก้ไขของผู้ใช้ เพื่อความแม่นยำในการแปลงไฟล์ครั้งถัดไป
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 text-xs flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มกฎหน่วยความจำ AI ใหม่</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="banking-card p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              กฎที่บันทึกไว้ทั้งหมด
            </div>
            <div className="text-2xl font-black text-[#2e1d52] mt-0.5">
              {safeRules.length} กฎ
            </div>
          </div>
          <div className="w-10 h-10 bg-purple-100 text-purple-900 rounded-xl flex items-center justify-center font-bold">
            <BrainCircuit className="w-5 h-5" />
          </div>
        </div>

        <div className="banking-card p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              ความแม่นยำ AI ล่าสุด
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">
              98.4%
            </div>
          </div>
          <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="banking-card p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              อัตราการแก้ไขโดยผู้ใช้
            </div>
            <div className="text-2xl font-black text-amber-600 mt-0.5">
              1.6%
            </div>
          </div>
          <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
        </div>

        <div className="banking-card p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              ใช้งานอยู่ (Active)
            </div>
            <div className="text-2xl font-black text-purple-950 mt-0.5">
              {activeCount}/{safeRules.length} กฎ
            </div>
          </div>
          <div className="w-10 h-10 bg-purple-100 text-purple-900 rounded-xl flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="banking-card overflow-hidden">
        {/* Controls Header */}
        <div className="bg-[#2e1d52] text-white p-4 border-b border-purple-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm text-white">
              ตารางหน่วยความจำและการเทรน AI (AI Learned Rules Table)
            </h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-purple-300" />
            <input
              type="text"
              placeholder="ค้นหากฎ, คอลัมน์ หรือเหตุผล..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-purple-950 text-white placeholder-purple-300/70 border border-purple-700 rounded-xl focus:outline-none focus:border-amber-400 font-medium"
            />
          </div>
        </div>

        {/* Rules Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px]">
                <th className="py-3 px-4 w-10 text-center">#</th>
                <th className="py-3 px-4 min-w-[160px]">ชุดโครงสร้างคอลัมน์ (Column Set Pattern)</th>
                <th className="py-3 px-4 min-w-[220px]">ผลการจับคู่ (Source → Target)</th>
                <th className="py-3 px-4 min-w-[240px]">เหตุผลการเทรน AI (User Reasoning & Feedback)</th>
                <th className="py-3 px-4 w-28">วันที่จดจำ</th>
                <th className="py-3 px-4 w-24 text-center">สถานะ</th>
                <th className="py-3 px-4 w-16 text-center">จัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredRules.length > 0 ? (
                filteredRules.map((rule, idx) => (
                  <tr key={rule.id + "_" + idx} className="hover:bg-purple-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">{idx + 1}.</td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{rule.column_set_pattern}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Memory ID: {rule.id}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {rule.source_field}
                        </span>
                        <span className="text-purple-600 font-bold">→</span>
                        <span className="font-mono font-extrabold text-[#2e1d52] bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                          {rule.target_field}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-200">
                        {rule.user_reasoning}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold">
                      {rule.learned_at}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleLearnedRule(rule.id)}
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full transition border ${rule.is_active
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                          }`}
                      >
                        {rule.is_active ? '✓ ใช้งาน' : '✕ ปิดใช้งาน'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => deleteLearnedRule(rule.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                        title="ลบหน่วยความจำนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    ไม่พบหน่วยความจำการเทรน AI ที่ตรงกับคำค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Learned Rule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative bg-white border-2 border-purple-200 rounded-3xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <BrainCircuit className="w-6 h-6 text-purple-700" />
                <h3 className="font-extrabold text-[#2e1d52] text-base">
                  เพิ่มกฎหน่วยความจำ AI ใหม่
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRuleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชุดโครงสร้างคอลัมน์ / ระบบไฟล์ต้นทาง
                </label>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="เช่น Custodian B Standard Report"
                  className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ฟิลด์ต้นทาง (Source Field) *
                  </label>
                  <input
                    type="text"
                    required
                    value={sourceField}
                    onChange={(e) => setSourceField(e.target.value)}
                    placeholder="เช่น Settle_Date"
                    className="w-full text-xs font-bold p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ฟิลด์เป้าหมาย (Target Field) *
                  </label>
                  <input
                    type="text"
                    required
                    value={targetField}
                    onChange={(e) => setTargetField(e.target.value.toUpperCase())}
                    placeholder="เช่น SETTLEMENT_DATE"
                    className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เหตุผลการเทรน AI (User Reasoning & Feedback)
                </label>

                <textarea
                  rows={3}
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  placeholder="ระบุเหตุผลเพื่อให้ AI เรียนรู้ในการประมวลผลครั้งถัดไป..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  className="purple-gradient-btn px-5 py-2.5 text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  บันทึกกฎหน่วยความจำ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
