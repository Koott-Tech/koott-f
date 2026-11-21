/**
 * Payout receipt (freelancer / therapist): numbers, rows from a therapist's sessions, and the
 * PDF on the Koott letterhead. Shared by Finance → Receipts and Finance → Payouts (mark as
 * paid with receipt), so both produce the same receipt. Moved here unchanged from the
 * Receipts page.
 */

// ─── helpers ────────────────────────────────────────────────────────────────

export function fmtReceipt(n, { decimals = true } = {}) {
  const num = parseFloat(n) || 0;
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
}

export function payoutReceiptDateStr(date = new Date()) {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function generateReceiptNo(template) {
  const prefix = template === 'salaryCertificate' ? 'KSC' : 'KTP';
  const storageKey = 'koott_receipt_short_number_state';
  const fallback = () => `${prefix}${String(Math.floor(1000 + Math.random() * 9000)).padStart(4, '0')}`;

  if (typeof localStorage === 'undefined') return fallback();

  try {
    const state = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const counters = state.counters && typeof state.counters === 'object' ? state.counters : {};
    const used = Array.isArray(state.used) ? state.used : [];
    let nextNumber = Math.max(parseInt(counters[prefix] || '122', 10) + 1, 1);
    let receiptNo = `${prefix}${String(nextNumber).padStart(4, '0')}`;

    while (used.includes(receiptNo)) {
      nextNumber += 1;
      receiptNo = `${prefix}${String(nextNumber).padStart(4, '0')}`;
    }

    const nextState = {
      counters: { ...counters, [prefix]: nextNumber },
      used: [receiptNo, ...used].slice(0, 500),
    };
    localStorage.setItem(storageKey, JSON.stringify(nextState));
    return receiptNo;
  } catch (e) {
    console.error('Error generating receipt number', e);
    return fallback();
  }
}

export function compactReceiptNo(value, template = 'payoutReceipt') {
  const prefix = template === 'salaryCertificate' ? 'KSC' : 'KTP';
  const cleaned = String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleaned) return '';
  if (/^(KTP|KSC)\d{1,6}$/.test(cleaned)) return cleaned;
  const digits = cleaned.replace(/\D/g, '').slice(-6);
  if (digits) return `${prefix}${digits.padStart(4, '0')}`;
  return `${prefix}${cleaned.replace(/^(KTP|KSC)/, '').slice(0, 6)}`;
}

