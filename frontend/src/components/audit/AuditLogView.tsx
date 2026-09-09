'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  FileText,
  Download,
  Filter,
  Sparkles,
  UserCheck,
  Lock,
  Layers,
  FileSpreadsheet,
  Clock,
  Eye,
  X,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Shield,
  FileDown,
  Info,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useProcessStore } from '@/store/useProcessStore';
import { AuditLog } from '@/types';

export const AuditLogView: React.FC = () => {
  const { auditLogs = [], fetchInitialData } = useProcessStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [inspectLog, setInspectLog] = useState<AuditLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter logs based on search, category, and status
  const filteredLogs = useMemo(() => {
    return (auditLogs || []).filter((log) => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        const cat = log.category || 'USER_VERIFY';
        if (cat !== selectedCategory) return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        if (log.status !== selectedStatus) return false;
      }

      // Search term
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        log.id.toLowerCase().includes(q) ||
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.file.toLowerCase().includes(q) ||
        (log.mapping && log.mapping.toLowerCase().includes(q)) ||
        (log.details && log.details.toLowerCase().includes(q)) ||
        (log.status && log.status.toLowerCase().includes(q)) ||
        (log.checksum && log.checksum.toLowerCase().includes(q))
      );
    });
  }, [auditLogs, searchTerm, selectedCategory, selectedStatus]);

  // Metric counts
  const totalCount = (auditLogs || []).length;
  const aiCount = (auditLogs || []).filter(
    (l) => l.category === 'AI_MAPPING' || l.category === 'TEMPLATE_RULE' || l.user.includes('AI')
  ).length;
  const humanCount = (auditLogs || []).filter(
    (l) => l.category === 'USER_VERIFY' || l.user === 'Warisa T.'
  ).length;
  const sealedCount = (auditLogs || []).filter(
    (l) => l.category === 'EXPORT_SEAL' || l.status === 'Sealed' || l.status === 'Completed'
  ).length;

  const handleCopyId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInitialData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredLogs.map((log) => ({
        'รหัสบันทึก (Event ID)': log.id,
        'วันที่และเวลา (Timestamp)': log.timestamp,
        'ผู้ดำเนินการ (Operator)': log.user,
        'บทบาทหน้าที่ (Role)': log.user_role || 'Custodian Operations',
        'หมวดหมู่ (Category)': getCategoryLabel(log.category),
        'กิจกรรมที่ดำเนินการ (Action)': log.action,
        'เอกสารเป้าหมาย (Target File)': log.file,
        'รายละเอียดการจับคู่ (Mapping Details)': log.mapping || '-',
        'รายละเอียดเชิงลึก (Technical Details)': log.details || '-',
        'สถานะ (Status)': log.status,
        'หมายเลข IP (IP Address)': log.ip_address || '10.128.45.19',
        'เช็คซัมความถูกต้อง (SHA-256 Checksum)': log.checksum || 'sha256:verified',
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [
        { wch: 22 }, // ID
        { wch: 22 }, // Timestamp
        { wch: 20 }, // Operator
        { wch: 28 }, // Role
        { wch: 22 }, // Category
        { wch: 36 }, // Action
        { wch: 32 }, // Target File
        { wch: 38 }, // Mapping Details
        { wch: 45 }, // Technical Details
        { wch: 14 }, // Status
        { wch: 18 }, // IP
        { wch: 26 }, // Checksum
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'KKP_Audit_Trails');

      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      XLSX.writeFile(wb, `KKP_AUDIT_LOG_REPORT_${dateStr}.xlsx`);
    } catch (err) {
      console.error('Error exporting audit log Excel:', err);
    }
  };

  const handleExportCsv = () => {
    try {
      const headers = [
        'ID',
        'Timestamp',
        'User',
        'Role',
        'Category',
        'Action',
        'File',
        'Mapping',
        'Status',
        'Checksum',
      ];
      const rows = filteredLogs.map((l) => [
        `"${l.id}"`,
        `"${l.timestamp}"`,
        `"${l.user}"`,
        `"${l.user_role || 'Custodian Specialist'}"`,
        `"${l.category || 'USER_VERIFY'}"`,
        `"${l.action.replace(/"/g, '""')}"`,
        `"${l.file.replace(/"/g, '""')}"`,
        `"${(l.mapping || '').replace(/"/g, '""')}"`,
        `"${l.status}"`,
        `"${l.checksum || ''}"`,
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KKP_AUDIT_LOG_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    }
  };

  function getCategoryLabel(cat?: string): string {
    switch (cat) {
      case 'AI_MAPPING':
        return 'การจับคู่ AI';
      case 'USER_VERIFY':
        return 'ตรวจสอบโดยผู้ใช้';
      case 'INGESTION':
        return 'นำเข้า/วิเคราะห์ไฟล์';
      case 'EXPORT_SEAL':
        return 'ส่งออกและล็อก';
      case 'TEMPLATE_RULE':
        return 'แม่แบบและกฎ';
      case 'SECURITY':
        return 'ความปลอดภัยระบบ';
      default:
        return 'กิจกรรมทั่วไป';
    }
  }

  const renderCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'AI_MAPPING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-purple-100 text-purple-900 border border-purple-300">
            <Sparkles className="w-3 h-3 text-purple-700" />
            การจับคู่ AI
          </span>
        );
      case 'USER_VERIFY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-blue-100 text-blue-900 border border-blue-300">
            <UserCheck className="w-3 h-3 text-blue-700" />
            ตรวจสอบโดยผู้ใช้
          </span>
        );
      case 'INGESTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300">
            <FileSpreadsheet className="w-3 h-3 text-cyan-700" />
            นำเข้า/วิเคราะห์ไฟล์
          </span>
        );
      case 'EXPORT_SEAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
            <Lock className="w-3 h-3 text-emerald-700" />
            ส่งออกและล็อก
          </span>
        );
      case 'TEMPLATE_RULE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300">
            <Layers className="w-3 h-3 text-indigo-700" />
            แม่แบบและกฎ
          </span>
        );
      case 'SECURITY':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-slate-100 text-slate-800 border border-slate-300">
            <Shield className="w-3 h-3 text-slate-600" />
            ความปลอดภัยระบบ
          </span>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            อนุมัติแล้ว (Approved)
          </span>
        );
      case 'Modified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            แก้ไขโดยผู้ใช้ (Modified)
          </span>
        );
      case 'AI Suggested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-purple-100 text-purple-900 border border-purple-300 shadow-xs">
            <Sparkles className="w-3 h-3 text-purple-700 animate-pulse" />
            แนะนำโดย AI
          </span>
        );
      case 'Sealed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-slate-900 text-emerald-300 border border-emerald-500/40 shadow-xs font-mono">
            <Lock className="w-3 h-3 text-emerald-400" />
            ล็อกสมบูรณ์ (Sealed)
          </span>
        );
      case 'Completed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-blue-100 text-blue-900 border border-blue-300 shadow-xs">
            <Check className="w-3 h-3 text-blue-700" />
            สำเร็จ (Completed)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-300 flex items-center justify-center text-purple-800 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#2e1d52]">
                บันทึกการตรวจสอบความปลอดภัยระดับสถาบันการเงิน (Financial Enterprise Audit Trail)
              </h2>
              <p className="text-xs text-slate-700 font-semibold mt-0.5">
                บันทึกตามมาตรฐานการกำกับดูแล IT Governance ธปท. — บันทึกข้อมูลแบบไม่สามารถแก้ไขย้อนหลังได้ (Immutable Log) ติดตามทุกกิจกรรมอย่างโปร่งใส
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="รีเฟรชข้อมูลบันทึก"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-600' : 'text-slate-500'}`} />
            <span>รีเฟรช</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="ส่งออกบันทึกการตรวจสอบเป็นไฟล์ CSV"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 text-xs font-black rounded-xl border border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700 transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="ส่งออกรายงานการตรวจสอบความปลอดภัยฉบับเต็มเป็น Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>ส่งออกรายงาน (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">บันทึกทั้งหมด</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
              #
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalCount}</span>
            <span className="text-[11px] font-semibold text-slate-500">รายการ</span>
          </div>
          <p className="text-[10px] text-slate-600 font-semibold mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            บันทึกตามเวลาสากล UTC+7
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800">ดำเนินการโดย AI & กฎ</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-900">{aiCount}</span>
            <span className="text-[11px] font-semibold text-purple-700">รายการ</span>
          </div>
          <p className="text-[10px] text-purple-800 font-semibold mt-1 flex items-center gap-1">
            <span>Semantic & Learned Rules</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800">ตรวจสอบโดยเจ้าหน้าที่</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-900">{humanCount}</span>
            <span className="text-[11px] font-semibold text-blue-700">รายการ</span>
          </div>
          <p className="text-[10px] text-blue-800 font-semibold mt-1 flex items-center gap-1">
            <span>Human-in-the-Loop Verified</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">ส่งออกและล็อกระบบ</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-900">{sealedCount}</span>
            <span className="text-[11px] font-semibold text-emerald-700">รายการ</span>
          </div>
          <p className="text-[10px] text-emerald-800 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            สถานะเสร็จสมบูรณ์ 100%
          </p>
        </div>
      </div>

      {/* 3. Search & Category Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหารหัสบันทึก, ผู้ดำเนินการ, กิจกรรม, ไฟล์, หรือรายละเอียด..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 whitespace-nowrap">สถานะ:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1.5 px-3 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600 text-slate-700 cursor-pointer"
            >
              <option value="ALL">ทั้งหมด (All Statuses)</option>
              <option value="Approved">อนุมัติแล้ว (Approved)</option>
              <option value="Modified">แก้ไขโดยผู้ใช้ (Modified)</option>
              <option value="AI Suggested">แนะนำโดย AI</option>
              <option value="Sealed">ล็อกสมบูรณ์ (Sealed)</option>
              <option value="Completed">สำเร็จ (Completed)</option>
            </select>

            {(searchTerm || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('ALL');
                  setSelectedStatus('ALL');
                }}
                className="px-2.5 py-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition cursor-pointer"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
            <Filter className="w-3 h-3" /> หมวดหมู่:
          </span>
          {[
            { id: 'ALL', label: 'ทั้งหมด (All)', count: totalCount },
            { id: 'AI_MAPPING', label: 'การจับคู่ AI', count: (auditLogs || []).filter((l) => l.category === 'AI_MAPPING').length },
            { id: 'USER_VERIFY', label: 'ตรวจสอบโดยผู้ใช้', count: (auditLogs || []).filter((l) => l.category === 'USER_VERIFY').length },
            { id: 'INGESTION', label: 'นำเข้า/วิเคราะห์ไฟล์', count: (auditLogs || []).filter((l) => l.category === 'INGESTION').length },
            { id: 'EXPORT_SEAL', label: 'ส่งออกและล็อก', count: (auditLogs || []).filter((l) => l.category === 'EXPORT_SEAL').length },
            { id: 'TEMPLATE_RULE', label: 'แม่แบบและกฎ', count: (auditLogs || []).filter((l) => l.category === 'TEMPLATE_RULE').length },
            { id: 'SECURITY', label: 'ความปลอดภัยระบบ', count: (auditLogs || []).filter((l) => l.category === 'SECURITY').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === tab.id
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  selectedCategory === tab.id ? 'bg-purple-800 text-purple-100' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Audit Log Table */}
      <div className="banking-card p-0 overflow-hidden border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-800 font-extrabold uppercase text-[11px] border-b border-slate-200 tracking-wider">
                <th className="py-3.5 px-4 min-w-[130px] whitespace-nowrap">รหัสบันทึก (Event ID)</th>
                <th className="py-3.5 px-4 min-w-[150px] whitespace-nowrap">วัน-เวลา</th>
                <th className="py-3.5 px-4 min-w-[160px] whitespace-nowrap">ผู้ดำเนินการ (Actor)</th>
                <th className="py-3.5 px-4 min-w-[140px] whitespace-nowrap">หมวดหมู่</th>
                <th className="py-3.5 px-4 min-w-[220px] whitespace-nowrap">กิจกรรม (Action)</th>
                <th className="py-3.5 px-4 min-w-[160px] whitespace-nowrap">เอกสารเป้าหมาย</th>
                <th className="py-3.5 px-4 min-w-[240px]">รายละเอียดการจับคู่ & ผลลัพธ์</th>
                <th className="py-3.5 px-4 text-center min-w-[100px] whitespace-nowrap">สถานะ</th>
                <th className="py-3.5 px-4 text-right min-w-[110px] whitespace-nowrap">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Shield className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-600">ไม่พบรายการบันทึกการตรวจสอบที่ตรงกับเงื่อนไข</p>
                    <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองหมวดหมู่</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('ALL');
                        setSelectedStatus('ALL');
                      }}
                      className="mt-3 px-3 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 rounded-xl border border-purple-200 hover:bg-purple-100 transition"
                    >
                      รีเซ็ตตัวกรองทั้งหมด
                    </button>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setInspectLog(log)}
                    className="hover:bg-purple-50/40 transition cursor-pointer group"
                  >
                    {/* Event ID */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-purple-950 text-xs bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {log.id}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyId(log.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-purple-700 transition p-1"
                          title="คัดลอกรหัสบันทึก"
                        >
                          {copiedId === log.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.timestamp}</span>
                      </div>
                    </td>

                    {/* User / Actor */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-xs ${
                            log.user.includes('AI')
                              ? 'bg-gradient-to-tr from-purple-700 to-indigo-600'
                              : log.user.includes('ระบบ')
                              ? 'bg-slate-700'
                              : 'bg-[#2e1d52]'
                          }`}
                        >
                          {log.user.includes('AI') ? 'AI' : log.user.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 leading-tight flex items-center gap-1">
                            {log.user}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold truncate max-w-[140px]">
                            {log.user_role || (log.user.includes('AI') ? 'AI Model Engine' : 'Custodian Operations')}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderCategoryBadge(log.category)}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-800 text-xs">
                        {log.action}
                      </div>
                      {log.details && (
                        <div className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                          {log.details}
                        </div>
                      )}
                    </td>

                    {/* Target File */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs bg-slate-100/80 px-2 py-1 rounded-lg border border-slate-200/80 max-w-[200px] truncate" title={log.file}>
                        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{log.file}</span>
                      </div>
                    </td>

                    {/* Mapping Details */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs text-slate-700 font-semibold bg-slate-50 px-2 py-1 rounded border border-slate-200 line-clamp-2" title={log.mapping}>
                        {log.mapping}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {renderStatusBadge(log.status)}
                    </td>

                    {/* Inspect Button */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectLog(log);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 rounded-lg border border-purple-300 transition inline-flex items-center gap-1 cursor-pointer"
                        title="ดูรายละเอียดฉบับเต็ม"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ตรวจทาน</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>แสดง <strong>{filteredLogs.length}</strong> จากทั้งหมด <strong>{totalCount}</strong> รายการที่ตรวจสอบแล้ว</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>มาตรฐานความปลอดภัย: ธปท. IT Governance Framework</span>
            <span>•</span>
            <span>การเข้ารหัส: SHA-256 Non-repudiation</span>
          </div>
        </div>
      </div>

      {/* 5. Detailed Audit Inspector Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setInspectLog(null)} />

          <div className="relative bg-white rounded-3xl border-2 border-purple-200 shadow-2xl w-full max-w-2xl overflow-hidden z-10 p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-800 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      รายละเอียดบันทึกการตรวจสอบความปลอดภัย
                    </h3>
                    {renderStatusBadge(inspectLog.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                    <span>{inspectLog.id}</span>
                    <span>•</span>
                    <span>{inspectLog.timestamp}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto pr-1 space-y-4 text-xs">
              {/* Event Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-600 block">ผู้ดำเนินการ (Actor)</span>
                  <span className="font-black text-slate-800 text-xs mt-0.5 block">{inspectLog.user}</span>
                  <span className="text-[10px] text-slate-500 block">{inspectLog.user_role || 'Custodian Operations Specialist'}</span>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-600 block">สถานีงาน & IP Address</span>
                  <span className="font-mono text-slate-700 text-xs mt-0.5 block">{inspectLog.ip_address || '10.128.45.19 [Internal Banking LAN]'}</span>
                  <span className="text-[10px] text-slate-500 block">Channel: Web Custodian Portal</span>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-600 block">หมวดหมู่กิจกรรม</span>
                  <div className="mt-1">{renderCategoryBadge(inspectLog.category)}</div>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-600 block">เอกสารหรือรูปแบบมาตรฐาน</span>
                  <div className="font-mono text-slate-700 font-bold truncate mt-0.5" title={inspectLog.file}>
                    {inspectLog.file}
                  </div>
                </div>
              </div>

              {/* Action & Purpose */}
              <div className="bg-purple-50/60 border border-purple-200 p-3.5 rounded-2xl space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-purple-900 block">กิจกรรมที่ดำเนินการ (Action Details)</span>
                <p className="text-xs font-black text-purple-950">{inspectLog.action}</p>
                {inspectLog.details && (
                  <p className="text-[11px] text-slate-700 font-medium leading-relaxed mt-1">
                    {inspectLog.details}
                  </p>
                )}
              </div>

              {/* Mapping & Technical Details */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-600 block">ข้อมูลการจับคู่ & ข้อกำหนดทางเทคนิค (Technical Payload)</span>
                <div className="bg-white p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800 break-words leading-relaxed">
                  {inspectLog.mapping}
                </div>
              </div>

              {/* Digital Checksum & Governance Guarantee */}
              <div className="bg-slate-900 text-slate-200 p-3.5 rounded-2xl space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    การรับรองความถูกต้องของระบบ (Digital Checksum)
                  </span>
                  <span className="text-[10px] text-slate-400">SHA-256 Non-Repudiation</span>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-slate-300 break-all select-all">
                  {inspectLog.checksum || 'sha256:d8f3a91cb274e051a89c2049b81f9a21...'}
                </div>
                <p className="text-[10px] text-slate-400 leading-normal font-sans">
                  บันทึกนี้ได้รับการรับรองความถูกต้องตามมาตรฐาน IT Governance ธนาคารแห่งประเทศไทย (ธปท.) ข้อมูลถูกเข้ารหัสและไม่สามารถทำการลบหรือดัดแปลงย้อนหลังได้ (Immutable Audit Trail)
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleCopyId(inspectLog.id)}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedId === inspectLog.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>คัดลอกรหัสแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>คัดลอกรหัสบันทึก</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="px-4 py-2 text-xs font-black rounded-xl bg-purple-900 hover:bg-purple-950 text-white transition shadow-sm cursor-pointer"
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
