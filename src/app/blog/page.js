import BlogListing from '@/components/BlogListing';
import { buildMetadata, PAGE_SEO } from '@/lib/seo';

export const metadata = buildMetadata(PAGE_SEO.blog);

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * The posts, fetched on the server so the first screen of cards is in the HTML.
 * The listing used to paint nothing until it had hydrated and fetched all 144
 * rows itself — about 120KB before anything appeared.
 *
 * Revalidated every five minutes: a blog post published in the admin shows up
 * within that, and meanwhile every visitor is served from the cache.
 */
async function loadPosts() {
  try {
    const res = await fetch(`${API}/blogs?limit=200`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    const rows = json?.data?.blogs || json?.blogs || (Array.isArray(json?.data) ? json.data : null);
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;   // the component falls back to fetching for itself
  }
}

export default async function BlogPage() {
  return <BlogListing initialPosts={await loadPosts()} />;
}
