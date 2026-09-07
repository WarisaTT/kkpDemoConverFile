import * as XLSX from 'xlsx';
import { create } from 'zustand';
import { Process, FieldMapping, AuditLog, TargetTemplate, SystemStats, AILearnedRule } from '@/types';
import { formatTargetValue } from '@/utils/formatUtils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface ProcessState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;

  activeSheetName: string;
  checkedFieldIds: Record<string, boolean>;
  aiLearnedRules: AILearnedRule[];
  toggleCheckField: (id: string) => void;
  checkAllFields: (ids: string[]) => void;
  uncheckAllFields: (ids?: string[]) => void;
  addLearnedRule: (rule: AILearnedRule) => void;
  toggleLearnedRule: (id: string) => void;
  deleteLearnedRule: (id: string) => void;
  setActiveSheetName: (sheetName: string) => void;

  process: Process | null;
  processes: Process[];
  setProcess: (p: Process | null) => void;
  selectedMapping: FieldMapping | null;
  setSelectedMapping: (mapping: FieldMapping | null) => void;

  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  openDrawer: (mapping?: FieldMapping) => void;
  closeDrawer: () => void;

  isChangeModalOpen: boolean;
  setIsChangeModalOpen: (open: boolean) => void;
  openChangeModal: () => void;
  closeChangeModal: () => void;

  confidenceFilter: string;
  setConfidenceFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;

  stats: SystemStats;
  auditLogs: AuditLog[];
  templates: TargetTemplate[];

  uploadFile: (file?: File) => Promise<void>;
  acceptMapping: (mappingId: string) => Promise<void>;
  confirmAllMappings: (targetFieldIds?: string[]) => void;
  updateMappingTarget: (sourceField: string, newTargetField: string) => void;
  updateMappingSource: (targetField: string, newSourceField: string) => void;
  updateSourceSampleValue: (sourceField: string, newSample: string) => void;
  updateMapping: (mappingId: string, newTargetField: string) => Promise<void>;
  exportExcel: (targetProc?: any) => Promise<void>;
  fetchInitialData: () => Promise<void>;
  addTemplate: (template: TargetTemplate) => Promise<void>;
  updateTemplate: (id: string, template: TargetTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  deleteProcess: (id: string) => Promise<void>;
  updateProcessStep: (step: number, status?: string) => Promise<void>;
  createTemplateFromUpload: () => Promise<void>;

}


const DEFAULT_INITIAL_TEMPLATES: TargetTemplate[] = [
  {
    id: 'tmpl_01',
    name: 'KKP_CUSTODIAN_TRADE_V2',
    description: 'รูปแบบมาตรฐานรายงานธุรกรรมหลักทรัพย์ Custodian ของกลุ่มธุรกิจการเงินเกียรตินาคินภัทร',
    version: '2.0',
    field_count: 8,
    status: 'Active',
    updated_at: '2026-09-01T10:00:00Z',
    fields: [
      { id: 'tf_1', name: 'FUND_NAME', data_type: 'String', format: '-', required: true, description: 'ชื่อกองทุนรวม' },
      { id: 'tf_2', name: 'FUND_CODE', data_type: 'String', format: '-', required: true, description: 'รหัสกองทุนรวม' },
      { id: 'tf_3', name: 'TRADE_DATE', data_type: 'Date', format: 'YYYY-MM-DD', required: true, description: 'วันที่ทำรายการ' },
      { id: 'tf_4', name: 'SETTLEMENT_DATE', data_type: 'Date', format: 'YYYY-MM-DD', required: true, description: 'วันที่ชำระราคา' },
      { id: 'tf_5', name: 'CURRENCY', data_type: 'String', format: 'ISO 4217', required: true, description: 'รหัสสกุลเงิน' },
      { id: 'tf_6', name: 'UNIT_PRICE', data_type: 'Decimal', format: '18,4', required: true, description: 'ราคาต่อหน่วย' },
      { id: 'tf_7', name: 'QUANTITY', data_type: 'Decimal', format: '18,4', required: true, description: 'จำนวนหน่วย' },
      { id: 'tf_8', name: 'AMOUNT', data_type: 'Decimal', format: '18,2', required: true, description: 'มูลค่ารวม' },
    ],
  },
];

const getStoredTemplates = (): TargetTemplate[] => {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_TEMPLATES;
  try {
    const saved = localStorage.getItem('kkp_templates');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading stored templates:', e);
  }
  return DEFAULT_INITIAL_TEMPLATES;
};

const saveStoredTemplates = (templates: TargetTemplate[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('kkp_templates', JSON.stringify(templates));
  } catch (e) {
    console.error('Error saving templates:', e);
  }
};

const getStoredRules = (defaultRules: AILearnedRule[]): AILearnedRule[] => {
  if (typeof window === 'undefined') return defaultRules;
  try {
    const saved = localStorage.getItem('kkp_ai_rules');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading stored rules:', e);
  }
  return defaultRules;
};

const saveStoredRules = (rules: AILearnedRule[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('kkp_ai_rules', JSON.stringify(rules));
  } catch (e) {
    console.error('Error saving rules:', e);
  }
};


export const FOOTNOTE_KEYWORDS = [
  'amber =',
  'red =',
  'green =',
  'yellow =',
  'intentional missing',
  'intentionally missing',
  'duplicate rows',
  'validation demo',
  'semantic mapping demo',
  'for ai',
  'ai/validation',
  'note:',
  'notes:',
  'remark:',
  'remarks:',
  'disclaimer',
  'confidential',
  'legend:',
  'footnote',
  'grand total',
  'subtotal',
  'end of report',
  'end of file',
  'prepared by',
  'checked by',
  'authorized by',
  'unaudited',
  'notice:',
];

