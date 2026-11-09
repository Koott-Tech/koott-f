'use client';

/**
 * The Tasks page every dashboard shares — Notion-style.
 *
 *   Lists:  My tasks · Assigned by me · Overdue · All tasks (Admin) · Archived · Workload (Admin)
 *   Views:  Board (drag a card to change its status) · Table (sort / filter) · Calendar
 *   Saved filters live in this browser.
 *
 * Opened with ?task=<id> it shows that task (links from notifications and emails).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { tasksApi } from '@/lib/staffApi';
import { useVisiblePoll } from '@/lib/useVisiblePoll';
import { useAuth } from '@/contexts/AuthContext';
import TaskDrawer from './TaskDrawer';
import {
  Modal, PRIORITIES, PRIORITY_RANK, PriorityChip, STATUSES, StatusChip, TaskForm, fmtDeadline, statusOf,
} from './taskUi';

const SAVED_KEY = 'koott_task_filters_v1';
const loadSaved = () => { try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch (_) { return []; } };
const storeSaved = (list) => { try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch (_) { /* private mode */ } };

function TaskCard({ task, onOpen, draggable, onDragStart }) {
  return (
    <button
      type="button" draggable={draggable} onDragStart={onDragStart} onClick={() => onOpen(task.id)}
      className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-slate-300 hover:shadow"
    >
      <div className="text-sm font-medium leading-snug text-slate-900">{task.title}</div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PriorityChip priority={task.priority} />
        {task.deadline && <span className={`text-[11px] ${task.overdue ? 'font-semibold text-rose-600' : 'text-slate-500'}`}>{task.overdue ? 'Overdue · ' : ''}{fmtDeadline(task)}</span>}
        {task.checklistTotal > 0 && <span className="text-[11px] text-slate-500">☑ {task.checklistDone}/{task.checklistTotal}</span>}
        {task.recurrence && <span className="text-[11px] text-slate-500">↻</span>}
      </div>
      <div className="mt-2 truncate text-[11px] text-slate-500">
        {task.claimedBy ? task.claimedBy.name : task.assignee.name}{task.creator.type === 'system' ? ' · automatic' : ` · from ${task.creator.name}`}
      </div>
    </button>
  );
}

