'use client';

/**
 * Old Marketing sign-in address. Everyone signs in with the site's Log In popup now,
 * which sends each role to its own dashboard.
 */
import { useEffect } from 'react';
import { signInUrl } from '@/lib/staffRoles';

export default function MarketingLogin() {
  useEffect(() => { window.location.replace(signInUrl('/marketing')); }, []);
  return null;
}
