'use client';

/**
 * TherapistProfile — built to "shinjuna-profile-optimized (6).html" in the repo
 * root, with Koott's data behind it.
 *
 * Two columns (1.6fr / 1fr, 1180px, 28px gutter):
 *
 *   left    profile card (name, role, avatar) · stat strip · concerns ·
 *           About (read more) · chip groups (collapsible) · FAQ · reels · blog
 *   right   sticky booking card, four numbered steps that tick off as they are
 *           answered: session type · package · day & time · confirm
 *
 * Type and palette are the artboard's:
 *   bg / surface #FFFFFF · primary #1B6930 · soft #F1FBF3 · sage #B9E8C4
 *   ink #1C1C1E · ink-soft #6C6C70 · line #E5E5EA · muted #8B9186
 *   booking panel #EEF8F1 on #D3EADA · Poppins headings · Inter text
 *
 * Sections render only when there is data for them — no invented ratings,
 * concerns, reels or blog posts. The widget gathers type, plan, day and time,
 * then hands them to /book/<slug>, which still owns verification, slot locking
 * and payment.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { track } from '@/analytics';
import Link from 'next/link';
import { DEFAULT_FAQS, extrasFor } from '@/data/therapistExtras';
import {
  clientTimeZone, fetchSlots, fromYmd, isPsychiatristRecord, packageKind, zoneLabel,
} from '@/lib/sessionSlots';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const title = (s) => String(s).replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** "Irene Mariam" -> "irene-mariam" */
export const therapistSlug = (t) => `${t.first_name || ''}-${t.last_name || ''}`
  .toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

/** package_type -> { kind, sessions } (see lib/sessionSlots packageKind) */
const readType = (p) => packageKind(p);

const THERAPY_TABS = [['Individual', 'individual'], ['Couple', 'couple']];
const PSYCHIATRY_TABS = [['15 min', 'psychiatry_15'], ['30 min', 'psychiatry_30']];

const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconShare = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 13.5l6.8 4M15.4 6.5L8.6 10.5"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconChev = ({ dir = 'left' }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconTick = ({ className = '', sw = 3 }) => (
  <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M5 12.6l4.9 4.9L19.3 7.2" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * The pill beside each step label. Both the number and the tick are always in
 * the DOM, stacked — answering the step cross-fades one into the other and pops
 * the pill, which a straight swap could not animate. The step being answered
 * carries a soft pulse so the eye knows where it is.
 */
const StepBadge = ({ n, done, active }) => (
  <span className={`lp-badge ${done ? 'is-done' : ''} ${active && !done ? 'is-active' : ''}`} aria-hidden>
    <span className="lp-badge-n">{n}</span>
    <IconTick className="lp-badge-tick" sw={3.6} />
  </span>
);

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const DAY_PAGE = 10;   // two rows of five, as the design lays them out
const CHIP_PREVIEW = 6; // chips shown before the "+" is pressed

