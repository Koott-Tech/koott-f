'use client';

/**
 * The detailed reports (Wix "All Reports"): Traffic over Time, Top Traffic
 * Sources, Traffic by Location, Page Visits, Button Clicks, Top Blog Posts,
 * Blog Activity by Time of Day, Top Search Queries on Google.
 * Data: GET /api/marketing/report/:name — totals only.
 */

import { useEffect, useMemo, useState } from 'react';
import { N, INRfull, duration, ELEMENT, Tip, AreaChart, WorldMap, BarList } from './ui';

export const REPORTS = [
  { k: 'traffic-over-time', grp: 'Traffic', t: 'Traffic over Time', d: 'Learn which days or months get the most site visits.' },
  { k: 'traffic-sources', grp: 'Traffic', t: 'Top Traffic Sources', d: 'See where your site visitors come from.' },
  { k: 'location', grp: 'Traffic', t: 'Traffic by Location', d: 'Find out where visitors to your site come from.' },
  { k: 'page-visits', grp: 'Behavior', t: 'Page Visits', d: 'Learn what the most popular pages on your site are.' },
  { k: 'button-clicks', grp: 'Behavior', t: 'Button Clicks', d: 'Find out which buttons on your site get clicked the most.' },
  { k: 'blog-posts', grp: 'Blog', t: 'Top Blog Posts', d: 'See which posts had the most views.' },
  { k: 'blog-time', grp: 'Blog', t: 'Blog Activity by Time of Day', d: 'Discover the best hours in each day to publish new posts.' },
  { k: 'search-queries', grp: 'Marketing', t: 'Top Search Queries on Google', d: 'See how your site performed for different Google searches.' },
  { k: 'booking-funnel', grp: 'Bookings', t: 'Booking Funnel', d: 'How far people get towards a booking, and where they stop.' },
  { k: 'therapist-performance', grp: 'Bookings', t: 'Therapist Performance', d: 'Profile views, booking starts, bookings and revenue per therapist.' },
  { k: 'journeys', grp: 'Visitors', t: 'Visitor Journeys', d: 'Every session, in order: how it arrived, what it saw, how far it got.' },
  { k: 'campaigns', grp: 'Marketing', t: 'Marketing Campaigns', d: 'What each tagged campaign brought, from first visit to paid booking.' },
  { k: 'technical', grp: 'Technical', t: 'Technical Performance', d: 'Core Web Vitals from real visits, and the errors people hit.' },
];

