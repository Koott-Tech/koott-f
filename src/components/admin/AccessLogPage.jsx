'use client';

/**
 * Admin → Access log: who viewed or changed a client, lead or session record, and when
 * (plan → Privacy and safety → "A record of access").
 */
import { useCallback, useEffect, useState } from 'react';
import { leadsApi } from '@/lib/staffApi';
import { fmtWhen } from '@/components/tasks/taskUi';

const VERB = { viewed: 'viewed', changed: 'changed', converted: 'converted', created: 'created' };
const TONE = { viewed: 'bg-slate-100 text-slate-600', changed: 'bg-amber-50 text-amber-800', converted: 'bg-emerald-50 text-emerald-700', created: 'bg-sky-50 text-sky-700' };

export default function AccessLogPage() {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [resource, setResource] = useState('');
  const [who, setWho] = useState('');
  const load = useCallback(async () => {
    try { setRows((await leadsApi.accessLog({ resource: resource || undefined, who: who || undefined })).entries); setErr(''); } catch (e) { setErr(e.message); }
  }, [resource, who]);
  useEffect(() => { const t = setTimeout(load, who ? 300 : 0); return () => clearTimeout(t); }, [load, who]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4">
        <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>Access log</div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={who} onChange={(e) => setWho(e.target.value)} placeholder="Filter by staff email" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:max-w-xs" />
        <div className="flex rounded-lg bg-slate-100 p-0.5">
          {[['', 'All'], ['client', 'Clients'], ['lead', 'Leads'], ['session', 'Sessions']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setResource(v)} className={`rounded-md px-3 py-1.5 text-sm ${resource === v ? 'bg-white font-semibold shadow-sm' : 'text-slate-500'}`}>{l}</button>
          ))}
        </div>
      </div>
      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {!rows ? <div className="text-sm text-slate-500">Loading…</div> : (
        <div className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
              <span className="w-36 shrink-0 text-xs text-slate-500">{fmtWhen(r.timestamp)}</span>
              <span className="min-w-0 flex-1 truncate text-slate-800"><strong>{r.user_email || 'Unknown'}</strong> <span className="text-xs text-slate-400">({r.user_role})</span></span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONE[r.verb] || TONE.viewed}`}>{VERB[r.verb] || r.verb}</span>
              <span className="min-w-0 truncate text-slate-700"><span className="text-xs text-slate-400">{r.resource}</span> {r.record}</span>
            </div>
          ))}
          {!rows.length && <div className="p-8 text-center text-sm text-slate-500">Nothing logged yet.</div>}
        </div>
      )}
    </div>
  );
}
