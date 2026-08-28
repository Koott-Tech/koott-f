'use client';

import { useState } from 'react';

/**
 * ConditionPageTemplate — layout for condition / counselling landing pages.
 *
 * Design is a 1:1 port of the live Wix page koott.in/male-sexual-concerns.
 * Every value below (palette, type scale, card chrome, section order, grid
 * counts, icon paths) was read off that page's source, not eyeballed:
 *
 *   type      headings work-sans-v2 · body avenir-lt-w01_35-light
 *   ink       #100E0E      accent green  #3D985C / #3D995C
 *   button    #4FAB69 → hover #025545    deep bands #012F23 / #29653D
 *   bands     #F5FFF6 · #FBFFF9 · #FCFFF9 · rgba(241,250,238,.49)
 *   cards     radius 10px, 1px rgba(38,34,34,.13)
 *   CTA bands linear-gradient(180deg,#F0FFEC,#D4FFC2), radius 7px
 *   content   980px column
 *
 * Avenir is a licensed Wix font and cannot be served here; Mulish is loaded as
 * the metric-and-tone substitute. Everything else is the real thing.
 *
 * Styles are scoped to .kct and marked !important because globals.css (marked
 * "never edit") forces DM Sans / 48px on h2, Work Sans / 16px on p, etc.
 * Content comes entirely from `data` — see src/data/conditionPageTemplateSample.js.
 */

/* Icon paths lifted from the live page's inline vector components. */
const ICON = {
  bubble: { vb: '20.5 27.5 159 145', d: 'M20.5 89.133c0-36.546 18.16-61.524 50.586-61.633h52.748c31.454 0 55.666 19.247 55.666 61.849V172.5s-18.16-28.114-56.639-25.951H71.194c-32.534 0-50.694-24.978-50.694-57.416z' },
  leaf: { vb: '29 19.5 141.999 161', d: 'M163.48 149.089c-3.142 5.751-7.246 11.149-12.269 15.796-26.945 24.934-76.944 17.631-101.523-5.189-14.614-13.568-20.657-31.02-20.688-48.062-.031-17.043 5.55-33.842 12.254-50.216 5.594-13.664 13.12-28.229 30.105-35.891 14.06-6.342 31.878-6.624 48.493-5.541 10.31.672 20.929 1.886 29.584 5.895 8.655 4.009 14.841 11.483 12.468 18.594-1.724 5.168-7.406 9.13-11.404 13.628-8.564 9.635-9.104 22.55-1.36 32.522 7.174 9.238 21.258 16.523 21.802 27.823.479 9.915-2.082 20.794-7.462 30.641z' },
  chevron: { vb: '20 20 160 160', d: 'M100 20c-44.184 0-80 35.817-80 80.001C20 144.184 55.817 180 100 180s80-35.817 80-79.999S144.183 20 100 20zm28.726 82.946l-4.492 4.492-33.758 33.758a4.164 4.164 0 0 1-5.89 0l-1.547-1.547a4.167 4.167 0 0 1 0-5.891l30.812-30.812a4.165 4.165 0 0 0 0-5.891L83.038 66.243a4.167 4.167 0 0 1 0-5.891l1.547-1.547a4.164 4.164 0 0 1 5.89 0l33.758 33.758 4.492 4.492a4.164 4.164 0 0 1 .001 5.891z' },
  check: { vb: '19.5 19.5 161 161', d: 'M100 19.5c-44.459 0-80.5 36.041-80.5 80.5s36.041 80.5 80.5 80.5 80.5-36.041 80.5-80.5-36.041-80.5-80.5-80.5zm38.685 65.022L95.256 127.87l-12.408 12.385L70.44 127.87l-12.408-12.386a8.748 8.748 0 0 1 0-12.386c3.426-3.42 8.982-3.42 12.408 0l12.408 12.386 43.429-43.348c3.426-3.42 8.982-3.42 12.408 0a8.748 8.748 0 0 1 0 12.386z' },
  spark: { vb: '20 19.999 160 160.001', d: 'M23.061 95.603c-4.081 1.51-4.081 7.283 0 8.793l21.009 7.775a74.07 74.07 0 0 1 43.759 43.759l7.775 21.009c1.51 4.081 7.283 4.081 8.793 0l7.775-21.009a74.07 74.07 0 0 1 43.759-43.759l21.009-7.775c4.081-1.51 4.081-7.283 0-8.793l-21.009-7.775a74.07 74.07 0 0 1-43.759-43.759l-7.775-21.009c-1.511-4.081-7.283-4.081-8.793 0l-7.775 21.009A74.07 74.07 0 0 1 44.07 87.828z' },
  arrow: { vb: '20 20 160 160', d: 'M100 20c-44.184 0-80 35.817-80 80.001C20 144.184 55.817 180 100 180s80-35.817 80-79.999S144.183 20 100 20zm28.726 82.946l-4.492 4.492-33.758 33.758a4.164 4.164 0 0 1-5.89 0l-1.547-1.547a4.167 4.167 0 0 1 0-5.891l30.812-30.812a4.165 4.165 0 0 0 0-5.891L83.038 66.243a4.167 4.167 0 0 1 0-5.891l1.547-1.547a4.164 4.164 0 0 1 5.89 0l33.758 33.758 4.492 4.492a4.164 4.164 0 0 1 .001 5.891z' },
};

