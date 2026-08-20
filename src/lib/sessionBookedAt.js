function parseIsoFlexible(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    const d = new Date(value < 1e12 ? value * 1000 : value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    const d = new Date(n < 1e12 ? n * 1000 : n);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Client booking instant, not the DB row insert time.
 */
export function sessionBookedAtIso(session) {
  if (!session || typeof session !== 'object') return null;
  return parseIsoFlexible(session.booking_created_at) || parseIsoFlexible(session.created_at);
}

/** UTC calendar booking day — legacy; finance uses IST (see {@link sessionBookingCreatedIstYmd}). */
export function sessionBookingCreatedUtcYmd(session) {
  const raw = sessionBookedAtIso(session);
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** IST calendar booking day — the business day the finance dashboards use. */
export function sessionBookingCreatedIstYmd(session) {
  const raw = sessionBookedAtIso(session);
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d).slice(0, 10);
  } catch {
    return '';
  }
}
