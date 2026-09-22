/**
 * URL redaction for anything that leaves Koott (GA4, PostHog, Vercel, Meta).
 *
 * Condition pages (/depression-treatment, /counselling/…), blog posts and any
 * unknown top-level page are collapsed so a third party never learns which
 * condition page someone read. Query strings are dropped except campaign
 * parameters. Koott's own analytics keeps the real path (internal only).
 */

// Top-level routes that are safe to name (src/app). Anything else at the top
// level is a CMS page — most of them condition pages — and is redacted.
const KNOWN = new Set([
  '', 'about', 'about-us', 'assessments', 'better-parenting', 'book', 'book-malayali-psychologists',
  'career', 'contact-us', 'event-list', 'events', 'faq', 'get-in-touch', 'jobs', 'payment',
  'plans-pricing', 'privacy-policy', 'profile', 'refund-policy', 'terms-and-conditions',
  'therapist-profile', 'therapy-agreement', 'online-child-psychologist', 'guide', 'ads', 'auth', 'messages',
]);
const KEEP_PARAMS = /^(utm_(source|medium|campaign|content|term)|gclid|gbraid|wbraid)$/;

export function redactPath(pathname = '/') {
  const clean = String(pathname).split(/[?#]/)[0];
  const [, first = '', second] = clean.split('/');
  if (first === 'counselling' && second) return '/topic';
  if (first === 'blog' || first === 'blogs') return '/blog';
  if (first === 'book' && second) return '/book';
  if (first === 'therapist-profile' && second) return '/therapist-profile';
  if (first === 'payment') return `/payment/${second || ''}`.replace(/\/$/, '');
  if (!KNOWN.has(first)) return '/topic';
  return clean || '/';
}

/** Full URL → the same origin with a redacted path and only campaign params. */
export function redactUrl(href) {
  try {
    const u = new URL(href, typeof window !== 'undefined' ? window.location.origin : 'https://koott.in');
    const kept = new URLSearchParams();
    u.searchParams.forEach((v, k) => { if (KEEP_PARAMS.test(k)) kept.set(k, v); });
    const q = kept.toString();
    return `${u.origin}${redactPath(u.pathname)}${q ? `?${q}` : ''}`;
  } catch (_) {
    return '/';
  }
}
