'use client';

/**
 * SitePageEditor — the admin "Pages" editor for the site's fixed pages (Home,
 * About, FAQ, Pricing, Footer). Same idea as ConditionPageEditor: every section
 * of the page as a form on the left, the real page component as a live preview
 * on the right.
 *
 * Content is stored in the `cms` table under the page's key (site_home, …) via
 * PUT /api/site-config/:key, and each page merges it over its built-in copy one
 * top-level section at a time (lib/siteContent.js). The editor loads that merged
 * object and saves it whole, so what is saved is exactly what was previewed.
 */

import { useEffect, useState } from 'react';
import { Field, Fields, ListEditor, tidy, CMS_FIELDS_CSS } from '@/components/cms/CmsFields';
import { mergeSiteContent } from '@/lib/siteContent';
import { getStoredToken } from '@/lib/authStorage';
import KoottHome from '@/components/KoottHome';
import AboutPage from '@/components/AboutPage';
import FaqPage from '@/components/FaqPage';
import PricingPage from '@/components/PricingPage';
import KoottFooter from '@/components/KoottFooter';
import { HOME_DEFAULTS } from '@/data/koottHomeContent';
import ABOUT_DEFAULTS from '@/data/aboutContent';
import FAQ_DEFAULTS from '@/data/faqContent';
import { PRICING_DEFAULTS } from '@/data/pricingPlans';
import { DEFAULT_FOOTER } from '@/data/footerConfig';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const clone = (v) => JSON.parse(JSON.stringify(v));
const cta = (k, label) => ({ k, label, t: 'cta' });
const heading = { k: 'title', label: 'Heading' };
const qa = [{ k: 'q', label: 'Question' }, { k: 'a', label: 'Answer', t: 'textarea', rows: 4 }];
const linkColumn = [
  { k: 'heading', label: 'Column heading' },
  { k: 'links', label: 'Links', t: 'list', item: [{ k: 'label', label: 'Text' }, { k: 'href', label: 'Link' }] },
];

/* ------------------------------------------------------------ page schemas */

