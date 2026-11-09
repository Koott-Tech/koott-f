'use client';

import { usePathname } from 'next/navigation';
import { isDashboardPath } from '@/lib/staffRoles';
// KoottFooter is the cloned koott.in footer. The previous Koott footer is kept
// in Footer.jsx, unused, so the swap is easy to reverse.
import KoottFooter from './KoottFooter';

export default function FooterWrapper() {
  const pathname = usePathname();

  // Dashboards render their own chrome; the marketing footer does not belong there.
  // /online-child-psychologist is the public listing, so only the /psychologist
  // dashboard is excluded by that prefix.
  const hide = isDashboardPath(pathname) || pathname.startsWith('/profile');

  if (hide) return null;

  return <KoottFooter />;
}
