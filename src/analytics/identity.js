/**
 * First-party visitor and session identity, and landing attribution.
 *
 *   koott_aid  cookie, random UUID, 13 months — the anonymous visitor
 *   koott_sid  cookie, random UUID, 30 minutes of inactivity — the session;
 *              a new campaign click (new utm_campaign / gclid / fbclid) also
 *              starts a new session, as GA does
 *   koott_ft   localStorage — the visitor's first touch (kept 90 days)
 *   koott_st   localStorage — the current session's touch + landing page
 *   koott_geo  sessionStorage — country + city for this visit (/api/geo, from
 *              Vercel's edge headers; no IP address is ever read)
 *
 * Never derived from email or phone. Raw touch values are sent to the backend,
 * which decides the channel itself.
 */

const AID = 'koott_aid';
const SID = 'koott_sid';
const FT = 'koott_ft';
const ST = 'koott_st';
const SESSION_MS = 30 * 60 * 1000;
const YEAR_S = 395 * 24 * 3600;
const FIRST_TOUCH_MS = 90 * 24 * 3600 * 1000;
const TOUCH_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'gbraid', 'wbraid'];

const uuid = () => (crypto?.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16); }));

function readCookie(name) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}
function writeCookie(name, value, maxAgeS) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeS}; Path=/; SameSite=Lax${secure}`;
}
const ls = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* private mode */ } },
};

/** The landing's raw touch: campaign params + referrer origin (never a full referrer URL). */
function readTouch() {
  const p = new URLSearchParams(window.location.search);
  const touch = {};
  TOUCH_KEYS.forEach((k) => { const v = p.get(k); if (v) touch[k] = v.slice(0, 300); });
  if (document.referrer) {
    try {
      const r = new URL(document.referrer);
      if (r.hostname !== window.location.hostname) touch.referrer = r.origin;
    } catch (_) { /* ignore */ }
  }
  return touch;
}
const isCampaign = (t) => !!(t.utm_source || t.utm_campaign || t.gclid || t.fbclid || t.gbraid || t.wbraid);
const sameCampaign = (a = {}, b = {}) => ['utm_source', 'utm_campaign', 'gclid', 'fbclid', 'gbraid', 'wbraid'].every((k) => (a[k] || '') === (b[k] || ''));

/**
 * Call on every page load / route change. Returns the current identity and
 * attribution, rolling the session when it expired or a new campaign arrived.
 */
export function resolveIdentity() {
  let anonymousId = readCookie(AID);
  if (!anonymousId) anonymousId = uuid();
  writeCookie(AID, anonymousId, YEAR_S);

  const touchNow = readTouch();
  let sessionId = readCookie(SID);
  let st = ls.get(ST);
  const newCampaign = isCampaign(touchNow) && !sameCampaign(touchNow, st?.touch);
  if (!sessionId || !st || st.sid !== sessionId || newCampaign) {
    sessionId = uuid();
    st = { sid: sessionId, touch: touchNow, landingPath: window.location.pathname, at: Date.now() };
    ls.set(ST, st);
  }
  writeCookie(SID, sessionId, SESSION_MS / 1000);

  let ft = ls.get(FT);
  if (!ft || Date.now() - (ft.at || 0) > FIRST_TOUCH_MS) {
    ft = { touch: st.touch, at: Date.now() };
    ls.set(FT, ft);
  }
  return { anonymousId, sessionId, touch: st.touch, first: ft.touch, landingPath: st.landingPath };
}

/** Keep the session alive on activity without re-reading attribution. */
export function extendSession() {
  const sid = readCookie(SID);
  if (sid) writeCookie(SID, sid, SESSION_MS / 1000);
}

/** Meta and GA browser ids, only read (never created) — they exist only with consent. */
export function vendorIds() {
  const ga = readCookie('_ga');
  const gaClientId = ga ? ga.split('.').slice(-2).join('.') : null;
  let gaSessionId = null;
  const gaSession = document.cookie.match(/(?:^|; )_ga_[A-Z0-9]+=([^;]*)/);
  if (gaSession) gaSessionId = (decodeURIComponent(gaSession[1]).match(/^GS\d\.\d\.s?(\d+)/) || [])[1] || null;
  return { fbp: readCookie('_fbp'), fbc: readCookie('_fbc'), gaClientId, gaSessionId };
}

/** Country (ISO code) and city for this visit, fetched once and kept for the session. */
let geoPromise = null;
export function visitGeo() {
  try {
    const cached = sessionStorage.getItem('koott_geo');
    if (cached) return JSON.parse(cached);
  } catch (_) { /* private mode */ }
  if (!geoPromise) {
    geoPromise = fetch('/api/geo', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((g) => { if (g) { try { sessionStorage.setItem('koott_geo', JSON.stringify(g)); } catch (_) { /* ignore */ } } return g; })
      .catch(() => null);
  }
  return null; // available from the next event on
}
