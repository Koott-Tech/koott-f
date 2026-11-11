'use client';

/**
 * Documents: licences, ID, contracts and agreements with expiry dates.
 *   HR / Admin: everyone's documents, upload for anyone, edit, remove.
 *   Everyone else: their own documents (upload a renewed licence here).
 * 30 days before an expiry the person and HR get a "Renew the document" task.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { documentsApi } from '@/lib/staffApi';
import { useAuth } from '@/contexts/AuthContext';
import { AssigneePicker, Modal, usePeople } from '@/components/tasks/taskUi';

const KIND_LABEL = { licence: 'Licence', id_proof: 'ID', contract: 'Contract', agreement: 'Agreement', certificate: 'Certificate', other: 'Other' };
const EXPIRY = { expired: ['Expired', 'bg-rose-50 text-rose-700'], soon: ['Expires soon', 'bg-amber-50 text-amber-800'], ok: ['Valid', 'bg-emerald-50 text-emerald-700'], none: ['No expiry', 'bg-slate-100 text-slate-500'] };
const fmt = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export default function DocumentsPage() {
  const { user } = useAuth();
  const manage = ['hr', 'admin', 'superadmin'].includes(user?.role);
  const meKey = user ? `${user.role === 'psychologist' ? 'psychologist' : 'user'}:${user.id}` : '';
  const { people } = usePeople();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('all');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', kind: 'licence', expires_on: '', person: '' });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { try { setRows((await documentsApi.list()).documents); setErr(''); } catch (e) { setErr(e.message); setRows([]); } }, []);
  useEffect(() => { load(); }, [load]);
  const shown = useMemo(() => (rows || []).filter((d) => filter === 'all' || d.expiry === filter || (filter === 'attention' && ['expired', 'soon'].includes(d.expiry))), [rows, filter]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await documentsApi.create({ ...form, person: manage ? (form.person || meKey) : undefined }, file);
      setAdding(false); setForm({ title: '', kind: 'licence', expires_on: '', person: '' }); setFile(null); load();
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  const open = async (d) => {
    const w = window.open('', '_blank');
    try { const { url } = await documentsApi.open(d.id); if (w) w.location.href = url; } catch (e) { if (w) w.close(); setErr(e.message); }
  };
  const setExpiry = async (d, v) => { try { await documentsApi.update(d.id, { expires_on: v || null }); load(); } catch (e) { setErr(e.message); } };
  const remove = async (d) => { if (!window.confirm(`Remove "${d.title}"?`)) return; try { await documentsApi.remove(d.id); load(); } catch (e) { setErr(e.message); } };
  const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>{manage ? 'Documents' : 'My documents'}</div>
        </div>
        <button type="button" onClick={() => setAdding(true)} className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white">+ Add a document</button>
      </div>
      <div className="-mx-4 mb-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {[['all', 'All'], ['attention', 'Needs attention'], ['expired', 'Expired'], ['soon', 'Expiring in 30 days']].map(([v, l]) => (
          <button key={v} type="button" onClick={() => setFilter(v)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm ${filter === v ? 'bg-[#025545] text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>{l}</button>
        ))}
      </div>
      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {!rows ? <div className="text-sm text-slate-500">Loading…</div> : (
        <div className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
          {shown.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1 basis-56">
                <div className="truncate text-sm font-medium text-slate-900">{d.title} <span className="text-xs font-normal text-slate-400">· {KIND_LABEL[d.kind]}</span></div>
                <div className="truncate text-xs text-slate-500">{manage ? `${d.personName} · ` : ''}{d.file_name || 'no file attached'}</div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${EXPIRY[d.expiry][1]}`}>{EXPIRY[d.expiry][0]}{d.expires_on ? ` · ${fmt(d.expires_on)}` : ''}</span>
              <input type="date" defaultValue={d.expires_on || ''} onChange={(e) => setExpiry(d, e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs" aria-label="Expiry date" />
              {d.file_path && <button type="button" onClick={() => open(d)} className="text-xs font-semibold text-[#025545] hover:underline">Open</button>}
              {manage && <button type="button" onClick={() => remove(d)} className="text-xs text-rose-600 hover:underline">Remove</button>}
            </div>
          ))}
          {!shown.length && <div className="p-8 text-center text-sm text-slate-500">No documents here.</div>}
        </div>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add a document">
        <form onSubmit={save} className="space-y-3">
          {manage && (
            <div className="text-xs text-slate-500">Whose document
              <AssigneePicker value={form.person || meKey} onChange={(k) => setForm({ ...form, person: k })} people={people} teams={[]} allowTeams={false} meKey={meKey} />
            </div>
          )}
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. RCI licence" className={inputCls} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className={inputCls}>
              {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <label className="text-xs text-slate-500">Expires on (optional)<input type="date" value={form.expires_on} onChange={(e) => setForm({ ...form, expires_on: e.target.value })} className={inputCls} /></label>
          </div>
          <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm" />
          <div className="text-xs text-slate-400">PDF, Word or an image, up to 15 MB. Stored privately; opened through a 5-minute link.</div>
          <div className="flex justify-end"><button type="submit" disabled={busy} className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
