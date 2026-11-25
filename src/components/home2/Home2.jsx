'use client';

/**
 * Home — Koott 2.0.
 *
 * Built to the Figma file "Koott 2.0" (EzLwBjoYNqTa9RMEmOfyQO), section Home (WIP),
 * screen "Home mobile · DS2 test" (7858:79928). The phone design is 402 px wide and
 * every size, space, weight and colour below is taken from it; the laptop layout is the
 * same page widened (see home2.css.js).
 *
 * Six blocks, top to bottom:
 *   hero          green gradient, menu / logo / Log in, search, landscape, privacy strip
 *   tabs          All Conditions · Clinical Psychology · Sexual Wellness · Psychiatry
 *   therapists    a card per therapist, newest free time first
 *   how it works  three steps
 *   FAQ           four questions
 *   CTA           "Take the first step today" (the site footer follows)
 *
 * What it asks the server for: the therapist list (/public/psychologists) and the card
 * order with each one's next free start and how many starts are left that day
 * (/public/psychologists/order). Search and the tabs filter that list in the browser.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { publicApi } from '@/lib/backendApi';
import { fetchTherapistOrder, applyTherapistOrder } from '@/lib/therapistOrder';
import { therapistSlug } from '@/components/TherapistProfile';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import TherapistCard2 from './TherapistCard2';
import Menu2 from './Menu2';
import { HOME2_CSS } from './home2.css';

const ART = '/design/home2';

/* The four tabs, and how each one picks therapists out of the list.
   role  → matched against the therapist's title ("Clinical Psychologist")
   need  → matched against what they help with (area_of_expertise) */
const TABS = [
  // `w` is the tab's width in Figma, so each label breaks onto the same two lines.
  { key: 'all', label: 'All Conditions', icon: '/design/home/tab-consultant.png', w: 91 },
  { key: 'clinical', label: 'Clinical Psychology', icon: '/design/home/tab-clinical.png', w: 94, kind: 'role', match: ['clinical'] },
  { key: 'sexual', label: 'Sexual Wellness', icon: '/design/home/tab-sexual.png', w: 78, kind: 'need', match: ['sex', 'intimacy', 'vaginismus', 'erectile', 'ejaculation', 'libido'] },
  { key: 'psychiatry', label: 'Psychiatry Department', icon: '/design/home/tab-psychiatrist.png', w: 97, kind: 'role', match: ['psychiatr'] },
];

const FAQS = [
  {
    q: 'How much does a session cost?',
    a: 'Each therapist sets their own price. You see it before you pay. Packs of 3 cost less per session.',
  },
  {
    q: 'Can I reschedule or cancel?',
    a: 'Yes. Move or cancel a session from your account. Cancel 48 hours or more before it starts and the money comes back to you automatically; closer to the time our care team settles it with you.',
  },
  {
    q: 'Will anyone else know?',
    a: 'No. What you say stays between you and your therapist. Nobody else at Koott reads your session notes, and we never tell anyone you booked.',
  },
  {
    q: 'What if my therapist isn’t the right fit?',
    a: 'Tell us and we will move you to someone else. You can switch therapist from your account up to 24 hours before a session, and the sessions left in your pack come with you.',
  },
];

const STEPS = [
  { n: 'STEP 1', title: 'Choose a therapist', body: 'Filter by concern, language and price.', visual: 'faces' },
  { n: 'STEP 2', title: 'Pick a time', body: 'Book a slot that suits you, in your time zone.', visual: 'days' },
  { n: 'STEP 3', title: 'Start talking', body: 'Video, audio or chat. Your therapist checks in between sessions.', visual: 'video' },
];

/** Mon 16 · Tue 17 (picked) · Wed 18 · Thu 19 — the next four days, as step 2 draws them. */
function nextDays() {
  const out = [];
  for (let i = 0; i < 4; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    out.push({ day: d.toLocaleDateString('en-GB', { weekday: 'short' }), date: d.getDate() });
  }
  return out;
}

const titleCase = (s) => String(s || '')
  .replace(/[-_]+/g, ' ')
  .replace(/\b\w/g, (c) => c.toUpperCase())
  .replace(/\bAdhd\b/i, 'ADHD')
  .replace(/\bOcd\b/i, 'OCD');

