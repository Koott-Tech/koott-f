'use client';

/**
 * /profile/sessions — the client's sessions, now the dashboard built to
 * "koott-client-dashboard (2).html" (components/ClientDashboard.jsx). Every link
 * in the app already points here, so this is where the new design lives; the
 * standalone /dashboard route renders the same component without the profile
 * sidebar.
 *
 * The page this replaced is kept beside it as legacy-page.jsx (not a route — Next
 * only serves page.js) for the few things it still does that the dashboard does
 * not: reschedule and cancel dialogs, assessment sessions, paging past 50.
 */

import { useAuth } from '@/contexts/AuthContext';
import ClientDashboard from '@/components/ClientDashboard';

export default function SessionsPage() {
  const { user } = useAuth();
  const profile = user?.profile || {};
  return (
    <ClientDashboard
      client={{
        name: [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || user?.name || user?.email,
        email: user?.email || profile.email,
        phone: profile.phone_number || user?.phone_number,
      }}
    />
  );
}
