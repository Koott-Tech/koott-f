/**
 * How a therapist's next free session is written on a card.
 *
 * The time itself costs nothing extra: /public/psychologists/order already
 * answers with nextAvailableAt per therapist, and both the listing and the home
 * page fetch that order anyway. Asking per card meant seven slot requests of
 * ~500ms each (three Supabase round trips apiece) on every load.
 */

import { ymd, addDays } from '@/lib/sessionSlots';

/** "Today, 4:00 PM" · "Tomorrow, 9:30 AM" · "Mon 29 Sep, 9:30 AM" */
export function whenLabel(startsAt, tz) {
  if (!startsAt) return '';
  const zone = tz || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  const when = new Date(startsAt);
  if (Number.isNaN(when.getTime())) return '';
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(when);
  const time = when.toLocaleTimeString('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit' });
  const today = ymd(new Date());
  if (day === today) return `Today, ${time}`;
  if (day === addDays(today, 1)) return `Tomorrow, ${time}`;
  return `${when.toLocaleDateString('en-GB', { timeZone: zone, weekday: 'short', day: 'numeric', month: 'short' })}, ${time}`;
}
