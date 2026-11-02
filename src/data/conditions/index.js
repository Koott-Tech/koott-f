/**
 * The 45 condition pages, as data: one file a page, in the folder of the header
 * category it belongs to.
 *
 *   individual/                  12 pages, plus
 *     other-disorders/            7
 *     other-crisis/               4
 *     other-behaviour/            4
 *   relationship/                 9
 *   sexual-intimacy/              9
 *
 * The folders organise the files only. Every page is served at the top level
 * (/anxiety-treatment) by app/[conditionSlug], matching koott.in's URLs, and all
 * render through ConditionPageTemplate. Their copy was exported from the old
 * counselling_services table on 2026-10-30; a change here is a commit. Blog posts
 * and careers stay in the CMS.
 */
import individual from './individual/index.js';
import relationship from './relationship/index.js';
import sexualIntimacy from './sexual-intimacy/index.js';

export const CONDITION_PAGES = [
  ...individual,
  ...relationship,
  ...sexualIntimacy,
];

/** Slug -> page, built once. */
const BY_SLUG = new Map(CONDITION_PAGES.map((p) => [p.slug, p]));

/** The page for a slug, or null. */
export function findConditionPage(slug) {
  return BY_SLUG.get(String(slug || '').trim().toLowerCase()) || null;
}

/** Every slug, for generateStaticParams. */
export const CONDITION_SLUGS = CONDITION_PAGES.map((p) => p.slug);
