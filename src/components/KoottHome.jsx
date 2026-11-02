'use client';

/**
 * KoottHome — the home page, built to two design frames:
 *
 *   laptop  figma-ref/Home_Final.pdf           1920 x 8651
 *   phone   figma-ref/Home mobile Updated.pdf  390 x 9409
 *
 * Sizes, spacing, type and colours were read off the exported .fig
 * ("Koott 29 10 26.fig", frames 268:1792 and 558:2822) and checked against the
 * PDFs; where the two disagree the PDF wins, because it is the render of the
 * same frame. The photos in public/design/home come out of the .fig's images
 * folder, and the icons are rendered off the PDF.
 *
 * The page is static: every word is in data/koottHomeContent.js. The therapist
 * cards and the blog posts are live (/api/public/psychologists, /api/blogs),
 * as on the condition pages, because that data changes all the time.
 *
 * Motion the design cannot show, kept from the previous build: the rotating
 * headline, the stat-card deck, the looping foliage clip, the offer panel's
 * hand-over, the reviews and faces running on loops, the services slider, and
 * the accordions easing open.
 *
 * Styles are scoped to .kh2 and carry !important (and :not(#_) on headings)
 * because globals.css sets type site-wide that way.
 */

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { track } from '@/analytics';
import ResumeBookingCard, { RESUME_CARD_CSS, useBookingDraft } from '@/components/ResumeBookingCard';
import TherapistCard, { THERAPIST_CARD_CSS, cardFields, designCardCss } from '@/components/TherapistCard';
import { therapistSlug } from '@/components/TherapistProfile';
import { whenLabel } from '@/lib/nextAvailable';
import { applyTherapistOrder, fetchTherapistOrder } from '@/lib/therapistOrder';
import { HOME_DEFAULTS } from '@/data/koottHomeContent';
import { mergeSiteContent } from '@/lib/siteContent';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
const BOOK = '/book-malayali-psychologists';
const ART = '/design/home';

/* ----------------------------- small pieces ----------------------------- */

const Chevron = ({ dir = 'down', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {dir === 'down' && <path d="M6 9l6 6 6-6" />}
    {dir === 'left' && <path d="M15 6l-6 6 6 6" />}
    {dir === 'right' && <path d="M9 6l6 6-6 6" />}
  </svg>
);

/* star-06: the four-pointed sparkle on the primary buttons. */
const Sparkle = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 1.5c.5 0 .9.3 1 .8l1.2 4.6c.4 1.6 1.7 2.9 3.3 3.3l4.6 1.2c.5.1.8.5.8 1s-.3.9-.8 1l-4.6 1.2c-1.6.4-2.9 1.7-3.3 3.3L13 21.5c-.1.5-.5.8-1 .8s-.9-.3-1-.8l-1.2-4.6c-.4-1.6-1.7-2.9-3.3-3.3L1.9 12.4c-.5-.1-.8-.5-.8-1s.3-.9.8-1l4.6-1.2c1.6-.4 2.9-1.7 3.3-3.3L11 2.3c.1-.5.5-.8 1-.8z" />
  </svg>
);

/* Three sparkles, as drawn beside "Find therapist by concern". */
const SparkleTrio = () => (
  <svg className="kh2-trio" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M9.5 5.5C9.5 10.9 13.1 14.5 18.5 14.5C13.1 14.5 9.5 18.1 9.5 23.5C9.5 18.1 5.9 14.5 0.5 14.5C5.9 14.5 9.5 10.9 9.5 5.5Z" />
    <path d="M18.5 3.1C18.5 6.34 20.66 8.5 23.9 8.5C20.66 8.5 18.5 10.66 18.5 13.9C18.5 10.66 16.34 8.5 13.1 8.5C16.34 8.5 18.5 6.34 18.5 3.1Z" />
    <path d="M13.5 0.2C13.5 2.24 14.86 3.6 16.9 3.6C14.86 3.6 13.5 4.96 13.5 7C13.5 4.96 12.14 3.6 10.1 3.6C12.14 3.6 13.5 2.24 13.5 0.2Z" />
  </svg>
);

/* check-circle, solid: a green disc with a white tick. */
const Check = ({ size = 20 }) => (
  <svg className="kh2-check" width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="11" fill="currentColor" />
    <path d="M7.5 12.3l3 3 6-6.3" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowUpRight = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M7 17L17 7M8 7h9v9" />
  </svg>
);

const ArrowRight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
);

const PlusMinus = ({ open }) => (
  <svg className="kh2-pm" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" aria-hidden>
    <path d="M5 12h14" />
    {!open && <path d="M12 5v14" />}
  </svg>
);

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" aria-hidden>
    <circle cx="11" cy="11" r="7.5" /><path d="M21 21l-4.5-4.5" />
  </svg>
);

const Clock = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9.5" /><path d="M12 7v5l3 2" />
  </svg>
);

/** The four-colour Google mark beside the rating. */
const GoogleMark = ({ size = 38 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden focusable="false">
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
    <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
  </svg>
);

/**
 * A box that eases between no height and its own. Every accordion on the page
 * opens this way. `phone` ones are plain content above the phone breakpoint.
 */
const Reveal = ({ open, phone = false, children }) => (
  <div className={`kh2-reveal${phone ? ' kh2-reveal--phone' : ''}${open ? ' is-open' : ''}`}>
    <div className="kh2-reveal-in">{children}</div>
  </div>
);

/* ------------------------------ hero clip -------------------------------- */

/*
 * The looped clip along the foot of the hero, a wide cut and a taller one for
 * phones. It mounts once the viewport is known, so a phone never downloads the
 * desktop file. Two copies play in turn — the spare starts a breath before the
 * front one ends — because a native loop paints nothing for a frame while the
 * decoder wraps, which reads as a flash. MP4 first: iOS WebKit has no VP9 alpha.
 */
const CUTS = {
  desk: { mp4: '/hero-calm-desktop.mp4', webm: '/hero-calm-desktop.webm', poster: '/hero-calm-desktop.webp' },
  mob: { mp4: '/hero-calm-mobile.mp4', webm: '/hero-calm-mobile.webm', poster: '/hero-calm-mobile.webp' },
};
const HANDOVER = 0.12;

const HeroClip = () => {
  const [cut, setCut] = useState(null);
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

    // rAF stops in a background tab, so a clip can reach its end with no
    // hand-over waiting; rewind it there, and again on the way back.
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
    <img className="kh2-badge-i" src={`${ART}/badge-orb.png`} alt="" width={47} height={47} />
    <div className="kh2-badge-copy">
      <p className="kh2-badge-t">{card.title}</p>
      <p className="kh2-badge-b">
        {card.phoneBody ? (
          <>
            <span className="kh2-lap">{card.body}</span>
            <span className="kh2-ph">{card.phoneBody}</span>
          </>
        ) : card.body}
      </p>
    </div>
  </div>
);

/* --------------------------- how it works art ---------------------------- */

/* The picture at the foot of each step card: five faces, a date strip with a
   time, then a video call. The photographs are the design's own (the same
   files the condition pages use). */
function StepArt({ step }) {
  if (step === 0) {
    return (
      <div className="kh2-step-art kh2-step-faces" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => <img key={i} src={`/design/steps/face-${i}.webp`} alt="" loading="lazy" />)}
      </div>
    );
  }
  if (step === 1) {
    // Real dates, so the strip never shows a day that has gone by.
    const today = new Date();
    // Four days back to two ahead, today picked, as the strip is drawn.
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i - 4);
      return {
        label: d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Asia/Kolkata' }),
        day: d.toLocaleDateString('en-GB', { day: '2-digit', timeZone: 'Asia/Kolkata' }),
      };
    });
    return (
      <div className="kh2-step-art kh2-step-dates" aria-hidden>
        <div className="kh2-step-days">
          {days.map((d, i) => (
            <span key={i} className={i === 4 ? 'is-on' : i < 4 ? 'is-past' : ''}>
              <small>{d.label}</small><b>{d.day}</b>
            </span>
          ))}
        </div>
        <div className="kh2-step-slot"><small>Today</small><b>4 PM</b></div>
      </div>
    );
  }
  return (
    <div className="kh2-step-art kh2-step-call" aria-hidden>
      <span className="kh2-step-tile kh2-step-tile--a"><img src="/design/steps/call-1.webp" alt="" loading="lazy" /></span>
      <span className="kh2-step-tile kh2-step-tile--b">
        <img src="/design/steps/call-2.webp" alt="" loading="lazy" />
        <span className="kh2-step-dots"><i /><i /><i /></span>
      </span>
    </div>
  );
}

/* ------------------------------- reviews --------------------------------- */

/* The design fills the review photos with stock faces. A stock face beside a
   named testimonial reads as that client, so — as on the condition pages — the
   frame carries the person's initials until a review has a real photo. */
const ReviewCard = ({ r, big = false }) => (
  <figure className={`kh2-review${big ? ' kh2-review--big' : ''}${r.repeat ? ' kh2-review--repeat' : ''}`}>
    <span className="kh2-review-av" aria-hidden>
      {(r.name || '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('')}
    </span>
    <figcaption className="kh2-review-who">
      <span className="kh2-review-n">{r.name}</span>
      <span className="kh2-review-p">{r.place}</span>
    </figcaption>
    <blockquote className="kh2-review-q">{r.quote}</blockquote>
    <span className="kh2-review-rate">
      <span className="kh2-review-g">G</span>
      <span className="kh2-review-s">4.9/5</span>
      <span className="kh2-review-stars">★★★★★</span>
    </span>
  </figure>
);

/* -------------------------------- data ---------------------------------- */

function useTherapists() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    let off = false;
    (async () => {
      try {
        // Soonest-available first; the same answer carries each next free start.
        const [res, order] = await Promise.all([
          fetch(`${API}/public/psychologists`),
          fetchTherapistOrder('default'),
        ]);
        if (!res.ok) return;
        const json = await res.json();
        const d = json?.data ?? json?.message ?? json;
        const list = d?.psychologists || (Array.isArray(d) ? d : []);
        if (!off && Array.isArray(list)) {
          setRows(applyTherapistOrder(list, order).map((p) => ({
            ...p,
            nextAvailable: whenLabel(order?.nextAt?.get(String(p.id))),
          })));
        }
      } catch (_) { /* the section shows its empty line */ }
    })();
    return () => { off = true; };
  }, []);
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
      } catch (_) { /* the section hides itself */ }
    })();
    return () => { off = true; };
  }, [limit]);
  return rows;
}

const hasRecord = (t) => Boolean(t.first_name || t.last_name);
const bookingHref = (t) => (hasRecord(t) ? `/book/${therapistSlug(t)}` : BOOK);
const profileHref = (t) => (hasRecord(t) ? `/service-page/${therapistSlug(t)}` : BOOK);

/* The faces strip: the design's 28 portraits, two rows. */
const FACES = [1, 2].map((r) => Array.from({ length: 14 }, (_, i) => `${ART}/faces/r${r}-${String(i + 1).padStart(2, '0')}.webp`));

/* -------------------------------- page ---------------------------------- */

