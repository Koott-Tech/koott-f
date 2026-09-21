'use client';

/**
 * TherapistCard — built to the card in "LittleCareLanding (1).jsx" (repo root),
 * used on /book-malayali-psychologists and on the condition-page template.
 *
 * Top to bottom, as the artboard has it:
 *   avatar · name · credential
 *   tinted panel: up to three lines of card intro, the voice-intro row, View profile
 *   the therapist's concerns as chips, scrolled sideways under a fade
 *   three tiles: years, languages, price per session
 *   footer: next available, and Book now
 *
 * The artboard's purple is swapped for Koott's green, the same mapping the
 * profile page uses (#1B6930 over #F1FBF3, ink #1C1C1E on #E5E5EA lines).
 *
 * TWO THINGS TO KNOW:
 *   · The voice-intro player is a PLACEHOLDER. Koott stores no audio for
 *     therapists, so pressing play runs a timer and nothing is heard — it is in
 *     the design and was kept deliberately until real intros exist. Give the
 *     card `t.voiceUrl` and it will play that instead (see playVoice below).
 *   · "Next available" comes in on `t.availability`, already formatted. The
 *     page fetches it for all its therapists at once (lib/nextAvailable.js);
 *     the card never asks on its own, which is what made a seven-card listing
 *     fire seven slow slot requests. No answer, no footer line — nothing is
 *     invented.
 *
 * `t` accepts both shapes: the structured fields the listing now sends (years,
 * price, tags) and the older strings the CMS pages hold (experience, priceFrom,
 * languages), so neither call site had to change at once.
 */

import { useEffect, useRef, useState } from 'react';
import { Award, IndianRupee, Languages, Pause, Play } from 'lucide-react';

/* Voice-message waveform proportions (as in WhatsApp / iMessage): 3px rounded bars, 2px apart. */
const BAR_WIDTH = 3;
const BAR_GAP = 2;
/* The bar heights of the little equaliser, so it looks like speech rather than
   a sine wave. They animate while playing and hold still when paused. */
const BAR_HEIGHTS = [
  30, 48, 72, 100, 64, 40, 56, 88, 70, 44, 34, 62, 92, 78, 50, 36,
  58, 84, 96, 66, 42, 54, 80, 60, 38, 46, 74, 90, 68, 44, 32, 52,
  86, 72, 48, 64, 94, 76, 50, 40, 60, 82, 66, 42, 56, 70, 46, 34,
];

