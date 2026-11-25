'use client';

/**
 * Therapist card — Koott 2.0 (Figma "Home (WIP)" 7858:79927, card 8043:32090).
 *
 * Every size here is the Figma one at 402 px: the card is 362 wide with 6 of padding,
 * a tinted panel on top (the tint follows the therapist's kind) and the stats, next
 * free time and Book now below it.
 *
 * Availability comes from /api/public/psychologists/order, which answers with the next
 * free start and how many free starts are left on that day, so the card needs no
 * request of its own:
 *   within an hour   ⚡ Immediate Availability · "Within 16 min"
 *   later            "Next available" · "Today, 8:25 PM" · "+2 slots"
 */

import { useRef, useState } from 'react';
import Link from 'next/link';
import { whenLabel } from '@/lib/nextAvailable';

/* The waveform behind the play button: Figma draws 3 px bars every 7 px, these heights. */
const WAVE = [5, 5, 5, 5, 5, 5, 5, 5, 13, 16, 13, 10, 6, 6, 10, 10, 10, 8, 8, 8, 8, 5, 5, 5,
  6, 10, 8, 5, 5, 5, 5, 5, 5, 5, 13, 16, 13, 10, 6, 6, 10, 10, 10, 8];

/* The panel tint per kind of therapist (Figma: one gradient per card variant). */
const TINTS = [
  [/psychiatr/i, '#FFF3F3'],
  [/couple|relationship therapist/i, '#EDF9FB'],
  [/sex|intimacy/i, '#FFF1F9'],
  [/child|adolescent|teen/i, '#FFF7F1'],
];
const tintFor = (role) => (TINTS.find(([re]) => re.test(role || '')) || [null, '#F0FBED'])[1];

/** "Within 16 min" while the next start is inside the hour; the card calls that immediate. */
const IMMEDIATE_MINUTES = 60;
const minutesTo = (iso) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Number.isNaN(ms) ? null : Math.round(ms / 60000);
};

const Bolt = () => (
  <svg className="tc2-bolt" viewBox="0 0 11 13" fill="none" aria-hidden="true">
    <path d="M6.6 0 0 7.3h3.6L4.4 13 11 5.7H7.4L6.6 0Z" fill="url(#tc2-bolt-g)" />
    <defs>
      <linearGradient id="tc2-bolt-g" x1="0" y1="0" x2="11" y2="13" gradientUnits="userSpaceOnUse">
        <stop stopColor="#39AC71" /><stop offset="1" stopColor="#A1EC16" />
      </linearGradient>
    </defs>
  </svg>
);

export default function TherapistCard2({ t, nextAt, slotsOnDay, profileHref, bookHref }) {
  const [playing, setPlaying] = useState(false);
  const audio = useRef(null);
  const mins = minutesTo(nextAt);
  const immediate = mins != null && mins >= 0 && mins <= IMMEDIATE_MINUTES;
  const extra = Number(slotsOnDay) > 1 ? Number(slotsOnDay) - 1 : 0;
  const langs = t.languages || [];

  const toggleVoice = () => {
    if (!t.voice) return;
    if (!audio.current) {
      audio.current = new Audio(t.voice);
      audio.current.addEventListener('ended', () => setPlaying(false));
    }
    if (playing) { audio.current.pause(); setPlaying(false); } else { audio.current.play().catch(() => {}); setPlaying(true); }
  };

  return (
    <article className="tc2">
      <div className="tc2-top" style={{ '--tc2-tint': tintFor(t.role) }}>
        <div className="tc2-head">
          <span className="tc2-photo">
            {t.photo
              ? <img src={t.photo} alt="" width={85} height={85} loading="lazy" />
              : <span className="tc2-photo-fallback" aria-hidden="true">{(t.name || '?').charAt(0)}</span>}
          </span>
          <span className="tc2-who">
            <span className="tc2-name">{t.name}</span>
            <span className="tc2-role">{t.role}</span>
          </span>
        </div>

        <div className="tc2-voice">
          <div className={`tc2-wave${t.voice ? '' : ' is-off'}`}>
            <button
              type="button"
              className="tc2-play"
              onClick={toggleVoice}
              disabled={!t.voice}
              aria-label={playing ? `Pause ${t.name}'s introduction` : `Play ${t.name}'s introduction`}
            >
              {playing
                ? <svg viewBox="0 0 18 18" aria-hidden="true"><rect x="4" y="3" width="3.5" height="12" rx="1" fill="#3D4842" /><rect x="10.5" y="3" width="3.5" height="12" rx="1" fill="#3D4842" /></svg>
                : <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M5 3.2v11.6c0 .5.5.8 1 .6l9-5.8c.4-.3.4-.9 0-1.2l-9-5.8c-.5-.3-1 .1-1 .6Z" fill="#3D4842" /></svg>}
            </button>
            <span className="tc2-bars" aria-hidden="true">
              {WAVE.map((h, i) => <i key={i} style={{ height: h }} />)}
            </span>
          </div>
          <Link className="tc2-profile" href={profileHref}>
            Profile
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" stroke="#2E7D5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </Link>
        </div>

        {t.tags.length > 0 && (
          <div className="tc2-tags">
            <div className="tc2-tags-row">
              {t.tags.map((tag, i) => (
                <span className="tc2-tag-wrap" key={tag}>
                  {i > 0 && <i className="tc2-dot" aria-hidden="true" />}
                  <span className="tc2-tag">{tag}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="tc2-bottom">
        <div className="tc2-stats-wrap">
          <i className="tc2-rule" aria-hidden="true" />
          <div className="tc2-stats">
            <div className="tc2-stat">
              <span className="tc2-stat-l">Experience</span>
              <span className="tc2-stat-v">{t.years ? `${t.years}+ yrs` : '—'}</span>
            </div>
            <div className="tc2-stat">
              <span className="tc2-stat-l">Language</span>
              <span className="tc2-stat-v">
                {langs[0] || 'Malayalam'}
                {langs.length > 1 && <small>+{langs.length - 1}</small>}
              </span>
            </div>
            <div className="tc2-stat">
              <span className="tc2-stat-l">Per session</span>
              <span className="tc2-stat-v">{t.price ? `₹${t.price.toLocaleString('en-IN')}` : '—'}</span>
            </div>
          </div>
          <i className="tc2-rule is-low" aria-hidden="true" />
        </div>

        <div className="tc2-avail">
          <div className="tc2-avail-l">
            <span className="tc2-avail-label">
              {immediate && <Bolt />}
              {immediate ? 'Immediate Availability' : 'Next available'}
            </span>
            <span className="tc2-avail-row">
              <span className="tc2-avail-v">
                {immediate
                  ? (mins <= 1 ? 'Within a minute' : `Within ${mins} min`)
                  : (whenLabel(nextAt) || 'Ask for a time')}
              </span>
              {!immediate && extra > 0 && (
                <span className="tc2-slots">+{extra} slot{extra === 1 ? '' : 's'}</span>
              )}
            </span>
          </div>
          <Link className="tc2-book" href={bookHref}>Book now</Link>
        </div>
      </div>
    </article>
  );
}
