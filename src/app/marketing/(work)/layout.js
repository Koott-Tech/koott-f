'use client';

/** Marketing pages beside the analytics screen: lead sources, blog, events, assessments, tasks. */
import { BarChart3, ClipboardCheck, ClipboardList, FileText, Gauge, Ticket } from 'lucide-react';
import DashboardShell from '@/components/dashboard/DashboardShell';

const NAV = [
  { group: 'Analytics', items: [
    { label: 'Analytics & reports', href: '/marketing', icon: BarChart3, exact: true },
    { label: 'Lead sources', href: '/marketing/lead-sources', icon: Gauge },
  ] },
  { group: 'Content', items: [
    { label: 'Blog', href: '/marketing/blogs', icon: FileText },
    { label: 'Events', href: '/marketing/events-cms', icon: Ticket },
    { label: 'Assessments', href: '/marketing/assessments', icon: ClipboardCheck },
  ] },
  { group: 'Work', items: [{ label: 'Tasks', href: '/marketing/tasks', icon: ClipboardList }] },
];

export default function MarketingWorkLayout({ children }) {
  return <DashboardShell title="Marketing" roles={['marketing']} nav={NAV}>{children}</DashboardShell>;
}
