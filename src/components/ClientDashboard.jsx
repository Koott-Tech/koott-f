'use client';

/**
 * The client dashboard — "Your sessions".
 *
 * Booked sessions follow Figma "Post payment screens" (Booking/ Dashboard 1123:17876,
 * more options 1123:17936, Session details 1123:18093 / 18161 / 18311; phone 1123:18598,
 * 19037, 18663, 18731): a card per session with Date / Time / Session tiles, a "Manage
 * your session" menu behind the ⋮, and a details view (?session=<id>) with the payment
 * summary, the invoice and the session's activity.
 *
 * Built to the prototype in "koott-client-dashboard (2).html" (repo root). That
 * file has a preview switch with six states; here the state is whatever the
 * client's data says it is:
 *
 *   new        no upcoming session and nothing half-booked  → find a specialist
 *   awaiting   a booking was started but not paid for        → ticket, Proceed to pay
 *   paid       one confirmed session ahead                   → ticket + panels
 *   package    an active package with sessions left to book  → package panel
 *   multi      more than one session ahead                   → "Coming up" list
 *   history    the Completed tab with past sessions          → booking history
 *
 * These are not exclusive: a client with a package and three sessions ahead sees
 * the ticket, the package panel and the Coming up list together, exactly as the
 * prototype composes them.
 *
 * Sessions exist only once they are paid for (services/sessionCreationService),
 * so the "awaiting payment" ticket is drawn from the booking draft this browser
 * keeps (lib/bookingDraft), the same one the Resume card on the listing uses.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { clientApi } from '@/lib/backendApi';
import RescheduleModal from '@/components/RescheduleModal';
import { useBookingDraft } from '@/components/ResumeBookingCard';
import { therapistSlug } from '@/components/TherapistProfile';

/* ── formatting ─────────────────────────────────────────────────────────── */

const IST = 'Asia/Kolkata';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** sessions.scheduled_date + scheduled_time are IST wall-clock. */
const startOf = (s) => {
  if (!s?.scheduled_date) return null;
  const time = String(s.scheduled_time || '00:00:00').split(' ')[0];
  const d = new Date(`${s.scheduled_date}T${time}+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
};
const dayLabel = (d, withYear) => (d
  ? `${DOW[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`
  : '—');
const timeLabel = (d) => (d
  ? d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: IST })
  : '—');
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const isToday = (d) => d && new Date().toDateString() === d.toDateString();
const minutesTo = (d) => (d ? Math.round((d.getTime() - Date.now()) / 60000) : null);

const nameOf = (p) => [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || 'Your therapist';
const roleOf = (p) => p?.designation || p?.specialization
  || (Array.isArray(p?.area_of_expertise) ? p.area_of_expertise[0] : '') || 'Psychologist';
const meetLinkOf = (s) => s?.google_meet_link || s?.google_meet_join_url || s?.google_calendar_link || '';
const DURATION = (s) => Number(s?.duration_minutes) || 50;

/* ── artwork, as in the prototype ───────────────────────────────────────── */

const FACES = {
  therapist: [
    ['#dfeee6', '#1f3d5a', '#c98f6b', '#1c1512', 0], ['#f3e3d3', '#7a3e4a', '#b9825f', '#2a1a14', 1],
    ['#e6efe0', '#2a3a34', '#d9a480', '#17110e', 0], ['#f7e6d0', '#c7852b', '#a8714f', '#1b1310', 1],
    ['#e2ecf3', '#e8ecef', '#c48a66', '#1f1611', 0],
  ],
  psychiatrist: [
    ['#e2ecf3', '#1e2f45', '#c48a66', '#17110e', 0], ['#f6e3e0', '#6b3a52', '#d0987a', '#2a1a14', 1],
    ['#e9e6f3', '#22303a', '#b9825f', '#1c1512', 0], ['#f4ead2', '#b3532f', '#a8714f', '#1b1310', 1],
    ['#e0efe7', '#dfe6ea', '#d9a480', '#1f1611', 0],
  ],
};

const Face = ({ palette }) => {
  const [bg, cloth, skin, hair, long] = palette;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <rect width="100" height="100" fill={bg} />
      {long ? <path d="M27 44c0-18 10-30 23-30s23 12 23 30v24H27z" fill={hair} /> : null}
      <path d="M12 100c0-21 17-34 38-34s38 13 38 34z" fill={cloth} />
      <rect x="43" y="52" width="14" height="18" rx="6" fill={skin} />
      <circle cx="50" cy="40" r="17" fill={skin} />
      <path d="M32 39c0-13 8-21 18-21s18 8 18 21c-4-7-9-10-18-10s-14 3-18 10z" fill={hair} />
    </svg>
  );
};

/** The line-art specialist avatar on the ticket and the package panel. */
const LineAvatar = ({ id }) => (
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <defs><clipPath id={`lac-${id}`}><circle cx="50" cy="50" r="42" /></clipPath></defs>
    <rect width="100" height="100" rx="30" className="cdb-la-o" />
    <rect x="5" y="5" width="90" height="90" rx="26" className="cdb-la-t" />
    <circle cx="50" cy="50" r="42" className="cdb-la-c" />
    <g clipPath={`url(#lac-${id})`} className="cdb-la-l">
      <path d="M16 100C17 84 24 72 40 67L60 66C76 70 84 82 85 100Z" />
      <path d="M36 68L30 76L26 92M64 67L71 75L76 92" fill="none" />
      <path d="M42 66Q51 73 60 66" fill="none" />
      <circle className="cdb-la-e" cx="51" cy="77" r="1" />
      <path d="M39 54L40 67M60 53L60 66" fill="none" />
      <ellipse cx="35.5" cy="46" rx="2.8" ry="4.4" />
      <path d="M38 40C39 35 44 32 50 32S62 35 62 42V49C62 56 57 60 50 60S39 57 38 50Z" />
      <path className="cdb-la-h" d="M34 45C28 35 32 25 42 22L44 16L49 21C58 19 66 23 67 31L65 37C60 32 53 31 48 34C43 36 41 40 39 45L36 44Z" />
      <circle className="cdb-la-e" cx="46.5" cy="44" r="1.6" />
      <circle className="cdb-la-e" cx="55" cy="44" r="1.6" />
      <path d="M51 45V49M46.5 53Q50 56 54 52.5" fill="none" />
    </g>
  </svg>
);

const Icon = {
  video: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="3" /><path d="M16 10.5l5-3v9l-5-3" /></svg>,
  download: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 20h14" /></svg>,
  calendar: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M4 10h16M9 3v4M15 3v4" /></svg>,
  clock: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  check: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></svg>,
  chevron: <svg className="cdb-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>,
  star: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2 6.3 20.3l1.2-6.4L2.8 9.5l6.4-.8z" /></svg>,
};

/* ── the states ─────────────────────────────────────────────────────────── */

/** "new": nothing booked and nothing half-booked. */
function FindSpecialist() {
  const [kind, setKind] = useState('therapist');
  return (
    <section className="cdb-find">
      <div className="cdb-seg" role="tablist" aria-label="Choose a specialist">
        {[['therapist', 'Therapist'], ['psychiatrist', 'Psychiatrist']].map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)}>{label}</button>
        ))}
      </div>
      <h2>Find your {kind}</h2>
      <p className="cdb-sub">Answer a few questions to find the right {kind} for your mental health needs.</p>
      <div className="cdb-fan">
        {FACES[kind].map((palette, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <span key={i} className={`cdb-av cdb-a${i + 1}`}><Face palette={palette} /></span>
        ))}
      </div>
      <div className="cdb-cta">
        <a className="cdb-btn cdb-primary" href="/book-malayali-psychologists">Get started</a>
        <a className="cdb-btn" href="/book-malayali-psychologists">View all {kind}s</a>
      </div>
      <ul className="cdb-assure">
        <li>{Icon.clock}Choosing a therapist takes around 5 minutes.</li>
        <li>
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
          Everything you share is confidential and will not be passed on.
        </li>
        <li>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14.5c2.5.3 4 2.3 4 5" /></svg>
          Our care team will help you through any trouble along the way.
        </li>
      </ul>
      <p className="cdb-help">
        For emergency mental health support, please call the national Tele MANAS helpline at{' '}
        <a href="tel:18008914416">1800 891 4416</a>.
      </p>
    </section>
  );
}

/**
 * The session ticket. `session` is a paid session; `draft` is an unfinished
 * booking, which shows the same ticket with the total and "Proceed to pay".
 */
