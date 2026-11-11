'use client';

/**
 * Old address for the team sign-in. Everyone (clients, therapists and staff) now signs in
 * with the site's Log In popup, which sends each role to its own dashboard. Links and
 * bookmarks to /staff-login (with ?next=) open that popup on the home page.
 */
import { useEffect } from 'react';
import { signInUrl } from '@/lib/staffRoles';

export default function StaffLogin() {
  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next');
    window.location.replace(signInUrl(next || undefined));
  }, []);
  return null;
}
