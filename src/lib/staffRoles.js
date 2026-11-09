/**
 * Staff roles and their dashboards — "Koott dashboards and tasks plan".
 * One email, one role, one dashboard. Mirrors backend utils/staffRoles.js.
 */
export const DASHBOARD_BY_ROLE = {
  superadmin: '/superadmin',
  admin: '/admin',
  operations: '/operations',
  hr: '/hr',
  marketing: '/marketing',
  finance: '/finance',
  event_organizer: '/event-organizer',
  staff: '/staff',
  psychologist: '/psychologist',
};

export const ROLE_LABEL = {
  superadmin: 'Superadmin', admin: 'Admin', operations: 'Operations', hr: 'HR', marketing: 'Marketing',
  finance: 'Finance', event_organizer: 'Event organizer', staff: 'Staff', psychologist: 'Therapist', client: 'Client',
};

/** Where each dashboard keeps its Tasks page. */
export const TASKS_PATH_BY_ROLE = {
  superadmin: '/superadmin/tasks', admin: '/admin/tasks', operations: '/operations/tasks', hr: '/hr/tasks',
  marketing: '/marketing/tasks', finance: '/finance/tasks', event_organizer: '/event-organizer/tasks',
  staff: '/staff', psychologist: '/psychologist/tasks',
};

export const ADMIN_ROLES = ['admin', 'superadmin'];
export const isAdminRole = (role) => ADMIN_ROLES.includes(role);
export const dashboardFor = (role) => DASHBOARD_BY_ROLE[role] || null;

/** Staff dashboards that should not show the public site header/footer. */
export const DASHBOARD_PREFIXES = ['/admin', '/superadmin', '/finance', '/psychologist', '/event-organizer', '/marketing', '/operations', '/hr', '/staff'];

/** Is this a staff dashboard page (or the staff login)? Then the public header, footer and WhatsApp button stay away. */
export function isDashboardPath(pathname) {
  const p = pathname || '';
  if (p === '/staff-login' || p.startsWith('/marketing/login')) return true;
  return DASHBOARD_PREFIXES.some((pre) => p === pre || p.startsWith(`${pre}/`));
}
