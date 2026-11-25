/**
 * Home (Koott 2.0) — every size, space, weight and colour here is read from the Figma
 * file "Koott 2.0", section Home (WIP), screen 7858:79928, which is drawn at 402 px.
 * The phone rules come first and match that screen to the pixel; the rules at the end
 * widen the same page for tablets and laptops.
 *
 * !important appears where globals.css sets a site-wide heading or paragraph style that
 * would otherwise win over these.
 */

export const HOME2_CSS = `
.h2{
  --ink:#1C241F; --ink-soft:#535E58; --ink-mute:#767676; --green:#2E7D5A; --green-bright:#4CBC7A;
  --line:#E3E7E5; --line-soft:#F5F5F5; --tile:#F9FAFA; --dark:#083226;
  background:#fff; color:var(--ink);
  font-family:'Figtree',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased;
}
.h2 *,.h2 *::before,.h2 *::after{box-sizing:border-box;}
/* :where() keeps this reset at zero weight, so each component's own rules win over it. */
.h2 :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;}
.h2 :where(a){text-decoration:none;color:inherit;}
.h2 :where(img){display:block;}
/* globals.css forces Poppins on every heading ("h2:not(#_)") and Inter on every
   paragraph ("p"), both !important; this is the selector that outranks them, so the
   page keeps Figtree (the Koott 2.0 type). */
.h2 :is(p,h1,h2,h3,h4,h5,h6):not(#_){font-family:inherit!important;}

/* ───────── hero ───────── */
.h2-hero{
  position:relative;display:flex;flex-direction:column;gap:1px;overflow:hidden;
  background:linear-gradient(180deg,#083226 0%,#189874 100%);
}
.h2-hero-glow{
  position:absolute;left:-62px;top:96px;width:512px;height:313px;border-radius:50%;
  background:#FBFFDA;filter:blur(121.6px);opacity:.6;pointer-events:none;
}
.h2-topbar{
  position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;
  height:72px;padding:16px;
}
.h2-burger{display:flex;width:24px;height:24px;}
/* The laptop nav; hidden on phones, where the hamburger carries the same links. */
.h2-nav{display:none;}
.h2-burger svg{width:24px;height:24px;}
.h2-logo{position:absolute;left:50%;top:25px;transform:translateX(-50%);}
.h2-logo img{width:74px;height:23px;}
.h2-login{
  display:inline-flex;align-items:center;justify-content:center;height:32px;padding:0 12px;
  border-radius:9999px;color:#fff;font-size:14px;font-weight:500;line-height:18px;
  background:linear-gradient(90deg,rgba(255,255,255,.10),rgba(255,255,255,.20) 50%,rgba(255,255,255,.10));
  border:1px solid rgba(255,255,255,.20);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
}
.h2-searchbar{position:relative;z-index:2;padding:16px 16px 0;}
.h2-search{
  display:flex;align-items:center;gap:6px;height:48px;padding:6px 6px 6px 16px;border-radius:9999px;
  background:linear-gradient(90deg,rgba(255,255,255,.10),rgba(255,255,255,.20) 50%,rgba(255,255,255,.10));
  border:1px solid rgba(255,255,255,.20);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
}
.h2-search svg{flex:none;width:16px;height:16px;opacity:.4;}
.h2-search input{
  flex:1;min-width:0;height:20px;border:0;background:none;outline:none;color:#fff;
  font-size:14px;font-weight:500;line-height:18px;
}
.h2-search input::placeholder{color:rgba(255,255,255,.92);font-weight:500;}
.h2-search input::-webkit-search-cancel-button{filter:invert(1);opacity:.6;}

.h2-stage{position:relative;height:270px;}
.h2-stage-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center bottom;}
.h2-stage-word{position:absolute;left:50%;top:42px;transform:translateX(-50%);width:202px;height:89px;
  filter:drop-shadow(0 1px 2px rgba(0,0,0,.25));}
.h2-dots{position:absolute;right:16px;top:215px;display:flex;align-items:center;gap:8px;}
.h2-dots i{width:8px;height:8px;border-radius:9999px;background:#fff;opacity:.5;transition:width .3s ease,opacity .3s ease;}
.h2-dots i.is-on{width:24px;opacity:1;}
.h2-strip{
  position:absolute;left:0;right:0;bottom:0;height:27px;margin:0;display:flex;align-items:center;
  justify-content:center;background:#083226;color:#CDD3CF;
  font-size:11px!important;font-weight:700!important;line-height:16px!important;letter-spacing:.55px;
  text-transform:uppercase;
}

/* ───────── category tabs ───────── */
.h2-tabs{
  position:relative;background:#fff;border-bottom:1px solid #EBEBEB;
  box-shadow:0 9px 19px rgba(244,244,244,.10),0 34px 34px rgba(244,244,244,.09),0 77px 46px rgba(244,244,244,.05);
}
.h2-tabs-scroll{
  display:flex;gap:16px;padding:24px 16px 0;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;
}
.h2-tabs-scroll::-webkit-scrollbar{display:none;}
/* The tab widths are Figma's, so each label wraps onto the same two lines it does there. */
.h2-tab{
  flex:none;display:flex;flex-direction:column;align-items:center;gap:4px;
  border-radius:28px 28px 0 0;
}
.h2-tab.is-on{background:linear-gradient(180deg,#FFFFFF 0%,#EBF4EC 100%);}
.h2-tab img{width:32px;height:32px;filter:grayscale(1);opacity:.7;}
.h2-tab.is-on img{filter:none;opacity:1;}
.h2-tab-label{
  display:flex;align-items:flex-start;justify-content:center;width:100%;min-height:48px;
  padding:0 12px 12px;text-align:center;
  font-size:13px;font-weight:500;line-height:18px;letter-spacing:.25px;color:var(--ink-mute);
}
.h2-tab.is-on .h2-tab-label{font-weight:600;color:#000;}
.h2-tab-bar{width:100%;height:4px;border-radius:7px 7px 0 0;background:transparent;}
.h2-tab.is-on .h2-tab-bar{border-radius:4px;background:var(--green-bright);}
.h2-tabs-more{
  position:absolute;right:16px;top:23px;display:flex;align-items:center;justify-content:center;
  width:34px;height:34px;border-radius:9999px;background:#fff;border:1px solid #E5E7EB;
  box-shadow:-1px 1px 2px rgba(196,196,196,.10),-3px 2px 4px rgba(196,196,196,.09),-7px 5px 5px rgba(196,196,196,.05);
}
.h2-tabs-more svg{width:16px;height:16px;transition:transform .2s ease;}

/* ───────── therapist list ───────── */
.h2-list{display:flex;flex-direction:column;align-items:center;gap:24px;padding:32px 20px;}
.h2-note{
  margin:0!important;text-align:center;font-size:14px!important;font-weight:400!important;
  line-height:20px!important;color:var(--ink-soft)!important;
}
.h2-note-link{color:var(--green);font-weight:600;text-decoration:underline;}
.h2-viewall{
  display:inline-flex;align-items:center;justify-content:center;height:40px;padding:0 24px;
  border-radius:9999px;background:#F0F3F1;color:var(--ink);font-size:14px;font-weight:600;line-height:18px;
}
.h2-viewall:hover{background:#E6EBE8;}

/* ───────── therapist card ───────── */
/* The hairline is a ring, not a border: Figma centres the stroke, so it must not eat
   2 px of the inside (the panel is exactly 350 wide at 402). */
.tc2{
  width:100%;max-width:362px;padding:6px;border-radius:24px;background:#fff;
  box-shadow:0 0 0 1px var(--line),0 2px 5px rgba(28,36,31,.02),0 9px 9px rgba(28,36,31,.02),0 20px 12px rgba(28,36,31,.02),0 36px 14px rgba(28,36,31,.01);
  overflow:hidden;
}
.tc2-top{border-radius:16px;padding:6px 8px;background:linear-gradient(180deg,var(--tc2-tint) 0%,#FFFFFF 100%);}
.tc2-head{display:flex;align-items:center;gap:12px;padding:8px 16px;}
.tc2-photo{flex:none;display:block;width:85px;height:85px;overflow:hidden;}
.tc2-photo img{width:100%;height:100%;object-fit:cover;object-position:top center;}
.tc2-photo-fallback{
  display:flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:12px;
  background:#EAF3ED;color:var(--green);font-size:30px;font-weight:600;
}
.tc2-who{display:flex;flex-direction:column;justify-content:center;gap:0;min-width:0;}
.tc2-name{font-size:18px;font-weight:600;line-height:24px;letter-spacing:-.09px;color:var(--ink);}
.tc2-role{
  padding:4px 0;font-size:11px;font-weight:600;line-height:16px;letter-spacing:.55px;
  text-transform:uppercase;color:var(--ink-soft);
}
.tc2-voice{display:flex;align-items:center;gap:4px;height:38px;}
.tc2-wave{
  flex:1;min-width:0;display:flex;align-items:center;gap:4px;height:38px;padding:0 8px;border-radius:9999px;
  background:#fff;overflow:hidden;
  box-shadow:inset 0 0 0 1px var(--line-soft),0 0 1px rgba(148,148,148,.10),0 1px 1px rgba(148,148,148,.09),0 3px 2px rgba(148,148,148,.05);
}
.tc2-wave.is-off{opacity:.6;}
.tc2-play{flex:none;display:flex;align-items:center;justify-content:center;width:24px;height:36px;}
.tc2-play svg{width:18px;height:18px;}
.tc2-bars{flex:1;min-width:0;display:flex;align-items:center;gap:4px;height:16px;overflow:hidden;}
.tc2-bars i{flex:none;width:3px;border-radius:9999px;background:var(--line);}
.tc2-profile{
  flex:none;display:inline-flex;align-items:center;gap:4px;height:38px;padding:0 12px;
  border-radius:9999px;background:#fff;
  box-shadow:inset 0 0 0 1px var(--line-soft),0 0 1px rgba(148,148,148,.10),0 1px 1px rgba(148,148,148,.09),0 3px 2px rgba(148,148,148,.05);
  color:var(--green);font-size:14px;font-weight:600;line-height:18px;
}
.tc2-profile svg{width:16px;height:16px;}
.tc2-tags{padding:8px;overflow:hidden;}
.tc2-tags-row{display:flex;align-items:center;gap:8px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;}
.tc2-tags-row::-webkit-scrollbar{display:none;}
.tc2-tag-wrap{display:flex;align-items:center;gap:8px;}
.tc2-dot{flex:none;width:6px;height:6px;border-radius:50%;background:#CDD3CF;}
.tc2-tag{
  flex:none;padding:3px 10px;border-radius:9999px;white-space:nowrap;
  font-size:14px;font-weight:600;line-height:18px;color:var(--ink-soft);
}
.tc2-bottom{display:flex;flex-direction:column;gap:20px;padding:0 12px 16px;}
.tc2-stats-wrap{display:flex;flex-direction:column;gap:16px;}
.tc2-rule{height:1px;background:var(--line-soft);}
.tc2-rule.is-low{background:#EAEEEC;}
.tc2-stats{display:flex;gap:6px;}
.tc2-stat{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;padding:8px;border-radius:8px;background:var(--tile);}
.tc2-stat-l{font-size:12px;font-weight:500;line-height:16px;color:var(--ink-soft);}
.tc2-stat-v{display:flex;align-items:center;gap:2px;font-size:14px;font-weight:600;line-height:18px;color:var(--ink);white-space:nowrap;}
.tc2-stat-v small{font-size:12px;font-weight:500;line-height:16px;color:#6B746F;}
.tc2-avail{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.tc2-avail-l{display:flex;flex-direction:column;gap:4px;min-width:0;}
.tc2-avail-label{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:400;line-height:20px;color:var(--ink-soft);}
.tc2-bolt{flex:none;width:11px;height:13px;}
.tc2-avail-row{display:flex;align-items:center;gap:6px;min-height:22px;}
.tc2-avail-v{font-size:14px;font-weight:600;line-height:18px;color:var(--ink);white-space:nowrap;}
.tc2-slots{
  flex:none;padding:3px 5px;border-radius:9999px;white-space:nowrap;
  background:linear-gradient(180deg,#FFFFFF 0%,#E2F7E7 100%);box-shadow:inset 0 0 0 1px #46C57A;
  font-size:12px;font-weight:500;line-height:16px;color:var(--green);
}
.tc2-book{
  flex:none;display:inline-flex;align-items:center;justify-content:center;height:40px;padding:0 20px;
  border-radius:9999px;color:#fff;font-size:14px;font-weight:600;line-height:18px;
  background:linear-gradient(180deg,#5DC189 0%,#39AC71 100%);border:1px solid rgba(255,255,255,.4);
  box-shadow:0 1px 3px rgba(15,72,54,.08),0 11px 7px rgba(15,72,54,.04),0 19px 8px rgba(15,72,54,.02),inset 0 7px 7.2px rgba(255,255,255,.25);
}
.tc2-book:hover{background:linear-gradient(180deg,#53b57e 0%,#2f9e66 100%);}

/* ───────── how it works ───────── */
.h2-how{display:flex;flex-direction:column;gap:24px;padding:40px 0;overflow:hidden;}
.h2-how-head{display:flex;flex-direction:column;gap:12px;padding:0 16px;}
.h2-eyebrow{
  margin:0!important;font-size:11px!important;font-weight:600!important;line-height:16px!important;
  letter-spacing:.55px;text-transform:uppercase;color:var(--green)!important;
}
.h2-h2{
  margin:0!important;font-family:inherit!important;font-size:24px!important;font-weight:600!important;
  line-height:32px!important;letter-spacing:-.24px!important;color:var(--ink)!important;
}
.h2-how .h2-h2{color:#3D4842!important;}
.h2-steps{display:flex;gap:12px;padding:0 16px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;}
.h2-steps::-webkit-scrollbar{display:none;}
.h2-step{
  flex:none;width:272px;display:flex;flex-direction:column;gap:16px;padding:6px 6px 16px;
  border-radius:24px;background:#fff;border:1px solid var(--line);
  box-shadow:0 1px 2px rgba(28,36,31,.04),0 3px 3px rgba(28,36,31,.03),0 8px 5px rgba(28,36,31,.02);
}
.h2-step-visual{
  position:relative;height:140px;border-radius:16px;overflow:hidden;
  background:linear-gradient(180deg,#F0FBED 0%,#FFFFFF 100%);
}
.h2-step-photo{width:100%;height:100%;object-fit:cover;}
.h2-step-play{
  position:absolute;left:107px;top:48px;display:flex;align-items:center;justify-content:center;
  width:44px;height:44px;border-radius:9999px;background:#fff;
}
.h2-step-play svg{width:22px;height:22px;}
.h2-faces{position:absolute;left:12px;top:37px;width:234px;height:67px;}
.h2-face{position:absolute;border-radius:50%;object-fit:cover;border:3.14px solid #fff;}
.h2-face.f1{left:0;top:9px;width:48px;height:48px;opacity:.6;filter:blur(5.2px);}
.h2-face.f2{left:42px;top:6px;width:54px;height:54px;opacity:.8;filter:blur(2.8px);}
.h2-face.f3{left:84px;top:0;width:67px;height:67px;border-width:3.88px;z-index:2;}
.h2-face.f4{left:138px;top:6px;width:54px;height:54px;opacity:.8;filter:blur(2.8px);}
.h2-face.f5{left:180px;top:9px;width:48px;height:48px;opacity:.6;filter:blur(5.2px);}
.h2-cursor{position:absolute;left:129px;top:81px;width:37px;height:37px;z-index:3;}
.h2-days{position:absolute;left:16px;top:29px;display:flex;align-items:center;gap:8.44px;}
.h2-day{
  display:flex;flex-direction:column;align-items:center;gap:2.1px;padding:10.5px 12.7px;
  border-radius:8.44px;background:#fff;
}
.h2-day-n{font-size:12.65px;font-weight:500;line-height:16.9px;color:var(--ink-soft);}
.h2-day-d{font-size:18.98px;font-weight:600;line-height:25.3px;letter-spacing:-.09px;color:var(--ink);}
.h2-day.is-on{
  gap:5.3px;padding:12px 14px;border-radius:12px;border:2px solid #39AC71;
  background:linear-gradient(180deg,#FFFFFF 0%,#EAF3ED 100%);
  box-shadow:0 4px 12px rgba(28,36,31,.04),0 16px 24px rgba(28,36,31,.04);
}
.h2-day.is-on .h2-day-n{font-size:15.98px;line-height:21.3px;color:var(--ink);}
.h2-day.is-on .h2-day-d{font-size:23.96px;line-height:32px;letter-spacing:-.12px;color:var(--green);}
.h2-step-text{display:flex;flex-direction:column;gap:6px;padding:0 12px;}
.h2-step-no{
  align-self:flex-start;padding:3px 8px;border-radius:9999px;
  background:linear-gradient(180deg,#FFFFFF 0%,#E2F7E7 100%);box-shadow:inset 0 0 0 1px #46C57A;
  font-size:11px;font-weight:600;line-height:16px;letter-spacing:.55px;text-transform:uppercase;color:var(--green);
}
.h2-step-title{
  margin:0!important;font-family:inherit!important;font-size:18px!important;font-weight:600!important;
  line-height:24px!important;letter-spacing:-.09px!important;color:var(--ink)!important;
}
.h2-step-body{margin:0!important;font-size:14px!important;font-weight:400!important;line-height:20px!important;color:var(--ink-soft)!important;}

/* ───────── FAQ ───────── */
.h2-faq{display:flex;flex-direction:column;gap:20px;padding:48px 16px;}
.h2-faq-list{border-radius:24px;background:#fff;border:1px solid var(--line);padding:4px 20px;}
.h2-q{display:flex;flex-direction:column;gap:8px;padding:18px 0;}
.h2-q + .h2-q{border-top:1px solid var(--line);}
.h2-q-row{display:flex;align-items:center;gap:12px;width:100%;text-align:left;}
.h2-q-row span{flex:1;min-width:0;font-size:16px;font-weight:500;line-height:24px;color:var(--ink);}
.h2-q-row svg{flex:none;width:20px;height:20px;transition:transform .2s ease;}
.h2-q.is-open .h2-q-row svg{transform:rotate(180deg);}
.h2-q-a{margin:0!important;font-size:14px!important;font-weight:400!important;line-height:20px!important;color:var(--ink-soft)!important;}

/* ───────── next step ───────── */
.h2-cta-wrap{position:relative;padding:0 16px;background:linear-gradient(180deg,#FFFFFF 0%,#FFFFFF 60%,#083226 60%,#083226 100%);}
.h2-cta{
  display:flex;flex-direction:column;justify-content:space-between;gap:24px;height:301px;
  padding:40px 24px 24px;border-radius:24px;overflow:hidden;text-align:center;
  background:linear-gradient(180deg,rgba(6,51,39,.72) 0%,rgba(6,51,39,.35) 100%),#063327 url('/design/home2/hero-landscape.png') center/cover no-repeat;
}
.h2-cta-text{display:flex;flex-direction:column;gap:8px;}
.h2-cta-title{
  margin:0!important;font-family:inherit!important;font-size:24px!important;font-weight:600!important;
  line-height:32px!important;letter-spacing:-.24px!important;color:#fff!important;
}
.h2-cta-body{margin:0!important;font-size:14px!important;font-weight:400!important;line-height:20px!important;color:#fff!important;}
.h2-cta-buttons{display:flex;flex-direction:column;align-items:center;gap:8px;}
.h2-cta-btn{
  display:flex;align-items:center;justify-content:center;width:100%;height:48px;padding:0 28px;
  border-radius:9999px;background:#fff;border:1px solid var(--line);color:var(--ink);
  font-size:16px;font-weight:600;line-height:20px;
  box-shadow:0 1px 2px rgba(28,36,31,.04),0 3px 3px rgba(28,36,31,.03),0 8px 5px rgba(28,36,31,.02);
}
.h2-cta-note{margin:0!important;font-size:12px!important;font-weight:500!important;line-height:16px!important;color:#fff!important;}

/* ───────── slide-in menu ───────── */
.h2-menu-wrap{position:fixed;inset:0;z-index:70;display:flex;}
.h2-menu-panel{
  position:relative;z-index:2;width:323px;max-width:85vw;height:100%;background:#fff;display:flex;
  flex-direction:column;animation:h2-slide .22s cubic-bezier(.22,.7,.3,1) both;
}
@keyframes h2-slide{from{transform:translateX(-100%);}to{transform:none;}}
.h2-menu-veil{flex:1;height:100%;background:rgba(13,20,15,.70);border:0;}
.h2-menu-head{
  display:flex;align-items:center;justify-content:space-between;height:72px;padding:24px 16px;
  border-bottom:1px solid var(--line);
}
.h2-menu-logo img{width:74px;height:23px;}
.h2-menu-x{display:flex;width:20px;height:20px;}
.h2-menu-x svg{width:20px;height:20px;}
.h2-menu-links{flex:1;overflow-y:auto;padding:12px 20px 0;}
.h2-menu-item{display:flex;flex-direction:column;}
.h2-menu-rule{height:1px;background:var(--line);}
.h2-menu-row{
  display:flex;align-items:center;gap:12px;width:100%;padding:18px 0;text-align:left;
  font-size:24px;font-weight:600;line-height:32px;letter-spacing:-.24px;color:#3D4842;
}
.h2-menu-row span{flex:1;min-width:0;}
.h2-menu-row svg{flex:none;width:22px;height:22px;transition:transform .2s ease;}
.h2-menu-sub{display:flex;flex-direction:column;gap:16px;padding:0 0 18px;margin-top:-4px;}
.h2-menu-sub a{font-size:16px;font-weight:400;line-height:24px;color:var(--ink-soft);}

/* ───────── help card (Figma "Help" 8029:23975) ───────── */
.h2-helpwrap{display:flex;justify-content:center;padding:0 16px 8px;}
.h2-help{
  display:flex;align-items:center;gap:14px;width:100%;max-width:370px;padding:16px;
  border-radius:24px;background:#F5F7F6;
}
.h2-help-tile{
  flex:none;display:flex;align-items:center;justify-content:center;width:44px;height:44px;
  border-radius:14px;background:#fff;
}
.h2-help-tile svg{width:22px;height:22px;}
.h2-help-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.h2-help-title{font-size:16px;font-weight:600;line-height:24px;color:var(--ink);}
.h2-help-body{font-size:14px;font-weight:400;line-height:20px;color:var(--ink-soft);}
.h2-help-btn{
  flex:none;display:inline-flex;align-items:center;justify-content:center;height:32px;min-width:57px;padding:0 12px;
  border-radius:9999px;background:#fff;box-shadow:inset 0 0 0 1px var(--line),
    0 1px 2px rgba(28,36,31,.04),0 3px 3px rgba(28,36,31,.03),0 8px 5px rgba(28,36,31,.02),0 14px 5px rgba(28,36,31,.01);
  font-size:14px;font-weight:600;line-height:18px;color:var(--ink);
}

/* ───────── why people trust Koott (Figma "Trust" 8029:23898) ───────── */
.h2-trust{padding:40px 16px 0;}
.h2-trust-panel{
  display:flex;flex-direction:column;gap:24px;padding:28px 20px 24px;border-radius:32px;
  background:linear-gradient(180deg,#F0FBED 0%,#EAF3ED 55%,#FFFFFF 100%);
}
.h2-trust-points{display:flex;flex-direction:column;gap:20px;}
.h2-point{display:flex;gap:14px;}
.h2-point-tile{
  flex:none;display:flex;align-items:center;justify-content:center;width:40px;height:40px;
  border-radius:12px;background:#fff;
}
.h2-point-tile svg{width:20px;height:20px;}
.h2-point-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.h2-point-title{font-size:16px;font-weight:600;line-height:24px;color:var(--ink);}
.h2-point-body{font-size:14px;font-weight:400;line-height:20px;color:var(--ink-soft);}
.h2-trust-stats{display:flex;gap:8px;}
.h2-trust-stat{
  flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;padding:14px 16px;
  border-radius:20px;background:#fff;
}
.h2-trust-value{font-size:18px;font-weight:600;line-height:24px;color:var(--ink);}
.h2-trust-label{font-size:12px;font-weight:400;line-height:16px;color:var(--ink-soft);}
/* The reviews scroll sideways, as they do in the Figma: two cards are 556 wide
   inside a 330 panel. */
.h2-reviews{
  display:flex;gap:12px;overflow-x:auto;scrollbar-width:none;
  margin:0 -20px;padding:0 20px;scroll-snap-type:x mandatory;
}
.h2-reviews::-webkit-scrollbar{display:none;}
.h2-review{
  flex:none;width:272px;display:flex;flex-direction:column;gap:12px;padding:16px;
  border-radius:20px;background:#fff;scroll-snap-align:start;
}
.h2-stars{display:flex;gap:2px;}
.h2-stars svg{width:14px;height:14px;}
.h2-review-text{margin:0!important;font-size:14px!important;font-weight:400!important;line-height:20px!important;color:#3D4842!important;}
.h2-review-by{display:flex;gap:4px;}
.h2-review-name{font-size:14px;font-weight:600;line-height:20px;color:var(--ink);}
.h2-review-place{font-size:14px;font-weight:400;line-height:20px;color:var(--ink-soft);}

/* ───────── tablet and laptop ───────── */
@media (min-width:768px){
  .h2-hero-glow{left:50%;transform:translateX(-50%);width:900px;}
  .h2-topbar{height:84px;padding:20px 32px;}
  .h2-logo{top:30px;}
  .h2-logo img{width:92px;height:28px;}
  .h2-searchbar{padding:20px 32px 0;display:flex;justify-content:center;}
  .h2-search{width:100%;max-width:560px;height:52px;}
  .h2-stage{height:360px;}
  .h2-stage-word{top:64px;width:260px;height:115px;}
  .h2-dots{top:auto;bottom:60px;right:32px;}
  .h2-strip{height:32px;font-size:12px!important;}
  .h2-tabs-scroll{justify-content:center;padding:24px 32px 0;gap:24px;}
  .h2-tabs-more{display:none;}
  /* Cards keep their Figma width (362) at every size; the grid simply fits as many
     as the viewport holds, up to four, so none is ever squeezed. */
  .h2-list{
    display:grid;grid-template-columns:repeat(auto-fill,362px);justify-content:center;
    align-items:start;gap:24px;padding:40px 32px;max-width:1608px;margin:0 auto;
  }
  .h2-note,.h2-viewall{grid-column:1 / -1;justify-self:center;}
  .h2-how{padding:64px 0;}
  .h2-how-head,.h2-steps{padding:0 32px;}
  .h2-steps{justify-content:center;}
  .h2-helpwrap{padding:0 32px 16px;}
  .h2-help{max-width:744px;}
  .h2-trust{padding:56px 32px 0;display:flex;justify-content:center;}
  .h2-trust-panel{width:100%;max-width:744px;padding:32px;}
  .h2-trust-points{flex-direction:row;gap:24px;}
  .h2-point{flex:1;min-width:0;}
  .h2-reviews{margin:0;padding:0;overflow:visible;}
  .h2-review{flex:1;min-width:0;width:auto;}
  .h2-faq{padding:64px 32px;align-items:center;}
  .h2-faq .h2-h2,.h2-faq-list{width:100%;max-width:720px;}
  .h2-cta-wrap{padding:0 32px;}
  .h2-cta{max-width:720px;margin:0 auto;height:320px;}
  .h2-cta-btn{width:auto;min-width:280px;align-self:center;}
}

@media (min-width:1100px){
  .h2-topbar{height:88px;padding:24px 56px;}
  /* On a laptop the logo sits at the left of the bar and the links take the middle,
     so the hamburger is not needed. */
  .h2-burger{display:none;}
  .h2-logo{position:static;transform:none;margin-right:auto;}
  .h2-nav{
    display:flex;align-items:center;gap:32px;position:absolute;left:50%;top:50%;
    transform:translate(-50%,-50%);
  }
  .h2-nav a{
    color:rgba(255,255,255,.86);font-size:15px;font-weight:500;line-height:20px;white-space:nowrap;
    transition:color .15s ease;
  }
  .h2-nav a:hover{color:#fff;}
  .h2-login{height:38px;padding:0 18px;font-size:15px;}
  .h2-searchbar{padding:24px 56px 0;}
  .h2-stage{height:420px;}
  .h2-stage-word{top:86px;width:300px;height:132px;}
  .h2-list{gap:28px;padding:56px 32px;}
  .h2-steps{gap:24px;padding:0 32px;}
  .h2-step{width:360px;}
  .h2-step-visual{height:180px;}
  .h2-faces{left:50%;transform:translateX(-50%);}
  .h2-step-play{left:50%;top:50%;transform:translate(-50%,-50%);}
  .h2-how .h2-h2,.h2-faq .h2-h2{font-size:32px!important;line-height:40px!important;letter-spacing:-.32px!important;}
  .h2-how-head{align-items:center;text-align:center;}
  .h2-faq{align-items:center;}
  .h2-trust-panel{max-width:900px;}
  .h2-trust .h2-h2{font-size:32px!important;line-height:40px!important;letter-spacing:-.32px!important;}
  .h2-help{max-width:900px;}
  .h2-cta{height:340px;max-width:900px;}
  .h2-cta-title{font-size:32px!important;line-height:40px!important;}
  .h2-cta-body{font-size:16px!important;line-height:24px!important;}
}

/* ───────── tracking ─────────
   globals.css sets letter-spacing on body text (0.01em) and paragraphs (-0.5px) with
   !important, which would flatten the design's own tracking. These rules clear it and
   put back exactly the values the Figma text styles carry. */
.h2 :is(p,span,li,a,button,input,div,small):not(#_){letter-spacing:normal!important;}
.h2 .h2-strip:not(#_),.h2 .h2-eyebrow:not(#_),.h2 .tc2-role:not(#_),.h2 .h2-step-no:not(#_){letter-spacing:.55px!important;}
.h2 .h2-tab-label:not(#_){letter-spacing:.25px!important;}
.h2 .h2-h2:not(#_),.h2 .h2-cta-title:not(#_),.h2 .h2-menu-row:not(#_){letter-spacing:-.24px!important;}
.h2 .tc2-name:not(#_),.h2 .h2-step-title:not(#_),.h2 .h2-day-d:not(#_){letter-spacing:-.09px!important;}
.h2 .h2-day.is-on .h2-day-d:not(#_){letter-spacing:-.12px!important;}
`;
