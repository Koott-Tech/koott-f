/**
 * Condition / counselling landing pages at the top level, matching the live
 * site's URLs — koott.in/depression-treatment, /marital-counseling and the rest
 * of the 45 pages listed in the header menu.
 *
 * Next resolves static segments before dynamic ones, so every real folder under
 * app/ (about-us, blog, admin, …) still wins; this only picks up what is left,
 * and calls notFound() when the slug is not a published row in the CMS.
 *
 * The page body comes from counselling_services.content, which is stored in the
 * exact shape ConditionPageTemplate renders.
 */

import { notFound } from 'next/navigation';
import ConditionPageTemplate from '@/components/ConditionPageTemplate';
import StaticPageTemplate from '@/components/StaticPageTemplate';
import { fetchCondition } from '@/lib/conditionApi';
import { findStaticPage } from '@/data/koottStaticPages';

// Rendered per request so a CMS edit shows up immediately. Deliberately no
// generateStaticParams: it would make every build depend on the API being
// reachable, and buys nothing for a page that is already fully dynamic.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

const SITE = 'https://www.koott.in';

export async function generateMetadata({ params }) {
  const { conditionSlug } = await params;

  // Ported content pages (city landings, /business, /selfhelp …) are not in the
  // CMS; they are checked after it so a CMS row always wins on a slug clash.
  const stat = findStaticPage(conditionSlug);
  const row = await fetchCondition(conditionSlug);
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
  const row = await fetchCondition(conditionSlug);

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
