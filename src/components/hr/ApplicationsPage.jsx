'use client';

/**
 * HR → Applications: job applications from the careers pages, moved through
 * Applied → Interview → Offer → Hired | Rejected, with notes. Each new application
 * also arrives as a "Review the application" task for the HR team.
 */
import { useCallback, useEffect, useState } from 'react';
import { applicationsApi } from '@/lib/staffApi';
import { Modal, fmtWhen, toInputValue, fromInputValue } from '@/components/tasks/taskUi';

const STAGES = [
  { value: 'applied', label: 'Applied', cls: 'bg-sky-50 text-sky-700' },
  { value: 'interview', label: 'Interview', cls: 'bg-indigo-50 text-indigo-700' },
  { value: 'offer', label: 'Offer', cls: 'bg-amber-50 text-amber-800' },
  { value: 'hired', label: 'Hired', cls: 'bg-emerald-50 text-emerald-700' },
  { value: 'rejected', label: 'Rejected', cls: 'bg-slate-100 text-slate-500' },
];

export default function ApplicationsPage() {
  const [apps, setApps] = useState(null);
  const [err, setErr] = useState('');
  const [stage, setStage] = useState('');
  const [open, setOpen] = useState(null);
  const [notes, setNotes] = useState('');
  const [interviewAt, setInterviewAt] = useState('');
  const [interviewer, setInterviewer] = useState('');

  const load = useCallback(async () => { try { setApps((await applicationsApi.list({ stage: stage || undefined })).applications); setErr(''); } catch (e) { setErr(e.message); } }, [stage]);
  useEffect(() => { load(); }, [load]);

  const update = async (a, patch) => {
    try { const { application } = await applicationsApi.update(a.id, patch); setApps((list) => list.map((x) => (x.id === a.id ? application : x))); setOpen(application); } catch (e) { setErr(e.message); }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4">
        <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>Applications</div>
        <div className="mt-0.5 text-sm text-slate-500">From the careers pages. Move each one along; notes stay with it.</div>
      </div>
      <div className="-mx-4 mb-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {[{ value: '', label: 'All' }, ...STAGES].map((s) => (
          <button key={s.value} type="button" onClick={() => setStage(s.value)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm ${stage === s.value ? 'bg-[#025545] text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>{s.label}</button>
        ))}
      </div>
      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {apps && apps.some((a) => a.interview_at && new Date(a.interview_at) >= new Date(Date.now() - 3600e3)) && (
        <div className="mb-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <div className="mb-2 text-sm font-semibold text-slate-900">Upcoming interviews</div>
          {apps.filter((a) => a.interview_at && new Date(a.interview_at) >= new Date(Date.now() - 3600e3))
            .sort((x, y) => new Date(x.interview_at) - new Date(y.interview_at)).map((a) => (
              <button key={a.id} type="button" onClick={() => { setOpen(a); setNotes(a.notes || ''); setInterviewAt(toInputValue(a.interview_at, true)); setInterviewer(a.interviewer || ''); }}
                className="flex w-full items-center justify-between gap-2 border-b border-slate-50 py-1.5 text-left text-sm last:border-0 hover:bg-slate-50">
                <span className="truncate text-slate-800">{a.name} <span className="text-xs text-slate-400">· {a.career_title}</span></span>
                <span className="shrink-0 text-xs font-semibold text-[#025545]">{fmtWhen(a.interview_at)}{a.interviewer ? ` · ${a.interviewer}` : ''}</span>
              </button>
            ))}
        </div>
      )}
      {!apps ? <div className="text-sm text-slate-500">Loading…</div> : (
        <div className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
          {apps.map((a) => {
            const s = STAGES.find((x) => x.value === a.stage);
            return (
              <button key={a.id} type="button" onClick={() => { setOpen(a); setNotes(a.notes || ''); setInterviewAt(toInputValue(a.interview_at, true)); setInterviewer(a.interviewer || ''); }} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-900">{a.name}</div>
                  <div className="truncate text-xs text-slate-500">{a.career_title || 'Job'} · {fmtWhen(a.created_at)}</div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s?.cls}`}>{s?.label}</span>
              </button>
            );
          })}
          {!apps.length && <div className="p-8 text-center text-sm text-slate-500">No applications yet. They arrive from the job pages on the careers section.</div>}
        </div>
      )}
      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `${open.name} — ${open.career_title || 'Application'}` : ''}>
        {open && (
          <div className="space-y-3 text-sm">
            <div className="space-y-1 text-slate-700">
              <div>Email: <a href={`mailto:${open.email}`} className="text-[#025545] hover:underline">{open.email}</a></div>
              {open.phone && <div>Phone: <a href={`tel:${open.phone}`} className="text-[#025545] hover:underline">{open.phone}</a></div>}
              {open.resume_url && <div><a href={open.resume_url} target="_blank" rel="noreferrer" className="text-[#025545] hover:underline">Open résumé</a></div>}
              {open.linkedin_url && <div><a href={open.linkedin_url} target="_blank" rel="noreferrer" className="text-[#025545] hover:underline">LinkedIn</a></div>}
            </div>
            {open.cover_note && <div className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-slate-700">{open.cover_note}</div>}
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((s) => (
                <button key={s.value} type="button" onClick={() => update(open, { stage: s.value })} className={`rounded-full px-3 py-1 text-xs font-medium ${open.stage === s.value ? 'bg-[#025545] text-white' : s.cls}`}>{s.label}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="text-xs text-slate-500">Interview (date and time)
                <input type="datetime-local" value={interviewAt} onChange={(e) => setInterviewAt(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <label className="text-xs text-slate-500">Interviewer
                <input value={interviewer} onChange={(e) => setInterviewer(e.target.value)} placeholder="Who takes it" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
            </div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Interview notes" className="w-full rounded-lg border border-slate-200 px-3 py-2" />
            <div className="text-xs text-slate-400">Setting an interview time puts an &quot;Interview&quot; task on the HR team&apos;s calendar.</div>
            <div className="flex justify-end"><button type="button" onClick={() => update(open, { notes, interview_at: fromInputValue(interviewAt, true), interviewer })} className="rounded-lg bg-[#025545] px-4 py-2 font-semibold text-white">Save</button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
