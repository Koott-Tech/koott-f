import BookMalayaliPsychologists from '@/components/BookMalayaliPsychologists';
import { buildMetadata, PAGE_SEO } from '@/lib/seo';

export const metadata = buildMetadata(PAGE_SEO.therapists);

export default function Page() {
  return <BookMalayaliPsychologists />;
}

