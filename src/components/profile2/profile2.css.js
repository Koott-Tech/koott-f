/**
 * Therapist profile (Koott 2.0) — every size, space, weight and colour here is read from
 * the Figma file "Koott 2.0", section Therapist Profile (7858:80651), screen
 * "Profile v3 · Full page (scroll)" (7858:80652), which is drawn at 402 px. The phone
 * rules come first and match that screen to the pixel; the rules at the end widen the
 * same page for tablets and laptops without redrawing it.
 *
 * !important appears where globals.css sets a site-wide heading or paragraph style that
 * would otherwise win over these.
 */

export const PROFILE2_CSS = `
.tpf{
  --ink:#1C241F; --ink-2:#3D4842; --ink-soft:#535E58; --ink-mute:#6B746F; --ink-faint:#9CA49F;
  --line:#E3E7E5; --tile:#F5F7F6; --tile-2:#F0F3F1; --page:#F9FAFA;
  --green:#2E7D5A; --bright:#39AC71; --dark:#083226;
  --tpf-w:402px; --tpf-pad:16px;
  background:var(--page);color:var(--ink);min-height:100vh;
  font-family:'Figtree',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased;
}
.tpf *,.tpf *::before,.tpf *::after{box-sizing:border-box;}
.tpf :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;}
.tpf :where(a){text-decoration:none;color:inherit;}
.tpf :where(img){display:block;}
.tpf :is(p,h1,h2,h3,h4,h5,h6):not(#_){font-family:inherit!important;margin:0!important;}
.tpf-wrap{max-width:var(--tpf-w);margin:0 auto;}

/* ───────── hero (402x444 on #F9FAFA) ───────── */
.tpf-hero{display:flex;flex-direction:column;align-items:center;padding-bottom:40px;}
.tpf-head{display:flex;align-items:center;justify-content:space-between;width:100%;padding:4px 16px 12px;}
.tpf-round{
  display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:9999px;
  background:#fff;border:1px solid var(--line);
  box-shadow:0 1px 2px rgba(28,36,31,.04),0 3px 3px rgba(28,36,31,.03),0 8px 5px rgba(28,36,31,.02),0 14px 5px rgba(28,36,31,.01);
}
.tpf-round svg{width:20px;height:20px;}
.tpf-avatar-wrap{position:relative;display:flex;align-items:center;justify-content:center;height:150px;margin-top:16px;}
/* The ring is Figma's 4px angular gradient; the white gap inside it is the frame's padding. */
.tpf-avatar{
  position:relative;width:150px;height:150px;border-radius:9999px;padding:6px;background:#fff;
  box-shadow:0 4px 10px rgba(156,156,156,.10),0 17px 17px rgba(156,156,156,.09),0 39px 23px rgba(156,156,156,.05);
}
.tpf-avatar::before{
  content:'';position:absolute;inset:0;border-radius:9999px;padding:4px;
  background:conic-gradient(from 180deg,#BBD83D,#2ECE58,#BBD83D,#28D356,#BBD83D);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  mask-composite:exclude;pointer-events:none;
}
.tpf-avatar img,.tpf-avatar .tpf-initials{
  width:100%;height:100%;border-radius:9999px;object-fit:cover;background:var(--tile-2);
  display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:600;color:var(--green);
}
.tpf-intro{display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:20px;padding:0 16px;text-align:center;}
.tpf-name{font-size:24px!important;font-weight:600!important;line-height:32px!important;letter-spacing:-.24px!important;color:var(--ink)!important;}
.tpf-role{font-size:11px;font-weight:600;line-height:16px;letter-spacing:.55px;text-transform:uppercase;color:var(--ink-soft);}
.tpf-reg{
  display:inline-flex;align-items:center;gap:6px;margin-top:6px;padding:6px 12px 6px 6px;border-radius:9999px;
  background:#EAEEEC;font-size:11px;font-weight:700;line-height:16px;letter-spacing:.55px;
  text-transform:uppercase;color:var(--ink-soft);
}
.tpf-reg svg{width:16px;height:16px;}

/* ───────── sheet ───────── */
.tpf-sheet{
  background:#fff;border-radius:24px 24px 0 0;
  box-shadow:0 4px 12px rgba(28,36,31,.04),0 16px 24px rgba(28,36,31,.04),0 32px 40px rgba(28,36,31,.02);
}
.tpf-handle{display:flex;justify-content:center;padding:8px 0 4px;}
.tpf-handle span{width:36px;height:4px;border-radius:2px;background:#CDD3CF;}
.tpf-tabs{display:flex;gap:4px;height:52px;padding:0 16px;background:#fff;}
.tpf-tab{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:space-between;
  padding:0 12px;height:51px;
}
.tpf-tab span{margin-top:14px;font-size:16px;font-weight:500;line-height:20px;color:var(--ink-mute);}
.tpf-tab i{display:block;width:100%;height:2px;border-radius:2px 2px 0 0;background:var(--bright);opacity:0;}
.tpf-tab.is-on span{font-weight:600;color:var(--ink);}
.tpf-tab.is-on i{opacity:1;}

/* shared section furniture */
.tpf-sec{display:flex;flex-direction:column;}
.tpf-sec-head{display:flex;align-items:center;justify-content:space-between;padding:0 16px;}
.tpf-h2{font-size:18px!important;font-weight:600!important;line-height:24px!important;letter-spacing:-.09px!important;color:var(--ink)!important;}
.tpf-see{font-size:14px;font-weight:600;line-height:18px;color:var(--green);}
.tpf-link{align-self:flex-start;margin-left:16px;font-size:14px;font-weight:600;line-height:18px;color:var(--green);}

/* About tab (gap 48, pad 32 top / 56 bottom) */
.tpf-about{display:flex;flex-direction:column;gap:48px;padding:32px 0 56px;}
.tpf-top{display:flex;flex-direction:column;gap:28px;}

/* the "meet me" video card */
.tpf-meet{
  display:flex;align-items:center;gap:16px;margin:0 16px;padding:12px 16px 12px 12px;
  border-radius:16px;background:var(--tile);
}
.tpf-meet-thumb{flex:none;width:84px;height:84px;border-radius:12px;object-fit:cover;background:var(--tile-2);}
.tpf-meet-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;}
.tpf-meet-title{font-size:16px;font-weight:600;line-height:20px;color:var(--ink);}
.tpf-meet-sub{font-size:12px;font-weight:400;line-height:16px;color:var(--ink-mute);}
.tpf-play{
  flex:none;display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:9999px;
  background:linear-gradient(135deg,#083226 0%,#083226 50%,#1C6046 100%);color:#fff;
}
.tpf-play svg{width:20px;height:20px;}

/* three stats */
.tpf-stats{display:flex;align-items:center;padding:0 16px;}
.tpf-stat{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px;}
.tpf-stat b{font-size:18px;font-weight:600;line-height:24px;letter-spacing:-.09px;color:var(--ink);text-align:center;}
.tpf-stat span{font-size:12px;font-weight:400;line-height:16px;color:var(--ink-mute);text-align:center;}
.tpf-stat-div{flex:none;width:1px;height:36px;background:var(--line);}

/* chips */
.tpf-chips{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px;}
.tpf-chip{
  display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 12px 0 14px;border-radius:9999px;
  background:#fff;border:1px solid var(--line);font-size:14px;font-weight:500;line-height:20px;color:var(--ink-2);
}
.tpf-chip svg{width:14px;height:14px;}
.tpf-chip.is-more{background:var(--tile);border-color:transparent;}

/* info rows (approaches, qualifications) */
.tpf-rows{display:flex;flex-direction:column;padding:0 16px;}
.tpf-row{display:flex;align-items:center;gap:16px;padding:12px 0;}
.tpf-row-ic{
  flex:none;display:flex;align-items:center;justify-content:center;width:40px;height:40px;
  border-radius:9999px;background:var(--tile);color:var(--ink-2);
}
.tpf-row.is-qual .tpf-row-ic{background:var(--tile-2);}
.tpf-row-ic svg{width:20px;height:20px;}
.tpf-row-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.tpf-row-title{font-size:16px;font-weight:500;line-height:20px;color:var(--ink);}
.tpf-row-sub{font-size:14px;font-weight:400;line-height:18px;color:var(--ink-mute);}

/* how you can meet */
.tpf-modes{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px;}
.tpf-mode{
  display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px 0 14px;border-radius:999px;
  background:var(--tile);font-size:14px;font-weight:500;line-height:20px;color:var(--ink-2);
}
.tpf-mode svg{width:16px;height:16px;}

/* bio */
.tpf-bio{display:flex;flex-direction:column;gap:8px;padding:0 16px;}
.tpf-bio p{font-size:16px!important;font-weight:400!important;line-height:24px!important;color:var(--ink-2)!important;}
.tpf-bio p.is-clamped{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.tpf-bio button{align-self:flex-start;font-size:14px;font-weight:600;line-height:18px;color:var(--green);}

/* video rail */
.tpf-rail{display:flex;gap:12px;padding:0 16px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;}
.tpf-rail::-webkit-scrollbar{display:none;}
.tpf-tile{flex:none;width:132px;display:flex;flex-direction:column;align-items:center;gap:8px;}
.tpf-tile-thumb{
  width:132px;height:176px;border-radius:16px;object-fit:cover;background:var(--tile);
  box-shadow:0 2px 5px rgba(28,36,31,.02),0 9px 9px rgba(28,36,31,.02),0 20px 12px rgba(28,36,31,.02),0 36px 14px rgba(28,36,31,.01);
}
.tpf-tile span{font-size:14px;font-weight:500;line-height:18px;color:var(--ink-2);text-align:center;}

/* FAQ */
.tpf-faq{display:flex;flex-direction:column;padding:0 16px;}
.tpf-faq-row{display:flex;flex-direction:column;gap:8px;padding:16px 0;border-bottom:1px solid var(--line);}
.tpf-faq-row:last-child{border-bottom:0;}
.tpf-q{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;text-align:left;}
.tpf-q span{font-size:16px;font-weight:600;line-height:24px;color:var(--ink);}
.tpf-q svg{flex:none;width:20px;height:20px;color:var(--ink-mute);transition:transform .18s ease;}
.tpf-faq-row.is-open .tpf-q svg{transform:rotate(180deg);}
.tpf-a{font-size:14px!important;font-weight:400!important;line-height:20px!important;color:var(--ink-soft)!important;}

/* media tab */
.tpf-break{height:8px;background:var(--tile);}
.tpf-media{display:flex;flex-direction:column;gap:20px;padding:40px 0 24px;}
.tpf-switch{display:flex;gap:8px;padding:0 16px;overflow-x:auto;scrollbar-width:none;}
.tpf-switch::-webkit-scrollbar{display:none;}
.tpf-swc{
  flex:none;display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 14px 0 16px;border-radius:999px;
  background:var(--tile);font-size:14px;font-weight:500;line-height:18px;color:var(--ink-2);
}
.tpf-swc b{font-size:12px;font-weight:500;line-height:16px;color:var(--ink-mute);}
.tpf-swc.is-on{background:#2A332E;color:#fff;}
.tpf-swc.is-on b{color:#fff;opacity:.6;}
.tpf-panel{display:flex;flex-direction:column;gap:12px;padding:0 16px;}
.tpf-mcard{
  display:flex;align-items:center;gap:14px;padding:12px 12px 12px 16px;border-radius:16px;
  background:#fff;border:1px solid var(--line);
}
.tpf-mcard-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;}
.tpf-mtype{font-size:11px;font-weight:600;line-height:16px;letter-spacing:.55px;text-transform:uppercase;color:var(--green);}
.tpf-mtitle{font-size:14px;font-weight:600;line-height:20px;color:var(--ink);}
.tpf-mmeta{font-size:12px;font-weight:400;line-height:16px;color:var(--ink-mute);}
.tpf-mthumb{flex:none;width:64px;height:64px;border-radius:10px;object-fit:cover;background:var(--tile);}

/* the bar that follows you down the page */
.tpf-spacer{height:150px;}
.tpf-bookbar{
  position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;justify-content:center;
  padding:86px 16px 34px;pointer-events:none;
  background:linear-gradient(180deg,rgba(255,255,255,0) 0%,#FFFFFF 45%,#FFFFFF 100%);
}
.tpf-bookbar-in{display:flex;align-items:center;gap:16px;width:100%;max-width:370px;pointer-events:auto;}
.tpf-next{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.tpf-next-cap{font-size:14px;font-weight:400;line-height:18px;color:var(--ink-mute);}
.tpf-next-line{display:flex;align-items:center;gap:8px;min-width:0;}
.tpf-next-slot{font-size:16px;font-weight:600;line-height:20px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.tpf-next-pill{
  flex:none;padding:2px 6px;border-radius:9999px;background:#EFFCF2;
  font-size:12px;font-weight:600;line-height:16px;color:var(--green);
}
.tpf-book{
  flex:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:48px;padding:0 28px;
  border-radius:9999px;background:linear-gradient(180deg,#5DC189 0%,#39AC71 100%);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.40),0 1px 3px rgba(15,72,54,.08),0 11px 7px rgba(15,72,54,.04),0 19px 8px rgba(15,72,54,.02),inset 0 7px 7.2px rgba(255,255,255,.25);
  color:#fff;font-size:16px;font-weight:600;line-height:20px;white-space:nowrap;
}

/* ───────── tablet and laptop ─────────
   The 402 px phone screen is the design. It is not redrawn: the column is simply given
   more room and stays centred, and the bar at the bottom lines up with it. */
@media (min-width:768px){
  .tpf{--tpf-w:560px;}
  .tpf-bookbar-in{max-width:528px;}
  .tpf-about{gap:56px;}
}
@media (min-width:1100px){
  .tpf{--tpf-w:640px;}
  .tpf-bookbar-in{max-width:608px;}
  .tpf-hero{padding-bottom:48px;}
}

/* ───────── tracking ─────────
   globals.css sets letter-spacing on body text (0.01em) and paragraphs (-0.5px) with
   !important, which would flatten the design's own tracking. These rules clear it and put
   back exactly the values the Figma text styles carry. */
.tpf :is(p,span,li,a,button,input,div,small,b,i):not(#_){letter-spacing:normal!important;}
.tpf .tpf-role:not(#_),.tpf .tpf-reg:not(#_),.tpf .tpf-mtype:not(#_){letter-spacing:.55px!important;}
.tpf .tpf-name:not(#_){letter-spacing:-.24px!important;}
.tpf .tpf-h2:not(#_),.tpf .tpf-stat b:not(#_){letter-spacing:-.09px!important;}
`;
