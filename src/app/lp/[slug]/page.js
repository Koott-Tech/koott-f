/**
 * /lp/[slug] — the ad landing pages, built to the Koott 2.0 Figma file, section
 * "Landing Page (WIP)", screen "Anxiety landing · v2" (7963:27756).
 *
 * This is where paid traffic arrives, which is why it is a route of its own:
 *   /lp/anxiety-treatment      the landing page an ad points at
 *   /anxiety-treatment         the specialisation page people and search find
 *
 * The two say the same things because they draw the same copy from
 * data/conditions/, but they are not the same page. The specialisation pages keep
 * ConditionPageTemplate and their own design; nothing here touches them.
 *
 * **Not indexed.** It would otherwise compete with the specialisation page for
 * the same words and split their ranking, which is the usual reason an ad
 * landing page is kept out of search. Ads do not need it indexed to work.
 *
 * Static, like its sibling: the copy ships with the app, so a slug nobody wrote
 * is a 404 rather than a render attempt.
 */

import { notFound } from 'next/navigation';
import Landing2 from '@/components/landing2/Landing2';
import { findConditionPage, CONDITION_SLUGS } from '@/data/conditions';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return CONDITION_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const row = findConditionPage(slug);
  if (!row) return { title: 'Page not found | Koott', robots: { index: false, follow: false } };

  const c = row.content || {};
  return {
    title: { absolute: row.seo_title || c.seo?.title || c.hero?.title || 'Koott' },
    description: row.seo_description || c.seo?.description || '',
    // No canonical to itself: the specialisation page is the one that should rank.
    alternates: { canonical: `https://www.koott.in/${slug}` },
    robots: { index: false, follow: true },
  };
}

export default async function AdLandingPage({ params }) {
  const { slug } = await params;
  const row = findConditionPage(slug);
  if (!row?.content) notFound();
  return <Landing2 page={row} />;
}
