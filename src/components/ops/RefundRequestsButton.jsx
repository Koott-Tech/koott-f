'use client';

/**
 * Refund requests — the icon in the Operations header. Every paid session that is
 * cancelled (by the client in their profile, or by staff with "Cancel & refund") lands
 * here. The number shows what is waiting; clicking opens the list, a request opens its
 * details, and "Refund" sends the money back through Razorpay (backend /api/refunds).
 */
import { useCallback, useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { refundsApi } from '@/lib/staffApi';
import { useVisiblePoll } from '@/lib/useVisiblePoll';
import { Modal } from '@/components/tasks/taskUi';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const STATUS = {
  pending: ['Waiting', 'bg-amber-100 text-amber-800'],
  failed: ['Failed — try again', 'bg-red-100 text-red-700'],
  processing: ['Refund sent', 'bg-sky-100 text-sky-800'],
  refunded: ['Refunded', 'bg-emerald-100 text-emerald-800'],
  rejected: ['Not refunded', 'bg-slate-200 text-slate-700'],
};

function Badge({ status }) {
  const [label, cls] = STATUS[status] || [status, 'bg-slate-100 text-slate-700'];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>;
}

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1.5 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{children}</span>
    </div>
  );
}

function Details({ r, onDone, onBack }) {
  const [amount, setAmount] = useState(String(r.amount_suggested ?? ''));
  const [note, setNote] = useState('');
  const [step, setStep] = useState('view'); // view | confirm | busy
  const [err, setErr] = useState('');
  const [mode, setMode] = useState('refund'); // refund | reject | manual
  const open = ['pending', 'failed'].includes(r.status);
  const amt = Number(amount);
  const amountOk = amt > 0 && amt <= Number(r.amount_paid);

  const go = async () => {
    setErr(''); setStep('busy');
    try {
      if (mode === 'refund') await refundsApi.refund(r.id, { amount: amt, note: note || undefined });
      else if (mode === 'reject') await refundsApi.reject(r.id, note);
      else await refundsApi.manual(r.id, { amount: amt, note });
      onDone();
    } catch (e) { setErr(e.message); setStep('view'); }
  };

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-3 text-sm font-medium text-[#025545] hover:underline">← All requests</button>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="text-lg font-semibold text-slate-900">{r.clientName || r.clientRef || 'Client'}</div>
        <Badge status={r.status} />
      </div>
      <div className="rounded-xl border border-slate-200 p-3">
        <Row label="Client">{r.clientRef}{r.clientPhone ? ` · ${r.clientPhone}` : ''}</Row>
        {r.clientEmail && <Row label="Email">{r.clientEmail}</Row>}
        <Row label="Session">{r.session ? `${r.session.date} ${r.session.time} IST` : '—'}{r.session?.type ? ` · ${r.session.type}` : ''}</Row>
        <Row label="Therapist">{r.therapistName || '—'}</Row>
        <Row label="Cancelled by">{r.requestedBy} · {when(r.created_at)}</Row>
        {r.reason && <Row label="Reason">{r.reason}</Row>}
        <Row label="Paid">{inr(r.amount_paid)}{r.payment?.method ? ` · ${r.payment.method}` : ''}{r.payment?.paidAt ? ` · ${when(r.payment.paidAt)}` : ''}</Row>
        <Row label="Razorpay payment">{r.razorpay_payment_id || 'Not paid through Razorpay'}</Row>
        {r.razorpay_refund_id && <Row label="Razorpay refund">{r.razorpay_refund_id}</Row>}
        {r.amount_refunded != null && <Row label="Refunded">{inr(r.amount_refunded)}{r.refunded_at ? ` · ${when(r.refunded_at)}` : ''}</Row>}
        {r.decidedBy && <Row label="Handled by">{r.decidedBy}{r.decision_note ? ` — ${r.decision_note}` : ''}</Row>}
      </div>
      {r.status === 'failed' && r.failure_reason && <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">Last try failed: {r.failure_reason}</p>}
      {r.status === 'processing' && <p className="mt-3 text-sm text-slate-600">Razorpay has the refund. It usually reaches the client in 5–7 working days; this changes to Refunded when Razorpay confirms.</p>}

      {open && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2 text-sm">
            {[['refund', 'Refund'], ['reject', "Don't refund"], ['manual', 'Refunded by hand']].map(([k, label]) => (
              <button key={k} type="button" onClick={() => { setMode(k); setStep('view'); setErr(''); }}
                className={`rounded-full px-3 py-1 ring-1 ${mode === k ? 'bg-[#025545] text-white ring-[#025545]' : 'text-slate-700 ring-slate-300 hover:bg-slate-50'}`}>{label}</button>
            ))}
          </div>
          {mode !== 'reject' && (
            <label className="block text-sm">
              <span className="text-slate-600">Amount (₹) — up to {inr(r.amount_paid)}</span>
              <input type="number" inputMode="decimal" min="1" step="0.01" max={r.amount_paid} value={amount} onChange={(e) => { setAmount(e.target.value); setStep('view'); }}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          )}
          <label className="block text-sm">
            <span className="text-slate-600">{mode === 'refund' ? 'Note (optional)' : mode === 'reject' ? 'Why no refund? (the client may ask)' : 'How was it refunded? (e.g. bank transfer, ref no.)'}</span>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          {err && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</p>}
          {mode === 'refund' && !r.canRefund && <p className="text-sm text-amber-700">This booking was not paid through Razorpay. Refund it by hand, then use "Refunded by hand".</p>}
          {step !== 'confirm' ? (
            <button type="button"
              disabled={step === 'busy' || (mode === 'refund' && (!r.canRefund || !amountOk)) || (mode === 'manual' && (!amountOk || !note.trim())) || (mode === 'reject' && !note.trim())}
              onClick={() => (mode === 'refund' ? setStep('confirm') : go())}
              className="w-full rounded-xl bg-[#025545] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
              {step === 'busy' ? 'Working…' : mode === 'refund' ? `Refund ${amountOk ? inr(amt) : ''}` : mode === 'reject' ? "Don't refund" : 'Save as refunded by hand'}
            </button>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">Send <strong>{inr(amt)}</strong> back to {r.clientName || r.clientRef} through Razorpay? This cannot be undone.</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setStep('view')} className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">Back</button>
                <button type="button" onClick={go} className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white">Yes, refund {inr(amt)}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RefundRequestsButton({ dark = false }) {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('open');
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [picked, setPicked] = useState(null);
  const [ready, setReady] = useState(true);

  const loadCount = useCallback(async () => {
    try { const d = await refundsApi.count(); setCount(d.open || 0); setReady(true); } catch (e) { if (e.status === 503) setReady(false); }
  }, []);
  const loadList = useCallback(async () => {
    setErr('');
    try { const d = await refundsApi.list(view); setRows(d.requests); } catch (e) { setErr(e.message); setRows([]); }
  }, [view]);
  useEffect(() => { loadCount(); }, [loadCount]);
  useVisiblePoll(loadCount, 60000);
  useEffect(() => { if (open) loadList(); }, [open, loadList]);

  const done = () => { setPicked(null); loadList(); loadCount(); };
  const close = useCallback(() => { setOpen(false); setPicked(null); }, []);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`Refund requests${count ? `: ${count} waiting` : ''}`} title="Refund requests"
        className={`relative rounded-lg p-2 ${dark ? 'text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`}>
        <RotateCcw className="h-5 w-5" />
        {count > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-red-600 px-1 text-center text-[11px] font-bold leading-[18px] text-white">{count > 99 ? '99+' : count}</span>}
      </button>
      <Modal open={open} onClose={close} title="Refund requests" wide>
        {!ready && <p className="mb-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">Refund requests need RUN_PENDING_0023.sql to be run in Supabase.</p>}
        {picked ? (
          <Details r={picked} onDone={done} onBack={() => setPicked(null)} />
        ) : (
          <div>
            <div className="mb-3 flex gap-2 text-sm">
              {[['open', 'Waiting'], ['done', 'Done'], ['all', 'All']].map(([k, label]) => (
                <button key={k} type="button" onClick={() => setView(k)}
                  className={`rounded-full px-3 py-1 ring-1 ${view === k ? 'bg-[#025545] text-white ring-[#025545]' : 'text-slate-700 ring-slate-300'}`}>{label}</button>
              ))}
            </div>
            {err && ready && <p className="mb-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</p>}
            {err ? null : rows === null ? <p className="py-6 text-center text-sm text-slate-500">Loading…</p>
              : rows.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">{view === 'open' ? 'No refunds waiting. 👍' : 'Nothing here yet.'}</p>
                : (
                  <ul className="divide-y divide-slate-100">
                    {rows.map((r) => (
                      <li key={r.id}>
                        <button type="button" onClick={() => setPicked(r)} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-slate-50">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-900">{r.clientName || r.clientRef} · {inr(r.amount_suggested)}</span>
                            <span className="block truncate text-xs text-slate-500">
                              {r.session ? `Session ${r.session.date} ${r.session.time}` : 'Session'}{r.therapistName ? ` · ${r.therapistName}` : ''} · {r.requestedBy} · {when(r.created_at)}
                            </span>
                          </span>
                          <Badge status={r.status} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
          </div>
        )}
      </Modal>
    </>
  );
}
