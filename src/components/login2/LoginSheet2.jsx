'use client';

/**
 * Sign-in sheet (Koott 2.0) — Figma "Koott 2.0", section Login (7858:83253).
 *
 *   phone    → POST /phone-verification/send      a 6-digit code on WhatsApp
 *   code     → POST /phone-verification/verify    the number's account signs in here
 *   about    → POST /phone-verification/create-account   first time on this number
 *
 * That is the same verification the booking flow uses (backend utils/phoneVerification.js),
 * so a number verified in one place is the same account in the other.
 *
 * SMS: the design draws an SMS screen first and WhatsApp second, but nothing sends SMS
 * yet — there is no provider wired. SMS_READY turns that screen on in one line once there
 * is one; until then the sheet opens on WhatsApp and says so.
 *
 * Email and password have not gone anywhere: "Try another way" hands back to the old form,
 * which is how staff sign in and how anyone without WhatsApp still gets in.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LOGIN2_CSS } from './login2.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
const SMS_READY = false;
const CODE_LEN = 6; // what a real code is; test modes may send a shorter one

const I = {
  chevron: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 7.5 10 12.5 15 7.5" stroke="#6B746F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chevronSm: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6.5 8 10.5 12 6.5" stroke="#6B746F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  india: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="20" height="6.67" fill="#FF9933" />
      <rect x="1" y="7.67" width="20" height="6.66" fill="#F7F7F7" />
      <rect x="1" y="14.33" width="20" height="6.67" fill="#138808" />
      <circle cx="11" cy="11" r="2.6" stroke="#428BC1" strokeWidth="1" fill="none" />
    </svg>
  ),
  whatsapp: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="#1B6930" aria-hidden="true">
      <path d="M8 0a8 8 0 0 0-6.9 12L0 16l4.1-1.1A8 8 0 1 0 8 0Zm0 14.5a6.4 6.4 0 0 1-3.3-.9l-.24-.14-2.44.64.65-2.38-.15-.25A6.5 6.5 0 1 1 8 14.5Zm3.6-4.6c-.2-.1-1.17-.57-1.35-.64-.18-.07-.31-.1-.44.1-.13.2-.5.63-.62.76-.11.13-.23.15-.43.05a5.3 5.3 0 0 1-2.63-2.3c-.2-.34.2-.32.57-1.05a.36.36 0 0 0-.02-.34c-.05-.1-.44-1.06-.6-1.45-.16-.38-.32-.33-.44-.33h-.38a.72.72 0 0 0-.52.24 2.18 2.18 0 0 0-.68 1.62 3.8 3.8 0 0 0 .79 2 8.65 8.65 0 0 0 3.31 2.92c1.23.53 1.71.58 2.33.48.37-.05 1.17-.47 1.33-.94.17-.46.17-.86.12-.94-.05-.09-.18-.14-.38-.23Z" />
    </svg>
  ),
  alert: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="#D74745" strokeWidth="2" />
      <path d="M8 5v3.5M8 11h.01" stroke="#D74745" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

const GENDERS = ['Female', 'Male', 'Other', 'Prefer not to say'];
const tidyPhone = (v) => String(v || '').replace(/\D/g, '').slice(0, 10);
const spaced = (v) => (v.length > 5 ? `${v.slice(0, 5)} ${v.slice(5)}` : v);
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function LoginSheet2({ open, onClose, onSignedIn, onEmailMode, title }) {
  const { login } = useAuth();
  const [shown, setShown] = useState(false);
  const [step, setStep] = useState('phone'); // phone | code | about
  const [channel, setChannel] = useState(SMS_READY ? 'sms' : 'whatsapp');
  const [phone, setPhone] = useState('');
  const [len, setLen] = useState(CODE_LEN);
  const [digits, setDigits] = useState(Array(CODE_LEN).fill(''));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [left, setLeft] = useState(0);
  const [token, setToken] = useState('');
  const [about, setAbout] = useState({ name: '', year: '', gender: '', email: '' });
  const boxes = useRef([]);
  const numberRef = useRef(null);

  const code = digits.join('');
  const thisYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 90 }, (_, i) => thisYear - 13 - i),
    [thisYear],
  );

  /* open and close */
  useEffect(() => {
    if (!open) { setShown(false); return undefined; }
    const t = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    setStep('phone'); setLen(CODE_LEN); setDigits(Array(CODE_LEN).fill('')); setErr(''); setNote(''); setBusy(false);
    const esc = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', esc);
    const was = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = was; };
  }, [open, onClose]);

  useEffect(() => {
    if (!left) return undefined;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  useEffect(() => { if (step === 'code') boxes.current[0]?.focus(); }, [step]);

  const post = useCallback(async (path, body) => {
    const res = await fetch(`${API}/phone-verification/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      const e = new Error(json.message || 'Something went wrong. Please try again.');
      e.code = json.code; e.retryAfter = json.retryAfter;
      throw e;
    }
    return json.data || {};
  }, []);

  const finish = useCallback((auth) => {
    login(auth.user, auth.token, { remember: true, method: 'phone' });
    onSignedIn?.(auth.user);
  }, [login, onSignedIn]);

  const send = async () => {
    if (phone.length !== 10 || busy) return;
    setBusy(true); setErr(''); setNote('');
    try {
      const d = await post('send', { phone: `+91${phone}` });
      // Local testing only (PHONE_OTP_DEV_ECHO / PHONE_OTP_TEST_NUMBERS / PHONE_OTP_ANY_NUMBER),
      // where the code comes back in the answer and can be shorter than six digits.
      const n = d.devCode ? String(d.devCode).length : CODE_LEN;
      setLen(n); setStep('code'); setDigits(Array(n).fill('')); setLeft(d.resendAfter || 30);
      if (d.devCode) setNote(`Test mode — nothing was sent. Your code is ${d.devCode}.`);
    } catch (e) {
      setErr(e.message);
      if (e.retryAfter) setLeft(e.retryAfter);
    } finally { setBusy(false); }
  };

  const verify = async (value = code) => {
    if (value.length !== len || busy) return;
    setBusy(true); setErr('');
    try {
      const d = await post('verify', { phone: `+91${phone}`, code: value });
      if (d.signInRequired) {
        setErr('This number already has a Koott account. Please sign in with your email.');
        return;
      }
      setToken(d.token || '');
      if (d.found && d.auth?.token) { finish(d.auth); return; }
      setStep('about');
    } catch (e) {
      // The wrong code stays on screen in red, as the design draws it; the next
      // digit typed starts a fresh code (see typeDigit).
      setErr(e.message);
      boxes.current[0]?.focus();
    } finally { setBusy(false); }
  };

  const createAccount = async () => {
    const name = about.name.trim();
    if (name.length < 2) { setErr('Please enter your name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(about.email.trim())) {
      setErr('Please enter an email we can send your session details to.');
      return;
    }
    setBusy(true); setErr('');
    try {
      const d = await post('create-account', {
        phoneToken: token,
        name,
        email: about.email.trim(),
        yearOfBirth: about.year || undefined,
        gender: about.gender || undefined,
      });
      if (d.auth?.token) finish(d.auth);
    } catch (e) {
      setErr(e.code === 'EMAIL_EXISTS'
        ? 'That email already has a Koott account. Sign in with it, or use another address.'
        : e.message);
    } finally { setBusy(false); }
  };

  /* the six boxes */
  const typeDigit = (i, raw) => {
    const only = String(raw || '').replace(/\D/g, '');
    if (!only) { setDigits((d) => d.map((c, n) => (n === i ? '' : c))); return; }
    // After "that code is not right" the six red boxes are cleared by typing again.
    const next = err ? Array(len).fill('') : [...digits];
    setErr('');
    only.split('').forEach((ch, n) => { if (i + n < len) next[i + n] = ch; });
    setDigits(next);
    const to = Math.min(i + only.length, len - 1);
    boxes.current[to]?.focus();
    if (next.every(Boolean)) verify(next.join(''));
  };

  const boxKey = (i) => (e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault();
      setDigits((d) => d.map((c, n) => (n === i - 1 ? '' : c)));
      boxes.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) boxes.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < len - 1) boxes.current[i + 1]?.focus();
  };

  if (!open) return null;

  const onWhatsapp = channel === 'whatsapp';
  const full = `+91 ${spaced(phone)}`;

  const phoneRow = (
    <div className="lgn-phone">
      <div className="lgn-cc" aria-label="Country: India (+91)">
        {I.india}<b>IN</b>{I.chevronSm}
      </div>
      <div className="lgn-num">
        <input
          ref={numberRef}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          aria-label="Mobile number"
          placeholder="98765 43210"
          value={spaced(phone)}
          onChange={(e) => { setErr(''); setPhone(tidyPhone(e.target.value)); }}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        />
      </div>
    </div>
  );

  return (
    <div
      className={`lgn${shown ? ' is-in' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Sign in to Koott'}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <style dangerouslySetInnerHTML={{ __html: LOGIN2_CSS }} />
      <div className="lgn-sheet">
        <div className="lgn-handle"><span /></div>

        {step === 'code' && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img className="lgn-mark" src="/favicon-512.png" alt="" width={48} height={48} />
        )}

        {step === 'phone' && (
          <>
            <div className="lgn-body">
              <div className="lgn-intro">
                <h2 className="lgn-title">Enter your phone number</h2>
                <p className="lgn-sub">
                  {onWhatsapp
                    ? 'We’ll send you a 6-digit code on WhatsApp.'
                    : 'We’ll send you a text with a verification code.'}
                </p>
              </div>
              {onWhatsapp ? (
                <div className="lgn-wa">
                  <div className="lgn-wa-tag">{I.whatsapp}<span>Whatsapp Number</span></div>
                  {phoneRow}
                </div>
              ) : phoneRow}
              {err && <div className="lgn-bad">{I.alert}<p>{err}</p></div>}
            </div>
            <div className="lgn-foot">
              <button type="button" className="lgn-go" disabled={phone.length !== 10 || busy} onClick={send}>
                {busy ? <span className="lgn-spin" /> : 'Get code'}
              </button>
              <button
                type="button"
                className="lgn-alt"
                onClick={() => (SMS_READY ? setChannel(onWhatsapp ? 'sms' : 'whatsapp') : onEmailMode?.())}
              >
                Try another way
              </button>
            </div>
          </>
        )}

        {step === 'code' && (
          <>
            <div className="lgn-body">
              <div className="lgn-intro">
                <h2 className="lgn-title">Enter verification code</h2>
                <p className="lgn-sub">{len}-digit code sent to {full}</p>
              </div>
              <div className={`lgn-otp${err ? ' is-bad' : ''}`}>
                {digits.map((d, i) => (
                  <input
                    /* eslint-disable-next-line react/no-array-index-key */
                    key={i}
                    ref={(el) => { boxes.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    aria-label={`Digit ${i + 1}`}
                    maxLength={len}
                    placeholder=" "
                    value={d}
                    onChange={(e) => typeDigit(i, e.target.value)}
                    onKeyDown={boxKey(i)}
                    onFocus={(e) => e.target.select()}
                  />
                ))}
              </div>
              {err && <div className="lgn-bad">{I.alert}<p>{err}</p></div>}
              {note && <p className="lgn-note">{note}</p>}
              <div className="lgn-resend">
                {left > 0
                  ? <>Resend code in <b>{mmss(left)}</b></>
                  : <button type="button" onClick={send}>Resend code</button>}
              </div>
            </div>
            <div className="lgn-foot">
              <button
                type="button"
                className={`lgn-go${err ? ' is-plain' : ''}`}
                disabled={busy || (!err && code.length !== len)}
                onClick={() => (err ? send() : verify())}
              >
                {busy ? <span className="lgn-spin" /> : (err ? 'Resend' : 'Login')}
              </button>
              <button
                type="button"
                className="lgn-alt"
                onClick={() => { setStep('phone'); setErr(''); setNote(''); }}
              >
                Change number
              </button>
            </div>
          </>
        )}

        {step === 'about' && (
          <>
            <div className="lgn-body">
              <div className="lgn-intro"><h2 className="lgn-title">A little about you</h2></div>
              <div className="lgn-fields">
                <div className="lgn-field">
                  <label htmlFor="lgn-name">Your name</label>
                  <div className="lgn-box">
                    <input
                      id="lgn-name"
                      autoComplete="name"
                      placeholder="Ananya"
                      value={about.name}
                      onChange={(e) => { setErr(''); setAbout((a) => ({ ...a, name: e.target.value })); }}
                    />
                  </div>
                </div>
                <div className="lgn-field">
                  <label htmlFor="lgn-year">Year of birth</label>
                  <div className="lgn-box">
                    <select
                      id="lgn-year"
                      value={about.year}
                      onChange={(e) => setAbout((a) => ({ ...a, year: e.target.value }))}
                    >
                      <option value="">Select</option>
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {about.year && <em>You are {thisYear - Number(about.year)} years old</em>}
                    {I.chevron}
                  </div>
                </div>
                <div className="lgn-field">
                  <label htmlFor="lgn-gender">Gender</label>
                  <div className="lgn-box">
                    <select
                      id="lgn-gender"
                      value={about.gender}
                      onChange={(e) => setAbout((a) => ({ ...a, gender: e.target.value }))}
                    >
                      <option value="">Select</option>
                      {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    {I.chevron}
                  </div>
                </div>
                {/* Not in the design, but an account cannot exist without one: session
                    links, receipts and the password reset all go to this address. */}
                <div className="lgn-field">
                  <label htmlFor="lgn-email">Email</label>
                  <div className="lgn-box">
                    <input
                      id="lgn-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={about.email}
                      onChange={(e) => { setErr(''); setAbout((a) => ({ ...a, email: e.target.value })); }}
                    />
                  </div>
                </div>
              </div>
              {err && <div className="lgn-bad">{I.alert}<p>{err}</p></div>}
            </div>
            <div className="lgn-foot">
              <button
                type="button"
                className="lgn-go"
                disabled={busy || about.name.trim().length < 2 || !about.email.trim()}
                onClick={createAccount}
              >
                {busy ? <span className="lgn-spin" /> : 'Continue'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
