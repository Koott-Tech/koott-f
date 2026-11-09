'use client';

/**
 * Therapist dashboard: "Urgent safety concern". Goes straight to the named clinical
 * lead by email (and Admin's Safety alerts page) — never into the task queue.
 * The guidance wording is a placeholder until the clinical lead approves it.
 */
import { useState } from 'react';
import { safetyApi } from '@/lib/staffApi';
import { Modal } from '@/components/tasks/taskUi';

export default function SafetyAlertButton({ compact = false }) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [contact, setContact] = useState('');
  const [state, setState] = useState('');
  const [result, setResult] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    if (!summary.trim()) return;
    setState('sending');
    try {
      const r = await safetyApi.raise({ summary: summary.trim(), contact_now: contact.trim() || undefined });
      setResult(r); setState('sent'); setSummary(''); setContact('');
    } catch (err) { setState(err.message); }
  };

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setState(''); setResult(null); }}
        className={`flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 font-semibold text-rose-700 hover:bg-rose-100 ${compact ? 'px-2.5 py-1.5 text-xs' : 'w-full px-4 py-2.5 text-sm'}`}>
        <span aria-hidden>⚠</span> Urgent safety concern
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Urgent safety concern">
        {state === 'sent' ? (
          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800">
              {result?.leadSet ? 'Sent to the clinical lead' : 'Alert saved'}{result?.emailed ? ' and emailed' : ''}. You&apos;ll see a notification when they acknowledge it.
            </div>
            {(!result?.leadSet || !result?.emailed) && <div className="rounded-xl bg-amber-50 p-3 text-amber-900">{!result?.leadSet ? 'No clinical lead is set yet' : 'No email could be sent'}{result?.emailed ? ', so it went to the Koott admin address' : ', so nobody has been emailed — Admin sees it on the Safety alerts page'}. Please also call your supervisor now.</div>}
            <div className="text-slate-600">If someone is in immediate danger, call 112, or Tele-MANAS 14416 (24x7).</div>
            <div className="flex justify-end"><button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-[#025545] px-4 py-2 font-semibold text-white">Close</button></div>
          </div>
        ) : (
          <form onSubmit={send} className="space-y-3 text-sm">
            <div className="rounded-xl bg-rose-50 p-3 text-rose-800">
              If someone is in immediate danger, call 112 first. Tele-MANAS 14416 is free and open 24x7.
              {/* Placeholder guidance — wording to be approved by the clinical lead. */}
            </div>
            <textarea required rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={1500}
              placeholder="What is happening now, and the client's reference (e.g. K-1A2B3C). Only what the lead needs to act."
              className="w-full rounded-lg border border-slate-200 px-3 py-2" />
            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="How to reach you right now (phone)" className="w-full rounded-lg border border-slate-200 px-3 py-2" />
            {state && state !== 'sending' && <div className="text-rose-600">{state}</div>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={state === 'sending' || !summary.trim()} className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{state === 'sending' ? 'Sending…' : 'Send to the clinical lead now'}</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
