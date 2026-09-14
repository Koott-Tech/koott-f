/**
 * /plans-pricing — the page body is PricingPage; its copy and plans are edited
 * in the admin "Pages → Pricing" editor (site-config `site_pricing`), merged
 * over the defaults in data/pricingPlans.js on every request.
 */

import PricingPage from '@/components/PricingPage';
import { fetchSiteContent } from '@/lib/siteContent';
import { PRICING_DEFAULTS } from '@/data/pricingPlans';

const SITE = 'https://www.koott.in';

// Read per request so a CMS edit shows up immediately.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: { absolute: 'Plans & Pricing | Koott' },
  description:
    'Online counselling plans from Koott — single sessions from ₹749 and multi-session packages with junior or senior Malayali psychologists.',
  alternates: { canonical: `${SITE}/plans-pricing` },
  openGraph: {
    title: 'Plans & Pricing | Koott',
    description: 'Online counselling plans and packages from Koott.',
    url: `${SITE}/plans-pricing`,
    type: 'website',
    siteName: 'Koott',
    images: [{ url: `${SITE}/logo.png`, width: 1200, height: 630, alt: 'Koott' }],
  },
};

export default async function PlansPricingPage() {
  const content = await fetchSiteContent('site_pricing', PRICING_DEFAULTS);
  return <PricingPage content={content} />;
}
