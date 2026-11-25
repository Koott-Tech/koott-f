/**
 * Account (Koott 2.0) — every size, space, weight and colour here is read from the Figma
 * file "Koott 2.0", section Home (WIP), screen "Account · A · One page" (8055:4157),
 * which is drawn at 402 px. The phone rules come first and match that screen to the pixel;
 * the rules at the end widen the same page for tablets and laptops without redrawing it.
 *
 * !important appears where globals.css sets a site-wide heading or paragraph style that
 * would otherwise win over these.
 */

export const ACCOUNT2_CSS = `
.a2{
  --ink:#1C241F; --ink-2:#3D4842; --ink-soft:#535E58; --ink-mute:#6B746F; --ink-faint:#9CA49F;
  --line:#E3E7E5; --tile:#F5F7F6; --green:#2E7D5A; --danger:#A93534;
  min-height:100vh;background:#fff;color:var(--ink);
  font-family:'Figtree',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased;
}
.a2 *,.a2 *::before,.a2 *::after{box-sizing:border-box;}
.a2 :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;}
.a2 :where(a){text-decoration:none;color:inherit;}
.a2 :where(img){display:block;}
.a2 :is(p,h1,h2,h3,h4,h5,h6):not(#_){font-family:inherit!important;margin:0!important;}

.a2-shell{max-width:402px;margin:0 auto;}

/* ───────── top bar (402x56, pad 8/16) ───────── */
.a2-top{display:flex;align-items:center;justify-content:space-between;height:56px;padding:8px 16px;}
.a2-back{
  display:flex;align-items:center;justify-content:center;width:40px;height:40px;
  border-radius:9999px;background:#F0F3F1;
}
.a2-back svg{width:20px;height:20px;}

/* ───────── body (col gap 24, pad 8/16/40) ───────── */
.a2-body{display:flex;flex-direction:column;gap:24px;padding:8px 16px 40px;}
.a2-main{display:contents;}

/* 1 — who you are (row 370x60, gap 12) */
.a2-id{display:flex;gap:12px;align-items:center;}
.a2-avatar{
  flex:none;width:60px;height:60px;border-radius:9999px;background:#F3F5E6;
  display:flex;align-items:center;justify-content:center;overflow:hidden;
}
.a2-avatar img{width:100%;height:100%;object-fit:cover;}
.a2-avatar span{font-size:22px;font-weight:600;color:var(--green);}
.a2-id-text{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1;}
.a2-name{font-size:24px!important;font-weight:600!important;line-height:32px!important;letter-spacing:-.24px!important;color:var(--ink)!important;}
.a2-id-meta{display:flex;align-items:center;gap:12px;}
.a2-phone{font-size:12px;font-weight:500;line-height:16px;color:var(--ink-soft);}
.a2-dot{flex:none;width:6px;height:6px;border-radius:50%;background:#CDD3CF;}
.a2-since{font-size:12px;font-weight:500;line-height:16px;color:var(--ink-faint);}

/* 2 — three shortcuts (row gap 12, tile 115x112) */
.a2-shortcuts{display:flex;gap:12px;}
.a2-shortcut{
  flex:1;min-width:0;height:112px;display:flex;flex-direction:column;justify-content:space-between;
  gap:14px;padding:16px 12px;border-radius:16px;background:var(--tile);text-align:left;
}
.a2-shortcut-icon{display:flex;justify-content:flex-end;}
.a2-shortcut-icon svg{width:20px;height:20px;}
.a2-shortcut-label{font-size:16px;font-weight:600;line-height:20px;color:var(--ink-soft);}

/* 3 — session pack (370x149, pad 20, gap 16) */
.a2-card{
  background:#fff;border-radius:24px;border:1px solid var(--line);
}
.a2-pack{
  display:flex;flex-direction:column;gap:16px;padding:20px;
  box-shadow:0 1px 2px rgba(28,36,31,.04),0 3px 3px rgba(28,36,31,.03),0 8px 5px rgba(28,36,31,.02),0 14px 5px rgba(28,36,31,.01);
}
.a2-pack-top{display:flex;gap:16px;align-items:stretch;}
.a2-pack-cell{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.a2-pack-rule{flex:none;width:1px;background:var(--line);align-self:stretch;}
.a2-pack-label{font-size:12px;font-weight:400;line-height:16px;color:var(--ink-mute);}
.a2-pack-value{font-size:16px;font-weight:600;line-height:24px;color:var(--ink-2);}
.a2-pack-line{height:1px;background:var(--line);}
.a2-pack-bottom{display:flex;align-items:center;justify-content:space-between;gap:32px;}
.a2-pips{display:flex;align-items:center;gap:8px;}
.a2-pips svg{width:18px;height:18px;}
.a2-slots{
  display:inline-flex;align-items:center;justify-content:center;min-height:22px;padding:2px 6px;border-radius:9999px;
  background:linear-gradient(180deg,#FFFFFF 0%,#E2F7E7 100%);box-shadow:inset 0 0 0 1px #46C57A;
  font-size:12px;font-weight:500;line-height:16px;color:var(--green);white-space:nowrap;
}
.a2-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:4px;height:32px;min-width:142px;padding:0 8px 0 12px;
  border-radius:9999px;background:linear-gradient(180deg,#5DC189 0%,#39AC71 100%);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.40),0 1px 3px rgba(15,72,54,.08),0 11px 7px rgba(15,72,54,.04),0 19px 8px rgba(15,72,54,.02),inset 0 7px 7.2px rgba(255,255,255,.25);
  color:#fff;font-size:14px;font-weight:600;line-height:18px;white-space:nowrap;
}
.a2-btn svg{width:16px;height:16px;}

/* 4 — the next session (370, white, r24) */
.a2-session{
  position:relative;overflow:hidden;
  box-shadow:0 4px 12px rgba(28,36,31,.04),0 16px 24px rgba(28,36,31,.04),0 32px 40px rgba(28,36,31,.02);
}
.a2-ses-head{display:flex;align-items:center;gap:12px;padding:16px;}
.a2-ses-avatar{
  flex:none;width:48px;height:48px;border-radius:50%;background:var(--tile);overflow:hidden;
  box-shadow:0 0 0 3px var(--tile);display:flex;align-items:center;justify-content:center;
}
.a2-ses-avatar img{width:100%;height:100%;object-fit:cover;}
.a2-ses-avatar span{font-size:18px;font-weight:600;color:var(--green);}
.a2-ses-who{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;}
.a2-ses-name{font-size:18px;font-weight:600;line-height:24px;letter-spacing:-.09px;color:var(--ink);}
.a2-ses-role{font-size:11px;font-weight:600;line-height:16px;letter-spacing:.55px;text-transform:uppercase;color:var(--ink-soft);}
.a2-ses-more{flex:none;display:flex;width:20px;height:20px;align-items:center;justify-content:center;}
.a2-ses-more svg{width:20px;height:20px;}
.a2-div{height:1px;background:var(--line);}
.a2-ses-when{display:flex;flex-direction:column;gap:12px;padding:16px;}
.a2-ses-row{display:flex;align-items:center;gap:8px;min-width:0;}
.a2-ses-row svg{flex:none;width:20px;height:20px;}
.a2-ses-time{font-size:14px;font-weight:500;line-height:20px;color:var(--ink-soft);}
.a2-tz{
  display:inline-flex;align-items:center;justify-content:center;height:16px;padding:0 4px;border-radius:4px;
  background:var(--ink-faint);color:#fff;font-size:11px;font-weight:700;line-height:16px;
  letter-spacing:.55px;text-transform:uppercase;
}
.a2-ses-link{
  font-size:14px;font-weight:500;line-height:20px;color:var(--ink-soft);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.a2-ses-note{display:flex;align-items:center;min-height:79px;padding:16px;}
.a2-ses-note input{
  width:100%;border:0;background:none;outline:none;
  font-size:14px;font-weight:500;line-height:20px;color:var(--ink);
}
.a2-ses-note input::placeholder{color:var(--ink-faint);font-weight:500;}
.a2-join{
  display:flex;align-items:center;justify-content:center;gap:12px;width:100%;height:36px;padding:8px 16px;
  background:linear-gradient(180deg,#5DC189 0%,#39AC71 100%);
  color:#fff;font-size:14px;font-weight:600;line-height:20px;
}
.a2-join[disabled]{opacity:.55;cursor:default;}

/* the card's "..." menu (193 wide, rows 44) */
.a2-menu{
  position:absolute;right:16px;top:46px;z-index:5;width:193px;overflow:hidden;border-radius:16px;background:#fff;
  border:1px solid var(--line);
  box-shadow:0 4px 12px rgba(28,36,31,.04),0 16px 24px rgba(28,36,31,.04),0 32px 40px rgba(28,36,31,.02);
}
.a2-menu-row{
  display:flex;align-items:center;gap:14px;width:100%;padding:12px;
  font-size:14px;font-weight:500;line-height:20px;color:var(--ink-2);text-align:left;
}
.a2-menu-row svg{flex:none;width:16px;height:16px;}
.a2-menu-row + .a2-menu-row{border-top:1px solid var(--line);}
.a2-menu-row.is-off{background:var(--tile);color:var(--ink-faint);}

/* 5 — the rest (rows 56, pad 0/16) */
.a2-more{padding:0 16px;border-radius:24px;border:1px solid var(--line);}
.a2-more-row{
  display:flex;align-items:center;gap:14px;width:100%;padding:16px 0;
  font-size:16px;font-weight:500;line-height:24px;color:var(--ink);text-align:left;
}
.a2-more-row + .a2-more-row{border-top:1px solid var(--line);}
.a2-more-row > svg{flex:none;width:20px;height:20px;}
.a2-more-label{flex:1;min-width:0;}
.a2-more-right{display:flex;align-items:center;gap:4px;}
.a2-more-right img{width:22px;height:22px;}
.a2-more-tz{font-size:13px;font-weight:500;line-height:16px;color:#9CA3AF;text-align:center;}
.a2-more-row .a2-chev{flex:none;width:18px;height:18px;}
.a2-more-row.is-danger{color:var(--danger);}

.a2-empty{
  display:flex;flex-direction:column;gap:12px;align-items:flex-start;padding:20px;
  border-radius:24px;background:var(--tile);
}
.a2-empty p{font-size:14px!important;font-weight:500!important;line-height:20px!important;color:var(--ink-soft)!important;}
.a2-skeleton{height:149px;border-radius:24px;background:var(--tile);animation:a2pulse 1.4s ease-in-out infinite;}
@keyframes a2pulse{0%,100%{opacity:1}50%{opacity:.55}}

/* ───────── tablet ─────────
   Still one column: a tablet has room to breathe but not for two columns of this
   design, whose cards are 370 wide. */
@media (min-width:768px){
  .a2-shell{max-width:560px;}
  .a2-top{height:64px;padding:12px 16px;}
  .a2-body{gap:28px;padding:8px 16px 56px;}
}

/* ───────── laptop and desktop ─────────
   The Figma has no frame above 402, so this is the same design laid out for a wide
   screen, not a new one. Who you are runs across the top; below it the page splits.
   The left column carries what changes — the three shortcuts, then the next session
   and the pack. The settings list stands beside them, down the right, at the 370 the
   design already gives those cards. Every component keeps its own sizes. */
@media (min-width:1024px){
  .a2-shell{max-width:1100px;padding:0 32px;}
  .a2-top{height:72px;padding:16px 0;}
  .a2-body{
    display:grid;gap:24px;padding:8px 0 72px;
    grid-template-columns:minmax(0,1fr) 370px;
    grid-template-areas:
      "who       who"
      "shortcuts side"
      "main      side";
    align-items:start;
  }
  .a2-id{grid-area:who;gap:16px;}
  .a2-shortcuts{grid-area:shortcuts;}
  /* On a phone this wrapper is not a box at all (display:contents above), so the
     cards sit straight in the body's column. Here it becomes the main column. */
  .a2-main{grid-area:main;display:flex;flex-direction:column;gap:24px;min-width:0;}
  .a2-more{grid-area:side;}
  .a2-avatar{width:72px;height:72px;}
  .a2-avatar span{font-size:26px;}
  .a2-name{font-size:32px!important;line-height:40px!important;letter-spacing:-.32px!important;}
  /* A wider card can show the whole meet link, so it stops being clipped. */
  .a2-ses-link{overflow:visible;text-overflow:clip;}
}

/* Past about 1400 the extra width goes to the left column; the settings list keeps
   the 370 the design gives it, so its rows do not stretch into empty space. */
@media (min-width:1400px){
  .a2-body{gap:32px;}
  .a2-main{gap:32px;}
}

/* ───────── tracking ─────────
   globals.css sets letter-spacing on body text (0.01em) and paragraphs (-0.5px) with
   !important, which would flatten the design's own tracking. These rules clear it and put
   back exactly the values the Figma text styles carry. */
.a2 :is(p,span,li,a,button,input,div,small):not(#_){letter-spacing:normal!important;}
.a2 .a2-ses-role:not(#_),.a2 .a2-tz:not(#_){letter-spacing:.55px!important;}
.a2 .a2-name:not(#_){letter-spacing:-.24px!important;}
.a2 .a2-ses-name:not(#_){letter-spacing:-.09px!important;}
`;
