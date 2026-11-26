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
  SESSION_MINUTES,
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

/* Figma draws a third option, "Others", beside the two therapy kinds. It has no
   length and no plans of its own, so it opens a conversation with the care team
   rather than a booking that could not be priced. */
const THERAPY_TYPES = [['individual', 'Individual therapy'], ['couple', 'Couple therapy'], ['others', 'Others']];
// Koott 2.0 draws each kind with its own 42 px illustration (public/design/book2).
// "others" has no illustration of its own in Figma yet; borrowing another kind's
// picture would say the wrong thing, so it shows none (the img hides itself).
const K2_TYPE_ART = { individual: 'individual', couple: 'couple', others: 'others', psychiatry_15: 'psychiatry', psychiatry_30: 'psychiatry' };
// The day cards name the weekday in full caps, as the design does.
const FX_DOW_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Figma "6 · Session mode" (7858:85858), in its order.
const K2_MODES = [['audio', 'Audio call'], ['video', 'Video call'], ['chat', 'Chat']];
const K2_MODE_LABEL = { audio: 'Audio call', video: 'Video call', chat: 'Chat' };
const K2_MODE_ICON = {
  audio: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M18 14.1v2.5a1.7 1.7 0 0 1-1.8 1.7 16.5 16.5 0 0 1-7.2-2.6 16.2 16.2 0 0 1-5-5A16.5 16.5 0 0 1 1.4 3.4 1.7 1.7 0 0 1 3.1 1.5h2.5a1.7 1.7 0 0 1 1.7 1.4c.1.8.3 1.6.6 2.4a1.7 1.7 0 0 1-.4 1.7l-1 1a13.3 13.3 0 0 0 5 5l1-1a1.7 1.7 0 0 1 1.8-.4c.8.3 1.6.5 2.4.6a1.7 1.7 0 0 1 1.4 1.8Z" fill="#4C9F62" /></svg>,
  video: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M18.3 6.7 14.2 10l4.1 3.3V6.7Z" fill="#4C9F62" /><rect x="1.7" y="5" width="11.7" height="10" rx="2.5" fill="#4C9F62" /></svg>,
  chat: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.3 4.2A2.5 2.5 0 0 1 5.8 1.7h8.4a2.5 2.5 0 0 1 2.5 2.5v6.6a2.5 2.5 0 0 1-2.5 2.5H8.1l-3.4 2.9a.8.8 0 0 1-1.4-.6V4.2Z" fill="#4C9F62" /></svg>,
};
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

/* Figma "Stepper/ Booking" (1123:9829) and "Post payment screens" (1123:17819). */
const FX_TYPE_LABEL = {
  individual: 'Individual Therapy', couple: 'Couple Therapy',
  psychiatry_15: '15-min consultation', psychiatry_30: '30-min consultation',
};
const FX_TYPE_SHORT = { individual: 'Individual', couple: 'Couple', psychiatry_15: 'Psychiatry', psychiatry_30: 'Psychiatry' };
const FX_TYPE_ICON = { individual: 'user-03', couple: 'users-02', psychiatry_15: 'user-03', psychiatry_30: 'user-03' };
const FX_DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const FX_PERIODS = [['morning', 'slot-morning', 'Morning'], ['afternoon', 'slot-afternoon', 'Afternoon'], ['evening', 'slot-evening', 'Evening']];
const inr2 = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pairsOf = (list) => list.reduce((acc, x, i) => { if (i % 2 === 0) acc.push([x]); else acc[acc.length - 1].push(x); return acc; }, []);

/** The five step dots: the current one is a pill (Figma Frame 5058). */
const StepDots = ({ at }) => (
  <span className="bfx-dots" aria-hidden>
    {[0, 1, 2, 3, 4].map((i) => <i key={i} className={i === at ? 'is-on' : i < at ? 'is-done' : ''} />)}
  </span>
);

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

/**
 * After Razorpay says paid: confirm with the server here (the booking is saved in a
 * second or two; Meet link, emails and WhatsApp follow in the background) and show
 * "Session booked" without leaving the page. If that does not answer in time, hand
 * over to the success page as before, which keeps checking (the webhook is the backstop).
 * Returns { ok, sessionId } | { taken, message } | null (handed over).
 */
async function confirmPayment(resp) {
  const ids = {
    razorpay_order_id: resp.razorpay_order_id,
    razorpay_payment_id: resp.razorpay_payment_id,
    razorpay_signature: resp.razorpay_signature,
  };
  try {
    sessionStorage.setItem('razorpay_payment', JSON.stringify({ ...ids, timestamp: Date.now() }));
  } catch (_) { /* private mode */ }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(`${BACKEND}/payment/success`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ids), signal: ctrl.signal,
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success !== false && json.data?.sessionId) return { ok: true, sessionId: json.data.sessionId };
    if (res.status === 409 && json.code === 'SLOT_ALREADY_BOOKED') {
      return { taken: true, message: json.message || 'That time was just booked by someone else. Your payment is being refunded.' };
    }
  } catch (_) { /* slow or offline: the success page takes over */ } finally {
    clearTimeout(timer);
  }
  finishPayment(resp);
  return null;
}

/** Country picker of the WhatsApp number field (Figma: flag, ISO code, chevron). */
const DIAL_COUNTRIES = [
  ['IN', '+91', '🇮🇳'], ['AE', '+971', '🇦🇪'], ['SA', '+966', '🇸🇦'], ['QA', '+974', '🇶🇦'],
  ['KW', '+965', '🇰🇼'], ['OM', '+968', '🇴🇲'], ['BH', '+973', '🇧🇭'], ['US', '+1', '🇺🇸'],
  ['GB', '+44', '🇬🇧'], ['CA', '+1', '🇨🇦'], ['AU', '+61', '🇦🇺'], ['SG', '+65', '🇸🇬'],
  ['MY', '+60', '🇲🇾'], ['NZ', '+64', '🇳🇿'], ['DE', '+49', '🇩🇪'], ['IE', '+353', '🇮🇪'],
];

const Arrow = ({ dir = 'left' }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {dir === 'left' ? <path d="M19 12H5M11 18l-6-6 6-6" /> : <path d="M9 6l6 6-6 6" />}
  </svg>
);

