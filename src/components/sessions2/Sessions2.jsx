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
import { clientApi } from '@/lib/backendApi';
import { SESSIONS2_CSS } from './sessions2.css';
import {
  CopyButton, Icon, Stars, initials, kindOf, money, nameOf, photoOf, refOf, startOf, statusOf, whenOf,
} from './shared';

const CARE_WHATSAPP = '919539007766';
const OPEN_REFUND = ['requested', 'pending', 'approved', 'processing', 'initiated'];

export default function Sessions2() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [status, setStatus] = useState('loading');
  const [tab, setTab] = useState('upcoming');
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
