'use client';

/**
 * Marketing → Lead sources: leads, contacted, converted and paying clients per source,
 * from the source tag every lead keeps in Operations — which ads and pages actually
 * bring paying clients — plus why leads were lost.
 */
import { useEffect, useState } from 'react';
import { leadsApi } from '@/lib/staffApi';
import { SOURCE_LABEL } from '@/components/ops/LeadsPipeline';

const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const ymd = (d) => d.toISOString().slice(0, 10);

export default function LeadSourcesReport() {
  const [range, setRange] = useState(90);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    setData(null);
    leadsApi.sources({ from: ymd(new Date(Date.now() - range * 864e5)), to: ymd(new Date()) }).then(setData).catch((e) => setErr(e.message));
  }, [range]);
  const max = Math.max(1, ...(data?.sources || []).map((s) => s.leads));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>Lead sources</div>
          <div className="mt-0.5 text-sm text-slate-500">Which sources bring leads — and which bring paying clients.</div>
        </div>
        <select value={range} onChange={(e) => setRange(Number(e.target.value))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={365}>Last 12 months</option>
        </select>
      </div>
      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {!data ? <div className="text-sm text-slate-500">Loading…</div> : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200 lg:col-span-2">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-2">Source</th><th className="px-3 py-2 text-right">Leads</th><th className="px-3 py-2 text-right">Contacted</th><th className="px-3 py-2 text-right">Converted</th><th className="px-3 py-2 text-right">Paying</th><th className="px-3 py-2 text-right">Lead → paying</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.sources.map((s) => (
                  <tr key={s.source}>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-900">{SOURCE_LABEL[s.source] || s.source}</div>
                      <div className="mt-1 h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-[#025545]" style={{ width: `${(s.leads / max) * 100}%` }} /></div>
                    </td>
                    <td className="px-3 py-2.5 text-right">{s.leads}</td>
                    <td className="px-3 py-2.5 text-right">{s.contacted}</td>
                    <td className="px-3 py-2.5 text-right">{s.converted}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{s.paying}</td>
                    <td className="px-3 py-2.5 text-right">{pct(s.paying, s.leads)}</td>
                  </tr>
                ))}
                {!data.sources.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No leads in this period.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="mb-2 text-sm font-semibold text-slate-900">Why leads were lost</div>
            {data.lostReasons.map((r) => (
              <div key={r.reason} className="flex items-center justify-between border-b border-slate-50 py-1.5 text-sm last:border-0"><span className="text-slate-700">{r.reason}</span><span className="font-semibold text-slate-900">{r.count}</span></div>
            ))}
            {!data.lostReasons.length && <div className="text-sm text-slate-500">No lost leads in this period.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
