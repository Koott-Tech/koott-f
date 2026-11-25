'use client';

import { usePathname } from 'next/navigation';
import { isDashboardPath } from '@/lib/staffRoles';
// KoottHeader is the cloned koott.in header. The previous Koott header is kept
// in Header.jsx, unused, so the swap is easy to reverse.
import Header from './KoottHeader';
import { CONDITION_SLUGS } from '@/data/conditions';

export default function HeaderWrapper() {
  const pathname = usePathname();
  
  // Hide global site header on admin, superadmin, psychologist, finance dashboards
  // Note: /online-child-psychologist (listing page) should show header, only /psychologist (dashboard) should hide it
  // The home page (Koott 2.0) draws its own header inside the green hero, with its own menu.
  // The condition landing pages (Koott 2.0) draw their own header, as the home
  // page does. Everything at the top level that is not a known app route is one
  // of them; CONDITION_SLUGS is the list those pages are built from.
  const isLanding = CONDITION_SLUGS.includes((pathname || '').replace(/^\//, ''));
  const shouldHideCompletely = isDashboardPath(pathname) || pathname === '/' || isLanding;
  
  if (shouldHideCompletely) return null;
  
  // The client area used to hide this on phones because its own sidebar carried
  // the navigation there. That sidebar is gone (the dashboard prototype has
  // none), so the header is the navigation at every width.
  return <Header />;
}
