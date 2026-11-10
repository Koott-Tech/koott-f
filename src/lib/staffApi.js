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
  let res;
  try {
    res = await fetch(`${API}${path}${qs}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (_) {
    // Network down / server unreachable: say so in plain words (was "Failed to fetch").
    const err = new Error("Can't reach Koott right now. Check your connection — this page will try again.");
    err.status = 0;
    throw err;
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const fallback = res.status === 429 ? 'Too many requests just now. Wait a minute and try again.'
      : res.status >= 500 ? 'Something went wrong on our side. Please try again in a moment.'
        : `Request failed (${res.status})`;
    const err = new Error(json.message || json.error || fallback);
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
  attachments: (id) => staffFetch(`/tasks/${id}/attachments`),
  openAttachment: (id, file) => staffFetch(`/tasks/${id}/attachments/${encodeURIComponent(file)}`),
  removeAttachment: (id, file) => staffFetch(`/tasks/${id}/attachments/${encodeURIComponent(file)}`, { method: 'DELETE' }),
  /** Multipart upload (no JSON content type). */
  async uploadAttachment(id, file) {
    let token = null;
    try { token = getStoredToken(); } catch (_) { /* storage blocked */ }
    const body = new FormData();
    body.append('file', file);
    const res = await fetch(`${API}/tasks/${id}/attachments`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) throw new Error(json.message || `Upload failed (${res.status})`);
    return json.data;
  },
};

/** Operations' refund requests (header icon): Refund sends the money back through Razorpay. */
export const refundsApi = {
  count: () => staffFetch('/refunds/count'),
  list: (status = 'open') => staffFetch('/refunds', { query: { status } }),
  refund: (id, body) => staffFetch(`/refunds/${id}/refund`, { method: 'POST', body }),
  reject: (id, note) => staffFetch(`/refunds/${id}/reject`, { method: 'POST', body: { note } }),
  manual: (id, body) => staffFetch(`/refunds/${id}/manual`, { method: 'POST', body }),
};

export const leadsApi = {
  list: (query) => staffFetch('/leads', { query }),
  create: (body) => staffFetch('/leads', { method: 'POST', body }),
  update: (id, body) => staffFetch(`/leads/${id}`, { method: 'PATCH', body }),
  convert: (id, body = {}) => staffFetch(`/leads/${id}/convert`, { method: 'POST', body }),
  sources: (query) => staffFetch('/leads/sources', { query }),
  viewed: (id) => staffFetch(`/leads/${id}/viewed`, { method: 'POST' }),
  contact: (id, channel) => staffFetch(`/leads/${id}/contact`, { method: 'POST', body: { channel } }),
  accessLog: (query) => staffFetch('/leads/access-log', { query }),
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

async function upload(path, form) {
  let token = null;
  try { token = getStoredToken(); } catch (_) { /* storage blocked */ }
  const res = await fetch(`${API}${path}`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) { const e = new Error(json.message || `Upload failed (${res.status})`); e.status = res.status; throw e; }
  return json.data;
}

export const documentsApi = {
  list: (query) => staffFetch('/documents', { query }),
  /** fields: { title, kind, expires_on, person } + optional file */
  create: (fields, file) => {
    const f = new FormData();
    Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') f.append(k, v); });
    if (file) f.append('file', file);
    return upload('/documents', f);
  },
  open: (id) => staffFetch(`/documents/${id}/file`),
  update: (id, body) => staffFetch(`/documents/${id}`, { method: 'PATCH', body }),
  remove: (id) => staffFetch(`/documents/${id}`, { method: 'DELETE' }),
};

export const safetyApi = {
  lead: () => staffFetch('/safety/lead'),
  setLead: (body) => staffFetch('/safety/lead', { method: 'PUT', body }),
  raise: (body) => staffFetch('/safety/alerts', { method: 'POST', body }),
  list: () => staffFetch('/safety/alerts'),
  update: (id, body) => staffFetch(`/safety/alerts/${id}`, { method: 'PATCH', body }),
};
