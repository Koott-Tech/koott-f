'use client';

/**
 * HR → Onboarding progress: every therapist's onboarding as steps — login, profile with
 * photo and bio, pricing, working hours, Google Calendar, group — worked out from their
 * record. Each missing step links to where it is done, and "Send checklist" gives the
 * therapist the 10-step onboarding task.
 */
import { useCallback, useEffect, useState } from 'react';
import { staffFetch, tasksApi } from '@/lib/staffApi';

const WHERE = {
  login: { label: 'Set a login', href: '/hr/therapists' },
  profile: { label: 'Edit profile', href: '/hr/therapists' },
  pricing: { label: 'Set pricing', href: '/hr/therapists' },
  availability: { label: 'Working hours', href: '/hr/therapists' },
  group: { label: 'Add to a group', href: '/hr/therapist-groups' },
};

export default function TherapistOnboardingPage({ base = '/hr' }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState({});
  const load = useCallback(async () => {
    try { setRows((await staffFetch('/people/therapist-onboarding')).therapists); setErr(''); } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const task = async (t, kind) => {
    try {
      if (kind === 'calendar') {
        await tasksApi.create({
          title: 'Connect your Google Calendar', assignee_type: 'psychologist', assignee_id: t.id, priority: 'high',
          deadline: new Date(Date.now() + 2 * 864e5).toISOString(),
          details: 'Open Settings in your dashboard and click "Connect Google Calendar".',
          link_type: 'url', link_url: '/psychologist/settings', link_label: 'Calendar settings',
        });
      } else {
        await tasksApi.create({
          template_key: 'therapist_onboarding', assignee_type: 'psychologist', assignee_id: t.id,
          title: `Your Koott onboarding, ${t.name.split(' ')[0]}`, deadline: new Date(Date.now() + 14 * 864e5).toISOString(),
        });
      }
      setSent({ ...sent, [`${t.id}:${kind}`]: true });
    } catch (e) { setErr(e.message); }
  };
  const href = (h) => h.replace('/hr', base);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>Therapist onboarding</div>
        </div>
        <a href={href('/hr/therapists')} className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013d31]">+ Add a therapist</a>
      </div>
      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {!rows ? <div className="text-sm text-slate-500">Loading…</div> : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {rows.map((t) => (
            <div key={t.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">{t.name}</div>
                  <div className="truncate text-xs text-slate-500">{t.designation || 'Therapist'} · {t.email}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${t.done === t.total ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{t.done}/{t.total}</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-emerald-500" style={{ width: `${(t.done / t.total) * 100}%` }} />
              </div>
              <ul className="mt-3 space-y-1.5">
                {t.steps.map((s) => (
                  <li key={s.key} className="flex items-center justify-between gap-2 text-sm">
                    <span className={s.done ? 'text-slate-500' : 'text-slate-900'}>{s.done ? '✓' : '○'} {s.label}</span>
                    {!s.done && (s.key === 'calendar'
                      ? (sent[`${t.id}:calendar`] ? <span className="text-xs text-emerald-700">Task sent ✓</span>
                        : <button type="button" onClick={() => task(t, 'calendar')} className="text-xs font-semibold text-[#025545] hover:underline">Ask to connect</button>)
                      : <a href={href(WHERE[s.key].href)} className="text-xs font-semibold text-[#025545] hover:underline">{WHERE[s.key].label}</a>)}
                  </li>
                ))}
              </ul>
              {t.done < t.total && (
                <div className="mt-3 border-t border-slate-100 pt-3 text-xs">
                  {sent[`${t.id}:checklist`] ? <span className="text-emerald-700">Onboarding checklist sent ✓</span>
                    : <button type="button" onClick={() => task(t, 'checklist')} className="font-semibold text-[#025545] hover:underline">Send the 10-step onboarding checklist to {t.name.split(' ')[0]}</button>}
                </div>
              )}
            </div>
          ))}
          {!rows.length && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 lg:col-span-2">No active therapists.</div>}
        </div>
      )}
    </div>
  );
}