const titleCase = (s) => String(s).replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const initialsOf = (name) => String(name || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();

/** "7+ years of experience" -> 7, for cards still sending the old string. */
const yearsOf = (t) => (Number.isFinite(t.years) ? t.years : parseInt(String(t.experience || '').replace(/\D/g, ''), 10) || 0);
/** "Starting from INR1499" -> 1499. */
const priceOf = (t) => (Number.isFinite(t.price) ? t.price : parseInt(String(t.priceFrom || '').replace(/\D/g, ''), 10) || 0);
const tagsOf = (t) => (t.tags || t.concerns || []).map(titleCase);
const langsOf = (t) => (Array.isArray(t.languages) ? t.languages : String(t.languages || 'English and Malayalam').split(/,| and /).map((l) => l.trim()).filter(Boolean));

/**
 * An API psychologist row -> the fields this card reads. Shared so the home
 * page, the listing and the condition pages all describe a therapist the same
 * way; callers add their own extras (the listing keeps slug and filters).
 */
export const cardFields = (p) => {
  const years = Number(p.experience_years) || 0;
  return {
    id: p.id,
    name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
    role: p.designation || p.specialization || '',
    photo: p.cover_image_url || p.profile_picture_url || null,
    // The card's own short intro (psychologists.card_intro), never the profile's About.
    bio: p.card_intro || '',
    years,
    price: Number(p.individual_session_price || p.price) || 0,
    languages: Array.isArray(p.languages) && p.languages.length ? p.languages : ['English', 'Malayalam'],
    tags: Array.isArray(p.area_of_expertise) ? p.area_of_expertise : [],
  };
};

export default function TherapistCard({ t, profileHref, bookHref }) {
  const href = profileHref ?? t.profileHref ?? '#';
  const book = bookHref ?? t.bookHref ?? href;
  const years = yearsOf(t);
  const price = priceOf(t);
  const tags = tagsOf(t);
  const langs = langsOf(t);
  const others = langs.filter((l) => !/^english$/i.test(l));

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  /* As many 3px bars (2px apart) as the row has room for, so the waveform is
     always full and the played colour reaches the right-hand end. */
  const barsRef = useRef(null);
  const [barCount, setBarCount] = useState(28);
  useEffect(() => {
    const el = barsRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const n = Math.floor((entry.contentRect.width + BAR_GAP) / (BAR_WIDTH + BAR_GAP));
      setBarCount(Math.max(8, n));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* PLACEHOLDER while therapists have no recorded intro: the bar moves for 30s
     so the design can be seen whole. With t.voiceUrl set it plays the real
     file and follows it instead. */
  const duration = t.voiceDuration || 30;
  useEffect(() => {
    if (!playing || t.voiceUrl) return undefined;
    const started = Date.now();
    const id = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / (duration * 1000)) * 100);
      setProgress(pct);
      if (pct >= 100) { clearInterval(id); setPlaying(false); setProgress(0); }
    }, 150);
    return () => clearInterval(id);
  }, [playing, duration, t.voiceUrl]);

  const playVoice = () => {
    if (!t.voiceUrl) { setPlaying((p) => !p); return; }
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); } else { el.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  const elapsed = Math.round((progress / 100) * duration);
  const clock = (s) => `0:${String(s).padStart(2, '0')}`;
  const availability = t.availability || null;

  return (
    <article className="ktc">
      <div className="ktc-head">
        <a href={href} className="ktc-avatar" aria-label={`View ${t.name}'s profile`}>
          {t.photo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={t.photo} alt={t.name} loading="lazy" />
            : <span className="ktc-initials" aria-hidden>{initialsOf(t.name)}</span>}
        </a>
        <div className="ktc-who">
          <p className="ktc-name">{t.name}</p>
          {t.role && <p className="ktc-role">{t.role}</p>}
        </div>
      </div>

      <div className="ktc-panel">
        {t.bio && <p className="ktc-bio">{t.bio}</p>}
        <div className="ktc-voice">
          <button type="button" className="ktc-play" onClick={playVoice} aria-label={playing ? 'Pause intro' : 'Play intro'}>
            {playing ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: 1 }} />}
          </button>
          {/* The bars are always here — one line with the play button — and only
              come alive while something is playing. */}
          <span ref={barsRef} className={`ktc-bars ${playing ? 'is-playing' : ''}`} aria-hidden>
            {Array.from({ length: barCount }, (_, i) => (
              <i
                key={i}
                className={`ktc-bar${playing && (i / barCount) * 100 <= progress ? ' is-past' : ''}`}
                style={{ height: `${BAR_HEIGHTS[i % BAR_HEIGHTS.length]}%`, animationDelay: `${(i % 16) * 60}ms` }}
              />
            ))}
          </span>
          {playing && <span className="ktc-voice-time">{clock(elapsed)} / {clock(duration)}</span>}
          <a href={href} className="ktc-view">View profile</a>
          {t.voiceUrl && <audio ref={audioRef} src={t.voiceUrl} onEnded={() => setPlaying(false)} preload="none" />}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="ktc-tags-wrap">
          <div className="ktc-tags">
            {tags.map((tag) => <span key={tag} className="ktc-chip">{tag}</span>)}
          </div>
        </div>
      )}

      <div className="ktc-stats">
        <div className="ktc-stat">
          <p className="ktc-stat-v"><Award size={12} />{years > 0 ? `${years} yrs` : '—'}</p>
          <p className="ktc-stat-l">Experience</p>
        </div>
        <div className="ktc-stat">
          <p className="ktc-stat-v"><Languages size={12} /><span>{langs[0] || 'English'}</span></p>
          <p className="ktc-stat-l" title={others.join(', ')}>{others.join(', ') || '—'}</p>
        </div>
        <div className="ktc-stat">
          <p className="ktc-stat-v"><IndianRupee size={11} />{price > 0 ? price.toLocaleString('en-IN') : '—'}</p>
          <p className="ktc-stat-l">Per session</p>
        </div>
      </div>

      <div className="ktc-foot">
        {availability ? (
          <div>
            <p className="ktc-avail-l">{t.availabilityLabel || 'Next available'}</p>
            <p className="ktc-avail">{availability}</p>
          </div>
        ) : <span />}
        <a href={book} className="ktc-book">Book now</a>
      </div>
    </article>
  );
}

