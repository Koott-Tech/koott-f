'use client';

/**
 * Operations → Client timeline: pick a client and see, newest first, where they came
 * from (lead source), every booking and session, payments and the tasks about them.
 * No clinical notes — dates, statuses and amounts only.
 */
import { useEffect, useState } from 'react';
import { staffFetch } from '@/lib/staffApi';
import { fmtWhen } from '@/components/tasks/taskUi';
import { CameFromBox } from './CameFrom';

const ICON = { lead: '🧲', session: '🗓️', payment: '₹', task: '☑', account: '👤' };
const TONE = { lead: 'bg-sky-50 text-sky-700', session: 'bg-indigo-50 text-indigo-700', payment: 'bg-emerald-50 text-emerald-700', task: 'bg-amber-50 text-amber-800', account: 'bg-slate-100 text-slate-600' };

export default function ClientTimeline({ base = '/operations' }) {
  const [q, setQ] = useState('');
  const [matches, setMatches] = useState([]);
  const [clientId, setClientId] = useState(null);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    try { const id = new URLSearchParams(window.location.search).get('client'); if (id) setClientId(id); } catch (_) { /* ignore */ }
  }, []);
  useEffect(() => {
    if (!q.trim()) { setMatches([]); return undefined; }
    const t = setTimeout(() => {
      staffFetch('/admin/users', { query: { search: q.trim(), limit: 10, page: 1 } })
        .then((d) => setMatches((d.users || []).filter((u) => (u.role || 'client') === 'client')))
        .catch((e) => setErr(e.message));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    if (!clientId) return;
    setData(null); setErr('');
    staffFetch(`/leads/client-timeline/${clientId}`).then(setData).catch((e) => setErr(e.message));
    try { const u = new URL(window.location.href); u.searchParams.set('client', clientId); window.history.replaceState(null, '', u); } catch (_) { /* ignore */ }
  }, [clientId]);

  const nameOf = (u) => u.name || [u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ') || u.email;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4">
        <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>Client timeline</div>
      </div>
      <div className="relative mb-5">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a client by name, email or phone"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#025545]/20" />
        {matches.length > 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
            {matches.map((u) => (
              <button key={u.id} type="button" onClick={() => { setClientId(u.id); setQ(''); setMatches([]); }} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50">
                <span className="block text-sm text-slate-900">{nameOf(u)}</span>
                <span className="block text-xs text-slate-500">{u.email}{u.profile?.phone_number ? ` · ${u.profile.phone_number}` : ''}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {!clientId && !err && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Search for a client to see their timeline.</div>}
      {clientId && !data && !err && <div className="text-sm text-slate-500">Loading…</div>}
      {data && (
        <>
          <div className="mb-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="text-lg font-semibold text-slate-900">{data.client.name}</div>
            <div className="text-sm text-slate-500">{[data.client.email, data.client.phone].filter(Boolean).join(' · ')}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700">{data.counts.sessions} sessions</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{data.counts.payments} paid</span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">{data.counts.tasks} tasks</span>
              {data.client.phone && <a href={`https://wa.me/${String(data.client.phone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="rounded-full bg-emerald-600 px-2.5 py-1 font-semibold text-white">WhatsApp</a>}
              {data.client.phone && <a href={`tel:${data.client.phone}`} className="rounded-full bg-[#025545] px-2.5 py-1 font-semibold text-white">Call</a>}
            </div>
            <div className="mt-3"><CameFromBox a={data.attribution} /></div>
          </div>
          <ol className="relative space-y-3 border-l border-slate-200 pl-5">
            {data.events.map((e, i) => (
              <li key={i} className="relative">
                <span className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${TONE[e.kind]}`}>{ICON[e.kind]}</span>
                <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-100">
                  <div className="text-sm text-slate-900">
                    {e.kind === 'task' && e.id ? <a href={`${base}/tasks?task=${e.id}`} className="hover:underline">{e.text}</a> : e.text}
                  </div>
                  <div className="text-xs text-slate-500">{fmtWhen(e.at)}{e.detail ? ` · ${e.detail}` : ''}</div>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
