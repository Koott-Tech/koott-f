import AboutPage from '@/components/AboutPage';
import { buildMetadata, PAGE_SEO } from '@/lib/seo';

export const metadata = buildMetadata(PAGE_SEO.about);

export default function About() {
  return <AboutPage />;
}

