'use client';

/**
 * Finance → Salaries: everyone on HR's list of people (therapists and other staff, with
 * their email), the monthly salary Finance records for each, and the totals.
 */
import { useEffect, useMemo, useState } from 'react';
import { peopleApi } from '@/lib/staffApi';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function SalariesPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [kind, setKind] = useState('all');
  const [drafts, setDrafts] = useState({});
  const [saved, setSaved] = useState({});
  useEffect(() => { peopleApi.list().then(setData).catch((e) => setErr(e.message)); }, []);

  const people = useMemo(() => (data?.people || []).filter((p) => p.active && p.role !== 'superadmin')
    .filter((p) => kind === 'all' || (kind === 'therapists' ? p.type === 'psychologist' : p.type === 'user'))
    .sort((a, b) => a.name.localeCompare(b.name)), [data, kind]);
  const total = people.reduce((a, p) => a + Number(drafts[p.key] ?? p.salaryMonthly ?? 0), 0);

  const save = async (p) => {
    const value = drafts[p.key];
    try {
      await peopleApi.update(p.type, p.id, { salary_monthly: value === '' ? null : Number(value) });
      setSaved({ ...saved, [p.key]: true });
      setData((d) => ({ ...d, people: d.people.map((x) => (x.key === p.key ? { ...x, salaryMonthly: value === '' ? null : Number(value) } : x)) }));
      setTimeout(() => setSaved((s) => ({ ...s, [p.key]: false })), 1500);
    } catch (e) { setErr(e.message); }
  };
  const exportCsv = () => {
    const rows = [['Name', 'Email', 'Role', 'Job title', 'Teams', 'Monthly salary (INR)'],
      ...people.map((p) => [p.name, p.email, p.roleLabel, p.jobTitle || '', (p.teams || []).map((t) => t.name).join('; '), p.salaryMonthly ?? ''])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `koott-salaries-${new Date().toISOString().slice(0, 7)}.csv`;
    a.click();
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>Salaries</div>
          <div className="mt-0.5 text-sm text-slate-500">From HR&apos;s list of people. Monthly total: <strong className="text-slate-800">{inr(total)}</strong></div>
        </div>
        <button type="button" onClick={exportCsv} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Download CSV</button>
      </div>
      <div className="mb-4 flex rounded-lg bg-slate-100 p-0.5 sm:inline-flex">
        {[['all', 'Everyone'], ['therapists', 'Therapists'], ['staff', 'Other staff']].map(([v, l]) => (
          <button key={v} type="button" onClick={() => setKind(v)} className={`flex-1 rounded-md px-3 py-1.5 text-sm ${kind === v ? 'bg-white font-semibold shadow-sm' : 'text-slate-500'}`}>{l}</button>
        ))}
      </div>
      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {!data ? <div className="text-sm text-slate-500">Loading…</div> : (
        <div className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
          {people.map((p) => (
            <div key={p.key} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1 basis-56">
                <div className="truncate text-sm font-medium text-slate-900">{p.name}</div>
                <div className="truncate text-xs text-slate-500">{p.roleLabel}{p.jobTitle ? ` · ${p.jobTitle}` : ''} · {p.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">₹</span>
                <input type="number" min="0" step="500" value={drafts[p.key] ?? p.salaryMonthly ?? ''} placeholder="per month"
                  onChange={(e) => setDrafts({ ...drafts, [p.key]: e.target.value })}
                  className="w-32 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm" />
                <button type="button" disabled={drafts[p.key] === undefined} onClick={() => save(p)} className="rounded-lg bg-[#025545] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-30">{saved[p.key] ? 'Saved ✓' : 'Save'}</button>
              </div>
            </div>
          ))}
          {!people.length && <div className="p-6 text-center text-sm text-slate-500">Nobody here yet — HR adds people in People.</div>}
        </div>
      )}
    </div>
  );
}
