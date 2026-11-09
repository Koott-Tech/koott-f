'use client';

/**
 * Shared bits of the Tasks UI: labels and colours, dates, the person/team picker and
 * the new-task form (used by quick add, the Tasks page and "Report a problem").
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { tasksApi } from '@/lib/staffApi';

export const STATUSES = [
  { value: 'todo', label: 'To do', dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-700' },
  { value: 'in_progress', label: 'In progress', dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700' },
  { value: 'waiting', label: 'Waiting', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-800' },
  { value: 'done', label: 'Done', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700' },
];
export const ARCHIVED = { value: 'cancelled', label: 'Archived', dot: 'bg-slate-300', chip: 'bg-slate-100 text-slate-500' };
export const statusOf = (v) => STATUSES.find((s) => s.value === v) || ARCHIVED;

export const PRIORITIES = [
  { value: 'urgent', label: 'Urgent', chip: 'bg-rose-50 text-rose-700 ring-rose-200' },
  { value: 'high', label: 'High', chip: 'bg-orange-50 text-orange-700 ring-orange-200' },
  { value: 'normal', label: 'Normal', chip: 'bg-slate-50 text-slate-600 ring-slate-200' },
  { value: 'low', label: 'Low', chip: 'bg-white text-slate-500 ring-slate-200' },
];
export const priorityOf = (v) => PRIORITIES.find((p) => p.value === v) || PRIORITIES[2];
export const PRIORITY_RANK = { urgent: 0, high: 1, normal: 2, low: 3 };

export const LINK_LABEL = {
  session: 'Session', client: 'Client', lead: 'Lead', therapist: 'Therapist', blog: 'Blog post', page: 'Page',
  booking: 'Booking', payout: 'Payout', application: 'Application', person: 'Person', url: 'Link',
};

const IST = 'Asia/Kolkata';
export function fmtDeadline(task) {
  if (!task?.deadline) return '';
  const d = new Date(task.deadline);
  const day = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: IST });
  return task.deadline_has_time ? `${day}, ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: IST })}` : day;
}
export const fmtWhen = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: IST }) : '');

/** <input type=date/datetime-local> value ↔ ISO (IST) */
export function toInputValue(iso, withTime) {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() + 330 * 60000);
  const s = d.toISOString();
  return withTime ? s.slice(0, 16) : s.slice(0, 10);
}
export function fromInputValue(v, withTime) {
  if (!v) return null;
  return withTime ? new Date(`${v}:00+05:30`).toISOString() : new Date(`${v}T18:00:00+05:30`).toISOString();
}

export function Chip({ className = '', children }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}>{children}</span>;
}
export function StatusChip({ status }) {
  const s = statusOf(status);
  return <Chip className={s.chip}><span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.label}</Chip>;
}
export function PriorityChip({ priority }) {
  const p = priorityOf(priority);
  return <Chip className={`ring-1 ${p.chip}`}>{p.label}</Chip>;
}

/** People and teams to give tasks to (loaded once per page). */
let peopleCache = null;
export function usePeople() {
  const [data, setData] = useState(peopleCache);
  const [error, setError] = useState('');
  useEffect(() => {
    if (peopleCache) return;
    tasksApi.people().then((d) => { peopleCache = d; setData(d); }).catch((e) => setError(e.message));
  }, []);
  return { people: data?.people || [], teams: data?.teams || [], templates: data?.templates || [], error, loaded: Boolean(data) };
}

