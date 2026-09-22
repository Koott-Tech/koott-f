'use client';

/**
 * Shared pieces of the marketing dashboard: number formats and the charts
 * (area, bar list, columns, donut, world map, sparkline) used by both the
 * Highlights/Traffic screens and the detailed reports.
 */

import { createContext, useContext, useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------ format */

export const nf = new Intl.NumberFormat('en-IN');
export const N = (x) => nf.format(Math.round(x || 0));
export const compact = (x) => {
  const v = Math.abs(x || 0);
  if (v >= 1e6) return `${(x / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1e3) return `${(x / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return N(x);
};
export const INR = (x) => `₹${compact(x)}`;
export const INRfull = (x) => `₹${N(x)}`;
export const duration = (s) => { const m = Math.floor((s || 0) / 60); const r = Math.round((s || 0) % 60); return m ? `${m}m ${r}s` : `${r}s`; };
export const ymd = (d) => d.toISOString().slice(0, 10);
export const addDays = (s, n) => { const d = new Date(`${s}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return ymd(d); };
export const fmtDay = (s, opts = { month: 'short', day: 'numeric' }) => new Date(`${s}T00:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
export const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const slotLabel = (slot) => `${(slot * 2) % 12 || 12} ${slot < 6 ? 'AM' : 'PM'}`;
export const ELEMENT = {
  hero_consult_now: 'Consult now', hero_find_match: 'Find the match', hero_book_slot: 'Book a slot now',
  hero_find_by_concern: 'Find therapist by concern', card_book_now: 'Book Now', card_view_profile: 'View profile',
  card_avatar: 'Therapist photo', header_sign_in: 'Sign in', header_therapists: 'Therapists', therapists_more: 'More therapists',
};

/* ------------------------------------------------------------ small UI */

export function Change({ now, prev, inverse, showZero = true }) {
  if (!prev && !now) return showZero ? <span className="wx-chg is-flat">0%</span> : null;
  if (!prev) return <span className="wx-chg is-up">↗ new</span>;
  const d = Math.round(((now - prev) / prev) * 100);
  if (d === 0) return <span className="wx-chg is-flat">↗ 0%</span>;
  const good = inverse ? d < 0 : d > 0;
  return <span className={`wx-chg ${good ? 'is-up' : 'is-down'}`}>{d > 0 ? '↗' : '↘'} {Math.abs(d)}%</span>;
}

export function Tip({ tip }) {
  if (!tip) return null;
  return <div className="wx-tip" style={{ left: tip.x + 12, top: tip.y - 56 }}>{tip.content}</div>;
}

export function useWidth(ref, min = 200) {
  const [w, setW] = useState(480);
  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.max(min, Math.floor(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref, min]);
  return w;
}

export function Spark({ values }) {
  if (!values?.length) return null;
  const w = 64; const h = 20; const mx = Math.max(1, ...values); const mn = Math.min(...values);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${((i / Math.max(1, values.length - 1)) * w).toFixed(1)} ${(h - 2 - ((v - mn) / Math.max(1, mx - mn)) * (h - 4)).toFixed(1)}`).join('');
  return <svg className="wx-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true"><path d={d} fill="none" stroke="#116DFF" strokeWidth="1.4" vectorEffect="non-scaling-stroke" /></svg>;
}

/** Smooth area chart; an optional second, dashed series is the previous period. */
export function AreaChart({ rows, keys, height = 220, fmt = N }) {
  const ref = useRef(null);
  const W = useWidth(ref, 240);
  const [hover, setHover] = useState(null);
  const [tip, setTip] = useState(null);
  const H = height; const L = 44; const R = 8; const T = 10; const B = 26;
  const all = rows.flatMap((r) => keys.map((k) => r[k.key] || 0));
  const top = Math.max(4, ...all);
  const step = 10 ** Math.floor(Math.log10(top)); const m = top / step;
  const mx = (m <= 1.2 ? 1.2 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * step;
  const x = (i) => L + (i / Math.max(1, rows.length - 1)) * (W - L - R);
  const y = (v) => T + (1 - v / mx) * (H - T - B);
  const curve = (k) => {
    const pts = rows.map((r, i) => [x(i), y(r[k] || 0)]);
    if (pts.length < 2) return pts.length ? `M${pts[0][0]} ${pts[0][1]}` : '';
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i]; const cx = (x0 + x1) / 2; d += ` C${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`; }
    return d;
  };
  const nTicks = Math.min(9, rows.length);
  const ticks = rows.length > 1 ? Array.from({ length: nTicks }, (_, i) => Math.round((i * (rows.length - 1)) / (nTicks - 1))) : [0];
  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.max(0, Math.min(rows.length - 1, Math.round(((e.clientX - r.left - L) / (W - L - R)) * (rows.length - 1))));
    setHover(i);
    setTip({ x: e.clientX, y: e.clientY, content: <><b>{fmtDay(rows[i].day, { weekday: 'short', month: 'short', day: 'numeric' })}</b>{keys.map((k) => <div key={k.key}>{k.label}: {fmt(rows[i][k.key] || 0)}</div>)}</> });
  };
  return (
    <div ref={ref} className="wx-chart">
      <svg width={W} height={H} role="img" aria-label="Sessions over time">
        {[0, 1, 2, 3, 4].map((k) => {
          const v = (mx * k) / 4;
          return (
            <g key={k}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#E7ECF2" />
              <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#6B7C8D">{compact(v)}</text>
            </g>
          );
        })}
        {ticks.map((i) => <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === rows.length - 1 ? 'end' : 'middle'} fontSize="11" fill="#6B7C8D">{rows[i] && fmtDay(rows[i].day)}</text>)}
        {keys.map((k, idx) => (
          <g key={k.key}>
            {idx === 0 && rows.length > 1 && <path d={`${curve(k.key)} L${x(rows.length - 1)} ${y(0)} L${x(0)} ${y(0)}Z`} fill="#116DFF" opacity=".14" />}
            <path d={curve(k.key)} fill="none" stroke={idx === 0 ? '#116DFF' : '#9CB8E6'} strokeWidth="2" strokeDasharray={idx === 0 ? undefined : '4 4'} />
          </g>
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="#9AAAB8" strokeDasharray="3 3" />}
        {hover !== null && <circle cx={x(hover)} cy={y(rows[hover][keys[0].key] || 0)} r="4" fill="#116DFF" stroke="#fff" strokeWidth="2" />}
        <rect x={L} y={T} width={Math.max(0, W - L - R)} height={H - T - B} fill="transparent" onMouseMove={move} onMouseLeave={() => { setHover(null); setTip(null); }} />
      </svg>
      {keys.length > 1 && <div className="wx-keys">{keys.map((k, i) => <span key={k.key}><i className={i ? 'is-prev' : ''} />{k.label}</span>)}</div>}
      <Tip tip={tip} />
    </div>
  );
}

export function BarList({ rows, fmt = N, empty = 'No data yet for this period.' }) {
  if (!rows.length) return <p className="wx-empty">{empty}</p>;
  const mx = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="wx-barlist">
      {rows.map((r) => (
        <div key={r.label} className="wx-bl-row">
          <div className="wx-bl-top">
            <span className="wx-bl-label" title={r.label}>{r.label}</span>
            {r.prev !== undefined && <Change now={r.value} prev={r.prev} showZero={false} />}
            <b>{fmt(r.value)}</b>
          </div>
          <div className="wx-bl-track"><span style={{ width: `${Math.max(1.5, (r.value / mx) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export function Donut({ center, total, parts }) {
  const size = 150; const r = 62; const sw = 14; const c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="wx-donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={center}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E7ECF2" strokeWidth={sw} />
        {total > 0 && parts.map((p) => {
          const len = (p.value / total) * c;
          const el = <circle key={p.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={sw} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-off} transform={`rotate(-90 ${size / 2} ${size / 2})`} />;
          off += len;
          return el;
        })}
        <text x="50%" y="46%" textAnchor="middle" fontSize="12" fill="#3B4F63">{center}</text>
        <text x="50%" y="60%" textAnchor="middle" fontSize="20" fontWeight="700" fill="#162D3D">{N(total)}</text>
      </svg>
      <ul className="wx-legend">
        {parts.map((p) => (
          <li key={p.label}>
            <span className="wx-dot" style={{ background: p.color }} />
            <div><span>{p.label}</span><small>{total ? Math.round((p.value / total) * 100) : 0}% • {N(p.value)}</small></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Columns({ rows }) {
  const ref = useRef(null);
  const W = useWidth(ref, 200);
  const [tip, setTip] = useState(null);
  const H = 170; const L = 34; const B = 22; const T = 8;
  const top = Math.max(1, ...rows.map((r) => r.value));
  const step = 10 ** Math.floor(Math.log10(top)); const m = top / step;
  const mx = (m <= 1.2 ? 1.2 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * step;
  const bw = (W - L) / rows.length;
  const y = (v) => T + (1 - v / mx) * (H - T - B);
  return (
    <div ref={ref} className="wx-chart">
      <svg width={W} height={H} role="img" aria-label="Average sessions by day">
        {[0, 1, 2, 3, 4, 5, 6].map((k) => { const v = (mx * k) / 6; return <g key={k}><line x1={L} x2={W} y1={y(v)} y2={y(v)} stroke="#E7ECF2" /><text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="10.5" fill="#6B7C8D">{compact(v)}</text></g>; })}
        {rows.map((r, i) => (
          <g key={r.label} onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, content: <><b>{r.label}</b>Avg. sessions: {N(r.value)}</> })} onMouseLeave={() => setTip(null)}>
            <rect x={L + i * bw + bw * 0.14} y={y(r.value)} width={bw * 0.72} height={Math.max(0, H - B - y(r.value))} fill="#116DFF" />
            <text x={L + i * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="#6B7C8D">{r.label}</text>
          </g>
        ))}
      </svg>
      <Tip tip={tip} />
    </div>
  );
}

// Small countries missing from the 110m world map, drawn as dots.
export const SMALL = { Singapore: [103.82, 1.35], Bahrain: [50.55, 26.07], 'Hong Kong': [114.17, 22.3], Maldives: [73.5, 4.2], Malta: [14.4, 35.9] };

/** World map: shaded countries (Traffic Overview) or bubbles (Highlights). */
export function WorldMap({ rows, mode = 'choropleth' }) {
  const ref = useRef(null);
  const W = useWidth(ref, 240);
  const [geo, setGeo] = useState(null);
  const [tip, setTip] = useState(null);
  useEffect(() => {
    let off = false;
    Promise.all([import('d3-geo'), import('topojson-client'), import('world-atlas/countries-110m.json')]).then(([d3, topo, world]) => {
      if (off) return;
      const data = world.default || world;
      setGeo({ d3, features: topo.feature(data, data.objects.countries).features.filter((f) => f.properties.name !== 'Antarctica') });
    }).catch(() => {});
    return () => { off = true; };
  }, []);
  const H = Math.round(W * 0.52);
  if (!geo) return <div ref={ref} className="wx-map" style={{ height: H }} />;
  const projection = geo.d3.geoNaturalEarth1().fitSize([W, H], { type: 'FeatureCollection', features: geo.features });
  const path = geo.d3.geoPath(projection);
  const val = Object.fromEntries(rows.map((r) => [r.country, r.sessions]));
  const mx = Math.max(1, ...rows.map((r) => r.sessions));
  const shade = (v) => {
    if (!v) return '#E9EDF2';
    const t = Math.sqrt(v / mx);
    const mix = (a, b) => Math.round(a + (b - a) * t);
    return `rgb(${mix(205, 17)},${mix(225, 109)},${mix(255, 255)})`;
  };
  return (
    <div ref={ref} className="wx-map">
      <svg width={W} height={H} role="img" aria-label="Sessions by country">
        {geo.features.map((f) => {
          const v = val[f.properties.name] || 0;
          return <path key={f.id || f.properties.name} d={path(f)} fill={mode === 'choropleth' ? shade(v) : '#E1E6EC'} stroke="#fff" strokeWidth="0.5"
            onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, content: <><b>{f.properties.name}</b>{N(v)} sessions</> })} onMouseLeave={() => setTip(null)} />;
        })}
        {rows.map((r) => {
          const small = SMALL[r.country];
          const feature = !small && geo.features.find((f) => f.properties.name === r.country);
          const at = small ? projection(small) : feature ? path.centroid(feature) : null;
          if (!at || Number.isNaN(at[0]) || (mode === 'choropleth' && !small)) return null;
          const rad = mode === 'bubbles' ? 3 + Math.sqrt(r.sessions / mx) * 14 : 4;
          return <circle key={r.country} cx={at[0]} cy={at[1]} r={rad} fill="#116DFF" fillOpacity={mode === 'bubbles' ? 0.55 : 0.9} stroke="#fff" strokeWidth="1"
            onMouseMove={(e) => setTip({ x: e.clientX, y: e.clientY, content: <><b>{r.country}</b>{N(r.sessions)} sessions</> })} onMouseLeave={() => setTip(null)} />;
        })}
      </svg>
      <Tip tip={tip} />
    </div>
  );
}

export const Section = ({ title, action, children }) => (
  <section className="wx-section">
    <header className="wx-section-head"><h2>{title}</h2>{action}</header>
    <div className="wx-section-body">{children}</div>
  </section>
);
/** Opens a detailed report by name; provided by the dashboard shell. */
export const OpenReport = createContext(null);
function ReportLink({ name }) {
  const open = useContext(OpenReport);
  if (!open) return null;
  return <button type="button" className="wx-link wx-col-report" onClick={() => open(name)}>View Report</button>;
}
export const Col = ({ title, children, info, report }) => (
  <div className="wx-col">
    <h3>{title}{info && <span className="wx-info" title={info}>ⓘ</span>}{report && <ReportLink name={report} />}</h3>
    {children}
  </div>
);

