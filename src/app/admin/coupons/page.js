'use client';

/**
 * Admin — discount coupons.
 *
 * Create a code, choose percentage or flat-rupee discount, set an expiry
 * (either "in N days" or an exact date/time), and cap how many times it can be
 * used overall and per client. The list shows live usage pulled from
 * coupon_redemptions, not a stored counter.
 *
 * All rules are enforced again on the server at payment time — this page is the
 * authoring UI, not the source of truth.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import backendApi from '@/lib/backendApi';

const EMPTY = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '',
  max_discount_amount: '',
  min_order_amount: '',
  expiry_mode: 'days',
  expires_in_days: '30',
  expires_at: '',
  max_redemptions: '',
  per_user_limit: '1',
  is_active: true,
};

function formatExpiry(iso) {
  if (!iso) return 'No expiry';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  const when = d.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  if (days < 0) return `Expired · ${when}`;
  return `${when} · ${days} day${days === 1 ? '' : 's'} left`;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await backendApi.get('/coupons/admin');
      setCoupons(res?.data?.coupons || []);
    } catch (err) {
      console.error('[admin/coupons] load failed:', err);
      setMsg({ type: 'error', text: 'Could not load coupons.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  /** Live preview of what the discount does to a sample order. */
  const preview = useMemo(() => {
    const value = Number(form.discount_value);
    if (!Number.isFinite(value) || value <= 0) return null;
    const sample = 1000;
    let off = form.discount_type === 'fixed' ? value : (sample * value) / 100;
    const cap = Number(form.max_discount_amount);
    if (form.discount_type === 'percentage' && Number.isFinite(cap) && cap > 0) {
      off = Math.min(off, cap);
    }
    off = Math.min(off, sample);
    return { off: Math.round(off), net: Math.round(sample - off) };
  }, [form.discount_type, form.discount_value, form.max_discount_amount]);

  function resetForm() {
    setForm(EMPTY);
    setEditingId(null);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });

    const payload = {
      code: form.code,
      description: form.description,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      max_discount_amount: form.discount_type === 'percentage' ? form.max_discount_amount : '',
      min_order_amount: form.min_order_amount,
      max_redemptions: form.max_redemptions,
      per_user_limit: form.per_user_limit,
      is_active: form.is_active,
      // Send exactly one of the two expiry shapes.
      ...(form.expiry_mode === 'days'
        ? { expires_in_days: form.expires_in_days }
        : { expires_at: form.expires_at }),
    };

    try {
      if (editingId) await backendApi.put(`/coupons/admin/${editingId}`, payload);
      else await backendApi.post('/coupons/admin', payload);
      setMsg({ type: 'ok', text: editingId ? 'Coupon updated.' : 'Coupon created.' });
      resetForm();
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err?.message || 'Could not save the coupon.' });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setForm({
      code: c.code || '',
      description: c.description || '',
      discount_type: c.discount_type || 'percentage',
      discount_value: String(c.discount_value ?? ''),
      max_discount_amount: c.max_discount_amount != null ? String(c.max_discount_amount) : '',
      min_order_amount: c.min_order_amount != null ? String(c.min_order_amount) : '',
      expiry_mode: 'date',
      expires_in_days: '',
      expires_at: c.expires_at ? new Date(c.expires_at).toISOString().slice(0, 16) : '',
      max_redemptions: c.max_redemptions != null ? String(c.max_redemptions) : '',
      per_user_limit: c.per_user_limit != null ? String(c.per_user_limit) : '1',
      is_active: !!c.is_active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function toggle(c) {
    try {
      await backendApi.patch(`/coupons/admin/${c.id}/toggle`, {});
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err?.message || 'Could not update the coupon.' });
    }
  }

  async function remove(c) {
    if (!window.confirm(`Delete coupon ${c.code}? This cannot be undone.`)) return;
    try {
      await backendApi.delete(`/coupons/admin/${c.id}`);
      setMsg({ type: 'ok', text: 'Coupon deleted.' });
      load();
    } catch (err) {
      // The API refuses to delete a coupon that has been redeemed.
      setMsg({ type: 'error', text: err?.message || 'Could not delete the coupon.' });
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Discount coupons</h1>
        <p className="text-sm text-gray-500 mt-1">
          Codes clients can apply at checkout. Every rule here is re-checked on the server
          when the payment order is created.
        </p>
      </div>

      {msg.text && (
        <div
          role="status"
          className={`mb-5 rounded-lg px-4 py-3 text-sm ${
            msg.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* ── Create / edit ─────────────────────────────────────────────── */}
      <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {editingId ? 'Edit coupon' : 'Create a coupon'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Code *" hint="Letters, numbers, - and _ . Shown to clients in uppercase.">
            <input
              className={inputCls} required value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="WELCOME20"
            />
          </Field>

          <Field label="Description" hint="Internal note — clients do not see this.">
            <input className={inputCls} value={form.description} onChange={set('description')}
              placeholder="Launch offer for new clients" />
          </Field>

          <Field label="Discount type *">
            <select className={inputCls} value={form.discount_type} onChange={set('discount_type')}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Flat amount (₹)</option>
            </select>
          </Field>

          <Field
            label={form.discount_type === 'fixed' ? 'Amount off (₹) *' : 'Percentage off (%) *'}
            hint={form.discount_type === 'fixed' ? 'e.g. 100 for ₹100 off' : 'e.g. 20 for 20% off, max 100'}
          >
            <input
              className={inputCls} type="number" min="1" step="0.01" required
              max={form.discount_type === 'percentage' ? 100 : undefined}
              value={form.discount_value} onChange={set('discount_value')}
              placeholder={form.discount_type === 'fixed' ? '100' : '20'}
            />
          </Field>

          {form.discount_type === 'percentage' && (
            <Field label="Maximum discount (₹)" hint="Caps a percentage coupon. Leave blank for no cap.">
              <input className={inputCls} type="number" min="0" step="0.01"
                value={form.max_discount_amount} onChange={set('max_discount_amount')} placeholder="500" />
            </Field>
          )}

          <Field label="Minimum order (₹)" hint="Coupon only applies at or above this amount.">
            <input className={inputCls} type="number" min="0" step="0.01"
              value={form.min_order_amount} onChange={set('min_order_amount')} placeholder="0" />
          </Field>

          <Field label="Expires *" hint="Either a number of days from now, or an exact date and time.">
            <div className="flex gap-2">
              <select
                className={`${inputCls} w-32`} value={form.expiry_mode}
                onChange={(e) => setForm((f) => ({ ...f, expiry_mode: e.target.value }))}
              >
                <option value="days">In days</option>
                <option value="date">On date</option>
              </select>
              {form.expiry_mode === 'days' ? (
                <input className={inputCls} type="number" min="1" value={form.expires_in_days}
                  onChange={set('expires_in_days')} placeholder="30" />
              ) : (
                <input className={inputCls} type="datetime-local" value={form.expires_at}
                  onChange={set('expires_at')} />
              )}
            </div>
          </Field>

          <Field label="Total uses" hint="How many times in all. Blank = unlimited.">
            <input className={inputCls} type="number" min="1" value={form.max_redemptions}
              onChange={set('max_redemptions')} placeholder="Unlimited" />
          </Field>

          <Field label="Uses per client" hint="Blank = unlimited per client.">
            <input className={inputCls} type="number" min="1" value={form.per_user_limit}
              onChange={set('per_user_limit')} placeholder="1" />
          </Field>

          <Field label="Status">
            <label className="flex items-center gap-2 text-sm text-gray-700 h-[42px]">
              <input type="checkbox" checked={form.is_active} onChange={set('is_active')}
                className="h-4 w-4 rounded border-gray-300" />
              Active — clients can use this code
            </label>
          </Field>
        </div>

        {preview && (
          <p className="mt-5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            On a ₹1,000 booking this takes off <strong>₹{preview.off}</strong> — client pays{' '}
            <strong>₹{preview.net}</strong>.
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={saving}
            className="px-5 h-11 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60">
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create coupon'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm}
              className="px-5 h-11 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* ── Existing coupons ──────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            All coupons {coupons.length > 0 && <span className="text-gray-400">({coupons.length})</span>}
          </h2>
        </div>

        {loading && <p className="px-6 py-10 text-center text-sm text-gray-500">Loading…</p>}

        {!loading && coupons.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-gray-500">
            No coupons yet. Create one above.
          </p>
        )}

        {!loading && coupons.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <Th>Code</Th><Th>Discount</Th><Th>Expires</Th>
                  <Th>Used</Th><Th>Status</Th><Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map((c) => {
                  const expired = c.expires_at && new Date(c.expires_at) <= new Date();
                  const exhausted = c.max_redemptions != null && c.used_count >= c.max_redemptions;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <Td>
                        <span className="font-mono font-medium text-gray-900">{c.code}</span>
                        {c.description && (
                          <span className="block text-xs text-gray-500 mt-0.5">{c.description}</span>
                        )}
                      </Td>
                      <Td>
                        {c.discount_type === 'fixed'
                          ? `₹${Number(c.discount_value)} off`
                          : `${Number(c.discount_value)}% off`}
                        {c.discount_type === 'percentage' && c.max_discount_amount != null && (
                          <span className="block text-xs text-gray-500">max ₹{Number(c.max_discount_amount)}</span>
                        )}
                        {Number(c.min_order_amount) > 0 && (
                          <span className="block text-xs text-gray-500">min order ₹{Number(c.min_order_amount)}</span>
                        )}
                      </Td>
                      <Td className={expired ? 'text-red-600' : ''}>{formatExpiry(c.expires_at)}</Td>
                      <Td>
                        {c.used_count}
                        {c.max_redemptions != null ? ` / ${c.max_redemptions}` : ''}
                        {c.per_user_limit != null && (
                          <span className="block text-xs text-gray-500">{c.per_user_limit} per client</span>
                        )}
                      </Td>
                      <Td>
                        <Badge
                          tone={!c.is_active ? 'grey' : expired || exhausted ? 'amber' : 'green'}
                          label={!c.is_active ? 'Inactive' : expired ? 'Expired' : exhausted ? 'Limit reached' : 'Active'}
                        />
                      </Td>
                      <Td>
                        <div className="flex gap-3 whitespace-nowrap">
                          <button onClick={() => startEdit(c)} className="text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => toggle(c)} className="text-gray-600 hover:underline">
                            {c.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => remove(c)} className="text-red-600 hover:underline">Delete</button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls =
  'w-full h-[42px] px-3 rounded-lg border border-gray-300 text-sm text-gray-900 ' +
  'focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500';

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-500 mt-1">{hint}</span>}
    </label>
  );
}

function Th({ children }) {
  return <th className="text-left font-medium px-6 py-3">{children}</th>;
}
function Td({ children, className = '' }) {
  return <td className={`px-6 py-4 align-top text-gray-700 ${className}`}>{children}</td>;
}
function Badge({ tone, label }) {
  const tones = {
    green: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    grey: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full border text-xs ${tones[tone]}`}>
      {label}
    </span>
  );
}
