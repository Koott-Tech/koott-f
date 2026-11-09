/**
 * Calls for the staff dashboards: tasks, leads, people, teams, job applications.
 * Every call sends the signed-in token and returns `data`, or throws an Error whose
 * message is the server's (already worded for people).
 */
import { getStoredToken } from '@/lib/authStorage';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/+$/, '');

export async function staffFetch(path, { method = 'GET', body, query } = {}) {
  let token = null;
  try { token = getStoredToken(); } catch (_) { /* storage blocked */ }
  const qs = query
    ? `?${new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()}`
    : '';
  const res = await fetch(`${API}${path}${qs}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const err = new Error(json.message || json.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return json.data ?? json;
}

export const tasksApi = {
  list: (query) => staffFetch('/tasks', { query }),
  get: (id) => staffFetch(`/tasks/${id}`),
  create: (body) => staffFetch('/tasks', { method: 'POST', body }),
  update: (id, body) => staffFetch(`/tasks/${id}`, { method: 'PATCH', body }),
  claim: (id) => staffFetch(`/tasks/${id}/claim`, { method: 'POST' }),
  comment: (id, body, mentions) => staffFetch(`/tasks/${id}/comments`, { method: 'POST', body: { body, mentions } }),
  people: () => staffFetch('/tasks/people'),
  workload: () => staffFetch('/tasks/workload'),
  notifications: () => staffFetch('/tasks/notifications'),
  markRead: (ids) => staffFetch('/tasks/notifications/read', { method: 'POST', body: { ids } }),
  report: (body) => staffFetch('/tasks/report', { method: 'POST', body }),
  runAuto: () => staffFetch('/tasks/auto/run', { method: 'POST' }),
};

export const leadsApi = {
  list: (query) => staffFetch('/leads', { query }),
  create: (body) => staffFetch('/leads', { method: 'POST', body }),
  update: (id, body) => staffFetch(`/leads/${id}`, { method: 'PATCH', body }),
  convert: (id, body = {}) => staffFetch(`/leads/${id}/convert`, { method: 'POST', body }),
  sources: (query) => staffFetch('/leads/sources', { query }),
};

export const peopleApi = {
  list: () => staffFetch('/people'),
  onboard: (body) => staffFetch('/people/onboard', { method: 'POST', body }),
  update: (type, id, body) => staffFetch(`/people/${type}/${id}`, { method: 'PATCH', body }),
  offboard: (type, id) => staffFetch(`/people/${type}/${id}/offboard`, { method: 'POST' }),
  reactivate: (type, id) => staffFetch(`/people/${type}/${id}/reactivate`, { method: 'POST' }),
};

export const teamsApi = {
  list: () => staffFetch('/teams'),
  create: (body) => staffFetch('/teams', { method: 'POST', body }),
  update: (id, body) => staffFetch(`/teams/${id}`, { method: 'PATCH', body }),
  remove: (id) => staffFetch(`/teams/${id}`, { method: 'DELETE' }),
  addMember: (id, person) => staffFetch(`/teams/${id}/members`, { method: 'POST', body: { person } }),
  removeMember: (id, person) => staffFetch(`/teams/${id}/members/${encodeURIComponent(person)}`, { method: 'DELETE' }),
};

export const applicationsApi = {
  list: (query) => staffFetch('/careers/admin/applications', { query }),
  update: (id, body) => staffFetch(`/careers/admin/applications/${id}`, { method: 'PATCH', body }),
};
