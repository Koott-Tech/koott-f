/**
 * The two full-screen viewers on the therapist profile, from the Figma file "Koott 2.0",
 * section Therapist Profile:
 *
 *   Story viewer  7981:20859  — segments across the top, like a phone's stories
 *   Video viewer  8012:21196  — one video with a transport bar, swipe up for the next
 *
 * They are the same shell: a 370x678 card on #0D1310, a header inside it, and the book
 * bar under it. Only the header's middle and the card's foot differ, so both are drawn
 * from this one sheet.
 */

export const VIEWER2_CSS = `
.svw{
  --ink:#1C241F; --dark:#0D1310; --bright:#39AC71; --tick:#74D69C;
  position:fixed;inset:0;z-index:1200;display:flex;flex-direction:column;align-items:center;
  background:var(--dark);color:#fff;
  font-family:'Figtree',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased;
  opacity:0;transition:opacity .18s ease;
}
.svw.is-in{opacity:1;}
.svw *,.svw *::before,.svw *::after{box-sizing:border-box;}
.svw :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;}
.svw :is(p,h1,h2,h3,h4,h5,h6):not(#_){font-family:inherit!important;margin:0!important;}

.svw-stage{
  display:flex;flex-direction:column;align-items:center;width:100%;max-width:402px;height:100%;
  padding:0 16px 16px;
}

/* ───────── the card the media plays in (370x678, r24) ───────── */
.svw-card{
  position:relative;display:flex;flex-direction:column;justify-content:space-between;
  width:100%;flex:1 1 auto;min-height:0;margin-top:8px;
  background:rgba(255,255,255,.10);border-radius:24px;overflow:hidden;
}
.svw-media{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#000;}
.svw-media video,.svw-media iframe,.svw-media img{width:100%;height:100%;border:0;object-fit:contain;}
.svw-fallback{display:flex;flex-direction:column;align-items:center;gap:12px;padding:24px;text-align:center;}
.svw-fallback p:not(#_){font-size:14px!important;line-height:20px!important;color:rgba(255,255,255,.72)!important;}

/* The halves that step back and forward, as a phone's stories do. */
.svw-tap{position:absolute;top:64px;bottom:0;width:38%;z-index:2;background:none;}
.svw-tap.is-back{left:0;}
.svw-tap.is-next{right:0;}

/* ───────── header inside the card (370x64, pad 12/16) ───────── */
.svw-head{
  position:relative;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:12px 16px;background:linear-gradient(180deg,rgba(13,19,16,.92),rgba(13,19,16,0));
}
.svw-round{
  display:flex;align-items:center;justify-content:center;width:40px;height:40px;flex:none;
  border-radius:9999px;background:rgba(255,255,255,.20);backdrop-filter:blur(14.9px);
}
.svw-round svg{width:20px;height:20px;}
.svw-bars{display:flex;flex:1;gap:4px;padding:0 16px;}
.svw-bar{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.35);overflow:hidden;}
.svw-bar em{display:block;height:3px;border-radius:2px;background:#fff;}

/* ───────── the video viewer's transport (370x72, pad 24/16) ───────── */
.svw-transport{
  position:relative;z-index:3;display:flex;align-items:center;gap:16px;padding:24px 16px;
  background:linear-gradient(0deg,rgba(13,19,16,.92),rgba(13,19,16,0));
}
.svw-transport > button{flex:none;}
.svw-transport > button svg{width:24px;height:24px;}
.svw-track{position:relative;flex:1;height:11px;display:flex;align-items:center;cursor:pointer;}
.svw-track i{display:block;width:100%;height:3px;border-radius:2px;background:rgba(255,255,255,.30);}
.svw-track em{position:absolute;left:0;height:3px;border-radius:2px;background:#fff;}
.svw-track b{position:absolute;width:10px;height:11px;border-radius:9999px;background:#fff;transform:translateX(-5px);}

/* ───────── who it is, and the way in (370x92) ───────── */
.svw-book{display:flex;align-items:center;gap:16px;width:100%;padding:24px 0;}
.svw-who{display:flex;align-items:center;gap:12px;flex:1;min-width:0;}
.svw-avatar{width:44px;height:44px;flex:none;border-radius:9999px;border:2px solid var(--bright);object-fit:cover;background:#1C241F;}
.svw-name{display:flex;align-items:center;gap:4px;min-width:0;}
.svw-name span{font-size:16px;font-weight:600;line-height:20px;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.svw-name svg{width:14px;height:14px;flex:none;color:var(--tick);}
.svw-cap{font-size:12px;font-weight:400;line-height:16px;color:rgba(255,255,255,.65);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.svw-go{
  display:flex;align-items:center;justify-content:center;height:40px;flex:none;padding:0 24px;border-radius:9999px;
  background:linear-gradient(180deg,#FFFFFF 0%,#EAF3ED 100%);color:var(--ink);
  font-size:14px;font-weight:600;line-height:18px;
  box-shadow:0 1px 3px rgba(15,72,54,.08),0 11px 7px rgba(15,72,54,.04),inset 0 7px 7.2px rgba(255,255,255,.25);
}

/* ───────── the hint under the video viewer ───────── */
/* globals.css sizes every p site-wide with !important, so this says it louder. */
.svw-hint:not(#_){display:flex;align-items:center;justify-content:center;gap:6px;padding-bottom:8px;
  font-size:12px!important;font-weight:400!important;line-height:16px!important;color:#fff!important;}
.svw-hint svg{width:20px;height:20px;opacity:.3;}

/* ───────── laptop ─────────
   The design is a phone screen. On a wide screen the card keeps a portrait shape in the
   middle of the dark page rather than stretching into a letterbox. */
@media (min-width:768px){
  .svw-stage{max-width:470px;padding:16px 16px 24px;}
  .svw-card{max-height:min(78vh,760px);}
}
@media (prefers-reduced-motion:reduce){
  .svw{transition:none;}
}
`;
