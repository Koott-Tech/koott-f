'use client';

/**
 * The detailed reports (Wix "All Reports"): Traffic over Time, Top Traffic
 * Sources, Traffic by Location, Page Visits, Button Clicks, Top Blog Posts,
 * Blog Activity by Time of Day, Top Search Queries on Google.
 * Data: GET /api/marketing/report/:name — totals only.
 */

import { useEffect, useMemo, useState } from 'react';
import { N, duration, ELEMENT, Tip, AreaChart, WorldMap } from './ui';

export const REPORTS = [
  { k: 'traffic-over-time', grp: 'Traffic', t: 'Traffic over Time', d: 'Learn which days or months get the most site visits.' },
  { k: 'traffic-sources', grp: 'Traffic', t: 'Top Traffic Sources', d: 'See where your site visitors come from.' },
  { k: 'location', grp: 'Traffic', t: 'Traffic by Location', d: 'Find out where visitors to your site come from.' },
  { k: 'page-visits', grp: 'Behavior', t: 'Page Visits', d: 'Learn what the most popular pages on your site are.' },
  { k: 'button-clicks', grp: 'Behavior', t: 'Button Clicks', d: 'Find out which buttons on your site get clicked the most.' },
  { k: 'blog-posts', grp: 'Blog', t: 'Top Blog Posts', d: 'See which posts had the most views.' },
  { k: 'blog-time', grp: 'Blog', t: 'Blog Activity by Time of Day', d: 'Discover the best hours in each day to publish new posts.' },
  { k: 'search-queries', grp: 'Marketing', t: 'Top Search Queries on Google', d: 'See how your site performed for different Google searches.' },
];

const pct = (v, digits = 0) => `${((v || 0) * 100).toFixed(digits)}%`;
const hourLabel = (h) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
function Table({ cols, rows, summary, sortKey: initialSort }) {
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
            <tr key={i}>{cols.map((c) => <td key={c.k} className={c.n ? 'n' : ''}>{c.render ? c.render(r) : c.fmt ? c.fmt(r[c.k], r) : (r[c.k] ?? '—')}</td>)}</tr>
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
  const [opt, setOpt] = useState({ grain: 'day', model: 'last_non_direct', group: 'page', measure: null });
  const [state, setState] = useState({ loading: true, data: null, error: '' });

  const extra = name === 'traffic-over-time' ? `&grain=${opt.grain}` : name === 'traffic-sources' ? `&model=${opt.model}` : name === 'page-visits' ? `&group=${opt.group}` : '';
  useEffect(() => {
    let off = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    request(`report/${name}?from=${dates.from}&to=${dates.to}&env=${env}${extra}`)
      .then((j) => { if (!off) setState({ loading: false, data: j.data, error: '' }); })
      .catch((e) => { if (!off) setState({ loading: false, data: null, error: e.message }); });
    return () => { off = true; };
  }, [name, dates.from, dates.to, env, extra, request]);

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
              <Table cols={view.cols} rows={view.rows} summary={view.summary} sortKey={view.sortKey} />
            </div>
          </>
        )}
    </div>
  );
}

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
