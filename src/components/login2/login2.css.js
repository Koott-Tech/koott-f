/**
 * Sign-in sheet (Koott 2.0) — every size, space, weight and colour here is read from the
 * Figma file "Koott 2.0", section Login (7858:83253), which is drawn at 402 px wide:
 *
 *   SMS            7858:83609   phone number, "Get code"
 *   Whatsapp       7858:84024   the same with the green "Whatsapp Number" band
 *   OTP            7858:84455   six 54x60 boxes, resend timer, "Login"
 *   Verify loading 7858:84843   spinner inside the button
 *   Error          7858:85228   red boxes, the message, "Resend"
 *   First time     7858:85621   name, year of birth, gender, "Continue"
 *
 * The phone rules come first and match those frames to the pixel. From 600 px the same
 * sheet becomes a centred card, since a bottom sheet on a laptop is just a stripe.
 *
 * !important appears where globals.css sets a site-wide heading or paragraph style that
 * would otherwise win over these.
 */

export const LOGIN2_CSS = `
.lgn{
  --ink:#1C241F; --ink-2:#3D4842; --ink-soft:#535E58; --ink-mute:#6B746F; --ink-faint:#9CA49F;
  --line:#E3E7E5; --line-2:#CDD3CF; --tile:#F5F7F6; --tile-2:#F0F3F1;
  --green:#2E7D5A; --bright:#39AC71; --deep:#1B6930;
  --bad:#D74745; --bad-ink:#A93534; --bad-tile:#FFF4F3;
  position:fixed;inset:0;z-index:1000;display:flex;align-items:flex-end;justify-content:center;
  background:rgba(13,20,15,.70);
  font-family:'Figtree',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased;color:var(--ink);
  opacity:0;transition:opacity .22s ease;
}
.lgn.is-in{opacity:1;}
.lgn *,.lgn *::before,.lgn *::after{box-sizing:border-box;}
.lgn :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;}
.lgn :where(input,select){font:inherit;color:inherit;background:none;border:0;outline:0;width:100%;}
.lgn :is(p,h1,h2,h3,h4,h5,h6):not(#_){font-family:inherit!important;margin:0!important;}

/* ───────── the sheet (402 wide, pad 8/16/34, gap 20) ───────── */
.lgn-sheet{
  display:flex;flex-direction:column;gap:20px;width:100%;max-width:402px;
  padding:8px 16px 34px;background:#fff;border-radius:24px 24px 0 0;
  transform:translateY(16px);transition:transform .26s cubic-bezier(.2,.8,.2,1);
  max-height:94vh;overflow-y:auto;
}
.lgn.is-in .lgn-sheet{transform:none;}
.lgn-handle{display:flex;justify-content:center;height:4px;}
.lgn-handle span{width:36px;height:4px;border-radius:9999px;background:var(--line-2);}
.lgn-mark{width:48px;height:48px;}
.lgn-body{display:flex;flex-direction:column;gap:24px;padding:12px 0;}
.lgn-intro{display:flex;flex-direction:column;gap:8px;}
/* globals.css sizes every h2 and p site-wide with !important, so these say it louder. */
.lgn-title:not(#_){font-size:24px!important;line-height:32px!important;font-weight:600!important;letter-spacing:-.24px;color:var(--ink);}
.lgn-sub:not(#_){font-size:16px!important;line-height:24px!important;font-weight:400!important;color:var(--ink-mute);}

/* ───────── phone row (country 99x56 + number, both r12) ───────── */
.lgn-phone{display:flex;gap:6px;}
.lgn-cc{
  display:flex;align-items:center;gap:6px;height:56px;padding:0 14px;flex:none;
  background:#fff;border:1px solid var(--line);border-radius:12px;
}
.lgn-cc svg{display:block;}
.lgn-cc b{font-size:16px;line-height:16px;font-weight:500;color:#5C5C5C;}
.lgn-num{
  display:flex;align-items:center;gap:12px;flex:1 1 auto;min-width:0;height:56px;padding:0 16px;
  background:#fff;border:2px solid var(--line);border-radius:12px;
}
.lgn-num input{font-size:18px;line-height:24px;font-weight:600;letter-spacing:-.09px;}
.lgn-num input::placeholder{color:var(--ink-faint);font-weight:600;}
.lgn-num:focus-within{border-color:var(--line-2);}

/* The WhatsApp wrap the second screen puts around that row. */
.lgn-wa{
  display:flex;flex-direction:column;gap:6px;padding:6px;border-radius:16px;
  background:linear-gradient(180deg,#F0FBED 0%,#EAF3ED 55%,#FFFFFF 100%);
}
.lgn-wa-tag{display:flex;align-items:center;gap:4px;padding:0 8px;}
.lgn-wa-tag span{font-size:12px;line-height:16px;font-weight:600;color:var(--green);}

/* ───────── the code boxes (54x60, space-between) ───────── */
.lgn-otp{display:flex;justify-content:space-between;gap:4px;}
.lgn-otp input{
  width:54px;height:60px;flex:0 1 54px;min-width:0;text-align:center;
  font-size:24px;line-height:32px;font-weight:600;letter-spacing:-.24px;color:var(--ink);
  background:#fff;border:1px solid var(--line);border-radius:12px;caret-color:var(--ink-2);
}
.lgn-otp input:placeholder-shown{background:var(--tile);}
.lgn-otp input:focus{background:#fff;border-color:var(--line);box-shadow:0 0 0 3px var(--line);}
.lgn-otp.is-bad input{background:var(--bad-tile);border-color:var(--bad);}
.lgn-otp.is-bad input:focus{box-shadow:0 0 0 3px rgba(215,71,69,.25);}
.lgn-resend{display:flex;align-items:center;gap:8px;font-size:16px;line-height:24px;color:var(--ink-mute);}
.lgn-resend b{font-weight:600;color:var(--ink-soft);}
.lgn-resend button{font-size:16px;line-height:24px;font-weight:600;color:var(--green);}
.lgn-bad{display:flex;align-items:center;gap:6px;}
.lgn-bad p:not(#_){font-size:12px;line-height:16px;font-weight:500;color:var(--bad-ink);}
.lgn-note:not(#_){font-size:12px;line-height:16px;font-weight:500;color:var(--green);}

/* ───────── "A little about you" ───────── */
.lgn-fields{display:flex;flex-direction:column;gap:20px;}
.lgn-field{display:flex;flex-direction:column;gap:8px;}
.lgn-field > label{font-size:14px;line-height:18px;font-weight:500;color:var(--ink-mute);}
.lgn-box{
  display:flex;align-items:center;gap:4px;height:56px;padding:0 16px;border-radius:12px;
  background:var(--tile);border:1px solid var(--line);
}
.lgn-box:focus-within{background:#fff;border-color:var(--line-2);box-shadow:0 0 0 2px var(--line-2);}
.lgn-box input,.lgn-box select{font-size:16px;line-height:24px;font-weight:500;}
.lgn-box select{appearance:none;-webkit-appearance:none;-moz-appearance:none;cursor:pointer;}
.lgn-box select::-ms-expand{display:none;}
.lgn-box em{flex:none;font-style:normal;font-size:14px;line-height:20px;color:var(--ink-mute);text-align:right;}
.lgn-box svg{flex:none;}

/* ───────── the buttons at the foot (48 then 40, gap 12) ───────── */
.lgn-foot{display:flex;flex-direction:column;gap:12px;padding-top:12px;}
.lgn-go{
  display:flex;align-items:center;justify-content:center;gap:8px;height:48px;padding:0 28px;
  border-radius:9999px;color:#fff;font-size:16px;line-height:20px;font-weight:600;
  background:linear-gradient(180deg,#5DC189 0%,#39AC71 100%);
  border:1px solid rgba(255,255,255,.40);
  box-shadow:0 1px 3px rgba(15,72,54,.08),0 11px 7px rgba(15,72,54,.04),0 19px 8px rgba(15,72,54,.02),inset 0 7px 7.2px rgba(255,255,255,.25);
}
.lgn-go:disabled{
  background:var(--tile-2);color:var(--ink-faint);border-color:transparent;box-shadow:none;cursor:default;
}
.lgn-go.is-plain{
  background:#fff;color:var(--ink);border:1px solid var(--line);
  box-shadow:0 1px 2px rgba(28,36,31,.04),0 3px 3px rgba(28,36,31,.03),0 8px 5px rgba(28,36,31,.02),0 14px 5px rgba(28,36,31,.01);
}
.lgn-spin{
  width:16px;height:16px;border-radius:9999px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;
  animation:lgn-turn .7s linear infinite;
}
@keyframes lgn-turn{to{transform:rotate(360deg);}}
.lgn-alt{
  display:flex;align-items:center;justify-content:center;height:40px;padding:0 24px;border-radius:9999px;
  font-size:14px;line-height:18px;font-weight:600;color:var(--ink-soft);
}
.lgn-alt:hover{background:var(--tile);}

/* ───────── laptops and tablets: the same sheet, centred ───────── */
@media (min-width:600px){
  .lgn{align-items:center;padding:24px;}
  .lgn-sheet{
    max-width:440px;border-radius:24px;padding:8px 24px 24px;
    box-shadow:0 24px 60px rgba(13,20,15,.25);
    transform:translateY(10px) scale(.99);
  }
  .lgn.is-in .lgn-sheet{transform:none;}
  .lgn-handle{display:none;}
  .lgn-sheet > .lgn-mark{margin-top:16px;}
  .lgn-otp input{flex:1 1 0;width:auto;}
}
@media (prefers-reduced-motion:reduce){
  .lgn,.lgn-sheet{transition:none;}
  .lgn-spin{animation-duration:2s;}
}
`;
