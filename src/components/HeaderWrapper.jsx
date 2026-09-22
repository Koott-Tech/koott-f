'use client';

import { usePathname } from 'next/navigation';
// KoottHeader is the cloned koott.in header. The previous Koott header is kept
// in Header.jsx, unused, so the swap is easy to reverse.
import Header from './KoottHeader';

export default function HeaderWrapper({ conditionMenu }) {
  const pathname = usePathname();
  
  // Hide global site header on admin, superadmin, psychologist, finance dashboards
  // Note: /online-child-psychologist (listing page) should show header, only /psychologist (dashboard) should hide it
  const shouldHideCompletely = pathname.startsWith('/admin') || 
                                pathname.startsWith('/superadmin') || 
                                pathname.startsWith('/finance') ||
                                pathname.startsWith('/marketing') ||
                                pathname.startsWith('/event-organizer') ||
                                (pathname.startsWith('/psychologist') && !pathname.startsWith('/online-child-psychologist'));
  
  if (shouldHideCompletely) return null;
  
  // The client area used to hide this on phones because its own sidebar carried
  // the navigation there. That sidebar is gone (the dashboard prototype has
  // none), so the header is the navigation at every width.
  return <Header conditionMenu={conditionMenu} />;
}
