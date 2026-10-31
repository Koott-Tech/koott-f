'use client';

import { useEffect, useMemo, useState } from 'react';
import TherapistCard, { THERAPIST_CARD_CSS } from './TherapistCard';
import { toCard } from './BookMalayaliPsychologists';
import { ResumeBooking } from './ResumeBookingCard';
import { publicApi } from '@/lib/backendApi';
import { blogApi } from '@/lib/blogApi';

/**
 * ConditionPageTemplate — layout for condition / counselling landing pages.
 *
 * Design is a 1:1 port of the live Wix condition pages, re-verified against
 * koott.in/depression-treatment by reading computed styles off the live DOM at
 * both 1280px and 320px. Every value below (palette, type scale, card chrome,
 * section order, grid counts, icon paths) was measured, not eyeballed:
 *
 *   type      headings work-sans-v2 · body avenir-lt-w01_35-light
 *   ink       #100E0E      accent green  #3D985C / #3D995C
 *   button    #4FAB69 → hover #025545    deep bands #012F23 / #29653D
 *   bands     #F5FFF6 · #FBFFF9 · #FCFFF9 · rgba(241,250,238,.49)
 *   cards     radius 10px, 1px rgba(38,34,34,.13)
 *   CTA bands linear-gradient(180deg,#F0FFEC,#D4FFC2), radius 7px
 *   content   980px column
 *
 * Avenir is a licensed Wix font and cannot be served here; Inter is loaded as
 * the metric-and-tone substitute. Everything else is the real thing.
 *
 * Styles are scoped to .kct and marked !important because globals.css (marked
 * "never edit") forces Poppins / 48px on h2, Inter / 16px on p, etc.
 * Content comes entirely from `data` — see src/data/conditionPageTemplateSample.js.
 */

/* Icon paths lifted from the live page's inline vector components. */
const ICON = {
  bubble: { vb: '16.5 23.5 167 153', d: 'M20.5 89.133c0-36.546 18.16-61.524 50.586-61.633h52.748c31.454 0 55.666 19.247 55.666 61.849V172.5s-18.16-28.114-56.639-25.951H71.194c-32.534 0-50.694-24.978-50.694-57.416z' },
  leaf: { vb: '25 15.5 149.999 169', d: 'M163.48 149.089c-3.142 5.751-7.246 11.149-12.269 15.796-26.945 24.934-76.944 17.631-101.523-5.189-14.614-13.568-20.657-31.02-20.688-48.062-.031-17.043 5.55-33.842 12.254-50.216 5.594-13.664 13.12-28.229 30.105-35.891 14.06-6.342 31.878-6.624 48.493-5.541 10.31.672 20.929 1.886 29.584 5.895 8.655 4.009 14.841 11.483 12.468 18.594-1.724 5.168-7.406 9.13-11.404 13.628-8.564 9.635-9.104 22.55-1.36 32.522 7.174 9.238 21.258 16.523 21.802 27.823.479 9.915-2.082 20.794-7.462 30.641z' },
  chevron: { vb: '16 16 168 168', d: 'M100 20c-44.184 0-80 35.817-80 80.001C20 144.184 55.817 180 100 180s80-35.817 80-79.999S144.183 20 100 20zm28.726 82.946l-4.492 4.492-33.758 33.758a4.164 4.164 0 0 1-5.89 0l-1.547-1.547a4.167 4.167 0 0 1 0-5.891l30.812-30.812a4.165 4.165 0 0 0 0-5.891L83.038 66.243a4.167 4.167 0 0 1 0-5.891l1.547-1.547a4.164 4.164 0 0 1 5.89 0l33.758 33.758 4.492 4.492a4.164 4.164 0 0 1 .001 5.891z' },
  check: { vb: '15.5 15.5 169 169', d: 'M100 19.5c-44.459 0-80.5 36.041-80.5 80.5s36.041 80.5 80.5 80.5 80.5-36.041 80.5-80.5-36.041-80.5-80.5-80.5zm38.685 65.022L95.256 127.87l-12.408 12.385L70.44 127.87l-12.408-12.386a8.748 8.748 0 0 1 0-12.386c3.426-3.42 8.982-3.42 12.408 0l12.408 12.386 43.429-43.348c3.426-3.42 8.982-3.42 12.408 0a8.748 8.748 0 0 1 0 12.386z' },
  spark: { vb: '16 15.999 168 168.001', d: 'M23.061 95.603c-4.081 1.51-4.081 7.283 0 8.793l21.009 7.775a74.07 74.07 0 0 1 43.759 43.759l7.775 21.009c1.51 4.081 7.283 4.081 8.793 0l7.775-21.009a74.07 74.07 0 0 1 43.759-43.759l21.009-7.775c4.081-1.51 4.081-7.283 0-8.793l-21.009-7.775a74.07 74.07 0 0 1-43.759-43.759l-7.775-21.009c-1.511-4.081-7.283-4.081-8.793 0l-7.775 21.009A74.07 74.07 0 0 1 44.07 87.828z' },
  arrow: { vb: '16 16 168 168', d: 'M100 20c-44.184 0-80 35.817-80 80.001C20 144.184 55.817 180 100 180s80-35.817 80-79.999S144.183 20 100 20zm28.726 82.946l-4.492 4.492-33.758 33.758a4.164 4.164 0 0 1-5.89 0l-1.547-1.547a4.167 4.167 0 0 1 0-5.891l30.812-30.812a4.165 4.165 0 0 0 0-5.891L83.038 66.243a4.167 4.167 0 0 1 0-5.891l1.547-1.547a4.164 4.164 0 0 1 5.89 0l33.758 33.758 4.492 4.492a4.164 4.164 0 0 1 .001 5.891z' },
};

const Icon = ({ name, size = 15, fill = '#189E4F', className = '' }) => {
  const i = ICON[name];
  return (
    <svg className={className} viewBox={i.vb} width={size} height={size} aria-hidden focusable="false">
      <path d={i.d} fill={fill} />
    </svg>
  );
};

/** Fallback marks for review sources when no logo URL is supplied. */
const SOURCE_MARK = { google: 'G', whatsapp: '✆', zoho: 'Z' };

/** Session-mode glyphs shown as circular badges on a therapist card. */
const ModeIcon = ({ name }) =>
  name === 'audio' ? (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#29653D" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v4" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#29653D" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <rect x="2" y="7" width="13" height="10" rx="2.5" />
      <path d="M15 11l6-3v8l-6-3z" />
    </svg>
  );

/**
 * The illustration at the foot of each "how it works" card.
 *
 * The design draws a different one per step — faces, a date strip, a call, two
 * avatars — and every one of the 45 pages carries the same four steps in the
 * same order, so they are keyed by position rather than authored per page.
 *
 * They are built from the therapists the page already loaded and from markup,
 * not from stock art: a slot that needed an asset nobody has would be an empty
 * frame on every page.
 */
function StepMedia({ step, therapists }) {
  const faces = therapists.filter((t) => t.photo).slice(0, 5);

  if (step === 0) {
    if (faces.length < 2) return null;
    return (
      <div className="kct-step-media kct-step-faces" aria-hidden>
        {faces.map((t, i) => <img key={i} src={t.photo} alt="" loading="lazy" />)}
      </div>
    );
  }

  if (step === 1) {
    // Real dates, so the strip is never showing a day that has gone by.
    const today = new Date();
    const days = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return {
        label: d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Asia/Kolkata' }),
        day: d.toLocaleDateString('en-GB', { day: '2-digit', timeZone: 'Asia/Kolkata' }),
      };
    });
    return (
      <div className="kct-step-media kct-step-dates" aria-hidden>
        <div className="kct-step-days">
          {days.map((d, i) => (
            <span key={i} className={i === 1 ? 'is-on' : ''}>
              <small>{d.label}</small><b>{d.day}</b>
            </span>
          ))}
        </div>
        <div className="kct-step-slot"><small>Today</small><b>4 PM</b></div>
      </div>
    );
  }

  if (step === 2) {
    const who = faces[0];
    return (
      <div className="kct-step-media kct-step-call" aria-hidden>
        <span className="kct-step-tile" />
        <span className="kct-step-tile kct-step-tile--call">
          {who && <img src={who.photo} alt="" loading="lazy" />}
          <span className="kct-step-dots"><i /><i /><i /></span>
        </span>
      </div>
    );
  }

  if (faces.length < 2) return null;
  return (
    <div className="kct-step-media kct-step-pair" aria-hidden>
      <img className="kct-step-mark" src="/logo.png" alt="" loading="lazy" />
      <img src={faces[0].photo} alt="" loading="lazy" />
      <img src={faces[1].photo} alt="" loading="lazy" />
    </div>
  );
}

/* ---------- building blocks ---------- */

const Section = ({ children, bg, className = '', id }) => (
  <section id={id} className={`kct-sec ${className}`} style={bg ? { background: bg } : undefined}>
    <div className="kct-in">{children}</div>
  </section>
);

/**
 * Bordered card with an inline leading icon — symptoms / types / seek-help / therapy.
 *
 * Most sections give the card a single `body` paragraph. The "Types of … We
 * Treat" cards instead carry a short bullet list, so `items` renders that;
 * globals.css strips list markers, hence the explicit list-style below.
 */
const Card = ({ title, body, items, icon = 'bubble', variant = '', iconSize = 15 }) => (
  <div className={`kct-card ${variant}`}>
    <h3 className="kct-card-t">
      {icon && <Icon name={icon} size={iconSize} className="kct-card-i" />}
      {title}
    </h3>
    {items && items.length ? (
      <ul className="kct-card-list">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    ) : (
      <p className="kct-card-b">{body}</p>
    )}
  </div>
);

/** Solid green pill — the hero's primary action. */
const BookButton = ({ href = '#', children }) => (
  <a href={href} className="kct-btn-solid">{children}</a>
);

/** White pill with an arrow — the "Book a Session" / "Talk to a Therapist" style. */
const OutlineButton = ({ href = '#', children, dark = false }) => (
  <a href={href} className={`kct-btn-pill ${dark ? 'is-dark' : ''}`}>
    <span>{children}</span>
    <Icon name="arrow" size={20} fill={dark ? '#FFFFFF' : '#29653D'} />
  </a>
);

/* ---------- page ---------- */

