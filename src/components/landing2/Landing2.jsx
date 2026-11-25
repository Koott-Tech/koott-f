'use client';

/**
 * Condition landing page — Koott 2.0.
 *
 * Built to the Figma file "Koott 2.0" (EzLwBjoYNqTa9RMEmOfyQO), section
 * "Landing Page (WIP)", screen "Anxiety landing · v2" (7963:27756), drawn at
 * 402 px. It replaces ConditionPageTemplate, which was built to the older PDFs
 * and is kept in the repository, unused, so the swap is easy to reverse.
 *
 *   hero          a video card, who reviewed the page, the headline, two calls
 *                 to action and four numbers
 *   therapists    the home page's own therapist cards, live from the API
 *   reviews       what clients said, from the page's own copy
 *   how it works  the four steps
 *   why Koott     the reasons, over the brand banner
 *   pricing       the plan this condition starts at, and what else is available
 *   understanding what it feels like, and two things to open and read
 *   blog          the latest posts, live from the CMS
 *   FAQ           the page's own questions
 *   final CTA     the same closing card the home page uses
 *
 * The copy is the page's own (data/conditions/…), so every one of the 45
 * condition pages gets this design from its existing content; only the two live
 * lists — therapists and blog posts — come from the API.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { publicApi } from '@/lib/backendApi';
import { blogApi } from '@/lib/blogApi';
import { fetchTherapistOrder, applyTherapistOrder } from '@/lib/therapistOrder';
import { therapistSlug } from '@/components/TherapistProfile';
import TherapistCard2 from '@/components/home2/TherapistCard2';
import { HOME2_CSS } from '@/components/home2/home2.css';
import { LANDING2_CSS } from './landing2.css';

const CARE_WHATSAPP = '919539007766';
const ART = '/design/home2';

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
const I = {
  burger: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="#1F2A25" strokeWidth="2" strokeLinecap="round" fill="none" /></svg>,
  play: <svg viewBox="0 0 22 22" aria-hidden="true"><path d="M7.5 4.6v12.8c0 .6.6 1 1.1.7l10-6.4c.5-.3.5-1 0-1.3l-10-6.5c-.5-.3-1.1.1-1.1.7Z" fill="#39AC71" /></svg>,
  whatsapp: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.7 15L2 22l5.2-1.3A10 10 0 1 0 12 2Zm5.6 14.1c-.2.7-1.3 1.3-1.9 1.3-.5 0-1.1.2-3.6-.8-3-1.3-5-4.4-5.1-4.6-.2-.2-1.2-1.6-1.2-3.1s.8-2.2 1.1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .7.5l.9 2.2c.1.2.1.4 0 .6l-.4.6-.3.3c-.1.1-.3.3-.1.6.2.3.8 1.4 1.8 2.3 1.3 1.1 2.3 1.5 2.6 1.6.3.1.5.1.7-.1l.9-1c.2-.2.4-.2.6-.1l2.1 1c.3.1.5.2.5.3.1.2.1.6-.1 1Z" fill="#189E4F" /></svg>,
  chev: <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M6.75 4.5 11.25 9l-4.5 4.5" {...S} stroke="#3D4842" /></svg>,
  chevMute: <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M6.75 4.5 11.25 9l-4.5 4.5" {...S} stroke="#6B746F" /></svg>,
  chevGreen: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" {...S} stroke="#39AC71" strokeWidth={1.33} /></svg>,
  arrow: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.3 8h9.4M9.3 4.7 12.7 8l-3.4 3.3" {...S} stroke="#39AC71" strokeWidth={1.33} /></svg>,
  check: <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#E2F7E7" /><path d="m5 8.3 2 2 4-4.6" fill="none" stroke="#2E7D5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  plus: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4.2v11.6M4.2 10h11.6" {...S} stroke="#6B746F" strokeWidth={1.67} /></svg>,
  minus: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.2 10h11.6" {...S} stroke="#6B746F" strokeWidth={1.67} /></svg>,
  star: <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1l1.8 3.7 4.1.6-3 2.9.7 4.1L7 10.4 3.4 12.3l.7-4.1-3-2.9 4.1-.6L7 1Z" fill="#F5A524" /></svg>,
  translate: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2.5 4.6h7.1M6 3v1.6m2 0c0 3.1-2.4 5.7-5.5 5.7m5.5-5.7c0 1.7-.9 3.3-2.3 4.4M7.3 9.1 5 6.9m5.4 8.2h6.1m-7.3 2.3 4.2-9.1 4.1 9.1" {...S} stroke="#39AC71" strokeWidth={1.67} /></svg>,
  shield: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.2 3.8 4.6v4.8c0 3.4 2.4 6.1 6.2 8.4 3.8-2.3 6.2-5 6.2-8.4V4.6L10 2.2Zm-2.3 7.3 1.8 1.8 3.3-3.4" {...S} stroke="#39AC71" strokeWidth={1.67} /></svg>,
  target: <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" {...S} stroke="#39AC71" strokeWidth={1.67} /><circle cx="10" cy="10" r="3.75" {...S} stroke="#39AC71" strokeWidth={1.67} /><circle cx="10" cy="10" r="1" fill="#39AC71" /></svg>,
  lock: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.3 8.6V6.4a3.7 3.7 0 1 1 7.4 0v2.2M5 8.6h10v8.1H5V8.6Z" {...S} stroke="#39AC71" strokeWidth={1.67} /></svg>,
};

const REASON_ICONS = [I.translate, I.shield, I.target, I.lock];
const initials = (n) => (n || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '·';
const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function Landing2({ page }) {
  /* The condition route hands this component the whole page row; older callers
     passed just its content, so both shapes are accepted. */
  const c = page?.content || page || {};
  const heroTitle = page?.hero_title || c.hero?.title || '';
  const [rows, setRows] = useState([]);
  const [order, setOrder] = useState(null);
  const [posts, setPosts] = useState([]);
  const [openLearn, setOpenLearn] = useState(0);
  const [openFaq, setOpenFaq] = useState(-1);

  useEffect(() => {
    let live = true;
    (async () => {
      const [list, ord, blog] = await Promise.all([
        publicApi.getPsychologists().catch(() => null),
        fetchTherapistOrder('default').catch(() => null),
        blogApi.list({ limit: 6 }).catch(() => []),
      ]);
      if (!live) return;
      const people = list?.data?.psychologists || list?.data || [];
      setRows(Array.isArray(people) ? people : []);
      setOrder(ord || null);
      setPosts(Array.isArray(blog) ? blog.slice(0, 4) : []);
    })();
    return () => { live = false; };
  }, []);

  const cards = useMemo(() => {
    const mapped = rows.map((p) => ({
      id: p.id,
      slug: therapistSlug(p),
      name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
      role: p.designation || p.specialist_category || '',
      photo: p.cover_image_url || p.profile_picture_url || null,
      voice: p.voice_intro_url || null,
      tags: Array.isArray(p.area_of_expertise) ? p.area_of_expertise : [],
      years: p.experience_years ?? p.experience ?? null,
      languages: Array.isArray(p.languages) ? p.languages : [],
      price: p.session_price ?? p.price ?? null,
    }));
    return order ? applyTherapistOrder(mapped, order) : mapped;
  }, [rows, order]);

  const twoCards = cards.slice(0, 2);
  const faces = cards.slice(0, 4);

  const hero = c.hero || {};
  const stats = Array.isArray(c.stats) ? c.stats.slice(0, 4) : [];
  const reviews = c.reviews?.items || [];
  const steps = c.howItWorks?.steps || [];
  const reasons = (c.why?.items || []).slice(0, 4);
  const plans = c.plans?.items || [];
  const signs = (c.seekHelp?.items || c.symptoms?.items || []).map((x) => x.title).filter(Boolean);
  const types = (c.types?.items || []).map((x) => x.title).filter(Boolean);
  const helps = (c.therapyHelps?.items || []).map((x) => x.title).filter(Boolean);
  const faqs = Array.isArray(c.faqs) ? c.faqs.slice(0, 6) : [];
  const from = plans.length ? Math.min(...plans.map((p) => Number(p.from) || Infinity)) : 749;

  const learn = [
    { title: `Types we treat`, tags: types },
    { title: 'How therapy helps', tags: helps },
  ].filter((x) => x.tags.length);

  const bookHref = '/book-malayali-psychologists';

  return (
    <div className="l2">
      <style dangerouslySetInnerHTML={{ __html: `${HOME2_CSS}\n${LANDING2_CSS}` }} />

      {/* ───────── header ───────── */}
      <div className="l2-wrap">
        <header className="l2-head">
          <Link href="/" className="l2-logo" aria-label="Koott home">
            <img src="/design/home/logo-dark.svg" alt="Koott" width={74} height={23} />
          </Link>
          <div className="l2-head-right">
            <Link href="/profile" className="l2-login">Log In</Link>
            <Link href="/book-malayali-psychologists" className="l2-burger" aria-label="Menu">{I.burger}</Link>
          </div>
        </header>

        {/* ───────── hero ───────── */}
        <section className="l2-hero">
          <div className="l2-video">
            <div className="l2-video-inner">
              {hero.image && <img src={hero.image} alt="" />}
              <span className="l2-play" aria-hidden="true">{I.play}</span>
              <span className="l2-cap">
                <span className="l2-cap-k">Watch</span>
                <span className="l2-cap-v">What a first session feels like</span>
              </span>
            </div>
          </div>

          <div className="l2-intro">
            <div className="l2-by">
              <span className="l2-faces">
                {faces.slice(0, 3).map((t) => (t.photo
                  ? <img key={t.id} src={t.photo} alt="" />
                  : <span key={t.id}>{initials(t.name)}</span>))}
              </span>
              <span className="l2-by-text">{hero.verifiedBy || 'Verified by licensed Malayali therapists'}</span>
            </div>
            <div className="l2-headline">
              <h1 className="l2-h1">{hero.title || heroTitle}</h1>
              <p className="l2-sub">{hero.subtitle}</p>
            </div>
          </div>

          <div className="l2-ctas">
            <Link className="l2-btn" href={hero.primaryCta?.href || bookHref}>{hero.primaryCta?.label || 'Book a session'}</Link>
            <a
              className="l2-btn is-plain"
              href={`https://wa.me/${CARE_WHATSAPP}?text=${encodeURIComponent(`Hi Koott, I would like to know about ${heroTitle || 'therapy'}.`)}`}
              target="_blank"
              rel="noreferrer"
            >
              {I.whatsapp}WhatsApp us
            </a>
          </div>

          {stats.length > 0 && (
            <div className="l2-stats">
              {[0, 2].map((i) => (
                <div className="l2-stat-row" key={i}>
                  {stats.slice(i, i + 2).map((s) => (
                    <div className="l2-stat" key={s.value + s.label}>
                      <span className="l2-stat-v">{s.value}</span>
                      <span className="l2-stat-k">{s.label}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ───────── therapists ───────── */}
        <section className="l2-sec is-tight" id="therapists">
          <div className="l2-head-block">
            <p className="l2-eyebrow">Therapists</p>
            <h2 className="l2-h2">{c.therapists?.title || 'Meet Malayali therapists'}</h2>
          </div>
          <div className="h2 l2-cards">
            {twoCards.map((t) => (
              <TherapistCard2
                key={t.id}
                t={t}
                nextAt={order?.nextAt?.get(String(t.id)) || null}
                slotsOnDay={order?.slotsOnDay?.get(String(t.id)) ?? null}
                profileHref={t.slug ? `/service-page/${t.slug}` : bookHref}
                bookHref={t.slug ? `/book/${t.slug}` : bookHref}
              />
            ))}
            <Link className="l2-more" href={bookHref}>
              <span className="l2-faces">
                {faces.map((t) => (t.photo ? <img key={t.id} src={t.photo} alt="" /> : <span key={t.id}>{initials(t.name)}</span>))}
              </span>
              <span className="l2-more-text">See all therapists</span>
              {I.chev}
            </Link>
          </div>
        </section>

        {/* ───────── reviews ───────── */}
        {reviews.length > 0 && (
          <div className="l2-reviews-wrap">
            <section className="l2-reviews">
              <h2 className="l2-h2">{c.reviews?.title || 'Loved by Malayalees worldwide'}</h2>
              <div className="l2-rail">
                {reviews.slice(0, 6).map((r, i) => (
                  <article className="l2-review" key={r.name + i}>
                    <div className="l2-review-top">
                      <span className="l2-stars" aria-label="Five out of five">
                        {[0, 1, 2, 3, 4].map((n) => <span key={n} style={{ display: 'flex', width: 14, height: 14 }}>{I.star}</span>)}
                      </span>
                      <span className="l2-review-time">{r.age || ''}</span>
                    </div>
                    <p className="l2-quote">{r.quote}</p>
                    <div className="l2-author">
                      <span className="l2-initial">{initials(r.name)}</span>
                      <span className="l2-author-n">{(r.name || '').split(' ')[0]}.</span>
                      <span className="l2-author-m">{c.hero?.eyebrow ? 'Koott' : 'Koott'}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ───────── how it works ───────── */}
        {steps.length > 0 && (
          <section className="l2-sec is-tight">
            <div className="l2-head-block">
              <p className="l2-eyebrow">How it works</p>
              <h2 className="l2-h2">{c.howItWorks?.title || 'Start in about five minutes'}</h2>
            </div>
            <div className="l2-steps">
              {steps.slice(0, 4).map((s, i) => (
                <article className="l2-step" key={s.title}>
                  <span className="l2-step-no">Step {i + 1}</span>
                  <h3 className="l2-step-t">{s.title}</h3>
                  <p className="l2-step-b">{s.body}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ───────── why Koott ───────── */}
        {reasons.length > 0 && (
          <section className="l2-sec">
            <div className="l2-head-block is-small">
              <p className="l2-eyebrow">Why Koott</p>
              <h2 className="l2-h2">{c.why?.title || 'Care that speaks your language'}</h2>
            </div>
            <div className="l2-why">
              <div className="l2-why-banner">
                <img src={`${ART}/hero-landscape.webp`} alt="" />
                <span className="l2-why-strip">Only you and your therapist. Always.</span>
              </div>
              <div className="l2-reasons">
                {reasons.map((r, i) => (
                  <div className="l2-reason" key={r.title}>
                    <span className="l2-badge" aria-hidden="true">{REASON_ICONS[i % REASON_ICONS.length]}</span>
                    <span className="l2-reason-text">
                      <span className="l2-reason-t">{r.title}</span>
                      <span className="l2-reason-b">{r.body}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ───────── pricing ───────── */}
        <section className="l2-sec">
          <div className="l2-head-block is-small">
            <p className="l2-eyebrow">Pricing</p>
            <h2 className="l2-h2">{c.plans?.title || 'Simple, honest pricing'}</h2>
          </div>
          <div className="l2-split">
            <div className="l2-plan">
              <div className="l2-plan-top">
                <span className="l2-plan-k">Starting from</span>
                <span className="l2-price">
                  <span className="l2-price-v">{money(Number.isFinite(from) ? from : 749)}</span>
                  <span className="l2-price-u">/ session</span>
                </span>
              </div>
              <div className="l2-plan-body">
                <div className="l2-includes">
                  {['Licensed Malayali therapist', 'Video, audio or chat', 'Private and confidential'].map((t) => (
                    <span className="l2-include" key={t}>{I.check}{t}</span>
                  ))}
                </div>
                <Link className="l2-btn" href={bookHref}>Book a session</Link>
              </div>
            </div>

            {plans.length > 1 && (
              <div className="l2-also">
                <p className="l2-also-k">Also available</p>
                <div>
                  {plans.slice(1).map((p) => (
                    <Link className="l2-also-row" href={bookHref} key={p.name}>
                      <span>{p.name}</span>{I.chevMute}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ───────── understanding ───────── */}
        {signs.length > 0 && (
          <section className="l2-sec">
            <div className="l2-head-block is-small">
              <p className="l2-eyebrow">{c.seekHelp?.title ? 'Understanding' : 'Understanding'}</p>
              <h2 className="l2-h2">{c.seekHelp?.title || 'Does this sound like you?'}</h2>
              {c.seekHelp?.subtitle && <p className="l2-lead">{c.seekHelp.subtitle}</p>}
            </div>
            <div className="l2-chips">
              {signs.map((s) => <span className="l2-chip" key={s}>{s}</span>)}
            </div>
            {learn.length > 0 && (
              <div className="l2-learn">
                {learn.map((x, i) => (
                  <div className="l2-learn-item" key={x.title}>
                    <button type="button" className="l2-learn-row" aria-expanded={openLearn === i}
                      onClick={() => setOpenLearn(openLearn === i ? -1 : i)}>
                      <span>{x.title}</span>{openLearn === i ? I.minus : I.plus}
                    </button>
                    {openLearn === i && (
                      <div className="l2-learn-body">
                        {x.tags.map((t) => <span className="l2-tag" key={t}>{t}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ───────── blog ───────── */}
        {posts.length > 0 && (
          <section className="l2-sec is-tight">
            <div className="l2-title-row">
              <h2 className="l2-h2">From our blog</h2>
              <Link className="l2-seeall" href="/blog">See all {I.chevGreen}</Link>
            </div>
            <div className="l2-rail">
              {posts.map((p) => (
                <Link className="l2-article" href={`/blog/${p.slug || p.id}`} key={p.id || p.slug}>
                  <img src={p.cover_image_url || p.image_url || `${ART}/hero-landscape.webp`} alt="" loading="lazy" />
                  <span className="l2-article-t">{p.title}</span>
                  <span className="l2-read">Read article {I.arrow}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ───────── FAQ ───────── */}
        {faqs.length > 0 && (
          <section className="l2-sec is-tight">
            <div className="l2-head-block">
              <p className="l2-eyebrow">FAQ</p>
              <h2 className="l2-h2">Questions, answered</h2>
            </div>
            <div>
              {faqs.map((f, i) => (
                <div className="l2-faq-item" key={f.q}>
                  <button type="button" className="l2-faq-row" aria-expanded={openFaq === i}
                    onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                    <span>{f.q}</span>{openFaq === i ? I.minus : I.plus}
                  </button>
                  {openFaq === i && <p className="l2-faq-a">{f.a}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ───────── final CTA ───────── */}
      <section className="l2-final">
        <div className="l2-wrap">
          <div className="l2-final-card">
            <div className="l2-final-text">
              <h2 className="l2-final-t">Take the first step today</h2>
              <p className="l2-final-b">{c.finalCta?.text || 'Talk to a licensed Malayali therapist and start feeling calmer.'}</p>
            </div>
            <div className="l2-final-btns">
              <Link className="l2-final-btn" href={c.finalCta?.cta?.href || bookHref}>
                {c.finalCta?.cta?.label || 'Book a session'}
              </Link>
              <p className="l2-final-note">From {money(Number.isFinite(from) ? from : 749)} per session · Next slot today</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
