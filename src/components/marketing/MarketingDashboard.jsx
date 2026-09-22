'use client';

/**
 * Koott Insights — the marketing dashboard (/marketing), rebuilt to the two
 * Wix screens Koott used: Analytics Highlights and Traffic Overview.
 *
 * Data: /api/marketing/highlights and /api/marketing/traffic (koott-backend
 * controllers/marketingController.js) — totals only; no client names, phones,
 * emails or individual journeys. Sales and bookings come from payments and
 * sessions; visits and clicks from visitors who accepted analytics cookies.
 */

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStoredToken } from '@/lib/authStorage';
import {
  nf, N, compact, INR, INRfull, duration, ymd, addDays, fmtDay, WEEK, slotLabel, ELEMENT, Change, Tip, useWidth, Spark, AreaChart, BarList, Donut, Columns, SMALL, WorldMap, Section, Col, OpenReport,
} from './ui';
import { REPORTS, REPORT_CSS, ReportsList, ReportView } from './MarketingReports';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/* ------------------------------------------------------------ live */

const LIVE_PAGE = { home: 'the homepage', listing: 'the therapist list', profile: 'a therapist profile', booking: 'the booking page', payment: 'a payment page', blog: 'the blog', service: 'a service page', account: 'their account', topic: 'a topic page' };
const LIVE_TEXT = {
  page_view: (e) => `A visitor is viewing ${LIVE_PAGE[e.page] || 'a page'}.`,
  counsellor_profile_view: () => 'A visitor opened a therapist profile.',
  voice_intro_played: () => 'A visitor played a voice intro.',
  booking_started: () => 'A visitor started a booking.',
  phone_verified: () => 'A visitor verified their phone number.',
  slot_selected: () => 'A visitor picked a time slot.',
  registration_completed: () => 'A new account was created.',
  checkout_started: () => 'A visitor reached checkout.',
  payment_opened: () => 'A visitor opened the payment window.',
  payment_attempt_failed: () => 'A payment attempt failed.',
  payment_failed: () => 'A payment order failed.',
  booking_completed: (e) => `New paid booking${e.value ? ` · ${INRfull(e.value)}` : ''}.`,
  contact_clicked: (e) => `A visitor tapped ${e.method === 'phone' ? 'call' : 'WhatsApp'}.`,
};
const liveText = (e) => (LIVE_TEXT[e.name] || (() => 'Activity on the site.'))(e);
const liveMeta = (e) => [e.region, e.device && e.device[0].toUpperCase() + e.device.slice(1)].filter(Boolean).join(' · ');
const ago = (iso) => { const s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000)); return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : `${Math.round(s / 3600)}h ago`; };

