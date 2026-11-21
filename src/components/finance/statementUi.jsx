'use client';

/** Shared bits for the financial statements pages (P&L, Balance Sheet, Fixed Assets). */
export const inr = (n, { dash = true } = {}) => {
  if (n == null || (dash && Math.abs(Number(n)) < 0.005)) return dash ? '—' : '₹0';
  const v = Number(n) || 0;
  const s = `₹${Math.abs(Math.round(v)).toLocaleString('en-IN')}`;
  return v < 0 ? `(${s})` : s;
};
export const todayIST = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
export const fmtDate = (ymd) => (ymd ? new Date(`${ymd}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/** Indian financial year (April–March) helpers. */
export function fyOf(ymd) {
  const [y, m] = ymd.split('-').map(Number);
  const start = m >= 4 ? y : y - 1;
  return { start, from: `${start}-04-01`, to: `${start + 1}-03-31`, label: `FY ${start}-${String(start + 1).slice(2)}` };
}
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
export function presetRange(key, today = todayIST()) {
  const [y, m] = today.split('-').map(Number);
  const pad = (n) => String(n).padStart(2, '0');
  if (key === 'this_month') return { from: `${y}-${pad(m)}-01`, to: today };
  if (key === 'last_month') { const py = m === 1 ? y - 1 : y; const pm = m === 1 ? 12 : m - 1; return { from: `${py}-${pad(pm)}-01`, to: `${py}-${pad(pm)}-${lastDay(py, pm)}` }; }
  if (key === 'this_quarter') { const qm = Math.floor((m - 1) / 3) * 3 + 1; return { from: `${y}-${pad(qm)}-01`, to: today }; }
  if (key === 'this_fy') { const f = fyOf(today); return { from: f.from, to: today }; }
  if (key === 'last_fy') { const f = fyOf(today); return { from: `${f.start - 1}-04-01`, to: `${f.start}-03-31` }; }
  return null;
}

export function Row({ label, value, prev, indent = 0, bold = false, top = false, muted = false, note, negative = false, onClick, open }) {
  const v = negative && value != null ? -Math.abs(value) : value;
  const pv = negative && prev != null ? -Math.abs(prev) : prev;
  return (
    <tr className={`${top ? 'border-t border-gray-300' : ''} ${bold ? 'font-semibold text-gray-900' : 'text-gray-700'} ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`} onClick={onClick}>
      <td className="py-1.5 pr-3" style={{ paddingLeft: `${indent * 16}px` }}>
        {onClick && <span className="inline-block w-4 text-gray-400" aria-hidden="true">{open ? '▾' : '▸'}</span>}
        <span className={muted ? 'text-gray-500' : ''}>{label}</span>
        {note && <span className="block text-[11px] font-normal text-gray-400">{note}</span>}
      </td>
      <td className="py-1.5 text-right tabular-nums whitespace-nowrap">{inr(v)}</td>
      {prev !== undefined && <td className="py-1.5 pl-4 text-right tabular-nums whitespace-nowrap text-gray-500">{inr(pv)}</td>}
    </tr>
  );
}

export function SectionTitle({ children, cols = 2 }) {
  return (
    <tr>
      <td colSpan={cols} className="pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#025545]">{children}</td>
    </tr>
  );
}

export function Notice({ tone = 'amber', children }) {
  const c = tone === 'red' ? 'bg-red-50 border-red-200 text-red-800' : tone === 'green' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-900';
  return <div className={`rounded-lg border px-3 py-2 text-sm mb-4 ${c}`}>{children}</div>;
}

/**
 * Period filter for finance lists (Expenses, Income…): nothing is ever removed when a new month
 * starts; pick an earlier period to see it. value = { key, from, to } (from/to null = all time).
 */
export const PERIODS = [['this_month', 'This month'], ['last_month', 'Last month'], ['this_fy', 'This financial year'], ['last_fy', 'Last financial year'], ['all', 'All time'], ['custom', 'Custom']];
export function periodValue(key, today = todayIST()) {
  if (key === 'all') return { key, from: null, to: null };
  const r = presetRange(key, today);
  return { key, from: r.from, to: r.to };
}
export function PeriodFilter({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Period" value={value.key} onChange={(e) => onChange(e.target.value === 'custom' ? { key: 'custom', from: value.from || presetRange('this_month').from, to: value.to || todayIST() } : periodValue(e.target.value))}
        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">
        {PERIODS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      {value.key === 'custom' && (
        <>
          <input type="date" aria-label="From" value={value.from || ''} onChange={(e) => e.target.value && onChange({ ...value, from: e.target.value })} className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" />
          <span className="text-sm text-gray-500">to</span>
          <input type="date" aria-label="To" value={value.to || ''} onChange={(e) => e.target.value && onChange({ ...value, to: e.target.value })} className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" />
        </>
      )}
    </div>
  );
}
export const periodLabel = (v) => (v.key === 'all' ? 'All time' : v.from && v.to ? `${fmtDate(v.from)} – ${fmtDate(v.to)}` : '');
