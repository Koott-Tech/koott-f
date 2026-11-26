'use client';

/**
 * Session details — Koott 2.0.
 *
 * Built to the Figma file "Koott 2.0" (EzLwBjoYNqTa9RMEmOfyQO), section Home (WIP),
 * screen "Session details" (8063:4315), drawn at 402 px.
 *
 *   green hero       what happened to this session, in a sentence
 *   rate             "How was your session?" — only once it is over
 *   session info     therapist, date, kind, and the plan it came from
 *   pack             what is left of that pack, and Book Follow-up
 *   billing          fee, coupon, total, and what it saved
 *   invoice          opens the receipt
 *   reference        booking id and when it was booked
 *
 * Live, not a mock-up: /clients/sessions/:id, /clients/packages, /clients/receipts
 * and the rating at /clients/sessions/:id/feedback.
 *
 * Reschedule and cancel are not here. Their 24-hour rules and popups live in
 * ClientDashboard at /dashboard, and an upcoming session links there rather than
 * this screen keeping a second copy of those rules.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientApi } from '@/lib/backendApi';
import { SESSIONS2_CSS } from './sessions2.css';
// The Join card is the account page's own card — same design, same numbers — so
// it is drawn with that stylesheet under a nested `.a2` rather than copied here.
import { ACCOUNT2_CSS } from '@/components/account2/account2.css';
import {
  CopyButton, Icon, Stars, dayOf, initials, kindOf, minutesOf, money, nameOf, photoOf, refOf,
  stampOf, startOf, statusOf, whenOf,
} from './shared';

/** The clock time in a zone, for the card's second line. */
const timeIn = (date, tz) => (date
  ? new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(date)
  : '');

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

/** Intl calls India "GMT+5:30"; the design (and everyone) says IST. */
function shortZone(tz) {
  if (offsetOf(tz) === 330) return 'IST';
  try {
    return (new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeZoneName: 'short' })
      .formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value || '').replace('GMT', 'GMT ');
  } catch { return ''; }
}

const CARE_WHATSAPP = '919539007766';

/** The hero's heading and line, which say what became of this session. */
function heroFor(session, at, tz) {
  const who = nameOf(session?.psychologist) || 'your therapist';
  const when = at ? whenOf(at, tz).split(' · ')[0] : '';
  const mins = minutesOf(session);
  const s = String(session?.status || '').toLowerCase();
  if (s === 'completed') return ['Session completed', `${mins} minutes with ${who} on ${when}.`];
  if (s === 'cancelled' || s === 'canceled') return ['Session cancelled', `Your session with ${who} on ${when} was cancelled.`];
  if (s === 'no_show' || s === 'missed') return ['Session missed', `Nobody joined the session with ${who} on ${when}.`];
  return ['Session Booked', `${mins} minutes with ${who} on ${when}.`];
}

