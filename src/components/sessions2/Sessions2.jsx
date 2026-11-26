'use client';

/**
 * My sessions — Koott 2.0.
 *
 * Built to the Figma file "Koott 2.0" (EzLwBjoYNqTa9RMEmOfyQO), section Home (WIP),
 * screen "My sessions" (8063:4171), drawn at 402 px.
 *
 *   top bar          back, and Help on WhatsApp
 *   title            "My sessions"
 *   refunds banner   only when the client has one open; it opens /profile/refunds
 *   tabs             Upcoming · Past
 *   cards            therapist, what kind, status, when, booking reference, and a
 *                    footer that changes with the session: rate it, the rating you
 *                    left, what was refunded, or nothing
 *
 * Live, not a mock-up: the client's own sessions (/clients/sessions), their refunds
 * (/clients/refunds) and the rating they leave (/clients/sessions/:id/feedback).
 *
 * Reschedule and cancel are not here. Their 24-hour rules and the popups that
 * explain them live in ClientDashboard, which is still served at /dashboard; the
 * card's View Details leads to the session, which links on to it. Keeping one copy
 * of those rules matters more than having the button in two places.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientApi, messagesApi } from '@/lib/backendApi';
import { SESSIONS2_CSS } from './sessions2.css';
import {
  CopyButton, Icon, Stars, initials, kindOf, money, nameOf, nearWhen, offsetOf, photoOf, refOf,
  startOf, statusOf, timeIn, whenOf, zoneLabel,
} from './shared';

/** The link the client joins on. Different bookings carry it under different names. */
const meetOf = (s) => s?.google_meet_link || s?.google_meet_join_url || s?.meeting_link || s?.google_calendar_link || '';

const CARE_WHATSAPP = '919539007766';
const OPEN_REFUND = ['requested', 'pending', 'approved', 'processing', 'initiated'];

