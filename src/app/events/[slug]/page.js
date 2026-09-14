import { notFound } from "next/navigation";
import WorkshopEventPageClient from "@/components/events/WorkshopEventPageClient";
import { mergeWorkshopEventCms } from "@/data/workshopEventPageCms";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001/api";

async function fetchEventPageRow(slug) {
  const url = `${BACKEND}/event-pages/public/${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    next: { revalidate: 60 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  if (!json?.success || !json.data) return null;
  return json.data;
}

export async function generateMetadata({ params }) {
  const row = await fetchEventPageRow(params.slug);
  if (!row) {
    return { title: { absolute: "Event | Koott" } };
  }
  const merged = mergeWorkshopEventCms(row.cms_data);
  const title = row.seo_title || merged.hero?.title?.slice(0, 70) || "Event | Koott";
  const description =
    row.seo_description || merged.hero?.body?.slice(0, 160) || "Koott events and workshops.";
  const canonical =
    row.canonical_url || `https://www.koott.in/events/${params.slug}`;
  const image = merged.eventListCard?.imageUrl || merged.heroImageUrl || undefined;
  return {
    // Stored SEO titles already end in "| Koott"; `absolute` stops the root
    // layout's "%s | Koott" template from adding a second, old brand.
    title: { absolute: title },
    description,
    // Indexable only once the site launches (same flag as app/robots.js).
    robots: (() => {
      const allow = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";
      return {
        index: allow,
        follow: allow,
        googleBot: { index: allow, follow: allow, "max-image-preview": "large" },
      };
    })(),
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      siteName: "Koott",
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    alternates: { canonical },
  };
}

export default async function DynamicEventPage({ params }) {
  const row = await fetchEventPageRow(params.slug);
  if (!row) {
    notFound();
  }
  return <WorkshopEventPageClient cms={row.cms_data} />;
}
