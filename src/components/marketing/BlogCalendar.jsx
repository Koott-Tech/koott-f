'use client';

/**
 * Marketing → Blog calendar: planned → drafted → with a therapist → checked → published.
 * Plan a post with a target date; send a draft to a therapist for a clinical check
 * (they get a task and a read-only preview); see everything by stage or by month.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { staffFetch } from '@/lib/staffApi';
import { AssigneePicker, Modal, fmtWhen, usePeople } from '@/components/tasks/taskUi';

const STAGES = [
  { value: 'planned', label: 'Planned', dot: 'bg-slate-400' },
  { value: 'drafted', label: 'Drafted', dot: 'bg-sky-500' },
  { value: 'with_therapist', label: 'With a therapist', dot: 'bg-amber-500' },
  { value: 'checked', label: 'Checked', dot: 'bg-indigo-500' },
  { value: 'published', label: 'Published', dot: 'bg-emerald-500' },
];
const ymd = (iso) => (iso ? new Date(new Date(iso).getTime() + 330 * 60000).toISOString().slice(0, 10) : null);

export default function BlogCalendar() {
  const { people } = usePeople();
  const therapists = people.filter((p) => p.type === 'psychologist');
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  const [view, setView] = useState('board');
  const [planning, setPlanning] = useState(false);
  const [plan, setPlan] = useState({ title: '', date: '', notes: '' });
  const [reviewing, setReviewing] = useState(null);
  const [therapist, setTherapist] = useState('');
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  const load = useCallback(async () => { try { setItems((await staffFetch('/blog-calendar')).items); setErr(''); } catch (e) { setErr(e.message); setItems([]); } }, []);
  useEffect(() => { load(); }, [load]);

  const savePlan = async (e) => {
    e.preventDefault();
    try { await staffFetch('/blog-calendar/plan', { method: 'POST', body: plan }); setPlanning(false); setPlan({ title: '', date: '', notes: '' }); load(); } catch (e2) { setErr(e2.message); }
  };
  const sendReview = async () => {
    try { await staffFetch('/blog-calendar/review', { method: 'POST', body: { blog_id: reviewing.id, therapist } }); setReviewing(null); setTherapist(''); load(); } catch (e) { setErr(e.message); }
  };

  const byStage = useMemo(() => Object.fromEntries(STAGES.map((s) => [s.value, (items || []).filter((i) => i.stage === s.value)])), [items]);
  const days = useMemo(() => {
    const first = new Date(month); const cells = Array(first.getDay()).fill(null);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= last; i += 1) cells.push(new Date(month.getFullYear(), month.getMonth(), i));
    return cells;
  }, [month]);
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const Card = ({ i }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
      <div className="font-medium leading-snug text-slate-900">{i.title}</div>
      <div className="mt-1 text-[11px] text-slate-500">
        {i.stage === 'planned' ? (i.date ? `Target ${fmtWhen(i.date).split(',')[0]}` : 'No date yet')
          : i.stage === 'published' ? `Published ${fmtWhen(i.date).split(',')[0]}`
            : i.reviewer ? `${i.stage === 'checked' ? 'Checked by' : 'With'} ${i.reviewer}` : `Updated ${fmtWhen(i.date).split(',')[0]}`}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {i.kind === 'post' && <a href={`/marketing/blogs/${i.id}/edit`} className="font-semibold text-[#025545] hover:underline">Edit</a>}
        {i.kind === 'post' && ['drafted', 'checked'].includes(i.stage) && <button type="button" onClick={() => setReviewing(i)} className="font-semibold text-[#025545] hover:underline">{i.stage === 'checked' ? 'Check again' : 'Send to a therapist'}</button>}
        {i.kind === 'plan' && <a href="/marketing/blogs/new" className="font-semibold text-[#025545] hover:underline">Write the draft</a>}
        {i.kind === 'plan' && <a href={`/marketing/tasks?task=${i.taskId}`} className="text-slate-500 hover:underline">Task</a>}
        {i.reviewTaskId && <a href={`/marketing/tasks?task=${i.reviewTaskId}`} className="text-slate-500 hover:underline">Review task</a>}
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>Blog calendar</div>
          <div className="mt-0.5 text-sm text-slate-500">Planned → drafted → checked by a therapist → published.</div>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            {[['board', 'Board'], ['month', 'Month']].map(([v, l]) => <button key={v} type="button" onClick={() => setView(v)} className={`rounded-md px-3 py-1.5 text-sm ${view === v ? 'bg-white font-semibold shadow-sm' : 'text-slate-500'}`}>{l}</button>)}
          </div>
          <button type="button" onClick={() => setPlanning(true)} className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white">+ Plan a post</button>
        </div>
      </div>
      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {!items ? <div className="text-sm text-slate-500">Loading…</div> : view === 'board' ? (
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 xl:grid xl:grid-cols-5 xl:overflow-visible">
          {STAGES.map((s) => (
            <div key={s.value} className="w-[78vw] max-w-[300px] shrink-0 snap-start rounded-2xl bg-slate-50 p-2.5 sm:w-64 xl:w-auto xl:max-w-none">
              <div className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold text-slate-700"><span className={`h-2 w-2 rounded-full ${s.dot}`} />{s.label}<span className="text-xs font-normal text-slate-400">{byStage[s.value].length}</span></div>
              <div className="max-h-[70vh] space-y-2 overflow-y-auto">
                {byStage[s.value].map((i) => <Card key={`${i.kind}${i.id}`} i={i} />)}
                {!byStage[s.value].length && <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">Nothing here</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg px-2 py-1 hover:bg-slate-100">‹</button>
            <span className="text-sm font-semibold">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg px-2 py-1 hover:bg-slate-100">›</button>
          </div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-slate-100 text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="bg-slate-50 py-1.5 text-center font-semibold text-slate-500">{d}</div>)}
            {days.map((d, idx) => (
              <div key={idx} className="min-h-[72px] bg-white p-1 sm:min-h-[96px]">
                {d && (
                  <>
                    <div className="mb-1 text-[11px] text-slate-400">{d.getDate()}</div>
                    {(items || []).filter((i) => ymd(i.date) === key(d)).slice(0, 3).map((i) => {
                      const st = STAGES.find((s) => s.value === i.stage);
                      return <div key={`${i.kind}${i.id}`} title={i.title} className="mb-0.5 flex items-center gap-1 truncate rounded bg-slate-50 px-1 py-0.5 text-[10px] sm:text-[11px]"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${st.dot}`} />{i.title}</div>;
                    })}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={planning} onClose={() => setPlanning(false)} title="Plan a post">
        <form onSubmit={savePlan} className="space-y-3">
          <input required value={plan.title} onChange={(e) => setPlan({ ...plan, title: e.target.value })} placeholder="Working title" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <label className="block text-xs text-slate-500">Target publish date<input type="date" value={plan.date} onChange={(e) => setPlan({ ...plan, date: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          <textarea rows={3} value={plan.notes} onChange={(e) => setPlan({ ...plan, notes: e.target.value })} placeholder="Angle, keywords, who writes it" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <div className="flex justify-end"><button type="submit" className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white">Add to the calendar</button></div>
        </form>
      </Modal>
      <Modal open={Boolean(reviewing)} onClose={() => setReviewing(null)} title="Send for a clinical check">
        {reviewing && (
          <div className="space-y-3 text-sm">
            <div className="text-slate-600">&quot;{reviewing.title}&quot; goes to the therapist as a task with a read-only preview. They comment and mark it done.</div>
            <AssigneePicker value={therapist} onChange={setTherapist} people={therapists} teams={[]} allowTeams={false} placeholder="Pick a therapist" />
            <div className="flex justify-end"><button type="button" disabled={!therapist} onClick={sendReview} className="rounded-lg bg-[#025545] px-4 py-2 font-semibold text-white disabled:opacity-40">Send</button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