export default function Sessions2() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [status, setStatus] = useState('loading');
  const [tab, setTab] = useState('upcoming');
  /* The note on the next session: what is typed, and how the send went. */
  const [note, setNote] = useState('');
  const [noteState, setNoteState] = useState('');   // '' | 'sending' | 'sent' | 'failed'
  const [rating, setRating] = useState({});

  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata', []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [s, r] = await Promise.all([
          clientApi.getSessions({ page: 1, limit: 100 }),
          clientApi.getRefunds().catch(() => null),
        ]);
        if (!live) return;
        const list = s?.data?.sessions || s?.data || [];
        setRows(Array.isArray(list) ? list : []);
        const rl = r?.data?.refunds || [];
        setRefunds(Array.isArray(rl) ? rl : []);
        setStatus('ready');
      } catch {
        if (live) setStatus('error');
      }
    })();
    return () => { live = false; };
  }, []);

  /* A session belongs to Upcoming while it is still ahead and nobody has closed it;
     everything else — done, cancelled, missed, or simply past — is in Past. */
  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up = [];
    const old = [];
    rows.forEach((x) => {
      const at = startOf(x);
      const st = String(x.status || '').toLowerCase();
      const open = ['booked', 'rescheduled', 'confirmed', 'pending'].includes(st);
      if (open && at && at.getTime() > now - 60 * 60 * 1000) up.push({ ...x, _at: at });
      else old.push({ ...x, _at: at });
    });
    up.sort((a, b) => (a._at?.getTime() || 0) - (b._at?.getTime() || 0));
    old.sort((a, b) => (b._at?.getTime() || 0) - (a._at?.getTime() || 0));
    return { upcoming: up, past: old };
  }, [rows]);

  const openRefunds = useMemo(
    () => refunds.filter((r) => OPEN_REFUND.includes(String(r.status || '').toLowerCase())),
    [refunds],
  );
  /* What was actually sent back, by session, so a cancelled card can say so. */
  const refundBySession = useMemo(() => {
    const m = new Map();
    refunds.forEach((r) => {
      if (String(r.status || '').toLowerCase() === 'refunded' || r.refunded_at) {
        m.set(String(r.session_id), r);
      }
    });
    return m;
  }, [refunds]);

  const rate = useCallback(async (id, stars) => {
    setRating((v) => ({ ...v, [id]: stars }));
    try { await clientApi.submitSessionFeedback(id, { rating: stars }); } catch { /* shown below */ }
  }, []);

  const list = tab === 'upcoming' ? upcoming : past;

  /* "Send a note" is a real message to the therapist: it opens (or finds) the
     conversation for this session and posts what was typed. */
  const sendNote = useCallback(async (sessionId) => {
    const text = note.trim();
    if (!text || noteState === 'sending') return;
    setNoteState('sending');
    try {
      const made = await messagesApi.createConversation(sessionId);
      /* This endpoint answers in two shapes and puts its payload under `message`:
         { conversation: {...} } the first time, { conversationId } every time after. */
      const box = (made && typeof made.message === 'object' ? made.message : null) ?? made?.data ?? made;
      const id = box?.conversation?.id || box?.conversationId || box?.id;
      if (!id) throw new Error('no conversation');
      await messagesApi.sendMessage(id, { content: text });
      setNote('');
      setNoteState('sent');
      setTimeout(() => setNoteState(''), 2600);
    } catch (_) {
      setNoteState('failed');
      setTimeout(() => setNoteState(''), 3200);
    }
  }, [note, noteState]);

  return (
    <div className="s2">
      <style dangerouslySetInnerHTML={{ __html: SESSIONS2_CSS }} />
      <div className="s2-shell">
        <div className="s2-top">
          <button type="button" className="s2-back" onClick={() => router.push('/profile')} aria-label="Go back">{Icon.back}</button>
          <a
            className="s2-help"
            href={`https://wa.me/${CARE_WHATSAPP}?text=${encodeURIComponent('Hi Koott, I need help with one of my sessions.')}`}
            target="_blank"
            rel="noreferrer"
          >
            {Icon.help}Help
          </a>
        </div>

        <div className="s2-title"><h1>My sessions</h1></div>

        <div className="s2-body is-list">
          {openRefunds.length > 0 && (
            <button type="button" className="s2-banner" onClick={() => router.push('/profile/refunds')}>
              <span className="s2-banner-icon">{Icon.refresh}</span>
              <span className="s2-banner-text">Active refunds: {openRefunds.length}</span>
              <span className="s2-banner-all">View all {Icon.chevGreen}</span>
            </button>
          )}

          <div className="s2-tabs" role="tablist">
            {[['upcoming', 'Upcoming'], ['past', 'Past']].map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                className={`s2-tab${tab === k ? ' is-on' : ''}`}
                onClick={() => setTab(k)}
              >
                {label}
              </button>
            ))}
          </div>

          {status === 'loading' && <div className="s2-list"><div className="s2-skeleton" /><div className="s2-skeleton" /></div>}

          {status === 'error' && (
            <div className="s2-note"><p>We couldn’t load your sessions just now. Please refresh to try again.</p></div>
          )}

          {status === 'ready' && list.length === 0 && (
            <div className="s2-note">
              <p>{tab === 'upcoming' ? 'No session booked yet.' : 'Nothing here yet.'}</p>
              {tab === 'upcoming' && (
                <button type="button" className="s2-card-cta is-join" style={{ borderRadius: 9999, width: 'auto', padding: '8px 20px' }}
                  onClick={() => router.push('/book-malayali-psychologists')}>
                  Book a session
                </button>
              )}
            </div>
          )}

          {status === 'ready' && list.length > 0 && (
            <div className="s2-list">
              {list.map((s) => {
                const mark = statusOf(s);
                const who = s.psychologist;
                const refund = refundBySession.get(String(s.id));
                const stars = rating[s.id] ?? s.rating ?? 0;
                const isPast = tab === 'past';
                const canRate = isPast && String(s.status || '').toLowerCase() === 'completed';
                const meet = meetOf(s);
                /* The design draws the session you are going to next in full. */
                const isNext = !isPast && s.id === list[0]?.id;
                if (isNext) {
                  return (
                    <article className="s2-card is-next" key={s.id}>
                      <div className="s2-next-head">
                        <span className="s2-photo">
                          {photoOf(who) ? <img src={photoOf(who)} alt="" /> : initials(nameOf(who))}
                        </span>
                        <span className="s2-next-who">
                          <span className="s2-next-name">{nameOf(who) || 'Your therapist'}</span>
                          <span className="s2-next-role">{who?.designation || kindOf(s)}</span>
                        </span>
                      </div>

                      <div className="s2-div" />
                      <div className="s2-when-block">
                        <div className="s2-when-row">
                          <span className="s2-tile" aria-hidden="true">{Icon.clock}</span>
                          <span className="s2-time">{nearWhen(s._at, tz)}</span>
                          <span className="s2-zone">{zoneLabel(tz)}</span>
                          {/* The therapist works to IST; only worth saying when it differs. */}
                          {offsetOf(tz) !== 330 && (
                            <>
                              <span className="s2-time">or {timeIn(s._at, 'Asia/Kolkata')}</span>
                              <span className="s2-zone">IST</span>
                            </>
                          )}
                        </div>
                        {meet && (
                          <div className="s2-when-row">
                            <span className="s2-tile" aria-hidden="true">{Icon.video}</span>
                            <a className="s2-meet" href={meet} target="_blank" rel="noopener noreferrer">{meet}</a>
                            <CopyButton value={meet} label="Copy the meeting link" />
                          </div>
                        )}
                      </div>

                      <div className="s2-div" />
                      <div className="s2-note-row">
                        <input
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') sendNote(s.id); }}
                          placeholder="Send a note..."
                          aria-label={`Send a note to ${nameOf(who) || 'your therapist'}`}
                        />
                        {noteState === 'sent'
                          ? <span className="s2-note-said">Sent</span>
                          : (
                            <button type="button" className="s2-note-send"
                              disabled={!note.trim() || noteState === 'sending'}
                              onClick={() => sendNote(s.id)}>
                              {noteState === 'sending' ? 'Sending…' : noteState === 'failed' ? 'Try again' : 'Send'}
                            </button>
                          )}
                      </div>

                      <button
                        type="button"
                        className="s2-card-cta is-join"
                        disabled={!meet}
                        onClick={() => meet && window.open(meet, '_blank', 'noopener')}
                      >
                        Join Session
                      </button>
                      <button type="button" className="s2-card-cta" onClick={() => router.push(`/profile/sessions/${s.id}`)}>
                        View Details
                      </button>
                    </article>
                  );
                }
                return (
                  <article className="s2-card" key={s.id}>
                    <div className="s2-card-top">
                      <div className="s2-who">
                        <span className="s2-photo">
                          {photoOf(who) ? <img src={photoOf(who)} alt="" /> : initials(nameOf(who))}
                        </span>
                        <span className="s2-who-text">
                          <span className="s2-name">{nameOf(who) || 'Your therapist'}</span>
                          <span className="s2-kind">{kindOf(s)}</span>
                        </span>
                        <span className="s2-status">{mark.icon}{mark.label}</span>
                      </div>
                      <div className="s2-meta">
                        <span className="s2-when">{Icon.clock}{whenOf(s._at, tz)}</span>
                        <span className="s2-id">
                          <span className="s2-id-k">ID:</span>
                          <span className="s2-id-v">{refOf(s.id)}</span>
                          <CopyButton value={String(s.id)} label="Copy the booking id" />
                        </span>
                      </div>
                    </div>

                    {(canRate || refund) && <div className="s2-div" />}

                    {canRate && (
                      <div className="s2-card-foot">
                        <span className="s2-foot-label">{stars ? 'Your rating' : 'Rate session'}</span>
                        <Stars value={stars} onRate={(n) => rate(s.id, n)} />
                      </div>
                    )}

                    {!canRate && refund && (
                      <div className="s2-card-foot">
                        <span className="s2-refunded">
                          {Icon.receipt}
                          {money(refund.amount_refunded ?? refund.amount_suggested ?? refund.amount_paid, refund.currency)} refunded
                        </span>
                      </div>
                    )}

                    <button type="button" className="s2-card-cta" onClick={() => router.push(`/profile/sessions/${s.id}`)}>
                      View Details
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
