'use client';

/**
 * "Resume your booking" — shown first wherever therapist cards are listed (therapist
 * listing, home, condition pages, the older counselling / assessment pages) when this
 * browser has an unfinished booking (lib/bookingDraft, localStorage only). There is one
 * draft at a time — starting a booking with another therapist replaces it. Continue
 * opens the booking flow at the step the visitor left; × forgets the draft.
 *
 * The saved time is checked on display:
 *   passed  → "Time passed" — Continue opens the date/time step to pick a new one
 *   taken   → "No longer available" (someone else booked it) — same, with a notice
 * BookingFlow re-checks the time itself on Continue.
 *
 * Sized and coloured like TherapistCard (.ktc). Text is set in divs/dl: globals.css
 * forces its own size on every h1–h6 and p.
 */

import { useEffect, useState } from 'react';
import { clearDraft, loadDraft, nearestFreeSlot, saveDraft } from '@/lib/bookingDraft';
import { clientTimeZone, dayKey, fetchSlots, fromYmd, ymd } from '@/lib/sessionSlots';
import SlotUnavailablePopup from '@/components/SlotUnavailablePopup';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Date and time shown as separate fields, in the visitor's own time zone.
const dateOf = (iso) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const timeOf = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const sameInstant = (a, b) => new Date(a).getTime() === new Date(b).getTime();

// Short session-type names for the card (no "therapy", no length).
const KIND_LABEL = {
  individual: 'Individual',
  couple: 'Couple',
  psychiatry_15: '15-min consultation',
  psychiatry_30: '30-min consultation',
};

const ICON_PATHS = {
  video: <><rect x="2" y="6" width="14" height="12" rx="2.5" /><path d="M16 10.5l6-3.5v10l-6-3.5z" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  price: <><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z" /><circle cx="8" cy="8" r="1.4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></>,
};
const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
    {ICON_PATHS[name]}
  </svg>
);

/**
 * This browser's unfinished booking, whether its time still stands, and — when it
 * doesn't — the nearest free time to offer instead.
 * @returns {{ draft: object|null, slotState: 'ok'|'passed'|'taken', suggestion: object|null,
 *             dismiss: () => void, takeSuggestion: () => void }}
 */
export function useBookingDraft() {
  const [draft, setDraft] = useState(null);
  const [slotState, setSlotState] = useState('ok');
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    const d = loadDraft();
    setDraft(d);
    if (!d) return undefined;
    if (d.slotPassed) setSlotState('passed');
    if (!d.therapistId || (!d.slotPassed && !d.slot?.startsAt)) return undefined;

    // Still free? Someone else may have booked it since. Look a week ahead so there is
    // something to suggest when that day is full.
    let off = false;
    const tz = clientTimeZone();
    const anchor = d.slotPassed ? new Date().toISOString() : d.slot.startsAt;
    const fromKey = d.slotPassed ? ymd(new Date()) : dayKey(d.slot.startsAt, tz);
    const toKey = ymd(new Date(fromYmd(fromKey).getTime() + 6 * 86400000));
    fetchSlots(API, d.therapistId, fromKey, toKey, d.kind || 'individual', tz)
      .then((map) => {
        if (off) return;
        if (!d.slotPassed) {
          if ((map[fromKey] || []).some((s) => sameInstant(s.startsAt, d.slot.startsAt))) return; // still free
          setSlotState('taken');
        }
        setSuggestion(nearestFreeSlot(map, anchor, tz));
      })
      .catch(() => { /* can't tell — leave it as saved; the booking flow re-checks */ });
    return () => { off = true; };
  }, []);

  const dismiss = () => { clearDraft(); setDraft(null); };

  // Take the suggested time: it becomes the draft's time, and the booking resumes past
  // the calendar (at "About yourself" when a plan was already chosen).
  const takeSuggestion = () => {
    if (!draft || !suggestion) return;
    const { slotPassed, previousSlot, ...rest } = draft;
    saveDraft({
      ...rest,
      slot: { date: suggestion.date, time: suggestion.time, startsAt: suggestion.startsAt },
      step: Math.max(rest.step || 0, rest.planId ? 3 : 2),
    });
    window.location.href = `/book/${draft.slug}?resume=1`;
  };

  // All free times: drop the lost time first, so the booking opens on the calendar
  // without warning about it a second time.
  const seeOtherTimes = () => {
    if (!draft) return;
    const { slotPassed, previousSlot, ...rest } = draft;
    saveDraft({ ...rest, slot: null, step: 1 });
    window.location.href = `/book/${draft.slug}?resume=1`;
  };

  return { draft, slotState, suggestion, dismiss, takeSuggestion, seeOtherTimes };
}