const pct = (v, digits = 0) => `${((v || 0) * 100).toFixed(digits)}%`;
const hourLabel = (h) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeCell = (v) => (v ? new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '—');
const dateCell = (s) => (s ? new Date(`${s.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '—');
const displayCountry = (c) => (c === 'United States of America' ? 'United States' : c);
const buttonName = (id) => ELEMENT[id] || String(id || '').replace(/_/g, ' ');

/* ------------------------------------------------------------ building blocks */

export function ReportsList({ open }) {
  const groups = [...new Set(REPORTS.map((r) => r.grp))];
  return (
    <div className="wx-reports">
      {groups.map((g) => (
        <section key={g} className="wx-section">
          <header className="wx-section-head"><h2>{g}</h2></header>
          <div className="wx-report-grid">
            {REPORTS.filter((r) => r.grp === g).map((r) => (
              <button key={r.k} type="button" className="wx-report-card" onClick={() => open(r.k)}>
                <b>{r.t}</b><span>{r.d}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Horizontal bar chart, Wix report style: label · bar · value. */
function Bars({ rows, fmt = N }) {
  const [tip, setTip] = useState(null);
  if (!rows.length) return <p className="wx-empty">No data yet for this period.</p>;
  const mx = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="wx-rbars">
      {rows.map((r) => (
        <div key={r.label} className="wx-rbar" onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, content: <><b>{r.label}</b>{fmt(r.value)}</> })} onMouseLeave={() => setTip(null)}>
          <span className="wx-rbar-l" title={r.label}>{r.label}</span>
          <span className="wx-rbar-t"><span style={{ width: `${Math.max(0.6, (r.value / mx) * 100)}%` }} /><em>{fmt(r.value)}</em></span>
        </div>
      ))}
      <Tip tip={tip} />
    </div>
  );
}

/** Sortable table with a Summary row; shows 50 rows, then "Show more". */
function Table({ cols, rows, summary, sortKey: initialSort, onRow }) {
  const [sort, setSort] = useState({ k: initialSort || cols.find((c) => c.n)?.k, dir: -1 });
  const [limit, setLimit] = useState(50);
  const sorted = useMemo(() => {
    const c = cols.find((x) => x.k === sort.k);
    if (!c) return rows;
    return [...rows].sort((a, b) => {
      const av = c.sortValue ? c.sortValue(a) : a[c.k]; const bv = c.sortValue ? c.sortValue(b) : b[c.k];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sort.dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * sort.dir;
    });
  }, [rows, cols, sort]);
  if (!rows.length) return <p className="wx-empty">No data yet for this period.</p>;
  return (
    <div className="wx-rtable">
      <table>
        <thead>
          <tr>{cols.map((c) => (
            <th key={c.k} className={c.n ? 'n' : ''} scope="col">
              <button type="button" onClick={() => setSort((s) => ({ k: c.k, dir: s.k === c.k ? -s.dir : -1 }))} title={c.info || ''}>
                {c.h}{sort.k === c.k ? (sort.dir < 0 ? ' ↓' : ' ↑') : ''}
              </button>
            </th>
          ))}</tr>
        </thead>
        <tbody>
          {summary && <tr className="wx-summary">{cols.map((c, i) => <td key={c.k} className={c.n ? 'n' : ''}>{i === 0 ? 'Summary' : summary[c.k] != null ? (c.fmt ? c.fmt(summary[c.k], summary) : summary[c.k]) : ''}</td>)}</tr>}
          {sorted.slice(0, limit).map((r, i) => (
            <tr
              key={i}
              className={onRow ? 'wx-rowlink' : undefined}
              onClick={onRow ? () => onRow(r) : undefined}
              tabIndex={onRow ? 0 : undefined}
              onKeyDown={onRow ? (e) => { if (e.key === 'Enter') onRow(r); } : undefined}
            >
              {cols.map((c) => <td key={c.k} className={c.n ? 'n' : ''}>{c.render ? c.render(r) : c.fmt ? c.fmt(r[c.k], r) : (r[c.k] ?? '—')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length > limit && <button type="button" className="wx-more" onClick={() => setLimit((l) => l + 50)}>Show more ({N(sorted.length - limit)} left)</button>}
    </div>
  );
}

/** 24 hours × 7 days heat map with the value in each cell. */
function Heat24({ cells, fmt }) {
  const [tip, setTip] = useState(null);
  const grid = Array.from({ length: 24 }, () => Array(7).fill(0));
  cells.forEach((c) => { grid[c.hour][c.dow] = c.value; });
  const mx = Math.max(1, ...cells.map((c) => c.value));
  const bg = (v) => (v ? `rgba(17,109,255,${0.12 + 0.88 * (v / mx)})` : '#F0F3F7');
  return (
    <div className="wx-heat24">
      <div className="wx-heat24-row wx-heat24-head"><em />{WEEKDAY.map((d) => <b key={d}>{d}</b>)}</div>
      {grid.map((row, h) => (
        <div key={h} className="wx-heat24-row">
          <em>{hourLabel(h)}</em>
          {row.map((v, d) => (
            <span key={d} style={{ background: bg(v), color: v / mx > 0.6 ? '#fff' : '#162D3D' }}
              onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, content: <><b>{WEEKDAY[d]}, {hourLabel(h)}</b>{fmt(v)}</> })} onMouseLeave={() => setTip(null)}>
              {v ? fmt(v) : ''}
            </span>
          ))}
        </div>
      ))}
      <Tip tip={tip} />
    </div>
  );
}

function toCsv(cols, rows) {
  const cell = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.map((c) => cell(c.h)).join(','), ...rows.map((r) => cols.map((c) => cell(c.csv ? c.csv(r) : r[c.k])).join(','))].join('\n');
}

/* ------------------------------------------------------------ one report page */

export function ReportView({ name, request, dates, env, rangeControl, goAll }) {
  const def = REPORTS.find((r) => r.k === name) || REPORTS[0];
  const [opt, setOpt] = useState({ grain: 'day', model: 'last_non_direct', group: 'page', measure: null, device: '', channel: '' });
  const [state, setState] = useState({ loading: true, data: null, error: '' });

  const extra = name === 'traffic-over-time' ? `&grain=${opt.grain}`
    : name === 'traffic-sources' ? `&model=${opt.model}`
      : name === 'page-visits' ? `&group=${opt.group}`
        : name === 'booking-funnel' ? `${opt.device ? `&device=${opt.device}` : ''}${opt.channel ? `&channel=${opt.channel}` : ''}`
          : '';
  useEffect(() => {
    let off = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    request(`report/${name}?from=${dates.from}&to=${dates.to}&compare=${dates.compare}&env=${env}${extra}`)
      .then((j) => { if (!off) setState({ loading: false, data: j.data, error: '' }); })
      .catch((e) => { if (!off) setState({ loading: false, data: null, error: e.message }); });
    return () => { off = true; };
  }, [name, dates.from, dates.to, dates.compare, env, extra, request]);

  const [session, setSession] = useState(null);
  useEffect(() => { setSession(null); }, [name, dates.from, dates.to]);
  useEffect(() => {
    if (!session?.id || session.rows) return undefined;
    let off = false;
    request(`report/journeys?from=${dates.from}&to=${dates.to}&env=${env}&session=${session.id}`)
      .then((j) => { if (!off) setSession(j.data.session); })
      .catch((e) => { if (!off) setSession({ id: session.id, error: e.message }); });
    return () => { off = true; };
  }, [session, dates.from, dates.to, env, request]);

  const d = state.data;
  const view = d ? buildView(name, d, opt) : null;
  const exportCsv = () => {
    if (!view) return;
    const url = URL.createObjectURL(new Blob([toCsv(view.cols, view.rows)], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = `koott-${name}-${dates.from}-to-${dates.to}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="wx-report">
      <nav className="wx-crumbs"><button type="button" className="wx-link" onClick={goAll}>All Reports</button> › <span>{def.t}</span></nav>
      <div className="wx-report-head">
        <div><h1>{def.t}</h1><p>{def.d}</p></div>
        <button type="button" className="wx-icon" onClick={exportCsv} disabled={!view} title="Export CSV" aria-label="Export CSV">⤓</button>
      </div>
      <div className="wx-card wx-report-controls">
        {rangeControl}
        {name === 'traffic-over-time' && (
          <select value={opt.grain} onChange={(e) => setOpt((o) => ({ ...o, grain: e.target.value }))} aria-label="Group by">
            <option value="day">Group by day</option><option value="week">Group by week</option><option value="month">Group by month</option>
          </select>
        )}
        {name === 'traffic-sources' && (
          <select value={opt.model} onChange={(e) => setOpt((o) => ({ ...o, model: e.target.value }))} aria-label="Attribution model">
            <option value="last_non_direct">Attribution model: Last non-direct</option>
            <option value="first">Attribution model: First interaction</option>
            <option value="last">Attribution model: Last interaction</option>
            <option value="last_non_direct_facebook">Attribution model: Last non-direct (Facebook)</option>
            <option value="last_non_direct_google">Attribution model: Last non-direct (Google)</option>
          </select>
        )}
        {(name === 'booking-funnel' || name === 'journeys') && (
          <>
            <select value={opt.device || ''} onChange={(e) => setOpt((o) => ({ ...o, device: e.target.value }))} aria-label="Device">
              <option value="">All devices</option><option value="mobile">Mobile</option><option value="desktop">Desktop</option><option value="tablet">Tablet</option>
            </select>
            <select value={opt.channel || ''} onChange={(e) => setOpt((o) => ({ ...o, channel: e.target.value }))} aria-label="Traffic source">
              <option value="">All sources</option>
              <option value="paid_social">Paid social</option><option value="organic_social">Organic social</option>
              <option value="paid_search">Paid search</option><option value="organic_search">Organic search</option>
              <option value="direct">Direct</option><option value="referral">Referral</option>
              <option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="ai_platform">AI platforms</option>
            </select>
          </>
        )}
        {name === 'journeys' && (
          <>
            <select value={opt.stage || ''} onChange={(e) => setOpt((o) => ({ ...o, stage: e.target.value }))} aria-label="Got as far as">
              <option value="">Any stage</option>
              <option value="2">Saw a profile or further</option>
              <option value="3">Started booking or further</option>
              <option value="5">Chose a time or further</option>
              <option value="8">Reached checkout or further</option>
            </select>
            <select value={opt.booked || ''} onChange={(e) => setOpt((o) => ({ ...o, booked: e.target.value }))} aria-label="Outcome">
              <option value="">Any outcome</option><option value="yes">Booked</option><option value="no">Did not book</option>
            </select>
          </>
        )}
        {name === 'page-visits' && (
          <select value={opt.group} onChange={(e) => setOpt((o) => ({ ...o, group: e.target.value }))} aria-label="Group by">
            <option value="page">Group by page</option><option value="day">Group by day</option>
          </select>
        )}
        {state.loading && <span className="wx-muted">Updating…</span>}
      </div>

      {state.error ? <div className="wx-card"><b>Couldn’t load this report</b><p>{state.error}</p></div>
        : !view ? <p className="wx-empty">Loading…</p> : view.message ? <div className="wx-card"><p className="wx-empty">{view.message}</p></div> : (
          <>
            <div className="wx-card wx-report-chart">
              {view.measures && (
                <div className="wx-measure">Measure:
                  <select value={view.measure} onChange={(e) => setOpt((o) => ({ ...o, measure: e.target.value }))} aria-label="Measure">
                    {view.measures.map((m) => <option key={m.k} value={m.k}>{m.h}</option>)}
                  </select>
                </div>
              )}
              {view.chart}
            </div>
            <div className="wx-card wx-report-table">
              <Table
                cols={view.cols} rows={view.rows} summary={view.summary} sortKey={view.sortKey}
                onRow={name === 'journeys' ? (r) => setSession({ id: r.session }) : undefined}
              />
            </div>
            {session && <SessionTimeline session={session} onClose={() => setSession(null)} />}
          </>
        )}
    </div>
  );
}

