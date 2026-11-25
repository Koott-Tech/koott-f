'use client';

/**
 * /profile/sessions/[id] — one session, the Koott 2.0 "Session details" screen
 * (components/sessions2/SessionDetails2.jsx). My sessions links here from each
 * card's View Details.
 *
 * On Next 14 route params are a plain object, so they are read with useParams
 * rather than React's use().
 */

import { useParams } from 'next/navigation';
import SessionDetails2 from '@/components/sessions2/SessionDetails2';

export default function SessionDetailsPage() {
  const { id } = useParams();
  return <SessionDetails2 sessionId={String(id || '')} />;
}