export default function ResumeBookingCard({
  draft, slotState = 'ok', suggestion = null, onDismiss, onTakeSuggestion, onSeeOtherTimes,
}) {
  const [popupOpen, setPopupOpen] = useState(false);
  const t = draft.therapist || {};
  const initials = (t.name || '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  const lost = slotState === 'passed' ? draft.previousSlot : draft.slot; // the time that no longer stands
  let dateText = draft.slot ? dateOf(draft.slot.startsAt) : '—';
  let timeText = draft.slot ? timeOf(draft.slot.startsAt) : '—';
  const warn = slotState === 'passed' || slotState === 'taken';
  /* The held time is gone (it passed, or someone else took it). Rather than a red
     "No longer available", the card offers the therapist's next free slot in green —
     the popup behind "Choose a new time" confirms it. */
  const next = warn ? suggestion : null;
  if (next) {
    dateText = dateOf(next.startsAt);
    timeText = timeOf(next.startsAt);
  } else if (slotState === 'passed') {
    dateText = 'Time passed';
    timeText = 'Pick a new time';
  } else if (slotState === 'taken') {
    timeText = 'No longer available';
  }
  const tone = next ? 'is-next' : 'is-warn';

  return (
    <article className="krb" aria-label="Resume your booking">
      <div className="krb-head">
        {t.photo
          ? <img className="krb-photo" src={t.photo} alt="" />
          : <span className="krb-photo is-empty" aria-hidden>{initials}</span>}
        <div className="krb-who">
          <div className="krb-name">{t.name}</div>
          {t.role && <div className="krb-role">{t.role}</div>}
        </div>
        <button type="button" className="krb-close" onClick={onDismiss} aria-label="Forget this booking">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" aria-hidden focusable="false">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="krb-body">
        <span className="krb-pill">Resume your booking</span>
        <dl className="krb-grid">
          <div>
            <dt>Session type</dt>
            <dd><Icon name="video" /><span>{KIND_LABEL[draft.kind] || '—'}</span></dd>
          </div>
          <div>
            <dt>Price</dt>
            <dd>
              <Icon name="price" />
              <span>
                {draft.price != null ? inr(draft.price) : '—'}
                {draft.planLabel && <span className="krb-sub">{draft.planLabel}</span>}
              </span>
            </dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd className={next || slotState === 'passed' ? tone : ''}>
              <Icon name="calendar" />
              <span>{dateText}{next && <span className="krb-sub">Next slot</span>}</span>
            </dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd className={warn ? tone : ''}><Icon name="clock" /><span>{timeText}</span></dd>
          </div>
        </dl>
        {warn ? (
          <button type="button" className="krb-cta" onClick={() => setPopupOpen(true)}>Choose a new time</button>
        ) : (
          <a className="krb-cta" href={`/book/${draft.slug}?resume=1`}>Continue booking</a>
        )}
        {popupOpen && (
          <SlotUnavailablePopup
            reason={slotState}
            lostLabel={lost ? `${dateOf(lost.startsAt)}, ${timeOf(lost.startsAt)}` : ''}
            suggestDate={suggestion ? dateOf(suggestion.startsAt) : ''}
            suggestTime={suggestion ? timeOf(suggestion.startsAt) : ''}
            onTake={onTakeSuggestion}
            onSeeOthers={onSeeOtherTimes}
            onClose={() => setPopupOpen(false)}
          />
        )}
      </div>
    </article>
  );
}

/**
 * Drop-in for any page that lists therapists: renders nothing without a draft.
 * `className` wraps the card (e.g. spacing above a carousel) only when it shows.
 */
export function ResumeBooking({ className = '' }) {
  const { draft, slotState, suggestion, dismiss, takeSuggestion, seeOtherTimes } = useBookingDraft();
  if (!draft) return null;
  const card = (
    <>
      <style dangerouslySetInnerHTML={{ __html: RESUME_CARD_CSS }} />
      <ResumeBookingCard
        draft={draft} slotState={slotState} suggestion={suggestion}
        onDismiss={dismiss} onTakeSuggestion={takeSuggestion} onSeeOtherTimes={seeOtherTimes}
      />
    </>
  );
  return className ? <div className={className}>{card}</div> : card;
}

export const RESUME_CARD_CSS = `
.krb{
  --krb-ink:#262222;
  --krb-green:#4FAB69;
  --krb-green-hover:#025545;
  --krb-band:linear-gradient(180deg,#F0FFEC 0%,#D4FFC2 100%);
  --krb-sans:'Inter',ui-sans-serif,system-ui,sans-serif;
  --krb-body:'Inter','Avenir Light','Avenir Next','Avenir',ui-sans-serif,system-ui,sans-serif;
  display:flex;flex-direction:column;background:#fff;text-align:left;
  border:1px solid #BFE9AE;border-radius:8px;padding:10px;
  box-shadow:0 10px 28px -18px rgba(41,101,61,.45);
}
.krb *{box-sizing:border-box;}
.krb-head{
  position:relative;display:flex;align-items:center;gap:14px;
  padding:16px 44px 16px 16px;border-radius:10px;background:var(--krb-band);
}
.krb-photo{
  flex:none;width:64px;height:64px;border-radius:50%;object-fit:cover;object-position:top;
  background:#fff;box-shadow:0 0 0 3px #fff;
}
.krb-photo.is-empty{
  display:flex;align-items:center;justify-content:center;
  font-family:var(--krb-sans)!important;font-size:20px;font-weight:600;color:#29653D;
}
.krb-who{min-width:0;}
.krb-name{
  font-family:var(--krb-sans)!important;font-size:20px;font-weight:400;
  line-height:1.2em;letter-spacing:0;color:var(--krb-ink);
}
.krb-role{
  margin-top:5px;font-family:var(--krb-body)!important;font-size:15px;font-weight:700;
  line-height:1.2em;letter-spacing:0;color:var(--krb-ink);
}
.krb-close{
  position:absolute;top:10px;right:10px;width:30px;height:30px;border-radius:50%;
  display:inline-flex;align-items:center;justify-content:center;
  background:#fff;border:0;cursor:pointer;color:#5B5757;
  transition:color .15s ease,background-color .15s ease;
}
.krb-close:hover{color:var(--krb-ink);background:#F3F5F3;}

.krb-body{display:flex;flex-direction:column;flex:1;padding:16px 8px 6px;}
.krb-pill{
  align-self:flex-start;padding:4px 12px;border-radius:999px;background:#EAF7E4;
  font-family:var(--krb-body)!important;font-size:12px;font-weight:600;letter-spacing:.01em;color:#29653D;
}
.krb-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0 18px;}
.krb-grid > div{padding:12px 14px;border-radius:10px;background:#F7FAF7;min-width:0;}
.krb-grid dt{
  font-family:var(--krb-body)!important;font-size:13px;font-weight:700;letter-spacing:0;color:var(--krb-ink);margin:0;
}
/* Icon on the left of the value, not the label */
.krb-grid dd{
  display:flex;align-items:flex-start;gap:7px;
  margin:6px 0 0;font-family:var(--krb-body)!important;font-size:14px;font-weight:400;
  letter-spacing:0;line-height:1.35em;color:#5B5757;overflow-wrap:anywhere;
}
.krb-grid dd svg{flex:none;margin-top:1px;color:#399F5F;}
.krb-grid dd > span{min-width:0;}
.krb-grid dd.is-warn{color:#B45309;font-weight:600;}
.krb-grid dd.is-next{color:#1B6930;font-weight:600;}
.krb-sub{display:block;margin-top:2px;font-size:12px;color:#8A8F8A;}
.krb-cta{
  margin-top:auto;display:flex;align-items:center;justify-content:center;height:44px;border-radius:10px;
  background:var(--krb-green);color:#fff!important;text-decoration:none;
  font-family:var(--krb-sans)!important;font-size:15px;font-weight:500;letter-spacing:.01em;
  transition:background-color .2s ease;
}
.krb-cta:hover{background:var(--krb-green-hover);}
button.krb-cta{width:100%;border:0;cursor:pointer;}
`;