/** One session's events in order — the drill-down from Visitor Journeys. */
function SessionTimeline({ session, onClose }) {
  const rows = session.rows || [];
  return (
    <div className="wx-timeline-wrap" role="dialog" aria-label="Session timeline">
      <div className="wx-timeline">
        <header>
          <div>
            <h2>Session {String(session.id).slice(0, 8)}</h2>
            <p className="wx-muted">
              {session.channel || 'unknown source'}{session.campaign ? ` · ${session.campaign}` : ''}
              {session.device ? ` · ${session.device}` : ''}{session.region ? ` · ${session.region}` : ''}
            </p>
          </div>
          <button type="button" className="wx-icon" onClick={onClose} aria-label="Close">×</button>
        </header>
        {session.error ? <p className="wx-empty">{session.error}</p>
          : !session.rows ? <p className="wx-empty">Loading…</p>
            : rows.length === 0 ? <p className="wx-empty">No events recorded for this session.</p>
              : (
                <ol className="wx-steps">
                  {rows.map((r, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <li key={i} className={r.step ? 'is-funnel' : ''}>
                      <time>{new Date(r.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' })}</time>
                      <b>{r.step || EVENT_NAME[r.event] || r.event.replace(/_/g, ' ')}</b>
                      {r.path && <span className="wx-path" title={r.path}>{r.path}</span>}
                      {r.value ? <em>₹{N(r.value)}</em> : null}
                    </li>
                  ))}
                </ol>
              )}
        {session.truncated && <p className="wx-muted">Only the first 500 events of this session are shown.</p>}
      </div>
    </div>
  );
}

/** Plain names for the events that are not funnel steps. */
const EVENT_NAME = {
  page_view: 'Viewed a page', page_engaged: 'Stayed on the page', scroll_depth: 'Scrolled',
  ui_click: 'Clicked something', filter_applied: 'Filtered the list', contact_clicked: 'Clicked to contact',
  voice_intro_played: 'Played a voice intro', booking_step_error: 'Hit an error in booking',
  payment_attempt_failed: 'Payment failed', payment_dismissed: 'Closed the payment window',
  js_error: 'Page error', api_error: 'Request failed', login_completed: 'Signed in',
  registration_completed: 'Created an account', popup_shown: 'Saw a popup', popup_action: 'Acted on a popup',
  popup_dismissed: 'Closed a popup',
};

/* ------------------------------------------------------------ per-report views */

function buildView(name, d, opt) {
  switch (name) {
    case 'traffic-over-time': {
      const measures = [
        { k: 'pageViews', h: 'Page views', fmt: N }, { k: 'sessions', h: 'Site sessions', fmt: N }, { k: 'visitors', h: 'Unique visitors', fmt: N },
        { k: 'bounceRate', h: 'Bounce rate', fmt: (v) => pct(v), chart: (v) => v * 100, chartFmt: (v) => `${Math.round(v)}%` },
        { k: 'avgDuration', h: 'Avg. session duration', fmt: duration, chartFmt: duration },
      ];
      const m = measures.find((x) => x.k === opt.measure) || measures[1];
      const series = [...d.rows].reverse().map((r) => ({ day: r.period, value: m.chart ? m.chart(r[m.k]) : r[m.k] }));
      const label = d.grain === 'month' ? (s) => new Date(`${s}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : d.grain === 'week' ? (s) => `Week of ${dateCell(s)}` : dateCell;
      return {
        measures, measure: m.k,
        chart: <AreaChart rows={series} keys={[{ key: 'value', label: m.h }]} height={300} fmt={m.chartFmt || m.fmt} />,
        cols: [
          { k: 'period', h: 'Date', fmt: label, csv: (r) => r.period },
          { k: 'pageViews', h: 'Page views', n: 1, fmt: N },
          { k: 'sessions', h: 'Site sessions', n: 1, fmt: N, info: 'Visits: activity with no gap longer than 30 minutes.' },
          { k: 'visitors', h: 'Unique visitors', n: 1, fmt: N, info: 'Different browsers (visitors who accepted analytics cookies).' },
          { k: 'bounceRate', h: 'Bounce rate', n: 1, fmt: (v) => pct(v), info: 'Sessions with a single page view.' },
          { k: 'avgDuration', h: 'Avg. session duration', n: 1, fmt: duration },
        ],
        rows: d.rows, summary: d.summary, sortKey: 'period',
      };
    }
    case 'traffic-sources': {
      const measures = [{ k: 'sessions', h: 'Site sessions' }, { k: 'visitors', h: 'Unique visitors' }];
      const m = measures.find((x) => x.k === opt.measure) || measures[0];
      const byCat = {};
      d.rows.forEach((r) => { byCat[r.category] = (byCat[r.category] || 0) + r[m.k]; });
      return {
        measures, measure: m.k,
        chart: <Bars rows={Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value }))} />,
        cols: [
          { k: 'source', h: 'Traffic source', info: 'Where the visit came from (utm_source, referrer or click ID).' },
          { k: 'category', h: 'Traffic category' },
          { k: 'sessions', h: 'Site sessions', n: 1, fmt: N },
          { k: 'visitors', h: 'Unique visitors', n: 1, fmt: N },
        ],
        rows: d.rows, summary: d.summary, sortKey: 'sessions',
      };
    }
    case 'location': {
      const mx = Math.max(1, ...d.countries.map((c) => c.sessions));
      return {
        chart: (
          <div className="wx-report-map">
            <WorldMap rows={d.countries} mode="choropleth" />
            <div className="wx-scale"><small>1</small><span /><small>{N(mx)}</small></div>
          </div>
        ),
        cols: [
          { k: 'city', h: 'City' },
          { k: 'country', h: 'Country' },
          { k: 'pageViews', h: 'Page views', n: 1, fmt: N },
          { k: 'sessions', h: 'Site sessions', n: 1, fmt: N },
          { k: 'visitors', h: 'Unique visitors', n: 1, fmt: N },
        ],
        rows: d.rows, summary: d.summary, sortKey: 'sessions',
      };
    }
    case 'page-visits': {
      const measures = [{ k: 'pageViews', h: 'Page views' }, { k: 'sessions', h: 'Site sessions' }, { k: 'visitors', h: 'Unique visitors' }];
      const m = measures.find((x) => x.k === opt.measure) || measures[0];
      const chart = <Bars rows={[...d.top].sort((a, b) => b[m.k] - a[m.k]).slice(0, 8).map((r) => ({ label: r.path, value: r[m.k] }))} />;
      if (d.group === 'day') {
        return {
          measures, measure: m.k, chart,
          cols: [
            { k: 'period', h: 'Date', fmt: dateCell, csv: (r) => r.period },
            { k: 'sessions', h: 'Site sessions', n: 1, fmt: N },
            { k: 'visitors', h: 'Unique visitors', n: 1, fmt: N },
            { k: 'pagesPerSession', h: 'Avg. pages per session', n: 1, fmt: (v) => (v || 0).toFixed(1) },
            { k: 'avgDuration', h: 'Avg. session duration', n: 1, fmt: duration },
            { k: 'bounceRate', h: 'Bounce rate', n: 1, fmt: (v) => pct(v) },
          ],
          rows: d.rows, summary: d.summary, sortKey: 'period',
        };
      }
      return {
        measures, measure: m.k, chart,
        cols: [
          { k: 'path', h: 'Page path', render: (r) => <span className="wx-path" title={r.path}>{r.path}</span> },
          { k: 'pageViews', h: 'Page views', n: 1, fmt: N },
          { k: 'sessions', h: 'Site sessions', n: 1, fmt: N },
          { k: 'visitors', h: 'Unique visitors', n: 1, fmt: N },
        ],
        rows: d.rows, summary: d.summary, sortKey: 'sessions',
      };
    }
    case 'button-clicks': {
      const summary = { ...d.summary, ctr: d.summary.visitors ? d.summary.uniqueClicks / d.summary.visitors : 0 };
      return {
        chart: <Bars rows={d.buttons.map((b) => ({ label: buttonName(b.element), value: b.uniqueClicks }))} />,
        cols: [
          { k: 'element', h: 'Button text', fmt: buttonName },
          { k: 'path', h: 'Page URL from click', render: (r) => <span className="wx-path" title={r.path}>{r.path || '—'}</span> },
          { k: 'target', h: 'Link details', info: 'Where the button leads.', render: (r) => <span className="wx-path" title={r.target || ''}>{r.target || '—'}</span> },
          { k: 'visitors', h: 'Unique visitors', n: 1, fmt: N, info: 'Everyone who visited the site in this period.' },
          { k: 'uniqueClicks', h: 'Unique clicks', n: 1, fmt: N, info: 'Visitors who clicked the button.' },
          { k: 'ctr', h: 'CTR', n: 1, fmt: (v) => pct(v), sortValue: (r) => (r.visitors ? r.uniqueClicks / r.visitors : 0), render: (r) => pct(r.visitors ? r.uniqueClicks / r.visitors : 0), csv: (r) => (r.visitors ? (r.uniqueClicks / r.visitors).toFixed(4) : '') },
        ],
        rows: d.rows, summary, sortKey: 'uniqueClicks',
      };
    }
    case 'blog-posts': {
      const measures = [{ k: 'views', h: 'Post views' }, { k: 'visitors', h: 'Unique visitors' }];
      const m = measures.find((x) => x.k === opt.measure) || measures[0];
      return {
        measures, measure: m.k,
        chart: <Bars rows={[...d.rows].sort((a, b) => b[m.k] - a[m.k]).slice(0, 8).map((r) => ({ label: r.title, value: r[m.k] }))} />,
        cols: [
          { k: 'image', h: 'Post image', render: (r) => (r.image ? <img src={r.image} alt="" className="wx-post-img" /> : <span className="wx-post-img wx-item-ph">B</span>), csv: () => '' },
          { k: 'title', h: 'Post title', render: (r) => <a href={r.path} target="_blank" rel="noreferrer" className="wx-path" title={r.title}>{r.title}</a> },
          { k: 'publishedAt', h: 'Publish date', fmt: dateCell },
          { k: 'views', h: 'Post views', n: 1, fmt: N },
          { k: 'visitors', h: 'Unique visitors', n: 1, fmt: N },
          { k: 'avgReadSeconds', h: 'Avg. read time', n: 1, fmt: duration },
        ],
        rows: d.rows, summary: d.summary, sortKey: 'views',
      };
    }
    case 'blog-time': {
      const measures = [{ k: 'avgSessions', h: 'Avg. sessions by day' }, { k: 'avgVisitors', h: 'Avg. visitors by day' }, { k: 'clicks', h: 'Total clicks' }];
      const m = measures.find((x) => x.k === opt.measure) || measures[0];
      const fmt1 = (v) => (v >= 10 || Number.isInteger(v) ? N(v) : v.toFixed(1));
      return {
        measures, measure: m.k,
        chart: <Heat24 cells={d.cells.map((c) => ({ dow: c.dow, hour: c.hour, value: c[m.k] }))} fmt={fmt1} />,
        cols: [
          { k: 'dow', h: 'Weekday', fmt: (v) => WEEKDAY[v], sortValue: (r) => r.dow },
          { k: 'hour', h: 'Hour', fmt: (v) => hourLabel(v) },
          { k: 'avgSessions', h: 'Avg. sessions by day', n: 1, fmt: fmt1 },
          { k: 'clicks', h: 'Total clicks', n: 1, fmt: N },
          { k: 'avgVisitors', h: 'Avg. visitors by day', n: 1, fmt: fmt1 },
        ],
        rows: d.cells, summary: { avgSessions: d.summary.sessions, clicks: d.summary.clicks }, sortKey: 'avgSessions',
      };
    }
    case 'campaigns': {
      const measures = [
        { k: 'sessions', h: 'Sessions', fmt: N }, { k: 'bookingStarted', h: 'Booking starts', fmt: N },
        { k: 'bookings', h: 'Bookings', fmt: N }, { k: 'revenue', h: 'Revenue', fmt: INRfull },
      ];
      const m = measures.find((x) => x.k === opt.measure) || measures[0];
      return {
        measures, measure: m.k,
        chart: (
          <>
            <BarList rows={[...d.rows].sort((a, b) => b[m.k] - a[m.k]).slice(0, 10).map((r) => ({ label: r.campaign, value: r[m.k] }))} fmt={m.fmt} />
            {d.untagged > 0 && (
              <p className="wx-muted" style={{ marginTop: 12 }}>
                {N(d.untagged)} sessions arrived without a campaign tag and are not in this report — direct visits,
                and any link that went out without utm parameters.
              </p>
            )}
          </>
        ),
        cols: [
          { k: 'campaign', h: 'Campaign' },
          { k: 'source', h: 'Source' },
          { k: 'category', h: 'Category' },
          { k: 'sessions', h: 'Sessions', n: 1, fmt: N },
          { k: 'visitors', h: 'Visitors', n: 1, fmt: N },
          { k: 'bookingStarted', h: 'Booking starts', n: 1, fmt: N },
          { k: 'checkoutStarted', h: 'Checkout', n: 1, fmt: N },
          { k: 'bookings', h: 'Bookings', n: 1, fmt: N, info: 'Paid and verified on the server.' },
          { k: 'conversion', h: 'Sessions → booking', n: 1, fmt: (v) => pct(v, 1) },
          { k: 'revenue', h: 'Revenue', n: 1, fmt: INRfull },
          { k: 'prevSessions', h: 'Sessions (previous)', n: 1, fmt: N },
        ],
        rows: d.rows, summary: d.summary, sortKey: 'sessions',
      };
    }
    case 'technical': {
      const unit = (metric, v) => (v == null ? '—' : metric === 'CLS' ? v.toFixed(3) : `${N(v)} ms`);
      return {
        chart: (
          <div>
            <div className="wx-vitals">
              {d.metrics.length === 0 && <p className="wx-empty">No Core Web Vitals recorded yet for this period.</p>}
              {d.metrics.map((m) => (
                <div key={m.metric} className={`wx-vital is-${m.goodRate >= 0.75 ? 'good' : m.goodRate >= 0.5 ? 'ok' : 'poor'}`}>
                  <b>{m.metric}</b>
                  <strong>{unit(m.metric, m.p75)}</strong>
                  <span>75th percentile · {N(m.samples)} samples</span>
                  <span>{pct(m.goodRate)} rated good</span>
                </div>
              ))}
            </div>
            <p className="wx-muted" style={{ marginTop: 12 }}>{d.note}</p>
            {d.errors.length > 0 && (
              <div className="wx-funnel-stopped">
                <h3>Errors visitors hit</h3>
                <BarList rows={d.errors.slice(0, 8).map((e) => ({ label: `${e.code} (${e.event.replace(/_/g, ' ')})`, value: e.events }))} />
              </div>
            )}
          </div>
        ),
        cols: [
          { k: 'metric', h: 'Metric' },
          { k: 'pageGroup', h: 'Page group' },
          { k: 'device', h: 'Device' },
          { k: 'samples', h: 'Samples', n: 1, fmt: N },
          { k: 'p50', h: 'Median', n: 1, fmt: (v, r) => unit(r.metric, v) },
          { k: 'p75', h: '75th pct', n: 1, fmt: (v, r) => unit(r.metric, v), info: 'The number Google grades on.' },
          { k: 'p95', h: '95th pct', n: 1, fmt: (v, r) => unit(r.metric, v) },
          { k: 'good', h: 'Good', n: 1, fmt: N },
          { k: 'poor', h: 'Poor', n: 1, fmt: N },
        ],
        rows: d.rows, sortKey: 'samples',
      };
    }
    case 'journeys': {
      if (d.session) return { session: d.session };
      const shown = d.rows.length;
      return {
        chart: (
          <div className="wx-journeys-top">
            <div className="wx-funnel-sum">
              <span><b>{N(d.total)}</b> sessions match</span>
              <span><b>{N(d.rows.filter((r) => r.booked).length)}</b> of the {N(shown)} shown booked</span>
              <span><b>{N(d.rows.filter((r) => r.furthest >= 3 && !r.booked).length)}</b> started booking and did not finish</span>
            </div>
            <p className="wx-muted">
              Sessions are anonymous — no name, email or phone is recorded against them. Click a row to see its
              timeline. Only visitors who accepted analytics cookies appear here.
            </p>
          </div>
        ),
        cols: [
          { k: 'startedAt', h: 'Started', fmt: (v) => timeCell(v), csv: (r) => r.startedAt },
          { k: 'session', h: 'Session', fmt: (v) => String(v).slice(0, 8) },
          { k: 'channel', h: 'Came from', fmt: (v, r) => [v || 'unknown', r?.campaign].filter(Boolean).join(' · ') },
          { k: 'landing', h: 'Landed on', fmt: (v) => v || '—' },
          { k: 'pageViews', h: 'Pages', n: 1, fmt: N },
          { k: 'seconds', h: 'Length', n: 1, fmt: duration },
          { k: 'stage', h: 'Got as far as' },
          { k: 'booked', h: 'Booked', fmt: (v) => (v ? 'Yes' : '—') },
          { k: 'device', h: 'Device', fmt: (v) => v || '—' },
          { k: 'region', h: 'Country', fmt: (v) => v || '—' },
        ],
        rows: d.rows, sortKey: 'startedAt',
      };
    }
    case 'booking-funnel': {
      const top = d.rows[0]?.sessions || 0;
      const stopped = d.stopped || [];
      const worst = stopped[0];
      return {
        chart: (
          <div className="wx-funnel">
            <div className="wx-funnel-sum">
              <span><b>{N(d.summary.entered)}</b> started booking</span>
              <span><b>{N(d.summary.completed)}</b> paid</span>
              <span><b>{pct(d.summary.conversion, 1)}</b> of those who started</span>
              <span><b>{N(d.summary.abandoned)}</b> did not finish</span>
            </div>
            {d.rows.map((r) => (
              <div key={r.step} className="wx-funnel-row">
                <span className="wx-funnel-label" title={r.label}>{r.label}</span>
                <span className="wx-funnel-bar"><i style={{ width: `${top ? Math.max(0.5, (r.sessions / top) * 100) : 0}%` }} /></span>
                <b>{N(r.sessions)}</b>
                <span className="wx-funnel-pct">{r.toPrevious === null ? '' : pct(r.toPrevious)}</span>
              </div>
            ))}
            {stopped.length > 0 && (
              <div className="wx-funnel-stopped">
                <h3>Where sessions stopped</h3>
                <p className="wx-muted">
                  The furthest step each session reached, counted once. Sessions still in progress at the end of
                  the period are counted here too{worst ? `; most stopped at “${worst.label}”.` : '.'}
                </p>
                <BarList rows={stopped.map((r) => ({ label: r.label, value: r.sessions }))} />
              </div>
            )}
          </div>
        ),
        cols: [
          { k: 'label', h: 'Step' },
          { k: 'sessions', h: 'Sessions', n: 1, fmt: N, info: 'Sessions that reached this step at least once.' },
          { k: 'visitors', h: 'Visitors', n: 1, fmt: N },
          { k: 'toPrevious', h: 'From the step above', n: 1, fmt: (v) => (v === null ? '—' : pct(v)), info: 'Sessions here ÷ sessions at the step above. Above 100% means sessions skipped that step.' },
          { k: 'ofEntry', h: 'Of all who entered', n: 1, fmt: (v) => pct(v) },
          { k: 'dropped', h: 'Lost here', n: 1, fmt: (v) => (v === null ? '—' : N(v)) },
          { k: 'prevSessions', h: 'Previous period', n: 1, fmt: N },
        ],
        rows: d.rows, sortKey: 'order',
      };
    }
    case 'therapist-performance': {
      const measures = [
        { k: 'revenue', h: 'Revenue', fmt: INRfull }, { k: 'bookings', h: 'Bookings', fmt: N },
        { k: 'profileViews', h: 'Profile views', fmt: N }, { k: 'bookingStarted', h: 'Booking starts', fmt: N },
      ];
      const m = measures.find((x) => x.k === opt.measure) || measures[0];
      return {
        measures, measure: m.k,
        chart: <BarList rows={[...d.rows].sort((a, b) => b[m.k] - a[m.k]).slice(0, 10).map((r) => ({ label: r.name, value: r[m.k] }))} fmt={m.fmt} />,
        cols: [
          { k: 'name', h: 'Therapist' },
          { k: 'profileViews', h: 'Profile views', n: 1, fmt: N, info: 'Only visitors who accepted analytics cookies.' },
          { k: 'visitors', h: 'Unique visitors', n: 1, fmt: N },
          { k: 'bookingStarted', h: 'Booking starts', n: 1, fmt: N },
          { k: 'checkoutStarted', h: 'Reached checkout', n: 1, fmt: N },
          { k: 'bookings', h: 'Bookings', n: 1, fmt: N, info: 'Paid bookings from the payments table — everyone, not only visitors who accepted cookies.' },
          { k: 'revenue', h: 'Revenue', n: 1, fmt: INRfull },
          { k: 'prevBookings', h: 'Bookings (previous)', n: 1, fmt: N },
        ],
        rows: d.rows, summary: d.summary, sortKey: 'revenue',
      };
    }
    case 'search-queries': {
      if (!d.configured) return { message: 'Connect Google Search Console to see this report: set SEARCH_CONSOLE_SITE_URL on the backend and add the Google service account as a user on the Search Console property.' };
      if (d.error) return { message: `Search Console: ${d.error}` };
      const measures = [{ k: 'clicks', h: 'Clicks' }, { k: 'impressions', h: 'Impressions' }];
      const m = measures.find((x) => x.k === opt.measure) || measures[0];
      return {
        measures, measure: m.k,
        chart: <Bars rows={[...d.rows].sort((a, b) => b[m.k] - a[m.k]).slice(0, 8).map((r) => ({ label: r.query, value: r[m.k] }))} />,
        cols: [
          { k: 'query', h: 'Search query' },
          { k: 'impressions', h: 'Impressions', n: 1, fmt: N, info: 'Times the site appeared in Google results for the query.' },
          { k: 'clicks', h: 'Clicks', n: 1, fmt: N },
          { k: 'ctr', h: 'CTR', n: 1, fmt: (v) => pct(v, 1) },
          { k: 'position', h: 'Avg. position', n: 1, fmt: (v) => (v ?? 0).toString() },
        ],
        rows: d.rows, summary: d.summary, sortKey: 'clicks',
      };
    }
    default:
      return { message: 'Unknown report.' };
  }
}

export const REPORT_CSS = `
.wx-reports .wx-section{margin-bottom:16px}
.wx-report-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;padding:16px 18px}
.wx-report-card{display:grid;gap:4px;text-align:left;border:1px solid #E1E7EE;border-radius:8px;background:#fff;padding:14px 16px;cursor:pointer}
.wx-report-card:hover{border-color:#116DFF;box-shadow:0 2px 10px rgba(17,109,255,.12)}
.wx-report-card b{font-size:14px}
.wx-report-card span{font-size:12.5px;color:#3B4F63}
.wx-crumbs{font-size:13px;color:#3B4F63;margin-bottom:6px}
.wx-report-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}
.wx-report-head h1{font-size:28px!important;font-weight:700!important;line-height:1.2!important}
.wx-report-head p{margin:2px 0 0;color:#3B4F63}
.wx-icon{width:38px;height:38px;border-radius:50%;border:0;background:#fff;color:#116DFF;font-size:17px;cursor:pointer;box-shadow:0 1px 3px rgba(22,45,61,.12)}
.wx-icon:disabled{opacity:.5;cursor:default}
.wx-report-controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px}
.wx-report-controls select{background:#fff;border:1px solid #D3DCE6;border-radius:18px;padding:6px 12px;font-size:13.5px}
.wx-report-chart{border-radius:8px 8px 0 0;margin-bottom:0}
.wx-report-table{border-radius:0 0 8px 8px;border-top:1px solid #EEF1F5;padding:0;overflow:hidden}
.wx-measure{display:flex;align-items:center;gap:6px;font-size:13.5px;padding-bottom:14px;margin-bottom:14px;border-bottom:1px solid #EEF1F5}
.wx-measure select{border:0;background:none;color:#116DFF;font-size:13.5px;cursor:pointer}
.wx-rbars{display:grid;gap:8px}
.wx-rbar{display:grid;grid-template-columns:minmax(120px,220px) minmax(0,1fr);gap:12px;align-items:center;font-size:12.5px}
.wx-rbar-l{text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#3B4F63}
.wx-rbar-t{display:flex;align-items:center;gap:6px;min-width:0}
.wx-rbar-t span{height:22px;background:#3E82F4;border-radius:2px;display:block}
.wx-rbar-t em{font-style:normal;font-size:12px;color:#3B4F63;white-space:nowrap}
/* Booking funnel */
.wx-funnel{display:grid;gap:10px}
.wx-funnel-sum{display:flex;flex-wrap:wrap;gap:8px 22px;padding-bottom:14px;margin-bottom:6px;border-bottom:1px solid #EEF1F5;font-size:13.5px;color:#3B4F63}
.wx-funnel-sum b{color:#162D3D;font-size:16px}
.wx-funnel-row{display:grid;grid-template-columns:minmax(120px,210px) minmax(0,1fr) 62px 54px;gap:12px;align-items:center;font-size:12.5px}
.wx-funnel-label{text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#3B4F63}
.wx-funnel-bar{display:block;background:#EEF3FB;border-radius:3px;height:22px}
.wx-funnel-bar i{display:block;height:100%;background:#3E82F4;border-radius:3px}
.wx-funnel-row b{text-align:right}
.wx-funnel-pct{color:#3B4F63;text-align:right}
.wx-funnel-stopped{margin-top:16px;padding-top:16px;border-top:1px solid #EEF1F5}
.wx-funnel-stopped h3{margin:0 0 2px;font-size:15px!important;font-weight:600!important}
.wx-funnel-stopped p{margin:0 0 12px;font-size:12.5px}
@media (max-width:720px){
  .wx-funnel-row{grid-template-columns:minmax(0,1fr) 56px 46px;gap:8px}
  .wx-funnel-label{grid-column:1/-1;text-align:left}
}
/* Visitor journeys */
.wx-rowlink{cursor:pointer}
.wx-rowlink:hover td{background:#F6F9FE}
.wx-journeys-top .wx-muted{margin:0;font-size:12.5px}
.wx-timeline-wrap{position:fixed;inset:0;z-index:60;background:rgba(22,45,61,.35);display:flex;justify-content:flex-end}
.wx-timeline{width:min(460px,100%);background:#fff;height:100%;overflow:auto;padding:20px 22px;box-shadow:-8px 0 30px rgba(22,45,61,.2)}
.wx-timeline header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}
.wx-timeline h2{font-size:19px!important;font-weight:700!important;margin:0}
.wx-timeline header p{margin:2px 0 0;font-size:12.5px}
.wx-steps{list-style:none;margin:0;padding:0;display:grid;gap:2px}
.wx-steps li{display:grid;grid-template-columns:62px minmax(0,1fr) auto;gap:10px;align-items:baseline;padding:9px 0;border-bottom:1px solid #F1F4F8;font-size:13px}
.wx-steps time{color:#8A9AA8;font-size:12px}
.wx-steps b{font-weight:600}
.wx-steps li.is-funnel b{color:#116DFF}
.wx-steps .wx-path{grid-column:2;font-size:12px;color:#3B4F63;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wx-steps em{font-style:normal;color:#0F6B35;font-weight:600}
/* Core Web Vitals */
.wx-vitals{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.wx-vital{border:1px solid #E5EBF2;border-left-width:4px;border-radius:8px;padding:12px 14px;display:grid;gap:2px}
.wx-vital b{font-size:12.5px;color:#3B4F63;letter-spacing:.04em}
.wx-vital strong{font-size:22px;font-weight:700}
.wx-vital span{font-size:12px;color:#3B4F63}
.wx-vital.is-good{border-left-color:#1FA463}
.wx-vital.is-ok{border-left-color:#E5A000}
.wx-vital.is-poor{border-left-color:#D6453D}
.wx-rtable{overflow-x:auto}
.wx-rtable table{border-collapse:collapse;width:100%;font-size:13.5px;min-width:600px}
.wx-rtable th{background:#E8F0FE;text-align:left;font-weight:500;padding:0;border-bottom:1px solid #D9E3F2}
.wx-rtable th button{background:none;border:0;width:100%;text-align:inherit;padding:12px 16px;font:inherit;color:#162D3D;cursor:pointer;white-space:nowrap}
.wx-rtable th.n,.wx-rtable td.n{text-align:right}
.wx-rtable td{padding:12px 16px;border-bottom:1px solid #EEF1F5;max-width:320px}
.wx-rtable tr.wx-summary td{font-weight:600}
.wx-rtable tbody tr:hover td{background:#F7F9FC}
.wx-path{display:inline-block;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom;color:inherit;text-decoration:none}
a.wx-path:hover{color:#116DFF}
.wx-post-img{width:48px;height:48px;border-radius:6px;object-fit:cover;display:inline-grid;place-items:center}
.wx-more{display:block;margin:10px auto 14px;background:none;border:1px solid #D3DCE6;border-radius:16px;padding:6px 14px;color:#116DFF;cursor:pointer}
.wx-report-map{max-width:760px;margin:0 auto}
.wx-heat24{display:grid;gap:2px;overflow-x:auto}
.wx-heat24-row{display:grid;grid-template-columns:52px repeat(7,minmax(64px,1fr));gap:2px}
.wx-heat24-row em{font-style:normal;font-size:10.5px;color:#3B4F63;text-align:right;padding-right:6px;line-height:16px}
.wx-heat24-row span{height:16px;font-size:10.5px;text-align:center;line-height:16px;border-radius:1px}
.wx-heat24-head b{font-size:12px;font-weight:500;text-align:center;color:#3B4F63;padding-bottom:6px}
@media (max-width:860px){.wx-rbar{grid-template-columns:110px minmax(0,1fr)}.wx-report-head h1{font-size:22px!important}}
`;
