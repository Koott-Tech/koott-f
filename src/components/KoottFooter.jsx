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

/* The design's own icons. */
const IconMail = () => (
  <svg viewBox="0 0 13 13" width="13" height="13" fill="none" aria-hidden>
    <path d="M2.97917 3.12305H10.0208C10.7687 3.12305 11.375 3.72933 11.375 4.47721V8.81055C11.375 9.55843 10.7687 10.1647 10.0208 10.1647H2.97917C2.23128 10.1647 1.625 9.55843 1.625 8.81055V4.47721C1.625 3.72933 2.23128 3.12305 2.97917 3.12305Z" strokeWidth="0.975" stroke="currentColor" />
    <path d="M2.16797 3.93555L6.5013 7.18555L10.8346 3.93555" strokeWidth="0.975" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
  </svg>
);

const IconWhatsapp = () => (
  <svg viewBox="0 0 14 14" width="14" height="14" fill="none" aria-hidden>
    <path d="M7.00108 1.31033C5.97515 1.30625 4.96629 1.57281 4.07628 2.08313C3.18626 2.59344 2.44658 3.32946 1.93185 4.21693C1.41712 5.10439 1.14555 6.11192 1.14453 7.13785C1.14352 8.16379 1.4131 9.17185 1.92608 10.0603L1.22608 12.5687L3.79274 11.8687C4.54553 12.4124 5.41727 12.7686 6.33546 12.9076C7.25365 13.0466 8.19175 12.9643 9.07175 12.6677C9.95175 12.3711 10.7482 11.8687 11.3949 11.2022C12.0416 10.5357 12.5198 9.72449 12.7898 8.83596C13.0598 7.94743 13.1138 7.00728 12.9472 6.09369C12.7807 5.1801 12.3984 4.31948 11.8322 3.5834C11.266 2.84733 10.5322 2.25706 9.69195 1.8617C8.85167 1.46634 7.92914 1.27731 7.00108 1.31033ZM10.1511 9.53533C10.0344 9.88533 9.45108 10.2353 9.15941 10.2353C8.86774 10.2937 8.57608 10.2937 8.16774 10.177C6.77332 9.58968 5.60673 8.56635 4.84274 7.26033C4.60941 6.852 4.31774 6.26866 4.31774 5.74366C4.31774 5.21866 4.60941 4.927 4.72608 4.81033C4.84274 4.69366 4.95941 4.63533 5.07608 4.63533H5.36774C5.48441 4.63533 5.60108 4.63533 5.65941 4.86866L6.12608 5.977C6.18441 6.09366 6.12608 6.21033 6.06774 6.26866L5.83441 6.56033C5.77608 6.677 5.65941 6.73533 5.77608 6.91033C6.00941 7.31866 6.35941 7.727 6.70941 8.01866C7.05941 8.31033 7.35108 8.427 7.46774 8.48533C7.58441 8.54366 7.70108 8.54366 7.75941 8.427L8.10941 8.01866C8.22608 7.902 8.28441 7.902 8.40108 7.96033L9.45108 8.48533C9.56774 8.54366 9.68441 8.602 9.68441 8.66033C9.74274 8.777 9.74274 9.06866 9.62608 9.36033L10.1511 9.53533Z" fill="currentColor" />
  </svg>
);

const IconInstagram = () => (
  <svg viewBox="0 0 17 17" width="17" height="17" fill="none" aria-hidden>
    <path d="M5.66667 2.26855H11.3333C13.2893 2.26855 14.875 3.85421 14.875 5.81022V11.4769C14.875 13.4329 13.2893 15.0186 11.3333 15.0186H5.66667C3.71066 15.0186 2.125 13.4329 2.125 11.4769V5.81022C2.125 3.85421 3.71066 2.26855 5.66667 2.26855Z" strokeWidth="1.2" stroke="currentColor" />
    <path d="M11.3346 8.64388C11.3346 10.2087 10.0661 11.4772 8.5013 11.4772C6.9365 11.4772 5.66797 10.2087 5.66797 8.64388C5.66797 7.07907 6.9365 5.81055 8.5013 5.81055C10.0661 5.81055 11.3346 7.07907 11.3346 8.64388Z" strokeWidth="1.2" stroke="currentColor" />
    <path d="M12.1815 5.739C12.6118 5.739 12.9607 5.39015 12.9607 4.95983C12.9607 4.52951 12.6118 4.18066 12.1815 4.18066C11.7512 4.18066 11.4023 4.52951 11.4023 4.95983C11.4023 5.39015 11.7512 5.739 12.1815 5.739Z" fill="currentColor" />
  </svg>
);

