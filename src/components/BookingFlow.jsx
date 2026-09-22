'use client';

/**
 * BookingFlow — the stepped booking journey.
 *
 *   0  mobile number     asked first: a 6-digit code on WhatsApp (/phone-verification);
 *                        the verified number + its token go with the payment order
 *   1  session type      Individual therapy (50 min) / Couple therapy (1 h 20 min);
 *                        psychiatrists: 15-min / 30-min consultation (no couple)
 *   2  date and time     month calendar + the free starts for the chosen day
 *   3  session plan      Packages / Single, priced per package_type
 *   4  about yourself    name, email, age, emergency contact
 *   5  review            everything chosen, then Proceed to pay
 *
 * Slots come from /availability/public/psychologist/:id/slots, which cuts them
 * from the therapist's working hours by session length with a 10-min break
 * after each (see backend utils/sessionSlots.js). They arrive in IST and are
 * shown in the visitor's own time zone; the IST date and time are what gets
 * booked, so the database and dashboards stay in IST.
 *
 * Payment is the same path the profile page has always used: reserve the slot,
 * create a Razorpay order, open checkout, confirm on /payment/success.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientApi, paymentApi } from '@/lib/backendApi';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import { clearDraft, loadDraft, nearestFreeSlot, saveDraft } from '@/lib/bookingDraft';
import SlotUnavailablePopup from '@/components/SlotUnavailablePopup';
import { analyticsContext, track, trackPopup } from '@/analytics';
import { therapistSlug } from '@/components/TherapistProfile';
import {
  IST, SESSION_LENGTH_LABEL, clientTimeZone, dateLabel, dayKey, fetchSlots, fromYmd,
  isPsychiatristRecord, istToInstant, packageKind, sameAsIst, timeLabel, toTimeOfDay, ymd, zoneLabel,
} from '@/lib/sessionSlots';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || API;

const STEPS = ['type', 'when', 'plan', 'about', 'review'];
// Analytics step ids (koott-backend/analytics/registry.js BOOKING_STEPS); 'phone' is the number check before step 0.
const STEP_EVENT = ['type', 'time', 'plan', 'about', 'review'];
const itemKindOf = (p) => (p && readType(p).sessions > 1 ? 'package' : 'session');
const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// The mobile number verified by WhatsApp code, kept for this tab (token lasts 2 h).
const VERIFIED_KEY = 'koott_verified_phone';
const VERIFIED_FOR_MS = 110 * 60 * 1000;

// A stored number worth using (sign-up leaves a bare "+91" when none was given).
const usablePhone = (p) => (String(p || '').replace(/\D/g, '').length >= 8 ? String(p).trim() : '');

/** package_type -> { kind, sessions } (see lib/sessionSlots packageKind) */
const readType = (p) => packageKind(p);

const THERAPY_TYPES = [['individual', 'Individual therapy'], ['couple', 'Couple therapy']];
const PSYCHIATRY_TYPES = [['psychiatry_15', '15-min consultation'], ['psychiatry_30', '30-min consultation']];
const TYPE_LABEL = {
  individual: 'Individual therapy', couple: 'Couple therapy',
  psychiatry_15: 'Psychiatry consultation', psychiatry_30: 'Psychiatry consultation',
};
const EYEBROW = {
  individual: 'INDIVIDUAL · 50M', couple: 'COUPLE · 1H 20M',
  psychiatry_15: 'PSYCHIATRY · 15M', psychiatry_30: 'PSYCHIATRY · 30M',
};

// Loaded once, ahead of time on the review step, so "Proceed to pay" never waits for it.
let razorpayScript = null;
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (!razorpayScript) {
    razorpayScript = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = resolve;
      s.onerror = () => {
        razorpayScript = null;
        reject(new Error('We could not load the payment window. Please check your connection.'));
      };
      document.body.appendChild(s);
    });
  }
  return razorpayScript;
}

const PAY_STAGE_TEXT = {
  order: 'Holding your slot…',
  opening: 'Opening secure payment…',
  confirming: 'Payment received — confirming your booking…',
};

/**
 * After Razorpay says paid: keep a copy for the success page (iPhone Safari can
 * drop the query string), start the server confirmation — which creates the
 * session — and hand over to the success page. The webhook remains the backstop.
 */
async function finishPayment(resp) {
  const ids = {
    razorpay_order_id: resp.razorpay_order_id,
    razorpay_payment_id: resp.razorpay_payment_id,
    razorpay_signature: resp.razorpay_signature,
  };
  try {
    sessionStorage.setItem('razorpay_payment', JSON.stringify({ ...ids, timestamp: Date.now() }));
  } catch (_) { /* private mode — the query string still carries them */ }

  // Confirm in the background — keepalive lets the request finish across the page
  // change — and go to the success page at once; it polls until the booking is in.
  // Waiting here first held the client on the checkout screen for the whole confirmation.
  fetch(`${BACKEND}/payment/success`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ids), keepalive: true,
  }).catch(() => {});

  window.location.href = `/payment/success?razorpay_order_id=${encodeURIComponent(ids.razorpay_order_id)}`
    + `&razorpay_payment_id=${encodeURIComponent(ids.razorpay_payment_id)}`
    + `&razorpay_signature=${encodeURIComponent(ids.razorpay_signature)}`;
}

const Arrow = ({ dir = 'left' }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {dir === 'left' ? <path d="M19 12H5M11 18l-6-6 6-6" /> : <path d="M9 6l6 6-6 6" />}
  </svg>
);

