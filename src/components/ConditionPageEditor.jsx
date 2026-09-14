'use client';

/**
 * ConditionPageEditor — admin editor for the condition / counselling landing
 * pages that live at /<slug> (/depression-treatment and the other 44).
 *
 * The live page is ConditionPageTemplate rendering `counselling_services.content`
 * (shape: data/conditionPageTemplateSample.js). This edits that object section
 * by section, with the real template as the preview on the right — what you see
 * here is the page. (CounsellingPageBuilder, which it replaces, edited a few
 * flat columns and previewed the retired design.)
 *
 * On save, the flat columns that fetchCondition() still folds over `content`
 * (hero_title, seo_*, faqs, types, benefits, info_cards, reviews) are written
 * from the same values, so a stale column can never override an edit. Keys this
 * editor does not know about (related, supportKit…) are kept as they are.
 */

import { useMemo, useState } from 'react';
import ConditionPageTemplate from '@/components/ConditionPageTemplate';
import conditionPageTemplateSample from '@/data/conditionPageTemplateSample';

/* ------------------------------------------------------------------ schema */

const title = { k: 'title', label: 'Heading' };
const subtitle = { k: 'subtitle', label: 'Sub-heading', t: 'textarea', rows: 2 };
const card = [{ k: 'title', label: 'Title' }, { k: 'body', label: 'Text', t: 'textarea' }];
const ctaBlock = [{ k: 'text', label: 'Text', t: 'textarea' }, { k: 'cta', label: 'Button', t: 'cta' }];

const SECTIONS = [
  {
    key: 'hero', label: 'Hero',
    fields: [
      { k: 'eyebrow', label: 'Eyebrow line' },
      { k: 'title', label: 'Page heading (H1)', t: 'textarea', rows: 2 },
      { k: 'subtitle', label: 'Intro', t: 'textarea' },
      { k: 'verifiedBy', label: '“Verified by” line', t: 'textarea', rows: 2 },
      { k: 'primaryCta', label: 'Main button', t: 'cta' },
      { k: 'secondaryCta', label: 'WhatsApp button', t: 'cta' },
      { k: 'mediaLabel', label: 'Video slot label' },
    ],
  },
  { key: 'stats', label: 'Stats row', rootList: [{ k: 'value', label: 'Figure' }, { k: 'label', label: 'Description', t: 'textarea', rows: 2 }] },
  {
    key: 'therapists', label: 'Therapists',
    fields: [{ k: 'eyebrow', label: 'Eyebrow line' }, title, { k: 'filters', label: 'Filter buttons (one per line)', t: 'strings' }],
    note: 'Therapist cards come from the therapist list; only the heading is edited here.',
  },
  { key: 'howItWorks', label: 'How it works', fields: [title, subtitle], listKey: 'steps', listLabel: 'Steps', item: card },
  { key: 'why', label: 'Why Koott', fields: [title, subtitle], listKey: 'items', listLabel: 'Reasons', item: card },
  {
    key: 'plans', label: 'Plans', fields: [title, subtitle], listKey: 'items', listLabel: 'Plans',
    item: [{ k: 'name', label: 'Plan' }, { k: 'body', label: 'Text', t: 'textarea' }, { k: 'from', label: 'Starting price (₹)', t: 'number' }],
  },
  {
    key: 'reviews', label: 'Reviews', fields: [{ k: 'eyebrow', label: 'Eyebrow line' }, { k: 'title', label: 'Heading', t: 'textarea', rows: 2 }],
    listKey: 'items', listLabel: 'Reviews',
    item: [
      { k: 'quote', label: 'Review', t: 'textarea' },
      { k: 'name', label: 'Name' },
      { k: 'age', label: 'Age line' },
      { k: 'source', label: 'Source badge', t: 'select', options: ['google', 'whatsapp', 'zoho'] },
      { k: 'avatar', label: 'Photo URL (optional)', t: 'url' },
    ],
  },
  { key: 'ctaBand', label: 'Green CTA band', fields: ctaBlock },
  {
    key: 'about', label: 'About the condition',
    fields: [title, { k: 'paragraphs', label: 'Paragraphs (blank line between)', t: 'paragraphs' }],
    listKey: 'pillars', listLabel: 'Pillars (Mind / Emotions …)', item: card,
  },
  { key: 'symptoms', label: 'Signs & symptoms', fields: [title, subtitle], listKey: 'items', listLabel: 'Signs', item: card },
  { key: 'midCta', label: 'Mid-page band', fields: ctaBlock },
  { key: 'seekHelp', label: 'When to seek help', fields: [title, subtitle], listKey: 'items', listLabel: 'Signals', item: card },
  { key: 'bookBand', label: 'Book band', fields: [title, { k: 'text', label: 'Text', t: 'textarea' }, { k: 'cta', label: 'Button', t: 'cta' }] },
  {
    key: 'types', label: 'Types we treat', fields: [title, subtitle], listKey: 'items', listLabel: 'Types',
    item: [...card, { k: 'items', label: 'Bullet points instead of text (one per line, optional)', t: 'strings' }],
  },
  { key: 'therapyHelps', label: 'How therapy helps', fields: [title, subtitle], listKey: 'items', listLabel: 'Ways therapy helps', item: card },
  { key: 'finalCta', label: 'Closing CTA', fields: ctaBlock },
  { key: 'faqs', label: 'FAQs', rootList: [{ k: 'q', label: 'Question' }, { k: 'a', label: 'Answer', t: 'textarea' }] },
  { key: 'seo', label: 'Search (SEO)', fields: [{ k: 'title', label: 'Page title' }, { k: 'description', label: 'Meta description', t: 'textarea' }] },
];

