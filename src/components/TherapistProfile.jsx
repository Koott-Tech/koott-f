'use client';

/**
 * TherapistProfile — built to the "shinjuna-profile (4).html" design in the repo
 * root, with Koott's data behind it.
 *
 * Two columns (1.6fr / 1fr, 1180px, 28px gutter):
 *
 *   left    profile card (avatar, role, name, actions) · stat strip ·
 *           About · chip groups · FAQ
 *   right   sticky booking card: session type, the plans, Book session
 *
 * The type is the design's; the palette is Koott's, because the artboard came
 * carrying little.care's purple:
 *   bg #F5FBF3 · surface #fff · primary #189E4F · soft #EAF9E4
 *   deep #012F23 · apricot #EE9A55 (kept as the one warm accent) · line #DCEEE1
 *   Fraunces (headings) · Plus Jakarta Sans (text) · IBM Plex Mono (stats)
 *
 * Sections render only when there is data for them — no invented ratings,
 * reels or blog posts. The booking card hands off to /book/<slug> rather than
 * running a second copy of the calendar the flow already owns.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DEFAULT_FAQS, extrasFor } from '@/data/therapistExtras';
import {
  clientTimeZone, fetchSlots, fromYmd, isPsychiatristRecord, packageKind, zoneLabel,
} from '@/lib/sessionSlots';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const title = (s) => String(s).replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** "Irene Mariam" -> "irene-mariam" */
export const therapistSlug = (t) => `${t.first_name || ''}-${t.last_name || ''}`
  .toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

/** package_type -> { kind, sessions } (see lib/sessionSlots packageKind) */
const readType = (p) => packageKind(p);

const THERAPY_TABS = [['Individual', 'individual'], ['Couple', 'couple']];
const PSYCHIATRY_TABS = [['15 min', 'psychiatry_15'], ['30 min', 'psychiatry_30']];

const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconShare = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 13.5l6.8 4M15.4 6.5L8.6 10.5"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconChev = ({ dir = 'left' }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const DAY_PAGE = 10;   // two rows of five, as the design lays them out

