'use client';

/**
 * KoottFooter — the footer from "Koott Website Sep-26 (3).pdf".
 *
 * Read off the artboard (rendered at 2x and sampled):
 *
 *   band        #012F23            headings   11px / .08em / #8FBFA8, uppercase
 *   links       14px / #E6F0EA     rule       rgba(255,255,255,.14)
 *   small print 12.5px / #A9C4B6   marks      HIPAA + certification, right
 *
 * Layout is two bands inside one dark section: brand · EXPERTS · CONDITIONS ·
 * SERVICES across the top, then ABOUT KOOTT · OUR TERMS with the JOIN US photo
 * card on the right, then a rule with the socials, copyright, sitemap, the
 * crisis notice and the Tele-MANAS helpline.
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
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const IconFacebook = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden>
    <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.45-4 4.1v2.3H7.6V13h2.7v8z" />
  </svg>
);

const IconYoutube = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden>
    <path d="M21.6 7.2a2.5 2.5 0 0 0-1.75-1.75C18.25 5 12 5 12 5s-6.25 0-7.85.45A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.75 1.75C5.75 19 12 19 12 19s6.25 0 7.85-.45a2.5 2.5 0 0 0 1.75-1.75A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z" />
  </svg>
);

const IconLinkedin = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden>
    <path d="M6.94 8.5H3.9V21h3.04zM5.42 3a1.76 1.76 0 1 0 0 3.53 1.76 1.76 0 0 0 0-3.53zM21 21h-3.03v-6.1c0-1.45-.03-3.32-2.02-3.32-2.03 0-2.34 1.58-2.34 3.21V21H10.6V8.5h2.9v1.7h.05a3.2 3.2 0 0 1 2.87-1.58C19.5 8.62 21 10.6 21 14.2z" />
  </svg>
);

const SOCIAL = {
  instagram: IconInstagram, facebook: IconFacebook, youtube: IconYoutube, linkedin: IconLinkedin,
};

/** The two compliance marks the artboard puts bottom-right. */
const IconHipaa = () => (
  <svg viewBox="0 0 74 26" width="74" height="26" fill="none" aria-hidden>
    <path d="M9 3.2c2.4 1.1 4.3 1.4 6 1.2v8.2c0 4.2-2.7 7.2-6 8.6-3.3-1.4-6-4.4-6-8.6V4.4c1.7.2 3.6-.1 6-1.2z"
      stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M9 8v7M5.8 11.5h6.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <text x="20" y="18" fill="currentColor" fontSize="13" fontWeight="700" letterSpacing=".5">HIPAA</text>
  </svg>
);

const IconCertified = () => (
  <svg viewBox="0 0 82 26" width="82" height="26" fill="none" aria-hidden>
    <path d="M9 3l6 2.4v5.2c0 4-2.6 6.9-6 8.4-3.4-1.5-6-4.4-6-8.4V5.4z"
      stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M6 11l2.2 2.2L12.4 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <text x="20" y="17.5" fill="currentColor" fontSize="10" fontWeight="700" letterSpacing=".4">CERTIFIED</text>
  </svg>
);

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

const Column = ({ col, at, small = false, wide = false }) => (
  <div className={`kf-col ${small ? 'is-small' : ''} ${wide ? 'is-wide' : ''}`} style={at}>
    <p className="kf-h">{col.heading}</p>
    <ul className="kf-list">
      {col.links.map((l) => (
        <li key={l.label}>
          <Link href={l.href} className="kf-link">{l.label}</Link>
        </li>
      ))}
    </ul>
  </div>
);

/* --------------------------------- view ---------------------------------- */

