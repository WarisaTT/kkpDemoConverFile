'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Sparkles, 
  Layers, 
  FileSpreadsheet, 
  History, 
  ShieldCheck, 
  Settings,
  Bot
} from 'lucide-react';
import { useProcessStore } from '@/store/useProcessStore';
import { NavTab } from '@/types';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, startNewProcess } = useProcessStore();

  const menuItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'new-process', label: 'New File', icon: <PlusCircle className="w-5 h-5" /> },
    { id: 'ai-mapping', label: 'AI Mapping', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'templates', label: 'Templates', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: 'history', label: 'History', icon: <History className="w-5 h-5" /> },
    { id: 'audit-log', label: 'Audit Log', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-[#2e1d52] text-white flex flex-col justify-between p-4 flex-shrink-0 shadow-xl min-h-screen">
      <div>
        {/* Official KKP Header Logo */}
        <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-purple-800/40">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md flex-shrink-0 border border-white/20 bg-[#3c2a68]">
            <img src="/kkp-logo.png" alt="KKP Emblem" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-white tracking-wide flex items-center gap-1.5">
              KKP
            </h1>
            <p className="text-xs text-amber-300 font-bold">
              AI Data Platform
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'new-process') {
                    startNewProcess();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-purple-600/50 text-white shadow-sm border border-purple-400/30 font-semibold'
                    : 'text-purple-100 font-semibold hover:bg-purple-900/60 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sidebar Enterprise Card */}
      <div className="bg-gradient-to-b from-purple-900/50 to-purple-950/70 border border-purple-700/40 rounded-2xl p-4 mt-6 text-center shadow-inner relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex justify-center mb-2">
          <div className="w-11 h-11 bg-purple-600/30 rounded-xl flex items-center justify-center border border-purple-400/30">
            <Bot className="w-6 h-6 text-purple-200" />
          </div>
        </div>
        <h2 className="text-xs font-bold text-white mb-1">
          KKP AI Data Transformation
        </h2>
        <p className="text-xs text-purple-100 font-semibold leading-snug mb-3">
          ระบบ AI วิเคราะห์และแปลงข้อมูลรูปแบบมาตรฐาน KKP
        </p>
        <button 
          onClick={() => setActiveTab('settings')}
          className="w-full text-xs font-semibold py-1.5 px-3 bg-purple-700/50 hover:bg-purple-600/60 border border-purple-500/30 text-white rounded-lg transition"
        >
          ดูรายละเอียดการตั้งค่า
        </button>
      </div>
    </aside>
  );
};
