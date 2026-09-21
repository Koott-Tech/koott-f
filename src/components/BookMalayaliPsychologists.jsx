'use client';

/**
 * Therapist listing — the native replacement for the Wix page
 * koott.in/book-malayali-psychologists.
 *
 * Layout measured off that page: H1 "Find your Malayali Psychologist", two
 * 233x41 filter selects, and a 2-up grid of 482px therapist cards. Cards link
 * to /therapist-profile?doctor=<id>, which is our booking flow.
 *
 * Data comes from /api/public/psychologists; the ORDER comes from
 * /api/public/psychologists/order?list=booking — the admin's group pattern
 * (Admin → Therapist Groups → Booking-page order): each card position is
 * reserved for a group and shows that group's soonest-available therapist.
 * Filters keep that order.
 */

import { useEffect, useMemo, useState } from 'react';
import { publicApi } from '@/lib/backendApi';
import { applyTherapistOrder, fetchTherapistOrder } from '@/lib/therapistOrder';
import TherapistCard, { THERAPIST_CARD_CSS, introOf } from '@/components/TherapistCard';
import { therapistSlug } from '@/components/TherapistProfile';
import ResumeBookingCard, { RESUME_CARD_CSS, useBookingDraft } from '@/components/ResumeBookingCard';
import CustomSelect from '@/components/CustomSelect';
import { whenLabel } from '@/lib/nextAvailable';

const ALL = 'All';

