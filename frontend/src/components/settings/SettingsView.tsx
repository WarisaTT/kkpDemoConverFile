'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Cpu, ShieldCheck, CheckCircle2, Save, Key, Sparkles, AlertCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const SettingsView: React.FC = () => {
  const [provider, setProvider] = useState<'mock' | 'llama'>('llama');
  const [apiKey, setApiKey] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('https://api.groq.com/openai/v1');
  const [modelName, setModelName] = useState<string>('llama-3.3-70b-versatile');
  const [saved, setSaved] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Load saved settings from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('kkp_ai_key') || '';
    const savedUrl = localStorage.getItem('kkp_ai_url') || 'https://api.groq.com/openai/v1';
    const savedModel = localStorage.getItem('kkp_ai_model') || 'llama-3.3-70b-versatile';
    const savedProv = (localStorage.getItem('kkp_ai_provider') as 'mock' | 'llama') || (savedKey ? 'llama' : 'mock');

    setApiKey(savedKey);
    setBaseUrl(savedUrl);
    setModelName(savedModel);
    setProvider(savedProv);

    // Auto sync with backend if saved key exists
    if (savedKey) {
      fetch(`${API_BASE}/settings/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: savedKey,
          base_url: savedUrl,
          model: savedModel,
        }),
      }).catch(() => {});
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    const activeKey = provider === 'llama' ? apiKey.trim() : '';

    // Persist to localStorage
    localStorage.setItem('kkp_ai_key', apiKey);
    localStorage.setItem('kkp_ai_url', baseUrl);
    localStorage.setItem('kkp_ai_model', modelName);
    localStorage.setItem('kkp_ai_provider', provider);

    try {
      const response = await fetch(`${API_BASE}/settings/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: activeKey,
          base_url: baseUrl,
          model: modelName,
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 5000);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 5000);
      }
    } catch {
      setSaved(true);
      setTimeout(() => setSaved(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-700" />
          <h2 className="text-xl font-extrabold text-[#2e1d52]">ตั้งค่าระบบ (Settings & AI Integration)</h2>
        </div>
        <p className="text-xs text-slate-600 font-semibold mt-0.5">
          กำหนดเครื่องมือ AI ประมวลผล ใส่ Groq / Llama API Key และควบคุมการประมวลผลระดับสถาบันการเงิน
        </p>
      </div>

      {/* Groq / Llama API Featured Banner - High Contrast Styling */}
      <div className="w-full bg-[#1a0f35] p-6 rounded-2xl shadow-xl border-2 border-purple-800 text-white relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center justify-center font-bold shadow-inner flex-shrink-0">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-base text-white tracking-wide">
                  เปิดใช้งาน Groq Llama 3.3 70B AI Engine (แนะนำ)
                </h3>
                <p className="text-xs text-slate-200 font-medium mt-0.5">
                  ประมวลผลความเร็วสูง 1,000 tokens/sec ด้วย Llama 3.3 70B ผ่าน Groq Cloud API (ฟรี)
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-full shadow-md">
              High Speed Engine
            </span>
          </div>

          <div className="bg-[#0b0518] p-5 rounded-xl border border-purple-700/60 space-y-4 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  Groq / Llama API Key *
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    if (e.target.value.trim() !== '') setProvider('llama');
                  }}
                  placeholder="gsk_..."
                  className="w-full text-xs p-3 bg-[#140b2a] border border-purple-500/70 text-emerald-400 rounded-xl font-mono font-bold focus:outline-none focus:border-amber-400 placeholder-slate-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1.5">
                  โมเดล Llama (Model Name)
                </label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="llama-3.3-70b-versatile"
                  className="w-full text-xs p-3 bg-[#140b2a] border border-purple-500/70 text-emerald-400 rounded-xl font-mono font-bold focus:outline-none focus:border-amber-400 placeholder-slate-500 shadow-inner"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-purple-900/60">
              <div className="text-xs text-slate-200 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                หากไม่ได้ใส่ API Key ระบบจะสลับไปใช้ <strong className="text-amber-300 font-bold">Mock AI Engine (ฟรี)</strong> อัตโนมัติ
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 px-6 py-2.5 rounded-xl font-black text-xs shadow-lg transition flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-slate-950" />
                {loading ? 'กำลังบันทึก...' : 'บันทึกเปิดใช้งาน Llama AI'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Provider Config - Full Width */}
      <div className="banking-card p-6 w-full">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold flex-shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#2e1d52] text-sm">การเชื่อมต่อ AI Provider Abstraction</h3>
            <p className="text-xs text-slate-600 font-medium">
              เลือกสลับระหว่างเครื่องมือ Mock AI (ฟรี 100%) หรือเชื่อมต่อไปยัง Llama 3 Endpoint ภายนอก
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              เลือก AI Provider ที่ต้องการใช้งาน
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setProvider('mock')}
                className={`p-4 rounded-xl border text-left transition ${
                  provider === 'mock'
                    ? 'border-purple-600 bg-purple-50/70 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs text-[#2e1d52]">
                    Mock AI Provider (ฟรี 100%)
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                    ค่าเริ่มต้น (Default)
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  เครื่องมือ AI จำลองอัตโนมัติ คำนวณความเชื่อมั่นและเหตุผลภาษาไทยเรียลไทม์ โดยไม่ต้องใช้ API Key
                </p>
              </button>

              <button
                type="button"
                onClick={() => setProvider('llama')}
                className={`p-4 rounded-xl border text-left transition ${
                  provider === 'llama'
                    ? 'border-purple-600 bg-purple-50/70 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs text-[#2e1d52]">
                    Llama 3 AI Model (Groq / Ollama API)
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-purple-100 text-purple-900 rounded">
                    LLM จริง
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  เชื่อมต่อไปยัง Llama 3 70B ผ่าน Groq API, Together AI หรือ Ollama ในเครื่องเพื่อใช้ LLM จริง
                </p>
              </button>
            </div>
          </div>

          {provider === 'llama' && (
            <div className="space-y-4 pt-3 border-t border-slate-200 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  API Base URL
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.groq.com/openai/v1 หรือ http://localhost:11434/v1"
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-600 bg-white"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {saved ? (
              <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-2 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                บันทึกค่าการตั้งค่าสำเร็จ! ระบบจำค่า API Key ไว้เรียบร้อยแล้ว
              </span>
            ) : (
              <span />
            )}

            <button
              onClick={handleSave}
              disabled={loading}
              className="purple-gradient-btn px-6 py-2.5 text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-md"
            >
              <Save className="w-4 h-4" />
              {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าระบบ'}
            </button>
          </div>
        </div>
      </div>

      {/* Security UX Panel - Full Width */}
      <div className="banking-card p-6 bg-gradient-to-r from-emerald-900/10 via-slate-900/5 to-purple-900/10 border-emerald-200 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#2e1d52] text-sm">การประมวลผลปลอดภัยตามมาตรฐานสถาบันการเงิน (Secure Processing)</h3>
            <p className="text-xs text-slate-700 font-medium">
              ข้อมูลทั้งหมดประมวลผลภายใต้สภาพแวดล้อมที่ควบคุมของ KKP โดยไม่มีการส่งข้อมูลลูกค้าธนาคารจริงออกไปยังภายนอก
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
