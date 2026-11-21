'use client';

/**
 * Razorpay settlements. Money paid through Razorpay reaches our bank a few days later (no
 * fixed day) after Razorpay takes its fee + GST. Each time a payout lands, Finance records it
 * here: what Razorpay collected and what reached the bank. The difference is saved as a
 * "Razorpay fees" expense, so it counts in expenses and net profit.
 *
 * <RazorpaySettlementPanel onSaved={() => …} />   full panel with the "Record" button (Expenses)
 * <RazorpaySettlementPanel compact />             numbers only (Dashboard)
 */
import { useCallback, useEffect, useState } from 'react';
import { Landmark, Plus, X } from 'lucide-react';
import { financeApi } from '@/lib/backendApi';

const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const inr2 = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const todayIST = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);

export default function RazorpaySettlementPanel({ compact = false, onSaved, refreshKey = 0 }) {
  const [summary, setSummary] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await financeApi.getRazorpaySettlementSummary();
      if (r?.success) { setSummary(r.data); setLoadError(''); } else setLoadError(r?.message || 'Could not load');
    } catch (e) {
      setLoadError(e?.message || 'Could not load');
    }
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);

  const tiles = [
    ['Collected via Razorpay', summary?.collected_via_razorpay, 'All successful Razorpay payments'],
    ['Settled to our bank', summary?.settled_received, `Gross settled ${inr(summary?.settled_gross)}`],
    ['Razorpay fees (expenses)', summary?.fees_recorded, 'Collected − received, per settlement'],
    ['Still with Razorpay', summary?.still_with_razorpay, 'Not yet paid out to us'],
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 mb-4 sm:mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><Landmark className="h-4 w-4" /></span>
          <div>
            <div className="text-sm font-semibold text-gray-900">Razorpay settlements</div>
            <p className="text-xs text-gray-500">Razorpay pays out every few days after taking its fee. Record each payout when it reaches the bank.</p>
          </div>
        </div>
        {!compact && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
          >
            <Plus className="h-4 w-4" /> Record Razorpay settlement
          </button>
        )}
      </div>
      {loadError ? (
        <p className="text-xs text-red-600">{loadError}</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {tiles.map(([label, value, hint]) => (
            <div key={label} className="rounded-lg border border-gray-200 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
              <p className="mt-1 text-base sm:text-lg font-semibold text-gray-900">{summary ? inr(value) : '…'}</p>
              <p className="text-[11px] text-gray-500">{hint}</p>
            </div>
          ))}
        </div>
      )}
      {summary && summary.ready === false && (
        <p className="mt-2 text-xs text-amber-700">Recording settlements needs the database update (RUN_PENDING_0027.sql).</p>
      )}
      {!compact && summary?.recent?.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-1.5 pr-3 font-medium">Received on</th>
                <th className="py-1.5 pr-3 font-medium">Collected</th>
                <th className="py-1.5 pr-3 font-medium">Received</th>
                <th className="py-1.5 pr-3 font-medium">Fee</th>
                <th className="py-1.5 pr-3 font-medium">Settlement ID</th>
                <th className="py-1.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.recent.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 text-gray-700">
                  <td className="py-1.5 pr-3">{r.date ? new Date(`${r.date}T00:00:00`).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="py-1.5 pr-3">{r.gross == null ? '—' : inr2(r.gross)}</td>
                  <td className="py-1.5 pr-3">{r.received == null ? '—' : inr2(r.received)}</td>
                  <td className="py-1.5 pr-3 font-medium text-amber-700">{inr2(r.fee)}</td>
                  <td className="py-1.5 pr-3 font-mono">{r.reference_number || '—'}</td>
                  <td className="py-1.5 capitalize">{r.approval_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <SettlementForm
          stillWith={summary?.still_with_razorpay}
          onClose={() => setOpen(false)}
          onSaved={() => { setOpen(false); load(); onSaved?.(); }}
        />
      )}
    </div>
  );
}

function SettlementForm({ onClose, onSaved, stillWith }) {
  const [date, setDate] = useState(todayIST());
  const [gross, setGross] = useState('');
  const [received, setReceived] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const g = parseFloat(gross);
  const rcv = parseFloat(received);
  const fee = Number.isFinite(g) && Number.isFinite(rcv) ? Math.round((g - rcv) * 100) / 100 : null;
  const invalid = !(g > 0) || !(rcv >= 0) || rcv > g;

  const submit = async (e) => {
    e.preventDefault();
    if (invalid) return;
    setSaving(true); setErr('');
    try {
      const r = await financeApi.createRazorpaySettlement({ date, gross: g, received: rcv, reference_number: reference || undefined, notes: notes || undefined });
      if (r?.success) onSaved();
      else setErr(r?.message || 'Could not save');
    } catch (e2) {
      setErr(e2?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Record Razorpay settlement">
      <form onSubmit={submit} className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">Record Razorpay settlement</div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-600">
            Copy the figures from the Razorpay dashboard settlement.
            {stillWith > 0 ? ` About ${inr(stillWith)} is still with Razorpay.` : ''}
          </p>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Date it reached our bank</span>
            <input type="date" value={date} max={todayIST()} onChange={(e) => setDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Razorpay collected (₹)</span>
              <input type="number" min="0" step="0.01" value={gross} onChange={(e) => setGross(e.target.value)} required placeholder="e.g. 150000" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Received in bank (₹)</span>
              <input type="number" min="0" step="0.01" value={received} onChange={(e) => setReceived(e.target.value)} required placeholder="e.g. 125000" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </label>
          </div>
          <div className={`rounded-lg px-3 py-2 text-sm ${fee != null && !invalid ? 'bg-amber-50 text-amber-800' : 'bg-gray-50 text-gray-500'}`}>
            {fee == null ? 'Razorpay fee = collected − received' : invalid ? 'Received can’t be more than collected.' : <>Razorpay fee: <strong>{inr2(fee)}</strong>, added to expenses as “Razorpay fees”.</>}
          </div>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Settlement ID (optional)</span>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="setl_…" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </label>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button type="submit" disabled={saving || invalid} className="flex-1 px-4 py-2 bg-[#025545] text-white rounded-lg hover:bg-[#012f23] disabled:opacity-50 text-sm">
            {saving ? 'Saving…' : 'Save settlement'}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
        </div>
      </form>
    </div>
  );
}
