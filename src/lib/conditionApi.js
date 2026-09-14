/**
 * Reads condition / counselling landing pages out of the CMS.
 *
 * The whole page body lives in counselling_services.content as one object
 * shaped like frontend/src/data/conditionPageTemplateSample.js, so the route
 * only has to fetch the row and hand `content` to ConditionPageTemplate.
 *
 * Menu placement (category, nested group, nav label, order) is read from
 * `content.menu` with the real columns preferred when migration 0004 has been
 * applied — see backend/supabase/migrations/0004_cms_page_content.sql. Reading
 * both means the header works either way.
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/** The API wraps payloads as { success, data: { services: [...] } }. */
function unwrapList(json) {
  const d = json?.data ?? json?.message ?? json;
  return d?.services || d?.counselling || (Array.isArray(d) ? d : []);
}

function unwrapOne(json) {
  const d = json?.data ?? json?.message ?? json;
  return d && typeof d === 'object' && !Array.isArray(d) ? d : null;
}

async function getJson(url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success === false ? null : json;
  } catch (_) {
    // Backend down (or not running during a build) — callers fall back.
    return null;
  }
}

/** Menu placement for one row, whichever way the schema currently stores it. */
export function menuOf(row) {
  const m = row?.content?.menu || {};
  return {
    category: row?.category ?? m.category ?? null,
    group: row?.menu_group ?? m.group ?? null,
    label: row?.menu_label ?? m.label ?? row?.hero_title ?? row?.slug ?? '',
    order: row?.menu_order ?? m.order ?? 0,
    slug: row?.slug,
  };
}

/** Every published condition page, ordered as the nav orders them. */
export async function fetchConditions() {
  const json = await getJson(`${API}/counselling?limit=200`);
  const rows = unwrapList(json).filter((r) => r?.slug && r?.status === 'published');
  return rows.sort((a, b) => menuOf(a).order - menuOf(b).order);
}

/**
 * The header's three top-level menus, with the nested third level under
 * INDIVIDUAL kept as its own bucket.
 *
 * @returns {{key:string, items:Array, groups:Array<{label:string, items:Array}>}[]}
 */
export function buildMenu(rows) {
  const CATEGORIES = [
    { key: 'individual', label: 'INDIVIDUAL' },
    { key: 'relationship', label: 'RELATIONSHIP' },
    { key: 'sexual', label: 'SEXUAL & INTIMACY' },
  ];

  return CATEGORIES.map(({ key, label }) => {
    const mine = rows.map(menuOf).filter((m) => m.category === key)
      .sort((a, b) => a.order - b.order);

    const items = mine.filter((m) => !m.group);
    const groups = [];
    for (const m of mine.filter((x) => x.group)) {
      let g = groups.find((x) => x.label === m.group);
      if (!g) { g = { label: m.group, items: [] }; groups.push(g); }
      g.items.push(m);
    }
    return { key, label, items, groups };
  });
}

/**
 * Fold the flat columns the admin CMS edits back over the `content` object the
 * page renders.
 *
 * CounsellingPageBuilder writes hero_title, hero_subtext, faqs, types, benefits,
 * info_cards and reviews as their own columns; this template reads them from
 * `content`. Without this merge an editor saves a change, the column updates,
 * the page keeps showing the old copy, and the save looks broken. A column only
 * wins when it actually holds something, so an untouched field never blanks out
 * the imported content.
 */
function applyColumnOverrides(row) {
  const content = row.content;
  const has = (v) => v !== null && v !== undefined && v !== ''
    && !(Array.isArray(v) && v.length === 0);
  const merged = { ...content };

  if (has(row.hero_title) || has(row.hero_subtext) || has(row.hero_image_url)) {
    merged.hero = {
      ...content.hero,
      ...(has(row.hero_title) ? { title: row.hero_title } : {}),
      ...(has(row.hero_subtext) ? { subtitle: row.hero_subtext } : {}),
      ...(has(row.hero_image_url) ? { image: row.hero_image_url } : {}),
    };
  }
  if (has(row.seo_title) || has(row.seo_description)) {
    merged.seo = {
      ...content.seo,
      ...(has(row.seo_title) ? { title: row.seo_title } : {}),
      ...(has(row.seo_description) ? { description: row.seo_description } : {}),
    };
  }

  // Section item lists, each stored flat under a differently named column.
  const sections = [
    ['faqs', null],                       // faqs is a bare array on `content`
    ['types', 'types'],
    ['benefits', 'why'],
    ['info_cards', 'symptoms'],
    ['reviews', 'reviews'],
  ];
  for (const [column, section] of sections) {
    if (!has(row[column])) continue;
    if (!section) { merged.faqs = row[column]; continue; }
    merged[section] = { ...content[section], items: row[column] };
  }

  return merged;
}

/** One condition page by slug, or null when there is no published row. */
export async function fetchCondition(slug) {
  const json = await getJson(`${API}/counselling/${encodeURIComponent(slug)}`);
  const row = unwrapOne(json);
  if (!row || !row.content) return null;
  if (row.status && row.status !== 'published') return null;
  return { ...row, content: applyColumnOverrides(row) };
}

export { API as CONDITION_API_BASE };