export default function ConditionPageTemplate({ data }) {
  const [openFaq, setOpenFaq] = useState(-1);
  // The symptom checklist: which signs are ticked, and which one is open.
  const [checked, setChecked] = useState([]);
  const [openSign, setOpenSign] = useState(0);
  const [openSeek, setOpenSeek] = useState(0);
  const [openHelp, setOpenHelp] = useState(0);
  const [openType, setOpenType] = useState(0);
  const [posts, setPosts] = useState([]);

  /**
   * The blogs strip near the foot of the page. The condition pages carry no
   * posts of their own — there is no `related` on any of them — so it shows
   * the three most recent, which is what the design's three cards are. It
   * renders nothing at all rather than three empty frames if the blog API is
   * unreachable; this page is static and must not depend on it.
   */
  useEffect(() => {
    let off = false;
    blogApi.list({ limit: 3 })
      .then((rows) => { if (!off) setPosts((Array.isArray(rows) ? rows : []).slice(0, 3)); })
      .catch(() => { if (!off) setPosts([]); });
    return () => { off = true; };
  }, []);
  const [query, setQuery] = useState('');
  const [liveTherapists, setLiveTherapists] = useState([]);
  const d = data;

  /**
   * The design shows three therapists here, but no CMS row has ever filled
   * therapists.items — every condition carries an empty list, so the section
   * rendered as a heading above nothing. Live therapists are fetched instead,
   * and a row that does list its own still wins.
   *
   * They are not filtered by condition yet: the slug ("vaginismus") and the
   * condition tags from migration 0020 are separate vocabularies, and guessing
   * a match would quietly show the wrong people. Mapping the two is a data job.
   */
  const cmsTherapists = d.therapists?.items || [];
  useEffect(() => {
    if (cmsTherapists.length) return undefined;
    let off = false;
    publicApi.getPsychologists()
      .then((res) => {
        if (off) return;
        const rows = res?.data?.psychologists || res?.data || [];
        // More than the three cards need: the "choose a therapist" step shows a
        // row of faces, and the design puts five in it.
        setLiveTherapists(Array.isArray(rows) ? rows.slice(0, 8).map(toCard) : []);
      })
      .catch(() => { if (!off) setLiveTherapists([]); });
    return () => { off = true; };
  }, [cmsTherapists.length]);

  const therapists = useMemo(
    () => (cmsTherapists.length ? cmsTherapists : liveTherapists),
    [cmsTherapists, liveTherapists]
  );

  const faqs = d.faqs.filter(
    (f) => !query || (f.q + f.a).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="kct">
      {/* dangerouslySetInnerHTML keeps the quotes in the CSS byte-identical
          between server and client render — <style>{CSS}</style> escapes them
          differently and trips React's hydration check. */}
      <style dangerouslySetInnerHTML={{ __html: THERAPIST_CARD_CSS + CSS }} />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <Section className="kct-hero">
        <div className="kct-hero-grid">
          <div>
            <h5 className="kct-eyebrow">{d.hero.eyebrow}</h5>
            <h1 className="kct-h1">{d.hero.title}</h1>
            <p className="kct-lede">{d.hero.subtitle}</p>

            {/* Sits between the lede and the buttons, as on the live page. */}
            {d.hero.verifiedBy && (
              <p className="kct-verified">
                <span className="kct-tick">✔</span> {d.hero.verifiedBy}
              </p>
            )}

            <div className="kct-hero-cta">
              <BookButton href={d.hero.primaryCta.href}>{d.hero.primaryCta.label}</BookButton>
              <a href={d.hero.secondaryCta.href} className="kct-btn-ghost">
                <span>{d.hero.secondaryCta.label}</span>
                <svg viewBox="0 0 200 200" width="28" height="28" aria-hidden>
                  <path fill="#0dc143" d="M132.7 112c-1.7-.9-10-4.9-11.5-5.4-1.6-.5-2.6-.9-3.8.9-1.1 1.8-4.4 5.4-5.3 6.6-1 1.1-1.9 1.2-3.7.4-1.7-.9-7.2-2.6-13.6-8.2-5.1-4.4-8.4-10-9.4-11.6-1-1.7-.1-2.6.8-3.4.8-.8 1.7-1.9 2.5-3 .9-1 1.1-1.7 1.7-2.8.5-1.1.3-2.1-.2-3s-3.8-9-5.2-12.4c-1.4-3.3-2.8-2.8-3.8-2.8s-2.1-.2-3.2-.2-3 .4-4.5 2.1c-1.6 1.7-5.9 5.8-5.9 13.9 0 8.2 6 16.2 6.8 17.3.9 1.1 11.6 18.5 28.8 25.3 17.2 6.7 17.2 4.5 20.2 4.2 3.1-.3 10-4 11.4-7.9 1.4-3.9 1.4-7.3 1-7.9-.3-.9-1.4-1.3-3.1-2.1z" />
                  <path fill="#0dc143" d="M101.2 30c-37.9 0-68.7 30.5-68.7 68.2 0 12.9 3.6 24.9 9.9 35.2L30 170l38.1-12.1c9.9 5.4 21.1 8.5 33.2 8.5 37.9 0 68.7-30.5 68.7-68.2-.1-37.7-30.9-68.2-68.8-68.2zm0 125.5c-11.7 0-22.7-3.5-31.8-9.4l-22.1 7.1 7.2-21.3c-6.9-9.4-11-21.1-11-33.6 0-31.7 25.9-57.3 57.8-57.3S159 66.7 159 98.2c0 31.6-25.9 57.3-57.8 57.3z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Media slot — the live page runs a 351×374 video popup here. */}
          <div className="kct-hero-media">
            <span className="kct-play" aria-hidden>▶</span>
            <span className="kct-media-label">{d.hero.mediaLabel}</span>
          </div>
        </div>

        <div className="kct-stats">
          {d.stats.map((s, i) => (
            <div key={i} className="kct-stat">
              <h4 className="kct-stat-v">{s.value}</h4>
              <p className="kct-stat-l">{s.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Therapists ─────────────────────────────────────────────────── */}
      <Section bg="linear-gradient(180deg,#E5F0DD 0%,#FFFFFF 100%)">
        {/* The design is the heading, the cards, then one button. There is no
            filter row on it, and the dropdowns that used to sit here were
            decorative — buttons with no handler — so they are gone rather than
            restyled. Filtering lives on /book-malayali-psychologists, which the
            button below leads to. */}
        <h2 className="kct-h2 kct-center">{d.therapists.title}</h2>

        <div className="kct-therapists">
          <ResumeBooking />
          {therapists.slice(0, 3).map((t, i) => (
            <TherapistCard key={t.id || i} t={t} />
          ))}
        </div>
        <p className="kct-more">
          <a href="/book-malayali-psychologists" className="kct-btn-ghost">View more therapists</a>
        </p>
      </Section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      {/* A centred heading over a two-by-two grid of numbered steps. The design
          gives each card an illustration — a row of faces, a date picker — but
          those are art, not content: no step in the CMS carries an image, so
          the card is the number, the title and the body. */}
      <Section>
        <h2 className="kct-h2 kct-center">{d.howItWorks.title}</h2>
        <div className="kct-steps">
          {d.howItWorks.steps.map((s, i) => (
            <div key={i} className="kct-step">
              <div className="kct-step-head">
                <span className="kct-num" aria-hidden>{i + 1}</span>
                <div className="kct-step-copy">
                  <h3 className="kct-step-t">{s.title}</h3>
                  <p className="kct-step-b">{s.body}</p>
                </div>
              </div>
              <StepMedia step={i} therapists={therapists} />
            </div>
          ))}
        </div>
      </Section>

      {/* ── Why ────────────────────────────────────────────────────────── */}
      <Section bg="var(--p-darkest)" className="kct-on-dark">
        <div className="kct-why">
          <div className="kct-why-media" aria-hidden>
            <span className="kct-fig-play">▶</span>
          </div>
          <div className="kct-why-body">
            <h2 className="kct-h2">{d.why.title}</h2>
            <p className="kct-sub">{d.why.subtitle}</p>
            <div className="kct-why-grid">
              {d.why.items.map((it, i) => (
                <Card key={i} {...it} icon={null} variant="kct-card--solid" />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Plans ──────────────────────────────────────────────────────── */}
      <Section>
        <h2 className="kct-h2 kct-center">{d.plans.title}</h2>
        <p className="kct-sub kct-center">{d.plans.subtitle}</p>
        <div className="kct-grid-4 kct-grid-4--plans">
          {d.plans.items.map((p, i) => (
            <div key={i} className="kct-card kct-card--plan">
              <h3 className="kct-card-t">{p.name}</h3>
              <p className="kct-card-b">{p.body}</p>
              <span className="kct-price">Starting from ₹{p.from}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Reviews ────────────────────────────────────────────────────── */}
      <Section className="kct-reviews-sec">
        {d.reviews.eyebrow && <p className="kct-kicker">{d.reviews.eyebrow}</p>}
        <h2 className="kct-h2 kct-center kct-reviews-h">{d.reviews.title}</h2>
        <div className="kct-reviews">
          {d.reviews.items.map((r, i) => (
            <figure key={i} className="kct-review">
              {r.source && (
                <span className={`kct-review-src is-${r.source}`} title={r.source}>
                  {r.sourceLogo
                    ? <img src={r.sourceLogo} alt="" loading="lazy" />
                    : SOURCE_MARK[r.source] || '★'}
                </span>
              )}
              <blockquote className="kct-review-quote">{r.quote}</blockquote>
              <figcaption className="kct-review-person">
                <span className="kct-review-avatar">
                  {r.avatar && <img src={r.avatar} alt="" loading="lazy" />}
                </span>
                <span className="kct-review-who">
                  <span className="kct-review-name">{r.name}</span>
                  {r.age && <span className="kct-review-age">{r.age}</span>}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* ── CTA band ───────────────────────────────────────────────────
          Full-bleed on the live page (1265px at 1280 viewport, radius 0), so it
          deliberately sits outside <Section>'s 980px .kct-in wrapper. */}
      <Section className="kct-ctasec">
        <div className="kct-bookband">
          <span className="kct-bookband-art" aria-hidden />
          <div className="kct-bookband-copy">
            <p className="kct-band-p kct-band-p--lead">{d.ctaBand.text}</p>
          </div>
          <BookButton href={d.ctaBand.cta.href}>{d.ctaBand.cta.label}</BookButton>
        </div>
      </Section>

      {/* ── About the condition ──────────────────────────────────────────
          One band in the design: the explanation in a card beside a photo,
          then the four pillars two-up underneath. They were two sections with
          a seam between them, which is why the heading sat centred over the
          prose instead of inside the card. */}
      <Section bg="var(--bg-soft)" className="kct-about">
        <div className="kct-about-top">
          <div className="kct-about-card">
            <h2 className="kct-h2">{d.about.title}</h2>
            <div className="kct-prose">
              {d.about.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
          <div className="kct-about-media" aria-hidden />
        </div>

        <div className="kct-pillars">
          {d.about.pillars.map((p, i) => (
            <div key={i} className="kct-pillar">
              <h3 className="kct-pillar-t">{p.title}</h3>
              <p className="kct-pillar-b">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Symptoms ─────────────────────────────────────────────────────
          A checklist rather than a grid of cards. Each sign ticks on its own
          and opens to read why, and the panel underneath responds to how many
          are ticked. The design shows it mid-use — some ticked, one open. */}
      <Section className="kct-symptoms-sec">
        <div className="kct-symptoms">
          <h2 className="kct-h2 kct-center">{d.symptoms.title}</h2>
          <p className="kct-sub kct-center">{d.symptoms.subtitle}</p>

          <ul className="kct-signs">
            {d.symptoms.items.map((it, i) => {
              const on = checked.includes(i);
              const open = openSign === i;
              return (
                <li key={i} className={`kct-sign ${open ? 'is-open' : ''}`}>
                  <div className="kct-sign-row">
                    <label className="kct-sign-tick">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => setChecked((p) => (on ? p.filter((x) => x !== i) : [...p, i]))}
                      />
                      <span aria-hidden />
                      <span className="kct-sign-t">{it.title}</span>
                    </label>
                    <button
                      type="button"
                      className="kct-sign-more"
                      aria-expanded={open}
                      aria-label={open ? `Hide what ${it.title} means` : `What ${it.title} means`}
                      onClick={() => setOpenSign(open ? -1 : i)}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </div>
                  {open && <p className="kct-sign-b">{it.body}</p>}
                </li>
              );
            })}
          </ul>

          <div className="kct-signs-out">
            <span className="kct-signs-ico" aria-hidden>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" />
              </svg>
            </span>
            <p>
              {checked.length === 0
                ? 'Tick the signs you notice to see what they might mean.'
                : `You ticked ${checked.length} of ${d.symptoms.items.length}. Talking it through with a therapist is a good next step.`}
            </p>
            <BookButton href={d.hero.primaryCta.href}>Book a session</BookButton>
          </div>
        </div>
      </Section>

      {/* ── Mid CTA band ───────────────────────────────────────────────── */}
      <Section className="kct-ctasec">
        <div className="kct-bookband">
          <span className="kct-bookband-art kct-bookband-art--b" aria-hidden />
          <div className="kct-bookband-copy">
            <p className="kct-band-p kct-band-p--lead">{d.midCta.text}</p>
          </div>
          <BookButton href={d.midCta.cta.href}>{d.midCta.cta.label}</BookButton>
        </div>
      </Section>

      {/* ── When to seek help ──────────────────────────────────────────── */}
      <Section>
        <h2 className="kct-h2 kct-center">{d.seekHelp.title}</h2>
        <p className="kct-sub kct-center">{d.seekHelp.subtitle}</p>
        {/* Accordions in a narrow column, one open at a time. These read
            larger than the signs checklist above — the design sets them at 24
            against its 14. */}
        <ul className="kct-seek">
          {d.seekHelp.items.map((it, i) => {
            const open = openSeek === i;
            return (
              <li key={i} className={`kct-seek-row ${open ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="kct-seek-head"
                  aria-expanded={open}
                  onClick={() => setOpenSeek(open ? -1 : i)}
                >
                  <span className="kct-seek-t">{it.title}</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {open && <p className="kct-seek-b">{it.body}</p>}
              </li>
            );
          })}
        </ul>
      </Section>

      {/* ── Book band ──────────────────────────────────────────────────── */}
      <Section className="kct-ctasec">
        {/* A soft green strip: a picture, the line, and the button on the end. */}
        <div className="kct-bookband">
          <span className="kct-bookband-art kct-bookband-art--c" aria-hidden />
          <div className="kct-bookband-copy">
            <h4 className="kct-band-h">{d.bookBand.title}</h4>
            <p className="kct-band-p">{d.bookBand.text}</p>
          </div>
          <BookButton href={d.bookBand.cta.href}>{d.bookBand.cta.label}</BookButton>
        </div>
      </Section>

      {/* ── Types ──────────────────────────────────────────────────────── */}
      {/* A picture on the left, the heading and the types as accordions on
          the right — not the three-across grid this used to be. */}
      <Section bg="var(--bg-soft)">
        <div className="kct-types">
          <div className="kct-types-art" aria-hidden />
          <div className="kct-types-body">
            <h2 className="kct-h2">{d.types.title}</h2>
            <p className="kct-sub">{d.types.subtitle}</p>
            <ul className="kct-seek kct-seek--soft kct-seek--flush">
              {d.types.items.map((it, i) => {
                const open = openType === i;
                return (
                  <li key={i} className={`kct-seek-row ${open ? 'is-open' : ''}`}>
                    <button type="button" className="kct-seek-head" aria-expanded={open}
                      onClick={() => setOpenType(open ? -1 : i)}>
                      <span className="kct-seek-t">{it.title}</span>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    {open && <p className="kct-seek-b">{it.body}</p>}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Section>

      {/* ── How therapy helps ──────────────────────────────────────────── */}
      <Section>
        <h2 className="kct-h2 kct-center">{d.therapyHelps.title}</h2>
        <p className="kct-sub kct-center">{d.therapyHelps.subtitle}</p>
        {/* The same accordion as "when to seek help", filled grey and set
            smaller — the design uses the shape twice at two weights. */}
        <div className="kct-helps-media" aria-hidden>
          <span /><span />
        </div>
        <ul className="kct-seek kct-seek--soft">
          {d.therapyHelps.items.map((it, i) => {
            const open = openHelp === i;
            return (
              <li key={i} className={`kct-seek-row ${open ? 'is-open' : ''}`}>
                <button type="button" className="kct-seek-head" aria-expanded={open}
                  onClick={() => setOpenHelp(open ? -1 : i)}>
                  <span className="kct-seek-t">{it.title}</span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {open && <p className="kct-seek-b">{it.body}</p>}
              </li>
            );
          })}
        </ul>
      </Section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <Section className="kct-ctasec">
        <div className="kct-bookband">
          <span className="kct-bookband-art" aria-hidden />
          <div className="kct-bookband-copy">
            <p className="kct-band-p kct-band-p--lead">{d.finalCta.text}</p>
          </div>
          <BookButton href={d.finalCta.cta.href}>{d.finalCta.cta.label}</BookButton>
        </div>
      </Section>

      {/* ── Blogs & Events ───────────────────────────────────────────────
          Three recent posts, as the design draws them: cover, title, and a
          "Read more" with an arrow. Hidden entirely when there are none, so a
          page that cannot reach the blog API shows no empty frames. */}
      {posts.length > 0 && (
        <Section bg="#fff" className="kct-blogs-sec">
          <p className="kct-kicker">Blogs &amp; Events</p>
          <h2 className="kct-h2 kct-center">We touch millions of life every year</h2>
          <div className="kct-blogs">
            {posts.map((b) => (
              <a key={b.slug} className="kct-blog" href={`/blog/${b.slug}`}>
                {b.featured_image_url
                  ? <img className="kct-blog-img" src={b.featured_image_url} alt="" loading="lazy" />
                  : <span className="kct-blog-img kct-blog-img--ph" aria-hidden />}
                <span className="kct-blog-t">{b.title}</span>
                <span className="kct-blog-more">
                  Read more
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M7 17L17 7M8 7h9v9" />
                  </svg>
                </span>
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* ── FAQs (Wix "line" theme: search + underlined rows) ──────────── */}
      <Section className="kct-faq-sec">
        <h2 className="kct-h2 kct-center">{d.faqsTitle || 'Frequently Asked Questions'}</h2>
        {/* The design puts category tabs here — General, Appointments, Therapy,
            Payments, Privacy. Nothing in the CMS carries a category: a FAQ is
            a question and an answer, so tabs would be five buttons that all
            show the same list. The search stays instead; it narrows the list
            for real. Add a category per FAQ and the tabs can replace it. */}
        <div className="kct-faq-head">
          <input
            type="text"
            className="kct-faq-search"
            placeholder="Looking for something?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search frequently asked questions"
          />
        </div>
        <div className="kct-faq">
          {faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={i} className="kct-faq-row">
                <button type="button" onClick={() => setOpenFaq(open ? -1 : i)} aria-expanded={open}>
                  <span>{f.q}</span>
                  <span className="kct-faq-sign" aria-hidden>{open ? '−' : '+'}</span>
                </button>
                {open && <p>{f.a}</p>}
              </div>
            );
          })}
          {faqs.length === 0 && <p className="kct-faq-empty">No matching questions.</p>}
        </div>
      </Section>

      {/* The design runs FAQ straight into the footer. What stood here was a
          closing panel the Wix page had — "We have supported over 1 million
          lives" above a Book button — which the design does not draw, and the
          page already asks three times above this. */}
    </main>
  );
}

/* ------------------------------------------------------------------------ */
/* Scoped stylesheet. !important throughout because globals.css (never edit)  */
/* hard-sets h1–h6 and p sizes/families site-wide.                            */
/* ------------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');

/* Design tokens, read from the Figma file "Koott 20-10-26" through the Figma
   MCP connector — these are the designer's own variable values, not colours
   sampled off a screenshot. See figma-ref/design-tokens.md.

   Titles are Poppins, body is Inter, which is what globals.css already
   enforces; the sizes are this page's own and are set below. */
.kct{
  /* brand */
  --p-main:#189E4F;
  --p-light:#EFFFEA;
  --p-dark:#1B6930;
  --p-darkest:#063327;
  /* text */
  --t-primary:#0F0F0F;
  --t-secondary:#374151;
  --t-body:#373737;        /* Typography/Secondary as used on this page */
  --t-muted:#6B7280;
  --t-soft:#7C7C7C;        /* the verified-by line */
  --t-disabled:#9CA3AF;
  --t-alt:#FFFFFF;
  /* surface */
  --bg-soft:#F9F9F9;
  /* stroke */
  --s-1:#E3E2E2;
  --s-2:#E5E5EA;
  --s-green-1:#BFE3CB;
  --s-green-2:#E8EFE5;
  /* status */
  --ok:#059669;
  --warn:#D97706;
  --err:#DC2626;
  --info:#2563EB;

  /* Kept so the sections not yet restyled keep rendering while the page is
     migrated across; they map onto the tokens above rather than the old
     Wix-derived palette. */
  --ink:#0F0F0F;
  --green:#189E4F;
  --green-hover:#1B6930;
  --accent:#189E4F;
  --deep:#063327;
  --deep2:#1B6930;
  --icon:#189E4F;
  --line:#E3E2E2;
  --sans:'Poppins',ui-sans-serif,system-ui,sans-serif;
  --body:'Inter',ui-sans-serif,system-ui,sans-serif;
  --band:linear-gradient(180deg,#F0FFEC 0%,#D4FFC2 100%);
  /* The site header (components/Header.jsx) is position:fixed and h-16, so it
     occupies no space in flow — without this the hero's first 64px render
     underneath it. Keep in sync with the header's height. */
  --header-h:64px;
  padding-top:var(--header-h);
  background:#fff;color:var(--ink);
  font-family:var(--body)!important;
}
/* Anchored sections must clear the fixed header when jumped to. */
.kct-sec{scroll-margin-top:var(--header-h);}
.kct *{box-sizing:border-box;}
.kct span,.kct a,.kct button,.kct li,.kct input{letter-spacing:0!important;}

/* The design lays the page out on a 1140 column inside a 1920 frame. Below
   1180 it shrinks with the viewport, and at tablet and phone the gutter
   narrows to the 16px the mobile frame uses (358 inside 390). */
.kct-sec{padding:80px 0;}
/* 1140 of content, not 1140 including the gutter. Every section in the design
   runs 390 to 1530 on a 1920 frame — the plans row is four 267 cards 24 apart,
   the blogs three 358.7 cards 32 apart, both exactly 1140 — and the column was
   24 short on each side of that. */
.kct-in{max-width:1188px;margin:0 auto;padding:0 24px;}
.kct-center{text-align:center!important;}

/* Type, from the Figma text styles. H2/Web is 32 and H2/Mob is 24/32, so the
   page heading steps down at the phone breakpoint rather than scaling.

   :not(#_) is how globals.css raises its own heading rules above component
   CSS; matching it here is what lets this page set its sizes without editing
   that file and changing every other page. */
.kct-h1,.kct-h1:not(#_){
  font-family:var(--sans)!important;font-size:32px!important;font-weight:600!important;
  line-height:normal!important;letter-spacing:0!important;color:var(--t-primary)!important;margin:0;
}
.kct-h2,.kct-h2:not(#_){
  font-family:var(--sans)!important;font-size:32px!important;font-weight:600!important;
  line-height:normal!important;letter-spacing:0!important;color:var(--t-primary)!important;margin:0;
}
.kct-h2--deep{color:var(--deep)!important;line-height:1.3em!important;}
.kct-eyebrow,.kct-eyebrow:not(#_){
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:22px!important;letter-spacing:0!important;color:var(--t-body)!important;margin:0;
}
.kct-lede{
  font-family:var(--body)!important;font-size:16px!important;font-weight:400!important;
  line-height:24px!important;letter-spacing:0!important;color:var(--t-body)!important;margin:0;
}
.kct-sub{
  font-family:var(--body)!important;font-size:16px!important;font-weight:400!important;
  line-height:24px!important;letter-spacing:0!important;color:var(--t-body)!important;margin:8px 0 0;
}
.kct-sub.kct-center{max-width:630px;margin-left:auto;margin-right:auto;}
.kct-kicker{
  font-family:var(--body)!important;font-size:13px!important;font-weight:400!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--ink)!important;
  margin:0 0 8px;text-align:center;
}

/* hero ------------------------------------------------------------------ */
.kct-hero{padding-top:0;padding-bottom:80px;}
.kct-hero-grid{display:grid;grid-template-columns:minmax(0,1fr) 374px;gap:56px;align-items:center;}
/* The text column stacks 8 / 12 / 11.3 in the design; the heading and lede
   carry no margin of their own so the gaps come only from here. */
.kct-hero-grid > div:first-child{display:flex;flex-direction:column;align-items:flex-start;gap:8px;}
.kct-hero-cta{display:flex;align-items:center;gap:14px 16px;margin:11px 0 0;flex-wrap:wrap;}
.kct-verified{
  font-family:var(--body)!important;font-size:12px!important;font-weight:400!important;
  line-height:18px!important;letter-spacing:0!important;color:var(--t-soft)!important;
  margin:4px 0 0;
}
.kct-tick{color:#3D985C;}
.kct-tick{color:var(--p-main);}
.kct-hero-media{
  position:relative;width:374px;height:374px;border-radius:10px;overflow:hidden;
  background:#EFF4F0 url('/design/hero.webp') center/cover no-repeat;
  display:flex;align-items:center;justify-content:center;
}
.kct-play{
  width:56px;height:56px;border-radius:28px;background:#4FAB69;color:#fff;
  display:flex;align-items:center;justify-content:center;
  font-size:18px;line-height:27px;padding-left:4px;
  filter:drop-shadow(0 6px 10px rgba(2,85,69,.25));
}
.kct-media-label{
  position:absolute;left:20px;right:20px;bottom:16px;z-index:1;
  font-size:12px;line-height:18px;color:#fff;
}
/* The caption is white over the video still in the design. Until a still is
   set it would sit on the pale gradient and vanish, so the foot of the frame
   carries a scrim — invisible once a dark image is behind it. */
.kct-hero-media::after{
  content:'';position:absolute;left:0;right:0;bottom:0;height:72px;
  background:linear-gradient(180deg,rgba(6,51,39,0) 0%,rgba(6,51,39,.55) 100%);
  pointer-events:none;
}

/* buttons --------------------------------------------------------------- */
/* Button/Medium from the Figma component: 40 tall, 8 radius, Inter Medium
   16/24. Primary fills Primary Main; the secondary is white on a green
   hairline rather than a bare link. */
.kct-btn-solid{
  display:inline-flex;align-items:center;justify-content:center;gap:12px;white-space:nowrap;
  height:40px;padding:8px 22px;border-radius:8px;
  background:var(--p-main);color:#fff!important;text-decoration:none;
  font-family:var(--body)!important;font-size:16px!important;font-weight:500;line-height:24px;
  transition:background-color .2s ease;
}
.kct-btn-solid:hover{background:var(--p-dark);}
.kct-btn-ghost{
  display:inline-flex;align-items:center;justify-content:center;gap:12px;text-decoration:none;white-space:nowrap;
  height:40px;padding:7px 18px;border-radius:8px;
  background:#fff;border:1px solid var(--s-green-1);
  font-family:var(--body)!important;font-size:16px!important;font-weight:500;line-height:24px;
  color:var(--t-primary)!important;transition:all .2s ease;
}
.kct-btn-ghost:hover{border-color:var(--p-main);color:var(--p-dark)!important;}
.kct-btn-ghost svg{width:24px;height:24px;flex:none;}
.kct-btn-pill{
  display:inline-flex;align-items:center;gap:6px;flex:none;
  padding:9px 18px;border-radius:15px;background:#fff;border:1px solid #025545;
  font-family:var(--sans)!important;font-size:15px;color:var(--accent)!important;
  text-decoration:none;transition:all .2s ease;white-space:nowrap;
}
.kct-btn-pill:hover{border-width:2px;padding:8px 17px;color:var(--deep2)!important;}
.kct-btn-pill.is-dark{background:var(--deep2);color:#fff!important;font-size:13px;box-shadow:.71px .71px #fff;}
.kct-btn-pill.is-dark:hover{color:#fff!important;}

/* stats ----------------------------------------------------------------- */
.kct-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px;margin-top:40px;}
/* Impact metric from the design: soft grey on a green hairline, 15 radius,
   16 padding, 4 between the figure and its line. */
.kct-stat{
  display:flex;flex-direction:column;gap:4px;align-items:flex-start;
  border-radius:15px;padding:16px;
  background:var(--bg-soft);border:1px solid var(--s-green-2);
  transition:transform .2s ease-in-out;
}
.kct-stat:hover{transform:translateY(-4px);}
.kct-stat-v,.kct-stat-v:not(#_){
  font-family:var(--sans)!important;font-size:24px!important;font-weight:600!important;
  line-height:normal!important;letter-spacing:0!important;color:var(--p-dark)!important;
  text-align:left;margin:0;
}
.kct-stat-l{
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:22px!important;letter-spacing:0!important;color:var(--t-body)!important;margin:0;
}

/* therapists ------------------------------------------------------------ */
/* Filter selects — 233x41 at radius 15 matches the live page's <select>; the
   grey chrome there is themed green here to sit with the rest of the palette. */
/* therapist cards — the card itself lives in components/TherapistCard.jsx so the
   listing page and this template stay identical; only the grid is local. */
/* The design draws this strip at 1180, wider than the 1140 the rest of the
   page uses, which is what puts each card at 377 rather than 348. */
.kct-therapists{
  display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin-top:24px;
}
/* .kct-in holds the page at 1140 less its 24 gutters, so the strip has to step
   outside it to reach 1180. Only once the viewport can take it. */
@media (min-width:1228px){
  .kct-therapists{margin-left:-20px;margin-right:-20px;}
}
.kct-more{display:flex;justify-content:center;margin:24px 0 0;}
/* The live grid spans the full 980 column, outside .kct-in's 20px gutter,
   which is what puts each card at 480 rather than 460. */


.kct-more{text-align:center;margin:26px 0 0;}
.kct-more a{font-family:var(--sans)!important;font-size:15px;color:var(--deep2)!important;text-decoration:none;}

.kct-figure{border-radius:10px;background:linear-gradient(180deg,#F0FFEC 0%,#D4FFC2 100%);}
.kct-figure--video{
  background:var(--deep);position:relative;overflow:hidden;
  display:flex;align-items:center;justify-content:center;
}
.kct-figure--video img{width:100%;height:100%;object-fit:cover;display:block;}
.kct-fig-play{
  position:absolute;width:72px;height:72px;border-radius:50%;
  background:var(--accent);color:#fff;display:flex;align-items:center;
  justify-content:center;font-size:24px;padding-left:5px;
}
.kct-on-dark .kct-h2,.kct-on-dark .kct-sub{color:#fff!important;}
.kct-steps{display:flex;flex-direction:column;gap:13px;margin-top:24px;}
.kct-why-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:20px;}

/* cards ----------------------------------------------------------------- */
.kct-card{
  border:1px solid var(--line);border-radius:10px;padding:16px 20px;background:transparent;
}
.kct-card--solid{background:#fff;border-color:#fff;}
/* Types cards — live: 288x159, radius 10, 1px #5EA277, 15px check at (19,18),
   title AND body both starting at x=41 so the copy clears the icon. */
.kct-card--green{background:#fff;border-color:#5EA277;padding:18px;}
.kct-card--green .kct-card-t{gap:7px;margin:0 0 11px;line-height:1.2em!important;}
.kct-card--green .kct-card-i{flex:none;width:15px;height:15px;margin-top:3px;}
.kct-card--green .kct-card-b{padding-left:22px;}
.kct-card--plan{background:transparent;border-color:rgba(41,101,61,.31);display:flex;flex-direction:column;}
.kct-card--pillar{background:#fff;border:0;box-shadow:0 2px 14px rgba(16,14,14,.05);}
.kct-card--wide{width:100%;}
.kct-card-t{
  display:flex;align-items:flex-start;gap:8px;
  font-family:var(--body)!important;font-size:17px!important;font-weight:700!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--ink)!important;margin:0 0 8px;
}
.kct-card-i{flex:none;margin-top:5px;}
.kct-card-b{
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--ink)!important;margin:0;
}
.kct-card--plan .kct-card-b{flex:1;}
/* Bullet list inside a Types card. globals.css strips list markers site-wide,
   so both the marker and the list-item display are forced back on here. */
.kct-card-list{
  margin:0;padding:0 0 0 18px;list-style:disc!important;
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--ink)!important;
}
.kct-card-list li{display:list-item!important;margin:0 0 5px;}
.kct-card-list li::marker{color:var(--accent);}
.kct-card--green .kct-card-list{padding-left:40px;}
.kct-num{font-family:var(--sans)!important;font-weight:700;color:var(--accent);}
/* Title text and body copy both start at x=46 on the live page, i.e. 25px past
   the number. Fixing the number's width keeps the two flush at any font size. */
.kct-card--plain .kct-card-t{gap:0;}
.kct-card--plain .kct-num{flex:none;width:25px;}
.kct-card--plain .kct-card-b{padding-left:25px;}
.kct-price{
  font-family:var(--sans)!important;font-size:15px;color:var(--deep2);margin-top:16px;display:block;
}
.kct-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:32px;}
.kct-grid-3--wide{gap:23px 24px;}
.kct-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;}
.kct-grid-4--plans{gap:10px;margin-top:32px;}
.kct-stack{display:flex;flex-direction:column;gap:18px;margin-top:32px;max-width:559px;margin-left:auto;margin-right:auto;}
/* Seek-help rows — live: 559x114 card, 15px chevron at x=16, title AND body
   both starting at x=42, so the body clears the icon just like the steps. */
.kct-card--seek{padding:16px;}
.kct-card--seek .kct-card-t{gap:11px;margin:0 0 16px;}
.kct-card--seek .kct-card-i{flex:none;width:15px;height:15px;margin-top:4px;}
.kct-card--seek .kct-card-i path{fill:var(--accent);}
.kct-card--seek .kct-card-b{padding-left:26px;}

/* reviews --------------------------------------------------------------- */
.kct-reviews-h{
  font-family:var(--sans)!important;font-size:17px!important;font-weight:500!important;
  line-height:1.4em!important;letter-spacing:-.05em!important;color:var(--ink)!important;
  text-align:center;margin:0 0 32px;
}
.kct-reviews{display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x mandatory;}
/* Card is 304x380 on the live page, where the whole thing ships as one flat
   image; rebuilt here as real markup so the CMS can drive the text. */
.kct-review{
  flex:none;width:304px;height:380px;margin:0;border-radius:8px;scroll-snap-align:start;
  background:#EFFBE8;padding:12px;display:flex;flex-direction:column;
}
.kct-review-src{
  align-self:flex-end;width:26px;height:26px;border-radius:50%;flex:none;
  display:flex;align-items:center;justify-content:center;overflow:hidden;
  background:#fff;font-family:var(--sans)!important;font-size:13px;font-weight:700;
  color:var(--deep2);line-height:1;
}
.kct-review-src img{width:100%;height:100%;object-fit:contain;display:block;}
.kct-review-src.is-whatsapp{background:#25D366;color:#fff;}
.kct-review-src.is-google{background:#fff;color:#4285F4;}

.kct-review-quote{
  flex:1;margin:8px 0 0;padding:20px 16px;border-radius:10px;background:#fff;
  display:flex;align-items:center;justify-content:center;text-align:center;
  font-family:var(--body)!important;font-size:13px!important;font-weight:400!important;
  line-height:1.6em!important;color:#262222!important;overflow:hidden;
}
.kct-review-person{display:flex;align-items:center;gap:10px;margin:12px 0 0;padding:0 4px;}
.kct-review-avatar{
  flex:none;width:40px;height:40px;border-radius:50%;overflow:hidden;background:#D9F0DA;
}
.kct-review-avatar img{width:100%;height:100%;object-fit:cover;display:block;}
.kct-review-who{display:flex;flex-direction:column;min-width:0;}
.kct-review-name{
  font-family:var(--body)!important;font-size:13px!important;font-weight:600!important;
  line-height:1.3em!important;color:var(--ink)!important;
}
.kct-review-age{
  font-family:var(--body)!important;font-size:12px!important;font-weight:400!important;
  line-height:1.3em!important;color:#5B5757!important;
}

/* CTA rows & gradient bands --------------------------------------------- */
.kct-cta-row{display:flex;align-items:center;justify-content:center;gap:24px;flex-wrap:wrap;}
/* Full-bleed CTA band: live is 157px tall, radius 0, edge to edge. */
.kct-ctaband{background:var(--band);padding:20px;}
.kct-ctaband-in{max-width:980px;margin:0 auto;text-align:center;}
.kct-cta-text{
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--ink)!important;
  text-align:center;margin:0 auto;max-width:430px;
}
.kct-btn-cta{
  display:inline-flex;align-items:center;justify-content:space-between;gap:10px;
  min-width:158px;height:33px;margin-top:18px;padding:0 6px 0 20px;
  border-radius:15px;background:var(--deep2);color:#fff!important;text-decoration:none;
  font-family:var(--body)!important;font-size:13px;font-weight:400;
  transition:background-color .2s ease;
}
.kct-btn-cta:hover{background:var(--green-hover);}
.kct-btn-cta-arrow{
  flex:none;width:22px;height:22px;border-radius:50%;background:#C3E939;
  color:var(--deep);display:flex;align-items:center;justify-content:center;
  font-size:12px;line-height:1;
}
.kct-band{
  display:flex;align-items:center;gap:28px;border-radius:7px;padding:28px 32px;background:var(--band);
}
.kct-band--stack{justify-content:space-between;}
.kct-band-art{flex:none;width:130px;height:95px;border-radius:8px;background:rgba(255,255,255,.55);}
.kct-band-title{
  flex:1;font-family:var(--sans)!important;font-size:16px!important;font-weight:500!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--ink)!important;margin:0;
}
.kct-band-h{
  font-family:var(--sans)!important;font-size:18px!important;font-weight:500!important;
  line-height:1.3em!important;letter-spacing:0!important;color:var(--ink)!important;margin:0 0 10px;
}
.kct-band-p{
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--ink)!important;margin:0;max-width:44em;
}

/* about ----------------------------------------------------------------- */
/* The prose and the pillars are styled with the rest of the design, further
   down. What stood here was the Wix layout: centred body copy, and a pillar
   whose text sat in a green panel inside the card. */
.kct-prose{margin:0;}

/* FAQ ------------------------------------------------------------------- */
.kct-faq-head{display:flex;align-items:center;gap:24px;margin-bottom:8px;}
.kct-faq-label{
  font-family:var(--sans)!important;font-size:20px!important;font-weight:500!important;
  letter-spacing:-.05em!important;color:var(--ink)!important;margin:0;
}
.kct-faq-search{
  flex:1;border:0;border-bottom:1px solid var(--line);background:transparent;
  padding:10px 2px;font-family:var(--body)!important;font-size:14px;color:var(--ink);outline:none;
}
.kct-faq-search:focus{border-bottom-color:var(--accent);}
.kct-faq{border-top:1px solid var(--line);}
.kct-faq-row{border-bottom:1px solid var(--line);}
.kct-faq-row button{
  width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;
  background:none;border:0;padding:22px 0;text-align:left;
  font-family:var(--body)!important;font-size:17px;font-weight:700;color:var(--ink);
}
.kct-faq-sign{font-size:20px;line-height:1;color:var(--accent);font-weight:400;}
.kct-faq-row p{
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--ink)!important;
  margin:0;padding:0 0 22px;max-width:52em;
}
.kct-faq-empty{font-family:var(--body)!important;font-size:14px!important;padding:22px 0;}

/* closing --------------------------------------------------------------- */


/* Therapist card, from the Figma -------------------------------------------
   The card is shared with the home page, the booking listing and the resume
   card, so the design is applied here rather than in TherapistCard itself —
   those three keep the card they have until their own designs land. Most of it
   is re-pointing the card's own variables; the rest are the handful of shapes
   the design changes. */
.kct .ktc{
  --ktc-primary:var(--p-main);
  --ktc-primary-soft:var(--p-light);
  --ktc-ink:var(--t-primary);
  --ktc-ink-soft:#5C5C5C;          /* Typography/Tertiary */
  --ktc-line:var(--s-1);
  --ktc-bg:var(--bg-soft);
  --ktc-surface:#fff;
  border-width:1px;border-radius:16px;padding:20px;
}
/* The card the design draws is this card, sized differently: 377.33x360
   with 20 of padding, and inside it a 234-tall block over a 66-tall foot
   20 below it. Measured off the .fig —
     head   48   (a 48 avatar, not 64)
     panel  60   (12 + two lines of bio + 12)
     tags   24
     stats  54   (three 97.11x54 tiles on #F9F9F9, radius 12)
     foot   66   (#F0F5ED on a #DDEED8 hairline, a 120x40 #1B6930 button)
   with 16 between each and 20 before the foot. Scoped to .kct so the
   booking page keeps the card it has. */
.kct .ktc{min-height:360px;}
.kct .ktc-avatar{width:48px;height:48px;}
.kct .ktc-head{margin-bottom:16px;}
.kct .ktc-panel{min-height:60px;}
.kct .ktc-voice{display:none;}
.kct .ktc-tags-wrap{height:24px;overflow:hidden;}
.kct .ktc-stats,.kct .ktc-stats:not(#_){margin-bottom:20px;}
.kct .ktc-foot a,.kct .ktc-foot button{background:var(--p-dark);}
.kct .ktc-name{font-size:16px!important;font-weight:500!important;line-height:24px!important;}
.kct .ktc-role{font-size:12px!important;line-height:18px!important;margin:2px 0 0;}
.kct .ktc-panel{border-radius:12px;padding:12px;margin-bottom:16px;}
.kct .ktc-bio{
  font-size:12px!important;line-height:18px!important;margin:0;
  max-height:calc(18px * 3);
}
.kct .ktc-chip{
  height:24px;padding:3px 10px;
  font-size:12px!important;font-weight:500!important;line-height:18px!important;
  color:var(--t-body)!important;
}
.kct .ktc-tags{gap:6px;}
.kct .ktc-stats{gap:23px;margin-bottom:16px;}
.kct .ktc-stat{border-radius:12px;padding:8px;}
.kct .ktc-stat-v{font-size:12px!important;font-weight:500!important;line-height:18px!important;}
.kct .ktc-stat-l{font-size:12px!important;line-height:18px!important;margin:2px 0 0;}
/* The foot is a tinted panel in the design, not a hairline above the row. */
.kct .ktc-foot{
  background:#F0F5ED;border:1px solid #DDEED8;border-radius:12px;
  padding:12px;border-top:0;margin-top:auto;
}
.kct .ktc-avail-l{font-size:12px!important;line-height:18px!important;color:var(--t-body)!important;}
.kct .ktc-avail{font-size:12px!important;font-weight:500!important;line-height:18px!important;margin:2px 0 0;}
.kct .ktc-book{
  height:40px;padding:8px 22px;border-radius:8px;
  font-size:16px!important;font-weight:500!important;line-height:24px!important;
}
.kct .ktc-book:hover{background:var(--p-dark);}


/* How it works ------------------------------------------------------------
   Measured off the design: two 374 cards 24 apart, so the grid is 772 rather
   than the page's 1140 — it sits in from the column on both sides. Card
   padding 24, the number a 34 square on a green hairline, and 12 between it
   and the title.

   The number is beside the copy, not inside the title, so the body lines up
   under the title rather than under the number. */
.kct-steps{
  display:grid;grid-template-columns:repeat(2,373px);gap:24px;margin-top:40px;
  justify-content:center;
}
/* The card is a column: the number beside the copy, then the picture under
   both. The picture starts where the number starts — x=600 against a card at
   574 with 24 padding — not where the title does. */
.kct-step{
  display:flex;flex-direction:column;min-height:216px;
  background:#fff;border:1px solid var(--s-1);border-radius:16px;padding:24px;
}
.kct-step-head{display:flex;align-items:flex-start;gap:12px;}
.kct-step-copy{min-width:0;}
.kct-step-t,.kct-step-t:not(#_){
  margin:0;
  font-family:var(--body)!important;font-size:18px!important;font-weight:500!important;
  line-height:26px!important;letter-spacing:0!important;color:var(--t-primary)!important;
}
.kct-num{
  flex:none;display:inline-flex;align-items:center;justify-content:center;
  width:32px;height:32px;border-radius:8px;
  border:1px solid var(--s-green-1);background:#fff;
  font-family:var(--body)!important;font-size:12px!important;font-weight:500!important;
  line-height:18px!important;color:var(--t-primary)!important;
}
.kct-step-b{
  margin:4px 0 0;
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:22px!important;letter-spacing:0!important;color:var(--t-body)!important;
}


/* Why Koott ---------------------------------------------------------------
   Measured off the design: a 316x474 portrait video, 40 from a 784 column
   holding the heading, its line and four 384x141 cards 16 apart. The whole
   block is 1140 — the page column — where it had been running at the old Wix
   890 with a 74 gutter and 242 cards.

   The cards are a lift off the band rather than a different colour, which is
   what keeps them legible on it. */
.kct-why{display:grid;grid-template-columns:316px minmax(0,1fr);gap:40px;align-items:stretch;}
.kct-why-media{
  position:relative;height:auto;min-height:427.72px;border-radius:10px;overflow:hidden;
  display:flex;align-items:center;justify-content:center;
  background:#0A4636 url('/design/why-video.webp') center/cover no-repeat;
}
.kct-why-body{min-width:0;}
.kct-on-dark .kct-h2,.kct-on-dark .kct-h2:not(#_){color:#fff!important;}
.kct-on-dark .kct-sub{color:#fff!important;font-size:16px!important;line-height:24px!important;margin-top:8px;}
.kct-why-grid{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));
  grid-template-rows:repeat(2,minmax(141.52px,auto));grid-auto-flow:column;
  column-gap:16px;row-gap:16px;margin-top:24px;
}
.kct-why .kct-fig-play{
  position:absolute;width:72px;height:72px;border-radius:50%;
  background:var(--p-main);color:#fff;display:flex;align-items:center;justify-content:center;
  font-size:24px;padding-left:5px;
  filter:drop-shadow(0 6px 10px rgba(2,85,69,.3));
}
.kct-on-dark .kct-card--solid{
  background:linear-gradient(180deg,#0A4636 0%,#18AC85 100%);
  border:0;border-radius:10px;padding:16px;min-height:141.52px;
}
.kct-on-dark .kct-card-t,.kct-on-dark .kct-card-t:not(#_){
  font-family:var(--body)!important;font-size:18px!important;font-weight:600!important;
  line-height:26px!important;letter-spacing:0!important;color:#fff!important;margin:0;
}
.kct-on-dark .kct-card-b{
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:22px!important;letter-spacing:0!important;color:#fff!important;margin:8px 0 0;
}

/* Plans -------------------------------------------------------------------
   Four across, white on a hairline, with the price as a pill at the foot. The
   cards stretch so the pills line up however long the copy runs. */
.kct-grid-4--plans{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px;margin-top:40px;align-items:stretch;}
.kct-card--plan{
  display:flex;flex-direction:column;
  min-height:298px;
  background:#FAFCF9;border:1px solid var(--s-green-2);border-radius:12px;padding:25px;
}
.kct-card--plan .kct-card-t,.kct-card--plan .kct-card-t:not(#_){
  font-family:var(--sans)!important;font-size:20px!important;font-weight:600!important;
  line-height:28px!important;letter-spacing:0!important;color:var(--t-primary)!important;margin:0;
}
.kct-card--plan .kct-card-b{
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:22px!important;letter-spacing:0!important;color:var(--t-body)!important;margin:8px 0 0;
}
.kct-price{
  display:inline-flex;align-items:center;justify-content:center;
  margin-top:auto;padding-top:0;
  background:#fff;border:1px solid var(--s-green-2);border-radius:8px;
  height:40px;padding:8px 18px;width:100%;
  font-family:var(--body)!important;font-size:16px!important;font-weight:500!important;
  line-height:24px!important;letter-spacing:0!important;color:var(--p-dark)!important;
}
.kct-card--plan .kct-price{margin-top:auto;}


/* About the condition -----------------------------------------------------
   The explanation sits in a white card beside a photo, and the pillars run
   two-up below it. The heading lives inside the card, not centred above the
   band, which is what the design draws. */
.kct-about-top{display:grid;grid-template-columns:minmax(0,1fr) 412px;gap:24px;align-items:start;}
.kct-about-card{background:#fff;border:1px solid var(--s-1);border-radius:12px;padding:24px;}
.kct-about-media{
  border-radius:12px;min-height:300px;align-self:stretch;
  background:#EFF4F0 url('/design/about.webp') center/cover no-repeat;
}
.kct-about .kct-prose p{
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:22px!important;letter-spacing:0!important;color:var(--t-body)!important;margin:12px 0 0;
}
.kct-pillars{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;margin-top:24px;}
.kct-pillar{background:#fff;border:1px solid var(--s-1);border-radius:12px;padding:20px;}
.kct-pillar-t,.kct-pillar-t:not(#_){
  font-family:var(--sans)!important;font-size:18px!important;font-weight:600!important;
  line-height:26px!important;letter-spacing:0!important;color:var(--t-primary)!important;margin:0;
}
.kct-pillar-b{
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:22px!important;letter-spacing:0!important;color:var(--t-body)!important;margin:8px 0 0;
}


/* Signs checklist ---------------------------------------------------------
   A narrow column on a soft cream card. Each row is a tick and a title with a
   chevron; opening one shows what it means. The panel at the foot answers how
   many are ticked. */
.kct-symptoms-sec{background:#fff;}
.kct-symptoms{
  max-width:640px;margin:0 auto;padding:40px 24px;
  background:#FFFBF5;border:1px solid #F3E7D6;border-radius:24px;
}
.kct-symptoms .kct-sub{margin-bottom:24px;}
.kct-signs{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px;}
.kct-sign{background:#fff;border:1px solid var(--s-1);border-radius:10px;padding:12px 14px;}
.kct-sign.is-open{border-color:var(--s-green-1);}
.kct-sign-row{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.kct-sign-tick{display:flex;align-items:center;gap:10px;cursor:pointer;min-width:0;}
.kct-sign-tick input{position:absolute;opacity:0;width:0;height:0;}
/* The box is drawn rather than native so the tick can be the brand green. */
.kct-sign-tick > span[aria-hidden]{
  flex:none;width:18px;height:18px;border-radius:4px;
  border:1.5px solid var(--s-1);background:#fff;
  display:inline-flex;align-items:center;justify-content:center;transition:all .12s ease;
}
.kct-sign-tick input:checked + span[aria-hidden]{background:var(--p-main);border-color:var(--p-main);}
.kct-sign-tick input:checked + span[aria-hidden]::after{
  content:'';width:5px;height:9px;margin-top:-2px;
  border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg);
}
.kct-sign-tick input:focus-visible + span[aria-hidden]{box-shadow:0 0 0 3px rgba(24,158,79,.25);}
.kct-sign-t{
  font-family:var(--body)!important;font-size:18px!important;font-weight:500!important;
  line-height:26px!important;letter-spacing:0!important;color:var(--t-primary)!important;
  overflow:hidden;text-overflow:ellipsis;
}
.kct-sign-more{
  flex:none;display:inline-flex;align-items:center;justify-content:center;
  width:24px;height:24px;border:0;background:none;cursor:pointer;color:var(--t-muted);
  transition:transform .15s ease;
}
.kct-sign.is-open .kct-sign-more{transform:rotate(180deg);}
.kct-sign-b{
  margin:8px 0 0;
  font-family:var(--body)!important;font-size:12px!important;font-weight:400!important;
  line-height:18px!important;letter-spacing:0!important;color:var(--t-body)!important;
}
.kct-signs-out{
  display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;
  margin-top:20px;padding:20px;background:#fff;border:1px solid var(--s-1);border-radius:12px;
}
.kct-signs-ico{
  display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;
  border-radius:8px;border:1px solid #F0D9B8;background:#FFF8EE;color:#D97706;
}
.kct-signs-out p{
  margin:0;
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:22px!important;letter-spacing:0!important;color:var(--t-body)!important;
}
@media (max-width:640px){
  .kct-symptoms{padding:24px 16px;border-radius:16px;}
}


/* When to seek help -------------------------------------------------------
   A narrow column of accordions, one open at a time. The titles are larger
   here than in the signs checklist: 24 against 14, as the design sets them. */
.kct-seek{list-style:none;margin:24px auto 0;padding:0;max-width:640px;display:flex;flex-direction:column;gap:12px;}
.kct-seek-row{background:#fff;border:1px solid var(--s-1);border-radius:12px;padding:14px 18px;}
.kct-seek-row.is-open{border-color:var(--s-green-1);}
.kct-seek-head{
  width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;
  background:none;border:0;padding:0;cursor:pointer;text-align:left;color:var(--t-muted);
}
.kct-seek-t{
  font-family:var(--body)!important;font-size:24px!important;font-weight:600!important;
  line-height:32px!important;letter-spacing:0!important;color:var(--t-primary)!important;
}
.kct-seek-head svg{flex:none;transition:transform .15s ease;}
.kct-seek-row.is-open .kct-seek-head svg{transform:rotate(180deg);}
.kct-seek-b{
  margin:8px 0 0;
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:22px!important;letter-spacing:0!important;color:var(--t-body)!important;
}

/* Book band ---------------------------------------------------------------
   Picture, line, button — on one soft green strip. */
.kct-bookband{
  display:flex;align-items:center;gap:24px;min-height:182px;
  background:linear-gradient(135deg,#FFFFFF 0%,#E8F1E1 100%);
  border:1px solid var(--s-green-2);border-radius:16px;padding:40px;
}
.kct-bookband-art{
  flex:none;width:168px;height:100px;border-radius:8px;
  background:#EFF4F0 url('/design/cta-1.webp') center/cover no-repeat;
}
.kct-bookband-art--b{background-image:url('/design/cta-2.webp');}
.kct-bookband-art--c{background-image:url('/design/cta-3.webp');}
.kct-bookband-copy{flex:1;min-width:0;}
.kct-bookband .kct-band-h,.kct-bookband .kct-band-h:not(#_){
  font-family:var(--sans)!important;font-size:20px!important;font-weight:600!important;
  line-height:30px!important;letter-spacing:0!important;color:var(--t-primary)!important;margin:0;
}
.kct-bookband .kct-band-p{
  font-family:var(--body)!important;font-size:16px!important;font-weight:400!important;
  line-height:24px!important;letter-spacing:0!important;color:var(--t-body)!important;margin:2px 0 0;
}
@media (max-width:640px){
  .kct-bookband{flex-direction:column;align-items:stretch;text-align:center;}
  .kct-bookband-art{width:100%;height:120px;}
  .kct-seek-t{font-size:18px!important;line-height:26px!important;}
}


/* The soft variant of the accordion: filled rather than outlined, and set at
   body size. Used by "how therapy helps". */
/* "How does therapy help": a 752 column, two stadium photos 364x134 over a
   stack of 58-tall rows on #F9F9F9 with an #F4F4F4 hairline, 16 apart. */
/* ── measured off the Figma tree ─────────────────────────────────────────
   Blogs  head 92 (a 122x32 chip, 12, the heading), 40, cards 358.7x346.
   FAQ    heading 48, 16, a 552x56 tab row, 40, then 860x60 rows 16 apart
          with 17 of padding.
   Stats  heading 48, then 80 before the 415-tall review row.
   Therapists  the heading, 24, then a 1180 strip 360 tall and a 201x40
          button 24 under it.                                            */
.kct-blogs-sec .kct-kicker{
  display:inline-flex;align-items:center;justify-content:center;
  min-width:122px;height:32px;padding:0 16px;border-radius:999px;
  background:var(--p-light);color:var(--p-dark)!important;
  font-size:14px!important;line-height:22px!important;margin:0 0 12px;
}
.kct-blogs-sec{text-align:center;}
.kct-blogs-sec .kct-blogs{text-align:left;margin-top:40px;}
.kct-blog{min-height:346px;}
.kct-faq-row{padding:17px;min-height:60px;}
.kct-reviews-sec .kct-kicker{display:none;}
.kct-reviews{margin-top:80px;min-height:415px;}
.kct-therapists{margin-top:24px;}
.kct-more{margin:24px 0 0;}
.kct-helps-media{
  display:grid;grid-template-columns:repeat(2,364px);gap:24px;
  justify-content:center;margin-top:40px;
}
.kct-helps-media span{
  height:134px;border-radius:67px;background:#EFF4F0 center/cover no-repeat;
}
.kct-helps-media span:first-child{background-image:url('/design/hero.webp');}
.kct-helps-media span:last-child{background-image:url('/design/helps-2.webp');}
.kct-seek--soft{max-width:752px;gap:16px;margin-top:24px;}
.kct-seek--soft .kct-seek-row{background:#F9F9F9;border-color:#F4F4F4;padding:15px 16px;}
.kct-seek--soft .kct-seek-row.is-open{background:#F9F9F9;border-color:#F4F4F4;}
.kct-seek--soft .kct-seek-t{font-size:18px!important;line-height:26px!important;font-weight:600!important;}
.kct-band-p--lead{font-size:16px!important;line-height:24px!important;color:var(--t-primary)!important;}
/* The strip's one line is Poppins 20/30, and its button is 161x48 rather
   than the 122x40 the hero uses. */
.kct-bookband .kct-band-p--lead,.kct-bookband .kct-band-p--lead:not(#_){
  font-family:var(--sans)!important;font-size:20px!important;font-weight:500!important;
  line-height:30px!important;color:var(--t-primary)!important;
}
.kct-bookband .kct-btn-solid{flex:none;height:48px;min-width:161px;}


/* Types we treat ----------------------------------------------------------
   A tall picture beside the list, rather than the three-across grid this was.
   The accordion is the soft one again, run full width of its column. */
.kct-types{display:grid;grid-template-columns:372px minmax(0,1fr);gap:32px;align-items:start;}
.kct-types-art{
  border-radius:12px;min-height:420px;align-self:stretch;
  background:#EFF4F0 url('/design/types.webp') center/cover no-repeat;
}
.kct-types-body .kct-sub{margin:8px 0 0;}
.kct-types-body .kct-seek{max-width:none;margin:24px 0 0;gap:16px;}
.kct-types-body .kct-seek-row,.kct-types-body .kct-seek-row.is-open{
  background:linear-gradient(180deg,#E2E8E7 0%,#FFFFFF 100%);
  border:1px solid #FFFFFF;border-radius:8px;padding:15px 16px;
  box-shadow:0 2px 4px rgba(0,0,0,.04);
}
.kct-types-body .kct-seek-row.is-open{border-radius:12px;}
.kct-seek--flush{max-width:none;margin-left:0;margin-right:0;}
@media (max-width:1024px){
  .kct-types{grid-template-columns:1fr;gap:24px;}
  .kct-types-art{min-height:240px;}
}


/* FAQ ---------------------------------------------------------------------
   A narrow column of white rows with a plus on the end, under a centred
   heading. It was the Wix line theme: a left-hand label and underlined rows. */
.kct-faq-sec{background:var(--bg-soft);}
.kct-faq-head{display:flex;justify-content:center;margin:16px 0 0;min-height:56px;align-items:center;}
.kct-faq-search{
  width:100%;max-width:420px;height:40px;padding:8px 16px;
  background:#fff;border:1px solid var(--s-1);border-radius:999px;
  font-family:var(--body)!important;font-size:14px!important;color:var(--t-primary)!important;
}
.kct-faq-search:focus{outline:none;border-color:var(--p-main);box-shadow:0 0 0 3px rgba(24,158,79,.15);}
.kct-faq{max-width:860px;margin:40px auto 0;display:flex;flex-direction:column;gap:16px;}
.kct-faq-row{background:#fff;border:1px solid #F4F4F4;border-radius:16px;padding:15px 16px;}
.kct-faq-row button{
  width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;
  background:none;border:0;padding:0;cursor:pointer;text-align:left;
}
.kct-faq-row button > span:first-child{
  font-family:var(--body)!important;font-size:18px!important;font-weight:500!important;
  line-height:26px!important;letter-spacing:0!important;color:var(--t-primary)!important;
}
.kct-faq-sign{flex:none;font-size:18px;line-height:1;color:var(--t-muted);}
.kct-faq-row p{
  margin:16px 0 0;
  font-family:var(--body)!important;font-size:18px!important;font-weight:400!important;
  line-height:26px!important;letter-spacing:0!important;color:var(--t-body)!important;
}
.kct-faq-empty{text-align:center;color:var(--t-muted)!important;}


/* Reviews -----------------------------------------------------------------
   A Primary Darkest band with the quotes in a column layout, as the design
   draws it: cards of different heights packed into four columns rather than a
   row of equal boxes. The cards are a lift off the band, like the Why ones. */
.kct-reviews-sec{background:var(--p-darkest);}
.kct-reviews-sec .kct-kicker{color:rgba(255,255,255,.72)!important;}
.kct-reviews-h,.kct-reviews-h:not(#_){color:#fff!important;margin:0 0 28px;}
.kct-reviews{
  columns:4;column-gap:20px;
}
.kct-review{
  break-inside:avoid;margin:0 0 20px;padding:18px;
  background:linear-gradient(135deg,rgba(24,158,79,.20) 0%,rgba(24,158,79,.07) 100%);
  border:1px solid rgba(191,227,203,.16);border-radius:12px;
}
.kct-review-quote{
  margin:0;
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:22px!important;letter-spacing:0!important;color:rgba(255,255,255,.88)!important;
}
.kct-review-person{display:flex;align-items:center;gap:10px;margin-top:14px;}
.kct-review-avatar{
  flex:none;width:36px;height:36px;border-radius:999px;overflow:hidden;
  background:rgba(255,255,255,.14);display:inline-flex;
}
.kct-review-avatar img{width:100%;height:100%;object-fit:cover;}
.kct-review-who{display:flex;flex-direction:column;min-width:0;}
.kct-review-name{
  font-family:var(--body)!important;font-size:14px!important;font-weight:500!important;
  line-height:22px!important;color:#fff!important;
}
.kct-review-age{
  font-family:var(--body)!important;font-size:12px!important;font-weight:400!important;
  line-height:18px!important;color:rgba(255,255,255,.62)!important;
}
.kct-review-src{
  display:inline-flex;align-items:center;justify-content:center;
  width:22px;height:22px;border-radius:999px;margin-bottom:10px;
  background:#fff;color:var(--t-primary);font-size:12px;font-weight:600;
}
.kct-review-src img{width:14px;height:14px;object-fit:contain;}

/* CTA bands ---------------------------------------------------------------
   The full-bleed green strip, and the mid-page one, both become the same
   soft band the design uses elsewhere on the page. */
.kct-ctaband{background:var(--p-light);padding:28px 0;}
.kct-ctaband-in{
  max-width:1140px;margin:0 auto;padding:0 24px;
  display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap;
}
.kct-cta-text{
  margin:0;
  font-family:var(--sans)!important;font-size:18px!important;font-weight:600!important;
  line-height:26px!important;letter-spacing:0!important;color:var(--t-primary)!important;
}
.kct-btn-cta{
  display:inline-flex;align-items:center;gap:10px;height:40px;padding:8px 22px;
  border-radius:8px;background:var(--p-main);color:#fff!important;text-decoration:none;
  font-family:var(--body)!important;font-size:16px!important;font-weight:500;line-height:24px;
  transition:background-color .2s ease;
}
.kct-btn-cta:hover{background:var(--p-dark);}

@media (max-width:1024px){ .kct-reviews{columns:2;} }
@media (max-width:640px){ .kct-reviews{columns:1;} }




/* Blogs & Events ----------------------------------------------------------
   Three cards: a cover, the title, and a "Read more" that sits at the foot
   however long the title runs. */
.kct-blogs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:32px;margin-top:28px;}
.kct-blog{
  display:flex;flex-direction:column;text-decoration:none;
  background:var(--bg-soft);border:1px solid var(--s-green-2);border-radius:12px;padding:12px;
  transition:border-color .15s ease,transform .15s ease;
}
.kct-blog:hover{border-color:var(--s-green-1);transform:translateY(-2px);}
.kct-blog-img{
  display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:8px;background:#EFF4F0;
}
.kct-blog-img--ph{background:linear-gradient(180deg,#F0FFEC 0%,#D4FFC2 100%);}
.kct-blog-t{
  margin:12px 0 0;
  font-family:var(--body)!important;font-size:16px!important;font-weight:400!important;
  line-height:24px!important;letter-spacing:0!important;color:var(--t-primary)!important;
}
.kct-blog-more{
  display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:14px;
  font-family:var(--body)!important;font-size:14px!important;font-weight:500!important;
  line-height:22px!important;letter-spacing:0!important;color:var(--p-dark)!important;
}
@media (max-width:1024px){ .kct-blogs{grid-template-columns:repeat(2,minmax(0,1fr));} }
@media (max-width:640px){ .kct-blogs{grid-template-columns:1fr;} }


/* The illustration at the foot of each step card. Sizes are the design's:
   ~58 faces, a 70-tall media row, 8 radius on the tiles. */
/* Frame 57 is 58 tall in every card, 36 under the copy — the call and
   pair strips were running 106 and 98 and taking their cards to 230. */
.kct-step-media{margin-top:auto;padding-top:36px;height:94px;display:flex;align-items:center;gap:8px;overflow:hidden;}
.kct-step-faces img{
  width:58px;height:58px;border-radius:999px;object-fit:cover;flex:none;
  background:#EFF4F0;
}
.kct-step-dates{gap:12px;}
.kct-step-days{
  flex:1;min-width:0;display:flex;align-items:center;gap:2px;
  /* The design fades the strip at both ends, as a scroller would. */
  -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 18%,#000 82%,transparent 100%);
  mask-image:linear-gradient(90deg,transparent 0,#000 18%,#000 82%,transparent 100%);
}
.kct-step-days span{
  flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 0;
}
.kct-step-days small{font-size:11px;line-height:16px;color:var(--t-muted);}
.kct-step-days b{
  font-size:11px;line-height:20px;font-weight:500;color:var(--t-body);
  width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;
}
.kct-step-days .is-on b{background:var(--p-dark);color:#fff;}
.kct-step-days .is-on small{color:var(--t-primary);}
.kct-step-slot{
  flex:none;display:flex;flex-direction:column;align-items:center;gap:2px;
  padding:8px 14px;border-radius:10px;background:var(--bg-soft);
}
.kct-step-slot small{font-size:11px;line-height:16px;color:var(--t-body);}
.kct-step-slot b{font-size:15px;line-height:22px;font-weight:600;color:var(--p-dark);}
.kct-step-call{gap:8px;}
.kct-step-tile{
  position:relative;flex:1;height:70px;border-radius:8px;overflow:hidden;
  background:linear-gradient(180deg,#F0FFEC 0%,#D4FFC2 100%);
}
.kct-step-tile img{width:100%;height:100%;object-fit:cover;display:block;}
.kct-step-dots{position:absolute;right:6px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:4px;}
.kct-step-dots i{width:14px;height:14px;border-radius:999px;background:rgba(255,255,255,.9);display:block;}
.kct-step-pair{position:relative;justify-content:center;gap:28px;min-height:76px;}
.kct-step-pair img:not(.kct-step-mark){
  width:62px;height:62px;border-radius:999px;object-fit:cover;background:#EFF4F0;position:relative;z-index:1;
}
/* The mark sits behind the two faces, barely there, as the design has it. */
.kct-step-mark{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:190px;height:auto;opacity:.08;z-index:0;
}
@media (max-width:640px){
  .kct-step-faces img{width:46px;height:46px;}
  .kct-step-mark{width:150px;}
}

/* responsive -------------------------------------------------------------
   Two frames were drawn: 1920 (content 1140) and 390 (content 358). Tablet is
   not in the design, so it is derived — the hero stacks and the four-across
   rows halve, which is the same reflow the phone frame makes, just earlier and
   two-up rather than one. Nothing below invents a size the design does not
   use. */

/* Tablet: the hero's 374 media and 1140 column no longer fit side by side. */
@media (max-width:1024px){
  /* The design's fixed tracks (373 steps, 364 photos) stop fitting here. */
  .kct-steps,.kct-helps-media{grid-template-columns:repeat(2,minmax(0,1fr));}
  .kct-hero-grid,.kct-why{grid-template-columns:1fr;gap:32px;}
  .kct-why-media{height:auto;min-height:0;aspect-ratio:358/230;}
  /* Square at 374 is right beside the text; stacked it would be half the
     fold. It becomes a band at the ratio the phone frame uses (358/230). */
  .kct-hero-media{width:100%;max-width:none;height:auto;aspect-ratio:358/230;}
  .kct-figure--tall{min-height:260px;}
  .kct-grid-3,.kct-grid-3--wide,.kct-therapists{grid-template-columns:repeat(2,minmax(0,1fr));}
  .kct-about-top{grid-template-columns:1fr;}
  .kct-about-media{min-height:220px;}
  .kct-grid-4,.kct-grid-4--plans,.kct-stats{grid-template-columns:repeat(2,minmax(0,1fr));}
}

/* Phone, from the 390 frame: 16px gutters, heading steps to H2/Mob 24/32,
   the metric line drops to Caption 12/18, and the stats sit two-up at an 8px
   gap rather than collapsing to one column. */
@media (max-width:640px){
  .kct-sec{padding:44px 0;}
  .kct-in{padding:0 16px;}
  .kct-hero{padding-top:32px;padding-bottom:48px;}
  .kct-h1,.kct-h1:not(#_){font-size:24px!important;line-height:32px!important;}
  .kct-h2,.kct-h2:not(#_){font-size:24px!important;line-height:32px!important;}
  /* The video sits above the words on the phone, as the frame shows. */
  .kct-hero-grid > div:first-child{order:2;}
  .kct-hero-media{order:1;max-width:none;aspect-ratio:358/230;}
  .kct-hero-cta{gap:12px;}
  .kct-hero-cta > *{flex:1 1 auto;}
  .kct-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:24px;}
  .kct-stat-v,.kct-stat-v:not(#_){line-height:32px!important;}
  .kct-stat-l{font-size:12px!important;line-height:18px!important;}
  .kct-grid-3,.kct-grid-3--wide,.kct-grid-4,.kct-grid-4--plans,.kct-therapists,.kct-why-grid,.kct-pillars{grid-template-columns:1fr;}
  .kct-helps-media{grid-template-columns:1fr;}
  .kct-why-grid{grid-template-rows:auto;grid-auto-flow:row;}
  .kct-on-dark .kct-card--solid{min-height:0;}
  .kct-steps{grid-template-columns:minmax(0,1fr);}
  .kct-about-card{padding:20px;}
  .kct-therapists{margin-left:0;margin-right:0;gap:16px;}
  .kct-band{flex-direction:column;text-align:center;}
  .kct-band-art{display:none;}
  .kct-faq-head{flex-direction:column;align-items:flex-start;gap:8px;}
  .kct-faq-search{width:100%;}
}
`;