export default function BookingFlow({ slug }) {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const tz = useMemo(() => clientTimeZone(), []);

  const [step, setStep] = useState(0);
  const [therapist, setTherapist] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loadErr, setLoadErr] = useState('');

  const [kind, setKind] = useState('individual');         // SESSION_LENGTH_LABEL key
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [openDays, setOpenDays] = useState({});          // local 'YYYY-MM-DD' -> free slots
  const [daysBusy, setDaysBusy] = useState(true);
  const [daysErr, setDaysErr] = useState(false);
  const [day, setDay] = useState(null);                  // local 'YYYY-MM-DD'
  const [slot, setSlot] = useState(null);                // { date, time } in IST + startsAt
  const [mode, setMode] = useState('packages');           // 'packages' | 'single'
  const [plan, setPlan] = useState(null);
  const [pendingPlanId, setPendingPlanId] = useState(null); // from a saved draft, applied once packages load
  const [verifyRestoredSlot, setVerifyRestoredSlot] = useState(false);
  const [slotNotice, setSlotNotice] = useState('');        // 'passed' | 'taken' — a saved time that no longer stands
  const [lostSlot, setLostSlot] = useState(null);          // that time, to suggest the nearest free one
  const [slotSuggestion, setSlotSuggestion] = useState(null);
  const [about, setAbout] = useState({
    name: '', email: '', age: '', dial: '+91', phone: '', emergency: '',
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingPay, setPendingPay] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState('');
  const [payStage, setPayStage] = useState(null);         // 'order' | 'opening' | 'confirming'

  // Booking a session from a package the client already holds (?package=<client_packages id>)
  const [packageParam, setPackageParam] = useState(null);
  const [pkgMode, setPkgMode] = useState(null);           // that client_packages row, once loaded
  const [pkgErr, setPkgErr] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [booked, setBooked] = useState(null);             // { startsAt, left } after Confirm booking

  /* ------------------------- mobile number + code ------------------------ */

  const [verified, setVerified] = useState(null);         // { phone, token } once the code checks out
  const [otpDial, setOtpDial] = useState('+91');
  const [otpNumber, setOtpNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  // 6 for a real WhatsApp code; a reserved test number answers with its own
  // shorter one (PHONE_OTP_TEST_NUMBERS on the backend — temporary).
  const [otpLen, setOtpLen] = useState(6);
  const [otpErr, setOtpErr] = useState('');
  const [otpNote, setOtpNote] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const otpPhone = `${otpDial.trim()}${otpNumber.replace(/\D/g, '')}`;
  const [welcome, setWelcome] = useState(null);           // { name, phone } — "we found your account"
  const [aboutBusy, setAboutBusy] = useState(false);
  const [aboutErr, setAboutErr] = useState('');
  const [emailTaken, setEmailTaken] = useState(false);
  const [authFor, setAuthFor] = useState('pay');           // what the login modal continues to

  // A signed-in client whose account already has a number is never asked for it.
  const isClient = user?.role === 'client';
  const accountPhone = usablePhone(user?.profile?.phone_number || user?.phone_number);
  const needsPhone = !verified && !(isAuthenticated() && isClient && accountPhone);

  // A number verified in this tab stays verified for the token's life (2 h).
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(VERIFIED_KEY) || 'null');
      if (saved?.token && Date.now() - saved.at < VERIFIED_FOR_MS) setVerified({ phone: saved.phone, token: saved.token });
    } catch (_) { /* private mode */ }
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const postOtp = async (path, body) => {
    const res = await fetch(`${API}/phone-verification/${path}`, {
      method: 'POST',
      // Signed in: the verified number is attached to this account.
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      const err = new Error(json.message || 'Something went wrong. Please try again.');
      err.retryAfter = json.retryAfter;
      throw err;
    }
    return json.data || {};
  };

  const sendOtp = async () => {
    setOtpBusy(true); setOtpErr(''); setOtpNote('');
    try {
      const d = await postOtp('send', { phone: otpPhone });
      setOtpSent(true);
      setOtpCode('');
      setResendIn(d.resendAfter || 30);
      // Local testing only (PHONE_OTP_DEV_ECHO / PHONE_OTP_TEST_NUMBERS) —
      // before the WhatsApp template is approved.
      setOtpLen(d.devCode ? String(d.devCode).length : 6);
      if (d.devCode) setOtpNote(`Test mode — WhatsApp not sent. Your code is ${d.devCode}.`);
    } catch (e) {
      setOtpErr(e.message);
      if (e.retryAfter) setResendIn(e.retryAfter);
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyOtp = async (code = otpCode) => {
    if (code.length !== otpLen) return;
    setOtpBusy(true); setOtpErr('');
    try {
      const d = await postOtp('verify', { phone: otpPhone, code, psychologistId: therapist?.id, analytics: analyticsContext() });
      track('phone_verified', {}, { psychologistId: therapist?.id });
      // The number already belongs to a Koott client: sign them in and say so.
      if (d.found && d.auth?.token) {
        login(d.auth.user, d.auth.token, { remember: true });
        setWelcome({ name: d.name, phone: d.phone });
      }
      const v = { phone: d.phone, token: d.token };
      setVerified(v);
      try { sessionStorage.setItem(VERIFIED_KEY, JSON.stringify({ ...v, at: Date.now() })); } catch (_) { /* private mode */ }
    } catch (e) {
      setOtpErr(e.message);
      track('booking_step_error', { step: 'phone', code: 'otp_failed' });
    } finally {
      setOtpBusy(false);
    }
  };

  const changeNumber = () => {
    setOtpSent(false); setOtpCode(''); setOtpErr(''); setOtpNote(''); setResendIn(0);
  };

  const forgetVerified = () => {
    setVerified(null); changeNumber();
    try { sessionStorage.removeItem(VERIFIED_KEY); } catch (_) { /* private mode */ }
  };

  // Signed in (before, or just now through the code): fill "About yourself" from the account.
  useEffect(() => {
    if (!user || user.role !== 'client') return;
    const p = user.profile || {};
    const fullName = [p.first_name, p.last_name].filter((s) => s && s !== 'Pending').join(' ').trim() || user.name || '';
    setAbout((a) => ({
      ...a,
      name: a.name || fullName,
      email: a.email || user.email || '',
      age: a.age || (p.age ? String(p.age) : ''),
      emergency: a.emergency || p.emergency_contact || '',
    }));
  }, [user]);

  // "About yourself" → review. A new visitor's account is created here from these
  // details and the verified number, and they are signed in; signed-in clients move on.
  const continueAbout = async () => {
    if (isAuthenticated()) { track('details_completed', {}, { psychologistId: therapist?.id }); setStep(4); return; }
    if (!verified?.token) { forgetVerified(); return; }
    setAboutBusy(true); setAboutErr(''); setEmailTaken(false);
    try {
      const res = await fetch(`${API}/phone-verification/create-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneToken: verified.token,
          name: about.name.trim(),
          email: about.email.trim(),
          age: about.age,
          emergency: about.emergency,
          psychologistId: therapist?.id,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        if (json.code === 'EMAIL_EXISTS') setEmailTaken(true);
        if (json.code === 'PHONE_NOT_VERIFIED') forgetVerified();
        throw new Error(json.message || 'We could not save your details. Please try again.');
      }
      const auth = json.data?.auth;
      if (auth?.token) login(auth.user, auth.token, { remember: true, method: 'phone' });
      track('details_completed', {}, { psychologistId: therapist?.id });
      setStep(4);
    } catch (e) {
      setAboutErr(e.message);
      track('booking_step_error', { step: 'about', code: /already exists/i.test(e.message || '') ? 'email_exists' : 'save_failed' });
    } finally {
      setAboutBusy(false);
    }
  };

  // Arriving from the profile widget, session type, date and time are already
  // chosen — open on the plan step rather than asking again. The URL carries
  // the IST date and time; the calendar opens on the visitor's local day.
  // Read from the URL directly: useSearchParams would need a Suspense boundary.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    // From the dashboard: a session out of a package they already hold (loaded below).
    if (p.get('package')) { setPackageParam(p.get('package')); return; }
    const type = p.get('type');
    if (type && SESSION_LENGTH_LABEL[type]) setKind(type);
    const d = p.get('date');
    const t = toTimeOfDay(p.get('time'));
    const startsAt = d && t ? istToInstant(d, t) : null;
    if (!startsAt) {
      // No time in the URL: pick up this visitor's unfinished booking with this
      // therapist (lib/bookingDraft), at the step they left — "About yourself" at most,
      // since personal details are never stored.
      const draft = loadDraft();
      if (!draft || draft.slug !== slug) return;
      if (draft.kind && SESSION_LENGTH_LABEL[draft.kind]) setKind(draft.kind);
      let resumeAt = Math.min(draft.step || 0, 3);
      if (draft.slot?.startsAt) {
        const key = dayKey(draft.slot.startsAt, tz);
        const local = fromYmd(key);
        setSlot(draft.slot);
        setDay(key);
        setMonth(new Date(local.getFullYear(), local.getMonth(), 1));
        setVerifyRestoredSlot(true); // still free? checked once that month's times load
      } else {
        resumeAt = Math.min(resumeAt, 1);
        if (draft.slotPassed) { setSlotNotice('passed'); setLostSlot(draft.previousSlot || null); }
      }
      if (draft.planId) setPendingPlanId(draft.planId);
      else resumeAt = Math.min(resumeAt, 2);
      setStep(resumeAt);
      return;
    }
    if (new Date(startsAt) < new Date()) return;
    const key = dayKey(startsAt, tz);
    const local = fromYmd(key);
    setSlot({ date: d, time: t, startsAt });
    setDay(key);
    setMonth(new Date(local.getFullYear(), local.getMonth(), 1));
    // The profile widget can also carry the plan: then only "About yourself" is
    // left to ask. The plan itself is matched once this therapist's packages load,
    // and the step falls back to 2 if that plan has since been withdrawn.
    const planId = p.get('plan');
    if (planId) setPendingPlanId(planId);
    setStep(planId ? 3 : 2);
  }, [tz, slug]);

  /* ----------------------------- load ----------------------------------- */

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const res = await fetch(`${API}/public/psychologists`);
        const json = await res.json();
        const d = json?.data ?? json?.message ?? json;
        const list = d?.psychologists || (Array.isArray(d) ? d : []);
        const found = list.find((t) => therapistSlug(t) === slug);
        if (off) return;
        if (!found) { setLoadErr('We could not find that therapist.'); return; }
        setTherapist(found);

        const pk = await fetch(`${API}/public/psychologists/${found.id}/packages`);
        const pj = await pk.json();
        const pd = pj?.data ?? pj?.message ?? pj;
        const rows = pd?.packages || (Array.isArray(pd) ? pd : []);
        if (!off) setPackages(rows.filter((p) => p.is_active !== false));
      } catch (_) {
        if (!off) setLoadErr('We could not load this booking page just now.');
      }
    })();
    return () => { off = true; };
  }, [slug]);

  // Free starts for the visible month and session type, keyed by local day.
  useEffect(() => {
    if (!therapist) return undefined;
    let off = false;
    const from = ymd(new Date(month.getFullYear(), month.getMonth(), 1));
    const to = ymd(new Date(month.getFullYear(), month.getMonth() + 1, 0));
    setDaysBusy(true);
    setDaysErr(false);
    fetchSlots(API, therapist.id, from, to, kind, tz)
      .then((map) => { if (!off) setOpenDays(map); })
      .catch(() => { if (!off) { setOpenDays({}); setDaysErr(true); } })
      .finally(() => { if (!off) setDaysBusy(false); });
    return () => { off = true; };
  }, [therapist, month, kind, tz]);

  /* ---------------------------- derived --------------------------------- */

  const name = therapist
    ? (therapist.name || `${therapist.first_name || ''} ${therapist.last_name || ''}`.trim())
    : '';

  const slots = day ? (openDays[day] || []) : [];
  const todayKey = ymd(new Date());

  // Psychiatrists offer 15/30-min consultations; therapists individual/couple.
  const isPsychiatrist = isPsychiatristRecord(therapist);
  const typeChoices = isPsychiatrist ? PSYCHIATRY_TYPES : THERAPY_TYPES;
  useEffect(() => {
    if (!therapist) return;
    if (isPsychiatrist !== kind.startsWith('psychiatry_')) {
      setKind(isPsychiatrist ? 'psychiatry_15' : 'individual');
      setSlot(null);
      setDay(null);
    }
  }, [therapist, isPsychiatrist, kind]);

  const forThisType = useMemo(
    () => packages.filter((p) => readType(p).kind === kind),
    [packages, kind],
  );
  const singles = forThisType.filter((p) => readType(p).sessions === 1);
  const bundles = forThisType.filter((p) => readType(p).sessions > 1);
  const unit = singles[0]?.price || therapist?.individual_session_price || therapist?.price || 0;
  // A type with only singles (e.g. 30-min consults) or only packages shows that list.
  const effectiveMode = mode === 'packages' && !bundles.length ? 'single'
    : mode === 'single' && !singles.length ? 'packages' : mode;
  const shown = effectiveMode === 'single' ? singles : bundles;

  const grid = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const cells = Array(first.getDay()).fill(null);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= last; i += 1) cells.push(new Date(month.getFullYear(), month.getMonth(), i));
    return cells;
  }, [month]);

  // A time restored from a saved draft must still be free — someone else may have
  // booked it meanwhile. If not, back to the calendar with a notice.
  useEffect(() => {
    if (!verifyRestoredSlot || daysBusy) return;
    setVerifyRestoredSlot(false);
    if (daysErr || !slot || !day) return; // can't tell — create-order re-checks before payment
    const stillFree = (openDays[day] || []).some(
      (s) => new Date(s.startsAt).getTime() === new Date(slot.startsAt).getTime(),
    );
    if (!stillFree) {
      setLostSlot(slot);
      setSlot(null);
      setStep(1);
      setSlotNotice('taken');
    }
  }, [verifyRestoredSlot, daysBusy, daysErr, openDays, slot, day]);

  // With that notice, offer the nearest free time: same day as the lost one if it has
  // any, else the nearest shown; for a time that has passed, the soonest.
  useEffect(() => {
    if (!slotNotice || daysBusy || slotSuggestion) return;
    const anchor = slotNotice === 'taken' && lostSlot ? lostSlot.startsAt : new Date().toISOString();
    // Never offer the very time that was just lost — the loaded times can predate it.
    const lostAt = lostSlot ? new Date(lostSlot.startsAt).getTime() : null;
    const candidates = lostAt == null ? openDays : Object.fromEntries(
      Object.entries(openDays).map(([k, list]) => [k, list.filter((s) => new Date(s.startsAt).getTime() !== lostAt)]),
    );
    setSlotSuggestion(nearestFreeSlot(candidates, anchor, tz));
  }, [slotNotice, daysBusy, openDays, lostSlot, slotSuggestion, tz]);

  const takeSuggestedSlot = () => {
    const s = slotSuggestion;
    if (!s) return;
    const key = dayKey(s.startsAt, tz);
    const local = fromYmd(key);
    setSlot(s);
    setDay(key);
    setMonth(new Date(local.getFullYear(), local.getMonth(), 1));
    setSlotNotice('');
    setSlotSuggestion(null);
    setStep(pkgMode ? 4 : plan ? 3 : 2); // package: review; a plan already chosen: "About yourself"
  };

  // The plan from a saved draft, once this therapist's packages are in.
  useEffect(() => {
    if (!pendingPlanId || !packages.length) return;
    const p = packages.find((x) => String(x.id) === String(pendingPlanId));
    if (p) setPlan(p);
    else setStep((s) => Math.min(s, 2)); // that plan is gone — choose again
    setPendingPlanId(null);
  }, [pendingPlanId, packages]);

  // Keep this visitor's unfinished booking in the browser so the listing can offer
  // "Resume your booking" (lib/bookingDraft). Choices only — nothing personal.
  useEffect(() => {
    if (!therapist || step < 1 || pendingPlanId || packageParam) return; // package sessions aren't drafts
    const sessions = plan ? (readType(plan).sessions || 1) : 0;
    saveDraft({
      slug,
      therapistId: therapist.id,
      therapist: {
        name,
        role: therapist.designation || '',
        photo: therapist.cover_image_url || therapist.profile_picture_url || '',
      },
      kind,
      kindLabel: `${TYPE_LABEL[kind]} · ${SESSION_LENGTH_LABEL[kind]}`,
      slot: slot ? { date: slot.date, time: slot.time, startsAt: slot.startsAt } : null,
      planId: plan?.id || null,
      planLabel: plan ? (sessions === 1 ? 'Single session' : `${sessions} sessions`) : '',
      price: plan?.price ?? null,
      step,
    });
  }, [therapist, step, kind, slot, plan, slug, name, pendingPlanId]);

  const canContinue = [
    true,
    Boolean(slot),
    Boolean(plan),
    Boolean(about.name.trim() && /.+@.+\..+/.test(about.email)),
    true,
  ][step];

  // Package mode has only the calendar and the review; otherwise one step back, leaving
  // the page from the first step (or the mobile-number step).
  const back = () => {
    if (pkgMode) { if (step <= 1) router.back(); else setStep(1); return; }
    if (needsPhone || step === 0) router.back(); else setStep((s) => s - 1);
  };

  const chooseType = (nextKind) => {
    // Slots differ by session length, so a time picked for the other type no longer applies.
    if (nextKind !== kind) { setSlot(null); setDay(null); }
    setKind(nextKind);
    setPlan(null);
    setMode('packages');
    setStep(1);
  };

  /* ---------------------------- payment --------------------------------- */

  const pay = useCallback(async () => {
    if (!isAuthenticated()) { setAuthFor('pay'); setAuthOpen(true); return; }
    if (user?.role && user.role !== 'client') {
      setPayErr('Sessions are booked from a client account. Please log out and sign in as a client.');
      return;
    }
    setPaying(true); setPayErr(''); setPayStage('order');
    try {
      // One round trip: create-order checks the price and that the slot is still free
      // for this session length, then holds it. (A separate reserve-slot call before
      // it repeated those checks and cost ~5 s.)
      const razorpayReady = loadRazorpay();
      const order = await paymentApi.createPaymentOrder({
        scheduledDate: slot.date,
        scheduledTime: slot.time,
        psychologistId: therapist.id,
        amount: plan.price,
        packageId: plan.id,
        sessionType: readType(plan).sessions > 1 ? 'Package Session' : 'Individual Session',
        clientName: about.name,
        clientEmail: about.email,
        clientPhone: verified?.phone || accountPhone,
        phoneVerificationToken: verified?.token,
        clientAge: about.age || null,
        emergencyContact: about.emergency || null,
        clientTimeZone: tz, // confirmation email/WhatsApp show the time in this zone
        analytics: analyticsContext(), // where this booking came from (frozen server-side)
      });
      if (order && order.success === false) throw new Error(order.message);
      const o = order?.data ?? order;

      setPayStage('opening');
      await razorpayReady;
      const rz = new window.Razorpay({
        key: o.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: o.orderId,
        amount: o.amountInPaise,
        currency: o.currency || 'INR',
        name: 'Koott',
        description: `${plan.name} with ${name}`,
        prefill: { name: about.name, email: about.email, contact: verified?.phone || accountPhone || '' },
        notes: o.notes || {},
        theme: { color: '#189E4F' },
        handler: (resp) => { clearDraft(); setPayStage('confirming'); finishPayment(resp); },
        modal: { ondismiss: () => { setPaying(false); track('payment_dismissed'); } },
      });
      rz.on('payment.failed', (resp) => {
        // Razorpay's error code only — never its free-text description.
        const reason = String(resp?.error?.reason || resp?.error?.code || 'unknown').toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 60);
        track('payment_attempt_failed', { code: /^[a-z]/.test(reason) ? reason : 'unknown' });
        setPayErr(resp?.error?.description || 'The payment did not go through. Please try again.');
        setPaying(false);
        setPayStage(null);
        fetch(`${BACKEND}/payment/failure`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ razorpay_order_id: resp?.error?.metadata?.order_id || o.orderId, error: resp?.error }),
        }).catch(() => {});
      });
      rz.open();
      track('payment_opened', { item_kind: itemKindOf(plan) }, { psychologistId: therapist.id, value: Number(plan.price) || 0 });
      setPayStage(null); // Razorpay's own window is up
    } catch (e) {
      track('booking_step_error', { step: 'review', code: /slot/i.test(e?.message || '') ? 'slot_taken' : 'order_failed' });
      setPayErr(e?.message || 'We could not start the payment. Please try again.');
      setPaying(false);
      setPayStage(null);
      // Verification lapsed (token older than 2 h): ask for the number again.
      if (/verify your mobile/i.test(e?.message || '')) forgetVerified();
    }
  }, [isAuthenticated, user, therapist, slot, plan, about, name, tz, verified, accountPhone]);

  /* ----------------------------- analytics ------------------------------ */
  // booking_started once the therapist is known; then one event per screen
  // shown, and checkout_started on the review screen with its price.
  useEffect(() => {
    if (therapist?.id) track('booking_started', { mode: packageParam ? 'package' : 'new' }, { psychologistId: therapist.id });
  }, [therapist?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!therapist?.id) return;
    const name = needsPhone ? 'phone' : STEP_EVENT[step];
    if (name) track('booking_step_viewed', { step: name }, { psychologistId: therapist.id });
    if (!needsPhone && step === 4 && plan) {
      track('checkout_started', { item_kind: itemKindOf(plan) }, { psychologistId: therapist.id, value: Number(plan.price) || 0 });
    }
  }, [step, needsPhone, therapist?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (slotNotice) trackPopup('slot_unavailable', 'shown'); }, [slotNotice]);

  // Package mode: session type and plan come from the client's package, there is nothing
  // to pay, and "About yourself" is skipped (they're signed in; details are on file).
  useEffect(() => {
    if (!packageParam || authLoading || !therapist) return undefined;
    if (!isAuthenticated()) {
      setPkgErr('Please log in to book a session from your package.');
      setAuthFor('package');
      setAuthOpen(true);
      return undefined;
    }
    let off = false;
    setPkgErr('');
    clientApi.getClientPackages()
      .then((res) => {
        if (off) return;
        const row = (res?.data?.clientPackages || []).find((x) => String(x.id) === String(packageParam));
        if (!row) { setPkgErr('We could not find that package on your account.'); return; }
        const withTherapist = row.psychologist?.id || row.psychologist_id;
        if (withTherapist && String(withTherapist) !== String(therapist.id)) {
          setPkgErr('This package is with another therapist.');
          return;
        }
        if (!(Number(row.remaining_sessions_for_booking) > 0)) {
          setPkgErr('All sessions in this package are already booked.');
          return;
        }
        const k = readType(row.package || {}).kind;
        if (k && SESSION_LENGTH_LABEL[k]) setKind(k);
        setPlan(row.package);
        setPkgMode(row);
        setStep(1);
      })
      .catch(() => { if (!off) setPkgErr('We could not load your package just now. Please try again.'); });
    return () => { off = true; };
  }, [packageParam, authLoading, token, therapist]);

  // Session number this booking will be, and how many are left to book after it.
  const pkgTotal = pkgMode ? (Number(pkgMode.total_sessions) || readType(pkgMode.package || {}).sessions || 1) : 0;
  const pkgLeft = pkgMode ? Number(pkgMode.remaining_sessions_for_booking) || 0 : 0;
  const pkgSessionNo = pkgMode ? Math.min(pkgTotal - pkgLeft + 1, pkgTotal) : 0;

  const confirmPackageSession = async () => {
    if (!pkgMode || !slot) return;
    setConfirming(true); setPayErr('');
    try {
      const res = await clientApi.bookRemainingSession({
        package_id: pkgMode.id,
        scheduled_date: slot.date,
        scheduled_time: slot.time,
      });
      if (res && res.success === false) throw new Error(res.message || res.error);
      setBooked({ startsAt: slot.startsAt, left: Math.max(pkgLeft - 1, 0) });
    } catch (e) {
      const msg = e?.message || 'We could not book this session. Please try again.';
      // Someone took the time meanwhile: back to the calendar with the nearest free one.
      if (/just booked|not available|no longer available/i.test(msg)) {
        const lostAt = new Date(slot.startsAt).getTime();
        // Take it off the calendar too; the rest of the loaded times still stand.
        setOpenDays((prev) => Object.fromEntries(
          Object.entries(prev).map(([k, list]) => [k, list.filter((s) => new Date(s.startsAt).getTime() !== lostAt)]),
        ));
        setLostSlot(slot);
        setSlot(null);
        setSlotSuggestion(null);
        setStep(1);
        setSlotNotice('taken');
      } else {
        setPayErr(msg);
      }
    } finally {
      setConfirming(false);
    }
  };

  // Fetch Razorpay's checkout script while the client reads the review ticket.
  useEffect(() => {
    if (step === 4) loadRazorpay().catch(() => {});
  }, [step]);

  // Logging in from the modal continues straight to payment — once the new
  // token is in state, so pay() is the fresh one that sees it.
  useEffect(() => {
    if (pendingPay && token && user) { setPendingPay(false); pay(); }
  }, [pendingPay, token, user, pay]);

  /* ------------------------------ view ---------------------------------- */

  if (loadErr) {
    return <div className="bf"><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="bf-in"><p className="bf-note">{loadErr}</p></div></div>;
  }
  if (!therapist) {
    return <div className="bf"><style dangerouslySetInnerHTML={{ __html: CSS }} /><div className="bf-in"><p className="bf-note">Loading…</p></div></div>;
  }

  const zone = zoneLabel(tz);
  const showIst = slot && !sameAsIst(tz);

  // Review ticket
  const photo = therapist.profile_picture_url || therapist.cover_image_url || '';
  const role = therapist.designation || therapist.title || '';
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const planSessions = readType(plan || {}).sessions || 1;

  return (
    <div className="bf">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="bf-in">
        <button type="button" className="bf-back" onClick={back} aria-label="Back"><Arrow /></button>

        {authLoading ? (
          <p className="bf-note">Loading…</p>
        ) : packageParam && !pkgMode ? (
          <div>
            <p className={pkgErr ? 'bf-err' : 'bf-note'}>{pkgErr || 'Loading your package…'}</p>
            {pkgErr && !isAuthenticated() && (
              <button type="button" className="bf-next" onClick={() => { setAuthFor('package'); setAuthOpen(true); }}>Log in</button>
            )}
          </div>
        ) : booked ? (
          <div className="bf-done">
            <span className="bf-done-icon" aria-hidden>✓</span>
            <div className="bf-done-h">Session booked</div>
            <div className="bf-done-p">
              Your session with {name} on{' '}
              <strong>{dateLabel(booked.startsAt, tz, { weekday: 'long', day: 'numeric', month: 'long' })}</strong> at{' '}
              <strong>{timeLabel(booked.startsAt, tz)}</strong> ({zone}) is booked from your package.
              We&apos;ll email and WhatsApp you the Google Meet link shortly.
            </div>
            <div className="bf-done-actions">
              <button type="button" className="bf-next" onClick={() => router.push('/profile/sessions')}>View my sessions</button>
              {booked.left > 0 && (
                <button type="button" className="bf-link" onClick={() => window.location.reload()}>
                  Book another session ({booked.left} left)
                </button>
              )}
            </div>
          </div>
        ) : needsPhone ? (
          <>
            <h1 className="bf-h">{otpSent ? 'Enter the code we sent you' : "Let's start with your mobile number"}</h1>
            <p className="bf-sub">
              {otpSent
                ? 'We sent a 6-digit code on WhatsApp. It is valid for 5 minutes.'
                : "We'll send a 6-digit code on WhatsApp to confirm it's you. Your booking details and Meet link come to this number."}
            </p>

            <div className="bf-otp">
              {!otpSent ? (
                <>
                  <label className="bf-otp-label">Mobile number (on WhatsApp)
                    <span className="bf-phone">
                      <input
                        className="bf-dial" value={otpDial} aria-label="Country code"
                        onChange={(e) => setOtpDial(e.target.value.replace(/[^\d+]/g, ''))}
                      />
                      <input
                        value={otpNumber} inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210"
                        onChange={(e) => setOtpNumber(e.target.value.replace(/[^\d\s]/g, ''))}
                        onKeyDown={(e) => { if (e.key === 'Enter' && otpNumber.replace(/\D/g, '').length >= 6) sendOtp(); }}
                      />
                    </span>
                  </label>
                  <button
                    type="button" className="bf-next"
                    disabled={otpBusy || resendIn > 0 || otpNumber.replace(/\D/g, '').length < 6}
                    onClick={sendOtp}
                  >
                    {otpBusy ? 'Sending…' : resendIn > 0 ? `Send code (${resendIn}s)` : 'Send code'}
                  </button>
                </>
              ) : (
                <>
                  <p className="bf-otp-to">
                    Code sent to <strong>{otpPhone}</strong>
                    <button type="button" className="bf-link" onClick={changeNumber}>Change</button>
                  </p>
                  <input
                    className="bf-code" value={otpCode} inputMode="numeric" autoComplete="one-time-code"
                    maxLength={otpLen} aria-label={`${otpLen}-digit code`} placeholder={'•'.repeat(otpLen)} autoFocus
                    onChange={(e) => {
                      const code = e.target.value.replace(/\D/g, '').slice(0, otpLen);
                      setOtpCode(code);
                      if (code.length === otpLen) verifyOtp(code);
                    }}
                  />
                  <button type="button" className="bf-next" disabled={otpBusy || otpCode.length !== otpLen} onClick={() => verifyOtp()}>
                    {otpBusy ? 'Checking…' : 'Verify and continue'}
                  </button>
                  <p className="bf-otp-resend">
                    {resendIn > 0
                      ? `You can ask for a new code in ${resendIn}s`
                      : <button type="button" className="bf-link" disabled={otpBusy} onClick={sendOtp}>Send a new code</button>}
                  </p>
                </>
              )}
              {otpNote && <p className="bf-otp-note">{otpNote}</p>}
              {otpErr && <p className="bf-err">{otpErr}</p>}
            </div>
          </>
        ) : (
        <>
        {step === 0 && (
          <>
            <h1 className="bf-h">What kind of session are you looking for?</h1>
            <div className="bf-choices">
              {typeChoices.map(([k, label]) => (
                <button key={k} type="button" className="bf-choice" onClick={() => chooseType(k)}>
                  {label}
                  <span className="bf-choice-len">{SESSION_LENGTH_LABEL[k]}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="bf-h">When would you like to meet {name}?</h1>
            {slotNotice && (
              <SlotUnavailablePopup
                reason={slotNotice}
                lostLabel={lostSlot
                  ? `${dateLabel(lostSlot.startsAt, tz, { weekday: 'short', day: 'numeric', month: 'short' })}, ${timeLabel(lostSlot.startsAt, tz)}`
                  : ''}
                suggestDate={slotSuggestion ? dateLabel(slotSuggestion.startsAt, tz, { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
                suggestTime={slotSuggestion ? timeLabel(slotSuggestion.startsAt, tz) : ''}
                searching={!slotSuggestion && daysBusy}
                onTake={() => { trackPopup('slot_unavailable', 'take_suggestion'); takeSuggestedSlot(); }}
                onSeeOthers={() => { trackPopup('slot_unavailable', 'pick_another'); setSlotNotice(''); }}
                onClose={() => { trackPopup('slot_unavailable', 'dismissed'); setSlotNotice(''); }}
              />
            )}
            <div className="bf-when">
              <div className="bf-cal">
                <div className="bf-cal-top">
                  <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">‹</button>
                  <span>{MONTHS[month.getMonth()]} {month.getFullYear()}</span>
                  <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month">›</button>
                </div>
                <div className={`bf-cal-grid ${daysBusy ? 'is-busy' : ''}`}>
                  {DAYS.map((d) => <span key={d} className="bf-dow">{d}</span>)}
                  {grid.map((d, i) => {
                    if (!d) return <span key={`x${i}`} />;
                    const key = ymd(d);
                    const free = openDays[key]?.length || 0;
                    // A day is open only when it has a free start: past days,
                    // days off and fully booked days all stay disabled.
                    const off = daysBusy || key < todayKey || free === 0;
                    return (
                      <button
                        key={key} type="button" disabled={off}
                        className={`bf-day ${day === key ? 'is-on' : ''} ${!off ? 'has-slots' : ''}`}
                        onClick={() => setDay(key)}
                      >
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
                {!daysBusy && daysErr && <p className="bf-note">We could not load the free times. Please try again.</p>}
                {!daysBusy && !daysErr && Object.keys(openDays).length === 0 && (
                  <p className="bf-note">No free times this month — try the next one.</p>
                )}
              </div>

              <div className="bf-slots">
                {day ? (
                  <>
                    <p className="bf-slots-h">
                      {fromYmd(day).getDate()} {MONTHS[fromYmd(day).getMonth()]},{' '}
                      {fromYmd(day).toLocaleDateString('en-GB', { weekday: 'long' })}
                    </p>
                    <p className="bf-slots-n">
                      {daysBusy ? 'checking…' : `${slots.length} ${slots.length === 1 ? 'time' : 'times'} available · ${SESSION_LENGTH_LABEL[kind]} each`}
                    </p>
                    <div className="bf-slot-grid">
                      {slots.map((s) => (
                        <button
                          key={s.startsAt} type="button"
                          className={`bf-slot ${slot?.startsAt === s.startsAt ? 'is-on' : ''}`}
                          // Picking a time is the answer to this step.
                          onClick={() => { setSlot(s); setSlotNotice(''); setSlotSuggestion(null); track('slot_selected', {}, { psychologistId: therapist?.id }); setStep(pkgMode ? 4 : 2); }}
                        >
                          {s.label}
                        </button>
                      ))}
                      {!daysBusy && slots.length === 0 && <p className="bf-note">No free times that day.</p>}
                    </div>
                  </>
                ) : <p className="bf-note">Pick a date to see the times.</p>}
                <p className="bf-tz">Times shown in your time zone · {zone}</p>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="bf-h">Select a session plan</h1>
            <p className="bf-eyebrow">{EYEBROW[kind]}</p>

            {singles.length > 0 && bundles.length > 0 && (
              <div className="bf-tabs">
                {['packages', 'single'].map((m) => (
                  <button
                    key={m} type="button"
                    className={`bf-tab ${effectiveMode === m ? 'is-on' : ''}`}
                    onClick={() => { setMode(m); setPlan(null); }}
                  >
                    {m === 'packages' ? 'Packages' : 'Single'}
                  </button>
                ))}
              </div>
            )}

            <div className="bf-plans">
              {shown.map((p) => {
                const { sessions } = readType(p);
                const full = unit * sessions;
                return (
                  <button
                    key={p.id} type="button"
                    className={`bf-plan ${plan?.id === p.id ? 'is-on' : ''}`}
                    // Picking a plan is the answer to this step — no Continue.
                    onClick={() => { setPlan(p); track('plan_selected', { item_kind: itemKindOf(p) }, { psychologistId: therapist?.id, value: Number(p.price) || 0 }); setStep(3); }}
                  >
                    <span className="bf-plan-n">
                      {isPsychiatrist
                        ? (sessions === 1 ? 'Single consultation' : `${sessions} consultations`)
                        : (sessions === 1 ? 'Single session' : `${sessions} sessions`)}
                    </span>
                    <span className="bf-plan-p">
                      {inr(p.price)}
                      {full > p.price && <s>{inr(full)}</s>}
                    </span>
                    <span className="bf-plan-u">
                      Per session<br />{inr(Math.round(p.price / sessions))}
                    </span>
                  </button>
                );
              })}
              {shown.length === 0 && <p className="bf-note">No plans published for this option yet.</p>}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="bf-h">About yourself</h1>
            <div className="bf-form">
              <label>Full name
                <input value={about.name} onChange={(e) => setAbout({ ...about, name: e.target.value })} autoComplete="name" />
              </label>
              <label>Email
                <input
                  type="email" value={about.email} autoComplete="email" readOnly={isAuthenticated()}
                  onChange={(e) => setAbout({ ...about, email: e.target.value })}
                />
              </label>
              <label>Age
                <input type="number" min="16" max="120" value={about.age} onChange={(e) => setAbout({ ...about, age: e.target.value })} />
              </label>
              <label>Emergency contact number
                <input value={about.emergency} onChange={(e) => setAbout({ ...about, emergency: e.target.value })} />
              </label>
            </div>
            {!isAuthenticated() && (
              <p className="bf-hint">We&apos;ll set up your Koott account with these details, so you can see and manage your sessions.</p>
            )}
            {aboutErr && (
              <p className="bf-err">
                {aboutErr}
                {emailTaken && (
                  <button type="button" className="bf-link" onClick={() => { setAuthFor('about'); setAuthOpen(true); }}>Log in</button>
                )}
              </p>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="bf-h">Review your booking</h1>
            {/* A session ticket: who and when on the left, the guest stub and
                total on the right, split by a perforated tear line. */}
            <div className="bf-ticket">
              <div className="bf-tk-main">
                <div className="bf-tk-top">
                  <span className="bf-tk-brand">Koott · Session ticket</span>
                  <span className="bf-tk-status">{pkgMode ? 'From your package' : 'Awaiting payment'}</span>
                </div>

                <div className="bf-tk-who">
                  {photo
                    ? <img className="bf-tk-photo" src={photo} alt={name} />
                    : <span className="bf-tk-photo is-empty" aria-hidden>{initials}</span>}
                  <div>
                    <p className="bf-tk-label">Your {isPsychiatrist ? 'psychiatrist' : 'therapist'}</p>
                    <p className="bf-tk-name">{name}</p>
                    {role && <p className="bf-tk-role">{role}</p>}
                  </div>
                </div>

                <div className="bf-tk-grid">
                  <div>
                    <span>Date</span>
                    <strong>{slot && dateLabel(slot.startsAt, tz, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                  </div>
                  <div>
                    <span>Time</span>
                    <strong>{slot && timeLabel(slot.startsAt, tz)}</strong>
                    <em>{zone}</em>
                  </div>
                  <div>
                    <span>Session</span>
                    <strong>{TYPE_LABEL[kind]}</strong>
                    <em>{SESSION_LENGTH_LABEL[kind]} · Google Meet</em>
                  </div>
                  <div>
                    <span>Plan</span>
                    {pkgMode ? (
                      <>
                        <strong>Session {pkgSessionNo} of {pkgTotal}</strong>
                        <em>From your package</em>
                      </>
                    ) : (
                      <>
                        <strong>{planSessions === 1 ? (isPsychiatrist ? 'Single consultation' : 'Single session') : `${planSessions} sessions`}</strong>
                        {planSessions > 1 && <em>{inr(Math.round((plan?.price || 0) / planSessions))} per session</em>}
                      </>
                    )}
                  </div>
                  {showIst && (
                    <div className="is-wide">
                      <span>India time</span>
                      <strong>{dateLabel(slot.startsAt, IST, { day: 'numeric', month: 'short' })}, {timeLabel(slot.startsAt, IST)} IST</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="bf-tk-stub">
                <div className="bf-tk-guest">
                  <span>Booked for</span>
                  <strong>{about.name}</strong>
                  <em>{about.email}</em>
                  <em>{verified?.phone || accountPhone}</em>
                  {about.emergency && <em>Emergency · {about.emergency}</em>}
                </div>
                <div className="bf-tk-total">
                  <span>Total</span>
                  <strong>{pkgMode ? inr(0) : inr(plan?.price)}</strong>
                  <em>{pkgMode ? 'Included in your package' : 'Secure payment via Razorpay'}</em>
                </div>
              </div>
            </div>
            {payErr && <p className="bf-err">{payErr}</p>}
          </>
        )}

        {/* step 1 advances on the slot you click and step 2 on the plan card,
            so neither needs the shared action row */}
        {step > 2 && (
          <div className="bf-actions">
            {step < STEPS.length - 1 ? (
              <button
                type="button" className="bf-next" disabled={!canContinue || aboutBusy}
                onClick={step === 3 ? continueAbout : () => setStep((s) => s + 1)}
              >
                {aboutBusy ? 'Saving…' : 'Continue'}
              </button>
            ) : (
              pkgMode ? (
                <button type="button" className="bf-next" disabled={confirming || !slot} onClick={confirmPackageSession}>
                  {confirming ? 'Booking…' : 'Confirm booking'}
                </button>
              ) : (
                <button type="button" className="bf-next" disabled={paying || !slot || !plan} onClick={pay}>
                  {paying ? 'Starting payment…' : 'Proceed to pay'}
                </button>
              )
            )}
          </div>
        )}

        <div className="bf-dots" aria-hidden>
          {STEPS.map((s, i) => <span key={s} className={i === step ? 'is-on' : ''} />)}
        </div>
        </>
        )}
      </div>

      {payStage && (
        <div className="bf-paying" role="status" aria-live="polite">
          <div className="bf-paying-card">
            <span className="bf-spinner" aria-hidden />
            <p className="bf-paying-h">{PAY_STAGE_TEXT[payStage]}</p>
            <p className="bf-paying-s">
              {payStage === 'confirming' ? 'Please keep this page open — it only takes a moment.' : 'Secured by Razorpay'}
            </p>
          </div>
        </div>
      )}

      {welcome && (
        <div className="bf-welcome-scrim" role="dialog" aria-modal="true" aria-labelledby="bf-welcome-h">
          <div className="bf-welcome">
            <span className="bf-welcome-icon" aria-hidden>✓</span>
            <h2 id="bf-welcome-h">We found your account</h2>
            <p>
              {welcome.name ? `Welcome back, ${welcome.name}! ` : 'Welcome back! '}
              {welcome.phone} is linked to your Koott account, so we&apos;ve signed you in.
            </p>
            <button type="button" className="bf-next" onClick={() => setWelcome(null)}>Continue booking</button>
          </div>
        </div>
      )}

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        preventReload
        onAuthSuccess={() => {
          setAuthOpen(false);
          // Logged in from "email already has an account" → on to review; else straight to payment.
          if (authFor === 'about') setStep(4);
          else if (authFor === 'pay') setPendingPay(true);
          // 'package': the package loads by itself once signed in
        }}
      />
    </div>
  );
}

const CSS = `
/* One fixed screen for every step, so the footer never shifts as the content
   changes between session type, calendar, plans, form and review. Anything
   taller than the screen scrolls inside this box. */
.bf{height:calc(100vh - 63px);overflow-y:auto;background:#fff;color:#111;}
.bf-in{max-width:1100px;margin:0 auto;padding:56px 24px 90px;}
.bf-back{background:none;border:0;cursor:pointer;color:#111;padding:0;margin:0 0 34px;display:block;}

.bf-h{
  font-family:'Inter',system-ui,sans-serif!important;font-size:30px!important;font-weight:600!important;
  letter-spacing:0!important;line-height:1.3em!important;color:#111!important;margin:0 0 26px;max-width:640px;
}
.bf-eyebrow{
  font-family:'Inter',system-ui,sans-serif!important;font-size:13px!important;font-weight:700!important;
  letter-spacing:.08em!important;color:#6B7280!important;margin:-16px 0 22px;
}

.bf-choices{display:flex;flex-direction:column;gap:14px;max-width:490px;}
.bf-choice{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  text-align:left;background:#fff;border:1px solid rgba(17,17,17,.12);border-radius:12px;
  padding:20px 22px;cursor:pointer;box-shadow:0 1px 3px rgba(17,17,17,.05);
  font-family:'Inter',system-ui,sans-serif!important;font-size:17px!important;letter-spacing:0!important;color:#111!important;
}
.bf-choice:hover{border-color:rgba(17,17,17,.3);}
.bf-choice-len{font-size:13px;color:#6B7280;white-space:nowrap;}

/* Calendar left, slots right. The divider is a border on the first column —
   as a ::before pseudo-element it took grid cell 1 and pushed the calendar
   across to the right. */
.bf-when{display:grid;grid-template-columns:1fr 1fr;gap:0;max-width:900px;}
.bf-cal{padding-right:34px;border-right:1px solid rgba(17,17,17,.1);}
.bf-slots{padding-left:34px;}
.bf-cal-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}
.bf-cal-top span{font-family:'Inter',system-ui,sans-serif!important;font-size:17px!important;letter-spacing:0!important;}
.bf-cal-top button{background:none;border:0;cursor:pointer;font-size:20px;line-height:1;color:#111;padding:4px 10px;}
.bf-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px 4px;text-align:center;transition:opacity .15s;}
.bf-cal-grid.is-busy{opacity:.55;}
.bf-dow{
  font-family:'Inter',system-ui,sans-serif!important;font-size:12px!important;letter-spacing:.04em!important;
  color:#9AA0A6!important;padding-bottom:6px;
}
.bf-day{
  position:relative;background:none;border:0;cursor:pointer;padding:8px 0 12px;border-radius:50%;
  font-family:'Inter',system-ui,sans-serif!important;font-size:15px!important;color:#111!important;
}
.bf-day:disabled{color:#C9CDD2!important;cursor:default;}
/* the green rule below is the only marker — text-decoration drew a second,
   black underline on top of it */
.bf-day.has-slots{text-decoration:none;}
/* the green rule under a day with free slots */
.bf-day.has-slots::after{
  content:'';position:absolute;left:50%;transform:translateX(-50%);bottom:4px;
  width:20px;height:2px;background:#189E4F;border-radius:2px;
}
.bf-day.is-on{background:#111;color:#fff!important;width:34px;height:34px;margin:0 auto;padding:0;}
.bf-day.is-on::after{display:none;}

.bf-slots-h{font-family:'Inter',system-ui,sans-serif!important;font-size:17px!important;letter-spacing:0!important;margin:0;}
.bf-slots-n{font-family:'Inter',system-ui,sans-serif!important;font-size:13px!important;color:#9AA0A6!important;margin:4px 0 16px;}
.bf-slot-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.bf-slot{
  background:#fff;border:1px solid rgba(17,17,17,.12);border-radius:10px;padding:16px 0;cursor:pointer;
  font-family:'Inter',system-ui,sans-serif!important;font-size:15px!important;color:#111!important;
}
.bf-slot.is-on{border-color:#189E4F;background:#F1FBF4;}
.bf-tz{
  background:#F3F5FB;border-radius:8px;margin:16px 0 0;padding:10px 12px;text-align:center;
  font-family:'Inter',system-ui,sans-serif!important;font-size:12px!important;letter-spacing:.02em!important;color:#5B6B8C!important;
}

.bf-tabs{display:flex;gap:16px;margin:0 0 22px;}
.bf-tab{
  flex:0 0 auto;min-width:170px;background:#fff;border:1px solid rgba(17,17,17,.12);border-radius:10px;
  padding:14px 0;cursor:pointer;
  font-family:'Inter',system-ui,sans-serif!important;font-size:16px!important;color:#9AA0A6!important;
}
.bf-tab.is-on{color:#111!important;border-color:rgba(17,17,17,.35);}
.bf-plans{display:grid;grid-template-columns:repeat(2,minmax(0,290px));gap:18px;}
.bf-plan{
  text-align:left;background:#fff;border:1px solid rgba(17,17,17,.12);border-radius:12px;padding:18px 20px;cursor:pointer;
}
.bf-plan.is-on{border-color:#189E4F;box-shadow:0 0 0 1px #189E4F inset;}
.bf-plan-n{display:block;font-family:'Inter',system-ui,sans-serif!important;font-size:15px!important;color:#111!important;}
.bf-plan-p{
  display:block;margin:6px 0 14px;padding-bottom:14px;border-bottom:1px solid rgba(17,17,17,.1);
  font-family:'Inter',system-ui,sans-serif!important;font-size:26px!important;font-weight:600!important;color:#111!important;
}
.bf-plan-p s{font-size:15px;font-weight:400;color:#9AA0A6;margin-left:8px;}
.bf-plan-u{display:block;font-family:'Inter',system-ui,sans-serif!important;font-size:13px!important;color:#6B7280!important;line-height:1.7em!important;}

.bf-form{display:grid;grid-template-columns:1fr 1fr;gap:18px 22px;max-width:680px;}
.bf-form label{
  display:flex;flex-direction:column;gap:7px;
  font-family:'Inter',system-ui,sans-serif!important;font-size:13px!important;color:#6B7280!important;
}
.bf-form input{
  border:1px solid rgba(17,17,17,.15);border-radius:10px;padding:12px 14px;
  font-family:'Inter',system-ui,sans-serif!important;font-size:15px!important;color:#111!important;
}
.bf-form input:focus{outline:none;border-color:#189E4F;}
.bf-phone{display:flex;gap:8px;}
.bf-phone .bf-dial{width:80px;flex:none;}
.bf-phone input:last-child{flex:1;min-width:0;}

/* Review: a session ticket. Main part left, stub right, joined by a dashed
   tear line with a punched notch at each end (circles in the page colour). */
.bf-ticket{
  display:grid;grid-template-columns:minmax(0,1fr) 280px;max-width:860px;
  background:#fff;border:1px solid rgba(17,17,17,.1);border-radius:20px;
  box-shadow:0 18px 40px -24px rgba(17,60,35,.35),0 2px 6px rgba(17,17,17,.04);
}
.bf-tk-main{padding:26px 30px 28px;}
.bf-tk-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:22px;}
.bf-tk-brand{
  font-family:'Inter',system-ui,sans-serif!important;font-size:12px!important;font-weight:700!important;
  letter-spacing:.12em!important;text-transform:uppercase;color:#189E4F!important;
}
.bf-tk-status{
  font-family:'Inter',system-ui,sans-serif!important;font-size:12px!important;font-weight:600!important;
  color:#8A5A00!important;background:#FFF6E0;border-radius:999px;padding:4px 10px;
}
.bf-tk-who{display:flex;align-items:center;gap:18px;padding-bottom:22px;border-bottom:1px solid rgba(17,17,17,.08);}
.bf-tk-photo{
  width:84px;height:84px;flex:none;border-radius:18px;object-fit:cover;object-position:top;
  background:#E8F5EC;box-shadow:0 0 0 4px #F1FBF4;
}
.bf-tk-photo.is-empty{
  display:flex;align-items:center;justify-content:center;
  font-family:'Inter',system-ui,sans-serif!important;font-size:26px!important;font-weight:600!important;color:#189E4F!important;
}
.bf-tk-label{
  margin:0 0 4px;font-family:'Inter',system-ui,sans-serif!important;font-size:12px!important;
  letter-spacing:.06em!important;text-transform:uppercase;color:#9AA0A6!important;
}
.bf-tk-name{
  margin:0;font-family:'Inter',system-ui,sans-serif!important;font-size:22px!important;font-weight:600!important;
  line-height:1.25em!important;color:#111!important;
}
.bf-tk-role{margin:3px 0 0;font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;color:#6B7280!important;}
.bf-tk-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px 28px;padding-top:22px;}
.bf-tk-grid .is-wide{grid-column:1 / -1;}
.bf-tk-grid span,.bf-tk-guest span,.bf-tk-total span{
  display:block;margin-bottom:5px;font-family:'Inter',system-ui,sans-serif!important;font-size:12px!important;
  letter-spacing:.06em!important;text-transform:uppercase;color:#9AA0A6!important;
}
.bf-tk-grid strong,.bf-tk-guest strong{
  display:block;font-family:'Inter',system-ui,sans-serif!important;font-size:16px!important;font-weight:700!important;color:#111!important;
}
.bf-tk-grid em,.bf-tk-guest em,.bf-tk-total em{
  display:block;margin-top:3px;font-style:normal;font-family:'Inter',system-ui,sans-serif!important;
  font-size:13px!important;color:#6B7280!important;overflow-wrap:anywhere;
}
.bf-tk-stub{
  position:relative;display:flex;flex-direction:column;justify-content:space-between;gap:26px;
  padding:26px 26px 28px;background:#F1FBF4;border-left:2px dashed rgba(24,158,79,.35);
  border-radius:0 20px 20px 0;
}
.bf-tk-stub::before,.bf-tk-stub::after{
  content:'';position:absolute;left:-13px;width:24px;height:24px;border-radius:50%;
  background:#fff;border:1px solid rgba(17,17,17,.1);
}
.bf-tk-stub::before{top:-13px;clip-path:inset(50% 0 0 0);}
.bf-tk-stub::after{bottom:-13px;clip-path:inset(0 0 50% 0);}
.bf-tk-total{padding-top:20px;border-top:1px solid rgba(24,158,79,.2);}
.bf-tk-total strong{
  display:block;font-family:'Inter',system-ui,sans-serif!important;font-size:32px!important;font-weight:600!important;
  line-height:1.1em!important;color:#0F6B35!important;
}

.bf-actions{margin-top:34px;}
.bf-next{
  background:#189E4F;color:#fff;border:0;border-radius:10px;padding:14px 34px;cursor:pointer;
  font-family:'Inter',system-ui,sans-serif!important;font-size:16px!important;font-weight:600!important;
}
.bf-next:disabled{background:#C9D6CE;cursor:default;}
.bf-note{font-family:'Inter',system-ui,sans-serif!important;font-size:15px!important;color:#6B7280!important;}
.bf-err{font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;color:#B42318!important;margin:16px 0 0;}

/* Mobile number + WhatsApp code (shown before the steps) */
.bf-sub{
  font-family:'Inter',system-ui,sans-serif!important;font-size:15px!important;line-height:1.6em!important;
  color:#6B7280!important;margin:-12px 0 26px;max-width:520px;
}
.bf-otp{display:flex;flex-direction:column;align-items:flex-start;gap:18px;max-width:420px;}
.bf-otp .bf-err{margin:0;}
.bf-otp-label{
  display:flex;flex-direction:column;gap:7px;width:100%;
  font-family:'Inter',system-ui,sans-serif!important;font-size:13px!important;color:#6B7280!important;
}
.bf-otp input{
  border:1px solid rgba(17,17,17,.15);border-radius:10px;padding:12px 14px;min-width:0;
  font-family:'Inter',system-ui,sans-serif!important;font-size:16px!important;color:#111!important;
}
.bf-otp input:focus{outline:none;border-color:#189E4F;}
.bf-otp .bf-code{
  width:220px;text-align:center;letter-spacing:.45em;padding:14px 10px 14px 18px;
  font-family:'Inter',system-ui,sans-serif!important;font-size:26px!important;font-weight:600!important;
}
.bf-otp-to{margin:0;font-family:'Inter',system-ui,sans-serif!important;font-size:15px!important;color:#111!important;}
.bf-otp-resend{margin:0;font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;color:#6B7280!important;}
.bf-otp-note{
  margin:0;background:#FFF6E0;border-radius:8px;padding:10px 12px;
  font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;color:#8A5A00!important;
}
.bf-link{
  background:none;border:0;padding:0;margin-left:10px;cursor:pointer;text-decoration:underline;
  font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;font-weight:600!important;color:#189E4F!important;
}
.bf-link:disabled{opacity:.5;cursor:default;}
.bf-otp-resend .bf-link{margin-left:0;}
.bf-hint{
  margin:18px 0 0;max-width:680px;font-family:'Inter',system-ui,sans-serif!important;
  font-size:13px!important;color:#6B7280!important;
}
.bf-form input[readonly]{background:#F7F8FA;color:#6B7280!important;}

/* "We found your account" — shown once after the code signs a returning client in */
.bf-welcome-scrim{
  position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;
  background:rgba(10,30,20,.45);
}
.bf-welcome{
  width:100%;max-width:400px;background:#fff;border-radius:18px;padding:30px 28px 26px;text-align:center;
  box-shadow:0 24px 60px -20px rgba(0,0,0,.4);
}
.bf-welcome-icon{
  display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:50%;
  background:#F1FBF4;color:#189E4F;font-size:24px;font-weight:700;margin-bottom:14px;
}
.bf-welcome h2{
  margin:0 0 10px;font-family:'Inter',system-ui,sans-serif!important;font-size:22px!important;
  font-weight:600!important;color:#111!important;
}
.bf-welcome p{
  margin:0 0 22px;font-family:'Inter',system-ui,sans-serif!important;font-size:15px!important;
  line-height:1.6em!important;color:#4B5563!important;
}
.bf-welcome .bf-next{width:100%;}

/* Package session booked (no payment) */
.bf-done{max-width:560px;}
.bf-done-icon{
  display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;
  background:#F1FBF4;color:#189E4F;font-size:26px;font-weight:700;margin-bottom:16px;
}
.bf-done-h{
  font-family:'Inter',system-ui,sans-serif!important;font-size:28px;font-weight:600;line-height:1.3;color:#111;
}
.bf-done-p{
  margin-top:10px;font-family:'Inter',system-ui,sans-serif!important;font-size:15px;line-height:1.6;color:#4B5563;
}
.bf-done-p strong{color:#111;}
.bf-done-actions{display:flex;align-items:center;flex-wrap:wrap;gap:18px;margin-top:26px;}
.bf-done-actions .bf-link{margin-left:0;}

/* Between "Proceed to pay" and Razorpay's window, and after paying */
.bf-paying{
  position:fixed;inset:0;z-index:900;display:flex;align-items:center;justify-content:center;padding:20px;
  background:rgba(255,255,255,.88);backdrop-filter:blur(2px);animation:bf-fade .18s ease;
}
.bf-paying-card{text-align:center;max-width:340px;}
.bf-spinner{
  display:inline-block;width:46px;height:46px;border-radius:50%;margin-bottom:18px;
  border:3px solid #DDEFE3;border-top-color:#189E4F;animation:bf-spin .8s linear infinite;
}
.bf-paying-h{
  margin:0 0 6px;font-family:'Inter',system-ui,sans-serif!important;font-size:19px!important;
  font-weight:600!important;color:#111!important;
}
.bf-paying-s{margin:0;font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;color:#6B7280!important;}
@keyframes bf-spin{to{transform:rotate(360deg);}}
@keyframes bf-fade{from{opacity:0;}}
@media (prefers-reduced-motion:reduce){.bf-spinner{animation-duration:2.4s;}.bf-paying{animation:none;}}

.bf-dots{display:flex;gap:6px;margin-top:46px;}
.bf-dots span{width:18px;height:3px;border-radius:2px;background:#E3E6EA;}
.bf-dots span.is-on{background:#111;}

@media (max-width:900px){
  .bf-when{grid-template-columns:1fr;}
  .bf-cal{padding-right:0;border-right:0;padding-bottom:26px;border-bottom:1px solid rgba(17,17,17,.1);}
  .bf-slots{padding-left:0;padding-top:24px;}
  .bf-plans,.bf-form{grid-template-columns:1fr;}
}
@media (max-width:720px){
  .bf-ticket{grid-template-columns:1fr;}
  .bf-tk-main{padding:22px 20px 24px;}
  .bf-tk-stub{border-left:0;border-top:2px dashed rgba(24,158,79,.35);border-radius:0 0 20px 20px;padding:24px 20px;}
  .bf-tk-stub::before,.bf-tk-stub::after{top:-13px;bottom:auto;}
  .bf-tk-stub::before{left:-13px;clip-path:inset(0 0 0 50%);}
  .bf-tk-stub::after{left:auto;right:-13px;clip-path:inset(0 50% 0 0);}
  .bf-tk-photo{width:68px;height:68px;border-radius:16px;}
  .bf-tk-name{font-size:19px!important;}
}
`;
