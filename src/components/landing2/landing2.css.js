/**
 * Condition landing page (Koott 2.0).
 *
 * Every size, space, weight and colour here is read from the Figma file
 * "Koott 2.0" (EzLwBjoYNqTa9RMEmOfyQO), section "Landing Page (WIP)", screen
 * "Anxiety landing · v2" (7963:27756), drawn at 402 px. The phone rules come
 * first and match that screen to the pixel; the block at the end widens the same
 * page for tablets and laptops, which the Figma does not draw.
 *
 * The therapist cards are the home page's own card (components/home2), so the
 * section that holds them carries home2's stylesheet under a nested `.h2`.
 *
 * !important appears where globals.css sets a site-wide heading or paragraph
 * style that would otherwise win over these.
 */

export const LANDING2_CSS = `
.l2{
  --ink:#1C241F; --ink-2:#3D4842; --ink-soft:#535E58; --ink-mute:#6B746F; --ink-faint:#9CA49F;
  --line:#E3E7E5; --tile:#F5F7F6; --green:#2E7D5A; --bright:#39AC71; --dark:#063327;
  --card-shadow:0 2px 5px rgba(28,36,31,.02),0 9px 9px rgba(28,36,31,.02),0 20px 12px rgba(28,36,31,.02),0 36px 14px rgba(28,36,31,.01);
  --btn-shadow:inset 0 0 0 1px rgba(255,255,255,.40),0 1px 3px rgba(15,72,54,.08),0 11px 7px rgba(15,72,54,.04),0 19px 8px rgba(15,72,54,.02),inset 0 7px 7.2px rgba(255,255,255,.25);
  --pill-shadow:inset 0 0 0 1px var(--line),0 1px 2px rgba(28,36,31,.04),0 3px 3px rgba(28,36,31,.03),0 8px 5px rgba(28,36,31,.02),0 14px 5px rgba(28,36,31,.01);
  background:#fff;color:var(--ink);
  font-family:'Figtree',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased;
}
.l2 *,.l2 *::before,.l2 *::after{box-sizing:border-box;}
.l2 :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;}
.l2 :where(a){text-decoration:none;color:inherit;}
.l2 :where(img){display:block;}
.l2 :is(p,h1,h2,h3,h4,h5,h6):not(#_){font-family:inherit!important;margin:0!important;}
/* The home page's card lives inside this page; it must not claim a screen of its own. */
.l2 .h2{min-height:0;background:transparent;}

.l2-wrap{width:100%;max-width:640px;margin:0 auto;}

/* ───────── header (402x72) ───────── */
/* Figma fixes the header at 72, taller than its contents need. */
.l2-head{display:flex;align-items:center;justify-content:space-between;height:72px;padding:16px;background:#fff;}
.l2-logo img{width:74px;height:23px;}
.l2-head-right{display:flex;align-items:center;gap:16px;}
.l2-login{
  display:inline-flex;align-items:center;justify-content:center;height:34px;padding:8px 12px;
  border-radius:59px;background:#fff;box-shadow:inset 0 0 0 1px #EBEBEB,0 1px 2px rgba(191,191,191,.10),0 3px 3px rgba(191,191,191,.09),0 8px 5px rgba(191,191,191,.05);
  font-size:14px;font-weight:500;line-height:16px;color:#1F2A25;
}
.l2-burger{display:flex;width:24px;height:24px;}
.l2-burger svg{width:24px;height:24px;}

/* ───────── hero (col gap 24, pad 16/16/40) ───────── */
.l2-hero{display:flex;flex-direction:column;gap:24px;padding:16px 16px 40px;}
.l2-video{
  width:100%;padding:6px;border-radius:24px;background:#fff;
  border:1px solid var(--line);box-shadow:var(--card-shadow);
}
.l2-video-inner{
  position:relative;height:200px;border-radius:16px;overflow:hidden;background:var(--dark);
  display:flex;align-items:center;justify-content:center;
}
.l2-video-inner > img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.75;}
.l2-play{
  position:relative;display:flex;align-items:center;justify-content:center;width:56px;height:56px;
  border-radius:9999px;background:#fff;
}
.l2-play svg{width:22px;height:22px;}
.l2-cap{position:absolute;left:16px;right:16px;bottom:16px;display:flex;flex-direction:column;gap:2px;}
.l2-cap-k{font-size:11px;font-weight:700;line-height:16px;letter-spacing:.55px;text-transform:uppercase;color:#fff;opacity:.5;}
.l2-cap-v{font-size:14px;font-weight:600;line-height:20px;color:#fff;}

.l2-intro{display:flex;flex-direction:column;gap:16px;}
.l2-by{display:flex;align-items:center;gap:6px;}
.l2-faces{display:flex;}
.l2-faces img,.l2-faces span{
  width:32px;height:32px;border-radius:16px;object-fit:cover;background:var(--tile);
  box-shadow:0 0 0 2px #fff;display:flex;align-items:center;justify-content:center;
  font-size:12px;font-weight:600;color:var(--green);
}
.l2-faces > * + *{margin-left:-8px;}
.l2-by-text{flex:1;min-width:0;font-size:12px;font-weight:500;line-height:16px;color:var(--ink-soft);}
.l2-headline{display:flex;flex-direction:column;gap:12px;}
.l2-h1{font-size:32px!important;font-weight:600!important;line-height:40px!important;letter-spacing:-.64px!important;color:var(--ink-2)!important;}
.l2-sub{font-size:16px!important;font-weight:400!important;line-height:24px!important;color:var(--ink-soft)!important;}

.l2-ctas{display:flex;gap:12px;}
.l2-btn{
  flex:1;min-width:0;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:48px;
  padding:0 28px;border-radius:9999px;background:linear-gradient(180deg,#5DC189 0%,#39AC71 100%);
  box-shadow:var(--btn-shadow);color:#fff;font-size:16px;font-weight:600;line-height:20px;white-space:nowrap;
}
.l2-btn.is-plain{
  background:#fff;box-shadow:var(--pill-shadow);color:var(--ink);padding:0 28px 0 24px;
}
.l2-btn svg{flex:none;width:24px;height:24px;}

.l2-stats{border-radius:16px;border:1px solid var(--line);overflow:hidden;background:#fff;}
.l2-stat-row{display:flex;}
.l2-stat-row + .l2-stat-row{border-top:1px solid var(--line);}
.l2-stat{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;padding:16px;}
.l2-stat + .l2-stat{border-left:1px solid var(--line);}
.l2-stat-v{font-size:24px;font-weight:700;line-height:32px;letter-spacing:-.24px;color:var(--green);}
.l2-stat-k{font-size:12px;font-weight:400;line-height:16px;color:var(--ink-soft);}

/* ───────── section chrome ───────── */
.l2-sec{display:flex;flex-direction:column;gap:24px;padding:48px 16px;}
.l2-sec.is-tight{padding:40px 16px;}
.l2-head-block{display:flex;flex-direction:column;gap:12px;}
.l2-head-block.is-small{gap:8px;}
.l2-eyebrow{font-size:11px!important;font-weight:600!important;line-height:16px!important;letter-spacing:.55px!important;text-transform:uppercase;color:var(--green)!important;}
.l2-h2{font-size:24px!important;font-weight:600!important;line-height:32px!important;letter-spacing:-.24px!important;color:var(--ink-2)!important;}
.l2-lead{font-size:14px!important;font-weight:400!important;line-height:20px!important;color:var(--ink-soft)!important;}

/* ───────── therapists ───────── */
.l2-cards{display:flex;flex-direction:column;gap:24px;align-items:center;}
.l2-more{
  display:flex;align-items:center;gap:12px;width:100%;padding:12px 16px 12px 12px;border-radius:9999px;
  background:var(--tile);text-align:left;
}
.l2-more .l2-faces img,.l2-more .l2-faces span{width:28px;height:28px;border-radius:14px;}
.l2-more-text{flex:1;min-width:0;font-size:14px;font-weight:600;line-height:18px;color:var(--ink);}
.l2-more svg{flex:none;width:18px;height:18px;}

/* ───────── reviews (370x378 panel) ───────── */
.l2-reviews-wrap{padding:0 16px;}
.l2-reviews{
  display:flex;flex-direction:column;gap:24px;align-items:center;padding:48px 16px;
  border-radius:24px;background:var(--tile);
}
.l2-reviews .l2-h2{text-align:center;}
.l2-rail{display:flex;gap:12px;width:100%;overflow-x:auto;scrollbar-width:none;scroll-snap-type:x mandatory;}
.l2-rail::-webkit-scrollbar{display:none;}
.l2-review{
  flex:none;width:272px;display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:16px;
  background:#fff;box-shadow:var(--card-shadow);scroll-snap-align:start;
}
.l2-review-top{display:flex;align-items:center;gap:8px;}
.l2-stars{display:flex;gap:2px;}
.l2-stars svg{width:14px;height:14px;}
.l2-review-time{font-size:12px;font-weight:400;line-height:16px;color:var(--ink-mute);}
.l2-quote{font-size:14px!important;font-weight:400!important;line-height:20px!important;color:var(--ink-2)!important;}
.l2-author{display:flex;align-items:center;gap:8px;}
.l2-initial{
  flex:none;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;
  background:var(--tile);box-shadow:0 0 0 1px #fff,var(--pill-shadow);
  font-size:13px;font-weight:600;color:var(--green);
}
.l2-author-n{font-size:14px;font-weight:500;line-height:18px;color:var(--ink);}
.l2-author-m{font-size:12px;font-weight:400;line-height:16px;color:var(--ink-mute);}

/* ───────── how it works (step rail 272) ───────── */
.l2-steps{display:flex;gap:12px;overflow-x:auto;scrollbar-width:none;scroll-snap-type:x mandatory;}
.l2-steps::-webkit-scrollbar{display:none;}
.l2-step{
  flex:none;width:272px;display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:24px;
  background:#fff;border:1px solid var(--line);box-shadow:var(--card-shadow);scroll-snap-align:start;
}
.l2-step-no{
  align-self:flex-start;padding:3px 8px;border-radius:9999px;
  background:linear-gradient(180deg,#FFFFFF 0%,#E2F7E7 100%);box-shadow:inset 0 0 0 1px #46C57A;
  font-size:11px;font-weight:600;line-height:16px;letter-spacing:.55px;text-transform:uppercase;color:var(--green);
}
.l2-step-t{font-size:18px;font-weight:600;line-height:24px;letter-spacing:-.09px;color:var(--ink);}
.l2-step-b{font-size:14px!important;font-weight:400!important;line-height:20px!important;color:var(--ink-soft)!important;}

/* ───────── why card (370x523) ───────── */
.l2-why{
  width:100%;padding:6px;border-radius:24px;background:#fff;
  border:1px solid var(--line);box-shadow:var(--card-shadow);
}
.l2-why-banner{
  position:relative;height:206px;border-radius:16px;overflow:hidden;background:var(--dark);
}
.l2-why-banner img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.l2-why-strip{
  position:absolute;left:16px;right:16px;bottom:16px;
  font-size:11px;font-weight:600;line-height:16px;letter-spacing:.55px;text-transform:uppercase;color:#fff;
}
.l2-reasons{padding:8px 12px;}
.l2-reason{display:flex;align-items:center;gap:12px;padding:12px 0;}
.l2-reason + .l2-reason{border-top:1px solid var(--line);}
.l2-badge{
  flex:none;display:flex;align-items:center;justify-content:center;width:40px;height:40px;
  border-radius:9999px;background:#fff;box-shadow:var(--pill-shadow);
}
.l2-badge svg{width:20px;height:20px;}
.l2-reason-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.l2-reason-t{font-size:14px;font-weight:600;line-height:20px;color:var(--ink);}
.l2-reason-b{font-size:12px;font-weight:400;line-height:16px;color:var(--ink-soft);}

/* ───────── pricing ───────── */
.l2-plan{
  width:100%;padding:6px;border-radius:24px;background:#fff;
  border:1px solid var(--line);box-shadow:var(--card-shadow);
}
.l2-plan-top{
  display:flex;flex-direction:column;gap:12px;padding:20px 16px 16px;border-radius:16px;
  background:linear-gradient(180deg,#F0FBED 0%,#EAF3ED 55%,#FFFFFF 100%);
}
.l2-plan-k{font-size:11px;font-weight:600;line-height:16px;letter-spacing:.55px;text-transform:uppercase;color:var(--green);}
.l2-price{display:flex;align-items:baseline;gap:6px;}
.l2-price-v{font-size:32px;font-weight:600;line-height:40px;letter-spacing:-.64px;color:var(--ink);}
.l2-price-u{font-size:14px;font-weight:400;line-height:20px;color:var(--ink-soft);}
.l2-plan-body{display:flex;flex-direction:column;gap:16px;padding:16px 12px 12px;}
.l2-includes{display:flex;flex-direction:column;gap:10px;}
.l2-include{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:500;line-height:20px;color:var(--ink-2);}
.l2-include svg{flex:none;width:16px;height:16px;}
.l2-also{display:flex;flex-direction:column;gap:4px;}
.l2-also-k{font-size:11px!important;font-weight:600!important;line-height:16px!important;letter-spacing:.55px!important;text-transform:uppercase;color:var(--ink-mute)!important;}
.l2-also-row{
  display:flex;align-items:center;gap:12px;width:100%;padding:12px 0;text-align:left;
  font-size:14px;font-weight:500;line-height:20px;color:var(--ink);
}
.l2-also-row + .l2-also-row{border-top:1px solid var(--line);}
.l2-also-row span{flex:1;min-width:0;}
.l2-also-row svg{flex:none;width:18px;height:18px;}

/* ───────── understanding: chips and the accordion ───────── */
.l2-chips{display:flex;flex-wrap:wrap;gap:8px;}
.l2-chip{
  padding:8px 12px;border-radius:9999px;background:#fff;border:1px solid var(--line);
  font-size:14px;font-weight:500;line-height:18px;color:var(--ink-2);
}
.l2-learn{
  width:100%;padding:4px 16px;border-radius:24px;background:#fff;
  border:1px solid var(--line);box-shadow:var(--card-shadow);
}
.l2-learn-row{
  display:flex;align-items:center;gap:12px;width:100%;padding:16px 0;text-align:left;
  font-size:14px;font-weight:600;line-height:20px;color:var(--ink);
}
.l2-learn-row span{flex:1;min-width:0;}
.l2-learn-row svg{flex:none;width:20px;height:20px;}
.l2-learn-item + .l2-learn-item{border-top:1px solid var(--line);}
.l2-learn-body{display:flex;flex-wrap:wrap;gap:8px;padding:0 0 16px;}
.l2-tag{
  padding:6px 12px;border-radius:9999px;background:var(--tile);
  font-size:14px;font-weight:500;line-height:18px;color:var(--ink-2);
}
.l2-learn-note{padding:0 0 16px;font-size:14px!important;font-weight:400!important;line-height:20px!important;color:var(--ink-soft)!important;}

/* ───────── blog ───────── */
.l2-title-row{display:flex;align-items:center;gap:12px;}
.l2-title-row .l2-h2{flex:1;min-width:0;}
.l2-seeall{display:inline-flex;align-items:center;gap:2px;font-size:14px;font-weight:600;line-height:18px;color:var(--green);white-space:nowrap;}
.l2-seeall svg{width:16px;height:16px;}
.l2-article{flex:none;width:248px;display:flex;flex-direction:column;gap:12px;scroll-snap-align:start;}
.l2-article img{width:100%;height:156px;object-fit:cover;border-radius:16px;background:var(--tile);}
.l2-article-t{font-size:14px;font-weight:600;line-height:20px;color:var(--ink);}
.l2-read{display:inline-flex;align-items:center;gap:4px;font-size:14px;font-weight:600;line-height:18px;color:var(--green);}
.l2-read svg{width:16px;height:16px;}

/* ───────── FAQ panel ───────── */
.l2-faq-row{
  display:flex;align-items:center;gap:12px;width:100%;padding:16px 0;text-align:left;
  font-size:14px;font-weight:500;line-height:20px;color:var(--ink);
}
.l2-faq-row span{flex:1;min-width:0;}
.l2-faq-row svg{flex:none;width:20px;height:20px;}
.l2-faq-item + .l2-faq-item{border-top:1px solid var(--line);}
.l2-faq-a{padding:0 0 16px;font-size:14px!important;font-weight:400!important;line-height:20px!important;color:var(--ink-soft)!important;}

/* ───────── final CTA (402x373) ───────── */
.l2-final{padding:24px 16px 48px;background:var(--tile);}
.l2-final-card{
  display:flex;flex-direction:column;justify-content:space-between;gap:24px;height:301px;padding:40px 24px 24px;
  border-radius:24px;color:#fff;
  background:linear-gradient(180deg,rgba(6,51,39,.72) 0%,rgba(6,51,39,.35) 100%),#063327 url('/design/home2/hero-landscape.webp') center/cover no-repeat;
}
.l2-final-text{display:flex;flex-direction:column;gap:8px;text-align:center;}
.l2-final-t{font-size:24px!important;font-weight:600!important;line-height:32px!important;letter-spacing:-.24px!important;color:#fff!important;}
.l2-final-b{font-size:14px!important;font-weight:400!important;line-height:20px!important;color:#fff!important;}
.l2-final-btns{display:flex;flex-direction:column;align-items:center;gap:8px;}
.l2-final-btn{
  display:flex;align-items:center;justify-content:center;width:100%;height:48px;padding:0 28px;
  border-radius:9999px;background:#fff;box-shadow:var(--pill-shadow);
  font-size:16px;font-weight:600;line-height:20px;color:var(--ink);
}
.l2-final-note{font-size:12px!important;font-weight:500!important;line-height:16px!important;color:#fff!important;text-align:center;}

/* ───────── tablet and laptop ─────────
   The Figma draws only the 402 screen. Above it the page is given room rather
   than redrawn: the column grows to 640, then the rails stop scrolling sideways
   and become grids, and the wide sections take two columns. */
@media (min-width:900px){
  .l2-wrap{max-width:1100px;padding:0 32px;}
  .l2-head{padding:20px 0;}
  .l2-hero{
    display:grid;gap:32px 40px;padding:32px 0 56px;align-items:start;
    grid-template-columns:minmax(0,1fr) minmax(0,420px);
    grid-template-areas:"intro video" "ctas video" "stats stats";
  }
  .l2-intro{grid-area:intro;}
  .l2-ctas{grid-area:ctas;align-self:start;}
  .l2-video{grid-area:video;}
  .l2-video-inner{height:260px;}
  .l2-stats{grid-area:stats;}
  .l2-stats .l2-stat-row{display:contents;}
  .l2-stats{display:grid;grid-template-columns:repeat(4,1fr);}
  .l2-stat + .l2-stat{border-left:1px solid var(--line);}
  .l2-stat-row + .l2-stat-row .l2-stat{border-top:0;}
  .l2-h1{font-size:44px!important;line-height:52px!important;letter-spacing:-.88px!important;}
  .l2-sec{padding:64px 0;}
  .l2-sec.is-tight{padding:56px 0;}
  .l2-cards{
    display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:24px;align-items:start;
  }
  .l2-cards .l2-more{grid-column:1 / -1;max-width:560px;justify-self:center;}
  .l2-reviews-wrap{padding:0;}
  .l2-rail,.l2-steps{
    display:grid;grid-template-columns:repeat(auto-fit,minmax(248px,1fr));overflow:visible;
  }
  .l2-review,.l2-step,.l2-article{width:auto;}
  .l2-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px;align-items:start;}
  .l2-final-card{height:auto;padding:56px 32px 40px;}
  .l2-final-btn{max-width:322px;}
}

/* ───────── tracking ─────────
   globals.css sets letter-spacing on body text (0.01em) and paragraphs (-0.5px)
   with !important, which would flatten the design's own tracking. */
.l2 :is(p,span,li,a,button,input,div,small):not(#_){letter-spacing:normal!important;}
.l2 .l2-eyebrow:not(#_),.l2 .l2-cap-k:not(#_),.l2 .l2-why-strip:not(#_),.l2 .l2-plan-k:not(#_),.l2 .l2-also-k:not(#_),.l2 .l2-step-no:not(#_){letter-spacing:.55px!important;}
.l2 .l2-h1:not(#_),.l2 .l2-price-v:not(#_){letter-spacing:-.64px!important;}
.l2 .l2-h2:not(#_),.l2 .l2-stat-v:not(#_),.l2 .l2-final-t:not(#_){letter-spacing:-.24px!important;}
.l2 .l2-step-t:not(#_){letter-spacing:-.09px!important;}
`;
