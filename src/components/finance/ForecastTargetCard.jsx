'use client';

/**
 * Dashboard card: target, sales so far, forecast and what's left to reach the target, for the
 * months the dashboard filter covers (default: this month). Same numbers as Targets & Forecast.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Target, ArrowRight } from 'lucide-react';
import { financeApi } from '@/lib/backendApi';

const inr = (n) => (n == null ? '—' : `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`);
const monthName = (ym) => new Date(`${ym}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

export default function ForecastTargetCard({ from, to }) {
  const pathname = usePathname() || '';
  const href = pathname.startsWith('/superadmin') ? '/superadmin/finance/targets' : '/finance/targets';
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    let live = true;
    setErr('');
    financeApi.getForecast({ from, to })
      .then((r) => { if (!live) return; if (r?.success) setD(r.data); else setErr(r?.message || 'Could not load the forecast'); })
      .catch((e) => live && setErr(e?.message || 'Could not load the forecast'));
    return () => { live = false; };
  }, [from, to]);

  if (err) return <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 text-sm text-red-600">{err}</div>;
  if (!d) return <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 h-36 animate-pulse" aria-label="Loading forecast" />;

  const label = d.from === d.to ? monthName(d.from) : `${monthName(d.from)} – ${monthName(d.to)}`;
  const hasTarget = d.target != null && d.target > 0;
  const left = hasTarget ? Math.max(0, d.target - d.actual) : null;
  const reached = hasTarget && d.actual >= d.target;
  const pctBar = hasTarget ? Math.min(100, (d.actual / d.target) * 100) : 0;
  const fcMark = hasTarget && d.forecast != null ? Math.min(100, (d.forecast / d.target) * 100) : null;
  const onTrack = hasTarget && d.forecast != null ? d.forecast >= d.target : null;
  const forecastHint = d.method === 'days' ? `${d.days_used} of ${d.days_total} days`
    : d.method === 'months' ? `${d.months_used} of ${d.months_total} months` : d.method === 'finished' ? 'Final' : 'Not started';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-rose-50 text-rose-600"><Target className="h-4 w-4" /></span>
          <div>
            <div className="text-base font-semibold text-gray-900">Target &amp; forecast</div>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        </div>
        <Link href={href} className="flex items-center gap-1 text-sm text-[#025545] hover:underline">
          {hasTarget ? 'Details' : 'Set a target'} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label="Target" value={inr(d.target)} hint={hasTarget ? `${d.target_months_set} of ${d.months.length} month${d.months.length > 1 ? 's' : ''} set` : 'Not set'} />
        <Tile label="Sales so far" value={inr(d.actual)} tone="text-emerald-700" hint={hasTarget ? `${d.achieved_pct}% of target` : ' '} />
        <Tile label="Forecast" value={inr(d.forecast)} tone="text-indigo-700"
          hint={onTrack == null ? forecastHint : `${forecastHint} · ${onTrack ? 'on track' : `short by ${inr(d.target - d.forecast)}`}`} />
        <Tile
          label="Left to reach target"
          value={!hasTarget ? '—' : reached ? 'Reached' : inr(left)}
          tone={!hasTarget ? 'text-gray-900' : reached ? 'text-emerald-700' : 'text-rose-700'}
          hint={!hasTarget ? 'Set a target to see this'
            : reached ? `${inr(d.actual - d.target)} over target`
              : d.needed?.each != null && d.needed.count > 0 ? `≈ ${inr(d.needed.each)} per ${d.needed.per}, ${d.needed.count} ${d.needed.per}${d.needed.count > 1 ? 's' : ''} left`
                : 'Period is over'}
        />
      </div>

      {hasTarget && (
        <div className="mt-4">
          <div className="relative h-3 rounded-full bg-gray-100 overflow-visible" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pctBar)} aria-label="Sales so far against target">
            <div className={`h-3 rounded-full ${reached ? 'bg-emerald-500' : 'bg-[#025545]'}`} style={{ width: `${pctBar}%` }} />
            {fcMark != null && !reached && (
              <div className="absolute -top-1 h-5 w-0.5 bg-indigo-600" style={{ left: `calc(${fcMark}% - 1px)` }} title={`Forecast ${inr(d.forecast)}`} />
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap justify-between gap-2 text-xs text-gray-500">
            <span>{inr(d.actual)} of {inr(d.target)}</span>
            {fcMark != null && !reached && <span className="text-indigo-700">| forecast {d.forecast_pct}% of target</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, hint, tone = 'text-gray-900' }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-lg sm:text-xl font-semibold ${tone}`}>{value}</p>
      <p className="text-[11px] text-gray-500">{hint}</p>
    </div>
  );
}
