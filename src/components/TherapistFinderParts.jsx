'use client';

/**
 * The therapist finder from the home page (Figma 268:1792, therapists section) as
 * parts the therapist listing (Figma "Therapists page" 1123:10853) reuses: the search
 * box with the language pill, the language / attend popup (Figma 680:3664), the four
 * quick filters, and their styles. Copied from KoottHome so the two look the same;
 * class names stay kh2-* and the colours come from the scope the page sets (.ktf).
 */
import { useEffect, useRef } from 'react';

export const Chevron = ({ dir = 'down', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {dir === 'down' && <path d="M6 9l6 6 6-6" />}
    {dir === 'left' && <path d="M15 6l-6 6 6 6" />}
    {dir === 'right' && <path d="M9 6l6 6-6 6" />}
  </svg>
);
export const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 21L17.5001 17.5M20 11.5C20 16.1944 16.1944 20 11.5 20C6.80558 20 3 16.1944 3 11.5C3 6.80558 6.80558 3 11.5 3C16.1944 3 20 6.80558 20 11.5Z" />
  </svg>
);

export const Clock = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 6V12L16 14M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" />
  </svg>
);

export const CloseX = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export const ATTEND_ICONS = {
  monitor: 'M8 21H16M12 17V21M6.8 17H17.2C18.8802 17 19.7202 17 20.362 16.673C20.9265 16.3854 21.3854 15.9265 21.673 15.362C22 14.7202 22 13.8802 22 12.2V7.8C22 6.11984 22 5.27976 21.673 4.63803C21.3854 4.07354 20.9265 3.6146 20.362 3.32698C19.7202 3 18.8802 3 17.2 3H6.8C5.11984 3 4.27976 3 3.63803 3.32698C3.07354 3.6146 2.6146 4.07354 2.32698 4.63803C2 5.27976 2 6.11984 2 7.8V12.2C2 13.8802 2 14.7202 2.32698 15.362C2.6146 15.9265 3.07354 16.3854 3.63803 16.673C4.27976 17 5.11984 17 6.8 17Z',
  building: 'M7.5 11H4.6C4.03995 11 3.75992 11 3.54601 11.109C3.35785 11.2049 3.20487 11.3578 3.10899 11.546C3 11.7599 3 12.0399 3 12.6V21M16.5 11H19.4C19.9601 11 20.2401 11 20.454 11.109C20.6422 11.2049 20.7951 11.3578 20.891 11.546C21 11.7599 21 12.0399 21 12.6V21M16.5 21V6.2C16.5 5.0799 16.5 4.51984 16.282 4.09202C16.0903 3.71569 15.7843 3.40973 15.408 3.21799C14.9802 3 14.4201 3 13.3 3H10.7C9.57989 3 9.01984 3 8.59202 3.21799C8.21569 3.40973 7.90973 3.71569 7.71799 4.09202C7.5 4.51984 7.5 5.0799 7.5 6.2V21M22 21H2M11 7H13M11 11H13M11 15H13',
};

/** The radio from the design: a grey ring, or a green ring around a green dot. */
export const Radio = ({ on }) => (
  <svg className="kh2-radio" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <circle cx="10" cy="10" r="8.33" fill="#fff" stroke={on ? '#189E4F' : '#9CA3AF'} />
    {on && <circle cx="10" cy="10" r="5" fill="#189E4F" />}
  </svg>
);

/**
 * The therapists filter, from Figma frame 680:3664: centred over a 45% black
 * overlay. A choice applies at once; the cross, the overlay or Escape closes it.
 */