/** Map an API psychologist onto the card's shape. */
function toCard(p) {
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
    languages: ['English', 'Malayalam'],
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
  const [therapists, setTherapists] = useState([]);
  const [status, setStatus] = useState('loading');
  const [specialist, setSpecialist] = useState(ALL);
  const [concern, setConcern] = useState(ALL);
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
        const rows = res?.data?.psychologists || res?.psychologists
          || (Array.isArray(res?.data) ? res.data : null)
          || (Array.isArray(res) ? res : []);
        if (cancelled) return;
        // The order endpoint already carries each therapist's next free start,
        // so the cards need no slot requests of their own.
        setTherapists(applyTherapistOrder(rows.map(toCard), order).map((t) => ({
          ...t,
          availability: whenLabel(order?.nextAt?.get(String(t.id))),
        })));
        setStatus('ready');
      } catch (err) {
        console.error('[book-malayali-psychologists] load failed:', err);
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const specialists = useMemo(
    () => [ALL, ...[...new Set(therapists.map((t) => t.specialist).filter(Boolean))].sort()],
    [therapists]
  );
  const concerns = useMemo(
    () => [ALL, ...[...new Set(therapists.flatMap((t) => t.concerns).filter(Boolean))].sort()],
    [therapists]
  );

  const visible = useMemo(
    () => therapists.filter(
      (t) => (specialist === ALL || t.specialist === specialist)
        && (concern === ALL || t.concerns.includes(concern))
    ),
    [therapists, specialist, concern]
  );

  return (
    <div className="ktl">
      <style dangerouslySetInnerHTML={{ __html: THERAPIST_CARD_CSS + RESUME_CARD_CSS + LISTING_CSS }} />

      <section className="ktl-head">
        <h1 className="ktl-h1">Find your Malayali Psychologist</h1>
        <p className="ktl-sub">
          Talk to a licensed therapist who understands your language, culture and experiences.
        </p>

        <div className="ktl-filters">
          <label className="ktl-field">
            <span className="ktl-label">Specialist</span>
            <CustomSelect className="ktl-select" aria-label="Specialist" value={specialist} onChange={(e) => setSpecialist(e.target.value)}
              options={specialists} />
          </label>

          <label className="ktl-field">
            <span className="ktl-label">Concern</span>
            <CustomSelect className="ktl-select" aria-label="Concern" value={concern} onChange={(e) => setConcern(e.target.value)}
              options={concerns} />
          </label>
        </div>
      </section>

      <section className={`ktl-body${status === 'loading' ? ' is-loading' : ''}`}>
        {status === 'loading' && <p className="ktl-state">Loading therapists…</p>}

        {status === 'error' && (
          <p className="ktl-state">
            We couldn’t load the therapist list just now. Please refresh to try again.
          </p>
        )}

        {status === 'ready' && visible.length === 0 && (
          <p className="ktl-state">
            No therapists match those filters yet. Try widening your selection.
          </p>
        )}

        {status === 'ready' && visible.length > 0 && (
          <>
            <p className="ktl-count">
              {visible.length} therapist{visible.length === 1 ? '' : 's'} available
            </p>
            <div className="ktl-grid">
              {draft && therapists.some((t) => t.slug === draft.slug) && (
                <ResumeBookingCard
                  draft={draft} slotState={slotState} suggestion={suggestion}
                  onDismiss={dismissDraft} onTakeSuggestion={takeSuggestion} onSeeOtherTimes={seeOtherTimes}
                />
              )}
              {visible.map((t) => (
                <TherapistCard
                  key={t.id}
                  t={t}
                  // The cloned koott.in profile; booking stays on the old flow.
                  profileHref={t.slug ? `/service-page/${t.slug}` : `/therapist-profile?doctor=${encodeURIComponent(t.id)}`}
                  bookHref={t.slug ? `/book/${t.slug}` : `/therapist-profile?doctor=${encodeURIComponent(t.id)}`}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* Scoped to .ktl and marked !important for the same reason the condition
   template is: globals.css forces Poppins / 48px on headings and Inter /
   16px on p, with letter-spacing on span, li, a and button. */
const LISTING_CSS = `
.ktl{
  --ktl-ink:#100E0E;
  --ktl-deep:#012F23;
  --ktl-accent:#3D985C;
  --ktl-sans:'Inter',ui-sans-serif,system-ui,sans-serif;
  --ktl-body:'Inter','Avenir Light','Avenir Next','Avenir',ui-sans-serif,system-ui,sans-serif;
  /* Header.jsx is position:fixed and h-16, so it reserves no space in flow. */
  padding-top:64px;
  /* Always at least one full screen (header space included), so the footer never
     peeks in while the list loads or is short, then jumps down when cards arrive. */
  box-sizing:border-box;min-height:100vh;min-height:100dvh;
  display:block;background:#fff;color:var(--ktl-ink);
  font-family:var(--ktl-body)!important;
}
.ktl *{box-sizing:border-box;}
.ktl-head{max-width:1180px;margin:0 auto;padding:44px 20px 0;text-align:center;}
.ktl-h1{
  /* size from the global --h1-size scale */
  font-family:var(--ktl-sans)!important;font-weight:500!important;
  line-height:1.3em!important;letter-spacing:-.05em!important;color:var(--ktl-ink)!important;margin:0;
}
.ktl-sub{
  font-family:var(--ktl-body)!important;font-size:15px!important;font-weight:400!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--ktl-ink)!important;
  margin:12px auto 0;max-width:520px;
}
.ktl-filters{display:flex;gap:13px;justify-content:center;flex-wrap:wrap;margin:26px 0 0;}
.ktl-field{display:flex;flex-direction:column;gap:6px;text-align:left;}
.ktl-label{
  font-family:var(--ktl-body)!important;font-size:12px!important;font-weight:400!important;
  letter-spacing:0!important;color:#5B5757!important;padding-left:4px;
}
.ktl-select{
  width:233px;height:41px;padding:0 16px;
  background:#fff;border:1px solid rgba(61,152,92,.35);border-radius:15px;
  font-family:var(--ktl-body)!important;font-size:14px;font-weight:400;
  color:var(--ktl-deep);cursor:pointer;appearance:none;
  background-image:url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%233D985C' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 16px center;background-size:11px;
  transition:border-color .2s ease,box-shadow .2s ease;
}
.ktl-select:hover{border-color:var(--ktl-accent);}
.ktl-select:focus-visible{outline:none;border-color:var(--ktl-accent);box-shadow:0 0 0 3px rgba(61,152,92,.18);}

.ktl-body{max-width:1180px;margin:0 auto;padding:32px 20px 72px;}
/* While the list loads, keep a full screen under the heading for the cards, so the
   footer sits well below the fold instead of right at its edge. */
.ktl-body.is-loading{min-height:100vh;min-height:100dvh;}
.ktl-count{
  font-family:var(--ktl-body)!important;font-size:14px!important;font-weight:400!important;
  letter-spacing:0!important;color:#5B5757!important;text-align:center;margin:0 0 22px;
}
.ktl-state{
  font-family:var(--ktl-body)!important;font-size:15px!important;font-weight:400!important;
  letter-spacing:0!important;color:var(--ktl-ink)!important;text-align:center;margin:48px 0;
}
/* Three across on a laptop — the cards sit at ~366px, the same width they take
   on the home page's grid, so a therapist looks identical on both. */
.ktl-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
@media (max-width:1100px){
  .ktl-grid{grid-template-columns:repeat(2,1fr);}
}

@media (max-width:900px){
  .ktl-grid{grid-template-columns:1fr;}
}
/* phones: the two filters share one row, each half of a narrower strip */
@media (max-width:640px){
  .ktl-filters{flex-wrap:nowrap;gap:10px;max-width:340px;margin-left:auto;margin-right:auto;}
  .ktl-field{flex:1 1 0;min-width:0;}
  /* cards run 12px from the screen edge rather than the page's 20px gutter */
  .ktl-grid{margin-left:-8px;margin-right:-8px;gap:16px;}
  .ktl-select{width:100%;height:38px;padding:0 30px 0 12px;font-size:13px;border-radius:12px;background-position:right 12px center;}
}
`;
