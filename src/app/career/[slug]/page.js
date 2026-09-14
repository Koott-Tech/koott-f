import CareerDetail from '@/components/CareerDetail';
import { loadJob, jobMetadata } from '@/lib/careerSeo';
import { jobPostingJsonLd, JsonLd } from '@/lib/seo';

export async function generateMetadata({ params }) {
  return jobMetadata(params.slug);
}

export default async function JobPage({ params }) {
  const job = await loadJob(params.slug);
  return (
    <>
      {job && <JsonLd data={jobPostingJsonLd(job, `/jobs/${job.slug}`)} />}
      <CareerDetail slug={params.slug} />
    </>
  );
}

