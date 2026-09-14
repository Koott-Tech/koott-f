import CareersListing from '@/components/CareersListing';
import { buildMetadata, PAGE_SEO } from '@/lib/seo';

export const metadata = buildMetadata(PAGE_SEO.careers);

export default function CareerPage() {
  return <CareersListing />;
}

