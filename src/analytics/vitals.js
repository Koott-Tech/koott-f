'use client';

/**
 * Core Web Vitals, measured by the browser itself and sent as `web_vital`
 * events — the Technical Performance report is built from these.
 *
 * No library: the three metrics Google grades on are available from
 * PerformanceObserver directly, and a dependency for ~40 lines is not worth the
 * bytes on a page people open while unwell.
 *
 *   LCP   the largest thing painted, in ms
 *   INP   the slowest interaction, in ms (approximated by the worst event
 *         duration — see below)
 *   CLS   how much the layout jumped, unitless; sent ×1000 so it stays an
 *         integer, and the report divides it back
 *   FCP   the first paint, in ms
 *   TTFB  how long the server took to answer, in ms
 *
 * Each metric is reported once per page load, when the page is hidden or
 * unloaded — that is the only moment LCP, INP and CLS are final. Nothing here
 * runs without analytics consent, because track() drops events until then.
 */

import { track } from './index';

/* Google's own thresholds, so the dashboard grades the same way the Search
   Console and PageSpeed do. [good, needs-improvement] upper bounds. */
const LIMITS = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [100, 250], // already ×1000
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};

const rate = (metric, value) => {
  const [good, ok] = LIMITS[metric] || [];
  if (good == null) return undefined;
  if (value <= good) return 'good';
  return value <= ok ? 'needs-improvement' : 'poor';
};

let started = false;

export function startVitals() {
  if (started || typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;
  started = true;

  const best = {};
  const keep = (metric, value) => {
    const v = Math.round(value);
    if (!Number.isFinite(v) || v < 0 || v > 120000) return;
    // LCP and INP both want the worst value seen; CLS accumulates; FCP/TTFB are one-offs.
    best[metric] = metric === 'CLS' ? v : Math.max(best[metric] ?? 0, v);
  };

  const observe = (type, fn, opts = {}) => {
    try {
      const po = new PerformanceObserver((list) => list.getEntries().forEach(fn));
      po.observe({ type, buffered: true, ...opts });
      return po;
    } catch (_) {
      return null; // an older browser without that entry type
    }
  };

  observe('largest-contentful-paint', (e) => keep('LCP', e.startTime));
  observe('paint', (e) => { if (e.name === 'first-contentful-paint') keep('FCP', e.startTime); });
  observe('navigation', (e) => keep('TTFB', e.responseStart));

  let cls = 0;
  observe('layout-shift', (e) => {
    // Shifts within 500ms of an interaction are the user's doing, not the page's.
    if (!e.hadRecentInput) { cls += e.value; keep('CLS', cls * 1000); }
  });

  // INP proper needs the full interaction-to-next-paint chain; `event` timing
  // gives the duration of the slowest interaction, which is the same number for
  // all but the most unusual pages. The report says it is an approximation.
  observe('event', (e) => keep('INP', e.duration), { durationThreshold: 40 });

  let sent = false;
  const report = () => {
    if (sent) return;
    sent = true;
    Object.entries(best).forEach(([metric, value]) => {
      track('web_vital', { metric, value, rating: rate(metric, value) });
    });
  };

  // `hidden` is the last reliable moment on mobile; pagehide covers the rest.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') report(); });
  window.addEventListener('pagehide', report);
}
