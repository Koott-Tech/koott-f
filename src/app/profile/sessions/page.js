'use client';

/**
 * /profile/sessions — the client's sessions, the Koott 2.0 "My sessions" screen
 * (components/sessions2/Sessions2.jsx).
 *
 * This used to render ClientDashboard, the page built to
 * "koott-client-dashboard (2).html". That page is still served at /dashboard, and
 * is still where reschedule and cancel live, with their 24-hour rules and the
 * popups that explain them — this screen links there rather than keeping a second
 * copy of those rules. ?preview also still belongs to that page.
 *
 * The page this replaced is kept beside it as legacy-page.jsx (not a route — Next
 * only serves page.js).
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ClientDashboard from '@/components/ClientDashboard';
import Sessions2 from '@/components/sessions2/Sessions2';
import { previewFromParams } from '@/lib/dashboardPreview';

function SessionsBody() {
  // ?preview draws the old dashboard from fixtures; it is for looking at that
  // design, so it keeps working here.
  const preview = previewFromParams(useSearchParams());
  if (preview) return <ClientDashboard previewState={preview} />;
  return <Sessions2 />;
}

export default function SessionsPage() {
  return (
    <Suspense fallback={null}>
      <SessionsBody />
    </Suspense>
  );
}
