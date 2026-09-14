/**
 * Blog data access.
 *
 * The backend wraps its payloads as {success, message, data:{blogs, pagination}}
 * for the list and {success, data:{blog}} for a single post, so the unwrapping
 * lives here rather than being repeated (and mis-repeated) in each page.
 *
 * Both helpers resolve to a safe value rather than throwing — the pages fall
 * back to sample content when the CMS has nothing published yet.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Published posts, newest first. Returns [] on any failure. */
async function list() {
  try {
    // The list now honours `limit` (default 10) and returns card fields only.
    const json = await get('/blogs?limit=200');
    const rows = json?.data?.blogs || json?.blogs
      || (Array.isArray(json?.data) ? json.data : null)
      || (Array.isArray(json) ? json : []);
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    console.error('[blogApi.list]', err);
    return [];
  }
}

/** One post by slug, or null if missing/unreachable. */
async function bySlug(slug) {
  try {
    const json = await get(`/blogs/slug/${encodeURIComponent(slug)}`);
    return json?.data?.blog || json?.data || json?.blog || null;
  } catch (err) {
    console.error('[blogApi.bySlug]', err);
    return null;
  }
}

export const blogApi = { list, bySlug };
export default blogApi;
