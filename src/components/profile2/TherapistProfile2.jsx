'use client';

/**
 * Therapist profile — Koott 2.0.
 *
 * Built to the Figma file "Koott 2.0" (EzLwBjoYNqTa9RMEmOfyQO), section Therapist Profile,
 * screen "Profile v3 · Full page (scroll)" (7858:80652), drawn at 402 px. Every size,
 * space, weight and colour is taken from that screen (see profile2.css.js).
 *
 *   hero     back / share, the ringed photo, name, role, registration pill
 *   sheet    Overview and Media tabs over a white sheet with a drag handle
 *   overview intro video, three stats, what they help with, approaches, qualifications,
 *            how you can meet, about, their videos, their FAQ
 *   media    articles / videos / podcasts
 *   book bar fixed at the bottom: the next free slot and Book a session
 *
 * The design shows more than the therapist record holds. Rather than invent content, a
 * block is drawn only when there is something real to put in it — so the registration
 * pill, the intro video, "Approaches I use", the video rail and the media tab stay hidden
 * until those fields exist. What the record does have (experience, languages, price,
 * area_of_expertise, the colleges, session modes, description, three FAQs) is live.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PROFILE2_CSS } from './profile2.css';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/* ── reading the record ──────────────────────────────────────────────────── */

const nameOf = (t) => t?.name || `${t?.first_name || ''} ${t?.last_name || ''}`.trim();
const firstNameOf = (t) => (nameOf(t).split(/\s+/)[0] || 'them');
const photoOf = (t) => t?.profile_picture_url || t?.cover_image_url || '';
const initials = (n) => (n || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '·';

const asList = (v) => {
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (typeof v === 'string' && v.trim()) {
    try { const j = JSON.parse(v); if (Array.isArray(j)) return j.filter(Boolean).map(String); } catch { /* plain text */ }
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const MODE_LABEL = { online: 'Video call', video: 'Video call', audio: 'Audio call', phone: 'Audio call', chat: 'Chat', in_person: 'In person', offline: 'In person' };

/** "Today, 8:25 PM" for the bar at the bottom. */
function slotLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const key = (x) => x.toLocaleDateString('en-CA');
  if (key(d) === key(new Date())) return `Today, ${time}`;
  if (key(d) === key(new Date(Date.now() + 864e5))) return `Tomorrow, ${time}`;
  return `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}, ${time}`;
}

/* ── icons ───────────────────────────────────────────────────────────────── */

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const S16 = { ...S, strokeWidth: 1.5 };
const I = {
  back: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 15 7.5 10l5-5" {...S} /></svg>,
  share: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.6 11.2a2.6 2.6 0 1 1 0-2.4m0 2.4 6.8 3.4m-6.8-5.8 6.8-3.4m0 0a2.6 2.6 0 1 0 4.6-2.4 2.6 2.6 0 0 0-4.6 2.4Zm0 9.2a2.6 2.6 0 1 0 4.6 2.4 2.6 2.6 0 0 0-4.6-2.4Z" {...S} strokeWidth={1.6} /></svg>,
  verified: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1 9.9 2.6l2.4-.2.6 2.3 2 1.4-1 2.2 1 2.2-2 1.4-.6 2.3-2.4-.2L8 15l-1.9-1.6-2.4.2-.6-2.3-2-1.4 1-2.2-1-2.2 2-1.4.6-2.3 2.4.2L8 1Z" fill="url(#p2g)" /><path d="m5.6 8.1 1.7 1.7 3.2-3.3" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><defs><linearGradient id="p2g" x1="0" y1="0" x2="16" y2="16"><stop stopColor="#5DC189" /><stop offset="1" stopColor="#39AC71" /></linearGradient></defs></svg>,
  play: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.5 4.3v11.4l9.2-5.7-9.2-5.7Z" fill="currentColor" /></svg>,
  arrow: <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 7h8M7.6 3.4 11.2 7l-3.6 3.6" {...S16} /></svg>,
  chevDown: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" {...S} strokeWidth={1.6} /></svg>,
  spark: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5v15M2.5 10h15M4.7 4.7l10.6 10.6M15.3 4.7 4.7 15.3" {...S} strokeWidth={1.6} /></svg>,
  cap: <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2.5 7.5 10 4.2l7.5 3.3L10 10.8 2.5 7.5Z" {...S} strokeWidth={1.6} /><path d="M5.8 9v4.2c0 1.2 1.9 2.1 4.2 2.1s4.2-.9 4.2-2.1V9" {...S} strokeWidth={1.6} /></svg>,
  phone: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.3 2.3H3.2c-.6 0-1 .5-1 1.1a10.2 10.2 0 0 0 9.4 9.4c.6 0 1.1-.4 1.1-1v-2.1l-2.4-.8-1.2 1.2a7.7 7.7 0 0 1-3.2-3.2l1.2-1.2-.8-2.4Z" {...S16} /></svg>,
  video: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M14.7 5.3 11.3 8l3.4 2.7V5.3Z" {...S16} /><rect x="1.3" y="4" width="10" height="8" rx="2" {...S16} /></svg>,
  chat: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M14 7.7a5.6 5.6 0 0 1-6 5.6L4 14.7l.7-2.7A5.6 5.6 0 1 1 14 7.7Z" {...S16} /></svg>,
  pin: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.3 6.7c0 3.7-5.3 7.3-5.3 7.3s-5.3-3.6-5.3-7.3a5.3 5.3 0 1 1 10.6 0Z" {...S16} /><circle cx="8" cy="6.7" r="1.7" {...S16} /></svg>,
};
const MODE_ICON = { 'Video call': I.video, 'Audio call': I.phone, Chat: I.chat, 'In person': I.pin };

/* ── the page ────────────────────────────────────────────────────────────── */

export default function TherapistProfile2({ therapist, bookHref }) {
  const router = useRouter();
  const t = therapist || {};
  const [details, setDetails] = useState(null);
  const [next, setNext] = useState(null);     // { at, slots }
  const [tab, setTab] = useState('about');
  const [openFaq, setOpenFaq] = useState(0);
  const [bioOpen, setBioOpen] = useState(false);
  const [allChips, setAllChips] = useState(false);
  const [shared, setShared] = useState(false);

  const d = useMemo(() => ({ ...t, ...(details || {}) }), [t, details]);
  const name = nameOf(d);
  const first = firstNameOf(d);

  useEffect(() => {
    if (!t?.id) return undefined;
    let live = true;
    (async () => {
      const [det, order] = await Promise.all([
        fetch(`${API}/public/psychologists/${t.id}/details`).then((r) => r.json()).catch(() => null),
        fetch(`${API}/public/psychologists/order?list=default`).then((r) => r.json()).catch(() => null),
      ]);
      if (!live) return;
      setDetails(det?.data?.psychologist || null);
      const row = (order?.data?.order || order?.order || []).find?.((x) => x.id === t.id || x.psychologist_id === t.id);
      if (row) setNext({ at: row.nextAvailableAt || row.next_available_at || null, slots: Number(row.slotsOnDay || row.slots_on_day || 0) });
    })();
    return () => { live = false; };
  }, [t?.id]);

  const share = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 1800); }
    } catch { /* the client closed the sheet */ }
  }, [name]);

  /* What the record actually holds. Anything empty hides its block rather than
     showing the design's placeholder copy. */
  const expertise = asList(d.area_of_expertise);
  const chips = allChips ? expertise : expertise.slice(0, 5);
  const languages = asList(d.languages_json);
  const years = Number(d.experience_years) || 0;
  const price = Number(d.price) || 0;
  const modes = [...new Set(asList(d.session_modes).map((m) => MODE_LABEL[String(m).toLowerCase()] || m))];
  const quals = [
    ['Doctorate', d.phd_college], ['M.Phil', d.mphil_college],
    ['Post-graduation', d.pg_college], ['Graduation', d.ug_college],
  ].filter(([, v]) => v && String(v).trim());
  const faqs = [1, 2, 3]
    .map((n) => ({ q: d[`faq_question_${n}`], a: d[`faq_answer_${n}`] }))
    .filter((f) => f.q && String(f.q).trim());
  const bio = String(d.description || '').trim();
  const reg = d.registration_number || d.reg_no || '';
  const href = bookHref || `/book/${t.slug || ''}`;

  return (
    <div className="tpf">
      <style dangerouslySetInnerHTML={{ __html: PROFILE2_CSS }} />

      <div className="tpf-wrap">
        <header className="tpf-hero">
          <div className="tpf-head">
            <button type="button" className="tpf-round" onClick={() => router.back()} aria-label="Go back">{I.back}</button>
            <button type="button" className="tpf-round" onClick={share} aria-label={shared ? 'Link copied' : 'Share this profile'}>{I.share}</button>
          </div>
          <div className="tpf-avatar-wrap">
            <div className="tpf-avatar">
              {photoOf(d)
                ? <img src={photoOf(d)} alt={name} />
                : <span className="tpf-initials">{initials(name)}</span>}
            </div>
          </div>
          <div className="tpf-intro">
            <h1 className="tpf-name">{name}</h1>
            {d.designation && <span className="tpf-role">{d.designation}</span>}
            {reg && <span className="tpf-reg">{I.verified}Reg. No: {reg}</span>}
          </div>
        </header>

        <div className="tpf-sheet">
          <div className="tpf-handle"><span /></div>

          <div className="tpf-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'about'}
              className={`tpf-tab${tab === 'about' ? ' is-on' : ''}`} onClick={() => setTab('about')}>
              <span>Overview</span><i />
            </button>
            <button type="button" role="tab" aria-selected={tab === 'media'}
              className={`tpf-tab${tab === 'media' ? ' is-on' : ''}`} onClick={() => setTab('media')}>
              <span>Media</span><i />
            </button>
          </div>

          {tab === 'about' ? (
            <div className="tpf-about">
              {/* intro video + the three numbers */}
              <div className="tpf-top">
                {d.intro_video_url && (
                  <a className="tpf-meet" href={d.intro_video_url} target="_blank" rel="noopener noreferrer">
                    <img className="tpf-meet-thumb" src={d.intro_video_thumb || photoOf(d)} alt="" />
                    <span className="tpf-meet-text">
                      <span className="tpf-meet-title">Meet {first}</span>
                      <span className="tpf-meet-sub">A short hello before you book</span>
                    </span>
                    <span className="tpf-play">{I.play}</span>
                  </a>
                )}
                {(years > 0 || languages.length > 0 || price > 0) && (
                  <div className="tpf-stats">
                    {years > 0 && (
                      <div className="tpf-stat"><b>{years}+ yrs</b><span>Experience</span></div>
                    )}
                    {years > 0 && languages.length > 0 && <span className="tpf-stat-div" />}
                    {languages.length > 0 && (
                      <div className="tpf-stat"><b>{languages[0]}</b><span>{languages.slice(1).join(', ') || 'Spoken'}</span></div>
                    )}
                    {languages.length > 0 && price > 0 && <span className="tpf-stat-div" />}
                    {price > 0 && (
                      <div className="tpf-stat"><b>₹{price.toLocaleString('en-IN')}</b><span>Starts from</span></div>
                    )}
                  </div>
                )}
              </div>

              {chips.length > 0 && (
                <section className="tpf-sec" style={{ gap: 16 }}>
                  <div className="tpf-sec-head"><h2 className="tpf-h2">Can help you with</h2></div>
                  <div className="tpf-chips">
                    {chips.map((c) => <span key={c} className="tpf-chip">{c}{I.arrow}</span>)}
                    {!allChips && expertise.length > 5 && (
                      <button type="button" className="tpf-chip is-more" onClick={() => setAllChips(true)}>
                        +{expertise.length - 5} more
                      </button>
                    )}
                  </div>
                </section>
              )}

              {quals.length > 0 && (
                <section className="tpf-sec" style={{ gap: 8 }}>
                  <div className="tpf-sec-head"><h2 className="tpf-h2">Qualifications</h2></div>
                  <div className="tpf-rows">
                    {quals.map(([label, place]) => (
                      <div className="tpf-row is-qual" key={label}>
                        <span className="tpf-row-ic">{I.cap}</span>
                        <span className="tpf-row-text">
                          <span className="tpf-row-title">{label}</span>
                          <span className="tpf-row-sub">{place}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {modes.length > 0 && (
                <section className="tpf-sec" style={{ gap: 16 }}>
                  <div className="tpf-sec-head"><h2 className="tpf-h2">How you can meet</h2></div>
                  <div className="tpf-modes">
                    {modes.map((m) => <span className="tpf-mode" key={m}>{MODE_ICON[m] || I.video}{m}</span>)}
                  </div>
                </section>
              )}

              {bio && (
                <section className="tpf-sec" style={{ gap: 12 }}>
                  <div className="tpf-sec-head"><h2 className="tpf-h2">About {first}</h2></div>
                  <div className="tpf-bio">
                    <p className={bioOpen ? '' : 'is-clamped'}>{bio}</p>
                    {bio.length > 150 && (
                      <button type="button" onClick={() => setBioOpen((v) => !v)}>{bioOpen ? 'Read less' : 'Read more'}</button>
                    )}
                  </div>
                </section>
              )}

              {faqs.length > 0 && (
                <section className="tpf-sec" style={{ gap: 4 }}>
                  <div className="tpf-sec-head"><h2 className="tpf-h2">You might be wondering</h2></div>
                  <div className="tpf-faq">
                    {faqs.map((f, i) => (
                      <div className={`tpf-faq-row${openFaq === i ? ' is-open' : ''}`} key={f.q}>
                        <button type="button" className="tpf-q" aria-expanded={openFaq === i}
                          onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                          <span>{f.q}</span>{I.chevDown}
                        </button>
                        {openFaq === i && f.a && <p className="tpf-a">{f.a}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <>
              <div className="tpf-break" />
              <div className="tpf-media">
                <div className="tpf-sec-head"><h2 className="tpf-h2">Writing and media</h2></div>
                <div className="tpf-panel">
                  <p className="tpf-mmeta">{first} has not published anything here yet.</p>
                </div>
              </div>
            </>
          )}

          <div className="tpf-spacer" />
        </div>
      </div>

      <div className="tpf-bookbar">
        <div className="tpf-bookbar-in">
          <div className="tpf-next">
            <span className="tpf-next-cap">Next available</span>
            <span className="tpf-next-line">
              <span className="tpf-next-slot">{slotLabel(next?.at) || 'Pick a time'}</span>
              {next?.slots > 1 && <span className="tpf-next-pill">+{next.slots - 1} slots</span>}
            </span>
          </div>
          <button type="button" className="tpf-book" onClick={() => router.push(href)}>Book a session</button>
        </div>
      </div>
    </div>
  );
}
