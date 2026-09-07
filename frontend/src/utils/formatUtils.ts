// Format and data cleansing utilities for KKP Data Transformation

export function isFootnoteOrNonDataRow(row: any, totalHeadersCount: number = 8): boolean {
  if (!row) return true;

  // If row is an array
  if (Array.isArray(row)) {
    const nonNull = row.filter((c) => c !== undefined && c !== null && String(c).trim() !== '');
    if (nonNull.length === 0) return true;

    // A single cell containing legend, remark, footnote, or explanation
    if (nonNull.length === 1) {
      const txt = String(nonNull[0]).trim();
      if (
        /^(amber|red|green|blue|note|remark|legend|disclaimer|source|คำอธิบาย|หมายเหตุ|ที่มา|สีส้ม|สีแดง)/i.test(txt) ||
        txt.includes('intentional missing') ||
        txt.includes('duplicate rows') ||
        (txt.length > 20 && (txt.includes('=') || txt.includes(':') || txt.startsWith('*') || txt.includes('(')))
      ) {
        return true;
      }
    }
    return false;
  }

  // If row is an object
  const values = Object.values(row).filter((v) => v !== undefined && v !== null && String(v).trim() !== '');
  if (values.length === 0) return true;

  if (values.length === 1) {
    const txt = String(values[0]).trim();
    if (
      /^(amber|red|green|blue|note|remark|legend|disclaimer|source|คำอธิบาย|หมายเหตุ|ที่มา|สีส้ม|สีแดง)/i.test(txt) ||
      txt.includes('intentional missing') ||
      txt.includes('duplicate rows') ||
      (txt.length > 20 && (txt.includes('=') || txt.includes(':') || txt.startsWith('*') || txt.includes('(')))
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

export function formatTargetValue(field: string, val: any): { formattedVal: string; ruleDescription: string; wasFormatted: boolean } {
  if (val === undefined || val === null || val === '') {
    return { formattedVal: '-', ruleDescription: 'เว้นว่างตามข้อมูลต้นทาง', wasFormatted: false };
  }
  const strVal = String(val).trim();

  // 1. TRADE_DATE / SETTLEMENT_DATE -> YYYY-MM-DD
  if (field === 'TRADE_DATE' || field === 'SETTLEMENT_DATE') {
    // 1.1 Check if already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(strVal)) {
      return { formattedVal: strVal, ruleDescription: 'คงรูปแบบวันที่เดิม (ISO 8601 YYYY-MM-DD)', wasFormatted: false };
    }

    // 1.2 ISO DateTime string e.g. 2026-07-15T00:00:00.000Z
    if (strVal.includes('T')) {
      const datePart = strVal.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return { formattedVal: datePart, ruleDescription: 'แปลงจาก ISO DateTime เป็น YYYY-MM-DD', wasFormatted: true };
      }
    }

    // 1.3 Excel Serial Number (e.g. 46218)
    const num = Number(strVal);
    if (!isNaN(num) && num > 20000 && num < 70000) {
      const utcDays = Math.floor(num - 25569);
      const dateInfo = new Date(utcDays * 86400 * 1000);
      const y = dateInfo.getUTCFullYear();
      const m = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dateInfo.getUTCDate()).padStart(2, '0');
      const formatted = `${y}-${m}-${d}`;
      return { formattedVal: formatted, ruleDescription: 'แปลงจาก Excel Serial Date เป็น ISO 8601 (YYYY-MM-DD)', wasFormatted: true };
    }

    // 1.4 YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
    const ymdMatch = strVal.match(/^(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})$/);
    if (ymdMatch) {
      let [, y, m, d] = ymdMatch;
      let year = parseInt(y, 10);
      if (year > 2400) year -= 543; // Buddhist Era
      const formatted = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      return { formattedVal: formatted, ruleDescription: 'แปลงเป็น ISO 8601 (YYYY-MM-DD)', wasFormatted: strVal !== formatted };
    }

    // 1.5 YYYYMMDD compact
    const ymdCompact = strVal.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (ymdCompact) {
      let [, y, m, d] = ymdCompact;
      let year = parseInt(y, 10);
      if (year > 2400) year -= 543;
      const formatted = `${year}-${m}-${d}`;
      return { formattedVal: formatted, ruleDescription: 'แปลงจาก YYYYMMDD เป็น ISO 8601 (YYYY-MM-DD)', wasFormatted: true };
    }

    // 1.6 Month names e.g. 15-Jul-2026, 15 Jul 2026, 15-July-2026
    const monthMap: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const textMonthMatch = strVal.match(/^(\d{1,2})[\s\/\.\-]([A-Za-z]{3,9})[\s\/\.\-](\d{2,4})$/);
    if (textMonthMatch) {
      const [, d, mon, y] = textMonthMatch;
      const m = monthMap[mon.slice(0, 3).toLowerCase()];
      if (m) {
        let year = parseInt(y, 10);
        if (year < 100) year += 2000;
        if (year > 2400) year -= 543;
        const formatted = `${year}-${m}-${d.padStart(2, '0')}`;
        return { formattedVal: formatted, ruleDescription: 'แปลงจาก DD-Mon-YYYY เป็น ISO 8601 (YYYY-MM-DD)', wasFormatted: true };
      }
    }

    // 1.7 DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY or DD/MM/YY (2-digit or 4-digit year)
    const dmyMatch = strVal.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})$/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      let year = parseInt(y, 10);
      if (year < 100) {
        year += 2000;
      } else if (year > 2400) {
        year -= 543;
      }
      const formatted = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      return { formattedVal: formatted, ruleDescription: 'แปลงจาก DD/MM/YYYY เป็น ISO 8601 (YYYY-MM-DD)', wasFormatted: true };
    }

    return { formattedVal: strVal, ruleDescription: 'คงรูปแบบวันที่เดิม (ISO 8601)', wasFormatted: false };
  }

  // 2. AMOUNT -> 2 decimals
  if (field === 'AMOUNT') {
    const cleaned = strVal.replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return { formattedVal: formatted, ruleDescription: 'จัดรูปแบบทศนิยม 2 ตำแหน่งคงที่ (Fixed 2 Decimals)', wasFormatted: true };
    }
  }

  // 3. UNIT_PRICE -> 4 decimals
  if (field === 'UNIT_PRICE') {
    const cleaned = strVal.replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
      return { formattedVal: formatted, ruleDescription: 'จัดรูปแบบทศนิยม 4 ตำแหน่ง (Standard 4 Decimals)', wasFormatted: true };
    }
  }

  // 4. QUANTITY -> Clean number
  if (field === 'QUANTITY') {
    const cleaned = strVal.replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      const formatted = num.toLocaleString('en-US', { maximumFractionDigits: 4 });
      return { formattedVal: formatted, ruleDescription: 'แปลงตัวเลขจำนวนหน่วยและตัดอักขระพิเศษ', wasFormatted: strVal !== formatted };
    }
  }

  // 5. CURRENCY -> ISO 4217 Uppercase
  if (field === 'CURRENCY') {
    const upper = strVal.toUpperCase();
    return { formattedVal: upper, ruleDescription: 'แปลงตัวพิมพ์ใหญ่รหัส 3 ตัวอักษร ISO 4217', wasFormatted: strVal !== upper };
  }

  // 6. FUND_CODE -> Uppercase
  if (field === 'FUND_CODE') {
    const upper = strVal.toUpperCase();
    return { formattedVal: upper, ruleDescription: 'แปลงตัวพิมพ์ใหญ่และตัดช่องว่างหน้าหลัง', wasFormatted: strVal !== upper };
  }

  // 7. FUND_NAME -> Trimmed text
  if (field === 'FUND_NAME') {
    return { formattedVal: strVal, ruleDescription: 'ทำความสะอาดข้อความและตัดช่องว่างส่วนเกิน', wasFormatted: false };
  }

  return { formattedVal: strVal, ruleDescription: 'จัดรูปแบบตามมาตรฐาน KKP', wasFormatted: false };
}
