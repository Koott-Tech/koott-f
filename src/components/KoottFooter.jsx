'use client';

/**
 * KoottFooter — the footer from "Individual page_Final.pdf" and, at phone width,
 * "Individual mobile.pdf".
 *
 * Measured off both files:
 *
 *   band        #063327            headings   14px / #51B763 (desktop)
 *   links       12px / #FFF        rule       #BFE3CB (desktop), #0A4636 (phone)
 *   small print 12px / #9CA3AF     phone      #B8CFC4, helpline white
 *
 * On a laptop it is one grid: brand · EXPERTS · CONDITIONS · SERVICES across the
 * top, then ABOUT KOOTT · OUR TERMS with the JOIN US photo card on the right,
 * then the socials, a rule, copyright, sitemap, the crisis notice and helpline.
 *
 * On a phone it is a different layout, not a squeezed one: the contact lines,
 * five accordions (SERVICES open first), the socials on circles beside a white
 * Join Us button, then the legal strip. The file leaves out the company name and
 * address there.
 *
 * Content is CMS-driven: it reads `cms.key = 'site_footer'` through
 * /api/site-config and falls back to DEFAULT_FOOTER, so the footer is correct
 * before the fetch resolves, if the backend is down, and before anyone has saved
 * a config at all. Editing the CMS row changes the footer with no deploy.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DEFAULT_FOOTER, mergeFooterConfig } from '@/data/footerConfig';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/* --------------------------------- icons --------------------------------- */

const IconMail = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconWhatsapp = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
    <path d="M12 2a10 10 0 0 0-8.7 15l-1.2 4.3 4.4-1.2A10 10 0 1 0 12 2zm5.4 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.7-.1a12 12 0 0 1-5.7-5c-.4-.7-.9-1.7-.9-2.6s.5-1.4.7-1.6c.2-.2.4-.3.6-.3h.5c.2 0 .4 0 .5.4l.8 1.9c.1.2 0 .4-.1.5l-.4.5c-.1.2-.3.3-.1.6.4.7 1 1.4 1.6 1.9.6.5 1.1.7 1.3.8.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.5-.1l1.8.9c.2.1.4.2.4.3.1.2.1.7-.1 1.2z" />
  </svg>
);

const IconInstagram = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const IconFacebook = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
    <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.45-4 4.1v2.3H7.6V13h2.7v8z" />
  </svg>
);

const IconYoutube = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
    <path d="M21.6 7.2a2.5 2.5 0 0 0-1.75-1.75C18.25 5 12 5 12 5s-6.25 0-7.85.45A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.75 1.75C5.75 19 12 19 12 19s6.25 0 7.85-.45a2.5 2.5 0 0 0 1.75-1.75A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z" />
  </svg>
);

const IconLinkedin = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
    <path d="M6.94 8.5H3.9V21h3.04zM5.42 3a1.76 1.76 0 1 0 0 3.53 1.76 1.76 0 0 0 0-3.53zM21 21h-3.03v-6.1c0-1.45-.03-3.32-2.02-3.32-2.03 0-2.34 1.58-2.34 3.21V21H10.6V8.5h2.9v1.7h.05a3.2 3.2 0 0 1 2.87-1.58C19.5 8.62 21 10.6 21 14.2z" />
  </svg>
);

const SOCIAL = {
  instagram: IconInstagram, facebook: IconFacebook, youtube: IconYoutube, linkedin: IconLinkedin,
};

/** The two compliance marks: a shield, sized by the sheet, beside its label. */
const Shield = ({ children }) => (
  <svg className="kf-shield" viewBox="0 0 18 22" fill="none" stroke="currentColor" strokeWidth="1.3"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 1.2l7.5 2.8v6.6c0 4.8-3.2 8.2-7.5 10.2-4.3-2-7.5-5.4-7.5-10.2V4z" />
    {children}
  </svg>
);