const MENU_CATEGORIES = [
  ['individual', 'INDIVIDUAL'],
  ['relationship', 'RELATIONSHIP'],
  ['sexual', 'SEXUAL & INTIMACY'],
];

/* ----------------------------------------------------------------- helpers */

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

/** Same structure as `v`, every leaf emptied — the fallback shape for missing keys. */
function blankLike(v) {
  if (Array.isArray(v)) return [];
  if (isObj(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blankLike(x)]));
  return typeof v === 'number' ? 0 : '';
}

/** Fill any key the template reads but the stored content lacks, recursively. */
function fillShape(skeleton, value) {
  if (!isObj(skeleton)) return value === undefined || value === null ? skeleton : value;
  const out = isObj(value) ? { ...value } : {};
  Object.keys(skeleton).forEach((k) => { out[k] = fillShape(skeleton[k], out[k]); });
  return out;
}

const SKELETON = { ...blankLike(conditionPageTemplateSample), menu: { category: '', group: '', label: '', order: 0 } };

function initialContent(row) {
  if (row?.content) return fillShape(SKELETON, row.content);
  // A new page starts from the template's full layout (placeholder copy to
  // replace) — but never with the sample's made-up therapists.
  const sample = JSON.parse(JSON.stringify(conditionPageTemplateSample));
  return fillShape(SKELETON, { ...sample, therapists: { ...sample.therapists, items: [] } });
}