export default function Home2() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [rows, setRows] = useState([]);
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading');
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(0);
  const [slide, setSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const tabsRef = useRef(null);
  const [tabsScrolled, setTabsScrolled] = useState(false);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const [res, ord] = await Promise.all([publicApi.getPsychologists(), fetchTherapistOrder('default')]);
        if (off) return;
        const list = res?.data?.psychologists || res?.psychologists || (Array.isArray(res?.data) ? res.data : []) || [];
        setRows(applyTherapistOrder(list, ord));
        setOrder(ord);
        setStatus('ready');
      } catch (_) {
        if (!off) setStatus('error');
      }
    })();
    return () => { off = true; };
  }, []);

  /* The hero's landscape is one of three slides in the design; the dots follow it. */
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % 3), 6000);
    return () => clearInterval(id);
  }, []);

  const cards = useMemo(() => rows.map((p) => {
    const tags = Array.isArray(p.area_of_expertise) ? p.area_of_expertise : [];
    return {
      id: p.id,
      slug: therapistSlug(p),
      name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      role: p.designation || p.specialist_category || '',
      photo: p.cover_image_url || p.profile_picture_url || null,
      voice: p.voice_intro_url || null,
      years: Number(p.experience_years) || 0,
      price: Number(p.individual_session_price || p.price) || 0,
      languages: Array.isArray(p.languages) && p.languages.length ? p.languages : ['Malayalam', 'English'],
      tags: tags.map(titleCase),
      rawTags: tags.map((x) => String(x).toLowerCase()),
    };
  }), [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const picked = TABS.find((x) => x.key === tab);
    return cards.filter((c) => {
      if (picked?.kind === 'role' && !picked.match.some((m) => c.role.toLowerCase().includes(m))) return false;
      if (picked?.kind === 'need' && !picked.match.some((m) => c.rawTags.some((x) => x.includes(m)))) return false;
      if (!q) return true;
      // Search covers the name and what they help with ("anxiety", "sleep"…).
      return c.name.toLowerCase().includes(q)
        || c.role.toLowerCase().includes(q)
        || c.rawTags.some((x) => x.replace(/-/g, ' ').includes(q));
    });
  }, [cards, tab, query]);

  const onTabScroll = useCallback(() => {
    const el = tabsRef.current;
    if (el) setTabsScrolled(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }, []);
  const scrollTabs = () => {
    const el = tabsRef.current;
    if (el) el.scrollBy({ left: tabsScrolled ? -200 : 200, behavior: 'smooth' });
  };

  const days = useMemo(nextDays, []);
  const bookHref = (c) => (c.slug ? `/book/${c.slug}` : `/therapist-profile?doctor=${encodeURIComponent(c.id)}`);
  const profileHref = (c) => (c.slug ? `/service-page/${c.slug}` : `/therapist-profile?doctor=${encodeURIComponent(c.id)}`);

  // This page hides the site header, so the menu and the Log In popup live here.
  const logIn = () => {
    if (isAuthenticated?.() && user?.role === 'client') router.push('/profile/sessions');
    else setAuthOpen(true);
  };

  return (
    <div className="h2">
      <style dangerouslySetInnerHTML={{ __html: HOME2_CSS }} />

      {/* ───────────────── hero ───────────────── */}
      <header className="h2-hero">
        <div className="h2-hero-glow" aria-hidden="true" />
        <div className="h2-topbar">
          <button type="button" className="h2-burger" onClick={() => setMenuOpen(true)} aria-label="Menu">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h12M3 18h18" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <Link href="/" className="h2-logo" aria-label="Koott home">
            <img src="/design/home/logo-white.svg" alt="Koott" width={74} height={23} />
          </Link>
          {/* The Figma is phone-only, so the laptop header is built from the same menu
              links: on a wide screen they read better across the bar than behind a
              hamburger, which stays for phones and tablets. */}
          <nav className="h2-nav" aria-label="Main">
            <a href="#therapists">Find a therapist</a>
            <a href="#how">How it works</a>
            <Link href="/blog">Blog</Link>
            <Link href="/about-us">About Koott</Link>
          </nav>
          <button type="button" className="h2-login" onClick={logIn}>
            {isAuthenticated?.() && user?.role === 'client' ? 'My sessions' : 'Log in'}
          </button>
        </div>

        <div className="h2-searchbar">
          <label className="h2-search">
            <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="#fff" strokeWidth="2" fill="none" /><path d="m11 11 3 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
            <input
              type="search"
              className="ph-no-capture"
              value={query}
              placeholder="Search for therapist, concerns"
              aria-label="Search for a therapist or a concern"
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        <div className="h2-stage">
          <img className="h2-stage-img" src={`${ART}/hero-landscape.png`} alt="" width={402} height={270} />
          <img className="h2-stage-word" src={`${ART}/malayalam-wordmark.svg`} alt="കൂടെയുണ്ടാവും കൂട്ടായി" width={202} height={89} />
          <div className="h2-dots" role="presentation">
            {[0, 1, 2].map((i) => <i key={i} className={i === slide ? 'is-on' : ''} />)}
          </div>
          <p className="h2-strip">Only you and your therapist. Always.</p>
        </div>
      </header>

      {/* ───────────────── category tabs ───────────────── */}
      <nav className="h2-tabs" aria-label="Kinds of therapy">
        <div className="h2-tabs-scroll" ref={tabsRef} onScroll={onTabScroll}>
          {TABS.map((x) => (
            <button
              key={x.key}
              type="button"
              className={`h2-tab${tab === x.key ? ' is-on' : ''}`}
              style={{ width: x.w }}
              aria-pressed={tab === x.key}
              onClick={() => setTab(x.key)}
            >
              <img src={x.icon} alt="" width={32} height={32} />
              <span className="h2-tab-label">{x.label}</span>
              <i className="h2-tab-bar" aria-hidden="true" />
            </button>
          ))}
        </div>
        <button type="button" className="h2-tabs-more" onClick={scrollTabs} aria-label="More kinds of therapy">
          <svg viewBox="0 0 16 16" aria-hidden="true" style={{ transform: tabsScrolled ? 'rotate(180deg)' : 'none' }}>
            <path d="m6 3 5 5-5 5" stroke="#0A243F" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </button>
      </nav>

      {/* ───────────────── therapists ───────────────── */}
      <section className="h2-list" id="therapists" aria-label="Therapists">
        {status === 'loading' && <p className="h2-note">Loading therapists…</p>}
        {status === 'error' && <p className="h2-note">We couldn’t load the therapists just now. Please refresh to try again.</p>}
        {status === 'ready' && visible.length === 0 && (
          <p className="h2-note">
            {query ? `No therapist matches “${query.trim()}” here.` : 'No therapist in this group yet.'}
            {' '}
            <button type="button" className="h2-note-link" onClick={() => { setQuery(''); setTab('all'); }}>Show everyone</button>
          </p>
        )}
        {visible.map((c) => (
          <TherapistCard2
            key={c.id}
            t={c}
            nextAt={order?.nextAt?.get(String(c.id)) || null}
            slotsOnDay={order?.slotsOnDay?.get(String(c.id)) ?? null}
            profileHref={profileHref(c)}
            bookHref={bookHref(c)}
          />
        ))}
        {status === 'ready' && visible.length > 0 && (
          <Link className="h2-viewall" href="/book-malayali-psychologists">View all therapists</Link>
        )}
      </section>

      {/* ───────────────── how it works ───────────────── */}
      <section className="h2-how" id="how">
        <div className="h2-how-head">
          <p className="h2-eyebrow">How it works</p>
          <h2 className="h2-h2">Start in about five minutes</h2>
        </div>
        <div className="h2-steps">
          {STEPS.map((s) => (
            <article className="h2-step" key={s.n}>
              <div className={`h2-step-visual is-${s.visual}`}>
                {s.visual === 'faces' && (
                  <div className="h2-faces">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <img key={i} className={`h2-face f${i}`} src={`${ART}/face-${i}.png`} alt="" width={67} height={67} loading="lazy" />
                    ))}
                    <img className="h2-cursor" src={`${ART}/cursor.svg`} alt="" width={37} height={37} loading="lazy" />
                  </div>
                )}
                {s.visual === 'days' && (
                  <div className="h2-days">
                    {days.map((d, i) => (
                      <div className={`h2-day${i === 1 ? ' is-on' : ''}`} key={d.day}>
                        <span className="h2-day-n">{d.day}</span>
                        <span className="h2-day-d">{d.date}</span>
                      </div>
                    ))}
                  </div>
                )}
                {s.visual === 'video' && (
                  <>
                    <img className="h2-step-photo" src={`${ART}/step3-video.png`} alt="" width={258} height={140} loading="lazy" />
                    <span className="h2-step-play" aria-hidden="true">
                      <svg viewBox="0 0 24 24"><path d="M8 5.1v13.8c0 .6.6 1 1.1.7l10.5-6.9c.5-.3.5-1.1 0-1.4L9.1 4.4c-.5-.3-1.1 0-1.1.7Z" fill="#1C241F" /></svg>
                    </span>
                  </>
                )}
              </div>
              <div className="h2-step-text">
                <span className="h2-step-no">{s.n}</span>
                <h3 className="h2-step-title">{s.title}</h3>
                <p className="h2-step-body">{s.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ───────────────── FAQ ───────────────── */}
      <section className="h2-faq">
        <h2 className="h2-h2">Questions before you start</h2>
        <div className="h2-faq-list">
          {FAQS.map((f, i) => (
            <div className={`h2-q${openFaq === i ? ' is-open' : ''}`} key={f.q}>
              <button type="button" className="h2-q-row" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                <span>{f.q}</span>
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 8 5 5 5-5" stroke="#1C241F" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
              </button>
              {openFaq === i && <p className="h2-q-a">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────── next step ───────────────── */}
      <section className="h2-cta-wrap">
        <div className="h2-cta">
          <div className="h2-cta-text">
            <h2 className="h2-cta-title">Take the first step today</h2>
            <p className="h2-cta-body">Talk to a licensed Malayali therapist and start feeling calmer.</p>
          </div>
          <div className="h2-cta-buttons">
            <Link className="h2-cta-btn" href="/book-malayali-psychologists">Book a session</Link>
            <p className="h2-cta-note">From ₹749 per session · Next slot today</p>
          </div>
        </div>
      </section>

      <Menu2 open={menuOpen} onClose={() => setMenuOpen(false)} />
      {authOpen && <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
