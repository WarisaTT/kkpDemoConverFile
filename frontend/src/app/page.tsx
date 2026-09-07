'use client';

import React, { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Stepper } from '@/components/layout/Stepper';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { NewProcessView } from '@/components/process/NewProcessView';
import { AIMappingView } from '@/components/ai-mapping/AIMappingView';
import { MultipleSourceFormatsDemo } from '@/components/process/MultipleSourceFormatsDemo';
import { TemplatesView } from '@/components/templates/TemplatesView';
import { HistoryView } from '@/components/history/HistoryView';
import { AuditLogView } from '@/components/audit/AuditLogView';
import { SettingsView } from '@/components/settings/SettingsView';
import { useProcessStore } from '@/store/useProcessStore';

export default function Home() {
  const { activeTab, fetchInitialData } = useProcessStore();

  useEffect(() => {
    if (typeof fetchInitialData === 'function') {
      fetchInitialData();
    }
  }, [fetchInitialData]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'new-process':
        return <NewProcessView />;
      case 'ai-mapping':
        return <AIMappingView />;
      case 'multiple-sources':
        return <MultipleSourceFormatsDemo />;
      case 'templates':
        return <TemplatesView />;
      case 'history':
        return <HistoryView />;
      case 'audit-log':
        return <AuditLogView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <NewProcessView />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#f8fafc] overflow-hidden text-slate-800 antialiased">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area - Full Screen Width */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Main Header */}
        <Header />

        {/* Stepper Wizard when on New Process */}
        {activeTab === 'new-process' && <Stepper />}

        {/* Scrollable View Content - Full Screen Width */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 w-full">
          <div className="w-full max-w-full">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
}
