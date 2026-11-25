/**
 * My sessions, Session details, Refunds and Refund details (Koott 2.0).
 *
 * Every size, space, weight and colour is read from the Figma file "Koott 2.0",
 * section Home (WIP), screens "My sessions" (8063:4171), "Session details"
 * (8063:4315), "Refunds" (8063:4520) and "Refund details" (8063:4596), all drawn
 * at 402 px. The phone rules come first and match those screens to the pixel; the
 * block at the end widens the same pages for tablets and laptops.
 *
 * The four screens share one chassis — a top bar, a title or a green hero, and a
 * column of 370 cards — so they share one stylesheet.
 *
 * !important appears where globals.css sets a site-wide heading or paragraph style
 * that would otherwise win over these.
 */

export const SESSIONS2_CSS = `
.s2{
  --ink:#1C241F; --ink-2:#3D4842; --ink-soft:#535E58; --ink-mute:#6B746F; --ink-faint:#9CA49F;
  --line:#E3E7E5; --tile:#F5F7F6; --rail:#F0F3F1; --green:#2E7D5A; --bright:#39AC71;
  --danger:#A93534; --warn:#E48233;
  --card-shadow:0 1px 2px rgba(28,36,31,.04),0 3px 3px rgba(28,36,31,.03),0 8px 5px rgba(28,36,31,.02),0 14px 5px rgba(28,36,31,.01);
  min-height:100vh;background:#fff;color:var(--ink);
  font-family:'Figtree',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased;
}
.s2 *,.s2 *::before,.s2 *::after{box-sizing:border-box;}
.s2 :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;}
.s2 :where(a){text-decoration:none;color:inherit;}
.s2 :where(img){display:block;}
.s2 :is(p,h1,h2,h3,h4,h5,h6):not(#_){font-family:inherit!important;margin:0!important;}
/* Every chevron in these screens is 18; without this an svg with no size rule of
   its own fills whatever box it lands in. */
.s2 .s2-chev{flex:none;width:18px;height:18px;}

/* 402 is where the design is drawn, not a ceiling: the column grows with the
   viewport to 640 and only then centres. At 402 the content is 370, the Figma
   width, because the body's own 16 padding takes the rest. */
.s2-shell{width:100%;max-width:640px;margin:0 auto;}

/* ───────── top bar (402x56, pad 8/16) ───────── */
.s2-top{display:flex;align-items:center;justify-content:space-between;gap:12px;height:56px;padding:8px 16px;}
.s2-back{
  display:flex;align-items:center;justify-content:center;width:40px;height:40px;
  flex:none;border-radius:9999px;background:var(--rail);
}
.s2-back svg{width:20px;height:20px;}
.s2-help{
  flex:none;display:inline-flex;align-items:center;justify-content:center;gap:4px;height:32px;
  min-width:72px;padding:0 12px 0 8px;border-radius:9999px;background:#fff;
  box-shadow:inset 0 0 0 1px var(--line),var(--card-shadow);
  font-size:14px;font-weight:600;line-height:18px;color:var(--ink);
}
.s2-help svg{width:16px;height:16px;}

/* ───────── title (402x48, pad 16/16/0) ───────── */
.s2-title{padding:16px 16px 0;}
.s2-title h1{font-size:24px!important;font-weight:600!important;line-height:32px!important;letter-spacing:-.24px!important;color:var(--ink)!important;}

/* ───────── green hero, on the two detail screens ───────── */
.s2-hero{background:var(--bright);padding-bottom:32px;}
.s2-hero .s2-back{background:rgba(255,255,255,.18);}
.s2-hero .s2-back svg *{stroke:#fff;}
.s2-hero .s2-help{background:rgba(255,255,255,.16);box-shadow:inset 0 0 0 1px rgba(255,255,255,.28);color:#fff;}
.s2-hero .s2-chev{flex:none;}
.s2-hero .s2-help svg *{stroke:#fff;}
.s2-hero-text{display:flex;flex-direction:column;gap:8px;padding:16px 16px 0;}
.s2-hero-title{font-size:32px!important;font-weight:600!important;line-height:40px!important;letter-spacing:-.64px!important;color:#fff!important;}
.s2-hero-sub{font-size:16px!important;font-weight:400!important;line-height:24px!important;color:#fff!important;}

/* ───────── body (col gap 24, pad 20/16/40) ───────── */
.s2-body{display:flex;flex-direction:column;gap:24px;padding:20px 16px 40px;}

/* ───────── active refunds banner (370x66) ───────── */
.s2-banner{
  display:flex;align-items:center;gap:12px;width:100%;padding:16px;border-radius:24px;
  background:#fff;border:1px solid var(--line);text-align:left;
}
.s2-banner-icon{flex:none;display:flex;width:32px;height:32px;}
.s2-banner-icon svg{width:32px;height:32px;}
.s2-banner-text{flex:1;min-width:0;font-size:16px;font-weight:600;line-height:24px;color:var(--ink);}
.s2-banner-all{flex:none;display:inline-flex;align-items:center;gap:4px;font-size:14px;font-weight:600;line-height:20px;color:var(--green);}
.s2-banner-all svg{width:18px;height:18px;}

/* ───────── tabs (370x48, pad 4, pill 40) ───────── */
.s2-tabs{display:flex;gap:4px;padding:4px;border-radius:9999px;background:var(--tile);}
.s2-tab{
  flex:1;min-width:0;height:40px;display:flex;align-items:center;justify-content:center;
  border-radius:9999px;font-size:14px;font-weight:500;line-height:20px;color:var(--ink-soft);
}
.s2-tab.is-on{background:#fff;box-shadow:var(--card-shadow);font-weight:600;color:var(--ink);}

/* ───────── the card chassis, shared by sessions and refunds ───────── */
.s2-list{display:flex;flex-direction:column;gap:16px;}
.s2-card{
  width:100%;border-radius:24px;background:#fff;overflow:hidden;
  border:1px solid var(--line);box-shadow:var(--card-shadow);
}
.s2-card-top{display:flex;flex-direction:column;gap:16px;padding:16px;}
.s2-who{display:flex;align-items:center;gap:12px;}
.s2-photo{
  flex:none;width:44px;height:44px;border-radius:50%;background:var(--tile);overflow:hidden;
  box-shadow:0 0 0 3px var(--tile);display:flex;align-items:center;justify-content:center;
  font-size:16px;font-weight:600;color:var(--green);
}
.s2-photo img{width:100%;height:100%;object-fit:cover;}
.s2-who-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.s2-name{font-size:16px;font-weight:600;line-height:24px;color:var(--ink);}
.s2-kind{font-size:14px;font-weight:400;line-height:20px;color:var(--ink-mute);}
.s2-status{flex:none;display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:500;line-height:20px;color:var(--ink);}
.s2-status svg{flex:none;width:18px;height:18px;}
.s2-meta{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.s2-when{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;line-height:20px;color:var(--ink-soft);}
.s2-when svg{flex:none;width:16px;height:16px;}
.s2-id{display:inline-flex;align-items:center;gap:6px;min-width:0;}
.s2-id-k{font-size:14px;font-weight:700;line-height:20px;color:var(--ink-soft);}
.s2-id-v{font-size:14px;font-weight:400;line-height:18px;color:var(--ink-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.s2-id button{flex:none;display:flex;width:16px;height:16px;}
.s2-id svg{width:16px;height:16px;}
.s2-div{height:1px;background:var(--line);}
.s2-card-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px;}
.s2-foot-label{flex:1;min-width:0;font-size:14px;font-weight:600;line-height:20px;color:var(--ink-soft);}
.s2-foot-note{flex:1;min-width:0;font-size:14px;font-weight:400;line-height:20px;color:var(--ink-2);}
.s2-refunded{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;line-height:20px;color:var(--ink-2);}
.s2-refunded svg{flex:none;width:18px;height:18px;}
.s2-card-cta{
  display:flex;align-items:center;justify-content:center;gap:12px;width:100%;padding:8px 16px;
  background:var(--rail);font-size:14px;font-weight:600;line-height:20px;color:var(--ink-soft);
}
.s2-card-cta.is-join{background:linear-gradient(180deg,#5DC189 0%,#39AC71 100%);color:#fff;}
.s2-card-cta[disabled]{opacity:.55;cursor:default;}

/* ───────── stars ───────── */
.s2-stars{flex:none;display:inline-flex;align-items:center;gap:4px;}
.s2-stars button{display:flex;width:22px;height:22px;}
.s2-stars svg{width:22px;height:22px;}
.s2-stars.is-big{gap:8px;}
.s2-stars.is-big button,.s2-stars.is-big svg{width:32px;height:32px;}

/* ───────── group headings on Refunds ───────── */
.s2-group{font-size:14px!important;font-weight:600!important;line-height:20px!important;color:var(--ink-soft)!important;}
.s2-group.is-later{padding-top:8px;}
.s2-amount{font-size:18px;font-weight:600;line-height:24px;letter-spacing:-.09px;color:var(--green);}

/* ───────── detail panels ───────── */
.s2-panel{
  display:flex;flex-direction:column;gap:16px;width:100%;padding:20px;border-radius:24px;background:#fff;
  border:1px solid var(--line);box-shadow:var(--card-shadow);
}
.s2-panel-title{font-size:18px!important;font-weight:600!important;line-height:24px!important;letter-spacing:-.09px!important;color:var(--ink)!important;}
.s2-kv{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.s2-k{font-size:14px;font-weight:400;line-height:20px;color:var(--ink-soft);}
.s2-v{font-size:14px;font-weight:500;line-height:20px;color:var(--ink);text-align:right;}
.s2-section{display:flex;flex-direction:column;gap:12px;}

/* billing card: rows then the saved strip */
.s2-bill{width:100%;border-radius:24px;background:#fff;overflow:hidden;border:1px solid var(--line);}
.s2-bill-rows{display:flex;flex-direction:column;gap:14px;padding:20px;}
.s2-bill-total .s2-k,.s2-bill-total .s2-v{font-weight:600;color:var(--ink);}
.s2-saved{
  display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 16px;background:#EFFCF2;
  font-size:14px;font-weight:600;line-height:20px;color:var(--green);
}

/* the one-row list used for View Invoice */
.s2-rowlist{padding:0 16px;border-radius:24px;border:1px solid var(--line);}
.s2-rowlist-row{
  display:flex;align-items:center;gap:14px;width:100%;padding:16px 0;
  font-size:16px;font-weight:500;line-height:24px;color:var(--ink);text-align:left;
}
.s2-rowlist-row + .s2-rowlist-row{border-top:1px solid var(--line);}
.s2-rowlist-row > svg{flex:none;width:20px;height:20px;}
.s2-rowlist-row span{flex:1;min-width:0;}
.s2-rowlist-row .s2-chev{flex:none;width:18px;height:18px;}

/* a wide outline button (Refund details' View invoice) */
.s2-wide svg{flex:none;width:20px;height:20px;}
.s2-wide{
  display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:48px;
  border-radius:9999px;background:#fff;box-shadow:inset 0 0 0 1px var(--line),var(--card-shadow);
  font-size:16px;font-weight:600;line-height:20px;color:var(--ink);
}

/* ───────── refund timeline ───────── */
.s2-steps{display:flex;flex-direction:column;}
.s2-step{display:flex;gap:14px;}
.s2-step-rail{flex:none;display:flex;flex-direction:column;align-items:center;width:18px;}
.s2-step-dot{
  width:18px;height:18px;border-radius:50%;flex:none;background:#fff;
  box-shadow:inset 0 0 0 2px var(--line);
}
.s2-step.is-done .s2-step-dot{background:var(--bright);box-shadow:none;}
.s2-step-line{flex:1;width:2px;background:var(--line);margin:4px 0;}
.s2-step.is-done .s2-step-line{background:var(--bright);}
.s2-step-text{display:flex;flex-direction:column;gap:2px;padding-bottom:24px;}
.s2-step:last-child .s2-step-text{padding-bottom:0;}
.s2-step-title{font-size:14px;font-weight:600;line-height:20px;color:var(--ink);}
.s2-step-when{font-size:12px;font-weight:400;line-height:16px;color:var(--ink-faint);}

/* ───────── empty, loading and error ───────── */
.s2-note{
  display:flex;flex-direction:column;gap:12px;align-items:flex-start;padding:20px;
  border-radius:24px;background:var(--tile);
}
.s2-note p{font-size:14px!important;font-weight:500!important;line-height:20px!important;color:var(--ink-soft)!important;}
.s2-skeleton{height:207px;border-radius:24px;background:var(--tile);animation:s2pulse 1.4s ease-in-out infinite;}
@keyframes s2pulse{0%,100%{opacity:1}50%{opacity:.55}}

/* ───────── laptop and desktop (from 900, where two columns fit) ─────────
   The Figma has no frame above 402, so this is the same design laid out wide, not
   a new one. The list keeps its own 370-wide cards and simply takes two columns
   when there is room; the detail screens put their side matter beside the main
   column instead of under it. */
@media (min-width:900px){
  .s2-shell{max-width:1100px;padding:0 32px;}
  .s2-top{height:72px;padding:16px 0;}
  .s2-title{padding:16px 0 0;}
  .s2-hero{margin:0 -32px;padding:0 32px 32px;}
  .s2-hero .s2-top,.s2-hero-text{max-width:1036px;margin:0 auto;}
  .s2-hero-text{padding:16px 0 0;}
  .s2-body{padding:24px 0 72px;}
  /* My sessions and Refunds: the cards sit in a grid that fits as many 370s as
     the width holds, so none is stretched. */
  .s2-body.is-list .s2-list{
    display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));
    gap:20px;align-items:start;
  }
  .s2-banner,.s2-tabs{max-width:560px;}
  /* The detail screens: main column and a side column of the same 370 the design
     gives these cards. */
  .s2-body.is-detail{
    display:grid;gap:24px;grid-template-columns:minmax(0,1fr) 370px;align-items:start;
  }
  .s2-main,.s2-side{display:flex;flex-direction:column;gap:24px;min-width:0;}
  .s2-hero-title{font-size:40px!important;line-height:48px!important;letter-spacing:-.8px!important;}
}
.s2-main,.s2-side{display:contents;}
@media (min-width:900px){.s2-main,.s2-side{display:flex;}}

/* ───────── tracking ─────────
   globals.css sets letter-spacing on body text (0.01em) and paragraphs (-0.5px)
   with !important, which would flatten the design's own tracking. These rules
   clear it and put back exactly the values the Figma text styles carry. */
.s2 :is(p,span,li,a,button,input,div,small):not(#_){letter-spacing:normal!important;}
.s2 .s2-amount:not(#_),.s2 .s2-panel-title:not(#_){letter-spacing:-.09px!important;}
.s2 .s2-hero-title:not(#_){letter-spacing:-.64px!important;}
`;
