'use client';

/**
 * Sales, sessions and slots per therapist group — internal (admin / finance).
 * One group per therapist, so the groups (plus "Ungrouped") add up to the total.
 *   Sales        successful payments in the range (by payment date)
 *   Sessions     scheduled in the range; completed / cancelled / no-show / still booked
 *   Open slots   bookable starts left from today to the end of the range
 *   Utilisation  booked ahead ÷ (booked ahead + open slots)
 */

import { Fragment, useEffect, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronRight, Filter, Loader2, RefreshCw } from 'lucide-react';
import { financeApi } from '@/lib/backendApi';
import DateRangePicker from '@/components/ui/date-range-picker';
import { hasDateRangeBounds } from '@/lib/dateRangeBounds';
import { formatIstCalendarYmd, istCalendarMonthBounds } from '@/lib/istCalendarDates';

const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const pct = (n) => (n == null ? '—' : `${n}%`);
const niceDate = (ymd) => (ymd ? new Date(`${ymd}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

const COLUMNS = [
  ['Therapists', (r) => r.therapistCount ?? '—'],
  ['Sales', (r) => inr(r.sales)],
  ['Payments', (r) => r.payments],
  ['Sessions', (r) => r.sessions],
  ['Completed', (r) => r.completed],
  ['Booked', (r) => r.booked],
  ['Cancelled', (r) => r.cancelled],
  ['No-show', (r) => r.noShow],
  ['Open slots', (r) => r.openSlots],
  ['Utilisation', (r) => pct(r.utilisation)],
];

function Swatch({ color }) {
  return <span className="inline-block h-3 w-3 shrink-0 rounded-full border border-black/10" style={{ background: color || '#CBD5E1' }} />;
}

export default function TherapistGroupsReport({ refreshKey = 0 }) {
  const [dateRange, setDateRange] = useState(() => istCalendarMonthBounds(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState({});

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const params = hasDateRangeBounds(dateRange)
        ? { dateFrom: formatIstCalendarYmd(dateRange.from), dateTo: formatIstCalendarYmd(dateRange.to) }
        : {};
      const r = await financeApi.getTherapistGroupsReport(params);
      if (r && r.success === false) throw new Error(r.message || 'Could not load the report');
      setData(r?.data ?? r);
    } catch (e) {
      setErr(e?.message || 'Could not load the report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [dateRange, refreshKey]);

  const rows = data?.groups || [];
  const totals = data?.totals;

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-base font-semibold text-gray-900">Group performance</div>
          <p className="mt-0.5 text-xs text-slate-500">
            Internal only. Sales = successful payments in the range; sessions = scheduled in the range;
            open slots and utilisation count from today{data?.slotWindow ? ` (${niceDate(data.slotWindow.from)} – ${niceDate(data.slotWindow.to)})` : ' — none for a past range'}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <DateRangePicker selectedRange={dateRange} onSelect={setDateRange} />
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </button>
        </div>
      </div>

      {data && data.ready === false && (
        <div className="m-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {data.message}
        </div>
      )}
      {err && <div className="m-4 text-sm text-red-600">{err}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-2.5">Group</th>
              {COLUMNS.map(([label]) => <th key={label} className="px-3 py-2.5 text-right">{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading && !data && (
              <tr><td colSpan={COLUMNS.length + 1} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
            )}
            {rows.map((g) => {
              const key = g.id || 'ungrouped';
              const isOpen = Boolean(open[key]);
              return (
                <Fragment key={key}>
                  <tr className="border-b border-gray-100 hover:bg-gray-50/60">
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
                        className="inline-flex items-center gap-2 font-medium text-gray-900"
                        aria-expanded={isOpen}
                      >
                        {isOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                        <Swatch color={g.color} />
                        <span className={g.id ? '' : 'italic text-slate-500'}>{g.name}</span>
                      </button>
                    </td>
                    {COLUMNS.map(([label, cell]) => (
                      <td key={label} className="px-3 py-2.5 text-right tabular-nums text-gray-800">{cell(g)}</td>
                    ))}
                  </tr>
                  {isOpen && g.therapists.map((t) => (
                    <tr key={`${key}-${t.id}`} className="border-b border-gray-50 bg-slate-50/50 text-[13px]">
                      <td className="py-2 pl-12 pr-4 text-gray-700">
                        {t.name}
                        <span className="ml-1.5 text-xs text-slate-400">{t.designation}{t.active ? '' : ' · inactive'}</span>
                      </td>
                      {COLUMNS.map(([label, cell]) => (
                        <td key={label} className="px-3 py-2 text-right tabular-nums text-gray-600">
                          {label === 'Therapists' ? '' : cell(t)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {isOpen && g.therapists.length === 0 && (
                    <tr className="border-b border-gray-50 bg-slate-50/50">
                      <td colSpan={COLUMNS.length + 1} className="py-2 pl-12 text-xs text-slate-400">No therapists in this group yet.</td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {totals && (
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-2.5 text-gray-900">Total</td>
                {COLUMNS.map(([label, cell]) => (
                  <td key={label} className="px-3 py-2.5 text-right tabular-nums text-gray-900">
                    {label === 'Therapists' ? rows.reduce((n, g) => n + (g.therapistCount || 0), 0) : cell(totals)}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
