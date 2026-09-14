"use client";

/**
 * /admin/site-pages/<home|about|faq|pricing|footer> — the fixed site pages,
 * listed at the top of the admin "Pages" section and edited with the same
 * form + live-preview editor as every other page.
 */

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SitePageEditor from '@/components/SitePageEditor';

export default function SitePageAdmin() {
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { key } = useParams();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated()) { router.push('/'); return; }
    if (!hasRole('admin') && !hasRole('superadmin')) router.push('/profile');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen text-sm text-gray-500">Loading…</div>;
  }

  return <SitePageEditor pageId={key} onBack={() => router.push('/admin/counselling')} />;
}