const IconFacebook = () => (
  <svg viewBox="0 0 17 17" width="17" height="17" fill="none" aria-hidden>
    <path d="M9.56198 15.0189V9.35221H11.4745L11.7578 7.15638H9.56198V5.73971C9.56198 5.10221 9.73906 4.67721 10.6599 4.67721H11.8286V2.69388C11.6161 2.69388 10.9078 2.62305 10.1286 2.62305C8.42865 2.62305 7.29531 3.65013 7.29531 5.52721V7.15638H5.38281V9.35221H7.29531V15.0189H9.56198Z" fill="currentColor" />
  </svg>
);

const IconYoutube = () => (
  <svg viewBox="0 0 17 17" width="17" height="17" fill="none" aria-hidden>
    <path d="M15.2982 5.24388C15.217 4.94745 15.0599 4.67728 14.8426 4.45994C14.6253 4.2426 14.3551 4.08557 14.0587 4.0043C12.9253 3.68555 8.49825 3.68555 8.49825 3.68555C8.49825 3.68555 4.07116 3.68555 2.93783 4.0043C2.6414 4.08557 2.37123 4.2426 2.15389 4.45994C1.93655 4.67728 1.77952 4.94745 1.69825 5.24388C1.4988 6.366 1.40395 7.50422 1.41491 8.64388C1.40395 9.78354 1.4988 10.9218 1.69825 12.0439C1.77952 12.3403 1.93655 12.6105 2.15389 12.8278C2.37123 13.0452 2.6414 13.2022 2.93783 13.2835C4.07116 13.6022 8.49825 13.6022 8.49825 13.6022C8.49825 13.6022 12.9253 13.6022 14.0587 13.2835C14.3551 13.2022 14.6253 13.0452 14.8426 12.8278C15.0599 12.6105 15.217 12.3403 15.2982 12.0439C15.4977 10.9218 15.5925 9.78354 15.5816 8.64388C15.5925 7.50422 15.4977 6.366 15.2982 5.24388ZM7.08158 10.7689V6.51888L10.7649 8.64388L7.08158 10.7689Z" fill="currentColor" />
  </svg>
);

