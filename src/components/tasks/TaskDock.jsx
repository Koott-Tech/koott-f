'use client';

/**
 * On every dashboard page: the task notifications bell, quick add ("+ Task", one line
 * from anywhere) and "Report a problem" (a task for the developers with this page's
 * link filled in). Opening a notification goes to this dashboard's Tasks page.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { tasksApi } from '@/lib/staffApi';
import { TASKS_PATH_BY_ROLE } from '@/lib/staffRoles';
import { Modal, TaskForm, fmtWhen } from './taskUi';

const KIND_ICON = { assigned: '📌', comment: '💬', mention: '@', status: '↻', due_today: '⏰', due_tomorrow: '🗓️', overdue: '⚠️' };

export default function TaskDock({ bottom = 16 }) {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(null);
  const [unread, setUnread] = useState(0);
  const [adding, setAdding] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [report, setReport] = useState({ summary: '', details: '', priority: 'high' });
  const [reportState, setReportState] = useState('');
  const [toast, setToast] = useState('');
  const box = useRef(null);
  const signedIn = typeof isAuthenticated === 'function' ? isAuthenticated() : Boolean(user);
  const tasksPath = TASKS_PATH_BY_ROLE[user?.role] || null;
  const meKey = user ? `${user.role === 'psychologist' ? 'psychologist' : 'user'}:${user.id}` : null;

  const load = useCallback(async () => {
    try { const d = await tasksApi.notifications(); setNotes(d.notifications); setUnread(d.unread); } catch (_) { /* tables not ready, or signed out */ }
  }, []);
  useEffect(() => {
    if (!signedIn || !tasksPath) return undefined;
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [signedIn, tasksPath, load]);
  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  // Quick add from the keyboard: press "t" outside a field (like Notion's shortcuts).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 't' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      e.preventDefault(); setAdding(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  if (!signedIn || !tasksPath) return null;

  const openNote = async (n) => {
    if (!n.read_at) { tasksApi.markRead([n.id]).catch(() => {}); setUnread((u) => Math.max(0, u - 1)); }
    window.location.href = `${tasksPath}?task=${n.task_id}`;
  };
  const sendReport = async (e) => {
    e.preventDefault();
    if (!report.summary.trim()) return;
    setReportState('sending');
    try {
      await tasksApi.report({ ...report, page: window.location.href, userAgent: navigator.userAgent });
      setReporting(false); setReport({ summary: '', details: '', priority: 'high' }); setReportState('');
      setToast('Thanks — the developers have it as a task.'); setTimeout(() => setToast(''), 3500);
    } catch (err) { setReportState(err.message); }
  };

  const btn = 'flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-slate-200 hover:text-[#025545]';
  return (
    <>
      <div ref={box} className="fixed right-4 z-[90] flex flex-col items-end gap-2 print:hidden" style={{ bottom }}>
        {open && (
          <div className="mb-1 w-[min(92vw,360px)] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <span className="text-sm font-semibold text-slate-900">Notifications</span>
              <span className="flex gap-3 text-xs">
                {unread > 0 && <button type="button" onClick={async () => { await tasksApi.markRead().catch(() => {}); load(); }} className="text-slate-500 hover:text-slate-800">Mark all read</button>}
                <a href={tasksPath} className="font-semibold text-[#025545] hover:underline">All tasks</a>
              </span>
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {(notes || []).map((n) => (
                <button key={n.id} type="button" onClick={() => openNote(n)} className={`flex w-full gap-3 border-b border-slate-50 px-4 py-2.5 text-left hover:bg-slate-50 ${n.read_at ? '' : 'bg-[#025545]/[0.04]'}`}>
                  <span className="mt-0.5 w-5 shrink-0 text-center text-sm">{KIND_ICON[n.kind] || '•'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-slate-900">{n.task?.title || 'Task'}</span>
                    <span className="block text-xs text-slate-500">{n.message} · {fmtWhen(n.created_at)}</span>
                  </span>
                  {!n.read_at && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#025545]" />}
                </button>
              ))}
              {notes && !notes.length && <div className="px-4 py-6 text-center text-sm text-slate-500">You&apos;re all caught up.</div>}
              {!notes && <div className="px-4 py-6 text-center text-sm text-slate-500">Loading…</div>}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={() => setReporting(true)} className={btn} title="Report a problem" aria-label="Report a problem">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
          </button>
          <button type="button" onClick={() => setAdding(true)} className={btn} title="Quick add a task (press T)" aria-label="Quick add a task">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          </button>
          <button type="button" onClick={() => { setOpen((o) => !o); if (!open) load(); }} className={`${btn} relative`} title="Notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
            {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
          </button>
        </div>
      </div>

      {toast && <div className="fixed right-4 z-[95] rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg" style={{ bottom: bottom + 60 }}>{toast}</div>}

      <Modal open={adding} onClose={() => setAdding(false)} title="Quick add a task">
        <TaskForm
          meKey={meKey}
          onCancel={() => setAdding(false)}
          onCreated={() => { setAdding(false); setToast('Task created.'); setTimeout(() => setToast(''), 2500); if (pathname === tasksPath) window.location.reload(); }}
        />
      </Modal>

      <Modal open={reporting} onClose={() => setReporting(false)} title="Report a problem">
        <form onSubmit={sendReport} className="space-y-3">
          <div className="text-sm text-slate-600">This creates a task for the developers with this page&apos;s link.</div>
          <input autoFocus value={report.summary} onChange={(e) => setReport({ ...report, summary: e.target.value })} maxLength={200} placeholder="What went wrong, in one line"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#025545] focus:outline-none focus:ring-2 focus:ring-[#025545]/15" />
          <textarea value={report.details} onChange={(e) => setReport({ ...report, details: e.target.value })} rows={4} placeholder="What did you do, and what did you expect? (no client details)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#025545] focus:outline-none focus:ring-2 focus:ring-[#025545]/15" />
          <div className="flex items-center gap-2">
            <select value={report.priority} onChange={(e) => setReport({ ...report, priority: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="urgent">Blocking my work</option>
              <option value="high">Important</option>
              <option value="normal">Can wait</option>
            </select>
            <button type="submit" disabled={reportState === 'sending' || !report.summary.trim()} className="ml-auto rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {reportState === 'sending' ? 'Sending…' : 'Send'}
            </button>
          </div>
          {reportState && reportState !== 'sending' && <div className="text-sm text-rose-600">{reportState}</div>}
        </form>
      </Modal>
    </>
  );
}
