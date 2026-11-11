/**
 * /service-page/<slug> — therapist profile. The page itself is the client
 * component ServicePageClient; this server wrapper only answers a real 404 for
 * an unknown therapist (a client-side "not found" message came back as 200).
 */

import { notFound } from 'next/navigation';
import ServicePageClient from '@/components/ServicePageClient';
import { therapistSlugExists } from '@/lib/therapistLookup';

// Built once per therapist and kept for 5 minutes (it was rebuilt on every visit).
export const revalidate = 300;
export async function generateStaticParams() { return []; }

export default async function ServicePage({ params }) {
  // null = list unavailable → render and let the client show its own message
  if ((await therapistSlugExists(params.slug, { loose: true })) === false) notFound();
  return <ServicePageClient />;
}
