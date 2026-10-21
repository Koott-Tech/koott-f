'use client';

/**
 * Marketing dashboard — Content → Edit Pages.
 *
 * The list of editable site pages and the SEO panel for one of them. Everything
 * shown here comes from /api/pages: the scores are computed by the backend's
 * utils/seoScore.js, so this file never works one out for itself and the list,
 * the editor and any later publish check cannot disagree.
 *
 * Styling reuses the dashboard's own wx-* classes; only the few genuinely new
 * pieces (the search preview, the check list) add CSS, in CONTENT_CSS below.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getStoredToken } from '@/lib/authStorage';
import SitePageEditor from '@/components/SitePageEditor';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.koott.in';

// Advice, matching utils/seoScore.js. Over the range warns; it never blocks.
const TITLE_MAX = 60;
const DESC_MAX = 160;

async function api(path, { method = 'GET', body } = {}) {
  const token = getStoredToken?.();
  const res = await fetch(`${API}/pages${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json?.data ?? json;
}

// page_meta keys are site_home / site_about / …; SitePageEditor's own registry
// is keyed home / about / …, so strip the prefix.
const editorIdFor = (key) => String(key || '').replace(/^site_/, '');

const STATUS_LABEL = { good: 'Good', needs_attention: 'Needs attention', critical: 'Critical' };

function SeoPill({ status, score }) {
  return (
    <span className={`cp-pill cp-pill--${status}`}>
      {STATUS_LABEL[status] || status}
      {typeof score === 'number' && <b>{score}</b>}
    </span>
  );
}

function Counter({ value, max }) {
  const n = (value || '').length;
  const state = n === 0 ? '' : n > max ? ' is-over' : ' is-ok';
  return <span className={`cp-count${state}`}>{n} / {max}</span>;
}

/* --------------------------------------------------------------- list view */