export default function KoottHome({ content } = {}) {
  // `content` exists only for the admin preview; the public page passes none.
  const {
    HERO, THERAPISTS_SECTION, HOW_IT_WORKS, OFFERS, CARE,
    REVIEWS, EXPERTS, SERVICES, FAQ, BLOGS, FINAL_CTA,
  } = useMemo(() => (content ? mergeSiteContent(HOME_DEFAULTS, content) : HOME_DEFAULTS), [content]);

  const therapists = useTherapists();
  const posts = usePosts(3);
  const listSeen = useRef(false);
  useEffect(() => {
    if (!listSeen.current && therapists.length) { listSeen.current = true; track('counsellor_list_view', { count: Math.min(therapists.length, 3) }); }
  }, [therapists.length]);

  /* hero: the headline's first line and the stat card both rotate. `out` is
     the one leaving, kept mounted so it can animate away. */
  const [title, setTitle] = useState({ cur: 0, out: null });
  const [deck, setDeck] = useState({ cur: 0, out: null });
  useEffect(() => {
    // For everyone, reduced motion included: the CSS swaps movement for a fade.
    const timers = [];
    if (HERO.rotatingTitles.length > 1) {
      timers.push(setInterval(() => setTitle(({ cur }) => ({ cur: (cur + 1) % HERO.rotatingTitles.length, out: cur })), 2600));
    }
    if (HERO.badges.length > 1) {
      timers.push(setInterval(() => setDeck(({ cur }) => ({ cur: (cur + 1) % HERO.badges.length, out: cur })), 3800));
    }
    return () => timers.forEach(clearInterval);
  }, [HERO.rotatingTitles.length, HERO.badges.length]);

  /* therapists: a name search, a language, and one quick filter at a time. */
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState(THERAPISTS_SECTION.languages[0]);
  const [quick, setQuick] = useState('');
  const quickOn = THERAPISTS_SECTION.quickFilters.find((f) => f.label === quick);
  const matches = useMemo(() => therapists.filter((t) => {
    const q = query.trim().toLowerCase();
    const name = String(t.name || `${t.first_name || ''} ${t.last_name || ''}`).toLowerCase();
    if (q && !name.includes(q)) return false;
    const langs = cardFields(t).languages.map((l) => String(l).toLowerCase());
    if (language && !langs.includes(language.toLowerCase())) return false;
    if (quickOn) {
      const hay = quickOn.kind === 'need'
        ? (t.area_of_expertise || []).join(' ')
        : `${t.designation || ''} ${t.specialization || ''}`;
      if (!hay.toLowerCase().includes(quickOn.match)) return false;
    }
    return true;
  }), [therapists, query, language, quickOn]);
  const {
    draft: bookingDraft, slotState: bookingSlotState, suggestion: bookingSuggestion,
    dismiss: dismissBookingDraft, takeSuggestion: takeBookingSuggestion, seeOtherTimes: seeOtherBookingTimes,
  } = useBookingDraft();
  // An unfinished booking takes the first card's place, so the row stays at three.
  const cards = matches.slice(0, bookingDraft ? 2 : 3);

  /* what koott offers: the tile picks the panel. The outgoing panel stays just
     long enough to fade; the first one does not animate on load. */
  const [openOffer, setOpenOffer] = useState(OFFERS.items[0].key);
  const [prevOffer, setPrevOffer] = useState(null);
  const [offerTouched, setOfferTouched] = useState(false);
  const offer = OFFERS.items.find((o) => o.key === openOffer) || OFFERS.items[0];
  const pickOffer = (key) => {
    if (key === openOffer) return;
    track('ui_toggle', { element: 'offers_row', index: OFFERS.items.findIndex((o) => o.key === key) });
    setPrevOffer(openOffer);
    setOpenOffer(key);
    setOfferTouched(true);
  };

  /* reviews: chunked in threes — a tall card, then two stacked. A short last
     group borrows from the start of the list (skipping the first, which the
     loop runs straight back to). */
  const reviewGroups = useMemo(() => {
    const items = REVIEWS.items || [];
    const out = [];
    for (let i = 0; i < items.length; i += 3) out.push(items.slice(i, i + 3));
    const last = out[out.length - 1];
    if (last && last.length < 3 && items.length > 3) {
      for (let i = 1; last.length < 3; i += 1) last.push({ ...items[i], repeat: true });
    }
    return out;
  }, [REVIEWS.items]);
  // The phone swipes the reviews one at a time; this tracks which, for the dots.
  const reviewsRef = useRef(null);
  const [reviewAt, setReviewAt] = useState(0);
  const reviewCards = () => Array.from(
    reviewsRef.current?.querySelectorAll('.kh2-rev-set:first-child .kh2-review:not(.kh2-review--repeat)') || [],
  ).filter((c) => !c.closest('.kh2-rev-spare'));
  const onReviewsScroll = () => {
    const el = reviewsRef.current;
    if (!el) return;
    const left = el.getBoundingClientRect().left + 16;
    const gaps = reviewCards().map((c) => Math.abs(c.getBoundingClientRect().left - left));
    if (gaps.length) setReviewAt(gaps.indexOf(Math.min(...gaps)));
  };
  const goToReview = (i) => {
    const el = reviewsRef.current;
    const card = reviewCards()[i];
    if (!el || !card) return;
    el.scrollTo({ left: el.scrollLeft + card.getBoundingClientRect().left - el.getBoundingClientRect().left - 16, behavior: 'smooth' });
  };

  /* experts: four cards; on the phone they fold into an accordion. */
  const [openExpert, setOpenExpert] = useState(0);

  /* services: a tab (or a dot, or a swipe) slides the track. */
  const [serviceTab, setServiceTab] = useState(0);
  const serviceTabsRef = useRef(null);
  const serviceSwipe = useRef(null);
  const lastService = SERVICES.panels.length - 1;
  const pickService = (i) => {
    const n = Math.max(0, Math.min(lastService, i));
    if (n !== serviceTab) track('ui_toggle', { element: 'services_tab', index: n });
    setServiceTab(n);
  };
  // Keep the chosen tab in view where the row scrolls (the phone); scrolls the
  // row only, never the page.
  useEffect(() => {
    const row = serviceTabsRef.current;
    const tab = row?.children[serviceTab];
    if (!row || !tab || row.scrollWidth <= row.clientWidth) return;
    const by = tab.getBoundingClientRect().left - row.getBoundingClientRect().left - (row.clientWidth - tab.offsetWidth) / 2;
    row.scrollTo({ left: row.scrollLeft + by, behavior: 'smooth' });
  }, [serviceTab]);
  const onServiceTouchStart = (e) => { serviceSwipe.current = e.touches[0].clientX; };
  const onServiceTouchEnd = (e) => {
    if (serviceSwipe.current === null) return;
    const dx = e.changedTouches[0].clientX - serviceSwipe.current;
    serviceSwipe.current = null;
    if (Math.abs(dx) >= 40) pickService(serviceTab + (dx < 0 ? 1 : -1));
  };

  /* faq: tabs filter, one question open at a time. */
  const [faqTab, setFaqTab] = useState(FAQ.tabs[0]);
  const [openFaq, setOpenFaq] = useState(0);
  const faqs = FAQ.groups[faqTab] || [];
  const faqAt = FAQ.tabs.indexOf(faqTab);
  const faqTabsRef = useRef(null);
  const pickFaq = (t) => {
    if (!t) return;
    track('ui_toggle', { element: 'faq_tab', index: FAQ.tabs.indexOf(t) });
    setFaqTab(t);
    setOpenFaq(0);
  };
  useEffect(() => {
    const row = faqTabsRef.current;
    const tab = row?.querySelector('.is-on');
    if (!row || !tab || row.scrollWidth <= row.clientWidth) return;
    const by = tab.getBoundingClientRect().left - row.getBoundingClientRect().left - (row.clientWidth - tab.offsetWidth) / 2;
    row.scrollTo({ left: row.scrollLeft + by, behavior: 'smooth' });
  }, [faqTab]);

  const subtitle = (() => {
    const s = HERO.subtitle || '';
    const cut = s.lastIndexOf(', ');
    if (cut < 0) return s;
    return <>{s.slice(0, cut + 2)}<span className="kh2-accent">{s.slice(cut + 2)}</span></>;
  })();

  return (
    <main className="kh2">
      <style dangerouslySetInnerHTML={{ __html: THERAPIST_CARD_CSS + RESUME_CARD_CSS + designCardCss('.kh2') + CSS }} />

      {/* ══ hero ══════════════════════════════════════════════════════════ */}
      <section className="kh2-hero">
        <div className="kh2-in kh2-hero-in">
          {/* Only the first line rotates; hidden sizers hold its width and
              height so nothing below moves. */}
          <h1 className="kh2-h1">
            <span className="kh2-h1-rot" aria-live="polite">
              {HERO.rotatingTitles.map((w) => <span key={w} className="kh2-h1-size" aria-hidden>{w}</span>)}
              {title.out !== null && (
                <span className="kh2-h1-word is-out" key={`out-${title.out}`} aria-hidden>{HERO.rotatingTitles[title.out]}</span>
              )}
              <span className={`kh2-h1-word is-in${title.out === null ? ' is-first' : ''}`} key={`in-${title.cur}`}>
                {HERO.rotatingTitles[title.cur]}
              </span>
            </span>
            <span className="kh2-h1-tail">{HERO.titleTail}</span>
          </h1>
          <p className="kh2-hero-sub">{subtitle}</p>

          {/* Laptop: the green frame holds only the text box, with both buttons
              in a row under it. Phone: the frame holds the box and the concern
              button, and "Book a slot now" sits on its own below. */}
          <div className="kh2-ask-wrap">
            <div className="kh2-ask">
              <div className="kh2-ask-box">
                <textarea
                  className="kh2-ask-input ph-no-capture"
                  rows={2}
                  placeholder={HERO.searchPlaceholder}
                  aria-label="Tell us what's on your mind"
                />
              </div>
              <button type="button" className="kh2-concern" data-track="hero_find_by_concern">
                <SparkleTrio />{HERO.concernCta}
              </button>
            </div>
            <Link href={BOOK} className="kh2-book" data-track="hero_book_slot">{HERO.bookCta}</Link>
          </div>
        </div>

        {/* The clip band, with the stat deck floating in it. */}
        <div className="kh2-foliage">
          <HeroClip />
          <div className="kh2-badge-wrap">
            <span className="kh2-badge-stack" aria-hidden />
            <div className="kh2-badge-deck" aria-live="polite">
              {deck.out !== null && <BadgeCard key={`out-${deck.out}`} card={HERO.badges[deck.out]} />}
              <BadgeCard key={`in-${deck.cur}`} card={HERO.badges[deck.cur]} incoming />
            </div>
          </div>
        </div>
      </section>

      {/* ══ therapists ════════════════════════════════════════════════════ */}
      <section className="kh2-sec kh2-ther">
        <div className="kh2-in">
          <h2 className="kh2-h2 kh2-center kh2-ther-h">{THERAPISTS_SECTION.title}</h2>

          <div className="kh2-filters">
            <div className="kh2-fsearch">
              <label className="kh2-fsearch-q">
                <SearchIcon />
                <input
                  type="search"
                  className="ph-no-capture"
                  value={query}
                  placeholder={THERAPISTS_SECTION.searchPlaceholder}
                  aria-label="Search therapists by name"
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <label className="kh2-flang">
                <span className="kh2-flang-v">
                  {language}<small>{THERAPISTS_SECTION.languageLabel}</small>
                </span>
                <Chevron />
                <select
                  value={language}
                  aria-label="Session language"
                  onChange={(e) => { setLanguage(e.target.value); track('filter_applied', { filter: 'language', value: e.target.value }); }}
                >
                  {THERAPISTS_SECTION.languages.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </label>
            </div>

            <div className="kh2-quicks">
              {THERAPISTS_SECTION.quickFilters.map((f) => {
                const on = quick === f.label;
                return (
                  <button
                    key={f.label} type="button"
                    className={`kh2-quick${on ? ' is-on' : ''}`}
                    aria-pressed={on}
                    onClick={() => {
                      setQuick(on ? '' : f.label);
                      if (!on) track('filter_applied', { filter: f.kind, value: f.label });
                    }}
                  >
                    <img src={`${ART}/${f.icon}.png`} alt="" width={32} height={32} />
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {cards.length === 0 && !bookingDraft && (
            <p className="kh2-empty">
              {therapists.length
                ? 'No therapist matches that combination yet. Clear a filter to see everyone.'
                : 'Loading therapists…'}
            </p>
          )}

          <div className="kh2-tgrid">
            {bookingDraft && (
              <ResumeBookingCard
                draft={bookingDraft} slotState={bookingSlotState} suggestion={bookingSuggestion}
                onDismiss={dismissBookingDraft} onTakeSuggestion={takeBookingSuggestion}
                onSeeOtherTimes={seeOtherBookingTimes}
              />
            )}
            {cards.map((t, i) => (
              <TherapistCard
                key={t.id || i}
                design
                t={{ ...cardFields(t), availability: t.nextAvailable }}
                profileHref={profileHref(t)}
                bookHref={bookingHref(t)}
              />
            ))}
          </div>

          <div className="kh2-center kh2-ther-more">
            <Link href={BOOK} className="kh2-btn2 kh2-btn2--sec kh2-btn2--m kh2-ther-more-b" data-track="therapists_more">
              {THERAPISTS_SECTION.moreLabel}
            </Link>
          </div>
        </div>
      </section>

      {/* ══ how it works ══════════════════════════════════════════════════ */}
      <section className="kh2-sec kh2-how">
        <div className="kh2-in">
          <span className="kh2-chip">
            <span className="kh2-lap">{HOW_IT_WORKS.eyebrow}</span>
            <span className="kh2-ph">{HOW_IT_WORKS.phoneEyebrow}</span>
          </span>
          <div className="kh2-how-head">
            <div>
              <h2 className="kh2-h2">{HOW_IT_WORKS.title}</h2>
              <p className="kh2-sub">{HOW_IT_WORKS.subtitle}</p>
            </div>
            <Link href={BOOK} className="kh2-btn2 kh2-btn2--pri kh2-btn2--xl kh2-how-cta">
              <Sparkle />{HOW_IT_WORKS.cta}
            </Link>
          </div>

          <div className="kh2-steps">
            {HOW_IT_WORKS.steps.map((s, i) => (
              <div key={s.n} className="kh2-step">
                <div className="kh2-step-head">
                  <span className="kh2-step-n" aria-hidden>{s.n}</span>
                  <div>
                    <h3 className="kh2-step-t">{s.title}</h3>
                    <p className="kh2-step-b">{s.body}</p>
                  </div>
                </div>
                <StepArt step={i} />
              </div>
            ))}
          </div>

          <div className="kh2-center kh2-how-foot">
            <Link href={BOOK} className="kh2-btn2 kh2-btn2--sec kh2-btn2--m">{HOW_IT_WORKS.phoneCta}</Link>
          </div>
        </div>
      </section>

      {/* ══ what koott offers ═════════════════════════════════════════════ */}
      <section className="kh2-sec kh2-offers-sec">
        <div className="kh2-in">
          <h2 className="kh2-h2 kh2-center">{OFFERS.title}</h2>
          <p className="kh2-sub kh2-center kh2-offers-sub">{OFFERS.subtitle}</p>

          <div className="kh2-offers">
            <div className="kh2-offer-tiles">
              {OFFERS.items.map((o) => (
                <button
                  key={o.key} type="button"
                  className={`kh2-offer-tile${o.key === openOffer ? ' is-on' : ''}`}
                  style={{ '--ph-order': o.phoneOrder }}
                  aria-pressed={o.key === openOffer}
                  onClick={() => pickOffer(o.key)}
                >
                  <img className={`kh2-offer-i kh2-offer-i--${o.icon}`} src={`${ART}/${o.icon}.png`} alt="" />
                  <span className="kh2-offer-copy">
                    <span className="kh2-offer-t kh2-lap">{o.title}</span>
                    <span className="kh2-offer-t kh2-ph">{o.short[0]}<br />{o.short[1]}</span>
                    <span className="kh2-offer-n">{o.note}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="kh2-offer-panel">
              {prevOffer && prevOffer !== openOffer && (
                <div key={`out-${prevOffer}`} className="kh2-offer-body is-out" aria-hidden onAnimationEnd={() => setPrevOffer(null)}>
                  <OfferBody o={OFFERS.items.find((o) => o.key === prevOffer) || offer} />
                </div>
              )}
              <div key={`in-${openOffer}`} className={`kh2-offer-body is-in${offerTouched ? '' : ' is-first'}`}>
                <OfferBody o={offer} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ care that understands you ═════════════════════════════════════ */}
      <section className="kh2-sec kh2-care-sec">
        <div className="kh2-in kh2-care">
          <div className="kh2-care-card">
            <img className="kh2-care-mark" src={`${ART}/care-mark.svg`} alt="" aria-hidden />
            <h2 className="kh2-h2">
              {CARE.title.map((l, i) => <span key={i} className="kh2-block">{l}</span>)}
            </h2>
            <div className="kh2-care-ps">
              {CARE.paragraphs.map((p, i) => <p key={i} className="kh2-care-p">{p}</p>)}
            </div>
            <div className="kh2-stats">
              {CARE.stats.map((s) => (
                <div key={s.value} className="kh2-stat">
                  <p className="kh2-stat-v">{s.value}</p>
                  <p className="kh2-stat-l">{s.label}</p>
                </div>
              ))}
            </div>
            <Link href={CARE.cta.href} className="kh2-btn2 kh2-btn2--sec kh2-btn2--m kh2-care-cta">{CARE.cta.label}</Link>
          </div>
          <div className="kh2-care-media">
            <span className="kh2-play" aria-hidden>▶</span>
          </div>
        </div>
      </section>

      {/* ══ reviews ═══════════════════════════════════════════════════════ */}
      <section className="kh2-sec kh2-rev-sec">
        <div className="kh2-in kh2-rev-head">
          <h2 className="kh2-h2 kh2-rev-h">
            <span className="kh2-lap">{REVIEWS.title}</span>
            <span className="kh2-ph">{REVIEWS.phoneTitle.map((l) => <span key={l} className="kh2-block">{l}</span>)}</span>
          </h2>
          <div className="kh2-rating">
            <GoogleMark />
            <span className="kh2-rating-t">
              <small>{REVIEWS.rating.label}</small>
              <span><b>{REVIEWS.rating.score}</b> <em>★★★★★</em></span>
            </span>
          </div>
        </div>
        {/* Laptop: a tall card, then two stacked, running on a loop (the set
            is drawn twice and the track slides one set). Phone: a swipe
            carousel of equal cards with dots. */}
        <div className="kh2-reviews" ref={reviewsRef} onScroll={onReviewsScroll}>
          <div className="kh2-rev-track">
            {[0, 1].map((pass) => (
              <div className="kh2-rev-set" key={pass} aria-hidden={pass === 1 || undefined}>
                {[0, 1, 2].map((run) => {
                  const groups = reviewGroups.map((group, g) => (
                    <Fragment key={g}>
                      <ReviewCard r={group[0]} big />
                      {group.length > 1 && (
                        <div className="kh2-rev-col">
                          {group.slice(1).map((r, i) => <ReviewCard key={i} r={r} />)}
                        </div>
                      )}
                    </Fragment>
                  ));
                  // Past 1920 one run is not wide enough to loop, so the spares show.
                  return run === 0
                    ? <Fragment key={run}>{groups}</Fragment>
                    : <div className="kh2-rev-spare" key={run} aria-hidden>{groups}</div>;
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="kh2-dots kh2-rev-dots">
          {REVIEWS.items.map((r, i) => (
            <button
              key={i} type="button"
              className={i === reviewAt ? 'is-on' : ''}
              aria-label={`Show review ${i + 1} of ${REVIEWS.items.length}`}
              aria-current={i === reviewAt || undefined}
              onClick={() => goToReview(i)}
            />
          ))}
        </div>
      </section>

      {/* ══ experts ═══════════════════════════════════════════════════════ */}
      <section className="kh2-sec kh2-exp-sec">
        <div className="kh2-in">
          <h2 className="kh2-h2 kh2-center kh2-exp-h">{EXPERTS.title}</h2>
        </div>

        {/* Two rows of faces running edge to edge, the second the other way.
            Each row is drawn three times and slides one copy's width, so there
            is no seam even where one copy (2072) is narrower than the screen.
            White fades at both ends, as the design blurs them. */}
        <div className="kh2-strip" aria-hidden>
          {FACES.map((row, r) => (
            <div key={r} className={`kh2-strip-row${r % 2 ? ' is-rev' : ''}`}>
              <div className="kh2-strip-track">
                {[...row, ...row, ...row].map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} className="kh2-tile" src={src} alt="" loading="lazy" width={132} height={132} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="kh2-in">
          <div className="kh2-feats">
            {EXPERTS.cards.map((c, i) => {
              const open = openExpert === i;
              return (
                <div key={c.title} className={`kh2-feat${open ? ' is-open' : ''}`}>
                  <button type="button" className="kh2-feat-head" aria-expanded={open} onClick={() => setOpenExpert(open ? -1 : i)}>
                    <h3 className="kh2-feat-t">{c.title}</h3>
                    <PlusMinus open={open} />
                  </button>
                  <Reveal open={open} phone>
                    <ul className="kh2-feat-l">
                      {c.lines.map((l) => <li key={l}><Check size={18} />{l}</li>)}
                    </ul>
                  </Reveal>
                </div>
              );
            })}
          </div>

          <div className="kh2-exp-ctas">
            <Link href={EXPERTS.secondaryCta.href} className="kh2-textlink">
              {EXPERTS.secondaryCta.label}<ArrowRight />
            </Link>
            <Link href={EXPERTS.primaryCta.href} className="kh2-btn2 kh2-btn2--pri kh2-btn2--m">{EXPERTS.primaryCta.label}</Link>
          </div>
        </div>
      </section>

      {/* ══ services ══════════════════════════════════════════════════════ */}
      <section className="kh2-sec kh2-svc-sec">
        <div className="kh2-in">
          <h2 className="kh2-h2 kh2-center kh2-svc-h">{SERVICES.title}</h2>
          <div className="kh2-rail">
            <button type="button" className="kh2-rail-arrow" aria-label="Previous service"
              disabled={serviceTab <= 0} onClick={() => pickService(serviceTab - 1)}>
              <Chevron dir="left" />
            </button>
            <div className="kh2-tabs" ref={serviceTabsRef} role="tablist">
              {SERVICES.tabs.map((t, i) => (
                <button key={t} type="button" role="tab"
                  className={`kh2-tab${i === serviceTab ? ' is-on' : ''}`}
                  aria-selected={i === serviceTab}
                  onClick={() => pickService(i)}>{t}</button>
              ))}
            </div>
            <button type="button" className="kh2-rail-arrow" aria-label="Next service"
              disabled={serviceTab >= lastService} onClick={() => pickService(serviceTab + 1)}>
              <Chevron dir="right" />
            </button>
          </div>
        </div>

        {/* Every panel sits on one track; the next one peeks in from the right. */}
        <div className="kh2-slides" role="region" aria-label={SERVICES.title}
          onTouchStart={onServiceTouchStart} onTouchEnd={onServiceTouchEnd}>
          <div className="kh2-track" style={{ '--at': serviceTab }}>
            {SERVICES.panels.map((p, i) => (
              <article key={p.title} className={`kh2-slide${i === serviceTab ? ' is-on' : ''}`}
                aria-hidden={i === serviceTab ? undefined : true}>
                <div className="kh2-slide-media">
                  {/* Sideways off-screen never counts as near, so lazy panels
                      would blink in; load this one and the next early. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.imageAlt || ''} width={445} height={301}
                    loading={i <= serviceTab + 1 ? 'eager' : 'lazy'} />
                </div>
                <div className="kh2-slide-body">
                  <h3 className="kh2-slide-t">{p.title}</h3>
                  <p className="kh2-slide-lead">{p.lead}</p>
                  <ul className="kh2-slide-l">{p.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
                  <Link href={p.href || BOOK} className="kh2-btn2 kh2-btn2--sec kh2-btn2--m kh2-slide-cta"
                    tabIndex={i === serviceTab ? undefined : -1}>{p.price}</Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="kh2-dots kh2-svc-dots">
          {SERVICES.panels.map((p, i) => (
            <button key={p.title} type="button"
              aria-label={SERVICES.tabs[i]} aria-current={i === serviceTab || undefined}
              className={i === serviceTab ? 'is-on' : ''}
              onClick={() => pickService(i)} />
          ))}
        </div>
      </section>

      {/* ══ faq ═══════════════════════════════════════════════════════════ */}
      <section className="kh2-sec kh2-faq-sec">
        <div className="kh2-in">
          <h2 className="kh2-h2 kh2-center">
            <span className="kh2-lap">{FAQ.title}</span>
            <span className="kh2-ph">{FAQ.phoneTitle}</span>
          </h2>
          <div className="kh2-rail kh2-faq-rail">
            <button type="button" className="kh2-rail-arrow" aria-label="Previous category"
              disabled={faqAt <= 0} onClick={() => pickFaq(FAQ.tabs[faqAt - 1])}>
              <Chevron dir="left" />
            </button>
            <div className="kh2-tabs" ref={faqTabsRef} role="tablist">
              {FAQ.tabs.map((t) => (
                <button key={t} type="button" role="tab"
                  className={`kh2-tab${t === faqTab ? ' is-on' : ''}`}
                  aria-selected={t === faqTab}
                  onClick={() => pickFaq(t)}>{t}</button>
              ))}
            </div>
            <button type="button" className="kh2-rail-arrow" aria-label="Next category"
              disabled={faqAt >= FAQ.tabs.length - 1} onClick={() => pickFaq(FAQ.tabs[faqAt + 1])}>
              <Chevron dir="right" />
            </button>
          </div>

          <div className="kh2-faq">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q} className={`kh2-faq-row${open ? ' is-open' : ''}`}>
                  <button type="button" className="kh2-faq-q" aria-expanded={open}
                    onClick={() => { if (!open) track('ui_toggle', { element: 'faq_question', index: i }); setOpenFaq(open ? -1 : i); }}>
                    <span>{f.q}</span>
                    <PlusMinus open={open} />
                  </button>
                  <Reveal open={open}><p className="kh2-faq-a">{f.a}</p></Reveal>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ blogs & events ════════════════════════════════════════════════ */}
      {posts.length > 0 && (
        <section className="kh2-sec kh2-blog-sec">
          <div className="kh2-in">
            <span className="kh2-chip kh2-chip--c kh2-lap">{BLOGS.eyebrow}</span>
            <h2 className="kh2-h2 kh2-center">
              <span className="kh2-lap">{BLOGS.title}</span>
              <span className="kh2-ph">{BLOGS.phoneTitle.map((l) => <span key={l} className="kh2-block">{l}</span>)}</span>
            </h2>
            <div className="kh2-posts">
              {posts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="kh2-post">
                  {post.featured_image_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img className="kh2-post-img" src={post.featured_image_url} alt="" loading="lazy" />
                    : <span className="kh2-post-img is-blank" aria-hidden />}
                  <span className="kh2-post-t">{post.title}</span>
                  <span className="kh2-post-more">
                    <span className="kh2-ph">{BLOGS.readMore}</span>
                    <ArrowUpRight size={24} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ final cta ═════════════════════════════════════════════════════ */}
      <section className="kh2-final">
        <div className="kh2-in kh2-center">
          <span className="kh2-final-tag"><Clock />{FINAL_CTA.eyebrow}</span>
          <h2 className="kh2-h2 kh2-final-h">{FINAL_CTA.title}</h2>
          <Link href={BOOK} className="kh2-btn2 kh2-btn2--pri kh2-btn2--m kh2-final-b">{FINAL_CTA.primary}</Link>
        </div>
      </section>
    </main>
  );
}

/** The panel beside the offer tiles. */
function OfferBody({ o }) {
  return (
    <>
      <div className="kh2-panel-head">
        <img className="kh2-panel-i" src={`${ART}/${o.icon}.png`} alt="" />
        <h3 className="kh2-panel-h">{o.panel.heading.map((l, i) => <span key={i} className="kh2-block">{i > 0 && ' '}{l}</span>)}</h3>
      </div>
      <p className="kh2-panel-lead">{o.panel.lead}</p>
      <ul className="kh2-panel-l">
        {o.panel.bullets.map((b) => <li key={b}><Check />{b}</li>)}
      </ul>
      <p className="kh2-panel-pack">{o.panel.packages}</p>
      <div className="kh2-panel-cta">
        <Link href={BOOK} className="kh2-btn2 kh2-btn2--pri kh2-btn2--m">{o.panel.price}</Link>
        <Link href={o.panel.link.href} className="kh2-panel-link">{o.panel.link.label}<ArrowUpRight /></Link>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------------ */

const CSS = `
.kh2{
  --green:#189E4F; --green-hover:#0D4F1F; --green-dark:#1B6930; --green-light:#EFFFEA;
  --deep:#063327; --ink:#0F0F0F; --body:#373737; --soft:#5C5C5C; --hint:#BCBCBC;
  --line:#E3E2E2; --line-green:#BFE3CB; --line-soft:#DDEED8; --grey-bg:#F8F8F8;
  --sans:'Poppins',ui-sans-serif,system-ui,sans-serif;
  --text:'Inter',ui-sans-serif,system-ui,sans-serif;
  background:#fff;color:var(--ink);font-family:var(--text);
}
.kh2 *{box-sizing:border-box;}
:where(.kh2) p{margin:0;}
:where(.kh2) ul{list-style:none;margin:0;padding:0;}
.kh2 button{font:inherit;}
.kh2-ph{display:none!important;}
.kh2-block{display:block;}
.kh2-center{text-align:center;}
/* The design's column is 1180 at x=370 on the 1920 frame; sections that sit
   narrower set --w. 24px gutters either side. */
.kh2-in{width:100%;max-width:calc(var(--w,1180px) + 48px);margin:0 auto;padding:0 24px;}
.kh2-sec{padding:80px 0;}

/* ---- type ---- */
.kh2-h1,.kh2-h1:not(#_){
  font-family:var(--sans)!important;font-size:58px!important;font-weight:600!important;
  line-height:64px!important;letter-spacing:0!important;color:var(--ink)!important;margin:0;
}
.kh2-h2,.kh2-h2:not(#_){
  font-family:var(--sans)!important;font-size:32px!important;font-weight:600!important;
  line-height:48px!important;letter-spacing:0!important;color:var(--ink)!important;margin:0;
}
.kh2-sub{
  font-family:var(--text)!important;font-size:16px!important;font-weight:400!important;
  line-height:24px!important;letter-spacing:0!important;color:var(--body)!important;margin:8px 0 0;
}
.kh2-chip{
  display:inline-flex;align-items:center;height:32px;padding:0 12px;border-radius:4px;
  background:#F9FFF8;box-shadow:0 1px 4px rgba(36,36,36,.10);
  font-family:var(--text)!important;font-size:14px!important;line-height:22px!important;color:var(--body)!important;
}
.kh2-chip--c{display:flex;width:fit-content;margin:0 auto 12px;}

/* ---- buttons (the design's Button component) ---- */
.kh2-btn2{
  display:inline-flex;align-items:center;justify-content:center;gap:10px;white-space:nowrap;
  border-radius:8px;text-decoration:none;cursor:pointer;
  font-family:var(--text)!important;font-size:16px!important;font-weight:500!important;
  line-height:24px!important;letter-spacing:0!important;
  transition:background-color .18s ease,border-color .18s ease,color .18s ease;
}
.kh2-btn2--xl{height:56px;padding:0 22px;font-weight:600!important;}
.kh2-btn2--m{height:40px;padding:0 18px;}
.kh2-btn2--pri{background:var(--green);color:#fff!important;border:0;}
.kh2-btn2--pri:hover{background:var(--green-hover);}
.kh2-btn2--sec{background:#fff;color:var(--ink)!important;border:1px solid var(--line-green);}
.kh2-btn2--sec:hover{border-color:var(--green);}
.kh2-textlink{
  display:inline-flex;align-items:center;justify-content:center;gap:12px;height:40px;padding:0 18px;
  color:var(--green)!important;text-decoration:none;
  font-family:var(--text)!important;font-size:16px!important;line-height:24px!important;
}
.kh2-textlink svg{transition:transform .2s ease;}
.kh2-textlink:hover svg{transform:translateX(3px);}

/* ---- accordion body ---- */
.kh2-reveal{display:grid;grid-template-rows:0fr;transition:grid-template-rows .4s cubic-bezier(.4,0,.2,1);}
.kh2-reveal.is-open{grid-template-rows:1fr;}
.kh2-reveal-in{min-height:0;overflow:hidden;visibility:hidden;opacity:0;transition:opacity .25s ease,visibility 0s linear .4s;}
.kh2-reveal.is-open > .kh2-reveal-in{visibility:visible;opacity:1;transition:opacity .35s ease .05s,visibility 0s;}
.kh2-reveal--phone,.kh2-reveal--phone > .kh2-reveal-in{display:contents;}
.kh2-reveal--phone > .kh2-reveal-in{visibility:visible;opacity:1;}

/* ════ hero ════ */
.kh2-hero{background:#FAFCF9;padding-top:132px;position:relative;overflow:hidden;}
.kh2-hero-in{text-align:center;position:relative;z-index:2;}
.kh2-h1 > span{display:block;}
/* The rotating line: hidden sizers set its box, the visible word overlays. */
.kh2-h1-rot{display:grid!important;}
.kh2-h1-rot > span{grid-area:1 / 1;}
.kh2-h1-size{visibility:hidden;}
.kh2-h1-word{display:block;animation:kh2-word-in .5s cubic-bezier(.22,.7,.3,1) both;}
.kh2-h1-word.is-out{display:none;}
.kh2-h1-word.is-first{animation:none;}
@keyframes kh2-word-in{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:none;}}
@keyframes kh2-fade-in{from{opacity:0;}to{opacity:1;}}
@keyframes kh2-fade-out{from{opacity:1;}to{opacity:0;}}
@media (prefers-reduced-motion:reduce){ .kh2-h1-word{animation:kh2-fade-in .4s ease both;} }
.kh2-hero-sub{
  margin-top:8px;font-family:var(--text)!important;font-size:18px!important;font-weight:400!important;
  line-height:26px!important;letter-spacing:0!important;color:var(--body)!important;
}
.kh2-accent{color:var(--green);}

/* The question box and its two buttons: 592 wide, the box framed in green. */
.kh2-ask-wrap{
  width:592px;max-width:100%;margin:32px auto 0;
  display:grid;grid-template-columns:285fr 291fr;gap:24px 16px;
}
.kh2-ask{display:contents;}
.kh2-ask-box{
  grid-column:1 / -1;background:var(--green-light);border:1px solid var(--line-soft);
  border-radius:16px;padding:8px;
}
.kh2-ask-input{
  display:block;width:100%;height:88px;resize:none;border:2px solid var(--line-soft);border-radius:12px;
  /* The text sits 16 in from the outer edge, 2 of it border, and gets the
     full 560 the frame gives it, so the placeholder stays on one line. */
  background:#fff;padding:14px 0 14px 14px;color:var(--ink);
  box-shadow:0 8px 24px -8px rgba(24,158,79,.10),0 2px 8px -4px rgba(24,158,79,.08);
  font-family:var(--text)!important;font-size:16px!important;line-height:24px!important;letter-spacing:0!important;
}
.kh2-ask-input::placeholder{color:var(--hint);}
.kh2-ask-input:focus{outline:none;border-color:var(--green);}
.kh2-concern{
  height:56px;display:inline-flex;align-items:center;justify-content:center;gap:12px;
  background:#fff;border:1px solid var(--line-green);border-radius:8px;padding:0 18px;cursor:pointer;
  font-family:var(--text)!important;font-size:16px!important;font-weight:400!important;line-height:24px!important;color:#000!important;
  transition:border-color .18s ease;
}
.kh2-concern:hover{border-color:var(--green);}
.kh2-trio{color:var(--green);flex:none;}
.kh2-book{
  height:56px;display:inline-flex;align-items:center;justify-content:center;
  background:var(--green);color:#fff!important;border-radius:8px;text-decoration:none;
  font-family:var(--text)!important;font-size:16px!important;font-weight:600!important;line-height:24px!important;
  transition:background-color .18s ease;
}
.kh2-book:hover{background:var(--green-hover);}

/* The clip band, 227 tall. The frame puts it 72 under a 362 box that its
   380 of content overflows, so it sits 54.4 under the buttons. */
.kh2-foliage{position:relative;margin-top:54.4px;height:227px;pointer-events:none;}
.kh2-clips{
  position:absolute;left:0;right:0;bottom:-1px;width:100%;height:100%;
  background:url('/hero-calm-desktop.webp') center bottom / 100% 100% no-repeat;
}
.kh2-clips.is-mob{background-image:url('/hero-calm-mobile.webp');}
.kh2-clip{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:fill;}
.kh2-clip.is-buffer{opacity:0;}

/* The stat card: 431 x 85, 81 down the band, with a 416-wide card showing
   9px beneath it. */
.kh2-badge-wrap{position:absolute;top:81px;left:50%;width:431px;margin-left:-215.5px;z-index:3;}
.kh2-badge-stack{
  position:absolute;left:7.5px;right:7.5px;bottom:-9px;height:30px;
  background:#fff;border:1px solid #E5E5EA;border-radius:12px;box-shadow:0 5px 16px rgba(16,14,14,.05);
}
.kh2-badge-deck{position:relative;height:85px;}
.kh2-badge{
  position:absolute;inset:0;display:flex;align-items:center;gap:12px;padding:18px;
  border:1px solid var(--line-soft);border-radius:12px;
  background:linear-gradient(180deg,#fff 0%,#F9FBF6 30%,#E7F1DF 100%);
}
.kh2-badge.is-out{z-index:1;animation:kh2-card-under .55s cubic-bezier(.4,0,.2,1) both;}
.kh2-badge.is-in{z-index:2;animation:kh2-card-in .55s cubic-bezier(.22,.7,.3,1) both;}
@keyframes kh2-card-under{
  0%{opacity:1;transform:none;}
  55%{opacity:.55;transform:translateY(7px) scale(.955);}
  100%{opacity:0;transform:translateY(11px) scale(.94);}
}
@keyframes kh2-card-in{
  0%{opacity:0;transform:translateY(30px) scale(.93);}
  40%{opacity:1;transform:translateY(13px) scale(.975);}
  100%{opacity:1;transform:none;}
}
@media (prefers-reduced-motion:reduce){
  .kh2-badge.is-in{animation:kh2-fade-in .45s ease both;}
  .kh2-badge.is-out{animation:kh2-fade-out .45s ease both;}
}
.kh2-badge-i{flex:none;width:47px;height:47px;}
.kh2-badge-copy{min-width:0;text-align:left;}
.kh2-badge-t{
  font-family:var(--text)!important;font-size:16px!important;font-weight:500!important;
  line-height:24px!important;letter-spacing:0!important;color:var(--green)!important;
}
.kh2-badge-b{
  margin-top:2px;font-family:var(--text)!important;font-size:14px!important;font-weight:400!important;
  line-height:22px!important;letter-spacing:0!important;color:var(--body)!important;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}

/* ════ therapists ════ */
.kh2-ther{padding:112px 0 80px;}
.kh2-ther-h{max-width:1120px;margin:0 auto!important;}
.kh2-filters{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:40px;min-height:64px;}
.kh2-fsearch{
  flex:0 0 375px;height:56px;display:flex;align-items:center;gap:8px;
  background:#fff;border:1px solid var(--line);border-radius:8px;padding:0 8px 0 16px;
}
.kh2-fsearch-q{flex:1;min-width:0;display:flex;align-items:center;gap:8px;color:#9CA3AF;}
.kh2-fsearch-q svg{flex:none;}
.kh2-fsearch input{
  flex:1;min-width:0;border:0;outline:0;background:none;padding:0;color:var(--ink);
  font-family:var(--text)!important;font-size:16px!important;line-height:24px!important;
}
.kh2-fsearch input::placeholder{color:var(--hint);}
.kh2-fsearch input::-webkit-search-cancel-button{cursor:pointer;}
.kh2-flang{
  position:relative;flex:none;width:157px;height:40px;display:flex;align-items:center;justify-content:space-between;
  background:#F9F9F9;border:1px solid var(--line);border-radius:4px;padding:0 8px 0 12px;color:#9CA3AF;cursor:pointer;
}
.kh2-flang-v{
  display:inline-flex;align-items:baseline;gap:4px;
  font-family:var(--text)!important;font-size:14px!important;font-weight:500!important;line-height:22px!important;color:var(--ink)!important;
}
.kh2-flang-v small{font-size:12px;font-weight:400;line-height:18px;color:var(--soft);}
.kh2-flang select{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;}
.kh2-quicks{flex:none;display:flex;gap:16px;padding:4px;border-radius:8px;background:#fff;}
.kh2-quick{
  height:56px;display:inline-flex;align-items:center;gap:8px;padding:0 12px;
  background:#fff;border:1px solid var(--line);border-radius:8px;cursor:pointer;
  font-family:var(--text)!important;font-size:16px!important;font-weight:400!important;line-height:24px!important;color:var(--ink)!important;
  transition:background-color .18s ease,border-color .18s ease,color .18s ease;
}
.kh2-quick img{width:32px;height:32px;flex:none;}
.kh2-quick:hover{border-color:var(--line-green);}
.kh2-quick.is-on{background:var(--green-light);border-color:var(--line-green);color:var(--green-dark)!important;}
.kh2-empty{margin-top:24px!important;text-align:center;font-family:var(--text)!important;font-size:14px!important;color:var(--soft)!important;}
.kh2-tgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin-top:16px;}
.kh2-ther-more{margin-top:24px;}

/* ════ how it works ════ */
.kh2-how{background:var(--grey-bg);}
.kh2-how-head{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:12px;}
.kh2-how-head > div{max-width:640px;}
.kh2-how-cta{width:220px;}
.kh2-how-foot{display:none;}
.kh2-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin-top:40px;}
.kh2-step{
  display:flex;flex-direction:column;gap:24px;min-height:206px;overflow:hidden;
  background:#fff;border:1px solid var(--line);border-radius:16px;padding:24px;
}
.kh2-step-head{display:flex;align-items:flex-start;gap:12px;}
.kh2-step-n{
  flex:none;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;
  border:1px solid var(--line-green);border-radius:8px;
  font-family:var(--text)!important;font-size:12px!important;font-weight:500!important;line-height:18px!important;color:var(--ink)!important;
}
.kh2-step-t,.kh2-step-t:not(#_){
  font-family:var(--text)!important;font-size:18px!important;font-weight:500!important;
  line-height:26px!important;letter-spacing:0!important;color:var(--ink)!important;margin:0;
}
.kh2-step-b{
  margin-top:4px;font-family:var(--text)!important;font-size:14px!important;font-weight:400!important;
  line-height:22px!important;letter-spacing:0!important;color:var(--soft)!important;
}
.kh2-step-art{display:flex;align-items:center;height:58px;margin-top:auto;}
.kh2-step-faces{gap:10px;}
.kh2-step-faces img{width:58px;height:58px;border-radius:50%;object-fit:cover;flex:none;background:#EFF4F0;}
/* The strip is 70 tall in a 58 slot, overhanging 6 each way. It is 344 wide
   and starts 138 left of the card's padding, so the card clips it and only
   the last days show, fading in from the left; the time box sits 15.7 on. */
.kh2-step-dates{gap:15.7px;margin-left:-24px;}
.kh2-step-days{
  flex:0 0 230px;min-width:0;height:70px;display:flex;align-items:center;justify-content:flex-end;gap:16px;
  overflow:hidden;background:#F9F9F9;border-radius:0 8px 8px 0;padding:0 12px 0 0;
  -webkit-mask-image:linear-gradient(90deg,transparent 0,transparent 24px,#000 96px);
  mask-image:linear-gradient(90deg,transparent 0,transparent 24px,#000 96px);
}
.kh2-step-days span{flex:none;display:flex;flex-direction:column;align-items:center;gap:6px;width:32px;}
.kh2-step-days small{font-family:var(--text);font-size:12px;font-weight:500;line-height:18px;color:var(--ink);}
.kh2-step-days b{
  width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;
  font-family:var(--text);font-size:12px;font-weight:400;line-height:18px;color:#9CA3AF;
}
.kh2-step-days .is-on b{background:var(--green-dark);color:#fff;}
.kh2-step-days span:not(.is-past):not(.is-on) b{color:var(--body);}
.kh2-step-slot{
  flex:none;width:104px;height:70px;display:flex;flex-direction:column;justify-content:center;gap:8px;
  background:#F9F9F9;border-radius:8px;padding:0 8px;text-align:center;
}
.kh2-step-slot small{font-family:var(--text);font-size:12px;line-height:18px;color:var(--ink);}
.kh2-step-slot b{font-family:var(--text);font-size:16px;font-weight:500;line-height:24px;color:var(--green-dark);}
.kh2-step-call{gap:8px;height:60px;}
.kh2-step-tile{position:relative;height:60px;border-radius:8px;overflow:hidden;background:#EFF4F0;}
.kh2-step-tile--a{flex:196 1 0;}
.kh2-step-tile--b{flex:125 1 0;}
.kh2-step-tile img{width:100%;height:100%;object-fit:cover;display:block;}
.kh2-step-dots{position:absolute;right:4px;top:13px;display:flex;flex-direction:column;gap:2.5px;}
.kh2-step-dots i{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.9);display:block;}
.kh2-step-dots i:nth-child(2){background:#EF4444;}

/* ════ what koott offers ════ */
.kh2-offers{display:grid;grid-template-columns:664fr 484fr;gap:32px;margin-top:40px;}
.kh2-offer-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:32px;}
.kh2-offer-tile{
  min-height:241px;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;gap:16px;
  padding:20px 22px;text-align:left;cursor:pointer;
  background:#fff;border:1px solid var(--line);border-radius:16px;
  transition:border-color .2s ease,box-shadow .2s ease;
}
.kh2-offer-tile:hover{border-color:var(--line-green);}
.kh2-offer-tile.is-on{border-color:var(--green);box-shadow:0 8px 12px #EBF3EE;}
.kh2-offer-i{width:56px;height:56px;flex:none;}
.kh2-offer-i--offer-1{width:92px;height:92px;}
.kh2-offer-copy{display:flex;flex-direction:column;gap:4px;}
.kh2-offer-t{
  font-family:var(--sans)!important;font-size:20px!important;font-weight:500!important;
  line-height:30px!important;letter-spacing:0!important;color:var(--ink)!important;
}
.kh2-offer-n{font-family:var(--text)!important;font-size:14px!important;line-height:22px!important;color:var(--body)!important;}
.kh2-offer-panel{
  position:relative;display:grid;align-items:center;
  background:#F9FBF9;border:1px solid var(--line);border-radius:16px;padding:32px;
}
.kh2-offer-body{grid-area:1 / 1;}
.kh2-offer-body.is-out{animation:kh2-offer-out .18s cubic-bezier(.4,0,1,1) both;}
.kh2-offer-body.is-in{animation:kh2-offer-in .38s .2s cubic-bezier(0,0,.2,1) both;}
.kh2-offer-body.is-first{animation:none;}
@keyframes kh2-offer-out{from{opacity:1;transform:none;}to{opacity:0;transform:translateY(-6px);}}
@keyframes kh2-offer-in{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
@media (prefers-reduced-motion:reduce){
  .kh2-offer-body.is-out{animation:kh2-fade-out .16s ease-in both;}
  .kh2-offer-body.is-in{animation:kh2-fade-in .26s .18s ease-out both;}
  .kh2-offer-body.is-first{animation:none;}
}
.kh2-panel-i{display:none;}
.kh2-panel-h,.kh2-panel-h:not(#_){
  font-family:var(--sans)!important;font-size:24px!important;font-weight:600!important;
  line-height:36px!important;letter-spacing:0!important;color:var(--ink)!important;margin:0;
}
.kh2-panel-lead{margin-top:8px!important;font-family:var(--text)!important;font-size:16px!important;line-height:24px!important;color:var(--body)!important;}
.kh2-panel-l{display:flex;flex-direction:column;gap:12px;margin-top:24px!important;}
.kh2-panel-l li{
  display:flex;align-items:center;gap:8px;
  font-family:var(--text)!important;font-size:14px!important;line-height:22px!important;color:var(--body)!important;
}
.kh2-check{color:var(--green);flex:none;}
.kh2-panel-pack{margin-top:24px!important;font-family:var(--text)!important;font-size:12px!important;line-height:18px!important;color:var(--soft)!important;}
.kh2-panel-cta{display:flex;align-items:center;gap:16px;margin-top:24px;flex-wrap:wrap;}
.kh2-panel-link{
  display:inline-flex;align-items:center;gap:4px;text-decoration:none;
  font-family:var(--text)!important;font-size:14px!important;line-height:22px!important;color:var(--body)!important;
}
.kh2-panel-link:hover{color:var(--green)!important;}

/* ════ care ════ */
.kh2-care{--w:1132px;display:grid;grid-template-columns:713.57fr 396.43fr;gap:22px;}
.kh2-care-card{
  position:relative;overflow:hidden;border-radius:16px;padding:32px;
  background:linear-gradient(180deg,#E8F2E1 0%,rgba(190,219,172,0) 100%);
}
/* The Malayalam letter cut off at the card's top right. */
.kh2-care-mark{position:absolute;inset:0;width:100%;height:auto;pointer-events:none;}
.kh2-care-card > *:not(.kh2-care-mark){position:relative;}
.kh2-care-ps{display:flex;flex-direction:column;gap:8px;margin-top:8px;}
.kh2-care-p{font-family:var(--text)!important;font-size:16px!important;line-height:24px!important;color:var(--body)!important;}
.kh2-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;margin-top:24px;}
.kh2-stat{border-left:2px solid var(--green-dark);padding-left:18px;min-height:91px;}
.kh2-stat-v{
  font-family:var(--sans)!important;font-size:32px!important;font-weight:600!important;
  line-height:48px!important;letter-spacing:0!important;color:var(--green-dark)!important;
}
.kh2-stat-l{white-space:pre-line;font-family:var(--text)!important;font-size:14px!important;line-height:22px!important;color:var(--body)!important;}
.kh2-care-cta{margin-top:24px;}
.kh2-care-media{
  position:relative;border-radius:16px;overflow:hidden;min-height:598px;
  background:#EFF4F0 url('/design/home/care.webp') center/cover no-repeat;
}
.kh2-play{
  position:absolute;left:50%;top:50%;width:88px;height:64px;margin:-32px 0 0 -44px;
  display:flex;align-items:center;justify-content:center;border-radius:8px;
  background:var(--green);color:#fff;font-size:22px;line-height:33px;
}

/* ════ reviews ════ */
.kh2-rev-sec{background:var(--deep);overflow:hidden;}
.kh2-rev-head{--w:1132px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
.kh2-rev-h,.kh2-rev-h:not(#_){color:#fff!important;}
.kh2-rating{display:flex;align-items:center;gap:12px;flex:none;}
.kh2-rating-t{display:flex;flex-direction:column;}
.kh2-rating-t small{font-family:var(--text);font-size:12px;line-height:18px;color:#fff;}
.kh2-rating-t b{font-family:var(--text);font-size:14px;font-weight:400;line-height:21px;color:#fff;}
.kh2-rating-t em{font-style:normal;font-size:14px;line-height:21px;color:#F5A623;}
.kh2-reviews{position:relative;overflow:hidden;margin-top:80px;}
.kh2-reviews::-webkit-scrollbar{display:none;}
.kh2-rev-track{display:flex;width:max-content;animation:kh2-roll 72s linear infinite;}
.kh2-reviews:hover .kh2-rev-track{animation-play-state:paused;}
.kh2-rev-set{display:flex;align-items:flex-start;gap:24px;flex:none;margin-right:24px;}
@keyframes kh2-roll{from{transform:translate3d(0,0,0);}to{transform:translate3d(-50%,0,0);}}
.kh2-rev-spare{display:none;}
@media (min-width:1921px){ .kh2-rev-spare{display:contents;} .kh2-rev-track{animation-duration:216s;} }
@media (prefers-reduced-motion:reduce){ .kh2-rev-track{animation:none;} }
.kh2-rev-col{flex:none;display:flex;flex-direction:column;gap:27px;width:473px;}
.kh2-review{
  position:relative;isolation:isolate;flex:none;margin:0;min-height:192px;padding:20px;
  display:grid;grid-template-columns:40px minmax(0,1fr);grid-template-areas:"av who" "q q" "rate rate";
  align-content:start;align-items:center;column-gap:12px;row-gap:8px;
  background:#0A4636;border-radius:12px;
}
.kh2-review-av{
  grid-area:av;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.14);
  display:inline-flex;align-items:center;justify-content:center;
  font-family:var(--text);font-size:14px;font-weight:500;color:rgba(255,255,255,.72);
}
.kh2-review-who{grid-area:who;display:flex;flex-direction:column;gap:4px;min-width:0;}
.kh2-review-n{font-family:var(--text);font-size:16px;font-weight:500;line-height:24px;color:#fff;}
.kh2-review-p{font-family:var(--text);font-size:12px;line-height:18px;color:#fff;}
.kh2-review-q{
  grid-area:q;margin:0;padding:0;border:0;
  font-family:var(--text)!important;font-size:14px!important;font-weight:400!important;line-height:22px!important;color:#fff!important;
}
.kh2-review-rate{grid-area:rate;display:flex;align-items:center;gap:8px;}
.kh2-review-g{
  width:26px;height:26px;border-radius:50%;background:var(--deep);color:#fff;
  display:inline-flex;align-items:center;justify-content:center;font-family:var(--text);font-size:12px;
}
.kh2-review-s{font-family:var(--text);font-size:12px;line-height:18px;color:#fff;}
.kh2-review-stars{font-size:16px;line-height:24px;color:#F5A623;}
.kh2-review--big{
  width:452px;min-height:415px;border-radius:16px;
  grid-template-columns:124px minmax(0,1fr);grid-template-areas:"av who" "av rate" "q q";
  column-gap:26px;row-gap:16px;
  background:linear-gradient(180deg,#0A4636 0%,#18AC85 100%);
}
/* Figma lays a monotone grain over the gradient; the same noise tile the
   condition pages use. */
.kh2-review--big::before{
  content:"";position:absolute;inset:0;border-radius:inherit;z-index:-1;pointer-events:none;
  background:url('/design/noise.png') 0 0/150px 150px repeat;
}
.kh2-review--big .kh2-review-av{width:124px;height:124px;border-radius:12px;font-size:36px;align-self:start;}
.kh2-review--big .kh2-review-who{align-self:end;}
.kh2-review--big .kh2-review-rate{align-self:start;}
.kh2-review--big .kh2-review-q{font-size:23px!important;font-weight:500!important;line-height:32px!important;}
.kh2-dots{display:flex;justify-content:center;align-items:center;gap:7px;}
.kh2-dots button{
  width:8px;height:8px;padding:0;border:0;border-radius:999px;background:#D6DCD8;cursor:pointer;
  transition:width .2s ease,background-color .2s ease;
}
.kh2-dots button.is-on{width:20px;background:var(--green);}
.kh2-rev-dots{display:none;}

/* ════ experts ════ */
.kh2-exp-h{max-width:1120px;margin:0 auto!important;}
.kh2-strip{
  position:relative;margin-top:40px;display:flex;flex-direction:column;gap:16px;overflow:hidden;
  -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 18%,#000 82%,transparent 100%);
  mask-image:linear-gradient(90deg,transparent 0,#000 18%,#000 82%,transparent 100%);
}
.kh2-strip-row{overflow:hidden;}
.kh2-strip-track{display:flex;gap:16px;width:max-content;animation:kh2-roll3 55s linear infinite;}
@keyframes kh2-roll3{from{transform:translate3d(0,0,0);}to{transform:translate3d(-33.3333%,0,0);}}
.kh2-strip-row.is-rev .kh2-strip-track{animation-direction:reverse;animation-duration:62s;}
.kh2-strip-track{padding-right:16px;}
@media (prefers-reduced-motion:reduce){ .kh2-strip-track{animation:none;} }
.kh2-tile{width:132px;height:132px;border-radius:8px;object-fit:cover;flex:none;background:#EFF4F0;}
.kh2-feats{--w:1132px;display:grid;grid-template-columns:556fr 544fr;gap:32px;margin:48px auto 0;max-width:1132px;}
/* 182 tall with its hairline, as the fill is drawn. */
.kh2-feat{background:#FAFCF9;border:1px solid #E8EFE5;border-radius:12px;padding:23px 24px;}
.kh2-feat-head{
  width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;
  background:none;border:0;padding:0;text-align:left;cursor:default;color:var(--soft);
}
.kh2-feat-head .kh2-pm{display:none;}
.kh2-feat-t,.kh2-feat-t:not(#_){
  font-family:var(--sans)!important;font-size:20px!important;font-weight:600!important;
  line-height:28px!important;letter-spacing:0!important;color:var(--ink)!important;margin:0;
}
.kh2-feat-l{display:flex;flex-direction:column;gap:12px;margin-top:16px!important;}
.kh2-feat-l li{
  display:flex;align-items:center;gap:4px;
  font-family:var(--text)!important;font-size:14px!important;line-height:22px!important;color:var(--body)!important;
}
.kh2-exp-ctas{display:flex;justify-content:center;align-items:center;gap:16px;margin-top:40px;}
.kh2-exp-ctas .kh2-textlink{width:220px;}
.kh2-exp-ctas .kh2-btn2{width:214px;}

/* ════ services ════ */
.kh2-svc-sec{background:var(--grey-bg);overflow:hidden;}
.kh2-rail{display:flex;justify-content:center;align-items:center;margin-top:16px;}
.kh2-rail-arrow{display:none;}
.kh2-tabs{display:flex;gap:16px;padding:4px;border-radius:8px;}
.kh2-tab{
  flex:none;height:48px;padding:0 12px;border-radius:8px;cursor:pointer;white-space:nowrap;
  background:#fff;border:1px solid var(--line);
  font-family:var(--text)!important;font-size:16px!important;font-weight:400!important;line-height:24px!important;color:var(--ink)!important;
  transition:background-color .15s ease,border-color .15s ease,color .15s ease;
}
.kh2-tab:hover{border-color:var(--line-green);}
.kh2-tab.is-on{background:var(--green-light);border-color:var(--line-green);color:var(--green-dark)!important;}
/* The track starts on the 1132 column (x=394) and runs off the right edge. */
.kh2-slides{
  --pw:984.83px;--pg:24px;
  width:100%;max-width:calc(1132px + 48px);margin:24px auto 0;padding:0 24px;overflow:visible;
}
.kh2-track{
  display:flex;gap:var(--pg);
  transform:translateX(calc(var(--at,0) * -1 * (var(--pw) + var(--pg))));
  transition:transform .5s cubic-bezier(.22,.7,.3,1);
}
@media (prefers-reduced-motion:reduce){ .kh2-track{transition:none;} }
.kh2-slide{
  position:relative;isolation:isolate;flex:0 0 var(--pw);min-height:371px;
  display:grid;grid-template-columns:444.41fr 444.42fr;gap:26px;padding:35px 34px;
  border-radius:16px;background:linear-gradient(180deg,#0A4636 0%,#18AC85 100%);
}
.kh2-slide::before{
  content:"";position:absolute;inset:0;border-radius:inherit;z-index:-1;pointer-events:none;
  background:url('/design/noise.png') 0 0/150px 150px repeat;
}
.kh2-slide-media{border-radius:12px;overflow:hidden;background:var(--ink);height:301px;}
.kh2-slide-media img{width:100%;height:100%;object-fit:cover;display:block;}
.kh2-slide-body{display:flex;flex-direction:column;align-items:flex-start;}
.kh2-slide-t,.kh2-slide-t:not(#_){
  font-family:var(--sans)!important;font-size:24px!important;font-weight:600!important;
  line-height:36px!important;letter-spacing:0!important;color:#fff!important;margin:0;
}
.kh2-slide-lead{margin-top:16px!important;font-family:var(--text)!important;font-size:16px!important;line-height:24px!important;color:#fff!important;}
.kh2-slide-l{display:flex;flex-direction:column;gap:6px;margin-top:8px!important;padding-left:20px!important;}
.kh2-slide-l li{
  list-style:disc;font-family:var(--text)!important;font-size:16px!important;line-height:24px!important;color:#fff!important;
}
.kh2-slide-cta{margin-top:24px;}
.kh2-svc-dots{margin-top:20px;height:8px;}

/* ════ faq ════ */
.kh2-faq-sec .kh2-in{--w:860px;}
.kh2-faq{display:flex;flex-direction:column;gap:16px;margin-top:40px;}
.kh2-faq-row{
  border-radius:16px;background:#F7F7F7;
  transition:background-color .4s ease,box-shadow .4s ease;
}
/* The open row's white hairline is drawn as a ring so it adds no height. */
.kh2-faq-row.is-open{background:#F9FBF9;box-shadow:0 0 0 1px #fff,0 6px 15px rgba(0,0,0,.05);}
.kh2-faq-q{
  width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:16px;background:none;border:0;text-align:left;cursor:pointer;color:var(--ink);
}
.kh2-faq-q > span{font-family:var(--text)!important;font-size:18px!important;font-weight:500!important;line-height:26px!important;color:var(--ink)!important;}
.kh2-faq-q .kh2-pm{flex:none;color:var(--ink);}
.kh2-faq-row.is-open .kh2-faq-q .kh2-pm{color:var(--green);}
.kh2-faq-a{padding:1px 16px 25px;font-family:var(--text)!important;font-size:18px!important;line-height:26px!important;color:var(--body)!important;}

/* ════ blogs ════ */
.kh2-blog-sec{background:var(--grey-bg);}
.kh2-blog-sec .kh2-in{--w:1140px;}
.kh2-posts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:32px;margin-top:40px;}
.kh2-post{
  /* The hairline is a ring so the title gets the full 326.67 the frame gives
     it and wraps where the design wraps. */
  display:flex;flex-direction:column;min-height:346px;padding:16px;text-decoration:none;
  background:#fff;box-shadow:0 0 0 1px #F4F4F4;border-radius:16px;
  transition:box-shadow .2s ease,transform .2s ease;
}
.kh2-post:hover{box-shadow:0 0 0 1px var(--line-green);transform:translateY(-2px);}
.kh2-post-img{display:block;width:100%;height:210px;object-fit:cover;border-radius:12px;background:#EFF4F0;}
.kh2-post-img.is-blank{background:linear-gradient(180deg,#F0FFEC 0%,#D4FFC2 100%);}
.kh2-post-t{
  margin-top:16px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  font-family:var(--text)!important;font-size:16px!important;line-height:24px!important;color:var(--ink)!important;
}
.kh2-post-more{
  margin-top:auto;padding-top:16px;display:flex;align-items:center;justify-content:space-between;
  color:var(--green-dark);font-family:var(--text);font-size:14px;font-weight:500;line-height:22px;
}

/* ════ final cta ════ */
.kh2-final{background:linear-gradient(180deg,#FFFFFF 0%,#E7F1DF 100%);padding:78px 0 80px;}
.kh2-final-tag{
  display:inline-flex;align-items:center;gap:4px;height:40px;padding:0 12px;color:var(--ink);
  font-family:var(--text)!important;font-size:14px!important;line-height:22px!important;
}
.kh2-final-tag span,.kh2-final-tag{color:var(--body)!important;}
.kh2-final-tag svg{color:var(--ink);}
.kh2-final-h{margin-top:16px!important;}
.kh2-final-b{width:220px;margin-top:16px;}

/* ════ between the two frames ════
   Neither design has a tablet layout. Below the 1180 column the laptop layout
   keeps its proportions and the grids fold where they would crush. */
@media (max-width:1240px){
  .kh2-filters{flex-direction:column;align-items:stretch;}
  .kh2-fsearch{flex:none;width:100%;max-width:375px;margin:0 auto;}
  .kh2-quicks{justify-content:center;flex-wrap:wrap;}
  .kh2-slides{--pw:min(984.83px, calc(100vw - 96px));}
}
@media (max-width:1100px){
  .kh2-tgrid{grid-template-columns:repeat(2,minmax(0,1fr));}
  /* two across, so a third card would sit alone: show two, as the phone does */
  .kh2-tgrid > :nth-child(n+3){display:none;}
  .kh2-steps{grid-template-columns:1fr;max-width:560px;margin-left:auto;margin-right:auto;}
  .kh2-offers{grid-template-columns:1fr;}
  .kh2-care{grid-template-columns:1fr;}
  .kh2-care-media{min-height:480px;}
  .kh2-rev-head{flex-direction:column;align-items:flex-start;}
  .kh2-slide{grid-template-columns:1fr 1fr;}
  .kh2-posts{grid-template-columns:repeat(2,minmax(0,1fr));}
}
@media (max-width:860px) and (min-width:641px){
  .kh2-quicks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%;max-width:560px;margin:0 auto;}
  .kh2-feats{grid-template-columns:1fr;}
  .kh2-slide{grid-template-columns:1fr;}
  .kh2-how-head{flex-direction:column;align-items:flex-start;}
  .kh2-tabs{overflow-x:auto;scrollbar-width:none;max-width:100%;}
  .kh2-tabs::-webkit-scrollbar{display:none;}
  .kh2-rail{justify-content:flex-start;}
}

/* ════ the 390 phone frame ("Home mobile Updated") ════
   Last in the sheet so it wins on equal specificity. 16px gutters, headings
   24/32, body 14/22. */
@media (max-width:640px){
  .kh2-lap{display:none!important;}
  .kh2-ph{display:revert!important;}
  .kh2-in{padding:0 16px;}
  .kh2-sec{padding:48px 0;}
  .kh2-h2,.kh2-h2:not(#_){font-size:24px!important;line-height:32px!important;}

  /* hero: 123 under the header, the deck 76 under the button, the 89-tall
     garden flush with the foot — 707 in all. */
  .kh2-hero{padding-top:123px;}
  .kh2-h1,.kh2-h1:not(#_){font-size:32px!important;line-height:38.4px!important;}
  .kh2-hero-sub{margin-top:12px;font-size:14px!important;line-height:22px!important;}
  .kh2-ask-wrap{width:100%;margin-top:24px;display:flex;flex-direction:column;align-items:center;gap:16px;}
  .kh2-ask{
    display:flex;flex-direction:column;align-items:flex-start;gap:8px;width:100%;
    background:var(--green-light);border-radius:16px;padding:8px;
  }
  .kh2-ask-box{background:none;border:0;border-radius:0;padding:0;width:100%;}
  .kh2-ask-input{
    height:88px;border-width:1px;padding:11px 12px;box-shadow:none;
    font-size:14px!important;line-height:22px!important;
  }
  .kh2-concern{
    height:32px;gap:8px;padding:0 12px;border-color:var(--line);border-radius:6px;
    font-size:14px!important;font-weight:500!important;line-height:22px!important;color:#9CA3AF!important;
  }
  .kh2-concern .kh2-trio{width:16px;height:16px;}
  .kh2-book{width:165px;height:40px;font-weight:500!important;}
  .kh2-foliage{margin-top:0;height:249px;}
  .kh2-clips{height:89px;top:auto;}
  .kh2-clip{object-fit:cover;object-position:center bottom;}
  .kh2-badge-wrap{top:76px;width:292px;margin-left:-146px;}
  .kh2-badge-stack{left:11px;right:11px;bottom:-9px;height:40px;}
  .kh2-badge-deck{height:56px;}
  .kh2-badge{padding:0 10px 0 11px;gap:12px;}
  .kh2-badge-i{width:27px;height:27px;}
  .kh2-badge-t{font-size:12px!important;line-height:18px!important;}
  .kh2-badge-b{font-size:12px!important;line-height:18px!important;}

  /* therapists: search, the four chips two by two, then two cards. */
  .kh2-ther{padding:56px 0 48px;}
  .kh2-ther-h{max-width:358px;}
  .kh2-filters{margin-top:20px;gap:20px;}
  .kh2-fsearch{flex:none;width:100%;max-width:none;height:48px;padding:0 4px 0 16px;}
  .kh2-flang{width:151px;height:38px;padding:0 6px 0 10px;}
  /* filled down the columns, as the phone frame orders them */
  .kh2-quicks{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto auto;grid-auto-flow:column;gap:8px;padding:0;}
  .kh2-quick{
    height:76px;align-items:center;gap:4px;padding:0 16px;border-radius:16px;text-align:left;
    font-size:14px!important;line-height:22px!important;
  }
  .kh2-quick img{margin-right:4px;}
  .kh2-tgrid{grid-template-columns:1fr;gap:20px;margin-top:20px;}
  .kh2-tgrid > :nth-child(n+3){display:none;}
  .kh2-ther-more{margin-top:20px;}
  .kh2-ther-more-b{
    width:207px;height:32px;border-radius:6px;background:var(--green);border:0;color:#fff!important;
  }

  /* how it works: a plain label, a left heading, three stacked cards and
     the button under them. */
  .kh2-chip{display:block;height:auto;padding:0;background:none;box-shadow:none;font-size:12px!important;font-weight:500!important;line-height:18px!important;}
  .kh2-how .kh2-sub,.kh2-how-cta{display:none;}
  .kh2-how-head{margin-top:12px;}
  .kh2-steps{grid-template-columns:1fr;gap:16px;margin-top:24px;max-width:none;}
  .kh2-step{min-height:182px;padding:16px;gap:16px;}
  .kh2-step-n{width:30px;height:30px;color:var(--green-dark)!important;}
  .kh2-step-b{color:#7C7C7C!important;}
  .kh2-step-faces{gap:9px;}
  /* edge to edge of the card: the days from its left edge, the time box
     against its right one */
  .kh2-step-dates{margin:0 -16px;gap:16px;}
  .kh2-step-days{flex-basis:238px;}
  .kh2-step-slot{border-radius:8px 0 0 8px;}
  .kh2-how-foot{display:block;margin-top:24px;}
  .kh2-how-foot .kh2-btn2{width:189px;color:var(--body)!important;}

  /* what koott offers: four small tiles, then the chosen one's panel. */
  .kh2-offers{grid-template-columns:1fr;gap:24px;margin-top:24px;}
  .kh2-offers-sub{display:none;}
  .kh2-offer-tiles{gap:8px;}
  .kh2-offer-tile{
    order:var(--ph-order);min-height:76px;flex-direction:row;align-items:center;justify-content:flex-start;
    gap:4px;padding:0 16px;
  }
  .kh2-offer-tile.is-on{box-shadow:none;}
  .kh2-offer-i,.kh2-offer-i--offer-1{width:32px;height:32px;margin-right:4px;}
  .kh2-offer-n{display:none;}
  .kh2-offer-t,.kh2-offer-t:not(#_){font-family:var(--text)!important;font-size:14px!important;font-weight:400!important;line-height:22px!important;}
  .kh2-offer-tile.is-on .kh2-offer-t{font-weight:500!important;color:var(--green)!important;}
  .kh2-offer-panel{padding:24px;background:#F9FBF9;}
  .kh2-panel-head{display:flex;align-items:center;gap:18px;}
  .kh2-panel-i{display:block;width:56px;height:56px;flex:none;}
  .kh2-panel-h,.kh2-panel-h:not(#_){font-size:20px!important;line-height:28px!important;}
  .kh2-panel-h .kh2-block{display:inline;}
  /* the frame's 234 box holds a 235.5 line; let it overhang as drawn */
  .kh2-panel-h,.kh2-panel-h:not(#_){margin-right:-4px!important;}
  .kh2-panel-lead{margin-top:16px!important;font-size:14px!important;line-height:22px!important;}
  .kh2-panel-l{gap:10px;margin-top:16px!important;}
  .kh2-panel-l .kh2-check{width:18px;height:18px;color:#BBBBBB;}
  .kh2-panel-pack{margin-top:16px!important;color:#7C7C7C!important;}
  .kh2-panel-cta{flex-direction:column;align-items:flex-start;gap:16px;margin-top:16px;}
  .kh2-panel-link{order:-1;gap:6px;font-weight:500!important;color:var(--green-dark)!important;}

  /* care: the card, then the photo under it. */
  .kh2-care{grid-template-columns:1fr;gap:16px;}
  .kh2-care-card{padding:20px;}
  .kh2-care-mark{inset:auto;left:85px;top:7px;width:283px;}
  .kh2-care-ps{gap:20px;margin-top:12px;}
  .kh2-care-p{font-size:14px!important;line-height:22px!important;}
  .kh2-stats{gap:24px 16px;margin-top:20px;}
  .kh2-stat{min-height:92px;border-left-width:1px;padding-left:10px;}
  .kh2-stat-v{font-size:24px!important;line-height:32px!important;}
  .kh2-stat-l{margin-top:6px;white-space:normal;font-size:12px!important;line-height:18px!important;}
  .kh2-care-cta{margin-top:20px;color:var(--green-dark)!important;}
  .kh2-care-media{min-height:280px;}
  .kh2-play{width:64px;height:48px;margin:-24px 0 0 -32px;border-radius:12px;font-size:20px;}

  /* reviews: a band 48 in from the white, swiped one card at a time. */
  .kh2-rev-sec{background:#fff;padding:48px 0;}
  .kh2-rev-sec > *{background:var(--deep);}
  .kh2-rev-head{padding-top:32px;}
  .kh2-rating{display:none;}
  .kh2-reviews{
    margin-top:24px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;
    padding:0 16px;scroll-padding:0 16px;
  }
  .kh2-rev-track{animation:none;width:auto;}
  .kh2-rev-set{gap:12px;margin-right:0;}
  .kh2-rev-set + .kh2-rev-set,.kh2-rev-spare,.kh2-review--repeat{display:none!important;}
  .kh2-rev-col{display:contents;}
  .kh2-review,.kh2-review--big{
    width:326px;min-height:330px;padding:20px;border-radius:16px;scroll-snap-align:start;
    grid-template-columns:56px minmax(0,1fr);grid-template-areas:"av who" "q q" "rate rate";
    column-gap:12px;row-gap:20px;align-content:start;
    background:linear-gradient(180deg,#0A4636 0%,#18AC85 100%);
  }
  .kh2-review::before{
    content:"";position:absolute;inset:0;border-radius:inherit;z-index:-1;pointer-events:none;
    background:url('/design/noise.png') 0 0/150px 150px repeat;
  }
  .kh2-review-av,.kh2-review--big .kh2-review-av{width:56px;height:56px;border-radius:12px;font-size:18px;align-self:center;}
  .kh2-review--big .kh2-review-who{align-self:center;}
  .kh2-review-who{gap:3px;}
  .kh2-review-q,.kh2-review--big .kh2-review-q{font-size:18px!important;font-weight:500!important;line-height:26px!important;}
  .kh2-review-rate,.kh2-review--big .kh2-review-rate{
    justify-self:start;align-self:end;height:30px;gap:8px;padding:0 10px;border-radius:8px;background:var(--deep);
  }
  .kh2-review-g{width:auto;height:auto;background:none;}
  .kh2-review-stars{font-size:14px;line-height:17px;color:#F7B84B;}
  .kh2-rev-dots{display:flex;justify-content:flex-start;gap:5px;padding:24px 16px 32px;}
  .kh2-rev-dots button{width:6px;height:6px;}
  .kh2-rev-dots button.is-on{width:20px;}

  /* experts: smaller faces, and the four cards fold into an accordion. */
  .kh2-exp-h{max-width:358px;}
  .kh2-strip{margin-top:24px;gap:8px;}
  .kh2-strip-track{gap:8px;padding-right:8px;}
  .kh2-tile{width:64px;height:70px;border-radius:10px;}
  .kh2-feats{grid-template-columns:1fr;gap:10px;margin-top:24px;}
  .kh2-feat{padding:16px;border-radius:16px;background:#F9FBF9;border-color:#DDEDD8;}
  .kh2-feat-head{cursor:pointer;}
  .kh2-feat-head .kh2-pm{display:block;flex:none;}
  .kh2-feat-l{padding-bottom:8px;}
  .kh2-feat-t,.kh2-feat-t:not(#_){font-family:var(--text)!important;font-size:18px!important;font-weight:500!important;line-height:26px!important;}
  .kh2-reveal--phone{display:grid;}
  .kh2-reveal--phone > .kh2-reveal-in{display:block;visibility:hidden;opacity:0;}
  .kh2-reveal--phone.is-open > .kh2-reveal-in{visibility:visible;opacity:1;}
  .kh2-exp-ctas{justify-content:flex-start;flex-wrap:wrap;gap:12px;margin-top:24px;}
  .kh2-exp-ctas .kh2-textlink{width:132px;}

  /* services: the tab rail gets arrows and fades, the stories swipe. */
  .kh2-rail{position:relative;margin-top:20px;justify-content:flex-start;}
  .kh2-rail-arrow{
    display:flex;align-items:center;justify-content:center;position:absolute;top:50%;z-index:2;
    width:40px;height:40px;margin-top:-20px;padding:0;border:0;background:none;color:var(--ink);cursor:pointer;
  }
  .kh2-rail-arrow:first-child{left:-8px;}
  .kh2-rail-arrow:last-child{right:-8px;}
  .kh2-rail-arrow:disabled{opacity:.3;cursor:default;}
  .kh2-rail .kh2-tabs{
    width:100%;overflow-x:auto;scrollbar-width:none;gap:8px;padding:2px 32px;
    -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 64px,#000 calc(100% - 64px),transparent 100%);
    mask-image:linear-gradient(90deg,transparent 0,#000 64px,#000 calc(100% - 64px),transparent 100%);
  }
  .kh2-rail .kh2-tabs::-webkit-scrollbar{display:none;}
  .kh2-svc-sec .kh2-tab{height:40px;}
  .kh2-svc-sec .kh2-rail .kh2-tabs{padding-top:6px;padding-bottom:6px;}
  .kh2-slides{--pw:326px;--pg:12px;padding:0 16px;margin-top:20px;}
  .kh2-slide{min-height:538px;display:flex;flex-direction:column;gap:20px;padding:20px;}
  .kh2-slide-media{height:194px;flex:none;}
  .kh2-slide-body{flex:1;}
  .kh2-slide-t,.kh2-slide-t:not(#_){font-size:20px!important;line-height:28px!important;}
  .kh2-slide-lead{margin-top:20px!important;font-size:14px!important;line-height:22px!important;}
  .kh2-slide-l{margin-top:20px!important;gap:10px;}
  .kh2-slide-l li{font-size:14px!important;line-height:22px!important;}
  .kh2-slide-cta{width:100%;height:48px;margin-top:auto;}
  .kh2-svc-dots{display:none;}

  /* faq */
  .kh2-faq{gap:12px;margin-top:20px;}
  .kh2-faq-q{padding:17px 16px;}
  .kh2-faq-q > span{font-size:16px!important;line-height:24px!important;}
  .kh2-faq-row.is-open{box-shadow:0 0 0 1px #E8EFE4,0 6px 15px rgba(0,0,0,.05);}
  .kh2-faq-a{padding:0 16px 27px;font-size:14px!important;line-height:22px!important;}

  /* blogs: one card at a time, the next peeking in. */
  .kh2-posts{
    display:flex;gap:12px;margin:24px -16px 0;padding:0 16px;overflow-x:auto;
    scroll-snap-type:x mandatory;scroll-padding:0 16px;scrollbar-width:none;
  }
  .kh2-posts::-webkit-scrollbar{display:none;}
  .kh2-post{flex:0 0 326px;min-height:351px;padding:14px;box-shadow:none;scroll-snap-align:start;}
  .kh2-post:hover{box-shadow:none;transform:none;}
  .kh2-post-img{height:195px;}
  .kh2-post-t{font-weight:500!important;}
  .kh2-post-more{padding-top:16px;}

  /* the closing band */
  .kh2-final{padding:50px 0 42px;}
  .kh2-final-h,.kh2-final-h:not(#_){margin-top:11px!important;font-size:20px!important;line-height:28px!important;}
  .kh2-final-b{width:165px;margin-top:17px;}
}
`;
