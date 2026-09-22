'use client';

/**
 * Mounted once in app/layout.js. Records a page_view on every route change,
 * installs the automatic trackers (clicks, scroll, time on page, errors),
 * pauses tracking while a staff account is signed in, and shows the cookie
 * banner. Staff areas (/admin, /marketing, …) are never tracked.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { refreshIdentity, setTrackingEnabled, track } from '@/analytics';
import { installAutotrack, newPage } from '@/analytics/autotrack';
import ConsentBanner from './ConsentBanner';

const STAFF_AREA = /^\/(admin|superadmin|finance|psychologist|event-organizer|marketing|dev)(\/|$)/;
// One page_view per navigation: React's development double-run of effects, or
// the provider remounting when the page's providers change, must not count twice.
let lastView = { path: null, at: 0 };

export default function AnalyticsProvider() {
  const pathname = usePathname();
  const { user } = useAuth() || {};
  const staff = !!user?.role && user.role !== 'client';

  useEffect(() => { setTrackingEnabled(!staff); }, [staff]);
  useEffect(() => { installAutotrack(); }, []);

  useEffect(() => {
    if (!pathname || STAFF_AREA.test(pathname)) return;
    if (lastView.path === pathname && Date.now() - lastView.at < 1500) return;
    lastView = { path: pathname, at: Date.now() };
    newPage();
    refreshIdentity();
    track('page_view');
  }, [pathname]);

  if (pathname && STAFF_AREA.test(pathname)) return null;
  return <ConsentBanner />;
}
