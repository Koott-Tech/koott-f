import ContactPage from '@/components/ContactPage';
import { buildMetadata, PAGE_SEO } from '@/lib/seo';

export const metadata = buildMetadata(PAGE_SEO.contact);

export default function GetInTouch() {
  return (
    <>
      {/* The design has no visible page title; this gives the page its H1. */}
      <h1 className="sr-only">Talk to Koott</h1>
      <ContactPage />
    </>
  );
}