export const THERAPIST_CARD_CSS = `
.ktc{
  --ktc-primary:#1B6930;
  --ktc-primary-soft:#F1FBF3;
  --ktc-ink:#1C1C1E;
  --ktc-ink-soft:#6C6C70;
  --ktc-line:#E5E5EA;
  /* the tint behind the intro panel and the three tiles */
  --ktc-bg:#F8FDF6;
  --ktc-surface:#FFFFFF;
  --ktc-sans:'Work Sans',ui-sans-serif,system-ui,sans-serif;
  display:flex;flex-direction:column;position:relative;min-width:0;container-type:inline-size;
  background:var(--ktc-surface);border:1.5px solid var(--ktc-line);border-radius:20px;padding:20px;
  transition:border-color .15s ease, box-shadow .15s ease, transform .15s ease;
}
/* lift on hover only where there is a real mouse — on phones a tap would leave it stuck */
@media (hover:hover) and (pointer:fine){
  .ktc:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(30,43,35,.06);}
  .ktc-avatar:hover{transform:scale(1.04);}
}
.ktc *{box-sizing:border-box;}

.ktc-head{display:flex;align-items:center;gap:16px;margin:4px 0 12px;}
.ktc-avatar{
  width:64px;height:64px;border-radius:999px;overflow:hidden;flex:none;display:block;
  background:var(--ktc-primary-soft);border:1px solid var(--ktc-line);
  transition:transform .15s ease;
}
.ktc-avatar img{width:100%;height:100%;object-fit:cover;display:block;}
.ktc-initials{
  width:100%;height:100%;display:flex;align-items:center;justify-content:center;
  font-family:var(--ktc-sans)!important;font-size:20px!important;font-weight:600!important;
  color:var(--ktc-primary)!important;letter-spacing:0!important;
}
.ktc-who{min-width:0;}
.ktc-name{
  font-family:var(--ktc-sans)!important;font-size:16px!important;font-weight:600!important;
  color:var(--ktc-ink)!important;margin:0;letter-spacing:0!important;line-height:1.3em!important;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.ktc-role{
  font-family:var(--ktc-sans)!important;font-size:12px!important;font-weight:400!important;
  color:var(--ktc-ink-soft)!important;margin:4px 0 0;letter-spacing:0!important;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}

.ktc-panel{background:var(--ktc-bg);border-radius:16px;padding:12px;margin-bottom:16px;}
.ktc-bio{
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
  font-family:var(--ktc-sans)!important;font-size:13px!important;line-height:1.5em!important;
  color:var(--ktc-ink-soft)!important;margin:0 0 12px;letter-spacing:0!important;
}
/* one line, everything centred on the same axis as the play button */
.ktc-voice{display:flex;align-items:center;gap:10px;}
.ktc-play{
  width:32px;height:32px;border-radius:999px;flex:none;display:flex;align-items:center;justify-content:center;
  background:var(--ktc-surface);border:1.5px solid var(--ktc-primary);color:var(--ktc-primary);
  cursor:pointer;box-shadow:0 2px 8px -3px rgba(27,105,48,.25);transition:background .15s ease,color .15s ease;
}
.ktc-play:hover{background:var(--ktc-primary);color:#fff;}
.ktc-voice-label{
  flex:none;font-family:var(--ktc-sans)!important;font-size:12.5px!important;font-weight:600!important;
  color:var(--ktc-ink-soft)!important;letter-spacing:0!important;white-space:nowrap;
}
.ktc-voice-time{flex:none;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace!important;font-size:10.5px!important;color:var(--ktc-ink-soft)!important;letter-spacing:0!important;}
/* an equaliser rather than a progress line: bars already played hold the green,
   the rest sit pale, and every bar breathes while it is playing */
/* The equaliser sits in the row at all times: pale and still when nothing is
   playing, moving once it is, with the bars already heard holding the green.
   Paused rather than removed, so it never jumps into place. */
.ktc-bars{flex:1;min-width:0;overflow:hidden;display:flex;align-items:center;justify-content:flex-start;gap:2px;height:22px;}
.ktc-bar{
  flex:none;width:3px;border-radius:999px;background:#CFE0D4;transform-origin:center;
  animation:ktc-bar-move .9s ease-in-out infinite alternate;animation-play-state:paused;
}
.ktc-bars.is-playing .ktc-bar{animation-play-state:running;}
.ktc-bar.is-past{background:var(--ktc-primary);}
@keyframes ktc-bar-move{from{transform:scaleY(.45);}to{transform:scaleY(1);}}
@media (prefers-reduced-motion:reduce){.ktc-bars.is-playing .ktc-bar{animation-play-state:paused;}}
.ktc-view{
  flex:none;border:1px solid var(--ktc-line);background:var(--ktc-surface);border-radius:999px;padding:5px 10px;
  font-family:var(--ktc-sans)!important;font-size:11.5px!important;font-weight:500!important;
  color:var(--ktc-primary)!important;text-decoration:none;letter-spacing:0!important;
  transition:border-color .15s ease, background .15s ease;
}
.ktc-view:hover{border-color:var(--ktc-primary);background:var(--ktc-primary-soft);}

/* concerns run off the edge under a fade rather than wrapping the card taller */
.ktc-tags-wrap{position:relative;margin-bottom:16px;}
.ktc-tags-wrap::after{
  content:"";position:absolute;top:0;right:0;bottom:2px;width:32px;pointer-events:none;
  background:linear-gradient(to right,transparent,var(--ktc-surface));
}
.ktc-tags{display:flex;gap:6px;flex-wrap:nowrap;overflow-x:auto;padding-bottom:2px;scrollbar-width:none;-ms-overflow-style:none;}
.ktc-tags::-webkit-scrollbar{display:none;}
.ktc-chip{
  flex:none;white-space:nowrap;border:1px solid var(--ktc-line);background:var(--ktc-surface);
  border-radius:999px;padding:4px 10px;
  font-family:var(--ktc-sans)!important;font-size:11.5px!important;font-weight:500!important;
  color:var(--ktc-ink)!important;letter-spacing:0!important;
}

.ktc-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;}
.ktc-stat{background:var(--ktc-bg);border-radius:14px;padding:10px;text-align:center;min-width:0;}
.ktc-stat-v{
  display:flex;align-items:center;justify-content:center;gap:4px;margin:0;
  font-family:var(--ktc-sans)!important;font-size:14px!important;font-weight:600!important;
  color:var(--ktc-ink)!important;letter-spacing:0!important;
}
.ktc-stat-v svg{flex:none;color:var(--ktc-primary);}
.ktc-stat-v span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ktc-stat-l{
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  font-family:var(--ktc-sans)!important;font-size:11px!important;font-weight:400!important;
  color:var(--ktc-ink-soft)!important;margin:2px 0 0;letter-spacing:0!important;line-height:1.35em!important;
}

.ktc-foot{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  margin-top:auto;padding-top:12px;border-top:1px solid var(--ktc-line);
}
.ktc-avail-l{font-family:var(--ktc-sans)!important;font-size:11px!important;color:var(--ktc-ink-soft)!important;margin:0;letter-spacing:0!important;}
.ktc-avail{font-family:var(--ktc-sans)!important;font-size:14px!important;font-weight:600!important;color:var(--ktc-ink)!important;margin:2px 0 0;letter-spacing:0!important;}
.ktc-book{
  flex:none;display:inline-flex;align-items:center;gap:6px;
  background:var(--ktc-primary);color:#fff!important;border-radius:12px;padding:10px 16px;text-decoration:none;
  font-family:var(--ktc-sans)!important;font-size:14px!important;font-weight:600!important;letter-spacing:0!important;
  transition:background .15s ease;
}
.ktc-book:hover{background:#155424;}

/* Sized by the card's own width, not the screen's: the same card sits in a
   full-width list, a two-up grid and a swipe row on phones. */
@container (max-width:320px){
  .ktc-panel{padding:10px;}
  .ktc-voice{gap:8px;}
  .ktc-view{padding:5px 9px;font-size:11px!important;}
  .ktc-stats{gap:6px;}
  .ktc-stat{padding:8px 4px;}
  .ktc-stat-v{font-size:13px!important;gap:3px;}
  .ktc-stat-l{font-size:10.5px!important;}
  .ktc-foot{gap:8px;}
  .ktc-avail{font-size:13px!important;}
  .ktc-book{padding:9px 12px;font-size:13px!important;}
}
@media (max-width:520px){
  .ktc{padding:16px;}
  .ktc-avatar{width:56px;height:56px;}
  .ktc-stats{gap:6px;}
  .ktc-stat{padding:8px 6px;}
  .ktc-book{padding:10px 13px;}
}
`;