const IconHipaa = () => <Shield><path d="M9 7.5v7M5.5 11h7" /></Shield>;
const IconCertified = () => <Shield><path d="M5.8 11l2.3 2.3 4.2-4.3" /></Shield>;

const MARKS = { hipaa: IconHipaa, certified: IconCertified };

/* --------------------------------- data ---------------------------------- */

/**
 * Read the stored footer config, falling back to the shipped default.
 * `override` (the admin "Pages → Footer" editor's live preview) wins and skips the fetch.
 */
function useFooterConfig(override) {
  const [cfg, setCfg] = useState(override ? mergeFooterConfig(override) : DEFAULT_FOOTER);

  useEffect(() => {
    if (override) { setCfg(mergeFooterConfig(override)); return undefined; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/site-config/site_footer`);
        if (!res.ok) return;
        const json = await res.json();
        const stored = (json?.data ?? json?.message ?? json)?.data;
        if (!cancelled && stored) setCfg(mergeFooterConfig(stored));
      } catch (_) {
        // Backend unreachable — the default is already rendered.
      }
    })();
    return () => { cancelled = true; };
  }, [override]);

  return cfg;
}

/* The heading is a plain line above the phone and an accordion control on it;
   the sheet shows one or the other, so a reader only ever meets one of them. */
const Column = ({ col, at, small = false, wide = false, open, onToggle }) => (
  <div className={`kf-col ${small ? 'is-small' : ''} ${wide ? 'is-wide' : ''} ${open ? 'is-open' : ''}`} style={at}>
    <p className="kf-h">{col.heading}</p>
    <button type="button" className="kf-acc" aria-expanded={open} onClick={onToggle}>
      <span>{col.heading}</span>
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M0 8h16" />
        <path className="kf-acc-v" d="M8 0v16" />
      </svg>
    </button>
    <div className="kf-reveal">
      <div className="kf-reveal-in">
        <ul className="kf-list">
          {col.links.map((l) => (
            <li key={l.label}>
              <Link href={l.href} className="kf-link">
                {l.label}
                <svg className="kf-out" viewBox="0 0 8 8" width="8" height="8" fill="none" stroke="currentColor"
                  strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M.6 7.4L7.4.6M1.6.6h5.8v5.8" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

/* --------------------------------- view ---------------------------------- */

export default function KoottFooter({ config } = {}) {
  const cfg = useFooterConfig(config);
  // One accordion open at a time on the phone; the file opens SERVICES.
  const [openCol, setOpenCol] = useState('SERVICES');
  const colProps = (c) => ({
    open: openCol === c.heading,
    onToggle: () => setOpenCol(openCol === c.heading ? '' : c.heading),
  });

  return (
    <footer className="kf">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="kf-in">
        {/* One four-column grid, two rows deep — the artboard stacks ABOUT KOOTT
            under the brand and OUR TERMS under EXPERTS, while CONDITIONS runs
            down both rows on its own. Two separate grids left a hole beside the
            long conditions list. */}
        <div className="kf-grid">
          <div className="kf-brand">
            <Link href="/" className="kf-logo" aria-label="Koott home">
              {/* Green wordmark on a square canvas: the box crops the padding,
                  the filter renders it white against the dark band. */}
              <img src="/main-logo.png" alt="Koott" width={280} height={280} />
            </Link>

            <p className="kf-co">{cfg.brand.company}</p>
            {cfg.brand.address.map((line) => <p key={line} className="kf-ad">{line}</p>)}

            <a className="kf-contact" href={`mailto:${cfg.brand.email}`}>
              <span className="kf-dot" aria-hidden><IconMail /></span>
              {cfg.brand.email}
            </a>
            <a className="kf-contact" href={cfg.brand.whatsapp} target="_blank" rel="noreferrer">
              <span className="kf-dot" aria-hidden><IconWhatsapp /></span>
              {cfg.brand.phone}
            </a>
          </div>

          {/* row 1: EXPERTS, CONDITIONS (spanning both rows), SERVICES */}
          {cfg.columns.map((c, i) => (
            <Column
              key={c.heading} col={c} wide={i === 1}
              at={{ gridColumn: i + 2, gridRow: i === 1 ? '1 / span 2' : 1 }}
              {...colProps(c)}
            />
          ))}

          {/* row 2, under the brand and under EXPERTS */}
          {cfg.lowerColumns.map((c, i) => (
            <Column key={c.heading} col={c} small at={{ gridColumn: i + 1, gridRow: 2 }} {...colProps(c)} />
          ))}

          <div className="kf-join">
            <Link href={cfg.join.href} className="kf-join-card">
              <span className="kf-join-badge">{cfg.join.label}</span>
            </Link>
          </div>
        </div>

        {/* ---- socials, then the rule ---- */}
        <div className="kf-social">
          {cfg.socials.map((s) => {
            const Icon = SOCIAL[s.icon] || IconInstagram;
            return (
              <a key={s.icon} href={s.href} aria-label={s.label} target="_blank" rel="noreferrer">
                <Icon />
              </a>
            );
          })}
          <Link href={cfg.join.href} className="kf-join-btn">{cfg.join.label.toLowerCase()}</Link>
        </div>

        <div className="kf-rule" />

        {/* ---- legal ---- */}
        <div className="kf-bot">
          <div className="kf-bot-l">
            <p className="kf-copy">{cfg.copyright}</p>
            <p className="kf-crisis">{cfg.crisis}</p>
            <p className="kf-help">{cfg.helpline}</p>
          </div>

          <div className="kf-bot-r">
            <Link href={cfg.sitemap.href} className="kf-sitemap">{cfg.sitemap.label}</Link>
            <div className="kf-marks">
              {cfg.marks.map((m) => {
                const Mark = MARKS[m.icon] || IconHipaa;
                return <span key={m.icon} className="kf-mark"><Mark />{m.label}</span>;
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* --------------------------------- css ----------------------------------- */

const CSS = `
.kf{background:#063327;color:#fff;font-family:var(--font-body,'Inter',system-ui,sans-serif);}
.kf *{box-sizing:border-box;}
/* globals.css spaces body text with an !important letter-spacing, and the file
   sets none, so it is cleared here with the guard globals.css itself uses. */
.kf p,.kf p:not(#_),.kf li,.kf li:not(#_),.kf span,.kf span:not(#_),.kf a,.kf a:not(#_),.kf button{
  font-family:var(--font-body,'Inter',system-ui,sans-serif)!important;letter-spacing:0!important;
}
/* 394 to 1526 on the 1920 frame: 1132 of content. Below that the columns give
   way together rather than holding still until a breakpoint snaps. */
.kf-in{max-width:1180px;margin:0 auto;padding:60px 24px 40px;}

/* Columns at 0, 343.6, 608.5 and 907.1 of the 1132; the second row starts at
   299.5, which is where the JOIN US card and the two lower headings all sit. */
.kf-grid{
  display:grid;
  grid-template-columns:minmax(0,343.6fr) minmax(0,264.9fr) minmax(0,298.6fr) minmax(0,224.9fr);
  grid-template-rows:minmax(299.5px,auto) auto;
  align-items:start;
}
.kf-brand{grid-column:1;grid-row:1;}
.kf-join{grid-column:4;grid-row:2;}

/* 138 of wordmark, measured off the canvas, flush with the column edge. */
.kf-logo{display:block;width:151px;height:46px;overflow:hidden;margin:0 0 13px;}
.kf-logo img{
  width:186px;height:186px;max-width:none;display:block;margin:-70px 0 0 -29px;
  filter:brightness(0) invert(1);
}
.kf-co,.kf-co:not(#_){font-size:14px!important;font-weight:500!important;line-height:20px!important;color:#fff!important;margin:0 0 3px;}
.kf-ad,.kf-ad:not(#_){font-size:12px!important;line-height:22px!important;color:#fff!important;margin:0;}
.kf-contact{
  display:flex;align-items:center;gap:8px;height:20px;margin-top:10px;text-decoration:none;
  font-size:14px!important;line-height:20px!important;color:#fff!important;
}
.kf-ad + .kf-contact{margin-top:9px;}
.kf-dot{
  display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;flex:none;
  border-radius:50%;background:#189E4F;color:#F9F9F9;
}

.kf-h,.kf-h:not(#_){
  font-size:14px!important;font-weight:500!important;line-height:18px!important;
  text-transform:uppercase;color:#51B763!important;margin:0 0 16.5px;
}
.kf-acc{display:none;}
.kf-out{display:none;}
.kf-reveal,.kf-reveal-in{display:contents;}
.kf-list{list-style:none!important;margin:0;padding:0;}
.kf-list li{display:block!important;margin:0 0 9px;line-height:21px;}
.kf-list li:last-child{margin-bottom:0;}
/* A 21 line on a 30 pitch: the one link long enough to wrap, the OCD one, then
   lands where the file puts its second line. */
.kf-link{display:inline-block;vertical-align:top;text-decoration:none;font-size:12px!important;line-height:21px!important;color:#fff!important;}
.kf-link:hover{color:#fff!important;text-decoration:underline;}
.kf-col.is-wide .kf-list{max-width:200px;}
.kf-col.is-small .kf-link{text-transform:uppercase;}

/* The team photo, set a little larger than its 206x104 card as the file sets it. */
.kf-join{display:flex;justify-content:flex-start;align-items:flex-start;}
.kf-join-card{
  position:relative;display:block;width:100%;max-width:206px;height:104px;border-radius:12px;
  background:#0A4636 url('/design/join-team.webp') center/106% auto no-repeat;
}
.kf-join-badge,.kf-join-badge:not(#_){
  position:absolute;top:-13px;left:50%;transform:translateX(-50%);
  display:inline-flex;align-items:center;justify-content:center;height:26px;min-width:76px;
  background:#189E4F;color:#fff;border-radius:13px;padding:0 12px;
  font-size:12px;font-weight:400;line-height:18px;white-space:nowrap;
}

.kf-social{display:flex;justify-content:flex-end;gap:15px;margin-top:51.5px;}
.kf-social a{color:#fff;display:inline-flex;}
.kf-social a:hover{opacity:.8;}
.kf-social a.kf-join-btn{display:none;}

.kf-rule{height:1px;background:#BFE3CB;margin:15.5px 0 15px;}

.kf-bot{display:flex;justify-content:space-between;align-items:flex-start;gap:30px;}
.kf-bot-l{max-width:600px;}
.kf-bot-r{display:flex;flex-direction:column;align-items:flex-end;gap:19px;}
.kf-copy,.kf-copy:not(#_),.kf-crisis,.kf-crisis:not(#_),.kf-help,.kf-help:not(#_){
  font-size:12px!important;line-height:18px!important;color:#9CA3AF!important;
}
.kf-copy,.kf-copy:not(#_){margin:0 0 13px;}
.kf-crisis,.kf-crisis:not(#_){margin:0 0 18.6px;}
.kf-help,.kf-help:not(#_){margin:0;}
.kf-sitemap{text-decoration:none;font-size:12px!important;line-height:18px!important;text-transform:uppercase;color:#9CA3AF!important;}
.kf-sitemap:hover{color:#fff!important;}
.kf-marks{display:flex;align-items:center;gap:32.6px;}
.kf-mark,.kf-mark:not(#_){display:inline-flex;align-items:center;gap:6.4px;font-size:12px;line-height:18px;color:#fff;}
.kf-shield{width:14px;height:20px;flex:none;}

/* Tablet: three columns, packed so no row is left half empty.
     brand (2 cols)            | JOIN US
     EXPERTS    | SERVICES     | ABOUT KOOTT
     CONDITIONS (2 cols, two-column list) | OUR TERMS
   The old two-column version gave the brand, the join card and the socials a
   whole row each, which is where its 1,700px of height went. DOM order is
   brand, EXPERTS, CONDITIONS, SERVICES, ABOUT, TERMS, JOIN — hence the order values. */
@media (max-width:1000px){
  .kf-grid{grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:none;gap:32px 24px;}
  .kf-grid > *{grid-column:auto!important;grid-row:auto!important;}
  .kf-grid > :nth-child(1){order:0;grid-column:1 / span 2!important;}  /* brand */
  .kf-grid > :nth-child(7){order:1;}                                   /* JOIN US */
  .kf-grid > :nth-child(2){order:2;}                                   /* EXPERTS */
  .kf-grid > :nth-child(4){order:3;}                                   /* SERVICES */
  .kf-grid > :nth-child(5){order:4;}                                   /* ABOUT */
  .kf-grid > :nth-child(3){order:5;grid-column:1 / span 2!important;}  /* CONDITIONS */
  .kf-grid > :nth-child(6){order:6;}                                   /* TERMS */
  .kf-col.is-wide .kf-list{max-width:none;columns:2;column-gap:24px;}
  .kf-col.is-wide .kf-list li{break-inside:avoid;}
  .kf-join{justify-content:flex-end;align-self:center;}
  /* Touch sizes: every link, contact line and social icon gets a row tall enough
     to tap without hitting its neighbour. */
  .kf-list li{margin:0;}
  .kf-link{display:inline-flex;align-items:center;min-height:36px;}
  .kf-social{gap:6px;margin-right:-13px;}
  .kf-social a{width:44px;height:44px;align-items:center;justify-content:center;border-radius:50%;}
  .kf-sitemap{display:inline-flex;align-items:center;min-height:36px;}
}

/* Phone, from the 390 frame. No company lines; the columns become accordions in
   the file's order, SERVICES first; JOIN US moves down beside the socials as a
   button. The padding, gaps and pitches are the file's. */
@media (max-width:640px){
  .kf-in{padding:32px 16px max(19px, env(safe-area-inset-bottom));}
  .kf-grid{display:flex;flex-direction:column;align-items:stretch;gap:8px;}
  .kf-grid > :nth-child(1){order:0;}  /* brand */
  .kf-grid > :nth-child(4){order:1;}  /* SERVICES */
  .kf-grid > :nth-child(2){order:2;}  /* EXPERTS */
  .kf-grid > :nth-child(3){order:3;}  /* CONDITIONS */
  .kf-grid > :nth-child(5){order:4;}  /* ABOUT */
  .kf-grid > :nth-child(6){order:5;}  /* TERMS */
  .kf-join{display:none;}

  .kf-brand{margin-bottom:17px;}
  .kf-logo{width:108px;height:34px;margin:0 0 25px;}
  .kf-logo img{width:133px;height:133px;margin:-50px 0 0 -21px;}
  .kf-co,.kf-co:not(#_),.kf-ad,.kf-ad:not(#_){display:none;}
  .kf-contact{gap:6px;margin-top:14px;}
  .kf-logo + .kf-co + .kf-ad + .kf-ad + .kf-contact{margin-top:0;}

  .kf-col{
    border:1px solid #0A4636;border-radius:16px;
    transition:padding .4s cubic-bezier(.4,0,.2,1),background-color .4s ease,border-color .4s ease;
  }
  .kf-col.is-open{background:#0A4636;border-color:#DDEED8;padding-bottom:28px;}
  .kf-h,.kf-h:not(#_){display:none;}
  .kf-acc{
    display:flex;align-items:center;justify-content:space-between;width:100%;height:56px;
    margin:0;padding:0 20px 0 16px;border:0;background:none;color:#fff;cursor:pointer;text-align:left;
  }
  .kf-acc span,.kf-acc span:not(#_){font-size:14px;font-weight:500;line-height:22px;color:#fff;}
  .kf-acc svg{flex:none;}
  /* The plus folds into a minus as the same .4s runs on the list. */
  .kf-acc-v{transform-box:fill-box;transform-origin:center;transition:transform .4s cubic-bezier(.4,0,.2,1);}
  .kf-col.is-open .kf-acc-v{transform:scaleY(0);}
  /* A one-row grid easing between 0fr and 1fr: the same open and close as the
     dropdowns on the pages above. */
  .kf-reveal{
    display:grid;grid-template-rows:0fr;
    transition:grid-template-rows .4s cubic-bezier(.4,0,.2,1),margin .4s cubic-bezier(.4,0,.2,1);
  }
  .kf-col.is-open .kf-reveal{grid-template-rows:1fr;margin-top:-4px;}
  .kf-reveal-in{
    display:block;min-height:0;overflow:hidden;visibility:hidden;opacity:0;
    transition:opacity .25s ease,visibility 0s linear .4s;
  }
  .kf-col.is-open .kf-reveal-in{visibility:visible;opacity:1;transition:opacity .35s ease .05s,visibility 0s;}
  .kf-col .kf-list,.kf-col.is-wide .kf-list{display:block;columns:auto;padding:0 16px;max-width:none;}
  .kf-list li{margin:0 0 12px;line-height:22px;}
  .kf-list li:last-child{margin-bottom:0;}
  /* A 34 tap target on the file's 34 pitch: the padding reaches into the gap. */
  .kf-link{
    display:inline-flex;align-items:center;gap:9px;min-height:22px;
    padding:6px 0;margin:-6px 0;font-size:14px!important;line-height:22px!important;
  }
  .kf-out{display:block;flex:none;}

  .kf-social{align-items:center;justify-content:flex-start;gap:12px;margin:42px 0 0;}
  .kf-social a{width:44px;height:44px;background:#0A4636;}
  .kf-social svg{width:22px;height:22px;}
  .kf-social a.kf-join-btn,.kf-social a.kf-join-btn:not(#_){
    display:inline-flex;align-items:center;justify-content:center;
    width:103px;height:42px;margin-left:auto;background:#fff;border:1px solid #BFE3CB;border-radius:8px;
    text-decoration:none;text-transform:capitalize;
    font-size:16px;line-height:24px;color:#373737;
  }
  .kf-social a.kf-join-btn:hover{opacity:1;}
  .kf-rule{background:#0A4636;margin:24px 0 22px;}

  /* Copyright and sitemap share a row, so both wrappers step aside for one grid. */
  .kf-bot{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:0;}
  .kf-bot-l,.kf-bot-r{display:contents;}
  .kf-copy,.kf-copy:not(#_),.kf-crisis,.kf-crisis:not(#_),.kf-sitemap{color:#B8CFC4!important;}
  .kf-copy,.kf-copy:not(#_){grid-column:1;grid-row:1;margin:0;}
  .kf-sitemap{grid-column:2;grid-row:1;min-height:0;}
  .kf-crisis,.kf-crisis:not(#_){grid-column:1 / -1;grid-row:2;margin:24px 0 0;}
  /* Narrow enough that the number drops to its own line whole, as the file has it. */
  .kf-help,.kf-help:not(#_){grid-column:1 / -1;grid-row:3;max-width:305px;margin:24px 0 0;color:#fff!important;}
  .kf-marks{grid-column:1 / -1;grid-row:4;gap:19px;margin:24px 0 0;}
  .kf-mark,.kf-mark:not(#_){gap:5px;}
  .kf-shield{width:19px;height:23px;}
}
@media (max-width:640px) and (prefers-reduced-motion:reduce){
  .kf-col,.kf-acc-v,.kf-reveal,.kf-reveal-in,.kf-col.is-open .kf-reveal-in{transition:none;}
}
`;
