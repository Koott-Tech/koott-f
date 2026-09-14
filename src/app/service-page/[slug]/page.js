/**
 * /service-page/<slug> — therapist profile. The page itself is the client
 * component ServicePageClient; this server wrapper only answers a real 404 for
 * an unknown therapist (a client-side "not found" message came back as 200).
 */

import { notFound } from 'next/navigation';
import ServicePageClient from '@/components/ServicePageClient';
import { therapistSlugExists } from '@/lib/therapistLookup';

export default async function ServicePage({ params }) {
  // null = list unavailable → render and let the client show its own message
  if ((await therapistSlugExists(params.slug, { loose: true })) === false) notFound();
  return <ServicePageClient />;
}
