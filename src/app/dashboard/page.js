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
import { PREVIEWS, previewFromParams } from '@/lib/dashboardPreview';

function DashboardBody() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const previewState = previewFromParams(useSearchParams());
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
