'use client';

/**
 * One task, opened: every field editable in place, checklist, comments with @mentions,
 * history, "Pick it up" for team tasks, archive (by whoever gave it, or Admin), and a
 * link that opens the record the task is about.
 */
import { useCallback, useEffect, useState } from 'react';
import { tasksApi } from '@/lib/staffApi';
import {
  ARCHIVED, AssigneePicker, LINK_LABEL, PRIORITIES, STATUSES, fmtWhen, fromInputValue, priorityOf, statusOf,
  toInputValue, usePeople,
} from './taskUi';

/** Where a linked record opens, from this dashboard. */
export function linkHref(task, role) {
  if (!task?.link_type) return null;
  // Only https:// links or paths on this site (an old row could hold javascript:…).
  if (task.link_type === 'url') return /^(https?:\/\/|\/(?!\/))/i.test(String(task.link_url || '')) ? task.link_url : null;
  const base = ['operations'].includes(role) ? '/operations'
    : role === 'hr' ? '/hr' : role === 'marketing' ? '/marketing' : role === 'finance' ? '/finance'
      : role === 'psychologist' ? '/psychologist' : role === 'superadmin' ? '/admin' : '/admin';
  switch (task.link_type) {
    case 'lead': return ['operations', 'admin', 'superadmin'].includes(role) ? `${base}/leads?lead=${encodeURIComponent(task.link_id)}` : null;
    case 'session': case 'booking':
      if (role === 'psychologist') return '/psychologist/sessions';
      return ['operations', 'admin', 'superadmin'].includes(role) ? `${base}/bookings` : null;
    case 'client': return ['operations', 'admin', 'superadmin'].includes(role) ? `${base === '/operations' ? '/operations/clients' : '/admin/users'}` : null;
    case 'blog':
      if (role === 'psychologist' && task.template_key === 'blog_review') return `/psychologist/blog-review?task=${task.id}`;
      return ['marketing', 'admin', 'superadmin'].includes(role) ? `${role === 'marketing' ? '/marketing/blogs' : '/admin/blogs'}/${encodeURIComponent(task.link_id)}/edit` : null;
    case 'application': return ['hr', 'admin', 'superadmin'].includes(role) ? `${role === 'hr' ? '/hr' : '/admin'}/applications` : null;
    case 'person': return ['hr', 'admin', 'superadmin'].includes(role) ? `${role === 'hr' ? '/hr' : '/admin'}/people` : null;
    case 'payout': return ['finance', 'admin', 'superadmin'].includes(role) ? '/finance/payouts' : null;
    default: return null;
  }
}

const HISTORY_TEXT = {
  created: () => 'created the task',
  status: (e) => `changed status to ${statusOf(e.to_value).label}`,
  priority: (e) => `set priority to ${priorityOf(e.to_value).label}`,
  deadline: (e) => (e.to_value ? `set the deadline to ${fmtWhen(e.to_value)}` : 'removed the deadline'),
  assignee: () => 'gave the task to someone else',
  title: () => 'renamed the task',
  details: () => 'edited the details',
  checklist: () => 'updated the checklist',
  recurrence: (e) => (e.to_value ? 'made the task repeat' : 'stopped the task repeating'),
  link: () => 'changed what the task is linked to',
  claimed: () => 'picked up the task',
  comment: () => 'commented',
  attachment: (e) => `attached ${e.to_value?.name || 'a file'}`,
  attachment_removed: (e) => `removed ${e.to_value?.name || 'a file'}`,
};

