'use client';

/**
 * /tasks/open?id=<task> — the link in task emails. Sends the person to the Tasks page of
 * their own dashboard with that task open (or to the staff login first).
 */
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TASKS_PATH_BY_ROLE } from '@/lib/staffRoles';

export default function OpenTask() {
  const { user, isAuthenticated, isLoading } = useAuth();
  useEffect(() => {
    if (isLoading) return;
    const id = new URLSearchParams(window.location.search).get('id') || '';
    if (!isAuthenticated()) {
      window.location.replace(`/staff-login?next=${encodeURIComponent(`/tasks/open?id=${id}`)}`);
      return;
    }
    const path = TASKS_PATH_BY_ROLE[user?.role];
    window.location.replace(path ? `${path}?task=${encodeURIComponent(id)}` : '/');
  }, [isLoading, isAuthenticated, user]);
  return <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: '#6A776E', fontFamily: 'system-ui' }}>Opening the task…</div>;
}
