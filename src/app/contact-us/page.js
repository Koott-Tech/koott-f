import ContactPage from '@/components/ContactPage';
import { buildMetadata, PAGE_SEO } from '@/lib/seo';

export const metadata = buildMetadata(PAGE_SEO.contact);

export default function ContactUs() {
  return <ContactPage />;
}