/** Searchable picker for a person or a team. value = 'user:<id>' | 'psychologist:<id>' | 'team:<id>' */
export function AssigneePicker({ value, onChange, people, teams, meKey, placeholder = 'Give it to…', allowTeams = true, compact = false }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const box = useRef(null);
  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const all = useMemo(() => [
    ...(allowTeams ? teams.map((t) => ({ ...t, label: `${t.name} team`, sub: 'Team — any member can pick it up' })) : []),
    ...people.map((p) => ({ ...p, label: p.key === meKey ? `${p.name} (me)` : p.name, sub: [p.roleLabel, ...(p.teams || []).map((t) => t.name)].filter(Boolean).join(' · ') })),
  ], [people, teams, meKey, allowTeams]);
  const shown = all.filter((o) => !q || `${o.label} ${o.sub}`.toLowerCase().includes(q.toLowerCase())).slice(0, 60);
  const current = all.find((o) => o.key === value);
  return (
    <div className="relative" ref={box}>
      <button
        type="button" onClick={() => setOpen((o) => !o)}
        className={`w-full rounded-lg border border-slate-200 bg-white text-left ${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#025545]/20`}
      >
        {current ? <span className="text-slate-900">{current.label}</span> : <span className="text-slate-400">{placeholder}</span>}
      </button>
      {open && (
        <div className="absolute z-[120] mt-1 w-full min-w-[240px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <input
            autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people or teams"
            className="mb-2 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#025545]/20"
          />
          <div className="max-h-64 overflow-y-auto">
            {meKey && !q && (
              <button type="button" onClick={() => { onChange(meKey); setOpen(false); }} className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm font-medium text-[#025545] hover:bg-slate-50">Me</button>
            )}
            {shown.map((o) => (
              <button
                key={o.key} type="button" onClick={() => { onChange(o.key); setOpen(false); setQ(''); }}
                className={`block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-slate-50 ${o.key === value ? 'bg-[#025545]/5' : ''}`}
              >
                <span className="block text-sm text-slate-900">{o.label}</span>
                {o.sub && <span className="block text-[11px] text-slate-500">{o.sub}</span>}
              </button>
            ))}
            {!shown.length && <div className="px-2.5 py-2 text-sm text-slate-500">Nobody matches.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

const splitKey = (k) => { const [type, id] = String(k || '').split(':'); return { type, id }; };

/**
 * New task form. `preset` can carry title, link_*, assignee key, details.
 * onCreated(task) after saving.
 */
export function TaskForm({ preset = {}, meKey, onCreated, onCancel, autoFocus = true }) {
  const { people, teams, templates, error: peopleErr } = usePeople();
  const [title, setTitle] = useState(preset.title || '');
  const [assignee, setAssignee] = useState(preset.assignee || meKey || '');
  const [withTime, setWithTime] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState(preset.priority || 'normal');
  const [details, setDetails] = useState(preset.details || '');
  const [template, setTemplate] = useState('');
  const [recurrence, setRecurrence] = useState('');
  const [more, setMore] = useState(Boolean(preset.details));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { if (!assignee && meKey) setAssignee(meKey); }, [meKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e?.preventDefault();
    if (!title.trim() && !template) { setErr('Write what needs doing.'); return; }
    if (!assignee) { setErr('Pick who it is for.'); return; }
    setBusy(true); setErr('');
    try {
      const a = splitKey(assignee);
      const { task } = await tasksApi.create({
        title: title.trim() || undefined, assignee_type: a.type, assignee_id: a.id,
        deadline: fromInputValue(deadline, withTime), deadline_has_time: withTime && Boolean(deadline),
        priority, details: details || undefined, template_key: template || undefined, recurrence: recurrence || undefined,
        link_type: preset.link_type, link_id: preset.link_id, link_label: preset.link_label, link_url: preset.link_url,
      });
      onCreated?.(task);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#025545] focus:outline-none focus:ring-2 focus:ring-[#025545]/15';
  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        autoFocus={autoFocus} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300}
        placeholder={template ? 'Title (optional — the template has one)' : 'What needs doing? e.g. Reschedule client K-1042'}
        className={`${inputCls} text-[15px]`}
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">For</label>
          <AssigneePicker value={assignee} onChange={setAssignee} people={people} teams={teams} meKey={meKey} />
        </div>
        <div>
          <label className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Deadline
            <span className="flex items-center gap-1 font-normal normal-case tracking-normal">
              <input type="checkbox" checked={withTime} onChange={(e) => { setWithTime(e.target.checked); setDeadline(''); }} /> time
            </span>
          </label>
          <input type={withTime ? 'datetime-local' : 'date'} value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRIORITIES.map((p) => (
          <button
            key={p.value} type="button" onClick={() => setPriority(p.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${priority === p.value ? 'bg-[#025545] text-white ring-[#025545]' : p.chip}`}
          >
            {p.label}
          </button>
        ))}
        {!more && <button type="button" onClick={() => setMore(true)} className="ml-auto text-xs font-semibold text-[#025545] hover:underline">More options</button>}
      </div>
      {more && (
        <div className="space-y-2">
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Details (no clinical information)" className={inputCls} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select value={template} onChange={(e) => setTemplate(e.target.value)} className={inputCls}>
              <option value="">No checklist template</option>
              {templates.map((t) => <option key={t.key} value={t.key}>{t.title} ({t.steps} steps)</option>)}
            </select>
            <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className={inputCls}>
              <option value="">Does not repeat</option>
              <option value="weekly:1">Every Monday</option>
              <option value="weekly:5">Every Friday</option>
              <option value="monthly:1">Monthly on the 1st</option>
              <option value="monthly:15">Monthly on the 15th</option>
            </select>
          </div>
        </div>
      )}
      {preset.link_label && <div className="text-xs text-slate-500">Linked to: <strong>{preset.link_label}</strong></div>}
      {(err || peopleErr) && <div className="text-sm text-rose-600">{err || peopleErr}</div>}
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>}
        <button type="submit" disabled={busy} className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013d31] disabled:opacity-50">
          {busy ? 'Saving…' : 'Create task'}
        </button>
      </div>
    </form>
  );
}

/** Simple modal (full screen on phones). */
export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const esc = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open, onClose]);
  if (!open || typeof document === 'undefined') return null;
  // Rendered into <body>: a modal opened from a slid-in sidebar (CSS transform) would
  // otherwise be positioned inside that sidebar instead of over the screen.
  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
      <div className={`relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="text-base font-semibold text-slate-900" role="heading" aria-level={2}>{title}</div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
