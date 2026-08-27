'use client';

import { useState } from 'react';

/**
 * ConditionPageTemplate — layout for condition / counselling landing pages.
 *
 * Design mirrors koott.in/anxiety-treatment. Everything is driven by the `data`
 * prop (see src/data/conditionPageTemplateSample.js for the shape), so one
 * component serves every condition page and the CMS only stores content.
 *
 * Palette is scoped here rather than added to globals.css, which is marked
 * "never edit". These are the values measured off the live site:
 *   brand  #4FAB69   deep #29653D   ink #100E0E   mint #F1F9F3 / #FBFFF9
 */

const BRAND = '#4FAB69';
const DEEP = '#29653D';
const INK = '#100E0E';
const MINT = '#F1F9F3';
const MINT_SOFT = '#FBFFF9';

/* ---------- small building blocks ---------- */

const Section = ({ children, className = '', bg }) => (
  <section className={`px-5 sm:px-8 lg:px-12 ${className}`} style={bg ? { background: bg } : undefined}>
    <div className="mx-auto w-full max-w-6xl">{children}</div>
  </section>
);

const Heading = ({ children, as: As = 'h2', className = '' }) => (
  <As className={`font-medium tracking-tight ${className}`} style={{ color: INK }}>
    {children}
  </As>
);

const Lede = ({ children, className = '' }) => (
  <p className={`text-[15px] leading-relaxed text-neutral-600 ${className}`}>{children}</p>
);

const PrimaryButton = ({ href = '#', children }) => (
  <a
    href={href}
    className="inline-flex items-center justify-center rounded-[10px] px-6 py-3 text-sm font-medium text-white transition-colors"
    style={{ background: BRAND }}
    onMouseEnter={(e) => (e.currentTarget.style.background = DEEP)}
    onMouseLeave={(e) => (e.currentTarget.style.background = BRAND)}
  >
    {children}
  </a>
);

const GhostButton = ({ href = '#', children }) => (
  <a
    href={href}
    className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-neutral-200 px-6 py-3 text-sm font-medium transition-colors hover:bg-neutral-50"
    style={{ color: INK }}
  >
    {children}
    <span aria-hidden style={{ color: BRAND }}>✆</span>
  </a>
);

/** Pale card used for the symptom / type / benefit grids. */
const SoftCard = ({ title, body }) => (
  <div className="rounded-2xl border border-neutral-100 bg-white p-6 transition-shadow hover:shadow-[0_2px_16px_rgba(16,14,14,0.06)]">
    <h3 className="mb-2 text-[17px] font-medium" style={{ color: INK }}>{title}</h3>
    <p className="text-sm leading-relaxed text-neutral-600">{body}</p>
  </div>
);

/* ---------- page ---------- */