export default function BookingFlow({ slug }) {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
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
  /* The coupon on "Review and pay". The code is all the client ever sends: the
     server re-checks it when the order is created and decides the amount. */
  const [couponText, setCouponText] = useState('');
  const [coupon, setCoupon] = useState(null);      // { code, label, discountAmount, finalAmount }
  const [couponState, setCouponState] = useState(''); // '' | 'checking' | 'bad'
  const [couponErr, setCouponErr] = useState('');
  const [verifyRestoredSlot, setVerifyRestoredSlot] = useState(false);
  const [slotNotice, setSlotNotice] = useState('');        // 'passed' | 'taken' — a saved time that no longer stands
  const [lostSlot, setLostSlot] = useState(null);          // that time, to suggest the nearest free one
  const [slotSuggestion, setSlotSuggestion] = useState(null);
  const [about, setAbout] = useState({
    name: '', email: '', age: '', dial: '+91', phone: '', emergency: '',
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [needLogin, setNeedLogin] = useState(false); // testing-phase code on a number with an account
  const [reverify, setReverify] = useState(false); // after that log-in: verify again, signed in
  const [pendingPay, setPendingPay] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState('');
  /* Figma "12 · Payment failed" (7858:86086). The slot really is held — the order
     takes a lock in slot_locks for 15 minutes — so the screen says so and counts
     down to that moment rather than inventing a number. */
  const [payFailed, setPayFailed] = useState(null);
  /* A real payment failure cannot be produced to order, so in development
     ?payfail=1 draws that screen with the slot and plan already chosen. It is
     compiled out of a production build. */
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('payfail') !== '1') return;
    setPayFailed({ reason: 'preview' });
    setHeldUntil(new Date(Date.now() + 9 * 60000 + 42000).toISOString());
  }, []);
  const [heldUntil, setHeldUntil] = useState(null);
  const [heldLeft, setHeldLeft] = useState('');
  /* Figma "Notes to your therapist" (8074:13727) and the "Booking for someone
     else? Add details" row on step 1 are the same sheet: one line the therapist
     reads before the session, kept on the client as client_message. */
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [payStage, setPayStage] = useState(null);         // 'order' | 'opening' | 'confirming'

  // Booking a session from a package the client already holds (?package=<client_packages id>)
  const [packageParam, setPackageParam] = useState(null);
  const [pkgMode, setPkgMode] = useState(null);           // that client_packages row, once loaded
  const [pkgErr, setPkgErr] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [booked, setBooked] = useState(null);
  const [paidDone, setPaidDone] = useState(null);         // { startsAt, sessionId } after a paid booking
            // { startsAt, left } after Confirm booking

  /* ------------------------- mobile number + code ------------------------ */

  const [verified, setVerified] = useState(null);         // { phone, token } once the code checks out
  const [otpDial, setOtpDial] = useState('+91');
  const [otpCountry, setOtpCountry] = useState('IN');
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
  /* "About yourself" is not in the Koott 2.0 flow: a signed-in client already gave
     their name and email when they signed in, so the step is skipped for them and
     kept for anyone booking without an account. */
  const needsAbout = !(isAuthenticated() && isClient && about.name.trim() && about.email.trim());
  // Staff, therapists and admins can't book (sessions belong to a client account): say so on
  // "About yourself" rather than leaving them stuck. The email box is locked only when the
  // signed-in client's account actually supplies it; otherwise it stays typeable.
  const nonClientSignedIn = isAuthenticated() && Boolean(user?.role) && !isClient;
  const emailLocked = isAuthenticated() && isClient && Boolean(user?.email);

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
    setOtpBusy(true); setOtpErr(''); setNeedLogin(false);
    try {
      const d = await postOtp('verify', { phone: otpPhone, code, psychologistId: therapist?.id, analytics: analyticsContext() });
      // Testing-phase code on a number that already has an account: log in with the password.
      if (d.signInRequired) {
        setOtpErr('This number already has a Koott account. Please log in to continue.');
        setNeedLogin(true);
        return;
      }
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

  // Runs on the render after log-in, so the request carries the new sign-in.
  useEffect(() => {
    if (reverify && token) { setReverify(false); verifyOtp(); }
  }, [reverify, token]); // eslint-disable-line react-hooks/exhaustive-deps

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
        if (json.code === 'EMAIL_EXISTS' || json.code === 'SIGN_IN_REQUIRED') setEmailTaken(true);
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
    // The profile page's list can be minutes old: check the time is still free once
    // this month's times load (same check as a resumed draft).
    setVerifyRestoredSlot(true);
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

  // Other people book too. While this page is open the free times are re-read every
  // 30 s and whenever the tab comes back into view, quietly (no "checking…" flicker),
  // so a time someone else just took disappears from the calendar. A time this
  // visitor already picked is checked below.
  const [liveTick, setLiveTick] = useState(0);
  useEffect(() => {
    const bump = () => { if (document.visibilityState === 'visible') setLiveTick((n) => n + 1); };
    const timer = setInterval(bump, 30 * 1000);
    document.addEventListener('visibilitychange', bump);
    window.addEventListener('focus', bump);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', bump);
      window.removeEventListener('focus', bump);
    };
  }, []);
  const [liveChecked, setLiveChecked] = useState(0);       // bumps after each quiet re-read
  useEffect(() => {
    if (!therapist || !liveTick || daysBusy || paying || confirming || booked) return undefined;
    let off = false;
    const from = ymd(new Date(month.getFullYear(), month.getMonth(), 1));
    const to = ymd(new Date(month.getFullYear(), month.getMonth() + 1, 0));
    fetchSlots(API, therapist.id, from, to, kind, tz)
      .then((map) => { if (!off) { setOpenDays(map); setLiveChecked((n) => n + 1); } })
      .catch(() => { /* keep what is shown; the next tick tries again */ });
    return () => { off = true; };
  }, [liveTick]); // eslint-disable-line react-hooks/exhaustive-deps

  // The time this visitor picked was taken by someone else after a re-read: back to
  // the calendar with the "just booked" notice and the nearest free time. Only judged
  // when the loaded month holds that day (otherwise the list says nothing about it).
  useEffect(() => {
    if (!liveChecked || !slot || !day || step < 2 || paying || confirming || booked || slotNotice) return;
    const local = fromYmd(day);
    if (local.getFullYear() !== month.getFullYear() || local.getMonth() !== month.getMonth()) return;
    const stillFree = (openDays[day] || []).some(
      (s) => new Date(s.startsAt).getTime() === new Date(slot.startsAt).getTime(),
    );
    if (!stillFree) {
      setLostSlot(slot);
      setSlot(null);
      setSlotSuggestion(null);
      setStep(1);
      setSlotNotice('taken');
    }
  }, [liveChecked]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------------------- derived --------------------------------- */

  const name = therapist
    ? (therapist.name || `${therapist.first_name || ''} ${therapist.last_name || ''}`.trim())
    : '';

  const slots = day ? (openDays[day] || []) : [];
  const todayKey = ymd(new Date());

  // Psychiatrists offer 15/30-min consultations; therapists individual/couple.
  const isPsychiatrist = isPsychiatristRecord(therapist);
  const typeChoices = isPsychiatrist ? PSYCHIATRY_TYPES : THERAPY_TYPES;

  /* The design leads with a strip of days rather than a month. A fortnight is
     enough for almost every booking; the month calendar is behind "View all". */
  const [showMonth, setShowMonth] = useState(false);
  /* Figma "6 · Session mode": how and where the session is held. It sits between
     the plan and About yourself without renumbering the steps — the plan step
     opens it, and choosing a mode moves on. */
  const [modeOpen, setModeOpen] = useState(false);
  const [sessionPlace, setSessionPlace] = useState('online');
  const [sessionMode, setSessionMode] = useState('video');
  /* The countdown on the payment-failed screen. It runs only while that screen is
     up, and it counts to the real expiry of the hold the order took. */
  useEffect(() => {
    if (!payFailed || !heldUntil) return undefined;
    const tick = () => {
      const left = new Date(heldUntil).getTime() - Date.now();
      if (left <= 0) { setHeldLeft(''); return; }
      const m = Math.floor(left / 60000);
      const sec = Math.floor((left % 60000) / 1000);
      setHeldLeft(`${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [payFailed, heldUntil]);

  const k2Days = useMemo(() => {
    const out = [];
    const d0 = new Date();
    d0.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i += 1) out.push(new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + i));
    return out;
  }, []);
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
    Boolean(about.name.trim() && /.+@.+\..+/.test(about.email)) && !nonClientSignedIn,
    true,
  ][step];

  // Package mode has only the calendar and the review; otherwise one step back, leaving
  // the page from the first step (or the mobile-number step).
  /* "Leaving already?" (Figma 1123:10602 steps, 1123:10485 review): a click on a link that
     leaves an unfinished booking asks once; asking again would trap the client. */
  const [leaveAsk, setLeaveAsk] = useState(null); // { href } while the popup is open
  const [leaveAsked, setLeaveAsked] = useState(false);
  const inBooking = !paidDone && !booked && !authLoading && !needsPhone && !pkgMode && (step >= 1 || !!slot);
  useEffect(() => {
    if (!inBooking || leaveAsked) return undefined;
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.closest('.bf') || a.target === '_blank') return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      e.koottHeld = true; // marks the click as handled here, not a real navigation
      setLeaveAsk({ href: url.pathname + url.search + url.hash });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [inBooking, leaveAsked]);
  const stayHere = () => { setLeaveAsk(null); setLeaveAsked(true); };
  // Review has its own question ("still reserved"), so it may ask once more there.
  useEffect(() => { if (step === 4) setLeaveAsked(false); }, [step]);

  const back = () => {
    if (modeOpen) { setModeOpen(false); return; }
    if (pkgMode) { if (step <= 1) router.back(); else setStep(1); return; }
    if (needsPhone || step === 0) router.back();
    // Step 3 is skipped on the way forward for a signed-in client, so it is skipped
    // on the way back too, or Back would land on a page they never saw.
    else setStep((s) => (s === 4 && !needsAbout ? 2 : s - 1));
  };

  const chooseType = (nextKind) => {
    // Slots differ by session length, so a time picked for the other type no longer applies.
    if (nextKind !== kind) { setSlot(null); setDay(null); }
    setKind(nextKind);
    setPlan(null);
    setMode('packages');
    setStep(1);
  };

  /* ------------------------------ coupon -------------------------------- */

  const applyCoupon = useCallback(async (amount) => {
    const code = couponText.trim().toUpperCase();
    if (!code || couponState === 'checking') return;
    setCouponState('checking'); setCouponErr('');
    try {
      const res = await fetch(`${API}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ code, amount }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        setCoupon(null); setCouponState('bad');
        setCouponErr(json.message || 'That code did not work.');
        return;
      }
      setCoupon(json.data || null);
      setCouponState('');
      setCouponText('');
      track('coupon_applied', { code });
    } catch (_) {
      setCouponState('bad');
      setCouponErr('We could not check that code just now.');
    }
  }, [couponText, couponState, token]);

  const removeCoupon = useCallback(() => {
    setCoupon(null); setCouponState(''); setCouponErr(''); setCouponText('');
  }, []);

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
        // the answers to "How would you like to talk?"; they ride the order and
        // are written onto the session when the payment succeeds
        sessionMode,
        sessionPlace,
        analytics: analyticsContext(), // where this booking came from (frozen server-side)
        // Only ever the code: createPaymentOrder validates it again and sets the price.
        couponCode: coupon?.code || undefined,
      });
      if (order && order.success === false) throw new Error(order.message);
      const o = order?.data ?? order;
      if (o?.slotHeldUntil) setHeldUntil(o.slotHeldUntil);

      setPayStage('opening');
      await razorpayReady;
      const rz = new window.Razorpay({
        key: o.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: o.orderId,
        amount: o.amountInPaise,
        currency: o.currency || 'INR',
        name: 'Koott',
        // Without this Razorpay shows the logo saved on the Razorpay account (the test
        // account still has the old Little Care one).
        image: `${window.location.origin}/favicon-512.png`,
        description: `${plan.name || TYPE_LABEL[kind]} with ${name}`,
        prefill: { name: about.name, email: about.email, contact: verified?.phone || accountPhone || '' },
        // No Razorpay saved-card sign-in (its extra SMS OTP); the bank's OTP still applies.
        remember_customer: false,
        notes: o.notes || {},
        theme: { color: '#189E4F' },
        handler: async (resp) => {
          clearDraft(); setPayStage('confirming');
          const done = await confirmPayment(resp);
          if (!done) return; // handed over to the success page
          setPaying(false); setPayStage(null);
          if (done.taken) { setPayErr(done.message); return; }
          setPaidDone({ startsAt: slot.startsAt, sessionId: done.sessionId, orderId: resp.razorpay_order_id, amount: plan?.price, kind });
          try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch (_) { /* old browsers */ }
        },
        modal: { ondismiss: () => { setPaying(false); track('payment_dismissed'); } },
      });
      rz.on('payment.failed', (resp) => {
        // Razorpay's error code only — never its free-text description.
        const reason = String(resp?.error?.reason || resp?.error?.code || 'unknown').toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 60);
        track('payment_attempt_failed', { code: /^[a-z]/.test(reason) ? reason : 'unknown' });
        setPayErr('');
        setPayFailed({ reason: resp?.error?.description || '' });
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
      setPaying(false);
      setPayStage(null);
      // Someone else took the time a moment ago (the server checks before any money
      // moves): back to the calendar with the nearest free time, not a dead-end error.
      if (/no longer available|already booked|just booked/i.test(e?.message || '') && slot) {
        const lostAt = new Date(slot.startsAt).getTime();
        setOpenDays((prev) => Object.fromEntries(
          Object.entries(prev).map(([k, list]) => [k, list.filter((s) => new Date(s.startsAt).getTime() !== lostAt)]),
        ));
        setLostSlot(slot);
        setSlot(null);
        setSlotSuggestion(null);
        setStep(1);
        setSlotNotice('taken');
        return;
      }
      setPayErr(e?.message || 'We could not start the payment. Please try again.');
      // Verification lapsed (token older than 2 h): ask for the number again.
      if (/verify your mobile/i.test(e?.message || '')) forgetVerified();
    }
  }, [isAuthenticated, user, therapist, slot, plan, about, name, tz, verified, accountPhone, kind]);

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
  // Figma writes the zone as "Asia/Calcutta (GMT+5:30)" (schedule) and "Asia/Calcutta GMT+5:30" (review)
  const zoneParts = String(zone).split(' · ');
  const zoneParen = zoneParts.length === 2 ? `${zoneParts[0]} (${zoneParts[1]})` : zone;
  const zoneSpace = zoneParts.length === 2 ? `${zoneParts[0]} ${zoneParts[1]}` : zone;
  // "+91 994 578 5625", as in the design
  const phoneShown = ((p) => { const m = String(p || '').match(/^\+91(\d{3})(\d{3})(\d{4})$/); return m ? `+91 ${m[1]} ${m[2]} ${m[3]}` : (p || ''); })(verified?.phone || accountPhone);
  const showIst = slot && !sameAsIst(tz);

  // Review ticket
  const photo = therapist.profile_picture_url || therapist.cover_image_url || '';
  const role = therapist.designation || therapist.title || '';
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const planSessions = readType(plan || {}).sessions || 1;

  return (
    <div className="bf">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className={`bf-in${needsPhone && !paidDone && !booked && !authLoading ? ' is-signin'
        : (paidDone || (!booked && !needsPhone && step === 4)) ? ' is-wide' : ' is-fx'}`}>
        {needsPhone && !paidDone && !booked && !authLoading ? (
          <button type="button" className="bf-back" onClick={back} aria-label="Back">
            <img src="/design/booking/arrow-left.svg" alt="" width={24} height={24} />
          </button>
        ) : (!paidDone && !booked && !authLoading && step < 4) ? (
          /* Koott 2.0 header (Figma "Booking Flow" 7858:85649): a round back
             button, the therapist in a pill, and a spacer the same size as the
             button so the pill sits centred. The step dots the old design used
             are kept in StepDots, unused, so the swap is easy to reverse. */
          <div className="bfx-top is-k2">
            <button type="button" className="bfx-back" onClick={back} aria-label="Back">
              <img src="/design/booking/arrow-left.svg" alt="" width={20} height={20} />
            </button>
            <span className="bfx-who">
              {photo
                ? <img src={photo} alt="" width={24} height={24} />
                : <span className="bfx-who-i" aria-hidden>{initials}</span>}
              <span className="bfx-who-n">{name}</span>
            </span>
            <span className="bfx-top-spacer" aria-hidden />
          </div>
        ) : null}

        {authLoading ? (
          <p className="bf-note">Loading…</p>
        ) : packageParam && !pkgMode ? (
          <div>
            <p className={pkgErr ? 'bf-err' : 'bf-note'}>{pkgErr || 'Loading your package…'}</p>
            {pkgErr && !isAuthenticated() && (
              <button type="button" className="bf-next" onClick={() => { setAuthFor('package'); setAuthOpen(true); }}>Log in</button>
            )}
          </div>
        ) : paidDone ? (
          <div className="bfx-done">
            <div className="bfx-done-head">
              <img src="/design/booking/check-verified.svg" alt="" width={64} height={64} />
              <div className="bfx-title" role="heading" aria-level={1}>Session Confirmed</div>
            </div>
            <div className="bfx-ticket is-done">
              <div className="bfx-tk-band" aria-hidden />
              <div className="bfx-done-who">
                {photo
                  ? <img className="bfx-tk-photo" src={photo} alt={name} width={64} height={64} />
                  : <span className="bfx-tk-photo is-empty" aria-hidden>{initials}</span>}
                <span className="bfx-tk-name">{name}</span>
                {role && <span className="bfx-tk-role">{role}</span>}
              </div>
              <div className="bfx-tear" aria-hidden><i /><b /><i /></div>
              <div className="bfx-tiles is-small">
                <div className="bfx-tile"><span className="bfx-tl">Amount paid</span><strong>{inr2(paidDone.amount)}</strong></div>
                <div className="bfx-tile"><span className="bfx-tl">Session type</span><strong>{FX_TYPE_SHORT[paidDone.kind || kind]}</strong></div>
                <div className="bfx-tile"><span className="bfx-tl">Date</span><strong>{dateLabel(paidDone.startsAt, tz, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
                <div className="bfx-tile"><span className="bfx-tl">Time &amp; Duration</span><strong>{timeLabel(paidDone.startsAt, tz)}, {SESSION_MINUTES[paidDone.kind || kind]} Minutes</strong></div>
              </div>
              {paidDone.orderId && (
                <div className="bfx-order"><span>Order ID</span><strong>{paidDone.orderId}</strong></div>
              )}
            </div>
            <button type="button" className="bfx-btn" onClick={() => router.push('/profile/sessions')}>View my booking</button>
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
            <div className="bf-si-head">
              <div className="bf-si-title" role="heading" aria-level={1}>{otpSent ? 'Enter the code we sent you' : 'Let’s get you signed in'}</div>
              <p className="bf-si-sub">
                {otpSent
                  ? 'We sent a code on WhatsApp. It is valid for 5 minutes.'
                  : 'Enter your WhatsApp number to receive an OTP'}
              </p>
            </div>

            <div className={`bf-otp${otpSent ? ' is-code' : ''}`}>
              {!otpSent ? (
                <>
                  <div className="bf-si-field">
                    <label className="bf-si-label" htmlFor="bf-wa-number">WhatsApp number</label>
                    <div className="bf-si-input">
                      <span className="bf-si-country">
                        {otpCountry === 'IN'
                          ? <img src="/design/booking/flag-india.svg" alt="" width={24} height={24} />
                          : <span className="bf-si-flag" aria-hidden>{(DIAL_COUNTRIES.find((c) => c[0] === otpCountry) || [])[2]}</span>}
                        <span className="bf-si-iso">{otpCountry}</span>
                        <img src="/design/booking/chevron-down.svg" alt="" width={20} height={20} />
                        <select
                          aria-label="Country" value={otpCountry}
                          onChange={(e) => {
                            const c = DIAL_COUNTRIES.find((x) => x[0] === e.target.value);
                            if (c) { setOtpCountry(c[0]); setOtpDial(c[1]); }
                          }}
                        >
                          {DIAL_COUNTRIES.map(([iso, dial]) => <option key={iso} value={iso}>{iso} {dial}</option>)}
                        </select>
                      </span>
                      <input
                        id="bf-wa-number" value={otpNumber} inputMode="numeric" autoComplete="tel-national"
                        aria-label={`WhatsApp number (${otpDial})`}
                        onChange={(e) => setOtpNumber(e.target.value.replace(/[^\d\s]/g, ''))}
                        onKeyDown={(e) => { if (e.key === 'Enter' && otpNumber.replace(/\D/g, '').length >= 6) sendOtp(); }}
                      />
                    </div>
                  </div>
                  <div className="bf-si-actions">
                    <button
                      type="button" className="bf-si-btn"
                      disabled={otpBusy || resendIn > 0 || otpNumber.replace(/\D/g, '').length < 6}
                      onClick={sendOtp}
                    >
                      {otpBusy ? 'Sending…' : resendIn > 0 ? `Get OTP (${resendIn}s)` : 'Get OTP'}
                    </button>
                    <button type="button" className="bf-si-alt" onClick={() => { setAuthFor('phone'); setAuthOpen(true); }}>
                      Try another way
                    </button>
                  </div>
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
                  <button type="button" className="bf-si-btn" disabled={otpBusy || otpCode.length !== otpLen} onClick={() => verifyOtp()}>
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
              {otpErr && (
                <p className="bf-err">
                  {otpErr}
                  {needLogin && (
                    <button type="button" className="bf-link" onClick={() => { setAuthFor('phone'); setAuthOpen(true); }}>Log in</button>
                  )}
                </p>
              )}
            </div>
          </>
        ) : (
        <>
        {/* The summary column, on a tablet and a laptop only. A booking is a short
            column of choices; beside it there is room to keep showing who and what
            is being booked, which a phone has to drop. It is hidden on Review and
            pay, where the page already is the summary. */}
        {!payFailed && step < 4 && !modeOpen && (
          <aside className="bfx-aside" aria-label="Your booking so far">
            <div className="bfx-aside-card">
              <div className="bfx-aside-who">
                {photo
                  ? <img src={photo} alt="" width={48} height={48} />
                  : <span className="bfx-aside-ph" aria-hidden>{initials}</span>}
                <span className="bfx-aside-whotxt">
                  <span className="bfx-aside-n">{name}</span>
                  {role && <span className="bfx-aside-r">{role}</span>}
                </span>
              </div>
              <div className="bfx-aside-div" />
              <dl className="bfx-aside-rows">
                <div className="bfx-aside-row">
                  <dt>Session</dt>
                  <dd>{kind ? `${FX_TYPE_LABEL[kind] || kind} · ${SESSION_MINUTES[kind] || 50} min` : <i>Not chosen yet</i>}</dd>
                </div>
                <div className="bfx-aside-row">
                  <dt>Date and time</dt>
                  <dd>
                    {slot
                      ? `${dateLabel(slot.startsAt, tz, { weekday: 'short', day: 'numeric', month: 'short' })} · ${timeLabel(slot.startsAt, tz)}`
                      : <i>Not chosen yet</i>}
                  </dd>
                </div>
                <div className="bfx-aside-row">
                  <dt>How</dt>
                  <dd>{K2_MODE_LABEL[sessionMode] || 'Video call'}</dd>
                </div>
                <div className="bfx-aside-row">
                  <dt>Plan</dt>
                  <dd>{plan ? `${readType(plan).sessions > 1 ? `${readType(plan).sessions} sessions` : 'Single session'}` : <i>Not chosen yet</i>}</dd>
                </div>
              </dl>
              {plan && (
                <>
                  <div className="bfx-aside-div" />
                  <div className="bfx-aside-total">
                    <span>Total</span>
                    <strong>{inr(plan.price)}</strong>
                  </div>
                </>
              )}
            </div>
            <p className="bfx-aside-note">You can change any of this before you pay.</p>
          </aside>
        )}

        {!payFailed && step === 0 && (
          <>
            <div className="bfx-title" role="heading" aria-level={1}>What kind of session are you looking for?</div>
            <div className="bfx-types">
              {typeChoices.map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  className={`bfx-type ${kind === k ? 'is-on' : ''}`}
                  onClick={() => {
                    if (k === 'others') {
                      window.open(`https://wa.me/919539007766?text=${encodeURIComponent('Hi Koott, I am looking for a kind of session that is not listed.')}`, '_blank', 'noopener');
                      return;
                    }
                    chooseType(k);
                  }}
                >
                  {/* The illustration is hidden rather than broken if its file is not
                      there yet: individual.png and couple.png are still to be exported
                      from Figma, and the label alone reads fine without them. */}
                  <img
                    className="bfx-type-ic"
                    src={`/design/book2/${K2_TYPE_ART[k] || 'individual'}.png`}
                    alt=""
                    width={42}
                    height={42}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <span className="bfx-type-l">{FX_TYPE_LABEL[k] || label}</span>
                </button>
              ))}
            </div>

            {/* Figma 7858:85649: the hairline, then the row that opens the note. */}
            <div className="bfx-else-rule" aria-hidden />
            <div className="bfx-else">
              <span className="bfx-else-t">Booking for someone else?</span>
              <button type="button" className="bfx-else-b" onClick={() => { setNoteOpen(true); setNoteSaved(false); }}>
                Add details
              </button>
            </div>
          </>
        )}

        {!payFailed && step === 1 && (
          <>
            <div className="bfx-title" role="heading" aria-level={1}>Select slot</div>
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
            <div className="bfx-sched is-k2">
              {/* The next fortnight as cards, the way the design leads with them.
                  A day with no free start is shown as full rather than hidden, so
                  the strip does not change length while the slots load. */}
              <div className="bfx-days" role="group" aria-label="Choose a day">
                {k2Days.map((d) => {
                  const key = ymd(d);
                  const free = openDays[key]?.length || 0;
                  const past = key < todayKey;
                  const off = past || (!daysBusy && free === 0);
                  return (
                    <button
                      key={key} type="button" disabled={off || daysBusy}
                      className={`bfx-dayc${day === key ? ' is-on' : ''}${off ? ' is-off' : ''}`}
                      onClick={() => setDay(key)}
                    >
                      <span className="bfx-dayc-k">{key === todayKey ? 'Today' : FX_DOW_FULL[d.getDay()]}</span>
                      <span className="bfx-dayc-n">{d.getDate()}</span>
                      {off && !past ? <span className="bfx-dayc-full">Full</span> : <span className="bfx-dayc-bar" aria-hidden />}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className={`bfx-viewall${showMonth ? ' is-on' : ''}`}
                  aria-expanded={showMonth}
                  onClick={() => setShowMonth((v) => !v)}
                >
                  {showMonth ? 'Close' : 'View all'}
                  <img src="/design/booking/chevron-right.svg" alt="" width={16} height={16} />
                </button>
              </div>

              {showMonth && (
                <div className="bfx-cal">
                  <div className="bfx-cal-top">
                    <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">
                      <img src="/design/booking/chevron-left.svg" alt="" width={20} height={20} />
                    </button>
                    <span>{MONTHS[month.getMonth()]} {month.getFullYear()}</span>
                    <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month">
                      <img src="/design/booking/chevron-right.svg" alt="" width={20} height={20} />
                    </button>
                  </div>
                  <div className="bfx-cal-dow">{FX_DOW.map((d) => <span key={d}>{d}</span>)}</div>
                  <div className={`bfx-cal-days ${daysBusy ? 'is-busy' : ''}`}>
                    {grid.map((d, i) => {
                      if (!d) return <span key={`x${i}`} />;
                      const key = ymd(d);
                      const free = openDays[key]?.length || 0;
                      const off = daysBusy || key < todayKey || free === 0;
                      return (
                        <button
                          key={key} type="button" disabled={off}
                          className={`bfx-day ${day === key ? 'is-on' : ''} ${!off ? 'has-slots' : ''}`}
                          onClick={() => { setDay(key); setShowMonth(false); }}
                        >
                          {d.getDate()}
                        </button>
                      );
                    })}
                  </div>
                  {!daysBusy && daysErr && <p className="bf-note">We could not load the free times. Please try again.</p>}
                </div>
              )}

              <div className="bfx-rule" aria-hidden />

              <div className="bfx-times">
                <p className="bfx-times-h">Select start time of therapy</p>
                {day ? (
                  <>
                    <div className="bfx-grid">
                      {slots.map((x) => (
                        <button
                          key={x.startsAt} type="button"
                          className={`bfx-tslot${slot?.startsAt === x.startsAt ? ' is-on' : ''}`}
                          onClick={() => { setSlot(x); setSlotNotice(''); setSlotSuggestion(null); track('slot_selected', {}, { psychologistId: therapist?.id }); setStep(pkgMode ? 4 : 2); }}
                        >
                          {x.label}
                        </button>
                      ))}
                    </div>
                    {daysBusy && <p className="bf-note">Checking…</p>}
                    {!daysBusy && slots.length === 0 && <p className="bf-note">No free times that day.</p>}
                  </>
                ) : <p className="bf-note">Pick a day to see the times.</p>}
                <div className="bfx-tz">Times shown in your time zone<i aria-hidden />{zoneParen}</div>
              </div>
            </div>
          </>
        )}

        {payFailed && (
          <div className="bfx-failed">
            <span className="bfx-failed-i" aria-hidden>
              <svg viewBox="0 0 24 24"><path d="M12 7v6" stroke="#D74745" strokeWidth="2.2" strokeLinecap="round" fill="none" /><circle cx="12" cy="16.5" r="1.2" fill="#D74745" /></svg>
            </span>
            <h1 className="bfx-failed-h">Payment didn&rsquo;t go through</h1>
            <p className="bfx-failed-p">
              No money was taken. If your bank deducted anything, it is usually returned within 5 to 7 working days.
            </p>

            {slot && (
              <div className="bfx-failed-slot">
                <span className="bfx-failed-slot-t">
                  {dateLabel(slot.startsAt, tz, { weekday: 'short', day: 'numeric', month: 'short' })} · {timeLabel(slot.startsAt, tz)}
                </span>
                <span className="bfx-failed-slot-s">
                  {plan ? `${readType(plan).sessions > 1 ? `${readType(plan).sessions} session pack` : 'Single session'} · ${inr(plan.price)}` : ''}
                </span>
              </div>
            )}

            <div className="bfx-failed-actions">
              {heldLeft && (
                <div className="bfx-held">
                  <span className="bfx-held-txt">
                    <span className="bfx-held-t">We are holding your slot</span>
                    <span className="bfx-held-s">
                      {slot && `${dateLabel(slot.startsAt, tz, { weekday: 'short', day: 'numeric', month: 'short' })} · ${timeLabel(slot.startsAt, tz)}`}
                      {name ? ` with ${name.split(' ')[0]}` : ''}
                    </span>
                  </span>
                  <span className="bfx-held-c">{heldLeft}</span>
                </div>
              )}
              <button type="button" className="bfx-btn" disabled={paying} onClick={() => { setPayFailed(null); pay(); }}>
                {paying ? 'Starting payment…' : 'Try again'}
              </button>
              {/* Razorpay shows every method it has in one sheet, so "another
                  method" is the same sheet opened again, not a different flow. */}
              <button type="button" className="bfx-failed-alt" onClick={() => { setPayFailed(null); pay(); }}>
                Use another payment method
              </button>
            </div>
          </div>
        )}

        {!payFailed && step === 2 && modeOpen && (
          <>
            <div className="bfx-title" role="heading" aria-level={1}>How would you like to talk?</div>
            <div className="bfx-seg">
              {[['online', 'Online'], ['in_person', 'In-person']].map(([k, label]) => (
                <button
                  key={k} type="button"
                  className={`bfx-seg-b ${sessionPlace === k ? 'is-on' : ''}`}
                  onClick={() => setSessionPlace(k)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="bfx-modes">
              {K2_MODES.map(([k, label]) => (
                <button
                  key={k} type="button"
                  className={`bfx-mode${sessionMode === k ? ' is-on' : ''}`}
                  onClick={() => { setSessionMode(k); setModeOpen(false); setStep(needsAbout ? 3 : 4); }}
                >
                  <span className="bfx-mode-ic" aria-hidden>{K2_MODE_ICON[k]}</span>
                  <span className="bfx-mode-l">{label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {!payFailed && step === 2 && !modeOpen && (
          <>
            {/* Koott 2.0 (Figma 7858:85805): the title carries a badge with the
                session length and how many are in the plan, and each plan is a
                row — name, what it saves, the per-session price, and the total
                beside the price it would have been. */}
            <div className="bfx-head is-k2">
              <div className="bfx-title" role="heading" aria-level={1}>Select session plan</div>
              <span className="bfx-badge">
                <span className="bfx-badge-t">{SESSION_LENGTH_LABEL[kind]}</span>
                <span className="bfx-badge-b">
                  {(() => {
                    const n = plan ? readType(plan).sessions : (shown[0] ? readType(shown[0]).sessions : 1);
                    return `${n} ${isPsychiatrist ? (n === 1 ? 'Consultation' : 'Consultations') : (n === 1 ? 'Session' : 'Sessions')}`;
                  })()}
                </span>
              </span>
            </div>

            <div className="bfx-plan-wrap">
              {singles.length > 0 && bundles.length > 0 && (
                <div className="bfx-seg">
                  {['packages', 'single'].map((m) => (
                    <button
                      key={m} type="button"
                      className={`bfx-seg-b ${effectiveMode === m ? 'is-on' : ''}`}
                      onClick={() => { setMode(m); setPlan(null); }}
                    >
                      {m === 'packages' ? 'Packages' : 'Single'}
                    </button>
                  ))}
                </div>
              )}

              <div className="bfx-plans is-k2">
                {shown.map((p, i) => {
                  const { sessions } = readType(p);
                  const full = unit * sessions;
                  const saved = Math.max(Math.round(full - Number(p.price || 0)), 0);
                  return (
                    <button
                      key={p.id} type="button"
                      className={`bfx-planr${(plan ? plan.id === p.id : i === 0) ? ' is-on' : ''}`}
                      // Picking a plan is the answer to this step — no Continue.
                      onClick={() => { setPlan(p); track('plan_selected', { item_kind: itemKindOf(p) }, { psychologistId: therapist?.id, value: Number(p.price) || 0 }); setModeOpen(true); }}
                    >
                      <span className="bfx-planr-l">
                        <span className="bfx-planr-top">
                          <span className="bfx-planr-n">
                            {isPsychiatrist
                              ? (sessions === 1 ? '1 consultation' : `${sessions} consultations`)
                              : (sessions === 1 ? '1 session' : `${sessions} sessions`)}
                          </span>
                          {saved > 0 && <span className="bfx-planr-save">Save {inr(saved)}</span>}
                        </span>
                        <span className="bfx-planr-u">{inr(Math.round(p.price / sessions))} /session</span>
                      </span>
                      <span className="bfx-planr-r">
                        <span className="bfx-planr-p">{inr(p.price)}</span>
                        {full > p.price && <s className="bfx-planr-was">{inr(full)}</s>}
                      </span>
                    </button>
                  );
                })}
                {shown.length === 0 && <p className="bf-note">No plans published for this option yet.</p>}
              </div>
            </div>
          </>
        )}

        {!payFailed && step === 3 && (
          <>
            <div className="bfx-title" role="heading" aria-level={1}>About yourself</div>
            <div className="bfx-form">
              <label className="bfx-field">
                <span className="bfx-label">Full name</span>
                <input value={about.name} placeholder="full name" onChange={(e) => setAbout({ ...about, name: e.target.value })} autoComplete="name" />
              </label>
              <label className="bfx-field">
                <span className="bfx-label">Age</span>
                <input type="number" min="16" max="120" placeholder="age" value={about.age} onChange={(e) => setAbout({ ...about, age: e.target.value })} />
              </label>
              <label className="bfx-field">
                <span className="bfx-label">Contact number</span>
                <input className="is-fixed" value={phoneShown} readOnly tabIndex={-1} />
              </label>
              <label className="bfx-field">
                <span className="bfx-label">Email address</span>
                <input
                  type="email" value={about.email} placeholder="enter your email" autoComplete="email" readOnly={emailLocked}
                  className={emailLocked ? 'is-fixed' : ''}
                  onChange={(e) => setAbout({ ...about, email: e.target.value })}
                />
              </label>
            </div>
            {nonClientSignedIn && (
              <p className="bf-err">
                You&apos;re signed in with a Koott staff account. Sessions are booked from a client account.{' '}
                <button type="button" className="bf-link" onClick={() => logout()}>Log out</button> to book as a client.
              </p>
            )}
            {aboutErr && (
              <p className="bf-err">
                {aboutErr}
                {emailTaken && (
                  <button type="button" className="bf-link" onClick={() => { setAuthFor('about'); setAuthOpen(true); }}>Log in</button>
                )}
              </p>
            )}
            <button type="button" className="bfx-btn bfx-next" disabled={!canContinue || aboutBusy} onClick={continueAbout}>
              {aboutBusy ? 'Saving…' : 'Next'}
            </button>
          </>
        )}

        {!payFailed && step === 4 && (() => {
          const sessions = pkgMode ? 1 : planSessions;
          const total = pkgMode ? 0 : Number(plan?.price || 0);
          const saving = !pkgMode && sessions > 1 ? Math.max(Math.round(unit * sessions - total), 0) : 0;
          const planName = pkgMode
            ? `Session ${pkgSessionNo} of ${pkgTotal}`
            : sessions === 1 ? (isPsychiatrist ? 'Single consultation' : 'Single session') : `Package Sessions(${sessions})`;
          return (
            <div className="bfx-rv2">
              <div className="bfx-title" role="heading" aria-level={1}>Review and pay</div>

              {/* What you are booking. Every row is a way back to the step that
                  set it, which is what the chevrons mean in the design. */}
              <div className="bfx-rvcard">
                <button type="button" className="bfx-rvrow is-who" onClick={() => router.push('/book-malayali-psychologists')}>
                  {photo
                    ? <img className="bfx-rv-photo" src={photo} alt="" width={48} height={48} />
                    : <span className="bfx-rv-photo is-empty" aria-hidden>{initials}</span>}
                  <span className="bfx-rv-whotxt">
                    <span className="bfx-rv-name">{name}</span>
                    {role && <span className="bfx-rv-role">{role}</span>}
                  </span>
                  <img src="/design/booking/chevron-right.svg" alt="" width={16} height={16} />
                </button>
                <span className="bfx-rv-div" />
                <button type="button" className="bfx-rvrow" onClick={() => setStep(1)}>
                  <span className="bfx-rv-kv">
                    <span className="bfx-rv-k">Date and time</span>
                    <span className="bfx-rv-v">
                      {slot && `${dateLabel(slot.startsAt, tz, { weekday: 'short', day: 'numeric', month: 'short' })} · ${timeLabel(slot.startsAt, tz)}`}
                    </span>
                  </span>
                  <img src="/design/booking/chevron-right.svg" alt="" width={16} height={16} />
                </button>
                <span className="bfx-rv-div" />
                <button type="button" className="bfx-rvrow" onClick={() => setStep(0)}>
                  <span className="bfx-rv-kv">
                    <span className="bfx-rv-k">Session</span>
                    <span className="bfx-rv-v">{K2_MODE_LABEL[sessionMode] || 'Video call'} · {SESSION_MINUTES[kind]} min</span>
                  </span>
                  <img src="/design/booking/chevron-right.svg" alt="" width={16} height={16} />
                </button>
                <span className="bfx-rv-div" />
                <button type="button" className="bfx-rvrow" onClick={() => setStep(pkgMode ? 1 : 2)}>
                  <span className="bfx-rv-kv">
                    <span className="bfx-rv-k">Plan</span>
                    <span className="bfx-rv-v">{planName}</span>
                  </span>
                  <img src="/design/booking/chevron-right.svg" alt="" width={16} height={16} />
                </button>
              </div>

              {/* A coupon, if they have one. The design's row (7858:85934): the code
                  goes in, and once it holds the row says so with a way to take it off.
                  Nothing adds tax here, so that line of the design stays out rather
                  than showing a zero. */}
              <div className="bfx-coupon">
                {coupon ? (
                  <>
                    <span className="bfx-coupon-ok" aria-hidden>✦</span>
                    <span className="bfx-coupon-on">{coupon.code} applied</span>
                    <button type="button" className="bfx-coupon-off" onClick={removeCoupon}>Remove</button>
                  </>
                ) : (
                  <>
                    <input
                      value={couponText}
                      onChange={(e) => { setCouponText(e.target.value); setCouponErr(''); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') applyCoupon(total); }}
                      placeholder="Coupon code"
                      aria-label="Coupon code"
                      autoCapitalize="characters"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      className="bfx-coupon-go"
                      disabled={!couponText.trim() || couponState === 'checking'}
                      onClick={() => applyCoupon(total)}
                    >
                      {couponState === 'checking' ? 'Checking…' : 'Apply'}
                    </button>
                  </>
                )}
              </div>
              {couponErr && <p className="bfx-coupon-err">{couponErr}</p>}

              {/* The bill. Only the lines that have a number are drawn. */}
              <div className="bfx-billc">
                <div className="bfx-bill-lines">
                  <div className="bfx-bl">
                    <span className="bfx-bl-k">
                      Plan Total
                      {sessions > 1 && <i>({sessions} sessions × {inr(unit)})</i>}
                    </span>
                    <span className="bfx-bl-v is-strong">{inr(pkgMode ? 0 : Math.round(unit * sessions))}</span>
                  </div>
                  {saving > 0 && (
                    <>
                      <span className="bfx-bl-rule" />
                      <div className="bfx-bl">
                        <span className="bfx-bl-tag">Pack discount</span>
                        <span className="bfx-bl-v is-off">− {inr(saving)}</span>
                      </div>
                    </>
                  )}
                  {coupon && (
                    <>
                      <span className="bfx-bl-rule" />
                      <div className="bfx-bl">
                        <span className="bfx-bl-tag">Coupon {coupon.code}</span>
                        <span className="bfx-bl-v is-off">− {inr(coupon.discountAmount)}</span>
                      </div>
                    </>
                  )}
                  <span className="bfx-bl-rule" />
                  <div className="bfx-bl">
                    <span className="bfx-bl-k is-total">Total</span>
                    <span className="bfx-bl-v is-total">{inr(coupon ? coupon.finalAmount : total)}</span>
                  </div>
                </div>
                {saving > 0 && (
                  <div className="bfx-savings">
                    <span className="bfx-savings-i" aria-hidden>✦</span>
                    You&apos;re saving {inr(saving)} on this booking
                  </div>
                )}
              </div>

              <div className="bfx-gtk">
                <p className="bfx-gtk-h">Good to know</p>
                {['Reschedule free up to 12 hours before your session.',
                  'Cancel up to 24 hours before for a full refund.',
                  'You will get the meeting link by email and WhatsApp.'].map((t) => (
                    <p className="bfx-gtk-p" key={t}><i aria-hidden />{t}</p>
                  ))}
                <p className="bfx-gtk-t">
                  By paying you agree to the <a href="/terms-and-conditions" target="_blank" rel="noreferrer">Terms</a>,
                  {' '}<a href="/therapy-agreement" target="_blank" rel="noreferrer">Consent to therapy</a> and
                  {' '}<a href="/refund-policy" target="_blank" rel="noreferrer">Refund policy</a>.
                </p>
              </div>

              {payErr && <p className="bf-err">{payErr}</p>}

              <div className="bfx-paybar">
                {pkgMode ? (
                  <button type="button" className="bfx-btn" disabled={confirming || !slot} onClick={confirmPackageSession}>
                    {confirming ? 'Booking…' : 'Confirm booking'}
                  </button>
                ) : (
                  <button type="button" className="bfx-btn" disabled={paying || !slot || !plan} onClick={pay}>
                    {paying ? 'Starting payment…' : `Pay ${inr(coupon ? coupon.finalAmount : total)}`}
                  </button>
                )}
              </div>
            </div>
          );
        })()}
        </>
        )}
      </div>

      {noteOpen && (
        <div className="bfx-sheet-wrap" role="dialog" aria-modal="true" aria-label="Notes to your therapist">
          <button type="button" className="bfx-sheet-veil" aria-label="Close" onClick={() => setNoteOpen(false)} />
          <div className="bfx-sheet">
            <span className="bfx-sheet-grip" aria-hidden />
            <h2 className="bfx-sheet-h">Notes to your therapist</h2>
            <p className="bfx-sheet-p">
              Anything that would help them prepare — who the session is for, or what you would like to talk about.
            </p>
            <textarea
              className="bfx-sheet-t"
              value={noteText}
              maxLength={1000}
              placeholder="Write here…"
              onChange={(e) => { setNoteText(e.target.value); setNoteSaved(false); }}
            />
            <button
              type="button"
              className="bfx-btn"
              disabled={noteSaving || !noteText.trim()}
              onClick={async () => {
                setNoteSaving(true);
                try {
                  await clientApi.updateProfile({ client_message: noteText.trim().slice(0, 1000) });
                  setNoteSaved(true);
                  setNoteOpen(false);
                } catch (_) {
                  // It is a note, not the booking: say nothing and leave the sheet open.
                } finally {
                  setNoteSaving(false);
                }
              }}
            >
              {noteSaving ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {leaveAsk && (
        <div className="bfx-leave" role="dialog" aria-modal="true" aria-labelledby="bfx-leave-h">
          <div className={`bfx-leave-card ${step === 4 ? 'is-review' : ''}`}>
            <button type="button" className="bfx-leave-x" aria-label="Close" onClick={stayHere}>
              <img src="/design/booking/x-close.svg" alt="" width={24} height={24} />
            </button>
            <div className="bfx-leave-top">
              <span className="bfx-leave-ic"><img src="/design/booking/alert-hexagon.svg" alt="" width={32} height={32} /></span>
              <div className="bfx-leave-txt">
                <div id="bfx-leave-h" className="bfx-leave-h">Leaving already?</div>
                <p className="bfx-leave-p">
                  {step === 4 && slot
                    ? <>Your booking with {name} for<br />{dateLabel(slot.startsAt, tz, { weekday: 'short' })}, {dateLabel(slot.startsAt, tz, { day: 'numeric', month: 'short' })} · {timeLabel(slot.startsAt, tz)} is still reserved.</>
                    : 'Hey, it seems you haven\'t completed all the steps. Want to leave?'}
                </p>
              </div>
            </div>
            {step === 4 ? (
              <div className="bfx-leave-btns">
                <button type="button" className="bfx-btn-line" onClick={() => { const to = leaveAsk.href; clearDraft(); setLeaveAsk(null); setLeaveAsked(true); router.push(to); }}>Cancel booking</button>
                <button type="button" className="bfx-btn" onClick={() => { stayHere(); pay(); }}>Continue to payment</button>
              </div>
            ) : (
              <div className="bfx-leave-btns">
                <a className="bfx-btn-line" href={`https://wa.me/919539007766?text=${encodeURIComponent(`Hi Koott, I need help booking a session with ${name}.`)}`} target="_blank" rel="noreferrer" onClick={stayHere}>WhatsApp Us</a>
                <button type="button" className="bfx-btn" onClick={stayHere}>Continue</button>
              </div>
            )}
          </div>
        </div>
      )}

      {payStage === 'confirming' && (
        <div className="bfx-verify" role="status" aria-live="polite">
          <img className="bfx-verify-ic" src="/design/booking/loading.svg" alt="" width={48} height={48} />
          <div className="bfx-verify-h">Verifying your payment and booking...</div>
          <p className="bfx-verify-s">Please wait, do not close this. We confirm with the payment provider before showing success.</p>
        </div>
      )}
      {payStage && payStage !== 'confirming' && (
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
          // Logged in from "this number has an account": verify again, now attached to them.
          else if (authFor === 'phone') { setNeedLogin(false); setOtpErr(''); setReverify(true); }
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

/* ------------------------------------------------------------------ Figma booking flow
   Steps 0-3 (1123:9830 / 9987 / 10711 / 10081 / 10264 / 10805), review (10386),
   verifying (10687), success (17820). Phone frames 1123:12508… at max-width 720px. */
.bf-in.is-fx{max-width:1228px;padding:56px 24px 120px;}
.bf-in.is-wide{max-width:none;padding:0;}
.bfx-top{display:flex;align-items:center;gap:16px;margin:0 0 32px;}
.bfx-back{background:none;border:0;padding:0;cursor:pointer;width:24px;height:24px;display:block;}
.bfx-back img{display:block;}
.bfx-dots{display:flex;align-items:center;gap:8px;}
.bfx-dots i{display:block;width:10px;height:10px;border-radius:50%;background:#E8EFE5;}
.bfx-dots i.is-on{width:22px;border-radius:100px;background:#1B6930;}
.bfx-dots i.is-done{background:#1B6930;}
.bfx-title{
  font-family:'Poppins',ui-sans-serif,system-ui,sans-serif!important;font-size:24px!important;font-weight:500!important;
  line-height:1.66!important;color:#0F0F0F!important;letter-spacing:0!important;margin:0 0 24px;
}
.bfx-head{margin:0 0 24px;display:flex;flex-direction:column;gap:4px;}
.bfx-head .bfx-title{margin:0;}
.bfx-sub{font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;font-weight:400!important;line-height:22px!important;color:#373737!important;margin:0;}
.bfx-btn{
  height:40px;padding:8px 22px;border:0;border-radius:8px;background:#189E4F;color:#fff!important;cursor:pointer;
  font-family:'Inter',system-ui,sans-serif!important;font-size:16px!important;font-weight:500!important;line-height:24px!important;
}
.bfx-btn:disabled{background:#9CA3AF;cursor:default;}
.bfx-ic{display:block;width:32px;height:32px;flex:none;background:#373737;-webkit-mask:var(--ic) center/contain no-repeat;mask:var(--ic) center/contain no-repeat;}

/* step 0: session type */
.bfx-types{display:flex;flex-direction:column;gap:16px;width:338px;max-width:100%;}
.bfx-type{
  display:flex;align-items:center;gap:12px;height:64px;padding:16px;background:#fff;border:1px solid #E3E2E2;border-radius:12px;
  cursor:pointer;text-align:left;box-sizing:border-box;
}
.bfx-type-l{font-family:'Poppins',ui-sans-serif,system-ui,sans-serif!important;font-size:20px!important;font-weight:400!important;line-height:30px!important;color:#373737!important;}
.bfx-type.is-on,.bfx-type:hover{border-color:#189E4F;box-shadow:0 8px 12px #EBF3EE;}
.bfx-type.is-on .bfx-type-l,.bfx-type:hover .bfx-type-l{font-weight:500!important;color:#0F0F0F!important;}
.bfx-type.is-on .bfx-ic,.bfx-type:hover .bfx-ic{background:#189E4F;}

/* ───────── Koott 2.0, step 0 (Figma "Booking Flow", 7858:85649 at 402) ─────────
   Header 402x56 with pad 4/16/12/16; the pill 139x38; options 370x76 at r12 with
   a 42 px illustration and a 16/24 label. These come after the rules above so
   they win without those having to be deleted while the other steps still use
   them. */
.bfx-top.is-k2{
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  height:56px;margin:0 0 24px;padding:4px 0 12px;
}
.bfx-top.is-k2 .bfx-back{
  display:flex;align-items:center;justify-content:center;width:40px;height:40px;flex:none;
  border-radius:9999px;background:#fff;
  box-shadow:inset 0 0 0 1px #E3E7E5,0 1px 2px rgba(28,36,31,.04),0 3px 3px rgba(28,36,31,.03),0 8px 5px rgba(28,36,31,.02);
}
.bfx-top-spacer{width:34px;height:34px;flex:none;}
.bfx-who{
  display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 12px 0 8px;flex:none;
  border-radius:9999px;background:#fff;
  box-shadow:inset 0 0 0 1px #E3E7E5,0 1px 2px rgba(28,36,31,.04),0 3px 3px rgba(28,36,31,.03),0 8px 5px rgba(28,36,31,.02);
}
.bfx-who img,.bfx-who-i{width:24px;height:24px;border-radius:9999px;object-fit:cover;flex:none;}
.bfx-who-i{display:inline-flex;align-items:center;justify-content:center;background:#E9F1E4;color:#1B6930;font:600 11px/1 'Figtree',sans-serif;}
.bfx-who-n{font-family:'Figtree',ui-sans-serif,system-ui,sans-serif!important;font-size:14px!important;font-weight:500!important;line-height:18px!important;color:#535E58!important;white-space:nowrap;}

.bfx-types{width:370px;max-width:100%;gap:16px;}
.bfx-type{
  height:76px;gap:12px;padding:16px;border:0;border-radius:12px;
  box-shadow:inset 0 0 0 1px #E3E7E5;
}
.bfx-type-ic{width:42px;height:42px;flex:none;}
.bfx-type-l{
  font-family:'Figtree',ui-sans-serif,system-ui,sans-serif!important;
  font-size:16px!important;font-weight:500!important;line-height:24px!important;color:#1C241F!important;
}
.bfx-type.is-on,.bfx-type:hover{box-shadow:inset 0 0 0 1.5px #39AC71,0 8px 12px #EBF3EE;}
.bfx-type.is-on .bfx-type-l,.bfx-type:hover .bfx-type-l{font-weight:600!important;color:#1C241F!important;}

/* ───────── Koott 2.0, step 1 · Select slot (Figma 7858:85753) ─────────
   A strip of 74x84 day cards with a "View all" card, a hairline, then the times
   in two columns of 181x48. */
.bfx-sched.is-k2{display:flex;flex-direction:column;gap:24px;width:370px;max-width:100%;}
.bfx-days{
  /* a flex child's min-width is auto, so without this the strip pushes the
     column wide instead of scrolling inside it */
  min-width:0;max-width:100%;
  display:flex;align-items:center;gap:16px;overflow-x:auto;scrollbar-width:none;
  padding-bottom:2px;scroll-snap-type:x mandatory;
}
.bfx-days::-webkit-scrollbar{display:none;}
.bfx-dayc{
  flex:none;width:74px;height:84px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
  border:0;border-radius:12px;background:#fff;box-shadow:inset 0 0 0 1px #E3E7E5;cursor:pointer;scroll-snap-align:start;
}
.bfx-dayc-k{font-family:'Figtree',sans-serif!important;font-size:11px!important;font-weight:600!important;line-height:16px!important;letter-spacing:.55px!important;text-transform:uppercase;color:#535E58!important;}
.bfx-dayc-n{font-family:'Figtree',sans-serif!important;font-size:24px!important;font-weight:500!important;line-height:32px!important;letter-spacing:-.24px!important;color:#1C241F!important;}
.bfx-dayc-bar{width:28px;height:4px;border-radius:2px;background:#E3E7E5;}
.bfx-dayc-full{
  padding:3px 8px;border-radius:999px;background:#FFF4F3;box-shadow:0 0 0 2px #fff;
  font-family:'Figtree',sans-serif!important;font-size:12px!important;font-weight:600!important;line-height:16px!important;color:#A93534!important;
}
.bfx-dayc.is-on{background:linear-gradient(180deg,#FFFFFF 0%,#EAF3ED 100%);box-shadow:inset 0 0 0 1.5px #39AC71;}
.bfx-dayc.is-off{background:#F5F7F6;box-shadow:none;cursor:default;}
.bfx-dayc.is-off .bfx-dayc-k,.bfx-dayc.is-off .bfx-dayc-n{color:#9CA49F!important;}
.bfx-dayc:disabled{cursor:default;}
.bfx-viewall{
  flex:none;min-width:100px;height:84px;display:inline-flex;align-items:center;justify-content:center;gap:4px;
  border:0;border-radius:12px;background:#fff;box-shadow:inset 0 0 0 1px #E3E7E5;cursor:pointer;
  font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:600!important;line-height:18px!important;color:#6B746F!important;
}
.bfx-viewall.is-on{box-shadow:inset 0 0 0 1.5px #39AC71;}
.bfx-rule{height:1px;background:#E3E7E5;}
.bfx-times{display:flex;flex-direction:column;gap:16px;}
.bfx-times-h{font-family:'Figtree',sans-serif!important;font-size:16px!important;font-weight:600!important;line-height:20px!important;color:#1C241F!important;margin:0!important;}
.bfx-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}
.bfx-tslot{
  height:48px;display:flex;align-items:center;justify-content:center;border:0;border-radius:12px;
  background:#fff;box-shadow:inset 0 0 0 1px #E3E7E5;cursor:pointer;
  font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:500!important;line-height:18px!important;color:#1C241F!important;
}
.bfx-tslot.is-on{background:linear-gradient(180deg,#FFFFFF 0%,#EAF3ED 100%);box-shadow:inset 0 0 0 1.5px #39AC71;}
.bfx-sched.is-k2 .bfx-cal{width:100%;}

/* ───────── Koott 2.0, step 2 · Select session plan (Figma 7858:85805) ───────── */
/* The old head stacks and centres; the design puts the title and the badge on
   one line, title left. */
.bfx-head.is-k2{
  display:flex;flex-direction:row;align-items:center;justify-content:space-between;gap:8px;
  width:370px;max-width:100%;text-align:left;
}
.bfx-head.is-k2 .bfx-title{text-align:left;}
.bfx-badge{
  flex:none;display:flex;flex-direction:column;align-items:stretch;min-width:76px;
  border-radius:12px;overflow:hidden;box-shadow:inset 0 0 0 1px #E3E7E5;
}
.bfx-badge-t{
  padding:4px 12px;background:#E2F7E7;text-align:center;
  font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:600!important;line-height:18px!important;color:#2E7D5A!important;
}
.bfx-badge-b{
  padding:4px 12px;text-align:center;
  font-family:'Figtree',sans-serif!important;font-size:12px!important;font-weight:500!important;line-height:16px!important;color:#535E58!important;
}
.bfx-seg{display:inline-flex;gap:4px;padding:4px;border-radius:9999px;background:#F0F3F1;align-self:flex-start;}
.bfx-seg-b{
  min-width:100px;height:32px;padding:0 12px;border:0;border-radius:9999px;background:none;cursor:pointer;
  font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:600!important;line-height:18px!important;color:#535E58!important;
}
.bfx-seg-b.is-on{
  background:#fff;color:#1C241F!important;
  box-shadow:0 1px 2px rgba(28,36,31,.04),0 3px 3px rgba(28,36,31,.03),0 8px 5px rgba(28,36,31,.02);
}
.bfx-plans.is-k2{display:flex;flex-direction:column;gap:16px;width:370px;max-width:100%;}
.bfx-planr{
  display:flex;align-items:center;gap:12px;width:100%;padding:16px;border:0;border-radius:12px;background:#fff;
  box-shadow:inset 0 0 0 1px #E3E7E5;cursor:pointer;text-align:left;
}
.bfx-planr.is-on{background:linear-gradient(180deg,#FFFFFF 0%,#EAF3ED 100%);box-shadow:inset 0 0 0 1.5px #39AC71;}
.bfx-planr-l{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.bfx-planr-top{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.bfx-planr-n{font-family:'Figtree',sans-serif!important;font-size:18px!important;font-weight:500!important;line-height:24px!important;letter-spacing:-.09px!important;color:#1C241F!important;}
.bfx-planr-save{
  padding:2px 6px;border-radius:9999px;background:#E1F1FF;
  font-family:'Figtree',sans-serif!important;font-size:12px!important;font-weight:600!important;line-height:16px!important;color:#2986CA!important;
}
.bfx-planr-u{font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:500!important;line-height:20px!important;color:#9CA49F!important;}
.bfx-planr-r{flex:none;display:flex;flex-direction:column;align-items:flex-end;}
.bfx-planr-p{font-family:'Figtree',sans-serif!important;font-size:16px!important;font-weight:600!important;line-height:24px!important;color:#1C241F!important;}
.bfx-planr-was{font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:500!important;line-height:20px!important;color:#9CA49F!important;}

/* ───────── Koott 2.0, step 6 · Session mode (Figma 7858:85858) ───────── */
/* Figma's Content column is 24 apart; the segmented control sits above these. */
.bfx-modes{display:flex;flex-direction:column;gap:12px;width:370px;max-width:100%;margin-top:24px;}
.bfx-mode{
  display:flex;align-items:center;gap:12px;width:100%;height:74px;padding:16px;border:0;border-radius:12px;
  background:#fff;box-shadow:inset 0 0 0 1px #E3E7E5;cursor:pointer;text-align:left;
}
.bfx-mode.is-on{background:linear-gradient(180deg,#FFFFFF 0%,#EAF3ED 100%);box-shadow:inset 0 0 0 1.5px #39AC71;}
.bfx-mode-ic{
  flex:none;display:flex;align-items:center;justify-content:center;width:40px;height:40px;
  border-radius:8px;background:#EFFCF2;
}
.bfx-mode-ic svg{width:20px;height:20px;}
.bfx-mode-l{font-family:'Figtree',sans-serif!important;font-size:16px!important;font-weight:500!important;line-height:24px!important;color:#1C241F!important;}

/* ───────── Koott 2.0, step 7 · Review and pay (Figma 7858:86010) ───────── */
.bfx-rv2{display:flex;flex-direction:column;gap:20px;width:370px;max-width:100%;padding-bottom:110px;}
.bfx-rvcard{
  border-radius:24px;background:#fff;overflow:hidden;border:1px solid #E3E7E5;
  box-shadow:0 4px 12px rgba(28,36,31,.04),0 16px 24px rgba(28,36,31,.04),0 32px 40px rgba(28,36,31,.02);
}
.bfx-rvrow{
  display:flex;align-items:center;gap:12px;width:100%;padding:16px;border:0;background:none;cursor:pointer;text-align:left;
}
.bfx-rvrow > img{flex:none;width:16px;height:16px;opacity:.6;}
.bfx-rv-div{display:block;height:1px;background:#E3E7E5;}
.bfx-rv-photo{flex:none;width:48px;height:48px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 3px #F5F7F6;}
.bfx-rv-photo.is-empty{display:inline-flex;align-items:center;justify-content:center;background:#E9F1E4;color:#1B6930;font:600 16px/1 'Figtree',sans-serif;}
.bfx-rv-whotxt{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;}
.bfx-rv-name{font-family:'Figtree',sans-serif!important;font-size:18px!important;font-weight:600!important;line-height:24px!important;letter-spacing:-.09px!important;color:#1C241F!important;}
.bfx-rv-role{font-family:'Figtree',sans-serif!important;font-size:11px!important;font-weight:600!important;line-height:16px!important;letter-spacing:.55px!important;text-transform:uppercase;color:#535E58!important;}
.bfx-rv-kv{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.bfx-rv-k{font-family:'Figtree',sans-serif!important;font-size:12px!important;font-weight:400!important;line-height:16px!important;color:#6B746F!important;}
.bfx-rv-v{font-family:'Figtree',sans-serif!important;font-size:16px!important;font-weight:500!important;line-height:24px!important;color:#1C241F!important;}

/* The coupon row above the bill (Figma 7858:85934). Before a code holds it is a
   field and Apply; once it holds it says so, with a way to take it off. */
.bfx-coupon{
  display:flex;align-items:center;gap:10px;padding:12px 16px;margin-bottom:12px;
  border:1px solid #E3E7E5;border-radius:16px;background:#fff;
}
.bfx-coupon input{
  flex:1;min-width:0;border:0;outline:0;background:none;
  font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:500!important;
  line-height:20px!important;color:#1C241F!important;text-transform:uppercase;
}
.bfx-coupon input::placeholder{color:#9CA49F!important;text-transform:none;}
.bfx-coupon-go{
  flex:none;border:0;background:none;cursor:pointer;
  font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:600!important;
  line-height:20px!important;color:#2E7D5A!important;
}
.bfx-coupon-go[disabled]{color:#9CA49F!important;cursor:default;}
.bfx-coupon-ok{flex:none;color:#2E7D5A;}
.bfx-coupon-on{
  flex:1;min-width:0;font-family:'Figtree',sans-serif!important;font-size:14px!important;
  font-weight:500!important;line-height:20px!important;color:#2E7D5A!important;
}
.bfx-coupon-off{
  flex:none;border:0;background:none;cursor:pointer;
  font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:500!important;
  line-height:18px!important;color:#6B746F!important;
}
.bfx-coupon-err{
  margin:-6px 0 12px!important;font-family:'Figtree',sans-serif!important;font-size:12px!important;
  font-weight:500!important;line-height:16px!important;color:#A93534!important;
}
.bfx-billc{border-radius:24px;background:#fff;overflow:hidden;border:1px solid #E3E7E5;}
.bfx-bill-lines{display:flex;flex-direction:column;gap:12px;padding:16px;}
.bfx-bl{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.bfx-bl-k{display:inline-flex;align-items:center;gap:8px;font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:400!important;line-height:20px!important;color:#535E58!important;}
.bfx-bl-k i{font-style:normal;color:#6B746F!important;}
.bfx-bl-k.is-total{font-size:16px!important;font-weight:600!important;line-height:20px!important;}
.bfx-bl-tag{font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:400!important;line-height:20px!important;color:#535E58!important;}
.bfx-bl-v{font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:500!important;line-height:20px!important;color:#1C241F!important;}
.bfx-bl-v.is-strong{font-weight:600!important;}
.bfx-bl-v.is-off{color:#2E7D5A!important;}
.bfx-bl-v.is-total{font-size:16px!important;font-weight:600!important;line-height:20px!important;}
.bfx-bl-rule{display:block;height:1px;background:#E3E7E5;}
.bfx-savings{
  display:flex;align-items:center;gap:10px;padding:14px 16px;background:#EFFCF2;
  box-shadow:inset 0 0 0 1px #E2F7E7;
  font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:600!important;line-height:20px!important;color:#2E7D5A!important;
}
.bfx-savings-i{color:#39AC71;font-size:16px;line-height:1;}

.bfx-gtk{display:flex;flex-direction:column;gap:8px;padding:8px 0 0 4px;}
.bfx-gtk-h{font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:600!important;line-height:18px!important;color:#9CA49F!important;margin:0!important;}
.bfx-gtk-p{
  display:flex;gap:8px;margin:0!important;
  font-family:'Figtree',sans-serif!important;font-size:12px!important;font-weight:400!important;line-height:16px!important;color:#9CA49F!important;
}
.bfx-gtk-p i{flex:none;width:4px;height:4px;margin-top:6px;border-radius:50%;background:#9CA49F;}
.bfx-gtk-t{margin:0!important;font-family:'Figtree',sans-serif!important;font-size:12px!important;font-weight:400!important;line-height:16px!important;color:#9CA49F!important;}
.bfx-gtk-t a{color:#6B746F!important;text-decoration:underline;}

/* The pay bar is fixed to the bottom of the screen, as the design has it. */
.bfx-paybar{
  position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;justify-content:center;
  padding:16px 16px 40px;background:#fff;box-shadow:0 -1px 0 #E3E7E5;
}
.bfx-paybar .bfx-btn{width:370px;max-width:100%;height:48px;}

/* ───────── Koott 2.0, step 12 · Payment failed (Figma 7858:86086) ───────── */
.bfx-failed{display:flex;flex-direction:column;gap:16px;width:370px;max-width:100%;padding-bottom:220px;}
.bfx-failed-i{
  display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:999px;background:#FFF4F3;
}
.bfx-failed-i svg{width:24px;height:24px;}
.bfx-failed-h{
  margin:40px 0 0!important;
  font-family:'Figtree',sans-serif!important;font-size:24px!important;font-weight:600!important;line-height:32px!important;
  letter-spacing:-.24px!important;color:#1C241F!important;
}
.bfx-failed-p{
  margin:-10px 0 0!important;
  font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:400!important;line-height:20px!important;color:#535E58!important;
}
.bfx-failed-slot{
  display:flex;flex-direction:column;gap:2px;margin-top:12px;padding:16px;border-radius:16px;background:#fff;
  border:1px solid #E3E7E5;
}
.bfx-failed-slot-t{font-family:'Figtree',sans-serif!important;font-size:16px!important;font-weight:500!important;line-height:24px!important;color:#1C241F!important;}
.bfx-failed-slot-s{font-family:'Figtree',sans-serif!important;font-size:12px!important;font-weight:400!important;line-height:16px!important;color:#6B746F!important;}
/* The design fixes these to the bottom of the screen. */
.bfx-failed-actions{
  position:fixed;left:0;right:0;bottom:0;z-index:30;
  display:flex;flex-direction:column;align-items:center;gap:4px;
  padding:12px 16px 30px;background:#fff;
}
.bfx-failed-actions .bfx-btn{width:370px;max-width:100%;height:48px;margin:0;}
.bfx-held{
  display:flex;align-items:center;gap:12px;width:370px;max-width:100%;
  padding:14px 16px;border-radius:16px;background:#F5F7F6;margin-bottom:8px;
}
.bfx-held-txt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
.bfx-held-t{font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:500!important;line-height:20px!important;color:#1C241F!important;}
.bfx-held-s{font-family:'Figtree',sans-serif!important;font-size:12px!important;font-weight:400!important;line-height:16px!important;color:#6B746F!important;}
.bfx-held-c{
  flex:none;font-family:'Figtree',sans-serif!important;font-size:18px!important;font-weight:600!important;line-height:24px!important;
  letter-spacing:-.09px!important;color:#2E7D5A!important;font-variant-numeric:tabular-nums;
}
.bfx-failed-alt{
  width:370px;max-width:100%;height:48px;border:0;background:none;cursor:pointer;
  font-family:'Figtree',sans-serif!important;font-size:16px!important;font-weight:600!important;line-height:20px!important;color:#2E7D5A!important;
}

/* ───────── Koott 2.0, step 1 extras and the note sheet ───────── */
.bfx-else-rule{width:370px;max-width:100%;height:1px;background:#E3E7E5;margin-top:24px;}
.bfx-else{display:flex;align-items:center;justify-content:space-between;gap:12px;width:370px;max-width:100%;margin-top:24px;}
.bfx-else-t{font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:600!important;line-height:20px!important;color:#9CA49F!important;}
.bfx-else-b{
  flex:none;height:36px;padding:8px 14px 8px 16px;border:0;border-radius:999px;background:#F5F7F6;cursor:pointer;
  font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:600!important;line-height:20px!important;color:#6B746F!important;
}
.bfx-sheet-wrap{position:fixed;inset:0;z-index:60;display:flex;align-items:flex-end;justify-content:center;}
.bfx-sheet-veil{position:absolute;inset:0;border:0;padding:0;background:rgba(13,20,15,.55);cursor:pointer;}
.bfx-sheet{
  position:relative;width:100%;max-width:402px;display:flex;flex-direction:column;gap:12px;
  padding:12px 16px 30px;border-radius:24px 24px 0 0;background:#fff;
}
.bfx-sheet-grip{width:44px;height:4px;border-radius:2px;background:#E3E7E5;align-self:center;margin-bottom:4px;}
.bfx-sheet-h{
  margin:0!important;font-family:'Figtree',sans-serif!important;font-size:18px!important;font-weight:600!important;
  line-height:24px!important;letter-spacing:-.09px!important;color:#1C241F!important;
}
.bfx-sheet-p{
  margin:0!important;font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:400!important;
  line-height:20px!important;color:#535E58!important;
}
.bfx-sheet-t{
  width:100%;min-height:120px;padding:12px;border-radius:12px;border:1px solid #E3E7E5;resize:vertical;outline:none;
  font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:500!important;line-height:20px!important;color:#1C241F!important;
}
.bfx-sheet-t:focus{border-color:#39AC71;}
.bfx-sheet .bfx-btn{width:100%;height:48px;margin:0;}

/* ───────── Koott 2.0 on a tablet and a laptop ─────────
   The Figma draws these steps at 402 and nothing wider. A phone has to show one
   thing at a time; a wider screen does not, so from 1024 the step keeps its own
   column and what has been chosen so far stands beside it instead of being out
   of sight until Review. Below that the step is simply centred — there is not
   room for two columns of this design on a tablet. */
@media (min-width:768px){
  .bf-in.is-fx{display:flex;flex-direction:column;align-items:center;}
  .bf-in.is-fx > *{width:100%;max-width:370px;}
  .bfx-top.is-k2{width:100%;max-width:370px;}
  .bf-in.is-fx > .bfx-rv2,
  .bf-in.is-fx > .bfx-failed{max-width:370px;}
  .bfx-sched.is-k2,.bfx-types,.bfx-plans.is-k2,.bfx-modes,.bfx-else,.bfx-else-rule{margin-left:auto;margin-right:auto;}
  .bfx-paybar,.bfx-failed-actions{padding-left:0;padding-right:0;}
  .bfx-sheet{border-radius:24px;margin-bottom:24px;}
  .bfx-sheet-wrap{align-items:center;}
  /* The summary belongs to the two-column layout below; a tablet shows the step
     alone, as a phone does. */
  .bfx-aside{display:none;}
}

@media (min-width:1024px){
  .bf-in.is-fx{
    display:grid;align-items:start;justify-content:center;
    grid-template-columns:minmax(0,402px) 340px;column-gap:48px;
    max-width:1100px;padding:40px 24px 120px;
  }
  /* Every step's blocks are siblings here, so they all take the first column and
     stack by rows; the summary takes the second and stays put while they change. */
  .bf-in.is-fx > *{grid-column:1;width:100%;max-width:402px;}
  .bf-in.is-fx > .bfx-top{grid-column:1 / -1;max-width:none;}
  .bf-in.is-fx > .bfx-aside{
    /* A row end of -1 would be the end of the explicit grid, which has no rows
       declared here, so the span is written out instead. */
    grid-column:2;grid-row:2 / span 50;display:block;max-width:340px;
    position:sticky;top:96px;align-self:start;
  }
  .bfx-aside-card{
    display:flex;flex-direction:column;gap:16px;padding:20px;border-radius:24px;background:#fff;
    border:1px solid #E3E7E5;
    box-shadow:0 2px 5px rgba(28,36,31,.02),0 9px 9px rgba(28,36,31,.02),0 20px 12px rgba(28,36,31,.02);
  }
  .bfx-aside-who{display:flex;align-items:center;gap:12px;}
  .bfx-aside-who img,.bfx-aside-ph{
    width:48px;height:48px;border-radius:50%;object-fit:cover;flex:none;
    box-shadow:0 0 0 3px #F5F7F6;background:#E9F1E4;
    display:flex;align-items:center;justify-content:center;color:#1B6930;font:600 16px/1 'Figtree',sans-serif;
  }
  .bfx-aside-whotxt{display:flex;flex-direction:column;gap:2px;min-width:0;}
  .bfx-aside-n{font-family:'Figtree',sans-serif!important;font-size:16px!important;font-weight:600!important;line-height:24px!important;color:#1C241F!important;}
  .bfx-aside-r{font-family:'Figtree',sans-serif!important;font-size:11px!important;font-weight:600!important;line-height:16px!important;letter-spacing:.55px!important;text-transform:uppercase;color:#535E58!important;}
  .bfx-aside-div{height:1px;background:#E3E7E5;}
  .bfx-aside-rows{display:flex;flex-direction:column;gap:12px;margin:0;}
  .bfx-aside-row{display:flex;align-items:baseline;justify-content:space-between;gap:12px;}
  .bfx-aside-row dt{font-family:'Figtree',sans-serif!important;font-size:12px!important;font-weight:400!important;line-height:16px!important;color:#6B746F!important;margin:0;}
  .bfx-aside-row dd{
    margin:0;text-align:right;
    font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:500!important;line-height:20px!important;color:#1C241F!important;
  }
  .bfx-aside-row dd i{font-style:normal;color:#9CA49F!important;font-weight:400!important;}
  .bfx-aside-total{display:flex;align-items:center;justify-content:space-between;}
  .bfx-aside-total span{font-family:'Figtree',sans-serif!important;font-size:14px!important;font-weight:600!important;line-height:20px!important;color:#535E58!important;}
  .bfx-aside-total strong{font-family:'Figtree',sans-serif!important;font-size:18px!important;font-weight:600!important;line-height:24px!important;letter-spacing:-.09px!important;color:#1C241F!important;}
  .bfx-aside-note{
    margin:12px 4px 0!important;
    font-family:'Figtree',sans-serif!important;font-size:12px!important;font-weight:400!important;line-height:16px!important;color:#9CA49F!important;
  }
  /* Review and pay and the failure screen have no summary beside them, so they
     take the middle of the page rather than sitting off to one side. */
  .bf-in.is-fx:not(:has(.bfx-aside)){grid-template-columns:minmax(0,402px);}
  .bfx-paybar .bfx-btn,.bfx-failed-actions .bfx-btn,.bfx-failed-alt{max-width:402px;}
}

/* step 1: schedule */
.bfx-title-who{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.bfx-who-photo{width:32px;height:32px;border-radius:40px;object-fit:cover;flex:none;}
.bfx-who-photo.is-empty{display:inline-flex;align-items:center;justify-content:center;background:#E9F1E4;color:#1B6930;font:600 12px/1 'Inter',sans-serif;}
.bfx-sched{display:flex;gap:32px;align-items:flex-start;}
.bfx-cal{width:380px;flex:none;box-sizing:border-box;padding:24px;border:1px solid #E3E2E2;border-radius:16px;background:#fff;display:flex;flex-direction:column;gap:16px;}
.bfx-cal-top{display:flex;align-items:center;justify-content:space-between;height:22px;}
.bfx-cal-top button{background:none;border:0;padding:0;cursor:pointer;width:20px;height:20px;}
.bfx-cal-top button img{display:block;}
.bfx-cal-top span{font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;font-weight:500!important;line-height:22px!important;color:#0F0F0F!important;}
.bfx-cal-dow,.bfx-cal-days{display:grid;grid-template-columns:repeat(7,30px);justify-content:space-between;}
.bfx-cal-dow{margin-bottom:-8px;}
.bfx-cal-dow span{height:20px;text-align:center;font-family:'Inter',system-ui,sans-serif!important;font-size:12px!important;line-height:18px!important;padding-top:1px;color:#9CA3AF!important;}
.bfx-cal-days{row-gap:8px;}
.bfx-cal-days.is-busy{opacity:.55;}
.bfx-day{
  width:30px;height:30px;padding:0;border:1px solid transparent;border-radius:40px;background:none;cursor:pointer;
  font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;font-weight:400!important;line-height:22px!important;color:#9CA3AF!important;
}
.bfx-day:disabled{cursor:default;}
.bfx-day.has-slots{border-color:#DDEED8;color:#0F0F0F!important;}
.bfx-day.is-on{background:#189E4F;border-color:#189E4F;color:#fff!important;}
.bfx-slots{width:500px;max-width:100%;display:flex;flex-direction:column;gap:16px;}
.bfx-sum{display:flex;flex-direction:column;gap:8px;padding:16px;background:#F0F5ED;border:1px solid #DDEED8;border-radius:12px;}
.bfx-sum-h{font-family:'Inter',system-ui,sans-serif!important;font-size:18px!important;font-weight:500!important;line-height:26px!important;color:#0F0F0F!important;}
.bfx-sum-s{display:flex;align-items:center;gap:12px;font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;line-height:22px!important;color:#373737!important;}
.bfx-sum-s img{margin-right:-6px;}
.bfx-sum-s i{display:block;width:6px;height:6px;border-radius:50%;background:#D6DCD8;}
.bfx-periods{display:flex;flex-direction:column;gap:16px;}
.bfx-period{display:flex;flex-direction:column;gap:8px;}
.bfx-period > img{display:block;}
.bfx-period-row{display:flex;flex-wrap:wrap;gap:8px;}
.bfx-pair{display:flex;gap:12px;}
.bfx-slot{
  width:117px;height:58px;padding:16px;background:#fff;border:1px solid #E8EFE5;border-radius:8px;cursor:pointer;box-sizing:border-box;
  font-family:'Inter',system-ui,sans-serif!important;font-size:16px!important;font-weight:500!important;line-height:24px!important;color:#0F0F0F!important;
}
.bfx-slot:hover,.bfx-slot.is-on{border-color:#189E4F;}
.bfx-tz{
  align-self:flex-start;display:flex;align-items:center;gap:6px;padding:5px 12px;background:#F9F9F9;border-radius:6px;margin-top:0;
  font-family:'Inter',system-ui,sans-serif!important;font-size:12px!important;line-height:18px!important;color:#373737!important;
}
.bfx-tz i{display:block;width:4px;height:4px;border-radius:50%;background:#D6DCD8;margin:0 2px;}

/* step 2: plans */
.bfx-plan-wrap{display:flex;flex-direction:column;gap:32px;}
.bfx-tabs{display:flex;gap:12px;}
.bfx-tab{
  height:32px;padding:5px 16px;border:1px solid #E3E2E2;border-radius:56px;background:none;cursor:pointer;
  font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;font-weight:400!important;line-height:22px!important;color:#0F0F0F!important;
}
.bfx-tab.is-on{background:#EFFFEA;border-color:#BFE3CB;font-weight:500!important;color:#1B6930!important;}
.bfx-plans{display:flex;flex-wrap:wrap;gap:16px;}
.bfx-plan{
  width:278px;height:192px;padding:20px 22px;box-sizing:border-box;background:#fff;border:1px solid #E3E2E2;border-radius:16px;cursor:pointer;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
}
.bfx-plan.is-on,.bfx-plan:hover{border-color:#189E4F;box-shadow:0 8px 12px #EBF3EE;}
.bfx-plan-chip{padding:3px 12px;border-radius:13px;background:#FAFCF9;font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;line-height:22px!important;color:#373737!important;}
.bfx-plan-p{display:flex;align-items:center;gap:8px;font-family:'Poppins',ui-sans-serif,system-ui,sans-serif!important;font-size:24px!important;font-weight:500!important;line-height:1.66!important;color:#0F0F0F!important;}
.bfx-plan-p s{font-family:'Inter',system-ui,sans-serif!important;font-size:18px!important;font-weight:400!important;line-height:26px!important;color:#9CA3AF!important;}
.bfx-plan-u{font-family:'Inter',system-ui,sans-serif!important;font-size:12px!important;line-height:18px!important;color:#7C7C7C!important;}

/* step 3: about yourself */
.bfx-form{display:flex;flex-direction:column;gap:24px;width:520px;max-width:100%;}
.bfx-field{display:flex;flex-direction:column;gap:8px;}
.bfx-label{font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;font-weight:400!important;line-height:22px!important;color:#373737!important;}
.bfx-field input{
  height:40px;box-sizing:border-box;padding:0 16px;border:1px solid #E3E2E2;border-radius:8px;background:#fff;width:100%;
  font-family:'Inter',system-ui,sans-serif!important;font-size:16px!important;font-weight:400!important;line-height:24px!important;color:#373737!important;
}
.bfx-field input::placeholder{color:#BCBCBC;}
.bfx-field input:focus{outline:none;border-color:#189E4F;}
.bfx-field input.is-fixed{background:#F9F9F9;border-color:#E5E5EA;color:#5C5C5C!important;}
.bfx-field input::-webkit-outer-spin-button,.bfx-field input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
.bfx-next{margin-top:48px;width:100px;}

/* step 4: review & pay (full width, two halves) */
.bfx-review{display:grid;grid-template-columns:1fr 1fr;min-height:calc(100vh - 63px);background:#E9F1E4;}
.bfx-rv-left{padding:56px 120px 48px;border-radius:16px;}
.bfx-rv-inner{max-width:720px;display:flex;flex-direction:column;gap:0;}
.bfx-rv-inner .bfx-dots{margin:0 0 32px;}
.bfx-rv-inner .bfx-title{margin:0 0 24px;}
.bfx-bill{display:flex;flex-direction:column;gap:16px;margin:0 0 24px;}
.bfx-bill-h{font-family:'Inter',system-ui,sans-serif!important;font-size:16px!important;line-height:24px!important;color:#5C5C5C!important;}
.bfx-bill-row{display:flex;justify-content:space-between;align-items:center;gap:8px;font-family:'Inter',system-ui,sans-serif!important;font-size:18px!important;line-height:26px!important;color:#0F0F0F!important;}
.bfx-bill-row strong{font-weight:600!important;}
.bfx-total{display:flex;flex-direction:column;align-items:flex-end;gap:8px;padding:8px 12px;border-radius:8px;background:#F9FFF8;margin:0 0 16px;}
.bfx-total-row{display:flex;justify-content:space-between;align-items:center;width:100%;gap:2px;}
.bfx-total-row span{font-family:'Inter',system-ui,sans-serif!important;font-size:16px!important;line-height:24px!important;color:#5C5C5C!important;}
.bfx-total-row strong{font-family:'Poppins',ui-sans-serif,system-ui,sans-serif!important;font-size:24px!important;font-weight:600!important;line-height:36px!important;color:#189E4F!important;}
.bfx-total p{margin:0;font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;line-height:22px!important;color:#373737!important;}
.bfx-terms{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:0 0 40px;}
.bfx-terms > span:first-child{font-family:'Inter',system-ui,sans-serif!important;font-size:12px!important;line-height:18px!important;color:#5C5C5C!important;}
.bfx-terms a{color:inherit!important;text-decoration:underline;}
.bfx-secure{display:flex;align-items:flex-end;gap:6px;flex:none;font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;line-height:22px!important;color:#5C5C5C!important;}
.bfx-rv-inner .bfx-btn{align-self:flex-start;}
.bfx-rv-inner .bf-err{margin:-24px 0 16px;}
.bfx-rv-right{position:relative;padding:98px 120px 24px;overflow:hidden;}
.bfx-rv-mark{position:absolute;left:452px;top:539px;width:702px;height:587px;pointer-events:none;}
.bfx-ticket{position:relative;z-index:1;max-width:720px;box-sizing:border-box;padding:40px;border-radius:24px;background:#fff;display:flex;flex-direction:column;gap:72px;}
.bfx-ticket::before{content:'';position:absolute;left:40px;right:40px;top:23px;height:400px;max-height:calc(100% - 23px);background:#BDBDBD;filter:blur(64px);z-index:-2;border-radius:24px;}
.bfx-ticket::after{content:'';position:absolute;inset:0;background:#fff;border-radius:24px;z-index:-1;}
.bfx-tk-band{position:absolute;left:0;right:0;top:0;height:148px;background:#FAFCF9;border-radius:24px 24px 0 0;z-index:0;}
.bfx-tk-who{position:relative;display:flex;align-items:center;gap:8px;}
.bfx-tk-photo{width:72px;height:72px;border-radius:40px;object-fit:cover;flex:none;}
.bfx-tk-photo.is-empty{display:flex;align-items:center;justify-content:center;background:#E9F1E4;color:#1B6930;font:600 20px/1 'Inter',sans-serif;}
.bfx-tk-whotxt{display:flex;flex-direction:column;gap:0;}
.bfx-tk-lbl{margin-bottom:2px;}
.bfx-tk-lbl{display:flex;align-items:center;gap:6px;font-family:'Inter',system-ui,sans-serif!important;font-size:12px!important;line-height:18px!important;color:#5C5C5C!important;}
.bfx-tk-name{font-family:'Poppins',ui-sans-serif,system-ui,sans-serif!important;font-size:20px!important;font-weight:500!important;line-height:30px!important;color:#0F0F0F!important;}
.bfx-tk-role{font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;line-height:22px!important;color:#373737!important;}
.bfx-edit{background:none;border:0;padding:0;cursor:pointer;width:16px;height:16px;display:inline-flex;}
.bfx-edit img{display:block;}
.bfx-tear{position:absolute;left:-24px;right:-24px;top:124px;height:48px;display:flex;align-items:center;pointer-events:none;}
.bfx-tear i{display:block;width:48px;height:48px;border-radius:50%;background:#E9F1E4;flex:none;}
.bfx-tear b{display:block;flex:1;height:0;border-top:1px dashed #DDEED8;margin:0 -2px;}
.bfx-tiles{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.bfx-tile{position:relative;display:flex;flex-direction:column;justify-content:center;gap:2px;min-height:102px;box-sizing:border-box;padding:16px;border-radius:8px;background:#F9F9F9;}
.bfx-tl{font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;line-height:22px!important;color:#5C5C5C!important;}
.bfx-tile strong{font-family:'Inter',system-ui,sans-serif!important;font-size:16px!important;font-weight:500!important;line-height:24px!important;color:#0F0F0F!important;}
.bfx-tile em{display:flex;align-items:center;gap:4px;margin-top:2px;font-style:normal;font-family:'Inter',system-ui,sans-serif!important;font-size:12px!important;line-height:18px!important;color:#5C5C5C!important;}
.bfx-tile em i{display:block;width:4px;height:4px;border-radius:50%;background:#D6DCD8;margin:0 4px;}
.bfx-tile-edit{position:absolute;right:16px;top:43px;}

/* "Leaving already?" popups */
.bfx-leave{position:fixed;left:0;right:0;bottom:0;top:63px;z-index:70;background:rgba(21,21,21,.45);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;justify-content:center;align-items:flex-start;padding:167px 16px 16px;box-sizing:border-box;}
.bfx-leave-card{position:relative;width:331px;max-width:100%;box-sizing:border-box;padding:24px;border-radius:16px;background:#fff;display:flex;flex-direction:column;align-items:center;gap:24px;}
.bfx-leave-card.is-review{width:426px;}
.bfx-leave-x{position:absolute;right:16px;top:16px;width:24px;height:24px;padding:0;border:0;background:none;cursor:pointer;}
.bfx-leave-x img{display:block;}
.bfx-leave-top{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%;}
.bfx-leave-ic{display:flex;align-items:center;justify-content:center;width:48px;height:48px;box-sizing:border-box;padding:8px;border:1px solid #FFF4E8;border-radius:8px;}
.bfx-leave-txt{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;}
.bfx-leave-h{font-family:'Inter',system-ui,sans-serif!important;font-size:18px!important;font-weight:500!important;line-height:26px!important;color:#0F0F0F!important;}
.bfx-leave-p{margin:0;text-align:center;font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;font-weight:400!important;line-height:22px!important;color:#373737!important;}
.bfx-leave-btns{display:flex;gap:16px;justify-content:center;}
.bfx-btn-line{
  display:inline-flex;align-items:center;justify-content:center;height:40px;box-sizing:border-box;padding:7px 18px;border:1px solid #BFE3CB;border-radius:8px;background:#fff;cursor:pointer;text-decoration:none;
  font-family:'Inter',system-ui,sans-serif!important;font-size:16px!important;font-weight:500!important;line-height:24px!important;color:#0F0F0F!important;
}
.bfx-leave-btns .bfx-btn{display:inline-flex;align-items:center;justify-content:center;}
.bfx-leave-card.is-review .bfx-leave-btns{width:100%;}
.bfx-leave-card.is-review .bfx-btn-line{flex:0 0 157px;}
.bfx-leave-card.is-review .bfx-btn{flex:1 1 auto;}

/* verifying payment */
.bfx-verify{position:fixed;left:0;right:0;bottom:0;top:63px;z-index:60;background:#fff;display:flex;flex-direction:column;align-items:center;padding:136px 16px 0;gap:8px;}
.bfx-verify-ic{animation:bfxSpin 1s linear infinite;}
@keyframes bfxSpin{to{transform:rotate(360deg);}}
.bfx-verify-h{margin-top:0;font-family:'Poppins',ui-sans-serif,system-ui,sans-serif!important;font-size:20px!important;font-weight:500!important;line-height:30px!important;color:#0F0F0F!important;text-align:center;}
.bfx-verify-s{margin:0;max-width:384px;text-align:center;font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;line-height:22px!important;color:#373737!important;}

/* payment success */
.bfx-done{min-height:calc(100vh - 63px);background:#E9F1E4;display:flex;flex-direction:column;align-items:center;padding:56px 16px 120px;box-sizing:border-box;}
.bfx-done-head{display:flex;flex-direction:column;align-items:center;gap:8px;padding:32px 0;}
.bfx-done-head img{display:block;}
.bfx-done-head .bfx-title{margin:0;}
.bfx-ticket.is-done{width:720px;max-width:100%;gap:80px;margin-top:8px;}
.bfx-ticket.is-done .bfx-tk-band{height:204px;}
.bfx-ticket.is-done .bfx-tear{top:180px;}
.bfx-done-who{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;}
.bfx-done-who .bfx-tk-photo{width:64px;height:64px;}
.bfx-done-who .bfx-tk-role{margin-top:-8px;}
.bfx-tiles.is-small .bfx-tile{min-height:74px;}
.bfx-tiles.is-small .bfx-tl{font-size:12px!important;line-height:18px!important;color:#7C7C7C!important;}
.bfx-tiles.is-small .bfx-tile strong{font-size:14px!important;line-height:22px!important;}
.bfx-order{position:relative;display:flex;justify-content:center;gap:8px;margin-top:-64px;font-family:'Inter',system-ui,sans-serif!important;font-size:12px!important;line-height:18px!important;}
.bfx-order span{color:#7C7C7C!important;}
.bfx-order strong{font-weight:500!important;color:#0F0F0F!important;word-break:break-all;}
.bfx-done > .bfx-btn{margin-top:48px;}

@media (max-width:1100px){
  .bfx-review{grid-template-columns:1fr;}
  .bfx-rv-left{padding:56px 24px 32px;}
  .bfx-rv-right{padding:24px 24px 120px;}
  .bfx-rv-mark{left:auto;right:-200px;top:auto;bottom:-200px;}
  .bfx-sched{flex-wrap:wrap;}
}
@media (max-width:720px){
  .bf-in.is-fx{padding:16px 16px 90px;}
  .bfx-top{margin:0 0 16px;}
  .bfx-types{width:100%;}
  .bfx-sched{flex-direction:column;gap:24px;}
  .bfx-cal{width:100%;}
  .bfx-slots{width:100%;}
  .bfx-period-row{flex-direction:column;gap:8px;}
  .bfx-pair{gap:12px;}
  .bfx-slot{width:calc(50% - 6px);flex:0 0 calc(50% - 6px);min-width:0;}
  .bfx-pair{width:100%;}
  .bfx-tz{align-self:stretch;justify-content:center;white-space:nowrap;padding:5px 9px;}
  .bfx-plans{flex-direction:column;}
  .bfx-plan{width:100%;height:138px;}
  .bfx-form{width:100%;}
  .bfx-next{width:100%;}
  /* Review & Pay, phone (1123:12984): dots, title, ticket, then bill + Agree & Pay */
  .bfx-review{display:flex;flex-direction:column;padding:16px 16px 90px;min-height:0;}
  .bfx-rv-left,.bfx-rv-inner{display:contents;}
  .bfx-rv-inner .bfx-dots{order:1;margin:0 0 16px;}
  .bfx-rv-inner .bfx-title{order:2;margin:0 0 24px;}
  .bfx-rv-right{order:3;padding:0;overflow:visible;margin:0 0 40px;}
  .bfx-rv-mark{display:none;}
  .bfx-bill{order:4;}
  .bfx-total{order:5;}
  .bfx-terms{order:6;flex-direction:column;align-items:flex-start;margin:0 0 24px;}
  .bfx-rv-inner .bf-err{order:7;margin:0 0 16px;}
  .bfx-rv-inner .bfx-btn{order:8;width:100%;}
  .bfx-ticket{padding:40px;gap:72px;}
  .bfx-tear{left:-20px;right:-20px;top:128px;height:40px;}
  .bfx-tear i{width:40px;height:40px;}
  .bfx-tiles{grid-template-columns:1fr;gap:12px;}
  .bfx-done{padding:16px 16px 90px;}
  .bfx-done > .bfx-btn{width:100%;}
  .bfx-ticket.is-done{gap:72px;}
  .bfx-ticket.is-done .bfx-tk-band{height:200px;}
  .bfx-ticket.is-done .bfx-tear{top:180px;}
  .bfx-tiles.is-small .bfx-tile{min-height:80px;}
  .bfx-tiles.is-small .bfx-tl{font-size:14px!important;line-height:22px!important;color:#5C5C5C!important;}
  .bfx-order{margin-top:-56px;flex-wrap:wrap;}
  .bfx-ticket.is-done{margin-top:16px;}
  .bfx-done > .bfx-btn{margin-top:40px;}
  .bfx-tiles.is-small .bfx-tile strong{font-size:16px!important;line-height:24px!important;}
  .bfx-verify{padding-top:48px;}
}

/* Sign-in step (Figma "OTP"): 1180 wide, title Poppins 24, field 372, Get OTP + Try another way */
.bf-in.is-signin{max-width:1228px;padding-top:56px;}
.bf-in.is-signin .bf-back{margin:0 0 16px;width:24px;height:24px;}
.bf-in.is-signin .bf-back img{display:block;width:24px;height:24px;}
.bf-si-head{display:flex;flex-direction:column;gap:4px;margin:0 0 24px;}
.bf-si-title{
  font-family:'Poppins',ui-sans-serif,system-ui,sans-serif!important;font-size:24px!important;font-weight:500!important;
  line-height:1.66!important;color:#0F0F0F!important;letter-spacing:0!important;margin:0;
}
.bf-si-sub{
  font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;font-weight:400!important;
  line-height:22px!important;color:#373737!important;margin:0;
}
.is-signin .bf-otp{gap:48px;max-width:none;}
.bf-si-field{display:flex;flex-direction:column;gap:8px;width:372px;max-width:100%;}
.bf-si-label{font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;font-weight:400!important;line-height:22px!important;color:#373737!important;}
.bf-si-input{
  display:flex;align-items:center;gap:12px;height:40px;padding:0 16px;background:#fff;
  border:1px solid #E3E2E2;border-radius:8px;box-sizing:border-box;
}
.bf-si-input:focus-within{border-color:#189E4F;}
.bf-si-country{position:relative;display:flex;align-items:center;gap:4px;flex:none;}
.bf-si-country > img:first-child,.bf-si-flag{margin-right:4px;}
.bf-si-flag{font-size:20px;line-height:24px;width:24px;text-align:center;}
.bf-si-iso{font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;font-weight:500!important;line-height:22px!important;color:#373737!important;}
.bf-si-country select{position:absolute;inset:0;width:100%;opacity:0;cursor:pointer;font-size:16px;}
.is-signin .bf-si-input input{
  flex:1;min-width:0;border:0!important;padding:0!important;border-radius:0;background:transparent;height:38px;
  font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;font-weight:500!important;color:#373737!important;
}
.is-signin .bf-si-input input:focus{outline:none;}
.bf-si-actions{display:flex;flex-direction:column;align-items:flex-start;gap:16px;}
.bf-si-btn{
  height:40px;padding:8px 22px;border:0;border-radius:8px;background:#189E4F;color:#fff!important;cursor:pointer;
  font-family:'Inter',system-ui,sans-serif!important;font-size:16px!important;font-weight:500!important;line-height:24px!important;
}
.bf-si-btn:disabled{background:#9CA3AF;cursor:default;}
.bf-si-alt{
  height:40px;padding:7px 0;border:0;background:none;cursor:pointer;color:#189E4F!important;
  font-family:'Inter',system-ui,sans-serif!important;font-size:16px!important;font-weight:500!important;line-height:24px!important;
}
.is-signin .bf-otp:not(.is-code) > .bf-otp-note,.is-signin .bf-otp:not(.is-code) > .bf-err{margin-top:-32px;}
.is-signin .bf-otp.is-code{gap:16px;}
.is-signin .bf-otp.is-code .bf-otp-to{margin-bottom:8px;}

@media (max-width:900px){
  .bf-when{grid-template-columns:1fr;}
  .bf-cal{padding-right:0;border-right:0;padding-bottom:26px;border-bottom:1px solid rgba(17,17,17,.1);}
  .bf-slots{padding-left:0;padding-top:24px;}
  .bf-plans,.bf-form{grid-template-columns:1fr;}
}
@media (max-width:720px){
  /* Sign-in step, phone (Figma 1123:12462): 16px sides, 16px subtitle, taller field,
     buttons side by side, the faint Koott mark at the bottom right */
  .bf-in.is-signin{padding:16px 16px 90px;position:relative;}
  .bf-in.is-signin::after{
    content:'';position:fixed;right:-80px;bottom:-60px;width:308px;height:214px;z-index:0;pointer-events:none;
    background:url(/design/booking/mark-watermark.svg) no-repeat center/contain;transform:rotate(-18.64deg);
  }
  .bf-in.is-signin > *{position:relative;z-index:1;}
  .bf-si-sub{font-size:16px!important;line-height:24px!important;}
  .bf-si-field{width:100%;}
  .bf-si-input{height:46px;}
  .bf-si-actions{flex-direction:row;align-items:center;width:100%;}
  .bf-si-btn,.bf-si-alt{flex:0 0 calc(50% - 8px);min-width:0;box-sizing:border-box;}
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