function Ticket({ session, draft, client, onUpdate }) {
  const paid = !!session;
  const start = paid ? startOf(session) : (draft?.slot?.startsAt ? new Date(draft.slot.startsAt) : null);
  const therapist = paid ? session.psychologist : draft?.therapist;
  const name = paid ? nameOf(therapist) : (therapist?.name || 'Your therapist');
  const role = paid ? roleOf(therapist) : (therapist?.role || '');
  const mins = minutesTo(start);
  const meet = paid ? meetLinkOf(session) : '';
  const plural = (n) => `${n} min${n === 1 ? '' : 's'}`;

  return (
    <section className="cdb-booked">
      <article className="cdb-ticket" aria-label="Session ticket">
        <div className="cdb-t-main">
          <div className="cdb-t-top">
            <span className="cdb-t-brand">Koott · Session ticket</span>
            {paid
              ? (session.cancel_request
                ? <span className="cdb-chip cdb-warn">Cancellation requested</span>
                : <span className="cdb-chip cdb-ok">Confirmed</span>)
              : <span className="cdb-chip cdb-warn">Awaiting payment</span>}
          </div>
          <div className="cdb-who">
            <span className="cdb-av"><LineAvatar id="ticket" /></span>
            <div>
              <div className="cdb-lbl">Your therapist</div>
              <h3>{name}</h3>
              {role && <p>{role}</p>}
            </div>
          </div>
          <hr />
          <dl className="cdb-grid">
            <div>
              <dt>Date</dt>
              <dd>{dayLabel(start, true)}</dd>
              {isToday(start) && <dd className="cdb-s">Today</dd>}
            </div>
            <div>
              <dt>Time</dt>
              <dd>{timeLabel(start)}</dd>
              <dd className="cdb-s">Asia/Calcutta · GMT+5:30</dd>
            </div>
            <div>
              <dt>Session</dt>
              <dd>{paid ? (session.session_type === 'couple' ? 'Couple therapy' : 'Individual therapy') : (draft?.kind === 'couple' ? 'Couple therapy' : 'Individual therapy')}</dd>
              <dd className="cdb-s">{plural(paid ? DURATION(session) : 50)} · Google Meet</dd>
            </div>
            <div>
              <dt>Plan</dt>
              <dd>{paid ? (session.package_id ? 'Package' : 'Single session') : (draft?.planLabel || 'Single session')}</dd>
              {paid && session.package?.session_number && session.package?.total_sessions
                ? <dd className="cdb-s">Session {session.package.session_number} of {session.package.total_sessions}</dd>
                : null}
            </div>
          </dl>
        </div>

        <aside className="cdb-t-stub">
          <div className="cdb-lbl">Booked for</div>
          <h4>{client?.name || '—'}</h4>
          {client?.email && <p>{client.email}</p>}
          {client?.phone && <p>{client.phone}</p>}
          {paid ? (
            <>
              <div className="cdb-spacer" />
              <div className="cdb-joinbox">
                <div className="cdb-lbl cdb-join-lbl">{Icon.video}Join the session</div>
                <div className="cdb-loc">Location:<b>Google Meet</b></div>
                {meet
                  ? (
                    <div className="cdb-mlink">
                      <a href={meet} target="_blank" rel="noreferrer">{meet.replace(/^https?:\/\//, '')}</a>
                      <button type="button" className="cdb-copy" onClick={() => navigator.clipboard?.writeText(meet).catch(() => {})}>Copy</button>
                    </div>
                  )
                  : <p className="cdb-hint">The meeting link appears here nearer the time.</p>}
                <div className="cdb-jstack">
                  <a
                    className={`cdb-btn cdb-primary${meet ? '' : ' cdb-disabled'}`}
                    href={meet || undefined} target="_blank" rel="noreferrer"
                    aria-disabled={meet ? undefined : 'true'}
                  >
                    {mins != null && mins > 0 && mins <= 60 ? `Join in ${plural(mins)}` : 'Join now'}
                  </a>
                  <button type="button" className="cdb-btn" onClick={() => onUpdate(session)}>Update your session</button>
                </div>
              </div>
            </>
          ) : (
            <div className="cdb-total">
              <div className="cdb-lbl">Total</div>
              <strong>{inr(draft?.price)}</strong>
              <span>Secure payment via Razorpay</span>
            </div>
          )}
        </aside>
      </article>

      {!paid && (
        <>
          <div className="cdb-actions">
            <a className="cdb-btn cdb-primary" href={`/book/${draft?.slug}?resume=1`}>Proceed to pay</a>
            <a className="cdb-link" href={`/book/${draft?.slug}?resume=1`}>Change the time</a>
          </div>
          <div className="cdb-steps" role="img" aria-label="Step 5 of 5">
            <i /><i /><i /><i /><i className="cdb-on" />
          </div>
        </>
      )}
    </section>
  );
}

/**
 * "Update your session": cancel with the 48-hour rule.
 *   48 h or more before -> cancelled and refunded automatically.
 *   Less than 48 h      -> a request goes to our team; the session stays booked until they reply.
 */
const CANCEL_HOURS = 48;
function UpdateSheet({ session, onClose, onDone }) {
  const [step, setStep] = useState('view'); // view | confirm | busy | done
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const start = startOf(session);
  const hours = start ? (start.getTime() - Date.now()) / 3600000 : 0;
  const early = hours >= CANCEL_HOURS;
  const requested = Boolean(session.cancel_request);
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape' && step !== 'busy') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose, step]);

  const cancel = async () => {
    setStep('busy'); setErr('');
    try {
      const res = await clientApi.cancelSession(session.id);
      if (res && res.success === false) throw new Error(res.message || res.error || 'Could not cancel.');
      setMsg(res?.message || 'Done.');
      setStep('done');
      onDone();
    } catch (e) { setErr(e?.message || 'Could not cancel. Please try again or message us.'); setStep('view'); }
  };

  return (
    <div className="cdb-sheet-bg" role="dialog" aria-modal="true" aria-label="Update your session" onClick={() => step !== 'busy' && onClose()}>
      <div className="cdb-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="cdb-sheet-head">
          <h3>Update your session</h3>
          <button type="button" className="cdb-x" onClick={onClose} aria-label="Close" disabled={step === 'busy'}>✕</button>
        </div>
        <p className="cdb-sheet-when">{dayLabel(start, true)} · {timeLabel(start)}</p>

        {step === 'done' ? (
          <>
            <p className="cdb-sheet-ok">{msg}</p>
            <button type="button" className="cdb-btn cdb-primary cdb-full" onClick={onClose}>Close</button>
          </>
        ) : requested ? (
          <>
            <p className="cdb-sheet-note">You asked to cancel this session. Our team will reply soon; until then it stays booked.</p>
            <button type="button" className="cdb-btn cdb-full" onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <p className="cdb-sheet-note">To move it to another time, message your therapist or our care team.</p>
            <div className="cdb-policy">
              <b>Cancelling</b>
              <span>{CANCEL_HOURS} hours or more before the session: cancelled at once and refunded automatically.</span>
              <span>Less than {CANCEL_HOURS} hours before: your request goes to our team, and the session stays booked until they reply.</span>
            </div>
            {err && <p className="cdb-sheet-err">{err}</p>}
            {step === 'view' ? (
              <button type="button" className="cdb-btn cdb-danger cdb-full" onClick={() => setStep('confirm')}>
                {early ? 'Cancel this session' : 'Ask to cancel this session'}
              </button>
            ) : (
              <div className="cdb-confirm">
                <p>{early
                  ? 'Cancel this session? It is cancelled now and your payment is refunded to the same account in 5–7 working days.'
                  : `Your session is in less than ${CANCEL_HOURS} hours. Send a cancellation request to our team?`}</p>
                <div className="cdb-row2">
                  <button type="button" className="cdb-btn" onClick={() => setStep('view')} disabled={step === 'busy'}>Back</button>
                  <button type="button" className="cdb-btn cdb-danger" onClick={cancel} disabled={step === 'busy'}>
                    {step === 'busy' ? 'Please wait…' : early ? 'Yes, cancel' : 'Yes, send request'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** "package": an active package, its booked sessions and what is left to book. */
function PackagePanel({ pack, sessions }) {
  const total = Number(pack.total_sessions) || 0;
  const remaining = Number(pack.remaining_sessions_for_booking) || 0;
  const booked = Math.max(0, total - remaining);
  const mine = sessions
    .filter((s) => String(s.package_id) === String(pack.package_id || pack.id))
    .sort((a, b) => (startOf(a)?.getTime() || 0) - (startOf(b)?.getTime() || 0));
  const therapist = pack.psychologist || mine[0]?.psychologist;
  const slug = therapist ? therapistSlug(therapist) : '';
  const validTill = pack.expires_at || pack.valid_till;

  return (
    <div className="cdb-panel cdb-pk">
      <div className="cdb-pk-top">
        <div className="cdb-pk-who">
          <span className="cdb-sr-av"><LineAvatar id={`pk-${pack.id}`} /></span>
          <div>
            <h3>Your {total}-session package</h3>
            <span className="cdb-hint">
              {therapist ? `with ${nameOf(therapist)}` : 'Package'}
              {pack.validity_months ? ` · ${pack.validity_months} months validity` : ''}
            </span>
          </div>
        </div>
        {validTill && (
          <span className="cdb-valid">{Icon.calendar}Valid till {dayLabel(new Date(validTill), true)}</span>
        )}
      </div>

      <div className="cdb-pk-sum">
        <div className={`cdb-pk-sum-t${remaining ? '' : ' cdb-ok'}`}>
          {remaining ? Icon.clock : Icon.check}
          <b>{remaining ? `${remaining} of ${total} sessions still to book` : `All ${total} sessions are booked`}</b>
        </div>
        <div className="cdb-pk-bar" role="img" aria-label={`${booked} of ${total} sessions booked`}>
          {Array.from({ length: total }, (_, k) => <i key={k} className={k < booked ? 'cdb-on' : ''} />)}
        </div>
      </div>

      <div className="cdb-slist">
        {mine.map((s, i) => {
          const d = startOf(s);
          return (
            <div key={s.id} className="cdb-ses cdb-done">
              <span className="cdb-dot cdb-ok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9" /></svg></span>
              <div className="cdb-ses-t">
                <b>Session {i + 1}</b>
                <small>{dayLabel(d)} · {timeLabel(d)}</small>
              </div>
              <div className="cdb-ses-r">
                <span className={`cdb-chip ${isToday(d) ? 'cdb-ok' : 'cdb-ok'}`}>{isToday(d) ? 'Today' : 'Scheduled'}</span>
              </div>
            </div>
          );
        })}
        {Array.from({ length: remaining }, (_, k) => (
          <div key={`pend-${k}`} className="cdb-ses cdb-pend">
            <div className="cdb-ses-h">
              <span className="cdb-dot cdb-n">{mine.length + k + 1}</span>
              <div className="cdb-ses-t">
                <b>Session {mine.length + k + 1}</b>
                <small>Pick a time that suits you</small>
              </div>
              <span className="cdb-chip cdb-warn">Not booked yet</span>
            </div>
            {slug && (
              <a className="cdb-btn cdb-primary cdb-sm" href={`/book/${slug}?package=${pack.id}`}>Choose a time</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** One row of the Completed tab, with its notes, feedback and receipt. */
function HistoryRow({ session, open, onToggle, onRate }) {
  const d = startOf(session);
  const status = String(session.status || '').toLowerCase();
  const completed = status === 'completed';
  const label = completed ? 'Completed' : (status === 'cancelled' ? 'Cancelled' : 'No show');
  const rating = Number(session.client_rating || session.rating) || 0;
  const note = session.psychologist_notes || session.session_notes || '';

  const cells = (
    <>
      <span><b>{dayLabel(d, true)}</b><small>{timeLabel(d)} · {DURATION(session)} min</small></span>
      <span>
        <b>{nameOf(session.psychologist)}</b>
        <small>{session.session_type === 'couple' ? 'Couple therapy' : 'Individual therapy'}{Number(session.price) > 0 ? ` · ${inr(session.price)}` : ''}</small>
      </span>
      <span className={`cdb-chip ${completed ? 'cdb-ok' : 'cdb-mute'}`}>{label}</span>
    </>
  );

  if (!completed) return <li><div className="cdb-hrow cdb-static">{cells}<span /></div></li>;

  return (
    <li>
      <button type="button" className="cdb-hrow" aria-expanded={open} onClick={onToggle}>
        {cells}{Icon.chevron}
      </button>
      {open && (
        <div className="cdb-hbody">
          <div>
            <div className="cdb-lbl">Notes from {nameOf(session.psychologist).split(' ')[0]}</div>
            {note
              ? <div className="cdb-note-box"><p>{note}</p><small>Shared by your therapist after the session</small></div>
              : <p className="cdb-hint">No notes were shared for this session.</p>}
          </div>
          <div>
            <div className="cdb-lbl">Your feedback</div>
            {rating
              ? (
                <div className="cdb-stars" role="img" aria-label={`You rated ${rating} out of 5`}>
                  {[1, 2, 3, 4, 5].map((n) => <span key={n} className={`cdb-star${n <= rating ? ' cdb-on' : ''}`}>{Icon.star}</span>)}
                </div>
              )
              : (
                <div className="cdb-stars" role="radiogroup" aria-label="Rate this session">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n} type="button" className="cdb-star" role="radio" aria-checked="false"
                      aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => onRate(session, n)}
                    >
                      {Icon.star}
                    </button>
                  ))}
                </div>
              )}
          </div>
          <div>
            <div className="cdb-lbl">Receipt and invoice</div>
            <div className="cdb-docrow">
              <a className="cdb-btn cdb-sm" href="/profile/receipts">{Icon.download}Receipt</a>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}


/* ── booked sessions, to the Figma post-payment screens ─────────────────── */

const ART = '/design/dashboard';
const CARE_WHATSAPP = '919539007766';
const endOf = (s) => { const d = startOf(s); return d ? new Date(d.getTime() + DURATION(s) * 60000) : null; };
const typeOf = (s) => (s?.session_type === 'couple' ? 'Couple Therapy' : 'Individual Therapy');
const inr2 = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const hm = (d) => timeLabel(d).toUpperCase();
const careLink = (text) => `https://wa.me/${CARE_WHATSAPP}?text=${encodeURIComponent(text)}`;

/** The therapist's photo, or the line-art face when there is none. */
function Photo({ person, id, size = 72 }) {
  const src = person?.profile_picture_url || person?.photo;
  return (
    <span className="cdx-photo" style={{ width: size, height: size }}>
      {src ? <img src={src} alt="" width={size} height={size} /> : <LineAvatar id={id} />}
    </span>
  );
}

/** The ⋮ button in a card's corner. */
const MoreButton = ({ open, onClick, label }) => (
  <button type="button" className="cdx-more" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={onClick}>
    <img src={`${ART}/dots-vertical.svg`} alt="" width={24} height={24} />
  </button>
);

/** Name, status and title beside the photo. */
const Who = ({ session, status, id }) => (
  <div className="cdx-who">
    <Photo person={session.psychologist} id={id} />
    <div className="cdx-who-t">
      <span className="cdx-status">{status}</span>
      <span className="cdx-name">{nameOf(session.psychologist)}</span>
      <span className="cdx-role">{roleOf(session.psychologist)}</span>
    </div>
  </div>
);

const SessionTile = ({ session }) => (
  <div className="cdx-tile">
    <span className="cdx-tl">Session</span>
    <span className="cdx-tv">{typeOf(session)}</span>
    <span className="cdx-ts">
      {DURATION(session)} min
      <span className="cdx-meet"><img src={`${ART}/google-meet.svg`} alt="" width={16} height={16} />Google Meet</span>
    </span>
  </div>
);

/**
 * "Manage your session": a menu under the ⋮ on a laptop, a sheet on a phone.
 * Moving the time uses the reschedule flow; a new therapist or a new way to attend
 * goes to our care team on WhatsApp, as the booking system cannot change either
 * on its own (every session is a Google Meet video call today).
 */
function ManageMenu({ session, onClose, onReschedule, onCancel }) {
  const ref = useRef(null);
  const start = startOf(session);
  const who = nameOf(session.psychologist);
  const when = `${dayLabel(start, true)} at ${hm(start)}`;
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    const away = (e) => { if (ref.current && !ref.current.contains(e.target) && !e.target.closest?.('.cdx-more')) onClose(); };
    document.addEventListener('keydown', esc);
    document.addEventListener('mousedown', away);
    return () => { document.removeEventListener('keydown', esc); document.removeEventListener('mousedown', away); };
  }, [onClose]);
  const rows = [
    {
      key: 'time', icon: 'calendar', title: 'Change Date & Time',
      sub: <>{dayLabel(start, true)}<i className="cdx-dot" />{hm(start)}</>,
      onClick: () => { onClose(); onReschedule(session); },
    },
    {
      key: 'therapist', icon: 'user', title: 'Change therapist', sub: who,
      href: careLink(`Hi Koott, I'd like to change the therapist for my session with ${who} on ${when}.`),
    },
    {
      key: 'attend', icon: 'video-camera', title: 'Change how to attend', sub: 'Video',
      href: careLink(`Hi Koott, I'd like to change how I attend my session with ${who} on ${when}.`),
    },
  ];
  return (
    <>
      <div className="cdx-menu-dim" aria-hidden onClick={onClose} />
      <div className="cdx-menu" role="menu" aria-label="Manage your session" ref={ref}>
        <div className="cdx-menu-h">Manage your session</div>
        <button type="button" className="cdx-menu-x" aria-label="Close" onClick={onClose}>
          <img src="/design/booking/x-close.svg" alt="" width={24} height={24} />
        </button>
        <div className="cdx-menu-rows">
          {rows.map((row) => {
            const inner = (
              <>
                <img className="cdx-menu-i" src={`${ART}/${row.icon}.svg`} alt="" width={24} height={24} />
                <span className="cdx-menu-t">
                  <span className="cdx-menu-tt">{row.title}</span>
                  <span className="cdx-menu-ts">{row.sub}</span>
                </span>
                <img className="cdx-menu-c" src={`${ART}/chevron-right.svg`} alt="" width={20} height={20} />
              </>
            );
            return row.href
              ? <a key={row.key} role="menuitem" className="cdx-menu-row" href={row.href} target="_blank" rel="noreferrer" onClick={onClose}>{inner}</a>
              : <button key={row.key} type="button" role="menuitem" className="cdx-menu-row" onClick={row.onClick}>{inner}</button>;
          })}
        </div>
        {onCancel && (
          <button type="button" className="cdx-menu-cancel" onClick={() => { onClose(); onCancel(session); }}>
            {session.cancel_request ? 'View cancellation request' : 'Cancel this session'}
          </button>
        )}
      </div>
    </>
  );
}

/** One booked session (Figma "Booking/ Dashboard"). */
function SessionCard({ session, menuOpen, onMenu, onOpen, children }) {
  const start = startOf(session);
  return (
    <article className="cdx-card">
      <button type="button" className="cdx-open" aria-label={`Session details: ${nameOf(session.psychologist)}, ${dayLabel(start, true)}`} onClick={onOpen} />
      <div className="cdx-card-top">
        <Who session={session} status={session.cancel_request ? 'Cancellation requested' : 'Upcoming'} id={`c-${session.id}`} />
        <MoreButton open={menuOpen} onClick={onMenu} label="Manage your session" />
      </div>
      <div className="cdx-tiles">
        <div className="cdx-tile">
          <span className="cdx-tl">Date</span>
          <span className="cdx-tv">{dayLabel(start, true)}</span>
        </div>
        <div className="cdx-tile">
          <span className="cdx-tl">Time</span>
          <span className="cdx-tv">{hm(start)} - {hm(endOf(session))}</span>
          <span className="cdx-ts">Asia/Calcutta GMT+5:30</span>
        </div>
        <SessionTile session={session} />
      </div>
      {children}
    </article>
  );
}

/** Saves a session's receipt (the same download the Receipts page uses). */
async function downloadInvoice(session) {
  const res = await clientApi.getReceipts();
  const receipt = (res?.data || []).find((x) => String(x.session_id) === String(session.id));
  if (!receipt) throw new Error('The invoice for this session is not ready yet.');
  if (receipt.file_url) { window.open(receipt.file_url, '_blank'); return; }
  const out = await clientApi.downloadReceipt(receipt.id || receipt.receipt_id);
  if (out?.success && out.blob) {
    const url = window.URL.createObjectURL(out.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt-${receipt.receipt_number || receipt.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    return;
  }
  const link = out?.data?.downloadUrl || out?.downloadUrl;
  if (link) { window.open(link, '_blank'); return; }
  throw new Error(out?.message || 'Could not download the invoice.');
}

/** "Session details" (Figma 1123:18093, expanded 1123:18161 / 18311). */
function SessionDetails({ session, onBack, menu, onMenu, onToast, preview }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const start = startOf(session);
  const bought = session.created_at ? new Date(session.created_at) : null;
  const price = Number(session.price) || 0;
  const invoice = async () => {
    if (preview) { onToast('The invoice downloads here on a real booking.'); return; }
    setBusy(true);
    try { await downloadInvoice(session); } catch (e) { onToast(e?.message || 'Could not download the invoice.'); }
    setBusy(false);
  };
  return (
    <div className="cdx-detail">
      <div className="cdx-dh">
        <button type="button" className="cdx-back" aria-label="Back to your sessions" onClick={onBack}>
          <img src={`${ART}/arrow-left.svg`} alt="" width={24} height={24} />
        </button>
        <h1 className="cdx-dh-t">Session details</h1>
      </div>
      <div className="cdx-dcol">
        <section className="cdx-card is-detail">
          <div className="cdx-card-top">
            <Who session={session} status={session.cancel_request ? 'Cancellation requested' : 'Scheduled'} id={`d-${session.id}`} />
            <MoreButton open={!!menu} onClick={onMenu} label="Manage your session" />
          </div>
          {menu}
          <div className="cdx-tiles is-two">
            <SessionTile session={session} />
            <div className="cdx-tile">
              <span className="cdx-tl">Price</span>
              <span className="cdx-tv">{inr2(price)}</span>
            </div>
          </div>
          <div className={`cdx-pay${open ? ' is-open' : ''}`}>
            <button type="button" className="cdx-pay-row" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              <img className="cdx-pay-ok" src={`${ART}/check-circle.svg`} alt="" width={20} height={20} />
              <span className="cdx-pay-h">Payment summary</span>
              <span className="cdx-pay-r">
                <span className="cdx-pay-l">Session purchased</span>
                <span className="cdx-pay-v">{inr2(price)}<span className="cdx-paid">Paid</span></span>
              </span>
              <img className="cdx-pay-c" src={`${ART}/chevron-down.svg`} alt="" width={24} height={24} />
            </button>
            {open && (
              <div className="cdx-bill">
                <div className="cdx-bill-rows">
                  <div className="cdx-bill-row"><span>Session sub total</span><b>{inr2(price)}</b></div>
                  <div className="cdx-bill-row is-total"><span>Paid amount</span><b>{inr2(price)}</b></div>
                </div>
                <button type="button" className="cdx-invoice" onClick={invoice} disabled={busy}>
                  {busy ? 'Preparing…' : 'Download Invoice'}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="cdx-log" aria-label="Activity">
          <ol>
            <li>
              <span className="cdx-log-i"><img src={`${ART}/user.svg`} alt="" width={16} height={16} /></span>
              <div className="cdx-log-l">
                <b>{nameOf(session.psychologist)}</b>
                <span className="cdx-log-s">
                  {typeOf(session)}<i className="cdx-dot" />
                  <span className="cdx-log-on"><img src={`${ART}/video-recorder.svg`} alt="" width={16} height={16} />Online</span>
                </span>
              </div>
              <div className="cdx-log-r">
                <span className="cdx-paid">{session.cancel_request ? 'Cancellation requested' : 'Scheduled'}</span>
                <span className="cdx-log-d">{dayLabel(start, true)}<i className="cdx-dot" />{hm(start)}</span>
              </div>
            </li>
            {bought && (
              <li>
                <span className="cdx-log-i"><img src={`${ART}/purchase-tag.svg`} alt="" width={16} height={16} /></span>
                <div className="cdx-log-l"><b>Session purchased</b></div>
                <div className="cdx-log-r">
                  <span className="cdx-log-d">{dayLabel(bought, true)}<i className="cdx-dot" />{hm(bought)}</span>
                </div>
              </li>
            )}
          </ol>
        </section>
      </div>
    </div>
  );
}

/* ── the page ───────────────────────────────────────────────────────────── */

/**
 * `fixture` stands in for the API while a design is being checked — the prototype's
 * preview switch, kept (see /dashboard?preview=paid). Real use passes nothing.
 */
const PREVIEW_STATES = [
  ['', 'Live data'],
  ['new', 'New client'], ['awaiting', 'Awaiting payment'], ['paid', 'Paid'],
  ['package', '3-session package'], ['multi', 'Multiple upcoming'], ['history', 'Completed'],
];

/** The prototype's state switch: pills on a wide screen, a select on a phone. */
function PreviewSwitch({ state, onChange }) {
  return (
    <div className="cdb-preview" role="group" aria-label="Design preview">
      <span>Preview</span>
      {PREVIEW_STATES.map(([key, label]) => (
        <button key={key || 'live'} type="button" aria-pressed={state === key} onClick={() => onChange(key)}>{label}</button>
      ))}
      <select aria-label="Preview state" value={state} onChange={(e) => onChange(e.target.value)}>
        {PREVIEW_STATES.map(([key, label]) => <option key={key || 'live'} value={key}>{label}</option>)}
      </select>
    </div>
  );
}

export default function ClientDashboard({ client, fixture = null, previewState = '', onPreviewChange = null }) {
  const [tab, setTab] = useState('upcoming');
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [packages, setPackages] = useState([]);
  const [status, setStatus] = useState('loading');
  const [open, setOpen] = useState([0]);
  const [toast, setToast] = useState('');
  const [updating, setUpdating] = useState(null);
  const [reload, setReload] = useState(0);
  const [menuFor, setMenuFor] = useState(null); // session id whose "Manage your session" is open
  const [moving, setMoving] = useState(null); // session being rescheduled
  const { draft, slotState } = useBookingDraft();
  const router = useRouter();
  const params = useSearchParams();
  const detailId = params.get('session') || '';
  // ?session=<id> opens "Session details"; the other params (?preview) are kept.
  const goDetail = useCallback((id) => {
    const q = new URLSearchParams(params.toString());
    if (id) q.set('session', id); else q.delete('session');
    const qs = q.toString();
    setMenuFor(null);
    router.push(qs ? `?${qs}` : window.location.pathname, { scroll: true });
  }, [params, router]);
  const closeMenu = useCallback(() => setMenuFor(null), []);

  useEffect(() => {
    if (fixture) {
      setUpcoming(fixture.upcoming || []);
      setPast(fixture.past || []);
      setPackages(fixture.packages || []);
      setStatus('ready');
      return undefined;
    }
    let off = false;
    (async () => {
      try {
        const [up, done, packs] = await Promise.all([
          clientApi.getSessions({ status: 'upcoming', page: 1, limit: 50 }).catch(() => null),
          clientApi.getSessions({ status: 'completed', page: 1, limit: 50 }).catch(() => null),
          clientApi.getClientPackages().catch(() => null),
        ]);
        if (off) return;
        setUpcoming(up?.data?.sessions || []);
        setPast(done?.data?.sessions || []);
        setPackages((packs?.data?.clientPackages || []).filter((p) => Number(p.remaining_sessions_for_booking) > 0));
        setStatus('ready');
      } catch (_) {
        if (!off) setStatus('error');
      }
    })();
    return () => { off = true; };
  }, [fixture, reload]);

  const sorted = useMemo(
    () => [...upcoming].sort((a, b) => (startOf(a)?.getTime() || 0) - (startOf(b)?.getTime() || 0)),
    [upcoming]
  );
  const next = sorted[0] || null;
  // A draft only stands in for a session while nothing is booked and its time still holds.
  const pending = fixture
    ? fixture.draft || null
    : (!next && draft && slotState === 'ok' ? draft : null);

  const rate = async (session, stars) => {
    try {
      await clientApi.submitSessionFeedback(session.id, { rating: stars });
      setPast((rows) => rows.map((r) => (r.id === session.id ? { ...r, client_rating: stars } : r)));
      setToast('Thanks for your feedback');
    } catch (_) {
      setToast('We could not save that just now.');
    }
    setTimeout(() => setToast(''), 2400);
  };

  const body = () => {
    if (status === 'loading') return <p className="cdb-hint cdb-center">Loading your sessions…</p>;
    if (status === 'error') return <p className="cdb-hint cdb-center">We could not load your sessions just now. Please refresh.</p>;

    if (tab === 'completed') {
      if (!past.length) {
        return (
          <section className="cdb-empty">
            <svg viewBox="0 0 72 72" aria-hidden="true"><rect x="10" y="14" width="52" height="48" rx="10" /><path d="M10 28h52M24 8v12M48 8v12M26 45l7 7 13-14" /></svg>
            <h2>No completed sessions yet</h2>
            <p>Sessions you finish will appear here, along with your receipts.</p>
          </section>
        );
      }
      return (
        <div className="cdb-hist-wrap">
          <div className="cdb-sec-h">
            <h2>Booking history</h2>
            <span className="cdb-hint">{past.length} booking{past.length > 1 ? 's' : ''}</span>
          </div>
          <ul className="cdb-hlist">
            {past.map((s, i) => (
              <HistoryRow
                key={s.id}
                session={s}
                open={open.includes(i)}
                onToggle={() => setOpen((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i]))}
                onRate={rate}
              />
            ))}
          </ul>
        </div>
      );
    }

    if (!next && !pending) return <FindSpecialist />;

    // An unpaid booking (only this browser knows of it) keeps the ticket with "Proceed to pay".
    if (!next) return <Ticket session={null} draft={pending} client={client} onUpdate={() => {}} />;

    return (
      <>
        <div className="cdx-list">
          {sorted.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              menuOpen={menuFor === s.id}
              onMenu={() => setMenuFor((m) => (m === s.id ? null : s.id))}
              onOpen={() => goDetail(s.id)}
            >
              {menuFor === s.id && menuOf(s)}
            </SessionCard>
          ))}
        </div>
        {packages.map((p) => <PackagePanel key={p.id} pack={p} sessions={sorted} />)}
      </>
    );
  };

  const menuOf = (s) => (
    <ManageMenu
      session={s}
      onClose={closeMenu}
      onReschedule={(x) => (fixture ? say('Changing the time opens here on a real booking.') : setMoving(x))}
      onCancel={fixture ? null : (x) => setUpdating(x)}
    />
  );
  const say = (text) => { setToast(text); setTimeout(() => setToast(''), 2400); };
  const detail = detailId && status === 'ready' ? sorted.find((s) => String(s.id) === detailId) : null;

  return (
    <div className="cdb">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <main className="cdb-wrap cdx-wrap">
        {detail ? (
          <SessionDetails
            session={detail}
            onBack={() => goDetail('')}
            menu={menuFor === detail.id ? menuOf(detail) : null}
            onMenu={() => setMenuFor((m) => (m === detail.id ? null : detail.id))}
            onToast={say}
            preview={!!fixture}
          />
        ) : (
          <>
            <h1 className="cdb-sr">Your sessions</h1>
            <div className="cdx-tabs" role="tablist" aria-label="Sessions">
              <button type="button" role="tab" aria-selected={tab === 'upcoming'} onClick={() => setTab('upcoming')}>Sessions</button>
              <button type="button" role="tab" aria-selected={tab === 'completed'} onClick={() => setTab('completed')}>History</button>
            </div>
            <div role="tabpanel" className="cdx-panel">{body()}</div>
          </>
        )}
      </main>
      {onPreviewChange && <PreviewSwitch state={previewState} onChange={onPreviewChange} />}
      <div className={`cdb-toast${toast ? ' cdb-on' : ''}`} role="status">{toast}</div>
      {updating && <UpdateSheet session={updating} onClose={() => setUpdating(null)} onDone={() => setReload((n) => n + 1)} />}
      <RescheduleModal
        isOpen={!!moving}
        session={moving}
        onClose={() => setMoving(null)}
        onRescheduleSuccess={() => { setMoving(null); setReload((n) => n + 1); }}
      />
    </div>
  );
}

/* ── styles, from the prototype ─────────────────────────────────────────── */

const CSS = `
/* ── Figma post-payment screens ── */
.cdb-wrap.cdx-wrap{max-width:1228px;padding:56px 24px 120px}
.cdx-tabs{display:flex;gap:12px}
.cdx-tabs button{
  height:32px;padding:0 15px;border:1px solid #E3E2E2;border-radius:56px;background:#fff;cursor:pointer;
  font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;font-weight:400!important;line-height:22px!important;color:#0F0F0F!important;
  letter-spacing:0;text-transform:none;
}
.cdx-tabs button[aria-selected="true"]{background:#EFFFEA;border-color:#BFE3CB;font-weight:500!important;color:#1B6930!important}
.cdx-panel{margin-top:24px}
.cdx-list{display:flex;flex-direction:column;gap:16px}
.cdx-card{position:relative;display:flex;flex-direction:column;gap:18px;padding:24px;border-radius:12px;background:#E9F1E4}
.cdx-open{position:absolute;inset:0;z-index:0;width:100%;padding:0;border:0;border-radius:12px;background:none;cursor:pointer}
.cdx-open:focus-visible{outline:2px solid #189E4F;outline-offset:2px}
.cdx-card.is-detail{width:781px;max-width:100%}
.cdx-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.cdx-who{display:flex;align-items:center;gap:8px;min-width:0}
.cdx-card.is-detail .cdx-who{gap:12px}
.cdx-photo{flex:none;display:block;overflow:hidden;border-radius:40px;background:#EFFFEA}
.cdx-photo img,.cdx-photo svg{display:block;width:100%;height:100%;object-fit:cover}
.cdx-who-t{display:flex;flex-direction:column;min-width:0}
.cdx-status{font-family:'Inter',system-ui,sans-serif!important;font-size:12px!important;line-height:18px!important;color:#1E8631!important}
.cdx-name{font-family:'Poppins',system-ui,sans-serif!important;font-size:20px!important;font-weight:500!important;line-height:30px!important;color:#0F0F0F!important}
.cdx-role{font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;line-height:22px!important;color:#373737!important}
.cdx-more{position:relative;z-index:2;flex:none;width:24px;height:24px;padding:0;border:0;background:none;cursor:pointer}
.cdx-more img{display:block}
.cdx-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.cdx-tiles.is-two{grid-template-columns:repeat(2,minmax(0,1fr))}
.cdx-tile{display:flex;flex-direction:column;justify-content:center;gap:2px;height:94px;padding:0 16px;border-radius:8px;background:#F9F9F9}
.cdx-tl{font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;line-height:22px!important;color:#7C7C7C!important}
.cdx-tv{font-family:'Inter',system-ui,sans-serif!important;font-size:16px!important;font-weight:500!important;line-height:24px!important;color:#0F0F0F!important}
.cdx-ts{display:flex;align-items:center;gap:12px;font-family:'Inter',system-ui,sans-serif!important;font-size:12px!important;line-height:18px!important;color:#5C5C5C!important}
.cdx-meet{display:inline-flex;align-items:center;gap:4px}
.cdx-dot{display:inline-block;width:4px;height:4px;margin:0 8px;border-radius:50%;background:#E3E2E2;vertical-align:middle}
/* "Manage your session" */
.cdx-menu-dim{display:none}
.cdx-menu{
  position:absolute;z-index:5;right:24px;top:64px;display:flex;flex-direction:column;gap:24px;width:477px;max-width:calc(100vw - 32px);
  padding:24px;border-radius:16px;background:#fff;box-shadow:0 6px 21px rgba(0,0,0,.07);
}
.cdx-card.is-detail .cdx-menu{top:64px}
.cdx-menu-h{font-family:'Poppins',system-ui,sans-serif!important;font-size:20px!important;font-weight:500!important;line-height:30px!important;color:#0F0F0F!important}
.cdx-menu-x{display:none;position:absolute;right:24px;top:27px;width:24px;height:24px;padding:0;border:0;background:none;cursor:pointer}
.cdx-menu-x img{display:block}
.cdx-menu-rows{display:flex;flex-direction:column;gap:16px}
.cdx-menu-row{
  display:flex;align-items:center;gap:12px;height:72px;padding:0 12px;border:1px solid #E5E5EA;border-radius:8px;background:#fff;
  text-align:left;text-decoration:none;cursor:pointer;
}
.cdx-menu-row:hover{border-color:#BFE3CB;background:#FAFCF9}
.cdx-menu-row:focus-visible{outline:2px solid #189E4F;outline-offset:2px}
.cdx-menu-i{flex:none}
.cdx-menu-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.cdx-menu-tt{font-family:'Inter',system-ui,sans-serif!important;font-size:16px!important;font-weight:500!important;line-height:24px!important;color:#0F0F0F!important}
.cdx-menu-ts{display:flex;align-items:center;font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;line-height:22px!important;color:#5C5C5C!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cdx-menu-c{flex:none;margin-left:8px}
.cdx-menu-cancel{
  align-self:center;margin-top:-8px;padding:0;border:0;background:none;cursor:pointer;
  font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;line-height:22px!important;color:#5C5C5C!important;text-decoration:underline;
}
/* Session details */
.cdx-dh{display:flex;align-items:center;gap:8px;height:40px}
.cdx-back{width:24px;height:24px;padding:0;border:0;background:none;cursor:pointer}
.cdx-back img{display:block}
.cdx-dh-t{margin:0!important;font-family:'Poppins',system-ui,sans-serif!important;font-size:24px!important;font-weight:500!important;line-height:39.8px!important;color:#0F0F0F!important;letter-spacing:0!important}
.cdx-dcol{display:flex;flex-direction:column;gap:24px;margin-top:24px}
.cdx-pay{display:flex;flex-direction:column;gap:16px;padding:12px 16px;border-radius:8px;background:#FAFCF9}
.cdx-pay.is-open{padding-bottom:16px}
.cdx-pay-row{display:flex;align-items:flex-end;gap:16px;width:100%;padding:0;border:0;background:none;text-align:left;cursor:pointer}
.cdx-pay-h{flex:1;font-family:'Inter',system-ui,sans-serif!important;font-size:16px!important;font-weight:500!important;line-height:24px!important;color:#0F0F0F!important}
.cdx-pay-r{display:flex;align-items:center;gap:8px}
.cdx-pay-l,.cdx-pay-v{font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;line-height:22px!important;color:#5C5C5C!important}
.cdx-pay-v{display:inline-flex;align-items:center;gap:4px;margin-left:12px}
.cdx-pay-c{flex:none;transition:transform .15s ease}
.cdx-pay-ok{display:none;flex:none}
.cdx-pay.is-open .cdx-pay-c{transform:rotate(180deg)}
.cdx-paid{
  display:inline-flex;align-items:center;height:24px;padding:0 11px;border:1px solid #51B763;border-radius:45px;white-space:nowrap;
  font-family:'Inter',system-ui,sans-serif!important;font-size:12px!important;line-height:18px!important;color:#1E8631!important;
}
.cdx-bill{display:flex;flex-direction:column;align-items:flex-start;gap:24px;padding:12px;border:1px solid #E8EFE5;border-radius:8px;background:#fff}
.cdx-bill-rows{display:flex;flex-direction:column;gap:16px;width:100%}
.cdx-bill-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
.cdx-bill-row span{font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;line-height:22px!important;color:#5C5C5C!important}
.cdx-bill-row b{font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;font-weight:500!important;line-height:22px!important;color:#373737!important}
.cdx-bill-row.is-total b{font-size:16px!important;line-height:24px!important;color:#189E4F!important}
.cdx-invoice{
  height:32px;padding:0 22px;border:0;border-radius:6px;background:#189E4F;cursor:pointer;
  font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;font-weight:500!important;line-height:22px!important;color:#fff!important;
}
.cdx-invoice:hover{background:#1B6930}
.cdx-invoice:disabled{opacity:.7;cursor:default}
.cdx-log{width:781px;max-width:100%;padding:16px;border:1px solid #E8EFE5;border-radius:12px;background:#fff}
.cdx-log ol{position:relative;display:flex;flex-direction:column;gap:34px;margin:0;padding:0;list-style:none}
.cdx-log li{position:relative;display:flex;align-items:center;gap:24px;padding-left:52px}
.cdx-log li:first-child{align-items:flex-start}
.cdx-log-i{position:absolute;left:8px;top:13px;display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:52px;background:#F9F9F9}
.cdx-log li:last-child .cdx-log-i{top:0}
.cdx-log li:not(:last-child)::after{content:'';position:absolute;left:20px;top:43px;bottom:-34px;border-left:1px dashed #E3E2E2}
.cdx-log-l{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.cdx-log-l b{font-family:'Inter',system-ui,sans-serif!important;font-size:16px!important;font-weight:500!important;line-height:24px!important;color:#0F0F0F!important}
.cdx-log-s,.cdx-log-on{display:flex;align-items:center;font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;line-height:22px!important;color:#5C5C5C!important}
.cdx-log-on{gap:4px}
.cdx-log-r{display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.cdx-log-d{display:flex;align-items:center;font-family:'Inter',system-ui,sans-serif!important;font-size:12px!important;line-height:18px!important;color:#5C5C5C!important;white-space:nowrap}
.cdx-log-d .cdx-dot{margin:0 6px 0 6px}
/* Phone frames 1123:18598, 19037, 18663, 18731. */
@media (max-width:720px){
  .cdb-wrap.cdx-wrap{padding:16px 16px 80px}
  .cdx-photo{width:64px!important;height:64px!important}
  .cdx-tiles,.cdx-tiles.is-two{grid-template-columns:1fr;gap:16px}
  .cdx-menu-dim{display:block;position:fixed;left:0;right:0;bottom:0;top:63px;z-index:60;background:rgba(21,21,21,.45);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}
  .cdx-menu{position:fixed;z-index:61;left:0;right:0;top:auto;bottom:0;width:100%;max-width:none;border-radius:16px 16px 0 0}
  .cdx-card.is-detail .cdx-menu{top:auto}
  .cdx-menu-x{display:block}
  .cdx-pay-row{align-items:center;gap:6px}
  .cdx-pay-ok{display:block}
  .cdx-pay-r{display:none}
  .cdx-log li,.cdx-log li:first-child{flex-direction:column;align-items:stretch;gap:8px;padding-left:27px}
  .cdx-log-i{left:-3.5px;top:22px}
  .cdx-log li:last-child .cdx-log-i{top:0}
  .cdx-log li:not(:last-child)::after{left:8.5px;top:52px}
  .cdx-log-r{flex-direction:row-reverse;align-items:center;justify-content:space-between}
  .cdx-role{white-space:nowrap;overflow:hidden;text-overflow:clip;max-width:214px}
}

.cdb{
  --bg:#fff;--surface:#fff;--ink:#111;--muted:#6d727f;--lbl:#9ba0a6;--line:#e7e7e7;
  --brand:#4a9c58;--brand-ink:#2f7a3f;--total:#316a3b;--on-brand:#fff;--mint:#e6f4ea;--mint-ink:#2f6b3c;
  --seg:#f1f3f2;--stub:#f3fbf5;--stub-line:#d1e8d6;--dash:#b8dabe;
  --warn-bg:#fef7e2;--warn-ink:#835c1c;--ok-bg:#dff3e3;--ok-ink:#25693a;
  --la-ink:#111;--la-fill:#fff;--la-tile:#ebf5ed;--la-c:#f5effa;
  --shadow:0 1px 2px rgba(17,17,17,.05),0 22px 40px -22px rgba(17,17,17,.2);
  background:#fff;color:var(--ink);
  font:400 16px/1.5 'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
}
.cdb *,.cdb *::before,.cdb *::after{box-sizing:border-box}
.cdb button{font:inherit;color:inherit;cursor:pointer}
.cdb a{color:inherit}
.cdb :focus-visible{outline:2px solid var(--brand-ink);outline-offset:3px;border-radius:8px}
.cdb-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.cdb-center{text-align:center;margin-top:60px}

.cdb-wrap{max-width:960px;margin:0 auto;padding:40px clamp(16px,4vw,32px) 130px}
.cdb-pills{display:inline-flex;gap:2px;padding:4px;border:1px solid var(--line);border-radius:999px}
.cdb-pills button{display:inline-flex;align-items:center;gap:8px;padding:12px 26px;border:0;border-radius:999px;background:none;color:var(--muted);font-size:13px!important;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
.cdb-pills button[aria-selected="true"]{background:var(--brand);color:var(--on-brand)}
.cdb-count{min-width:20px;padding:1px 7px;border-radius:999px;background:var(--mint);color:var(--mint-ink);font-size:12px;letter-spacing:0}
.cdb [aria-selected="true"] .cdb-count{background:rgba(255,255,255,.22);color:#fff}

.cdb-la-o{fill:var(--stub)}.cdb-la-t{fill:var(--la-tile)}.cdb-la-c{fill:var(--la-c)}
.cdb-la-l{fill:var(--la-fill);stroke:var(--la-ink);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.cdb-la-l .cdb-la-h,.cdb-la-l .cdb-la-e{fill:var(--la-ink)}.cdb-la-l .cdb-la-e{stroke:none}

.cdb-steps{display:flex;gap:6px;margin-top:48px}
.cdb-steps i{width:18px;height:3px;border-radius:99px;background:#e4e6ea}
.cdb-steps i.cdb-on{background:var(--ink)}

.cdb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 34px;border:1.5px solid var(--brand-ink);border-radius:12px;font-size:15px!important;font-weight:600;letter-spacing:0;text-decoration:none;background:transparent;color:var(--brand-ink)}
.cdb-btn.cdb-primary{background:var(--brand);border-color:var(--brand);color:var(--on-brand)}
.cdb-btn.cdb-sm{min-height:44px;padding:0 20px;border-radius:10px;font-size:14px!important}
.cdb-btn.cdb-disabled{opacity:.55;pointer-events:none}
.cdb-btn svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.cdb-link{border:0;background:none;padding:10px 6px;color:var(--muted);font-size:15px!important;text-decoration:underline;text-underline-offset:3px}

.cdb-find{margin-top:44px;text-align:center}
.cdb-seg{display:inline-flex;padding:4px;gap:2px;background:var(--seg);border-radius:14px}
.cdb-seg button{padding:10px 30px;border:1px solid transparent;border-radius:10px;background:none;color:var(--muted);font-weight:600;font-size:16px!important}
.cdb-seg button[aria-selected="true"]{background:var(--surface);border-color:var(--brand-ink);color:var(--ink)}
.cdb-find h2{margin:28px 0 8px;font-size:clamp(24px,4vw,30px)!important;font-weight:650;letter-spacing:-.02em!important;line-height:1.2!important}
.cdb-find .cdb-sub{margin:0 auto;max-width:46ch;color:var(--muted)!important}
.cdb-fan{--c:clamp(80px,26vw,156px);display:flex;align-items:center;justify-content:center;margin:36px 0 40px}
.cdb-av{display:block;aspect-ratio:1;border-radius:50%;overflow:hidden;border:3px solid var(--surface);box-shadow:var(--shadow);margin-left:calc(var(--c) * -.07)}
.cdb-av:first-child{margin-left:0}
.cdb-av svg{display:block;width:100%;height:100%}
.cdb-a1,.cdb-a5{width:calc(var(--c) * .52);z-index:1}
.cdb-a2,.cdb-a4{width:calc(var(--c) * .78);z-index:2}
.cdb-a3{width:var(--c);z-index:3}
.cdb-cta{display:flex;flex-wrap:wrap;gap:14px;justify-content:center}
.cdb-assure{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin:36px 0 0;padding:22px 26px;list-style:none;border:1px solid var(--line);border-radius:16px;text-align:left}
.cdb-assure li{display:flex;gap:14px;align-items:flex-start;color:var(--muted);font-size:15px}
.cdb-assure svg{flex:none;width:24px;height:24px;margin-top:2px;fill:none;stroke:var(--brand-ink);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.cdb-help{margin:28px auto 0;max-width:52ch;color:var(--muted)!important;font-size:14px!important}

.cdb-empty{margin-top:72px;text-align:center;color:var(--muted)}
.cdb-empty svg{width:72px;height:72px;fill:none;stroke:var(--muted);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;opacity:.7}
.cdb-empty h2{margin:16px 0 6px;color:var(--ink);font-size:26px!important;letter-spacing:-.02em!important}
.cdb-empty p{margin:0 auto;max-width:40ch;color:var(--muted)!important}

.cdb-booked{margin-top:36px}
.cdb-ticket{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 316px;overflow:hidden;background:var(--surface);border:1px solid var(--line);border-radius:30px;box-shadow:var(--shadow)}
.cdb-t-main{padding:24px 30px 22px}
.cdb-t-top{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between}
.cdb-t-brand{color:var(--brand);font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.cdb-chip{padding:4px 11px;border-radius:999px;font-size:13px;font-weight:600;white-space:nowrap}
.cdb-chip.cdb-warn{background:var(--warn-bg);color:var(--warn-ink)}
.cdb-chip.cdb-ok{background:var(--ok-bg);color:var(--ok-ink)}
.cdb-chip.cdb-mute{background:var(--seg);color:var(--muted)}
.cdb-who{display:flex;gap:14px;align-items:center;margin:19px 0 18px}
.cdb-who .cdb-av{width:92px;border-radius:30px;border:0;background:none;margin:0;box-shadow:none;flex:none}
.cdb-lbl{color:var(--lbl);font-size:12px;font-weight:400;letter-spacing:.12em;text-transform:uppercase}
.cdb-who h3{margin:2px 0 0;font-size:21px!important;font-weight:700;letter-spacing:-.02em!important;line-height:1.2!important}
.cdb-who p{margin:2px 0 0;color:var(--muted)!important;font-size:14px!important}
.cdb-t-main hr{border:0;border-top:1px solid var(--line);margin:0 0 23px}
.cdb-grid{display:grid;grid-template-columns:1fr 1fr;gap:19px 32px;margin:0}
.cdb-grid dt{color:var(--lbl);font-size:12px;font-weight:400;letter-spacing:.12em;text-transform:uppercase}
.cdb-grid dd{margin:6px 0 0;font-size:17px;font-weight:650;letter-spacing:-.01em}
.cdb-grid dd.cdb-s{margin-top:2px;color:var(--muted);font-size:13px;font-weight:400;letter-spacing:0}
.cdb-t-stub{position:relative;display:flex;flex-direction:column;padding:26px 27px 24px;background:var(--stub);border-left:2px dashed var(--dash)}
.cdb-t-stub::before,.cdb-t-stub::after{content:"";position:absolute;left:-14px;width:26px;height:26px;border-radius:50%;background:var(--bg);border:1px solid var(--line)}
.cdb-t-stub::before{top:-14px}
.cdb-t-stub::after{bottom:-14px}
.cdb-t-stub h4{margin:4px 0 2px;font-size:16px!important;font-weight:700;letter-spacing:-.01em!important}
.cdb-t-stub p{margin:0 0 2px;color:var(--muted)!important;font-size:14px!important;overflow-wrap:anywhere}
.cdb-total{margin-top:auto;padding-top:20px;border-top:1px solid var(--stub-line)}
.cdb-total strong{display:block;margin:6px 0 4px;color:var(--total);font-size:30px;font-weight:700;letter-spacing:-.03em;line-height:1.1}
.cdb-total span{color:var(--muted);font-size:14px}
.cdb-spacer{flex:1;min-height:24px}
.cdb-joinbox{padding-top:20px;border-top:1px solid var(--stub-line)}
.cdb-join-lbl{display:flex;align-items:center;gap:8px}
.cdb-join-lbl svg{flex:none;width:20px;height:20px;fill:none;stroke:var(--brand-ink);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.cdb-loc{margin:10px 0 8px;font-size:14px!important;color:var(--muted)!important}
.cdb-loc b{margin-left:4px;color:var(--ink);font-weight:600}
.cdb-mlink{display:flex;flex-wrap:nowrap;align-items:center;gap:6px}
.cdb-mlink a{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;font-size:12px;letter-spacing:-.01em;color:var(--muted);text-decoration:underline;text-underline-offset:3px;white-space:nowrap}
.cdb-mlink .cdb-copy{flex:none;padding:4px 11px;font-size:12px}
.cdb-copy{padding:6px 14px;border:1px solid var(--line);border-radius:999px;background:var(--surface);font-size:13px;font-weight:600;color:var(--muted)}
.cdb-jstack{display:flex;flex-direction:column;gap:10px;margin-top:16px}
.cdb-jstack .cdb-btn{width:100%;min-height:46px;padding:0 16px}
.cdb-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px 18px;margin-top:34px}
.cdb-hint{color:var(--muted)!important;font-size:14px!important}
.cdb-panel{margin-top:20px;padding:24px 28px;background:var(--surface);border:1px solid var(--line);border-radius:22px}
.cdb-panel h3{margin:0 0 4px;font-size:20px!important;font-weight:650;letter-spacing:-.01em!important}
.cdb-panel .cdb-hint{margin:0 0 14px}
.cdb-two{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px}
.cdb-two .cdb-panel{margin:0}
.cdb-docs{display:flex;flex-direction:column;gap:10px;margin-top:14px}
.cdb-doc{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:var(--surface);text-align:left;text-decoration:none}
.cdb-doc:hover,.cdb-chip-btn:hover{border-color:var(--brand-ink)}
.cdb-doc b{display:block;font-weight:600}
.cdb-doc small{color:var(--muted);font-size:13px}
.cdb-doc svg{flex:none;width:22px;height:22px;fill:none;stroke:var(--brand-ink);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}

.cdb-sec-h{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:4px 16px;margin:34px 0 12px}
.cdb-sec-h h2{margin:0;font-size:20px!important;font-weight:650;letter-spacing:-.01em!important}
.cdb-ulist{display:grid;gap:10px;margin:0;padding:0;list-style:none}
.cdb-uc{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:4px 16px;padding:16px 20px;border:1px solid var(--line);border-radius:20px;background:var(--surface)}
.cdb-dtile{grid-row:1/span 2;display:grid;place-items:center;width:56px;height:60px;border-radius:14px;background:var(--mint);color:var(--mint-ink);line-height:1.1;text-align:center}
.cdb-dtile b{display:block;font-size:22px;font-weight:700}
.cdb-dtile span{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
.cdb-uc-main{min-width:0}
.cdb-uc-main b{display:block;font-size:17px;font-weight:650;line-height:1.35}
.cdb-uc-main small{display:block;color:var(--muted);font-size:14px}
.cdb-uc .cdb-chip{padding:5px 14px;font-size:14px}

.cdb-pk{padding:26px 28px}
.cdb-pk-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 16px}
.cdb-pk-who{display:flex;align-items:center;gap:14px}
.cdb-pk-who h3{margin:0 0 2px}
.cdb-sr-av{display:block;width:48px;height:48px;flex:none;border-radius:14px;overflow:hidden}
.cdb-sr-av svg{display:block;width:100%;height:100%}
.cdb-valid{display:inline-flex;align-items:center;gap:7px;padding:7px 14px;border:1px solid var(--stub-line);border-radius:999px;background:var(--stub);color:var(--brand-ink);font-size:13px;font-weight:600;white-space:nowrap}
.cdb-valid svg,.cdb-pk-sum-t svg{flex:none;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.cdb-pk-sum{margin:24px 0 20px}
.cdb-pk-sum-t{display:flex;align-items:center;gap:10px;color:var(--warn-ink);font-size:17px}
.cdb-pk-sum-t svg{width:22px;height:22px}
.cdb-pk-sum-t.cdb-ok{color:var(--ok-ink)}
.cdb-pk-sum-t b{font-weight:650}
.cdb-pk-bar{display:grid;grid-auto-flow:column;gap:6px;margin-top:12px}
.cdb-pk-bar i{height:6px;border-radius:99px;background:var(--seg)}
.cdb-pk-bar i.cdb-on{background:var(--brand)}
.cdb-slist{display:grid;gap:10px}
.cdb-ses{border:1px solid var(--line);border-radius:18px;background:var(--surface)}
.cdb-ses.cdb-done{display:flex;align-items:center;gap:14px;padding:12px 16px;border-color:var(--stub-line);background:var(--stub)}
.cdb-ses.cdb-pend{padding:18px 20px}
.cdb-ses-t{min-width:0;flex:1}
.cdb-ses-t b{display:block;font-size:16px;font-weight:650;line-height:1.3}
.cdb-ses-t small{display:block;color:var(--muted);font-size:14px}
.cdb-ses-r{display:flex;align-items:center;gap:6px;margin-left:auto}
.cdb-ses-h{display:flex;align-items:center;gap:14px;margin-bottom:14px}
.cdb-dot{display:inline-flex;align-items:center;justify-content:center;flex:none;width:30px;height:30px;border-radius:50%;font-size:14px;font-weight:700}
.cdb-dot.cdb-ok{background:var(--brand);color:#fff}
.cdb-dot.cdb-ok svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.cdb-dot.cdb-n{background:var(--seg);color:var(--muted)}

.cdb-hist-wrap{margin-top:8px}
.cdb-hlist{display:grid;gap:10px;margin:0;padding:0;list-style:none}
.cdb-hlist li{border:1px solid var(--line);border-radius:18px;background:var(--surface);overflow:hidden}
.cdb-hrow{display:grid;grid-template-columns:1.1fr 1.2fr auto 24px;align-items:center;gap:16px;width:100%;padding:16px 20px;border:0;background:none;text-align:left}
.cdb-hrow b{display:block;font-size:16px;font-weight:650;line-height:1.35}
.cdb-hrow small{display:block;color:var(--muted);font-size:14px}
.cdb-chev{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;transition:transform .15s ease}
.cdb-hrow[aria-expanded="true"] .cdb-chev{transform:rotate(180deg)}
.cdb-hbody{display:grid;gap:20px;padding:4px 20px 22px;border-top:1px solid var(--line)}
.cdb-note-box{margin-top:8px;padding:14px 16px;border-radius:14px;background:var(--stub)}
.cdb-note-box p{margin:0 0 6px}
.cdb-note-box small{color:var(--muted);font-size:13px}
.cdb-stars{display:flex;gap:4px;margin-top:8px}
.cdb-star{display:inline-flex;padding:0;border:0;background:none;color:#d8dbe0}
.cdb-star svg{width:26px;height:26px;fill:currentColor;stroke:none}
.cdb-star.cdb-on{color:#f0b429}
.cdb-docrow{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px}

.cdb-toast{position:fixed;left:50%;bottom:26px;z-index:60;transform:translate(-50%,16px);opacity:0;pointer-events:none;
  padding:12px 18px;border-radius:999px;background:#111;color:#fff;font-size:14px;transition:opacity .2s ease,transform .2s ease}
.cdb-toast.cdb-on{opacity:1;transform:translate(-50%,0)}

.cdb-preview{
  position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);
  z-index:90;display:flex;align-items:center;gap:6px;max-width:calc(100% - 24px);overflow-x:auto;
  padding:6px 6px 6px 16px;background:var(--surface);border:1px solid var(--line);border-radius:999px;
  box-shadow:var(--shadow);white-space:nowrap
}
.cdb-preview span{color:var(--muted);font-size:13px}
.cdb-preview button{padding:8px 13px;border:0;border-radius:999px;background:none;font-size:14px!important;font-weight:600;color:var(--muted)}
.cdb-preview button[aria-pressed="true"]{background:var(--brand);color:var(--on-brand)}
.cdb-preview select{display:none;padding:8px 14px;border:1px solid var(--line);border-radius:999px;background:var(--bg);color:var(--ink);font:inherit;font-size:16px}
.cdb-toast{bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:95}
.cdb button{touch-action:manipulation;-webkit-tap-highlight-color:transparent}

@media (max-width:900px){
  .cdb-hrow{grid-template-columns:minmax(0,1fr) auto 24px;gap:8px 12px}
  .cdb-hrow > span:nth-child(2){grid-column:1/-1;grid-row:2}
}
@media (max-width:720px){
  .cdb-wrap{padding:24px 16px 120px}
  .cdb-pills{display:flex;width:100%}
  .cdb-pills button{flex:1;justify-content:center;min-height:46px;padding:0 12px}
  .cdb-find{margin-top:32px}
  .cdb-assure{grid-template-columns:1fr;gap:18px}
  .cdb-ticket{grid-template-columns:1fr}
  .cdb-t-main{padding:26px 22px}
  .cdb-t-stub{border-left:0;border-top:2px dashed var(--dash);padding:26px 22px}
  .cdb-t-stub::before{top:-14px;left:-14px}
  .cdb-t-stub::after{top:-14px;bottom:auto;left:auto;right:-14px}
  .cdb-total{margin-top:24px}
  .cdb-grid{gap:22px 16px}
  .cdb-who .cdb-av{width:72px}
  .cdb-two{grid-template-columns:1fr}
  .cdb-panel,.cdb-pk{padding:22px 18px}
  /* full-width, thumb-sized controls */
  .cdb-cta .cdb-btn,.cdb-docrow .cdb-btn,.cdb-actions .cdb-btn{flex:1 1 100%;width:100%}
  .cdb-btn.cdb-sm{min-height:46px}
  .cdb-copy{min-height:44px}
  .cdb-star svg{width:36px;height:36px}
  /* the Coming up card folds: date tile on the left, everything else stacked */
  .cdb-uc{grid-template-columns:auto minmax(0,1fr);padding:14px 16px}
  .cdb-dtile{grid-row:1/span 2;align-self:start}
  .cdb-uc .cdb-chip{grid-column:2;grid-row:2;justify-self:start;margin-top:4px}
  .cdb-uc-side{grid-column:2;grid-row:2;flex-direction:row;align-items:center;justify-self:start;gap:14px;margin-top:4px}
  .cdb-uc-side .cdb-chip{grid-column:auto;grid-row:auto;margin-top:0}
  .cdb-ses.cdb-done{flex-wrap:wrap}
  .cdb-ses-r{width:100%;margin-left:0}
  .cdb-preview button{display:none}
  .cdb-preview select{display:block}
  .cdb-preview{padding:6px}
}
@media (max-width:420px){
  .cdb-preview span{display:none}
  .cdb-preview{padding-left:6px}
  .cdb-pills button{font-size:12px!important;padding:0 8px}
  .cdb-t-main,.cdb-t-stub{padding:20px 16px}
  .cdb-grid{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){.cdb-toast{transition:none}}
.cdb-sheet-bg{position:fixed;inset:0;z-index:120;background:rgba(15,23,42,.45);display:flex;align-items:flex-end;justify-content:center}
.cdb-sheet{background:#fff;width:100%;max-width:480px;max-height:92vh;overflow:auto;border-radius:18px 18px 0 0;padding:20px 20px calc(20px + env(safe-area-inset-bottom,0px));box-shadow:0 -10px 40px rgba(0,0,0,.18)}
@media (min-width:640px){.cdb-sheet-bg{align-items:center;padding:16px}.cdb-sheet{border-radius:18px}}
.cdb-sheet-head{display:flex;justify-content:space-between;align-items:center;gap:12px}
.cdb-sheet-head h3{margin:0;font-size:18px;font-weight:700;color:#0f172a}
.cdb-x{border:0;background:none;font-size:18px;color:#64748b;cursor:pointer;padding:4px}
.cdb-sheet-when{margin:4px 0 14px;color:#475569;font-size:14px}
.cdb-sheet-note{margin:0 0 12px;color:#334155;font-size:14px;line-height:1.5}
.cdb-sheet-ok{margin:0 0 14px;padding:12px;border-radius:12px;background:#ecfdf5;color:#065f46;font-size:14px;line-height:1.5}
.cdb-sheet-err{margin:0 0 10px;padding:10px;border-radius:10px;background:#fef2f2;color:#b91c1c;font-size:13px}
.cdb-policy{display:grid;gap:6px;margin:0 0 14px;padding:12px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;color:#475569;line-height:1.45}
.cdb-policy b{color:#0f172a}
.cdb-full{width:100%;justify-content:center}
.cdb-danger{background:#b91c1c !important;color:#fff !important;border-color:#b91c1c !important}
.cdb-confirm p{margin:0 0 12px;font-size:14px;color:#334155;line-height:1.5}
.cdb-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cdb-row2 .cdb-btn{justify-content:center}
.cdb-uc-side{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0}
.cdb-uc-link{border:0;background:none;padding:2px 0;font-size:13px;font-weight:600;color:#b91c1c;cursor:pointer;text-decoration:underline;text-underline-offset:2px}
.cdb-uc-link:hover{color:#7f1d1d}
`;
