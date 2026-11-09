'use client';

/**
 * Therapist → My numbers: sessions this month, clients and how many rebook, earnings so
 * far this month, and when the next payout is due — so nobody has to ask Finance.
 */
import { useEffect, useState } from 'react';
import { staffFetch } from '@/lib/staffApi';

const inr = (n) => `₹${Math.round(Number(n || 0)).toLocaleString('en-IN')}`;
const day = (s) => (s ? new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) : '');

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export default function MyNumbers() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { staffFetch('/me/numbers').then(setD).catch((e) => setErr(e.message)); }, []);
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4">
        <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>My numbers</div>
        <div className="mt-0.5 text-sm text-slate-500">{d ? d.month.label : 'This month'} — your sessions, clients, earnings and payout.</div>
      </div>
      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {!d && !err && <div className="text-sm text-slate-500">Loading…</div>}
      {d && (
        <>
          <div className="mb-4 rounded-2xl bg-[#025545] p-5 text-white">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-100/80">Next payout</div>
            {d.payout.state === 'due' ? (
              <div className="mt-1 text-lg font-semibold">{inr(d.payout.amount)} is being paid{d.payout.date ? ` on ${day(d.payout.date)}` : ' soon'}.</div>
            ) : (
              <div className="mt-1 text-lg font-semibold">Payouts run on {day(d.payout.date)} — about {inr(d.payout.estimate)} so far.</div>
            )}
            {d.lastPayout && <div className="mt-1 text-sm text-emerald-100/80">Last payout: {inr(d.lastPayout.amount)} on {day(d.lastPayout.date)}</div>}
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Sessions completed" value={d.month.completed} sub="this month" />
            <Stat label="Sessions coming up" value={d.month.upcoming} sub="this month" />
            <Stat label="Earned so far" value={inr(d.month.earned)} sub="completed sessions" />
            <Stat label="Clients who rebook" value={d.clients90.rate === null ? '—' : `${d.clients90.rate}%`} sub={`${d.clients90.rebooked} of ${d.clients90.clients} clients (90 days)`} />
          </div>
          {d.month.noShows > 0 && <div className="mt-3 text-sm text-slate-500">{d.month.noShows} no-show{d.month.noShows > 1 ? 's' : ''} this month — Operations follows them up.</div>}
          <div className="mt-4 text-xs text-slate-400">Earnings are your share of completed sessions as recorded by Finance. Questions? Give Finance a task from the + button.</div>
        </>
      )}
    </div>
  );
}
