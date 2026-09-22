'use client';

/**
 * /profile/sessions — the client's sessions, the dashboard built to
 * "koott-client-dashboard (2).html" (components/ClientDashboard.jsx). Every link
 * in the app points here, so this is where the design lives; /dashboard renders
 * the same component at its own URL.
 *
 * ?preview brings up the prototype's state switch and draws the page from
 * fixtures (lib/dashboardPreview) instead of this client's own sessions, so each
 * state can be checked on the real page.
 *
 * The page this replaced is kept beside it as legacy-page.jsx (not a route — Next
 * only serves page.js) for the few things it still does that the dashboard does
 * not: reschedule and cancel dialogs, assessment sessions, paging past 50.
 */

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ClientDashboard from '@/components/ClientDashboard';
import { PREVIEWS, previewFromParams } from '@/lib/dashboardPreview';

function SessionsBody() {
  const { user } = useAuth();
  const router = useRouter();
  const previewState = previewFromParams(useSearchParams());
  const profile = user?.profile || {};

  const client = previewState
    ? { name: 'Faisal Vysam Purath', email: 'faisal@example.com', phone: '+91 98470 00000' }
    : {
      name: [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || user?.name || user?.email,
      email: user?.email || profile.email,
      phone: profile.phone_number || user?.phone_number,
    };

  return (
    <ClientDashboard
      client={client}
      fixture={previewState ? PREVIEWS[previewState] : null}
      previewState={previewState}
      onPreviewChange={previewState
        ? (next) => router.replace(`/profile/sessions?preview=${next}`, { scroll: false })
        : null}
    />
  );
}

export default function SessionsPage() {
  return (
    <Suspense fallback={null}>
      <SessionsBody />
    </Suspense>
  );
}
