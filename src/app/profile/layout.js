'use client';

/**
 * The client area's shell.
 *
 * The prototype ("koott-client-dashboard (2).html") has no sidebar: the site's
 * own header carries the navigation, and everything that used to be in the left
 * menu — Sessions, Messages, Profile, Report, Packages, Receipts, Logout — moved
 * into the account menu behind the avatar (see ClientAccountMenu, rendered by
 * KoottHeader). So this layout only guards the pages and gets out of the way.
 *
 * The page this replaced is kept as legacy-layout.jsx, beside it, for the
 * sidebar's own behaviour should any of it be wanted back.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import LogoLoader from '@/components/LogoLoader';

export default function ProfileLayout({ children }) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || user) return;
    // The header opens its sign-in modal when it sees this.
    try { localStorage.setItem('auth_error', 'Please log in to view your profile.'); } catch (_) { /* private mode */ }
    router.replace('/');
  }, [user, router, authLoading]);

  if (authLoading || !user) {
    return (
      <div style={{ paddingTop: 63, minHeight: 'calc(100vh - 63px)' }}>
        <LogoLoader active />
      </div>
    );
  }

  // The site header is fixed and reserves no space of its own.
  return <div style={{ paddingTop: 63, minHeight: 'calc(100vh - 63px)', background: '#fff' }}>{children}</div>;
}
