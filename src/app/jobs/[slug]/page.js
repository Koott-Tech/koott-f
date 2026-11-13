import { notFound, permanentRedirect } from 'next/navigation';
import CareerDetail from '@/components/CareerDetail';
import { loadJob, jobMetadata } from '@/lib/careerSeo';
import { jobPostingJsonLd, JsonLd } from '@/lib/seo';

// Wix job URLs put an em/en dash in the slug ("client-care-executive-—-full-time");
// ours use plain hyphens. Any such variant is sent permanently to the clean URL.
function cleanSlug(slug) {
  let s = String(slug || '');
  try { s = decodeURIComponent(s); } catch (_) { /* keep as is */ }
  return s.toLowerCase().replace(/[–—]/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
}

async function redirectOldSlug(slug) {
  const clean = cleanSlug(slug);
  if (clean && clean !== slug && (await loadJob(clean))) permanentRedirect(`/jobs/${clean}`);
}

export async function generateMetadata({ params }) {
  if (!(await loadJob(params.slug))) await redirectOldSlug(params.slug);
  // Called here (before any HTML streams) so an unknown slug answers a real 404.
  if (!(await loadJob(params.slug))) notFound();
  return jobMetadata(params.slug);
}

export default async function JobPage({ params }) {
  const job = await loadJob(params.slug);
  if (!job) notFound();
  return (
    <>
      <JsonLd data={jobPostingJsonLd(job, `/jobs/${job.slug}`)} />
      <CareerDetail slug={params.slug} />
    </>
  );
}
