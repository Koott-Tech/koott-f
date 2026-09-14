/**
 * Blog category landing pages — koott.in/blog/categories/<slug>.
 *
 * 83 of these are indexed on the live site and every one of them 404'd here.
 * The taxonomy itself is static (it changes when an editor adds a category, not
 * per request), so it lives in data/blogCategories.js; the posts come from the
 * CMS through the same BlogListing the main /blog page uses.
 */

import { notFound } from 'next/navigation';
import BlogListing from '@/components/BlogListing';
import { BLOG_CATEGORY_PAGES, findBlogCategory } from '@/data/blogCategories';

const SITE = 'https://www.koott.in';

export function generateStaticParams() {
  return BLOG_CATEGORY_PAGES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cat = findBlogCategory(slug);
  if (!cat) return { title: { absolute: 'Category not found | Koott' } };

  const title = `${cat.label} | Koott Blog`;
  const description = cat.description
    || `Articles on ${cat.label} from Koott — mental health writing in Malayalam and English.`;
  const url = `${SITE}/blog/categories/${cat.slug}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, type: 'website', siteName: 'Koott',
      images: [{ url: `${SITE}/logo.png`, width: 1200, height: 630, alt: 'Koott' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [`${SITE}/logo.png`] },
  };
}

export default async function BlogCategoryPage({ params }) {
  const { slug } = await params;
  const cat = findBlogCategory(slug);
  if (!cat) notFound();

  return (
    // Header.jsx is position:fixed and reserves no space of its own.
    <div style={{ paddingTop: 64 }}>
      <BlogListing
        initialCategory={cat.label}
        extraSlugs={cat.posts}
        heading={{
          title: cat.label,
          subtitle: 'Mental Health Updates for Kerala',
          intro: cat.description
            || `Everything we have written on ${cat.label}.`,
        }}
      />
    </div>
  );
}
