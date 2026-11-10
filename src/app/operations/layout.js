'use client';

/** /operations - leads, lead to client, clients, bookings, sessions, rescheduling, tasks. */
import { CalendarDays, ClipboardList, History, Home, PhoneCall, RefreshCw, Users } from 'lucide-react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import RefundRequestsButton from '@/components/ops/RefundRequestsButton';

const NAV = [
  { items: [{ label: 'Today', href: '/operations', icon: Home, exact: true }] },
  { group: 'Leads', items: [{ label: 'Leads', href: '/operations/leads', icon: PhoneCall }] },
  { group: 'Clients & sessions', items: [
    { label: 'Clients', href: '/operations/clients', icon: Users },
    { label: 'Client timeline', href: '/operations/timeline', icon: History },
    { label: 'Bookings & sessions', href: '/operations/bookings', icon: CalendarDays },
    { label: 'Rescheduling', href: '/operations/rescheduling', icon: RefreshCw },
  ] },
  { group: 'Work', items: [{ label: 'Tasks', href: '/operations/tasks', icon: ClipboardList }] },
];

export default function OperationsLayout({ children }) {
  return (
    <DashboardShell title="Operations" roles={['operations']} nav={NAV} headerActions={(dark) => <RefundRequestsButton dark={dark} />}>
      {children}
    </DashboardShell>
  );
}
