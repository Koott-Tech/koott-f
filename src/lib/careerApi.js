/**
 * Careers data access.
 *
 * The backend wraps payloads as {success, message, data:{careers, pagination}},
 * so the unwrapping lives here rather than being repeated in each page — the
 * same nesting that silently broke the therapist marquee when it was inlined.
 *
 * Both helpers resolve rather than throw; the pages fall back to sample jobs
 * while the CMS has nothing published.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Published openings. Returns [] on any failure. */
async function list() {
  try {
    const json = await get('/careers');
    const rows = json?.data?.careers || json?.careers
      || (Array.isArray(json?.data) ? json.data : null)
      || (Array.isArray(json) ? json : []);
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    console.error('[careerApi.list]', err);
    return [];
  }
}

/** One opening by slug, or null. Falls back to scanning the list when the
 *  backend exposes no by-slug route. */
async function bySlug(slug) {
  try {
    const json = await get(`/careers/slug/${encodeURIComponent(slug)}`);
    const one = json?.data?.career || json?.data || json?.career || null;
    if (one && one.slug) return one;
  } catch {
    /* fall through to the list scan below */
  }
  const rows = await list();
  return rows.find((r) => r.slug === slug) || null;
}

export const careerApi = { list, bySlug };
export default careerApi;
