/**
 * Site pages (home, about, FAQ, pricing, footer) are edited in the admin
 * "Pages" section and stored in the `cms` table under a key (site_home, …),
 * read through GET /api/site-config/:key.
 *
 * Every page ships its own copy as the default and merges the stored object
 * over it one top-level section at a time — the same rule as the footer: a
 * stored section replaces the default section; a missing, null or empty-array
 * section keeps the default, so a partial save never blanks the page.
 *
 * Server-safe (no React hooks) so server components can import it; the client
 * hook is in lib/useSiteContent.js.
 */

export const SITE_CONTENT_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export function mergeSiteContent(defaults, stored) {
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return defaults;
  const out = { ...defaults };
  Object.keys(defaults).forEach((key) => {
    const v = stored[key];
    if (v === undefined || v === null) return;
    if (Array.isArray(v) && v.length === 0) return;
    out[key] = v;
  });
  return out;
}

/** The stored object for a key, or null (nothing saved yet / backend unreachable). */
export async function loadStoredSiteContent(key, init) {
  try {
    const res = await fetch(`${SITE_CONTENT_API}/site-config/${key}`, init);
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json?.message ?? json)?.data ?? null;
  } catch (_) {
    return null; // the page keeps its built-in copy
  }
}

/** Server components: stored content merged over defaults (never cached). */
export async function fetchSiteContent(key, defaults) {
  return mergeSiteContent(defaults, await loadStoredSiteContent(key, { cache: 'no-store' }));
}
