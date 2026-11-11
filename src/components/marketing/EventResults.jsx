'use client';

/**
 * Marketing → Event results: registrations, attendance, and how many registrants
 * became clients and paid — per event.
 */
import { useEffect, useState } from 'react';
import { staffFetch } from '@/lib/staffApi';

const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const day = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export default function EventResults() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { staffFetch('/leads/event-results').then((d) => setRows(d.events)).catch((e) => setErr(e.message)); }, []);
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4">
        <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>Event results</div>
      </div>
      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {!rows ? <div className="text-sm text-slate-500">Loading…</div> : rows.length ? (
        <>
          <div className="space-y-2 md:hidden">
            {rows.map((r) => (
              <div key={r.slug} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <div className="text-sm font-medium text-slate-900">{r.title}</div>
                <div className="mt-1 text-xs text-slate-500">{r.registrations} registered · {r.attended} attended · {r.converted} clients · {r.paying} paying</div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200 md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-2">Event</th><th className="px-3 py-2 text-right">Registered</th><th className="px-3 py-2 text-right">Attended</th><th className="px-3 py-2 text-right">Became clients</th><th className="px-3 py-2 text-right">Paying</th><th className="px-3 py-2 text-right">Registered → paying</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.slug}>
                    <td className="px-4 py-2.5"><div className="font-medium text-slate-900">{r.title}</div><div className="text-xs text-slate-400">{day(r.first)} – {day(r.last)}</div></td>
                    <td className="px-3 py-2.5 text-right">{r.registrations}</td>
                    <td className="px-3 py-2.5 text-right">{r.attended}</td>
                    <td className="px-3 py-2.5 text-right">{r.converted}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{r.paying}</td>
                    <td className="px-3 py-2.5 text-right">{pct(r.paying, r.registrations)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No event registrations yet.</div>}
    </div>
  );
}