function PagesList({ onOpen, onEdit }) {
  const [state, setState] = useState({ loading: true, error: null, pages: [], summary: null });
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const d = await api('');
      setState({ loading: false, error: null, pages: d.pages || [], summary: d.summary || null });
    } catch (e) {
      setState({ loading: false, error: e.message, pages: [], summary: null });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.pages.filter((p) => {
      if (filter === 'needs' && p.seoStatus === 'good') return false;
      if (filter === 'noindex' && p.indexable) return false;
      if (filter === 'missing' && p.seo?.title && p.seo?.description) return false;
      if (!needle) return true;
      return `${p.name} ${p.path} ${p.seo?.focus_keyword || ''}`.toLowerCase().includes(needle);
    });
  }, [state.pages, q, filter]);

  if (state.loading) {
    return (
      <div className="wx-card cp-card">
        {[0, 1, 2, 3].map((i) => <div key={i} className="cp-skel" />)}
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="wx-card cp-card">
        <p className="cp-err"><b>Couldn&apos;t load your pages.</b></p>
        <p className="wx-empty">{state.error}</p>
        <button type="button" className="wx-btn" onClick={load}>Try again</button>
      </div>
    );
  }

  const s = state.summary;

  return (
    <>
      {s && (
        <div className="cp-stats">
          <div className="wx-card cp-stat"><b>{s.total}</b><span>Pages</span></div>
          <div className="wx-card cp-stat"><b>{s.good}</b><span>Good SEO</span></div>
          <div className="wx-card cp-stat"><b>{s.needsAttention}</b><span>Needs attention</span></div>
          <div className="wx-card cp-stat"><b>{s.critical}</b><span>Critical</span></div>
          <div className="wx-card cp-stat"><b>{s.missingTitle}</b><span>No SEO title</span></div>
          <div className="wx-card cp-stat"><b>{s.noindex}</b><span>Hidden from Google</span></div>
        </div>
      )}

      <div className="cp-toolbar">
        <input
          className="cp-search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search pages by name, URL or keyword" aria-label="Search pages"
        />
        <div className="cp-filters">
          {[['all', 'All'], ['needs', 'Needs work'], ['missing', 'Missing metadata'], ['noindex', 'Hidden from Google']]
            .map(([k, label]) => (
              <button
                key={k} type="button" className={`cp-chip${filter === k ? ' is-on' : ''}`}
                onClick={() => setFilter(k)}
              >{label}</button>
            ))}
        </div>
      </div>

      <div className="wx-card cp-card">
        {rows.length === 0 ? (
          <p className="wx-empty">
            {state.pages.length === 0
              ? 'No pages have been added to the CMS yet.'
              : 'No pages match this search.'}
          </p>
        ) : (
          <table className="cp-tbl">
            <thead>
              <tr>
                <th>Page</th><th>URL</th><th>Type</th><th>SEO</th><th>Google</th><th>Updated</th><th />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.key}>
                  <td><b>{p.name}</b></td>
                  <td><code className="cp-path">{p.path}</code></td>
                  <td className="cp-dim">{p.pageType}</td>
                  <td>
                    {p.pageType === 'system'
                      ? <span className="cp-dim">—</span>
                      : <SeoPill status={p.seoStatus} score={p.seoScore} />}
                  </td>
                  <td className={p.indexable ? 'cp-dim' : 'cp-warn'}>
                    {p.pageType === 'system' ? '—' : p.indexable ? 'Visible' : 'Hidden'}
                  </td>
                  <td className="cp-dim">
                    {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    {p.updatedBy && <><br /><small>{p.updatedBy}</small></>}
                  </td>
                  <td className="cp-right">
                    <button type="button" className="cp-ghost" onClick={() => onEdit(p.key)}>Content</button>
                    {p.pageType !== 'system' && (
                      <button type="button" className="wx-btn" onClick={() => onOpen(p.key)}>SEO</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------- SEO editor */

function SeoEditor({ pageKey, onBack }) {
  const [state, setState] = useState({ loading: true, error: null, page: null });
  const [seo, setSeo] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const dirty = useRef(false);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const d = await api(`/${encodeURIComponent(pageKey)}`);
        if (off) return;
        setState({ loading: false, error: null, page: d });
        setSeo({
          focus_keyword: d.seo?.focus_keyword || '',
          title: d.seo?.title || '',
          description: d.seo?.description || '',
          canonical: d.seo?.canonical || '',
          robots_index: d.seo?.robots_index !== false,
          robots_follow: d.seo?.robots_follow !== false,
        });
        setAnalysis(d.analysis || null);
      } catch (e) {
        if (!off) setState({ loading: false, error: e.message, page: null });
      }
    })();
    return () => { off = true; };
  }, [pageKey]);

  // Live score, debounced. The backend scores the draft so the number here is
  // produced by the same code that scored the row in the list.
  useEffect(() => {
    if (!seo || !state.page) return undefined;
    const t = setTimeout(async () => {
      try {
        const page = { ...state.page, seo, social: state.page.social };
        setAnalysis(await api('/score', { method: 'POST', body: { page } }));
      } catch (_) { /* keep the previous analysis rather than blanking it */ }
    }, 400);
    return () => clearTimeout(t);
  }, [seo, state.page]);

  // Guard against losing edits to an accidental refresh.
  useEffect(() => {
    const warn = (e) => { if (dirty.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const set = (k, v) => { dirty.current = true; setSaved(null); setSeo((s) => ({ ...s, [k]: v })); };

  const save = async () => {
    setSaving(true);
    try {
      await api(`/${encodeURIComponent(pageKey)}/seo`, { method: 'PATCH', body: { seo } });
      dirty.current = false;
      setSaved('Saved');
    } catch (e) {
      setSaved(`Couldn't save: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (state.loading) return <div className="wx-card cp-card"><div className="cp-skel" /><div className="cp-skel" /></div>;
  if (state.error) {
    return (
      <div className="wx-card cp-card">
        <p className="cp-err"><b>Couldn&apos;t load this page.</b></p>
        <p className="wx-empty">{state.error}</p>
        <button type="button" className="wx-btn" onClick={onBack}>Back to pages</button>
      </div>
    );
  }

  const p = state.page;
  const url = `${SITE}${p.path === '/' ? '' : p.path}`;
  const previewTitle = seo.title || p.name;
  const previewDesc = seo.description || 'No description yet. Google will pick its own text from the page.';

  return (
    <>
      <div className="cp-edhead">
        <button type="button" className="cp-back" onClick={onBack}>&larr; All pages</button>
        <div>
          <h2>{p.name}</h2>
          <code className="cp-path">{p.path}</code>
        </div>
        {analysis && <SeoPill status={analysis.status} score={analysis.score} />}
      </div>

      <div className="cp-grid">
        <div className="wx-card cp-card">
          <h3 className="wx-card-t">Search engine listing</h3>

          <label className="cp-f">
            <span>Focus keyword <i>the phrase you want this page to rank for</i></span>
            <input value={seo.focus_keyword} onChange={(e) => set('focus_keyword', e.target.value)}
              placeholder="online counselling in Malayalam" />
          </label>

          <label className="cp-f">
            <span>SEO title <i>the headline Google shows</i><Counter value={seo.title} max={TITLE_MAX} /></span>
            <input value={seo.title} onChange={(e) => set('title', e.target.value)}
              placeholder={p.name} />
          </label>

          <label className="cp-f">
            <span>Meta description <i>the summary under the headline</i><Counter value={seo.description} max={DESC_MAX} /></span>
            <textarea rows={3} value={seo.description} onChange={(e) => set('description', e.target.value)} />
          </label>

          <label className="cp-f">
            <span>Canonical URL <i>leave blank to use this page&apos;s own address</i></span>
            <input value={seo.canonical} onChange={(e) => set('canonical', e.target.value)} placeholder={url} />
          </label>

          <div className="cp-toggles">
            <label className="cp-check">
              <input type="checkbox" checked={seo.robots_index}
                onChange={(e) => set('robots_index', e.target.checked)} />
              <span>Show this page on Google</span>
            </label>
            <label className="cp-check">
              <input type="checkbox" checked={seo.robots_follow}
                onChange={(e) => set('robots_follow', e.target.checked)} />
              <span>Let Google follow links on this page</span>
            </label>
          </div>

          <div className="cp-actions">
            <button type="button" className="wx-btn" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save SEO settings'}
            </button>
            {saved && <span className={`cp-saved${saved.startsWith("Couldn't") ? ' is-err' : ''}`}>{saved}</span>}
          </div>
        </div>

        <div className="cp-col">
          <div className="wx-card cp-card">
            <h3 className="wx-card-t">Preview on Google</h3>
            <div className="cp-serp">
              <div className="cp-serp-url">{url}</div>
              <div className="cp-serp-title">{previewTitle}</div>
              <div className="cp-serp-desc">{previewDesc}</div>
            </div>
            {!seo.robots_index && (
              <p className="cp-warnbox">This page is hidden from Google, so it will not appear in search results at all.</p>
            )}
          </div>

          <div className="wx-card cp-card">
            <h3 className="wx-card-t">SEO checklist</h3>
            {!analysis ? <p className="wx-empty">Working it out…</p> : (
              <ul className="cp-checks">
                {analysis.checks.map((c) => (
                  <li key={c.key} className={`cp-check-${c.status}`}>
                    <span className="cp-mark">{c.status === 'pass' ? '✓' : c.status === 'warn' ? '!' : '✕'}</span>
                    {c.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ module */

export default function ContentPages() {
  const [seoKey, setSeoKey] = useState(null);
  const [editKey, setEditKey] = useState(null);

  if (editKey) {
    // The same form-and-live-preview editor the admin panel used. It is
    // self-contained, so moving it here changes nothing about how it works.
    return <SitePageEditor pageId={editorIdFor(editKey)} onBack={() => setEditKey(null)} />;
  }
  if (seoKey) return <SeoEditor pageKey={seoKey} onBack={() => setSeoKey(null)} />;
  return <PagesList onOpen={setSeoKey} onEdit={setEditKey} />;
}

export const CONTENT_CSS = `
.cp-card{margin-bottom:14px}
.cp-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:12px}
.cp-stat{text-align:center}
.cp-stat b{display:block;font-size:22px;color:#0B2B22}
.cp-stat span{font-size:12px;color:#6B7C8D}
.cp-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
.cp-search{flex:1;min-width:220px;border:1px solid #D7E0DA;border-radius:8px;padding:8px 12px;font-size:13px;font-family:inherit}
.cp-search:focus{outline:none;border-color:#1B6930}
.cp-filters{display:flex;gap:6px;flex-wrap:wrap}
.cp-chip{border:1px solid #D7E0DA;background:#fff;border-radius:16px;padding:5px 12px;font-size:12.5px;cursor:pointer;color:#33454F;font-family:inherit}
.cp-chip.is-on{background:#0A4A38;border-color:#0A4A38;color:#fff}
.cp-tbl{width:100%;border-collapse:collapse;font-size:13px}
.cp-tbl th{text-align:left;font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;color:#6B7C8D;padding:0 10px 8px;font-weight:600}
.cp-tbl td{padding:10px;border-top:1px solid #EDF1EE;vertical-align:top}
.cp-tbl tr:hover td{background:#FAFCFB}
.cp-path{background:#F2F6F3;border-radius:4px;padding:1px 6px;font-size:12px;color:#33454F}
.cp-dim{color:#6B7C8D}
.cp-warn{color:#A8601B;font-weight:600}
.cp-right{text-align:right;white-space:nowrap}
.cp-ghost{background:#fff;border:1px solid #D7E0DA;border-radius:18px;padding:5px 13px;font-size:12.5px;font-weight:600;color:#33454F;cursor:pointer;margin-right:7px;font-family:inherit}
.cp-ghost:hover{border-color:#1B6930;color:#1B6930}
.cp-pill{display:inline-flex;align-items:center;gap:6px;border-radius:14px;padding:3px 10px;font-size:12px;font-weight:600}
.cp-pill b{font-weight:700;opacity:.75}
.cp-pill--good{background:#E7F6EC;color:#1B6930}
.cp-pill--needs_attention{background:#FDF2E2;color:#9A5B12}
.cp-pill--critical{background:#FDE8E8;color:#A32020}
.cp-skel{height:44px;border-radius:8px;margin:8px 0;background:linear-gradient(90deg,#F1F5F2 25%,#E7EDE9 37%,#F1F5F2 63%);background-size:400% 100%;animation:cp-sh 1.2s ease infinite}
@keyframes cp-sh{0%{background-position:100% 50%}100%{background-position:0 50%}}
@media (prefers-reduced-motion:reduce){.cp-skel{animation:none}}
.cp-err{color:#A32020;margin:0 0 4px}
.cp-edhead{display:flex;align-items:center;gap:14px;margin-bottom:12px;flex-wrap:wrap}
.cp-edhead h2{margin:0;font-size:18px;color:#0B2B22}
.cp-back{background:none;border:0;color:#1B6930;cursor:pointer;font-size:13px;font-weight:600;padding:0;font-family:inherit}
.cp-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:14px;align-items:start}
.cp-col{display:flex;flex-direction:column}
.cp-f{display:flex;flex-direction:column;gap:5px;margin:0 0 14px}
.cp-f > span{font-size:12.5px;font-weight:600;color:#33454F;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.cp-f i{font-style:normal;font-weight:400;color:#6B7C8D;font-size:12px}
.cp-f input,.cp-f textarea{border:1px solid #D7E0DA;border-radius:8px;padding:8px 10px;font-size:13px;font-family:inherit;color:#111}
.cp-f input:focus,.cp-f textarea:focus{outline:none;border-color:#1B6930;box-shadow:0 0 0 2px rgba(27,105,48,.14)}
.cp-f textarea{resize:vertical;line-height:1.45}
.cp-count{margin-left:auto;font-size:11.5px;color:#6B7C8D;font-weight:500}
.cp-count.is-ok{color:#1B6930}
.cp-count.is-over{color:#A8601B}
.cp-toggles{display:flex;flex-direction:column;gap:8px;margin:4px 0 14px}
.cp-check{display:flex;align-items:center;gap:8px;font-size:13px;color:#33454F}
.cp-actions{display:flex;align-items:center;gap:12px}
.cp-saved{font-size:12.5px;color:#1B6930}
.cp-saved.is-err{color:#A32020}
.cp-serp{border:1px solid #EDF1EE;border-radius:8px;padding:12px 14px;background:#fff}
.cp-serp-url{font-size:12.5px;color:#1B6930;margin-bottom:3px;word-break:break-all}
.cp-serp-title{font-size:18px;color:#1A0DAB;line-height:1.3;margin-bottom:3px}
.cp-serp-desc{font-size:13px;color:#4D5156;line-height:1.5}
.cp-warnbox{margin:10px 0 0;background:#FDF2E2;color:#9A5B12;border-radius:8px;padding:8px 12px;font-size:12.5px}
.cp-checks{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}
.cp-checks li{display:flex;gap:9px;font-size:12.5px;color:#33454F;line-height:1.45}
.cp-mark{flex:none;width:17px;height:17px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;margin-top:1px}
.cp-check-pass .cp-mark{background:#E7F6EC;color:#1B6930}
.cp-check-warn .cp-mark{background:#FDF2E2;color:#9A5B12}
.cp-check-fail .cp-mark{background:#FDE8E8;color:#A32020}
.cp-check-fail{color:#A32020;font-weight:500}
@media (max-width:1100px){
  .cp-stats{grid-template-columns:repeat(3,1fr)}
  .cp-grid{grid-template-columns:1fr}
}
`;