export function isFootnoteOrNonDataRow(
  row: any[] | Record<string, any> | null | undefined,
  totalColumns: number = 8
): boolean {
  if (!row) return true;

  // 1. Array of cells
  if (Array.isArray(row)) {
    const nonBlankCells = row
      .map((c) => (c !== undefined && c !== null ? String(c).trim() : ''))
      .filter(Boolean);

    if (nonBlankCells.length === 0) return true;

    const fullRowText = nonBlankCells.join(' ').toLowerCase();
    for (const kw of FOOTNOTE_KEYWORDS) {
      if (fullRowText.includes(kw)) return true;
    }

    const threshold = Math.max(1, Math.floor(totalColumns * 0.25));
    if (nonBlankCells.length <= threshold) {
      const txt = nonBlankCells[0] || '';
      if (
        txt.length > 20 &&
        (txt.includes('=') || txt.includes(':') || txt.startsWith('*') || txt.includes('(') || txt.includes(')'))
      ) {
        return true;
      }
    }

    return false;
  }

  // 2. Object record (Record<string, any>)
  const values = Object.entries(row)
    .filter(([k]) => k !== 'id' && k !== 'sheetName' && k !== 'isEdited')
    .map(([, v]) => (v !== undefined && v !== null ? String(v).trim() : ''))
    .filter(Boolean);

  if (values.length === 0) return true;

  const fullRowText = values.join(' ').toLowerCase();
  for (const kw of FOOTNOTE_KEYWORDS) {
    if (fullRowText.includes(kw)) return true;
  }

  const threshold = Math.max(1, Math.floor(totalColumns * 0.25));
  if (values.length <= threshold) {
    const txt = values[0] || '';
    if (
      txt.length > 20 &&
      (txt.includes('=') || txt.includes(':') || txt.startsWith('*') || txt.includes('(') || txt.includes(')'))
    ) {
      return true;
    }
  }

  return false;
}

export const STANDARD_8_TARGET_FIELDS = [
  { id: 'tf_1', name: 'FUND_NAME', data_type: 'String', required: true, format: '-', description: 'ชื่อกองทุนรวม' },
  { id: 'tf_2', name: 'FUND_CODE', data_type: 'String', required: true, format: '-', description: 'รหัสกองทุนรวม' },
  { id: 'tf_3', name: 'TRADE_DATE', data_type: 'Date', required: true, format: 'YYYY-MM-DD', description: 'วันที่ทำรายการ' },
  { id: 'tf_4', name: 'SETTLEMENT_DATE', data_type: 'Date', required: true, format: 'YYYY-MM-DD', description: 'วันที่ชำระราคา' },
  { id: 'tf_5', name: 'CURRENCY', data_type: 'String', required: true, format: 'ISO 4217', description: 'รหัสสกุลเงิน' },
  { id: 'tf_6', name: 'UNIT_PRICE', data_type: 'Decimal', required: true, format: '18,4', description: 'ราคาต่อหน่วย' },
  { id: 'tf_7', name: 'QUANTITY', data_type: 'Decimal', required: true, format: '18,4', description: 'จำนวนหน่วย' },
  { id: 'tf_8', name: 'AMOUNT', data_type: 'Decimal', required: true, format: '18,2', description: 'มูลค่ารวม' },
];

export const matchTargetToSourceField = (targetName: string, headers: string[]): { matchedCol: string; reason: string } => {
  for (const h of headers) {
    const clean = String(h).trim();
    if (!clean) continue;
    if (targetName === 'FUND_NAME') {
      if (/fund.*name|scheme|portfolio|policyfund|security.*name|fnd_nm|^fund$|ชื่อกองทุน|หลักทรัพย์/i.test(clean)) {
        return { matchedCol: clean, reason: `ตรวจพบคอลัมน์ "${clean}" สอดคล้องกับชื่อกองทุนรวม KKP (FUND_NAME)` };
      }
    } else if (targetName === 'FUND_CODE') {
      if (/fund.*(code|id|identifier|symbol)|security.*code|^isin$|รหัสกองทุน/i.test(clean)) {
        return { matchedCol: clean, reason: `ตรวจพบคอลัมน์ "${clean}" สอดคล้องกับรหัสกองทุนรวม (FUND_CODE)` };
      }
    } else if (targetName === 'TRADE_DATE') {
      if (/(trade|order|txn|transaction|deal).*date|trd_dt|^date$|วันที่ทำรายการ|วันที่ซื้อขาย/i.test(clean) && !/settle|value|ส่งมอบ|ชำระ/i.test(clean)) {
        return { matchedCol: clean, reason: `ตรวจพบคอลัมน์ "${clean}" สอดคล้องกับวันที่ทำรายการซื้อขาย (TRADE_DATE)` };
      }
    } else if (targetName === 'SETTLEMENT_DATE') {
      if (/(settle|value).*date|^settle.*date$|วันชำระราคา|ส่งมอบ/i.test(clean)) {
        return { matchedCol: clean, reason: `ตรวจพบคอลัมน์ "${clean}" สอดคล้องกับวันที่ชำระราคาและส่งมอบ (SETTLEMENT_DATE)` };
      }
    } else if (targetName === 'CURRENCY') {
      if (/^(ccy|ccy.*code|curr|currency|currency.*name|settlement.*ccy|cur|สกุลเงิน)$/i.test(clean)) {
        return { matchedCol: clean, reason: `ตรวจพบคอลัมน์ "${clean}" สอดคล้องกับรหัสสกุลเงินมาตรฐาน (CURRENCY)` };
      }
    } else if (targetName === 'UNIT_PRICE') {
      if (/^(nav|nav_prc|unit.*price|price.*per.*unit|net.*asset.*value|มูลค่าต่อหน่วย|ราคาต่อหน่วย)$/i.test(clean) || (/price/i.test(clean) && !/total|market|net|amount/i.test(clean))) {
        return { matchedCol: clean, reason: `ตรวจพบคอลัมน์ "${clean}" สอดคล้องกับราคาต่อหน่วย/NAV (UNIT_PRICE)` };
      }
    } else if (targetName === 'QUANTITY') {
      if (/^(qty|quantity|units|shares|no\..*units|volume|จำนวนหน่วย)$/i.test(clean)) {
        return { matchedCol: clean, reason: `ตรวจพบคอลัมน์ "${clean}" สอดคล้องกับจำนวนหน่วยหลักทรัพย์ (QUANTITY)` };
      }
    } else if (targetName === 'AMOUNT') {
      if (/(trade.*amount|total.*value|net.*amount|market.*value|consideration|^amount$|^amt$|มูลค่ารวม|มูลค่าการซื้อขาย)/i.test(clean)) {
        return { matchedCol: clean, reason: `ตรวจพบคอลัมน์ "${clean}" สอดคล้องกับมูลค่าการซื้อขายรวม (AMOUNT)` };
      }
    }
  }
  return { matchedCol: 'UNMATCHED', reason: `ไม่พบคอลัมน์ในไฟล์ต้นทางที่ตรงกับฟิลด์ ${targetName}` };
};

