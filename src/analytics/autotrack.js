/**
 * Interactions recorded without per-component code:
 *   · clicks on any element with data-track="<snake_case_id>"  → ui_click
 *   · scroll depth 25 / 50 / 75 / 100 % per page              → scroll_depth
 *   · time the page was visible (≥ 5 s)                       → page_engaged
 *   · uncaught script errors, as a code only                  → js_error
 * Nothing typed and no element text is ever read.
 */

import { track } from './index';

const ID = /^[a-z][a-z0-9_]{1,59}$/;
let installed = false;
let depths = new Set();
let visibleMs = 0;
let visibleSince = null;
let errorsThisPage = 0;

/** Where a tracked button leads: a same-site path (no query), or the other site's host. */
function targetOf(el) {
  const link = el.closest('a[href]') || el.querySelector?.('a[href]');
  const href = link?.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('javascript:')) return null;
  try {
    const u = new URL(href, window.location.href);
    if (u.origin === window.location.origin) return u.pathname.slice(0, 120);
    return u.hostname.replace(/^www\./, '').slice(0, 120);
  } catch (_) { return null; }
}

function onClick(e) {
  const el = e.target?.closest?.('[data-track]');
  const id = el?.getAttribute('data-track');
  if (!id || !ID.test(id)) return;
  const target = targetOf(el);
  track('ui_click', target ? { element: id, target } : { element: id });
}

function onScroll() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  const pct = max <= 0 ? 100 : (window.scrollY / max) * 100;
  [25, 50, 75, 100].forEach((d) => {
    if (pct >= d - 1 && !depths.has(d)) { depths.add(d); track('scroll_depth', { depth: d }); }
  });
}

function onVisibility() {
  if (document.visibilityState === 'visible') visibleSince = Date.now();
  else if (visibleSince) { visibleMs += Date.now() - visibleSince; visibleSince = null; }
}

function errorCode(err) {
  const msg = String(err?.message || err || '');
  if (/ChunkLoadError|Loading chunk|dynamically imported module/i.test(msg)) return 'chunk_load_failed';
  if (/Hydration|did not match/i.test(msg)) return 'hydration_mismatch';
  if (/NetworkError|Failed to fetch|Load failed/i.test(msg)) return 'network_error';
  return 'uncaught_error';
}
function onError(e) {
  if (errorsThisPage >= 5) return;
  errorsThisPage += 1;
  track('js_error', { code: errorCode(e?.error || e?.reason || e) });
}

/** Wrap up the page being left, and start counting the new one. */
export function newPage() {
  if (visibleSince) { visibleMs += Date.now() - visibleSince; visibleSince = null; }
  const seconds = Math.round(visibleMs / 1000);
  if (seconds >= 5) track('page_engaged', { seconds: Math.min(seconds, 3600) });
  depths = new Set();
  visibleMs = 0;
  visibleSince = document.visibilityState === 'visible' ? Date.now() : null;
  errorsThisPage = 0;
}

export function installAutotrack() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  document.addEventListener('click', onClick, true);
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; onScroll(); });
  }, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', () => newPage());
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onError);
  visibleSince = document.visibilityState === 'visible' ? Date.now() : null;
}