const HOME_SECTIONS = [
  {
    key: 'HERO', label: 'Hero',
    fields: [
      { k: 'rotatingTitles', label: 'Rotating first line (one per line)', t: 'strings', rows: 5 },
      { k: 'titleTail', label: 'Second line' },
      { k: 'subtitle', label: 'Subtitle' },
      { k: 'searchPlaceholder', label: 'Search box placeholder', t: 'textarea', rows: 2 },
      { k: 'concernCta', label: '“Find by concern” button' },
      { k: 'bookCta', label: '“Book” button' },
      { k: 'badges', label: 'Stat cards', t: 'list', item: [{ k: 'icon', label: 'Emoji' }, { k: 'title', label: 'Title' }, { k: 'body', label: 'Text', t: 'textarea', rows: 2 }] },
    ],
  },
  {
    key: 'THERAPISTS_SECTION', label: 'Therapists',
    note: 'Therapist cards come from the therapist list; only the copy around them is edited here.',
    fields: [
      { k: 'title', label: 'Heading', t: 'textarea', rows: 2 },
      { k: 'subtitle', label: 'Sub-heading' },
      { k: 'filters', label: 'Filter labels (one per line)', t: 'strings', rows: 2 },
      { k: 'moreLabel', label: '“More” link text' },
    ],
  },
  {
    key: 'HOW_IT_WORKS', label: 'How it works',
    fields: [
      { k: 'eyebrow', label: 'Eyebrow' }, heading,
      { k: 'subtitle', label: 'Sub-heading', t: 'textarea', rows: 2 },
      { k: 'cta', label: 'Button text' }, { k: 'caption', label: 'Caption' },
      { k: 'steps', label: 'Steps', t: 'list', item: [{ k: 'n', label: 'Number', t: 'number' }, { k: 'title', label: 'Title' }] },
    ],
  },
  {
    key: 'OFFERS', label: 'What Koott offers',
    fields: [
      heading, { k: 'subtitle', label: 'Sub-heading', t: 'textarea', rows: 2 },
      {
        k: 'items', label: 'Offers', t: 'list',
        item: [
          { k: 'key', label: 'ID (unique, no spaces)' },
          { k: 'title', label: 'Title' },
          { k: 'note', label: 'Note' },
          {
            k: 'panel', label: 'Open panel', t: 'group',
            fields: [
              { k: 'heading', label: 'Heading lines (one per line)', t: 'strings', rows: 2 },
              { k: 'lead', label: 'Lead' },
              { k: 'bullets', label: 'Bullets (one per line)', t: 'strings', rows: 5 },
              { k: 'packages', label: 'Packages line' },
              cta('link', 'Link'),
              { k: 'price', label: 'Price line' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'CARE', label: 'Care that understands you',
    fields: [
      { k: 'title', label: 'Heading lines (one per line)', t: 'strings', rows: 2 },
      { k: 'paragraphs', label: 'Paragraphs (blank line between)', t: 'paragraphs', rows: 6 },
      { k: 'stats', label: 'Stats', t: 'list', item: [{ k: 'value', label: 'Figure' }, { k: 'label', label: 'Description' }] },
      cta('cta', 'Button'),
    ],
  },
  {
    key: 'REVIEWS', label: 'Reviews',
    fields: [
      { k: 'eyebrow', label: 'Eyebrow' }, { k: 'title', label: 'Heading', t: 'textarea', rows: 2 },
      { k: 'rating', label: 'Rating badge', t: 'group', fields: [{ k: 'score', label: 'Score' }, { k: 'label', label: 'Label' }] },
      {
        k: 'items', label: 'Reviews', t: 'list',
        item: [
          { k: 'name', label: 'Name' }, { k: 'place', label: 'Place' },
          { k: 'source', label: 'Source badge', t: 'select', options: ['google', 'whatsapp', 'zoho'] },
          { k: 'quote', label: 'Review', t: 'textarea' },
        ],
      },
    ],
  },
  {
    key: 'EXPERTS', label: 'Experts',
    fields: [
      { k: 'eyebrow', label: 'Eyebrow', t: 'textarea', rows: 2 }, { k: 'title', label: 'Heading', t: 'textarea', rows: 2 },
      {
        k: 'cards', label: 'Cards', t: 'list',
        item: [{ k: 'icon', label: 'Emoji' }, { k: 'title', label: 'Title lines (one per line)', t: 'strings', rows: 2 }, { k: 'lines', label: 'Lines (one per line)', t: 'strings', rows: 6 }],
      },
      cta('secondaryCta', 'Outline button'), cta('primaryCta', 'Main button'),
    ],
  },
  {
    key: 'SERVICES', label: 'Services & pricing',
    note: 'Tabs and panels pair up by position — the first tab shows the first panel.',
    fields: [
      { k: 'eyebrow', label: 'Eyebrow' }, heading,
      { k: 'tabs', label: 'Tabs (one per line)', t: 'strings', rows: 8 },
      {
        k: 'panels', label: 'Panels', t: 'list',
        item: [
          { k: 'title', label: 'Title lines (one per line)', t: 'strings', rows: 2 },
          { k: 'lead', label: 'Lead', t: 'textarea', rows: 2 },
          { k: 'bullets', label: 'Bullets (one per line)', t: 'strings', rows: 3 },
          { k: 'price', label: 'Price line' }, { k: 'href', label: 'Link' },
        ],
      },
    ],
  },
  {
    key: 'FAQ', label: 'FAQ',
    fields: [
      heading, { k: 'tabs', label: 'Tabs (one per line)', t: 'strings', rows: 5 },
      { k: 'groups', label: 'Questions under each tab', t: 'keyedLists', keysFrom: 'tabs', item: qa },
    ],
  },
  { key: 'BLOGS', label: 'Blogs strip', fields: [{ k: 'eyebrow', label: 'Eyebrow' }, heading] },
  { key: 'FINAL_CTA', label: 'Final CTA', fields: [heading, { k: 'secondary', label: 'Grey pill text' }, { k: 'primary', label: 'Button text' }] },
];

const ABOUT_SECTIONS = [
  { key: 'mission', label: 'Mission', fields: [{ k: 'title', label: 'Heading', t: 'textarea', rows: 2 }, { k: 'photo', label: 'Team photo URL', t: 'url' }] },
  { key: 'story', label: 'Story', fields: [heading, { k: 'paragraphs', label: 'Paragraphs (blank line between)', t: 'paragraphs', rows: 14 }] },
  {
    key: 'trust', label: 'Trusted by Malayalees',
    fields: [
      heading, { k: 'lead', label: 'Intro', t: 'textarea', rows: 2 },
      { k: 'stats', label: 'Stats', t: 'list', item: [{ k: 'mark', label: 'Emoji' }, { k: 'value', label: 'Figure' }, { k: 'caption', label: 'Caption' }] },
      cta('secondaryCta', 'Outline button'), cta('primaryCta', 'Solid button'),
      { k: 'photo', label: 'Photo URL', t: 'url' },
    ],
  },
  {
    key: 'advisors', label: 'Advisory board',
    fields: [
      heading, { k: 'lead', label: 'Intro', t: 'textarea', rows: 2 }, { k: 'role', label: 'Role line under each name' },
      { k: 'people', label: 'Advisors', t: 'list', item: [{ k: 'name', label: 'Name' }, { k: 'photo', label: 'Photo URL', t: 'url' }, { k: 'bio', label: 'Bio', t: 'textarea', rows: 5 }] },
    ],
  },
  {
    key: 'leadership', label: 'Leadership',
    fields: [
      heading, { k: 'lead', label: 'Intro', t: 'textarea', rows: 3 },
      { k: 'people', label: 'Leaders', t: 'list', item: [{ k: 'name', label: 'Name' }, { k: 'role', label: 'Role' }, { k: 'photo', label: 'Photo URL', t: 'url' }, { k: 'bio', label: 'Bio', t: 'textarea' }] },
      { k: 'founder', label: 'Founder', t: 'group', fields: [{ k: 'name', label: 'Name' }, { k: 'role', label: 'Role' }, { k: 'quote', label: 'Quote', t: 'textarea' }, { k: 'photo', label: 'Photo URL', t: 'url' }] },
    ],
  },
  { key: 'closing', label: 'Closing CTA', fields: [heading, cta('cta', 'Button')] },
];

const FAQ_SECTIONS = [
  { key: 'intro', label: 'Intro', fields: [heading, { k: 'lead', label: 'Intro line', t: 'textarea', rows: 2 }] },
  { key: 'items', label: 'Questions', rootList: qa },
];

const PRICING_SECTIONS = [
  { key: 'intro', label: 'Intro', fields: [heading, { k: 'lead', label: 'Intro line', t: 'textarea', rows: 3 }] },
  {
    key: 'plans', label: 'Plans',
    rootList: [
      { k: 'id', label: 'ID (unique, no spaces)' },
      { k: 'name', label: 'Plan name' },
      { k: 'price', label: 'Price (₹) — leave empty for “Contact us”', t: 'number', nullable: true },
      { k: 'unit', label: 'Unit, e.g. per session' },
      { k: 'note', label: 'Note' },
      { k: 'features', label: 'Features (one per line)', t: 'strings', rows: 4 },
      { k: 'highlight', label: 'Highlight this plan', t: 'checkbox' },
    ],
  },
  { key: 'fine', label: 'Fine print', rootText: true, textarea: true },
];

const FOOTER_SECTIONS = [
  {
    key: 'brand', label: 'Brand block',
    fields: [
      { k: 'company', label: 'Company' },
      { k: 'address', label: 'Address lines (one per line)', t: 'strings', rows: 3 },
      { k: 'email', label: 'Email' }, { k: 'phone', label: 'Phone' },
      { k: 'whatsapp', label: 'WhatsApp link', t: 'url' },
    ],
  },
  { key: 'columns', label: 'Link columns — top row', rootList: linkColumn },
  { key: 'lowerColumns', label: 'Link columns — second row', rootList: linkColumn },
  { key: 'join', label: '“Join us” card', fields: [{ k: 'label', label: 'Text' }, { k: 'href', label: 'Link' }] },
  {
    key: 'socials', label: 'Social links',
    rootList: [{ k: 'icon', label: 'Icon', t: 'select', options: ['instagram', 'facebook', 'youtube', 'linkedin'] }, { k: 'label', label: 'Label' }, { k: 'href', label: 'Link', t: 'url' }],
  },
  { key: 'copyright', label: 'Copyright line', rootText: true },
  { key: 'sitemap', label: 'Sitemap link', fields: [{ k: 'label', label: 'Text' }, { k: 'href', label: 'Link' }] },
  { key: 'crisis', label: 'Crisis notice', rootText: true, textarea: true },
  { key: 'helpline', label: 'Helpline line', rootText: true, textarea: true },
];

export const SITE_PAGES = {
  home: { key: 'site_home', label: 'Home', path: '/', defaults: HOME_DEFAULTS, sections: HOME_SECTIONS, Preview: ({ content }) => <KoottHome content={content} /> },
  about: { key: 'site_about', label: 'About us', path: '/about-us', defaults: ABOUT_DEFAULTS, sections: ABOUT_SECTIONS, Preview: ({ content }) => <AboutPage content={content} /> },
  faq: { key: 'site_faq', label: 'FAQ', path: '/faq', defaults: FAQ_DEFAULTS, sections: FAQ_SECTIONS, Preview: ({ content }) => <FaqPage content={content} /> },
  pricing: { key: 'site_pricing', label: 'Plans & pricing', path: '/plans-pricing', defaults: PRICING_DEFAULTS, sections: PRICING_SECTIONS, Preview: ({ content }) => <PricingPage content={content} /> },
  footer: { key: 'site_footer', label: 'Footer', path: null, defaults: DEFAULT_FOOTER, sections: FOOTER_SECTIONS, Preview: ({ content }) => <KoottFooter config={content} /> },
};

/* ------------------------------------------------------------------ editor */

function SiteSection({ s, value, onChange }) {
  if (s.rootList) return <ListEditor label={s.label} items={value} fields={s.rootList} onChange={onChange} />;
  if (s.rootText) {
    return <Field f={{ k: s.key, label: s.label, t: s.textarea ? 'textarea' : 'text' }} value={value} onChange={onChange} />;
  }
  return (
    <>
      {s.note && <p className="spe-note">{s.note}</p>}
      <Fields fields={s.fields} value={value} onChange={onChange} />
    </>
  );
}

export default function SitePageEditor({ pageId, onBack }) {
  const page = SITE_PAGES[pageId];
  const [content, setContent] = useState(null);
  const [openKey, setOpenKey] = useState(page?.sections?.[0]?.key || '');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState(null); // { ok: boolean, text }

  useEffect(() => {
    if (!page) return undefined;
    let off = false;
    (async () => {
      let stored = null;
      try {
        const res = await fetch(`${API}/site-config/${page.key}`, { cache: 'no-store' });
        const json = res.ok ? await res.json() : null;
        stored = (json?.data ?? json)?.data ?? null;
      } catch (_) { /* start from the built-in copy */ }
      if (!off) setContent(clone(mergeSiteContent(page.defaults, stored)));
    })();
    return () => { off = true; };
  }, [page]);

  if (!page) return <p style={{ padding: 32 }}>Unknown page.</p>;

  const update = (key, value) => { setContent((c) => ({ ...c, [key]: value })); setDirty(true); setMsg(null); };
  const resetSection = (key) => update(key, clone(page.defaults[key]));

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch(`${API}/site-config/${page.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getStoredToken() || ''}` },
        body: JSON.stringify({ data: tidy(content) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.message || `Save failed (${res.status})`);
      setDirty(false);
      setMsg({ ok: true, text: 'Saved — the live page now shows this version.' });
    } catch (e) {
      setMsg({ ok: false, text: e.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const { Preview } = page;

  return (
    <div className="spe">
      <style dangerouslySetInnerHTML={{ __html: CMS_FIELDS_CSS + CSS }} />

      <header className="spe-bar">
        <div className="spe-bar-l">
          {onBack && <button type="button" className="spe-btn is-ghost" onClick={onBack}>← Pages</button>}
          <div>
            <p className="spe-bar-t">{page.label}</p>
            <p className="spe-bar-s">
              {page.path ? <>koott.in{page.path} · <a href={page.path} target="_blank" rel="noreferrer">Open live page ↗</a></> : 'Shown at the bottom of every page'}
            </p>
          </div>
        </div>
        <div className="spe-bar-r">
          {dirty && <span className="spe-dirty">Unsaved changes</span>}
          <button type="button" className="spe-btn" onClick={save} disabled={saving || !content}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      {msg && <p className={`spe-msg ${msg.ok ? 'is-ok' : 'is-err'}`}>{msg.text}</p>}

      {!content ? <p className="spe-loading">Loading…</p> : (
        <div className="spe-body">
          <aside className="spe-form">
            {page.sections.map((s) => (
              <details key={s.key} className="spe-sec" open={openKey === s.key}>
                <summary onClick={(e) => { e.preventDefault(); setOpenKey((k) => (k === s.key ? '' : s.key)); }}>
                  {s.label}
                </summary>
                {openKey === s.key && (
                  <div className="spe-sec-in">
                    <SiteSection s={s} value={content[s.key]} onChange={(v) => update(s.key, v)} />
                    <button type="button" className="spe-reset" onClick={() => resetSection(s.key)}>
                      Reset this section to the built-in copy
                    </button>
                  </div>
                )}
              </details>
            ))}
          </aside>

          <section className="spe-preview" aria-label="Live preview">
            <p className="spe-preview-tag">Live preview — the page as visitors will see it</p>
            <Preview content={content} />
          </section>
        </div>
      )}
    </div>
  );
}

const CSS = `
.spe{background:#F4F6F5;min-height:100vh;color:#111;font-family:'Inter',system-ui,sans-serif;}
.spe-bar{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:12px 20px;background:#fff;border-bottom:1px solid #E2E8E4;}
.spe-bar-l{display:flex;align-items:center;gap:14px;min-width:0;}
.spe-bar-t{margin:0;font-size:15px!important;font-weight:700!important;color:#111!important;}
.spe-bar-s{margin:2px 0 0;font-size:12px!important;color:#6B7280!important;}
.spe-bar-s a{color:#189E4F!important;}
.spe-bar-r{display:flex;align-items:center;gap:12px;}
.spe-dirty{font-size:12px;color:#B45309;}
.spe-btn{background:#189E4F;color:#fff;border:0;border-radius:8px;padding:9px 20px;font-size:13px;font-weight:600;cursor:pointer;}
.spe-btn:disabled{opacity:.6;cursor:default;}
.spe-btn.is-ghost{background:#fff;color:#111;border:1px solid #E2E8E4;}
.spe-msg{margin:12px 20px 0;padding:10px 14px;border-radius:8px;font-size:13px;}
.spe-msg.is-ok{background:#ECFDF3;color:#067647;}
.spe-msg.is-err{background:#FEF2F2;color:#B42318;}
.spe-loading{padding:40px;color:#6B7280;}
.spe-body{display:grid;grid-template-columns:420px minmax(0,1fr);}
.spe-form{height:calc(100vh - 66px);overflow-y:auto;background:#fff;border-right:1px solid #E2E8E4;padding:6px 0 60px;}
.spe-sec{border-bottom:1px solid #E2E8E4;}
.spe-sec summary{list-style:none;cursor:pointer;padding:13px 20px;font-size:14px;font-weight:700;color:#111;display:flex;justify-content:space-between;}
.spe-sec summary::-webkit-details-marker{display:none;}
.spe-sec summary::after{content:'+';color:#6B7280;font-weight:400;}
.spe-sec[open] summary::after{content:'−';}
.spe-sec-in{padding:4px 20px 18px;}
.spe-note{font-size:12px!important;color:#6B7280!important;margin:0 0 10px;}
.spe-reset{margin-top:6px;background:none;border:0;padding:0;color:#6B7280;font-size:12px;text-decoration:underline;cursor:pointer;}
.spe-preview{height:calc(100vh - 66px);overflow-y:auto;background:#fff;}
.spe-preview-tag{position:sticky;top:0;z-index:5;margin:0;padding:6px 16px;background:#012F23;color:#fff!important;font-size:12px!important;}
@media (max-width:1100px){
  .spe-body{grid-template-columns:1fr;}
  .spe-form,.spe-preview{height:auto;}
}
`;
