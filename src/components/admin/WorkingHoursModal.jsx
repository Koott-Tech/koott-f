'use client';

/**
 * Admin: one therapist's weekly working hours (IST). Bookable slots are cut from
 * these hours — individual 50 min, couple 1 h 20 min, 10-min break after each —
 * so a therapist on 8 AM–5 PM only shows slots inside that window, and a night
 * shift can run to 12 AM (midnight). A day can have several shifts; no shift is
 * a day off. Saving rewrites today + the next 3 weeks straight away and the
 * nightly job keeps using these hours. Booked sessions are never changed; any
 * that fall outside the new hours are listed after saving.
 */

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Clock, Loader2, Plus, Trash2, X } from 'lucide-react';
import { adminApi } from '@/lib/backendApi';

const DAYS = [
  ['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'],
  ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday'],
];
const SESSION = { individual: 50, couple: 80 };
const BREAK = 10;
const OPTIONS = Array.from({ length: 49 }, (_, i) => i * 30); // 00:00 … 24:00

const toMin = (t) => {
  const [h, m] = String(t || '').split(':').map(Number);
  return h * 60 + m;
};
const toHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const optionLabel = (min) => {
  if (min === 1440) return '12:00 AM (midnight)';
  const h = Math.floor(min / 60);
  return `${h % 12 || 12}:${String(min % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
const shortTime = (min) => {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'am' : 'pm'}`;
};

/** Session starts the booking page will offer for these shifts. */
const starts = (ranges, length) => ranges.flatMap(({ start, end }) => {
  const out = [];
  for (let s = toMin(start); s + length <= toMin(end); s += length + BREAK) out.push(s);
  return out;
});

function dayProblem(ranges) {
  const sorted = [...ranges].sort((a, b) => toMin(a.start) - toMin(b.start));
  for (let i = 0; i < sorted.length; i += 1) {
    const s = toMin(sorted[i].start);
    const e = toMin(sorted[i].end);
    if (e <= s) return 'A shift must end after it starts.';
    if (e - s < 60) return 'Each shift needs at least 1 hour.';
    if (i > 0 && s < toMin(sorted[i - 1].end)) return 'Two shifts on this day overlap.';
  }
  return '';
}

const everyDay = (fn) => Object.fromEntries(DAYS.map(([k]) => [k, fn(k)]));
const PRESETS = [
  { label: 'Day shift · 8 AM–5 PM, Mon–Sat', build: () => everyDay((k) => (k === 'sun' ? [] : [{ start: '08:00', end: '17:00' }])) },
  { label: 'Night shift · 6 PM–12 AM, every day', build: () => everyDay(() => [{ start: '18:00', end: '24:00' }]) },
  { label: 'Platform default · 8 AM–10 PM', build: () => everyDay(() => [{ start: '08:00', end: '22:00' }]) },
];

function TimeSelect({ value, onChange, min = 0, max = 1440, ariaLabel }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-[#025545] focus:outline-none focus:ring-2 focus:ring-[#025545]/15"
    >
      {OPTIONS.filter((m) => m >= min && m <= max).map((m) => (
        <option key={m} value={toHHMM(m)}>{optionLabel(m)}</option>
      ))}
    </select>
  );
}

