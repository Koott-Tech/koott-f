'use client';

/**
 * /dashboard — the client's "Your sessions" page, built to the prototype in
 * "koott-client-dashboard (2).html". The page itself is ClientDashboard; this
 * wrapper only sorts out who is looking at it.
 *
 * It renders under the site header (which is fixed and reserves no space), like
 * the other native pages.
 */

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ClientDashboard from '@/components/ClientDashboard';
import LogoLoader from '@/components/LogoLoader';
import AuthModal from '@/components/AuthModal';

/**
 * The prototype's preview switch, kept: /dashboard?preview=<state> draws the page
 * from fixtures instead of the client's own data, so a design can be checked
 * without a matching account. Nothing here is used when `preview` is absent.
 */
const inDays = (n, hh = 12, mm = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return { date: d.toISOString().slice(0, 10), time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00` };
};
const SHOW = { id: 'p1', first_name: 'Sneha', last_name: 'Thomas', designation: 'Child & Adolescent Psychologist' };
const session = (id, day, hh, extra = {}) => {
  const { date, time } = inDays(day, hh);
  return {
    id, scheduled_date: date, scheduled_time: time, status: 'booked', price: 1350,
    session_type: 'individual', duration_minutes: 50, psychologist: SHOW,
    google_meet_link: 'https://meet.google.com/abc-defg-hij', ...extra,
  };
};
const doneSession = (id, day, extra = {}) => {
  const { date, time } = inDays(-day, 12);
  return {
    id, scheduled_date: date, scheduled_time: time, status: 'completed', price: 1350,
    session_type: 'individual', duration_minutes: 50, psychologist: SHOW, ...extra,
  };
};
const PREVIEWS = {
  new: { upcoming: [], past: [], packages: [] },
  awaiting: {
    upcoming: [], past: [], packages: [],
    draft: {
      slug: 'sneha-thomas', kind: 'individual', price: 1350, planLabel: 'Single session',
      therapist: { name: 'Sneha Thomas', role: 'Child & Adolescent Psychologist' },
      slot: { startsAt: new Date(Date.now() + 3 * 86400000).toISOString() },
    },
  },
  paid: { upcoming: [session('s1', 0, 12)], past: [], packages: [] },
  package: {
    upcoming: [session('s1', 0, 12, { package_id: 'pk1', package: { session_number: 1, total_sessions: 3 } })],
    past: [],
    packages: [{
      id: 'cp1', package_id: 'pk1', total_sessions: 3, remaining_sessions_for_booking: 2,
      validity_months: 6, psychologist: SHOW,
      expires_at: new Date(Date.now() + 180 * 86400000).toISOString(),
    }],
  },
  multi: { upcoming: [session('s1', 0, 12), session('s2', 7, 12), session('s3', 14, 16)], past: [], packages: [] },
  history: {
    upcoming: [],
    packages: [],
    past: [
      doneSession('h1', 7, { psychologist_notes: 'We looked at how work pressure is affecting your sleep, and practised box breathing.' }),
      doneSession('h2', 14, { psychologist_notes: 'You described the situations that bring on tightness in your chest.', client_rating: 5 }),
      doneSession('h3', 21, { status: 'cancelled', price: 0 }),
    ],
  },
};

function DashboardBody() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  // ?preview with no value still opens the switch, on the first state.
  const asked = useSearchParams().get('preview');
  const previewState = asked === null ? '' : (PREVIEWS[asked] ? asked : 'new');
  const isClient = hasRole ? hasRole('client') : user?.role === 'client';

  if (previewState) {
    return (
      <div style={{ paddingTop: 63 }}>
        <ClientDashboard
          fixture={PREVIEWS[previewState]}
          previewState={previewState}
          onPreviewChange={(next) => router.replace(`/dashboard?preview=${next}`, { scroll: false })}
          client={{ name: 'Faisal Vysam Purath', email: 'faisal@example.com', phone: '+91 98470 00000' }}
        />
      </div>
    );
  }

  // Signed in as someone else (a therapist, an admin) — this page is not theirs.
  useEffect(() => {
    if (!isLoading && user && !isClient) router.replace('/');
  }, [isLoading, user, isClient, router]);

  // The site signs people in through a modal rather than a login page, so a
  // signed-out visitor gets that modal over the empty page.
  if (!isLoading && !user) {
    return (
      <div style={{ paddingTop: 63, minHeight: 'calc(100vh - 63px)' }}>
        <AuthModal open onClose={() => router.replace('/')} />
      </div>
    );
  }

  if (isLoading || !isClient) {
    return (
      <div style={{ paddingTop: 63, minHeight: 'calc(100vh - 63px)' }}>
        <LogoLoader active />
      </div>
    );
  }

  const profile = user.profile || {};
  return (
    <div style={{ paddingTop: 63 }}>
      <ClientDashboard
        client={{
          name: [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || user.name || user.email,
          email: user.email || profile.email,
          phone: profile.phone_number || user.phone_number,
        }}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardBody />
    </Suspense>
  );
}
