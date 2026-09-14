import { notFound } from 'next/navigation';
import BlogArticle from '@/components/BlogArticle';
import { BLOG_SAMPLE_POSTS } from '@/data/blogSampleData';
import { buildMetadata, articleJsonLd, JsonLd, SITE_URL } from '@/lib/seo';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/** Server-side lookup so title/description/OG are in the HTML, not painted in
 *  after hydration. Falls back to the sample posts while the CMS is empty. */
async function loadPost(slug) {
  try {
    const res = await fetch(`${API}/blogs/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const json = await res.json();
      const post = json?.data?.blog || json?.data || json?.blog;
      if (post?.title) return post;
    }
  } catch {
    /* fall through to the sample below */
  }
  return BLOG_SAMPLE_POSTS.find((p) => p.slug === slug) || null;
}

export async function generateMetadata({ params }) {
  const post = await loadPost(params.slug);
  // Called here (before any HTML streams) so an unknown slug answers a real 404.
  if (!post) notFound();
  return buildMetadata({
    title: post.seo_title || `${post.title} | Koott`,
    description: post.seo_description || post.excerpt || '',
    canonical: `/blog/${post.slug}`,
    image: post.featured_image_url || '/logo.png',
    type: 'article',
    publishedTime: post.created_at,
  });
}

export default async function BlogPostPage({ params }) {
  const post = await loadPost(params.slug);
  if (!post) notFound();
  return (
    <>
      {post && <JsonLd data={articleJsonLd(post, `/blog/${post.slug}`)} />}
      <BlogArticle slug={params.slug} />
    </>
  );
}