const slugify = (v) => String(v || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const emptyItem = (fields) => Object.fromEntries(fields.map((f) => [
  f.k, f.t === 'strings' ? [] : f.t === 'number' ? 0 : f.t === 'cta' ? { label: '', href: '' } : '',
]));

/** Drop the blank lines that are kept while typing in the one-per-line fields. */
function tidy(value) {
  if (Array.isArray(value)) {
    return value.map(tidy).filter((x) => !(typeof x === 'string' && !x.trim()));
  }
  if (isObj(value)) return Object.fromEntries(Object.entries(value).map(([k, x]) => [k, tidy(x)]));
  return typeof value === 'string' ? value.replace(/\s+$/, '') : value;
}

function buildPayload({ content, status, slug, isCreate, row }) {
  const c = tidy({ ...content, slug: slug || content.slug });
  return {
    ...(isCreate ? { slug } : {}),
    status,
    content: c,
    // Folded over `content` by fetchCondition() when non-empty — keep them equal.
    hero_title: c.hero?.title || '',
    seo_title: c.seo?.title || null,
    seo_description: c.seo?.description || null,
    menu_order: Number(c.menu?.order) || 0,
    faqs: c.faqs || [],
    types: c.types?.items || [],
    benefits: c.why?.items || [],
    info_cards: c.symptoms?.items || [],
    reviews: c.reviews?.items || [],
    cover_image_url: c.hero?.image || row?.cover_image_url || null,
  };
}

/* --------------------------------------------------------------- UI pieces */

function Field({ f, value, onChange }) {
  const label = f.label || f.k;
  switch (f.t) {
    case 'textarea':
      return (
        <label className="cpe-f"><span>{label}</span>
          <textarea rows={f.rows || 3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        </label>
      );
    case 'number':
      return (
        <label className="cpe-f"><span>{label}</span>
          <input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
        </label>
      );
    case 'select':
      return (
        <label className="cpe-f"><span>{label}</span>
          <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
      );
    case 'cta':
      return (
        <fieldset className="cpe-cta"><legend>{label}</legend>
          <input placeholder="Button text" value={value?.label ?? ''} onChange={(e) => onChange({ ...(value || {}), label: e.target.value })} />
          <input placeholder="Link, e.g. /book-malayali-psychologists" value={value?.href ?? ''} onChange={(e) => onChange({ ...(value || {}), href: e.target.value })} />
        </fieldset>
      );
    case 'strings':
      return (
        <label className="cpe-f"><span>{label}</span>
          <textarea rows={3} value={(value || []).join('\n')} onChange={(e) => onChange(e.target.value.split('\n'))} />
        </label>
      );
    case 'paragraphs':
      return (
        <label className="cpe-f"><span>{label}</span>
          <textarea rows={8} value={(value || []).join('\n\n')} onChange={(e) => onChange(e.target.value.split(/\n\n/))} />
        </label>
      );
    default:
      return (
        <label className="cpe-f"><span>{label}</span>
          <input type={f.t === 'url' ? 'url' : 'text'} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        </label>
      );
  }
}

function ListEditor({ label, items, fields, onChange }) {
  const list = Array.isArray(items) ? items : [];
  const update = (i, k, v) => onChange(list.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const move = (i, d) => {
    const t = i + d;
    if (t < 0 || t >= list.length) return;
    const next = [...list];
    [next[i], next[t]] = [next[t], next[i]];
    onChange(next);
  };
  return (
    <div className="cpe-list">
      <div className="cpe-list-h">
        <span>{label} · {list.length}</span>
        <button type="button" onClick={() => onChange([...list, emptyItem(fields)])}>+ Add</button>
      </div>
      {list.map((it, i) => (
        <div key={i} className="cpe-item">
          <div className="cpe-item-h">
            <span>#{i + 1}</span>
            <span className="cpe-item-tools">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down">↓</button>
              <button type="button" className="is-danger" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="Remove">Remove</button>
            </span>
          </div>
          {fields.map((f) => <Field key={f.k} f={f} value={it?.[f.k]} onChange={(v) => update(i, f.k, v)} />)}
        </div>
      ))}
    </div>
  );
}

function SectionEditor({ section, value, onChange }) {
  if (section.rootList) {
    return <ListEditor label="Items" items={value} fields={section.rootList} onChange={onChange} />;
  }
  const v = isObj(value) ? value : {};
  return (
    <>
      {section.note && <p className="cpe-note">{section.note}</p>}
      {(section.fields || []).map((f) => (
        <Field key={f.k} f={f} value={v[f.k]} onChange={(x) => onChange({ ...v, [f.k]: x })} />
      ))}
      {section.listKey && (
        <ListEditor
          label={section.listLabel || 'Items'} items={v[section.listKey]} fields={section.item}
          onChange={(x) => onChange({ ...v, [section.listKey]: x })}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ editor */

export default function ConditionPageEditor({
  mode = 'edit', initialData = null, onSubmit, onCancel, saving = false, error = '',
}) {
  const isCreate = mode === 'create';
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [status, setStatus] = useState(initialData?.status || 'draft');
  const [content, setContent] = useState(() => initialContent(initialData));
  const [openKey, setOpenKey] = useState('hero');
  const [localError, setLocalError] = useState('');

  const menu = content.menu || {};
  const setMenu = (patch) => setContent((c) => ({ ...c, menu: { ...(c.menu || {}), ...patch } }));
  const setSection = (key, value) => setContent((c) => ({ ...c, [key]: value }));
  const pageSlug = isCreate ? slugify(slug) : initialData?.slug;

  // The template reads every section unconditionally; keep the preview safe
  // while a list is half-edited.
  const previewData = useMemo(() => fillShape(SKELETON, content), [content]);

  const save = () => {
    if (isCreate && !pageSlug) { setLocalError('Add the page URL (slug) first.'); return; }
    if (!String(content.hero?.title || '').trim()) { setLocalError('The page heading (Hero → Page heading) is required.'); openSection('hero'); return; }
    setLocalError('');
    onSubmit?.(buildPayload({ content, status, slug: pageSlug, isCreate, row: initialData }));
  };

  function openSection(key) { setOpenKey((k) => (k === key ? '' : key)); }

  return (
    <div className="cpe">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="cpe-bar">
        <div className="cpe-bar-l">
          <button type="button" className="cpe-btn is-ghost" onClick={onCancel}>← Back</button>
          <div>
            <p className="cpe-bar-t">{isCreate ? 'New page' : (content.menu?.label || content.hero?.title || initialData?.slug)}</p>
            <p className="cpe-bar-s">
              {pageSlug ? `koott.in/${pageSlug}` : 'koott.in/…'}
              {!isCreate && initialData?.status === 'published' && (
                <> · <a href={`/${pageSlug}`} target="_blank" rel="noreferrer">Open live page ↗</a></>
              )}
            </p>
          </div>
        </div>
        <div className="cpe-bar-r">
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <button type="button" className="cpe-btn" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : isCreate ? 'Create page' : 'Save changes'}
          </button>
        </div>
      </header>

      {(localError || error) && <p className="cpe-err">{localError || error}</p>}

      <div className="cpe-body">
        <aside className="cpe-form">
          <details className="cpe-sec" open>
            <summary>Page settings</summary>
            <div className="cpe-sec-in">
              {isCreate && (
                <label className="cpe-f"><span>URL slug</span>
                  <input value={slug} placeholder="e.g. anxiety-treatment" onChange={(e) => setSlug(e.target.value)} />
                </label>
              )}
              <label className="cpe-f"><span>Header menu</span>
                <select value={menu.category || ''} onChange={(e) => setMenu({ category: e.target.value || null })}>
                  <option value="">Not in the menu</option>
                  {MENU_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className="cpe-f"><span>Menu sub-group (optional, e.g. OTHER DISORDERS)</span>
                <input value={menu.group || ''} onChange={(e) => setMenu({ group: e.target.value || null })} />
              </label>
              <label className="cpe-f"><span>Menu label</span>
                <input value={menu.label || ''} onChange={(e) => setMenu({ label: e.target.value })} />
              </label>
              <label className="cpe-f"><span>Menu order</span>
                <input type="number" value={menu.order ?? 0} onChange={(e) => setMenu({ order: Number(e.target.value) || 0 })} />
              </label>
            </div>
          </details>

          {SECTIONS.map((s) => (
            <details key={s.key} className="cpe-sec" open={openKey === s.key}>
              <summary onClick={(e) => { e.preventDefault(); openSection(s.key); }}>{s.label}</summary>
              {openKey === s.key && (
                <div className="cpe-sec-in">
                  <SectionEditor section={s} value={content[s.key]} onChange={(v) => setSection(s.key, v)} />
                </div>
              )}
            </details>
          ))}
        </aside>

        <section className="cpe-preview" aria-label="Live preview">
          <p className="cpe-preview-tag">Live preview — the page as visitors will see it</p>
          <ConditionPageTemplate data={previewData} />
        </section>
      </div>
    </div>
  );
}

const CSS = `
.cpe{--g:#189E4F;--gd:#12813F;--deep:#012F23;--line:#E2E8E4;background:#F4F6F5;min-height:100vh;color:#111;
  font-family:'Mulish',system-ui,sans-serif;}
.cpe-bar{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:12px 20px;background:#fff;border-bottom:1px solid var(--line);}
.cpe-bar-l{display:flex;align-items:center;gap:14px;min-width:0;}
.cpe-bar-t{margin:0;font-size:15px!important;font-weight:700!important;color:#111!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:46vw;}
.cpe-bar-s{margin:2px 0 0;font-size:12px!important;color:#6B7280!important;}
.cpe-bar-s a{color:var(--g)!important;}
.cpe-bar-r{display:flex;align-items:center;gap:10px;}
.cpe-bar-r select{border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:13px;background:#fff;}
.cpe-btn{background:var(--g);color:#fff;border:0;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;}
.cpe-btn:disabled{opacity:.6;cursor:default;}
.cpe-btn.is-ghost{background:#fff;color:#111;border:1px solid var(--line);}
.cpe-err{margin:12px 20px 0;padding:10px 14px;border-radius:8px;background:#FEF2F2;color:#B42318;font-size:13px;}

.cpe-body{display:grid;grid-template-columns:420px minmax(0,1fr);gap:0;}
.cpe-form{height:calc(100vh - 66px);overflow-y:auto;background:#fff;border-right:1px solid var(--line);padding:10px 0 60px;}
.cpe-sec{border-bottom:1px solid var(--line);}
.cpe-sec summary{list-style:none;cursor:pointer;padding:13px 20px;font-size:14px;font-weight:700;color:#111;display:flex;justify-content:space-between;}
.cpe-sec summary::-webkit-details-marker{display:none;}
.cpe-sec summary::after{content:'+';color:#6B7280;font-weight:400;}
.cpe-sec[open] summary::after{content:'−';}
.cpe-sec-in{padding:4px 20px 18px;}
.cpe-note{font-size:12px!important;color:#6B7280!important;margin:0 0 10px;}
.cpe-f{display:flex;flex-direction:column;gap:5px;margin:0 0 12px;}
.cpe-f span{font-size:12px!important;font-weight:600;color:#4B5563!important;}
.cpe-f input,.cpe-f textarea,.cpe-f select,.cpe-cta input{
  width:100%;border:1px solid #D5DDD8;border-radius:8px;padding:8px 10px;font-size:13px!important;font-family:inherit;color:#111;background:#fff;}
.cpe-f textarea{resize:vertical;line-height:1.45;}
.cpe-f input:focus,.cpe-f textarea:focus,.cpe-f select:focus,.cpe-cta input:focus{outline:none;border-color:var(--g);box-shadow:0 0 0 2px rgba(24,158,79,.15);}
.cpe-cta{border:1px solid var(--line);border-radius:8px;padding:8px 10px 10px;margin:0 0 12px;display:grid;gap:6px;}
.cpe-cta legend{font-size:12px;font-weight:600;color:#4B5563;padding:0 4px;}
.cpe-list{margin-top:6px;}
.cpe-list-h{display:flex;justify-content:space-between;align-items:center;margin:6px 0 8px;font-size:12px;font-weight:700;color:#111;}
.cpe-list-h button{background:#EAF9E4;color:var(--deep);border:0;border-radius:6px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer;}
.cpe-item{border:1px solid var(--line);border-radius:10px;padding:10px 12px 2px;margin:0 0 10px;background:#FBFCFB;}
.cpe-item-h{display:flex;justify-content:space-between;align-items:center;margin:0 0 8px;font-size:12px;color:#6B7280;}
.cpe-item-tools{display:flex;gap:4px;}
.cpe-item-tools button{background:#fff;border:1px solid var(--line);border-radius:6px;padding:2px 8px;font-size:12px;cursor:pointer;}
.cpe-item-tools button:disabled{opacity:.35;cursor:default;}
.cpe-item-tools .is-danger{color:#B42318;}

.cpe-preview{height:calc(100vh - 66px);overflow-y:auto;background:#fff;position:relative;}
.cpe-preview-tag{position:sticky;top:0;z-index:5;margin:0;padding:6px 16px;background:#012F23;color:#fff!important;font-size:12px!important;}

@media (max-width:1100px){
  .cpe-body{grid-template-columns:1fr;}
  .cpe-form,.cpe-preview{height:auto;}
}
`;
