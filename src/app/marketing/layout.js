'use client';

/**
 * /marketing — the marketing & analytics dashboard.
 * Open to the marketing, admin and superadmin roles. Signed-out people get the site's
 * Log In popup; other roles go to their own dashboard. The API enforces the same roles (koott-backend routes/marketing.js).
 */

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardFor, signInUrl } from '@/lib/staffRoles';

const MARKETING_ROLES = ['marketing', 'admin', 'superadmin'];

export default function MarketingLayout({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const onLogin = pathname === '/marketing/login';
  const allowed = isAuthenticated() && MARKETING_ROLES.includes(user?.role);

  useEffect(() => {
    if (onLogin || isLoading || allowed) return;
    if (!isAuthenticated()) router.replace(signInUrl(pathname));
    else router.replace(dashboardFor(user?.role) || '/');
  }, [onLogin, isLoading, allowed, router, pathname, isAuthenticated, user]);

  if (onLogin) return children;
  if (isLoading || !allowed) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'system-ui, sans-serif', color: '#6A776E', background: '#F3F6F4' }}>
        Checking access…
      </div>
    );
  }
  return children;
}
