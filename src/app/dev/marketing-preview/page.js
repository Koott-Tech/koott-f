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
import { SAMPLES, OPS_SAMPLES } from '@/components/marketing/sampleReports';
import Operations, { OPERATIONS_CSS } from '@/components/marketing/Operations';

const DATES = { from: '2026-08-25', to: '2026-09-23', prevFrom: '2026-07-26', prevTo: '2026-08-24', compare: 'previous', preset: 'last30' };

export default function MarketingPreviewPage() {
  const [name, setName] = useState('booking-funnel');
  const request = (path) => {
    const key = String(path).split('?')[0].replace('report/', '');
    // Operations asks for ops/* and takes the same request prop, so it previews
    // here alongside the reports.
    if (OPS_SAMPLES[key]) {
      // The real API groups by therapist once a team is chosen, so the preview
      // does too — otherwise the drill-down looks right while the table below
      // it silently keeps showing teams.
      const inTeam = /scope=team%3A|scope=team:/.test(String(path));
      if (key === 'ops/overview') {
        return Promise.resolve({
          success: true,
          data: {
            ...OPS_SAMPLES['ops/overview'],
            comparison: inTeam ? OPS_SAMPLES['ops/comparison:team'] : OPS_SAMPLES['ops/comparison'],
          },
        });
      }
      return Promise.resolve({ success: true, data: OPS_SAMPLES[key] });
    }
    const data = SAMPLES[key] ?? SAMPLES[name];
    return data ? Promise.resolve({ success: true, data }) : Promise.reject(new Error(`No sample for ${key}`));
  };
  const isOps = name === 'operations';

  return (
    <div className="wx">
      <style dangerouslySetInnerHTML={{ __html: MARKETING_CSS + REPORT_CSS + OPERATIONS_CSS }} />
      <aside className="wx-side">
        <div className="wx-brand"><span className="wx-mk">K</span><div><b>Koott</b><small>Insights</small></div></div>
        <div className="wx-navgrp">Preview</div>
        <nav aria-label="Reports">
          <button type="button" aria-current={isOps ? 'page' : undefined} onClick={() => setName('operations')}>
            Bookings &amp; slots
          </button>
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
            <option value="operations">Bookings &amp; slots</option>
            {REPORTS.map((r) => <option key={r.k} value={r.k}>{r.t}</option>)}
          </select>
        </div>
        {isOps ? (
          <Operations
            request={request}
            dates={DATES}
            rangeControl={<span className="wx-muted">Sample data · {DATES.from} to {DATES.to}</span>}
          />
        ) : (
        <ReportView
          key={name}
          name={name}
          request={request}
          dates={DATES}
          env="development"
          rangeControl={<span className="wx-muted">Sample data · {DATES.from} to {DATES.to}</span>}
          goAll={() => {}}
        />
        )}
      </main>
    </div>
  );
}