function Board({ tasks, onOpen, onMove }) {
  const [over, setOver] = useState(null);
  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
      {STATUSES.map((s) => {
        const col = tasks.filter((t) => t.status === s.value);
        return (
          <div
            key={s.value}
            onDragOver={(e) => { e.preventDefault(); setOver(s.value); }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData('text/task'); if (id) onMove(id, s.value); }}
            className={`w-[78vw] max-w-[320px] shrink-0 snap-start rounded-2xl p-2.5 sm:w-72 lg:w-auto lg:max-w-none ${over === s.value ? 'bg-[#025545]/10' : 'bg-slate-50'}`}
          >
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              <span className="text-sm font-semibold text-slate-700">{s.label}</span>
              <span className="text-xs text-slate-400">{col.length}</span>
            </div>
            <div className="space-y-2">
              {col.map((t) => (
                <TaskCard key={t.id} task={t} onOpen={onOpen} draggable onDragStart={(e) => e.dataTransfer.setData('text/task', t.id)} />
              ))}
              {!col.length && <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">Drop a task here</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const SORTS = {
  deadline: (a, b) => (a.deadline ? new Date(a.deadline) : Infinity) - (b.deadline ? new Date(b.deadline) : Infinity),
  priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  status: (a, b) => STATUSES.findIndex((s) => s.value === a.status) - STATUSES.findIndex((s) => s.value === b.status),
  title: (a, b) => a.title.localeCompare(b.title),
  assignee: (a, b) => a.assignee.name.localeCompare(b.assignee.name),
  created: (a, b) => new Date(b.created_at) - new Date(a.created_at),
};

function Table({ tasks, onOpen, sort, setSort }) {
  const sorted = [...tasks].sort(SORTS[sort.by] || SORTS.created);
  if (sort.dir === 'desc') sorted.reverse();
  const Th = ({ by, children, className = '' }) => (
    <th className={`px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 ${className}`}>
      <button type="button" onClick={() => setSort({ by, dir: sort.by === by && sort.dir === 'asc' ? 'desc' : 'asc' })} className="hover:text-slate-800">
        {children}{sort.by === by ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  );
  return (
    <>
      {/* Phones: one card per task */}
      <div className="space-y-2 md:hidden">
        {sorted.map((t) => (
          <button key={t.id} type="button" onClick={() => onOpen(t.id)} className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-left">
            <div className="text-sm font-medium text-slate-900">{t.title}</div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <StatusChip status={t.status} /><PriorityChip priority={t.priority} />
              {t.deadline && <span className={`text-[11px] ${t.overdue ? 'font-semibold text-rose-600' : 'text-slate-500'}`}>{fmtDeadline(t)}</span>}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">{t.claimedBy?.name || t.assignee.name} · from {t.creator.name}</div>
          </button>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50"><tr>
            <Th by="title">Task</Th><Th by="assignee">Assigned to</Th><Th by="status">Status</Th>
            <Th by="priority">Priority</Th><Th by="deadline">Deadline</Th><Th by="created">Created by</Th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((t) => (
              <tr key={t.id} onClick={() => onOpen(t.id)} className="cursor-pointer hover:bg-slate-50">
                <td className="max-w-[360px] px-3 py-2.5 text-sm text-slate-900">
                  <span className="line-clamp-2">{t.title}</span>
                  {t.link_label && <span className="mt-0.5 block text-[11px] text-slate-400">↳ {t.link_label}</span>}
                </td>
                <td className="px-3 py-2.5 text-sm text-slate-700">{t.claimedBy?.name || t.assignee.name}</td>
                <td className="px-3 py-2.5"><StatusChip status={t.status} /></td>
                <td className="px-3 py-2.5"><PriorityChip priority={t.priority} /></td>
                <td className={`whitespace-nowrap px-3 py-2.5 text-sm ${t.overdue ? 'font-semibold text-rose-600' : 'text-slate-600'}`}>{fmtDeadline(t) || '—'}</td>
                <td className="px-3 py-2.5 text-sm text-slate-500">{t.creator.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CalendarView({ tasks, onOpen }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const days = useMemo(() => {
    const first = new Date(month);
    const cells = Array(first.getDay()).fill(null);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= last; i += 1) cells.push(new Date(month.getFullYear(), month.getMonth(), i));
    return cells;
  }, [month]);
  const byDay = useMemo(() => {
    const m = {};
    tasks.filter((t) => t.deadline).forEach((t) => {
      const k = new Date(new Date(t.deadline).getTime() + 330 * 60000).toISOString().slice(0, 10);
      (m[k] = m[k] || []).push(t);
    });
    return m;
  }, [tasks]);
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = key(new Date());
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100">‹</button>
        <span className="text-sm font-semibold text-slate-800">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
        <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100">›</button>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-slate-100 text-xs">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="bg-slate-50 py-1.5 text-center font-semibold text-slate-500">{d}</div>)}
        {days.map((d, i) => (
          <div key={i} className={`min-h-[72px] bg-white p-1 sm:min-h-[96px] ${d && key(d) === today ? 'ring-2 ring-inset ring-[#025545]/40' : ''}`}>
            {d && (
              <>
                <div className="mb-1 text-[11px] text-slate-400">{d.getDate()}</div>
                <div className="space-y-1">
                  {(byDay[key(d)] || []).slice(0, 3).map((t) => (
                    <button key={t.id} type="button" onClick={() => onOpen(t.id)} title={t.title}
                      className={`block w-full truncate rounded px-1 py-0.5 text-left text-[10px] sm:text-[11px] ${t.status === 'done' ? 'bg-emerald-50 text-emerald-700 line-through' : t.overdue ? 'bg-rose-50 text-rose-700' : statusOf(t.status).chip}`}>
                      {t.title}
                    </button>
                  ))}
                  {(byDay[key(d)] || []).length > 3 && <div className="text-[10px] text-slate-400">+{byDay[key(d)].length - 3} more</div>}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Workload({ onPick }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { tasksApi.workload().then((d) => setRows(d.workload)).catch((e) => setErr(e.message)); }, []);
  if (err) return <div className="text-sm text-rose-600">{err}</div>;
  if (!rows) return <div className="text-sm text-slate-500">Loading…</div>;
  const max = Math.max(1, ...rows.map((r) => r.open));
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      {rows.map((r) => (
        <button key={r.key} type="button" onClick={() => onPick(r.key)} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50">
          <div className="w-40 shrink-0 sm:w-56">
            <div className="truncate text-sm font-medium text-slate-900">{r.name}</div>
            <div className="text-[11px] capitalize text-slate-500">{r.role === 'psychologist' ? 'Therapist' : r.role}</div>
          </div>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-[#025545]" style={{ width: `${(r.open / max) * 100}%` }} />
          </div>
          <div className="w-28 text-right text-xs text-slate-600"><strong>{r.open}</strong> open{r.overdue ? <span className="ml-1 font-semibold text-rose-600">· {r.overdue} overdue</span> : ''}</div>
        </button>
      ))}
      {!rows.length && <div className="p-6 text-center text-sm text-slate-500">No open tasks. 🎉</div>}
    </div>
  );
}

export default function TasksPage({ title = 'Tasks' }) {
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'admin' || role === 'superadmin';
  const [list, setList] = useState('mine');
  const [view, setView] = useState('board');
  const [tasks, setTasks] = useState(null);
  const [me, setMe] = useState(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [priority, setPriority] = useState('');
  const [assignee, setAssignee] = useState('');
  const [sort, setSort] = useState({ by: 'deadline', dir: 'asc' });
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saved, setSaved] = useState([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setSaved(loadSaved());
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('task')) setOpenId(p.get('task'));
      const v = localStorage.getItem('koott_task_view');
      if (v) setView(v);
    } catch (_) { /* no storage */ }
  }, []);
  useEffect(() => { try { localStorage.setItem('koott_task_view', view); } catch (_) { /* no storage */ } }, [view]);

  const load = useCallback(async () => {
    if (list === 'workload') return;
    setErr('');
    try {
      const d = await tasksApi.list({
        view: list === 'archived' ? 'visible' : list, archived: list === 'archived' ? '1' : undefined,
        q: q || undefined, priority: priority || undefined, assignee: assignee || undefined,
      });
      setTasks(d.tasks); setMe(d.me);
    } catch (e) { setErr(e.message); setTasks([]); }
  }, [list, q, priority, assignee]);
  useEffect(() => { const t = setTimeout(load, q ? 250 : 0); return () => clearTimeout(t); }, [load, q, tick]);
  // Others change tasks too: refresh every minute while the page is open.
  useVisiblePoll(() => setTick((n) => n + 1), 60000);

  const moveTask = async (id, status) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
    try { await tasksApi.update(id, { status }); setTick((n) => n + 1); } catch (e) { setErr(e.message); setTick((n) => n + 1); }
  };

  const openTask = (id) => {
    setOpenId(id);
    try { const u = new URL(window.location.href); u.searchParams.set('task', id); window.history.replaceState(null, '', u); } catch (_) { /* ignore */ }
  };
  const closeTask = () => {
    setOpenId(null);
    try { const u = new URL(window.location.href); u.searchParams.delete('task'); window.history.replaceState(null, '', u); } catch (_) { /* ignore */ }
  };

  const saveFilter = () => {
    const name = window.prompt('Name this filter (e.g. "Urgent tasks this week")');
    if (!name) return;
    const next = [...saved.filter((s) => s.name !== name), { name, list, q, priority, assignee, view }];
    setSaved(next); storeSaved(next);
  };
  const applyFilter = (f) => { setList(f.list); setQ(f.q || ''); setPriority(f.priority || ''); setAssignee(f.assignee || ''); if (f.view) setView(f.view); };
  const removeFilter = (name) => { const next = saved.filter((s) => s.name !== name); setSaved(next); storeSaved(next); };

  const LISTS = [
    ['mine', 'My tasks'], ['by_me', 'Assigned by me'], ['overdue', 'Overdue'],
    ...(isAdmin ? [['all', 'All tasks'], ['workload', 'Workload']] : []), ['archived', 'Archived'],
  ];
  const counts = tasks ? { open: tasks.filter((t) => !['done', 'cancelled'].includes(t.status)).length, overdue: tasks.filter((t) => t.overdue).length } : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>{title}</div>
          <div className="mt-0.5 text-sm text-slate-500">
            {counts ? <>{counts.open} open{counts.overdue ? <span className="font-semibold text-rose-600"> · {counts.overdue} overdue</span> : ''}</> : 'Give anyone a task with a deadline and a status.'}
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button type="button" onClick={async () => { try { await tasksApi.runAuto(); setTick((n) => n + 1); } catch (e) { setErr(e.message); } }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" title="Run the automatic-task rules now (they also run every 15 minutes)">
              Run automatic tasks
            </button>
          )}
          <button type="button" onClick={() => setCreating(true)} className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013d31]">+ New task</button>
        </div>
      </div>

      <div className="-mx-4 mb-3 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {LISTS.map(([v, label]) => (
          <button key={v} type="button" onClick={() => setList(v)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm ${list === v ? 'bg-[#025545] text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900'}`}>
            {label}
          </button>
        ))}
      </div>

      {list !== 'workload' && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:max-w-xs focus:outline-none focus:ring-2 focus:ring-[#025545]/20" />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="">Any priority</option>
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {assignee && <button type="button" onClick={() => setAssignee('')} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">One person ✕</button>}
          <div className="ml-auto flex rounded-lg bg-slate-100 p-0.5">
            {[['board', 'Board'], ['table', 'Table'], ['calendar', 'Calendar']].map(([v, label]) => (
              <button key={v} type="button" onClick={() => setView(v)} className={`rounded-md px-3 py-1.5 text-sm ${view === v ? 'bg-white font-semibold text-slate-900 shadow-sm' : 'text-slate-500'}`}>{label}</button>
            ))}
          </div>
        </div>
      )}

      {list !== 'workload' && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs">
          {saved.map((f) => (
            <span key={f.name} className="inline-flex items-center gap-1 rounded-full bg-[#025545]/5 px-2.5 py-1 text-[#025545]">
              <button type="button" onClick={() => applyFilter(f)} className="font-medium hover:underline">{f.name}</button>
              <button type="button" onClick={() => removeFilter(f.name)} className="text-[#025545]/50 hover:text-rose-600" aria-label={`Remove ${f.name}`}>✕</button>
            </span>
          ))}
          <button type="button" onClick={saveFilter} className="rounded-full px-2.5 py-1 text-slate-500 ring-1 ring-dashed ring-slate-300 hover:text-slate-800">Save this filter</button>
        </div>
      )}

      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

      {list === 'workload' ? (
        <Workload onPick={(k) => { setAssignee(k); setList('all'); setView('table'); }} />
      ) : !tasks ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : view === 'board' && list !== 'archived' ? (
        <Board tasks={tasks} onOpen={openTask} onMove={moveTask} />
      ) : view === 'calendar' ? (
        <CalendarView tasks={tasks} onOpen={openTask} />
      ) : (
        <Table tasks={tasks} onOpen={openTask} sort={sort} setSort={setSort} />
      )}
      {tasks && !tasks.length && list !== 'workload' && (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          {list === 'mine' ? 'Nothing on your list.' : list === 'overdue' ? 'Nothing overdue.' : 'No tasks here.'}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New task">
        <TaskForm meKey={me?.key} onCancel={() => setCreating(false)} onCreated={(t) => { setCreating(false); setTick((n) => n + 1); if (t?.id) openTask(t.id); }} />
      </Modal>
      {openId && <TaskDrawer taskId={openId} me={me} role={role} onClose={closeTask} onChanged={() => setTick((n) => n + 1)} />}
    </div>
  );
}
