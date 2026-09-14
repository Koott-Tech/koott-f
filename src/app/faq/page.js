/**
 * /faq — the page body is FaqPage; its copy is edited in the admin
 * "Pages → FAQ" editor (site-config `site_faq`, defaults in data/faqContent.js).
 */
import FaqPage from '@/components/FaqPage';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'FAQ | Online Counselling in Malayalam | Koott',
  description:
    'Answers about Koott — booking a Malayali psychologist, session length, rescheduling, fees, packages, refunds and confidentiality.',
  canonical: '/faq',
});

export default function FAQ() {
  return <FaqPage />;
}
