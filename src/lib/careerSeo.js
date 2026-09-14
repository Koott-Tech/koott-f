import { CAREER_SAMPLE_JOBS } from '@/data/careerSampleData';
import { buildMetadata } from '@/lib/seo';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/** The backend exposes no by-slug careers route, so this scans the list.
 *  Falls back to sample roles while the CMS is empty. */
export async function loadJob(slug) {
  try {
    const res = await fetch(`${API}/careers`, { next: { revalidate: 300 } });
    if (res.ok) {
      const json = await res.json();
      const rows = json?.data?.careers || json?.careers || [];
      const job = Array.isArray(rows) ? rows.find((r) => r.slug === slug) : null;
      if (job?.title) return job;
    }
  } catch {
    /* fall through to the sample below */
  }
  return CAREER_SAMPLE_JOBS.find((j) => j.slug === slug) || null;
}

export async function jobMetadata(slug) {
  const job = await loadJob(slug);
  if (!job) {
    return buildMetadata({
      title: 'Role not found | Koott',
      description: 'That opening could not be found.',
      canonical: `/jobs/${slug}`,
      noIndex: true,
    });
  }
  const where = job.location ? ` — ${job.location}` : '';
  return buildMetadata({
    title: `${job.title} | Careers at Koott`,
    description: `Apply for ${job.title}${where} at Koott, Kerala's online mental health platform.`,
    canonical: `/jobs/${job.slug}`,
  });
}
