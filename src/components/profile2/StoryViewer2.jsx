'use client';

/**
 * The therapist profile's two full-screen viewers (Koott 2.0):
 *
 *   mode="story"  Figma 7981:20859 — segments across the top that fill as each clip plays,
 *                 a tap on the right half for the next, on the left for the one before.
 *   mode="video"  Figma 8012:21196 — one video with play/pause and a scrubber, and the
 *                 next one a swipe up (or a flick of the wheel, or the down arrow) away.
 *
 * Both are the same shell, so they are one component: a card on a near-black page, the
 * header inside it, and the therapist with "Book a session" underneath.
 *
 * What actually plays depends on the link the therapist has on their profile:
 *   - a video file (.mp4/.webm/.mov/.m4v/.ogv) plays in the page, with real progress,
 *     mute and scrubbing;
 *   - a YouTube or Vimeo link is embedded, which we cannot drive from here — so its
 *     transport and mute are not drawn, and a story segment runs on a timer instead;
 *   - anything else is offered as a link out rather than pretended to play.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { VIEWER2_CSS } from './viewer2.css';

const STORY_SECONDS = 7;   // a clip we cannot time ourselves
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.67, strokeLinecap: 'round', strokeLinejoin: 'round' };
const V = {
  back: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 15 7.5 10l5-5" {...S} /></svg>,
  close: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" {...S} /></svg>,
  loud: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10.4 3.6 6.7 6.5H3.9v7h2.8l3.7 2.9V3.6Z" {...S} /><path d="M14 7a4 4 0 0 1 0 6" {...S} /><path d="M16.3 4.8a7 7 0 0 1 0 10.4" {...S} /></svg>,
  muted: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10.4 3.6 6.7 6.5H3.9v7h2.8l3.7 2.9V3.6Z" {...S} /><path d="m14 8 4 4M18 8l-4 4" {...S} /></svg>,
  play: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5-12-7.5Z" fill="currentColor" /></svg>,
  pause: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 4.5h3.2v15H7.5zM13.3 4.5h3.2v15h-3.2z" fill="currentColor" /></svg>,
  tick: <svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="currentColor" /><path d="m4.4 7.2 1.8 1.8 3.4-3.6" fill="none" stroke="#0D1310" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  swipe: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16.5v-13M5.8 7.7 10 3.5l4.2 4.2" {...S} /></svg>,
};

/* ── what kind of link is this? ──────────────────────────────────────────── */

const FILE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

/** A YouTube or Vimeo link turned into something that can be embedded, or null. */
function embedOf(url) {
  const u = String(url || '');
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0&playsinline=1`;
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1`;
  return null;
}

const kindOf = (url) => {
  if (!url) return 'none';
  if (FILE.test(url)) return 'file';
  return embedOf(url) ? 'embed' : 'link';
};

/* ── the viewer ──────────────────────────────────────────────────────────── */

