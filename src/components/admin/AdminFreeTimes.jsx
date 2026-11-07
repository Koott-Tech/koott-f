'use client';

/**
 * AdminFreeTimes — the therapist's real free starts for one day, for admin booking and
 * rescheduling, plus a "Custom time" option.
 *
 * Free starts come from GET /admin/psychologists/:id/availability (utils/sessionSlots
 * on the server): the therapist's working hours cut by this session's length
 * (individual 50 min, couple 1 h 20 min, psychiatry 15 / 30 min) with a 10-min break,
 * minus every session, assessment and live checkout hold — the same list clients
 * book from. `excludeSessionId` counts the session being moved as free.
 *
 * The list is re-read every 30 s and when the tab comes back into view, so a time a
 * client books meanwhile drops out; if it was the one picked, the pick is cleared
 * with a note. "Custom time" shows the caller's own time inputs (children) for
 * off-grid times — the server still refuses any overlap with another booking.
 *
 * Times are IST, `value`/`onChange` use 'HH:MM' (24 h).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi } from '@/lib/backendApi';

const to24 = (label) => {
  const m = String(label || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return String(label || '').slice(0, 5);
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
};

export const kindForPackageType = (packageType, sessionType) => {
  const t = String(packageType || sessionType || '').toLowerCase();
  const p = /psychiatry_(15|30)/.exec(t);
  if (p) return `psychiatry_${p[1]}`;
  return t.includes('couple') ? 'couple' : 'individual';
};

export default function AdminFreeTimes({
  psychologistId, date, kind = 'individual', excludeSessionId = null,
  value = '', onChange, children, customLabel = 'Custom time',
  suggestionsOnly = false, // just the free times as one-click picks under the caller's own time field
}) {
  const [free, setFree] = useState(null);       // ['09:00', ...] once loaded
  const [labels, setLabels] = useState({});     // '09:00' -> '9:00 AM'
  const [err, setErr] = useState('');
  const [custom, setCustom] = useState(false);
  const [lostNote, setLostNote] = useState('');

  const load = useCallback(async (quiet) => {
    if (!psychologistId || !date) { setFree(null); return; }
    if (!quiet) { setFree(null); setErr(''); }
    try {
      const res = await adminApi.getPsychologistAvailabilityForReschedule(
        psychologistId, date, date, { type: kind, excludeSessionId },
      );
      const day = (res?.data?.availability || []).find((d) => d.date === date);
      const list = (day?.available_slots || []).map((l) => ({ l, t: to24(l) }));
      // Merged, so a time that just dropped out can still be named ("7:00 PM") in the note.
      setLabels((prev) => ({ ...prev, ...Object.fromEntries(list.map(({ l, t }) => [t, l])) }));
      setFree(list.map(({ t }) => t));
      setErr('');
    } catch (_) {
      if (!quiet) { setFree([]); setErr('Could not load the free times. Use a custom time or try again.'); }
    }
  }, [psychologistId, date, kind, excludeSessionId]);

  useEffect(() => { setLostNote(''); load(false); }, [load]);

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') load(true); };
    const timer = setInterval(refresh, 30 * 1000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [load]);

  // First list for this day: a time already set that isn't a free start (an off-grid
  // session being edited) opens in custom mode. Later re-reads: a picked free time that
  // has gone was booked by someone else meanwhile — clear it and say so.
  const firstLoad = useRef(true);
  useEffect(() => { firstLoad.current = true; }, [psychologistId, date, kind, excludeSessionId]);
  useEffect(() => {
    if (!free || suggestionsOnly) return;
    const picked = String(value || '').slice(0, 5);
    const gone = picked && !free.includes(picked);
    if (firstLoad.current) {
      firstLoad.current = false;
      if (gone) setCustom(true);
      return;
    }
    if (gone && !custom) {
      setLostNote(`${labels[picked] || picked} is no longer free — it was just booked. Pick another time.`);
      onChange?.('');
    }
  }, [free]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!psychologistId) return <p className="text-sm text-slate-500">Select a therapist first.</p>;
  if (!date) return <p className="text-sm text-slate-500">Select a date first.</p>;

  if (suggestionsOnly) {
    return (
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium text-gray-500">Therapist&apos;s free times that day (IST)</span>
        {free === null ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : free.length ? (
          <div className="flex flex-wrap gap-2">
            {free.map((t) => (
              <button
                key={t} type="button" onClick={() => onChange?.(t)}
                className={`rounded-lg border px-3 py-1 text-xs font-medium ${
                  String(value).slice(0, 5) === t
                    ? 'bg-[#025545] text-white border-[#025545]'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-[#025545]'
                }`}
              >
                {labels[t] || t}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No free times that day in the therapist&apos;s hours.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-600">
          {custom ? 'Custom time (IST)' : 'Available times (IST)'}
        </span>
        <button
          type="button"
          onClick={() => { setCustom((c) => !c); setLostNote(''); if (custom) onChange?.(''); }}
          className="text-xs font-semibold text-[#025545] hover:underline"
        >
          {custom ? 'Show available times' : customLabel}
        </button>
      </div>

      {!custom && (
        free === null ? (
          <p className="text-xs text-gray-400">Loading available times…</p>
        ) : free.length ? (
          <div className="flex flex-wrap gap-2">
            {free.map((t) => (
              <button
                key={t} type="button"
                onClick={() => { setLostNote(''); onChange?.(t); }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  String(value).slice(0, 5) === t
                    ? 'bg-[#025545] text-white border-[#025545]'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-[#025545]'
                }`}
              >
                {labels[t] || t}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            No free times that day in the therapist&apos;s hours.{' '}
            <button type="button" className="font-semibold text-[#025545] hover:underline" onClick={() => setCustom(true)}>
              Set a custom time
            </button>
          </p>
        )
      )}

      {custom && (
        <div className="space-y-2">
          {children}
          <p className="text-[11px] text-amber-700">
            Outside the therapist&apos;s free times. Saving is still refused if it overlaps another booking.
          </p>
        </div>
      )}

      {lostNote && <p className="text-xs font-medium text-rose-600">{lostNote}</p>}
      {err && <p className="text-xs text-rose-600">{err}</p>}
    </div>
  );
}
