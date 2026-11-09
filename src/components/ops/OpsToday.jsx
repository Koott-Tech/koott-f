'use client';

/**
 * Operations → Today: today's sessions, leads waiting for a call or due a follow-up,
 * and overdue tasks — the first screen of the day.
 */
import { useEffect, useState } from 'react';
import { leadsApi, staffFetch, tasksApi } from '@/lib/staffApi';
import { fmtDeadline } from '@/components/tasks/taskUi';
import { SOURCE_LABEL } from './LeadsPipeline';

const istToday = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const t12 = (t) => {
  if (!t) return '';
  const [h, m] = String(t).split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const nameOf = (rel) => {
  const r = Array.isArray(rel) ? rel[0] : rel;
  return r ? `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.child_name || '—' : '—';
};

function Card({ title, count, href, linkLabel, children }) {
  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">{title}{count !== undefined && <span className="ml-1.5 text-slate-400">{count}</span>}</div>
        {href && <a href={href} className="text-xs font-semibold text-[#025545] hover:underline">{linkLabel}</a>}
      </div>
      <div className="divide-y divide-slate-50">{children}</div>
    </section>
  );
}

export default function OpsToday({ base = '/operations' }) {
  const [sessions, setSessions] = useState(null);
  const [leads, setLeads] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const today = istToday();
    staffFetch('/admin/sessions/all', { query: { date: today, limit: 100, page: 1 } })
      .then((d) => setSessions((d.sessions || d.data?.sessions || d || []).filter?.((s) => s.scheduled_date === today) || []))
      .catch((e) => { setSessions([]); setErrors((x) => ({ ...x, sessions: e.message })); });
    leadsApi.list({}).then((d) => setLeads(d.leads.filter((l) => l.waitingTooLong || l.followUpDue || l.stage === 'new').slice(0, 12)))
      .catch((e) => { setLeads([]); setErrors((x) => ({ ...x, leads: e.message })); });
    tasksApi.list({ view: 'overdue' }).then((d) => setTasks(d.tasks)).catch((e) => { setTasks([]); setErrors((x) => ({ ...x, tasks: e.message })); });
  }, []);

  const sorted = (sessions || []).slice().sort((a, b) => String(a.scheduled_time).localeCompare(String(b.scheduled_time)));
  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-5">
        <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>Today</div>
        <div className="mt-0.5 text-sm text-slate-500">{dateLabel}</div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Today's sessions" count={sessions?.length} href={`${base}/bookings`} linkLabel="All bookings">
            {!sessions && <div className="px-4 py-6 text-sm text-slate-500">Loading…</div>}
            {errors.sessions && <div className="px-4 py-3 text-sm text-rose-600">{errors.sessions}</div>}
            {sorted.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-20 shrink-0 text-sm font-semibold text-slate-900">{t12(s.scheduled_time)}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-slate-800">{nameOf(s.client)} <span className="text-slate-400">with</span> {nameOf(s.psychologist)}</div>
                  <div className="text-[11px] capitalize text-slate-500">{String(s.status || '').replace(/_/g, ' ')}{s.google_meet_link ? ' · Meet link ready' : ' · no Meet link'}</div>
                </div>
                {s.google_meet_link && <a href={s.google_meet_link} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-[#025545] hover:underline">Meet</a>}
              </div>
            ))}
            {sessions && !sorted.length && !errors.sessions && <div className="px-4 py-6 text-sm text-slate-500">No sessions today.</div>}
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Leads to call" count={leads?.length} href={`${base}/leads`} linkLabel="All leads">
            {!leads && <div className="px-4 py-6 text-sm text-slate-500">Loading…</div>}
            {errors.leads && <div className="px-4 py-3 text-sm text-rose-600">{errors.leads}</div>}
            {(leads || []).map((l) => (
              <a key={l.id} href={`${base}/leads?lead=${l.id}`} className="block px-4 py-2.5 hover:bg-slate-50">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm text-slate-900">{l.name || l.phone || 'Lead'}</span>
                  {l.waitingTooLong ? <span className="shrink-0 text-[10px] font-semibold text-rose-600">2h+ waiting</span>
                    : l.followUpDue ? <span className="shrink-0 text-[10px] font-semibold text-amber-700">follow-up due</span> : null}
                </div>
                <div className="text-[11px] text-slate-500">{SOURCE_LABEL[l.source] || l.source}{l.source_detail ? ` · ${l.source_detail}` : ''}</div>
              </a>
            ))}
            {leads && !leads.length && !errors.leads && <div className="px-4 py-6 text-sm text-slate-500">Nobody waiting. 👍</div>}
          </Card>
          <Card title="Overdue tasks" count={tasks?.length} href={`${base}/tasks`} linkLabel="Tasks">
            {!tasks && <div className="px-4 py-6 text-sm text-slate-500">Loading…</div>}
            {errors.tasks && <div className="px-4 py-3 text-sm text-rose-600">{errors.tasks}</div>}
            {(tasks || []).slice(0, 8).map((t) => (
              <a key={t.id} href={`${base}/tasks?task=${t.id}`} className="block px-4 py-2.5 hover:bg-slate-50">
                <div className="truncate text-sm text-slate-900">{t.title}</div>
                <div className="text-[11px] font-semibold text-rose-600">Due {fmtDeadline(t)} · {t.claimedBy?.name || t.assignee.name}</div>
              </a>
            ))}
            {tasks && !tasks.length && !errors.tasks && <div className="px-4 py-6 text-sm text-slate-500">Nothing overdue.</div>}
          </Card>
        </div>
      </div>
    </div>
  );
}
