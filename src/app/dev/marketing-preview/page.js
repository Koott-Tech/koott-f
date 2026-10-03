'use client';

/**
 * Preview route for the marketing dashboard's reports (/dev/marketing-preview).
 *
 * The dashboard itself is behind a marketing login, which makes checking a
 * layout at six widths slower than it needs to be. ReportView takes its data
 * through a `request` prop, so this renders the real components against fixed
 * sample data — no login, no database, nothing user-facing. Dev only: /dev/*
 * 404s on a production build (see ../layout.js).
 *
 * The sample answers are shaped like the API's, with deliberately awkward
 * content — long page paths, long campaign names, a therapist with a long name
 * — because that is what breaks a layout.
 */

import { useState } from 'react';
import { REPORTS, REPORT_CSS, ReportView } from '@/components/marketing/MarketingReports';
import { MARKETING_CSS } from '@/components/marketing/MarketingDashboard';
import { SAMPLES } from '@/components/marketing/sampleReports';

const DATES = { from: '2026-08-25', to: '2026-09-23', prevFrom: '2026-07-26', prevTo: '2026-08-24', compare: 'previous', preset: 'last30' };

export default function MarketingPreviewPage() {
  const [name, setName] = useState('booking-funnel');
  const request = (path) => {
    const key = String(path).split('?')[0].replace('report/', '');
    const data = SAMPLES[key] ?? SAMPLES[name];
    return data ? Promise.resolve({ success: true, data }) : Promise.reject(new Error(`No sample for ${key}`));
  };

  return (
    <div className="wx">
      <style dangerouslySetInnerHTML={{ __html: MARKETING_CSS + REPORT_CSS }} />
      <aside className="wx-side">
        <div className="wx-brand"><span className="wx-mk">K</span><div><b>Koott</b><small>Insights</small></div></div>
        <div className="wx-navgrp">Preview</div>
        <nav aria-label="Reports">
          {REPORTS.map((r) => (
            <button key={r.k} type="button" aria-current={name === r.k ? 'page' : undefined} onClick={() => setName(r.k)}>
              {r.t}
            </button>
          ))}
        </nav>
      </aside>
      <main className="wx-main">
        <div className="wx-mobnav">
          <select value={name} onChange={(e) => setName(e.target.value)} aria-label="Report">
            {REPORTS.map((r) => <option key={r.k} value={r.k}>{r.t}</option>)}
          </select>
        </div>
        <ReportView
          key={name}
          name={name}
          request={request}
          dates={DATES}
          env="development"
          rangeControl={<span className="wx-muted">Sample data · {DATES.from} to {DATES.to}</span>}
          goAll={() => {}}
        />
      </main>
    </div>
  );
}
