'use client';

/**
 * Cookie choices: necessary (always on), analytics, advertising.
 * Shown until the visitor chooses; reopened by any "Cookie settings" link
 * (openConsentSettings in @/analytics/consent).
 */

import { useEffect, useState } from 'react';
import { getConsent, setConsent } from '@/analytics/consent';
import { analyticsContext } from '@/analytics';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function ConsentBanner() {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [advertising, setAdvertising] = useState(false);

  useEffect(() => {
    if (!getConsent()) setOpen(true);
    const reopen = () => {
      const c = getConsent();
      setAnalytics(c ? c.analytics : true);
      setAdvertising(c ? c.advertising : false);
      setCustom(true);
      setOpen(true);
    };
    window.addEventListener('koott:consent-settings', reopen);
    return () => window.removeEventListener('koott:consent-settings', reopen);
  }, []);

  if (!open) return null;

  const choose = (choice, source = custom ? 'settings' : 'banner') => {
    setConsent(choice, { anonymousId: analyticsContext()?.anonymousId, apiBase: API, source });
    setOpen(false);
  };

  return (
    <div className="kcb" role="dialog" aria-live="polite" aria-label="Cookie choices">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="kcb-in">
        <div className="kcb-copy">
          <p className="kcb-t">Your privacy</p>
          <p className="kcb-b">
            Koott uses cookies to keep the site working and, with your permission, to understand which pages help
            people find a therapist. We never share what you read or write about your wellbeing with advertisers.{' '}
            <a href="/privacy-policy">Privacy policy</a>
          </p>
          {custom && (
            <div className="kcb-opts">
              <label className="kcb-opt"><input type="checkbox" checked disabled /> <span><b>Necessary</b> — sign-in, booking and payment. Always on.</span></label>
              <label className="kcb-opt"><input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} /> <span><b>Analytics</b> — how the site is used, measured by Koott.</span></label>
              <label className="kcb-opt"><input type="checkbox" checked={advertising} onChange={(e) => setAdvertising(e.target.checked)} /> <span><b>Advertising</b> — lets ad platforms know an ad led to a booking.</span></label>
            </div>
          )}
        </div>
        <div className="kcb-actions">
          {custom ? (
            <button type="button" className="kcb-btn kcb-primary" onClick={() => choose({ analytics, advertising })}>Save choices</button>
          ) : (
            <>
              <button type="button" className="kcb-btn kcb-primary" onClick={() => choose({ analytics: true, advertising: true })}>Accept all</button>
              <button type="button" className="kcb-btn" onClick={() => choose({ analytics: false, advertising: false })}>Only necessary</button>
              <button type="button" className="kcb-link" onClick={() => setCustom(true)}>Choose</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const CSS = `
.kcb{position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:80;display:flex;justify-content:center;pointer-events:none;font-family:'Work Sans',ui-sans-serif,system-ui,sans-serif}
.kcb-in{pointer-events:auto;max-width:880px;width:100%;background:#fff;border:1px solid #DDE6DF;border-radius:16px;box-shadow:0 12px 40px rgba(6,51,39,.18);padding:16px 18px;display:flex;gap:18px;align-items:center}
.kcb-copy{flex:1;min-width:0}
.kcb-t{margin:0 0 4px!important;font-size:15px!important;font-weight:700!important;color:#16201A!important;letter-spacing:0!important}
.kcb-b{margin:0!important;font-size:13px!important;line-height:1.5!important;color:#4A554D!important;letter-spacing:0!important}
.kcb-b a{color:#1B6930;text-decoration:underline}
.kcb-opts{display:grid;gap:6px;margin-top:10px}
.kcb-opt{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:#16201A;line-height:1.4}
.kcb-opt input{margin-top:2px;accent-color:#1B6930}
.kcb-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end;flex:none}
.kcb-btn{border:1px solid #CFDAD2;background:#fff;color:#16201A;border-radius:10px;padding:9px 14px;font-size:13.5px;font-weight:600;cursor:pointer;white-space:nowrap;font-family:inherit}
.kcb-primary{background:#1B6930;border-color:#1B6930;color:#fff}
.kcb-primary:hover{background:#155424}
.kcb-link{background:none;border:0;color:#1B6930;text-decoration:underline;font-size:13.5px;cursor:pointer;padding:6px;font-family:inherit}
.kcb-btn:focus-visible,.kcb-link:focus-visible{outline:2px solid #1B6930;outline-offset:2px}
@media (max-width:640px){
  .kcb{left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px))}
  .kcb-in{flex-direction:column;align-items:stretch;gap:12px;padding:14px}
  .kcb-actions{justify-content:stretch}
  .kcb-btn{flex:1}
}
`;
