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
  Bot,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useProcessStore } from '@/store/useProcessStore';
import { NavTab } from '@/types';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, startNewProcess, isSidebarCollapsed, toggleSidebar } = useProcessStore();

  const menuItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 flex-shrink-0" /> },
    { id: 'new-process', label: 'New File', icon: <PlusCircle className="w-5 h-5 flex-shrink-0" /> },
    { id: 'ai-mapping', label: 'AI Mapping', icon: <Sparkles className="w-5 h-5 flex-shrink-0" /> },
    { id: 'templates', label: 'Templates', icon: <FileSpreadsheet className="w-5 h-5 flex-shrink-0" /> },
    { id: 'history', label: 'History', icon: <History className="w-5 h-5 flex-shrink-0" /> },
    { id: 'audit-log', label: 'Audit Log', icon: <ShieldCheck className="w-5 h-5 flex-shrink-0" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5 flex-shrink-0" /> },
  ];

  return (
    <aside 
      className={`${
        isSidebarCollapsed ? 'w-20 p-3' : 'w-64 p-4'
      } bg-[#2e1d52] text-white flex flex-col justify-between flex-shrink-0 shadow-xl min-h-screen transition-all duration-300 ease-in-out select-none`}
    >
      <div>
        {/* Official KKP Header Logo & Toggle */}
        <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col gap-2.5 py-3' : 'justify-between px-2 py-3'} mb-4 border-b border-purple-800/40`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md flex-shrink-0 border border-white/20 bg-[#3c2a68]">
              <img src="/kkp-logo.png" alt="KKP Emblem" className="w-full h-full object-cover" />
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <h1 className="font-bold text-sm leading-tight text-white tracking-wide">
                  KKP
                </h1>
                <p className="text-xs text-amber-300 font-bold">
                  AI Data Platform
                </p>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 text-purple-300 hover:text-white hover:bg-purple-800/60 rounded-lg transition"
            title={isSidebarCollapsed ? 'ขยายแถบข้าง' : 'ย่อแถบข้าง'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
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
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isSidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5'
                } rounded-xl text-xs font-medium transition-all duration-150 relative group ${
                  isActive
                    ? 'bg-purple-600/50 text-white shadow-sm border border-purple-400/30 font-semibold'
                    : 'text-purple-100 font-semibold hover:bg-purple-900/60 hover:text-white'
                }`}
              >
                {item.icon}
                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}

                {/* Floating tooltip on hover when collapsed */}
                {isSidebarCollapsed && (
                  <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sidebar Enterprise Card */}
      {isSidebarCollapsed ? (
        <div className="flex justify-center mt-6 pt-4 border-t border-purple-800/40 relative group">
          <button 
            onClick={() => setActiveTab('settings')}
            className="w-11 h-11 bg-gradient-to-b from-purple-800/60 to-purple-950/80 border border-purple-600/40 rounded-xl flex items-center justify-center text-purple-200 hover:text-white hover:border-purple-400 transition shadow-inner"
            title="การตั้งค่าระบบ"
          >
            <Bot className="w-6 h-6 text-purple-200" />
          </button>
          <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
            การตั้งค่าระบบ AI
          </span>
        </div>
      ) : (
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
      )}
    </aside>
  );
};

