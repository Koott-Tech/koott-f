/**
 * Visitor country and city for Koott's own analytics, from Vercel's edge
 * location headers — the IP address itself is never read, stored or returned.
 * Called once per visit by src/analytics/identity.js; locally (no Vercel
 * headers) it answers nulls and the backend falls back to the browser time zone.
 */
export const dynamic = 'force-dynamic';

const clean = (v, max) => {
  if (!v) return null;
  let s = v;
  try { s = decodeURIComponent(v); } catch (_) { /* keep raw */ }
  s = s.trim();
  return s && s.length <= max && /^[\p{L}\p{M} .'’-]+$/u.test(s) ? s : null;
};

export function GET(request) {
  const h = request.headers;
  const country = (h.get('x-vercel-ip-country') || '').toUpperCase();
  return Response.json(
    { country: /^[A-Z]{2}$/.test(country) ? country : null, city: clean(h.get('x-vercel-ip-city'), 60) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
