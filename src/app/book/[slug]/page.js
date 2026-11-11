/**
 * /book/<slug> — booking journey. The page itself is the client component
 * BookPageClient; this server wrapper only answers a real 404 for an unknown
 * therapist (BookingFlow matches the slug exactly, so no loose match here).
 */

import { notFound } from 'next/navigation';
import BookPageClient from '@/components/BookPageClient';
import { therapistSlugExists } from '@/lib/therapistLookup';

// Built once per therapist and kept for 5 minutes (it was rebuilt on every visit).
export const revalidate = 300;
export async function generateStaticParams() { return []; }

export default async function BookPage({ params }) {
  // null = list unavailable → render and let BookingFlow show its own message
  if ((await therapistSlugExists(params.slug)) === false) notFound();
  return <BookPageClient />;
}