const IconLinkedin = () => (
  <svg viewBox="0 0 17 17" width="17" height="17" fill="none" aria-hidden>
    <path d="M4.91672 6.16439H2.76339V15.0186H4.91672V6.16439ZM3.84005 2.26855C3.50848 2.26855 3.19048 2.40027 2.95602 2.63473C2.72156 2.86919 2.58984 3.18719 2.58984 3.51876C2.58984 3.85034 2.72156 4.16833 2.95602 4.40279C3.19048 4.63725 3.50848 4.76897 3.84005 4.76897C4.17163 4.76897 4.48962 4.63725 4.72408 4.40279C4.95854 4.16833 5.09026 3.85034 5.09026 3.51876C5.09026 3.18719 4.95854 2.86919 4.72408 2.63473C4.48962 2.40027 4.17163 2.26855 3.84005 2.26855ZM14.8759 15.0186H12.7296V10.6977C12.7296 9.67064 12.7084 8.34605 11.2988 8.34605C9.86089 8.34605 9.6413 9.46522 9.6413 10.6198V15.0186H7.50922V6.16439H9.56339V7.36855H9.5988C9.80536 7.01613 10.1033 6.72609 10.4612 6.52908C10.819 6.33208 11.2235 6.23544 11.6317 6.24939C13.8134 6.24939 14.8759 7.65189 14.8759 10.2019V15.0186Z" fill="currentColor" />
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

/* The laptop frame's marks, drawn in its 26-tall boxes (placed by the sheet). */
const FIG_MARKS = {
  hipaa: (
    <svg className="kf-shield-fig" viewBox="0 0 22 26" width="22" height="26" fill="none" aria-hidden>
      <g transform="translate(2.35 2.69)">
    <path d="M6.65 0.65C9.05 1.75 10.95 2.05 12.65 1.85V10.05C12.65 14.25 9.95 17.25 6.65 18.65C3.35 17.25 0.65 14.25 0.65 10.05V1.85C2.35 2.05 4.25 1.75 6.65 0.65Z" strokeWidth="1.3" strokeLinejoin="round" stroke="currentColor" />
      </g>
      <g transform="translate(5.05 7.39)">
    <path d="M3.95 0.75V4.25M3.95 4.25V7.75M3.95 4.25H0.75M3.95 4.25H7.15" strokeWidth="1.5" strokeLinecap="round" stroke="currentColor" />
      </g>
    </svg>
  ),
  certified: (
    <svg className="kf-shield-fig" viewBox="0 0 22 26" width="22" height="26" fill="none" aria-hidden>
      <g transform="translate(2.35 2.49)">
    <path d="M6.65 0.65L12.65 3.05V8.25C12.65 12.25 10.05 15.15 6.65 16.65C3.25 15.15 0.65 12.25 0.65 8.25V3.05L6.65 0.65Z" strokeWidth="1.3" strokeLinejoin="round" stroke="currentColor" />
      </g>
      <g transform="translate(5.2 8.34)">
    <path d="M0.8 2.8L3 5L7.2 0.8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
      </g>
    </svg>
  ),
};

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
              <img className="kf-logo-fig" src="/design/footer-logo.svg" alt="" width={151} height={46} />
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
                return <span key={m.icon} className={`kf-mark kf-mark--${m.icon}`}><Mark />{FIG_MARKS[m.icon]}{m.label}</span>;
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
  font-size:12px;font-weight:500;line-height:18px;white-space:nowrap;
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
.kf-logo img.kf-logo-fig,.kf-shield-fig{display:none;}

/* Laptop and up, from Figma frame 268:2637. Stacked: 60 top, a 561 grid of two
   261.5 rows 38 apart, then 16 + socials (10 + 17) + 16 + rule + 16 + legal
   (2 + 123.25) + 36: 858.25 in all. */
@media (min-width:1001px){
  .kf-in{padding:60px 24px 36px;}
  .kf-grid{grid-template-rows:261.5px 261.5px;row-gap:38px;}
  .kf-logo{margin:0 0 14px;}
  .kf-logo img{display:none;}
  .kf-logo img.kf-logo-fig{display:block;width:100%;height:100%;margin:0;filter:none;}
  .kf-co:not(#_){line-height:22px!important;margin:0 0 4px;}
  .kf-ad:not(#_){line-height:18px!important;margin:0 0 4px;}
  .kf-contact{height:22px;margin-top:8px;line-height:22px!important;}
  .kf-ad + .kf-contact{margin-top:8px;}
  .kf-h:not(#_){line-height:22px!important;margin:0 0 16px;}
  .kf-grid > :nth-child(4) .kf-h:not(#_){margin-bottom:14px;}
  .kf-list li{margin:0 0 12px;line-height:18px;}
  .kf-link{line-height:18px!important;}
  /* The OCD line wraps with 3 between its two lines. */
  .kf-col.is-wide li:nth-child(10) .kf-link{line-height:19.5px!important;}
  .kf-join-badge:not(#_){min-width:0;padding:0 14px;border-radius:999px;}
  .kf-social{gap:16px;margin-top:16px;padding-top:10px;}
  .kf-rule{margin:16px 0;}
  .kf-bot{padding-top:2px;}
  .kf-bot-l{min-height:123.25px;}
  .kf-bot-r{gap:14px;}
  .kf-copy:not(#_){margin:-.86px 0 13.75px;}
  .kf-crisis:not(#_){margin:0 0 18.75px;}
  .kf-marks{gap:14px;}
  .kf-mark:not(#_){gap:0;height:26px;font-weight:500;}
  .kf-mark--hipaa{width:74px;}
  .kf-mark--certified{width:82px;}
  .kf-shield{display:none;}
  .kf-shield-fig{display:block;flex:none;}
  .kf-mark--certified .kf-shield-fig{margin-right:-1px;}
}

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
