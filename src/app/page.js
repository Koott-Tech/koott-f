/**
 * Home — built from the design file "Koott Website Sep-26 (3).pdf".
 *
 * Server component on purpose: `metadata` cannot be exported from a client
 * component. The UI lives in KoottHome, which is a client component because the
 * page has accordions, tabs and carousels, and pulls therapists and posts from
 * the API.
 *
 * The previous build (HomeHero + HomeBody, a port of the live Wix home page) is
 * left in place and unused so the swap is easy to reverse.
 */

import KoottHome from '@/components/KoottHome';
import { buildMetadata, PAGE_SEO, organizationJsonLd, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata(PAGE_SEO.home);

export default function Home() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      {/* Header.jsx is fixed and reserves no space of its own. */}
      <div style={{ paddingTop: 63 }}>
        <KoottHome />
      </div>
    </>
  );
}
