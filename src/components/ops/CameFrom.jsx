'use client';

/**
 * Where a lead or client came from — Instagram, Facebook ads, Google search, direct… —
 * from Koott's own first-party tracking (backend utils/attribution.js).
 *   <CameFromChip a={attribution} />  a small tag for lists
 *   <CameFromBox a={attribution} />   the details (first visit, the visit that booked, campaign)
 */
import { useEffect, useState } from 'react';
import { staffFetch } from '@/lib/staffApi';

const TONE = {
  paid_social: 'bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-200',
  organic_social: 'bg-pink-50 text-pink-800 ring-pink-200',
  paid_search: 'bg-amber-50 text-amber-800 ring-amber-200',
  organic_search: 'bg-sky-50 text-sky-800 ring-sky-200',
  whatsapp: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  ai_platform: 'bg-violet-50 text-violet-800 ring-violet-200',
  direct: 'bg-slate-100 text-slate-700 ring-slate-200',
};
const short = (label) => String(label || '').replace(/ \(typed the address or a saved link\)$/, '');
const FROM = { booking: 'tracked when they booked', phone: 'tracked when they verified their phone', 'contact form': 'tracked with the contact form' };

export function CameFromChip({ a }) {
  if (!a?.label) return null;
  return (
    <span title={`Came from: ${a.label}`} className={`inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${TONE[a.firstChannel] || 'bg-slate-50 text-slate-700 ring-slate-200'}`}>
      {short(a.label)}
    </span>
  );
}

export function CameFromBox({ a, loading = false }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Came from</div>
      {loading ? <p className="mt-1 text-sm text-slate-400">Loading…</p>
        : !a?.label ? <p className="mt-1 text-sm text-slate-500">Not known — they reached us before tracking, by phone, or with tracking blocked.</p>
          : (
            <dl className="mt-1 space-y-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <dt className="sr-only">First found us</dt>
                <dd className="font-semibold text-slate-900">{a.first || a.label}</dd>
                <CameFromChip a={a} />
              </div>
              {a.last && a.last !== a.first && (
                <div className="text-slate-600"><dt className="inline">Came back to book through: </dt><dd className="inline font-medium text-slate-800">{a.last}</dd></div>
              )}
              {a.campaign && <div className="text-slate-600"><dt className="inline">Campaign: </dt><dd className="inline font-medium text-slate-800">{a.campaign}</dd></div>}
              {a.landing && <div className="text-slate-600"><dt className="inline">First page: </dt><dd className="inline">{a.landing}</dd></div>}
              {a.leadSource?.source && (
                <div className="text-slate-600"><dt className="inline">As a lead: </dt><dd className="inline">{a.leadSource.source}{a.leadSource.detail ? ` · ${a.leadSource.detail}` : ''}</dd></div>
              )}
              <div className="text-[11px] text-slate-400">{FROM[a.from] || ''}{a.device ? ` · ${a.device}` : ''}</div>
            </dl>
          )}
    </div>
  );
}

/** Loads where a client came from (users.id or clients.id) and shows the box. */
export function ClientCameFrom({ clientId }) {
  const [a, setA] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!clientId) return undefined;
    let off = false;
    setLoading(true);
    staffFetch(`/leads/client-source/${encodeURIComponent(clientId)}`)
      .then((d) => { if (!off) setA(d.attribution); })
      .catch(() => { if (!off) setA(null); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [clientId]);
  if (!clientId) return null;
  return <CameFromBox a={a} loading={loading} />;
}
