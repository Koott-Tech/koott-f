/**
 * Server-safe therapist lookup by URL slug, so /service-page/<slug> and
 * /book/<slug> can answer a real 404 for an unknown therapist. The slug rule is
 * the same as TherapistProfile's therapistSlug (that module is 'use client', so
 * a server page cannot import from it).
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const slugForTherapist = (t) => `${t.first_name || ''}-${t.last_name || ''}`
  .toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

/**
 * true / false when the therapist list could be read; null when it could not
 * (API down) — callers should render normally then rather than 404 a real page.
 * `loose` also accepts a first-name match, like the profile page does for Wix
 * slugs that carry a middle name.
 */
export async function therapistSlugExists(slug, { loose = false } = {}) {
  try {
    const res = await fetch(`${API}/public/psychologists`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    const d = json?.data ?? json?.message ?? json;
    const list = d?.psychologists || (Array.isArray(d) ? d : []);
    const want = String(slug || '').toLowerCase();
    if (list.some((t) => slugForTherapist(t) === want)) return true;
    if (loose) {
      const first = want.split('-')[0];
      return list.some((t) => slugForTherapist(t).startsWith(first));
    }
    return false;
  } catch {
    return null;
  }
}
