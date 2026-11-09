'use client';

/**
 * Pages shared between dashboards (Admin's careers, blog and events editors also open
 * in HR and Marketing) build their links from the dashboard they are opened in.
 */
import { usePathname } from 'next/navigation';

const BASES = ['/superadmin/admin', '/operations', '/marketing', '/hr', '/superadmin', '/admin'];

export function dashBaseFrom(pathname) {
  const p = pathname || '';
  return BASES.find((b) => p === b || p.startsWith(`${b}/`)) || '/admin';
}

export function useDashBase() {
  return dashBaseFrom(usePathname());
}
