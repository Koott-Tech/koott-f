/**
 * Home — built from the design files "Home_Final.pdf" (laptop) and
 * "Home mobile Updated.pdf" (phone). Its copy is static, in
 * data/koottHomeContent.js; nothing is fetched for it.
 *
 * Server component on purpose: `metadata` cannot be exported from a client
 * component. The UI lives in KoottHome, which is a client component because the
 * page has accordions, tabs and carousels, and pulls therapists and posts from
 * the API.
 *
 * The previous build (HomeHero + HomeBody, a port of the live Wix home page) is
 * left in place and unused so the swap is easy to reverse.
 */

import Home2 from '@/components/home2/Home2';
import { buildMetadata, PAGE_SEO, organizationJsonLd, JsonLd } from '@/lib/seo';

export const metadata = buildMetadata(PAGE_SEO.home);

export default function Home() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      {/* Koott 2.0 home (Figma "Home (WIP)"). It carries its own header inside the hero,
          so HeaderWrapper hides the site header on "/". The previous home (KoottHome) is
          still in the repository, unused, so the swap is easy to reverse. */}
      <Home2 />
    </>
  );
}
