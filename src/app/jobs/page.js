import CareersListing from '@/components/CareersListing';
import { buildMetadata, PAGE_SEO } from '@/lib/seo';

export const metadata = buildMetadata(PAGE_SEO.careers);

export default function JobsPage() {
  return (
    <>
      {/* The design has no visible page title; this gives the page its H1. */}
      <h1 className="sr-only">Careers at Koott</h1>
      <CareersListing />
    </>
  );
}