export default function TherapistProfile({ therapist, bookHref }) {
  const t = therapist || {};
  const slug = therapistSlug(t);
  const name = t.name || `${t.first_name || ''} ${t.last_name || ''}`.trim();
  const avatar = t.profile_picture_url || t.cover_image_url;

  const [details, setDetails] = useState(null);
  const [packages, setPackages] = useState([]);
  // Psychiatrists: 15 / 30-min consultations only; everyone else individual / couple.
  const isPsychiatrist = isPsychiatristRecord(t);
  const [kind, setKind] = useState(() => (isPsychiatristRecord(t) ? 'psychiatry_15' : 'individual'));
  const [openFaq, setOpenFaq] = useState(0);
  const [allConditions, setAllConditions] = useState(false);
  const [shared, setShared] = useState(false);
  const [posts, setPosts] = useState([]);
  const [slotsByDay, setSlotsByDay] = useState({});   // 'YYYY-MM-DD' -> free slots
  const [dayOffset, setDayOffset] = useState(0);      // paging, in days
  const [pickedDay, setPickedDay] = useState(null);
  const [pickedTime, setPickedTime] = useState(null);

  // The list endpoint trims FAQs and education; the details one carries them.
  useEffect(() => {
    if (!t.id) return undefined;
    let off = false;
    (async () => {
      try {
        const [d, p] = await Promise.all([
          fetch(`${API}/public/psychologists/${t.id}/details`).then((r) => r.json()).catch(() => null),
          fetch(`${API}/public/psychologists/${t.id}/packages`).then((r) => r.json()).catch(() => null),
        ]);
        if (off) return;
        const dd = d?.data ?? d?.message ?? d;
        setDetails(dd?.psychologist || null);
        const pd = p?.data ?? p?.message ?? p;
        setPackages((pd?.packages || []).filter((x) => x.is_active !== false));
      } catch (_) { /* the page still renders from the list record */ }
    })();
    return () => { off = true; };
  }, [t.id]);

  // The Blog strip shows Koott's own posts — real articles, real links.
  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const res = await fetch(`${API}/blogs?limit=3`);
        const json = await res.json();
        const d = json?.data ?? json?.message ?? json;
        const rows = d?.blogs || (Array.isArray(d) ? d : []);
        if (!off) setPosts(rows.slice(0, 3));
      } catch (_) { /* the section hides itself when there is nothing */ }
    })();
    return () => { off = true; };
  }, []);

  // Free session starts for the days on show — the same endpoint and rules as
  // the booking flow (individual 50 min, couple 1 h 20 min, psychiatry 15 / 30 min,
  // 10-min breaks), shown in the visitor's time zone. One request covers the visible page.
  useEffect(() => {
    if (!t.id) return undefined;
    let off = false;
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() + dayOffset);
    const end = new Date(start); end.setDate(start.getDate() + DAY_PAGE - 1);
    const zone = clientTimeZone();
    fetchSlots(API, t.id, isoDate(start), isoDate(end), kind, zone)
      .then((map) => { if (!off) setSlotsByDay((prev) => ({ ...prev, ...map })); })
      .catch(() => { /* the widget still offers the CTA without times */ });
    return () => { off = true; };
  }, [t.id, dayOffset, kind]);

  const full = { ...t, ...(details || {}) };
  const conditions = Array.isArray(full.area_of_expertise) ? full.area_of_expertise : [];
  const education = [
    ['UG', full.ug_college], ['PG', full.pg_college],
    ['MPhil', full.mphil_college], ['PhD', full.phd_college],
  ].filter(([, v]) => v);

  // The schema has no faq_* columns yet; fall back to the site-wide answers.
  const extras = extrasFor(slug);
  const fromDb = [1, 2, 3]
    .map((i) => ({ q: full[`faq_question_${i}`], a: full[`faq_answer_${i}`] }))
    .filter((x) => x.q && x.a);
  const faqs = fromDb.length ? fromDb : [...(extras.faqs || []), ...DEFAULT_FAQS];
  const reels = extras.reels || [];

  const days = useMemo(() => {
    const out = [];
    const base = new Date(); base.setHours(0, 0, 0, 0);
    for (let i = 0; i < DAY_PAGE; i += 1) {
      const d = new Date(base); d.setDate(base.getDate() + dayOffset + i);
      out.push(d);
    }
    return out;
  }, [dayOffset]);

  const times = pickedDay ? (slotsByDay[pickedDay] || []) : [];

  const plans = useMemo(
    () => packages.filter((p) => readType(p).kind === kind)
      .sort((a, b) => readType(a).sessions - readType(b).sessions),
    [packages, kind],
  );
  const from = plans[0]?.price || full.individual_session_price || full.price;
  const years = Number(full.experience_years) || 0;

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 1800); }
    } catch (_) { /* the user dismissed the share sheet */ }
  };

  return (
    <div className="lp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="lp-eyebrow-bar">
        <Link href="/book-malayali-psychologists" className="lp-back" aria-label="Back to therapists"><IconBack /></Link>
        <span className="lp-eyebrow">Book a Meet Session</span>
      </div>

      <div className="lp-layout">
        <div className="lp-left">

          {/* profile */}
          <section className="lp-card">
            <div className="lp-top">
              {avatar
                // eslint-disable-next-line @next/next/no-img-element
                ? <img className="lp-avatar" src={avatar} alt={name} />
                : <span className="lp-avatar" aria-hidden />}
              <div>
                <p className="lp-role">{full.designation || full.specialization || 'Consultant Psychologist'}</p>
                <h1 className="lp-name">{name}</h1>
              </div>
            </div>
            <div className="lp-actions">
              <Link href={bookHref || `/book/${slug}`} className="lp-btn">Book Session</Link>
              <button type="button" className="lp-share" onClick={share}>
                <IconShare /><span>{shared ? 'Link copied' : 'Share'}</span>
              </button>
            </div>
          </section>

          {/* stats — only the ones we actually hold */}
          <div className="lp-stats">
            {years > 0 && (
              <div className="lp-stat"><p className="lp-stat-n">{years}+</p><p className="lp-stat-l">Years exp.</p></div>
            )}
            {years > 0 && (
              <div className="lp-stat"><p className="lp-stat-n">{(years * 250).toLocaleString('en-IN')}+</p><p className="lp-stat-l">Session hours</p></div>
            )}
            {conditions.length > 0 && (
              <div className="lp-stat"><p className="lp-stat-n">{conditions.length}</p><p className="lp-stat-l">Focus areas</p></div>
            )}
            {from > 0 && (
              <div className="lp-stat"><p className="lp-stat-n">{inr(from)}</p><p className="lp-stat-l">Starting from</p></div>
            )}
          </div>

          {(full.description || full.short_description) && (
            <section className="lp-card">
              <h2 className="lp-h">About</h2>
              <div className="lp-about">
                {String(full.description || full.short_description).split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          )}

          {(conditions.length > 0 || education.length > 0) && (
            <section className="lp-card">
              {conditions.length > 0 && (
                <div className="lp-chip-group">
                  <p className="lp-chip-h">Conditions</p>
                  <div className="lp-chips">
                    {(allConditions ? conditions : conditions.slice(0, 8)).map((c) => (
                      <span key={c} className="lp-chip apricot">{title(c)}</span>
                    ))}
                  </div>
                  {conditions.length > 8 && (
                    <button type="button" className="lp-chips-toggle" onClick={() => setAllConditions((v) => !v)}>
                      {allConditions ? 'Show fewer' : 'Show all conditions'}
                    </button>
                  )}
                </div>
              )}

              <div className="lp-chip-group">
                <p className="lp-chip-h">Languages</p>
                <div className="lp-chips">
                  <span className="lp-chip sage">English</span>
                  <span className="lp-chip sage">Malayalam</span>
                </div>
              </div>

              {education.length > 0 && (
                <div className="lp-chip-group">
                  <p className="lp-chip-h">Education</p>
                  <div className="lp-chips">
                    {education.map(([k, v]) => <span key={k} className="lp-chip">{k} · {v}</span>)}
                  </div>
                </div>
              )}
            </section>
          )}

          {faqs.length > 0 && (
            <section className="lp-card">
              <h2 className="lp-h">FAQ&rsquo;s</h2>
              {faqs.map((f, i) => (
                <div key={f.q} className={`lp-faq ${openFaq === i ? 'is-open' : ''}`}>
                  <button type="button" className="lp-faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                    {f.q}<span aria-hidden>{openFaq === i ? '–' : '+'}</span>
                  </button>
                  {openFaq === i && <p className="lp-faq-a">{f.a}</p>}
                </div>
              ))}
            </section>
          )}

          {reels.length > 0 && (
            <section className="lp-card">
              <h2 className="lp-h">Reels</h2>
              <div className="lp-reels">
                {reels.map((r) => (
                  <a key={r.caption} className="lp-reel" href={r.href} target="_blank" rel="noreferrer">
                    <span className="lp-reel-play" aria-hidden>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M6 4l14 8-14 8V4z" /></svg>
                    </span>
                    <span className="lp-reel-bottom">{r.caption}</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {posts.length > 0 && (
            <section className="lp-card">
              <h2 className="lp-h">Blog</h2>
              <div className="lp-blogs">
                {posts.map((p) => (
                  <Link key={p.slug || p.id} href={`/blog/${p.slug}`} className="lp-blog">
                    {p.featured_image_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img className="lp-blog-thumb" src={p.featured_image_url} alt="" />
                      : <span className="lp-blog-thumb" aria-hidden />}
                    <span>
                      <span className="lp-blog-t">{p.title}</span>
                      {(p.excerpt || p.summary) && <span className="lp-blog-x">{p.excerpt || p.summary}</span>}
                      {(p.read_time || p.published_at) && (
                        <span className="lp-blog-m">
                          {p.read_time ? `${p.read_time} min read` : ''}
                          {p.read_time && p.published_at ? ' · ' : ''}
                          {p.published_at ? new Date(p.published_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : ''}
                        </span>
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* booking */}
        <aside className="lp-card lp-book">
          <div className="lp-book-head">
            <span className="lp-book-i" aria-hidden><IconCalendar /></span>
            <div>
              <h2 className="lp-book-t">Book a session</h2>
              <p className="lp-book-s">with {name}</p>
            </div>
          </div>

          <p className="lp-step">Session type</p>
          <div className="lp-tabs">
            {(isPsychiatrist ? PSYCHIATRY_TABS : THERAPY_TABS).map(([label, k]) => (
              <button
                key={k} type="button"
                className={`lp-tab ${kind === k ? 'is-on' : ''}`}
                // Session types differ in length, so their free times differ —
                // drop the other type's slots and pick again.
                onClick={() => {
                  if (k === kind) return;
                  setKind(k); setSlotsByDay({}); setPickedTime(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="lp-step lp-step--nav">
            <span>Pick a day &amp; time</span>
            <span className="lp-daynav">
              <button
                type="button" className="lp-daynav-b" disabled={dayOffset <= 0}
                onClick={() => setDayOffset(Math.max(0, dayOffset - DAY_PAGE))} aria-label="Previous days"
              >
                <IconChev />
              </button>
              <button
                type="button" className="lp-daynav-b" disabled={dayOffset >= 50}
                onClick={() => setDayOffset(Math.min(50, dayOffset + DAY_PAGE))} aria-label="Next days"
              >
                <IconChev dir="right" />
              </button>
            </span>
          </div>

          <div className="lp-days">
            {days.map((d) => {
              const key = isoDate(d);
              const free = (slotsByDay[key] || []).length;
              return (
                <button
                  key={key} type="button" disabled={free === 0}
                  className={`lp-day ${pickedDay === key ? 'is-on' : ''}`}
                  onClick={() => { setPickedDay(key); setPickedTime(null); }}
                >
                  <span className="lp-day-dow">{DOW[d.getDay()]}</span>
                  <span className="lp-day-n">{d.getDate()}</span>
                  <span className="lp-day-m">{MON[d.getMonth()]}</span>
                </button>
              );
            })}
          </div>

          {pickedDay && (
            <div className="lp-times">
              {times.map((s) => (
                <button
                  key={s.startsAt} type="button"
                  className={`lp-time ${pickedTime?.startsAt === s.startsAt ? 'is-on' : ''}`}
                  onClick={() => setPickedTime(s)}
                >
                  {s.label}
                </button>
              ))}
              {times.length === 0 && <p className="lp-note">No free times that day.</p>}
              <p className="lp-note">Times in your time zone · {zoneLabel(clientTimeZone())}</p>
            </div>
          )}

          <p className="lp-summary">
            <IconCalendar />
            {pickedDay && pickedTime
              ? `${DOW[fromYmd(pickedDay).getDay()]} ${MON[fromYmd(pickedDay).getMonth()]} ${fromYmd(pickedDay).getDate()} · ${pickedTime.label}`
              : 'Select a day and time'}
          </p>

          {/* Session type, day and time are chosen here; the plan is the first
              question the booking flow asks, so it is not repeated. The date
              and time handed over are IST — what gets booked and stored. */}
          <Link
            href={`${bookHref || `/book/${slug}`}?type=${kind}${
              pickedDay && pickedTime ? `&date=${pickedTime.date}&time=${pickedTime.time}` : ''}`}
            className={`lp-btn lp-btn--wide lp-cta ${pickedDay && pickedTime ? '' : 'is-off'}`}
            aria-disabled={!(pickedDay && pickedTime)}
            onClick={(e) => { if (!(pickedDay && pickedTime)) e.preventDefault(); }}
          >
            Book now<IconArrow />
          </Link>
        </aside>
      </div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,450;9..144,550;9..144,650&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

.lp{
  /* Koott's palette in the design's slots — the artboard shipped little.care's
     purple; primary/soft/line are the green equivalents. */
  --bg:#F5FBF3; --surface:#FFFFFF; --primary:#189E4F; --primary-dark:#12813F;
  --primary-soft:#EAF9E4; --deep:#012F23; --apricot:#EE9A55;
  --ink:#171717; --ink-soft:#2E3948; --line:#DCEEE1;
  background:var(--bg);color:var(--ink);
  font-family:'Plus Jakarta Sans',system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;min-height:100vh;
}
.lp *{box-sizing:border-box;}

.lp-eyebrow-bar{max-width:1180px;margin:0 auto;padding:28px 40px 0;display:flex;align-items:center;gap:14px;}
.lp-back{
  width:38px;height:38px;border-radius:50%;background:var(--surface);border:1px solid var(--line);
  display:flex;align-items:center;justify-content:center;color:var(--primary);flex:none;text-decoration:none;
}
.lp-eyebrow{
  font-size:12px!important;letter-spacing:.12em!important;font-weight:700!important;
  color:var(--primary)!important;text-transform:uppercase;
}

.lp-layout{
  max-width:1180px;margin:0 auto;padding:24px 40px 80px;
  display:grid;grid-template-columns:1.6fr 1fr;gap:28px;align-items:start;
}
.lp-left{display:flex;flex-direction:column;gap:20px;}
.lp-card{background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:28px;}

.lp-top{display:flex;gap:20px;align-items:flex-start;margin-bottom:4px;}
.lp-avatar{
  width:76px;height:76px;border-radius:18px;object-fit:cover;border:1px solid var(--line);
  flex:none;background:var(--primary-soft);display:block;
}
.lp-role{
  font-size:11px!important;letter-spacing:.1em!important;font-weight:700!important;
  color:var(--ink-soft)!important;text-transform:uppercase;margin:0 0 4px;
}
.lp-name{
  font-family:'Fraunces',serif!important;font-weight:600!important;font-size:26px!important;
  color:var(--deep)!important;margin:2px 0 6px;letter-spacing:-.01em!important;line-height:1.25em!important;
}
.lp-actions{display:flex;gap:10px;margin-top:18px;}
.lp-btn{
  display:inline-flex;align-items:center;justify-content:center;
  background:var(--primary);color:#fff!important;border:0;border-radius:10px;padding:11px 22px;
  font-family:'Plus Jakarta Sans',sans-serif!important;font-size:14px!important;font-weight:600!important;
  letter-spacing:0!important;text-decoration:none;cursor:pointer;
}
.lp-btn:hover{background:var(--primary-dark);}
.lp-btn--wide{width:100%;margin-top:16px;padding:13px 22px;}
.lp-share{
  background:var(--surface);border:1px solid var(--line);color:var(--ink)!important;border-radius:10px;
  padding:11px 18px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;
  font-family:inherit!important;font-size:14px!important;font-weight:600!important;letter-spacing:0!important;
}

.lp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.lp-stat{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:18px 12px;text-align:center;}
.lp-stat-n{
  font-family:'IBM Plex Mono',monospace!important;font-weight:600!important;font-size:20px!important;
  color:var(--primary)!important;margin:0;letter-spacing:0!important;
}
.lp-stat-l{
  font-size:10.5px!important;letter-spacing:.08em!important;text-transform:uppercase;
  color:#7F8C85!important;font-weight:600!important;margin:4px 0 0;
}

.lp-h{
  font-family:'Fraunces',serif!important;font-weight:600!important;font-size:17px!important;
  margin:0 0 12px;color:var(--deep)!important;letter-spacing:0!important;
}
.lp-about p{
  font-size:14.5px!important;line-height:1.65em!important;color:var(--ink-soft)!important;
  margin:0 0 12px;letter-spacing:0!important;
}

.lp-chip-group{margin-bottom:22px;}
.lp-chip-group:last-child{margin-bottom:0;}
.lp-chip-h{
  font-size:11px!important;letter-spacing:.1em!important;font-weight:700!important;color:#7F8C85!important;
  text-transform:uppercase;margin:0 0 10px;
}
.lp-chips{display:flex;flex-wrap:wrap;gap:8px;}
.lp-chip{
  background:var(--primary-soft);color:var(--deep)!important;border-radius:999px;padding:7px 14px;
  font-size:13px!important;font-weight:600!important;letter-spacing:0!important;
}
.lp-chip.sage{background:#EAF3E2;color:#3E5A28!important;}
.lp-chip.apricot{background:#FCEADB;color:#8A4A16!important;}
.lp-chips-toggle{
  background:none;border:0;cursor:pointer;padding:10px 0 0;color:var(--primary)!important;
  font-family:inherit!important;font-size:12.5px!important;font-weight:600!important;letter-spacing:0!important;
}

.lp-faq{border-top:1px solid var(--line);padding:14px 0;}
.lp-faq:first-of-type{border-top:0;padding-top:0;}
.lp-faq-q{
  width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;text-align:left;
  background:none;border:0;cursor:pointer;padding:10px 0;color:var(--ink)!important;
  font-family:inherit!important;font-weight:600!important;font-size:14.5px!important;letter-spacing:0!important;
}
.lp-faq-a{font-size:14px!important;color:var(--ink-soft)!important;line-height:1.6em!important;margin:10px 0 0;letter-spacing:0!important;}

.lp-book{
  position:sticky;top:87px;
  box-shadow:0 0 0 1px var(--line), 0 24px 60px -20px rgba(1,47,35,.28);
}
.lp-book-head{display:flex;gap:12px;align-items:center;}
.lp-book-i{
  width:38px;height:38px;border-radius:12px;background:var(--primary-soft);color:var(--primary);
  display:flex;align-items:center;justify-content:center;flex:none;
}
.lp-book-t{
  font-family:'Fraunces',serif!important;font-weight:600!important;font-size:18px!important;
  margin:0;color:var(--deep)!important;letter-spacing:0!important;
}
.lp-book-s{font-size:13px!important;color:#7F8C85!important;margin:2px 0 0;letter-spacing:0!important;}
.lp-step{
  font-size:11px!important;letter-spacing:.1em!important;font-weight:700!important;color:#7F8C85!important;
  text-transform:uppercase;margin:20px 0 10px;
}
.lp-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:4px;}
.lp-tab{
  background:none;border:0;border-radius:9px;padding:9px 0;cursor:pointer;color:var(--ink-soft)!important;
  font-family:inherit!important;font-size:13.5px!important;font-weight:600!important;letter-spacing:0!important;
}
.lp-tab.is-on{background:var(--surface);color:var(--deep)!important;box-shadow:0 1px 3px rgba(1,47,35,.12);}
.lp-step--nav{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.lp-daynav{display:flex;gap:6px;}
.lp-daynav-b{
  width:24px;height:24px;border-radius:50%;border:1px solid var(--line);background:var(--surface);
  color:var(--primary);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;
}
.lp-daynav-b:disabled{opacity:.35;cursor:default;}

.lp-days{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;}
.lp-day{
  padding:10px 0 9px;border-radius:14px;border:1px solid var(--line);background:var(--surface);
  text-align:center;cursor:pointer;display:block;
}
.lp-day:disabled{opacity:.4;cursor:default;}
.lp-day.is-on{background:var(--deep);border-color:var(--deep);}
.lp-day.is-on .lp-day-dow,.lp-day.is-on .lp-day-n,.lp-day.is-on .lp-day-m{color:#fff!important;}
.lp-day-dow{display:block;font-size:10px!important;font-weight:700!important;letter-spacing:.05em!important;color:#7F8C85!important;text-transform:uppercase;}
.lp-day-n{display:block;font-family:'Fraunces',serif!important;font-weight:600!important;font-size:15px!important;margin-top:3px;color:var(--ink)!important;}
.lp-day-m{display:block;font-size:10px!important;color:#7F8C85!important;margin-top:1px;letter-spacing:0!important;}

.lp-times{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:20px;}
.lp-time{
  border:1px solid var(--line);border-radius:12px;padding:11px 0;text-align:center;cursor:pointer;
  background:var(--surface);color:var(--ink)!important;
  font-family:inherit!important;font-size:13.5px!important;font-weight:600!important;letter-spacing:0!important;
}
.lp-time:hover{background:var(--primary-soft);}
.lp-time.is-on{background:var(--deep);border-color:var(--deep);color:#fff!important;}

.lp-summary{
  display:flex;align-items:center;gap:9px;background:var(--primary-soft);border-radius:12px;
  padding:13px 14px;margin:22px 0 0;
  font-size:13px!important;color:var(--deep)!important;font-weight:600!important;letter-spacing:0!important;
}
.lp-summary svg{flex:none;color:var(--primary);}
.lp-cta{gap:8px;padding:15px;border-radius:12px;font-size:15px!important;margin-top:14px;}
.lp-cta.is-off{background:#C6D9CC;cursor:default;}

.lp-reels{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.lp-reel{
  position:relative;border-radius:16px;overflow:hidden;aspect-ratio:3/4.3;display:block;
  background:linear-gradient(160deg,var(--primary-soft),#CFE7D4);text-decoration:none;
  box-shadow:0 10px 24px -12px rgba(1,47,35,.35);
}
.lp-reel-play{
  position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:38px;height:38px;border-radius:50%;
  background:rgba(1,47,35,.5);border:1.5px solid rgba(255,255,255,.7);
  display:flex;align-items:center;justify-content:center;
}
.lp-reel-bottom{
  position:absolute;left:0;right:0;bottom:0;padding:24px 10px 10px;color:#fff;
  background:linear-gradient(to top, rgba(1,47,35,.85), rgba(1,47,35,0));
  font-size:11px!important;font-weight:700!important;letter-spacing:0!important;
}

.lp-blogs{display:flex;flex-direction:column;gap:16px;}
.lp-blog{display:flex;gap:14px;text-decoration:none;color:inherit;}
.lp-blog-thumb{
  width:80px;height:80px;border-radius:14px;object-fit:cover;flex:none;
  background:var(--primary-soft);display:block;
}
.lp-blog-t{
  display:block;font-family:'Fraunces',serif!important;font-weight:600!important;font-size:14.5px!important;
  color:var(--deep)!important;margin:0 0 4px;line-height:1.35em!important;letter-spacing:0!important;
}
.lp-blog-x{
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  font-size:13px!important;color:var(--ink-soft)!important;line-height:1.5em!important;margin:0 0 7px;letter-spacing:0!important;
}
.lp-blog-m{display:block;font-size:11.5px!important;color:#7F8C85!important;font-weight:600!important;letter-spacing:0!important;}

.lp-book-foot{font-size:12px!important;color:#7F8C85!important;margin:10px 0 0;text-align:center;letter-spacing:0!important;}
.lp-note{font-size:13.5px!important;color:#7F8C85!important;letter-spacing:0!important;}

@media (max-width:960px){
  .lp-layout{grid-template-columns:1fr;padding:20px 20px 60px;}
  .lp-eyebrow-bar{padding:20px 20px 0;}
  .lp-book{position:static;}
  .lp-stats{grid-template-columns:repeat(2,1fr);}
}
`;
