'use client';

/**
 * Account — Koott 2.0.
 *
 * Built to the Figma file "Koott 2.0" (EzLwBjoYNqTa9RMEmOfyQO), section Home (WIP),
 * screen "Account · A · One page" (8055:4157), drawn at 402 px. Every size, space,
 * weight and colour is taken from that screen (see account2.css.js).
 *
 * Five blocks, top to bottom:
 *   who you are    photo, name, phone, since
 *   shortcuts      My Sessions · Reports & Prescription · Help & Care Team
 *   session pack   what is left of a pack, and Book Follow-up
 *   next session   therapist, time in your zone, meet link, a note, Join Session,
 *                  and the "..." menu (add to calendar, reschedule, change therapist, cancel)
 *   the rest       personal details, self help, time zone, log out
 *
 * It asks the server for the signed-in client (/clients/profile), their sessions
 * (/clients/sessions) and their packs (/clients/packages). The three change actions open
 * My sessions, where the 24-hour rules and their popups already live — this screen does
 * not duplicate that logic.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientApi } from '@/lib/backendApi';
import { useAuth } from '@/contexts/AuthContext';
import { ACCOUNT2_CSS } from './account2.css';

/* ── reading the server's shapes ─────────────────────────────────────────── */

const nameOf = (p) => [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim();
const roleOf = (p) => p?.designation || p?.specialization
  || (Array.isArray(p?.area_of_expertise) ? p.area_of_expertise[0] : '') || 'Psychologist';
const meetLinkOf = (s) => s?.google_meet_link || s?.google_meet_join_url || s?.google_calendar_link || '';
const photoOf = (p) => p?.cover_image_url || p?.profile_image || p?.image_url || '';
const initials = (n) => (n || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '·';

/** A session's start as a real Date. Times are stored IST; the browser shows them local. */
function startOf(session) {
  if (!session?.scheduled_date) return null;
  const date = String(session.scheduled_date).slice(0, 10);
  const time = String(session.scheduled_time || '00:00:00').slice(0, 8);
  const d = new Date(`${date}T${time}+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** How far `tz` is from UTC right now, in minutes (IST = 330). */
function offsetOf(tz, at = new Date()) {
  try {
    const p = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(at).reduce((o, x) => (x.type === 'literal' ? o : { ...o, [x.type]: x.value }), {});
    const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
    return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000);
  } catch { return 0; }
}

/** The badge on the time. Intl calls India "GMT+5:30"; the design (and everyone) says IST. */
function SHORT_TZ(tz) {
  if (offsetOf(tz) === 330) return 'IST';
  try {
    const v = new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeZoneName: 'short' })
      .formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value || '';
    return v.replace('GMT', 'GMT ');
  } catch { return ''; }
}

/** Just the clock time in a zone, for the "or 6:15 PM" line. */
const timeIn = (date, tz) => (date
  ? new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(date)
  : '');

/** "Today, 7:00 PM" in the given zone. */
function whenIn(date, tz) {
  if (!date) return '';
  const day = new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: '2-digit', month: 'short', weekday: 'short' }).format(date);
  const time = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
  const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
  const thatKey = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(date);
  if (todayKey === thatKey) return `Today, ${time}`;
  const tomorrow = new Date(Date.now() + 864e5);
  if (new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(tomorrow) === thatKey) return `Tomorrow, ${time}`;
  return `${day.replace(',', '')} · ${time}`;
}

const monthYear = (iso) => {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return `Since ${d.toLocaleDateString('en-GB', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`;
};

/* ── icons (Untitled UI, drawn at the Figma stroke weights) ──────────────── */

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.667, strokeLinecap: 'round', strokeLinejoin: 'round' };
const I = {
  back: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 15 7.5 10l5-5" {...S} strokeWidth={2} /></svg>,
  calendarCheck: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M17.5 8.33H2.5M13.33 1.67v3.33M6.67 1.67v3.33M6.67 11.67l2.08 2.08 4.17-4.16" {...S} /><rect x="2.5" y="3.33" width="15" height="15" rx="3" {...S} /></svg>,
  paperclip: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M17.08 9.08 10 16.17a4.17 4.17 0 1 1-5.89-5.9l7.08-7.08a2.78 2.78 0 0 1 3.93 3.93l-7.09 7.08a1.39 1.39 0 1 1-1.96-1.96l6.54-6.53" {...S} /></svg>,
  helpCircle: <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" {...S} /><path d="M7.58 7.5a2.5 2.5 0 0 1 4.86.83c0 1.67-2.5 2.5-2.5 2.5M10 14.17h.01" {...S} /></svg>,
  checkCircle: <svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="7" fill="#39AC71" /><path d="M6 9.2l2 2L12 7.4" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  plusCircle: <svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="7" fill="none" stroke="#CDD3CF" strokeWidth="1.5" /><path d="M9 6.2v5.6M6.2 9h5.6" fill="none" stroke="#CDD3CF" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  arrowRight: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.33 8h9.34M9.33 4.67 12.67 8l-3.34 3.33" {...S} strokeWidth={1.5} /></svg>,
  dots: <svg viewBox="0 0 20 20" aria-hidden="true"><g fill="currentColor"><circle cx="10" cy="4.2" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="15.8" r="1.5" /></g></svg>,
  clock: <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" {...S} stroke="#9CA49F" strokeWidth={1.5} /><path d="M8 4.67V8l2 1.33" {...S} stroke="#9CA49F" strokeWidth={1.5} /></svg>,
  video: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M14.67 6 11.33 8l3.34 2V6Z" {...S} stroke="#9CA49F" strokeWidth={1.5} /><rect x="1.33" y="4" width="10" height="8" rx="2" {...S} stroke="#9CA49F" strokeWidth={1.5} /></svg>,
  checkSmall: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" {...S} stroke="#2E7D5A" strokeWidth={1.6} /></svg>,
  copy: <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.33" y="5.33" width="8.67" height="8.67" rx="2" {...S} stroke="#6B746F" strokeWidth={1.33} /><path d="M10.67 5.33V4c0-1.1-.9-2-2-2H4a2 2 0 0 0-2 2v4.67c0 1.1.9 2 2 2h1.33" {...S} stroke="#6B746F" strokeWidth={1.33} /></svg>,
  calendarPlus: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M14 6.67H2M10.67 1.33v2.67M5.33 1.33v2.67M8 8.67v4M6 10.67h4" {...S} strokeWidth={1.4} /><rect x="2" y="2.67" width="12" height="12" rx="2.5" {...S} strokeWidth={1.4} /></svg>,
  clockRefresh: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.4 6a6.67 6.67 0 0 1 11.3-3.1L14.6 4.7M14.6 2v2.7h-2.7M14.6 10a6.67 6.67 0 0 1-11.3 3.1L1.4 11.3M1.4 14v-2.7h2.7M8 4.7V8l2 1.3" {...S} strokeWidth={1.4} /></svg>,
  cardRefresh: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M14.67 6.67H1.33M7.33 12H4M14.67 7.2V5.07c0-.75 0-1.12-.15-1.41a1.33 1.33 0 0 0-.58-.58c-.29-.15-.66-.15-1.41-.15H3.47c-.75 0-1.12 0-1.41.15-.25.13-.45.33-.58.58-.15.29-.15.66-.15 1.41v5.86c0 .75 0 1.12.15 1.41.13.25.33.45.58.58.29.15.66.15 1.41.15H8M11 14.67l1.33-1.34L11 12M14 10.67l-1.33 1.33 1.33 1.33" {...S} strokeWidth={1.3} /></svg>,
  xClose: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12 4 4 12M4 4l8 8" {...S} strokeWidth={1.5} /></svg>,
  user: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16.67 17.5c0-1.16 0-1.75-.15-2.22a3.33 3.33 0 0 0-2.13-2.13c-.47-.15-1.06-.15-2.22-.15H7.83c-1.16 0-1.75 0-2.22.15a3.33 3.33 0 0 0-2.13 2.13c-.15.47-.15 1.06-.15 2.22" {...S} /><circle cx="10" cy="6.25" r="3.33" {...S} /></svg>,
  asterisk: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5v15M2.5 10h15M4.7 4.7l10.6 10.6M15.3 4.7 4.7 15.3" {...S} /></svg>,
  globe: <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" {...S} /><path d="M2.5 10h15M10 2.5a11.5 11.5 0 0 1 0 15 11.5 11.5 0 0 1 0-15Z" {...S} /></svg>,
  logout: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M13.33 14.17 17.5 10l-4.17-4.17M17.5 10h-10M7.5 2.5H6.5c-1.4 0-2.1 0-2.64.27-.47.24-.86.62-1.1 1.1C2.5 4.4 2.5 5.1 2.5 6.5v7c0 1.4 0 2.1.27 2.63.24.48.63.86 1.1 1.1.53.27 1.23.27 2.63.27h1" {...S} /></svg>,
  chev: <svg viewBox="0 0 18 18" className="a2-chev" aria-hidden="true"><path d="M6.75 4.5 11.25 9l-4.5 4.5" fill="none" stroke="#6B746F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
};

/* ── the screen ──────────────────────────────────────────────────────────── */

export default function Account2() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  /* The client's own zone, which they set on Personal details, is what their times are
     shown in — not the clock of whatever machine they happen to be on. A client who
     moved to Dubai should see Dubai time from an Indian laptop too. The browser's zone
     is only the fallback, before the profile arrives or when they never set one. */
  const browserTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata', []);
  const tz = profile?.time_zone || browserTz;
  /* The therapist works to IST. Only show it as a second line when the client is actually
     on another clock — a client in India would otherwise read the same time twice. */
  const showSecondZone = useMemo(() => offsetOf(tz) !== 330, [tz]);
  /* The design writes this row as a country ("INDIA"). There is no reliable way to get
     a country from a zone in the browser, and "KOLKATA" would be an odd thing to call
     it, so the row carries the same short zone the session's time badges use. */
  const tzLabel = useMemo(() => SHORT_TZ(tz) || tz, [tz]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [p, s, k] = await Promise.all([
          clientApi.getProfile().catch(() => null),
          clientApi.getSessions({ page: 1, limit: 50 }).catch(() => null),
          clientApi.getClientPackages().catch(() => null),
        ]);
        if (!live) return;
        setProfile(p?.data?.client || p?.data?.profile || p?.data || null);

        // The next session that has not happened yet, soonest first.
        const list = s?.data?.sessions || s?.data || [];
        const upcoming = (Array.isArray(list) ? list : [])
          .filter((x) => ['booked', 'rescheduled', 'confirmed', 'pending'].includes(String(x.status || '').toLowerCase()))
          .map((x) => ({ x, at: startOf(x) }))
          .filter((e) => e.at && e.at.getTime() > Date.now() - 60 * 60 * 1000)
          .sort((a, b) => a.at - b.at)[0];
        setSession(upcoming ? { ...upcoming.x, _at: upcoming.at } : null);

        // The pack with sessions still on it. The endpoint answers with
        // data.clientPackages; the other two names are older shapes.
        const packs = k?.data?.clientPackages || k?.data?.packages || k?.data || [];
        const open = (Array.isArray(packs) ? packs : [])
          .filter((q) => Number(q.remaining_sessions) > 0)
          .sort((a, b) => new Date(b.purchased_at || 0) - new Date(a.purchased_at || 0))[0];
        setPack(open || null);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  // Close the "..." menu on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const away = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    const key = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', key); };
  }, [menuOpen]);

  const fullName = nameOf(profile) || nameOf(user) || user?.email || 'Your account';
  const phone = profile?.phone_number || profile?.phone || user?.phone_number || '';
  const since = monthYear(profile?.created_at || user?.created_at);
  const avatar = photoOf(profile);

  const therapist = session?.psychologist;
  const meet = session ? meetLinkOf(session) : '';
  const startsIn = session?._at ? session._at.getTime() - Date.now() : null;
  const joinable = startsIn != null && startsIn < 15 * 60 * 1000;

  const packTotal = Number(pack?.total_sessions || pack?.session_count || pack?.package?.session_count || 0);
  const packLeft = Number(pack?.remaining_sessions || 0);

  /* Copying the link matters on a phone, where selecting that much text by hand is
     awkward. The tick falls back to nothing if the clipboard is blocked. */
  const copyMeet = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(meet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* no clipboard permission — the link is still a link */ }
  }, [meet]);

  const addToCalendar = useCallback(() => {
    if (!session?._at) return;
    const end = new Date(session._at.getTime() + (Number(session.duration_minutes) || 50) * 60000);
    const stamp = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', `Koott session with ${nameOf(therapist) || 'your therapist'}`);
    url.searchParams.set('dates', `${stamp(session._at)}/${stamp(end)}`);
    if (meet) url.searchParams.set('details', meet);
    window.open(url.toString(), '_blank', 'noopener');
    setMenuOpen(false);
  }, [session, therapist, meet]);

  /* The 24-hour rules and their popups live on My sessions; send the client there rather
     than keeping a second copy of that logic here. */
  const goToSessions = useCallback(() => { setMenuOpen(false); router.push('/profile/sessions'); }, [router]);

  const row = (icon, label, onClick, extra) => (
    <button type="button" className={`a2-more-row${extra?.danger ? ' is-danger' : ''}`} onClick={onClick}>
      {icon}
      <span className="a2-more-label">{label}</span>
      {extra?.right}
      {!extra?.hideChev && I.chev}
    </button>
  );

  return (
    <div className="a2">
      <style dangerouslySetInnerHTML={{ __html: ACCOUNT2_CSS }} />
      <div className="a2-shell">
        <div className="a2-top">
          <button type="button" className="a2-back" onClick={() => router.back()} aria-label="Go back">{I.back}</button>
        </div>

        <div className="a2-body">
          {/* 1 — who you are */}
          <div className="a2-id">
            <div className="a2-avatar">
              {avatar ? <img src={avatar} alt="" /> : <span>{initials(fullName)}</span>}
            </div>
            <div className="a2-id-text">
              <h1 className="a2-name">{fullName}</h1>
              <div className="a2-id-meta">
                {phone && <span className="a2-phone">{phone}</span>}
                {phone && since && <span className="a2-dot" />}
                {since && <span className="a2-since">{since}</span>}
              </div>
            </div>
          </div>

          {/* 2 — shortcuts */}
          <div className="a2-shortcuts">
            <button type="button" className="a2-shortcut" onClick={() => router.push('/profile/sessions')}>
              <span className="a2-shortcut-icon">{I.calendarCheck}</span>
              <span className="a2-shortcut-label">My Sessions</span>
            </button>
            <button type="button" className="a2-shortcut" onClick={() => router.push('/profile/reports')}>
              <span className="a2-shortcut-icon">{I.paperclip}</span>
              <span className="a2-shortcut-label">Reports &amp; Prescription</span>
            </button>
            <button type="button" className="a2-shortcut" onClick={() => router.push('/profile/contact')}>
              <span className="a2-shortcut-icon">{I.helpCircle}</span>
              <span className="a2-shortcut-label">Help &amp; Care Team</span>
            </button>
          </div>

          {/* On a laptop these two become the main column; on a phone the wrapper is
              display:contents, so they sit straight in the body's column as before. */}
          <div className="a2-main">
          {/* 3 — session pack */}
          {loading && !pack ? <div className="a2-skeleton" /> : pack ? (
            <div className="a2-card a2-pack">
              <div className="a2-pack-top">
                <div className="a2-pack-cell">
                  <span className="a2-pack-label">Session Pack</span>
                  <span className="a2-pack-value">{packTotal || packLeft} Session{(packTotal || packLeft) === 1 ? '' : 's'}</span>
                </div>
                <span className="a2-pack-rule" />
                <div className="a2-pack-cell">
                  <span className="a2-pack-label">Left to use</span>
                  <span className="a2-pack-value">{packLeft} of {packTotal || packLeft}</span>
                </div>
              </div>
              <div className="a2-pack-line" />
              <div className="a2-pack-bottom">
                <div className="a2-pips">
                  {Array.from({ length: Math.min(packTotal || packLeft, 6) }).map((_, i) => (
                    <span key={i}>{i < (packTotal || packLeft) - packLeft ? I.checkCircle : I.plusCircle}</span>
                  ))}
                  <span className="a2-slots">{packLeft}/{packTotal || packLeft} left</span>
                </div>
                <button type="button" className="a2-btn" onClick={() => router.push('/profile/packages')}>
                  Book Follow-up {I.arrowRight}
                </button>
              </div>
            </div>
          ) : null}

          {/* 4 — the next session */}
          {loading && !session ? <div className="a2-skeleton" /> : session ? (
            <div className="a2-card a2-session" ref={menuRef}>
              <div className="a2-ses-head">
                <div className="a2-ses-avatar">
                  {photoOf(therapist) ? <img src={photoOf(therapist)} alt="" /> : <span>{initials(nameOf(therapist))}</span>}
                </div>
                <div className="a2-ses-who">
                  <span className="a2-ses-name">{nameOf(therapist) || 'Your therapist'}</span>
                  <span className="a2-ses-role">{roleOf(therapist)}</span>
                </div>
                <button type="button" className="a2-ses-more" onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu" aria-expanded={menuOpen} aria-label="Session options">{I.dots}</button>
              </div>
              <div className="a2-div" />
              <div className="a2-ses-when">
                <div className="a2-ses-row">
                  <span className="a2-ses-tile" aria-hidden="true">{I.clock}</span>
                  <span className="a2-ses-time">{whenIn(session._at, tz)}</span>
                  <span className="a2-tz">{SHORT_TZ(tz) || 'Local'}</span>
                  {showSecondZone && (
                    <>
                      <span className="a2-ses-time">or {timeIn(session._at, 'Asia/Kolkata')}</span>
                      <span className="a2-tz">IST</span>
                    </>
                  )}
                </div>
                {meet && (
                  <div className="a2-ses-row">
                    <span className="a2-ses-tile" aria-hidden="true">{I.video}</span>
                    <a className="a2-ses-link" href={meet} target="_blank" rel="noopener noreferrer">{meet}</a>
                    <button type="button" className="a2-ses-copy" onClick={copyMeet}
                      aria-label={copied ? 'Link copied' : 'Copy the meeting link'}>
                      {copied ? I.checkSmall : I.copy}
                    </button>
                  </div>
                )}
              </div>
              <div className="a2-div" />
              <div className="a2-ses-note">
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Send a note..." aria-label="Send a note to your therapist" />
              </div>
              <button type="button" className="a2-join" disabled={!meet || !joinable}
                onClick={() => meet && window.open(meet, '_blank', 'noopener')}>
                {joinable ? 'Join Session' : 'Join Session'}
              </button>

              {menuOpen && (
                <div className="a2-menu" role="menu">
                  <button type="button" className="a2-menu-row" role="menuitem" onClick={addToCalendar}>{I.calendarPlus}Add to calendar</button>
                  <button type="button" className="a2-menu-row" role="menuitem" onClick={goToSessions}>{I.clockRefresh}Reschedule</button>
                  <button type="button" className="a2-menu-row" role="menuitem" onClick={goToSessions}>{I.cardRefresh}Change therapist</button>
                  <button type="button" className="a2-menu-row is-off" role="menuitem" onClick={goToSessions}>{I.xClose}Cancel Booking</button>
                </div>
              )}
            </div>
          ) : !loading ? (
            <div className="a2-empty">
              <p>No session booked yet.</p>
              <button type="button" className="a2-btn" onClick={() => router.push('/book-malayali-psychologists')}>
                Book a session {I.arrowRight}
              </button>
            </div>
          ) : null}

          </div>

          {/* 5 — the rest */}
          <div className="a2-more">
            {row(I.user, 'Personal details', () => router.push('/profile/profile'))}
            {row(I.asterisk, 'Self Help & Assessments', () => router.push('/assessments'))}
            {row(I.globe, 'Time zone', () => router.push('/profile/profile'), {
              right: <span className="a2-more-right"><span className="a2-more-tz">{tzLabel}</span></span>,
            })}
            {row(I.logout, 'Log out', () => { logout?.(); router.push('/'); }, { danger: true, hideChev: true })}
          </div>
        </div>
      </div>
    </div>
  );
}
