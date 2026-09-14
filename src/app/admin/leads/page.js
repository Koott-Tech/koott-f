'use client';

/**
 * Admin → Leads. Everyone who verified a mobile number in the booking flow,
 * whether they booked or not (booking_leads, migration 0010). A lead moves
 * Number only → Details given → Account → Booked. Newest activity first.
 */

import { useEffect, useState } from 'react';
import { PhoneCall, Search } from 'lucide-react';
import { adminApi } from '@/lib/backendApi';

const STATUSES = [
  ['all', 'All'],
  ['verified', 'Number only'],
  ['details', 'Details given'],
  ['account', 'Account'],
  ['booked', 'Booked'],
];
const LABEL = Object.fromEntries(STATUSES);
const BADGE = {
  verified: 'bg-amber-50 text-amber-800 ring-amber-200',
  details: 'bg-sky-50 text-sky-800 ring-sky-200',
  account: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  booked: 'bg-[#025545] text-white ring-[#025545]',
};

const when = (iso) => (iso
  ? new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata',
  })
  : '—');
const waLink = (phone) => `https://wa.me/${String(phone).replace(/\D/g, '')}`;
const therapistName = (p) => (p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : '');

export default function LeadsPage() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState({ leads: [], counts: {} });
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let off = false;
    setBusy(true);
    setErr('');
    adminApi.getBookingLeads({ status, q: query })
      .then((r) => {
        if (off) return;
        if (r?.success === false) throw new Error(r.message || 'Could not load leads.');
        setData(r?.data || { leads: [], counts: {} });
      })
      .catch((e) => { if (!off) setErr(e?.message || 'Could not load leads.'); })
      .finally(() => { if (!off) setBusy(false); });
    return () => { off = true; };
  }, [status, query]);

  const counts = data.counts || {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 p-4 md:p-8">
      <div className="flex items-center gap-2">
        <PhoneCall className="h-5 w-5 text-[#025545]" />
        <div>
          <div className="text-xl font-semibold text-gray-900">Leads</div>
          <p className="mt-0.5 max-w-2xl text-xs text-slate-500">
            Everyone who verified their mobile number in the booking flow, whether they booked or not.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map(([key, label]) => {
          const n = key === 'all' ? total : (counts[key] || 0);
          const on = status === key;
          return (
            <button
              key={key} type="button" onClick={() => setStatus(key)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${on
                ? 'border-[#025545] bg-[#025545] text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
            >
              {label} <span className={on ? 'text-white/80' : 'text-slate-400'}>{n}</span>
            </button>
          );
        })}
        <label className="relative ml-auto w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search phone, name or email"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#025545]"
          />
        </label>
      </div>

      {err && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Mobile</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Therapist</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {busy && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            )}
            {!busy && !err && data.leads.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No leads yet.</td></tr>
            )}
            {!busy && data.leads.map((l) => (
              <tr key={l.id} className="align-top hover:bg-slate-50/60">
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="font-medium text-gray-900">{l.phone}</div>
                  <div className="mt-1 flex gap-3 text-xs">
                    <a className="text-[#025545] hover:underline" href={`tel:${l.phone}`}>Call</a>
                    <a className="text-[#025545] hover:underline" href={waLink(l.phone)} target="_blank" rel="noreferrer">WhatsApp</a>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-900">
                  {l.name || <span className="text-slate-400">—</span>}
                  {(l.age || l.emergency_contact) && (
                    <div className="mt-1 text-xs text-slate-500">
                      {[l.age && `Age ${l.age}`, l.emergency_contact && `Emergency ${l.emergency_contact}`].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">{l.email || <span className="text-slate-400">—</span>}</td>
                <td className="px-4 py-3 text-slate-700">{therapistName(l.psychologist) || <span className="text-slate-400">—</span>}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${BADGE[l.status] || 'bg-slate-50 text-slate-700 ring-slate-200'}`}>
                    {LABEL[l.status] || l.status}
                  </span>
                  {l.existing_account && <div className="mt-1 text-xs text-slate-500">Returning client</div>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {when(l.updated_at)}
                  <div className="mt-1 text-xs text-slate-400">First seen {when(l.created_at)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
