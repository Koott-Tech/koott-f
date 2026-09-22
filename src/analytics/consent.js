/**
 * Cookie consent: necessary (always), analytics, advertising.
 *
 * Until a choice is made, nothing optional is sent: events wait in memory and
 * are sent if analytics is accepted, dropped if not. Advertising (Meta Pixel,
 * Google ads signals) needs its own yes. Every choice is recorded server-side
 * as proof of consent.
 */

const KEY = 'koott_consent';
export const CONSENT_VERSION = 'v1';

const listeners = new Set();

export function getConsent() {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (c && c.version === CONSENT_VERSION) return c;
  } catch (_) { /* private mode */ }
  return null; // not chosen yet
}

export function setConsent({ analytics, advertising }, { anonymousId, apiBase, source = 'banner' } = {}) {
  const c = { analytics: !!analytics, advertising: !!advertising, version: CONSENT_VERSION, at: Date.now() };
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (_) { /* private mode */ }
  listeners.forEach((fn) => fn(c));
  if (anonymousId && apiBase) {
    fetch(`${apiBase}/analytics/consent`, {
      method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anonymousId, ...c, source }),
    }).catch(() => {});
  }
  return c;
}

export function onConsent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Lets the footer's "Cookie settings" link reopen the banner. */
export function openConsentSettings() {
  window.dispatchEvent(new Event('koott:consent-settings'));
}
