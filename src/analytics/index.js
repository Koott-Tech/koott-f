/**
 * Koott analytics — the one way components record what people do.
 *
 *   track('booking_started', { mode: 'new' }, { psychologistId })
 *   trackPopup('auth_modal', 'shown' | 'dismissed' | '<action>')
 *   <button data-track="hero_consult_now">  → ui_click, recorded automatically
 *
 * Events go to Koott's own backend (POST /api/analytics/events), batched, and
 * only with analytics consent. The backend validates every event against its
 * registry (koott-backend/analytics/registry.js) — an event or prop not listed
 * there is dropped, so adding one means adding it on both sides.
 *
 * Never pass anything a person typed, a concern they described, or contact
 * details. Components never call gtag/fbq/posthog directly for tracking —
 * Meta gets its allowlisted events from here (./meta.js).
 */

import { resolveIdentity, extendSession, vendorIds, visitGeo } from './identity';
import { getConsent, onConsent, CONSENT_VERSION } from './consent';
import { getStoredToken } from '@/lib/authStorage';
import { forwardToMeta } from './meta';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
const UNTRACKED = /^\/(admin|superadmin|finance|psychologist|event-organizer|marketing|dev)(\/|$)/;
const DEBUG = process.env.NODE_ENV === 'development';

let identity = null;
let enabled = true;       // false while a staff account is signed in
let queue = [];           // consented, waiting to send
let undecided = [];       // before any consent choice
let timer = null;

const browser = () => typeof window !== 'undefined';
const uuid = () => (crypto?.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16); }));

/** Refresh identity and session (call on every route change). */
export function refreshIdentity() {
  if (!browser()) return null;
  identity = resolveIdentity();
  visitGeo(); // start the one-per-visit location lookup early
  return identity;
}

/** Staff (admins, therapists, finance, marketing) are never tracked. */
export function setTrackingEnabled(on) {
  enabled = !!on;
  if (!enabled) { queue = []; undecided = []; }
}

/**
 * The context the backend needs to attribute a booking, lead or login.
 * Sent inside the create-order and OTP payloads as `analytics`.
 */
export function analyticsContext() {
  if (!browser()) return null;
  const id = identity || refreshIdentity();
  const c = getConsent() || { analytics: false, advertising: false, version: CONSENT_VERSION };
  let tz = null;
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (_) { /* ignore */ }
  return {
    anonymousId: id.anonymousId,
    sessionId: id.sessionId,
    touch: id.touch,
    first: id.first,
    landingPath: id.landingPath,
    tz,
    geo: visitGeo(),
    consent: { analytics: !!c.analytics, advertising: !!c.advertising, version: c.version || CONSENT_VERSION },
    ids: c.advertising || c.analytics ? vendorIds() : {},
  };
}

// The same event, page and props twice within 800 ms is one event (React's
// development double-run of effects, a double tap).
let lastKey = ''; let lastAt = 0;

export function track(name, props = {}, { psychologistId, value } = {}) {
  if (!browser() || !enabled || UNTRACKED.test(window.location.pathname)) return;
  const key = `${name}|${window.location.pathname}|${JSON.stringify(props)}|${psychologistId || ''}`;
  if (key === lastKey && Date.now() - lastAt < 800) return;
  lastKey = key; lastAt = Date.now();
  extendSession();
  const ev = {
    id: uuid(), name, at: new Date().toISOString(), path: window.location.pathname, props,
    ...(psychologistId ? { psychologistId } : {}), ...(Number.isFinite(value) ? { value } : {}),
  };
  if (DEBUG) console.debug('[analytics]', name, props, psychologistId || '', value ?? '');
  const c = getConsent();
  if (!c) { undecided.push(ev); if (undecided.length > 100) undecided.shift(); return; }
  forwardToMeta(name, value, !!c.advertising); // off unless NEXT_PUBLIC_META_PIXEL_ENABLED=true
  if (!c.analytics) return;
  queue.push(ev);
  if (queue.length >= 10) flush(); else schedule();
}

export const trackPopup = (popup, what) => {
  if (what === 'shown') track('popup_shown', { popup });
  else if (what === 'dismissed') track('popup_dismissed', { popup });
  else track('popup_action', { popup, action: what });
};

function schedule() {
  if (timer) return;
  timer = setTimeout(() => { timer = null; flush(); }, 2000);
}

/** Send what's queued. `beacon` on page hide, when fetch may be cut off. */
export function flush(beacon = false) {
  if (!browser() || !queue.length) return;
  const events = queue.splice(0, 50);
  const body = JSON.stringify({ context: analyticsContext(), events });
  const url = `${API}/analytics/events`;
  try {
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }));
    } else {
      const token = getStoredToken?.();
      fetch(url, {
        method: 'POST', keepalive: true, body,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      }).catch(() => {});
    }
  } catch (_) { /* never break the page */ }
  if (queue.length) schedule();
}

/** After login / sign-up: link this visitor to the account (server records login or registration). */
export function identifyVisitor(token, method = 'password') {
  if (!browser() || !token || !getConsent()?.analytics) return;
  fetch(`${API}/analytics/identify`, {
    method: 'POST', keepalive: true,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ context: analyticsContext(), method }),
  }).catch(() => {});
}

if (browser()) {
  onConsent((c) => {
    if (c.analytics) { queue.push(...undecided); schedule(); }
    undecided = [];
  });
  const hide = () => flush(true);
  window.addEventListener('pagehide', hide);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') hide(); });
}
