'use client';

/**
 * Training (therapists and staff): the courses published for you, lesson by lesson —
 * read, watch, open the resource, mark done. HR sees your progress.
 */
import { useCallback, useEffect, useState } from 'react';
import { staffFetch } from '@/lib/staffApi';

export default function TrainingPage() {
  const [courses, setCourses] = useState(null);
  const [err, setErr] = useState('');
  const [openCourse, setOpenCourse] = useState(null);
  const [lessonIdx, setLessonIdx] = useState(0);

  const load = useCallback(async () => {
    try { setCourses((await staffFetch('/training', { query: { mine: '1' } })).courses); setErr(''); } catch (e) { setErr(e.message); setCourses([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const course = courses?.find((c) => c.id === openCourse);
  const lesson = course?.lessons[lessonIdx];
  const toggle = async (l) => {
    try {
      await staffFetch(`/training/lessons/${l.id}/complete`, { method: l.completedAt ? 'DELETE' : 'POST' });
      await load();
      if (!l.completedAt && course && lessonIdx < course.lessons.length - 1) setLessonIdx(lessonIdx + 1);
    } catch (e) { setErr(e.message); }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4">
        <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>Training</div>
        <div className="mt-0.5 text-sm text-slate-500">Courses from Koott HR. Your progress is saved as you go.</div>
      </div>
      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {!courses ? <div className="text-sm text-slate-500">Loading…</div> : !course ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {courses.map((c) => (
            <button key={c.id} type="button" onClick={() => { setOpenCourse(c.id); setLessonIdx(Math.max(0, c.lessons.findIndex((l) => !l.completedAt))); }}
              className="rounded-2xl bg-white p-4 text-left ring-1 ring-slate-200 hover:ring-[#025545]/40">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">{c.title}</div>
                {c.required && <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Required</span>}
              </div>
              {c.description && <div className="mt-1 line-clamp-2 text-xs text-slate-500">{c.description}</div>}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500" style={{ width: `${c.total ? (c.done / c.total) * 100 : 0}%` }} /></div>
              <div className="mt-1 text-xs text-slate-500">{c.done}/{c.total} lessons{c.total && c.done === c.total ? ' · finished ✓' : ''}</div>
            </button>
          ))}
          {!courses.length && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 md:col-span-2">No courses for you yet.</div>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
          <div>
            <button type="button" onClick={() => setOpenCourse(null)} className="mb-2 text-sm text-[#025545] hover:underline">‹ All courses</button>
            <div className="mb-2 text-sm font-semibold text-slate-900">{course.title}</div>
            <ol className="space-y-1">
              {course.lessons.map((l, i) => (
                <li key={l.id}>
                  <button type="button" onClick={() => setLessonIdx(i)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm ${i === lessonIdx ? 'bg-[#025545]/10 font-medium text-[#025545]' : 'text-slate-700 hover:bg-slate-50'}`}>
                    <span className="w-4 shrink-0 text-center">{l.completedAt ? '✓' : i + 1}</span><span className="truncate">{l.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          {lesson ? (
            <article className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <div className="text-lg font-semibold text-slate-900">{lesson.title}</div>
              {lesson.body && <div className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800">{lesson.body}</div>}
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {lesson.video_url && <a href={lesson.video_url} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white">▶ Watch the video</a>}
                {lesson.resource_url && <a href={lesson.resource_url} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700">Open the resource</a>}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                <button type="button" disabled={lessonIdx === 0} onClick={() => setLessonIdx(lessonIdx - 1)} className="text-sm text-slate-500 disabled:opacity-30">‹ Previous</button>
                <button type="button" onClick={() => toggle(lesson)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${lesson.completedAt ? 'border border-slate-200 text-slate-600' : 'bg-emerald-600 text-white'}`}>
                  {lesson.completedAt ? 'Done ✓ (undo)' : 'Mark as done'}
                </button>
              </div>
            </article>
          ) : <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">This course has no lessons yet.</div>}
        </div>
      )}
    </div>
  );
}