export const useProcessStore = create<ProcessState>((set, get) => ({
  activeTab: 'new-process',
  setActiveTab: (tab) => set((state) => ({ activeTab: tab, currentStep: (tab === 'new-process' && !state.process) ? 1 : state.currentStep })),
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),

  activeSheetName: 'Custodian_A',
  setActiveSheetName: (sheetName) => {
    const proc = get().process;
    if (proc && proc.sheetDataMap && proc.sheetDataMap[sheetName]) {
      const sData = proc.sheetDataMap[sheetName];
      set({
        activeSheetName: sheetName,
        process: {
          ...proc,
          mappings: sData.mappings,
          extractedRecords: sData.rows,
          column_count: sData.headers.length,
        },
        selectedMapping: sData.mappings[0] || null,
      });
    } else {
      set({ activeSheetName: sheetName });
    }
  },

  checkedFieldIds: {},
  aiLearnedRules: [
    {
      id: 'rule_ai_filter_footnotes',
      column_set_pattern: 'All Layouts (ทุกเทมเพลตและชีท)',
      source_field: 'Footnotes / Legends / Remarks (เช่น Amber = ..., Note: ...)',
      target_field: 'EXCLUDE_ROW (ตัดแถวทิ้งอัตโนมัติ)',
      user_reasoning: 'คำสั่ง AI: แถวคำอธิบายสี (เช่น Amber/Red missing values), หมายเหตุ (Notes/Remarks), ข้อมูลสรุปท้ายตาราง ไม่ใช่รายการธุรกรรมทางการเงิน ให้ระบบตัดทิ้งอัตโนมัติ ไม่นำเข้าสู่ระบบ',
      learned_at: '2026-09-05',
      is_active: true,
      remember_forever: true,
    },
    {
      id: 'rule_01',
      column_set_pattern: 'Custodian A 27-Column Layout',
      source_field: 'NAV',
      target_field: 'UNIT_PRICE',
      user_reasoning: 'NAV ในรายงาน Custodian A มีมูลค่าตรงกับราคาต่อหน่วยของกองทุนรวม KKP',
      learned_at: '2026-09-01',
      is_active: true,
      remember_forever: true,
    },
    {
      id: 'rule_02',
      column_set_pattern: 'Custodian B Export Standard',
      source_field: 'Fund Identifier',
      target_field: 'FUND_CODE',
      user_reasoning: 'Fund Identifier ใช้รูปแบบ FID-2000 สื่อถึงรหัสกองทุนทางการ',
      learned_at: '2026-09-02',
      is_active: true,
      remember_forever: true,
    },
    {
      id: 'rule_03',
      column_set_pattern: 'FundManager C Trade Report',
      source_field: 'Value Date',
      target_field: 'SETTLEMENT_DATE',
      user_reasoning: 'Value Date ในรายงาน Fund Manager C คือวันที่ชำระราคา (Settlement Date)',
      learned_at: '2026-09-03',
      is_active: true,
      remember_forever: true,
    },
  ],

  toggleCheckField: (id: string) => {
    set((state) => ({
      checkedFieldIds: {
        ...(state.checkedFieldIds || {}),
        [id]: !Boolean(state.checkedFieldIds?.[id]),
      },
    }));
  },

  checkAllFields: (ids: string[]) => {
    set((state) => {
      const updated = { ...(state.checkedFieldIds || {}) };
      ids.forEach((id) => {
        updated[id] = true;
      });
      return { checkedFieldIds: updated };
    });
  },

  uncheckAllFields: (ids?: string[]) => {
    set((state) => {
      if (!ids || ids.length === 0) {
        return { checkedFieldIds: {} };
      }
      const updated = { ...(state.checkedFieldIds || {}) };
      ids.forEach((id) => {
        delete updated[id];
      });
      return { checkedFieldIds: updated };
    });
  },

  addLearnedRule: (rule: AILearnedRule) => {
    set((state) => {
      const safeId = rule.id && !rule.id.startsWith("rule_") ? rule.id : `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const safeRule = { ...rule, id: safeId };
      const filtered = (state.aiLearnedRules || []).filter(
        (r) => r.id !== safeId && r.source_field.trim().toLowerCase() !== rule.source_field.trim().toLowerCase()
      );
      const updated = [safeRule, ...filtered];
      saveStoredRules(updated);
      return { aiLearnedRules: updated };
    });
  },

  toggleLearnedRule: (id: string) => {
    set((state) => {
      const updated = (state.aiLearnedRules || []).map((r) =>
        r.id === id ? { ...r, is_active: !r.is_active } : r
      );
      saveStoredRules(updated);
      return { aiLearnedRules: updated };
    });
  },

  deleteLearnedRule: (id: string) => {
    set((state) => {
      const updated = (state.aiLearnedRules || []).filter((r) => r.id !== id);
      saveStoredRules(updated);
      return { aiLearnedRules: updated };
    });
  },

  process: null,
  processes: [],
  setProcess: (p) => {
    if (!p) {
      set({ process: null, currentStep: 1, selectedMapping: null, isDrawerOpen: false });
    } else {
      set({
        process: p,
        currentStep: p.current_step || 2,
        selectedMapping: null,
        isDrawerOpen: false,
      });
    }
  },
  selectedMapping: null,
  setSelectedMapping: (mapping) => set({ selectedMapping: mapping }),

  isDrawerOpen: false,
  setIsDrawerOpen: (open) => set({ isDrawerOpen: open }),
  openDrawer: (mapping?: FieldMapping) => set((state) => ({ isDrawerOpen: true, selectedMapping: mapping || state.selectedMapping })),
  closeDrawer: () => set({ isDrawerOpen: false, selectedMapping: null }),

  isChangeModalOpen: false,
  setIsChangeModalOpen: (open) => set({ isChangeModalOpen: open }),
  openChangeModal: () => set({ isChangeModalOpen: true }),
  closeChangeModal: () => set({ isChangeModalOpen: false }),

  confidenceFilter: 'All',
  setConfidenceFilter: (filter) => set({ confidenceFilter: filter }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  isAnalyzing: false,
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

  stats: {
    files_processed: 128,
    fields_auto_mapped: 3450,
    ai_match_accuracy: 98.4,
    manual_review_rate: 1.6,
    time_saved_percent: 85,
  },

  auditLogs: [],

  templates: getStoredTemplates(),

    uploadFile: async (file?: File) => {
    set({ isAnalyzing: true });

    let sizeStr = '2.48 MB';
    if (file && file.size) {
      const mb = (file.size / (1024 * 1024)).toFixed(2);
      sizeStr = `${mb} MB`;
    }
    const nameStr = file?.name || 'KKP_Demo_Source_Files.xlsx';

    if (file) {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        const rawSheetNames = workbook.SheetNames || [];
        const validSheetNames = rawSheetNames.filter((s) => !/reference|schema/i.test(s));
        const sheetNames = validSheetNames.length > 0 ? validSheetNames : rawSheetNames;

        const sheetDataMap: Record<string, { headers: string[]; rows: any[]; mappings: FieldMapping[] }> = {};
        let totalRowCount = 0;

        for (const sname of sheetNames) {
          const ws = workbook.Sheets[sname];
          const matrix: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

          let headerIdx = 0;
          for (let r = 0; r < Math.min(10, matrix.length); r++) {
            const rowItems = (matrix[r] || []).map((c) => String(c).trim()).filter(Boolean);
            if (rowItems.length >= 3) {
              headerIdx = r;
              break;
            }
          }

          const rawHeaders = (matrix[headerIdx] || []).map((c) => String(c).trim());
          const headers = rawHeaders.filter((h) => h !== '');
          const finalHeaders = headers.length > 0 ? headers : ['Column_1', 'Column_2', 'Column_3', 'Column_4', 'Column_5', 'Column_6', 'Column_7', 'Column_8'];

          const dataRows = matrix.slice(headerIdx + 1).filter((r) => r && !isFootnoteOrNonDataRow(r, finalHeaders.length));
          totalRowCount += dataRows.length;
          const firstDataRow = dataRows[0] || [];

          const rows = dataRows.slice(0, 150).map((r, rIdx) => {
            const obj: Record<string, any> = {
              id: rIdx + 1,
              sheetName: sname,
            };
            finalHeaders.forEach((h, cIdx) => {
              obj[h] = r[cIdx] !== undefined ? r[cIdx] : '';
            });
            return obj;
          });

          const mappings: FieldMapping[] = STANDARD_8_TARGET_FIELDS.map((tf, mIdx) => {
            const match = matchTargetToSourceField(tf.name, finalHeaders);
            const isMatched = match.matchedCol !== 'UNMATCHED';
            const sampleIndex = finalHeaders.indexOf(match.matchedCol);
            const sampleVal = isMatched && sampleIndex >= 0 ? String(firstDataRow[sampleIndex] ?? '-') : '-';
            const isNum = typeof firstDataRow[sampleIndex] === 'number' || (!isNaN(Number(firstDataRow[sampleIndex])) && sampleVal !== '-');

            return {
              id: `m_${sname}_${mIdx + 1}`,
              process_id: `proc_${Date.now()}`,
              source_field: match.matchedCol,
              source_sample: sampleVal,
              source_data_type: isMatched && isNum ? 'Decimal' : 'String',
              target_field: tf.name,
              target_data_type: tf.data_type,
              target_required: tf.required,
              target_format: tf.format,
              confidence: isMatched ? 0.95 : 0.0,
              confidence_level: isMatched ? 'High' : 'Unmatched',
              status: isMatched ? 'ACCEPTED' : 'UNMATCHED',
              reasons: [match.reason],
            };
          });

          sheetDataMap[sname] = {
            headers: finalHeaders,
            rows,
            mappings,
          };
        }

        const firstSheet = sheetNames[0] || 'Sheet1';
        const firstSheetData = sheetDataMap[firstSheet] || { headers: [], rows: [], mappings: [] };

        const newProc: Process = {
          id: `proc_${Date.now()}`,
          file_name: nameStr,
          file_size: sizeStr,
          sheet_count: sheetNames.length,
          sheets: sheetNames,
          row_count: totalRowCount || firstSheetData.rows.length,
          column_count: firstSheetData.headers.length,
          target_template_id: 'tmpl_master_01',
          target_template: 'KKP_CUSTODIAN_TRADE_V2',
          current_step: 2,
          step_name: 'Step 2: ตรวจสอบและยืนยันการจับคู่',
          status: 'Analyzed',
          overall_confidence: 0.95,
          created_at: new Date().toISOString(),
          analysis_progress: 100,
          analysis_summary: {
            header_detected: true,
            data_type_detected: true,
            date_format_detected: true,
            currency_detected: 'THB',
            potential_duplicates: 0,
            missing_values: 0,
          },
          mappings: firstSheetData.mappings,
          extractedRecords: firstSheetData.rows,
          sheetDataMap: sheetDataMap,
          previews: [],
        };

        set((state) => ({
          process: newProc,
          processes: [newProc, ...state.processes.filter((p) => p.id !== newProc.id)],
          activeSheetName: firstSheet,
          currentStep: 2,
          isAnalyzing: false,
          selectedMapping: newProc.mappings[0] || null,
        }));

        // Send to backend in background for persistence
        try {
          const formData = new FormData();
          formData.append('file', file);
          fetch(`${API_BASE}/files/upload`, { method: 'POST', body: formData }).catch(() => {});
        } catch {}

        return;
      } catch (err) {
        console.error('Error parsing Excel client-side:', err);
      }
    }

    // Fallback if no file provided or parsing failed
    const demoP = getInitialDemoProcess(nameStr, sizeStr);
    set((state) => ({
      process: demoP,
      processes: [demoP, ...state.processes.filter((p) => p.id !== demoP.id)],
      currentStep: 2,
      isAnalyzing: false,
      selectedMapping: demoP.mappings[0],
    }));
  },

  updateMappingSource: (targetField: string, newSourceField: string) => {
    const proc = get().process;
    if (!proc) return;
    const activeSheet = get().activeSheetName || proc.sheets?.[0] || 'Custodian_A';

    const currentSheetData = proc.sheetDataMap?.[activeSheet];
    const firstRow = currentSheetData?.rows?.[0] || proc.extractedRecords?.[0];

    let sampleVal = '-';
    let dataTypeVal = 'String';
    if (newSourceField !== 'UNMATCHED' && newSourceField) {
      const rows = currentSheetData?.rows || proc.extractedRecords || [];
      for (const r of rows) {
        if (r && r[newSourceField] !== undefined && r[newSourceField] !== null && String(r[newSourceField]).trim() !== '') {
          sampleVal = String(r[newSourceField]).trim();
          dataTypeVal = typeof r[newSourceField] === 'number' ? 'Decimal' : 'String';
          break;
        }
      }
    }

    const isUnmatched = newSourceField === 'UNMATCHED' || !newSourceField;

    const updatedMappings = proc.mappings.map((m) => {
      if (m.target_field === targetField) {
        return {
          ...m,
          source_field: isUnmatched ? 'UNMATCHED' : newSourceField,
          source_sample: isUnmatched ? '-' : sampleVal,
          source_data_type: isUnmatched ? 'Text' : dataTypeVal,
          confidence: isUnmatched ? 0.0 : 0.95,
          confidence_level: isUnmatched ? ('Low' as const) : ('High' as const),
          status: isUnmatched ? ('UNMATCHED' as const) : ('MODIFIED' as const),
          reasons: isUnmatched
            ? [`ผู้ใช้กำหนดไม่ระบุคอลัมน์สำหรับ ${targetField}`]
            : [`ผู้ใช้จับคู่คอลัมน์ "${newSourceField}" ไปยัง ${targetField}`],
        };
      }
      return m;
    });

    let updatedSheetMap = proc.sheetDataMap;
    if (proc.sheetDataMap && proc.sheetDataMap[activeSheet]) {
      updatedSheetMap = {
        ...proc.sheetDataMap,
        [activeSheet]: {
          ...proc.sheetDataMap[activeSheet],
          mappings: updatedMappings,
        },
      };
    }

    set({
      process: {
        ...proc,
        mappings: updatedMappings,
        sheetDataMap: updatedSheetMap,
      },
    });
  },

  acceptMapping: async (mappingId: string) => {
    const proc = get().process;
    if (!proc) return;
    const updated = proc.mappings.map((m) =>
      m.id === mappingId
        ? {
            ...m,
            status: 'ACCEPTED' as const,
            confidence: 1.0,
            confidence_level: 'High' as const,
            approved_by: 'ผู้ดูแลระบบ KKP',
            approved_at: new Date().toISOString(),
          }
        : m
    );
    set({ process: { ...proc, mappings: updated } });
  },

  confirmAllMappings: (targetFieldIds?: string[]) => {
    const proc = get().process;
    if (!proc) return;
    const nowIso = new Date().toISOString();
    const targetSet = targetFieldIds && targetFieldIds.length > 0
      ? new Set(targetFieldIds.map((s) => s.trim().toUpperCase()))
      : null;

    const updateMapping = (m: FieldMapping): FieldMapping => {
      if (!targetSet || (m.target_field && targetSet.has(m.target_field.trim().toUpperCase()))) {
        return {
          ...m,
          status: 'ACCEPTED',
          confidence: 1.0,
          confidence_level: 'High',
          approved_by: 'ผู้ตรวจสอบ KKP (ยืนยันทั้งหมด)',
          approved_at: nowIso,
          reasons: [...(m.reasons || []), 'ยืนยันการจับคู่คอลัมน์ทั้งหมดเรียบร้อยแล้ว (Verified All)'],
        };
      }
      return m;
    };

    const updatedMappings = proc.mappings.map(updateMapping);

    let updatedSheetMap = proc.sheetDataMap;
    if (proc.sheetDataMap) {
      updatedSheetMap = { ...proc.sheetDataMap };
      Object.keys(updatedSheetMap).forEach((sKey) => {
        if (updatedSheetMap![sKey]?.mappings) {
          updatedSheetMap![sKey] = {
            ...updatedSheetMap![sKey],
            mappings: updatedSheetMap![sKey].mappings.map(updateMapping),
          };
        }
      });
    }

    const updatedChecked: Record<string, boolean> = { ...(get().checkedFieldIds || {}) };
    updatedMappings.forEach((m) => {
      if (m.target_field) updatedChecked[m.target_field] = true;
      if (m.id) updatedChecked[m.id] = true;
      if (m.source_field) updatedChecked[m.source_field] = true;
    });
    if (targetFieldIds) {
      targetFieldIds.forEach((id) => {
        updatedChecked[id] = true;
      });
    }

    set({
      checkedFieldIds: updatedChecked,
      process: {
        ...proc,
        mappings: updatedMappings,
        sheetDataMap: updatedSheetMap,
        overall_confidence: 1.0,
      },
    });
  },

  updateMappingTarget: (sourceField: string, newTargetField: string) => {
    const proc = get().process;
    if (!proc) return;
    const updated = proc.mappings.map((m) =>
      m.source_field === sourceField
        ? {
            ...m,
            target_field: newTargetField,
            status: 'MODIFIED' as const,
          }
        : m
    );
    set({ process: { ...proc, mappings: updated } });
  },

  updateSourceSampleValue: (sourceField: string, newSample: string) => {
    const proc = get().process;
    if (!proc) return;
    const updated = proc.mappings.map((m) =>
      m.source_field === sourceField
        ? { ...m, source_sample: newSample }
        : m
    );
    set({ process: { ...proc, mappings: updated } });
  },

  updateMapping: async (mappingId: string, newTargetField: string) => {
    const proc = get().process;
    if (!proc) return;
    const updated = proc.mappings.map((m) =>
      m.id === mappingId
        ? {
            ...m,
            target_field: newTargetField,
            status: 'MODIFIED' as const,
            confidence: 0.95,
            confidence_level: 'High' as const,
          }
        : m
    );
    set({ process: { ...proc, mappings: updated } });
  },

  approveMapping: async (mappingId: string) => {
    const proc = get().process;
    if (!proc) return;
    const updated = proc.mappings.map((m) =>
      m.id === mappingId
        ? {
            ...m,
            status: 'ACCEPTED' as const,
            confidence: 1.0,
            confidence_level: 'High' as const,
            approved_by: 'ผู้ดูแลระบบ KKP',
            approved_at: new Date().toISOString(),
          }
        : m
    );
    set({ process: { ...proc, mappings: updated } });
  },

  modifyMapping: async (mappingId: string, updates: Partial<FieldMapping>) => {
    const proc = get().process;
    if (!proc) return;
    const updated = proc.mappings.map((m) =>
      m.id === mappingId ? { ...m, ...updates, status: 'MODIFIED' as const } : m
    );
    set({ process: { ...proc, mappings: updated } });
  },

  exportExcel: async (targetProc?: any) => {
    const isProcessObj = targetProc && typeof targetProc === 'object' && 'file_name' in targetProc;
    const proc = isProcessObj ? targetProc : get().process;
    if (!proc) return;

    try {
      const wb = XLSX.utils.book_new();

      // Determine sheets to export
      const sheetEntries: { sheetName: string; rows: any[]; mappings: any[] }[] = [];

      if (proc.sheetDataMap && Object.keys(proc.sheetDataMap).length > 0) {
        for (const [sname, sdata] of Object.entries(proc.sheetDataMap)) {
          sheetEntries.push({
            sheetName: sname,
            rows: (sdata as any).rows || [],
            mappings: (sdata as any).mappings || proc.mappings || [],
          });
        }
      } else {
        sheetEntries.push({
          sheetName: 'KKP_Standard_Output',
          rows: proc.extractedRecords || [],
          mappings: proc.mappings || [],
        });
      }

      sheetEntries.forEach(({ sheetName, rows, mappings }, sIdx) => {
        const sourceRows = rows.filter((r: any) => !isFootnoteOrNonDataRow(r, 8));

        // Create target column mapping lookup: target_field -> source_field
        const targetToSource: Record<string, string> = {};
        mappings.forEach((m: any) => {
          if (m.target_field && m.source_field && m.source_field !== 'UNMATCHED') {
            targetToSource[m.target_field] = m.source_field;
          }
        });

        // Transform rows strictly into 8 Master Template standard columns with formatTargetValue
        const transformedRows = sourceRows.map((r: any, idx: number) => {
          const getVal = (targetName: string) => {
            // 1. Direct standard key (e.g. from Step 3 confirmed records)
            if (r[targetName] !== undefined && r[targetName] !== null && String(r[targetName]).trim() !== '') {
              const val = typeof r[targetName] === 'object' && 'formattedVal' in r[targetName] ? r[targetName].formattedVal : r[targetName];
              return String(val).trim();
            }
            // 2. Lookup via source column mapping
            const srcCol = targetToSource[targetName];
            if (srcCol && r[srcCol] !== undefined && r[srcCol] !== null && String(r[srcCol]).trim() !== '') {
              const val = typeof r[srcCol] === 'object' && 'formattedVal' in r[srcCol] ? r[srcCol].formattedVal : r[srcCol];
              return String(val).trim();
            }
            return '-';
          };

          const rawFundName = getVal('FUND_NAME');
          const rawFundCode = getVal('FUND_CODE') !== '-' ? getVal('FUND_CODE') : `F${1000 + idx + 1}`;
          const rawTrade = getVal('TRADE_DATE');
          const rawSettle = getVal('SETTLEMENT_DATE');
          const rawCcy = getVal('CURRENCY');
          const rawPrice = getVal('UNIT_PRICE');
          const rawQty = getVal('QUANTITY');
          const rawAmt = getVal('AMOUNT');

          return {
            FUND_NAME: formatTargetValue('FUND_NAME', rawFundName).formattedVal,
            FUND_CODE: formatTargetValue('FUND_CODE', rawFundCode).formattedVal,
            TRADE_DATE: formatTargetValue('TRADE_DATE', rawTrade).formattedVal,
            SETTLEMENT_DATE: formatTargetValue('SETTLEMENT_DATE', rawSettle).formattedVal,
            CURRENCY: formatTargetValue('CURRENCY', rawCcy === '-' ? 'THB' : rawCcy).formattedVal,
            UNIT_PRICE: formatTargetValue('UNIT_PRICE', rawPrice).formattedVal,
            QUANTITY: formatTargetValue('QUANTITY', rawQty).formattedVal,
            AMOUNT: formatTargetValue('AMOUNT', rawAmt).formattedVal,
          };
        });

        const ws = XLSX.utils.json_to_sheet(transformedRows);
        ws['!cols'] = [
          { wch: 36 },
          { wch: 14 },
          { wch: 16 }, // TRADE_DATE (YYYY-MM-DD)
          { wch: 18 }, // SETTLEMENT_DATE (YYYY-MM-DD)
          { wch: 12 },
          { wch: 16 },
          { wch: 16 },
          { wch: 18 },
        ];

        let safeSheetName = sheetName.replace(/[\/\\?*:[\]]/g, '_').slice(0, 31);
        if (!safeSheetName) safeSheetName = `Sheet${sIdx + 1}`;
        XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
      });

      const fileName = `KKP_Standard_${proc.file_name ? proc.file_name.replace(/\.[^/.]+$/, '') : 'Output'}.xlsx`;
      XLSX.writeFile(wb, fileName);
      return;
    } catch (err) {
      console.error('Error generating Excel client-side:', err);
    }
  },

  fetchInitialData: async () => {
    // Load persisted templates and rules from localStorage
    const savedTemplates = getStoredTemplates();
    const savedRules = getStoredRules(get().aiLearnedRules);
    set({ templates: savedTemplates, aiLearnedRules: savedRules });

    try {
      const res = await fetch(`${API_BASE}/processes`);
      if (res.ok) {
        const data: Process[] = await res.json();
        set({ processes: data });
      }
    } catch {
      // Safe offline fallback
    }
  },

  addTemplate: async (template: TargetTemplate) => {
    set((state) => {
      const updated = [template, ...state.templates];
      saveStoredTemplates(updated);
      return { templates: updated };
    });
  },

  updateTemplate: async (id: string, template: TargetTemplate) => {
    set((state) => {
      const updated = state.templates.map((t) => (t.id === id ? template : t));
      saveStoredTemplates(updated);
      return { templates: updated };
    });
  },

  deleteTemplate: async (id: string) => {
    set((state) => {
      const updated = state.templates.filter((t) => t.id !== id);
      saveStoredTemplates(updated);
      return { templates: updated };
    });
  },

  deleteProcess: async (id: string) => {
    try {
      await fetch(`${API_BASE}/processes/${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
    set((state) => ({
      processes: state.processes.filter((p) => p.id !== id),
      process: state.process?.id === id ? null : state.process,
    }));
  },

  updateProcessStep: async (step: number, status?: string) => {
    const proc = get().process;
    if (!proc) return;
    const nextStatus = status || (step === 4 ? 'Completed' : step === 3 ? 'Under Review' : proc.status);
    try {
      const res = await fetch(`${API_BASE}/processes/${proc.id}/step`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, status: nextStatus }),
      });
      if (res.ok) {
        const updated: Process = await res.json();
        set({ process: { ...updated, status: nextStatus, current_step: step }, currentStep: step });
        return;
      }
    } catch {
      // fallback
    }
    set({ process: { ...proc, current_step: step, status: nextStatus }, currentStep: step });
  },

  createTemplateFromUpload: async () => {
    const proc = get().process;
    if (!proc || !proc.suggested_template_details) return;

    const newTmpl = proc.suggested_template_details;
    set((state) => ({
      templates: [newTmpl, ...state.templates],
      process: state.process
        ? {
            ...state.process,
            target_template_id: newTmpl.id,
            target_template: newTmpl.name,
            suggested_new_template: false,
          }
        : null,
    }));
  },
}));

