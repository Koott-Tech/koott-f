'use client';

/**
 * Targets & Forecast.
 *  - Target: set by hand for a month, several months or a year (stored per month).
 *  - Forecast (run rate): one month → sales so far ÷ days so far × days in the month;
 *    several months / a year → each month's value (finished: actual, current: its forecast)
 *    ÷ months used × months in the period.
 * Sales = the dashboard's Total Revenue (session price by IST booking day).
 * Default view: the current month.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, TrendingUp, IndianRupee, CalendarRange, Save, Trash2 } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend } from 'recharts';
import { financeApi } from '@/lib/backendApi';
import { useAuth } from '@/contexts/AuthContext';

const inr = (n) => (n == null ? '—' : `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`);
const short = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `${Math.round(v / 1e3)}k`;
  return String(Math.round(v));
};
const thisMonth = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 7);
const monthName = (ym, opts = { month: 'short', year: 'numeric' }) => new Date(`${ym}-01T00:00:00`).toLocaleDateString('en-IN', opts);
const addMonths = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return d.toISOString().slice(0, 7); };

function rangeFor(kind, v) {
  if (kind === 'month') return { from: v.month, to: v.month };
  if (kind === 'year') return { from: `${v.year}-01`, to: `${v.year}-12` };
  return v.from <= v.to ? { from: v.from, to: v.to } : { from: v.to, to: v.from };
}

export default function FinanceTargetsPage() {
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const cur = thisMonth();
  const [kind, setKind] = useState('month'); // month | range | year
  const [sel, setSel] = useState({ month: cur, from: addMonths(cur, -5), to: cur, year: cur.slice(0, 4) });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const range = useMemo(() => rangeFor(kind, sel), [kind, sel]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated() || !(hasRole('finance') || hasRole('admin') || hasRole('superadmin'))) router.push('/');
  }, [authLoading, isAuthenticated, hasRole, router]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await financeApi.getForecast(range);
      if (r?.success) setData(r.data); else setError(r?.message || 'Could not load the forecast');
    } catch (e) {
      setError(e?.message || 'Could not load the forecast');
    } finally {
      setLoading(false);
    }
  }, [range]);
  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);

  const years = useMemo(() => { const y = Number(cur.slice(0, 4)); return [y - 2, y - 1, y, y + 1]; }, [cur]);
  const single = data && data.months?.length === 1;
  const periodLabel = !data ? '' : single ? monthName(data.from, { month: 'long', year: 'numeric' })
    : kind === 'year' ? `Year ${sel.year}` : `${monthName(data.from)} – ${monthName(data.to)}`;

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-3 lg:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div>
            <div role="heading" aria-level="2" className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">Targets &amp; Forecast</div>
            <p className="text-xs text-gray-500 mt-1">Sales = Total Revenue on the dashboard (by the day the booking was made, IST).</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5" role="tablist" aria-label="Period">
              {[['month', 'Month'], ['range', 'Months'], ['year', 'Year']].map(([k, label]) => (
                <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)}
                  className={`px-3 py-1.5 text-sm rounded-md ${kind === k ? 'bg-[#025545] text-white' : 'text-gray-700 hover:bg-gray-50'}`}>{label}</button>
              ))}
            </div>
            {kind === 'month' && (
              <input type="month" aria-label="Month" value={sel.month} onChange={(e) => e.target.value && setSel({ ...sel, month: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" />
            )}
            {kind === 'range' && (
              <>
                <input type="month" aria-label="From month" value={sel.from} onChange={(e) => e.target.value && setSel({ ...sel, from: e.target.value })} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" />
                <span className="text-sm text-gray-500 pb-2">to</span>
                <input type="month" aria-label="To month" value={sel.to} onChange={(e) => e.target.value && setSel({ ...sel, to: e.target.value })} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" />
              </>
            )}
            {kind === 'year' && (
              <select aria-label="Year" value={sel.year} onChange={(e) => setSel({ ...sel, year: e.target.value })} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">
                {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            )}
            {(kind !== 'month' || sel.month !== cur) && (
              <button type="button" onClick={() => { setKind('month'); setSel({ ...sel, month: cur }); }} className="px-3 py-1.5 text-sm text-[#025545] hover:underline">This month</button>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-700">{error}</div>}
        {loading && !data ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderBottomColor: '#025545' }} /></div>
        ) : data && (
          <>
            <Summary data={data} periodLabel={periodLabel} />
            {single ? <DailyView data={data} /> : <MonthlyView data={data} />}
            <TargetEditor range={range} kind={kind} ready={data.targets_ready} months={data.months} onSaved={load} />
            <HowItWorks />
          </>
        )}
      </div>
    </div>
  );
}

function Summary({ data, periodLabel }) {
  const status = data.method === 'finished' ? 'Final' : data.method === 'not started' ? 'Not started' : 'Forecast';
  const forecastHint = data.method === 'days'
    ? `${inr(data.actual)} ÷ ${data.days_used} day${data.days_used === 1 ? '' : 's'} × ${data.days_total} days`
    : data.method === 'months'
      ? `Average of ${data.months_used} month${data.months_used === 1 ? '' : 's'} × ${data.months_total} months`
      : data.method === 'finished' ? 'Period is over: actual sales' : 'No sales yet in this period';
  const onTrack = data.forecast_pct == null ? null : data.forecast_pct >= 100;
  const tiles = [
    { label: 'Target', value: inr(data.target), hint: data.target == null ? 'Not set yet (set it below)' : `${data.target_months_set} of ${data.months.length} month${data.months.length > 1 ? 's' : ''} set`, icon: Target, tone: 'text-gray-900' },
    { label: 'Sales so far', value: inr(data.actual), hint: data.achieved_pct == null ? periodLabel : `${data.achieved_pct}% of target`, icon: IndianRupee, tone: 'text-emerald-700' },
    { label: status, value: inr(data.forecast), hint: forecastHint, icon: TrendingUp, tone: 'text-indigo-700' },
    {
      label: 'Forecast vs target',
      value: data.forecast_pct == null ? '—' : `${data.forecast_pct}%`,
      hint: data.forecast_pct == null ? 'Needs a target and a forecast'
        : onTrack ? `On track: ${inr(data.forecast - data.target)} over` : `Short by ${inr(data.target - data.forecast)}`,
      icon: CalendarRange,
      tone: onTrack == null ? 'text-gray-900' : onTrack ? 'text-emerald-700' : 'text-rose-700',
    },
  ];
  return (
    <div className="mb-4">
      <div className="text-sm font-medium text-gray-700 mb-2">{periodLabel}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(({ label, value, hint, icon: Icon, tone }) => (
          <div key={label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
              <Icon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </div>
            <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
          </div>
        ))}
      </div>
      {data.needed && data.needed.count > 0 && data.needed.remaining > 0 && (
        <p className="mt-3 text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          To reach the target: {inr(data.needed.remaining)} more, about <strong>{inr(data.needed.each)} per {data.needed.per}</strong> for the {data.needed.count} {data.needed.per}{data.needed.count > 1 ? 's' : ''} left.
        </p>
      )}
      {data.target != null && data.actual >= data.target && data.target > 0 && (
        <p className="mt-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">Target reached.</p>
      )}
    </div>
  );
}

function DailyView({ data }) {
  const m = data.months[0];
  const dailyTarget = m.target != null ? m.target / m.days_in_month : null;
  const rows = data.days.map((d) => ({ ...d, day: Number(d.date.slice(8, 10)) }));
  if (m.status === 'future') {
    return <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4 text-sm text-gray-500">This month hasn&apos;t started, so there are no sales or forecast yet.</div>;
  }
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="text-sm font-semibold text-gray-900 mb-1">Day by day</div>
      <p className="text-xs text-gray-500 mb-3">Bars: sales that day. Line: the month forecast as it stood on that day.</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef0f2" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="s" tickFormatter={short} tick={{ fontSize: 11 }} width={48} />
            <YAxis yAxisId="f" orientation="right" tickFormatter={short} tick={{ fontSize: 11 }} width={52} />
            <Tooltip formatter={(v, n) => [inr(v), n]} labelFormatter={(d) => `Day ${d}`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="s" dataKey="sales" name="Sales that day" fill="#7fb8a9" radius={[3, 3, 0, 0]} />
            <Line yAxisId="f" dataKey="forecast" name="Month forecast" stroke="#4f46e5" strokeWidth={2} dot={false} />
            {m.target != null && <ReferenceLine yAxisId="f" y={m.target} stroke="#e11d48" strokeDasharray="4 4" label={{ value: 'Target', fontSize: 11, fill: '#e11d48', position: 'insideTopRight' }} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 pr-4 font-medium text-right">Sales</th>
              <th className="py-2 pr-4 font-medium text-right">Month to date</th>
              <th className="py-2 pr-4 font-medium text-right">Forecast that day</th>
              {dailyTarget != null && <th className="py-2 font-medium text-right">vs daily target</th>}
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().map((d) => (
              <tr key={d.date} className="border-b border-gray-100">
                <td className="py-1.5 pr-4 text-gray-700">{new Date(`${d.date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', weekday: 'short' })}</td>
                <td className="py-1.5 pr-4 text-right">{inr(d.sales)}</td>
                <td className="py-1.5 pr-4 text-right text-gray-600">{inr(d.to_date)}</td>
                <td className="py-1.5 pr-4 text-right font-medium text-indigo-700">{inr(d.forecast)}</td>
                {dailyTarget != null && (
                  <td className={`py-1.5 text-right ${d.sales >= dailyTarget ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {d.sales >= dailyTarget ? '+' : '−'}{inr(Math.abs(d.sales - dailyTarget))}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonthlyView({ data }) {
  const rows = data.months.map((m) => ({ ...m, label: monthName(m.month, { month: 'short' }) + (data.months.length > 12 ? ` ${m.month.slice(2, 4)}` : '') }));
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="text-sm font-semibold text-gray-900 mb-1">Month by month</div>
      <p className="text-xs text-gray-500 mb-3">Finished months show actual sales; the current month shows its own forecast; later months are not counted yet.</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef0f2" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={short} tick={{ fontSize: 11 }} width={52} />
            <Tooltip formatter={(v, n) => [inr(v), n]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="actual" name="Sales" fill="#7fb8a9" radius={[3, 3, 0, 0]} />
            <Line dataKey="forecast" name="Forecast" stroke="#4f46e5" strokeWidth={2} />
            <Line dataKey="target" name="Target" stroke="#e11d48" strokeDasharray="4 4" strokeWidth={2} dot={false} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-4 font-medium">Month</th>
              <th className="py-2 pr-4 font-medium text-right">Target</th>
              <th className="py-2 pr-4 font-medium text-right">Sales</th>
              <th className="py-2 pr-4 font-medium text-right">Forecast</th>
              <th className="py-2 font-medium text-right">Forecast vs target</th>
            </tr>
          </thead>
          <tbody>
            {data.months.map((m) => {
              const diff = m.target != null && m.forecast != null ? m.forecast - m.target : null;
              return (
                <tr key={m.month} className="border-b border-gray-100">
                  <td className="py-1.5 pr-4 text-gray-700">{monthName(m.month)}{m.status === 'current' ? ` (day ${m.days_used} of ${m.days_in_month})` : m.status === 'future' ? ' (not started)' : ''}</td>
                  <td className="py-1.5 pr-4 text-right">{inr(m.target)}</td>
                  <td className="py-1.5 pr-4 text-right">{m.status === 'future' ? '—' : inr(m.actual)}</td>
                  <td className="py-1.5 pr-4 text-right font-medium text-indigo-700">{inr(m.forecast)}</td>
                  <td className={`py-1.5 text-right ${diff == null ? 'text-gray-400' : diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {diff == null ? '—' : `${diff >= 0 ? '+' : '−'}${inr(Math.abs(diff))}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TargetEditor({ range, kind, ready, months, onSaved }) {
  const multi = range.from !== range.to;
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('split');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { setAmount(''); setMsg(''); setMode('split'); }, [range.from, range.to, kind]);
  const n = months.length;
  const save = async (clear = false) => {
    setSaving(true); setMsg('');
    try {
      const r = await financeApi.setTargets({ from: range.from, to: range.to, amount: clear ? '' : Number(amount), mode: multi ? mode : 'each' });
      if (r?.success) { setMsg(r.message || 'Saved'); setAmount(''); onSaved?.(); } else setMsg(r?.message || 'Could not save');
    } catch (e) {
      setMsg(e?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };
  const amt = Number(amount);
  const preview = amount === '' || !Number.isFinite(amt) ? null
    : !multi ? null : mode === 'split' ? `${inr(Math.floor(amt / n))} a month over ${n} months` : `${inr(amt)} each month, ${inr(amt * n)} in total`;
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="text-sm font-semibold text-gray-900">Set target</div>
      <p className="text-xs text-gray-500 mb-3">
        For {multi ? `${monthName(range.from)} – ${monthName(range.to)} (${n} months)` : monthName(range.from, { month: 'long', year: 'numeric' })}. Saving replaces the targets for {multi ? 'these months' : 'this month'}.
      </p>
      {!ready ? (
        <p className="text-sm text-amber-700">Targets need the database update first (RUN_PENDING_0028.sql). The forecast works without it.</p>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (amount !== '' && amt >= 0) save(false); }} className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="block text-xs font-medium text-gray-600 mb-1">{multi ? (mode === 'split' ? 'Total target for the period (₹)' : 'Target per month (₹)') : 'Target for the month (₹)'}</span>
            <input type="number" min="0" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 3000000" className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </label>
          {multi && (
            <fieldset className="flex items-center gap-3 pb-2">
              <legend className="sr-only">How to apply the amount</legend>
              <label className="flex items-center gap-1.5 text-sm"><input type="radio" name="tmode" checked={mode === 'split'} onChange={() => setMode('split')} /> Total, split evenly</label>
              <label className="flex items-center gap-1.5 text-sm"><input type="radio" name="tmode" checked={mode === 'each'} onChange={() => setMode('each')} /> Same for each month</label>
            </fieldset>
          )}
          <button type="submit" disabled={saving || amount === '' || !(amt >= 0)} className="flex items-center gap-2 px-4 py-2 bg-[#025545] text-white rounded-lg text-sm disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save target'}
          </button>
          {months.some((m) => m.target != null) && (
            <button type="button" onClick={() => save(true)} disabled={saving} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              <Trash2 className="h-4 w-4" /> Clear
            </button>
          )}
          {preview && <span className="text-xs text-gray-500 pb-2">{preview}</span>}
          {msg && <span className="text-sm text-gray-700 pb-2" role="status">{msg}</span>}
        </form>
      )}
    </div>
  );
}

function HowItWorks() {
  return (
    <details className="bg-white rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
      <summary className="cursor-pointer font-medium text-gray-900">How the forecast is worked out</summary>
      <ul className="mt-2 list-disc pl-5 space-y-1 text-xs text-gray-600">
        <li>One month: add up the sales of every day so far (today included), divide by the number of days so far, multiply by the days in the month. Example: 1st ₹1,00,000 → ₹1,00,000 ÷ 1 × 31 = ₹31,00,000; 2nd ₹50,000 → ₹1,50,000 ÷ 2 × 31 = ₹23,25,000.</li>
        <li>Several months or a year: works in months, not days. Each finished month counts its actual sales, the current month counts its own forecast; divide by the months used and multiply by the months in the period. Months that haven&apos;t started aren&apos;t used.</li>
        <li>A period that is already over shows its actual sales as the final figure.</li>
        <li>Sales are the same as Total Revenue on the dashboard: session prices, on the day the booking was made (IST).</li>
      </ul>
    </details>
  );
}