export default function TaskDrawer({ taskId, me, role, onClose, onChanged }) {
  const { people, teams } = usePeople();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState('');
  const [mentions, setMentions] = useState([]);
  const [mentionPick, setMentionPick] = useState('');
  const [newItem, setNewItem] = useState('');
  const [tab, setTab] = useState('comments');
  const [files, setFiles] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try { setData(await tasksApi.get(taskId)); setErr(''); } catch (e) { setErr(e.message); }
  }, [taskId]);
  useEffect(() => { load(); }, [load]);
  const loadFiles = useCallback(async () => {
    try { setFiles((await tasksApi.attachments(taskId)).attachments); } catch (_) { setFiles([]); }
  }, [taskId]);
  useEffect(() => { loadFiles(); }, [loadFiles]);
  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true); setErr('');
    try { setFiles((await tasksApi.uploadAttachment(taskId, file)).attachments); load(); } catch (e) { setErr(e.message); } finally { setUploading(false); }
  };
  const openFile = async (f) => {
    const w = window.open('', '_blank');
    try { const { url } = await tasksApi.openAttachment(taskId, f.id); if (w) w.location.href = url; else window.location.href = url; } catch (e) { if (w) w.close(); setErr(e.message); }
  };
  const removeFile = async (f) => {
    if (!window.confirm(`Remove ${f.name}?`)) return;
    try { setFiles((await tasksApi.removeAttachment(taskId, f.id)).attachments); load(); } catch (e) { setErr(e.message); }
  };
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const task = data?.task;
  const save = async (patch) => {
    setSaving(true); setErr('');
    try {
      const { task: t } = await tasksApi.update(taskId, patch);
      setData((d) => ({ ...d, task: t }));
      onChanged?.(t);
      load();
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  };

  const claim = async () => {
    try { const { task: t } = await tasksApi.claim(taskId); onChanged?.(t); load(); } catch (e) { setErr(e.message); }
  };

  const sendComment = async () => {
    if (!comment.trim()) return;
    try {
      const out = await tasksApi.comment(taskId, comment.trim(), mentions);
      setComment(''); setMentions([]);
      load();
      // Need to know: only people who can see the task are told about a mention.
      const skipped = out?.skippedMentions || [];
      if (skipped.length) setErr(`${skipped.map((s) => s.name).join(', ')} can't see this task, so ${skipped.length > 1 ? 'they were' : 'it was'} not told. Give them the task or make a new one for them.`);
    } catch (e) { setErr(e.message); }
  };

  const addMention = (k) => {
    const o = [...people, ...teams].find((x) => x.key === k);
    if (!o) return;
    setComment((c) => `${c}${c && !c.endsWith(' ') ? ' ' : ''}@${o.name} `);
    setMentions((m) => (m.some((x) => x.type === o.type && x.id === o.id) ? m : [...m, { type: o.type, id: o.id }]));
    setMentionPick('');
  };

  const checklist = task?.checklist || [];
  const setChecklist = (list) => save({ checklist: list });
  const isCreator = task && task.creator?.key === me?.key;
  const canArchive = task && (me?.isAdmin || isCreator);
  const href = task ? linkHref(task, role) : null;
  const inputCls = 'w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-[#025545] focus:outline-none focus:ring-2 focus:ring-[#025545]/15';

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} aria-hidden />
      <aside className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Task{saving ? ' · saving…' : ''}</span>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">✕</button>
        </div>

        {!task ? (
          <div className="p-6 text-sm text-slate-500">{err || 'Loading…'}</div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <input
              key={task.id + task.updated_at} defaultValue={task.title}
              onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== task.title) save({ title: v }); }}
              className="w-full rounded-lg border border-transparent px-1 py-1 text-lg font-semibold text-slate-900 hover:border-slate-200 focus:border-[#025545] focus:outline-none"
            />
            {task.overdue && <div className="mt-1 text-xs font-semibold text-rose-600">Overdue</div>}

            <div className="mt-4 grid grid-cols-[110px_1fr] items-center gap-x-3 gap-y-3 text-sm">
              <span className="text-slate-500">Status</span>
              <div className="flex flex-wrap gap-1.5">
                {[...STATUSES, ...(task.status === 'cancelled' ? [ARCHIVED] : [])].map((s) => (
                  <button
                    key={s.value} type="button" disabled={s.value === 'cancelled'} onClick={() => s.value !== task.status && save({ status: s.value })}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${task.status === s.value ? 'bg-[#025545] text-white' : `${s.chip} hover:ring-1 hover:ring-slate-300`}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <span className="text-slate-500">Assigned to</span>
              <div>
                <AssigneePicker value={task.assignee.key} onChange={(k) => { const [type, id] = k.split(':'); save({ assignee_type: type, assignee_id: id }); }} people={people} teams={teams} meKey={me?.key} compact />
                {task.assignee.type === 'team' && (
                  <div className="mt-1 text-xs text-slate-500">
                    {task.claimedBy ? <>Picked up by <strong>{task.claimedBy.name}</strong></> : 'Nobody has picked it up yet.'}
                    {(!task.claimedBy || task.claimedBy.id !== me?.id) && (
                      <button type="button" onClick={claim} className="ml-2 font-semibold text-[#025545] hover:underline">Pick it up</button>
                    )}
                  </div>
                )}
              </div>

              <span className="text-slate-500">Created by</span>
              <span className="text-slate-800">{task.creator.name} <span className="text-slate-400">· {fmtWhen(task.created_at)}</span></span>

              <span className="text-slate-500">Deadline</span>
              <div className="flex items-center gap-2">
                <input
                  key={`d${task.updated_at}`} type={task.deadline_has_time ? 'datetime-local' : 'date'}
                  defaultValue={toInputValue(task.deadline, task.deadline_has_time)}
                  onChange={(e) => save({ deadline: fromInputValue(e.target.value, task.deadline_has_time) })}
                  className={`${inputCls} max-w-[220px]`}
                />
                <label className="flex items-center gap-1 text-xs text-slate-500">
                  <input type="checkbox" checked={task.deadline_has_time} onChange={(e) => save({ deadline_has_time: e.target.checked })} /> time
                </label>
              </div>

              <span className="text-slate-500">Priority</span>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITIES.map((p) => (
                  <button key={p.value} type="button" onClick={() => p.value !== task.priority && save({ priority: p.value })}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${task.priority === p.value ? 'bg-[#025545] text-white ring-[#025545]' : p.chip}`}>
                    {p.label}
                  </button>
                ))}
              </div>

              <span className="text-slate-500">Repeats</span>
              <select value={task.recurrence || ''} onChange={(e) => save({ recurrence: e.target.value || null })} className={`${inputCls} max-w-[220px]`}>
                <option value="">Does not repeat</option>
                <option value="weekly:1">Every Monday</option>
                <option value="weekly:5">Every Friday</option>
                <option value="monthly:1">Monthly on the 1st</option>
                <option value="monthly:15">Monthly on the 15th</option>
              </select>

              {task.link_type && (
                <>
                  <span className="text-slate-500">Linked to</span>
                  <span>
                    {href ? <a href={href} className="font-medium text-[#025545] hover:underline">{task.link_label || LINK_LABEL[task.link_type]}</a>
                      : <span className="text-slate-800">{task.link_label || LINK_LABEL[task.link_type]}</span>}
                    <span className="ml-1 text-xs text-slate-400">({LINK_LABEL[task.link_type]})</span>
                  </span>
                </>
              )}
            </div>

            <div className="mt-5">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Details</div>
              <textarea
                key={`t${task.updated_at}`} defaultValue={task.details || ''} rows={4} placeholder="Add details — never clinical information"
                onBlur={(e) => { if ((e.target.value || '') !== (task.details || '')) save({ details: e.target.value }); }}
                className={inputCls}
              />
            </div>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <span>Checklist</span>
                {checklist.length > 0 && <span className="normal-case tracking-normal">{checklist.filter((c) => c.done).length}/{checklist.length} done</span>}
              </div>
              {checklist.length > 0 && (
                <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-emerald-500" style={{ width: `${(checklist.filter((c) => c.done).length / checklist.length) * 100}%` }} />
                </div>
              )}
              <ul className="space-y-1">
                {checklist.map((c) => (
                  <li key={c.id} className="group flex items-start gap-2 rounded-lg px-1 py-0.5 hover:bg-slate-50">
                    <input type="checkbox" checked={c.done} className="mt-1" onChange={() => setChecklist(checklist.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)))} />
                    <span className={`flex-1 text-sm ${c.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{c.text}</span>
                    <button type="button" onClick={() => setChecklist(checklist.filter((x) => x.id !== c.id))} className="text-xs text-slate-300 opacity-0 hover:text-rose-600 group-hover:opacity-100" aria-label="Remove step">✕</button>
                  </li>
                ))}
              </ul>
              <form onSubmit={(e) => { e.preventDefault(); if (newItem.trim()) { setChecklist([...checklist, { id: Date.now().toString(36), text: newItem.trim(), done: false }]); setNewItem(''); } }} className="mt-1 flex gap-2">
                <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add a step" className={inputCls} />
                <button type="submit" className="rounded-lg border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50">Add</button>
              </form>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <span>Files</span>
                <label className={`cursor-pointer normal-case tracking-normal font-semibold text-[#025545] hover:underline ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                  {uploading ? 'Uploading…' : '+ Attach a file'}
                  <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt"
                    onChange={(e) => { uploadFile(e.target.files?.[0]); e.target.value = ''; }} />
                </label>
              </div>
              {files === null ? <div className="text-xs text-slate-400">Loading…</div> : files.length ? (
                <ul className="space-y-1">
                  {files.map((f) => (
                    <li key={f.id} className="group flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-slate-50">
                      <span aria-hidden>📎</span>
                      <button type="button" onClick={() => openFile(f)} className="min-w-0 flex-1 truncate text-left text-sm text-[#025545] hover:underline">{f.name}</button>
                      {f.size ? <span className="shrink-0 text-[11px] text-slate-400">{Math.max(1, Math.round(f.size / 1024))} KB</span> : null}
                      <button type="button" onClick={() => removeFile(f)} className="text-xs text-slate-300 opacity-0 hover:text-rose-600 group-hover:opacity-100" aria-label={`Remove ${f.name}`}>✕</button>
                    </li>
                  ))}
                </ul>
              ) : <div className="text-xs text-slate-400">No files. Up to 15 MB each — never clinical notes.</div>}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <div className="mb-3 flex gap-1">
                {['comments', 'history'].map((t) => (
                  <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-lg px-3 py-1 text-sm ${tab === t ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}>
                    {t === 'comments' ? `Comments (${data.comments.length})` : 'History'}
                  </button>
                ))}
              </div>
              {tab === 'comments' ? (
                <div className="space-y-3">
                  {data.comments.map((c) => (
                    <div key={c.id} className="rounded-xl bg-slate-50 px-3 py-2">
                      <div className="text-xs text-slate-500"><strong className="text-slate-700">{c.authorName}</strong> · {fmtWhen(c.created_at)}</div>
                      <div className="mt-0.5 whitespace-pre-wrap text-sm text-slate-800">{c.body}</div>
                    </div>
                  ))}
                  {!data.comments.length && <div className="text-sm text-slate-400">No comments yet.</div>}
                  <div className="space-y-2">
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Write a comment…" className={inputCls}
                      onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendComment(); }} />
                    <div className="flex items-center gap-2">
                      <div className="w-44">
                        <AssigneePicker value={mentionPick} onChange={addMention} people={people} teams={teams} placeholder="@ Mention…" compact />
                      </div>
                      <button type="button" onClick={sendComment} disabled={!comment.trim()} className="ml-auto rounded-lg bg-[#025545] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40">Comment</button>
                    </div>
                  </div>
                </div>
              ) : (
                <ol className="space-y-2">
                  {data.history.map((e) => (
                    <li key={e.id} className="text-xs text-slate-600">
                      <strong className="text-slate-800">{e.actorName}</strong> {(HISTORY_TEXT[e.action] || (() => e.action))(e)} · <span className="text-slate-400">{fmtWhen(e.created_at)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {err && <div className="mt-3 text-sm text-rose-600">{err}</div>}

            <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {task.status === 'cancelled'
                ? <button type="button" onClick={() => save({ status: 'todo' })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">Restore</button>
                : canArchive && <button type="button" onClick={() => save({ status: 'cancelled' })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Archive</button>}
              {task.status !== 'done' && task.status !== 'cancelled' && (
                <button type="button" onClick={() => save({ status: 'done' })} className="ml-auto rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">Mark done</button>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
