'use client';

/**
 * HR → People: one list of everyone who works at Koott — staff logins and therapists.
 *   Employee onboarding: name, email, role, team, start date → creates the login (the
 *   role decides the dashboard) and shows a temporary password once; adds onboarding tasks.
 *   Edit role / team / job title / start date. Offboard (access ends now, history stays,
 *   open tasks move to the team lead) and reactivate.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { peopleApi } from '@/lib/staffApi';
import { Modal } from '@/components/tasks/taskUi';
import { useAuth } from '@/contexts/AuthContext';

const CAL = { connected: ['Calendar connected', 'text-emerald-700 bg-emerald-50'], needs_reconnect: ['Calendar needs reconnecting', 'text-rose-700 bg-rose-50'], not_connected: ['Calendar not connected', 'text-slate-600 bg-slate-100'] };

export default function PeoplePage({ therapistOnboardingHref = '/hr/therapists' }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [team, setTeam] = useState('');
  const [status, setStatus] = useState('active');
  const [onboarding, setOnboarding] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'staff', team_id: '', start_date: '', job_title: '', phone: '' });
  const [created, setCreated] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { try { setData(await peopleApi.list()); setErr(''); } catch (e) { setErr(e.message); } }, []);
  useEffect(() => { load(); }, [load]);

  const people = useMemo(() => (data?.people || []).filter((p) => {
    if (status === 'active' && !p.active) return false;
    if (status === 'offboarded' && p.active) return false;
    if (role && p.role !== role) return false;
    if (team && !(p.teams || []).some((t) => t.id === team)) return false;
    if (q && !`${p.name} ${p.email} ${p.jobTitle || ''}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name)), [data, q, role, team, status]);

  const onboard = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const r = await peopleApi.onboard(form);
      setCreated({ ...r, name: form.name, email: form.email });
      setForm({ name: '', email: '', role: 'staff', team_id: '', start_date: '', job_title: '', phone: '' });
      load();
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  const saveEdit = async () => {
    setBusy(true); setErr('');
    try {
      await peopleApi.update(editing.type, editing.id, {
        job_title: editing.jobTitle || '', start_date: editing.startDate || '', phone: editing.phone || '',
        team_ids: editing.teamIds, ...(editing.type === 'user' && editing.role !== editing.originalRole ? { role: editing.role } : {}),
      });
      setEditing(null); load();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const offboard = async (p) => {
    if (!window.confirm(`Offboard ${p.name}? Their login stops working now. Their history stays, and their open tasks move to their team lead.`)) return;
    try { const r = await peopleApi.offboard(p.type, p.id); window.alert(`${p.name} is offboarded. ${r.tasksMoved} open task(s) moved.`); load(); } catch (e) { setErr(e.message); }
  };
  const reactivate = async (p) => { try { await peopleApi.reactivate(p.type, p.id); load(); } catch (e) { setErr(e.message); } };
  const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#025545] focus:outline-none focus:ring-2 focus:ring-[#025545]/15';
  const roleOptions = [...(data?.roles || []), { value: 'psychologist', label: 'Therapist' }];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>People</div>
          <div className="mt-0.5 text-sm text-slate-500">Everyone who works at Koott. One email, one role, one dashboard.</div>
        </div>
        <div className="flex gap-2">
          <a href={therapistOnboardingHref} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Onboard a therapist</a>
          <button type="button" onClick={() => { setCreated(null); setOnboarding(true); }} className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013d31]">+ Onboard a team member</button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or title" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:max-w-xs" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="">All roles</option>
          {[{ value: 'superadmin', label: 'Superadmin' }, ...roleOptions].map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={team} onChange={(e) => setTeam(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="">All teams</option>
          {(data?.teams || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div className="flex rounded-lg bg-slate-100 p-0.5">
          {[['active', 'Active'], ['offboarded', 'Offboarded'], ['all', 'All']].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setStatus(v)} className={`rounded-md px-3 py-1.5 text-sm ${status === v ? 'bg-white font-semibold shadow-sm' : 'text-slate-500'}`}>{l}</button>
          ))}
        </div>
      </div>

      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {!data ? <div className="text-sm text-slate-500">Loading…</div> : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {people.map((p) => (
            <div key={p.key} className={`rounded-2xl bg-white p-4 ring-1 ring-slate-200 ${p.active ? '' : 'opacity-70'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">{p.name}</div>
                  <div className="truncate text-xs text-slate-500">{p.email}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${p.active ? 'bg-[#025545]/10 text-[#025545]' : 'bg-slate-100 text-slate-500'}`}>{p.active ? p.roleLabel : 'Offboarded'}</span>
              </div>
              <div className="mt-2 space-y-0.5 text-xs text-slate-600">
                {p.jobTitle && <div>{p.jobTitle}</div>}
                <div>{(p.teams || []).length ? `Team: ${p.teams.map((t) => t.name).join(', ')}` : <span className="text-slate-400">No team</span>}</div>
                {p.startDate && <div>Started {new Date(p.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                {p.calendar && <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${CAL[p.calendar][1]}`}>{CAL[p.calendar][0]}</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-xs">
                <button type="button" onClick={() => setEditing({ ...p, originalRole: p.role, teamIds: (p.teams || []).map((t) => t.id) })} className="rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50">Edit</button>
                {p.active
                  ? p.role !== 'superadmin' && p.key !== `user:${user?.id}` && <button type="button" onClick={() => offboard(p)} className="rounded-lg px-2.5 py-1 font-medium text-rose-600 hover:bg-rose-50">Offboard</button>
                  : <button type="button" onClick={() => reactivate(p)} className="rounded-lg px-2.5 py-1 font-medium text-[#025545] hover:bg-[#025545]/5">Reactivate</button>}
              </div>
            </div>
          ))}
          {!people.length && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">Nobody matches.</div>}
        </div>
      )}

      <Modal open={onboarding} onClose={() => setOnboarding(false)} title={created ? 'Login created' : 'Onboard a team member'}>
        {created ? (
          <div className="space-y-3 text-sm">
            <div><strong>{created.name}</strong> can now sign in with the <strong>Log In</strong> button on the website and lands on <strong>{created.dashboard}</strong>.</div>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-900">
              <div className="text-xs font-semibold uppercase tracking-wide">Temporary password — shown once</div>
              <div className="mt-1 select-all font-mono text-base">{created.tempPassword}</div>
              <div className="mt-1 text-xs">Send it to {created.email} privately. They should change it with &quot;Forgot password&quot; after signing in.</div>
            </div>
            <div className="text-xs text-slate-500">Onboarding tasks were created for them, for HR and for their team lead.</div>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setCreated(null)} className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">Onboard another</button><button type="button" onClick={() => setOnboarding(false)} className="rounded-lg bg-[#025545] px-4 py-2 font-semibold text-white">Done</button></div>
          </div>
        ) : (
          <form onSubmit={onboard} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input required className={inputCls} placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input required type="email" className={inputCls} placeholder="Work email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {(data?.roles || []).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <select className={inputCls} value={form.team_id} onChange={(e) => setForm({ ...form, team_id: e.target.value })}>
                <option value="">No team yet</option>
                {(data?.teams || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input className={inputCls} placeholder="Job title (e.g. Designer)" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
              <label className="text-xs text-slate-500">Start date<input type="date" className={inputCls} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></label>
              <input className={`${inputCls} sm:col-span-2`} placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              Role decides the dashboard: Operations → /operations, HR → /hr, Marketing → /marketing, Finance → /finance, Staff (developers, designers…) → Tasks only. Therapists are onboarded on the therapist screen (profile, pricing, availability, calendar).
            </div>
            {err && <div className="text-sm text-rose-600">{err}</div>}
            <div className="flex justify-end"><button type="submit" disabled={busy} className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Creating…' : 'Create login'}</button></div>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing ? `Edit ${editing.name}` : ''}>
        {editing && (
          <div className="space-y-3">
            {editing.type === 'user' && editing.role !== 'superadmin' && (
              <label className="block text-xs text-slate-500">Role (one role per email)
                <select className={inputCls} value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
                  {(data?.roles || []).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </label>
            )}
            <label className="block text-xs text-slate-500">Job title<input className={inputCls} value={editing.jobTitle || ''} onChange={(e) => setEditing({ ...editing, jobTitle: e.target.value })} /></label>
            <label className="block text-xs text-slate-500">Start date<input type="date" className={inputCls} value={editing.startDate || ''} onChange={(e) => setEditing({ ...editing, startDate: e.target.value })} /></label>
            <label className="block text-xs text-slate-500">Phone<input className={inputCls} value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></label>
            <div className="text-xs text-slate-500">Teams
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(data?.teams || []).map((t) => {
                  const on = editing.teamIds.includes(t.id);
                  return <button key={t.id} type="button" onClick={() => setEditing({ ...editing, teamIds: on ? editing.teamIds.filter((x) => x !== t.id) : [...editing.teamIds, t.id] })}
                    className={`rounded-full px-3 py-1 text-xs ${on ? 'bg-[#025545] text-white' : 'bg-slate-100 text-slate-700'}`}>{t.name}</button>;
                })}
              </div>
            </div>
            {err && <div className="text-sm text-rose-600">{err}</div>}
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button><button type="button" disabled={busy} onClick={saveEdit} className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save</button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
