/**
 * Meta Pixel — built, and OFF until NEXT_PUBLIC_META_PIXEL_ENABLED=true.
 *
 * Loads only when: the switch is on, NEXT_PUBLIC_META_PIXEL_ID is set, the
 * visitor accepted advertising cookies, and the page is not a condition page
 * or blog post (those never get the Pixel — Meta would see the URL).
 * Automatic events and automatic advanced matching are off (autoConfig false):
 * Meta sees only what is mapped below, never button text or page metadata.
 *
 * Internal event → Meta standard event (only these, only these fields):
 *   page_view               → PageView
 *   counsellor_profile_view → ViewContent       (content_type only — no therapist)
 *   phone_verified          → Lead
 *   details_completed       → CompleteRegistration
 *   checkout_started        → InitiateCheckout  (value, currency)
 *   contact_clicked         → Contact
 * Purchase is sent from the server (Conversions API, providers/meta.js on the
 * backend) after Razorpay verification, never from the browser.
 */

import { redactPath } from './redact';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
const ENABLED = process.env.NEXT_PUBLIC_META_PIXEL_ENABLED === 'true' && !!PIXEL_ID;

const MAP = {
  page_view: () => ['PageView', {}],
  counsellor_profile_view: () => ['ViewContent', { content_type: 'product' }],
  phone_verified: () => ['Lead', {}],
  details_completed: () => ['CompleteRegistration', {}],
  checkout_started: (_, value) => ['InitiateCheckout', Number.isFinite(value) ? { value, currency: 'INR' } : { currency: 'INR' }],
  contact_clicked: () => ['Contact', {}],
};

let loaded = false;

// Condition pages and blog posts redact to these — no Pixel there at all.
const sensitivePage = () => ['/topic', '/blog'].includes(redactPath(window.location.pathname));

function load() {
  if (loaded) return;
  loaded = true;
  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('set', 'autoConfig', false, PIXEL_ID);
  window.fbq('init', PIXEL_ID);
}

/** Called by track() for every event; does nothing unless everything above allows it. */
export function forwardToMeta(name, value, advertisingConsent) {
  if (!ENABLED || !advertisingConsent || typeof window === 'undefined') return;
  const map = MAP[name];
  if (!map || sensitivePage()) return;
  load();
  const [event, data] = map(name, value);
  window.fbq('track', event, data);
}

export const metaPixelStatus = () => ({ enabled: ENABLED, pixelId: PIXEL_ID ? `…${PIXEL_ID.slice(-4)}` : null });