export default function WorkingHoursModal({ psychologistId, name, onClose, onSaved }) {
  const [days, setDays] = useState(null);
  const [isCustom, setIsCustom] = useState(false);
  const [columnReady, setColumnReady] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const r = await adminApi.getWorkingHours(psychologistId);
        const d = r?.data ?? r;
        if (off) return;
        setDays(d?.workingHours?.days || everyDay(() => []));
        setIsCustom(Boolean(d?.isCustom));
        setColumnReady(d?.columnReady !== false);
      } catch (e) {
        if (!off) setLoadErr(e?.message || 'Could not load working hours');
      }
    })();
    return () => { off = true; };
  }, [psychologistId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const problems = useMemo(
    () => Object.fromEntries(DAYS.map(([k]) => [k, dayProblem(days?.[k] || [])])),
    [days],
  );
  const invalid = Object.values(problems).some(Boolean);

  const change = (next) => { setDays(next); setResult(null); setSaveErr(''); };
  const setDay = (k, ranges) => change({ ...days, [k]: ranges });
  const setRange = (k, i, patch) => setDay(k, days[k].map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const addShift = (k) => {
    const list = days[k] || [];
    const lastEnd = list.length ? toMin(list[list.length - 1].end) : null;
    const start = lastEnd == null ? 9 * 60 : Math.min(lastEnd + 60, 23 * 60);
    setDay(k, [...list, { start: toHHMM(start), end: toHHMM(Math.min(start + 4 * 60, 1440)) }]);
  };
  const copyMonday = () => change(everyDay(() => (days?.mon || []).map((r) => ({ ...r }))));

  const save = async () => {
    setSaving(true);
    setSaveErr('');
    setResult(null);
    try {
      const r = await adminApi.saveWorkingHours(psychologistId, { days });
      if (r && r.success === false) throw new Error(r.message || 'Could not save working hours');
      setResult(r?.data ?? r);
      setIsCustom(true);
      onSaved?.();
    } catch (e) {
      setSaveErr(e?.message || 'Could not save working hours');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Working hours for ${name || 'therapist'}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <Clock className="h-4 w-4 text-[#025545]" /> Working hours — {name || 'Therapist'}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              India time (IST). Slots are only offered inside these hours: individual 50 min and couple
              1 h 20 min, each followed by a 10-min break. {isCustom ? 'Custom hours are set.' : 'Currently using the platform default (8 AM–10 PM).'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loadErr ? (
          <div className="px-5 py-10 text-center text-sm text-red-600">{loadErr}</div>
        ) : !days ? (
          <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-4 px-5 py-4">
            {!columnReady && (
              <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Run <code className="font-mono">backend/supabase/migrations/0006_psychologist_working_hours.sql</code> in
                  the Supabase SQL editor once — saving is disabled until then.
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => change(p.build())}
                  className="rounded-full border border-[#025545]/25 bg-white px-3 py-1.5 text-xs font-medium text-[#025545] hover:bg-[#025545]/5"
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={copyMonday}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Copy Monday to every day
              </button>
            </div>

            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {DAYS.map(([k, dayName]) => {
                const ranges = days[k] || [];
                const individual = starts(ranges, SESSION.individual);
                const couple = starts(ranges, SESSION.couple);
                return (
                  <div key={k} className="grid gap-2 px-3 py-3 sm:grid-cols-[110px_1fr]">
                    <div className="pt-1.5 text-sm font-medium text-gray-800">{dayName}</div>
                    <div className="space-y-2">
                      {ranges.length === 0 && <div className="pt-1.5 text-sm text-slate-400">Day off</div>}
                      {ranges.map((r, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-2">
                          <TimeSelect
                            value={r.start}
                            max={1380}
                            ariaLabel={`${dayName} shift ${i + 1} start`}
                            onChange={(v) => setRange(k, i, { start: v })}
                          />
                          <span className="text-xs text-slate-400">to</span>
                          <TimeSelect
                            value={r.end}
                            min={60}
                            ariaLabel={`${dayName} shift ${i + 1} end`}
                            onChange={(v) => setRange(k, i, { end: v })}
                          />
                          <button
                            type="button"
                            onClick={() => setDay(k, ranges.filter((_, j) => j !== i))}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remove ${dayName} shift ${i + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <button
                          type="button"
                          onClick={() => addShift(k)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#025545] hover:underline"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add shift
                        </button>
                        {problems[k] ? (
                          <span className="text-xs text-red-600">{problems[k]}</span>
                        ) : ranges.length > 0 && (
                          <span className="text-xs text-slate-500">
                            Individual: {individual.length ? individual.map(shortTime).join(', ') : 'none'}
                            {' · '}Couple: {couple.length ? couple.map(shortTime).join(', ') : 'none'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {saveErr && <div className="text-sm text-red-600">{saveErr}</div>}

            {result && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <div className="flex items-center gap-1.5 font-medium">
                  <Check className="h-4 w-4" /> {result.message || 'Working hours saved'}
                </div>
                {result.conflicts?.length > 0 ? (
                  <div className="mt-2 text-xs text-amber-800">
                    <div className="font-semibold">
                      {result.conflicts.length} booked session{result.conflicts.length > 1 ? 's are' : ' is'} outside the new hours.
                      They are kept as booked — reschedule them if needed:
                    </div>
                    <ul className="mt-1 list-disc pl-5">
                      {result.conflicts.map((c) => (
                        <li key={c.sessionId}>{c.date} at {c.time} IST — {c.clientName || 'Client'} ({c.status})</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-1 text-xs">No existing bookings fall outside these hours.</div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-slate-500">
            Saving replaces the hours on today and the next 3 weeks, including days the therapist edited by hand.
          </p>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Close
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!days || invalid || saving || !columnReady}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#025545] px-4 py-2 text-sm font-medium text-white hover:bg-[#012f23] disabled:opacity-40"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save hours
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
