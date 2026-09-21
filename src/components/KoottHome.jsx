'use client';

import ResumeBookingCard, { RESUME_CARD_CSS, useBookingDraft } from '@/components/ResumeBookingCard';
import TherapistCard, { THERAPIST_CARD_CSS, cardFields } from '@/components/TherapistCard';
import { whenLabel } from '@/lib/nextAvailable';
import CustomSelect from '@/components/CustomSelect';

/**
 * KoottHome — the home page from "Koott Website Sep-26 (3).pdf".
 *
 * The design was read by rendering the PDF at 2x (2049 x 14489) and working
 * from the slices, so the values below are measured rather than guessed:
 *
 * Colours are sampled from the render, not eyeballed (modal colour of a patch,
 * so antialiasing does not skew them):
 *
 *   header band   #063327      footer band   #012F23
 *   primary       #189E4F      CTA arch      #D5FFC4 base -> #E6FFDE apex
 *   display text  #012F23      section head  #000000      body #3B3B3B
 *   page          #FFFFFF      placeholder   #A8A8A8
 *   step card     #F7FFF5 -> #F3FFF2         care card   #EFFFEA
 *   services panel #F9FFF8                   feature card #FAFCF9
 *
 * Headings are Inter, body copy Inter (standing in for Avenir, a licensed
 * Wix face). Everything is scoped to .kh2 and marked !important because
 * globals.css (marked "never edit") forces Poppins and 60/48/36px on h1–h3.
 *
 * Live data where we have it: therapists come from /api/public/psychologists and
 * posts from /api/blogs, both falling back to the design's own placeholders so
 * the page is never empty. Copy lives in data/koottHomeContent.js, which also
 * records the two places where the artboards carried another company's
 * placeholder text.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { therapistSlug } from '@/components/TherapistProfile';
import { applyTherapistOrder, fetchTherapistOrder } from '@/lib/therapistOrder';
import {
  HERO, THERAPISTS_SECTION, HOW_IT_WORKS, OFFERS, CARE,
  REVIEWS, EXPERTS, SERVICES, FAQ, BLOGS, FINAL_CTA, HOME_DEFAULTS,
} from '@/data/koottHomeContent';
import { useSiteContent } from '@/lib/useSiteContent';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
const BOOK = '/book-malayali-psychologists';

/* ----------------------------- small pieces ----------------------------- */

const Chevron = ({ dir = 'down', className = '' }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {dir === 'down' ? <path d="M6 9l6 6 6-6" /> : <path d="M9 6l6 6-6 6" />}
  </svg>
);

const Sparkle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
  </svg>
);

/**
 * The mark on "Find therapist by concern": three four-pointed sparkles — a large
 * one low-left with a medium and a small one stacked up to its right, as drawn
 * in the design. Concave sides, so they read as twinkles rather than diamonds.
 */
const SparkleTrio = () => (
  <svg className="kh2-trio" width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    {/* large, sitting low-left. The control points sit at 0.40r rather than
        0.28r, which fattens the arms — thinner waists read as spindly. */}
    <path d="M9.5 5.5C9.5 10.9 13.1 14.5 18.5 14.5C13.1 14.5 9.5 18.1 9.5 23.5C9.5 18.1 5.9 14.5 0.5 14.5C5.9 14.5 9.5 10.9 9.5 5.5Z" />
    {/* medium, to the right */}
    <path d="M18.5 3.1C18.5 6.34 20.66 8.5 23.9 8.5C20.66 8.5 18.5 10.66 18.5 13.9C18.5 10.66 16.34 8.5 13.1 8.5C16.34 8.5 18.5 6.34 18.5 3.1Z" />
    {/* small, above */}
    <path d="M13.5 0.2C13.5 2.24 14.86 3.6 16.9 3.6C14.86 3.6 13.5 4.96 13.5 7C13.5 4.96 12.14 3.6 10.1 3.6C12.14 3.6 13.5 2.24 13.5 0.2Z" />
  </svg>
);

/**
 * One of the two working filters over the therapist list — the shared custom
 * dropdown, with the empty option ("Speciality" / "Need") as "show all".
 */
const FilterSelect = ({ label, value, options, onChange, format }) => (
  <CustomSelect
    className="kh2-filter"
    aria-label={label}
    placeholder={label}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    options={[
      { value: '', label },
      ...options.map((o) => ({ value: o, label: format ? format(o) : o.charAt(0).toUpperCase() + o.slice(1) })),
    ]}
  />
);

const Tick = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </svg>
);

const Stars = () => (
  <span className="kh2-stars" aria-hidden>★★★★★</span>
);

/** Source mark on a review card. */
const SOURCE = { google: 'G', whatsapp: '✆', zoho: 'Z' };

/**
 * The looped clip along the foot of the hero — one wide band, with a taller cut
 * for phones. It is decoration, so it plays silent and inline with no controls.
 *
 * The element mounts only once the client knows which cut applies, so a phone
 * never downloads the desktop file and vice versa; the band's height is
 * reserved in CSS, so nothing jumps while it loads. Anyone who asks for less
 * motion gets the first frame, held still.
 */
/* Two copies of the clip this viewport needs; the second is served from cache,
   so it costs no download. They are React elements, not hand-written HTML:
   anything written into the band by hand is wiped on every re-render of the
   hero, which happens constantly because the badge deck above rotates on a
   timer. The band itself carries the still frame as its background, so the
   greenery is painted with no JavaScript and no video decoded. */
/* H.264 MP4 first: every iPhone browser is WebKit, and WebKit would not play
   the WebM — it is VP9 flagged alpha_mode=1, and Apple's WebKit has no VP9
   alpha, so on iOS the band sat on its still frame. The alpha was never used
   (every pixel of every frame is opaque), so a plain MP4 loses nothing; it is
   hardware-decoded on every phone and about half the size. The WebM stays as
   the fallback for a browser with no H.264. */
const CUTS = {
  desk: { mp4: '/hero-calm-desktop.mp4', webm: '/hero-calm-desktop.webm', poster: '/hero-calm-desktop.webp' },
  mob: { mp4: '/hero-calm-mobile.mp4', webm: '/hero-calm-mobile.webm', poster: '/hero-calm-mobile.webp' },
};
const HANDOVER = 0.12;   // seconds of overlap before a clip reaches its end

const HeroClip = () => {
  const [cut, setCut] = useState(null);   // null until the viewport is known
  const [still, setStill] = useState(false);
  const a = useRef(null);
  const b = useRef(null);

  useEffect(() => {
    const phone = window.matchMedia('(max-width:640px)');
    const calm = window.matchMedia('(prefers-reduced-motion:reduce)');
    const read = () => { setCut(phone.matches ? 'mob' : 'desk'); setStill(calm.matches); };
    read();
    phone.addEventListener('change', read);
    calm.addEventListener('change', read);
    return () => { phone.removeEventListener('change', read); calm.removeEventListener('change', read); };
  }, []);

  /* A native loop paints nothing for a frame while the decoder wraps, and that
     reads as a flash. So the spare copy starts a breath before the front one
     ends and takes the front; the spent one rewinds and waits its turn.
     Something is always mid-frame, so there is no gap to see. */
  useEffect(() => {
    let front = a.current;
    let back = b.current;
    if (!cut || !front || !back) return undefined;
    if (still) { front.pause(); back.pause(); front.currentTime = 0; return undefined; }
    let busy = false;
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (busy || !front.duration || front.paused) return;
      if (front.duration - front.currentTime > HANDOVER) return;
      busy = true;
      back.currentTime = 0;
      Promise.resolve(back.play())
        .then(() => {
          back.classList.remove('is-buffer');
          front.classList.add('is-buffer');
          front.pause();
          const spent = front; front = back; back = spent;
          busy = false;
        })
        .catch(() => { busy = false; });
    };

    // rAF is frozen while the tab is in the background, so a clip can reach its
    // end with no handover waiting. Rewind it there, and again on the way back,
    // so nobody returns to a stalled frame.
    const rescue = (e) => { e.target.currentTime = 0; if (e.target === front) Promise.resolve(front.play()).catch(() => {}); };
    const wake = () => { if (!document.hidden && front.paused) Promise.resolve(front.play()).catch(() => {}); };
    const one = a.current; const two = b.current;
    one.addEventListener('ended', rescue);
    two.addEventListener('ended', rescue);
    document.addEventListener('visibilitychange', wake);

    Promise.resolve(front.play()).catch(() => {});
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      one.removeEventListener('ended', rescue);
      two.removeEventListener('ended', rescue);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [cut, still]);

  const clip = cut ? CUTS[cut] : null;
  return (
    <span className={`kh2-clips is-${cut || 'desk'}`}>
      {clip && [null, 'is-buffer'].map((extra, i) => (
        <video
          key={`${cut}-${i}`}
          ref={i === 0 ? a : b}
          className={`kh2-clip ${extra || ''}`}
          poster={clip.poster}
          // The front clip carries autoplay too, for browsers that start a
          // muted video on its own but refuse a scripted play().
          autoPlay={i === 0}
          muted
          playsInline
          preload="auto"
          aria-hidden
          tabIndex={-1}
        >
          <source src={clip.mp4} type="video/mp4" />
          <source src={clip.webm} type="video/webm" />
        </video>
      ))}
    </span>
  );
};

/** One card in the hero deck. `incoming` is the one animating in on top. */
const BadgeCard = ({ card, incoming = false }) => (
  <div className={`kh2-badge ${incoming ? 'is-in' : 'is-out'}`}>
    <span className="kh2-badge-i" aria-hidden>{card.icon}</span>
    <div>
      <p className="kh2-badge-t">{card.title}</p>
      <p className="kh2-badge-b">{card.body}</p>
    </div>
  </div>
);

/** The body of one "What Koott offers" entry. */
const OfferBody = ({ o }) => (
  <>
    <h3 className="kh2-offer-h">
      {o.panel.heading.map((l, i) => <span key={i}>{l}</span>)}
    </h3>
    <p className="kh2-offer-lead">{o.panel.lead}</p>

    <div className="kh2-offer-cta">
      <Link href={BOOK} className="kh2-offer-price">{o.panel.price}</Link>
      <Link href={o.panel.link.href} className="kh2-offer-link">
        {o.panel.link.label}
        <span className="kh2-offer-link-i" aria-hidden><Chevron /></span>
      </Link>
    </div>

    <ul className="kh2-offer-list">
      {o.panel.bullets.map((b) => (
        <li key={b}><span className="kh2-offer-i"><Tick /></span>{b}</li>
      ))}
    </ul>
    <p className="kh2-offer-pack">{o.panel.packages}</p>
  </>
);

/* -------------------------------- data ---------------------------------- */

function useTherapists(limit = 3) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    let off = false;
    (async () => {
      try {
        // Soonest-available therapists first (the booking page uses the admin's group pattern instead).
        const [res, order] = await Promise.all([
          fetch(`${API}/public/psychologists`),
          fetchTherapistOrder('default'),
        ]);
        if (!res.ok) return;
        const json = await res.json();
        const d = json?.data ?? json?.message ?? json;
        const list = d?.psychologists || (Array.isArray(d) ? d : []);
        // The same order answer carries each therapist's next free start, so the
        // cards show it without a single extra request.
        if (!off && Array.isArray(list)) {
          setRows(applyTherapistOrder(list, order).slice(0, limit).map((p) => ({
            ...p,
            nextAvailable: whenLabel(order?.nextAt?.get(String(p.id))),
          })));
        }
      } catch (_) { /* keep the design's placeholder cards */ }
    })();
    return () => { off = true; };
  }, [limit]);
  return rows;
}

function usePosts(limit = 3) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const res = await fetch(`${API}/blogs?limit=${limit}`);
        if (!res.ok) return;
        const json = await res.json();
        const d = json?.data ?? json?.message ?? json;
        const list = d?.blogs || (Array.isArray(d) ? d : []);
        if (!off && Array.isArray(list)) setRows(list.slice(0, limit));
      } catch (_) { /* section falls back to the design's captions */ }
    })();
    return () => { off = true; };
  }, [limit]);
  return rows;
}

/** No filters set. One object so "cleared" is always the same value. */
const EMPTY_FILTERS = { concerns: [], roles: [], minExp: '', maxPrice: 0 };

/**
 * Where a card's View Profile goes: the therapist's own page when we have a
 * real record, the booking page for the artboard's placeholder cards, which have
 * no row behind them.
 */
const bookingHref = (t) => (t.first_name || t.last_name
  ? '/book/' + therapistSlug(t)
  : BOOK);

const profileHref = (t) => (t.first_name || t.last_name
  ? '/service-page/' + therapistSlug(t)
  : BOOK);

/** The three cards the artboards show, used until the API answers. */
const FALLBACK_THERAPISTS = [
  { name: 'Dr. Aswathi Usha Raman', designation: 'Chief Consultant Psychologist' },
  { name: 'Aswathy Sampath', designation: 'Clinical Psychologist' },
  { name: 'Dr. Thaniya K Leela', designation: 'Consultant Psychologist' },
];

/* Placeholder therapist portraits for the experts strip — the same DiceBear
   "notionists" style the demo therapist rows use — until real photos exist. */
const FACE_BGS = ['F1FBF3', 'E8F1FB', 'FCEADB', 'F6EFFB', 'EAF3E2', 'FBF3E1'];
const EXPERT_FACES = [
  ['Anjali Menon', 'Rahul Nair', 'Fathima Noora', 'Vishnu Prasad', 'Sneha Thomas', 'Arun Krishnan', 'Meera Pillai',
    'Nikhil Varghese', 'Divya Raj', 'Aswin Kumar', 'Lakshmi Nair', 'Joel Mathew', 'Reshma Babu', 'Hari Shankar'],
  ['Aparna Das', 'Sreejith Mohan', 'Nisha Joseph', 'Anand Menon', 'Gayathri Suresh', 'Faisal Rahman', 'Keerthi Varma',
    'Midhun Jose', 'Ann Maria', 'Rohit Chandran', 'Swathi Krishna', 'Sanjay George', 'Neethu Paul', 'Akhil Ravi'],
];
const faceUrl = (seed, i) =>
  `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${FACE_BGS[i % FACE_BGS.length]}&scale=110`;

