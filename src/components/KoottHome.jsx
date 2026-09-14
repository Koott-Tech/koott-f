'use client';

import ResumeBookingCard, { RESUME_CARD_CSS, useBookingDraft } from '@/components/ResumeBookingCard';

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
 * Headings are Work Sans, body copy Mulish (standing in for Avenir, a licensed
 * Wix face). Everything is scoped to .kh2 and marked !important because
 * globals.css (marked "never edit") forces DM Sans and 60/48/36px on h1–h3.
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
 * One of the two working filters over the therapist list. A native <select>
 * rather than a custom menu: it keeps keyboard and screen-reader behaviour and
 * the mobile picker for free. The chevron from the design sits on top of it.
 */
const FilterSelect = ({ label, value, options, onChange, format }) => (
  <span className="kh2-filter">
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>{format ? format(o) : o.charAt(0).toUpperCase() + o.slice(1)}</option>
      ))}
    </select>
    <Chevron />
  </span>
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
 * The leafy border the design runs along the foot of the hero — layered bushes
 * with a few flower stems, mirrored on the right. Drawn rather than shipped as
 * an image so it scales with the section and costs nothing to load.
 */
const Foliage = ({ side }) => (
  <svg
    className={`kh2-foliage-svg is-${side}`}
    viewBox="0 0 420 190" preserveAspectRatio="none" aria-hidden focusable="false"
  >
    <g opacity=".95">
      {/* back bushes */}
      <path fill="#BFE8A8" d="M0 190V96c26-30 52-14 66 6 12-26 44-34 62-10 16-20 44-16 54 8 14-18 40-12 46 10 12-16 34-10 40 12 10-14 28-6 32 12v56z" />
      {/* mid bushes */}
      <path fill="#8FD97F" d="M0 190v-56c22-24 46-12 58 6 12-22 40-28 56-8 14-16 38-12 46 8 12-14 30-8 36 10 10-12 26-4 30 10v30z" />
      {/* front bushes */}
      <path fill="#5FC469" d="M0 190v-34c20-18 42-8 54 8 12-16 34-20 48-6 12-12 32-8 40 6 10-10 26-4 30 8v18z" />
    </g>
    {/* flower stems */}
    <g stroke="#4FAE5C" strokeWidth="2.4" fill="none" strokeLinecap="round">
      <path d="M96 190v-60" /><path d="M96 152c-14-6-18-18-16-26 10 0 20 10 16 26z" fill="#8FD97F" stroke="none" />
      <path d="M150 190v-46" />
      <path d="M262 190v-54" />
    </g>
    <g>
      <circle cx="96" cy="122" r="11" fill="#F0A8C8" /><circle cx="96" cy="122" r="4" fill="#FBE38A" />
      <circle cx="150" cy="136" r="9" fill="#F6B9D3" /><circle cx="150" cy="136" r="3.4" fill="#FBE38A" />
      <circle cx="262" cy="128" r="8" fill="#F5A35F" /><circle cx="262" cy="128" r="3" fill="#FBE38A" />
    </g>
  </svg>
);

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
        if (!off && Array.isArray(list)) setRows(applyTherapistOrder(list, order).slice(0, limit));
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

  const [titleIndex, setTitleIndex] = useState(0);
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
  const [faqTab, setFaqTab] = useState(FAQ.tabs[0]);
  const [openFaq, setOpenFaq] = useState(null);
  const [serviceTab, setServiceTab] = useState(0);

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

  // Rotate the headline and the stat card. Both held still for anyone who has
  // asked the system for reduced motion — a looping animation is exactly what
  // that setting means.
  useEffect(() => {
    const still = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (still) return undefined;

    const timers = [];
    if (HERO.rotatingTitles.length > 1) {
      timers.push(setInterval(() => {
        setTitleIndex((i) => (i + 1) % HERO.rotatingTitles.length);
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
              <span className="kh2-h1-word" key={titleIndex}>
                {HERO.rotatingTitles[titleIndex]}
              </span>
            </span>
            <span>{HERO.titleTail}</span>
          </h1>
          <p className="kh2-hero-sub">
            {HERO.subtitle.replace(/Anytime!$/, '')}
            {/Anytime!$/.test(HERO.subtitle) && <span className="kh2-hero-accent">Anytime!</span>}
          </p>

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
            <Link href={BOOK} className="kh2-match">Find the match<Chevron dir="right" /></Link>
            <div className="kh2-search-row">
              <button type="button" className="kh2-concern">
                {HERO.concernCta}<SparkleTrio />
              </button>
              <Link href={BOOK} className="kh2-book">
                {HERO.bookCta}<Chevron />
              </Link>
            </div>
          </div>

          <Link href={BOOK} className="kh2-consult">
            Consult a Therapist Now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* Illustrated foliage runs along the foot of the hero, left and right.
            The badge is positioned inside this band rather than pulled up with a
            negative margin — a margin shortened the section, so the greenery
            overflowed and was clipped by the hero's overflow:hidden. */}
        <div className="kh2-foliage">
          <Foliage side="left" />
          <Foliage side="right" />

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
            {cards.map((t, i) => (
              <article key={t.id || t.name || i} className={`kh2-tcard ${i === 1 ? 'is-plain' : ''}`}>
                <div className="kh2-tcard-head">
                  <div>
                    <h3 className="kh2-tcard-n">{t.name}</h3>
                    <p className="kh2-tcard-r">{t.designation || t.specialization || 'Consultant Psychologist'}</p>
                    <Link href={profileHref(t)} className="kh2-viewprofile">View Profile</Link>
                  </div>
                  {t.cover_image_url || t.profile_picture_url ? (
                    // Remote therapist photos; a plain img avoids next/image host config.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="kh2-tcard-img" src={t.cover_image_url || t.profile_picture_url} alt={t.name} />
                  ) : <span className="kh2-tcard-img is-blank" aria-hidden />}
                </div>

                <ul className="kh2-tcard-meta">
                  <li><span aria-hidden>👤</span> Therapy hours: {t.experience_years ? `${t.experience_years * 30}+hrs (${t.experience_years}yrs)` : '250+hrs (8yrs)'}</li>
                  <li><span aria-hidden>₹</span> Starting from: ₹{t.individual_session_price || t.price || 2299}</li>
                </ul>

                <div className="kh2-wave" aria-hidden>
                  <span className="kh2-wave-play">▶</span>
                  <span className="kh2-wave-bars" />
                </div>

                <p className="kh2-tcard-bio">
                  {t.bio || 'M Phil & PhD scholar and university topper, specializes in individual, relationship & complex disorders.'}
                </p>

                <div className="kh2-tcard-foot">
                  <div>
                    <p className="kh2-avail-l">Next Availablity</p>
                    <p className="kh2-avail-v">Tomorrow (09:00) (10:00) (11:00)</p>
                  </div>
                  <Link href={bookingHref(t)} className="kh2-btn kh2-btn--sm">Book Now</Link>
                </div>
              </article>
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
              <OfferBody o={offer} />
            </div>

            <div className="kh2-offer-list-col">
              {OFFERS.items.map((o) => (
                <div key={o.key} className="kh2-offer-item">
                  <button
                    type="button"
                    className={`kh2-offer-row ${o.key === openOffer ? 'is-on' : ''}`}
                    onClick={() => setOpenOffer(o.key)}
                    aria-expanded={o.key === openOffer}
                  >
                    <span>
                      <span className="kh2-offer-t">{o.title}</span>
                      <span className="kh2-offer-n">{o.note}</span>
                    </span>
                    <Chevron dir={o.key === openOffer ? 'down' : 'right'} />
                  </button>
                  {/* phone only: the body opens under its own row */}
                  {o.key === openOffer && (
                    <div className="kh2-offer-inline"><OfferBody o={o} /></div>
                  )}
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

          <div className="kh2-strip" aria-hidden>
            {[0, 1].map((row) => (
              <div key={row} className="kh2-strip-row">
                {Array.from({ length: 14 }).map((_, i) => (
                  <span key={i} className={`kh2-tile kh2-tile--${(i + row) % 5}`} />
                ))}
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

          <div className="kh2-tabs kh2-tabs--scroll">
            {SERVICES.tabs.map((t, i) => (
              <button key={t} type="button"
                className={`kh2-tab ${i === serviceTab ? 'is-on' : ''}`}
                aria-pressed={i === serviceTab}
                onClick={() => setServiceTab(i)}>{t}</button>
            ))}
          </div>

          {/* All eight panels sit on one track; the tab (or a dot) slides it
              along. The next panel peeks in from the right, as in the artboard. */}
          <div className="kh2-slides" role="region" aria-label={SERVICES.title}>
            <div
              className="kh2-track"
              style={{ transform: `translateX(calc(${-serviceTab} * (var(--pw) + 24px)))` }}
            >
              {SERVICES.panels.map((p, i) => (
                <article
                  key={p.title.join(' ')}
                  className={`kh2-slide ${i === serviceTab ? 'is-on' : ''}`}
                  aria-hidden={i === serviceTab ? undefined : true}
                >
                  <div className="kh2-slide-media" aria-hidden>
                    <span className="kh2-bubble">I&rsquo;m just a message away</span>
                    <span className="kh2-pip" />
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
  --sans:'Work Sans',ui-sans-serif,system-ui,sans-serif;
  --text:'Mulish',ui-sans-serif,system-ui,sans-serif;
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
@media (prefers-reduced-motion:reduce){
  .kh2-h1-word{animation:none;}
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
.kh2-search-spark,.kh2-match,.kh2-consult{display:none;}
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
/* Illustrated foliage runs along the foot of the hero on both sides. */
/* margin-top:auto eats the slack; the floor for the gap is the margin-bottom
   on .kh2-hero-in, kept there so the badge (absolute, offset from this box)
   is not pushed off the greenery. */
.kh2-foliage{position:relative;height:clamp(148px,20vh,190px);margin-top:auto;pointer-events:none;}
.kh2-foliage-svg{position:absolute;bottom:0;width:34%;max-width:430px;height:100%;}
.kh2-foliage-svg.is-left{left:0;}
.kh2-foliage-svg.is-right{right:0;transform:scaleX(-1);}
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
/* The card being replaced sits underneath and is covered as the new one lands. */
.kh2-badge.is-out{z-index:1;}
.kh2-badge.is-in{z-index:2;animation:kh2-card-in .55s cubic-bezier(.22,.7,.3,1) both;}
/* Opacity reaches 1 by 35%, while the card is still low and clear of the copy
   underneath. Fading the whole way up would leave both cards' text readable at
   once, which looked like a rendering fault. */
@keyframes kh2-card-in{
  0%{opacity:0;transform:translateY(26px) scale(.97);box-shadow:0 2px 8px rgba(16,14,14,.05);}
  35%{opacity:1;transform:translateY(15px) scale(.985);}
  100%{opacity:1;transform:none;box-shadow:0 6px 22px rgba(16,14,14,.07);}
}
@media (prefers-reduced-motion:reduce){
  .kh2-badge.is-in{animation:none;}
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
  position:relative;min-height:37px;justify-content:flex-end;
}
/* The native control carries the value; the wrapper carries the design. It is
   stretched over the whole pill so a click anywhere on the control opens it,
   not just on the words. */
.kh2-filter select{
  position:absolute;inset:0;width:100%;height:100%;
  appearance:none;-webkit-appearance:none;background:none;border:0;outline:none;cursor:pointer;
  padding:0 42px 0 18px;margin:0;
  font-family:var(--text)!important;font-size:15px!important;letter-spacing:0!important;color:var(--body)!important;
}
.kh2-filter svg{position:relative;flex:none;pointer-events:none;}

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
.kh2-offer-row{
  display:flex;align-items:flex-start;justify-content:space-between;gap:16px;text-align:left;
  background:#fff;border:1px solid var(--line);border-radius:12px;padding:20px 22px;cursor:pointer;
  color:var(--body);transition:box-shadow .18s ease;
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
/* 73% of the content width, centred, as measured off the artboard. */
.kh2-strip{
  background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px;
  max-width:826px;margin:12px auto 16px;overflow:hidden;
}
.kh2-strip-row{display:flex;gap:8px;margin-bottom:8px;}
.kh2-strip-row:last-child{margin-bottom:0;}
/* Small portrait crops, a touch taller than wide, as in the artboard. */
.kh2-tile{flex:1;min-width:0;height:44px;border-radius:5px;background:#DCE7DE;}
.kh2-tile--0{background:#D7E3D9;} .kh2-tile--1{background:#DCE6F0;} .kh2-tile--2{background:#F3EBD8;}
.kh2-tile--3{background:#E7DEF0;} .kh2-tile--4{background:#E5DAD2;}
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
  width:100vw;margin-left:calc(50% - 50vw);overflow:hidden;
  padding-left:max(24px, calc((100vw - 1180px) / 2 + 24px));
}
.kh2-track{
  display:flex;gap:24px;will-change:transform;
  transition:transform .5s cubic-bezier(.22,.7,.3,1);
}
.kh2-slide{
  flex:0 0 var(--pw);
  display:grid;grid-template-columns:1fr 1fr;gap:26px;
  background:#F9FFF8;border:1px solid var(--line);border-radius:16px;padding:34px;
}
@media (prefers-reduced-motion:reduce){.kh2-track{transition:none;}}
.kh2-slide-media{
  position:relative;border-radius:50%;min-height:300px;
  background:linear-gradient(160deg,#DCD3CB,#B9AFA7);
}
.kh2-bubble{
  position:absolute;left:6%;top:22%;background:#2563EB;color:#fff;border-radius:16px;padding:8px 14px;
  font-family:var(--text)!important;font-size:13px!important;letter-spacing:0!important;
}
.kh2-pip{position:absolute;left:8%;bottom:22%;width:104px;height:78px;border-radius:9px;background:#8E9AA5;border:2px solid #fff;}
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
@media (max-height:760px){
  .kh2-sec{padding:104px 0;}
  .kh2-tcard-head{height:146px;}
  .kh2-tcard-meta{margin-top:12px;gap:11px;}
  .kh2-tcard-bio{margin-top:12px;}
  .kh2-tcard-foot{padding:12px 20px 14px;}
  .kh2-tile{height:42px;}
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
    padding-top:clamp(20px,6svh,88px)!important;
    min-height:calc(100vh - 63px);
    min-height:calc(100svh - 63px);
    max-height:none;
  }
  .kh2-hero-in{text-align:left;padding:0 22px;}
  .kh2-h1{font-size:clamp(30px,8.6vw,36px)!important;line-height:1.14em!important;margin-bottom:clamp(6px,1.4svh,12px)!important;}
  .kh2-hero-sub{font-size:15px!important;margin:0 0 clamp(10px,2.2svh,18px)!important;color:var(--body)!important;}
  .kh2-hero-accent{color:var(--green);}

  .kh2-search{
    max-width:none;margin:0;padding:0;background:transparent;box-shadow:none;border-radius:0;
  }
  .kh2-search-input{
    min-height:0!important;height:64px;resize:none;padding:12px 52px 12px 12px!important;
    border:1.5px solid #6FB8C6!important;border-radius:10px!important;
    font-size:13px!important;line-height:1.55em!important;
  }
  .kh2-search-spark{
    display:block;position:absolute;right:12px;top:50%;transform:translateY(-50%);
    color:var(--green);line-height:0;pointer-events:none;
  }
  .kh2-search-spark .kh2-trio{width:30px;height:30px;}
  .kh2-search-row{display:none;}

  /* white chip on a pale green panel that hangs under the text box */
  .kh2-match{
    display:inline-flex;align-items:center;gap:14px;margin-top:8px;padding:7px 12px;
    background:#fff;border:1px solid rgba(24,158,79,.12);border-radius:8px;
    box-shadow:0 6px 16px rgba(24,158,79,.10);text-decoration:none;
    font-family:var(--text)!important;font-size:13px!important;letter-spacing:0!important;color:var(--body)!important;
  }
  .kh2-match svg{width:14px;height:14px;color:var(--green);}

  .kh2-consult{
    display:inline-flex;align-items:center;gap:10px;margin-top:clamp(14px,4.4svh,38px);padding:12px 16px;
    background:var(--green);color:#fff!important;border-radius:6px;text-decoration:none;
    box-shadow:0 2px 0 rgba(1,47,35,.18);
    font-family:var(--text)!important;font-size:15px!important;font-weight:600!important;letter-spacing:0!important;
  }

  /* The comp puts the stat card just under the CTA with the plants pinned to
     the foot of the screen. display:contents dissolves the foliage band, so the
     card joins the hero's flow after the CTA while the two plant drawings stay
     absolutely positioned — now against the hero itself — at the bottom. */
  .kh2-foliage{display:contents;}
  /* plants hug the foot of the hero; padding-bottom reserves their height so a
     short phone grows the hero instead of drawing plants over the card */
  .kh2-hero{padding-bottom:clamp(76px,14svh,120px)!important;}
  .kh2-foliage-svg{height:clamp(76px,14svh,120px)!important;bottom:0;width:46%!important;}
  .kh2-hero-in{margin-bottom:0!important;}
  .kh2-badge-wrap{
    position:relative!important;top:auto!important;left:auto!important;right:auto!important;
    width:auto!important;margin:clamp(16px,6svh,58px) 22px 0!important;
  }
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

  /* Therapist cards, feature cards and posts: the same swipe row, so the
     phone reads one card at a time instead of a 1,600px stack. */
  .kh2-tgrid,.kh2-feats,.kh2-posts{
    display:flex!important;overflow-x:auto;scroll-snap-type:x mandatory;
    gap:14px;margin-left:-22px;margin-right:-22px;padding:4px 22px 10px;
    scrollbar-width:none;
  }
  .kh2-tgrid::-webkit-scrollbar,.kh2-feats::-webkit-scrollbar,.kh2-posts::-webkit-scrollbar{display:none;}
  .kh2-tcard,.kh2-feat,.kh2-post{flex:0 0 84%;scroll-snap-align:center;}

  /* therapist card: the fixed-height band clipped two-line names and roles
     in a narrow card — let it grow, with a floor so cards still line up */
  .kh2-tcard-head{height:auto!important;min-height:156px;}
  .kh2-tcard-head > div{width:62%;}
  .kh2-tcard-n{font-size:15.5px!important;}
  .kh2-tcard-r{font-size:13px!important;}

  /* filters: Speciality and Needs share a row, the Filters button goes icon-only */
  .kh2-filters{flex-wrap:nowrap;gap:8px;}
  .kh2-filter{flex:1 1 0;min-width:0;padding:0 12px;gap:6px;}
  .kh2-filter select{padding:0 32px 0 12px;font-size:14px!important;}
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
  .kh2-strip-row .kh2-tile:nth-child(n+8){display:none;}
  .kh2-tile{height:40px;}
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

  /* services: a smaller portrait and title so the panel is not a full screen */
  .kh2-slide{padding:20px!important;gap:16px!important;}
  .kh2-slide-media{min-height:190px!important;}
  .kh2-slide-t{font-size:22px!important;margin-bottom:10px!important;}
  .kh2-slide-lead,.kh2-slide-l li{font-size:14.5px!important;}

  /* posts */
  .kh2-post-img{height:180px;}
}

/* Up to 1000px "What Koott offers" is one column, so it becomes an accordion:
   the body opens under the row that was tapped. */
@media (max-width:1000px){
  .kh2-offer-panel{display:none;}
  .kh2-offer-inline{
    display:block;background:#fff;border:1px solid var(--line);border-top:0;
    border-radius:0 0 12px 12px;padding:18px 18px 16px;margin-top:-12px;
  }
  .kh2-offer-row.is-on{border-radius:12px 12px 0 0;}
  /* the row already names the service; the body's heading would repeat it */
  .kh2-offer-inline .kh2-offer-h{display:none;}
}

/* The narrowest phones (320px): keep Speciality and Needs on one line. */
@media (max-width:360px){
  .kh2-filter select{padding:0 24px 0 10px!important;font-size:13px!important;}
  .kh2-filter{padding:0 10px!important;}
}

/* Short phones (iPhone SE and the like): the same hero on tighter spacing so
   the plants still land on the first screen. */
@media (max-width:640px) and (max-height:720px){
  .kh2-hero{padding-top:18px!important;}
  .kh2-consult{margin-top:16px!important;}
  .kh2-badge-wrap{margin-top:18px!important;}
  .kh2-search-input{height:56px!important;}
}
`;