export default function TherapistProfile({ therapist, bookHref }) {
  const t = therapist || {};
  const slug = therapistSlug(t);
  const name = t.name || `${t.first_name || ''} ${t.last_name || ''}`.trim();
  const avatar = t.profile_picture_url || t.cover_image_url;

  const [details, setDetails] = useState(null);
  const [packages, setPackages] = useState([]);
  // Psychiatrists: 15 / 30-min consultations only; everyone else individual / couple.
  const isPsychiatrist = isPsychiatristRecord(t);
  const [kind, setKind] = useState(() => (isPsychiatristRecord(t) ? 'psychiatry_15' : 'individual'));
  const [plan, setPlan] = useState(null);
  const [openFaq, setOpenFaq] = useState(-1);
  const [openChips, setOpenChips] = useState({});
  const [aboutOpen, setAboutOpen] = useState(false);
  const [media, setMedia] = useState('reels');   // mobile Reels / Blog tabs
  const [shared, setShared] = useState(false);
  const [posts, setPosts] = useState([]);
  const [slotsByDay, setSlotsByDay] = useState({});   // 'YYYY-MM-DD' -> free slots
  const [dayOffset, setDayOffset] = useState(0);      // paging, in days
  const [pickedDay, setPickedDay] = useState(null);
  const [pickedTime, setPickedTime] = useState(null);
  const aboutRef = useRef(null);
  const [aboutOverflows, setAboutOverflows] = useState(false);
  const bookRef = useRef(null);
  const timesWrapRef = useRef(null);
  const timesInnerRef = useRef(null);

  // The list endpoint trims FAQs and education; the details one carries them.
  useEffect(() => { if (t.id) track('counsellor_profile_view', {}, { psychologistId: t.id }); }, [t.id]);

  useEffect(() => {
    if (!t.id) return undefined;
    let off = false;
    (async () => {
      try {
        const [d, p] = await Promise.all([
          fetch(`${API}/public/psychologists/${t.id}/details`).then((r) => r.json()).catch(() => null),
          fetch(`${API}/public/psychologists/${t.id}/packages`).then((r) => r.json()).catch(() => null),
        ]);
        if (off) return;
        const dd = d?.data ?? d?.message ?? d;
        setDetails(dd?.psychologist || null);
        const pd = p?.data ?? p?.message ?? p;
        setPackages((pd?.packages || []).filter((x) => x.is_active !== false));
      } catch (_) { /* the page still renders from the list record */ }
    })();
    return () => { off = true; };
  }, [t.id]);

  // The Blog strip shows Koott's own posts — real articles, real links.
  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const res = await fetch(`${API}/blogs?limit=3`);
        const json = await res.json();
        const d = json?.data ?? json?.message ?? json;
        const rows = d?.blogs || (Array.isArray(d) ? d : []);
        if (!off) setPosts(rows.slice(0, 3));
      } catch (_) { /* the section hides itself when there is nothing */ }
    })();
    return () => { off = true; };
  }, []);

  // Free session starts for the days on show — the same endpoint and rules as
  // the booking flow (individual 50 min, couple 1 h 20 min, psychiatry 15 / 30 min,
  // 10-min breaks), shown in the visitor's time zone. One request covers the visible page.
  useEffect(() => {
    if (!t.id) return undefined;
    let off = false;
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() + dayOffset);
    const end = new Date(start); end.setDate(start.getDate() + DAY_PAGE - 1);
    const zone = clientTimeZone();
    fetchSlots(API, t.id, isoDate(start), isoDate(end), kind, zone)
      .then((map) => { if (!off) setSlotsByDay((prev) => ({ ...prev, ...map })); })
      .catch(() => { /* the widget still offers the CTA without times */ });
    return () => { off = true; };
  }, [t.id, dayOffset, kind]);

  const full = { ...t, ...(details || {}) };
  const conditions = Array.isArray(full.area_of_expertise) ? full.area_of_expertise : [];
  const education = [
    ['UG', full.ug_college], ['PG', full.pg_college],
    ['MPhil', full.mphil_college], ['PhD', full.phd_college],
  ].filter(([, v]) => v);

  // The schema has no faq_* columns yet; fall back to the site-wide answers.
  const extras = extrasFor(slug);
  const fromDb = [1, 2, 3]
    .map((i) => ({ q: full[`faq_question_${i}`], a: full[`faq_answer_${i}`] }))
    .filter((x) => x.q && x.a);
  const faqs = fromDb.length ? fromDb : [...(extras.faqs || []), ...DEFAULT_FAQS];
  const reels = extras.reels || [];

  const about = String(full.description || full.short_description || '');
  // Blank lines or single ones — therapists write both. A short line with no
  // sentence punctuation, followed by more text, is a heading ("How I work"),
  // which the artboard sets in Poppins rather than as another paragraph.
  const aboutParas = useMemo(() => {
    const lines = about.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    return lines.map((text, i) => ({
      text,
      // A heading carries no sentence punctuation at all. Testing only the last
      // character called "Hi, I'm Sneha! 👋" a heading, because it ends on the
      // emoji rather than the exclamation mark.
      head: text.length <= 60 && !/[.!?:;]/.test(text) && i < lines.length - 1,
    }));
  }, [about]);

  // The times row animates an explicit height, because that is the only value a
  // transition can interpolate: grid-template-rows 1fr stays 1fr whether the day
  // has one row of slots or three, so the height would snap. Driving it from the
  // measured content means opening, closing and swapping days all glide.
  useEffect(() => {
    const wrap = timesWrapRef.current;
    const inner = timesInnerRef.current;
    if (!wrap || !inner) return undefined;
    const apply = () => { wrap.style.height = pickedDay ? `${inner.offsetHeight}px` : '0px'; };
    apply();
    const ro = new ResizeObserver(apply);   // pills rewrap when the panel is resized
    ro.observe(inner);
    return () => ro.disconnect();
  }, [pickedDay, slotsByDay, pickedTime]);

  // The booking panel's own height, handed to CSS so a panel taller than the
  // screen can travel with the page and park when its foot meets the screen's,
  // rather than pinning at the top with its lower half cut off for good.
  useEffect(() => {
    const el = bookRef.current;
    if (!el) return undefined;
    const measure = () => el.style.setProperty('--lp-book-h', `${el.offsetHeight}px`);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
    // The panel grows as plans and times arrive and as steps are answered, so
    // it is re-measured then too — an observer alone left it at its first,
    // half-empty height.
  }, [packages.length, slotsByDay, pickedDay, pickedTime, kind, dayOffset]);

  // Whether the bio actually overflows the clamp, measured rather than guessed
  // from its length: a short bio keeps no 'Read more' it cannot honour, and a
  // narrow window (where the same words run longer) gets one.
  useEffect(() => {
    const el = aboutRef.current;
    if (!el) return undefined;
    // Only judge this while the bio is clamped: once it is open it no longer
    // overflows, and re-measuring there would take "Read less" away with it.
    const measure = () => { if (!aboutOpen) setAboutOverflows(el.scrollHeight > el.clientHeight + 2); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aboutParas, aboutOpen]);

  const days = useMemo(() => {
    const out = [];
    const base = new Date(); base.setHours(0, 0, 0, 0);
    for (let i = 0; i < DAY_PAGE; i += 1) {
      const d = new Date(base); d.setDate(base.getDate() + dayOffset + i);
      out.push(d);
    }
    return out;
  }, [dayOffset]);

  const times = pickedDay ? (slotsByDay[pickedDay] || []) : [];

  const plans = useMemo(
    () => packages.filter((p) => readType(p).kind === kind)
      .sort((a, b) => readType(a).sessions - readType(b).sessions),
    [packages, kind],
  );

  // "Recommended" is earned, not decorative: the plan with the lowest price per
  // session, and only when there is more than one to compare.
  const recommendedId = useMemo(() => {
    if (plans.length < 2) return null;
    const each = (p) => Number(p.price || 0) / Math.max(1, readType(p).sessions);
    return plans.reduce((best, p) => (each(p) < each(best) ? p : best), plans[0]).id;
  }, [plans]);

  const from = plans[0]?.price || full.individual_session_price || full.price;
  const years = Number(full.experience_years) || 0;
  const languages = Array.isArray(full.languages) && full.languages.length
    ? full.languages.map(title)
    : ['Malayalam', 'English'];

  const timeDone = Boolean(pickedDay && pickedTime);
  const planDone = Boolean(plan);
  const bookQuery = `?type=${kind}${plan ? `&plan=${plan.id}` : ''}${
    timeDone ? `&date=${pickedTime.date}&time=${pickedTime.time}` : ''}`;
  const canBook = timeDone && (plans.length === 0 || planDone);
  // The step being answered right now — the first one still open.
  const askingPlan = plans.length > 0 && !planDone;
  const askingTime = !askingPlan && !timeDone;

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 1800); }
    } catch (_) { /* the user dismissed the share sheet */ }
  };

  const chipGroup = (id, heading, items, tone = '') => {
    if (!items.length) return null;
    const open = openChips[id];
    const shown = open ? items : items.slice(0, CHIP_PREVIEW);
    return (
      <div className="lp-chip-group">
        <div className="lp-chip-head">
          <span className="lp-chip-h">{heading}</span>
          {items.length > CHIP_PREVIEW && (
            <button
              type="button" className={`lp-chip-plus ${open ? 'is-open' : ''}`}
              onClick={() => setOpenChips((s) => ({ ...s, [id]: !s[id] }))}
              aria-label={open ? `Show fewer ${heading.toLowerCase()}` : `Show more ${heading.toLowerCase()}`}
              aria-expanded={Boolean(open)}
            >
              +
            </button>
          )}
        </div>
        <div className="lp-chips">
          {shown.map((c) => <span key={c} className={`lp-chip ${tone}`}>{c}</span>)}
        </div>
      </div>
    );
  };

  const reelsBlock = reels.length > 0 && (
    <div className="lp-reels">
      {reels.map((r) => (
        <a key={r.caption} className="lp-reel" href={r.href} target="_blank" rel="noreferrer">
          <span className="lp-reel-play" aria-hidden>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M6 4l14 8-14 8V4z" /></svg>
          </span>
          <span className="lp-reel-bottom">{r.caption}</span>
        </a>
      ))}
    </div>
  );

  const blogBlock = posts.length > 0 && (
    <div className="lp-blogs">
      {posts.map((p) => (
        <Link key={p.slug || p.id} href={`/blog/${p.slug}`} className="lp-blog">
          {p.featured_image_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img className="lp-blog-thumb" src={p.featured_image_url} alt="" />
            : <span className="lp-blog-thumb" aria-hidden />}
          <span>
            <span className="lp-blog-t">{p.title}</span>
            {(p.excerpt || p.summary) && <span className="lp-blog-x">{p.excerpt || p.summary}</span>}
            {(p.read_time || p.published_at) && (
              <span className="lp-blog-m">
                {p.read_time ? `${p.read_time} min read` : ''}
                {p.read_time && p.published_at ? ' · ' : ''}
                {p.published_at ? new Date(p.published_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : ''}
              </span>
            )}
          </span>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="lp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="lp-eyebrow-bar">
        <Link href="/book-malayali-psychologists" className="lp-back" aria-label="Back to therapists"><IconBack /></Link>
        <span className="lp-eyebrow">Book a Meet Session</span>
      </div>

      <div className="lp-layout">
        <div className="lp-left">

          {/* profile — name and role lead, portrait sits to the right */}
          <section className="lp-card">
            <div className="lp-top">
              <div className="lp-top-text">
                <h1 className="lp-name">{name}</h1>
                <p className="lp-role">{full.designation || full.specialization || 'Consultant Psychologist'}</p>
              </div>
              {avatar
                // eslint-disable-next-line @next/next/no-img-element
                ? <img className="lp-avatar" src={avatar} alt={name} width="104" height="104" />
                : <span className="lp-avatar" aria-hidden />}
            </div>
            <div className="lp-actions">
              <a href="#lp-book" className="lp-btn">Book Session</a>
              <button type="button" className="lp-share" onClick={share}>
                <IconShare /><span>{shared ? 'Link copied' : 'Share'}</span>
              </button>
            </div>
          </section>

          {/* stats — only the ones we actually hold */}
          <div className="lp-stats">
            {years > 0 && (
              <div className="lp-stat"><p className="lp-stat-n">{(years * 250).toLocaleString('en-IN')}+</p><p className="lp-stat-l">Session hours</p></div>
            )}
            {years > 0 && (
              <div className="lp-stat"><p className="lp-stat-n">{years}+</p><p className="lp-stat-l">Years exp.</p></div>
            )}
            <div className="lp-stat">
              <p className="lp-stat-n lp-stat-text">{languages[0]}</p>
              <p className="lp-stat-l">{languages.slice(1).join(' & ') || 'Spoken'}</p>
            </div>
            {from > 0 && (
              <div className="lp-stat"><p className="lp-stat-n">{inr(from)}</p><p className="lp-stat-l">Starting from</p></div>
            )}
          </div>

          {/* concerns — the therapist's own focus areas, ticked off */}
          {conditions.length > 0 && (
            <section className="lp-card">
              <h2 className="lp-h">Concerns I can help with</h2>
              <div className="lp-concerns">
                {conditions.slice(0, 8).map((c) => (
                  <div key={c} className="lp-concern">
                    <IconTick className="lp-concern-tick" />
                    <span>{title(c)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {aboutParas.length > 0 && (
            <section className="lp-card">
              <h2 className="lp-h">About</h2>
              <div
                ref={aboutRef}
                className={`lp-about ${aboutOpen ? 'is-open' : ''} ${aboutOverflows && !aboutOpen ? 'is-clipped' : ''}`}
              >
                {aboutParas.map((para, i) => (para.head
                  ? <p key={i} className="lp-about-sub">{para.text}</p>
                  : <p key={i}>{para.text}</p>))}
              </div>
              {aboutOverflows && (
                <button type="button" className="lp-about-toggle" onClick={() => setAboutOpen((v) => !v)}>
                  <span>{aboutOpen ? 'Read less' : 'Read more'}</span>
                  <svg width="10" height="6" viewBox="0 0 10 6" className={aboutOpen ? 'is-up' : ''} aria-hidden>
                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </section>
          )}

          {(conditions.length > 0 || education.length > 0) && (
            <section className="lp-card">
              {chipGroup('spec', 'Specializations', conditions.map(title), 'apricot')}
              {chipGroup('lang', 'Languages', languages, 'sage')}
              {chipGroup('edu', 'Education', education.map(([k, v]) => `${k} · ${v}`))}
            </section>
          )}

          {faqs.length > 0 && (
            <section className="lp-card">
              <h2 className="lp-h">FAQ&rsquo;s</h2>
              {faqs.map((f, i) => (
                <div key={f.q} className={`lp-faq ${openFaq === i ? 'is-open' : ''}`}>
                  <button type="button" className="lp-faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                    {f.q}<span aria-hidden>{openFaq === i ? '–' : '+'}</span>
                  </button>
                  {openFaq === i && <p className="lp-faq-a">{f.a}</p>}
                </div>
              ))}
            </section>
          )}

          {/* Reels and Blog: side by side on desktop, one tab at a time on phones */}
          {(reels.length > 0 || posts.length > 0) && (
            <section className="lp-card">
              <div className="lp-media-tabs">
                {reels.length > 0 && (
                  <button type="button" className={`lp-media-tab ${media === 'reels' ? 'is-on' : ''}`} onClick={() => setMedia('reels')}>Reels</button>
                )}
                {posts.length > 0 && (
                  <button type="button" className={`lp-media-tab ${media === 'blog' ? 'is-on' : ''}`} onClick={() => setMedia('blog')}>Blog</button>
                )}
              </div>

              {reels.length > 0 && (
                <div className={`lp-media-pane ${media === 'reels' ? 'is-on' : ''}`}>
                  <h2 className="lp-h lp-h--desk">Reels</h2>
                  {reelsBlock}
                </div>
              )}
              {posts.length > 0 && (
                <div className={`lp-media-pane ${media === 'blog' ? 'is-on' : ''}`}>
                  <h2 className="lp-h lp-h--desk lp-h--spaced">Blog</h2>
                  {blogBlock}
                </div>
              )}
            </section>
          )}
        </div>

        {/* booking */}
        <aside ref={bookRef} className="lp-card lp-book" id="lp-book">
          <div className="lp-book-head">
            <span className="lp-book-i" aria-hidden><IconCalendar /></span>
            <div>
              <h2 className="lp-book-t">Book a session</h2>
              <p className="lp-book-s">with {name}</p>
            </div>
          </div>

          <p className="lp-step is-done"><StepBadge n={1} done />Session type</p>
          <div className="lp-tabs">
            {(isPsychiatrist ? PSYCHIATRY_TABS : THERAPY_TABS).map(([label, k]) => (
              <button
                key={k} type="button"
                className={`lp-tab ${kind === k ? 'is-on' : ''}`}
                // Session types differ in length, so their free times differ —
                // drop the other type's slots, plan and pick again.
                onClick={() => {
                  if (k === kind) return;
                  setKind(k); setSlotsByDay({}); setPickedTime(null); setPlan(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* The plan step only appears when this therapist has published plans
              for the chosen type; otherwise the booking flow asks for it. */}
          {plans.length > 0 && (
            <>
              <p className={`lp-step ${planDone ? 'is-done' : askingPlan ? 'is-active' : ''}`}><StepBadge n={2} done={planDone} active={askingPlan} />Choose a package</p>
              <div className="lp-plans">
                {plans.map((p) => {
                  const sessions = Math.max(1, readType(p).sessions);
                  const each = Math.round(Number(p.price || 0) / sessions);
                  return (
                    <button
                      key={p.id} type="button"
                      className={`lp-plan ${plan?.id === p.id ? 'is-on' : ''} ${recommendedId === p.id ? 'is-best' : ''}`}
                      onClick={() => setPlan(p)}
                    >
                      <span className="lp-plan-l">
                        <span className="lp-plan-n">{sessions > 1 ? `Package of ${sessions} sessions` : 'Single session'}</span>
                        <span className="lp-plan-s">{sessions > 1 ? `${inr(each)} per session` : (p.name || 'One session')}</span>
                      </span>
                      <span className="lp-plan-r">
                        {recommendedId === p.id && <span className="lp-plan-tag">Recommended</span>}
                        <span className="lp-plan-p">{inr(p.price)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className={`lp-step lp-step--nav ${timeDone ? 'is-done' : askingTime ? 'is-active' : ''}`}>
            <span className="lp-step-l"><StepBadge n={plans.length > 0 ? 3 : 2} done={timeDone} active={askingTime} />Pick a day &amp; time</span>
            <span className="lp-daynav">
              <button
                type="button" className="lp-daynav-b" disabled={dayOffset <= 0}
                onClick={() => setDayOffset(Math.max(0, dayOffset - DAY_PAGE))} aria-label="Previous days"
              >
                <IconChev />
              </button>
              <button
                type="button" className="lp-daynav-b" disabled={dayOffset >= 50}
                onClick={() => setDayOffset(Math.min(50, dayOffset + DAY_PAGE))} aria-label="Next days"
              >
                <IconChev dir="right" />
              </button>
            </span>
          </div>

          <div className="lp-days">
            {days.map((d) => {
              const key = isoDate(d);
              const free = (slotsByDay[key] || []).length;
              return (
                <button
                  key={key} type="button" disabled={free === 0}
                  className={`lp-day ${pickedDay === key ? 'is-on' : ''}`}
                  onClick={() => { setPickedDay(key); setPickedTime(null); }}
                >
                  <span className="lp-day-dow">{DOW[d.getDay()]}</span>
                  <span className="lp-day-n">{d.getDate()}</span>
                  <span className="lp-day-m">{MON[d.getMonth()]}</span>
                </button>
              );
            })}
          </div>

          {/* The wrapper is always here and animates grid-template-rows 0fr -> 1fr,
              which eases to the real content height — a max-height guess races
              past the true height and reads as a jerk. It also stays mounted, so
              choosing another day glides from one set of times to the next
              instead of collapsing and reopening. */}
          <div ref={timesWrapRef} className="lp-times-wrap">
            <div ref={timesInnerRef} className="lp-times-grid">
                {pickedDay && (
                  <>
              {times.map((s, i) => (
                <button
                  key={s.startsAt} type="button"
                  className={`lp-time ${pickedTime?.startsAt === s.startsAt ? 'is-on' : ''}`}
                  style={{ animationDelay: `${Math.min(i, 11) * 22}ms` }}
                  onClick={() => setPickedTime(s)}
                >
                  {s.label}
                </button>
              ))}
                    {times.length === 0 && <p className="lp-note">No free times that day.</p>}
                    <p className="lp-note">Times in your time zone · {zoneLabel(clientTimeZone())}</p>
                </>
              )}
            </div>
          </div>

          <p className={`lp-step lp-step--last ${canBook ? 'is-active' : ''}`}>
            <StepBadge n={plans.length > 0 ? 4 : 3} active={canBook} />Confirm &amp; book
          </p>
          <p className="lp-summary">
            <IconCalendar />
            {timeDone
              ? `${DOW[fromYmd(pickedDay).getDay()]} ${MON[fromYmd(pickedDay).getMonth()]} ${fromYmd(pickedDay).getDate()} · ${pickedTime.label}`
              : 'Select a day and time'}
          </p>

          {/* Type, plan, day and time travel in the URL; the flow still runs
              verification, the slot lock and payment. The date and time handed
              over are IST — what gets booked and stored. */}
          <Link
            href={`${bookHref || `/book/${slug}`}${bookQuery}`}
            className={`lp-btn lp-btn--wide lp-cta ${canBook ? '' : 'is-off'}`}
            aria-disabled={!canBook}
            onClick={(e) => { if (!canBook) e.preventDefault(); }}
          >
            Book now<IconArrow />
          </Link>
        </aside>
      </div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');

.lp{
  /* Straight off the artboard: white ground, one forest green, a sage chip and
     a gold accent. Poppins carries the headings, Inter everything else. */
  --bg:#FFFFFF; --surface:#FFFFFF; --primary:#1B6930; --primary-dark:#1B6930;
  --primary-soft:#F1FBF3; --sage:#B9E8C4; --apricot:#D8B23A;
  --ink:#1C1C1E; --ink-soft:#6C6C70; --line:#E5E5EA; --muted:#8B9186;
  background:var(--bg);color:var(--ink);
  font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased;min-height:100vh;
}
.lp *{box-sizing:border-box;}
/* The booking panel is position:sticky, and globals.css puts overflow-x:hidden
   on <body>, which quietly makes the body a scroll container — a sticky child
   then sticks to a scrollport that never scrolls, so it slides away with the
   page. clip prevents horizontal scrolling exactly the same way without
   creating that container. Scoped here, and only while this page is mounted,
   because globals.css is not to be edited. */
body:has(.lp){overflow-x:clip!important;}
/* globals.css sets a site-wide font on p/h with !important, which would pull
   this page off the artboard's Inter. Restated here so the page keeps its own
   type; the Poppins rules below carry more weight and still win. */
.lp p,.lp span,.lp div,.lp button,.lp a,.lp li{font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif!important;}

.lp-eyebrow-bar{max-width:1180px;margin:0 auto;padding:clamp(18px,2.6vw,28px) clamp(16px,3.4vw,40px) 0;display:flex;align-items:center;gap:14px;}
.lp-back{
  width:38px;height:38px;border-radius:50%;background:var(--surface);border:1px solid var(--line);
  display:flex;align-items:center;justify-content:center;color:var(--primary);flex:none;text-decoration:none;
}
.lp-eyebrow{
  font-size:12px!important;letter-spacing:.12em!important;font-weight:700!important;
  color:var(--primary)!important;text-transform:uppercase;
}

/* Sizes are fluid rather than stepped: the gutter, the gap between columns and
   the padding inside every card all scale with the window, so the page grows
   and shrinks continuously instead of jumping at a breakpoint. --pad is the
   card padding, reused by anything that has to line up with a card's edge. */
.lp-layout{
  max-width:1180px;margin:0 auto;
  padding:clamp(16px,2.2vw,24px) clamp(16px,3.4vw,40px) clamp(48px,6vw,80px);
  display:grid;grid-template-columns:1.6fr 1fr;gap:clamp(16px,2.4vw,28px);align-items:start;
}
.lp-left{display:flex;flex-direction:column;gap:clamp(14px,1.8vw,20px);min-width:0;}
.lp-card{
  --pad:clamp(18px,2.4vw,28px);
  background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:var(--pad);
  box-shadow:0 2px 14px -8px rgba(36,138,61,.08);
}

.lp-top{display:flex;gap:20px;align-items:center;justify-content:space-between;margin-bottom:4px;}
.lp-top-text{min-width:0;}
.lp-avatar{
  width:clamp(76px,9.5vw,104px);height:clamp(76px,9.5vw,104px);border-radius:clamp(16px,2vw,22px);object-fit:cover;border:1px solid var(--line);
  flex:none;background:var(--primary-soft);display:block;
}
.lp-name{
  font-family:'Poppins',system-ui,sans-serif!important;font-weight:600!important;font-size:clamp(20px,2.4vw,26px)!important;
  color:var(--ink)!important;margin:0 0 4px;letter-spacing:-.01em!important;line-height:1.25em!important;
}
.lp-role{
  font-size:11px!important;letter-spacing:.1em!important;font-weight:700!important;
  color:var(--ink-soft)!important;text-transform:uppercase;margin:0;
}
.lp-actions{display:flex;gap:10px;margin:20px 0 4px;}
.lp-btn{
  display:inline-flex;align-items:center;justify-content:center;
  background:var(--primary);color:#fff!important;border:0;border-radius:10px;padding:11px 22px;
  font-family:'Inter',sans-serif!important;font-size:14px!important;font-weight:600!important;
  letter-spacing:0!important;text-decoration:none;cursor:pointer;transition:background .15s ease;
}
.lp-btn:hover{background:#155424;}
.lp-btn--wide{width:100%;margin-top:16px;padding:13px 22px;}
.lp-share{
  background:var(--surface);border:1px solid var(--line);color:var(--ink)!important;border-radius:10px;
  padding:11px 18px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;
  font-family:inherit!important;font-size:14px!important;font-weight:600!important;letter-spacing:0!important;
}

.lp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.lp-stat{
  background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:18px 12px;text-align:center;
  box-shadow:0 2px 14px -8px rgba(36,138,61,.08);
}
.lp-stat-n{
  font-family:'Inter',sans-serif!important;font-variant-numeric:tabular-nums;
  font-weight:600!important;font-size:20px!important;color:var(--primary)!important;margin:0;letter-spacing:0!important;
  /* Every value sits in a row of the same height, so the labels beneath line up
     across all four boxes even where the value is words rather than a number. */
  min-height:30px;display:flex;align-items:center;justify-content:center;
}
.lp-stat-text{font-size:13px!important;font-weight:700!important;line-height:1.35em!important;}
.lp-stat-l{
  font-size:10.5px!important;letter-spacing:.08em!important;text-transform:uppercase;
  color:var(--muted)!important;font-weight:600!important;margin:4px 0 0;
}

.lp-h{
  font-family:'Poppins',system-ui,sans-serif!important;font-weight:600!important;font-size:17px!important;
  margin:0 0 12px;color:var(--ink)!important;letter-spacing:0!important;
}
.lp-h--spaced{margin-top:26px;}

/* concerns — a plain list that scrolls past six, as the artboard has it */
.lp-concerns{border-radius:16px;max-height:210px;overflow-y:auto;}
.lp-concerns::-webkit-scrollbar{width:5px;}
.lp-concerns::-webkit-scrollbar-track{background:transparent;}
.lp-concerns::-webkit-scrollbar-thumb{background:var(--line);border-radius:10px;}
.lp-concerns::-webkit-scrollbar-thumb:hover{background:var(--ink-soft);}
.lp-concern{
  display:flex;align-items:flex-start;gap:10px;padding:6px 0;
  font-size:14.5px!important;line-height:1.5em!important;color:var(--ink-soft)!important;letter-spacing:0!important;
}
.lp-concern:first-child{padding-top:0;}
.lp-concern:last-child{padding-bottom:0;}
.lp-concern-tick{flex:none;margin-top:3px;color:var(--primary);}

.lp-about p{
  font-size:14.5px!important;line-height:1.65em!important;color:var(--ink-soft)!important;
  margin:0 0 12px;letter-spacing:0!important;
}
.lp-about p:last-child{margin-bottom:0;}
/* A line like "How I work with your child" is a heading inside the bio. The
   selector carries the element too, so it outranks the paragraph rule above. */
.lp-about p.lp-about-sub{
  /* Medium, not bold: it should part the text, not shout over it. */
  font-family:'Poppins',system-ui,sans-serif!important;font-weight:500!important;font-size:15.5px!important;
  color:var(--ink)!important;margin:20px 0 6px!important;line-height:1.4em!important;
}
.lp-about p.lp-about-sub:first-child{margin-top:0!important;}
.lp-about{max-height:215px;overflow:hidden;transition:max-height .3s ease;}
.lp-about.is-open{max-height:2000px;}
/* The clamped text softens away at the foot rather than stopping on a cut line,
   so it reads as "there is more" right above Read more. Only when it actually
   overflows — a short bio is never faded. */
.lp-about.is-clipped{
  -webkit-mask-image:linear-gradient(to bottom,#000 55%,rgba(0,0,0,.35) 85%,transparent 100%);
  mask-image:linear-gradient(to bottom,#000 55%,rgba(0,0,0,.35) 85%,transparent 100%);
}
.lp-about-toggle{
  margin-top:12px;background:none;border:0;cursor:pointer;padding:0;display:flex;align-items:center;gap:5px;
  color:var(--primary)!important;font-family:inherit!important;font-size:13px!important;font-weight:700!important;letter-spacing:0!important;
}
.lp-about-toggle svg{transition:transform .2s ease;flex:none;}
.lp-about-toggle svg.is-up{transform:rotate(180deg);}

.lp-chip-group{margin-bottom:18px;}
.lp-chip-group:last-child{margin-bottom:0;}
.lp-chip-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 10px;}
.lp-chip-h{
  font-size:11px!important;letter-spacing:.1em!important;font-weight:700!important;color:var(--muted)!important;
  text-transform:uppercase;
}
.lp-chip-plus{
  width:22px;height:22px;border-radius:50%;border:1px solid var(--line);background:var(--surface);
  color:var(--primary)!important;cursor:pointer;padding:0;line-height:1;
  font-family:inherit!important;font-size:15px!important;font-weight:700!important;letter-spacing:0!important;
  display:flex;align-items:center;justify-content:center;flex:none;transition:transform .2s ease,background .15s ease;
}
.lp-chip-plus:hover{background:var(--primary-soft);}
.lp-chip-plus.is-open{transform:rotate(45deg);}
.lp-chips{display:flex;flex-wrap:wrap;gap:8px;}
.lp-chip{
  background:var(--primary-soft);color:var(--primary-dark)!important;border-radius:999px;padding:7px 14px;
  font-size:13px!important;font-weight:600!important;letter-spacing:0!important;
}
.lp-chip.sage{background:#F1FBF3;color:#1B6930!important;}
.lp-chip.apricot{background:#FBF3E1;color:#8A6D00!important;}

.lp-faq{border-bottom:1px solid var(--line);padding:16px 0;}
.lp-faq:first-of-type{padding-top:4px;}
.lp-faq:last-of-type{border-bottom:0;padding-bottom:0;}
.lp-faq-q{
  width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;text-align:left;
  background:none;border:0;cursor:pointer;padding:0;color:var(--ink)!important;
  font-family:inherit!important;font-weight:600!important;font-size:14.5px!important;letter-spacing:0!important;
}
.lp-faq-a{font-size:14px!important;color:var(--ink-soft)!important;line-height:1.6em!important;margin:10px 0 0;letter-spacing:0!important;}

/* media tabs: phones switch, desktop shows both */
.lp-media-tabs{display:none;}
.lp-media-pane.is-on,.lp-media-pane{display:block;}

/* booking widget — the artboard's mint panel */
.lp-book{
  /* White on desktop, as the artboard has it — the colour is carried by the
     3px green top edge and a soft green ring, not by a fill. (The mint fill it
     shows on narrow screens comes back in the media query below.) */
  background:var(--surface);border:1px solid var(--primary-soft);
  border-top:3px solid var(--primary);
  box-shadow:0 0 0 1px var(--primary-soft), 0 24px 60px -20px rgba(36,138,61,.28);
  scroll-margin-top:90px;
  /* Full height, nothing scrolling inside it. The panel travels with the page:
     when it is taller than the screen the sticky offset goes negative, so it
     keeps moving up until its foot reaches the foot of the screen and only
     then parks — scroll back and it rides down again. --lp-book-h is its own
     measured height, set by the component; until that arrives the min() picks
     87px and it behaves like any short sticky panel. */
  position:sticky;
  top:min(87px, calc(100vh - var(--lp-book-h, 0px) - 24px));
}
.lp-book-head{display:flex;gap:12px;align-items:center;}
.lp-book-i{
  width:38px;height:38px;border-radius:12px;background:var(--primary-soft);color:var(--primary);
  display:flex;align-items:center;justify-content:center;flex:none;
}
.lp-book-t{
  font-family:'Poppins',system-ui,sans-serif!important;font-weight:600!important;font-size:18px!important;
  margin:0;color:var(--ink)!important;letter-spacing:0!important;
}
.lp-book-s{font-size:13px!important;color:var(--ink-soft)!important;margin:2px 0 0;letter-spacing:0!important;}
.lp-step{
  display:flex;align-items:center;gap:6px;
  font-size:11px!important;letter-spacing:.1em!important;font-weight:700!important;color:var(--muted)!important;
  text-transform:uppercase;margin:24px 0 12px;
}
.lp-step--last{margin-bottom:0;}
.lp-step-l{display:flex;align-items:center;gap:6px;}
.lp-badge{
  width:21px;height:21px;border-radius:50%;flex:none;
  background:var(--surface);border:1.5px solid var(--line);color:#ADB8A6!important;
  display:flex;align-items:center;justify-content:center;
  font-family:'Inter',sans-serif!important;font-variant-numeric:tabular-nums;
  font-size:11px!important;font-weight:700!important;letter-spacing:0!important;
  transition:background .2s ease,border-color .2s ease,color .2s ease;
}
.lp-badge{position:relative;}
/* Number and tick sit on top of one another and trade places, so answering a
   step reads as one movement rather than a swap. */
.lp-badge-n,.lp-badge-tick{
  position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  transition:opacity .18s ease, transform .28s cubic-bezier(.2,.9,.3,1.3);
}
/* The tick is an svg, so it needs its own width and height: with only inset:0
   the fixed svg size wins over right/bottom and it lands in the corner. Filling
   the pill and letting the viewBox centre the stroke puts it dead centre, and
   the padding sets how big the mark sits inside the circle. */
.lp-badge-tick{
  width:100%;height:100%;padding:4.5px;opacity:0;transform:scale(.3) rotate(-15deg);
}
.lp-badge.is-done .lp-badge-n{opacity:0;transform:scale(.3);}
.lp-badge.is-done .lp-badge-tick{opacity:1;transform:none;}
.lp-badge.is-done{
  background:var(--sage);border-color:var(--sage);color:#1B6930!important;
  animation:lp-step-pop .3s ease;
}
/* The step being answered: filled, with a ring breathing out of it. */
.lp-badge.is-active{
  background:var(--primary-dark);border-color:var(--primary-dark);color:#fff!important;
  animation:lp-step-pulse 1.7s ease-out infinite;
}
@keyframes lp-step-pop{0%{transform:scale(.55);}65%{transform:scale(1.18);}100%{transform:scale(1);}}
@keyframes lp-step-pulse{
  0%{box-shadow:0 0 0 0 rgba(36,138,61,.32);}
  70%{box-shadow:0 0 0 6px rgba(36,138,61,0);}
  100%{box-shadow:0 0 0 0 rgba(36,138,61,0);}
}
/* The label darkens alongside its badge. */
.lp-step.is-active,.lp-step.is-done{color:var(--primary-dark)!important;}
@media (prefers-reduced-motion:reduce){
  .lp-badge,.lp-badge.is-done,.lp-badge.is-active{animation:none!important;}
  .lp-badge-n,.lp-badge-tick{transition:none;}
}
.lp-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:4px;}
.lp-tab{
  background:none;border:0;border-radius:9px;padding:9px 0;cursor:pointer;color:var(--ink-soft)!important;
  font-family:inherit!important;font-size:13px!important;font-weight:700!important;letter-spacing:0!important;
  transition:background .15s ease,color .15s ease;
}
.lp-tab:hover{color:var(--primary)!important;}
.lp-tab.is-on{background:var(--primary-dark);color:#fff!important;}

/* plans */
.lp-plans{display:flex;flex-direction:column;gap:10px;}
.lp-plan{
  display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;
  background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 16px;cursor:pointer;
  transition:background .15s ease,color .15s ease,border-color .15s ease;
}
.lp-plan:hover{border-color:var(--primary);}
.lp-plan.is-on{background:var(--primary-dark);border-color:var(--primary-dark);}
.lp-plan-l{display:flex;flex-direction:column;gap:3px;min-width:0;}
.lp-plan-n{font-size:14.5px!important;font-weight:700!important;color:var(--ink)!important;letter-spacing:0!important;}
.lp-plan-s{font-size:12.5px!important;color:var(--muted)!important;font-weight:500!important;letter-spacing:0!important;}
.lp-plan-r{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex:none;}
.lp-plan-p{
  font-family:'Inter',sans-serif!important;font-variant-numeric:tabular-nums;
  font-size:14.5px!important;font-weight:700!important;color:var(--ink)!important;letter-spacing:0!important;
}
.lp-plan.is-on .lp-plan-n,.lp-plan.is-on .lp-plan-p{color:#fff!important;}
.lp-plan.is-on .lp-plan-s{color:#C6D9C1!important;}
.lp-plan-tag{
  background:var(--sage);color:#1B6930!important;border-radius:5px;padding:2.5px 6px;
  font-size:8.5px!important;font-weight:700!important;letter-spacing:.04em!important;text-transform:uppercase;
}
.lp-plan.is-on .lp-plan-tag{background:rgba(255,255,255,.18);color:#fff!important;}

.lp-step--nav{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.lp-daynav{display:flex;gap:6px;}
.lp-daynav-b{
  width:24px;height:24px;border-radius:50%;border:1px solid var(--line);background:var(--surface);
  color:var(--primary);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;
}
.lp-daynav-b:disabled{opacity:.35;cursor:default;}

.lp-days{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;}
.lp-day{
  padding:10px 0 9px;border-radius:14px;border:1px solid var(--line);background:var(--surface);
  text-align:center;cursor:pointer;display:block;transition:background .15s ease,border-color .15s ease;
}
.lp-day:hover:not(:disabled):not(.is-on){background:var(--primary-soft);}
.lp-day:disabled{opacity:.4;cursor:default;}
.lp-day.is-on{background:var(--primary-dark);border-color:var(--primary-dark);}
.lp-day.is-on .lp-day-dow,.lp-day.is-on .lp-day-n,.lp-day.is-on .lp-day-m{color:#fff!important;}
.lp-day-dow{display:block;font-size:10px!important;font-weight:700!important;letter-spacing:.05em!important;color:var(--muted)!important;text-transform:uppercase;}
.lp .lp-day-n{display:block;font-family:'Poppins',sans-serif!important;font-weight:600!important;font-size:15px!important;margin-top:3px;color:var(--ink)!important;}
.lp-day-m{display:block;font-size:10px!important;color:var(--muted)!important;margin-top:1px;letter-spacing:0!important;}

/* Times unfold downward when a day is picked, instead of appearing all at once.
   The row grows (max-height and its own top margin animate from nothing) and the
   pills arrive just behind it, each a beat after the last. */
/* Height is set from the measured content (see the effect in the component), so
   the row eases open, eases shut, and eases between a day with three rows of
   slots and a day with one. */
.lp-times-wrap{
  height:0;overflow:hidden;
  transition:height .34s cubic-bezier(.22,.8,.28,1);
}
.lp-times-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding-top:20px;}
.lp-time{animation:lp-time-in .26s ease-out backwards;}
@keyframes lp-time-in{
  from{opacity:0;transform:translateY(-6px) scale(.96);}
  to{opacity:1;transform:none;}
}
@media (prefers-reduced-motion:reduce){
  .lp-times,.lp-time{animation:none!important;}
  .lp-times-wrap{transition:none;}
}
.lp-time{
  border:1px solid var(--line);border-radius:12px;padding:11px 0;text-align:center;cursor:pointer;
  background:var(--surface);color:var(--ink)!important;
  font-family:inherit!important;font-size:13.5px!important;font-weight:600!important;letter-spacing:0!important;
  transition:background .15s ease,border-color .15s ease,color .15s ease;
}
.lp-time:hover:not(.is-on){background:var(--primary-soft);}
.lp-time.is-on{background:var(--primary-dark);border-color:var(--primary-dark);color:#fff!important;}

.lp-summary{
  display:flex;align-items:center;gap:9px;background:var(--primary-soft);border-radius:12px;
  padding:13px 14px;margin:12px 0 0;
  font-size:13px!important;color:var(--primary-dark)!important;font-weight:600!important;letter-spacing:0!important;
}
.lp-summary svg{flex:none;color:var(--primary);}
.lp-cta{gap:8px;padding:15px;border-radius:12px;font-size:15px!important;margin-top:14px;}
.lp-cta.is-off{background:#AEBBA8;cursor:default;}

/* A swipeable row, as the artboard has it: cards keep their own width and snap
   as you scroll, so a therapist with two reels or ten looks right either way. */
.lp-reels{
  display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;
  -webkit-overflow-scrolling:touch;
  /* No scrollbar at any width — the cards running off the edge are the cue that
     the row swipes, and the fade below makes that read. */
  scrollbar-width:none;-ms-overflow-style:none;
  /* Both edges dissolve, so a card leaves the row softly instead of being
     sliced off against the card border. */
  -webkit-mask-image:linear-gradient(to right,transparent 0,#000 26px,#000 calc(100% - 26px),transparent 100%);
  mask-image:linear-gradient(to right,transparent 0,#000 26px,#000 calc(100% - 26px),transparent 100%);
  /* Run the row to the card's own edges so a card leaves the view at the edge
     instead of being cut short against the padding. The padding is given back
     inside, and scroll-padding keeps the first card in line with the heading. */
  margin-left:calc(var(--pad) * -1);margin-right:calc(var(--pad) * -1);
  padding-left:var(--pad);padding-right:var(--pad);scroll-padding-left:var(--pad);
}
.lp-reels::-webkit-scrollbar{display:none;}
.lp-reel{
  position:relative;border-radius:16px;overflow:hidden;aspect-ratio:3/4.3;display:block;
  flex:0 0 auto;width:62%;max-width:230px;scroll-snap-align:start;
  background:linear-gradient(160deg,var(--primary-soft),var(--sage));text-decoration:none;
  box-shadow:0 10px 24px -12px rgba(27,105,48,.35);
  transition:transform .15s ease,box-shadow .15s ease;
}
.lp-reel:hover{transform:translateY(-2px);box-shadow:0 14px 28px -12px rgba(27,105,48,.45);}
.lp-reel-play{
  position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:38px;height:38px;border-radius:50%;
  background:rgba(28,28,30,.45);border:1.5px solid rgba(255,255,255,.7);
  display:flex;align-items:center;justify-content:center;
}
.lp-reel-bottom{
  position:absolute;left:0;right:0;bottom:0;padding:24px 10px 10px;color:#fff;
  background:linear-gradient(to top, rgba(28,28,30,.85), rgba(28,28,30,0));
  font-size:11px!important;font-weight:700!important;letter-spacing:0!important;
}

.lp-blogs{display:flex;flex-direction:column;gap:16px;}
.lp-blog{display:flex;gap:14px;text-decoration:none;color:inherit;}
.lp-blog-thumb{
  width:80px;height:80px;border-radius:14px;object-fit:cover;flex:none;
  background:var(--primary-soft);display:block;
}
.lp .lp-blog-t{
  display:block;font-family:'Poppins',sans-serif!important;font-weight:600!important;font-size:14.5px!important;
  color:var(--ink)!important;margin:0 0 4px;line-height:1.35em!important;letter-spacing:0!important;
}
.lp-blog-x{
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  font-size:13px!important;color:var(--ink-soft)!important;line-height:1.5em!important;margin:0 0 7px;letter-spacing:0!important;
}
.lp-blog-m{display:block;font-size:11.5px!important;color:var(--muted)!important;font-weight:600!important;letter-spacing:0!important;}

.lp-note{font-size:13.5px!important;color:var(--muted)!important;letter-spacing:0!important;grid-column:1 / -1;}

/* ── Tablet and below ───────────────────────────────────────────────────────
   The two columns stop fitting side by side, so the booking panel moves under
   the profile. Everything else keeps its desktop treatment here: a tablet has
   the room for four stats across, three reels and both media sections. */
@media (max-width:900px){
  .lp-layout{grid-template-columns:1fr;}
  .lp-book{position:static;max-height:none;overflow:visible;}
  .lp-reel{width:46%;max-width:230px;}
  /* Paging arrows become finger-sized once there is no mouse. */
  .lp-daynav-b{width:34px;height:34px;}
}

/* ── Phones ─────────────────────────────────────────────────────────────────
   Here the artboard changes the panel itself: mint fill, white icon tile and a
   white summary line, with Reels and Blog behind a segmented control. */
@media (max-width:640px){
  .lp-book{
    background:#EEF8F1;border-color:#D3EADA;
    box-shadow:0 0 0 1px #D3EADA, 0 24px 60px -20px rgba(36,138,61,.28);
  }
  .lp-book-i{background:var(--surface);}
  .lp-summary{background:var(--surface);border:1px solid #D3EADA;}
  .lp-stats{grid-template-columns:repeat(2,1fr);}
  .lp-role{font-size:10px!important;}
  .lp-stat-n{font-size:17px!important;}
  .lp-stat-l{font-size:9.5px!important;}
  .lp-h{font-size:15.5px!important;}
  .lp-about p{font-size:14px!important;}

  /* one media section at a time, chosen by the tabs */
  .lp-media-tabs{
    display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:18px;
    background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:4px;
  }
  .lp-media-tab{
    background:none;border:0;border-radius:9px;padding:11px 0;cursor:pointer;color:var(--ink-soft)!important;
    font-family:inherit!important;font-size:13px!important;font-weight:700!important;letter-spacing:0!important;
  }
  .lp-media-tab.is-on{background:var(--primary-dark);color:#fff!important;}
  .lp-media-pane{display:none;}
  .lp-media-pane.is-on{display:block;}
  .lp-h--desk{display:none;}
  /* swiped, so the scrollbar goes and the swipe stops at the ends rather than
     dragging the page sideways with it */
  .lp-reels{gap:10px;overscroll-behavior-x:contain;}
  .lp-reel{width:72%;max-width:210px;}
  .lp-tab,.lp-media-tab{min-height:44px;}
}

/* ── Small phones ───────────────────────────────────────────────────────────
   Below this the role line was wrapping to three lines beside the portrait, and
   five day pills left no room for the month. Name and portrait sit one above
   the other, and the week shows four days at a time. */
@media (max-width:400px){
  .lp-top{flex-direction:column-reverse;align-items:flex-start;gap:14px;}
  .lp-actions .lp-btn,.lp-actions .lp-share{flex:1 1 auto;justify-content:center;}
  .lp-days{grid-template-columns:repeat(4,1fr);}
  .lp-times-grid{grid-template-columns:repeat(2,1fr);}
  .lp-concerns{max-height:none;}
}
`;
