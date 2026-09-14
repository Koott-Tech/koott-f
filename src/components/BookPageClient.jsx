'use client';

/**
 * /book/<slug> — the stepped booking journey for one therapist.
 * The steps live in BookingFlow; payment hands off to the existing Razorpay path.
 * (app/book/[slug]/page.js 404s unknown slugs before this renders.)
 */

import { useParams } from 'next/navigation';
import BookingFlow from '@/components/BookingFlow';

export default function BookPageClient() {
  const { slug } = useParams();
  // Header.jsx is fixed and reserves no space of its own.
  return (
    <div style={{ paddingTop: 63 }}>
      <BookingFlow slug={slug} />
    </div>
  );
}