export function safeFilePart(value = 'receipt') {
  return String(value || 'receipt')
    .trim()
    .replace(/[^\w.\-() ]+/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'receipt';
}

export function pdfBytesToBase64(pdfBytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < pdfBytes.length; i += chunkSize) {
    const chunk = pdfBytes.slice(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function doctorDisplayName(doctor) {
  const name = [doctor?.first_name, doctor?.last_name].filter(Boolean).join(' ').trim();
  return name || doctor?.name || doctor?.email || 'Doctor';
}

export function normalizeDoctorRecipient(doctor) {
  return {
    id: `doctor:${doctor.id || doctor.email}`,
    psychologistId: doctor.id || '',
    type: 'doctor',
    name: doctorDisplayName(doctor),
    email: doctor.email || '',
    designation: doctor.designation || doctor.title || 'Consultant Psychologist',
    location: doctor.location || doctor.city || 'Calicut, India',
  };
}

export function monthRangeFromDateRaw(dateRaw) {
  const d = dateRaw ? new Date(dateRaw) : new Date();
  const safe = isNaN(d) ? new Date() : d;
  const start = new Date(safe.getFullYear(), safe.getMonth(), 1);
  const end = new Date(safe.getFullYear(), safe.getMonth() + 1, 0);
  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
  };
}

export function monthYearFromDateRaw(dateRaw) {
  const d = dateRaw ? new Date(dateRaw) : new Date();
  const safe = isNaN(d) ? new Date() : d;
  return {
    month: safe.getMonth() + 1,
    year: safe.getFullYear(),
  };
}

export function classifySessionForReceipt(row) {
  const raw = `${row?.session_type || ''} ${row?.package_label || ''}`.toLowerCase();
  const isPackage = !!row?.is_package || raw.includes('package');
  const isCouple = !!row?.is_couple || raw.includes('couple') || raw.includes('cpl');
  const isFollowText = raw.includes('follow') || raw.includes('follow-up') || raw.includes('followup');

  if (isPackage) {
    const isPackageFollowUp = row?.is_package_first_for_client === false ||
      (parseInt(row?.package_session_number, 10) || 1) > 1 ||
      isFollowText;
    return {
      payoutType: isPackageFollowUp ? 'Package Follow Up' : 'Package First Session',
      salaryType: isPackageFollowUp ? 'Package Follow Up' : 'Package First Session',
    };
  }

  if (isCouple) {
    const isFollowUp = row?.is_first_session === false || isFollowText;
    return {
      payoutType: isFollowUp ? 'Couple Follow Up' : 'Couple First Session',
      salaryType: isFollowUp ? 'Couple Follow Up' : 'Couple First Session',
    };
  }

  const isFollowUp = row?.is_first_session === false || isFollowText;
  return {
    payoutType: isFollowUp ? 'Individual Follow Up' : 'Individual First Session',
    salaryType: isFollowUp ? 'Individual Follow Up' : 'Individual First Session',
  };
}

export function buildReceiptRowsFromProfile(profile, template) {
  const payoutPendingTotal = Math.round(parseFloat(profile?.summary?.payout_pending || 0) || 0);
  const completed = (profile?.sessions || []).filter(row => {
    const status = String(row?.status || '').toLowerCase();
    const payoutStatus = String(row?.payout_status || '').toLowerCase();
    const doctorAmount = parseFloat(row?.doctor_amount || 0) || 0;
    return status === 'completed' && payoutStatus === 'pending' && doctorAmount > 0;
  });
  const completedSubtotal = completed.reduce((sum, row) => sum + Math.round(parseFloat(row?.doctor_amount || 0) || 0), 0);
  let receiptSessions = completed;

  if (template === 'payoutReceipt' && payoutPendingTotal > 0 && completedSubtotal > payoutPendingTotal) {
    const overflow = completedSubtotal - payoutPendingTotal;
    const sums = new Map([[0, []]]);
    for (let idx = 0; idx < completed.length; idx += 1) {
      const amount = Math.round(parseFloat(completed[idx]?.doctor_amount || 0) || 0);
      const existing = [...sums.entries()];
      for (const [sum, indices] of existing) {
        const nextSum = sum + amount;
        if (nextSum > overflow || sums.has(nextSum)) continue;
        sums.set(nextSum, [...indices, idx]);
      }
      if (sums.has(overflow)) break;
    }
    const exclude = new Set(sums.get(overflow) || []);
    if (exclude.size > 0) {
      receiptSessions = completed.filter((_, idx) => !exclude.has(idx));
    }
  }

  const grouped = new Map();
  receiptSessions.forEach(row => {
    const type = classifySessionForReceipt(row);
    const unitPrice = Math.round(parseFloat(row?.doctor_amount || 0) || 0);
    const label = template === 'payoutReceipt' ? type.payoutType : type.salaryType;
    const key = `${label}:${unitPrice}`;
    const current = grouped.get(key) || { label, count: 0, unitPrice, amount: 0 };
    current.count += 1;
    current.amount += unitPrice;
    grouped.set(key, current);
  });

  const rows = [...grouped.values()]
    .sort((a, b) => {
      const order = [
        'Individual First Session',
        'Individual Follow Up',
        'Couple First Session',
        'Couple Follow Up',
        'Package First Session',
        'Package Follow Up',
      ];
      return order.indexOf(a.label) - order.indexOf(b.label) || b.unitPrice - a.unitPrice;
    });

  if (template === 'payoutReceipt') {
    const limitedRows = rows.slice(0, 6);
    return limitedRows.map(row => ({
      type: row.label,
      number: String(row.count),
      unitPrice: String(row.unitPrice),
      amount: String(row.amount),
    }));
  }

  return rows.slice(0, 4).map(row => ({
    type: row.label,
    sessions: String(row.count),
    ratePerSession: String(row.unitPrice),
    amount: String(row.amount),
  }));
}

export function capPayoutReceiptRows(rows, capAmount) {
  const cap = Math.round(parseFloat(capAmount || 0) || 0);
  if (!cap || cap <= 0) return rows;

  let remaining = cap;
  return (rows || []).flatMap(row => {
    const amount = Math.round(parseFloat(row.amount || 0) || 0);
    if (!amount || remaining <= 0) return [];
    if (amount <= remaining) {
      remaining -= amount;
      return [row];
    }

    const unitPrice = Math.round(parseFloat(row.unitPrice || 0) || 0);
    const cappedAmount = remaining;
    remaining = 0;
    return [{
      ...row,
      number: unitPrice > 0 ? String(Math.max(1, Math.round(cappedAmount / unitPrice))) : row.number,
      amount: String(cappedAmount),
    }];
  });
}



export const DEFAULT_PAYOUT_RECEIPT_ROWS = [
  { type: 'Individual First Session', number: '1', unitPrice: '1250', amount: '1250' },
  { type: 'Individual Follow Up', number: '2', unitPrice: '900', amount: '1800' },
  { type: '', number: '', unitPrice: '', amount: '' },
  { type: '', number: '', unitPrice: '', amount: '' },
];

export const DEFAULT_PAYOUT_RECEIPT_TYPES = [
  'Individual First Session',
  'Individual Follow Up',
  'Couple First Session',
  'Couple Follow Up',
  'Package First Session',
  'Package Follow Up',
];

export const createDefaultPayoutReceiptData = () => ({
  receiptNo: '',
  dateRaw: new Date().toISOString().split('T')[0],
  date: payoutReceiptDateStr(),
  name: '',
  designation: 'Consultant Psychologist',
  location: 'Calicut, India',
  email: '',
  recipientEmail: '',
  tdsPercent: '10',
  payoutPendingCap: '',
  rows: DEFAULT_PAYOUT_RECEIPT_ROWS.map(r => ({ ...r })),
});

export async function generatePayoutReceiptPDF(data) {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

  const templateBytes = await fetch('/Koott Letterhead - 2026 .pdf').then(r => r.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_H = 842.25;
  const DARK = rgb(0.01, 0.22, 0.16);
  const WHITE = rgb(1, 1, 1);
  const HEADER_HEADING_COLOR = rgb(0.89, 1, 0.89);

  const put = (text, x, yFromTop, opts = {}) => {
    const { size = 12, color = DARK, f = font, align = 'left', maxWidth = null } = opts;
    let str = String(text || '').trim();
    if (!str) return;
    if (maxWidth) {
      while (str.length > 3 && f.widthOfTextAtSize(str, size) > maxWidth) {
        str = str.slice(0, -1);
      }
      if (str !== String(text || '').trim()) str = `${str.slice(0, -3)}...`;
    }
    let drawX = x;
    if (align === 'right') {
      drawX = x - f.widthOfTextAtSize(str, size);
    } else if (align === 'center') {
      drawX = x - (f.widthOfTextAtSize(str, size) / 2);
    }
    page.drawText(str, {
      x: drawX,
      y: PAGE_H - yFromTop,
      size,
      font: f,
      color,
    });
  };

  const rows = (data.rows || []).filter(row =>
    String(row.type || '').trim() ||
    String(row.number || '').trim() ||
    String(row.unitPrice || '').trim() ||
    String(row.amount || '').trim()
  );

  const subtotal = rows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  const tdsPercent = parseFloat(data.tdsPercent);
  const safeTdsPercent = Number.isFinite(tdsPercent) ? tdsPercent : 10;
  const tds = subtotal * (safeTdsPercent / 100);
  const grandTotal = subtotal - tds;

  // Therapist details block
  put(data.name, 78, 268, { size: 13.5, color: HEADER_HEADING_COLOR, maxWidth: 275 });
  put(data.designation, 78, 289, { size: 13, color: HEADER_HEADING_COLOR, maxWidth: 275 });
  put(data.location, 78, 310, { size: 13, color: HEADER_HEADING_COLOR, maxWidth: 275 });
  put(data.email, 78, 337, { size: 12, color: WHITE, maxWidth: 285 });
  put(compactReceiptNo(data.receiptNo, 'payoutReceipt') || data.receiptNo, 435, 261, { size: 10.5, color: HEADER_HEADING_COLOR, maxWidth: 96 });
  put(data.date || payoutReceiptDateStr(), 435, 282, { size: 12.5, color: HEADER_HEADING_COLOR, maxWidth: 100 });

  // Session table
  const denseRows = rows.length > 4;
  const rowYs = denseRows ? [428, 449, 470, 491, 512, 533] : [428, 454, 481, 508, 535, 562];
  rows.slice(0, rowYs.length).forEach((row, idx) => {
    const y = rowYs[idx];
    const number = parseFloat(row.number) || 0;
    const unitPrice = parseFloat(row.unitPrice) || 0;
    const amount = parseFloat(row.amount) || 0;
    put(row.type, 72, y, { size: denseRows ? 10.8 : 12.5, maxWidth: 190 });
    put(number ? fmtReceipt(number, { decimals: false }) : '', 295, y, { size: denseRows ? 10.8 : 12.5, align: 'center' });
    put(unitPrice ? fmtReceipt(unitPrice, { decimals: false }) : '', 416, y, { size: denseRows ? 10.8 : 12.5, align: 'right' });
    put(amount ? fmtReceipt(amount, { decimals: false }) : '', 522, y, { size: denseRows ? 10.8 : 12.5, align: 'right' });
  });

  // Totals block
  put(fmtReceipt(subtotal), 522, 545, { size: 12.5, align: 'right' });
  put(fmtReceipt(tds), 522, 572, { size: 12.5, align: 'right' });
  put(fmtReceipt(grandTotal), 522, 616, { size: 13.5, f: boldFont, align: 'right' });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/** Subtotal, TDS and amount paid — the same sums the receipt PDF prints. */
export function payoutReceiptTotals(data) {
  const rows = (data?.rows || []).filter((row) => String(row.type || '').trim() || String(row.amount || '').trim());
  const subtotal = rows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  const pct = Number.isFinite(parseFloat(data?.tdsPercent)) ? parseFloat(data.tdsPercent) : 10;
  const tds = subtotal * (pct / 100);
  return { rows, subtotal, tdsPercent: pct, tds, total: subtotal - tds };
}

/**
 * Receipt for one therapist's payout — the Receipts page's doctor auto-fill, for a given payout
 * month: their completed, unpaid sessions grouped by type and rate, capped at the payout amount.
 * financeApi is passed in so this file has no app imports.
 */
export async function buildPayoutReceiptForDoctor({ financeApi, psychologistId, month, year, payoutAmount, doctor }) {
  const pad = (n) => String(n).padStart(2, '0');
  const dateFrom = `${year}-${pad(month)}-01`;
  const dateTo = `${year}-${pad(month)}-${pad(new Date(Date.UTC(year, month, 0)).getUTCDate())}`;
  const [profileRes, doctorsRes] = await Promise.all([
    financeApi.getDoctorFinanceProfile(psychologistId, { dateFrom, dateTo, dateBasis: 'scheduled' }),
    doctor?.email ? null : financeApi.getPsychologists().catch(() => null),
  ]);
  const profile = profileRes?.data || profileRes;
  const list = doctorsRes?.data?.psychologists || doctorsRes?.data || [];
  const found = Array.isArray(list) ? list.find((d) => d.id === psychologistId) : null;
  const recipient = normalizeDoctorRecipient({ ...(found || {}), ...(doctor || {}), id: psychologistId });
  const cap = payoutAmount ?? profile?.summary?.payout_pending ?? '';
  const rows = capPayoutReceiptRows(buildReceiptRowsFromProfile(profile, 'payoutReceipt'), cap);
  const base = createDefaultPayoutReceiptData();
  const data = {
    ...base,
    name: recipient.name,
    email: recipient.email,
    recipientEmail: recipient.email,
    designation: recipient.designation,
    location: recipient.location,
    payoutPendingCap: cap,
    rows,
  };
  data.receiptNo = generateReceiptNo('payoutReceipt', data);
  return { data, period: { dateFrom, dateTo }, sessionsCounted: (profile?.sessions || []).length };
}
