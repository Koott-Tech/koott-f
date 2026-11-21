'use client';

/**
 * TDS on therapist payouts — fixed 10% (section 194J, professional fees).
 * Deducted when a payout is marked as paid; owed to the government until a challan is paid
 * (by the 7th of the next month; March by 30 April). Record each challan here: the
 * Balance Sheet's "TDS payable" = deducted − paid. Quarter totals per therapist are the
 * figures for the 26Q return and Form 16A certificates.
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { financeApi } from '@/lib/backendApi';
import { useAuth } from '@/contexts/AuthContext';
import { inr, todayIST, fmtDate, fyOf, Notice } from '@/components/finance/statementUi';

const monthName = (ym) => new Date(`${ym}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
const STATUS = {
  overdue: ['Overdue', 'bg-rose-50 text-rose-700'],
  due: ['Due', 'bg-amber-50 text-amber-800'],
  deposited: ['Paid', 'bg-emerald-50 text-emerald-700'],
  over: ['Paid (more than deducted)', 'bg-indigo-50 text-indigo-700'],
  none: ['No TDS', 'bg-gray-100 text-gray-500'],
  future: ['—', 'bg-gray-50 text-gray-400'],
};

export default function FinanceTdsPage() {
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const curFy = fyOf(todayIST()).start;
  const [fy, setFy] = useState(curFy);
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [openQ, setOpenQ] = useState({});

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated() || !(hasRole('finance') || hasRole('admin') || hasRole('superadmin'))) router.push('/');
  }, [authLoading, isAuthenticated, hasRole, router]);

  const load = useCallback(async () => {
    setError('');
    try {
      const r = await financeApi.getTds(fy);
      if (r?.success) setD(r.data); else setError(r?.message || 'Could not load');
    } catch (e) { setError(e?.message || 'Could not load'); }
  }, [fy]);
  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);

  const remove = async (dep) => {
    if (!window.confirm(`Remove the ${inr(dep.amount)} payment of ${fmtDate(dep.deposit_date)}?`)) return;
    const r = await financeApi.deleteTdsDeposit(dep.id).catch((e) => ({ message: e?.message }));
    if (r?.success) load(); else setError(r?.message || 'Could not remove');
  };

  const exportQuarter = (q) => {
    const rows = [['Therapist', 'Email', 'Payouts', 'Amount paid/credited (gross)', 'TDS deducted (10%)', 'Paid to therapist']];
    q.therapists.forEach((t) => rows.push([t.name, t.email || '', t.payouts, t.gross, t.tds, t.net]));
    rows.push(['Total', '', '', q.gross, q.tds, '']);
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `TDS-194J-${d.label.replace(/\s+/g, '')}-Q${q.q}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-3 lg:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div role="heading" aria-level="2" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">TDS</div>
            <p className="text-xs text-gray-500 mt-1">10% TDS (section 194J) taken from every therapist payout. It&apos;s the government&apos;s money until you pay the challan.</p>
          </div>
          <select aria-label="Financial year" value={fy} onChange={(e) => setFy(Number(e.target.value))} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">
            {[curFy + 1, curFy, curFy - 1, curFy - 2].map((y) => <option key={y} value={y}>FY {y}-{String(y + 1).slice(2)}</option>)}
          </select>
        </div>
        {error && <Notice tone="red">{error}</Notice>}
        {d && !d.deposits_ready && <Notice>Recording TDS payments needs the database update first (RUN_PENDING_0030.sql). Deducted amounts show already.</Notice>}
        {d && (
          <>
            {d.overdue_count > 0 && <Notice tone="red">{d.overdue_count} month{d.overdue_count > 1 ? 's are' : ' is'} overdue. Late TDS payments attract interest, so pay and record them soon.</Notice>}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                ['TDS deducted', d.totals.tds, `${d.label} · on ${inr(d.totals.gross, { dash: false })} of payouts`],
                ['Paid to government', d.totals.deposited, 'Challans recorded'],
                ['Still to pay', d.totals.outstanding, 'Shows as TDS payable on the Balance Sheet'],
                ['Next due', d.next_due ? d.next_due.amount : null, d.next_due ? `${monthName(d.next_due.month)} · by ${fmtDate(d.next_due.due)}${d.next_due.overdue ? ' (overdue)' : ''}` : 'Nothing due'],
              ].map(([l, v, h]) => (
                <div key={l} className="bg-white rounded-lg border border-gray-200 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{l}</p>
                  <p className={`mt-1 text-lg font-semibold ${l === 'Still to pay' && v > 0 ? 'text-rose-700' : 'text-gray-900'}`}>{inr(v, { dash: false })}</p>
                  <p className="text-[11px] text-gray-500">{h}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto mb-4">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    {['Month deducted', 'Payouts', 'Gross paid', 'TDS 10%', 'Paid to govt', 'Still to pay', 'Due by', 'Status', ''].map((h) => <th key={h} className="px-4 py-2 font-medium whitespace-nowrap">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {d.months.map((m) => {
                    const [label, cls] = STATUS[m.status] || STATUS.none;
                    return [
                      <tr key={m.month} className={`border-t border-gray-100 ${m.status === 'future' ? 'text-gray-400' : ''}`}>
                        <td className="px-4 py-2 whitespace-nowrap font-medium">{monthName(m.month)}</td>
                        <td className="px-4 py-2 text-right">{m.payouts || '—'}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{inr(m.gross)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{inr(m.tds)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{inr(m.deposited)}</td>
                        <td className={`px-4 py-2 text-right tabular-nums ${m.outstanding > 0 ? 'font-semibold text-rose-700' : ''}`}>{inr(m.outstanding)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-600">{m.status === 'future' || m.status === 'none' ? '—' : fmtDate(m.due)}</td>
                        <td className="px-4 py-2"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${cls}`}>{label}</span></td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          {d.deposits_ready && m.status !== 'future' && (m.tds > 0 || m.deposited > 0) && (
                            <button type="button" onClick={() => setForm({ period_month: m.month, deposit_date: todayIST(), amount: m.outstanding > 0 ? String(m.outstanding) : '', challan_no: '', notes: '' })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-[#025545] text-[#025545] rounded-md hover:bg-emerald-50">
                              <Plus className="h-3.5 w-3.5" /> Record payment
                            </button>
                          )}
                        </td>
                      </tr>,
                      ...m.deposits.map((dep) => (
                        <tr key={dep.id} className="bg-gray-50/60 text-xs text-gray-600">
                          <td className="px-4 py-1.5 pl-8" colSpan={4}>Paid {fmtDate(dep.deposit_date)}{dep.challan_no ? ` · challan ${dep.challan_no}` : ''}{dep.notes ? ` · ${dep.notes}` : ''}</td>
                          <td className="px-4 py-1.5 text-right tabular-nums">{inr(dep.amount)}</td>
                          <td colSpan={3} />
                          <td className="px-4 py-1.5 text-right"><button type="button" aria-label={`Remove payment of ${fmtDate(dep.deposit_date)}`} onClick={() => remove(dep)} className="p-1 text-gray-400 hover:text-rose-700"><Trash2 className="h-3.5 w-3.5" /></button></td>
                        </tr>
                      )),
                    ];
                  })}
                  <tr className="border-t-2 border-gray-300 font-semibold">
                    <td className="px-4 py-2">Total</td>
                    <td />
                    <td className="px-4 py-2 text-right tabular-nums">{inr(d.totals.gross)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{inr(d.totals.tds)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{inr(d.totals.deposited)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{inr(d.totals.outstanding)}</td>
                    <td colSpan={3} />
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm font-semibold text-gray-900">Quarterly return (26Q) and therapist certificates (16A)</div>
              <p className="text-xs text-gray-500 mb-3">TDS per therapist for each quarter. Download a quarter for your CA.</p>
              <div className="space-y-2">
                {d.quarters.map((q) => (
                  <div key={q.q} className="rounded-lg border border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <button type="button" onClick={() => setOpenQ({ ...openQ, [q.q]: !openQ[q.q] })} className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                        {openQ[q.q] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        {q.label}
                      </button>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                        <span>TDS {inr(q.tds, { dash: false })}</span>
                        <span>Paid {inr(q.deposited, { dash: false })}</span>
                        <span>Return due {fmtDate(q.return_due)}</span>
                        <span>{q.therapists.length} therapist{q.therapists.length === 1 ? '' : 's'}</span>
                        {q.therapists.length > 0 && <button type="button" onClick={() => exportQuarter(q)} className="inline-flex items-center gap-1 text-[#025545] hover:underline"><Download className="h-3.5 w-3.5" /> CSV</button>}
                      </div>
                    </div>
                    {openQ[q.q] && (
                      <div className="border-t border-gray-100 overflow-x-auto">
                        {q.therapists.length === 0 ? <p className="px-3 py-3 text-xs text-gray-500">No payouts in this quarter.</p> : (
                          <table className="min-w-full text-xs">
                            <thead><tr className="text-left text-gray-500"><th className="px-3 py-1.5 font-medium">Therapist</th><th className="px-3 py-1.5 font-medium text-right">Payouts</th><th className="px-3 py-1.5 font-medium text-right">Gross</th><th className="px-3 py-1.5 font-medium text-right">TDS 10%</th><th className="px-3 py-1.5 font-medium text-right">Paid to them</th></tr></thead>
                            <tbody>
                              {q.therapists.map((t) => (
                                <tr key={t.psychologist_id} className="border-t border-gray-100"><td className="px-3 py-1.5">{t.name}{t.email && <span className="block text-[11px] text-gray-400">{t.email}</span>}</td><td className="px-3 py-1.5 text-right">{t.payouts}</td><td className="px-3 py-1.5 text-right">{inr(t.gross)}</td><td className="px-3 py-1.5 text-right font-medium">{inr(t.tds)}</td><td className="px-3 py-1.5 text-right">{inr(t.net)}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-gray-500">Deposit by the 7th of the next month (March: 30 April). The return is due 31 Jul, 31 Oct, 31 Jan and 31 May. Therapist PAN isn&apos;t stored here; your CA adds it when filing.</p>
            </div>
          </>
        )}
        {form && <DepositForm form={form} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
      </div>
    </div>
  );
}

function DepositForm({ form, onClose, onSaved }) {
  const [f, setF] = useState(form);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    const r = await financeApi.addTdsDeposit({ ...f, amount: Number(f.amount) }).catch((e2) => ({ message: e2?.message }));
    setSaving(false);
    if (r?.success) onSaved(); else setErr(r?.message || 'Could not save');
  };
  const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm';
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Record TDS payment">
      <form onSubmit={submit} className="bg-white rounded-lg w-full max-w-md">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm font-semibold">Record TDS paid to government · {monthName(f.period_month)}</div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Amount paid (₹)</span><input type="number" min="0.01" step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required className={input} /></label>
            <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Paid on</span><input type="date" value={f.deposit_date} max={todayIST()} onChange={(e) => setF({ ...f, deposit_date: e.target.value })} required className={input} /></label>
          </div>
          <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Challan / CIN no. (optional)</span><input value={f.challan_no} onChange={(e) => setF({ ...f, challan_no: e.target.value })} placeholder="From the challan receipt" className={input} /></label>
          <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</span><input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={input} /></label>
          <p className="text-[11px] text-gray-500">This clears the TDS payable for {monthName(f.period_month)}. It isn&apos;t an expense: the therapist fee was already counted in full.</p>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[#025545] text-white rounded-lg text-sm disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
        </div>
      </form>
    </div>
  );
}
