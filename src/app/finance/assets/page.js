'use client';

/**
 * Fixed Assets register: laptops, furniture, equipment… bought for the company.
 * They sit on the Balance Sheet at cost less depreciation; depreciation (straight line over
 * the useful life) is the P&L expense. A purchase already entered on the Expenses page can be
 * moved here so it isn't counted twice. Day-to-day costs (travel, food, stationery) stay in
 * Expenses.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, X, ArrowRightLeft, PackageX } from 'lucide-react';
import { financeApi } from '@/lib/backendApi';
import { useAuth } from '@/contexts/AuthContext';
import { inr, todayIST, fmtDate, Notice } from '@/components/finance/statementUi';

const yrs = (m) => (m % 12 === 0 ? `${m / 12} yr${m === 12 ? '' : 's'}` : `${m} months`);

export default function FixedAssetsPage() {
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null); // { mode: 'new'|'edit'|'dispose'|'from_expense', ... }
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated() || !(hasRole('finance') || hasRole('admin') || hasRole('superadmin'))) router.push('/');
  }, [authLoading, isAuthenticated, hasRole, router]);

  const load = useCallback(async () => {
    setError('');
    try {
      const r = await financeApi.getFixedAssets();
      if (r?.success) setD(r.data); else setError(r?.message || 'Could not load');
    } catch (e) { setError(e?.message || 'Could not load'); }
  }, []);
  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);

  const totals = useMemo(() => {
    const live = (d?.assets || []).filter((a) => !a.disposed_date);
    return { cost: live.reduce((s, a) => s + a.cost, 0), dep: live.reduce((s, a) => s + a.accumulated_depreciation, 0), net: live.reduce((s, a) => s + a.book_value, 0), monthly: live.filter((a) => !a.fully_depreciated).reduce((s, a) => s + a.monthly_depreciation, 0) };
  }, [d]);

  const remove = async (a) => {
    if (!window.confirm(`Remove "${a.name}" from the register?${a.expense_id ? ' Its expense will count as an expense again.' : ''}`)) return;
    const r = await financeApi.deleteFixedAsset(a.id).catch((e) => ({ message: e?.message }));
    if (r?.success) load(); else setError(r?.message || 'Could not remove');
  };

  const blank = () => {
    const cats = d?.categories || {};
    const c = Object.keys(cats)[0] || 'Computers & IT equipment';
    return { mode: 'new', name: '', category: c, purchase_date: todayIST(), cost: '', salvage_value: '0', useful_life_months: String(cats[c] || 36), vendor: '', invoice_ref: '', notes: '' };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-3 lg:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div role="heading" aria-level="2" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">Fixed Assets</div>
            <p className="text-xs text-gray-500 mt-1">Things bought to use for years (laptops, furniture, equipment). Travel, food and other running costs go in Expenses.</p>
          </div>
          {d?.ready && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setPicking(true)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 bg-white rounded-lg text-sm"><ArrowRightLeft className="h-4 w-4" /> Move from Expenses</button>
              <button type="button" onClick={() => setForm(blank())} className="flex items-center gap-1.5 px-3 py-2 bg-[#025545] text-white rounded-lg text-sm"><Plus className="h-4 w-4" /> Add asset</button>
            </div>
          )}
        </div>
        {error && <Notice tone="red">{error}</Notice>}
        {d && !d.ready && <Notice>Fixed assets need the database update first (RUN_PENDING_0029.sql).</Notice>}
        {d?.ready && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[['Cost of assets in use', totals.cost], ['Depreciation to date', totals.dep], ['Book value today', totals.net], ['Depreciation per month', totals.monthly]].map(([l, v]) => (
                <div key={l} className="bg-white rounded-lg border border-gray-200 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{l}</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{inr(v, { dash: false })}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    {['Asset', 'Category', 'Bought', 'Cost', 'Life', 'Depreciation to date', 'Book value', 'Status', ''].map((h) => <th key={h} className="px-4 py-2 font-medium whitespace-nowrap">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {d.assets.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">No assets yet. Add one, or move a laptop / furniture purchase from Expenses.</td></tr>}
                  {d.assets.map((a) => (
                    <tr key={a.id} className="border-t border-gray-100">
                      <td className="px-4 py-2"><span className="font-medium text-gray-900">{a.name}</span>{(a.vendor || a.invoice_ref) && <span className="block text-[11px] text-gray-400">{[a.vendor, a.invoice_ref].filter(Boolean).join(' · ')}</span>}{a.expense_id && <span className="block text-[11px] text-indigo-600">Moved from Expenses</span>}</td>
                      <td className="px-4 py-2 text-gray-600">{a.category}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{fmtDate(a.purchase_date)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{inr(a.cost)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-600">{yrs(a.useful_life_months)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{inr(a.accumulated_depreciation)}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-medium">{inr(a.book_value, { dash: false })}</td>
                      <td className="px-4 py-2 text-xs whitespace-nowrap">{a.disposed_date ? <span className="text-gray-500">Sold / scrapped {fmtDate(a.disposed_date)}</span> : a.fully_depreciated ? <span className="text-amber-700">Fully depreciated</span> : <span className="text-emerald-700">In use · {inr(a.monthly_depreciation)}/month</span>}</td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        <button type="button" aria-label={`Edit ${a.name}`} onClick={() => setForm({ mode: 'edit', ...a, cost: String(a.cost), salvage_value: String(a.salvage_value), useful_life_months: String(a.useful_life_months) })} className="p-1 text-gray-500 hover:text-gray-800"><Pencil className="h-4 w-4" /></button>
                        {!a.disposed_date && <button type="button" aria-label={`Sell or scrap ${a.name}`} title="Sold / scrapped" onClick={() => setForm({ mode: 'dispose', ...a, disposed_date: todayIST(), disposal_amount: '0' })} className="p-1 text-gray-500 hover:text-gray-800"><PackageX className="h-4 w-4" /></button>}
                        <button type="button" aria-label={`Remove ${a.name}`} onClick={() => remove(a)} className="p-1 text-gray-500 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-gray-500">Depreciation: straight line, day by day, over the useful life down to the salvage value. Default lives: computers 3 years, office equipment 5, therapy equipment 8, furniture and electrical fittings 10 (editable per asset).</p>
          </>
        )}
        {form && <AssetForm form={form} categories={d?.categories || {}} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
        {picking && <ExpensePicker onClose={() => setPicking(false)} onPick={(e) => { setPicking(false); setForm({ mode: 'from_expense', expense_id: e.id, name: e.description || e.display_category || e.category || '', category: 'Computers & IT equipment', purchase_date: e.date, cost: String(e.total_amount || e.amount), salvage_value: '0', useful_life_months: String((d?.categories || {})['Computers & IT equipment'] || 36), vendor: e.vendor_supplier || '', invoice_ref: e.reference_number || '', notes: '' }); }} />}
      </div>
    </div>
  );
}

function AssetForm({ form, categories, onClose, onSaved }) {
  const [f, setF] = useState(form);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const dispose = f.mode === 'dispose';
  const title = { new: 'Add fixed asset', edit: 'Edit asset', dispose: `Sold / scrapped: ${f.name}`, from_expense: 'Record expense as a fixed asset' }[f.mode];
  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    const body = dispose
      ? { disposed_date: f.disposed_date, disposal_amount: Number(f.disposal_amount || 0) }
      : { name: f.name, category: f.category, purchase_date: f.purchase_date, cost: Number(f.cost), salvage_value: Number(f.salvage_value || 0), useful_life_months: Number(f.useful_life_months), vendor: f.vendor, invoice_ref: f.invoice_ref, notes: f.notes };
    const call = f.mode === 'new' ? financeApi.createFixedAsset(body)
      : f.mode === 'from_expense' ? financeApi.fixedAssetFromExpense(f.expense_id, body)
        : financeApi.updateFixedAsset(f.id, body);
    const r = await call.catch((e2) => ({ message: e2?.message }));
    setSaving(false);
    if (r?.success) onSaved(); else setErr(r?.message || 'Could not save');
  };
  const monthly = Number(f.cost) > 0 && Number(f.useful_life_months) > 0 ? (Number(f.cost) - Number(f.salvage_value || 0)) / Number(f.useful_life_months) : null;
  const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm';
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <form onSubmit={submit} className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm font-semibold">{title}</div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          {f.mode === 'from_expense' && <p className="text-xs text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2">The expense stays on the Expenses page but stops counting in the P&amp;L; this asset&apos;s depreciation counts instead.</p>}
          {dispose ? (
            <>
              <p className="text-xs text-gray-600">Book value now {inr(f.book_value, { dash: false })}. The sale price minus the book value is a gain or loss in the P&amp;L.</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Date</span><input type="date" value={f.disposed_date} onChange={(e) => setF({ ...f, disposed_date: e.target.value })} required className={input} /></label>
                <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Sold for (₹, 0 if scrapped)</span><input type="number" min="0" step="0.01" value={f.disposal_amount} onChange={(e) => setF({ ...f, disposal_amount: e.target.value })} className={input} /></label>
              </div>
            </>
          ) : (
            <>
              <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">What is it</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required placeholder="e.g. Dell laptop for front desk" className={input} /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Category</span>
                  <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value, useful_life_months: String(categories[e.target.value] || f.useful_life_months) })} className={input}>
                    {Object.keys(categories).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Bought on</span><input type="date" value={f.purchase_date} onChange={(e) => setF({ ...f, purchase_date: e.target.value })} required className={input} /></label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Cost (₹)</span><input type="number" min="0" step="0.01" value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })} required className={input} /></label>
                <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Useful life (months)</span><input type="number" min="1" max="600" value={f.useful_life_months} onChange={(e) => setF({ ...f, useful_life_months: e.target.value })} required className={input} /></label>
                <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Salvage value (₹)</span><input type="number" min="0" step="0.01" value={f.salvage_value} onChange={(e) => setF({ ...f, salvage_value: e.target.value })} className={input} /></label>
              </div>
              {monthly != null && <p className="text-xs text-gray-600">Depreciation ≈ {inr(monthly, { dash: false })} a month for {yrs(Number(f.useful_life_months))}.</p>}
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Vendor (optional)</span><input value={f.vendor || ''} onChange={(e) => setF({ ...f, vendor: e.target.value })} className={input} /></label>
                <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Invoice no. (optional)</span><input value={f.invoice_ref || ''} onChange={(e) => setF({ ...f, invoice_ref: e.target.value })} className={input} /></label>
              </div>
              <label className="block text-sm"><span className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</span><input value={f.notes || ''} onChange={(e) => setF({ ...f, notes: e.target.value })} className={input} /></label>
            </>
          )}
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

function ExpensePicker({ onClose, onPick }) {
  const [list, setList] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    (async () => {
      const [a, b] = await Promise.all([
        financeApi.getExpenses({ expenseType: 'additional' }).catch(() => null),
        financeApi.getExpenses({ expenseType: 'subscription' }).catch(() => null),
      ]);
      const all = [...(a?.data?.expenses || []), ...(b?.data?.expenses || [])];
      setList(all.sort((x, y) => String(y.date).localeCompare(String(x.date))));
    })();
  }, []);
  const shown = (list || []).filter((e) => !q || `${e.description} ${e.category} ${e.custom_category} ${e.vendor_supplier}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Pick an expense">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">Which expense was a laptop, furniture or equipment purchase?</div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-3 border-b border-gray-100"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search description, category, vendor" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
        <div className="overflow-y-auto">
          {!list ? <p className="p-6 text-sm text-gray-500">Loading…</p> : shown.length === 0 ? <p className="p-6 text-sm text-gray-500">No expenses found.</p> : (
            <table className="min-w-full text-sm">
              <tbody>
                {shown.map((e) => (
                  <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => onPick(e)}>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-600">{fmtDate(e.date)}</td>
                    <td className="px-4 py-2"><span className="text-gray-900">{e.description || '—'}</span><span className="block text-[11px] text-gray-400">{e.display_category || e.custom_category || e.category}{e.vendor_supplier ? ` · ${e.vendor_supplier}` : ''}</span></td>
                    <td className="px-4 py-2 text-right tabular-nums">{inr(e.total_amount || e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
