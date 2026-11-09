'use client';

/** /hr - people (onboarding, offboarding), therapist onboarding, calendar sync, teams, job postings, tasks. */
import { Briefcase, CalendarCheck, ClipboardList, FileText, ListChecks, UserCheck, Users, UsersRound } from 'lucide-react';
import DashboardShell from '@/components/dashboard/DashboardShell';

const NAV = [
  { group: 'People', items: [
    { label: 'People', href: '/hr', icon: Users, exact: true },
    { label: 'Teams', href: '/hr/teams', icon: UsersRound },
  ] },
  { group: 'Therapists', items: [
    { label: 'Onboarding progress', href: '/hr/onboarding', icon: ListChecks },
    { label: 'Therapists', href: '/hr/therapists', icon: UserCheck },
    { label: 'Therapist groups', href: '/hr/therapist-groups', icon: Users },
    { label: 'Calendar sync', href: '/hr/calendar', icon: CalendarCheck },
  ] },
  { group: 'Hiring', items: [
    { label: 'Job postings', href: '/hr/careers', icon: Briefcase },
    { label: 'Applications', href: '/hr/applications', icon: FileText },
  ] },
  { group: 'Work', items: [{ label: 'Tasks', href: '/hr/tasks', icon: ClipboardList }] },
];

export default function HrLayout({ children }) {
  return <DashboardShell title="HR" roles={['hr']} nav={NAV}>{children}</DashboardShell>;
}