const Icon = ({ name, size = 15, fill = '#189E4F', className = '' }) => {
  const i = ICON[name];
  return (
    <svg className={className} viewBox={i.vb} width={size} height={size} aria-hidden focusable="false">
      <path d={i.d} fill={fill} />
    </svg>
  );
};

/* ---------- building blocks ---------- */

const Section = ({ children, bg, className = '', id }) => (
  <section id={id} className={`kct-sec ${className}`} style={bg ? { background: bg } : undefined}>
    <div className="kct-in">{children}</div>
  </section>
);

/** Bordered card with an inline leading icon — symptoms / types / seek-help / therapy. */
const Card = ({ title, body, icon = 'bubble', variant = '', iconSize = 15 }) => (
  <div className={`kct-card ${variant}`}>
    <h3 className="kct-card-t">
      {icon && <Icon name={icon} size={iconSize} className="kct-card-i" />}
      {title}
    </h3>
    <p className="kct-card-b">{body}</p>
  </div>
);

/** Solid green pill — the hero's primary action. */
const BookButton = ({ href = '#', children }) => (
  <a href={href} className="kct-btn-solid">{children}</a>
);

/** White pill with an arrow — the "Book a Session" / "Talk to a Therapist" style. */
const OutlineButton = ({ href = '#', children, dark = false }) => (
  <a href={href} className={`kct-btn-pill ${dark ? 'is-dark' : ''}`}>
    <span>{children}</span>
    <Icon name="arrow" size={20} fill={dark ? '#FFFFFF' : '#29653D'} />
  </a>
);

/* ---------- page ---------- */