export function FilterPopup({ copy, language, attend, onLanguage, onAttend, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener('keydown', onKey);
      opener?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div className="kh2-pop-wrap">
      <div className="kh2-pop-dim" aria-hidden onClick={onClose} />
      <div className="kh2-pop" role="dialog" aria-modal="true" aria-label="Filter therapists">
        <button type="button" className="kh2-pop-x" ref={closeRef} aria-label="Close" onClick={onClose}><CloseX /></button>
        <fieldset className="kh2-pop-set">
          <legend className="kh2-pop-h">{copy.languageTitle}</legend>
          <div className="kh2-pop-langs">
            {copy.languageOrder.map((l) => (
              <label key={l} className={`kh2-pop-lang${language === l ? ' is-on' : ''}`}>
                <input type="radio" name="kh2-language" checked={language === l} onChange={() => onLanguage(l)} />
                <Radio on={language === l} />{l}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="kh2-pop-set">
          <legend className="kh2-pop-h">{copy.attendTitle}</legend>
          <div className="kh2-pop-modes">
            {copy.attend.map((m) => (
              <label key={m.key} className={`kh2-pop-mode${attend === m.key ? ' is-on' : ''}`}>
                <input type="radio" name="kh2-attend" checked={attend === m.key} onChange={() => onAttend(m.key)} />
                <svg className="kh2-pop-i" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={ATTEND_ICONS[m.icon]} />
                </svg>
                <span className="kh2-pop-copy">
                  <span className="kh2-pop-t">{m.title}</span>
                  <span className="kh2-pop-n">{m.note}</span>
                </span>
                <Radio on={attend === m.key} />
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}

export const FINDER_VARS = `
  --green:#189E4F; --green-hover:#0D4F1F; --green-dark:#1B6930; --green-light:#EFFFEA;
  --deep:#063327; --ink:#0F0F0F; --body:#373737; --soft:#5C5C5C; --hint:#BCBCBC;
  --line:#E3E2E2; --line-green:#BFE3CB; --line-soft:#DDEED8; --grey-bg:#F9F9F9;
  --sans:'Poppins',ui-sans-serif,system-ui,sans-serif;
  --text:'Inter',ui-sans-serif,system-ui,sans-serif;
`;

export const FINDER_CSS = `
@keyframes kh2-fade-in{from{opacity:0;}to{opacity:1;}}
@keyframes kh2-fade-out{from{opacity:1;}to{opacity:0;}}
.kh2-filters{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:40px;min-height:64px;}
.kh2-fsearch{
  flex:0 0 375px;min-width:0;height:56px;display:flex;align-items:center;gap:8px;
  background:#fff;border:1px solid var(--line);border-radius:8px;padding:0 8px 0 16px;
}
.kh2-fsearch-q{flex:1;min-width:0;display:flex;align-items:center;gap:8px;color:var(--hint);}
.kh2-fsearch-q svg{flex:none;}
.kh2-fsearch input{
  flex:1;min-width:0;border:0;outline:0;background:none;padding:0;color:var(--ink);
  font-family:var(--text)!important;font-size:16px!important;line-height:24px!important;
}
.kh2-fsearch input::placeholder{color:var(--hint);}
.kh2-fsearch input::-webkit-search-cancel-button{cursor:pointer;}
.kh2-flang{
  position:relative;flex:none;width:157px;height:40px;display:flex;align-items:center;justify-content:space-between;
  background:#F9F9F9;border:1px solid var(--line);border-radius:4px;padding:0 8px 0 11px;color:var(--hint);cursor:pointer;
}
.kh2-flang-v{
  display:inline-flex;align-items:baseline;gap:4px;
  font-family:var(--text)!important;font-size:14px!important;font-weight:500!important;line-height:22px!important;color:var(--ink)!important;
}
.kh2-flang-v small{font-size:12px;font-weight:400;line-height:18px;color:var(--soft);}
/* ---- the filter popup ---- */
.kh2-pop-wrap{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;}
.kh2-pop-dim{position:absolute;inset:0;background:rgba(0,0,0,.45);animation:kh2-fade-in .2s ease both;}
.kh2-pop{
  position:relative;display:flex;flex-direction:column;gap:24px;width:477px;max-width:100%;max-height:100%;overflow-y:auto;
  padding:24px;background:#fff;border-radius:16px;animation:kh2-pop-in .22s cubic-bezier(.22,.7,.3,1) both;
}
@keyframes kh2-pop-in{from{opacity:0;transform:translateY(8px) scale(.98);}to{opacity:1;transform:none;}}
@media (prefers-reduced-motion:reduce){ .kh2-pop,.kh2-pop-dim{animation:none;} }
.kh2-pop-x{
  position:absolute;top:16px;right:16px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;
  padding:0;border:0;background:none;color:var(--soft);cursor:pointer;
}
.kh2-pop-x:hover{color:var(--ink);}
.kh2-pop-set{min-width:0;margin:0;padding:0;border:0;}
.kh2-pop-h{
  display:block;float:left;width:100%;padding:0 32px 0 0;margin:0 0 16px;
  font-family:var(--text)!important;font-size:18px!important;font-weight:500!important;line-height:26px!important;color:var(--ink)!important;
}
.kh2-pop-langs{clear:both;display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.kh2-pop-modes{clear:both;display:flex;flex-direction:column;gap:16px;}
.kh2-pop-lang,.kh2-pop-mode{
  position:relative;display:flex;align-items:center;gap:8px;min-width:0;cursor:pointer;
  background:#fff;border:1px solid var(--line);border-radius:8px;
  transition:background-color .15s ease,border-color .15s ease,color .15s ease;
}
.kh2-pop-lang input,.kh2-pop-mode input{position:absolute;opacity:0;width:1px;height:1px;margin:0;}
.kh2-pop-lang:has(input:focus-visible),.kh2-pop-mode:has(input:focus-visible){outline:2px solid var(--green);outline-offset:2px;}
.kh2-pop-lang:hover,.kh2-pop-mode:hover{border-color:var(--line-green);}
.kh2-pop-lang{
  height:48px;padding:0 11px;
  font-family:var(--text)!important;font-size:16px!important;font-weight:500!important;line-height:24px!important;color:var(--ink);
}
.kh2-pop-mode{height:74px;padding:0 11px;color:var(--soft);}
.kh2-pop-lang.is-on,.kh2-pop-mode.is-on{background:var(--green-light);border-color:var(--line-green);}
.kh2-pop-lang.is-on{color:var(--green-dark);}
.kh2-pop-mode.is-on{color:var(--green-dark);}
.kh2-radio,.kh2-pop-i{flex:none;}
.kh2-pop-copy{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;}
.kh2-pop-t{font-family:var(--text)!important;font-size:16px!important;font-weight:500!important;line-height:24px!important;color:var(--ink)!important;}
.kh2-pop-n{
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  font-family:var(--text)!important;font-size:14px!important;font-weight:400!important;line-height:22px!important;color:var(--soft)!important;
}
.kh2-quicks{flex:none;display:flex;gap:16px;padding:4px;border-radius:8px;background:#fff;}
.kh2-quick{
  height:56px;display:inline-flex;align-items:center;gap:8px;padding:0 11px;
  background:#fff;border:1px solid var(--line);border-radius:8px;cursor:pointer;
  font-family:var(--text)!important;font-size:16px!important;font-weight:400!important;line-height:24px!important;color:var(--ink)!important;
  transition:background-color .18s ease,border-color .18s ease,color .18s ease;
}
.kh2-quick img{width:32px;height:32px;flex:none;}
/* The frame's four chips, whatever Inter build sets their labels. */
@media (min-width:1241px){
  .kh2-quick{justify-content:center;}
  .kh2-quick:nth-child(1){width:247px;}
  .kh2-quick:nth-child(2){width:153px;}
  .kh2-quick:nth-child(3){width:119px;}
  .kh2-quick:nth-child(4){width:168px;}
}
.kh2-quick:hover{border-color:var(--line-green);}
.kh2-quick.is-on{background:var(--green-light);border-color:var(--line-green);color:var(--green-dark)!important;}
.kh2-empty{margin-top:24px!important;text-align:center;font-family:var(--text)!important;font-size:14px!important;color:var(--soft)!important;}
.kh2-tgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin-top:16px;}
@media (max-width:1240px){
  .kh2-filters{flex-direction:column;align-items:stretch;}
  .kh2-fsearch{flex:none;width:100%;max-width:375px;margin:0 auto;}
  .kh2-quicks{justify-content:center;flex-wrap:wrap;}
}
@media (max-width:1100px){
  .kh2-tgrid{grid-template-columns:repeat(2,minmax(0,1fr));}
}
@media (max-width:860px) and (min-width:641px){
  .kh2-quicks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%;max-width:560px;margin:0 auto;}
}
@media (max-width:640px){
  .kh2-filters{margin-top:20px;gap:20px;}
  .kh2-fsearch{flex:none;width:100%;max-width:none;height:48px;padding:0 4px 0 16px;}
  .kh2-flang{width:151px;height:38px;padding:0 6px 0 10px;}
  .kh2-pop{padding:20px;gap:20px;}
  .kh2-pop-langs{gap:12px;}
  .kh2-pop-modes{gap:12px;}
  .kh2-pop-h{font-size:16px!important;line-height:24px!important;margin-bottom:12px;}
  .kh2-quicks{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto auto;grid-auto-flow:column;gap:8px;padding:0;}
  .kh2-tgrid{grid-template-columns:1fr;gap:20px;margin-top:20px;}
  .kh2-quick{
    height:76px;align-items:center;gap:8px;padding:0 11px;border-radius:16px;text-align:left;
    font-size:14px!important;line-height:22px!important;
  }
  .ktf .ktc{padding:15px;}
  .ktf .ktc-head{gap:10px;}
  .ktf .ktc-chip{height:28px;border-radius:14px;}
  .ktf .ktc-lang-lap{display:block;}
  .ktf .ktc-lang-phone{display:none;}
}
`;
