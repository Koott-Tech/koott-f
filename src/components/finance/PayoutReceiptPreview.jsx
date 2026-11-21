'use client';

/**
 * Payouts → Mark as Paid → "Preview receipt & send".
 * Builds the therapist's payout receipt exactly like Finance → Receipts (same rows, same
 * letterhead PDF), shows the numbers and the PDF, and on confirm emails it and marks the
 * payout as paid (with the receipt's TDS). Nothing is sent or saved before the confirm button.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Printer, Send, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { financeApi } from '@/lib/backendApi';
import {
  buildPayoutReceiptForDoctor,
  payoutReceiptTotals,
  generatePayoutReceiptPDF,
  pdfBytesToBase64,
  safeFilePart,
  fmtReceipt,
} from '@/lib/payoutReceipt';

const inr = (n) => `₹${fmtReceipt(n, { decimals: false })}`;
const fmtDay = (ymd) => new Date(`${ymd}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function PayoutReceiptPreview({ payout, month, year, payoutAmount, onBack, onClose, onConfirm }) {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState(null);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [rendering, setRendering] = useState(false);
  const [busy, setBusy] = useState('');
  const urlRef = useRef('');

  const render = useCallback(async (d) => {
    setRendering(true);
    try {
      const bytes = await generatePayoutReceiptPDF(d);
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setPdfUrl(url);
    } catch (e) {
      setError(`Could not draw the receipt: ${e?.message || e}`);
    } finally {
      setRendering(false);
    }
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const r = await buildPayoutReceiptForDoctor({
          financeApi,
          psychologistId: payout.psychologist_id,
          month, year,
          payoutAmount,
          doctor: payout.psychologist ? { first_name: payout.psychologist.first_name, last_name: payout.psychologist.last_name, ...(payout.psychologist.email ? { email: payout.psychologist.email } : {}) } : undefined,
        });
        if (!live) return;
        setData(r.data); setPeriod(r.period);
        render(r.data);
      } catch (e) {
        if (live) setError(e?.message || 'Could not build the receipt');
      }
    })();
    return () => { live = false; if (urlRef.current) URL.revokeObjectURL(urlRef.current); };
  }, [payout, month, year, payoutAmount, render]);

  const t = data ? payoutReceiptTotals(data) : null;
  const mismatch = t && payoutAmount != null && Math.abs(t.subtotal - Number(payoutAmount)) >= 1;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data?.recipientEmail || '').trim());
  const fileName = data ? `${safeFilePart(data.name)}-payout-receipt-${safeFilePart(data.receiptNo)}.pdf` : 'receipt.pdf';

  const print = () => {
    if (!pdfUrl) return;
    const w = window.open(pdfUrl, '_blank');
    if (!w) { setError('Popup blocked. Allow popups to print the receipt.'); return; }
    setTimeout(() => { w.focus(); w.print(); }, 700);
  };

  const confirm = async () => {
    if (!data || !emailOk || busy) return;
    setError('');
    try {
      setBusy('Sending receipt…');
      const bytes = await generatePayoutReceiptPDF(data);
      await financeApi.sendReceiptEmail({
        to: String(data.recipientEmail).trim(),
        recipientName: data.name,
        template: 'payoutReceipt',
        receiptNo: data.receiptNo,
        fileName,
        pdfBase64: pdfBytesToBase64(bytes),
      });
      setBusy('Marking as paid…');
      const ok = await onConfirm({ tds_percent: t.tdsPercent, receipt_no: data.receiptNo });
      if (!ok) setError(`The receipt was emailed to ${data.recipientEmail}, but marking as paid failed. Use Mark as Paid again (the receipt doesn't need to be re-sent).`);
    } catch (e) {
      setError(`Receipt not sent, nothing marked as paid: ${e?.message || 'email failed'}`);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3" role="dialog" aria-modal="true" aria-label="Payout receipt preview">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[94vh] flex flex-col shadow-xl">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-gray-900">Payout receipt</div>
            <p className="text-xs text-gray-500">Check the numbers. Nothing is sent or marked as paid until you confirm.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="overflow-y-auto p-5 grid gap-5 lg:grid-cols-2">
          {!data && !error && <div className="lg:col-span-2 flex items-center gap-2 text-sm text-gray-600 py-10 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Working out the receipt…</div>}
          {data && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border border-gray-200 p-3 space-y-1.5">
                <div className="flex justify-between gap-3"><span className="text-gray-500">To</span><span className="font-medium text-gray-900 text-right">{data.name}<span className="block text-xs font-normal text-gray-500">{data.designation} · {data.location}</span></span></div>
                <label className="flex justify-between items-center gap-3"><span className="text-gray-500">Email to</span>
                  <input type="email" value={data.recipientEmail} onChange={(e) => setData({ ...data, recipientEmail: e.target.value, email: e.target.value })} className={`w-64 max-w-full border rounded-md px-2 py-1 text-sm ${emailOk ? 'border-gray-300' : 'border-rose-400'}`} />
                </label>
                <div className="flex justify-between gap-3"><span className="text-gray-500">Receipt no.</span><span className="font-mono">{data.receiptNo}</span></div>
                <div className="flex justify-between gap-3"><span className="text-gray-500">Date</span><span>{data.date}</span></div>
                {period && <div className="flex justify-between gap-3"><span className="text-gray-500">Sessions from</span><span>{fmtDay(period.dateFrom)} – {fmtDay(period.dateTo)}</span></div>}
              </div>

              <table className="w-full text-sm">
                <thead><tr className="text-xs text-gray-500 border-b border-gray-200"><th className="text-left py-1.5 font-medium">Session type</th><th className="text-right py-1.5 font-medium">No.</th><th className="text-right py-1.5 font-medium">Rate</th><th className="text-right py-1.5 font-medium">Amount</th></tr></thead>
                <tbody>
                  {t.rows.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-gray-500">No completed unpaid sessions found for this month.</td></tr>}
                  {t.rows.map((r, i) => (
                    <tr key={`${r.type}-${i}`} className="border-b border-gray-100"><td className="py-1.5">{r.type}</td><td className="py-1.5 text-right">{r.number}</td><td className="py-1.5 text-right">{inr(r.unitPrice)}</td><td className="py-1.5 text-right">{inr(r.amount)}</td></tr>
                  ))}
                  <tr><td colSpan={3} className="pt-2 text-gray-600">Subtotal</td><td className="pt-2 text-right tabular-nums">{inr(t.subtotal)}</td></tr>
                  <tr>
                    <td colSpan={3} className="py-1 text-gray-600">
                      <label className="inline-flex items-center gap-2">Less TDS
                        <input type="number" min="0" max="30" step="0.5" value={data.tdsPercent} aria-label="TDS percent"
                          onChange={(e) => setData({ ...data, tdsPercent: e.target.value })}
                          onBlur={() => render(data)} className="w-16 border border-gray-300 rounded-md px-1.5 py-0.5 text-sm" />%
                      </label>
                    </td>
                    <td className="py-1 text-right tabular-nums">− {inr(t.tds)}</td>
                  </tr>
                  <tr className="border-t-2 border-gray-800 font-semibold"><td colSpan={3} className="py-2">Amount paid to therapist</td><td className="py-2 text-right tabular-nums text-emerald-700">{inr(t.total)}</td></tr>
                </tbody>
              </table>

              {mismatch && (
                <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>The receipt subtotal ({inr(t.subtotal)}) doesn&apos;t match the payout on this screen ({inr(payoutAmount)}). Check the sessions before sending.</span>
                </div>
              )}
              <p className="text-[11px] text-gray-500">Same receipt as Finance → Receipts. Marking as paid records the TDS above against this payout.</p>
            </div>
          )}

          {data && (
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">Receipt preview</span>
                <button type="button" onClick={() => render(data)} className="flex items-center gap-1 text-xs text-[#025545] hover:underline"><RefreshCw className="h-3 w-3" /> Refresh</button>
              </div>
              <div className="relative flex-1 min-h-[360px] rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                {pdfUrl && <iframe title="Payout receipt PDF" src={`${pdfUrl}#toolbar=0&view=FitH`} className="w-full h-full min-h-[360px]" />}
                {rendering && <div className="absolute inset-0 flex items-center justify-center bg-white/60"><Loader2 className="h-5 w-5 animate-spin text-gray-500" /></div>}
              </div>
            </div>
          )}
          {error && <div className="lg:col-span-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{error}</div>}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 flex flex-wrap gap-2 justify-end">
          <button type="button" onClick={onBack} disabled={!!busy} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Back</button>
          <button type="button" onClick={print} disabled={!pdfUrl || !!busy} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"><Printer className="h-4 w-4" /> Print</button>
          <button type="button" onClick={confirm} disabled={!data || !emailOk || !!busy || !t?.rows.length}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" />{busy}</> : <><Send className="h-4 w-4" /> Send receipt &amp; mark as paid</>}
          </button>
        </div>
      </div>
    </div>
  );
}