export default function KoottFooter({ config } = {}) {
  const cfg = useFooterConfig(config);

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
              <img src="/logo.png" alt="Koott" width={280} height={280} />
            </Link>

            <p className="kf-co">{cfg.brand.company}</p>
            {cfg.brand.address.map((line) => <p key={line} className="kf-ad">{line}</p>)}

            <a className="kf-contact" href={`mailto:${cfg.brand.email}`}>
              <span className="kf-dot" aria-hidden><IconMail /></span>
              {cfg.brand.email}
            </a>
            <a className="kf-contact" href={cfg.brand.whatsapp} target="_blank" rel="noreferrer">
              <span className="kf-dot is-wa" aria-hidden><IconWhatsapp /></span>
              {cfg.brand.phone}
            </a>
          </div>

          {/* row 1: EXPERTS, CONDITIONS (spanning both rows), SERVICES */}
          {cfg.columns.map((c, i) => (
            <Column
              key={c.heading} col={c} wide={i === 1}
              at={{ gridColumn: i + 2, gridRow: i === 1 ? '1 / span 2' : 1 }}
            />
          ))}

          {/* row 2, under the brand and under EXPERTS */}
          {cfg.lowerColumns.map((c, i) => (
            <Column key={c.heading} col={c} small at={{ gridColumn: i + 1, gridRow: 2 }} />
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
                return <span key={m.icon} title={m.label}><Mark /></span>;
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
.kf{
  --kf-line:rgba(255,255,255,.14);
  background:#012F23;color:#E6F0EA;
  font-family:'Mulish','Avenir',system-ui,sans-serif;
}
/* Same 1180px column and 24px gutter as the page sections (.kh2-in), so the
   footer lines up with everything above it. Inside that, spacing and type are
   fluid (clamp against the viewport) rather than fixed, so the layout grows and
   shrinks with the window instead of holding still until a breakpoint snaps. */
.kf-in{
  max-width:1180px;margin:0 auto;
  padding:clamp(40px,4.5vw,60px) 24px clamp(26px,2.6vw,36px);
}

/* brand | EXPERTS | CONDITIONS | SERVICES on row one, ABOUT KOOTT | OUR TERMS |
   (conditions continues) | JOIN US on row two. minmax(0,…) lets a column give
   way to a long unbroken label instead of pushing the grid wider than the page. */
.kf-grid{
  display:grid;
  grid-template-columns:minmax(0,1.35fr) minmax(0,1fr) minmax(0,1.15fr) minmax(0,1fr);
  column-gap:clamp(18px,2.6vw,40px);row-gap:clamp(26px,2.8vw,38px);align-items:start;
}
.kf-brand{grid-column:1;grid-row:1;}
.kf-join{grid-column:4;grid-row:2;}

.kf-logo{display:block;width:132px;height:44px;overflow:hidden;margin:0 0 16px;}
.kf-logo img{
  width:210px;height:210px;max-width:none;display:block;margin:-84px 0 0 -38px;
  filter:brightness(0) invert(1);
}
.kf-co{font-size:14px!important;font-weight:700!important;letter-spacing:0!important;color:#fff!important;margin:0 0 6px;}
.kf-ad{font-size:13.5px!important;letter-spacing:0!important;color:#C9DCD1!important;margin:0 0 3px;line-height:1.5em!important;}
.kf-contact{
  display:flex;align-items:center;gap:8px;margin-top:10px;text-decoration:none;
  font-size:13.5px!important;letter-spacing:0!important;color:#E6F0EA!important;
}
.kf-dot{
  display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;flex:none;
  border-radius:50%;background:#189E4F;color:#fff;
}
.kf-dot.is-wa{background:#25D366;}

.kf-h{
  font-size:11px!important;font-weight:700!important;letter-spacing:.08em!important;
  text-transform:uppercase;color:#8FBFA8!important;margin:0 0 14px;
}
.kf-list{list-style:none!important;margin:0;padding:0;}
.kf-list li{display:block!important;margin:0 0 9px;}
/* 14.5px on a wide screen easing to 13px near the tablet switch, so the four
   columns keep their labels on one line for as long as there is room. */
.kf-link{
  text-decoration:none;font-size:clamp(13px,.45vw + 8.5px,14.5px)!important;letter-spacing:0!important;
  color:#E6F0EA!important;line-height:1.4em!important;
}
.kf-link:hover{color:#fff!important;text-decoration:underline;}
/* The second row's links are set in caps in the artboard. */
.kf-col.is-small .kf-link{font-size:clamp(11.5px,.35vw + 8px,12.5px)!important;letter-spacing:.02em!important;text-transform:uppercase;}

/* Photo card with the JOIN US pill; a tinted panel until we have the team shot. */
.kf-join{display:flex;justify-content:flex-end;align-items:flex-start;}
.kf-join-card{
  position:relative;display:block;width:100%;max-width:206px;height:104px;border-radius:12px;
  background:linear-gradient(150deg,#2F6B4B,#14503A);border:1px solid rgba(255,255,255,.16);
}
.kf-join-badge{
  position:absolute;top:-11px;left:50%;transform:translateX(-50%);
  background:#189E4F;color:#fff;border-radius:999px;padding:4px 14px;
  font-size:11px;font-weight:700;letter-spacing:.06em;white-space:nowrap;
}

.kf-social{display:flex;justify-content:flex-end;gap:16px;margin-top:26px;}
.kf-social a{color:#E6F0EA;display:inline-flex;}
.kf-social a:hover{color:#fff;}

.kf-rule{height:1px;background:var(--kf-line);margin:16px 0 18px;}

.kf-bot{display:flex;justify-content:space-between;align-items:flex-start;gap:30px;}
.kf-bot-l{max-width:620px;}
.kf-bot-r{display:flex;flex-direction:column;align-items:flex-end;gap:14px;}
.kf-copy{font-size:12.5px!important;letter-spacing:0!important;color:#C9DCD1!important;margin:0 0 12px;}
.kf-crisis{font-size:12.5px!important;line-height:1.7em!important;letter-spacing:0!important;color:#A9C4B6!important;margin:0 0 10px;}
.kf-help{font-size:12.5px!important;letter-spacing:0!important;color:#A9C4B6!important;margin:0;}
.kf-sitemap{
  text-decoration:none;font-size:12px!important;letter-spacing:.06em!important;
  text-transform:uppercase;color:#C9DCD1!important;
}
.kf-sitemap:hover{color:#fff!important;}
.kf-marks{display:flex;gap:14px;color:#BFD7C9;}

/* Tablet: three columns, packed so no row is left half empty.
     brand (2 cols)            | JOIN US
     EXPERTS    | SERVICES     | ABOUT KOOTT
     CONDITIONS (2 cols, two-column list) | OUR TERMS
   The old two-column version gave the brand, the join card and the socials a
   whole row each, which is where its 1,700px of height went. DOM order is
   brand, EXPERTS, CONDITIONS, SERVICES, ABOUT, TERMS, JOIN — hence the order values. */
@media (max-width:1000px){
  .kf-grid{grid-template-columns:repeat(3,minmax(0,1fr));}
  .kf-grid > *{grid-column:auto!important;grid-row:auto!important;}
  .kf-grid > :nth-child(1){order:0;grid-column:1 / span 2!important;}  /* brand */
  .kf-grid > :nth-child(7){order:1;}                                   /* JOIN US */
  .kf-grid > :nth-child(2){order:2;}                                   /* EXPERTS */
  .kf-grid > :nth-child(4){order:3;}                                   /* SERVICES */
  .kf-grid > :nth-child(5){order:4;}                                   /* ABOUT */
  .kf-grid > :nth-child(3){order:5;grid-column:1 / span 2!important;}  /* CONDITIONS */
  .kf-grid > :nth-child(6){order:6;}                                   /* TERMS */
  .kf-col.is-wide .kf-list{columns:2;column-gap:clamp(16px,3vw,30px);}
  .kf-col.is-wide .kf-list li{break-inside:avoid;}
  .kf-join{justify-content:flex-end;align-self:center;}
  .kf-join-card{max-width:220px;height:100px;}
}
/* Touch sizes on tablet and phone: every link, contact line and social icon gets
   a row tall enough to tap without hitting its neighbour. */
@media (max-width:1000px){
  .kf-list li{margin:0;}
  .kf-link{display:inline-flex;align-items:center;min-height:36px;}
  .kf-contact{min-height:36px;margin-top:6px;}
  /* 44px tap targets around 17px icons: pull the row out by the padding so the
     icons themselves sit flush with the content edge (right on tablet). */
  .kf-social{gap:6px;margin-right:-13px;}
  .kf-social a{width:44px;height:44px;align-items:center;justify-content:center;border-radius:50%;}
  .kf-social a:hover{background:rgba(255,255,255,.08);}
  .kf-sitemap{display:inline-flex;align-items:center;min-height:36px;}
}
/* Phone: two columns.
     brand (full)
     EXPERTS    | SERVICES
     CONDITIONS (full, two-column list)
     ABOUT KOOTT | OUR TERMS
     JOIN US (full width)
   then socials and the legal strip stacked. */
@media (max-width:640px){
  .kf-grid{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:18px;row-gap:24px;}
  .kf-grid > :nth-child(1){order:0;grid-column:1 / -1!important;}  /* brand */
  .kf-grid > :nth-child(2){order:1;}                               /* EXPERTS */
  .kf-grid > :nth-child(4){order:2;}                               /* SERVICES */
  .kf-grid > :nth-child(3){order:3;grid-column:1 / -1!important;}  /* CONDITIONS */
  .kf-grid > :nth-child(5){order:4;}                               /* ABOUT */
  .kf-grid > :nth-child(6){order:5;}                               /* TERMS */
  .kf-grid > :nth-child(7){order:6;grid-column:1 / -1!important;}  /* JOIN US */
  .kf-join{justify-content:stretch;align-self:auto;}
  .kf-join-card{max-width:none;}
  .kf-social{justify-content:flex-start;margin-right:0;margin-left:-13px;}
  .kf-bot{flex-direction:column;gap:18px;}
  .kf-bot-r{flex-direction:row;align-items:center;justify-content:space-between;width:100%;}

  .kf-link{font-size:14px!important;}
  /* The second row's caps were 11.5px — too small to read or tap on a phone. */
  .kf-col.is-small .kf-link{font-size:12.5px!important;letter-spacing:.03em!important;}
  .kf-h{margin-bottom:6px;}
  .kf-join-card{height:96px;}
  /* 22px sides: the page's own content edge on a phone, so the footer lines up. */
  .kf-in{padding:40px 22px 28px;padding-bottom:max(28px, env(safe-area-inset-bottom));}
  .kf-crisis,.kf-help,.kf-copy{font-size:13px!important;}
}
`;