function getInitialDemoProcess(fileName?: string, fileSizeStr?: string): Process {
  const name = fileName || 'KKP_Demo_Source_Files.xlsx';
  const size = fileSizeStr || '2.48 MB';
  return {
    id: `process_${Date.now()}`,
    file_name: name,
    file_size: size,
    sheet_count: fileName ? 1 : 1,
    sheets: fileName ? [fileName.replace(/\.[^/.]+$/, "")] : ["MainSheet"],
    row_count: 43,
    column_count: 8,
    target_template_id: 'tmpl_01',
    target_template: 'KKP_CUSTODIAN_TRADE_V2',
    status: 'Analyzed',
    overall_confidence: 0.94,
    created_at: '2026-09-05T09:30:00Z',
    analysis_progress: 100,
    analysis_summary: {
      header_detected: true,
      data_type_detected: true,
      date_format_detected: true,
      currency_detected: 'THB',
      potential_duplicates: 2,
      missing_values: 4,
    },
    mappings: [
      {
        id: 'm1',
        process_id: 'demo-process-01',
        source_field: 'Fund_Name',
        source_sample: 'KKP Short Term Fixed',
        source_data_type: 'ข้อความ (Text)',
        target_field: 'FUND_NAME',
        target_data_type: 'String',
        target_required: true,
        confidence: 0.98,
        confidence_level: 'High',
        status: 'SUGGESTED',
        reasons: ['ชื่อคอลัมน์มีความเหมือนระดับสูงกับฟิลด์เป้าหมาย FUND_NAME', 'ตัวอย่างข้อมูลตรงกับรูปแบบชื่อกองทุนรวม'],
      },
      {
        id: 'm2',
        process_id: 'demo-process-01',
        source_field: 'Fund_Code',
        source_sample: 'F1000',
        source_data_type: 'ข้อความ (Text)',
        target_field: 'FUND_CODE',
        target_data_type: 'String',
        target_required: true,
        confidence: 0.95,
        confidence_level: 'High',
        status: 'SUGGESTED',
        reasons: ['รหัสอ้างอิงตรงกับรูปแบบ FUND_CODE'],
      },
      {
        id: 'm3',
        process_id: 'demo-process-01',
        source_field: 'Trade Date',
        source_sample: '15/07/2026',
        source_data_type: 'วันที่ (Date)',
        target_field: 'TRADE_DATE',
        target_data_type: 'YYYY-MM-DD',
        target_required: true,
        confidence: 0.96,
        confidence_level: 'High',
        status: 'SUGGESTED',
        reasons: ['รูปแบบตัวอย่างข้อมูลตรงกับวันที่มาตรฐาน', 'เป็นคำศัพท์มาตรฐานของการส่งคำสั่งซื้อขาย'],
      },
      {
        id: 'm4',
        process_id: 'demo-process-01',
        source_field: 'Settlement Date',
        source_sample: '17/07/2026',
        source_data_type: 'วันที่ (Date)',
        target_field: 'SETTLEMENT_DATE',
        target_data_type: 'YYYY-MM-DD',
        target_required: true,
        confidence: 0.94,
        confidence_level: 'High',
        status: 'SUGGESTED',
        reasons: ['วันที่ชำระราคามาตรฐาน'],
      },
      {
        id: 'm5',
        process_id: 'demo-process-01',
        source_field: 'CCY',
        source_sample: 'THB',
        source_data_type: 'ข้อความ (Text)',
        target_field: 'CURRENCY',
        target_data_type: 'ISO 4217',
        target_required: true,
        confidence: 0.99,
        confidence_level: 'High',
        status: 'SUGGESTED',
        reasons: ['ค่าตัวอย่างเป็นรหัสสกุลเงินมาตรฐานสากล ISO 4217', 'CCY เป็นคำย่อมาตรฐานทางตัวแทนสถาบันการเงิน'],
      },
      {
        id: 'm6',
        process_id: 'demo-process-01',
        source_field: 'NAV',
        source_sample: '14.1718',
        source_data_type: 'ตัวเลข (Number)',
        target_field: 'UNIT_PRICE',
        target_data_type: 'Decimal(18,4)',
        target_required: true,
        confidence: 0.87,
        confidence_level: 'Medium',
        status: 'SUGGESTED',
        reasons: [
          'ตัวอย่างข้อมูลเป็นตัวเลขทศนิยม (14.1718)',
          'คำว่า "NAV" (Net Asset Value) นิยมใช้แทนราคาต่อหน่วยในธุรกิจกองทุนรวม',
          'รูปแบบตัวเลขตรงกับทศนิยม Decimal(18,4)',
        ],
      },
      {
        id: 'm7',
        process_id: 'demo-process-01',
        source_field: 'Qty',
        source_sample: '2,500',
        source_data_type: 'ตัวเลข (Number)',
        target_field: 'QUANTITY',
        target_data_type: 'Decimal(18,4)',
        target_required: true,
        confidence: 0.94,
        confidence_level: 'High',
        status: 'SUGGESTED',
        reasons: ['รูปแบบข้อมูลเป็นตัวเลขนับจำนวนหน่วย', 'หัวข้อ Qty เป็นตัวย่อสากลของ QUANTITY'],
      },
      {
        id: 'm8',
        process_id: 'demo-process-01',
        source_field: 'Amount',
        source_sample: '35,429.50',
        source_data_type: 'ตัวเลข (Number)',
        target_field: 'AMOUNT',
        target_data_type: 'Decimal(18,2)',
        target_required: true,
        confidence: 0.91,
        confidence_level: 'High',
        status: 'SUGGESTED',
        reasons: ['ตัวอย่างข้อมูลเป็นมูลค่าจำนวนเงิน', 'ฟิลด์เป้าหมายต้องการ Decimal(18,2)'],
      },
    ],
    previews: [
      { source_value: '15/07/2026', target_value: '2026-07-15', transformation: 'ปรับรูปแบบวันที่มาตรฐาน (YYYY-MM-DD)' },
      { source_value: 'THB', target_value: 'THB', transformation: 'จัดรหัสสกุลเงินมาตรฐาน ISO 4217' },
      { source_value: '14.1718', target_value: '14.1718', transformation: 'คงค่าทศนิยม 4 ตำแหน่ง Decimal(18,4)' },
      { source_value: '2,500', target_value: '2500.0000', transformation: 'จัดรูปแบบตัวเลขจำนวนหน่วยมาตรฐาน' },
    ],
    validation: {
      total_records: 42,
      valid_count: 32,
      warning_count: 8,
      error_count: 2,
      categories: [
        { name: 'ค้นหาหัวแถว (Dynamic Header)', passed: true, detail: 'ตรวจพบหัวแถวอัตโนมัติในบรรทัดที่ 4 (Header Found Row #4)' },
        { name: 'ตรวจสอบประเภท & ความยาวตัวอักษร', passed: true, detail: 'ตรวจสอบ Format ตัวเลข/ข้อความ (หากรูปแบบผิด ปรับลดความเชื่อมั่น < 70%)' },
        { name: 'ตรวจสอบวันที่ (พ.ศ. / ค.ศ.)', passed: true, detail: 'วิเคราะห์รูปแบบ พ.ศ. และ ค.ศ. พร้อมปรับเป็น YYYY-MM-DD สากล' },
        { name: 'ตรวจสอบสกุลเงิน (ISO 4217)', passed: true, detail: 'รองรับทุกสกุลเงินสากล (หากรูปแบบไม่ใช่สกุลเงิน ปรับลดความเชื่อมั่น < 40%)' },
        { name: 'ตรวจสอบข้อมูลขาดหาย (Missing Values)', passed: false, detail: 'Required Field ขาดหาย ปรับ 0% / Optional Field ขาดหาย ปรับ 20%' },
        { name: 'ตรวจสอบแถวซ้ำซ้อน (Exact Row Duplicates)', passed: false, detail: 'ซ้ำเป๊ะทุก Column ปรับความเชื่อมั่น 20% / คอลัมน์ซ้ำปรับ 10%' },
      ],
      details: [
        {
          row: 45,
          field: 'ทุกคอลัมน์ (All Columns)',
          source_value: 'KKP Property Fund (F1005)',
          expected_format: 'Unique Record',
          ai_transformation: 'ตรวจพบแถวซ้ำซ้อนกับแถวที่ 10 ทุกคอลัมน์เป๊ะ 100% → ปรับลดความเชื่อมั่นเหลือ 20% (Error)',
          status: 'Error',
        },
        {
          row: 46,
          field: 'ทุกคอลัมน์ (All Columns)',
          source_value: 'KKP Global Growth Fund (F1012)',
          expected_format: 'Unique Record',
          ai_transformation: 'ตรวจพบแถวซ้ำซ้อนกับแถวที่ 17 ทุกคอลัมน์เป๊ะ 100% → ปรับลดความเชื่อมั่นเหลือ 20% (Error)',
          status: 'Error',
        },
        {
          row: 8,
          field: 'Fund_Code / CCY / Qty',
          source_value: '(ค่าว่าง)',
          expected_format: 'Required Value',
          ai_transformation: 'พบค่าว่างใน Required Field (Fund_Code, CCY, Qty) → ปรับลดความเชื่อมั่นเหลือ 0% (Warning)',
          status: 'Warning',
        },
        {
          row: 17,
          field: 'Qty',
          source_value: '(ค่าว่าง)',
          expected_format: 'Required Value',
          ai_transformation: 'พบค่าว่างใน Required Field (Qty) → ปรับลดความเชื่อมั่นเหลือ 0% (Warning)',
          status: 'Warning',
        },
        {
          row: 18,
          field: 'Fund_Code / Broker',
          source_value: '(ค่าว่าง)',
          expected_format: 'Required / Optional',
          ai_transformation: 'พบค่าว่างใน Required Field (Fund_Code → 0%) และ Optional Field (Broker → 20%) (Warning)',
          status: 'Warning',
        },
        {
          row: 29,
          field: 'Fund_Code / Qty',
          source_value: '(ค่าว่าง)',
          expected_format: 'Required Value',
          ai_transformation: 'พบค่าว่างใน Required Field (Fund_Code, Qty) → ปรับลดความเชื่อมั่นเหลือ 0% (Warning)',
          status: 'Warning',
        },
      ],
    },
  };
}
