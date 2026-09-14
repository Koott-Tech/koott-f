'use client';

/**
 * Admin: a psychiatrist's consultation pricing. Psychiatrists offer 15-min and
 * 30-min consultations (no couple sessions), each followed by a 10-min break,
 * plus packages of 15-min consultations. Saving writes these as the doctor's
 * packages and switches off any old therapy packages (never deleted — clients
 * who bought one keep it).
 */

import { useEffect, useState } from 'react';
import { AlertCircle, Check, IndianRupee, Loader2, Plus, Trash2, X } from 'lucide-react';
import { adminApi } from '@/lib/backendApi';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const roundTo50 = (n) => Math.round(n / 50) * 50;

/** Starting packages when none exist yet: 3 and 6 consults at 5 % / 10 % off. */
const suggestBundles = (price15) => (price15 > 0
  ? [{ sessions: 3, price: roundTo50(price15 * 3 * 0.95) }, { sessions: 6, price: roundTo50(price15 * 6 * 0.9) }]
  : []);

const inputCls = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#025545] focus:outline-none focus:ring-2 focus:ring-[#025545]/15';

export default function PsychiatryPricingModal({ psychologistId, name, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const r = await adminApi.getPsychiatryPricing(psychologistId);
        const d = r?.data ?? r;
        if (off) return;
        setMeta(d);
        setForm({
          price15: d?.price15 ?? '',
          price30: d?.price30 ?? '',
          bundles: d?.configured ? (d.bundles || []) : suggestBundles(Number(d?.price15) || 0),
        });
      } catch (e) {
        if (!off) setLoadErr(e?.message || 'Could not load pricing');
      }
    })();
    return () => { off = true; };
  }, [psychologistId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (patch) => { setForm((f) => ({ ...f, ...patch })); setSaved(''); setSaveErr(''); };
  const setBundle = (i, patch) => set({ bundles: form.bundles.map((b, j) => (j === i ? { ...b, ...patch } : b)) });
  const addBundle = () => {
    const used = new Set(form.bundles.map((b) => Number(b.sessions)));
    const sessions = [3, 6, 9, 12, 4, 5, 8, 10].find((n) => !used.has(n)) || 2;
    set({ bundles: [...form.bundles, { sessions, price: roundTo50((Number(form.price15) || 0) * sessions * 0.9) || '' }] });
  };

  const save = async () => {
    setSaving(true);
    setSaveErr('');
    setSaved('');
    try {
      const r = await adminApi.savePsychiatryPricing(psychologistId, {
        price15: Number(form.price15),
        price30: Number(form.price30),
        bundles: form.bundles.map((b) => ({ sessions: Number(b.sessions), price: Number(b.price) })),
      });
      if (r && r.success === false) throw new Error(r.message || 'Could not save pricing');
      const d = r?.data ?? r;
      setSaved(d?.message || 'Pricing saved');
      if (d?.pricing) setMeta(d.pricing);
      onSaved?.();
    } catch (e) {
      setSaveErr(e?.message || 'Could not save pricing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Psychiatry pricing for ${name || 'doctor'}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <IndianRupee className="h-4 w-4 text-[#025545]" /> Psychiatry pricing — {name || 'Doctor'}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Psychiatrists offer 15-min and 30-min consultations only (no couple sessions), each
              followed by a 10-min break. Packages are made of 15-min consultations.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loadErr ? (
          <div className="px-5 py-10 text-center text-sm text-red-600">{loadErr}</div>
        ) : !form ? (
          <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-5 px-5 py-4">
            {meta && !meta.isPsychiatrist && (
              <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                This doctor&apos;s designation is not Psychiatrist — set it first (Edit), then save pricing.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-gray-700">
                15-min consultation (₹)
                <input type="number" min="1" className={`mt-1 ${inputCls}`} value={form.price15}
                  onChange={(e) => set({ price15: e.target.value })} />
              </label>
              <label className="text-sm text-gray-700">
                30-min consultation (₹)
                <input type="number" min="1" className={`mt-1 ${inputCls}`} value={form.price30}
                  onChange={(e) => set({ price30: e.target.value })} />
              </label>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-800">Packages of 15-min consultations</div>
                <button type="button" onClick={addBundle}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#025545] hover:underline">
                  <Plus className="h-3.5 w-3.5" /> Add package
                </button>
              </div>
              {!meta?.configured && form.bundles.length > 0 && (
                <p className="mb-2 text-xs text-slate-500">Suggested to start with — edit or remove before saving.</p>
              )}
              <div className="space-y-2">
                {form.bundles.length === 0 && <p className="text-sm text-slate-400">No packages — singles only.</p>}
                {form.bundles.map((b, i) => {
                  const full = (Number(form.price15) || 0) * (Number(b.sessions) || 0);
                  const per = Number(b.sessions) > 0 ? Math.round((Number(b.price) || 0) / Number(b.sessions)) : 0;
                  return (
                    <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                      <input type="number" min="2" max="30" aria-label="Consultations in package"
                        className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                        value={b.sessions} onChange={(e) => setBundle(i, { sessions: e.target.value })} />
                      <span className="text-sm text-gray-600">× 15-min for ₹</span>
                      <input type="number" min="1" aria-label="Package price"
                        className="w-28 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                        value={b.price} onChange={(e) => setBundle(i, { price: e.target.value })} />
                      <span className="text-xs text-slate-500">
                        {inr(per)} each{full > Number(b.price) ? ` · saves ${inr(full - Number(b.price))}` : ''}
                      </span>
                      <button type="button" onClick={() => set({ bundles: form.bundles.filter((_, j) => j !== i) })}
                        className="ml-auto rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove package">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {meta?.otherActivePackages > 0 && (
              <p className="text-xs text-amber-700">
                {meta.otherActivePackages} therapy package(s) (individual / couple) are still switched on for this doctor —
                saving switches them off. Clients who already bought one keep it.
              </p>
            )}
            {saveErr && <div className="text-sm text-red-600">{saveErr}</div>}
            {saved && (
              <div className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <Check className="h-4 w-4" /> {saved}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Close
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!form || saving || (meta && !meta.isPsychiatrist)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#025545] px-4 py-2 text-sm font-medium text-white hover:bg-[#012f23] disabled:opacity-40"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save pricing
          </button>
        </div>
      </div>
    </div>
  );
}
