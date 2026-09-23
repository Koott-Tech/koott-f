'use client';

/**
 * One date range for the whole dashboard — every report, chart, table and
 * export reads it from here rather than working out its own dates.
 *
 * Dates are IST calendar days, because that is what the reporting functions
 * group by (a day runs 00:00–24:00 Asia/Kolkata). `today` comes from the API so
 * a laptop in another timezone still asks for Koott's today. Nothing here uses
 * the browser's clock except as a fallback.
 *
 * Every preset resolves to explicit from/to dates, which the picker shows, so
 * "Last 7 days" is never ambiguous about whether today is in it. It is: the
 * rolling presets end today, and today is incomplete — the comparison accounts
 * for that (see `compareLabel`).
 */

const pad = (n) => String(n).padStart(2, '0');
const parts = (d) => d.split('-').map(Number);
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const lastDayOf = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export const addDays = (d, n) => {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
export const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000) + 1;

/** The same calendar date a year earlier; 29 Feb becomes 28 Feb. */
export const yearBefore = (d) => {
  const [y, m, day] = parts(d);
  return iso(y - 1, m, Math.min(day, lastDayOf(y - 1, m)));
};

/** Koott's today in IST, for when the API has not answered yet. */
export const istToday = () => new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);

/**
 * Every preset, resolved against `today`. Rolling presets include today; the
 * calendar ones (this month, this year) run to today as well, so both are
 * partial periods and are labelled as such.
 */
export function presets(today) {
  const [y, m] = parts(today);
  const prevY = m === 1 ? y - 1 : y;
  const prevM = m === 1 ? 12 : m - 1;
  return [
    { k: 'today', label: 'Today', from: today, to: today, partial: true },
    { k: 'yesterday', label: 'Yesterday', from: addDays(today, -1), to: addDays(today, -1) },
    { k: 'last7', label: 'Last 7 days', from: addDays(today, -6), to: today, partial: true },
    { k: 'last30', label: 'Last 30 days', from: addDays(today, -29), to: today, partial: true },
    { k: 'last90', label: 'Last 90 days', from: addDays(today, -89), to: today, partial: true },
    { k: 'this_month', label: 'This month', from: iso(y, m, 1), to: today, partial: true },
    { k: 'prev_month', label: 'Previous month', from: iso(prevY, prevM, 1), to: iso(prevY, prevM, lastDayOf(prevY, prevM)) },
    { k: 'this_year', label: 'This year', from: iso(y, 1, 1), to: today, partial: true },
    { k: 'last_year', label: 'Last year', from: iso(y - 1, 1, 1), to: iso(y - 1, 12, 31) },
    { k: 'custom', label: 'Custom range', from: null, to: null },
  ];
}

export const COMPARISONS = [
  { k: 'previous', label: 'Compare: previous period' },
  { k: 'year', label: 'Compare: same period last year' },
  { k: 'none', label: 'Compare: off' },
];

/** The window the range is measured against — the same rule the API applies. */
export function compareWindow(from, to, compare) {
  if (compare === 'year') return { prevFrom: yearBefore(from), prevTo: yearBefore(to) };
  const len = daysBetween(from, to);
  return { prevFrom: addDays(from, -len), prevTo: addDays(from, -1) };
}

/**
 * Resolve a stored selection into the dates to ask for. A custom range is kept
 * as-is (clamped to 400 days, which is the API's limit); anything else is
 * recomputed from today, so a dashboard left open overnight moves with the day.
 */
export function resolve(sel, today) {
  const t = today || istToday();
  const compare = COMPARISONS.some((c) => c.k === sel?.compare) ? sel.compare : 'previous';
  let from;
  let to;
  if (sel?.preset === 'custom' && sel.from && sel.to) {
    [from, to] = sel.from <= sel.to ? [sel.from, sel.to] : [sel.to, sel.from];
    if (daysBetween(from, to) > 400) from = addDays(to, -399);
  } else {
    const p = presets(t).find((x) => x.k === sel?.preset) || presets(t).find((x) => x.k === 'last30');
    from = p.from;
    to = p.to;
  }
  return { preset: sel?.preset || 'last30', from, to, compare, ...compareWindow(from, to, compare) };
}

const fmt = (s, opts = { month: 'short', day: 'numeric' }) => (s
  ? new Date(`${s}T00:00:00Z`).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' })
  : '');

/** "23 Aug – 21 Sept 2026", or one date when the range is a single day. */
export function rangeLabel(from, to) {
  if (!from || !to) return '';
  const full = { month: 'short', day: 'numeric', year: 'numeric' };
  return from === to ? fmt(from, full) : `${fmt(from)} – ${fmt(to, full)}`;
}

/** What the numbers are being compared with, said plainly. */
export function compareLabel(d) {
  if (d.compare === 'none') return 'No comparison';
  const what = d.compare === 'year' ? 'same period last year' : 'previous period';
  return `Compared with the ${what} (${rangeLabel(d.prevFrom, d.prevTo)})`;
}
