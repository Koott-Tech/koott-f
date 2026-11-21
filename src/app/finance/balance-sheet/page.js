'use client';

/**
 * Balance Sheet as at a date (Schedule III order: Equity & Liabilities, then Assets).
 * Worked out by the system: fixed assets (net of depreciation), receivable from Razorpay,
 * payable to therapists, TDS deducted on therapist payouts, reserves (profit to date).
 * Entered by hand (each with its date): bank & cash balances, capital, loans, deposits,
 * GST / TDS paid, other payables and receivables. The latest entry on or before the
 * Balance Sheet date is used. Until bank/cash and capital are entered the two sides won't
 * match; the difference is shown.
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, Plus, Pencil, Trash2, X } from 'lucide-react';
import { financeApi } from '@/lib/backendApi';
import { useAuth } from '@/contexts/AuthContext';
import { inr, todayIST, fmtDate, fyOf, Row, SectionTitle, Notice } from '@/components/finance/statementUi';

const SECTION_LABEL = {
  equity: "Shareholders' / owner's funds",
  non_current_liability: 'Non-current liabilities',
  current_liability: 'Current liabilities',
  non_current_asset: 'Other non-current assets',
  cash_bank: 'Cash & bank balances',
  current_asset: 'Other current assets',
};

export default function BalanceSheetPage() {
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [asOf, setAsOf] = useState(todayIST());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // item being added/edited

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated() || !(hasRole('finance') || hasRole('admin') || hasRole('superadmin'))) router.push('/');
  }, [authLoading, isAuthenticated, hasRole, router]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await financeApi.getBalanceSheet(asOf);
      if (r?.success) setData(r.data); else setError(r?.message || 'Could not load');
    } catch (e) { setError(e?.message || 'Could not load'); } finally { setLoading(false); }
  }, [asOf]);
  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);

  const fyEnd = fyOf(todayIST()).start;
  const t = data?.totals;
  const lines = (list) => list.map((x, i) => (
    <Row key={`${x.name}-${i}`} label={x.name} value={x.amount} indent={2}
      note={x.computed ? (x.detail ? `Worked out by the system · ${x.detail}` : 'Worked out by the system') : `Entered · balance on ${fmtDate(x.as_of)}`} />
  ));

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-3 lg:p-4 print:bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4 flex flex-col lg:flex-row lg:items-end justify-between gap-3 print:hidden">
          <div>
            <div role="heading" aria-level="2" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">Balance Sheet</div>
            <p className="text-xs text-gray-500 mt-1">What the company owns and owes on a date.</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm text-gray-700">As at{' '}
              <input type="date" value={asOf} onChange={(e) => e.target.value && setAsOf(e.target.value)} className="ml-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" />
            </label>
            <button type="button" onClick={() => setAsOf(todayIST())} className="px-3 py-1.5 text-sm text-[#025545] hover:underline">Today</button>
            <button type="button" onClick={() => setAsOf(`${fyEnd}-03-31`)} className="px-3 py-1.5 text-sm text-[#025545] hover:underline">31 Mar {fyEnd}</button>
            <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"><Printer className="h-4 w-4" /> Print</button>
          </div>
        </div>

        {error && <Notice tone="red">{error}</Notice>}
        {loading && !data ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderBottomColor: '#025545' }} /></div>
        ) : data && (
          <>
            {!data.ready.manual_items && <Notice>Bank balances, capital and loans need the database update first (RUN_PENDING_0029.sql).</Notice>}
            {data.ready.manual_items && Math.abs(t.difference) >= 1 && (
              <Notice tone={data.cash_bank_entered ? 'red' : 'amber'}>
                The two sides differ by <strong>{inr(t.difference, { dash: false })}</strong>.{' '}
                {data.cash_bank_entered
                  ? 'Check the bank and cash balances, capital, loans and opening reserves against your books for this date.'
                  : 'Enter your bank and cash balances, capital and any loans for this date below. Money that came in or went out of the bank is not tracked by the system, so this difference is mostly your bank balance.'}
              </Notice>
            )}
            {data.ready.manual_items && Math.abs(t.difference) < 1 && <Notice tone="green">Balanced: assets equal equity and liabilities.</Notice>}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 print:shadow-none print:border-0">
              <div className="text-center mb-4">
                <div className="text-base font-semibold text-gray-900">Balance Sheet as at {fmtDate(data.as_of)}</div>
                <div className="text-xs text-gray-500">amounts in ₹</div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-200">
                    <th className="text-left font-medium py-1.5">Particulars</th>
                    <th className="text-right font-medium py-1.5">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <SectionTitle>I. Equity and liabilities</SectionTitle>
                  <Row label={SECTION_LABEL.equity} value={t.equity} bold indent={1} />
                  {lines(data.equity)}
                  <Row label={SECTION_LABEL.non_current_liability} value={t.non_current_liabilities} bold indent={1} />
                  {data.liabilities.non_current.length ? lines(data.liabilities.non_current) : <Row label="None entered (loans etc.)" value={0} indent={2} muted />}
                  <Row label={SECTION_LABEL.current_liability} value={t.current_liabilities} bold indent={1} />
                  {lines(data.liabilities.current)}
                  <Row label="Total equity and liabilities" value={t.equity_and_liabilities} bold top />

                  <SectionTitle>II. Assets</SectionTitle>
                  <Row label="Non-current assets" value={t.non_current_assets} bold indent={1} />
                  {data.assets.non_current.length ? lines(data.assets.non_current) : <Row label="No fixed assets yet" value={0} indent={2} muted note="Add laptops, furniture, equipment on the Fixed Assets page" />}
                  <Row label="Current assets" value={t.current_assets} bold indent={1} />
                  {lines(data.assets.current)}
                  <Row label="Total assets" value={t.assets} bold top />
                </tbody>
              </table>
              {data.fixed_assets.length > 0 && (
                <div className="mt-6">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#025545] mb-1">Fixed assets schedule</div>
                  <table className="w-full text-xs">
                    <thead><tr className="text-gray-500 border-b border-gray-200"><th className="text-left py-1 font-medium">Category</th><th className="text-right py-1 font-medium">Items</th><th className="text-right py-1 font-medium">Cost</th><th className="text-right py-1 font-medium">Depreciation to date</th><th className="text-right py-1 font-medium">Net</th></tr></thead>
                    <tbody>
                      {data.fixed_assets.map((f) => (
                        <tr key={f.name} className="border-b border-gray-100"><td className="py-1">{f.name}</td><td className="py-1 text-right">{f.count}</td><td className="py-1 text-right">{inr(f.cost)}</td><td className="py-1 text-right">{inr(f.depreciation)}</td><td className="py-1 text-right font-medium">{inr(f.net)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {data.ready.manual_items && <ManualItems asOf={asOf} onChanged={load} editing={editing} setEditing={setEditing} />}
          </>
        )}
      </div>
    </div>
  );
}

function ManualItems({ asOf, onChanged, editing, setEditing }) {
  const [d, setD] = useState(null);
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    const r = await financeApi.getBalanceItems().catch(() => null);
    if (r?.success) setD(r.data);
  }, []);
  useEffect(() => { load(); }, [load]);
  if (!d) return null;
  const remove = async (it) => {
    if (!window.confirm(`Remove "${it.name}" (${fmtDate(it.as_of)})?`)) return;
    const r = await financeApi.deleteBalanceItem(it.id).catch((e) => ({ message: e?.message }));
    if (r?.success) { load(); onChanged(); } else setMsg(r?.message || 'Could not remove');
  };
  return (
    <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <div className="text-sm font-semibold text-gray-900">Entered balances</div>
          <p className="text-xs text-gray-500">Bank, cash, capital, loans, deposits, GST and other items the system can&apos;t work out. Add a new row with a new date when a balance changes; older rows stay as history.</p>
        </div>
        <button type="button" onClick={() => setEditing({ section: 'cash_bank', name: '', amount: '', as_of: asOf, notes: '' })} className="flex items-center gap-1.5 px-3 py-2 bg-[#025545] text-white rounded-lg text-sm"><Plus className="h-4 w-4" /> Add balance</button>
      </div>
      {msg && <p className="text-xs text-red-600 mb-2">{msg}</p>}
      {d.items.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">Nothing entered yet. Start with your bank balance and capital.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500 border-b border-gray-200"><th className="py-1.5 pr-3 font-medium">Date</th><th className="py-1.5 pr-3 font-medium">Section</th><th className="py-1.5 pr-3 font-medium">Item</th><th className="py-1.5 pr-3 font-medium text-right">Balance</th><th className="py-1.5 font-medium" /></tr></thead>
            <tbody>
              {d.items.map((it) => (
                <tr key={it.id} className="border-b border-gray-100">
                  <td className="py-1.5 pr-3 whitespace-nowrap">{fmtDate(it.as_of)}</td>
                  <td className="py-1.5 pr-3 text-gray-600">{SECTION_LABEL[it.section]}</td>
                  <td className="py-1.5 pr-3">{it.name}{it.notes && <span className="block text-[11px] text-gray-400">{it.notes}</span>}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{inr(it.amount, { dash: false })}</td>
                  <td className="py-1.5 text-right whitespace-nowrap">
                    <button type="button" aria-label={`Edit ${it.name}`} onClick={() => setEditing({ ...it, amount: String(it.amount) })} className="p-1 text-gray-500 hover:text-gray-800"><Pencil className="h-4 w-4" /></button>
                    <button type="button" aria-label={`Remove ${it.name}`} onClick={() => remove(it)} className="p-1 text-gray-500 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <ItemForm item={editing} hints={d.hints} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); onChanged(); }} />}
    </div>
  );
}

function ItemForm({ item, hints, onClose, onSaved }) {
  const [f, setF] = useState(item);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    const r = await financeApi.saveBalanceItem({ section: f.section, name: f.name, amount: Number(f.amount), as_of: f.as_of, notes: f.notes || undefined }, f.id)
      .catch((e2) => ({ message: e2?.message }));
    setSaving(false);
    if (r?.success) onSaved(); else setErr(r?.message || 'Could not save');
  };
  const listId = `hints-${f.section}`;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Balance">
      <form onSubmit={submit} className="bg-white rounded-lg w-full max-w-md">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm font-semibold">{f.id ? 'Edit balance' : 'Add balance'}</div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Section</span>
            <select value={f.section} onChange={(e) => setF({ ...f, section: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {Object.entries(SECTION_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Item</span>
            <input list={listId} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required placeholder={(hints[f.section] || [])[0]} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <datalist id={listId}>{(hints[f.section] || []).map((h) => <option key={h} value={h} />)}</datalist>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Balance (₹)</span>
              <input type="number" step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">On date</span>
              <input type="date" value={f.as_of} onChange={(e) => setF({ ...f, as_of: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </label>
          </div>
          <p className="text-[11px] text-gray-500">Enter the balance on that date, not the change. Use a negative number for items that reduce a section (e.g. drawings, TDS already paid to government).</p>
          <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</span>
            <input value={f.notes || ''} onChange={(e) => setF({ ...f, notes: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </label>
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
