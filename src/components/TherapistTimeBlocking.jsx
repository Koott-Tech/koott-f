"use client";

/**
 * A therapist blocking their own time, from Settings.
 *
 * Two shapes, because the two things therapists actually need are different:
 *   By date  — "I'm away on the 3rd." One date, gone when it passes.
 *   Weekly   — "I never work Sundays." Repeats for the next six months.
 *
 * Within either, they block the whole day, a range (9 AM to 10 PM), or
 * individual hours that need not sit next to each other.
 *
 * The hours on offer come from the therapist's own working hours, which an
 * admin sets per therapist — not a fixed 8-to-9 list. Offering an hour nobody
 * could book would let them block time that was never bookable, and hiding one
 * they do work would leave it unblockable. Pick several weekdays at once and
 * only the hours common to all of them are offered, since a block applies to
 * each day chosen.
 *
 * Blocks are mirrored into Google Calendar when it is connected. If that fails
 * the block still stands on Koott — that is what governs bookings — and the
 * row says the calendar did not get it.
 *
 * The same panel serves both dashboards. A therapist opens it for themselves
 * and passes no id; an admin opens it for someone and passes theirs, which
 * swaps the endpoints for the /admin ones. Working hours are not editable from
 * either — an admin sets those on the therapists page.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { psychologistApi, adminApi } from "../lib/backendApi";
import {
  CalendarOff, CalendarDays, Repeat, Trash2, Loader2,
  AlertCircle, CheckCircle, Info,
} from "lucide-react";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Today in IST, as YYYY-MM-DD — sessions are scheduled in IST. */
const istToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const dayOfWeekOf = (ymd) => (ymd ? new Date(`${ymd}T12:00:00`).getDay() : null);