export default function StoryViewer2({
  items = [], start = 0, mode = 'story', name = '', photo = '', verified = false, onClose, onBook,
}) {
  const clips = useMemo(() => items.filter((x) => x && (x.url || x.thumb)), [items]);
  const [at, setAt] = useState(() => Math.min(Math.max(0, start), Math.max(0, clips.length - 1)));
  const [shown, setShown] = useState(false);
  const [muted, setMuted] = useState(mode === 'story');
  const [playing, setPlaying] = useState(true);
  const [done, setDone] = useState(0);     // 0–1 through the clip on screen
  const video = useRef(null);
  const touch = useRef(0);

  const clip = clips[at] || null;
  const kind = kindOf(clip?.url);
  const story = mode === 'story';

  const close = useCallback(() => { setShown(false); setTimeout(() => onClose?.(), 160); }, [onClose]);

  const go = useCallback((step) => {
    setAt((i) => {
      const n = i + step;
      if (n < 0) return 0;
      if (n >= clips.length) { close(); return i; }
      return n;
    });
    setDone(0);
    setPlaying(true);
  }, [clips.length, close]);

  /* fade in, hold the page still behind, and the keys */
  useEffect(() => {
    const t = requestAnimationFrame(() => setShown(true));
    const was = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const key = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(-1);
      if (e.key === ' ' && !story) { e.preventDefault(); setPlaying((p) => !p); }
    };
    window.addEventListener('keydown', key);
    return () => {
      cancelAnimationFrame(t);
      window.removeEventListener('keydown', key);
      document.body.style.overflow = was;
    };
  }, [close, go, story]);

  /* A clip we cannot time — an embed, or a still — runs on a timer so the story moves on. */
  useEffect(() => {
    if (!story || kind === 'file' || !playing) return undefined;
    const started = Date.now();
    const tick = setInterval(() => {
      const through = (Date.now() - started) / (STORY_SECONDS * 1000);
      if (through >= 1) { go(1); return; }
      setDone(through);
    }, 80);
    return () => clearInterval(tick);
  }, [story, kind, playing, at, go]);

  /* play / pause follows the button, and the file's own clock drives the bar */
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (playing) el.play?.().catch(() => setPlaying(false));
    else el.pause?.();
  }, [playing, at]);

  const onTime = () => {
    const el = video.current;
    if (el?.duration) setDone(el.currentTime / el.duration);
  };

  const seek = (e) => {
    const el = video.current;
    if (!el?.duration) return;
    const box = e.currentTarget.getBoundingClientRect();
    const to = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    el.currentTime = to * el.duration;
    setDone(to);
  };

  /* swipe up for the next video, down for the one before */
  const onTouchStart = (e) => { touch.current = e.touches[0].clientY; };
  const onTouchEnd = (e) => {
    const moved = touch.current - (e.changedTouches[0]?.clientY ?? touch.current);
    if (Math.abs(moved) > 60) go(moved > 0 ? 1 : -1);
  };

  if (!clips.length) return null;

  const media = (() => {
    if (kind === 'file') {
      return (
        <video
          ref={video}
          src={clip.url}
          poster={clip.thumb || undefined}
          autoPlay
          playsInline
          muted={muted}
          onTimeUpdate={onTime}
          onEnded={() => (story ? go(1) : setPlaying(false))}
          onClick={() => !story && setPlaying((p) => !p)}
        />
      );
    }
    if (kind === 'embed') {
      return <iframe src={embedOf(clip.url)} title={clip.title || name} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
    }
    if (clip.thumb) return <img src={clip.thumb} alt={clip.title || ''} />;
    return (
      <div className="svw-fallback">
        <p>{clip.title || 'This one opens on another site.'}</p>
        {clip.url && <a className="svw-go" href={clip.url} target="_blank" rel="noopener noreferrer">Watch it</a>}
      </div>
    );
  })();

  return (
    <div
      className={`svw${shown ? ' is-in' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${name} — ${story ? 'story' : 'video'}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <style dangerouslySetInnerHTML={{ __html: VIEWER2_CSS }} />

      <div className="svw-stage">
        <div className="svw-card">
          <div className="svw-media">{media}</div>

          {/* Tapping the halves steps through, the way stories do. The video viewer
              leaves the picture alone — there, a tap is play and pause. */}
          {story && clips.length > 1 && (
            <>
              <button type="button" className="svw-tap is-back" onClick={() => go(-1)} aria-label="Previous" />
              <button type="button" className="svw-tap is-next" onClick={() => go(1)} aria-label="Next" />
            </>
          )}

          <div className="svw-head">
            <button type="button" className="svw-round" onClick={close} aria-label="Close">
              {story ? V.back : V.close}
            </button>

            {story && (
              <div className="svw-bars">
                {clips.map((c, i) => (
                  <span className="svw-bar" key={c.url || c.title || i}>
                    <em style={{ width: `${i < at ? 100 : i === at ? Math.min(100, done * 100) : 0}%` }} />
                  </span>
                ))}
              </div>
            )}
            {!story && <span style={{ flex: 1 }} />}

            {kind === 'file' ? (
              <button type="button" className="svw-round" onClick={() => setMuted((m) => !m)}
                aria-label={muted ? 'Unmute' : 'Mute'}>
                {muted ? V.muted : V.loud}
              </button>
            ) : <span style={{ width: 40, flex: 'none' }} />}
          </div>

          {/* The video viewer's transport. An embed plays in its own player, which has
              its own controls, so this is only drawn for a file we are playing. */}
          {!story && kind === 'file' && (
            <div className="svw-transport">
              <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? V.pause : V.play}
              </button>
              <div
                className="svw-track"
                role="slider"
                tabIndex={0}
                aria-label="Seek"
                aria-valuenow={Math.round(done * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                onClick={seek}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const el = video.current;
                    if (el?.duration) el.currentTime += e.key === 'ArrowRight' ? 5 : -5;
                  }
                }}
              >
                <i />
                <em style={{ width: `${done * 100}%` }} />
                <b style={{ left: `${done * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="svw-book">
          <div className="svw-who">
            {photo
              ? <img className="svw-avatar" src={photo} alt="" />
              : <span className="svw-avatar" />}
            <span style={{ minWidth: 0 }}>
              <span className="svw-name">
                <span>{name}</span>
                {verified && V.tick}
              </span>
              {clip?.title && <span className="svw-cap">{clip.title}</span>}
            </span>
          </div>
          <button type="button" className="svw-go" onClick={() => { onBook?.(); }}>Book a session</button>
        </div>

        {!story && clips.length > 1 && (
          <p className="svw-hint">{V.swipe}Swipe up for the next video</p>
        )}
      </div>
    </div>
  );
}
