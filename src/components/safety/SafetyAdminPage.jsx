'use client';

/**
 * Admin → Safety alerts: who the clinical lead is (alerts are emailed to them at once),
 * and every urgent safety concern with Acknowledge / Close. The clinical lead sees
 * this page from their own login too.
 */
import { useCallback, useEffect, useState } from 'react';
import { safetyApi } from '@/lib/staffApi';
import { AssigneePicker, fmtWhen, usePeople } from '@/components/tasks/taskUi';

const TONE = { open: 'bg-rose-50 text-rose-700', acknowledged: 'bg-amber-50 text-amber-800', closed: 'bg-slate-100 text-slate-500' };

export default function SafetyAdminPage() {
  const { people } = usePeople();
  const [lead, setLead] = useState(undefined);
  const [pick, setPick] = useState('');
  const [backup, setBackup] = useState('');
  const [phone, setPhone] = useState('');
  const [alerts, setAlerts] = useState(null);
  const [canAct, setCanAct] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const [l, a] = await Promise.all([safetyApi.lead(), safetyApi.list()]);
      setLead(l.lead); setPick(l.lead?.key || ''); setBackup(l.lead?.backupEmail || ''); setPhone(l.lead?.phone || '');
      setAlerts(a.alerts); setCanAct(a.canAct); setErr('');
    } catch (e) { setErr(e.message); setAlerts([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const saveLead = async () => {
    try { await safetyApi.setLead({ person: pick, backup_email: backup || undefined, phone: phone || undefined }); setMsg('Clinical lead saved.'); load(); } catch (e) { setErr(e.message); }
  };
  const act = async (a, status) => {
    const note = status === 'closed' ? window.prompt('Closing note (what was done)') : undefined;
    try { await safetyApi.update(a.id, { status, note }); load(); } catch (e) { setErr(e.message); }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:py-8">
      <div className="mb-4">
        <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>Safety alerts</div>
        <div className="mt-0.5 text-sm text-slate-500">Urgent safety concerns from therapists go straight to the clinical lead — never into the task queue.</div>
      </div>
      {err && <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

      <div className="mb-5 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="text-sm font-semibold text-slate-900">Clinical lead</div>
        <div className="mb-3 text-xs text-slate-500">{lead === undefined ? 'Loading…' : lead ? <>Alerts are emailed to <strong>{lead.name || lead.email}</strong>{lead.backupEmail ? <> and {lead.backupEmail}</> : ''}.</> : <span className="font-semibold text-rose-600">Not set — alerts go only to the Koott admin address until you pick someone.</span>}</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <AssigneePicker value={pick} onChange={setPick} people={people} teams={[]} allowTeams={false} placeholder="Pick the clinical lead" />
          <input value={backup} onChange={(e) => setBackup(e.target.value)} placeholder="Backup email (optional)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Lead's mobile for WhatsApp (optional)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2" />
          <button type="button" disabled={!pick} onClick={saveLead} className="rounded-lg bg-[#025545] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Save</button>
        </div>
        {msg && <div className="mt-2 text-xs text-emerald-700">{msg}</div>}
      </div>

      {!alerts ? <div className="text-sm text-slate-500">Loading…</div> : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">{a.raisedBy}{a.client_ref ? ` · client ${a.client_ref}` : ''}</div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONE[a.status]}`}>{a.status}</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">{fmtWhen(a.created_at)}{a.contact_now ? ` · reach them on ${a.contact_now}` : ''}</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{a.summary}</div>
              {a.closed_note && <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">Closed: {a.closed_note}</div>}
              {canAct && a.status !== 'closed' && (
                <div className="mt-3 flex gap-2">
                  {a.status === 'open' && <button type="button" onClick={() => act(a, 'acknowledged')} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">Acknowledge</button>}
                  <button type="button" onClick={() => act(a, 'closed')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700">Close</button>
                </div>
              )}
            </div>
          ))}
          {!alerts.length && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No safety alerts.</div>}
        </div>
      )}
    </div>
  );
}