/** Polls /live every 10 s while the tab is visible; shared by the Highlights card and the corner feed. */
function useLive(env, request, enabled) {
  const [state, setState] = useState({ activeNow: 0, feed: [], fresh: [] });
  const cursor = useRef(0); const primed = useRef(false);
  useEffect(() => {
    if (!enabled) return undefined;
    cursor.current = 0; primed.current = false; setState({ activeNow: 0, feed: [], fresh: [] });
    let stop = false;
    const poll = async () => {
      if (stop || document.visibilityState !== 'visible') return;
      try {
        const j = await request(`live?env=${env}${cursor.current ? `&after=${cursor.current}` : ''}`);
        const { activeNow, events } = j.data;
        if (events.length) cursor.current = Math.max(cursor.current, ...events.map((e) => e.id));
        setState((s) => ({ activeNow, feed: [...events, ...s.feed].slice(0, 20), fresh: primed.current ? events.slice(0, 3) : [] }));
        primed.current = true;
      } catch (_) { /* best effort */ }
    };
    poll();
    const id = setInterval(poll, 10000);
    const onVis = () => { if (document.visibilityState === 'visible') poll(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { stop = true; clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, [env, request, enabled]);
  return state;
}

function LiveCorner({ live, open, setOpen }) {
  const [toasts, setToasts] = useState([]);
  const [muted, setMuted] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => { try { setMuted(localStorage.getItem('koott-mk-live-muted') === '1'); } catch (_) { /* ignore */ } }, []);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 15000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!live.fresh.length) return;
    const add = live.fresh.map((e) => ({ ...e, key: `${e.id}-${Date.now()}` }));
    setToasts((t) => [...add, ...t].slice(0, 3));
    add.forEach((e) => setTimeout(() => setToasts((t) => t.filter((x) => x.key !== e.key)), 6000));
  }, [live.fresh]);
  const toggleMute = () => setMuted((m) => { try { localStorage.setItem('koott-mk-live-muted', m ? '0' : '1'); } catch (_) { /* ignore */ } return !m; });
  return (
    <div className="wx-live" aria-live="polite">
      {!muted && !open && toasts.map((e) => (
        <div key={e.key} className={`wx-toast is-${e.name === 'booking_completed' ? 'good' : /failed/.test(e.name) ? 'bad' : 'plain'}`}>
          <span className="wx-livedot" /><div><b>{liveText(e)}</b><small>{liveMeta(e) || 'Just now'}</small></div>
        </div>
      ))}
      {open && (
        <div className="wx-live-panel" role="dialog" aria-label="Real-time activity">
          <div className="wx-live-head"><b>Real-time activity</b><button type="button" className="wx-link" onClick={toggleMute}>{muted ? 'Turn pop-ups on' : 'Mute pop-ups'}</button><button type="button" className="wx-x" aria-label="Close" onClick={() => setOpen(false)}>×</button></div>
          {live.feed.length ? (
            <ul>{live.feed.map((e) => <li key={e.id}><span className="wx-livedot" /><div><b>{liveText(e)}</b><small>{[liveMeta(e), ago(e.at)].filter(Boolean).join(' · ')}</small></div></li>)}</ul>
          ) : <p className="wx-empty">No activity in the last 24 hours.</p>}
        </div>
      )}
      <button type="button" className="wx-live-pill" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={`wx-beacon${live.activeNow ? ' is-on' : ''}`} />{live.activeNow ? `${N(live.activeNow)} live visitor${live.activeNow === 1 ? '' : 's'}` : 'No live visitors'}{muted && ' · muted'}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------ Highlights */

function KeyStat({ title, stat, fmt = N }) {
  return (
    <div className="wx-kpi">
      <span className="wx-kpi-t">{title}</span>
      <div className="wx-kpi-row"><b>{fmt(stat.value)}</b><Change now={stat.value} prev={stat.prev} /><Spark values={stat.spark} /></div>
      <small>{fmt(stat.today)} today • {fmt(stat.yesterday)} yesterday</small>
    </div>
  );
}

function Highlights({ d, live, openLive, goTraffic }) {
  const k = d.keyStats;
  const [heatTip, setHeatTip] = useState(null);
  const latest = live.feed.find((e) => e.name !== 'page_view') || live.feed[0];
  const hmMax = Math.max(1, ...d.blog.heatmap.flat());
  const shade = (v) => (v ? ['#D6E6FF', '#A9C9FF', '#76A8FF', '#3F86FF', '#116DFF'][Math.min(4, Math.floor((v / hmMax) * 4.999))] : '#EEF2F6');
  const s = d.engagement.stats;
  const q = d.marketing.search; const m = d.marketing.meta;
  return (
    <>
      <div className="wx-toprow">
        <div className="wx-card wx-livecard">
          <div className="wx-livecard-head"><span className={`wx-beacon${live.activeNow ? ' is-on' : ''}`} /> {N(live.activeNow)} live visitor{live.activeNow === 1 ? '' : 's'}</div>
          <div className="wx-livecard-box">{latest ? liveText(latest) : 'Waiting for the next visitor…'}</div>
          <button type="button" className="wx-link" onClick={openLive}>View Real-time Activity</button>
        </div>
        <div className="wx-card wx-askcard">
          <div className="wx-ask-head">✦ Ask a question about your stats <span className="wx-soon">Coming soon</span></div>
          <div className="wx-ask-input">How much time do people spend on my website?</div>
          <div className="wx-ask-chips"><span>✦ What traffic categories result in the shortest visits on my site?</span><span>✦ How much did Meta ads bring this month?</span></div>
        </div>
      </div>

      <section className="wx-section">
        <header className="wx-section-head"><h2 className="wx-h2-sm">Key stats</h2></header>
        <div className="wx-kpis">
          <KeyStat title="Site sessions" stat={k.sessions} />
          <KeyStat title="Clicks to contact" stat={k.contactClicks} />
          <KeyStat title="Total sales" stat={k.totalSales} fmt={INR} />
          <KeyStat title="Total orders" stat={k.totalOrders} />
          <KeyStat title="Unique visitors" stat={k.uniqueVisitors} />
          <KeyStat title="Bookings" stat={k.bookings} />
          <KeyStat title="Post views" stat={k.postViews} />
        </div>
      </section>

      <Section title="Track your sales">
        <div className="wx-cols">
          <Col title="Top selling items">
            {d.sales.topSelling.length ? d.sales.topSelling.map((t) => (
              <div key={t.name} className="wx-item">
                {t.photo ? <img src={t.photo} alt="" className="wx-item-img" /> : <span className="wx-item-img wx-item-ph">{t.name[0]}</span>}
                <div className="wx-item-txt"><b>{t.name}</b><small>{N(t.itemsSold)} items sold</small></div>
                <Change now={t.revenue} prev={t.prevRevenue} showZero={false} /><b>{INR(t.revenue)}</b>
              </div>
            )) : <p className="wx-empty">No sales in this period.</p>}
          </Col>
          <Col title="Sales by source and category">
            <BarList fmt={INRfull} rows={d.sales.bySource.map((r) => ({ label: r.label, value: r.revenue, prev: r.prev }))} empty="No sales in this period." />
          </Col>
          <div className="wx-col wx-center">
            <div className="wx-lock" aria-hidden="true">🔒</div>
            <b>Can’t show top paying customers</b>
            <p>Data containing personal details can’t be shown — client identities stay private on Koott.</p>
          </div>
        </div>
      </Section>

      <Section title="Get to know your visitors" action={<button type="button" className="wx-btn" onClick={goTraffic}>Go to Traffic Overview</button>}>
        <div className="wx-cols">
          <Col title="Sessions over time" report="traffic-over-time"><AreaChart rows={d.visitors.sessionsOverTime} keys={[{ key: 'sessions', label: 'Sessions' }]} height={180} /></Col>
          <Col title="Top traffic sources" report="traffic-sources"><BarList rows={d.visitors.topSources.map((r) => ({ label: r.label, value: r.sessions, prev: r.prev }))} /></Col>
          <Col title="Sessions by location" report="location"><WorldMap rows={d.visitors.countries} mode="bubbles" /></Col>
        </div>
      </Section>

      <Section title="Explore visitor engagement">
        <div className="wx-cols">
          <Col title="Most visited pages by sessions" report="page-visits">
            <BarList rows={d.engagement.topPages.map((p) => ({ label: p.path, value: p.sessions, prev: p.prev }))} />
          </Col>
          <Col title="Engagement stats">
            <div className="wx-eng">
              <div><span>▤ Avg pages per session</span><Change now={s.current.pagesPerSession} prev={s.previous.pagesPerSession} showZero={false} /><b>{s.current.pagesPerSession.toFixed(1)}</b></div>
              <div><span>◷ Avg session duration</span><Change now={s.current.avgDuration} prev={s.previous.avgDuration} showZero={false} /><b>{duration(s.current.avgDuration)}</b></div>
              <div><span>↩ Bounce rate</span><Change now={s.current.bounceRate} prev={s.previous.bounceRate} inverse showZero={false} /><b>{(s.current.bounceRate * 100).toFixed(1)}%</b></div>
            </div>
          </Col>
          <Col title="Most clicked buttons" report="button-clicks" info="Buttons tagged for tracking, and the page they were clicked on.">
            {d.engagement.buttons.length ? d.engagement.buttons.map((b) => (
              <div key={`${b.element}${b.path}`} className="wx-btnrow"><div><b>{ELEMENT[b.element] || b.element.replace(/_/g, ' ')}</b><small>on <u>{b.path}</u></small></div><b>{N(b.clicks)}</b></div>
            )) : <p className="wx-empty">No button clicks yet.</p>}
          </Col>
        </div>
      </Section>

      <Section title="Analyze marketing performance">
        <div className="wx-cols">
          <Col title="Clicks by Google searches" report="search-queries">
            {!q?.configured ? (
              <p className="wx-empty">Connect Google Search Console to see searches: set SEARCH_CONSOLE_SITE_URL on the backend and add the Google service account as a user on the Search Console property.</p>
            ) : q.error ? <p className="wx-empty">Search Console: {q.error}</p> : (
              <>
                <div className="wx-bignum">{N(q.clicks)} <Change now={q.clicks} prev={q.previousClicks} /></div>
                {q.queries.map((r) => (
                  <div key={r.query} className="wx-query"><div><span>{r.query}</span><small>Avg. position: {r.position}</small></div>{r.previousClicks != null && <Change now={r.clicks} prev={r.previousClicks} showZero={false} />}<b>{N(r.clicks)}</b></div>
                ))}
                {q.lastReported && <small className="wx-muted">Google last reported: {fmtDay(q.lastReported)}</small>}
              </>
            )}
          </Col>
          <div className="wx-col wx-center">
            <b>Meta Conversions API</b>
            <p>{m.sending ? 'Sending verified purchases to Meta.' : 'Set up — not sending yet.'}</p>
            <div className="wx-meta-nums"><div><b>{N(m.prepared)}</b><small>prepared</small></div><div><b>{N(m.held)}</b><small>held</small></div><div><b>{N(m.sent)}</b><small>sent</small></div></div>
            <small className="wx-muted">{m.holdReason || (m.testMode ? 'Test mode (Events Manager → Test events)' : `Graph API ${m.version}`)}</small>
          </div>
          <div className="wx-col wx-center">
            <b>Meta Pixel</b>
            <p>{m.pixelConfigured ? 'Pixel ID set.' : 'Pixel ID not set yet.'} Browser events load only with advertising consent, never on condition or blog pages.</p>
            <small className="wx-muted">PageView · ViewContent · Lead · CompleteRegistration · InitiateCheckout · Contact</small>
          </div>
        </div>
      </Section>

      <Section title="Monitor blog performance" action={<BlogReportLinks />}>
        <div className="wx-cols wx-cols-blog">
          <div className="wx-col">
            <div className="wx-blog-head"><h3>Blog posts by publish date</h3><span>Views</span><span>Clicks</span><span>Avg. read time</span></div>
            {d.blog.posts.length ? d.blog.posts.map((p) => (
              <div key={p.path} className="wx-blog-row">
                <div className="wx-blog-title">
                  {p.image ? <img src={p.image} alt="" /> : <span className="wx-item-ph">B</span>}
                  <div><a href={p.path} target="_blank" rel="noreferrer">{p.title}</a><small>{p.publishedAt ? fmtDay(p.publishedAt.slice(0, 10), { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</small></div>
                </div>
                <span><Change now={p.views} prev={p.prevViews} showZero={false} /> {N(p.views)}</span>
                <span>{N(p.clicks)}</span>
                <span>{duration(p.avgReadSeconds)}</span>
              </div>
            )) : <p className="wx-empty">No published posts.</p>}
          </div>
          <div className="wx-col">
            <h3>Post views by time of day</h3>
            <div className="wx-heat">
              {Array.from({ length: 12 }, (_, slot) => (
                <div key={slot} className="wx-heat-row">
                  {WEEK.map((w, dow) => (
                    <span key={w} style={{ background: shade(d.blog.heatmap[dow][slot]) }}
                      onMouseMove={(e) => setHeatTip({ x: e.clientX, y: e.clientY, content: <><b>{w}, {slotLabel(slot)}</b>{N(d.blog.heatmap[dow][slot])} views</> })}
                      onMouseLeave={() => setHeatTip(null)} />
                  ))}
                  <em>{slotLabel(slot)}</em>
                </div>
              ))}
              <div className="wx-heat-row wx-heat-days">{WEEK.map((w) => <b key={w}>{w}</b>)}<em /></div>
              <div className="wx-heat-scale"><span /><span /><span /><span /><span /></div>
              <div className="wx-heat-scale-l"><small>0</small><small>{N(hmMax)}</small></div>
            </div>
            <Tip tip={heatTip} />
          </div>
        </div>
      </Section>
    </>
  );
}

/* ------------------------------------------------------------ Traffic */

function ReportBtn({ name }) {
  const open = useContext(OpenReport);
  return open ? <button type="button" className="wx-link wx-col-report" onClick={() => open(name)}>View Report</button> : null;
}
function BlogReportLinks() {
  const open = useContext(OpenReport);
  if (!open) return null;
  return <span className="wx-section-links"><button type="button" className="wx-btn" onClick={() => open('blog-posts')}>Top Blog Posts</button><button type="button" className="wx-btn" onClick={() => open('blog-time')}>Activity by Time of Day</button></span>;
}

function Traffic({ d }) {
  const [page, setPage] = useState(0);
  const [ins, setIns] = useState(0);
  const pageRows = d.countries.slice(page * 6, page * 6 + 6);
  const cmax = Math.max(1, ...d.countries.map((c) => c.sessions));
  const insight = d.insights[ins];
  return (
    <div className="wx-traffic">
      <div className="wx-traffic-main">
        <div className="wx-card wx-duo">
          <div><span>Site sessions</span><b>{N(d.sessions)} <Change now={d.sessions} prev={d.prevSessions} /></b></div>
          <div><span>Unique visitors</span><b>{N(d.visitors)} <Change now={d.visitors} prev={d.prevVisitors} /></b></div>
        </div>
        <div className="wx-card">
          <h3 className="wx-card-t">Sessions over time<ReportBtn name="traffic-over-time" /></h3>
          <AreaChart rows={d.sessionsOverTime} keys={[{ key: 'sessions', label: 'This period' }, { key: 'previous', label: 'Previous period' }]} height={240} />
        </div>
        <div className="wx-duo-cards">
          <div className="wx-card">
            <h3 className="wx-card-t">New vs returning visitors</h3>
            <Donut center="Unique visitors" total={d.newVsReturning.total} parts={[{ label: 'New', value: d.newVsReturning.new, color: '#116DFF' }, { label: 'Returning', value: d.newVsReturning.returning, color: '#2FB3E8' }]} />
          </div>
          <div className="wx-card">
            <h3 className="wx-card-t">Sessions by device</h3>
            <Donut center="Site sessions" total={d.devices.reduce((t, x) => t + x.sessions, 0)} parts={[
              { label: 'Mobile', value: d.devices[0].sessions, color: '#116DFF' },
              { label: 'Desktop', value: d.devices[1].sessions, color: '#2FB3E8' },
              { label: 'Tablet', value: d.devices[2].sessions, color: '#7B61FF' },
            ]} />
          </div>
        </div>
        <div className="wx-card">
          <h3 className="wx-card-t">Sessions by country<ReportBtn name="location" /></h3>
          <div className="wx-country">
            <div>
              <WorldMap rows={d.countries} mode="choropleth" />
              <div className="wx-scale"><small>1</small><span /><small>{N(cmax)}</small></div>
            </div>
            <div>
              <h4>Countries</h4>
              {pageRows.length ? pageRows.map((c) => (
                <div key={c.country} className="wx-bl-row">
                  <div className="wx-bl-top"><span className="wx-bl-label">{c.country}</span><b>{N(c.sessions)}</b></div>
                  <div className="wx-bl-track"><span style={{ width: `${Math.max(1.5, (c.sessions / cmax) * 100)}%` }} /></div>
                </div>
              )) : <p className="wx-empty">No sessions yet.</p>}
              {d.countries.length > 6 && (
                <div className="wx-pager">
                  <button type="button" disabled={!page} onClick={() => setPage((p) => p - 1)} aria-label="Previous countries">‹</button>
                  <button type="button" disabled={(page + 1) * 6 >= d.countries.length} onClick={() => setPage((p) => p + 1)} aria-label="Next countries">›</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="wx-traffic-side">
        <div className="wx-card">
          <h3 className="wx-card-t">Sessions <span className="wx-muted">by</span> source and category<ReportBtn name="traffic-sources" /></h3>
          <BarList rows={d.sources.map((r) => ({ label: r.label, value: r.sessions, prev: r.prev }))} />
        </div>
        <div className="wx-card">
          <h3 className="wx-card-t">Avg. sessions by day</h3>
          <Columns rows={d.avgByDay.map((r) => ({ label: WEEK[r.dow], value: r.avg }))} />
        </div>
        <div className="wx-card">
          <h3 className="wx-card-t">Traffic insights</h3>
          {insight ? (
            <>
              <p className="wx-insight">
                {insight.kind === 'drop'
                  ? <>Traffic to this page dropped significantly in this period: <b>{insight.path}</b> ({N(insight.before)} → {N(insight.now)} sessions).</>
                  : <>Traffic to this page grew significantly in this period: <b>{insight.path}</b> ({N(insight.before)} → {N(insight.now)} sessions).</>}
              </p>
              {d.insights.length > 1 && (
                <div className="wx-pager">
                  <button type="button" disabled={!ins} onClick={() => setIns((i) => i - 1)} aria-label="Previous insight">‹</button>
                  <button type="button" disabled={ins >= d.insights.length - 1} onClick={() => setIns((i) => i + 1)} aria-label="Next insight">›</button>
                </div>
              )}
            </>
          ) : <p className="wx-empty">No big changes in traffic this period.</p>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ shell */

const RANGES = [[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days'], [365, 'Last 365 days']];

export default function MarketingDashboard() {
  const { user, logout } = useAuth();
  const [meta, setMeta] = useState(null);
  const [notReady, setNotReady] = useState(null);
  const [page, setPage] = useState('highlights');
  const [range, setRange] = useState(30);
  const [env, setEnv] = useState('production');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);

  const request = useCallback(async (path) => {
    const token = getStoredToken?.();
    const res = await fetch(`${API}/marketing/${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const json = await res.json().catch(() => ({}));
    if (res.status === 503 && json.code === 'NOT_MIGRATED') { const e = new Error(json.message); e.notReady = true; throw e; }
    if (!res.ok || json.success === false) throw new Error(json.message || `Could not load (${res.status}).`);
    return json;
  }, []);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('koott-mk2') || '{}');
      if (['highlights', 'traffic', 'reports'].includes(s.page) || REPORTS.some((r) => `report:${r.k}` === s.page)) setPage(s.page);
      if (RANGES.some(([r]) => r === s.range)) setRange(s.range);
      if (['production', 'staging', 'development'].includes(s.env)) setEnv(s.env);
    } catch (_) { /* ignore */ }
  }, []);
  useEffect(() => { try { localStorage.setItem('koott-mk2', JSON.stringify({ page, range, env })); } catch (_) { /* ignore */ } }, [page, range, env]);

  useEffect(() => {
    request('meta').then((j) => setMeta(j.data)).catch((e) => (e.notReady ? setNotReady(e.message) : setError(e.message)));
  }, [request]);

  const dates = useMemo(() => {
    const to = meta?.today || ymd(new Date());
    const from = addDays(to, -(range - 1));
    return { from, to, prevFrom: addDays(from, -range), prevTo: addDays(from, -1) };
  }, [meta, range]);

  useEffect(() => {
    if (!meta || !['highlights', 'traffic'].includes(page)) return undefined;
    let off = false;
    setLoading(true); setError('');
    request(`${page}?from=${dates.from}&to=${dates.to}&env=${env}`)
      .then((j) => { if (!off) { setNotReady(null); setData({ page, d: j.data }); } })
      .catch((e) => { if (!off) { if (e.notReady) setNotReady(e.message); else setError(e.message); } })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [meta, page, dates, env, request]);

  const live = useLive(env, request, !!meta && !notReady);
  const envs = meta?.environments || {};
  const envOptions = ['production', 'staging', 'development'].filter((e) => e === 'production' || envs[e] > 0);
  const reportName = page.startsWith('report:') ? page.slice(7) : null;
  const openReport = useCallback((name) => { setPage(`report:${name}`); window.scrollTo(0, 0); }, []);
  const title = page === 'highlights' ? 'Analytics Highlights' : page === 'reports' ? 'All Reports' : 'Traffic Overview';
  const sub = page === 'highlights' ? 'Get a complete overview of your site’s activity across all areas.' : page === 'reports' ? 'Dig into the details of your site’s traffic, visitors and content.' : 'Track your site’s traffic trends and get to know your visitors.';
  const show = data && data.page === page;
  const isReports = page === 'reports' || !!reportName;
  const rangeSelect = (
    <select value={range} onChange={(e) => setRange(Number(e.target.value))} aria-label="Date range">
      {RANGES.map(([r, l]) => <option key={r} value={r}>{l}{r === range ? ` (${fmtDay(dates.from)} - Today)` : ''}</option>)}
    </select>
  );

  return (
    <div className="wx">
      <style dangerouslySetInnerHTML={{ __html: CSS + REPORT_CSS }} />
      <aside className="wx-side">
        <div className="wx-brand"><span className="wx-mk">K</span><div><b>Koott</b><small>Insights</small></div></div>
        <div className="wx-navgrp">Analytics</div>
        <nav aria-label="Analytics">
          <button type="button" aria-current={page === 'highlights' ? 'page' : undefined} onClick={() => setPage('highlights')}>Highlights</button>
          <button type="button" onClick={() => setLiveOpen(true)}>Real-time</button>
          <button type="button" aria-current={page === 'traffic' ? 'page' : undefined} onClick={() => setPage('traffic')}>Traffic</button>
          <button type="button" aria-current={isReports ? 'page' : undefined} onClick={() => setPage('reports')}>Reports</button>
        </nav>
        <div className="wx-who"><b>{user?.name || user?.email}</b><small>{user?.role}</small><button type="button" onClick={() => { logout(); window.location.href = '/marketing/login'; }}>Sign out</button></div>
      </aside>

      <main className="wx-main">
        <div className="wx-mobnav">
          <button type="button" aria-pressed={page === 'highlights'} onClick={() => setPage('highlights')}>Highlights</button>
          <button type="button" aria-pressed={page === 'traffic'} onClick={() => setPage('traffic')}>Traffic</button>
          <button type="button" aria-pressed={isReports} onClick={() => setPage('reports')}>Reports</button>
        </div>
        {!reportName && <div className="wx-head">
          <div><h1>{title}</h1><p>{sub}</p></div>
          {envOptions.length > 1 && (
            <label className="wx-env">Data
              <select value={env} onChange={(e) => setEnv(e.target.value)}>{envOptions.map((e) => <option key={e} value={e}>{e[0].toUpperCase() + e.slice(1)}</option>)}</select>
            </label>
          )}
        </div>}
        {!isReports && <div className="wx-range">
          {rangeSelect}
          <span>compared to previous period ({fmtDay(dates.prevFrom)} - {fmtDay(dates.prevTo, { month: 'short', day: 'numeric', year: 'numeric' })})</span>
          {loading && <span className="wx-muted">Updating…</span>}
        </div>}
        {env !== 'production' && <div className="wx-banner">Showing <b>{env}</b> data (test traffic), not the live site.</div>}

        {notReady ? (
          <div className="wx-card"><b>Almost there</b><p>{notReady}</p></div>
        ) : error ? (
          <div className="wx-card"><b>Couldn’t load this report</b><p>{error}</p></div>
        ) : page === 'reports' ? <ReportsList open={openReport} />
          : reportName ? (meta ? <ReportView key={reportName} name={reportName} request={request} dates={dates} env={env} rangeControl={rangeSelect} goAll={() => setPage('reports')} /> : <p className="wx-empty">Loading…</p>)
          : !show ? <p className="wx-empty">Loading…</p> : (
            <OpenReport.Provider value={openReport}>
              {page === 'highlights'
                ? <Highlights d={data.d} live={live} openLive={() => setLiveOpen(true)} goTraffic={() => setPage('traffic')} />
                : <Traffic d={data.d} />}
            </OpenReport.Provider>
          )}
      </main>
      {meta && !notReady && <LiveCorner live={live} open={liveOpen} setOpen={setLiveOpen} />}
    </div>
  );
}

const CSS = `
.wx-col-report{float:right;font-weight:400}
.wx-section-links{display:flex;gap:8px;flex-wrap:wrap}
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap');
.wx{display:grid;grid-template-columns:220px minmax(0,1fr);min-height:100vh;background:#EEF1F5;color:#162D3D;font-family:'Figtree',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;font-size:14px;line-height:1.45}
.wx *{box-sizing:border-box}
.wx h1,.wx h2,.wx h3,.wx h4{font-family:inherit!important;letter-spacing:0!important;color:#162D3D!important;margin:0!important}
.wx button,.wx select{font:inherit;color:inherit}
.wx-side{background:#15191E;color:#C9D1D9;position:sticky;top:0;height:100vh;padding:14px 10px;display:flex;flex-direction:column}
.wx-brand{display:flex;gap:10px;align-items:center;padding:4px 8px 16px}
.wx-mk{width:30px;height:30px;border-radius:7px;background:#116DFF;color:#fff!important;display:grid;place-items:center;font-weight:700}
.wx-brand b{color:#fff;display:block}
.wx-brand small{color:#8C97A3}
.wx-navgrp{font-size:13px;color:#E6EBF0;padding:8px 10px 6px;font-weight:600}
.wx-side nav button{display:block;width:100%;text-align:left;background:none;border:0;color:#C9D1D9;padding:6px 10px 6px 26px;border-radius:6px;cursor:pointer;font-size:13px}
.wx-side nav button:hover{background:#232A31}
.wx-side nav button[aria-current="page"]{background:#2B333C;color:#fff}
.wx-who{margin-top:auto;border-top:1px solid #2B333C;padding:12px 10px 4px;display:grid;gap:2px;font-size:12.5px}
.wx-who b{color:#fff;overflow:hidden;text-overflow:ellipsis}
.wx-who small{color:#8C97A3}
.wx-who button{justify-self:start;margin-top:6px;background:#232A31;border:0;border-radius:6px;padding:4px 10px;color:#C9D1D9;cursor:pointer}
.wx-main{min-width:0;padding:24px 28px 80px;max-width:1260px}
.wx-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.wx-head h1{font-size:28px!important;font-weight:700!important;line-height:1.2!important}
.wx-head p{margin:2px 0 0;color:#3B4F63}
.wx-env{display:flex;gap:6px;align-items:center;font-size:12.5px;color:#3B4F63}
.wx-env select,.wx-range select{background:#fff;border:1px solid #D3DCE6;border-radius:6px;padding:6px 10px;font-size:13.5px}
.wx-range{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:18px 0 14px;color:#3B4F63}
.wx-banner{background:#FFF4D6;border-radius:6px;padding:8px 12px;margin-bottom:14px;font-size:13px}
.wx-card,.wx-section{background:#fff;border-radius:8px;box-shadow:0 1px 2px rgba(22,45,61,.06),0 0 0 1px rgba(22,45,61,.04)}
.wx-card{padding:16px 18px}
.wx-card p{margin:6px 0 0}
.wx-section{margin-bottom:16px}
.wx-section-head{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid #EEF1F5}
.wx-section-head h2{font-size:17px!important;font-weight:700!important}
.wx-h2-sm{font-size:14px!important}
.wx-section-body{padding:16px 18px}
.wx-btn{background:#116DFF;color:#fff!important;border:0;border-radius:18px;padding:6px 14px;font-size:12.5px;font-weight:600;cursor:pointer}
.wx-link{background:none;border:0;color:#116DFF;padding:0;cursor:pointer;font-size:12.5px}
.wx-muted{color:#6B7C8D;font-size:12px}
.wx-empty{color:#6B7C8D;font-size:13px;margin:6px 0}
.wx-chg{font-size:11.5px;font-weight:600;white-space:nowrap}
.wx-chg.is-up{color:#25A55F}.wx-chg.is-down{color:#E62214}.wx-chg.is-flat{color:#6B7C8D}
.wx-toprow{display:grid;grid-template-columns:1fr 2fr;gap:16px;margin-bottom:16px}
.wx-livecard{display:grid;gap:10px;align-content:start}
.wx-livecard-head{display:flex;align-items:center;gap:8px;font-weight:600}
.wx-livecard-box{border:1px solid #E1E7EE;border-radius:6px;padding:10px 12px;font-size:13px;min-height:42px}
.wx-livecard .wx-link{justify-self:start}
.wx-ask-head{font-weight:600;display:flex;gap:8px;align-items:center}
.wx-soon{font-size:10.5px;font-weight:700;text-transform:uppercase;color:#6B7C8D;border:1px solid #D3DCE6;border-radius:999px;padding:0 7px}
.wx-ask-input{margin:12px 0;background:#EEF4FF;border-radius:6px;padding:10px 12px;color:#6B7C8D}
.wx-ask-chips{display:flex;gap:8px;overflow:hidden}
.wx-ask-chips span{white-space:nowrap;border:1px solid #D3DCE6;border-radius:6px;padding:6px 10px;font-size:12.5px;color:#3B4F63}
.wx-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:14px 18px 18px}
.wx-kpi{border:1px solid #E1E7EE;border-radius:6px;padding:10px 12px}
.wx-kpi-t{font-size:12.5px;color:#162D3D}
.wx-kpi-row{display:flex;align-items:center;gap:8px}
.wx-kpi-row b{font-size:20px;font-weight:700}
.wx-kpi small{color:#3B4F63;font-size:12px}
.wx-spark{width:64px;height:20px;margin-left:auto}
.wx-cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}
.wx-col{padding:0 18px;min-width:0}
.wx-col+.wx-col{border-left:1px solid #EEF1F5}
.wx-col:first-child{padding-left:0}.wx-col:last-child{padding-right:0}
.wx-col h3{font-size:13.5px!important;font-weight:600!important;margin-bottom:12px!important;display:flex;gap:6px;align-items:center}
.wx-info{color:#116DFF;font-size:12px;cursor:help}
.wx-center{text-align:center;display:grid;place-items:center;align-content:center;gap:6px;padding:10px 18px}
.wx-center p{margin:0;color:#3B4F63;font-size:13px;max-width:34ch}
.wx-lock{font-size:30px}
.wx-item{display:flex;align-items:center;gap:10px;padding:8px 0}
.wx-item-img{width:34px;height:34px;border-radius:50%;object-fit:cover;flex:none}
.wx-item-ph{display:grid;place-items:center;background:#EEF4FF;color:#116DFF;font-weight:700;width:34px;height:34px;border-radius:50%;flex:none}
.wx-item-txt{flex:1;min-width:0}
.wx-item-txt b{display:block;font-weight:500;font-size:13px}
.wx-item-txt small{color:#6B7C8D}
.wx-item > b{font-size:13px}
.wx-barlist{display:grid;gap:14px}
.wx-bl-top{display:flex;align-items:center;gap:8px;font-size:13px}
.wx-bl-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#116DFF}
.wx-bl-top b{font-weight:600}
.wx-bl-track{height:4px;background:#EEF1F5;border-radius:2px;margin-top:5px;overflow:hidden}
.wx-bl-track span{display:block;height:100%;background:#116DFF;border-radius:2px}
.wx-traffic .wx-bl-label{color:#162D3D}
.wx-chart{position:relative;width:100%}
.wx-chart svg{display:block}
.wx-keys{display:flex;gap:16px;font-size:12px;color:#3B4F63;margin-top:6px}
.wx-keys i{display:inline-block;width:14px;height:2px;background:#116DFF;vertical-align:middle;margin-right:6px}
.wx-keys i.is-prev{background:repeating-linear-gradient(90deg,#9CB8E6 0 4px,transparent 4px 7px)}
.wx-tip{position:fixed;z-index:90;pointer-events:none;background:#162D3D;color:#fff;border-radius:6px;padding:7px 10px;font-size:12px;max-width:240px}
.wx-tip b{display:block}
.wx-map{position:relative;width:100%}
.wx-map svg{display:block}
.wx-eng{display:grid}
.wx-eng div{display:flex;align-items:center;gap:8px;padding:12px 0;border-bottom:1px solid #EEF1F5;font-size:13px}
.wx-eng div:last-child{border-bottom:0}
.wx-eng span:first-child{flex:1}
.wx-btnrow{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;font-size:13px}
.wx-btnrow small{display:block;color:#6B7C8D}
.wx-bignum{font-size:22px;font-weight:700;margin-bottom:10px;display:flex;gap:8px;align-items:center}
.wx-query{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px}
.wx-query div{flex:1}
.wx-query small{display:block;color:#6B7C8D}
.wx-meta-nums{display:flex;gap:18px;margin:6px 0}
.wx-meta-nums div{display:grid}
.wx-meta-nums b{font-size:18px}
.wx-meta-nums small{color:#6B7C8D}
.wx-cols-blog{grid-template-columns:3fr 2fr}
.wx-blog-head,.wx-blog-row{display:grid;grid-template-columns:minmax(0,1fr) 90px 60px 100px;gap:10px;align-items:center}
.wx-blog-head{font-size:12.5px;color:#3B4F63;padding-bottom:8px}
.wx-blog-head h3{margin:0!important}
.wx-blog-head span,.wx-blog-row > span{text-align:right}
.wx-blog-row{padding:12px 0;border-top:1px solid #EEF1F5;font-size:13px}
.wx-blog-title{display:flex;gap:10px;align-items:center;min-width:0}
.wx-blog-title img{width:34px;height:34px;border-radius:6px;object-fit:cover;flex:none}
.wx-blog-title > div{min-width:0}
.wx-blog-title a{color:#162D3D;text-decoration:none;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wx-blog-title a:hover{color:#116DFF}
.wx-blog-title small{color:#6B7C8D}
.wx-heat{display:grid;gap:2px}
.wx-heat-row{display:grid;grid-template-columns:repeat(7,1fr) 44px;gap:2px}
.wx-heat-row span{height:12px;border-radius:1px}
.wx-heat-row em{font-style:normal;font-size:9.5px;color:#3B4F63;line-height:12px;padding-left:4px}
.wx-heat-days b{font-size:11px;font-weight:500;text-align:center;color:#3B4F63;padding-top:4px}
.wx-heat-scale{display:grid;grid-template-columns:repeat(5,1fr);margin-top:8px;height:6px;max-width:calc(100% - 46px)}
.wx-heat-scale span:nth-child(1){background:#D6E6FF}.wx-heat-scale span:nth-child(2){background:#A9C9FF}.wx-heat-scale span:nth-child(3){background:#76A8FF}.wx-heat-scale span:nth-child(4){background:#3F86FF}.wx-heat-scale span:nth-child(5){background:#116DFF}
.wx-heat-scale-l{display:flex;justify-content:space-between;color:#6B7C8D;max-width:calc(100% - 46px)}
.wx-traffic{display:grid;grid-template-columns:minmax(0,2.1fr) minmax(0,1fr);gap:16px;align-items:start}
.wx-traffic-main,.wx-traffic-side{display:grid;gap:16px}
.wx-card-t{font-size:14px!important;font-weight:600!important;margin-bottom:14px!important}
.wx-duo{display:grid;grid-template-columns:1fr 1fr}
.wx-duo div{display:grid;gap:4px;padding:4px 18px}
.wx-duo div+div{border-left:1px solid #EEF1F5}
.wx-duo span{font-size:13px}
.wx-duo b{font-size:20px;font-weight:600;display:flex;gap:8px;align-items:center}
.wx-duo-cards{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.wx-donut{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.wx-legend{list-style:none;margin:0;padding:0;display:grid;gap:10px;font-size:13px}
.wx-legend li{display:flex;gap:8px;align-items:flex-start}
.wx-legend small{display:block;color:#3B4F63}
.wx-dot{width:9px;height:9px;border-radius:50%;margin-top:5px;flex:none}
.wx-country{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:18px}
.wx-country h4{font-size:13px!important;font-weight:600!important;margin-bottom:12px!important}
.wx-country .wx-bl-row{margin-bottom:14px}
.wx-scale{display:flex;align-items:center;gap:8px;margin-top:8px}
.wx-scale span{width:70px;height:8px;background:linear-gradient(90deg,#CDE1FF,#116DFF)}
.wx-scale small{color:#3B4F63}
.wx-pager{display:flex;gap:8px;justify-content:center;margin-top:8px}
.wx-pager button{width:26px;height:26px;border-radius:50%;border:1px solid #D3DCE6;background:#fff;color:#116DFF;cursor:pointer}
.wx-pager button:disabled{color:#B7C3CF;cursor:default}
.wx-insight{margin:0;font-size:13px}
.wx-live{position:fixed;right:18px;bottom:18px;z-index:80;display:flex;flex-direction:column;align-items:flex-end;gap:8px;max-width:calc(100vw - 36px)}
.wx-live-pill{display:inline-flex;align-items:center;gap:8px;background:#162D3D;color:#fff!important;border:0;border-radius:999px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.2)}
.wx-beacon{width:9px;height:9px;border-radius:50%;background:#9AAAB8;position:relative;display:inline-block}
.wx-beacon.is-on{background:#25A55F}
.wx-beacon.is-on::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:2px solid #25A55F;opacity:.6;animation:wx-ping 1.8s ease-out infinite}
@keyframes wx-ping{from{transform:scale(.6);opacity:.7}to{transform:scale(1.6);opacity:0}}
.wx-toast{display:flex;gap:10px;align-items:flex-start;background:#fff;border-radius:8px;padding:10px 14px;width:320px;max-width:100%;box-shadow:0 10px 26px rgba(22,45,61,.2);animation:wx-in .25s ease-out}
@keyframes wx-in{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
.wx-toast b,.wx-live-panel li b{display:block;font-size:13px;font-weight:600}
.wx-toast small,.wx-live-panel li small{display:block;color:#6B7C8D;font-size:12px}
.wx-livedot{flex:none;width:8px;height:8px;border-radius:50%;margin-top:5px;background:#116DFF}
.wx-toast.is-good .wx-livedot{background:#25A55F}.wx-toast.is-bad .wx-livedot{background:#E62214}
.wx-live-panel{width:360px;max-width:100%;max-height:min(460px,70vh);overflow:auto;background:#fff;border-radius:10px;padding:12px 14px;box-shadow:0 14px 34px rgba(22,45,61,.24)}
.wx-live-head{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.wx-live-head b{flex:1}
.wx-x{border:0;background:none;font-size:20px;line-height:1;cursor:pointer;color:#6B7C8D}
.wx-live-panel ul{list-style:none;margin:0;padding:0}
.wx-live-panel li{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #EEF1F5}
.wx-live-panel li:last-child{border-bottom:0}
.wx button:focus-visible,.wx select:focus-visible{outline:2px solid #116DFF;outline-offset:2px}
.wx-mobnav{display:none}
@media (prefers-reduced-motion:reduce){.wx-beacon.is-on::after,.wx-toast{animation:none}}
@media (max-width:1100px){.wx-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.wx-traffic{grid-template-columns:1fr}}
@media (max-width:860px){
  .wx{grid-template-columns:1fr}
  .wx-side{display:none}
  .wx-main{padding:16px 16px 80px}
  .wx-mobnav{display:flex;gap:6px;margin-bottom:12px}
  .wx-mobnav button{flex:1;border:1px solid #D3DCE6;background:#fff;border-radius:6px;padding:8px;cursor:pointer}
  .wx-mobnav button[aria-pressed="true"]{background:#116DFF;color:#fff;border-color:#116DFF}
  .wx-toprow,.wx-cols,.wx-cols-blog,.wx-duo-cards,.wx-country{grid-template-columns:1fr}
  .wx-col{padding:14px 0!important;border-left:0!important;border-top:1px solid #EEF1F5}
  .wx-col:first-child{border-top:0}
  .wx-kpis{grid-template-columns:1fr}
  .wx-blog-head,.wx-blog-row{grid-template-columns:minmax(0,1fr) 70px 44px 70px}
}
`;
