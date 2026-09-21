'use client';

/**
 * "Oops — that time is gone" popup, for a saved booking whose time was booked by
 * someone else or has passed. Offers the nearest free time in one click, or all the
 * free times. Used by the resume-booking card and by BookingFlow when it restores such
 * a draft. Rendered into <body> so no card or animated section can clip it. Closes on
 * ×, Escape or a click outside.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function SlotUnavailablePopup({
  reason = 'taken',       // 'taken' | 'passed'
  lostLabel = '',         // e.g. "Thu 24 Sept, 8:00 am"
  suggestDate = '',
  suggestTime = '',
  searching = false,      // still looking for the nearest free time
  onTake,
  onSeeOthers,
  onClose,
}) {
  const [mounted, setMounted] = useState(false);
  const primary = useRef(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted) primary.current?.focus(); }, [mounted]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!mounted) return null;

  const taken = reason === 'taken';
  const title = taken ? 'Oops! That slot was just booked' : 'Oops! That time has passed';
  const text = taken
    ? `Someone else booked ${lostLabel || 'the time you picked'} before you could finish. Please pick a new available time.`
    : `${lostLabel ? `${lostLabel} is` : 'The time you picked is'} already over. Please pick a new available time.`;

  return createPortal(
    <div className="ksu-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ksu" role="dialog" aria-modal="true" aria-labelledby="ksu-title">
        <button type="button" className="ksu-close" aria-label="Close" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" aria-hidden focusable="false">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <span className="ksu-icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" focusable="false">
            <rect x="3" y="5" width="18" height="16" rx="2.5" />
            <path d="M3 10h18M8 3v4M16 3v4M10 13.5l4 4M14 13.5l-4 4" />
          </svg>
        </span>

        <div id="ksu-title" className="ksu-title">{title}</div>
        <div className="ksu-text">{text}</div>

        {suggestTime ? (
          <div className="ksu-suggest">
            <span>Nearest available</span>
            <strong>{suggestDate} · {suggestTime}</strong>
          </div>
        ) : searching ? (
          <div className="ksu-searching">Finding the nearest available time…</div>
        ) : null}

        <div className="ksu-actions">
          {suggestTime && (
            <button type="button" ref={primary} className="ksu-primary" onClick={onTake}>
              Book {suggestTime} instead
            </button>
          )}
          <button
            type="button" ref={suggestTime ? undefined : primary}
            className={suggestTime ? 'ksu-secondary' : 'ksu-primary'} onClick={onSeeOthers}
          >
            {suggestTime ? 'See all available times' : 'See available times'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const CSS = `
.ksu-scrim{
  position:fixed;inset:0;z-index:1100;display:flex;align-items:center;justify-content:center;padding:20px;
  background:rgba(10,30,20,.45);animation:ksu-fade .18s ease;
}
.ksu{
  position:relative;width:100%;max-width:420px;background:#fff;border-radius:18px;
  padding:30px 26px 24px;text-align:center;box-shadow:0 24px 60px -20px rgba(0,0,0,.45);
  animation:ksu-pop .2s ease;font-family:'Inter',system-ui,sans-serif!important;
}
.ksu *{box-sizing:border-box;}
.ksu-close{
  position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;border:0;cursor:pointer;
  display:inline-flex;align-items:center;justify-content:center;background:#F3F5F3;color:#5B5757;
}
.ksu-close:hover{background:#E7EBE7;color:#111;}
.ksu-icon{
  display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;
  background:#FFF6E0;color:#B45309;margin-bottom:14px;
}
.ksu-title{
  font-family:'Inter',system-ui,sans-serif!important;font-size:21px;font-weight:600;
  line-height:1.3;letter-spacing:0;color:#111;
}
.ksu-text{margin-top:8px;font-size:15px;line-height:1.55;letter-spacing:0;color:#4B5563;}
.ksu-suggest{
  margin-top:18px;padding:12px 14px;border-radius:12px;background:#EAF7E4;
  display:flex;flex-direction:column;gap:3px;
}
.ksu-suggest span{font-size:12px;font-weight:600;letter-spacing:.02em;color:#29653D;}
.ksu-suggest strong{font-size:16px;font-weight:700;letter-spacing:0;color:#0F6B35;}
.ksu-searching{margin-top:18px;font-size:14px;color:#6B7280;}
.ksu-actions{margin-top:20px;display:flex;flex-direction:column;gap:8px;}
.ksu-primary,.ksu-secondary{
  height:46px;border-radius:10px;cursor:pointer;
  font-family:'Inter',system-ui,sans-serif!important;font-size:15px;font-weight:600;letter-spacing:0;
}
.ksu-primary{border:0;background:#189E4F;color:#fff;}
.ksu-primary:hover{background:#0F6B35;}
.ksu-secondary{border:1px solid rgba(17,17,17,.15);background:#fff;color:#111;}
.ksu-secondary:hover{border-color:rgba(17,17,17,.35);}
.ksu-primary:focus-visible,.ksu-secondary:focus-visible,.ksu-close:focus-visible{outline:2px solid #189E4F;outline-offset:2px;}
@keyframes ksu-fade{from{opacity:0;}}
@keyframes ksu-pop{from{opacity:0;transform:translateY(8px) scale(.98);}}
@media (prefers-reduced-motion:reduce){.ksu-scrim,.ksu{animation:none;}}
`;
