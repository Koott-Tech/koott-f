/**
 * Condition / counselling landing pages at the top level, matching the live
 * site's URLs — koott.in/depression-treatment, /marital-counseling and the rest
 * of the 45 pages listed in the header menu.
 *
 * Next resolves static segments before dynamic ones, so every real folder under
 * app/ (about-us, blog, admin, …) still wins; this only picks up what is left,
 * and calls notFound() when the slug is not one of ours.
 *
 * These are static. The copy lives in data/conditions/, a file a page in the
 * folder of its header category — the same pages, exported from
 * counselling_services rather than retyped — so the page no
 * longer waits on the API, and a change to it is a commit rather than a form.
 * Blog posts and careers stay in the CMS: those are written continuously by
 * people who should not need a deploy.
 */

import { notFound } from 'next/navigation';
import ConditionPageTemplate from '@/components/ConditionPageTemplate';
import StaticPageTemplate from '@/components/StaticPageTemplate';
import { findConditionPage, CONDITION_SLUGS } from '@/data/conditions';
import { findStaticPage, KOOTT_STATIC_PAGES } from '@/data/koottStaticPages';

// Built at build time now that the content ships with the app. dynamicParams
// stays false so a slug nobody wrote is a 404 rather than a render attempt.
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  const ported = Object.keys(KOOTT_STATIC_PAGES || {});
  return [...new Set([...CONDITION_SLUGS, ...ported])].map((conditionSlug) => ({ conditionSlug }));
}

const SITE = 'https://www.koott.in';

export async function generateMetadata({ params }) {
  const { conditionSlug } = await params;

  // Ported content pages (city landings, /business, /selfhelp …) are a separate
  // set; a condition page wins on a slug clash, as it did when one was a CMS row.
  const stat = findStaticPage(conditionSlug);
  const row = findConditionPage(conditionSlug);
  if (!row && stat) {
    const url = `${SITE}/${conditionSlug}`;
    const title = stat.seo.title || stat.title;
    const description = stat.seo.description || stat.intro || '';
    const image = stat.seo.image || `${SITE}/logo.png`;
    return {
      title: { absolute: title },
      description,
      alternates: { canonical: url },
      openGraph: {
        title, description, url, type: 'website', siteName: 'Koott',
        images: [{ url: image, width: 1200, height: 630, alt: title }],
      },
      twitter: { card: 'summary_large_image', title, description, images: [image] },
    };
  }
  if (!row) return { title: 'Page not found | Koott' };

  const c = row.content || {};
  const title = row.seo_title || c.seo?.title || c.hero?.title || 'Koott';
  const description = row.seo_description || c.seo?.description || '';
  const image = row.og_image || row.cover_image_url || `${SITE}/logo.png`;
  const url = `${SITE}/${conditionSlug}`;

  return {
    // The scraped titles already end in "| Koott"; `absolute` stops the root
    // layout's "%s | Koott" template from appending a second brand.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, type: 'website', siteName: 'Koott',
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function ConditionPage({ params }) {
  const { conditionSlug } = await params;
  const row = findConditionPage(conditionSlug);

  if (!row?.content) {
    const stat = findStaticPage(conditionSlug);
    if (!stat) notFound();
    return (
      // Header.jsx is position:fixed and reserves no space of its own.
      <div style={{ paddingTop: 64 }}>
        <StaticPageTemplate page={stat} />
      </div>
    );
  }

  const data = row.content;

  // MedicalWebPage + FAQPage: the FAQ answers are real copy, so they are worth
  // exposing as structured data rather than leaving them inside the accordion.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalWebPage',
        name: data.seo?.title || data.hero?.title,
        description: data.seo?.description,
        url: `${SITE}/${conditionSlug}`,
        publisher: { '@type': 'Organization', name: 'Koott', url: SITE },
      },
      ...(data.faqs?.length
        ? [{
            '@type': 'FAQPage',
            mainEntity: data.faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header.jsx is position:fixed and reserves no space of its own. */}
      <div style={{ paddingTop: 64 }}>
        <ConditionPageTemplate data={data} />
      </div>
    </>
  );
}
