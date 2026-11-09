'use client';

/** /staff - developers, designers and other team members: Tasks only. */
import { ClipboardList } from 'lucide-react';
import DashboardShell from '@/components/dashboard/DashboardShell';

const NAV = [{ items: [{ label: 'My tasks', href: '/staff', icon: ClipboardList, exact: true }] }];

export default function StaffLayout({ children }) {
  return <DashboardShell title="Tasks" roles={['staff']} nav={NAV}>{children}</DashboardShell>;
}
