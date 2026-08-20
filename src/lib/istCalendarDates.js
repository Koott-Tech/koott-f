/**
 * Indian booking analytics use Asia/Kolkata calendar days for display.
 * Use these helpers for `/finance` (and compatible admin views) so ranges and API
 * params all agree on the same business day.
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const IST_TIMEZONE = 'Asia/Kolkata';

/** YYYY-MM-DD in IST for a Date/instant. */
export function formatIstCalendarYmd(dateLike) {
  if (dateLike == null || dateLike === '') return '';
  const d = dayjs(dateLike);
  if (!d.isValid()) return '';
  return d.tz(IST_TIMEZONE).format('YYYY-MM-DD');
}

/** Start/end `Date`s for IST month containing `anchor` (finance default range). */
export function istCalendarMonthBounds(anchor = new Date()) {
  const d = dayjs(anchor).tz(IST_TIMEZONE);
  if (!d.isValid()) {
    const z = dayjs.unix(0).tz(IST_TIMEZONE);
    return { from: z.toDate(), to: z.toDate() };
  }
  return {
    from: d.startOf('month').toDate(),
    to: d.endOf('month').toDate(),
  };
}

/** Monday-start week in IST containing `anchor`. */
export function istWeekMondayBounds(anchor = new Date()) {
  const base = dayjs(anchor).tz(IST_TIMEZONE);
  if (!base.isValid()) return { from: new Date(), to: new Date() };
  let cur = base.startOf('day');
  const dow = cur.day();
  const delta = dow === 0 ? -6 : 1 - dow;
  cur = cur.add(delta, 'day');
  const from = cur.startOf('day');
  const to = from.add(6, 'day').endOf('day');
  return { from: from.toDate(), to: to.toDate() };
}

export function istYearBounds(anchor = new Date()) {
  const d = dayjs(anchor).tz(IST_TIMEZONE);
  if (!d.isValid()) {
    const z = dayjs.unix(0).tz(IST_TIMEZONE);
    return { from: z.toDate(), to: z.toDate() };
  }
  return {
    from: d.startOf('year').toDate(),
    to: d.endOf('year').toDate(),
  };
}