export default function ConditionPageTemplate({ data }) {
  const [openFaq, setOpenFaq] = useState(0);
  const d = data;

  return (
    <main
      className="bg-white"
      style={{ fontFamily: '"Work Sans", ui-sans-serif, system-ui, -apple-system, sans-serif', color: INK }}
    >
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <Section className="pt-12 pb-14 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="mb-4 text-[13px] text-neutral-500">{d.hero.eyebrow}</p>
            <Heading as="h1" className="text-[32px] leading-[1.3] sm:text-[40px] sm:leading-[1.25]">
              {d.hero.title}
            </Heading>
            <Lede className="mt-5 max-w-xl">{d.hero.subtitle}</Lede>

            {d.hero.verifiedBy && (
              <p className="mt-6 flex items-start gap-2 text-[13px] text-neutral-500">
                <span aria-hidden style={{ color: BRAND }}>✔</span>
                <span>{d.hero.verifiedBy}</span>
              </p>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <PrimaryButton href={d.hero.primaryCta.href}>{d.hero.primaryCta.label}</PrimaryButton>
              <GhostButton href={d.hero.secondaryCta.href}>{d.hero.secondaryCta.label}</GhostButton>
            </div>
          </div>

          {/* Media slot — swap for <video> or next/image once the asset exists. */}
          <div
            className="relative flex aspect-[4/3] items-center justify-center rounded-2xl"
            style={{ background: MINT }}
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg"
              style={{ background: BRAND }}
              aria-hidden
            >
              <span className="ml-1 text-xl">▶</span>
            </div>
            <span className="absolute bottom-4 text-xs text-neutral-500">{d.hero.mediaLabel}</span>
          </div>
        </div>
      </Section>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <Section className="pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.stats.map((s, i) => (
            <div key={i} className="rounded-2xl p-6 text-center" style={{ background: MINT }}>
              <div className="text-[22px] font-semibold" style={{ color: DEEP }}>{s.value}</div>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{s.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Therapists ─────────────────────────────────────────────────── */}
      <Section className="py-16" bg={MINT_SOFT}>
        <p className="text-sm text-neutral-500">{d.therapists.eyebrow}</p>
        <Heading className="mt-2 text-[26px] sm:text-[30px]">{d.therapists.title}</Heading>

        <div className="mt-6 flex flex-wrap gap-2">
          {d.therapists.filters.map((f) => (
            <button
              key={f}
              type="button"
              className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 hover:border-neutral-300"
            >
              {f} <span aria-hidden className="ml-1 text-[10px]">▾</span>
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: d.therapists.placeholderCount ?? 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
              <div className="aspect-[4/3] w-full" style={{ background: MINT }} />
              <div className="p-5">
                <div className="h-4 w-32 rounded bg-neutral-100" />
                <div className="mt-2 h-3 w-24 rounded bg-neutral-100" />
                <div className="mt-4 h-9 w-full rounded-[10px]" style={{ background: MINT }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center">
          <a href="/counselling" className="text-sm font-medium" style={{ color: DEEP }}>View More →</a>
        </p>
      </Section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <Section className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Heading className="text-[26px] sm:text-[30px]">{d.howItWorks.title}</Heading>
          <Lede className="mt-3">{d.howItWorks.subtitle}</Lede>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {d.howItWorks.steps.map((s, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 p-6">
              <div
                className="mb-4 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ background: BRAND }}
              >
                {i + 1}
              </div>
              <h3 className="mb-2 text-[17px] font-medium">{s.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-600">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Why ────────────────────────────────────────────────────────── */}
      <Section className="py-16" bg={MINT_SOFT}>
        <div className="mx-auto max-w-2xl text-center">
          <Heading className="text-[26px] sm:text-[30px]">{d.why.title}</Heading>
          <Lede className="mt-3">{d.why.subtitle}</Lede>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {d.why.items.map((it, i) => <SoftCard key={i} {...it} />)}
        </div>
      </Section>

      {/* ── Plans ──────────────────────────────────────────────────────── */}
      <Section className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Heading className="text-[26px] sm:text-[30px]">{d.plans.title}</Heading>
          <Lede className="mt-3">{d.plans.subtitle}</Lede>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {d.plans.items.map((p, i) => (
            <div key={i} className="flex flex-col rounded-2xl border border-neutral-100 p-6">
              <h3 className="text-[17px] font-medium">{p.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">{p.body}</p>
              <p className="mt-5 text-sm font-medium" style={{ color: DEEP }}>
                Starting from ₹{p.from}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Reviews ────────────────────────────────────────────────────── */}
      <Section className="py-16" bg={MINT}>
        <p className="text-sm text-neutral-500">{d.reviews.eyebrow}</p>
        <Heading className="mt-2 max-w-2xl text-[24px] sm:text-[28px]">{d.reviews.title}</Heading>
        <div className="mt-8 flex snap-x gap-5 overflow-x-auto pb-2">
          {d.reviews.items.map((r, i) => (
            <figure key={i} className="w-[300px] shrink-0 snap-start rounded-2xl bg-white p-6 sm:w-[360px]">
              <div aria-hidden className="mb-3 text-sm" style={{ color: BRAND }}>★★★★★</div>
              <blockquote className="text-sm leading-relaxed text-neutral-700">“{r.quote}”</blockquote>
              {r.name && <figcaption className="mt-4 text-xs text-neutral-500">{r.name}</figcaption>}
            </figure>
          ))}
        </div>
      </Section>

      {/* ── CTA band ───────────────────────────────────────────────────── */}
      <Section className="py-14">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-neutral-100 p-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="max-w-2xl text-[15px] leading-relaxed">{d.ctaBand.text}</p>
          <PrimaryButton href={d.ctaBand.cta.href}>{d.ctaBand.cta.label}</PrimaryButton>
        </div>
      </Section>

      {/* ── About the condition ────────────────────────────────────────── */}
      <Section className="py-16">
        <Heading className="text-[26px] sm:text-[30px]">{d.about.title}</Heading>
        <div className="mt-5 max-w-3xl space-y-4">
          {d.about.paragraphs.map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-neutral-600">{p}</p>
          ))}
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {d.about.pillars.map((p, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: MINT }}>
              <h3 className="mb-2 text-[17px] font-medium" style={{ color: DEEP }}>{p.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-600">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Symptoms ───────────────────────────────────────────────────── */}
      <Section className="py-16" bg={MINT_SOFT}>
        <div className="mx-auto max-w-2xl text-center">
          <Heading className="text-[26px] sm:text-[30px]">{d.symptoms.title}</Heading>
          <Lede className="mt-3">{d.symptoms.subtitle}</Lede>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {d.symptoms.items.map((it, i) => <SoftCard key={i} {...it} />)}
        </div>
      </Section>

      {/* ── Mid CTA ────────────────────────────────────────────────────── */}
      <Section className="py-14">
        <div className="flex flex-col items-center gap-5 rounded-2xl p-8 text-center" style={{ background: MINT }}>
          <p className="max-w-2xl text-[15px] leading-relaxed">{d.midCta.text}</p>
          <PrimaryButton href={d.midCta.cta.href}>{d.midCta.cta.label}</PrimaryButton>
        </div>
      </Section>

      {/* ── When to seek help ──────────────────────────────────────────── */}
      <Section className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Heading className="text-[26px] sm:text-[30px]">{d.seekHelp.title}</Heading>
          <Lede className="mt-3">{d.seekHelp.subtitle}</Lede>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {d.seekHelp.items.map((it, i) => <SoftCard key={i} {...it} />)}
        </div>
      </Section>

      {/* ── Book band ──────────────────────────────────────────────────── */}
      <Section className="py-14">
        <div
          className="flex flex-col items-center gap-4 rounded-2xl px-8 py-10 text-center"
          style={{ background: DEEP }}
        >
          <h2 className="text-[22px] font-medium text-white">{d.bookBand.title}</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-white/80">{d.bookBand.text}</p>
          <a
            href={d.bookBand.cta.href}
            className="mt-2 inline-flex items-center rounded-[10px] bg-white px-6 py-3 text-sm font-medium"
            style={{ color: DEEP }}
          >
            {d.bookBand.cta.label}
          </a>
        </div>
      </Section>

      {/* ── Types ──────────────────────────────────────────────────────── */}
      <Section className="py-16" bg={MINT_SOFT}>
        <div className="mx-auto max-w-2xl text-center">
          <Heading className="text-[26px] sm:text-[30px]">{d.types.title}</Heading>
          <Lede className="mt-3">{d.types.subtitle}</Lede>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {d.types.items.map((it, i) => <SoftCard key={i} {...it} />)}
        </div>
      </Section>

      {/* ── How therapy helps ──────────────────────────────────────────── */}
      <Section className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Heading className="text-[26px] sm:text-[30px]">{d.therapyHelps.title}</Heading>
          <Lede className="mt-3">{d.therapyHelps.subtitle}</Lede>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {d.therapyHelps.items.map((it, i) => <SoftCard key={i} {...it} />)}
        </div>
      </Section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <Section className="py-14">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-neutral-100 p-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="max-w-2xl text-[15px] leading-relaxed">{d.finalCta.text}</p>
          <PrimaryButton href={d.finalCta.cta.href}>{d.finalCta.cta.label}</PrimaryButton>
        </div>
      </Section>

      {/* ── FAQs ───────────────────────────────────────────────────────── */}
      <Section className="pb-20 pt-4">
        <Heading className="text-center text-[26px] sm:text-[30px]">Frequently asked questions</Heading>
        <div className="mx-auto mt-8 max-w-3xl divide-y divide-neutral-100 border-y border-neutral-100">
          {d.faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? -1 : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-[15px] font-medium">{f.q}</span>
                  <span aria-hidden className="text-lg leading-none" style={{ color: BRAND }}>
                    {open ? '−' : '+'}
                  </span>
                </button>
                {open && <p className="pb-5 text-sm leading-relaxed text-neutral-600">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </Section>
    </main>
  );
}
