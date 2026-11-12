'use client';

/**
 * Therapist listing (/book-malayali-psychologists), built to Figma "Therapists page"
 * (1123:10853 laptop, 1123:13465 phone) with its filter popup (1123:11584 / 1123:13939,
 * the same popup as the home page's, Figma 680:3664): a name search with the language
 * pill, four quick filters, the count, then "Resume your booking" and the therapist
 * cards in the design's card (TherapistCard design mode), three across.
 *
 * Data comes from /api/public/psychologists; the ORDER comes from
 * /api/public/psychologists/order?list=booking — the admin's group pattern
 * (Admin → Therapist Groups → Booking-page order): each card position is
 * reserved for a group and shows that group's soonest-available therapist.
 * Filters keep that order.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { track } from '@/analytics';
import { publicApi } from '@/lib/backendApi';
import { applyTherapistOrder, fetchTherapistOrder } from '@/lib/therapistOrder';
import TherapistCard, { THERAPIST_CARD_CSS, cardFields, designCardCss, introOf } from '@/components/TherapistCard';
import { therapistSlug } from '@/components/TherapistProfile';
import ResumeBookingCard, { RESUME_CARD_CSS, useBookingDraft } from '@/components/ResumeBookingCard';
import { Chevron, FilterPopup, FINDER_CSS, FINDER_VARS, SearchIcon } from '@/components/TherapistFinderParts';
import { THERAPISTS_SECTION } from '@/data/koottHomeContent';
import { whenLabel } from '@/lib/nextAvailable';


/**
 * Map an API psychologist onto the card's shape.
 *
 * Exported because the condition pages show the same cards and must not drift
 * from this listing — two mappings would mean a therapist reading differently
 * depending on which page found them.
 */
export function toCard(p) {
  const years = Number(p.experience_years) || 0;
  return {
    id: p.id,
    // Same slug the profile page matches on, so the two cannot drift.
    slug: therapistSlug(p),
    name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
    role: p.designation || '',
    // Numbers, not sentences: the card sets its own tiles ("7 yrs", "₹1,499").
    years,
    price: Number(p.price) || 0,
    // Real languages once the therapist has them; the old hardcoded pair is
    // kept only as the fallback for a row that predates migration 0020.
    languages: Array.isArray(p.languages) && p.languages.length
      ? p.languages
      : ['Malayalam', 'English'],
    experience: years > 0 ? `${years}+ years of experience` : '',
    priceFrom: p.price ? `Starting from INR${p.price}` : '',
    bio: introOf(p),
    modes: ['audio', 'video'],
    photo: p.cover_image_url || null,
    specialist: p.specialist_category || null,
    concerns: Array.isArray(p.area_of_expertise) ? p.area_of_expertise : [],
  };
}