/* -------------------------------- page ---------------------------------- */

export default function KoottHome({ content } = {}) {
  // Copy from data/koottHomeContent.js, with whatever the admin "Pages → Home"
  // editor stored (site-config `site_home`) merged over it; `content` is that
  // editor's live preview. These shadow the module imports of the same name.
  const {
    HERO, THERAPISTS_SECTION, HOW_IT_WORKS, OFFERS, CARE,
    REVIEWS, EXPERTS, SERVICES, FAQ, BLOGS, FINAL_CTA,
  } = useSiteContent('site_home', HOME_DEFAULTS, content);
  const therapists = useTherapists(60);
  const posts = usePosts(3);

  // `out` is the phrase leaving, kept mounted so phones can fade it away before
  // the next one rises, rather than have it vanish; same shape as the badge deck.
  const [title, setTitle] = useState({ cur: 0, out: null });
  // Both indices in one piece of state so the swap happens in a single update:
  // `cur` is the card landing on top, `out` the one it is covering.
  const [deck, setDeck] = useState({ cur: 0, out: null });
  const [speciality, setSpeciality] = useState('');
  const [need, setNeed] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  // The panel edits a draft; nothing reaches the list until Apply is pressed.
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  // "How it works" is a swipe carousel on phones. The row scrolls natively
  // (scroll-snap); this only tracks which card is in view, for the dots.
  const stepsRef = useRef(null);
  const [stepIndex, setStepIndex] = useState(0);
  const onStepsScroll = () => {
    const el = stepsRef.current;
    if (!el || !el.children.length) return;
    const card = el.children[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap) || 0;
    setStepIndex(Math.round(el.scrollLeft / (card + gap)));
  };
  const goToStep = (i) => {
    const el = stepsRef.current;
    const card = el?.children[i];
    if (card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - (el.clientWidth - card.clientWidth) / 2, behavior: 'smooth' });
  };
  const [openOffer, setOpenOffer] = useState(OFFERS.items[0].key);
  // The laptop panel hands over like the hero headline: the previous entry is
  // kept mounted just long enough to fade out, then the new one rises in.
  // `offerTouched` stops the very first entry animating on page load.
  const [prevOffer, setPrevOffer] = useState(null);
  const [offerTouched, setOfferTouched] = useState(false);
  // Once an entry has finished opening on a phone/tablet, glide the whole entry
  // (its row and the body under it) to the middle of the screen below the
  // 63px header. Taller than the screen: its row goes just under the header.
  const centreOpenOffer = (rowEl) => {
    const item = rowEl.closest('.kh2-offer-item') || rowEl;
    const r = item.getBoundingClientRect();
    const top = 63;
    const room = window.innerHeight - top;
    const want = r.height < room - 24 ? top + (room - r.height) / 2 : top + 12;
    const delta = r.top - want;
    if (Math.abs(delta) > 2) window.scrollBy({ top: delta, behavior: 'smooth' });
  };
  const pickOffer = (key, rowEl) => {
    if (key === openOffer) return;
    setPrevOffer(openOffer);
    setOpenOffer(key);
    setOfferTouched(true);
    // Phones/tablets: the entry above may be collapsing as this one opens,
    // which drags the tapped row up out from under the finger. Pin it for the
    // length of the transition. (Chrome's own scroll anchoring may already do
    // this; then the row never moves and the loop does nothing. Safari has no
    // scroll anchoring.) 'instant' because <html> has scroll-behavior:smooth.
    // Measured against the row's starting position, not the previous frame:
    // scroll offsets are whole pixels, so frame-to-frame corrections each lose
    // a fraction and the row crept 12px over one transition.
    if (rowEl && window.matchMedia('(max-width:1000px)').matches) {
      const start = performance.now();
      const target = rowEl.getBoundingClientRect().top;
      const hold = (t) => {
        const drift = rowEl.getBoundingClientRect().top - target;
        if (Math.abs(drift) >= 0.5) window.scrollBy({ top: drift, behavior: 'instant' });
        if (t - start < 420) requestAnimationFrame(hold);
      };
      requestAnimationFrame(hold);
      // After the .38s open (and the hold above) has settled.
      setTimeout(() => centreOpenOffer(rowEl), 440);
    }
  };
  const [faqTab, setFaqTab] = useState(FAQ.tabs[0]);
  const [openFaq, setOpenFaq] = useState(null);
  const [serviceTab, setServiceTab] = useState(0);
  // On phones the tab row scrolls sideways; keep the selected tab in view when
  // a swipe or a dot changes it (scrolls only the row, never the page).
  const serviceTabsRef = useRef(null);
  useEffect(() => {
    const row = serviceTabsRef.current;
    const tab = row?.children[serviceTab];
    if (!row || !tab || row.scrollWidth <= row.clientWidth) return;
    const offset = tab.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft;
    row.scrollTo({ left: offset - (row.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
  }, [serviceTab]);
  // Phones can swipe the services panels as well as tapping a tab or dot.
  const serviceSwipe = useRef(null);
  const onServiceTouchStart = (e) => { serviceSwipe.current = e.touches[0].clientX; };
  const onServiceTouchEnd = (e) => {
    if (serviceSwipe.current === null) return;
    const dx = e.changedTouches[0].clientX - serviceSwipe.current;
    serviceSwipe.current = null;
    if (Math.abs(dx) < 40) return;
    setServiceTab((t) => Math.min(SERVICES.panels.length - 1, Math.max(0, t + (dx < 0 ? 1 : -1))));
  };

  const offer = useMemo(
    () => OFFERS.items.find((o) => o.key === openOffer) || OFFERS.items[0],
    [openOffer]
  );
  const faqs = FAQ.groups[faqTab] || [];
  // Real therapists come first; the pool is topped up from the artboard's own
  // cards so the section is never half empty (the psychologists table currently
  // holds a single seed row).
  const pool = useMemo(() => {
    const out = [...therapists];
    for (const f of FALLBACK_THERAPISTS) {
      if (!out.some((t) => t.name === f.name)) out.push(f);
    }
    return out;
  }, [therapists]);

  // Both filters are built from the data rather than hard-coded, so they can
  // never offer a value that matches nothing.
  const roleOf = (t) => t.designation || t.specialization || '';
  const needsOf = (t) => t.area_of_expertise || t.areas_of_expertise || [];
  const specialityOptions = useMemo(
    () => [...new Set(pool.map(roleOf).filter(Boolean))].sort(),
    [pool]
  );
  const needOptions = useMemo(
    () => [...new Set(pool.flatMap(needsOf).filter(Boolean))].sort(),
    [pool]
  );

  // The design shows a row of three.
  const priceOf = (t) => Number(t.individual_session_price || t.price || 0);
  const matches = useMemo(() => pool.filter((t) => {
    if (speciality && roleOf(t) !== speciality) return false;
    if (need && !needsOf(t).includes(need)) return false;
    if (applied.concerns.length && !needsOf(t).some((n) => applied.concerns.includes(n))) return false;
    if (applied.roles.length && !applied.roles.includes(roleOf(t))) return false;
    if (applied.minExp && Number(t.experience_years || 0) < Number(applied.minExp)) return false;
    // A card with no price recorded is not excluded by a budget filter.
    if (applied.maxPrice && priceOf(t) && priceOf(t) > applied.maxPrice) return false;
    return true;
  }), [pool, speciality, need, applied]);

  const activeCount = (speciality ? 1 : 0) + (need ? 1 : 0)
    + applied.concerns.length + applied.roles.length
    + (applied.minExp ? 1 : 0) + (applied.maxPrice ? 1 : 0);
  const clearAll = () => {
    setSpeciality(''); setNeed('');
    setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS);
  };
  // Escape closes the sheet, as a dialog should.
  useEffect(() => {
    if (!panelOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setPanelOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelOpen]);

  const toggleDraft = (key, value) => setDraft((d) => ({
    ...d,
    [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value],
  }));
  // An unfinished booking (this browser only) takes the first card's place, so the
  // row stays at three.
  // (`draft` here is the filter panel's; this is the booking one.)
  const {
    draft: bookingDraft, slotState: bookingSlotState, suggestion: bookingSuggestion,
    dismiss: dismissBookingDraft, takeSuggestion: takeBookingSuggestion, seeOtherTimes: seeOtherBookingTimes,
  } = useBookingDraft();
  const cards = matches.slice(0, bookingDraft ? 2 : 3);

  // Rotate the headline and the stat card — for everyone, including anyone who
  // has asked the system for reduced motion. That setting is on for a lot of
  // iPhones, and holding still there froze the hero on its first headline and
  // first card, so those visitors never saw the other five of each. Reduced
  // motion means no movement, not no change: the CSS swaps the slide-up for a
  // plain fade under that preference (Apple's own guidance), and the looping
  // clip — pure decoration — still holds its first frame.
  useEffect(() => {
    const timers = [];
    if (HERO.rotatingTitles.length > 1) {
      timers.push(setInterval(() => {
        setTitle(({ cur }) => ({ cur: (cur + 1) % HERO.rotatingTitles.length, out: cur }));
      }, 2600));
    }
    if (HERO.badges.length > 1) {
      timers.push(setInterval(() => {
        setDeck(({ cur }) => ({ cur: (cur + 1) % HERO.badges.length, out: cur }));
      }, 3800));
    }
    return () => timers.forEach(clearInterval);
  }, []);

  return (
    <main className="kh2">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <style dangerouslySetInnerHTML={{ __html: THERAPIST_CARD_CSS }} />

      {/* ══ hero ══════════════════════════════════════════════════════════ */}
      <section className="kh2-hero">
        <div className="kh2-in kh2-hero-in">
          {/* Only the first line rotates. aria-live announces the change, and the
              tail stays in the same node so the sentence is never read broken. */}
          <h1 className="kh2-h1">
            <span className="kh2-h1-rot" aria-live="polite">
              {HERO.rotatingTitles.map((w) => (
                <span key={w} className="kh2-h1-size" aria-hidden>{w}</span>
              ))}
              {title.out !== null && (
                <span className="kh2-h1-word is-out" key={`out-${title.out}`} aria-hidden>
                  {HERO.rotatingTitles[title.out]}
                </span>
              )}
              <span className={`kh2-h1-word is-in${title.out === null ? ' is-first' : ''}`} key={`in-${title.cur}`}>
                {HERO.rotatingTitles[title.cur]}
              </span>
            </span>
            <span>{HERO.titleTail}</span>
          </h1>
          <p className="kh2-hero-sub">
            {/* Whatever follows the last comma ("24/7") is set in green — keyed
                to the punctuation rather than one word, so the accent survives
                an edit in the admin Pages → Home editor. */}
            {(() => {
              const s = HERO.subtitle || '';
              const cut = s.lastIndexOf(', ');
              if (cut < 0) return s;
              return <>{s.slice(0, cut + 2)}<span className="kh2-hero-accent">{s.slice(cut + 2)}</span></>;
            })()}
          </p>

          {/* On phones this is a pale green panel holding the text box and both
              buttons; on desktop it dissolves (display:contents). */}
          <div className="kh2-hero-panel">
          <div className="kh2-search">
            <div className="kh2-search-box">
              <textarea
                className="kh2-search-input"
                rows={3}
                placeholder={HERO.searchPlaceholder}
                aria-label="Tell us what's on your mind"
              />
              <span className="kh2-search-spark" aria-hidden><SparkleTrio /></span>
            </div>
            <div className="kh2-search-row">
              <button type="button" className="kh2-concern">
                {HERO.concernCta}<SparkleTrio />
              </button>
              <Link href={BOOK} className="kh2-book">
                {HERO.bookCta}<Chevron />
              </Link>
            </div>
          </div>

          {/* phone only (hidden on desktop): the two hero actions side by side */}
          <div className="kh2-hero-actions">
            <Link href={BOOK} className="kh2-match">Find the match<Chevron dir="right" /></Link>
            <Link href={BOOK} className="kh2-consult">
              Consult now
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
          </div>
        </div>

        {/* The looped clip runs along the foot of the hero. The badge is
            positioned inside this band rather than pulled up with a negative
            margin — a margin shortened the section, so the band overflowed and
            was clipped by the hero's overflow:hidden. */}
        <div className="kh2-foliage">
          <HeroClip />

          {/* The design draws this as a small stack: a second card, inset on both
              sides, peeks out about 9px below the one carrying the copy.
              The deck plays that idea out — each whole card rises and fades in
              on top of the one it replaces, which stays put underneath until it
              is covered. aria-live keeps the rotation announced, not silent. */}
          <div className="kh2-badge-wrap">
            <span className="kh2-badge-stack" aria-hidden />
            <div className="kh2-badge-deck" aria-live="polite">
              {deck.out !== null && (
                <BadgeCard key={`out-${deck.out}`} card={HERO.badges[deck.out]} />
              )}
              {/* key remounts the node so the entry animation replays each time */}
              <BadgeCard key={`in-${deck.cur}`} card={HERO.badges[deck.cur]} incoming />
            </div>
          </div>
        </div>
      </section>

      {/* ══ therapists ════════════════════════════════════════════════════ */}
      <section className="kh2-sec">
        <div className="kh2-in">
          <h2 className="kh2-h2 kh2-center">{THERAPISTS_SECTION.title}</h2>
          <p className="kh2-sub kh2-center">{THERAPISTS_SECTION.subtitle}</p>

          <div className="kh2-filters">
            <FilterSelect
              label={THERAPISTS_SECTION.filters[0]}
              value={speciality} options={specialityOptions} onChange={setSpeciality}
            />
            <FilterSelect
              label={THERAPISTS_SECTION.filters[1]}
              value={need} options={needOptions} onChange={setNeed}
            />
            {activeCount > 0 && (
              <button type="button" className="kh2-filter-clear" onClick={clearAll}>Clear</button>
            )}

            <div className="kh2-filter-anchor">
              <button
                type="button"
                className={`kh2-filter-icon ${panelOpen ? 'is-open' : ''}`}
                aria-expanded={panelOpen}
                onClick={() => { setDraft(applied); setPanelOpen((v) => !v); }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <path d="M4 7h16M7 12h10M10 17h4" />
                </svg>
                Filters
                {activeCount > 0 && <span className="kh2-filter-count">{activeCount}</span>}
              </button>

              {panelOpen && (
                <>
                  <button
                    type="button" className="kh2-filter-scrim" aria-label="Close filters"
                    onClick={() => setPanelOpen(false)}
                  />
                  <div className="kh2-panel" role="dialog" aria-label="Filters">
                    <div className="kh2-panel-top">
                      <p className="kh2-panel-h">Filters</p>
                      <button
                        type="button" className="kh2-panel-x" aria-label="Close"
                        onClick={() => setPanelOpen(false)}
                      >
                        ×
                      </button>
                    </div>

                    {needOptions.length > 0 && (
                      <div className="kh2-panel-sec">
                        <p className="kh2-panel-l">Concern</p>
                        <div className="kh2-fchips">
                          {needOptions.map((o) => (
                            <button
                              key={o} type="button"
                              className={`kh2-fchip ${draft.concerns.includes(o) ? 'is-on' : ''}`}
                              onClick={() => toggleDraft('concerns', o)}
                            >
                              {o.charAt(0).toUpperCase() + o.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {specialityOptions.length > 0 && (
                      <div className="kh2-panel-sec">
                        <p className="kh2-panel-l">Speciality</p>
                        <div className="kh2-fchips">
                          {specialityOptions.map((o) => (
                            <button
                              key={o} type="button"
                              className={`kh2-fchip ${draft.roles.includes(o) ? 'is-on' : ''}`}
                              onClick={() => toggleDraft('roles', o)}
                            >
                              {o}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="kh2-panel-sec">
                      <p className="kh2-panel-l">Experience</p>
                      <div className="kh2-fchips">
                        {['3', '5', '8', '10'].map((o) => (
                          <button
                            key={o} type="button"
                            className={`kh2-fchip ${draft.minExp === o ? 'is-on' : ''}`}
                            onClick={() => setDraft((d) => ({ ...d, minExp: d.minExp === o ? '' : o }))}
                          >
                            {o}+ yrs
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="kh2-panel-sec">
                      <div className="kh2-panel-row">
                        <p className="kh2-panel-l">Max price</p>
                        <span className="kh2-panel-v">
                          {draft.maxPrice ? `₹${draft.maxPrice}` : 'Any'}
                        </span>
                      </div>
                      {/* Full right is "Any", so dragging left tightens the budget. */}
                      <input
                        className="kh2-range" type="range" min="500" max="5250" step="250"
                        value={draft.maxPrice || 5250} aria-label="Maximum price"
                        onChange={(e) => setDraft((d) => ({
                          ...d, maxPrice: Number(e.target.value) >= 5250 ? 0 : Number(e.target.value),
                        }))}
                      />
                    </div>

                    <div className="kh2-panel-foot">
                      <button type="button" className="kh2-panel-clear" onClick={clearAll}>Clear</button>
                      <button
                        type="button" className="kh2-panel-apply"
                        onClick={() => { setApplied(draft); setPanelOpen(false); }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {cards.length === 0 && (
            <p className="kh2-filter-empty">
              No therapist matches that combination yet. Clear a filter to see everyone.
            </p>
          )}

          <div className="kh2-tgrid">
            {bookingDraft && (
              <>
                <style dangerouslySetInnerHTML={{ __html: RESUME_CARD_CSS }} />
                <ResumeBookingCard
                  draft={bookingDraft} slotState={bookingSlotState} suggestion={bookingSuggestion}
                  onDismiss={dismissBookingDraft} onTakeSuggestion={takeBookingSuggestion}
                  onSeeOtherTimes={seeOtherBookingTimes}
                />
              </>
            )}
            {/* The same card the listing and the condition pages use. The
                artboard's placeholder therapists have no row behind them, so
                they get no availability lookup and no invented times. */}
            {cards.map((t, i) => (
              <TherapistCard
                key={t.id || t.name || i}
                t={{ ...cardFields(t), availability: t.nextAvailable }}
                profileHref={profileHref(t)}
                bookHref={bookingHref(t)}
              />
            ))}
          </div>

          <div className="kh2-center">
            <Link href={BOOK} className="kh2-more">{THERAPISTS_SECTION.moreLabel}<Chevron /></Link>
          </div>
        </div>
      </section>

      {/* ══ how it works ══════════════════════════════════════════════════ */}
      <section className="kh2-sec">
        <div className="kh2-in">
          <span className="kh2-eyebrow">{HOW_IT_WORKS.eyebrow}</span>
          <div className="kh2-headrow">
            <div>
              <h2 className="kh2-h2">{HOW_IT_WORKS.title}</h2>
              <p className="kh2-sub">{HOW_IT_WORKS.subtitle}</p>
            </div>
            <Link href={BOOK} className="kh2-btn">{HOW_IT_WORKS.cta}<Sparkle /></Link>
          </div>

          <div className="kh2-steps" ref={stepsRef} onScroll={onStepsScroll}>
            {HOW_IT_WORKS.steps.map((s) => (
              <div key={s.n} className="kh2-step">
                <p className="kh2-step-n">{s.n}</p>
                <h3 className="kh2-step-t">{s.title}</h3>

                <div className="kh2-step-body">
                  {s.chips && (
                    <ul className="kh2-chips">
                      {s.chips.map((c) => (
                        <li key={c}><span className="kh2-chip-i"><Tick /></span>{c}</li>
                      ))}
                    </ul>
                  )}
                  {s.match && (
                    <>
                      <div className="kh2-avatars" aria-hidden>
                        {[0, 1, 2, 3, 4].map((i) => <span key={i} className={`kh2-av kh2-av--${i}`} />)}
                      </div>
                      <p className="kh2-match-n">{s.match.name}</p>
                      <p className="kh2-match-r">{s.match.role}</p>
                    </>
                  )}
                  {s.slot && (
                    <>
                      <p className="kh2-slot"><span aria-hidden>📅</span>{s.slot}</p>
                      <ul className="kh2-days">
                        {s.days.map((d, i) => (
                          <li key={d} className={i === 1 || i === 4 ? 'is-on' : ''}>{d}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {s.n === 4 && (
                    <div className="kh2-join" aria-hidden>
                      <span className="kh2-join-a" /><span className="kh2-join-b" />
                    </div>
                  )}
                </div>

                <p className="kh2-step-c">{HOW_IT_WORKS.caption}</p>
              </div>
            ))}
          </div>

          {/* phone only: which of the four steps is in view */}
          <div className="kh2-step-dots">
            {HOW_IT_WORKS.steps.map((s, i) => (
              <button
                key={s.n} type="button" aria-label={`Step ${s.n}`}
                className={i === stepIndex ? 'is-on' : ''} onClick={() => goToStep(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══ what koott offers ═════════════════════════════════════════════ */}
      <section className="kh2-sec">
        <div className="kh2-in">
          <h2 className="kh2-h2 kh2-center">{OFFERS.title}</h2>
          <p className="kh2-sub kh2-center">{OFFERS.subtitle}</p>

          <div className="kh2-offers">
            <div className="kh2-offer-panel">
              {prevOffer && prevOffer !== openOffer && (
                <div
                  key={`out-${prevOffer}`}
                  className="kh2-offer-body is-out"
                  aria-hidden
                  onAnimationEnd={() => setPrevOffer(null)}
                >
                  <OfferBody o={OFFERS.items.find((o) => o.key === prevOffer) || offer} />
                </div>
              )}
              <div key={`in-${openOffer}`} className={`kh2-offer-body is-in${offerTouched ? '' : ' is-first'}`}>
                <OfferBody o={offer} />
              </div>
            </div>

            <div className="kh2-offer-list-col">
              {OFFERS.items.map((o) => (
                <div key={o.key} className="kh2-offer-item">
                  <button
                    type="button"
                    className={`kh2-offer-row ${o.key === openOffer ? 'is-on' : ''}`}
                    onClick={(e) => pickOffer(o.key, e.currentTarget)}
                    aria-expanded={o.key === openOffer}
                  >
                    <span>
                      <span className="kh2-offer-t">{o.title}</span>
                      <span className="kh2-offer-n">{o.note}</span>
                    </span>
                    {/* one arrow that turns, rather than two icons swapped */}
                    <Chevron dir="right" className="kh2-offer-chev" />
                  </button>
                  {/* Phones and tablets only: the body opens under its own row.
                      Every body is always rendered so its height can animate
                      (0fr → 1fr); closed ones are visibility:hidden, so their
                      links are out of the tab order and the accessibility tree. */}
                  <div className={`kh2-offer-inline${o.key === openOffer ? ' is-open' : ''}`}>
                    <div className="kh2-offer-inline-in">
                      <div className="kh2-offer-inline-body"><OfferBody o={o} /></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ care that understands you ═════════════════════════════════════ */}
      <section className="kh2-sec">
        <div className="kh2-in kh2-care">
          <div className="kh2-care-card">
            <h2 className="kh2-h2">
              {CARE.title.map((l, i) => <span key={i} className="kh2-block">{l}</span>)}
            </h2>
            {CARE.paragraphs.map((p, i) => <p key={i} className="kh2-care-p">{p}</p>)}

            <div className="kh2-stats">
              {CARE.stats.map((s) => (
                <div key={s.value} className="kh2-stat">
                  <p className="kh2-stat-v">{s.value}</p>
                  <p className="kh2-stat-l">{s.label}</p>
                </div>
              ))}
            </div>

            <Link href={CARE.cta.href} className="kh2-outline">{CARE.cta.label}</Link>
          </div>

          <div className="kh2-care-media">
            <span className="kh2-play" aria-hidden>▶</span>
          </div>
        </div>
      </section>

      {/* ══ reviews ═══════════════════════════════════════════════════════ */}
      <section className="kh2-sec">
        <div className="kh2-in">
          <span className="kh2-eyebrow">{REVIEWS.eyebrow}</span>
          <div className="kh2-headrow">
            <h2 className="kh2-h2">{REVIEWS.title}</h2>
            <div className="kh2-google">
              <span className="kh2-google-g" aria-hidden>G</span>
              <div>
                <p className="kh2-google-l">{REVIEWS.rating.label}</p>
                <p className="kh2-google-s">{REVIEWS.rating.score} <Stars /></p>
              </div>
            </div>
          </div>

          <div className="kh2-reviews">
            {/* The list is rendered twice; the track scrolls exactly one copy
                and restarts, so the join is invisible. The second copy is
                hidden from screen readers. */}
            <div className="kh2-reviews-track">
              {[0, 1].map((copy) => (
                <div className="kh2-reviews-set" key={copy} aria-hidden={copy === 1 || undefined}>
                  {REVIEWS.items.map((r) => (
                    <article key={r.name} className="kh2-review">
                      <div className="kh2-review-head">
                        <span className="kh2-review-av" aria-hidden />
                        <div>
                          <p className="kh2-review-n">{r.name}</p>
                          <p className="kh2-review-p">{r.place}</p>
                        </div>
                      </div>
                      <p className="kh2-review-q">{r.quote}</p>
                      <div className="kh2-review-foot">
                        <span className="kh2-review-src" aria-hidden>{SOURCE[r.source] || 'G'}</span>
                        <span className="kh2-review-score">4.9/5</span>
                        <Stars />
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ experts ═══════════════════════════════════════════════════════ */}
      <section className="kh2-sec">
        <div className="kh2-in">
          <p className="kh2-sub kh2-center">{EXPERTS.eyebrow}</p>
          <h2 className="kh2-h2 kh2-center">{EXPERTS.title}</h2>

          {/* Two rows of faces running edge to edge without stopping, the second
              the other way. Each row is drawn twice so the loop never shows a
              seam: the track slides exactly one copy's width, then restarts. */}
          <div className="kh2-strip" aria-hidden>
            {EXPERT_FACES.map((row, r) => (
              <div key={r} className={`kh2-strip-row${r % 2 ? ' is-rev' : ''}`}>
                <div className="kh2-strip-track">
                  {[...row, ...row].map((seed, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      className="kh2-tile"
                      src={faceUrl(seed, i)}
                      alt=""
                      loading="lazy"
                      width={112}
                      height={132}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="kh2-feats">
            {EXPERTS.cards.map((c) => (
              <div key={c.title.join(' ')} className="kh2-feat">
                <span className="kh2-feat-i" aria-hidden>{c.icon}</span>
                <h3 className="kh2-feat-t">
                  {c.title.map((l, i) => <span key={i} className="kh2-block">{l}</span>)}
                </h3>
                <ul className="kh2-feat-l">
                  {c.lines.map((l) => <li key={l}>{l}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <div className="kh2-ctarow">
            <Link href={EXPERTS.secondaryCta.href} className="kh2-outline">{EXPERTS.secondaryCta.label}</Link>
            <Link href={EXPERTS.primaryCta.href} className="kh2-btn">{EXPERTS.primaryCta.label}<Sparkle /></Link>
          </div>
        </div>
      </section>

      {/* ══ services & pricing ════════════════════════════════════════════ */}
      <section className="kh2-sec">
        <div className="kh2-in">
          <span className="kh2-eyebrow kh2-eyebrow--c">{SERVICES.eyebrow}</span>
          <h2 className="kh2-h2 kh2-center">{SERVICES.title}</h2>

          <div className="kh2-tabs kh2-tabs--scroll" ref={serviceTabsRef}>
            {SERVICES.tabs.map((t, i) => (
              <button key={t} type="button"
                className={`kh2-tab ${i === serviceTab ? 'is-on' : ''}`}
                aria-pressed={i === serviceTab}
                onClick={() => setServiceTab(i)}>{t}</button>
            ))}
          </div>

          {/* All eight panels sit on one track; the tab (or a dot) slides it
              along. The next panel peeks in from the right, as in the artboard. */}
          <div
            className="kh2-slides" role="region" aria-label={SERVICES.title}
            onTouchStart={onServiceTouchStart} onTouchEnd={onServiceTouchEnd}
          >
            <div
              className="kh2-track"
              style={{ transform: `translateX(calc(${-serviceTab} * (var(--pw) + var(--pg))))` }}
            >
              {SERVICES.panels.map((p, i) => (
                <article
                  key={p.title.join(' ')}
                  className={`kh2-slide ${i === serviceTab ? 'is-on' : ''}`}
                  aria-hidden={i === serviceTab ? undefined : true}
                >
                  <div className="kh2-slide-media">
                    {p.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      // Off-screen sideways never counts as "near", so lazy panels
                      // would blink in on switch; load this one and the next early.
                      <img
                        src={p.image} alt={p.imageAlt || ''} width={900} height={600}
                        loading={i <= serviceTab + 1 ? 'eager' : 'lazy'}
                      />
                    )}
                  </div>
                  <div className="kh2-slide-body">
                    <h3 className="kh2-slide-t">
                      {p.title.map((l, j) => <span key={j} className="kh2-block">{l}</span>)}
                    </h3>
                    <p className="kh2-slide-lead">{p.lead}</p>
                    <ul className="kh2-slide-l">{p.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
                    <Link
                      href={p.href || BOOK}
                      className="kh2-btn kh2-btn--sm"
                      tabIndex={i === serviceTab ? undefined : -1}
                    >
                      {p.price}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="kh2-dots">
            {SERVICES.panels.map((p, i) => (
              <button
                key={p.title.join(' ')} type="button"
                aria-label={SERVICES.tabs[i]} aria-current={i === serviceTab || undefined}
                className={i === serviceTab ? 'is-on' : ''}
                onClick={() => setServiceTab(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══ faq ═══════════════════════════════════════════════════════════ */}
      <section className="kh2-sec">
        <div className="kh2-in">
          <h2 className="kh2-h2 kh2-center kh2-h2--big">{FAQ.title}</h2>

          <div className="kh2-tabs kh2-tabs--center">
            {FAQ.tabs.map((t) => (
              <button key={t} type="button"
                className={`kh2-tab ${t === faqTab ? 'is-on' : ''}`}
                onClick={() => { setFaqTab(t); setOpenFaq(null); }}>{t}</button>
            ))}
          </div>

          <div className="kh2-faq">
            {faqs.map((f, i) => (
              <div key={f.q} className="kh2-faq-row">
                <button type="button" className="kh2-faq-q"
                  aria-expanded={openFaq === i}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{f.q}</span>
                  <span className="kh2-faq-plus" aria-hidden>{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <p className="kh2-faq-a">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ blogs & events ════════════════════════════════════════════════ */}
      <section className="kh2-sec">
        <div className="kh2-in">
          <span className="kh2-eyebrow kh2-eyebrow--c">{BLOGS.eyebrow}</span>
          <h2 className="kh2-h2 kh2-center">{BLOGS.title}</h2>

          <div className="kh2-posts">
            {(posts.length ? posts : [0, 1, 2]).map((p, i) => {
              const post = typeof p === 'object' ? p : null;
              return (
                <Link key={post?.slug || i} href={post ? `/blog/${post.slug}` : '/blog'} className="kh2-post">
                  {post?.featured_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="kh2-post-img" src={post.featured_image_url} alt={post.title} />
                  ) : <span className="kh2-post-img is-blank" aria-hidden />}
                  <p className="kh2-post-t">
                    {post?.title || EXPERTS.eyebrow}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ final cta ═════════════════════════════════════════════════════ */}
      <section className="kh2-final">
        <div className="kh2-in kh2-center">
          <h2 className="kh2-h2 kh2-h2--big">{FINAL_CTA.title}</h2>
          <div className="kh2-ctarow kh2-ctarow--c">
            <span className="kh2-outline">{FINAL_CTA.secondary}</span>
            <Link href={BOOK} className="kh2-btn">{FINAL_CTA.primary}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

const CSS = `
.kh2{
  --deep:#012F23; --header:#063327; --green:#189E4F; --green-d:#12813F;
  --band:#D5FFC4; --band-t:#E6FFDE; --tint:#F9FFF8; --ink:#000; --body:#3B3B3B; --muted:#6B7280;
  --line:rgba(38,34,34,.13); --page:#FFFFFF;
  --sans:'Inter',ui-sans-serif,system-ui,sans-serif;
  --text:'Inter',ui-sans-serif,system-ui,sans-serif;
  background:var(--page);
}
.kh2 *{box-sizing:border-box;}
.kh2-in{max-width:1180px;margin:0 auto;padding:0 24px;}
/* Viewport-relative so a section still fits one screen under the fixed
   header on a 768px-tall laptop; 84px is the artboard value on a tall screen. */
.kh2-sec{padding:clamp(122px,16.3vh,176px) 0;}
.kh2-center{text-align:center;}
.kh2-block{display:block;}

.kh2-h1{
  font-family:var(--sans)!important;font-size:58px!important;font-weight:700!important;
  line-height:1.08em!important;letter-spacing:-.02em!important;color:var(--deep)!important;margin:0 0 22px;
}
.kh2-h1 span{display:block;}
/* The rotating line holds its own row so the tail and everything below it stay
   put as phrases of different length cycle through. */
/* Grid-stacked: the hidden sizers set the height, the visible word overlays. */
.kh2-h1-rot{display:grid!important;position:relative;}
/* bottom-aligned: a one-line title sits on the tail line, and the spare
   height reserved for two-line titles falls above it, not in the middle */
.kh2-h1-rot > span{grid-area:1 / 1;align-self:end;}
.kh2-h1-size{visibility:hidden;}
.kh2-h1-word{display:block;animation:kh2-word-in .5s cubic-bezier(.22,.7,.3,1) both;}
@keyframes kh2-word-in{
  from{opacity:0;transform:translateY(18px);}
  to{opacity:1;transform:none;}
}
/* Reduced motion: the word still changes, it just fades in instead of rising. */
@keyframes kh2-fade-in{from{opacity:0;}to{opacity:1;}}
@media (prefers-reduced-motion:reduce){
  .kh2-h1-word{animation:kh2-fade-in .4s ease both;}
}
.kh2-h2{
  font-family:var(--sans)!important;font-size:31px!important;font-weight:600!important;
  line-height:1.25em!important;letter-spacing:-.02em!important;color:var(--ink)!important;margin:0 0 10px;
}
.kh2-h2--big{font-size:44px!important;font-weight:700!important;}
.kh2-sub{
  font-family:var(--text)!important;font-size:16px!important;font-weight:400!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--body)!important;margin:0 0 14px;
}
.kh2-eyebrow{
  display:inline-block;background:var(--tint);border-radius:6px;padding:5px 12px;margin-bottom:14px;
  font-family:var(--text)!important;font-size:14px!important;letter-spacing:0!important;color:var(--body)!important;
}
.kh2-eyebrow--c{display:block;width:fit-content;margin-left:auto;margin-right:auto;}
.kh2-headrow{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:30px;}

.kh2-btn{
  display:inline-flex;align-items:center;gap:9px;background:var(--green);color:#fff!important;
  text-decoration:none;border:0;cursor:pointer;padding:14px 26px;border-radius:9px;
  font-family:var(--text)!important;font-size:16px!important;font-weight:600!important;letter-spacing:0!important;
  transition:background .18s ease;white-space:nowrap;
}
.kh2-btn:hover{background:var(--green-d);}
.kh2-btn--sm{padding:11px 20px;font-size:15px!important;border-radius:8px;}
.kh2-outline{
  display:inline-flex;align-items:center;justify-content:center;background:#fff;color:var(--deep)!important;
  text-decoration:none;border:1px solid rgba(1,47,35,.28);padding:13px 26px;border-radius:9px;
  font-family:var(--text)!important;font-size:16px!important;letter-spacing:0!important;white-space:nowrap;
}
/* On the green care card the button is an outline only — no fill, so the card
   shows through. Scoped here so the white button in the experts row is left
   alone. */
.kh2-care-card .kh2-outline{
  background:transparent;border-color:rgba(1,47,35,.38);
  padding:9px 18px;border-radius:8px;font-size:14px!important;
}
.kh2-care-card .kh2-outline:hover{border-color:var(--deep);}
.kh2-outline:hover{background:var(--tint);}
/* Centred pair, as in the artboard — it was ranged left. The buttons there
   are wider and shallower than our default (about 24pt tall), so they are
   restyled here rather than everywhere .kh2-btn is used. */
.kh2-ctarow{display:flex;gap:14px;flex-wrap:wrap;margin-top:16px;justify-content:center;}
.kh2-ctarow .kh2-btn,.kh2-ctarow .kh2-outline{
  min-width:220px;justify-content:center;padding:8px 28px;font-size:15px!important;
}
.kh2-ctarow--c{justify-content:center;}
/* The pair inside the arch is narrower than the one under the experts cards,
   and the first is an outline only — no fill, black label — so the green band
   shows through it. */
.kh2-ctarow--c .kh2-btn,.kh2-ctarow--c .kh2-outline{min-width:168px;padding:9px 22px;}
.kh2-ctarow--c .kh2-outline{
  background:transparent;border:1px solid rgba(0,0,0,.4);color:#000!important;
}
.kh2-ctarow--c .kh2-outline:hover{border-color:#000;background:transparent;}

/* ---- hero ---- */
/* Same ground as the page so the foliage does not sit on a visible seam.
   The vertical rhythm is viewport-relative so the whole hero — greenery and
   stat card included — fits above the fold on a laptop. At fixed spacing it ran
   43px past the bottom of a 768px screen and clipped the foliage. */
.kh2-hero{
  position:relative;overflow:hidden;background:var(--page);
  /* One screen exactly, under the 63px fixed header. Column flex with an auto
     top margin on the foliage means the leftover height is absorbed by the gap
     above the greenery, so the hero neither runs past the fold nor leaves a
     band of empty page under it. */
  display:flex;flex-direction:column;
  /* On a very tall window an exact 100vh hero opens a 300px+ void between the
     search card and the greenery, so the fill stops at 860px; past ~920px tall
     the next section simply starts a little above the fold. min() rather than
     max-height because min-height always wins over max-height. */
  min-height:min(calc(100vh - 63px), 860px);
  padding:clamp(40px,7vh,88px) 0 0;
}
/* width:100% matters: .kh2-in carries margin:0 auto, and an auto margin on a
   flex item cancels the stretch, so without it this box shrink-wraps its text
   and the search card resizes as the headline rotates. */
.kh2-hero-in{text-align:center;position:relative;z-index:2;flex:0 0 auto;width:100%;margin-bottom:clamp(28px,5vh,62px);}
.kh2-hero-sub{
  font-family:var(--text)!important;font-size:19px!important;letter-spacing:0!important;
  color:var(--body)!important;margin:0 0 14px;
}
/* Fixed 560 wide whatever the headline is doing. */
.kh2-search{
  width:100%;max-width:560px;margin:0 auto;background:#F7FFF3;border-radius:18px;padding:14px;
  box-shadow:0 10px 40px rgba(24,158,79,.08);
}
.kh2-search-input{
  width:100%;min-height:104px;resize:vertical;border:1px solid #BFE3CB;border-radius:11px;
  padding:16px 18px;background:#fff;color:var(--ink);
  font-family:var(--text)!important;font-size:16px!important;line-height:1.5em!important;letter-spacing:0!important;
}
.kh2-search-input::placeholder{color:#A8A8A8;}
.kh2-search-input:focus{outline:none;border-color:var(--green);box-shadow:0 0 0 3px rgba(24,158,79,.14);}
.kh2-search-row{display:flex;gap:14px;margin-top:14px;flex-wrap:wrap;}
.kh2-search-box{position:relative;}
.kh2-search-spark,.kh2-match,.kh2-consult,.kh2-hero-actions{display:none;}
.kh2-hero-panel{display:contents;}
.kh2-step-dots{display:none;}
.kh2-offer-inline{display:none;}
.kh2-concern{
  flex:1;min-width:220px;display:inline-flex;align-items:center;justify-content:space-between;gap:10px;
  background:#fff;border:1px solid #BFE3CB;border-radius:9px;padding:14px 18px;cursor:pointer;
  font-family:var(--text)!important;font-size:16px!important;letter-spacing:0!important;color:var(--ink)!important;
}
.kh2-concern:hover{border-color:var(--green);}
/* The sparkles are the design's green, not the button's text colour. */
.kh2-trio{color:var(--green);flex:none;}
.kh2-book{
  flex:1;min-width:220px;display:inline-flex;align-items:center;justify-content:center;gap:10px;
  background:var(--green);color:#fff!important;text-decoration:none;border-radius:9px;padding:14px 22px;
  font-family:var(--text)!important;font-size:16px!important;font-weight:600!important;letter-spacing:0!important;
}
.kh2-book:hover{background:var(--green-d);}
/* The looped clip runs along the foot of the hero, full width. */
/* margin-top:auto eats the slack; the floor for the gap is the margin-bottom
   on .kh2-hero-in, kept there so the badge (absolute, offset from this box)
   is not pushed off the band. */
.kh2-foliage{position:relative;min-height:clamp(148px,20vh,190px);margin-top:auto;pointer-events:none;}
/* Full width at the clip's own 8:1, so nothing is cropped off the top and no
   gap is left at the sides. height:auto lets the band grow on a wide monitor
   rather than the frame being scaled up and trimmed; bottom:-1px keeps a
   hairline off the section edge. The clip's own top row is near-white, which
   is the hero's background, so the band has no visible seam. */
/* The band is its own layer: frame one of the clip is its background, so the
   greenery is painted from the first response, before any video exists or any
   script runs. Its aspect ratio is the clip's, so the height follows the width
   exactly — nothing is cropped off the top, nothing is left white at the sides.
   bottom:-1px keeps a hairline off the section edge. Stills are 21KB and 15KB. */
.kh2-clips{
  position:absolute;left:0;right:0;bottom:-1px;width:100%;aspect-ratio:1808/226;
  background:url('/hero-calm-desktop.webp') center bottom / 100% 100% no-repeat;
  pointer-events:none;
}
.kh2-clips.is-mob{aspect-ratio:750/200;background-image:url('/hero-calm-mobile.webp');}
.kh2-clip{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:fill;}
/* The copy waiting its turn. Hidden with opacity, never display:none, because a
   browser will not keep an undisplayed video decoding — and a stalled decoder
   is the flash we are removing. */
.kh2-clip.is-buffer{opacity:0;}
/* Floats near the top of the greenery band, well clear of the section edge, and
   above the bushes rather than sitting down among them. */
.kh2-badge-wrap{position:absolute;top:clamp(22px,4.2vh,52px);left:0;right:0;width:330px;margin:0 auto;z-index:3;}
/* The card peeking out underneath. Inset each side, showing ~9px of its base. */
.kh2-badge-stack{
  position:absolute;left:16px;right:16px;bottom:-9px;height:30px;
  background:#fff;border:1px solid var(--line);border-radius:12px;
  box-shadow:0 5px 16px rgba(16,14,14,.05);
}
/* The deck holds the height; the cards stack inside it, one over another. */
.kh2-badge-deck{position:relative;height:85px;}
.kh2-badge{
  position:absolute;inset:0;
  display:flex;gap:12px;align-items:center;
  background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px 18px;
  box-shadow:0 6px 22px rgba(16,14,14,.07);
}
/* A deck, not a crossfade: the card being replaced drops back and shrinks — as
   if being pushed under the pile — while the next one rises over it. Without
   this the two cards sat in exactly the same place and only the words seemed to
   change. */
.kh2-badge.is-out{z-index:1;animation:kh2-card-under .55s cubic-bezier(.4,0,.2,1) both;}
@keyframes kh2-card-under{
  0%{opacity:1;transform:none;box-shadow:0 6px 22px rgba(16,14,14,.07);}
  55%{opacity:.55;transform:translateY(7px) scale(.955);}
  100%{opacity:0;transform:translateY(11px) scale(.94);box-shadow:0 2px 8px rgba(16,14,14,.04);}
}
.kh2-badge.is-in{z-index:2;animation:kh2-card-in .55s cubic-bezier(.22,.7,.3,1) both;}
/* Opacity reaches 1 by 35%, while the card is still low and clear of the copy
   underneath. Fading the whole way up would leave both cards' text readable at
   once, which looked like a rendering fault. */
@keyframes kh2-card-in{
  0%{opacity:0;transform:translateY(30px) scale(.93);box-shadow:0 2px 8px rgba(16,14,14,.05);}
  40%{opacity:1;transform:translateY(13px) scale(.975);}
  100%{opacity:1;transform:none;box-shadow:0 6px 22px rgba(16,14,14,.07);}
}
@media (prefers-reduced-motion:reduce){
  .kh2-badge.is-in{animation:kh2-fade-in .45s ease both;}
  .kh2-badge.is-out{animation:kh2-fade-out .45s ease both;}
}
.kh2-badge-i{font-size:22px;line-height:1.2;align-self:flex-start;}
.kh2-badge-t{
  font-family:var(--text)!important;font-size:16px!important;font-weight:600!important;
  line-height:1.3em!important;letter-spacing:0!important;color:var(--green)!important;margin:0 0 2px;
}
.kh2-badge-b{
  font-family:var(--text)!important;font-size:14px!important;line-height:1.45em!important;
  letter-spacing:0!important;color:var(--body)!important;margin:0;
}

/* ---- therapist cards ---- */
.kh2-filters{display:flex;gap:14px;align-items:center;margin:16px 0 16px;flex-wrap:wrap;}
.kh2-filter{
  display:inline-flex;align-items:center;justify-content:space-between;gap:26px;min-width:210px;
  /* Same 12px radius as the therapist cards, and shallower than the default
     control height. */
  background:#fff;border:1px solid var(--line);border-radius:12px;padding:0 18px;cursor:pointer;
  font-family:var(--text)!important;font-size:15px!important;letter-spacing:0!important;color:var(--body)!important;
  position:relative;min-height:37px;
}
.kh2-filter:hover,.kh2-filter.is-open{border-color:var(--green);}

/* ── Filters popover ────────────────────────────────────────────────────────
   The icon button opens a real filter sheet rather than more dropdowns:
   sections of toggle chips, a price slider, and Clear / Apply. Everything the
   sheet offers is built from the therapist data, so no control here is
   decorative — a chip exists only if some therapist carries that value. */
.kh2-filter-anchor{position:relative;margin-left:auto;}
.kh2-filter-icon{
  display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);
  border-radius:12px;min-height:37px;padding:0 16px;cursor:pointer;color:var(--body);
  font-family:var(--text)!important;font-size:15px!important;letter-spacing:0!important;
}
.kh2-filter-icon.is-open{border-color:var(--green);color:var(--green);}
.kh2-filter-count{
  display:inline-flex;align-items:center;justify-content:center;min-width:19px;height:19px;
  border-radius:999px;background:var(--green);color:#fff;font-size:12px;padding:0 5px;
}
/* Catches the click that closes the sheet. */
.kh2-filter-scrim{position:fixed;inset:0;z-index:40;background:none;border:0;cursor:default;}
.kh2-panel{
  position:absolute;top:calc(100% + 10px);right:0;z-index:41;width:344px;max-width:88vw;
  max-height:min(560px,72vh);overflow-y:auto;
  background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px 16px;
  box-shadow:0 18px 50px rgba(16,14,14,.16);
}
.kh2-panel-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.kh2-panel-h{
  font-family:var(--text)!important;font-size:17px!important;font-weight:600!important;
  letter-spacing:0!important;color:var(--ink)!important;margin:0;
}
.kh2-panel-x{
  background:none;border:0;cursor:pointer;font-size:22px;line-height:1;color:var(--muted);padding:0 2px;
}
.kh2-panel-sec{margin-bottom:16px;}
.kh2-panel-row{display:flex;align-items:baseline;justify-content:space-between;}
.kh2-panel-l{
  font-family:var(--text)!important;font-size:12px!important;font-weight:600!important;
  letter-spacing:.06em!important;text-transform:uppercase;color:var(--muted)!important;margin:0 0 9px;
}
.kh2-panel-v{
  font-family:var(--text)!important;font-size:13px!important;letter-spacing:0!important;color:var(--body)!important;
}
.kh2-fchips{display:flex;flex-wrap:wrap;gap:8px;}
/* flex:0 0 auto — globals.css stretches bare buttons to the row. */
.kh2-fchip{
  flex:0 0 auto;width:auto;
  background:#fff;border:1px solid var(--line);border-radius:999px;padding:7px 14px;cursor:pointer;
  font-family:var(--text)!important;font-size:14px!important;letter-spacing:0!important;color:var(--body)!important;
}
.kh2-fchip:hover{border-color:rgba(1,47,35,.35);}
.kh2-fchip.is-on{background:#EAF9E4;border-color:var(--green);color:var(--deep)!important;}
.kh2-range{
  -webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:999px;
  background:linear-gradient(90deg,#BFE8A8,var(--green));outline:none;margin:2px 0 0;
}
.kh2-range::-webkit-slider-thumb{
  -webkit-appearance:none;width:18px;height:18px;border-radius:50%;
  background:var(--green);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.25);cursor:pointer;
}
.kh2-range::-moz-range-thumb{
  width:18px;height:18px;border-radius:50%;background:var(--green);border:2px solid #fff;cursor:pointer;
}
/* Sticky so Clear / Apply stay reachable when the sections scroll. */
.kh2-panel-foot{position:sticky;bottom:-16px;display:flex;gap:10px;margin-top:18px;padding:12px 0 4px;background:#fff;}
.kh2-panel-clear,.kh2-panel-apply{
  flex:1;border-radius:12px;padding:11px 0;cursor:pointer;
  font-family:var(--text)!important;font-size:15px!important;font-weight:600!important;letter-spacing:0!important;
}
.kh2-panel-clear{background:#fff;border:1px solid var(--line);color:var(--body)!important;}
.kh2-panel-apply{background:var(--green);border:1px solid var(--green);color:#fff!important;}
.kh2-panel-apply:hover{background:var(--green-d);}
.kh2-filter:focus-within{border-color:var(--green);}
.kh2-filter-clear{
  background:none;border:0;cursor:pointer;padding:6px 8px;
  font-family:var(--text)!important;font-size:14px!important;letter-spacing:0!important;
  color:var(--green)!important;text-decoration:underline;
}
.kh2-filter-empty{
  font-family:var(--text)!important;font-size:15px!important;letter-spacing:0!important;
  color:var(--body)!important;margin:0 0 18px;
}
.kh2-tgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;}
/* Therapist card — measured off the first card of the Sep-26 PDF (rendered at
   2x and sampled). The design's card is 240pt wide inside a 1024pt page; every
   value below is that measurement scaled to our 363px card (x1.51):

     card              240 -> 363      head band      87 -> 132
     portrait width     91 -> 137      head inset   13.7 -> 20
     meta inset       26.6 -> 40       row rhythm   18.8 -> 28 (centre to centre)
     Book Now       69 x 27 -> 104 x 40

   Note the meta rows (hours / price / voice) are indented twice as far as the
   name and the bio — that stagger is in the design, not a mistake. */
.kh2-tcard{
  background:linear-gradient(180deg,#fff 0%,#F6FFF3 100%);
  border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;
}
.kh2-tcard.is-plain{background:#fff;}
/* Fixed height, so the View Profile button and everything under it lands in the
   same place on every card whatever the name does. Tall enough for a two-line name,
   a two-line designation and the button below them (it was 118px and the button ran
   into longer designations). */
.kh2-tcard-head{
  /* The band is an inset panel, not a full-bleed header: a small margin all
     round and a tighter radius than the card itself. */
  position:relative;overflow:hidden;height:150px;box-sizing:border-box;
  margin:6px;border-radius:10px;padding:18px 18px 12px;
  background:linear-gradient(180deg,#F0FFEE 0%,#E2FFD7 100%);
}
.kh2-tcard.is-plain .kh2-tcard-head{background:#FBFBFB;}
/* The text column clears the portrait; the button is pushed to the band foot. */
.kh2-tcard-head > div{
  position:relative;z-index:1;display:flex;flex-direction:column;align-items:flex-start;
  height:100%;width:60%;
}
.kh2-tcard-n{
  font-family:var(--text)!important;font-size:16px!important;font-weight:600!important;
  letter-spacing:0!important;color:var(--ink)!important;margin:0 0 1px;line-height:1.25em!important;
  display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;
}
.kh2-tcard-r{
  font-family:var(--text)!important;font-size:13.5px!important;letter-spacing:0!important;
  /* bottom margin: a guaranteed gap above the View Profile button */
  color:var(--body)!important;margin:0 0 12px;line-height:1.3em!important;
  display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;
}
.kh2-viewprofile{
  /* Pill, transparent, on a darker line than the card border. */
  margin-top:auto;flex:none;display:inline-block;background:transparent;border:1px solid rgba(1,47,35,.45);
  border-radius:999px;padding:5px 15px;
  text-decoration:none;font-family:var(--text)!important;font-size:13px!important;
  letter-spacing:0!important;color:var(--ink)!important;
}
.kh2-viewprofile:hover{border-color:var(--deep);}
/* In the design the portrait is a cut-out sitting in the band's bottom-right
   corner and bleeding off both edges; with rectangular photos the closest
   honest equivalent is a full-bleed crop of the band's right-hand third. */
.kh2-tcard-img{
  position:absolute;right:0;bottom:0;width:38%;height:100%;
  object-fit:cover;object-position:top center;border-radius:16px 0 0 0;
}
.kh2-tcard-img.is-blank{background:linear-gradient(160deg,#D8F0DC,#BFE3CB);}
.kh2-tcard-meta{list-style:none!important;margin:14px 0 0;padding:0 20px 0 40px;display:flex;flex-direction:column;gap:12px;}
.kh2-tcard-meta li{
  display:flex!important;align-items:center;gap:10px;
  font-family:var(--text)!important;font-size:14px!important;letter-spacing:0!important;color:var(--ink)!important;
}
.kh2-wave{display:flex;align-items:center;gap:10px;margin-top:12px;padding:0 20px 0 40px;}
.kh2-wave-play{color:var(--body);font-size:12px;}
.kh2-wave-bars{
  flex:1;height:18px;
  background:repeating-linear-gradient(90deg,#9AA5A0 0 2px,transparent 2px 5px);
  mask-image:linear-gradient(90deg,#000 0 100%);opacity:.55;
}
.kh2-tcard-bio{
  font-family:var(--text)!important;font-size:14px!important;line-height:1.45em!important;
  letter-spacing:0!important;color:var(--body)!important;margin:12px 0 0;padding:0 20px;flex:1;
}
.kh2-tcard-foot{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:12px 20px 14px;}
.kh2-avail-l{font-family:var(--text)!important;font-size:13px!important;letter-spacing:0!important;color:var(--ink)!important;margin:0 0 2px;}
.kh2-avail-v{font-family:var(--text)!important;font-size:13px!important;letter-spacing:0!important;color:var(--green)!important;margin:0;}
/* Card CTA only — the services section keeps the default small button. */
.kh2-tcard-foot .kh2-btn--sm{min-width:104px;height:40px;border-radius:14px;padding:0 18px;font-size:15px!important;justify-content:center;}
.kh2-more{
  display:inline-flex;align-items:center;gap:8px;margin-top:10px;background:#fff;
  border:1px solid var(--line);border-radius:12px;padding:11px 26px;text-decoration:none;
  font-family:var(--text)!important;font-size:15px!important;letter-spacing:0!important;color:var(--body)!important;
}

/* ---- how it works ---- */
/* Sampled from the Sep-26 artboard: card 236pt wide with a 31pt gutter (13%),
   height 254pt — a squarer card than the one we had. The fill is a very light
   green that deepens slightly downwards (#F7FFF5 -> #F1FFF0), edged with a soft
   shadow rather than a line. */
.kh2-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:28px;}
.kh2-step{
  background:linear-gradient(180deg,#F7FFF5 0%,#F1FFF0 100%);
  border:1px solid rgba(24,158,79,.10);border-radius:16px;
  box-shadow:0 6px 22px rgba(16,14,14,.05);
  padding:18px 18px 16px;display:flex;flex-direction:column;text-align:center;
}
.kh2-step-n{
  font-family:var(--sans)!important;font-size:34px!important;font-weight:500!important;
  letter-spacing:0!important;color:var(--deep)!important;margin:0 0 4px;line-height:1.1em!important;
}
.kh2-step-t{
  font-family:var(--text)!important;font-size:18px!important;font-weight:400!important;
  letter-spacing:0!important;color:var(--ink)!important;margin:0 0 16px;line-height:1.3em!important;
}
.kh2-step-body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:118px;}
.kh2-chips{list-style:none!important;margin:0;padding:0;display:flex;flex-direction:column;align-items:center;gap:9px;width:100%;}
.kh2-chips li{
  display:inline-flex!important;align-items:center;gap:8px;background:#fff;border:1px solid rgba(24,158,79,.14);
  border-radius:999px;padding:8px 15px;box-shadow:0 2px 8px rgba(16,14,14,.05);max-width:100%;
  font-family:var(--text)!important;font-size:13.5px!important;letter-spacing:0!important;color:var(--ink)!important;
}
.kh2-chip-i{color:var(--green);display:inline-flex;}
.kh2-avatars{display:flex;align-items:center;justify-content:center;}
.kh2-av{width:38px;height:38px;border-radius:50%;border:2px solid #fff;margin-left:-7px;background:#CFE7D4;}
/* The centre face is larger and sits proud of the row in the artboard. */
.kh2-av--2{width:52px;height:52px;z-index:1;}
.kh2-av--0{background:#E4CDBF;} .kh2-av--1{background:#CFE7D4;} .kh2-av--2{background:#BFD9E7;}
.kh2-av--3{background:#E7DCBF;} .kh2-av--4{background:#DCCFE7;}
.kh2-match-n{font-family:var(--text)!important;font-size:15px!important;font-weight:600!important;letter-spacing:0!important;color:var(--ink)!important;margin:6px 0 0;}
.kh2-match-r{font-family:var(--text)!important;font-size:13px!important;letter-spacing:0!important;color:var(--body)!important;margin:0;}
.kh2-slot{
  display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid rgba(24,158,79,.14);
  border-radius:999px;padding:9px 18px;margin:0;box-shadow:0 2px 8px rgba(16,14,14,.05);
  font-family:var(--text)!important;font-size:14px!important;letter-spacing:0!important;color:var(--ink)!important;
}
.kh2-days{list-style:none!important;margin:8px 0 0;padding:0;display:flex;gap:6px;}
.kh2-days li{
  display:flex!important;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;
  font-family:var(--text)!important;font-size:13px!important;letter-spacing:0!important;color:var(--body)!important;
}
.kh2-days li.is-on{border:1px solid rgba(24,158,79,.35);background:#fff;color:var(--ink)!important;}
.kh2-join{display:flex;gap:8px;}
.kh2-join-a{width:56px;height:74px;border-radius:8px;background:linear-gradient(160deg,#CFE7D4,#A9CDB2);}
.kh2-join-b{width:104px;height:74px;border-radius:8px;background:linear-gradient(160deg,#E4CDBF,#CBA894);}
.kh2-step-c{
  font-family:var(--text)!important;font-size:12.5px!important;line-height:1.45em!important;
  letter-spacing:0!important;color:var(--muted)!important;margin:12px 0 0;
}

/* ---- offers ---- */
/* The artboard splits this 330:275 (1.2:1) with a 20pt gutter, and the panel is
   a white card like the rows beside it — not the dark slab we had. */
.kh2-offers{display:grid;grid-template-columns:1.2fr 1fr;gap:22px;margin-top:34px;}
.kh2-offer-panel{
  position:relative;border-radius:14px;padding:34px 36px;overflow:hidden;
  background:#fff;border:1px solid var(--line);
  /* No floor of its own: the four rows beside it set the height, as in the
     artboard where both columns end on the same line. */
  display:flex;flex-direction:column;
}
.kh2-offer-h{
  font-family:var(--sans)!important;font-size:27px!important;font-weight:600!important;
  line-height:1.22em!important;letter-spacing:-.01em!important;color:var(--deep)!important;margin:0 0 12px;
}
.kh2-offer-h span{display:block;}
.kh2-offer-lead{
  font-family:var(--text)!important;font-size:14px!important;line-height:1.5em!important;
  letter-spacing:0!important;color:var(--body)!important;margin:0 0 20px;max-width:33ch;
}
/* Green pill next to a quiet text link, as drawn. */
.kh2-offer-cta{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin:0 0 22px;}
.kh2-offer-price{
  background:var(--green);color:#fff!important;text-decoration:none;border-radius:999px;padding:9px 20px;
  font-family:var(--text)!important;font-size:14px!important;font-weight:600!important;letter-spacing:0!important;
}
.kh2-offer-price:hover{background:var(--green-d);}
.kh2-offer-link{
  display:inline-flex;align-items:center;gap:7px;text-decoration:none;
  font-family:var(--text)!important;font-size:14px!important;letter-spacing:0!important;color:var(--ink)!important;
}
.kh2-offer-link-i{
  display:inline-flex;align-items:center;justify-content:center;width:19px;height:19px;
  border:1px solid var(--line);border-radius:50%;color:var(--body);
}
.kh2-offer-link-i svg{width:13px;height:13px;}
.kh2-offer-list{list-style:none!important;margin:0 0 14px;padding:0;}
.kh2-offer-list li{
  display:flex!important;align-items:flex-start;gap:9px;margin:0 0 9px;
  font-family:var(--text)!important;font-size:14px!important;line-height:1.4em!important;
  letter-spacing:0!important;color:var(--body)!important;
}
.kh2-offer-i{color:var(--green);display:inline-flex;flex:none;margin-top:1px;}
.kh2-offer-pack{
  font-family:var(--text)!important;font-size:13px!important;letter-spacing:0!important;
  color:var(--muted)!important;margin:auto 0 0;
}
/* space-between so the four rows finish level with the panel beside them. */
.kh2-offer-list-col{display:flex;flex-direction:column;justify-content:space-between;gap:14px;}
/* width:100% — a <button> shrink-wraps its text rather than filling the column,
   so the four rows came out 443 / 441 / 352 / 359px wide in a 505px column. */
.kh2-offer-row{
  display:flex;align-items:flex-start;justify-content:space-between;gap:16px;text-align:left;
  width:100%;box-sizing:border-box;
  background:#fff;border:1px solid var(--line);border-radius:12px;padding:20px 22px;cursor:pointer;
  color:var(--body);transition:box-shadow .18s ease,border-color .2s ease,border-radius .25s ease;
}
.kh2-offer-chev{flex:none;transition:transform .3s cubic-bezier(.4,0,.2,1);}
.kh2-offer-row.is-on .kh2-offer-chev{transform:rotate(90deg);}

/* Panel hand-over (laptop): the old entry fades up and out, then the new one
   rises in — one after the other, never both on screen (the new entry's delay
   is longer than the old one's exit). The leaving copy is laid over the panel's
   padding box so the panel's height is set by the incoming entry alone.
   Transform and opacity only, so the compositor runs it. */
.kh2-offer-body{display:flex;flex-direction:column;flex:1 1 auto;min-height:0;}
.kh2-offer-body.is-out{
  position:absolute;inset:34px 36px;pointer-events:none;
  animation:kh2-offer-out .18s cubic-bezier(.4,0,1,1) both;
}
.kh2-offer-body.is-in{animation:kh2-offer-in .38s .2s cubic-bezier(0,0,.2,1) both;}
.kh2-offer-body.is-first{animation:none;}
@keyframes kh2-offer-out{from{opacity:1;transform:translate3d(0,0,0);}to{opacity:0;transform:translate3d(0,-6px,0);}}
@keyframes kh2-offer-in{from{opacity:0;transform:translate3d(0,10px,0);}to{opacity:1;transform:translate3d(0,0,0);}}
@media (prefers-reduced-motion:reduce){
  .kh2-offer-body.is-out{animation:kh2-fade-out .16s ease-in both;}
  .kh2-offer-body.is-in{animation:kh2-fade-in .26s .18s ease-out both;}
  .kh2-offer-body.is-first{animation:none;}
  .kh2-offer-chev{transition:none;}
}
.kh2-offer-row:hover{box-shadow:0 4px 18px rgba(16,14,14,.07);}
.kh2-offer-row.is-on{border-color:#5EA277;}
.kh2-offer-t{
  display:block;font-family:var(--sans)!important;font-size:20px!important;font-weight:500!important;
  letter-spacing:0!important;color:var(--ink)!important;margin-bottom:4px;
}
.kh2-offer-n{
  display:block;font-family:var(--text)!important;font-size:14px!important;
  letter-spacing:0!important;color:var(--muted)!important;
}

/* ---- care ---- */
/* The artboard gives the copy card 399pt against a 220pt photo — 1.8:1. */
.kh2-care{display:grid;grid-template-columns:1.8fr 1fr;gap:22px;align-items:stretch;}
.kh2-care-card{background:#EFFFEA;border-radius:16px;padding:32px;}
.kh2-care-p{
  font-family:var(--text)!important;font-size:15.5px!important;line-height:1.6em!important;
  letter-spacing:0!important;color:var(--body)!important;margin:0 0 14px;
}
.kh2-stats{display:grid;grid-template-columns:1fr 1fr;gap:20px 34px;margin:22px 0 24px;}
.kh2-stat{border-left:2px solid var(--deep);padding-left:16px;}
.kh2-stat-v{
  font-family:var(--sans)!important;font-size:38px!important;font-weight:500!important;
  line-height:1.1em!important;letter-spacing:-.01em!important;color:var(--deep)!important;margin:0 0 6px;
}
.kh2-stat-l{
  font-family:var(--text)!important;font-size:15px!important;line-height:1.45em!important;
  letter-spacing:0!important;color:var(--ink)!important;margin:0;
}
.kh2-care-media{
  position:relative;border-radius:16px;min-height:520px;
  background:linear-gradient(160deg,#D9D2CC,#B9AFA7);display:flex;align-items:center;justify-content:center;
}
.kh2-play{
  width:64px;height:64px;border-radius:12px;background:var(--green);color:#fff;
  display:flex;align-items:center;justify-content:center;font-size:22px;
}

/* ---- reviews ---- */
.kh2-google{display:flex;align-items:center;gap:12px;}
.kh2-google-g{
  width:38px;height:38px;border-radius:50%;background:#fff;border:1px solid var(--line);
  display:flex;align-items:center;justify-content:center;font-weight:700;color:#4285F4;
}
.kh2-google-l{font-family:var(--text)!important;font-size:13px!important;letter-spacing:0!important;color:var(--body)!important;margin:0;}
.kh2-google-s{font-family:var(--text)!important;font-size:14px!important;letter-spacing:0!important;color:var(--ink)!important;margin:0;}
.kh2-stars{color:#F5A623;letter-spacing:1px;}
/* Full-bleed: the row breaks out of the 1180px container and runs the width of
   the window, drifting continuously. Held still for anyone who has asked for
   reduced motion, and paused while the pointer is over it so a quote can
   actually be read. */
.kh2-reviews{
  width:100vw;margin-left:calc(50% - 50vw);
  overflow:hidden;padding-bottom:8px;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);
  mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);
}
.kh2-reviews-track{display:flex;width:max-content;animation:kh2-marquee 60s linear infinite;}
.kh2-reviews:hover .kh2-reviews-track{animation-play-state:paused;}
.kh2-reviews-set{display:flex;gap:20px;padding-right:20px;}
@keyframes kh2-marquee{from{transform:translate3d(0,0,0);}to{transform:translate3d(-50%,0,0);}}
@media (prefers-reduced-motion:reduce){
  .kh2-reviews-track{animation:none;}
  .kh2-reviews{overflow-x:auto;}
}
/* The artboard card is 185 x 221pt — 1.19 tall for its width — and carries
   three short paragraphs. Matched here at 320 x 382 with the footer pinned to
   the foot, so every card is the same height whatever the quote runs to. */
.kh2-review{
  flex:0 0 320px;min-height:382px;background:#fff;border:1px solid var(--line);
  border-radius:12px;padding:20px 20px 18px;display:flex;flex-direction:column;
}
.kh2-review-head{display:flex;gap:11px;align-items:center;margin-bottom:10px;}
.kh2-review-av{width:34px;height:34px;border-radius:50%;background:#CFE7D4;flex:none;}
.kh2-review-n{font-family:var(--text)!important;font-size:15px!important;font-weight:600!important;letter-spacing:0!important;color:var(--ink)!important;margin:0;}
.kh2-review-p{font-family:var(--text)!important;font-size:13px!important;letter-spacing:0!important;color:var(--muted)!important;margin:0;}
.kh2-review-q{
  font-family:var(--text)!important;font-size:13.5px!important;line-height:1.5em!important;
  letter-spacing:0!important;color:var(--body)!important;margin:0 0 12px;flex:1;
  /* Four lines is what the artboard shows; a longer quote is trimmed rather
     than allowed to stretch one card past its neighbours. */
  display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:9;overflow:hidden;
}
.kh2-review-foot{display:flex;align-items:center;gap:10px;}
.kh2-review-src{
  width:26px;height:26px;border-radius:50%;background:#F3F4F6;display:flex;align-items:center;
  justify-content:center;font-size:13px;color:var(--body);
}
.kh2-review-score{font-family:var(--text)!important;font-size:13px!important;letter-spacing:0!important;color:var(--body)!important;}

/* ---- experts ---- */
/* No box: the rows run the full width of the window, past the content column,
   with a soft fade at each edge. */
.kh2-strip{
  width:100vw;margin:20px 0 32px calc(50% - 50vw);overflow:hidden;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);
          mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);
}
.kh2-strip-row{overflow:hidden;margin-bottom:14px;}
.kh2-strip-row:last-child{margin-bottom:0;}
/* The track holds the row twice; gap is on the tiles (margin) so both copies
   are exactly the same width and -50% lands on the seam. */
.kh2-strip-track{display:flex;width:max-content;animation:kh2-marquee 55s linear infinite;}
.kh2-strip-row.is-rev .kh2-strip-track{animation-direction:reverse;animation-duration:62s;}
/* Portrait tiles, a touch taller than wide. */
.kh2-tile{
  flex:none;display:block;width:112px;height:132px;margin-right:14px;
  border-radius:14px;background:#EEF3EF;object-fit:cover;
}
@media (prefers-reduced-motion:reduce){.kh2-strip-track{animation:none;}}
.kh2-feats{display:grid;grid-template-columns:repeat(4,1fr);gap:28px;}
/* Card ground is a hair off-white in the artboard (250,252,249), not pure. */
.kh2-feat{background:#FAFCF9;border:1px solid rgba(1,47,35,.08);border-radius:12px;padding:16px 16px 18px;}
.kh2-feat-i{font-size:24px;display:block;margin-bottom:8px;}
.kh2-feat-t{
  font-family:var(--sans)!important;font-size:21px!important;font-weight:500!important;
  line-height:1.25em!important;letter-spacing:0!important;color:var(--deep)!important;margin:0 0 12px;
}
.kh2-feat-l{list-style:none!important;margin:0;padding:0;}
.kh2-feat-l li{
  display:block!important;margin:0 0 3px;
  font-family:var(--text)!important;font-size:14px!important;line-height:1.32em!important;
  letter-spacing:0!important;color:var(--body)!important;
}

/* ---- services ---- */
/* All eight service tabs fit the 1132px row once the pills are not padded out
   to 22px a side — before this the last one was clipped by the scroller. */
.kh2-tabs{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0 26px;}
.kh2-tabs--scroll{overflow:visible;padding-bottom:0;}
.kh2-tabs--center{justify-content:center;flex-wrap:wrap;}
.kh2-tab{
  flex:none;background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px 15px;cursor:pointer;
  font-family:var(--text)!important;font-size:16px!important;letter-spacing:0!important;color:var(--body)!important;
  white-space:nowrap;
}
.kh2-tab.is-on{background:var(--green);border-color:var(--green);color:#fff!important;font-weight:600!important;}
/* Carousel: the track holds every panel and slides one step per tab. A panel is
   87% of the row with a 24px gutter — the artboard's proportion, which is what
   leaves the next panel peeking at the right edge. */
/* Full-bleed rail: the row runs the width of the window so the next panel
   comes in from the screen edge instead of being clipped inside the 1180px
   container. The left padding puts panel one flush with the page's text column.
   --pw is the panel width the track steps by. */
.kh2-slides{
  --cw:min(1132px, calc(100vw - 48px));
  --pw:calc(var(--cw) * .87);
  --pg:24px;
  width:100vw;margin-left:calc(50% - 50vw);overflow:hidden;
  padding-left:max(24px, calc((100vw - 1180px) / 2 + 24px));
}
.kh2-track{
  display:flex;gap:var(--pg);will-change:transform;
  transition:transform .5s cubic-bezier(.22,.7,.3,1);
}
.kh2-slide{
  flex:0 0 var(--pw);
  display:grid;grid-template-columns:1fr 1fr;gap:26px;
  background:#F9FFF8;border:1px solid var(--line);border-radius:16px;padding:34px;
}
@media (prefers-reduced-motion:reduce){.kh2-track{transition:none;}}
.kh2-slide-media{
  position:relative;border-radius:14px;min-height:300px;overflow:hidden;background:#E6EEE8;
}
.kh2-slide-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}
.kh2-slide-t{
  font-family:var(--sans)!important;font-size:31px!important;font-weight:600!important;
  line-height:1.2em!important;letter-spacing:-.01em!important;color:var(--ink)!important;margin:0 0 18px;
}
.kh2-slide-lead{font-family:var(--text)!important;font-size:16px!important;line-height:1.6em!important;letter-spacing:0!important;color:var(--body)!important;margin:0 0 10px;}
.kh2-slide-l{list-style:disc!important;margin:0 0 22px;padding-left:20px;}
.kh2-slide-l li{
  display:list-item!important;margin:0 0 6px;
  font-family:var(--text)!important;font-size:16px!important;letter-spacing:0!important;color:var(--body)!important;
}
.kh2-dots{display:flex;gap:7px;justify-content:center;margin-top:18px;}
.kh2-dots button{
  width:8px;height:8px;border-radius:50%;border:0;background:#D6DCD8;cursor:pointer;padding:0;
  transition:background .2s ease,width .2s ease;
}
.kh2-dots button.is-on{background:var(--green);width:20px;border-radius:999px;}

/* ---- faq ---- */
.kh2-faq{max-width:860px;margin:0 auto;}
.kh2-faq-row{border-bottom:1px solid rgba(38,34,34,.1);}
.kh2-faq-q{
  width:100%;display:flex;align-items:center;justify-content:space-between;gap:18px;text-align:left;
  background:none;border:0;cursor:pointer;padding:22px 4px;
  font-family:var(--text)!important;font-size:18px!important;letter-spacing:0!important;color:var(--ink)!important;
}
.kh2-faq-plus{font-size:22px;color:var(--body);line-height:1;}
.kh2-faq-a{
  font-family:var(--text)!important;font-size:16px!important;line-height:1.7em!important;
  letter-spacing:0!important;color:var(--body)!important;margin:0 0 22px;padding:0 4px;max-width:760px;
}

/* ---- posts ---- */
.kh2-posts{display:grid;grid-template-columns:repeat(3,1fr);gap:36px;margin-top:30px;}
.kh2-post{text-decoration:none;display:block;}
.kh2-post-img{width:100%;height:210px;object-fit:cover;border-radius:12px;display:block;}
.kh2-post-img.is-blank{background:linear-gradient(160deg,#D9D2CC,#B9AFA7);}
.kh2-post-t{
  font-family:var(--text)!important;font-size:16px!important;line-height:1.5em!important;
  letter-spacing:0!important;color:var(--ink)!important;margin:14px 0 0;text-align:center;
}

/* ---- final cta ---- */
/* Same vertical rhythm as .kh2-sec, so the gap into this band matches every
   other gap on the page; it was 120/90 and read as a hole. */
/* The arch: an ellipse as wide as the section rising the full height of the
   band, so it meets the footer exactly at the two bottom corners — the shape in
   the artboard. The heading and buttons sit inside it (centred in the band),
   where before the ellipse only reached 60% of the height and the text floated
   on white above it. */
.kh2-final{
  /* Deepest at the base, easing lighter towards the apex — the artboard
     grades #D5FFC4 at the foot to #E3FFDA near the top of the arch. */
  background:radial-gradient(50% 100% at 50% 100%, var(--band) 0%, var(--band-t) 99.5%, #fff 100%);
  min-height:318px;display:flex;flex-direction:column;justify-content:center;
  padding:clamp(122px,16.3vh,176px) 0 44px;
}

/* Short screens (a 720px-tall laptop, say): the same layout on a tighter
   vertical grid, so every section still fits between the fixed header and the
   fold. Nothing is hidden or reflowed — only the air comes out. */
/* Not on phones: there the address bar sliding in and out changes the height
   mid-scroll, and crossing 760px would reflow the page under the finger. */
@media (max-height:760px) and (min-width:641px){
  .kh2-sec{padding:104px 0;}
  .kh2-tcard-head{height:146px;}
  .kh2-tcard-meta{margin-top:12px;gap:11px;}
  .kh2-tcard-bio{margin-top:12px;}
  .kh2-tcard-foot{padding:12px 20px 14px;}
  .kh2-feat{padding:13px;}
  .kh2-slide{padding:26px;}
  .kh2-care-card{padding:26px;}
}

@media (max-width:1000px){
  .kh2-tabs--scroll{flex-wrap:nowrap;overflow-x:auto;padding-bottom:6px;}
  .kh2-tgrid,.kh2-steps,.kh2-feats,.kh2-posts{grid-template-columns:1fr 1fr;}
  .kh2-offers,.kh2-care{grid-template-columns:1fr;}
  .kh2-care-media{min-height:320px;}
  .kh2-slide{grid-template-columns:1fr;}
}
@media (max-width:640px){
  .kh2-sec{padding:48px 0;}
  .kh2-h1{font-size:38px!important;}

  /* ── Mobile hero, to the phone comp ─────────────────────────────────────
     Left-aligned copy, the sparkle inside the text box, a "Find the match"
     chip beneath it, a standalone green CTA, then the stat card and greenery.
     A soft grey wash runs down from under the header. */
  .kh2-hero{
    background:linear-gradient(180deg,#EDEEED 0%,#FFFFFF 22%,#FFFFFF 100%);
    /* Sized from svh — the viewport with the address bar showing, which never
       changes while scrolling. A max-height media query used to tighten this on
       short phones, but the bar sliding away crossed its breakpoint mid-scroll
       and the whole hero jumped. ~64px on an iPhone SE, ~92px on a 812px phone. */
    padding-top:clamp(56px,calc(20svh - 70px),120px)!important;
    min-height:calc(100vh - 63px);
    min-height:calc(100svh - 63px);
    max-height:none;
  }
  .kh2-hero-in{text-align:left;padding:0 22px;}
  .kh2-h1{font-size:clamp(30px,8.6vw,36px)!important;line-height:1.14em!important;margin-bottom:clamp(6px,1.4svh,12px)!important;}
  /* One line on every phone. At 15px the sentence is ~22.2px wide per px of
     font (333px), so it wrapped on anything under ~390px — iPhone SE/mini,
     360px Androids. 15px where it fits, otherwise scaled to the width left
     inside the 22px side padding; 23.4 rather than 22.2 leaves ~5% slack, since
     small sizes render a touch wider than straight scaling (320px missed by 2px
     at 3%). Wrapping is still allowed, so a slow font load can
     never clip "24/7" off the end. */
  .kh2-hero-sub{font-size:min(15px, calc((100vw - 44px) / 23.4))!important;margin:0 0 clamp(10px,2.2svh,18px)!important;color:var(--body)!important;}
  .kh2-hero-accent{color:var(--green);}

  .kh2-search{
    max-width:none;margin:0;padding:0;background:transparent;box-shadow:none;border-radius:0;
  }
  .kh2-search-input{
    min-height:0!important;height:clamp(68px,10svh,76px);resize:none;padding:12px 44px 12px 12px!important;
    border:1.5px solid #6FB8C6!important;border-radius:10px!important;
    font-size:13px!important;line-height:1.55em!important;
  }
  .kh2-search-spark{
    display:block;position:absolute;right:12px;top:50%;transform:translateY(-50%);
    color:var(--green);line-height:0;pointer-events:none;
  }
  .kh2-search-spark .kh2-trio{width:22px;height:22px;}
  .kh2-search-row{display:none;}

  /* the text box and both buttons sit together on a pale green panel, pulled
     8px past the text column each side so the box keeps most of its width */
  .kh2-hero-panel{
    /* collapses into the subtitle's own margin (up to 18px): ~34px on a tall
       phone, back to 18px on an iPhone SE so the plants stay on screen */
    display:block;margin:clamp(18px,calc(12svh - 64px),34px) -8px 0;padding:12px;
    background:#EEF8F0;border:1px solid rgba(24,158,79,.12);border-radius:16px;
  }
  .kh2-hero-panel .kh2-search-input{background:#fff!important;}
  .kh2-hero-panel .kh2-hero-actions{margin-top:12px!important;}
  /* "Find the match" and "Consult now" share one row under the text box,
     at the same height */
  .kh2-hero-actions{display:flex;align-items:stretch;gap:10px;margin-top:clamp(14px,calc(9svh - 45px),28px);}
  /* equal halves, so the pair lines up with the text box's left and right edges */
  .kh2-hero-actions > a{flex:1 1 0;min-width:0;justify-content:center;white-space:nowrap;}
  .kh2-match{
    display:inline-flex;align-items:center;gap:10px;padding:0 14px;min-height:44px;
    background:#fff;border:1px solid rgba(24,158,79,.12);border-radius:8px;
    box-shadow:0 6px 16px rgba(24,158,79,.10);text-decoration:none;
    font-family:var(--text)!important;font-size:13px!important;letter-spacing:0!important;color:var(--body)!important;
  }
  .kh2-match svg{width:14px;height:14px;color:var(--green);}

  .kh2-consult{
    display:inline-flex;align-items:center;gap:10px;padding:0 16px;min-height:44px;
    background:var(--green);color:#fff!important;border-radius:6px;text-decoration:none;
    box-shadow:0 2px 0 rgba(1,47,35,.18);
    font-family:var(--text)!important;font-size:15px!important;font-weight:600!important;letter-spacing:0!important;
  }

  /* The comp puts the stat card just under the CTA with the clip pinned to the
     foot of the screen. display:contents dissolves the band, so the card joins
     the hero's flow after the CTA while the clip stays absolutely positioned —
     now against the hero itself — at the bottom. */
  .kh2-foliage{display:contents;}
  /* the clip hugs the foot of the hero; padding-bottom reserves exactly the
     height the phone cut takes at full width (750x200, so width / 3.75) — the
     card is never drawn over, and the frame is never trimmed */
  .kh2-hero{padding-bottom:calc(100vw / 3.75)!important;}
  .kh2-clips{aspect-ratio:750/200;background-image:url('/hero-calm-mobile.webp');}
  .kh2-hero-in{margin-bottom:0!important;}
  .kh2-badge-wrap{
    position:relative!important;top:auto!important;left:auto!important;right:auto!important;
    width:auto!important;margin:auto 58px 40px!important;
  }
  /* margin-top:auto drops the card to the foot of the hero, just above the
     plant clip; the gap under the buttons keeps a floor on short screens */
  .kh2-hero-in{padding-bottom:28px!important;}
  /* a smaller stat card on phones: narrower (58px in from each side), shorter,
     with type a step down */
  .kh2-badge-deck{height:78px;}
  .kh2-badge{gap:12px;padding:12px 18px;border-radius:10px;}
  .kh2-badge-i{font-size:18px;}
  .kh2-badge-t{font-size:14px!important;margin:0 0 1px;}
  .kh2-badge-b{font-size:12px!important;line-height:1.4em!important;}
  .kh2-badge-stack{left:14px;right:14px;bottom:-7px;border-radius:10px;}
  /* The negative bottom margin lets the card sit over the top edge of the
     greenery — the clip's top rows are near-white, and the desktop hero floats
     its card over the band the same way. That is what buys the room for the
     extra space above the headline and under the CTA without pushing the
     plants below the fold on a typical iPhone. Only bites on short screens; a
     tall phone has slack under the card and the card never reaches the band. */
  .kh2-h1{font-weight:700!important;}
  .kh2-h2{font-size:24px!important;}
  .kh2-h2--big{font-size:30px!important;}
  .kh2-tgrid,.kh2-steps,.kh2-feats,.kh2-posts,.kh2-stats{grid-template-columns:1fr;}
  .kh2-care-card,.kh2-offer-panel{padding:24px;}
  .kh2-headrow{flex-direction:column;}
}

/* Phones: "How it works" becomes a swipe carousel — one card at a time with
   the next peeking in, snapping to centre, dots beneath. Native scrolling, so
   it follows the finger and respects momentum. */
@media (max-width:640px){
  .kh2-steps{
    display:flex!important;overflow-x:auto;scroll-snap-type:x mandatory;
    gap:14px;margin:0 -22px;padding:4px 22px 10px;
    scrollbar-width:none;-webkit-overflow-scrolling:touch;
  }
  .kh2-steps::-webkit-scrollbar{display:none;}
  .kh2-step{flex:0 0 82%;scroll-snap-align:center;}
  .kh2-step-dots{display:flex;justify-content:center;gap:7px;margin-top:14px;}
  .kh2-step-dots button{
    width:8px;height:8px;border-radius:50%;border:0;padding:0;cursor:pointer;background:#D6DCD8;
    transition:width .2s ease,background .2s ease;
  }
  .kh2-step-dots button.is-on{width:20px;border-radius:999px;background:var(--green);}

  /* Posts: a swipe row, so the phone reads one card at a time instead of a
     long stack. */
  .kh2-posts{
    display:flex!important;overflow-x:auto;scroll-snap-type:x mandatory;
    gap:14px;margin-left:-22px;margin-right:-22px;padding:4px 22px 10px;
    scrollbar-width:none;
  }
  .kh2-posts::-webkit-scrollbar{display:none;}
  .kh2-tcard,.kh2-post{flex:0 0 84%;scroll-snap-align:center;}
  /* The four "why Koott" boxes are mostly text: stacked at full width, each as
     tall as its own copy, rather than cut off at the edge of a swipe row. */
  .kh2-feats{display:grid!important;grid-template-columns:1fr!important;gap:12px;}
  .kh2-feat{padding:16px 18px;}
  .kh2-feat-t{font-size:19px!important;margin-bottom:10px;}
  /* Therapist cards stack one under another above the "more" button, and run
     12px from the screen edge (past the section's 24px gutter) for more room. */
  .kh2-tgrid{display:grid!important;grid-template-columns:1fr!important;gap:16px;margin-left:-12px;margin-right:-12px;}

  /* therapist card: the fixed-height band clipped two-line names and roles
     in a narrow card — let it grow, with a floor so cards still line up */
  .kh2-tcard-head{height:auto!important;min-height:156px;}
  .kh2-tcard-head > div{width:62%;}
  .kh2-tcard-n{font-size:15.5px!important;}
  .kh2-tcard-r{font-size:13px!important;}

  /* filters: Speciality and Needs share a row, the Filters button goes icon-only */
  .kh2-filters{flex-wrap:nowrap;gap:8px;}
  .kh2-filter{flex:1 1 0;min-width:0;padding:0 12px;gap:6px;}
  .kh2-filter{font-size:14px!important;}
  .kh2-filter-anchor{margin-left:0;flex:none;}
  .kh2-filter-icon{font-size:0!important;padding:0 10px;gap:0;}
  .kh2-filter-count{font-size:11px!important;margin-left:4px;}

  .kh2-offer-h{font-size:21px!important;}
  .kh2-offer-t{font-size:17px!important;}

  /* care: the four stats fit two to a row */
  /* minmax(0,1fr): plain 1fr let "30,000+" claim its min-content width and
     squeeze the other column until "9 in 10" broke one word per line */
  .kh2-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:18px 14px!important;}
  .kh2-stat{padding-left:12px!important;}
  /* the care stat numbers are .kh2-stat-v */
  .kh2-stat-v{font-size:clamp(20px,6vw,26px)!important;white-space:nowrap;}
  .kh2-care-media{min-height:240px!important;}

  /* experts: seven portraits a row, not fourteen slivers */
  .kh2-strip{margin:16px 0 24px calc(50% - 50vw);}
  .kh2-strip-row{margin-bottom:10px;}
  .kh2-tile{width:84px;height:100px;margin-right:10px;border-radius:12px;}
  /* experts buttons stack; the pair in the closing arch stays side by side */
  .kh2-ctarow:not(.kh2-ctarow--c){flex-direction:column;align-items:stretch;}
  .kh2-ctarow:not(.kh2-ctarow--c) .kh2-btn,.kh2-ctarow:not(.kh2-ctarow--c) .kh2-outline{min-width:0;width:100%;}

  /* closing arch: a wide shallow dome rather than the tall bullet a 50%-wide
     ellipse becomes on a narrow screen, with two small buttons in one row */
  .kh2-final{
    min-height:0!important;padding:64px 0 40px!important;
    /* green runs to 95% of the radius, so the dome's top sits just under the
       section edge and the heading is well inside it */
    background:radial-gradient(130% 100% at 50% 100%, var(--band) 0%, var(--band-t) 94%, #fff 95%)!important;
  }
  .kh2-final .kh2-h2--big{font-size:26px!important;line-height:1.25em!important;}
  .kh2-ctarow--c{flex-direction:row;flex-wrap:nowrap;justify-content:center;gap:10px;margin-top:16px;}
  .kh2-ctarow--c .kh2-btn,.kh2-ctarow--c .kh2-outline{
    min-width:0;width:auto;flex:0 1 auto;padding:9px 18px;font-size:14px!important;white-space:nowrap;
  }

  /* services: one panel fills the width (16px from each screen edge), photo
     on top at 16:10, then the copy — no neighbour squeezing it from the right */
  .kh2-slides{--pw:calc(100vw - 32px);--pg:12px;padding-left:16px;}
  .kh2-slide{padding:14px 14px 18px!important;gap:14px!important;}
  .kh2-slide-media{min-height:0!important;aspect-ratio:16/10;}
  .kh2-slide-body{padding:0 4px;}
  .kh2-slide .kh2-btn--sm{width:100%;justify-content:center;}
  .kh2-slide-t{font-size:22px!important;margin-bottom:10px!important;}
  .kh2-slide-lead,.kh2-slide-l li{font-size:14.5px!important;}

  /* posts */
  .kh2-post-img{height:180px;}
}

/* Up to 1000px "What Koott offers" is one column, so it becomes an accordion:
   the body opens under the row that was tapped. */
@media (max-width:1000px){
  .kh2-offer-panel{display:none;}
  /* Height animates open and shut: a one-row grid going 0fr → 1fr sizes
     itself to the content, with no measuring in JavaScript. It used to mount
     and unmount instantly, so the page jumped by the body's full height. */
  .kh2-offer-inline{
    display:grid;grid-template-rows:0fr;
    transition:grid-template-rows .38s cubic-bezier(.4,0,.2,1);
  }
  .kh2-offer-inline.is-open{grid-template-rows:1fr;}
  /* visibility waits for the close to finish, then takes the shut body out of
     the tab order; opening flips it back at once. */
  .kh2-offer-inline-in{min-height:0;overflow:hidden;visibility:hidden;transition:visibility 0s .38s;}
  .kh2-offer-inline.is-open .kh2-offer-inline-in{visibility:visible;transition-delay:0s;}
  .kh2-offer-inline-body{
    background:#fff;border:1px solid var(--line);border-top:0;
    border-radius:0 0 12px 12px;padding:18px 18px 16px;
    opacity:0;transform:translate3d(0,-6px,0);transition:opacity .22s ease,transform .3s ease;
  }
  .kh2-offer-inline.is-open .kh2-offer-inline-body{opacity:1;transform:none;transition-delay:.1s;border-color:#5EA277;}
  /* The open row and its body read as one card: the row drops its bottom edge
     and corners, the body carries on from there. (This replaces a -12px
     overlap, which would have pulled every shut row up into the one above.) */
  .kh2-offer-row.is-on{border-radius:12px 12px 0 0;border-bottom-color:transparent;}
  /* the row already names the service; the body's heading would repeat it */
  .kh2-offer-inline .kh2-offer-h{display:none;}
}
@media (max-width:1000px) and (prefers-reduced-motion:reduce){
  .kh2-offer-inline,.kh2-offer-inline-body{transition:none;}
}

/* The narrowest phones (320px): keep Speciality and Needs on one line. */
@media (max-width:360px){
  .kh2-filter{padding:0 10px!important;font-size:13px!important;}
}

/* Narrow phones (iPhone SE / mini, 360px Androids): the two-line placeholder
   wraps to three here, and at the usual height its last line was cut off.
   Three lines of 13px x 1.55 plus 24px of padding is ~85px. */
@media (max-width:380px){
  .kh2-search-input{height:86px!important;}
}

/* Desktop keeps its original behaviour: the leaving phrase is not drawn. */
.kh2-h1-word.is-out{display:none;}

/* Phones: smoother hero rotation. Two things stuttered. The old phrase vanished
   a beat before the new one rose, which read as a blink — so on phones it now
   drifts up and fades out first, and the new one rises in only once it is fully
   gone. Strictly one after the other: the new phrase's delay (.3s) is longer
   than the old one's exit (.28s), so the two are never on screen together —
   a crossfade here overlapped two lines of large type, which read as a
   collision rather than a hand-off. The very first phrase has nothing to wait
   for, so it skips the delay (.is-first). And the card
   animated box-shadow and scale: a shadow repaints on every frame and scaled
   text re-rasterises, which is exactly what judders on a phone GPU — so here it
   moves on transform and opacity alone, which the compositor runs off the main
   thread. Last in the sheet so it outranks the earlier rules. */
@keyframes kh2-word-in-m{from{opacity:0;transform:translate3d(0,14px,0);}to{opacity:1;transform:translate3d(0,0,0);}}
@keyframes kh2-word-out-m{from{opacity:1;transform:translate3d(0,0,0);}to{opacity:0;transform:translate3d(0,-10px,0);}}
@keyframes kh2-card-in-m{
  0%{opacity:0;transform:translate3d(0,26px,0) scale(.93);}
  40%{opacity:1;transform:translate3d(0,11px,0) scale(.975);}
  100%{opacity:1;transform:translate3d(0,0,0) scale(1);}
}
@keyframes kh2-card-under-m{
  0%{opacity:1;transform:translate3d(0,0,0) scale(1);}
  55%{opacity:.55;transform:translate3d(0,6px,0) scale(.955);}
  100%{opacity:0;transform:translate3d(0,10px,0) scale(.94);}
}
@keyframes kh2-fade-out{from{opacity:1;}to{opacity:0;}}
@media (max-width:640px){
  .kh2-h1-word{will-change:transform,opacity;backface-visibility:hidden;}
  .kh2-h1-word.is-out{display:block;animation:kh2-word-out-m .28s cubic-bezier(.4,0,1,1) both;}
  .kh2-h1-word.is-in{animation:kh2-word-in-m .45s .3s cubic-bezier(0,0,.2,1) both;}
  .kh2-h1-word.is-in.is-first{animation-delay:0s;}
  .kh2-badge.is-in{will-change:transform,opacity;animation:kh2-card-in-m .6s cubic-bezier(.22,.7,.3,1) both;}
  .kh2-badge.is-out{will-change:transform,opacity;animation:kh2-card-under-m .6s cubic-bezier(.4,0,.2,1) both;}
}
@media (max-width:640px) and (prefers-reduced-motion:reduce){
  .kh2-h1-word.is-out{animation:kh2-fade-out .28s ease-in both;}
  .kh2-h1-word.is-in{animation:kh2-fade-in .4s .3s ease-out both;}
  .kh2-h1-word.is-in.is-first{animation-delay:0s;}
  .kh2-badge.is-in{animation:kh2-fade-in .45s ease both;}
}
`;
