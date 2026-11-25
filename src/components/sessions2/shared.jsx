'use client';

/**
 * The pieces My sessions, Session details, Refunds and Refund details all use:
 * the icons drawn at the Figma stroke weights, the way this app reads a session
 * out of the server's shapes, and the small bits of formatting the four screens
 * share. Keeping them here means the four screens cannot drift apart.
 */

import { useCallback, useState } from 'react';

/* ── icons (Untitled UI, at the Figma stroke weights) ─────────────────────── */

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const Icon = {
  back: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 15 7.5 10l5-5" {...S} stroke="#1C241F" strokeWidth={2} /></svg>,
  help: <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" {...S} stroke="#1C241F" strokeWidth={2} /><path d="M6.07 6a2 2 0 0 1 3.88.67c0 1.33-2 2-2 2M8 11.33h.01" {...S} stroke="#1C241F" strokeWidth={2} /></svg>,
  chev: <svg viewBox="0 0 18 18" className="s2-chev" aria-hidden="true"><path d="M6.75 4.5 11.25 9l-4.5 4.5" {...S} stroke="#6B746F" /></svg>,
  chevGreen: <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M6.75 4.5 11.25 9l-4.5 4.5" {...S} stroke="#39AC71" /></svg>,
  clock: <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" {...S} stroke="#9CA49F" /><path d="M8 4.67V8l2 1.33" {...S} stroke="#9CA49F" /></svg>,
  copy: <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.33" y="5.33" width="8.67" height="8.67" rx="2" {...S} stroke="#6B746F" strokeWidth={1.33} /><path d="M10.67 5.33V4c0-1.1-.9-2-2-2H4a2 2 0 0 0-2 2v4.67c0 1.1.9 2 2 2h1.33" {...S} stroke="#6B746F" strokeWidth={1.33} /></svg>,
  tick: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" {...S} stroke="#2E7D5A" strokeWidth={1.6} /></svg>,
  refresh: <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3.3 13.3A13 13 0 0 1 25.3 7l3.4 3.3M28.7 4v6.7h-6.7M28.7 18.7A13 13 0 0 1 6.7 25l-3.4-3.3M3.3 28v-6.7H10" {...S} stroke="#39AC71" strokeWidth={2} /></svg>,
  receipt: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.17 2.5v15l2.08-1.67 1.67 1.67 1.67-1.67 1.66 1.67 1.67-1.67 2.08 1.67v-15l-2.08 1.67-1.67-1.67-1.66 1.67-1.67-1.67L6.25 4.17 4.17 2.5Z" {...S} stroke="#2E7D5A" /><path d="m7.5 10 1.67 1.67L12.5 8.33" {...S} stroke="#2E7D5A" /></svg>,
  invoice: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.17 2.5v15l2.08-1.67 1.67 1.67 1.67-1.67 1.66 1.67 1.67-1.67 2.08 1.67v-15l-2.08 1.67-1.67-1.67-1.66 1.67-1.67-1.67L6.25 4.17 4.17 2.5Z" {...S} stroke="#1C241F" /><path d="m7.5 10 1.67 1.67L12.5 8.33" {...S} stroke="#1C241F" /></svg>,
  // status marks: a solid disc with a white glyph, as the design draws them
  done: <svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8" fill="#2E7D5A" /><path d="M5.6 9.2 7.8 11.4 12.4 6.6" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  cancelled: <svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8" fill="#A93534" /><path d="M11.4 6.6 6.6 11.4M6.6 6.6l4.8 4.8" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" /></svg>,
  missed: <svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8" fill="#E48233" /><path d="M9 5.2v4.4" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /><circle cx="9" cy="12.4" r="1" fill="#fff" /></svg>,
  booked: <svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8" fill="#39AC71" /><path d="M9 5.2V9l2.4 1.6" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  star: (on) => (
    <svg viewBox="0 0 22 22" aria-hidden="true">
      <path
        d="M11 2.4l2.65 5.37 5.93.86-4.29 4.18 1.01 5.9L11 15.93l-5.3 2.79 1.01-5.9L2.42 8.63l5.93-.86L11 2.4Z"
        fill={on ? '#F5A524' : 'none'}
        stroke={on ? '#F5A524' : '#CDD3CF'}
        strokeWidth="1.83"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/* ── reading the server's shapes ──────────────────────────────────────────── */

export const nameOf = (p) => [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim();
export const photoOf = (p) => p?.profile_picture_url || p?.cover_image_url || p?.profile_image || '';
export const initials = (n) => (n || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '·';

/** A session's start as a real Date. Times are stored IST; the browser shows them in `tz`. */
export function startOf(session) {
  if (!session?.scheduled_date) return null;
  const date = String(session.scheduled_date).slice(0, 10);
  const time = String(session.scheduled_time || '00:00:00').slice(0, 8);
  const d = new Date(`${date}T${time}+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** A couple's session runs 80 minutes, everything else 50. */
export const minutesOf = (s) => (/couple|marital|relationship/i.test(s?.session_type || '') ? 80 : 50);

/** "Video call · 50 min" — the line under the therapist's name. */
export const kindOf = (s) => `Video call · ${minutesOf(s)} min`;

/**
 * The booking reference the card shows. There is no booking-code column, so this
 * is the session's own id, shortened for reading; the copy button copies the
 * whole id, which is what support can actually look up.
 */
export const refOf = (id) => (id ? String(id).split('-')[0].toUpperCase() : '');

/* ── formatting ───────────────────────────────────────────────────────────── */

export const money = (n, currency = 'INR') => {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v);
};

/** "Mon, 16 Nov · 7:00 PM" in the given zone. */
export function whenOf(date, tz, withYear = false) {
  if (!date) return '';
  const day = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, weekday: 'short', day: '2-digit', month: 'short', ...(withYear ? { year: 'numeric' } : {}),
  }).format(date);
  const time = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
  return `${day} · ${time}`;
}

/** "16 Nov 2026" */
export const dayOf = (iso, tz) => (iso
  ? new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
  : '');

/** "16 Nov 2026, 6:12 PM" */
export const stampOf = (iso, tz) => (iso
  ? `${dayOf(iso, tz)}, ${new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso))}`
  : '');

/** Working days, so "expected by" skips weekends the way a bank transfer does. */
export function addWorkingDays(iso, days) {
  if (!iso) return null;
  const d = new Date(iso);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) left -= 1;
  }
  return d;
}

/* ── the status mark on a session card ────────────────────────────────────── */

export function statusOf(session) {
  const s = String(session?.status || '').toLowerCase();
  if (s === 'completed') return { label: 'Completed', icon: Icon.done };
  if (s === 'cancelled' || s === 'canceled') return { label: 'Cancelled', icon: Icon.cancelled };
  if (s === 'no_show' || s === 'no-show' || s === 'noshow' || s === 'missed') return { label: 'No show', icon: Icon.missed };
  if (s === 'rescheduled') return { label: 'Rescheduled', icon: Icon.booked };
  return { label: 'Booked', icon: Icon.booked };
}

/* ── a copy button that shows a tick for a moment ─────────────────────────── */

export function CopyButton({ value, label }) {
  const [done, setDone] = useState(false);
  const copy = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch { /* no clipboard permission — the value is still on screen */ }
  }, [value]);
  return (
    <button type="button" onClick={copy} aria-label={done ? 'Copied' : label}>
      {done ? Icon.tick : Icon.copy}
    </button>
  );
}

/* ── the five stars, readable or clickable ────────────────────────────────── */

export function Stars({ value = 0, onRate, big = false }) {
  return (
    <span className={`s2-stars${big ? ' is-big' : ''}`}>
      {[1, 2, 3, 4, 5].map((n) => (onRate ? (
        <button type="button" key={n} onClick={() => onRate(n)} aria-label={`${n} out of 5`}>
          {Icon.star(n <= value)}
        </button>
      ) : (
        <span key={n} style={{ display: 'flex', width: big ? 32 : 22, height: big ? 32 : 22 }}>{Icon.star(n <= value)}</span>
      )))}
    </span>
  );
}
