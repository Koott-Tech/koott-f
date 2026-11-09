'use client';

/**
 * Operations → Leads: every kind of lead in one list, tagged with its source, moved
 * through five stages: New → Contacted → Follow-up → Converted | Lost.
 * Board on laptops (one column per stage), a list on phones. Opening a lead shows
 * call / WhatsApp, owner, notes, next follow-up, lost reason and "Convert to client".
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { leadsApi } from '@/lib/staffApi';
import { AssigneePicker, Modal, TaskForm, fmtWhen, toInputValue, fromInputValue, usePeople } from '@/components/tasks/taskUi';
import { useAuth } from '@/contexts/AuthContext';

export const STAGES = [
  { value: 'new', label: 'New', tone: 'bg-sky-500' },
  { value: 'contacted', label: 'Contacted', tone: 'bg-indigo-500' },
  { value: 'follow_up', label: 'Follow-up', tone: 'bg-amber-500' },
  { value: 'converted', label: 'Converted', tone: 'bg-emerald-500' },
  { value: 'lost', label: 'Lost', tone: 'bg-slate-400' },
];
export const SOURCE_LABEL = {
  booking: 'Booking form', contact: 'Contact form', event: 'Event', assessment: 'Assessment', ad: 'Ad',
  manual: 'Added by hand', phone: 'Phone call', whatsapp: 'WhatsApp', referral: 'Referral', newsletter: 'Newsletter',
};
const LOST_REASONS = ['Not interested', 'Price', 'Wanted in-person', 'Chose another provider', 'Stopped replying', 'Wrong number', 'Not the right fit'];
const waLink = (phone) => `https://wa.me/${String(phone || '').replace(/\D/g, '')}`;
const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  if (m < 48 * 60) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

function LeadCard({ lead, onOpen, draggable }) {
  return (
    <button type="button" draggable={draggable} onDragStart={(e) => e.dataTransfer.setData('text/lead', lead.id)} onClick={() => onOpen(lead)}
      className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-slate-300">
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-sm font-medium text-slate-900">{lead.name || lead.phone || lead.email || 'Lead'}</span>
        <span className="shrink-0 text-[11px] text-slate-400">{ago(lead.created_at)}</span>
      </div>
      <div className="mt-1 text-[11px] text-slate-500">{SOURCE_LABEL[lead.source] || lead.source}{lead.source_detail ? ` · ${lead.source_detail}` : ''}</div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {lead.waitingTooLong && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">Not contacted 2h+</span>}
        {lead.followUpDue && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Follow-up due</span>}
        {lead.ownerName && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{lead.ownerName}</span>}
      </div>
    </button>
  );
}

function LeadPanel({ lead, onClose, onSaved, meKey }) {
  const { people } = usePeople();
  const [form, setForm] = useState({ ...lead });
  const [lostReason, setLostReason] = useState(lead.lost_reason || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [tasking, setTasking] = useState(false);
  useEffect(() => { setForm({ ...lead }); setLostReason(lead.lost_reason || ''); }, [lead]);

  const save = async (patch) => {
    setBusy(true); setErr(''); setMsg('');
    try { const { lead: l } = await leadsApi.update(lead.id, patch); onSaved(l); setMsg('Saved.'); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const convert = async () => {
    if (!window.confirm('Convert this lead to a client? An existing client with the same phone or email is linked; otherwise a client login is created.')) return;
    setBusy(true); setErr('');
    try {
      const r = await leadsApi.convert(lead.id);
      onSaved(r.lead);
      setMsg(r.created ? 'Converted — a new client login was created.' : 'Converted — linked to the existing client.');
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#025545] focus:outline-none focus:ring-2 focus:ring-[#025545]/15';
  const closed = ['converted', 'lost'].includes(lead.stage);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} aria-hidden />
      <aside className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <div className="text-lg font-semibold text-slate-900">{lead.name || 'Lead'}</div>
            <div className="text-xs text-slate-500">{SOURCE_LABEL[lead.source] || lead.source}{lead.source_detail ? ` · ${lead.source_detail}` : ''} · arrived {fmtWhen(lead.created_at)}</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">✕</button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {lead.phone && <a href={`tel:${lead.phone}`} className="rounded-lg bg-[#025545] px-3 py-1.5 text-sm font-semibold text-white">Call</a>}
          {lead.phone && <a href={waLink(lead.phone)} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white">WhatsApp</a>}
          {lead.email && <a href={`mailto:${lead.email}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700">Email</a>}
          <button type="button" onClick={() => setTasking(true)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700">+ Task</button>
        </div>

        <div className="mb-4">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Stage</div>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.filter((s) => s.value !== 'converted').map((s) => (
              <button key={s.value} type="button" disabled={busy || lead.stage === 'converted'}
                onClick={() => { if (s.value === 'lost') { if (!lostReason) { setErr('Pick why the lead was lost first.'); return; } save({ stage: 'lost', lost_reason: lostReason }); } else save({ stage: s.value }); }}
                className={`rounded-full px-3 py-1 text-xs font-medium ${lead.stage === s.value ? 'bg-[#025545] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} disabled:opacity-50`}>
                {s.label}
              </button>
            ))}
            {lead.stage === 'converted' && <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white">Converted {lead.converted_at ? `· ${fmtWhen(lead.converted_at)}` : ''}</span>}
          </div>
          {lead.stage !== 'converted' && (
            <div className="mt-2">
              <select value={lostReason} onChange={(e) => setLostReason(e.target.value)} className={`${inputCls} text-xs`}>
                <option value="">If lost — why? (helps Marketing)</option>
                {LOST_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs text-slate-500">Name<input className={inputCls} value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="text-xs text-slate-500">Phone<input className={inputCls} value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label className="text-xs text-slate-500 sm:col-span-2">Email<input className={inputCls} value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <div className="text-xs text-slate-500">Owner
            <AssigneePicker value={lead.owner_id ? `${lead.owner_type}:${lead.owner_id}` : ''} onChange={(k) => save({ owner: k })} people={people} teams={[]} meKey={meKey} allowTeams={false} placeholder="Nobody yet" compact />
          </div>
          <label className="text-xs text-slate-500">Next follow-up
            <input type="datetime-local" className={inputCls} value={toInputValue(lead.next_follow_up_at, true)} onChange={(e) => save({ next_follow_up_at: fromInputValue(e.target.value, true) })} />
          </label>
          <label className="text-xs text-slate-500 sm:col-span-2">Notes
            <textarea rows={4} className={inputCls} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What they asked for, when to call back — no clinical details" />
          </label>
        </div>
        {lead.meta?.message && <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><span className="text-xs font-semibold text-slate-500">Their message: </span>{lead.meta.message}</div>}
        {lead.therapistName && <div className="mt-2 text-xs text-slate-500">Was booking with <strong>{lead.therapistName}</strong></div>}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" disabled={busy} onClick={() => save({ name: form.name, phone: form.phone, email: form.email, notes: form.notes })} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">Save details</button>
          {!closed && <button type="button" disabled={busy} onClick={convert} className="ml-auto rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Convert to client</button>}
        </div>
        {msg && <div className="mt-2 text-sm text-emerald-700">{msg}</div>}
        {err && <div className="mt-2 text-sm text-rose-600">{err}</div>}
        {lead.client_id && <div className="mt-3 text-xs text-slate-500">Client record linked. Open it from Clients.</div>}
      </aside>
      <Modal open={tasking} onClose={() => setTasking(false)} title="Task about this lead">
        <TaskForm meKey={meKey} preset={{ title: `Call back ${lead.name || 'lead'}`, link_type: 'lead', link_id: lead.id, link_label: lead.name || 'Lead' }}
          onCancel={() => setTasking(false)} onCreated={() => { setTasking(false); setMsg('Task created.'); }} />
      </Modal>
    </div>
  );
}

export default function LeadsPipeline() {
  const { user } = useAuth();
  const meKey = user ? `${user.role === 'psychologist' ? 'psychologist' : 'user'}:${user.id}` : null;
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [source, setSource] = useState('');
  const [mine, setMine] = useState(false);
  const [due, setDue] = useState(false);
  const [open, setOpen] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', source: 'phone', notes: '' });
  const [over, setOver] = useState(null);
  const [showClosed, setShowClosed] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await leadsApi.list({ q: q || undefined, source: source || undefined, owner: mine ? 'me' : undefined, due: due ? '1' : undefined }));
      setErr('');
    } catch (e) { setErr(e.message); }
  }, [q, source, mine, due]);
  useEffect(() => { const t = setTimeout(load, q ? 250 : 0); return () => clearTimeout(t); }, [load, q]);
  useEffect(() => { const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);
  useEffect(() => {
    if (!data) return;
    try { const id = new URLSearchParams(window.location.search).get('lead'); if (id && !open) { const l = data.leads.find((x) => x.id === id); if (l) setOpen(l); } } catch (_) { /* ignore */ }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const leads = data?.leads || [];
  const replace = (l) => { setData((d) => ({ ...d, leads: d.leads.map((x) => (x.id === l.id ? l : x)) })); setOpen(l); };
  const move = async (id, stage) => {
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.stage === stage) return;
    if (stage === 'converted' || stage === 'lost') { setOpen(lead); return; } // need the convert step / a reason
    try { const { lead: l } = await leadsApi.update(id, { stage }); setData((d) => ({ ...d, leads: d.leads.map((x) => (x.id === l.id ? l : x)) })); } catch (e) { setErr(e.message); }
  };
  const addLead = async (e) => {
    e.preventDefault();
    try { await leadsApi.create(newLead); setAdding(false); setNewLead({ name: '', phone: '', email: '', source: 'phone', notes: '' }); load(); } catch (e2) { setErr(e2.message); }
  };
  const visibleStages = showClosed ? STAGES : STAGES.filter((s) => !['converted', 'lost'].includes(s.value));
  const byStage = useMemo(() => Object.fromEntries(STAGES.map((s) => [s.value, leads.filter((l) => l.stage === s.value)])), [leads]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>Leads</div>
          <div className="mt-0.5 text-sm text-slate-500">Every lead from the booking form, contact form, events and ads — call, follow up, convert.</div>
        </div>
        <button type="button" onClick={() => setAdding(true)} className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white hover:bg-[#013d31]">+ Add lead</button>
      </div>

      {data && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {STAGES.map((s) => (
            <div key={s.value} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className={`h-2 w-2 rounded-full ${s.tone}`} />{s.label}</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{data.counts.byStage[s.value] || 0}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone or email" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:max-w-xs" />
        <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="">All sources</option>
          {Object.entries(SOURCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}{data?.counts.bySource[k] ? ` (${data.counts.bySource[k]})` : ''}</option>)}
        </select>
        <label className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Mine</label>
        <label className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200"><input type="checkbox" checked={due} onChange={(e) => setDue(e.target.checked)} /> Follow-up due</label>
        <label className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200"><input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} /> Show converted &amp; lost</label>
      </div>

      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {!data ? <div className="text-sm text-slate-500">Loading…</div> : (
        <>
          {/* Laptop: board */}
          <div className={`hidden gap-3 lg:grid ${showClosed ? 'lg:grid-cols-5' : 'lg:grid-cols-3'}`}>
            {visibleStages.map((s) => (
              <div key={s.value} onDragOver={(e) => { e.preventDefault(); setOver(s.value); }} onDragLeave={() => setOver(null)}
                onDrop={(e) => { e.preventDefault(); setOver(null); move(e.dataTransfer.getData('text/lead'), s.value); }}
                className={`rounded-2xl p-2.5 ${over === s.value ? 'bg-[#025545]/10' : 'bg-slate-100/70'}`}>
                <div className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold text-slate-700"><span className={`h-2 w-2 rounded-full ${s.tone}`} />{s.label}<span className="text-xs font-normal text-slate-400">{byStage[s.value].length}</span></div>
                <div className="max-h-[70vh] space-y-2 overflow-y-auto">
                  {byStage[s.value].map((l) => <LeadCard key={l.id} lead={l} onOpen={setOpen} draggable />)}
                  {!byStage[s.value].length && <div className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">No leads</div>}
                </div>
              </div>
            ))}
          </div>
          {/* Phone / tablet: list grouped by stage */}
          <div className="space-y-4 lg:hidden">
            {visibleStages.map((s) => (byStage[s.value].length ? (
              <div key={s.value}>
                <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700"><span className={`h-2 w-2 rounded-full ${s.tone}`} />{s.label} <span className="text-xs font-normal text-slate-400">{byStage[s.value].length}</span></div>
                <div className="space-y-2">{byStage[s.value].map((l) => <LeadCard key={l.id} lead={l} onOpen={setOpen} />)}</div>
              </div>
            ) : null))}
            {!leads.length && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No leads match.</div>}
          </div>
        </>
      )}

      {open && <LeadPanel lead={open} meKey={meKey} onClose={() => setOpen(null)} onSaved={replace} />}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add a lead">
        <form onSubmit={addLead} className="space-y-3">
          {['name', 'phone', 'email'].map((f) => (
            <input key={f} value={newLead[f]} onChange={(e) => setNewLead({ ...newLead, [f]: e.target.value })} placeholder={f[0].toUpperCase() + f.slice(1)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" type={f === 'email' ? 'email' : 'text'} />
          ))}
          <select value={newLead.source} onChange={(e) => setNewLead({ ...newLead, source: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            {['phone', 'whatsapp', 'referral', 'ad', 'event', 'manual'].map((k) => <option key={k} value={k}>{SOURCE_LABEL[k]}</option>)}
          </select>
          <textarea value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} rows={3} placeholder="Notes" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <div className="flex justify-end"><button type="submit" className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white">Add lead</button></div>
        </form>
      </Modal>
    </div>
  );
}
