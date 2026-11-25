'use client';

/**
 * Refunds and Refund details — Koott 2.0.
 *
 * Built to the Figma file "Koott 2.0" (EzLwBjoYNqTa9RMEmOfyQO), section Home (WIP),
 * screens "Refunds" (8063:4520) and "Refund details" (8063:4596), drawn at 402 px.
 *
 * Both read /clients/refunds, which is this client's own rows only — the whole
 * refund queue lives behind the admin's /refunds and is not theirs to see.
 *
 * The design promises "5 to 7 working days". There is no expected-by column, so
 * the date shown is counted forward from when the refund was raised, in working
 * days, and it is called an estimate rather than a promise.
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientApi } from '@/lib/backendApi';
import { SESSIONS2_CSS } from './sessions2.css';
import {
  CopyButton, Icon, addWorkingDays, dayOf, initials, kindOf, money, nameOf, photoOf, refOf, startOf, whenOf,
} from './shared';

const CARE_WHATSAPP = '919539007766';
const OPEN = ['requested', 'pending', 'approved', 'processing', 'initiated'];

const isDone = (r) => String(r.status || '').toLowerCase() === 'refunded' || !!r.refunded_at;
const isOpen = (r) => OPEN.includes(String(r.status || '').toLowerCase());
const amountOf = (r) => r.amount_refunded ?? r.amount_suggested ?? r.amount_paid;

function markOf(r) {
  if (isDone(r)) return { label: 'Completed', icon: Icon.done };
  if (isOpen(r)) return { label: 'In progress', icon: Icon.booked };
  return { label: 'Closed', icon: Icon.cancelled };
}

function Chrome({ title, children, onBack, helpText }) {
  return (
    <div className="s2">
      <style dangerouslySetInnerHTML={{ __html: SESSIONS2_CSS }} />
      <div className="s2-shell">
        <div className="s2-top">
          <button type="button" className="s2-back" onClick={onBack} aria-label="Go back">{Icon.back}</button>
          <a className="s2-help" href={`https://wa.me/${CARE_WHATSAPP}?text=${encodeURIComponent(helpText)}`} target="_blank" rel="noreferrer">
            {Icon.help}Help
          </a>
        </div>
        <div className="s2-title"><h1>{title}</h1></div>
        {children}
      </div>
    </div>
  );
}

/** One refund, as both screens draw it. */
function RefundCard({ r, tz, onOpen }) {
  const mark = markOf(r);
  const due = isOpen(r) ? addWorkingDays(r.created_at, 7) : null;
  return (
    <article className="s2-card">
      <div className="s2-card-top">
        <div className="s2-meta">
          <span className="s2-amount">{money(amountOf(r), r.currency)}</span>
          <span className="s2-status">{mark.icon}{mark.label}</span>
        </div>
        <div className="s2-meta">
          <span className="s2-id">
            <span className="s2-id-k">ID:</span>
            <span className="s2-id-v">{refOf(r.session_id || r.id)}</span>
            <CopyButton value={String(r.session_id || r.id)} label="Copy the booking id" />
          </span>
          <span className="s2-id-v">{dayOf(r.created_at, tz)}</span>
        </div>
      </div>
      <div className="s2-div" />
      <div className="s2-card-foot">
        <span className="s2-foot-note">
          {isDone(r)
            ? `Credited on ${dayOf(r.refunded_at || r.updated_at, tz)}`
            : due ? `Expected by ${dayOf(due.toISOString(), tz)}` : 'We will write to you about this refund.'}
        </span>
      </div>
      <button type="button" className="s2-card-cta" onClick={onOpen}>View Details</button>
    </article>
  );
}

export function Refunds2() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('loading');
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata', []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const r = await clientApi.getRefunds();
        if (!live) return;
        setRows(r?.data?.refunds || []);
        setStatus('ready');
      } catch { if (live) setStatus('error'); }
    })();
    return () => { live = false; };
  }, []);

  const open = rows.filter(isOpen);
  const closed = rows.filter((r) => !isOpen(r));

  return (
    <Chrome title="Refunds" onBack={() => router.push('/profile/sessions')} helpText="Hi Koott, I have a question about a refund.">
      <div className="s2-body is-list" style={{ gap: 12 }}>
        {status === 'loading' && <div className="s2-skeleton" />}
        {status === 'error' && <div className="s2-note"><p>We couldn’t load your refunds just now.</p></div>}
        {status === 'ready' && rows.length === 0 && <div className="s2-note"><p>No refunds on your account.</p></div>}

        {open.length > 0 && <h2 className="s2-group">In progress</h2>}
        {open.length > 0 && (
          <div className="s2-list">
            {open.map((r) => <RefundCard key={r.id} r={r} tz={tz} onOpen={() => router.push(`/profile/refunds/${r.id}`)} />)}
          </div>
        )}

        {closed.length > 0 && <h2 className="s2-group is-later">Completed</h2>}
        {closed.length > 0 && (
          <div className="s2-list">
            {closed.map((r) => <RefundCard key={r.id} r={r} tz={tz} onOpen={() => router.push(`/profile/refunds/${r.id}`)} />)}
          </div>
        )}
      </div>
    </Chrome>
  );
}

