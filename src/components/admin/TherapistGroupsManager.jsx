'use client';

/**
 * Admin: create therapist groups (A, B, C …) and put each therapist in one group.
 * Internal only — used for the group report (admin / finance). Clients never see it.
 */

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/backendApi';

const PALETTE = ['#189E4F', '#2563EB', '#D97706', '#9333EA', '#DC2626', '#0891B2', '#65A30D', '#DB2777'];

/** "Group A", "Group B" … — the first letter not already used. */
function nextGroupName(groups) {
  const used = new Set(groups.map((g) => g.name.trim().toLowerCase()));
  for (let i = 0; i < 26; i += 1) {
    const name = `Group ${String.fromCharCode(65 + i)}`;
    if (!used.has(name.toLowerCase())) return name;
  }
  return `Group ${groups.length + 1}`;
}

const inputCls = 'rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 focus:border-[#025545] focus:outline-none focus:ring-2 focus:ring-[#025545]/15';

export default function TherapistGroupsManager({ onChanged }) {
  const [state, setState] = useState({ loading: true, ready: true, message: '', groups: [], therapists: [] });
  const [drafts, setDrafts] = useState({});       // groupId -> { name, color }
  const [newGroup, setNewGroup] = useState({ name: '', color: PALETTE[0] });
  const [busy, setBusy] = useState('');           // what is saving
  const [note, setNote] = useState({ kind: '', text: '' });
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const r = await adminApi.getTherapistGroups();
      const d = r?.data ?? r;
      setState({ loading: false, ready: d?.ready !== false, message: d?.message || '', groups: d?.groups || [], therapists: d?.therapists || [] });
      setDrafts(Object.fromEntries((d?.groups || []).map((g) => [g.id, { name: g.name, color: g.color || PALETTE[0] }])));
      setNewGroup((n) => ({ name: nextGroupName(d?.groups || []), color: PALETTE[(d?.groups || []).length % PALETTE.length] || n.color }));
    } catch (e) {
      setState((s) => ({ ...s, loading: false }));
      setNote({ kind: 'err', text: e?.message || 'Could not load groups' });
    }
  };

  useEffect(() => { load(); }, []);

  const run = async (label, fn) => {
    setBusy(label);
    setNote({ kind: '', text: '' });
    try {
      const r = await fn();
      if (r && r.success === false) throw new Error(r.message || 'Something went wrong');
      setNote({ kind: 'ok', text: (r?.data ?? r)?.message || r?.message || 'Saved' });
      await load();
      onChanged?.();
    } catch (e) {
      setNote({ kind: 'err', text: e?.message || 'Something went wrong' });
    } finally {
      setBusy('');
    }
  };

  const counts = useMemo(() => {
    const c = {};
    state.therapists.forEach((t) => { if (t.groupId) c[t.groupId] = (c[t.groupId] || 0) + 1; });
    return c;
  }, [state.therapists]);

  const shown = state.therapists.filter((t) => {
    const q = search.trim().toLowerCase();
    return !q || `${t.name} ${t.designation}`.toLowerCase().includes(q);
  });

  if (state.loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-6 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading groups…
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      {/* Groups */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-base font-semibold text-gray-900">Groups</div>
        <p className="mt-0.5 text-xs text-slate-500">Each therapist can be in one group. Groups are only visible to admin and finance.</p>

        {!state.ready && (
          <div className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.message}
          </div>
        )}

        <div className="mt-4 space-y-2">
          {state.groups.length === 0 && state.ready && <p className="text-sm text-slate-400">No groups yet — add the first one below.</p>}
          {state.groups.map((g) => {
            const d = drafts[g.id] || { name: g.name, color: g.color || PALETTE[0] };
            const dirty = d.name !== g.name || (d.color || '') !== (g.color || '');
            return (
              <div key={g.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                <input
                  type="color"
                  value={d.color}
                  onChange={(e) => setDrafts((all) => ({ ...all, [g.id]: { ...d, color: e.target.value } }))}
                  className="h-8 w-8 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
                  aria-label={`${g.name} colour`}
                />
                <input
                  value={d.name}
                  onChange={(e) => setDrafts((all) => ({ ...all, [g.id]: { ...d, name: e.target.value } }))}
                  className={`${inputCls} min-w-0 flex-1`}
                  aria-label="Group name"
                />
                <span className="whitespace-nowrap text-xs text-slate-500">{counts[g.id] || 0} therapist{counts[g.id] === 1 ? '' : 's'}</span>
                <button
                  type="button"
                  disabled={!dirty || Boolean(busy)}
                  onClick={() => run('save', () => adminApi.updateTherapistGroup(g.id, { name: d.name, color: d.color }))}
                  className="rounded p-1.5 text-[#025545] hover:bg-[#025545]/10 disabled:opacity-30"
                  aria-label={`Save ${g.name}`}
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => {
                    const n = counts[g.id] || 0;
                    if (!window.confirm(`Delete "${g.name}"?${n ? ` Its ${n} therapist(s) become ungrouped.` : ''}`)) return;
                    run('delete', () => adminApi.deleteTherapistGroup(g.id));
                  }}
                  className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  aria-label={`Delete ${g.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        <form
          className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4"
          onSubmit={(e) => { e.preventDefault(); run('create', () => adminApi.createTherapistGroup(newGroup)); }}
        >
          <input
            type="color"
            value={newGroup.color}
            onChange={(e) => setNewGroup((n) => ({ ...n, color: e.target.value }))}
            className="h-8 w-8 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
            aria-label="New group colour"
          />
          <input
            value={newGroup.name}
            onChange={(e) => setNewGroup((n) => ({ ...n, name: e.target.value }))}
            placeholder="Group name"
            className={`${inputCls} min-w-0 flex-1`}
            aria-label="New group name"
          />
          <button
            type="submit"
            disabled={!state.ready || !newGroup.name.trim() || Boolean(busy)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#025545] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#012f23] disabled:opacity-40"
          >
            {busy === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add group
          </button>
        </form>

        {note.text && (
          <div className={`mt-3 flex items-center gap-1.5 text-sm ${note.kind === 'err' ? 'text-red-600' : 'text-green-700'}`}>
            {note.kind === 'ok' && <Check className="h-4 w-4" />} {note.text}
          </div>
        )}
      </section>

      {/* Membership */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-base font-semibold text-gray-900">Therapists</div>
            <p className="mt-0.5 text-xs text-slate-500">Pick a group for each therapist — it saves straight away.</p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search therapist…"
            className={`${inputCls} w-full sm:w-56`}
          />
        </div>
        <div className="mt-3 max-h-[480px] overflow-y-auto rounded-lg border border-gray-100">
          <table className="min-w-full text-sm">
            <tbody>
              {shown.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">{t.name || '—'}</div>
                    <div className="text-xs text-slate-500">{t.designation}{t.active ? '' : ' · inactive'}</div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <select
                      value={t.groupId || ''}
                      disabled={!state.ready || Boolean(busy)}
                      onChange={(e) => run(`assign-${t.id}`, () => adminApi.setTherapistGroup(t.id, e.target.value || null))}
                      className={`${inputCls} w-40`}
                      aria-label={`Group for ${t.name}`}
                    >
                      <option value="">No group</option>
                      {state.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    {busy === `assign-${t.id}` && <Loader2 className="ml-2 inline h-4 w-4 animate-spin text-slate-400" />}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td className="px-3 py-6 text-center text-sm text-slate-400">No therapists match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
