import { CONDITION_SLUGS } from '@/data/conditions';
import { KOOTT_STATIC_PAGES } from '@/data/koottStaticPages';

function backendOrigin() {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
  const withApi = raw || 'http://localhost:5001/api';
  return withApi.replace(/\/?api\/?$/, '') || 'http://localhost:5001';
}

// A real date for <lastmod>, or none (an always-"now" date tells Google nothing).
function realDate(v) {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d : undefined;
}

export default async function sitemap() {
  // Nothing is listed until launch (same NEXT_PUBLIC_ALLOW_INDEXING flag as app/robots.js).
  if (process.env.NEXT_PUBLIC_ALLOW_INDEXING !== 'true') return [];

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://www.koott.in";

  const staticRoutes = [
    "",
    // Routes ported from koott.in — listed at their canonical URL so the
    // aliases (/about, /career, /contact-us) are not submitted twice.
    "/about-us",
    "/book-malayali-psychologists",
    "/counselling",
    "/get-in-touch",
    "/jobs",
    "/online-child-psychologist",
    "/blog",
    "/faq",
    "/events",
    "/events/MyKoott-summer-workshops-2026",
    "/therapy-agreement", 
    "/privacy-policy", 
    "/terms-and-conditions", 
    "/refund-policy"
  ].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      changeFrequency: "monthly",
      priority: route === "" ? 1.0 : route === "/blog" || route === "/online-child-psychologist" ? 0.9 : 0.7,
    })
  );

  async function fetchSlugs(path) {
    try {
      const apiBase = backendOrigin();
      const res = await fetch(`${apiBase}${path}?limit=100`, { next: { revalidate: 600 } });
      if (!res.ok) return [];
      const data = await res.json();
      const items =
        data?.data?.services ||
        data?.data?.assessments ||
        data?.data?.pages ||
        data?.data?.blogs ||
        data?.data?.careers ||
        data?.message?.services ||
        data?.message?.assessments ||
        data?.message?.pages ||
        data?.message?.blogs ||
        data?.services ||
        data?.assessments ||
        data?.pages ||
        data?.blogs ||
        data?.careers ||
        data?.data ||
        [];
      // Each entry keeps its real last-edited date for <lastmod>.
      return (items || [])
        .filter((item) => item?.status === "published" && item?.slug)
        .map((item) => ({ slug: item.slug, lastModified: realDate(item.updated_at || item.published_at) }));
    } catch {
      return [];
    }
  }

  async function fetchPsychologists() {
    try {
      const apiBase = backendOrigin();
      const res = await fetch(`${apiBase}/api/public/psychologists`, { next: { revalidate: 600 } });
      if (!res.ok) return [];
      const data = await res.json();
      const psychologists = 
        data?.data?.psychologists ||
        data?.message?.psychologists ||
        data?.psychologists ||
        [];
      return (psychologists || [])
        .filter((psych) => {
          const name = psych?.name || `${psych?.first_name || ''} ${psych?.last_name || ''}`.trim();
          return name;
        })
        .map((psych) => {
          const name = psych.name || `${psych.first_name || ''} ${psych.last_name || ''}`.trim();
          return name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        });
    } catch {
      return [];
    }
  }

  const [assessmentSlugs, parentingSlugs, blogSlugs, careerSlugs, psychologistSlugs] = await Promise.all([
    fetchSlugs("/api/assessments"),
    fetchSlugs("/api/better-parenting"),
    fetchSlugs("/api/blogs"),
    fetchSlugs("/api/careers"),
    fetchPsychologists(),
  ]);

  const dynamicRoutes = [
    // Condition pages and the ported Wix landing/location pages live at /<slug>
    // (app/[conditionSlug]). /counselling/<slug> only 301s here, so it is not listed.
    ...[...new Set([...CONDITION_SLUGS, ...Object.keys(KOOTT_STATIC_PAGES || {})])].map((slug) => ({
      url: `${baseUrl}/${slug}`,
      changeFrequency: "monthly",
      priority: 0.8,
    })),
    ...assessmentSlugs.map(({ slug, lastModified }) => ({
      url: `${baseUrl}/assessments/${slug}`,
      changeFrequency: "weekly",
      priority: 0.8,
      lastModified,
    })),
    ...parentingSlugs.map(({ slug, lastModified }) => ({
      url: `${baseUrl}/better-parenting/${slug}`,
      changeFrequency: "weekly",
      priority: 0.8,
      lastModified,
    })),
    ...blogSlugs.map(({ slug, lastModified }) => ({
      url: `${baseUrl}/blog/${slug}`,
      changeFrequency: "weekly",
      priority: 0.7,
      lastModified,
    })),
    // Job detail pages, submitted at their canonical /jobs/<slug> URL.
    ...careerSlugs.map(({ slug, lastModified }) => ({
      url: `${baseUrl}/jobs/${slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
      lastModified,
    })),
    ...psychologistSlugs.map((slug) => ({
      url: `${baseUrl}/online-child-psychologist/${slug}`,
      changeFrequency: "monthly",
      priority: 0.9,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
