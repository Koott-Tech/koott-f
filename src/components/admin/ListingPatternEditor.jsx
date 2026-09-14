'use client';

/**
 * Admin: the card order on /book-malayali-psychologists. Each card position is
 * reserved for a group (e.g. A, B, C or A, B, B, C) and shows that group's
 * therapist with the soonest free slot — so the card changes as slots get booked.
 * The pattern repeats down the page; everyone left follows by soonest availability.
 * The home page and condition / CMS pages always list soonest availability first.
 */

import { useEffect, useState } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, Check, LayoutList, Loader2, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/backendApi';

const when = (iso) => (iso
  ? new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
  : 'no free slot in 3 weeks');

const inputCls = 'rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 focus:border-[#025545] focus:outline-none focus:ring-2 focus:ring-[#025545]/15';

export default function ListingPatternEditor({ refreshKey = 0 }) {
  const [groups, setGroups] = useState([]);
  const [ready, setReady] = useState(true);
  const [pattern, setPattern] = useState([]);
  const [repeat, setRepeat] = useState(true);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState({ kind: '', text: '' });
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [g, p] = await Promise.all([adminApi.getTherapistGroups(), adminApi.getListingPattern()]);
      const gd = g?.data ?? g;
      const pd = p?.data ?? p;
      setGroups(gd?.groups || []);
      setReady(gd?.ready !== false);
      setPattern(pd?.pattern || []);
      setRepeat(pd?.repeat !== false);
      setPreview(pd?.preview || null);
      setDirty(false);
    } catch (e) {
      setNote({ kind: 'err', text: e?.message || 'Could not load the booking-page order' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [refreshKey]);

  const change = (next) => { setPattern(next); setDirty(true); setNote({ kind: '', text: '' }); };
  const move = (i, d) => {
    const next = [...pattern];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    change(next);
  };
  const add = () => {
    // Suggest the next group in list order after the last card's group.
    const lastIdx = groups.findIndex((g) => g.id === pattern[pattern.length - 1]);
    const suggestion = groups[(lastIdx + 1) % Math.max(groups.length, 1)]?.id || groups[0]?.id;
    if (suggestion) change([...pattern, suggestion]);
  };

  const save = async () => {
    setSaving(true);
    setNote({ kind: '', text: '' });
    try {
      const r = await adminApi.saveListingPattern(pattern, repeat);
      if (r && r.success === false) throw new Error(r.message || 'Could not save');
      const d = r?.data ?? r;
      setPreview(d?.preview || null);
      setDirty(false);
      setNote({ kind: 'ok', text: d?.message || 'Saved' });
    } catch (e) {
      setNote({ kind: 'err', text: e?.message || 'Could not save' });
    } finally {
      setSaving(false);
    }
  };

  const groupById = new Map(groups.map((g) => [g.id, g]));

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <LayoutList className="mt-0.5 h-5 w-5 text-[#025545]" />
        <div>
          <div className="text-base font-semibold text-gray-900">Booking-page order</div>
          <p className="mt-0.5 max-w-3xl text-xs text-slate-500">
            For <span className="font-medium">/book-malayali-psychologists</span> only. Each card is reserved for a group and
            shows that group&apos;s therapist with the soonest free slot. Groups can repeat (A, B, B, C). The home page and
            condition pages always show the soonest-available therapists first.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div>
            {!ready && (
              <div className="mb-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Groups need the database update (RUN_PENDING.sql) first. Until then the page shows the soonest-available therapists first.
              </div>
            )}
            {ready && groups.length === 0 && <p className="text-sm text-slate-400">Create groups above first.</p>}

            <ol className="space-y-2">
              {pattern.map((gid, i) => (
                <li key={`${i}-${gid}`} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                  <span className="w-14 shrink-0 text-xs font-medium text-slate-500">Card {i + 1}</span>
                  <span className="inline-block h-3 w-3 shrink-0 rounded-full border border-black/10" style={{ background: groupById.get(gid)?.color || '#CBD5E1' }} />
                  <select
                    value={gid}
                    onChange={(e) => change(pattern.map((x, j) => (j === i ? e.target.value : x)))}
                    className={`${inputCls} min-w-0 flex-1`}
                    aria-label={`Group for card ${i + 1}`}
                  >
                    {!groupById.has(gid) && <option value={gid}>(deleted group)</option>}
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1 text-slate-400 hover:bg-gray-100 disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" disabled={i === pattern.length - 1} onClick={() => move(i, 1)} className="rounded p-1 text-slate-400 hover:bg-gray-100 disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => change(pattern.filter((_, j) => j !== i))} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove card"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ol>
            {pattern.length === 0 && ready && groups.length > 0 && (
              <p className="text-sm text-slate-400">No pattern — the page shows the soonest-available therapists first.</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={add}
                disabled={!ready || groups.length === 0}
                className="inline-flex items-center gap-1 text-sm font-medium text-[#025545] hover:underline disabled:opacity-40"
              >
                <Plus className="h-4 w-4" /> Add card
              </button>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={repeat} onChange={(e) => { setRepeat(e.target.checked); setDirty(true); }} />
                Repeat the pattern down the page
              </label>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={!ready || saving || !dirty}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#025545] px-4 py-2 text-sm font-medium text-white hover:bg-[#012f23] disabled:opacity-40"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save order
              </button>
              {note.text && (
                <span className={`inline-flex items-center gap-1 text-sm ${note.kind === 'err' ? 'text-red-600' : 'text-green-700'}`}>
                  {note.kind === 'ok' && <Check className="h-4 w-4" />} {note.text}
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-gray-800">
              What the page shows now{dirty ? ' (save to update)' : ''}
            </div>
            <ol className="max-h-[420px] space-y-1.5 overflow-y-auto rounded-lg border border-gray-100 p-2">
              {(preview?.cards || []).map((c) => (
                <li key={c.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm odd:bg-slate-50">
                  <span className="w-6 shrink-0 text-right text-xs text-slate-400">{c.position}</span>
                  <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.groupColor || '#CBD5E1' }} />
                  <span className="min-w-0 flex-1 truncate text-gray-900">
                    {c.name}
                    <span className="ml-1.5 text-xs text-slate-400">{c.groupName || 'Ungrouped'}{c.fromPattern ? '' : ' · by availability'}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">{when(c.nextAvailableAt)}</span>
                </li>
              ))}
              {!preview?.cards?.length && <li className="px-2 py-4 text-center text-sm text-slate-400">No active therapists.</li>}
            </ol>
            <p className="mt-1.5 text-[11px] text-slate-400">Next free times in IST; refreshed every couple of minutes.</p>
          </div>
        </div>
      )}
    </section>
  );
}