export function RefundDetails2({ refundId }) {
  const router = useRouter();
  const [r, setR] = useState(null);
  const [status, setStatus] = useState('loading');
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata', []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await clientApi.getRefunds();
        if (!live) return;
        const found = (res?.data?.refunds || []).find((x) => String(x.id) === String(refundId));
        setR(found || null);
        setStatus(found ? 'ready' : 'missing');
      } catch { if (live) setStatus('error'); }
    })();
    return () => { live = false; };
  }, [refundId]);

  if (status !== 'ready') {
    return (
      <Chrome title="Refund" onBack={() => router.push('/profile/refunds')} helpText="Hi Koott, I have a question about a refund.">
        <div className="s2-body">
          {status === 'loading' ? <div className="s2-skeleton" />
            : <div className="s2-note"><p>{status === 'missing' ? 'We couldn’t find that refund.' : 'We couldn’t load that refund just now.'}</p></div>}
        </div>
      </Chrome>
    );
  }

  const done = isDone(r);
  const due = addWorkingDays(r.created_at, 7);
  const amount = money(amountOf(r), r.currency);
  const session = r.session;
  const at = startOf(session);
  const who = session?.psychologist;
  const fee = Number(session?.price ?? session?.amount) || 0;
  const off = Number(session?.discount_amount) || 0;
  const paid = Number(session?.amount ?? fee) || 0;

  const steps = [
    { title: 'Session cancelled', when: r.created_at, done: true },
    { title: 'Koott started your refund', when: r.decided_at || r.updated_at, done: !!(r.decided_at || done) },
    { title: 'Money back in your account', when: r.refunded_at, done, note: done ? null : 'Usually 5 to 7 working days' },
  ];

  return (
    <div className="s2">
      <style dangerouslySetInnerHTML={{ __html: SESSIONS2_CSS }} />
      <div className="s2-hero">
        <div className="s2-shell">
          <div className="s2-top">
            <button type="button" className="s2-back" onClick={() => router.push('/profile/refunds')} aria-label="Go back">{Icon.back}</button>
            <a className="s2-help" href={`https://wa.me/${CARE_WHATSAPP}?text=${encodeURIComponent('Hi Koott, I have a question about a refund.')}`} target="_blank" rel="noreferrer">
              {Icon.help}Help
            </a>
          </div>
          <div className="s2-hero-text">
            <h1 className="s2-hero-title">{done ? 'Refund completed' : 'Refund on its way'}</h1>
            <p className="s2-hero-sub">
              {done
                ? `${amount} was sent back to the account you paid from on ${dayOf(r.refunded_at || r.updated_at, tz)}.`
                : `${amount} will reach the account you paid from in 5 to 7 working days.`}
            </p>
          </div>
        </div>
      </div>

      <div className="s2-shell">
        <div className="s2-body is-detail">
          <div className="s2-main">
            <div className="s2-panel">
              <div className="s2-kv">
                <span className="s2-k" style={{ fontWeight: 600, color: '#1C241F' }}>Booking ID</span>
                <span className="s2-status">{markOf(r).icon}{markOf(r).label}</span>
              </div>
              <div className="s2-kv">
                <span className="s2-id">
                  <span className="s2-id-k">ID:</span>
                  <span className="s2-id-v">{refOf(r.session_id || r.id)}</span>
                  <CopyButton value={String(r.session_id || r.id)} label="Copy the booking id" />
                </span>
                <span className="s2-id-v">{dayOf(r.created_at, tz)}</span>
              </div>
              <div className="s2-div" />
              <div className="s2-kv"><span className="s2-k">Refund amount</span><span className="s2-v">{amount}</span></div>
              <div className="s2-kv">
                <span className="s2-k">To the account you paid from</span>
                <span className="s2-v">{amount}</span>
              </div>
              <div className="s2-div" />
              <div className="s2-steps">
                {steps.map((s, i) => (
                  <div className={`s2-step${s.done ? ' is-done' : ''}`} key={s.title}>
                    <span className="s2-step-rail">
                      <span className="s2-step-dot" />
                      {i < steps.length - 1 && <span className="s2-step-line" />}
                    </span>
                    <span className="s2-step-text">
                      <span className="s2-step-title">{s.title}</span>
                      <span className="s2-step-when">
                        {s.when ? `${dayOf(s.when, tz)}, ${new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(s.when))}` : s.note || '—'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {session && (
              <div className="s2-section">
                <h2 className="s2-panel-title">Session</h2>
                <div className="s2-panel">
                  <div className="s2-who">
                    <span className="s2-photo">{photoOf(who) ? <img src={photoOf(who)} alt="" /> : initials(nameOf(who))}</span>
                    <span className="s2-who-text">
                      <span className="s2-name">{nameOf(who) || 'Your therapist'}</span>
                      <span className="s2-kind">{at ? whenOf(at, tz) : kindOf(session)}</span>
                    </span>
                    <span className="s2-status">{Icon.cancelled}Cancelled</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="s2-side">
            {session && (
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
            )}
            <button type="button" className="s2-wide" onClick={() => router.push('/profile/receipts')}>
              {Icon.invoice}View invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Refunds2;
