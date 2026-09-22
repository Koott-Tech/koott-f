'use client';

/**
 * The client area's shell.
 *
 * The dashboard prototype ("koott-client-dashboard (2).html") has no sidebar: the
 * site's own header carries the navigation, and everything that used to be in the
 * left menu — Sessions, Messages, Profile, Report, Packages, Receipts, Logout —
 * moved into the account menu behind the avatar (see KoottHeader). So this layout
 * only guards the pages and gets out of the way.
 *
 * ?preview opens the dashboard's state switch, which draws from fixtures rather
 * than anyone's sessions; it is for looking at the design, so it does not ask for
 * a login.
 *
 * The shell this replaced is kept as legacy-layout.jsx, beside it, should any of
 * the sidebar's behaviour be wanted back.
 */

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import LogoLoader from '@/components/LogoLoader';
import { previewFromParams } from '@/lib/dashboardPreview';

// The site header is fixed and reserves no space of its own.
const Shell = ({ children }) => (
  <div style={{ paddingTop: 63, minHeight: 'calc(100vh - 63px)', background: '#fff' }}>{children}</div>
);

function ProfileGuard({ children }) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  // Only a preview that really draws from fixtures skips the login.
  const previewing = previewFromParams(useSearchParams()) !== '';

  useEffect(() => {
    if (previewing || authLoading || user) return;
    // The header opens its sign-in modal when it sees this.
    try { localStorage.setItem('auth_error', 'Please log in to view your profile.'); } catch (_) { /* private mode */ }
    router.replace('/');
  }, [user, router, authLoading, previewing]);

  if (previewing) return <Shell>{children}</Shell>;

  if (authLoading || !user) {
    return <Shell><LogoLoader active /></Shell>;
  }

  return <Shell>{children}</Shell>;
}

export default function ProfileLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <ProfileGuard>{children}</ProfileGuard>
    </Suspense>
  );
}
