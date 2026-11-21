'use client';

/**
 * Profit & Loss statement.
 *   Revenue from operations = session fees − refunds
 *   + Other income (Income page entries, gain on selling an asset)
 *   − Therapist fees (direct cost) → Gross profit
 *   − Operating expenses, grouped by heading (Expenses page; purchases recorded as fixed
 *     assets are left out)  − Depreciation on fixed assets → Net profit
 * Same rules as the finance dashboard, so this month's Net Profit matches it.
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Printer } from 'lucide-react';
import { financeApi } from '@/lib/backendApi';
import { useAuth } from '@/contexts/AuthContext';
import { inr, todayIST, fmtDate, presetRange, Row, SectionTitle, Notice } from '@/components/finance/statementUi';

const PRESETS = [['this_month', 'This month'], ['last_month', 'Last month'], ['this_quarter', 'This quarter'], ['this_fy', 'This financial year'], ['last_fy', 'Last financial year'], ['custom', 'Custom']];

export default function ProfitLossPage() {
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [preset, setPreset] = useState('this_month');
  const [range, setRange] = useState(() => presetRange('this_month'));
  const [compare, setCompare] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState({});

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated() || !(hasRole('finance') || hasRole('admin') || hasRole('superadmin'))) router.push('/');
  }, [authLoading, isAuthenticated, hasRole, router]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await financeApi.getProfitLoss({ ...range, compare });
      if (r?.success) setData(r.data); else setError(r?.message || 'Could not load');
    } catch (e) { setError(e?.message || 'Could not load'); } finally { setLoading(false); }
  }, [range, compare]);
  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);

  const pickPreset = (k) => { setPreset(k); if (k !== 'custom') setRange(presetRange(k)); };
  const P = data?.previous || null;
  const cols = P ? 3 : 2;
  const pv = (fn) => (P ? fn(P) : undefined);

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-3 lg:p-4 print:bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4 flex flex-col lg:flex-row lg:items-end justify-between gap-3 print:hidden">
          <div>
            <div role="heading" aria-level="2" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">Profit &amp; Loss</div>
            <p className="text-xs text-gray-500 mt-1">Built from sessions, refunds, therapist payouts, Income, Expenses and Fixed Assets.</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <select aria-label="Period" value={preset} onChange={(e) => pickPreset(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">
              {PRESETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            {preset === 'custom' && (
              <>
                <input type="date" aria-label="From" value={range.from} max={todayIST()} onChange={(e) => e.target.value && setRange({ ...range, from: e.target.value })} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" />
                <input type="date" aria-label="To" value={range.to} onChange={(e) => e.target.value && setRange({ ...range, to: e.target.value })} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" />
              </>
            )}
            <label className="flex items-center gap-1.5 text-sm text-gray-700 px-2 py-1.5"><input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> Compare with previous period</label>
            <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"><Printer className="h-4 w-4" /> Print</button>
          </div>
        </div>

        {error && <Notice tone="red">{error}</Notice>}
        {loading && !data ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderBottomColor: '#025545' }} /></div>
        ) : data && (
          <>
            {data.capitalized_expenses > 0 && (
              <Notice tone="green">{inr(data.capitalized_expenses)} of purchases in this period are on the Balance Sheet as fixed assets, so only their depreciation is here.</Notice>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 print:hidden">
              {[
                ['Revenue from operations', data.income.revenue_from_operations, null],
                ['Gross profit', data.gross_profit, data.gross_margin_pct != null ? `${data.gross_margin_pct}% margin` : ''],
                ['Total expenses', data.expenses.total, ''],
                ['Net profit', data.net_profit, data.net_margin_pct != null ? `${data.net_margin_pct}% of income` : ''],
              ].map(([l, v, h]) => (
                <div key={l} className="bg-white rounded-lg border border-gray-200 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{l}</p>
                  <p className={`mt-1 text-lg font-semibold ${l === 'Net profit' ? (v >= 0 ? 'text-emerald-700' : 'text-rose-700') : 'text-gray-900'}`}>{inr(v, { dash: false })}</p>
                  {h && <p className="text-[11px] text-gray-500">{h}</p>}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 print:shadow-none print:border-0">
              <div className="text-center mb-4">
                <div className="text-base font-semibold text-gray-900">Statement of Profit &amp; Loss</div>
                <div className="text-xs text-gray-500">{fmtDate(data.from)} to {fmtDate(data.to)} · amounts in ₹</div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-200">
                    <th className="text-left font-medium py-1.5">Particulars</th>
                    <th className="text-right font-medium py-1.5">This period</th>
                    {P && <th className="text-right font-medium py-1.5 pl-4">{fmtDate(P.from)} – {fmtDate(P.to)}</th>}
                  </tr>
                </thead>
                <tbody>
                  <SectionTitle cols={cols}>Income</SectionTitle>
                  <Row label="Session fees" value={data.income.session_fees} prev={pv((p) => p.income.session_fees)} indent={1} />
                  <Row label="Less: refunds" value={data.income.refunds} prev={pv((p) => p.income.refunds)} indent={1} negative />
                  <Row label="Revenue from operations" value={data.income.revenue_from_operations} prev={pv((p) => p.income.revenue_from_operations)} bold top />
                  <Row label="Other income" value={data.income.other_income_total} prev={pv((p) => p.income.other_income_total)} bold
                    onClick={data.income.other_income.length ? () => setOpen({ ...open, oi: !open.oi }) : undefined} open={open.oi} />
                  {open.oi && data.income.other_income.map((x) => <Row key={x.name} label={x.name} value={x.amount} indent={2} muted prev={P ? null : undefined} />)}
                  <Row label="Total income" value={data.income.total} prev={pv((p) => p.income.total)} bold top />

                  <SectionTitle cols={cols}>Expenses</SectionTitle>
                  <Row label="Therapist fees (direct cost)" value={data.expenses.therapist_fees} prev={pv((p) => p.expenses.therapist_fees)} indent={1} note="Therapists' share of the sessions above" />
                  <Row label="Gross profit" value={data.gross_profit} prev={pv((p) => p.gross_profit)} bold top note={data.gross_margin_pct != null ? `${data.gross_margin_pct}% of revenue from operations` : undefined} />
                  {data.expenses.operating.map((g) => {
                    const pg = P?.expenses.operating.find((x) => x.group === g.group);
                    return [
                      <Row key={g.group} label={g.group} value={g.amount} prev={P ? (pg?.amount || 0) : undefined} indent={1}
                        onClick={() => setOpen({ ...open, [g.group]: !open[g.group] })} open={open[g.group]} />,
                      ...(open[g.group] ? g.categories.map((c) => <Row key={`${g.group}-${c.name}`} label={c.name} value={c.amount} indent={3} muted prev={P ? null : undefined} />) : []),
                    ];
                  })}
                  {P && P.expenses.operating.filter((x) => !data.expenses.operating.some((g) => g.group === x.group)).map((x) => (
                    <Row key={`p-${x.group}`} label={x.group} value={0} prev={x.amount} indent={1} />
                  ))}
                  {!data.expenses.operating.length && !P?.expenses.operating.length && <Row label="Operating expenses" value={0} indent={1} muted note="No approved expenses in this period" prev={P ? null : undefined} />}
                  <Row label="Depreciation on fixed assets" value={data.expenses.depreciation} prev={pv((p) => p.expenses.depreciation)} indent={1}
                    onClick={data.expenses.depreciation_by_category.length ? () => setOpen({ ...open, dep: !open.dep }) : undefined} open={open.dep} />
                  {open.dep && data.expenses.depreciation_by_category.map((x) => <Row key={x.name} label={x.name} value={x.amount} indent={3} muted prev={P ? null : undefined} />)}
                  {(data.expenses.loss_on_disposal > 0 || P?.expenses.loss_on_disposal > 0) && (
                    <Row label="Loss on sale of fixed assets" value={data.expenses.loss_on_disposal} prev={pv((p) => p.expenses.loss_on_disposal)} indent={1} />
                  )}
                  <Row label="Total expenses" value={data.expenses.total} prev={pv((p) => p.expenses.total)} bold top />

                  <tr><td colSpan={cols} className="pt-2" /></tr>
                  <tr className="border-t-2 border-b-2 border-gray-800 font-semibold text-gray-900">
                    <td className="py-2">{data.net_profit >= 0 ? 'Net profit for the period' : 'Net loss for the period'}</td>
                    <td className={`py-2 text-right tabular-nums ${data.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{inr(data.net_profit, { dash: false })}</td>
                    {P && <td className="py-2 pl-4 text-right tabular-nums text-gray-600">{inr(P.net_profit, { dash: false })}</td>}
                  </tr>
                </tbody>
              </table>
              <p className="mt-3 text-[11px] text-gray-500">Before income tax. Revenue is counted on the day the booking was made, the same as the finance dashboard. Click a heading to see its categories.</p>
            </div>
            <ExpenseHeadings onChanged={load} />
          </>
        )}
      </div>
    </div>
  );
}

function ExpenseHeadings({ onChanged }) {
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    const r = await financeApi.getExpenseGroups().catch(() => null);
    if (r?.success) setD(r.data);
  }, []);
  useEffect(() => { load(); }, [load]);
  if (!d) return null;
  const change = async (name, g) => {
    setBusy(name); setMsg('');
    const r = await financeApi.setExpenseGroup(name, g).catch((e) => ({ message: e?.message }));
    setBusy('');
    if (r?.success) { load(); onChanged?.(); } else setMsg(r?.message || 'Could not save');
  };
  return (
    <details className="mt-4 bg-white rounded-lg border border-gray-200 p-4 print:hidden">
      <summary className="cursor-pointer text-sm font-semibold text-gray-900">Expense headings</summary>
      <p className="text-xs text-gray-500 mt-1 mb-3">Each expense category goes under one P&amp;L heading. Headings are guessed from the category name; pick another to change it.</p>
      {!d.editable && <p className="text-xs text-amber-700 mb-2">Changing headings needs the database update (RUN_PENDING_0029.sql).</p>}
      {msg && <p className="text-xs text-red-600 mb-2">{msg}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {d.categories.map((c) => (
          <label key={c.name} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <span className="truncate" title={c.name}>{c.name}{c.guessed && <span className="ml-1 text-[11px] text-gray-400">(guessed)</span>}</span>
            <select value={c.group} disabled={!d.editable || busy === c.name} onChange={(e) => change(c.name, e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white max-w-[55%]">
              {d.groups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
        ))}
      </div>
    </details>
  );
}
