import { notFound } from 'next/navigation';
import CareerDetail from '@/components/CareerDetail';
import { loadJob, jobMetadata } from '@/lib/careerSeo';
import { jobPostingJsonLd, JsonLd } from '@/lib/seo';

export async function generateMetadata({ params }) {
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
