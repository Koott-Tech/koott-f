/**
 * Order for the public therapist lists, from /api/public/psychologists/order.
 *   'booking'  /book-malayali-psychologists — the admin's group pattern (A, B, B, C …),
 *              each position the soonest-available therapist of that group
 *   'default'  home page and condition / CMS pages — soonest availability first
 * The endpoint returns only ids and the next free time; group data stays on the server.
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/** → { rank: Map(id -> index), nextAt: Map(id -> ISO | null) }, or null if unavailable. */
export async function fetchTherapistOrder(list = 'default', init = {}) {
  try {
    // Server pages pass { cache: 'no-store' } so the order is never a stale build-time copy.
    const res = await fetch(`${API}/public/psychologists/order?list=${list}`, init);
    if (!res.ok) return null;
    const json = await res.json();
    const order = json?.data?.order || [];
    return {
      rank: new Map(order.map((o, i) => [String(o.id), i])),
      nextAt: new Map(order.map((o) => [String(o.id), o.nextAvailableAt || null])),
    };
  } catch (_) {
    return null;
  }
}

/** Sort items by the fetched order; items it does not know keep their place after the rest. */
export function applyTherapistOrder(items, order, getId = (x) => x.id) {
  if (!order) return items;
  const last = Number.MAX_SAFE_INTEGER;
  return items
    .map((item, i) => ({ item, i, r: order.rank.get(String(getId(item))) ?? last }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map(({ item }) => item);
}