const prettyDate = (ymd) => {
  if (!ymd) return '';
  const d = new Date(`${String(ymd).slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? String(ymd) : d.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
};

const labelFor = (value) => {
  const [h, m] = String(value).split(':').map(Number);
  return `${h % 12 || 12}:${String(m || 0).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

/** "09:00" + one hour, for showing a range as the therapist reads it. */
const endLabelFor = (value) => {
  const [h, m] = String(value).split(':').map(Number);
  return labelFor(`${String((h + 1) % 24).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`);
};

/** What a saved block covers, in one line. */
function describeBlock(block) {
  if (block.block_entire_day) return 'Whole day';
  const slots = block.time_slots || [];
  if (slots.length === 0) return 'Whole day';
  const sorted = [...slots].sort();
  const contiguous = sorted.every((s, i) => {
    if (i === 0) return true;
    const prev = Number(sorted[i - 1].split(':')[0]);
    return Number(s.split(':')[0]) === prev + 1;
  });
  if (contiguous && sorted.length > 1) {
    return `${labelFor(sorted[0])} – ${endLabelFor(sorted[sorted.length - 1])}`;
  }
  return sorted.map(labelFor).join(', ');
}

/**
 * The four calls this panel makes, bound either to the signed-in therapist or
 * to the one an admin named.
 */
function apiFor(psychologistId) {
  if (!psychologistId) {
    return {
      options: () => psychologistApi.getBlockingOptions(),
      dates: () => psychologistApi.getDateBlocks(),
      weekly: () => psychologistApi.getRecurringBlocks(),
      addDate: (data) => psychologistApi.addDateBlock(data),
      addWeekly: (data) => psychologistApi.addRecurringBlock(data),
      removeDate: (id) => psychologistApi.deleteDateBlock(id),
      removeWeekly: (id) => psychologistApi.deleteRecurringBlock(id),
    };
  }
  return {
    options: () => adminApi.getBlockingOptions(psychologistId),
    dates: () => adminApi.getDateBlocks(psychologistId),
    weekly: () => adminApi.getRecurringBlocks(psychologistId),
    addDate: (data) => adminApi.addDateBlock(psychologistId, data),
    addWeekly: (data) => adminApi.addRecurringBlock(psychologistId, data),
    removeDate: (id) => adminApi.deleteDateBlock(psychologistId, id),
    removeWeekly: (id) => adminApi.deleteRecurringBlock(psychologistId, id),
  };
}

export default function TherapistTimeBlocking({ calendarConnected = false, psychologistId = null }) {
  const api = useMemo(() => apiFor(psychologistId), [psychologistId]);
  const [mode, setMode] = useState('date');          // 'date' | 'weekly'
  const [options, setOptions] = useState(null);      // per-weekday slots
  const [dateBlocks, setDateBlocks] = useState([]);
  const [weeklyBlocks, setWeeklyBlocks] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // What to block
  const [date, setDate] = useState(istToday());
  const [selectedDays, setSelectedDays] = useState([]);
  const [coverage, setCoverage] = useState('whole');  // 'whole' | 'range' | 'slots'
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [pickedSlots, setPickedSlots] = useState([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [opts, dates, weekly] = await Promise.all([
        api.options(),
        api.dates(),
        api.weekly(),
      ]);
      setOptions(opts?.data || null);
      setDateBlocks(Array.isArray(dates?.data) ? dates.data : []);
      setWeeklyBlocks(Array.isArray(weekly?.data) ? weekly.data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Could not load your blocked time');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  /** The weekdays the current choice covers. */
  const activeDays = useMemo(() => {
    if (mode === 'date') {
      const d = dayOfWeekOf(date);
      return d == null ? [] : [d];
    }
    return selectedDays;
  }, [mode, date, selectedDays]);

  /**
   * Hours on offer: those the therapist works on every day selected. Blocking
   * applies to each chosen day, so an hour only one of them has cannot be part
   * of the same block.
   */
  const availableSlots = useMemo(() => {
    if (!options?.days || activeDays.length === 0) return [];
    const lists = activeDays.map((d) => options.days[d]?.slots || []);
    if (lists.some((l) => l.length === 0)) return [];
    const [first, ...rest] = lists;
    return first.filter((slot) => rest.every((l) => l.some((s) => s.value === slot.value)));
  }, [options, activeDays]);

  // A day off, or days with no hours in common, leaves nothing to pick from.
  const noSlots = activeDays.length > 0 && availableSlots.length === 0;

  useEffect(() => {
    // Drop choices the new day no longer offers, so nothing invisible is sent.
    const valid = new Set(availableSlots.map((s) => s.value));
    setPickedSlots((prev) => prev.filter((v) => valid.has(v)));
    setRangeStart((prev) => (valid.has(prev) ? prev : ''));
    setRangeEnd((prev) => (valid.has(prev) ? prev : ''));
  }, [availableSlots]);

  /** The hours the current choice resolves to. */
  const chosenSlots = useMemo(() => {
    if (coverage === 'whole') return [];
    if (coverage === 'slots') return [...pickedSlots].sort();
    if (!rangeStart || !rangeEnd) return [];
    const values = availableSlots.map((s) => s.value);
    const from = values.indexOf(rangeStart);
    const to = values.indexOf(rangeEnd);
    if (from < 0 || to < 0 || to < from) return [];
    return values.slice(from, to + 1);
  }, [coverage, pickedSlots, rangeStart, rangeEnd, availableSlots]);

  const toggleDay = (d) => setSelectedDays((prev) => (
    prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
  ));

  const toggleSlot = (value) => setPickedSlots((prev) => (
    prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value].sort()
  ));

  const resetChoice = () => {
    setCoverage('whole');
    setRangeStart('');
    setRangeEnd('');
    setPickedSlots([]);
    setSelectedDays([]);
  };

  const validate = () => {
    if (mode === 'date') {
      if (!date) return 'Choose a date';
      if (date < istToday()) return 'That date has already passed';
    } else if (selectedDays.length === 0) {
      return 'Choose at least one day of the week';
    }
    if (coverage === 'whole') return null;
    if (noSlots) return 'You have no working hours on that day, so there is nothing to block';
    if (coverage === 'range' && (!rangeStart || !rangeEnd)) return 'Choose both a start and an end';
    if (chosenSlots.length === 0) return 'Choose at least one time slot, or block the whole day';
    return null;
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) { setError(problem); setSuccess(null); return; }

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const wholeDay = coverage === 'whole';
      const payload = { block_entire_day: wholeDay, time_slots: wholeDay ? null : chosenSlots };
      let unsynced = 0;

      if (mode === 'date') {
        const res = await api.addDate({ ...payload, date });
        if (res?.data && res.data.calendar_synced === false) unsynced += 1;
      } else {
        // One call per weekday: a weekly block is stored per day.
        for (const day of selectedDays) {
          const res = await api.addWeekly({ ...payload, day_of_week: day });
          if (res?.data && res.data.calendar_synced === false) unsynced += 1;
        }
      }

      const what = mode === 'date'
        ? `${prettyDate(date)} is blocked`
        : `${selectedDays.map((d) => DAYS[d]).join(', ')} blocked for the next six months`;
      setSuccess(unsynced > 0 && calendarConnected
        ? `${what}. It did not reach Google Calendar — reconnect it to mirror blocks there.`
        : what);
      resetChoice();
      await load();
    } catch (err) {
      setError(err.message || 'Could not save that block');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (kind, block) => {
    setRemovingId(block.id);
    setError(null);
    setSuccess(null);
    try {
      if (kind === 'date') await api.removeDate(block.id);
      else await api.removeWeekly(block.id);
      setSuccess(kind === 'date'
        ? `${prettyDate(block.date)} is available again`
        : `${DAYS[block.day_of_week]}s are available again`);
      await load();
    } catch (err) {
      setError(err.message || 'Could not remove that block');
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 sm:px-6 py-8 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your blocked time…
      </div>
    );
  }

  const tab = (value, Icon, label) => (
    <button
      key={value}
      type="button"
      onClick={() => { setMode(value); resetChoice(); setError(null); setSuccess(null); }}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-sm rounded-lg border transition-colors ${
        mode === value
          ? 'border-green-600 bg-green-50 text-green-800 font-medium'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  const coverageOption = (value, label) => (
    <label
      key={value}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
        coverage === value ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <input
        type="radio"
        name="coverage"
        className="accent-green-700"
        checked={coverage === value}
        onChange={() => setCoverage(value)}
      />
      {label}
    </label>
  );

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      <p className="text-sm text-gray-700">
        Block time you are not available. Blocked hours disappear from your booking
        page{calendarConnected ? ' and are marked in your Google Calendar' : ''}.
      </p>

      <div className="flex flex-wrap gap-2">
        {tab('date', CalendarDays, 'A specific date')}
        {tab('weekly', Repeat, 'Every week')}
      </div>

      {/* What to block */}
      <div className="space-y-4">
        {mode === 'date' ? (
          <div>
            <label htmlFor="block-date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              id="block-date"
              type="date"
              value={date}
              min={istToday()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
            {date && (
              <p className="mt-1 text-xs text-gray-500">{prettyDate(date)}</p>
            )}
          </div>
        ) : (
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              Days of the week <span className="font-normal text-gray-500">— repeats for the next six months</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {DAYS_SHORT.map((label, d) => {
                const worksThisDay = options?.days?.[d]?.working !== false;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selectedDays.includes(d)
                        ? 'border-green-600 bg-green-50 text-green-800 font-medium'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {label}
                    {!worksThisDay && <span className="ml-1 text-xs text-gray-400">off</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* How much of it */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">How much of it</p>
          <div className="flex flex-wrap gap-2">
            {coverageOption('whole', 'The whole day')}
            {coverageOption('range', 'A time range')}
            {coverageOption('slots', 'Specific hours')}
          </div>
        </div>

        {coverage !== 'whole' && noSlots && (
          <p className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {activeDays.length > 1
              ? 'These days have no working hours in common. Block them separately, or block the whole day.'
              : 'You have no working hours on that day, so there is nothing to block.'}
          </p>
        )}

        {coverage === 'range' && !noSlots && availableSlots.length > 0 && (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="range-from" className="block text-xs text-gray-500 mb-1">From</label>
              <select
                id="range-from"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
              >
                <option value="">Start</option>
                {availableSlots.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="range-to" className="block text-xs text-gray-500 mb-1">Until</label>
              <select
                id="range-to"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
              >
                <option value="">End</option>
                {availableSlots
                  .filter((s) => !rangeStart || s.value >= rangeStart)
                  .map((s) => <option key={s.value} value={s.value}>{endLabelFor(s.value)}</option>)}
              </select>
            </div>
            {chosenSlots.length > 0 && (
              <p className="text-xs text-gray-500 pb-2">
                {chosenSlots.length} hour{chosenSlots.length === 1 ? '' : 's'} blocked
              </p>
            )}
          </div>
        )}

        {coverage === 'slots' && !noSlots && availableSlots.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-2">
              {availableSlots.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggleSlot(s.value)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    pickedSlots.includes(s.value)
                      ? 'border-green-600 bg-green-50 text-green-800 font-medium'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {pickedSlots.length
                ? `${pickedSlots.length} hour${pickedSlots.length === 1 ? '' : 's'} selected`
                : 'Pick one or more hours. They need not be next to each other.'}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarOff className="h-4 w-4" />}
          {isSaving ? 'Blocking…' : 'Block this time'}
        </button>
      </div>

      {error && (
        <p className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </p>
      )}
      {success && (
        <p className="flex items-start gap-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {success}
        </p>
      )}

      {/* What is blocked now */}
      <div className="space-y-4 pt-2 border-t border-gray-200">
        <BlockList
          title="Blocked dates"
          empty="No dates blocked."
          rows={dateBlocks.map((b) => ({
            ...b,
            heading: prettyDate(b.date),
            detail: describeBlock(b),
          }))}
          removingId={removingId}
          onRemove={(b) => handleRemove('date', b)}
        />
        <BlockList
          title="Blocked every week"
          empty="No weekly blocks."
          rows={weeklyBlocks.map((b) => ({
            ...b,
            heading: `Every ${DAYS[b.day_of_week]}`,
            detail: b.blocked_until
              ? `${describeBlock(b)} · until ${prettyDate(b.blocked_until)}`
              : describeBlock(b),
          }))}
          removingId={removingId}
          onRemove={(b) => handleRemove('weekly', b)}
        />
      </div>
    </div>
  );
}

function BlockList({ title, empty, rows, removingId, onRemove }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-900 mb-2">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm text-gray-900 truncate">{row.heading}</p>
                <p className="text-xs text-gray-500 truncate">{row.detail}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(row)}
                disabled={removingId === row.id}
                aria-label={`Unblock ${row.heading}`}
                className="flex-none inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:border-red-300 hover:text-red-700 disabled:opacity-60"
              >
                {removingId === row.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Trash2 className="h-3.5 w-3.5" />}
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