export default function BookMalayaliPsychologists() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('loading');
  // This browser's unfinished booking (localStorage), shown as the first card.
  const { draft, slotState, suggestion, dismiss: dismissDraft, takeSuggestion, seeOtherTimes } = useBookingDraft();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [res, order] = await Promise.all([
          publicApi.getPsychologists(),
          fetchTherapistOrder('booking'),
        ]);
        /* The backend wraps this as {data:{psychologists:[…]}}; reading res.data
           straight through yields an object and silently breaks .map. */
        const list = res?.data?.psychologists || res?.psychologists
          || (Array.isArray(res?.data) ? res.data : null)
          || (Array.isArray(res) ? res : []);
        if (cancelled) return;
        // The order endpoint already carries each therapist's next free start,
        // so the cards need no slot requests of their own.
        setRows(applyTherapistOrder(list, order).map((p) => ({
          ...p,
          nextAvailable: whenLabel(order?.nextAt?.get(String(p.id))),
        })));
        setStatus('ready');
        track('counsellor_list_view', { count: list.length });
      } catch (err) {
        console.error('[book-malayali-psychologists] load failed:', err);
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* A name search, a language, how they attend, and one quick filter at a time —
     the same filter as the home page. */
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState(THERAPISTS_SECTION.languages[0]);
  const [attend, setAttend] = useState(THERAPISTS_SECTION.filterPopup.attend[0].key);
  const [filterOpen, setFilterOpen] = useState(false);
  const closeFilter = useCallback(() => setFilterOpen(false), []);
  const attendOn = THERAPISTS_SECTION.filterPopup.attend.find((m) => m.key === attend);
  const [quick, setQuick] = useState('');
  const quickOn = THERAPISTS_SECTION.quickFilters.find((f) => f.label === quick);
  const visible = useMemo(() => rows.filter((t) => {
    const q = query.trim().toLowerCase();
    const nm = String(t.name || `${t.first_name || ''} ${t.last_name || ''}`).toLowerCase();
    if (q && !nm.includes(q)) return false;
    const langs = cardFields(t).languages.map((l) => String(l).toLowerCase());
    if (language && !langs.includes(language.toLowerCase())) return false;
    if (!(t.session_modes?.length ? t.session_modes : ['online']).includes(attend)) return false;
    if (quickOn) {
      const role = `${t.designation || ''} ${t.specialization || ''}`;
      const hay = (quickOn.kind === 'need' ? `${role} ${(t.area_of_expertise || []).join(' ')}` : role).toLowerCase();
      if (![].concat(quickOn.match).some((w) => hay.includes(w))) return false;
    }
    return true;
  }), [rows, query, language, attend, quickOn]);
  const linkFor = (t, kind) => {
    const slug = therapistSlug(t);
    if (kind === 'book') return slug ? `/book/${slug}` : `/therapist-profile?doctor=${encodeURIComponent(t.id)}`;
    return slug ? `/service-page/${slug}` : `/therapist-profile?doctor=${encodeURIComponent(t.id)}`;
  };
  const showDraft = draft && rows.some((t) => therapistSlug(t) === draft.slug);

  return (
    <div className="ktf">
      <style dangerouslySetInnerHTML={{ __html: THERAPIST_CARD_CSS + RESUME_CARD_CSS + designCardCss('.ktf') + FINDER_CSS + LISTING_CSS }} />

      <section className="ktf-in">
        <div className="ktf-head">
          <h1 className="ktf-h1">Find your malayali psychologist</h1>
          <p className="ktf-sub">Talk to a licensed therapist who understands your language, culture and experiences.</p>
        </div>

        <div className="kh2-filters ktf-filters">
          <div className="kh2-fsearch">
            <label className="kh2-fsearch-q">
              <SearchIcon />
              <input
                type="search" className="ph-no-capture" value={query} placeholder="Search"
                aria-label="Search therapists by name" onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button type="button" className="kh2-flang" aria-haspopup="dialog" aria-expanded={filterOpen} onClick={() => setFilterOpen(true)}>
              <span className="kh2-flang-v">{language}<small>{attendOn.label}</small></span>
              <Chevron />
            </button>
          </div>
          <div className="kh2-quicks">
            {THERAPISTS_SECTION.quickFilters.map((f) => {
              const on = quick === f.label;
              return (
                <button
                  key={f.label} type="button" className={`kh2-quick${on ? ' is-on' : ''}`} aria-pressed={on}
                  onClick={() => { setQuick(on ? '' : f.label); if (!on) track('filter_applied', { filter: f.kind, value: f.label }); }}
                >
                  <img src={`/design/home/${f.icon}.png`} alt="" width={32} height={32} />
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {status === 'loading' && <p className="ktf-count">Loading therapists…</p>}
        {status === 'error' && <p className="ktf-count">We couldn’t load the therapist list just now. Please refresh to try again.</p>}
        {status === 'ready' && (
          <p className="ktf-count">
            {visible.length
              ? `${visible.length} therapist${visible.length === 1 ? '' : 's'} available`
              : 'No therapist matches that combination yet. Clear a filter to see everyone.'}
          </p>
        )}

        <div className="kh2-tgrid ktf-grid">
          {showDraft && (
            <ResumeBookingCard
              draft={draft} slotState={slotState} suggestion={suggestion}
              onDismiss={dismissDraft} onTakeSuggestion={takeSuggestion} onSeeOtherTimes={seeOtherTimes}
            />
          )}
          {visible.map((t, i) => (
            <TherapistCard
              key={t.id || i}
              design
              t={{ ...cardFields(t), availability: t.nextAvailable }}
              profileHref={linkFor(t, 'profile')}
              bookHref={linkFor(t, 'book')}
            />
          ))}
        </div>
      </section>

      {filterOpen && (
        <FilterPopup
          copy={THERAPISTS_SECTION.filterPopup}
          language={language}
          attend={attend}
          onLanguage={(l) => { setLanguage(l); track('filter_applied', { filter: 'language', value: l }); }}
          onAttend={(m) => { setAttend(m); track('filter_applied', { filter: 'attend', value: m }); }}
          onClose={closeFilter}
        />
      )}
    </div>
  );
}

/* Figma "Therapists page": content 112px under the header (63px, fixed, so 175 from the top), 1180 wide; heading Poppins
   600 32/48, subtitle Inter 16/24 #373737, 40 to the filters, 24 to the count (Inter 500
   16/24 #373737), 24 to the cards (377 × 360, 24 apart), 124 to the footer. Marked
   !important where globals.css forces its own heading and paragraph styles. */
const LISTING_CSS = `
.ktf{${FINDER_VARS}background:#fff;color:var(--ink);min-height:100vh;}
.ktf *{box-sizing:border-box;}
.ktf-in{max-width:1228px;margin:0 auto;padding:175px 24px 124px;}
.ktf-head{display:flex;flex-direction:column;gap:8px;text-align:center;}
.ktf-h1{
  font-family:var(--sans)!important;font-size:32px!important;font-weight:600!important;line-height:48px!important;
  letter-spacing:0!important;color:var(--ink)!important;margin:0!important;
}
.ktf-sub{font-family:var(--text)!important;font-size:16px!important;font-weight:400!important;line-height:24px!important;letter-spacing:0!important;color:var(--body)!important;margin:0!important;}
.ktf .ktf-filters{margin-top:40px;}
.ktf-count{
  margin:24px 0 0!important;text-align:center;font-family:var(--text)!important;font-size:16px!important;
  font-weight:500!important;line-height:24px!important;letter-spacing:0!important;color:var(--body)!important;
}
.ktf .ktf-grid{margin-top:24px;}
/* This frame's card chips are Inter 500 (the home page's are 400). */
.ktf .ktc-chip{font-weight:500!important;}
/* Figma draws the 1px stroke inside the 20 padding. */
.ktf .ktf-grid .ktc{padding:19px;}
/* Filter popup, Figma 1123:11584 (laptop) and 1123:13939 (phone): the dim starts under
   the header, #151515 at 45% with a 4px blur; on a laptop the 477 card sits 143 below
   the header, on a phone it is a sheet on the bottom edge with 24px top corners. */
.ktf .kh2-pop-wrap{top:63px;align-items:flex-start;padding:143px 16px 16px;}
.ktf .kh2-pop-dim{background:rgba(21,21,21,.45);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);}

/* Phone frame 1123:13465: 56 under the header, heading 32/38.4 then 12 to the
   subtitle, 32 to the search; cards 358 wide, 16 apart, and this frame keeps the
   laptop card inside (20 padding, three-line bio, 54 tiles 23 apart, a bordered
   66 foot, a 120 "Book now"), not the home page's phone card. */
@media (max-width:640px){
  .ktf-in{padding:119px 16px 80px;}
  .ktf-head{gap:12px;}
  .ktf-h1{font-size:32px!important;line-height:38.4px!important;}
  .ktf .ktf-filters{margin-top:32px;}
  .ktf .ktf-grid{gap:16px;}
  .ktf .ktf-grid .ktc{min-height:360px;padding:19px;--ktc-ink-soft:#5C5C5C;}
  .ktf .ktf-grid .ktc-wave{margin-top:0;}
  .ktf .ktf-grid .ktc-wave-btn{width:25.2px;height:25.2px;margin:0 -1.3px;}
  .ktf .ktf-grid .ktc-panel{margin-bottom:16px;}
  .ktf .ktf-grid .ktc-bio{max-height:54px;}
  .ktf .ktf-grid .ktc-tags-wrap{margin-bottom:16px;}
  .ktf .ktf-grid .ktc-chip{height:24px;border-color:#E3E2E2;border-radius:12px;}
  .ktf .ktf-grid .ktc-stats:not(#_){gap:23px;margin-bottom:20px;}
  .ktf .ktf-grid .ktc-stat{min-height:54px;border-radius:12px;}
  .ktf .ktf-grid .ktc-foot{min-height:66px;padding:0 12px;border:1px solid #DDEED8;}
  .ktf .ktf-grid .ktc-book{width:120px;text-transform:none;}
  .ktf .kh2-pop-wrap{align-items:flex-end;padding:0;}
  .ktf .kh2-pop{width:100%;max-height:calc(100% - 24px);padding:32px 24px 24px;gap:24px;border-radius:24px 24px 0 0;animation-name:ktf-sheet-in;}
  .ktf .kh2-pop-langs,.ktf .kh2-pop-modes{gap:16px;}
  .ktf .kh2-pop-h{font-size:18px!important;line-height:26px!important;margin-bottom:16px;}
}
@keyframes ktf-sheet-in{from{transform:translateY(100%);}to{transform:none;}}
`;
