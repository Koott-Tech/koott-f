'use client';

/**
 * HR → Calendar sync: every therapist's Google Calendar connection, with a one-click
 * "Ask to reconnect" task. (The therapist connects from Settings in their dashboard;
 * a broken sync also creates that task automatically.)
 */
import { useEffect, useState } from 'react';
import { peopleApi, tasksApi } from '@/lib/staffApi';

const STATE = {
  connected: { label: 'Connected', cls: 'bg-emerald-50 text-emerald-700' },
  needs_reconnect: { label: 'Needs reconnecting', cls: 'bg-rose-50 text-rose-700' },
  not_connected: { label: 'Not connected', cls: 'bg-slate-100 text-slate-600' },
};

export default function CalendarSyncPage() {
  const [people, setPeople] = useState(null);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState({});
  useEffect(() => { peopleApi.list().then((d) => setPeople(d.people.filter((p) => p.type === 'psychologist' && p.active))).catch((e) => setErr(e.message)); }, []);

  const ask = async (p) => {
    try {
      await tasksApi.create({
        title: p.calendar === 'not_connected' ? 'Connect your Google Calendar' : 'Reconnect your Google Calendar',
        assignee_type: 'psychologist', assignee_id: p.id, priority: 'high',
        deadline: new Date(Date.now() + 2 * 864e5).toISOString(),
        details: 'Open Settings in your dashboard and click "Connect Google Calendar". Your sessions then appear in your calendar with their Meet links.',
        link_type: 'url', link_url: '/psychologist/settings', link_label: 'Calendar settings',
      });
      setSent({ ...sent, [p.key]: true });
    } catch (e) { setErr(e.message); }
  };
  const counts = (people || []).reduce((a, p) => ({ ...a, [p.calendar]: (a[p.calendar] || 0) + 1 }), {});

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4">
        <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>Calendar sync</div>
        <div className="mt-0.5 text-sm text-slate-500">Therapists whose Google Calendar is connected get every session (with its Meet link) in their own calendar.</div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(STATE).map(([k, s]) => <span key={k} className={`rounded-full px-3 py-1 text-xs font-medium ${s.cls}`}>{s.label}: {counts[k] || 0}</span>)}
      </div>
      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {!people ? <div className="text-sm text-slate-500">Loading…</div> : (
        <div className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
          {people.sort((a, b) => (a.calendar === 'connected') - (b.calendar === 'connected') || a.name.localeCompare(b.name)).map((p) => (
            <div key={p.key} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-900">{p.name}</div>
                <div className="truncate text-xs text-slate-500">{p.jobTitle || 'Therapist'} · {p.email}</div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATE[p.calendar].cls}`}>{STATE[p.calendar].label}</span>
              {p.calendar !== 'connected' && (
                sent[p.key]
                  ? <span className="text-xs text-emerald-700">Task sent ✓</span>
                  : <button type="button" onClick={() => ask(p)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Ask to {p.calendar === 'not_connected' ? 'connect' : 'reconnect'}</button>
              )}
            </div>
          ))}
          {!people.length && <div className="p-6 text-center text-sm text-slate-500">No active therapists.</div>}
        </div>
      )}
    </div>
  );
}
