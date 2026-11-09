'use client';

/**
 * HR → Teams: Team A, B, C and so on, with members and a team lead. Tasks can be given
 * to a whole team; automatic tasks go to the Operations, HR, Marketing, Finance and
 * Developers teams by name.
 */
import { useCallback, useEffect, useState } from 'react';
import { teamsApi } from '@/lib/staffApi';
import { AssigneePicker, Modal, usePeople } from '@/components/tasks/taskUi';

const SYSTEM = ['Operations', 'HR', 'Marketing', 'Finance', 'Developers'];

export default function TeamsPage() {
  const { people } = usePeople();
  const [teams, setTeams] = useState(null);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState({});

  const load = useCallback(async () => { try { setTeams((await teamsApi.list()).teams); setErr(''); } catch (e) { setErr(e.message); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing.id) await teamsApi.update(editing.id, { name: editing.name, description: editing.description, lead: editing.lead || null });
      else await teamsApi.create({ name: editing.name, description: editing.description, lead: editing.lead || null });
      setEditing(null); load();
    } catch (e) { setErr(e.message); }
  };
  const remove = async (t) => {
    if (!window.confirm(`Delete the ${t.name} team? People stay; only the team goes.`)) return;
    try { await teamsApi.remove(t.id); load(); } catch (e) { setErr(e.message); }
  };
  const addMember = async (t, k) => { try { await teamsApi.addMember(t.id, k); setAdding({ ...adding, [t.id]: '' }); load(); } catch (e) { setErr(e.message); } };
  const removeMember = async (t, k) => { try { await teamsApi.removeMember(t.id, k); load(); } catch (e) { setErr(e.message); } };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>Teams</div>
          <div className="mt-0.5 text-sm text-slate-500">Members and a team lead. Give tasks to a whole team; when someone leaves, their tasks go to the lead.</div>
        </div>
        <button type="button" onClick={() => setEditing({ name: '', description: '', lead: '' })} className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white">+ New team</button>
      </div>
      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {!teams ? <div className="text-sm text-slate-500">Loading…</div> : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((t) => (
            <div key={t.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{t.name}{SYSTEM.includes(t.name) && <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal text-slate-500">gets automatic tasks</span>}</div>
                  {t.description && <div className="text-xs text-slate-500">{t.description}</div>}
                </div>
                <div className="flex gap-1 text-xs">
                  <button type="button" onClick={() => setEditing({ id: t.id, name: t.name, description: t.description || '', lead: t.lead?.key || '' })} className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100">Edit</button>
                  {!SYSTEM.includes(t.name) && <button type="button" onClick={() => remove(t)} className="rounded-lg px-2 py-1 text-rose-600 hover:bg-rose-50">Delete</button>}
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-600">Lead: {t.lead ? <strong>{t.lead.name}</strong> : <span className="text-slate-400">none yet</span>}</div>
              <ul className="mt-3 space-y-1">
                {t.members.map((m) => (
                  <li key={m.key} className="group flex items-center justify-between rounded-lg px-2 py-1 text-sm hover:bg-slate-50">
                    <span className="truncate text-slate-800">{m.name}{t.lead?.key === m.key && <span className="ml-1 text-[10px] text-[#025545]">lead</span>}</span>
                    <button type="button" onClick={() => removeMember(t, m.key)} className="text-xs text-slate-300 hover:text-rose-600 group-hover:text-slate-400" aria-label={`Remove ${m.name}`}>✕</button>
                  </li>
                ))}
                {!t.members.length && <li className="px-2 text-xs text-slate-400">No members yet.</li>}
              </ul>
              <div className="mt-2">
                <AssigneePicker value={adding[t.id] || ''} onChange={(k) => addMember(t, k)} people={people.filter((p) => !t.members.some((m) => m.key === p.key))} teams={[]} allowTeams={false} placeholder="+ Add a member" compact />
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Edit team' : 'New team'}>
        {editing && (
          <div className="space-y-3">
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Team name, e.g. Team A" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="What the team does (optional)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <div className="text-xs text-slate-500">Team lead<AssigneePicker value={editing.lead} onChange={(k) => setEditing({ ...editing, lead: k })} people={people} teams={[]} allowTeams={false} placeholder="Pick a lead" /></div>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button><button type="button" onClick={save} disabled={!editing.name.trim()} className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save</button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
