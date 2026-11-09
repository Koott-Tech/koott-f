'use client';

/**
 * Therapist → a blog post Marketing asked them to check for clinical accuracy.
 * Read-only preview; comments go on the task, then the therapist marks it done.
 */
import { useEffect, useState } from 'react';
import { staffFetch, tasksApi } from '@/lib/staffApi';

// The post is staff-written HTML/markdown: shown as plain paragraphs here (no markup run).
const toParagraphs = (html) => String(html || '')
  .replace(/<\s*(br|\/p|\/h\d|\/li)\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .split(/\n{1,}/).map((p) => p.replace(/^#+\s*/, '').trim()).filter(Boolean);

export default function BlogReview() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [comment, setComment] = useState('');
  const [state, setState] = useState('');
  const taskId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('task') : null;

  useEffect(() => {
    if (!taskId) { setErr('Open this from your task.'); return; }
    staffFetch(`/blog-calendar/review/${taskId}`).then(setData).catch((e) => setErr(e.message));
  }, [taskId]);

  const finish = async (done) => {
    setState('saving');
    try {
      if (comment.trim()) await tasksApi.comment(taskId, comment.trim(), []);
      if (done) await tasksApi.update(taskId, { status: 'done' });
      setState(done ? 'done' : 'commented'); setComment('');
    } catch (e) { setState(e.message); }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Clinical check</div>
      {err && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {!data && !err && <div className="text-sm text-slate-500">Loading…</div>}
      {data && (
        <>
          <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>{data.blog.title}</div>
          {data.blog.excerpt && <div className="mt-2 text-sm text-slate-600">{data.blog.excerpt}</div>}
          <article className="mt-5 space-y-3 rounded-2xl bg-white p-5 text-[15px] leading-relaxed text-slate-800 ring-1 ring-slate-200">
            {toParagraphs(data.blog.content).map((p, i) => <div key={i}>{p}</div>)}
          </article>
          <div className="mt-5 space-y-2 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="text-sm font-semibold text-slate-900">Your notes for Marketing</div>
            <textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Anything clinically wrong, missing or unclear — quote the line." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" disabled={!comment.trim() || state === 'saving'} onClick={() => finish(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:opacity-40">Send notes</button>
              <button type="button" disabled={state === 'saving' || data.task.status === 'done' || state === 'done'} onClick={() => finish(true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Checked — mark done</button>
            </div>
            {state === 'done' && <div className="text-sm text-emerald-700">Thanks — Marketing can see it&apos;s checked.</div>}
            {state === 'commented' && <div className="text-sm text-emerald-700">Notes sent on the task.</div>}
            {state && !['saving', 'done', 'commented'].includes(state) && <div className="text-sm text-rose-600">{state}</div>}
          </div>
        </>
      )}
    </div>
  );
}
