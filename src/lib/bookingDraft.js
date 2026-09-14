/**
 * An unfinished booking, kept in this browser only (localStorage) — never sent to
 * the server. BookingFlow saves it as the visitor picks things; the therapist
 * listing shows it as a "Resume your booking" card; paying, or the card's ×,
 * clears it. Only choices are kept (therapist, session type, time, plan, step) —
 * no name, email or phone.
 */

import { dayKey } from './sessionSlots';

const KEY = 'koott_booking_draft';

/**
 * The free time to offer instead of one that was taken or has passed: the nearest to
 * `anchorIso` on the same (local) day, else the nearest in the whole map. For a time
 * that has passed, pass now as the anchor — that gives the soonest free time.
 * `map` is fetchSlots' { 'YYYY-MM-DD': [{ date, time, startsAt, label }] }.
 */
export function nearestFreeSlot(map, anchorIso, tz) {
  const now = Date.now();
  const upcoming = (list) => (list || []).filter((s) => new Date(s.startsAt).getTime() > now);
  const sameDay = upcoming(map?.[dayKey(anchorIso, tz)]);
  const pool = sameDay.length ? sameDay : upcoming(Object.values(map || {}).flat());
  if (!pool.length) return null;
  const anchor = new Date(anchorIso).getTime();
  const gap = (s) => Math.abs(new Date(s.startsAt).getTime() - anchor);
  return pool.reduce((best, s) => (gap(s) < gap(best) ? s : best));
}
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * The saved draft, or null. A time that has already passed is dropped — the draft
 * comes back with `slotPassed` (and the old time as `previousSlot`) so the card and
 * the booking flow can say so, and resumes at the date/time step.
 */
export function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!d?.slug || Date.now() - (d.updatedAt || 0) > MAX_AGE_MS) return null;
    if (d.slot?.startsAt && new Date(d.slot.startsAt) < new Date()) {
      d.previousSlot = d.slot;
      d.slot = null;
      d.slotPassed = true;
      d.step = Math.min(d.step || 0, 1);
    }
    return d;
  } catch (_) {
    return null; // private mode / storage blocked
  }
}

export function saveDraft(draft) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...draft, updatedAt: Date.now() }));
  } catch (_) { /* private mode / storage blocked */ }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch (_) { /* private mode / storage blocked */ }
}
