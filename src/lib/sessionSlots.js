/**
 * Session slots for the booking UI.
 *
 * The backend cuts slots from each therapist's working hours (individual
 * 50 min, couple 1 h 20 min, a 10-min break after each) and returns them in
 * IST — the only zone the database and dashboards use. These helpers move
 * them into the visitor's own time zone for display, and keep the IST date and
 * time on each slot for booking.
 */

export const IST = 'Asia/Kolkata';
export const SESSION_MINUTES = { individual: 50, couple: 80, psychiatry_15: 15, psychiatry_30: 30 };
export const SESSION_LENGTH_LABEL = {
  individual: '50 min', couple: '1 hr 20 min', psychiatry_15: '15 min', psychiatry_30: '30 min',
};

/** Psychiatrists offer 15/30-min consultations only (no couple sessions). */
export const isPsychiatristRecord = (t) => /psychiatr/i.test(String(t?.designation || ''));

/**
 * package_type -> { kind, sessions }:
 *   'couple_package_6' -> couple × 6, 'psychiatry_15_package_3' -> psychiatry_15 × 3,
 *   'psychiatry_30' -> psychiatry_30 × 1, 'package_3' / 'individual' -> individual.
 */
export function packageKind(p) {
  const t = String(p?.package_type || '').toLowerCase();
  const psychiatry = /^psychiatry_(15|30)/.exec(t);
  const kind = psychiatry ? `psychiatry_${psychiatry[1]}` : t.startsWith('couple') ? 'couple' : 'individual';
  return { kind, sessions: Number(p?.session_count) || 1 };
}

export function clientTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || IST;
  } catch (_) {
    return IST;
  }
}

/** "9:00 AM" | "09:00" | "09:00:00" -> "09:00:00" (null if unreadable) */
export function toTimeOfDay(value) {
  const m = String(value || '').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const period = (m[3] || '').toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  if (h > 23 || Number(m[2]) > 59) return null;
  return `${String(h).padStart(2, '0')}:${m[2]}:00`;
}

/** IST wall-clock date + time -> ISO instant */
export function istToInstant(date, time) {
  const t = toTimeOfDay(time);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) || !t) return null;
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h, mi) - 330 * 60000).toISOString();
}

/** Local Date -> 'YYYY-MM-DD' */
export const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** 'YYYY-MM-DD' -> local Date at midnight (never `new Date('YYYY-MM-DD')`, which is UTC) */
export function fromYmd(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** The calendar day an instant falls on in `tz`, as 'YYYY-MM-DD'. */
export const dayKey = (instant, tz) => new Intl.DateTimeFormat('en-CA', {
  timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(instant));

export const timeLabel = (instant, tz) => new Date(instant)
  .toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' });

export const dateLabel = (instant, tz, options) => new Date(instant)
  .toLocaleDateString('en-GB', { timeZone: tz, ...options });

/** 'Asia/Dubai' -> 'Asia/Dubai · GMT+4' */
export function zoneLabel(tz) {
  try {
    const offset = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value;
    const name = tz.replace(/_/g, ' ');
    return offset ? `${name} · ${offset}` : name;
  } catch (_) {
    return tz;
  }
}

/** Does `tz` currently sit at IST's offset? (then there is nothing to convert) */
export function sameAsIst(tz) {
  const probe = new Date();
  return timeLabel(probe, tz) === timeLabel(probe, IST) && dayKey(probe, tz) === dayKey(probe, IST);
}

/**
 * Free slots between two local days, keyed by the visitor's local day:
 *   { 'YYYY-MM-DD': [{ date, time, startsAt, label }] }
 * `date`/`time` are the IST values to book with; `label` is local.
 * The IST query is padded a day each side, because 9 AM IST on the 1st is
 * still the evening of the 31st in the Americas.
 */
export async function fetchSlots(api, psychologistId, fromKey, toKey, kind, tz) {
  const res = await fetch(
    `${api}/availability/public/psychologist/${psychologistId}/slots`
      + `?startDate=${addDays(fromKey, -1)}&endDate=${addDays(toKey, 1)}&type=${kind}`,
  );
  if (!res.ok) throw new Error(`Slots request failed (${res.status})`);
  const json = await res.json();
  const payload = json?.data ?? json;
  const days = payload?.days || [];

  const map = {};
  days.forEach((day) => (day.slots || []).forEach((s) => {
    const startsAt = s.startsAt || istToInstant(day.date, s.time);
    if (!startsAt) return;
    const key = dayKey(startsAt, tz);
    if (key < fromKey || key > toKey) return;
    (map[key] = map[key] || []).push({ date: day.date, time: s.time, startsAt, label: timeLabel(startsAt, tz) });
  }));
  Object.values(map).forEach((list) => list.sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
  return map;
}
