import BlogListing from '@/components/BlogListing';
import { buildMetadata, PAGE_SEO } from '@/lib/seo';

export const metadata = buildMetadata(PAGE_SEO.blog);

export default function BlogPage() {
  return <BlogListing />;
}

