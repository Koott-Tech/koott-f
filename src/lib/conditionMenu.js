/**
 * The condition menu's data — shared by the server and the browser.
 *
 * app/layout.js fetches it on the server so the header's headings (INDIVIDUAL,
 * RELATIONSHIP, SEXUAL & INTIMACY) are in the first HTML, visible before any script
 * runs; components/ConditionMenu.jsx starts from that and refreshes it in the browser.
 * Kept out of the 'use client' component so the server can call it.
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const CATEGORIES = [
  { key: 'individual', label: 'INDIVIDUAL' },
  { key: 'relationship', label: 'RELATIONSHIP' },
  { key: 'sexual', label: 'SEXUAL & INTIMACY' },
];

/** Menu placement for a row, from the real columns when migration 0004 has run
 *  and from content.menu when it has not. */
export function menuOf(row) {
  const m = (row && row.content && row.content.menu) || {};
  return {
    slug: row.slug,
    category: row.category ?? m.category ?? null,
    group: row.menu_group ?? m.group ?? null,
    label: row.menu_label ?? m.label ?? row.hero_title ?? row.slug,
    order: row.menu_order ?? m.order ?? 0,
  };
}

/** The service rows inside a /counselling or /counselling/menu response. */
export function rowsOf(json) {
  const d = json?.data ?? json?.message ?? json;
  const rows = d?.services || (Array.isArray(d) ? d : []);
  return Array.isArray(rows) ? rows : [];
}

/** Published rows -> categories, each with direct items and nested groups. */
export function shapeMenu(rows) {
  const published = (rows || [])
    .filter((r) => r?.slug && r?.status === 'published')
    .map(menuOf)
    .filter((m) => m.category)
    .sort((a, b) => a.order - b.order);

  return CATEGORIES.map(({ key, label }) => {
    const mine = published.filter((m) => m.category === key);
    const groups = [];
    mine.filter((m) => m.group).forEach((m) => {
      let g = groups.find((x) => x.label === m.group);
      if (!g) { g = { label: m.group, items: [] }; groups.push(g); }
      g.items.push(m);
    });
    return { key, label, items: mine.filter((m) => !m.group), groups };
  }).filter((c) => c.items.length || c.groups.length);
}

/**
 * Server side: the menu for the first HTML. Cached for 5 minutes, and never holds a
 * page up — a slow or unreachable API gives [] and the browser fills the menu in.
 */
export async function fetchConditionMenu() {
  try {
    const res = await fetch(`${API}/counselling/menu`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return [];
    return shapeMenu(rowsOf(await res.json()));
  } catch (_) {
    return [];
  }
}