export default function ConditionPageTemplate({ data }) {
  const [openFaq, setOpenFaq] = useState(-1);
  const [query, setQuery] = useState('');
  const d = data;

  const faqs = d.faqs.filter(
    (f) => !query || (f.q + f.a).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="kct">
      {/* dangerouslySetInnerHTML keeps the quotes in the CSS byte-identical
          between server and client render — <style>{CSS}</style> escapes them
          differently and trips React's hydration check. */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <Section className="kct-hero">
        <div className="kct-hero-grid">
          <div>
            <h5 className="kct-eyebrow">{d.hero.eyebrow}</h5>
            <h1 className="kct-h1">{d.hero.title}</h1>
            <p className="kct-lede">{d.hero.subtitle}</p>

            <div className="kct-hero-cta">
              <BookButton href={d.hero.primaryCta.href}>{d.hero.primaryCta.label}</BookButton>
              <a href={d.hero.secondaryCta.href} className="kct-btn-ghost">
                <span>{d.hero.secondaryCta.label}</span>
                <svg viewBox="0 0 200 200" width="28" height="28" aria-hidden>
                  <path fill="#0dc143" d="M132.7 112c-1.7-.9-10-4.9-11.5-5.4-1.6-.5-2.6-.9-3.8.9-1.1 1.8-4.4 5.4-5.3 6.6-1 1.1-1.9 1.2-3.7.4-1.7-.9-7.2-2.6-13.6-8.2-5.1-4.4-8.4-10-9.4-11.6-1-1.7-.1-2.6.8-3.4.8-.8 1.7-1.9 2.5-3 .9-1 1.1-1.7 1.7-2.8.5-1.1.3-2.1-.2-3s-3.8-9-5.2-12.4c-1.4-3.3-2.8-2.8-3.8-2.8s-2.1-.2-3.2-.2-3 .4-4.5 2.1c-1.6 1.7-5.9 5.8-5.9 13.9 0 8.2 6 16.2 6.8 17.3.9 1.1 11.6 18.5 28.8 25.3 17.2 6.7 17.2 4.5 20.2 4.2 3.1-.3 10-4 11.4-7.9 1.4-3.9 1.4-7.3 1-7.9-.3-.9-1.4-1.3-3.1-2.1z" />
                  <path fill="#0dc143" d="M101.2 30c-37.9 0-68.7 30.5-68.7 68.2 0 12.9 3.6 24.9 9.9 35.2L30 170l38.1-12.1c9.9 5.4 21.1 8.5 33.2 8.5 37.9 0 68.7-30.5 68.7-68.2-.1-37.7-30.9-68.2-68.8-68.2zm0 125.5c-11.7 0-22.7-3.5-31.8-9.4l-22.1 7.1 7.2-21.3c-6.9-9.4-11-21.1-11-33.6 0-31.7 25.9-57.3 57.8-57.3S159 66.7 159 98.2c0 31.6-25.9 57.3-57.8 57.3z" />
                </svg>
              </a>
            </div>

            {d.hero.verifiedBy && (
              <p className="kct-verified">
                <span className="kct-tick">✔</span> {d.hero.verifiedBy}
              </p>
            )}
          </div>

          {/* Media slot — the live page runs a 351×374 video popup here. */}
          <div className="kct-hero-media">
            <span className="kct-play" aria-hidden>▶</span>
            <span className="kct-media-label">{d.hero.mediaLabel}</span>
          </div>
        </div>

        <div className="kct-stats">
          {d.stats.map((s, i) => (
            <div key={i} className="kct-stat">
              <h4 className="kct-stat-v">{s.value}</h4>
              <p className="kct-stat-l">{s.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Therapists ─────────────────────────────────────────────────── */}
      <Section bg="#F5FFF6">
        <p className="kct-kicker">{d.therapists.eyebrow}</p>
        <h2 className="kct-h2 kct-center">{d.therapists.title}</h2>

        <div className="kct-filters">
          {d.therapists.filters.map((f) => (
            <button key={f} type="button" className="kct-select">
              {f}<span aria-hidden>⌄</span>
            </button>
          ))}
        </div>

        <div className="kct-therapists">
          {Array.from({ length: d.therapists.placeholderCount ?? 3 }).map((_, i) => (
            <div key={i} className="kct-therapist">
              <div className="kct-therapist-photo" />
              <div className="kct-therapist-body">
                <div className="kct-sk kct-sk-lg" />
                <div className="kct-sk kct-sk-md" />
                <div className="kct-sk kct-sk-sm" />
                <div className="kct-therapist-btn" />
              </div>
            </div>
          ))}
        </div>
        <p className="kct-more"><a href="/counselling">View More</a></p>
      </Section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <Section>
        <div className="kct-split">
          <div>
            <h2 className="kct-h2">{d.howItWorks.title}</h2>
            <p className="kct-sub">{d.howItWorks.subtitle}</p>
            <div className="kct-steps">
              {d.howItWorks.steps.map((s, i) => (
                <div key={i} className="kct-card kct-card--plain">
                  <h3 className="kct-card-t"><span className="kct-num">{i + 1}.</span>{s.title}</h3>
                  <p className="kct-card-b">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="kct-figure kct-figure--tall" aria-hidden />
        </div>
      </Section>

      {/* ── Why ────────────────────────────────────────────────────────── */}
      <Section bg="#012F23" className="kct-on-dark">
        <div className="kct-split kct-split--rev">
          <div className="kct-figure kct-figure--tall" aria-hidden />
          <div>
            <h2 className="kct-h2">{d.why.title}</h2>
            <p className="kct-sub">{d.why.subtitle}</p>
            <div className="kct-why-grid">
              {d.why.items.map((it, i) => (
                <Card key={i} {...it} icon={null} variant="kct-card--solid" />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Plans ──────────────────────────────────────────────────────── */}
      <Section>
        <h2 className="kct-h2 kct-center kct-h2--deep">{d.plans.title}</h2>
        <p className="kct-sub kct-center">{d.plans.subtitle}</p>
        <div className="kct-grid-3">
          {d.plans.items.map((p, i) => (
            <div key={i} className="kct-card kct-card--plan">
              <h3 className="kct-card-t">{p.name}</h3>
              <p className="kct-card-b">{p.body}</p>
              <span className="kct-price">Starting from ₹{p.from}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Reviews ────────────────────────────────────────────────────── */}
      <Section className="kct-reviews-sec">
        <p className="kct-kicker">{d.reviews.eyebrow}</p>
        <h3 className="kct-reviews-h">{d.reviews.title}</h3>
        <div className="kct-reviews">
          {d.reviews.items.map((r, i) => (
            <figure key={i} className="kct-review">
              <blockquote>{r.quote}</blockquote>
              {r.name && <figcaption>{r.name}</figcaption>}
            </figure>
          ))}
        </div>
      </Section>

      {/* ── CTA band (dark pill) ───────────────────────────────────────── */}
      <Section>
        <div className="kct-cta-row">
          <p className="kct-cta-text">{d.ctaBand.text}</p>
          <OutlineButton href={d.ctaBand.cta.href} dark>{d.ctaBand.cta.label}</OutlineButton>
        </div>
      </Section>

      {/* ── About the condition ────────────────────────────────────────── */}
      <Section bg="#FBFFF9" className="kct-about">
        <h2 className="kct-h2 kct-center">{d.about.title}</h2>
        <div className="kct-prose">
          {d.about.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </Section>

      {/* ── Pillars (Mind / Emotions / Energy / Life) ──────────────────── */}
      <Section bg="#FBFFF9" className="kct-pillars-sec">
        <div className="kct-grid-4">
          {d.about.pillars.map((p, i) => (
            <Card key={i} {...p} icon="leaf" iconSize={19} variant="kct-card--pillar" />
          ))}
        </div>
      </Section>

      {/* ── Symptoms ───────────────────────────────────────────────────── */}
      <Section>
        <h2 className="kct-h2 kct-center">{d.symptoms.title}</h2>
        <p className="kct-sub kct-center">{d.symptoms.subtitle}</p>
        <div className="kct-grid-3">
          {d.symptoms.items.map((it, i) => <Card key={i} {...it} icon="bubble" />)}
        </div>
      </Section>

      {/* ── Mid CTA band ───────────────────────────────────────────────── */}
      <Section>
        <div className="kct-band">
          <div className="kct-band-art" aria-hidden />
          <h5 className="kct-band-title">{d.midCta.text}</h5>
          <OutlineButton href={d.midCta.cta.href}>{d.midCta.cta.label}</OutlineButton>
        </div>
      </Section>

      {/* ── When to seek help ──────────────────────────────────────────── */}
      <Section>
        <h2 className="kct-h2 kct-center">{d.seekHelp.title}</h2>
        <p className="kct-sub kct-center">{d.seekHelp.subtitle}</p>
        <div className="kct-stack">
          {d.seekHelp.items.map((it, i) => (
            <Card key={i} {...it} icon="chevron" variant="kct-card--wide kct-card--plain" />
          ))}
        </div>
      </Section>

      {/* ── Book band ──────────────────────────────────────────────────── */}
      <Section>
        <div className="kct-band kct-band--stack">
          <div>
            <h4 className="kct-band-h">{d.bookBand.title}</h4>
            <p className="kct-band-p">{d.bookBand.text}</p>
          </div>
          <OutlineButton href={d.bookBand.cta.href}>{d.bookBand.cta.label}</OutlineButton>
        </div>
      </Section>

      {/* ── Types ──────────────────────────────────────────────────────── */}
      <Section bg="rgba(241,250,238,0.49)">
        <h2 className="kct-h2 kct-center">{d.types.title}</h2>
        <p className="kct-sub kct-center">{d.types.subtitle}</p>
        <div className="kct-grid-3 kct-grid-3--wide">
          {d.types.items.map((it, i) => (
            <Card key={i} {...it} icon="check" variant="kct-card--green" />
          ))}
        </div>
      </Section>

      {/* ── How therapy helps ──────────────────────────────────────────── */}
      <Section>
        <h2 className="kct-h2 kct-center">{d.therapyHelps.title}</h2>
        <p className="kct-sub kct-center">{d.therapyHelps.subtitle}</p>
        <div className="kct-stack">
          {d.therapyHelps.items.map((it, i) => (
            <Card key={i} {...it} icon="spark" iconSize={22} variant="kct-card--wide kct-card--plain" />
          ))}
        </div>
      </Section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <Section>
        <div className="kct-cta-row">
          <p className="kct-cta-text">{d.finalCta.text}</p>
          <OutlineButton href={d.finalCta.cta.href}>{d.finalCta.cta.label}</OutlineButton>
        </div>
      </Section>

      {/* ── FAQs (Wix "line" theme: search + underlined rows) ──────────── */}
      <Section className="kct-faq-sec">
        <div className="kct-faq-head">
          <p className="kct-faq-label">FAQ&rsquo;s</p>
          <input
            type="text"
            className="kct-faq-search"
            placeholder="Looking for something?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search frequently asked questions"
          />
        </div>
        <div className="kct-faq">
          {faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={i} className="kct-faq-row">
                <button type="button" onClick={() => setOpenFaq(open ? -1 : i)} aria-expanded={open}>
                  <span>{f.q}</span>
                  <span className="kct-faq-sign" aria-hidden>{open ? '−' : '+'}</span>
                </button>
                {open && <p>{f.a}</p>}
              </div>
            );
          })}
          {faqs.length === 0 && <p className="kct-faq-empty">No matching questions.</p>}
        </div>
      </Section>

      {/* ── Closing CTA ────────────────────────────────────────────────── */}
      <Section bg="#FFFFFF" className="kct-end">
        <h4 className="kct-end-h">
          We have supported over 1 million lives,<br />with 4.9 star reviews
        </h4>
        <BookButton href={d.hero.primaryCta.href}>{d.hero.primaryCta.label}</BookButton>
      </Section>
    </main>
  );
}

/* ------------------------------------------------------------------------ */
/* Scoped stylesheet. !important throughout because globals.css (never edit)  */
/* hard-sets h1–h6 and p sizes/families site-wide.                            */
/* ------------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;600;700&family=Work+Sans:wght@300;400;500;600;700&display=swap');

.kct{
  --ink:#100E0E;
  --green:#4FAB69;
  --green-hover:#025545;
  --accent:#3D985C;
  --deep:#012F23;
  --deep2:#29653D;
  --icon:#189E4F;
  --line:rgba(38,34,34,.13);
  --sans:'Work Sans',ui-sans-serif,system-ui,sans-serif;
  --body:'Mulish','Avenir Light','Avenir Next','Avenir',ui-sans-serif,system-ui,sans-serif;
  --band:linear-gradient(180deg,#F0FFEC 0%,#D4FFC2 100%);
  background:#fff;color:var(--ink);
  font-family:var(--body)!important;
}
.kct *{box-sizing:border-box;}
.kct span,.kct a,.kct button,.kct li,.kct input{letter-spacing:0!important;}

.kct-sec{padding:64px 0;}
.kct-in{max-width:980px;margin:0 auto;padding:0 20px;}
.kct-center{text-align:center!important;}

/* type scale ------------------------------------------------------------ */
.kct-h1{
  font-family:var(--sans)!important;font-size:32px!important;font-weight:500!important;
  line-height:1.3em!important;letter-spacing:-.05em!important;color:var(--ink)!important;margin:0 0 14px;
}
.kct-h2{
  font-family:var(--sans)!important;font-size:26px!important;font-weight:500!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--ink)!important;margin:0;
}
.kct-h2--deep{color:var(--deep)!important;line-height:1.3em!important;}
.kct-eyebrow{
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:1.4em!important;color:var(--ink)!important;margin:0 0 12px;
}
.kct-lede{
  font-family:var(--body)!important;font-size:15px!important;font-weight:300!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--ink)!important;margin:0;max-width:34em;
}
.kct-sub{
  font-family:var(--body)!important;font-size:16px!important;font-weight:300!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--ink)!important;margin:12px 0 0;
}
.kct-sub.kct-center{max-width:44em;margin-left:auto;margin-right:auto;}
.kct-kicker{
  font-family:var(--body)!important;font-size:13px!important;font-weight:300!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--ink)!important;
  margin:0 0 8px;text-align:center;
}

/* hero ------------------------------------------------------------------ */
.kct-hero{padding-top:56px;}
.kct-hero-grid{display:grid;grid-template-columns:1fr 351px;gap:56px;align-items:center;}
.kct-hero-cta{display:flex;align-items:center;gap:18px;margin:26px 0 20px;flex-wrap:wrap;}
.kct-verified{
  font-family:var(--body)!important;font-size:13px!important;font-weight:300!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--ink)!important;margin:0;
}
.kct-tick{color:var(--accent);}
.kct-hero-media{
  position:relative;width:351px;height:374px;border-radius:10px;
  background:linear-gradient(180deg,#F0FFEC 0%,#D4FFC2 100%);
  display:flex;align-items:center;justify-content:center;
}
.kct-play{
  width:56px;height:56px;border-radius:50%;background:var(--green);color:#fff;
  display:flex;align-items:center;justify-content:center;font-size:18px;padding-left:4px;
  box-shadow:0 6px 20px rgba(2,85,69,.25);
}
.kct-media-label{position:absolute;bottom:14px;font-size:12px;color:#5b6a5f;}

/* buttons --------------------------------------------------------------- */
.kct-btn-solid{
  display:inline-flex;align-items:center;justify-content:center;
  min-width:152px;height:40px;padding:0 20px;border-radius:10px;
  background:var(--green);color:#fff!important;text-decoration:none;
  font-family:var(--sans)!important;font-size:15px;font-weight:400;
  transition:background-color .4s ease,color .4s ease;
}
.kct-btn-solid:hover{background:var(--green-hover);}
.kct-btn-ghost{
  display:inline-flex;align-items:center;gap:4px;text-decoration:none;
  font-family:var(--sans)!important;font-size:15px;color:#282626!important;
  padding:6px 4px;border-radius:8px;transition:all .2s ease;
}
.kct-btn-ghost:hover{color:var(--accent)!important;}
.kct-btn-pill{
  display:inline-flex;align-items:center;gap:6px;flex:none;
  padding:9px 18px;border-radius:15px;background:#fff;border:1px solid #025545;
  font-family:var(--sans)!important;font-size:15px;color:var(--accent)!important;
  text-decoration:none;transition:all .2s ease;white-space:nowrap;
}
.kct-btn-pill:hover{border-width:2px;padding:8px 17px;color:var(--deep2)!important;}
.kct-btn-pill.is-dark{background:var(--deep2);color:#fff!important;font-size:13px;box-shadow:.71px .71px #fff;}
.kct-btn-pill.is-dark:hover{color:#fff!important;}

/* stats ----------------------------------------------------------------- */
.kct-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:44px;}
.kct-stat{
  border-radius:15px;padding:15px 12px 20px 20px;
  background:linear-gradient(180deg,rgba(240,255,236,.3172) 0%,rgba(212,255,194,.52) 100%);
  transition:transform .2s ease-in-out;
}
.kct-stat:hover{transform:translateY(-10px);}
.kct-stat-v{
  font-family:var(--sans)!important;font-size:20px!important;font-weight:600!important;
  line-height:1.6em!important;letter-spacing:0!important;color:#3D995C!important;
  text-align:center;margin:0 0 4px;
}
.kct-stat-l{
  font-family:var(--body)!important;font-size:13px!important;font-weight:300!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--ink)!important;
  text-align:center;margin:0;
}

/* therapists ------------------------------------------------------------ */
.kct-filters{display:flex;gap:10px;justify-content:center;margin:22px 0 26px;}
.kct-select{
  display:inline-flex;align-items:center;gap:8px;background:#fff;
  border:1px solid var(--line);border-radius:6px;padding:9px 14px;
  font-family:var(--body)!important;font-size:14px;color:var(--ink);
}
.kct-therapists{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
.kct-therapist{background:#fff;overflow:hidden;}
.kct-therapist-photo{aspect-ratio:4/3;background:#EAF6EC;}
.kct-therapist-body{padding:16px 4px 0;}
.kct-sk{border-radius:4px;background:#EFF4F0;}
.kct-sk-lg{height:16px;width:60%;}
.kct-sk-md{height:12px;width:45%;margin-top:10px;}
.kct-sk-sm{height:12px;width:80%;margin-top:10px;}
.kct-therapist-btn{height:36px;border-radius:10px;background:#EAF6EC;margin-top:16px;}
.kct-more{text-align:center;margin:26px 0 0;}
.kct-more a{font-family:var(--sans)!important;font-size:15px;color:var(--deep2)!important;text-decoration:none;}

/* split sections (how it works / why) ----------------------------------- */
.kct-split{display:grid;grid-template-columns:1fr 330px;gap:48px;align-items:start;}
.kct-split--rev{grid-template-columns:316px 1fr;}
.kct-figure{border-radius:10px;background:linear-gradient(180deg,#F0FFEC 0%,#D4FFC2 100%);}
.kct-figure--tall{min-height:456px;}
.kct-on-dark .kct-figure{background:rgba(255,255,255,.08);min-height:431px;}
.kct-on-dark .kct-h2,.kct-on-dark .kct-sub{color:#fff!important;}
.kct-steps{display:flex;flex-direction:column;gap:15px;margin-top:24px;}
.kct-why-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:20px;}

/* cards ----------------------------------------------------------------- */
.kct-card{
  border:1px solid var(--line);border-radius:10px;padding:16px 20px;background:transparent;
}
.kct-card--solid{background:#fff;border-color:#fff;}
.kct-card--green{background:#fff;border-color:#5EA277;}
.kct-card--plan{background:transparent;border-color:rgba(41,101,61,.31);display:flex;flex-direction:column;}
.kct-card--pillar{background:#fff;border:0;box-shadow:0 2px 14px rgba(16,14,14,.05);}
.kct-card--wide{width:100%;}
.kct-card-t{
  display:flex;align-items:flex-start;gap:8px;
  font-family:var(--body)!important;font-size:17px!important;font-weight:700!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--ink)!important;margin:0 0 8px;
}
.kct-card-i{flex:none;margin-top:5px;}
.kct-card-b{
  font-family:var(--body)!important;font-size:14px!important;font-weight:300!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--ink)!important;margin:0;
}
.kct-card--plan .kct-card-b{flex:1;}
.kct-num{font-family:var(--sans)!important;font-weight:700;color:var(--ink);}
.kct-price{
  font-family:var(--sans)!important;font-size:15px;color:var(--deep2);margin-top:16px;display:block;
}
.kct-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:32px;}
.kct-grid-3--wide{gap:26px;}
.kct-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;}
.kct-stack{display:flex;flex-direction:column;gap:20px;margin-top:32px;max-width:559px;margin-left:auto;margin-right:auto;}

/* reviews --------------------------------------------------------------- */
.kct-reviews-h{
  font-family:var(--sans)!important;font-size:17px!important;font-weight:500!important;
  line-height:1.4em!important;letter-spacing:-.05em!important;color:var(--ink)!important;
  text-align:center;margin:0 0 32px;
}
.kct-reviews{display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x mandatory;}
.kct-review{
  flex:none;width:304px;height:380px;margin:0;border-radius:10px;scroll-snap-align:start;
  background:linear-gradient(180deg,#2c4b39 0%,#0d2419 100%);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:24px 18px;position:relative;overflow:hidden;
}
.kct-review::before{content:'';position:absolute;inset:0;background:rgba(8,8,8,.35);}
.kct-review blockquote{
  position:relative;margin:0;text-align:center;color:#fff;
  font-family:var(--body)!important;font-size:14px;font-weight:300;line-height:1.6em;
}
.kct-review figcaption{position:relative;margin-top:14px;font-size:12px;color:rgba(255,255,255,.75);}

/* CTA rows & gradient bands --------------------------------------------- */
.kct-cta-row{display:flex;align-items:center;justify-content:center;gap:24px;flex-wrap:wrap;}
.kct-cta-text{
  font-family:var(--body)!important;font-size:14px!important;font-weight:300!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--ink)!important;
  text-align:center;margin:0;max-width:640px;
}
.kct-band{
  display:flex;align-items:center;gap:28px;border-radius:7px;padding:28px 32px;background:var(--band);
}
.kct-band--stack{justify-content:space-between;}
.kct-band-art{flex:none;width:130px;height:95px;border-radius:8px;background:rgba(255,255,255,.55);}
.kct-band-title{
  flex:1;font-family:var(--sans)!important;font-size:16px!important;font-weight:500!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--ink)!important;margin:0;
}
.kct-band-h{
  font-family:var(--sans)!important;font-size:18px!important;font-weight:500!important;
  line-height:1.3em!important;letter-spacing:0!important;color:var(--ink)!important;margin:0 0 10px;
}
.kct-band-p{
  font-family:var(--body)!important;font-size:14px!important;font-weight:300!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--ink)!important;margin:0;max-width:44em;
}

/* about ----------------------------------------------------------------- */
.kct-prose{max-width:720px;margin:22px auto 0;}
.kct-prose p{
  font-family:var(--body)!important;font-size:16px!important;font-weight:300!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--ink)!important;
  text-align:center;margin:0 0 18px;
}
.kct-about{padding-bottom:0;}
.kct-pillars-sec{padding-top:32px;}

/* FAQ ------------------------------------------------------------------- */
.kct-faq-head{display:flex;align-items:center;gap:24px;margin-bottom:8px;}
.kct-faq-label{
  font-family:var(--sans)!important;font-size:20px!important;font-weight:500!important;
  letter-spacing:-.05em!important;color:var(--ink)!important;margin:0;
}
.kct-faq-search{
  flex:1;border:0;border-bottom:1px solid var(--line);background:transparent;
  padding:10px 2px;font-family:var(--body)!important;font-size:14px;color:var(--ink);outline:none;
}
.kct-faq-search:focus{border-bottom-color:var(--accent);}
.kct-faq{border-top:1px solid var(--line);}
.kct-faq-row{border-bottom:1px solid var(--line);}
.kct-faq-row button{
  width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;
  background:none;border:0;padding:22px 0;text-align:left;
  font-family:var(--body)!important;font-size:17px;font-weight:700;color:var(--ink);
}
.kct-faq-sign{font-size:20px;line-height:1;color:var(--accent);font-weight:400;}
.kct-faq-row p{
  font-family:var(--body)!important;font-size:14px!important;font-weight:300!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--ink)!important;
  margin:0;padding:0 0 22px;max-width:52em;
}
.kct-faq-empty{font-family:var(--body)!important;font-size:14px!important;padding:22px 0;}

/* closing --------------------------------------------------------------- */
.kct-end{text-align:center;}
.kct-end-h{
  font-family:var(--sans)!important;font-size:22px!important;font-weight:500!important;
  line-height:1.4em!important;letter-spacing:-.03em!important;color:var(--ink)!important;margin:0 0 22px;
}

/* responsive ------------------------------------------------------------ */
@media (max-width:900px){
  .kct-hero-grid,.kct-split,.kct-split--rev{grid-template-columns:1fr;gap:32px;}
  .kct-hero-media{width:100%;}
  .kct-split--rev .kct-figure{order:2;}
  .kct-figure--tall{min-height:260px;}
  .kct-grid-3,.kct-grid-3--wide,.kct-therapists{grid-template-columns:repeat(2,1fr);}
  .kct-grid-4,.kct-stats{grid-template-columns:repeat(2,1fr);}
}
@media (max-width:640px){
  .kct-sec{padding:44px 0;}
  .kct-h1{font-size:28px!important;}
  .kct-h2{font-size:22px!important;}
  .kct-grid-3,.kct-grid-3--wide,.kct-grid-4,.kct-stats,.kct-therapists,.kct-why-grid{grid-template-columns:1fr;}
  .kct-band{flex-direction:column;text-align:center;}
  .kct-band-art{display:none;}
  .kct-faq-head{flex-direction:column;align-items:flex-start;gap:8px;}
  .kct-faq-search{width:100%;}
}
`;