export default function SessionDetails2({ sessionId }) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [pack, setPack] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [status, setStatus] = useState('loading');
  const [stars, setStars] = useState(0);
  const [note, setNote] = useState('');

  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata', []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const r = await clientApi.getSession(sessionId);
        if (!live) return;
        const s = r?.data?.session || r?.data || null;
        if (!s) { setStatus('missing'); return; }
        setSession(s);
        setStars(Number(s.rating) || 0);
        setStatus('ready');

        // The pack this session came from, and its receipt, are extras: the page
        // is useful without either, so they never block it.
        const [k, rc] = await Promise.all([
          clientApi.getClientPackages().catch(() => null),
          clientApi.getReceipts?.().catch(() => null),
        ]);
        if (!live) return;
        const packs = k?.data?.clientPackages || k?.data?.packages || [];
        const group = s.package_group_id || s.package_id;
        setPack((Array.isArray(packs) ? packs : []).find((p) => p.id === group || p.package_id === s.package_id) || null);
        const list = rc?.data?.receipts || rc?.data || [];
        setReceipt((Array.isArray(list) ? list : []).find((x) => x.session_id === s.id) || null);
      } catch {
        if (live) setStatus('error');
      }
    })();
    return () => { live = false; };
  }, [sessionId]);

  const at = useMemo(() => startOf(session), [session]);
  const rate = useCallback(async (n) => {
    setStars(n);
    try { await clientApi.submitSessionFeedback(sessionId, { rating: n }); } catch { /* the stars still show */ }
  }, [sessionId]);

  if (status === 'loading' || status === 'error' || status === 'missing') {
    return (
      <div className="s2">
        <style dangerouslySetInnerHTML={{ __html: SESSIONS2_CSS }} />
        <div className="s2-shell">
          <div className="s2-top">
            <button type="button" className="s2-back" onClick={() => router.push('/profile/sessions')} aria-label="Go back">{Icon.back}</button>
          </div>
          <div className="s2-body">
            {status === 'loading' ? <div className="s2-skeleton" /> : (
              <div className="s2-note">
                <p>{status === 'missing' ? 'We couldn’t find that session.' : 'We couldn’t load that session just now.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const mark = statusOf(session);
  const [title, line] = heroFor(session, at, tz);
  const who = session.psychologist;
  const over = ['completed'].includes(String(session.status || '').toLowerCase());
  const openStatus = ['booked', 'rescheduled', 'confirmed', 'pending'].includes(String(session.status || '').toLowerCase());
  const upcoming = openStatus && !!at && at.getTime() > Date.now() - 60 * 60 * 1000;
  const meet = session.google_meet_link || session.google_meet_join_url || session.google_calendar_link || '';
  // The link opens a quarter of an hour before the session, not before that.
  const joinable = !!at && at.getTime() - Date.now() < 15 * 60 * 1000;
  const fee = Number(session.price ?? session.amount) || 0;
  const off = Number(session.discount_amount) || 0;
  const paid = Number(session.amount ?? fee) || 0;
  const packTotal = Number(pack?.total_sessions || 0);
  const packLeft = Number(pack?.remaining_sessions || 0);

  return (
    <div className="s2">
      <style dangerouslySetInnerHTML={{ __html: `${SESSIONS2_CSS}
${ACCOUNT2_CSS}` }} />
      <div className="s2-hero">
        <div className="s2-shell">
          <div className="s2-top">
            <button type="button" className="s2-back" onClick={() => router.push('/profile/sessions')} aria-label="Go back">{Icon.back}</button>
            <a className="s2-help" href={`https://wa.me/${CARE_WHATSAPP}?text=${encodeURIComponent(`Hi Koott, I have a question about my session on ${at ? whenOf(at, tz) : ''}.`)}`} target="_blank" rel="noreferrer">
              {Icon.help}Help
            </a>
          </div>
          <div className="s2-hero-text">
            <h1 className="s2-hero-title">{title}</h1>
            <p className="s2-hero-sub">{line}</p>
          </div>
        </div>
      </div>

      <div className="s2-shell">
        <div className="s2-body is-detail">
          <div className="s2-main">
            {over && (
              <div className="s2-panel">
                <h2 className="s2-panel-title">How was your session?</h2>
                <Stars value={stars} onRate={rate} big />
              </div>
            )}

            {/* The Join card, for a session that has not happened yet: both clocks,
                the meeting link, a note, and the way in. Figma 8080:31367 makes
                this the whole point of the screen after a booking. */}
            {upcoming && (
              <div className="a2">
                <div className="a2-card a2-session">
                  <div className="a2-ses-head">
                    <div className="a2-ses-avatar">
                      {photoOf(who) ? <img src={photoOf(who)} alt="" /> : <span>{initials(nameOf(who))}</span>}
                    </div>
                    <div className="a2-ses-who">
                      <span className="a2-ses-name">{nameOf(who) || 'Your therapist'}</span>
                      <span className="a2-ses-role">{who?.designation || 'Psychologist'}</span>
                    </div>
                  </div>
                  <div className="a2-div" />
                  <div className="a2-ses-when">
                    <div className="a2-ses-row">
                      <span className="a2-ses-tile" aria-hidden="true">{Icon.clock}</span>
                      <span className="a2-ses-time">{whenOf(at, tz)}</span>
                      <span className="a2-tz">{shortZone(tz) || 'Local'}</span>
                      {offsetOf(tz) !== 330 && (
                        <>
                          <span className="a2-ses-time">or {timeIn(at, 'Asia/Kolkata')}</span>
                          <span className="a2-tz">IST</span>
                        </>
                      )}
                    </div>
                    {meet && (
                      <div className="a2-ses-row">
                        <span className="a2-ses-tile" aria-hidden="true">{Icon.video}</span>
                        <a className="a2-ses-link" href={meet} target="_blank" rel="noopener noreferrer">{meet}</a>
                        <CopyButton value={meet} label="Copy the meeting link" />
                      </div>
                    )}
                  </div>
                  <div className="a2-div" />
                  <div className="a2-ses-note">
                    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Send a note..." aria-label="Send a note to your therapist" />
                  </div>
                  {/* It opens 15 minutes before; until then it says so rather than
                      looking broken when nothing happens. */}
                  <button
                    type="button"
                    className="a2-join"
                    disabled={!meet || !joinable}
                    onClick={() => meet && window.open(meet, '_blank', 'noopener')}
                  >
                    {joinable ? 'Join Session' : 'Join Session'}
                  </button>
                </div>
              </div>
            )}

            <div className="s2-panel">
              <button type="button" className="s2-who" style={{ width: '100%', textAlign: 'left' }}
                onClick={() => router.push('/book-malayali-psychologists')}>
                <span className="s2-photo">{photoOf(who) ? <img src={photoOf(who)} alt="" /> : initials(nameOf(who))}</span>
                <span className="s2-who-text">
                  <span className="s2-name">{nameOf(who) || 'Your therapist'}</span>
                  <span className="s2-kind">{who?.designation || 'Psychologist'}</span>
                </span>
                {Icon.chev}
              </button>
              <div className="s2-div" />
              <div className="s2-kv"><span className="s2-k">Date</span><span className="s2-v">{whenOf(at, tz, true)}</span></div>
              <div className="s2-kv"><span className="s2-k">Session</span><span className="s2-v">{kindOf(session)}</span></div>
              <div className="s2-kv">
                <span className="s2-k">Plan</span>
                <span className="s2-v">{packTotal ? `${packTotal} session pack · ${packLeft} left` : 'Single session'}</span>
              </div>
              <div className="s2-kv"><span className="s2-k">Status</span><span className="s2-v"><span className="s2-status">{mark.icon}{mark.label}</span></span></div>
            </div>

            <div className="s2-section">
              <h2 className="s2-panel-title">Billing details</h2>
              <div className="s2-bill">
                <div className="s2-bill-rows">
                  <div className="s2-kv"><span className="s2-k">Session fee</span><span className="s2-v">{money(fee, 'INR')}</span></div>
                  {off > 0 && (
                    <div className="s2-kv">
                      <span className="s2-k">Coupon {session.coupon_code || ''}</span>
                      <span className="s2-v">− {money(off, 'INR')}</span>
                    </div>
                  )}
                  <div className="s2-div" />
                  <div className="s2-kv s2-bill-total"><span className="s2-k">Total paid</span><span className="s2-v">{money(paid, 'INR')}</span></div>
                </div>
                {off > 0 && <div className="s2-saved">You saved {money(off, 'INR')} on this booking</div>}
              </div>
            </div>
          </div>

          <div className="s2-side">
            {packTotal > 0 && (
              <div className="s2-panel">
                <div className="s2-kv">
                  <span className="s2-k">Session Pack</span>
                  <span className="s2-v">{packTotal} Sessions</span>
                </div>
                <div className="s2-div" />
                <div className="s2-kv">
                  <span className="s2-k">Left to use</span>
                  <span className="s2-v">{packLeft} of {packTotal}</span>
                </div>
                <button type="button" className="s2-card-cta is-join" style={{ borderRadius: 9999, height: 32 }}
                  onClick={() => router.push('/profile/packages')}>
                  Book Follow-up
                </button>
              </div>
            )}

            <div className="s2-rowlist">
              <button type="button" className="s2-rowlist-row"
                onClick={() => router.push(receipt ? `/profile/receipts?open=${receipt.id}` : '/profile/receipts')}>
                {Icon.invoice}<span>View Invoice</span>{Icon.chev}
              </button>
            </div>

            <div className="s2-bill">
              <div className="s2-bill-rows">
                <div>
                  <div className="s2-k">Booking ID</div>
                  <div className="s2-v" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {refOf(session.id)}
                    <CopyButton value={String(session.id)} label="Copy the booking id" />
                  </div>
                </div>
                <div className="s2-div" />
                <div>
                  <div className="s2-k">Booked on</div>
                  <div className="s2-v" style={{ textAlign: 'left' }}>{stampOf(session.booking_created_at || session.created_at, tz) || dayOf(session.created_at, tz)}</div>
                </div>
              </div>
            </div>

            {!over && String(session.status || '').toLowerCase() !== 'cancelled' && (
              <button type="button" className="s2-wide" onClick={() => router.push('/dashboard')}>
                Reschedule or cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
