'use client';

/**
 * HR → Training: build courses (for therapists, staff or everyone), add lessons (text,
 * a video link, a resource link), publish, mark required (everyone in the audience gets a
 * "Finish the training" task), and see each person's progress.
 */
import { useCallback, useEffect, useState } from 'react';
import { staffFetch } from '@/lib/staffApi';
import { Modal } from '@/components/tasks/taskUi';

const AUD = { therapists: 'Therapists', staff: 'Staff', all: 'Everyone' };

export default function TrainingAdmin() {
  const [tab, setTab] = useState('courses');
  const [courses, setCourses] = useState(null);
  const [progress, setProgress] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState(null);
  const [lessonFor, setLessonFor] = useState(null);
  const [lesson, setLesson] = useState({ title: '', body: '', video_url: '', resource_url: '' });

  const load = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([staffFetch('/training'), staffFetch('/training/progress')]);
      setCourses(c.courses); setProgress(p); setErr('');
    } catch (e) { setErr(e.message); setCourses([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const saveCourse = async () => {
    try {
      if (editing.id) await staffFetch(`/training/courses/${editing.id}`, { method: 'PATCH', body: editing });
      else await staffFetch('/training/courses', { method: 'POST', body: editing });
      setEditing(null); load();
    } catch (e) { setErr(e.message); }
  };
  const publish = async (c, on) => {
    try {
      const r = await staffFetch(`/training/courses/${c.id}`, { method: 'PATCH', body: { is_published: on } });
      setMsg(on ? `Published${r.assigned ? ` — ${r.assigned} people got a "Finish the training" task` : ''}.` : 'Unpublished.'); load();
    } catch (e) { setErr(e.message); }
  };
  const addLesson = async (e) => {
    e.preventDefault();
    try { await staffFetch(`/training/courses/${lessonFor.id}/lessons`, { method: 'POST', body: lesson }); setLessonFor(null); setLesson({ title: '', body: '', video_url: '', resource_url: '' }); load(); } catch (e2) { setErr(e2.message); }
  };
  const removeLesson = async (l) => { if (!window.confirm(`Remove "${l.title}"?`)) return; try { await staffFetch(`/training/lessons/${l.id}`, { method: 'DELETE' }); load(); } catch (e) { setErr(e.message); } };
  const removeCourse = async (c) => { if (!window.confirm(`Delete the course "${c.title}" and its lessons?`)) return; try { await staffFetch(`/training/courses/${c.id}`, { method: 'DELETE' }); load(); } catch (e) { setErr(e.message); } };
  const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>Training</div>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            {[['courses', 'Courses'], ['progress', 'Progress']].map(([v, l]) => <button key={v} type="button" onClick={() => setTab(v)} className={`rounded-md px-3 py-1.5 text-sm ${tab === v ? 'bg-white font-semibold shadow-sm' : 'text-slate-500'}`}>{l}</button>)}
          </div>
          <button type="button" onClick={() => setEditing({ title: '', description: '', audience: 'therapists', required: false })} className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white">+ New course</button>
        </div>
      </div>
      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {msg && <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</div>}
      {!courses ? <div className="text-sm text-slate-500">Loading…</div> : tab === 'courses' ? (
        <div className="space-y-3">
          {courses.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{c.title} <span className="ml-1 text-xs font-normal text-slate-400">· {AUD[c.audience]}{c.required ? ' · required' : ''}</span></div>
                  {c.description && <div className="text-xs text-slate-500">{c.description}</div>}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${c.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{c.is_published ? 'Published' : 'Draft'}</span>
                  <button type="button" onClick={() => publish(c, !c.is_published)} className="font-semibold text-[#025545] hover:underline">{c.is_published ? 'Unpublish' : 'Publish'}</button>
                  <button type="button" onClick={() => setEditing({ id: c.id, title: c.title, description: c.description || '', audience: c.audience, required: c.required })} className="text-slate-600 hover:underline">Edit</button>
                  <button type="button" onClick={() => removeCourse(c)} className="text-rose-600 hover:underline">Delete</button>
                </div>
              </div>
              <ol className="mt-3 space-y-1">
                {c.lessons.map((l, i) => (
                  <li key={l.id} className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-sm hover:bg-slate-50">
                    <span className="truncate text-slate-800">{i + 1}. {l.title}{l.video_url ? ' ▶' : ''}{l.resource_url ? ' 📎' : ''}</span>
                    <button type="button" onClick={() => removeLesson(l)} className="text-xs text-slate-300 hover:text-rose-600 group-hover:text-slate-400">✕</button>
                  </li>
                ))}
              </ol>
              <button type="button" onClick={() => setLessonFor(c)} className="mt-2 text-xs font-semibold text-[#025545] hover:underline">+ Add a lesson</button>
            </div>
          ))}
          {!courses.length && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No courses yet.</div>}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-2">Person</th>{(progress?.courses || []).map((c) => <th key={c.id} className="px-3 py-2">{c.title}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(progress?.people || []).map((p) => (
                <tr key={p.key}>
                  <td className="px-4 py-2"><div className="font-medium text-slate-900">{p.name}</div><div className="text-xs text-slate-400">{p.roleLabel}</div></td>
                  {(progress?.courses || []).map((c) => {
                    const r = p.courses.find((x) => x.id === c.id);
                    return <td key={c.id} className="px-3 py-2 text-xs">{!r ? <span className="text-slate-300">—</span> : r.total && r.done === r.total ? <span className="font-semibold text-emerald-700">Finished</span> : `${r.done}/${r.total}`}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {!(progress?.courses || []).length && <div className="p-8 text-center text-sm text-slate-500">Publish a course to see progress.</div>}
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Edit course' : 'New course'}>
        {editing && (
          <div className="space-y-3">
            <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="e.g. Therapist induction" className={inputCls} />
            <textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="What it covers" className={inputCls} />
            <select value={editing.audience} onChange={(e) => setEditing({ ...editing, audience: e.target.value })} className={inputCls}>
              {Object.entries(AUD).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={editing.required} onChange={(e) => setEditing({ ...editing, required: e.target.checked })} /> Required — give everyone in this group a task to finish it when published</label>
            <div className="flex justify-end"><button type="button" disabled={!editing.title.trim()} onClick={saveCourse} className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Save</button></div>
          </div>
        )}
      </Modal>
      <Modal open={Boolean(lessonFor)} onClose={() => setLessonFor(null)} title={lessonFor ? `Add a lesson to ${lessonFor.title}` : ''}>
        <form onSubmit={addLesson} className="space-y-3">
          <input required value={lesson.title} onChange={(e) => setLesson({ ...lesson, title: e.target.value })} placeholder="Lesson title" className={inputCls} />
          <textarea rows={6} value={lesson.body} onChange={(e) => setLesson({ ...lesson, body: e.target.value })} placeholder="What to read" className={inputCls} />
          <input type="url" value={lesson.video_url} onChange={(e) => setLesson({ ...lesson, video_url: e.target.value })} placeholder="Video link (YouTube, Drive…) — optional" className={inputCls} />
          <input type="url" value={lesson.resource_url} onChange={(e) => setLesson({ ...lesson, resource_url: e.target.value })} placeholder="Resource link (PDF, doc) — optional" className={inputCls} />
          <div className="flex justify-end"><button type="submit" className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white">Add lesson</button></div>
        </form>
      </Modal>
    </div>
  );
}
