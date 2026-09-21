'use client';

/**
 * CouponField — the "have a coupon?" control shown just before payment.
 *
 * It only ever reports a validated CODE upward, never a price. The server
 * recomputes the discount when the payment order is created, so nothing here
 * can change what the client is actually charged.
 *
 * @param {number}   amount    the pre-discount order total, in rupees
 * @param {function} onApply   called with ({code, discountAmount, finalAmount}) or (null)
 * @param {boolean}  disabled  lock the field while a payment is in flight
 */

import { useState } from 'react';
import backendApi from '@/lib/backendApi';

export default function CouponField({ amount, onApply, disabled = false }) {
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function apply(e) {
    e?.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) { setError('Enter a coupon code.'); return; }

    setChecking(true);
    setError('');
    try {
      const res = await backendApi.post('/coupons/validate', { code: trimmed, amount });
      if (res?.success && res.data) {
        setApplied(res.data);
        onApply?.({
          code: res.data.code,
          discountAmount: res.data.discountAmount,
          finalAmount: res.data.finalAmount,
        });
      } else {
        setApplied(null);
        onApply?.(null);
        setError(res?.message || 'That coupon could not be applied.');
      }
    } catch (err) {
      setApplied(null);
      onApply?.(null);
      setError(err?.message || 'Could not check that coupon just now.');
    } finally {
      setChecking(false);
    }
  }

  function clear() {
    setApplied(null);
    setCode('');
    setError('');
    onApply?.(null);
  }

  if (applied) {
    return (
      <div className="kcp kcp--on">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="kcp-row">
          <div>
            <p className="kcp-code">
              <span aria-hidden>🎟️</span> {applied.code} applied
              <span className="kcp-label"> · {applied.label}</span>
            </p>
            <p className="kcp-save">
              You save ₹{applied.discountAmount} — you pay <strong>₹{applied.finalAmount}</strong>
            </p>
          </div>
          <button type="button" className="kcp-remove" onClick={clear} disabled={disabled}>
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="kcp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <label className="kcp-title" htmlFor="kcp-input">Have a coupon?</label>
      <div className="kcp-row">
        <input
          id="kcp-input"
          className="kcp-input"
          value={code}
          disabled={disabled || checking}
          placeholder="Enter code"
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') apply(e); }}
        />
        <button
          type="button"
          className="kcp-apply"
          onClick={apply}
          disabled={disabled || checking || !code.trim()}
        >
          {checking ? 'Checking…' : 'Apply'}
        </button>
      </div>
      {error && <p className="kcp-error" role="alert">{error}</p>}
    </div>
  );
}

const CSS = `
.kcp{
  border:1px solid #DFFFD2;border-radius:10px;padding:14px 16px;background:#FBFFF9;
  font-family:'Inter',ui-sans-serif,system-ui,sans-serif;
}
.kcp--on{background:#F2FCF7;border-color:rgba(61,152,92,.4);}
.kcp *{box-sizing:border-box;}
.kcp-title{display:block;font-size:14px;font-weight:600;color:#100E0E;margin-bottom:9px;}
.kcp-row{display:flex;align-items:center;gap:10px;}
.kcp-input{
  flex:1;min-width:0;height:42px;padding:0 14px;border-radius:8px;
  border:1px solid rgba(38,34,34,.18);background:#fff;
  font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:#100E0E;
}
.kcp-input:focus{outline:none;border-color:#3D985C;box-shadow:0 0 0 3px rgba(61,152,92,.16);}
.kcp-apply{
  flex:none;height:42px;padding:0 20px;border:0;border-radius:8px;cursor:pointer;
  background:#4FAB69;color:#fff;font-size:14px;font-weight:500;
}
.kcp-apply:hover:not(:disabled){background:#025545;}
.kcp-apply:disabled{opacity:.55;cursor:default;}
.kcp-error{margin:9px 0 0;font-size:13px;color:#B3261E;}
.kcp-code{margin:0;font-size:14px;font-weight:600;color:#29653D;}
.kcp-label{font-weight:400;color:#3D985C;}
.kcp-save{margin:4px 0 0;font-size:13px;color:#100E0E;}
.kcp-remove{
  flex:none;border:0;background:none;cursor:pointer;
  font-size:13px;color:#5B5757;text-decoration:underline;
}
.kcp-remove:hover{color:#B3261E;}
`;
