'use client';

/**
 * HomeBody — everything below the hero on koott.in, rebuilt from that page's
 * real DOM geometry rather than its type scale alone.
 *
 * Section structure measured off the live page (980px column):
 *   mission     TWO-COLUMN split — copy left (397 wide, x=45), 397x570 media right (x=625)
 *   actions     rows of overlapping 66px therapist avatars + label + pill CTA
 *   best        centred quicksand 23/700 heading, then a row of 5 accreditation logos
 *   concerns    4 columns x 3 rows (x = 179 / 344 / 509 / 674)
 *   marquee     36 circular 110x110 therapist photos scrolling horizontally
 *   easy+steps  mint #F2FCF7 band, 3 columns with a large emoji per step
 *   service     4 tabs (Therapy/Counselling/Psychiatrist/Couple) over a white
 *               655-wide radius-30 card: title 26/400, duration 16/700,
 *               price work-sans 17/400 #6E3206, CTA right-aligned
 *   reviews     heading 25/700 + two 213x285 review screenshots
 *   faq         six 18/400 rows
 *   blog        two 294-wide cards with a 307-tall image
 *   help        centred, narrow (270), pill CTA
 *
 * The marquee and the action-card avatars are driven by OUR OWN API
 * (/api/public/psychologists), so they carry no Wix dependency. The hero photo,
 * accreditation logos, review screenshots and blog images are still on
 * static.wixstatic.com (an allowed host in next.config.mjs) — open migration
 * task #4 is to move them to our storage and drop that host.
 */

import { useEffect, useMemo, useState } from 'react';
import { publicApi } from '@/lib/backendApi';

const LOGOS = [
  { alt: 'IMA approved', w: 51, h: 53, src: 'https://static.wixstatic.com/media/624142_0a2c3e029a7a4497b4502859ca7e5181~mv2.jpg' },
  { alt: 'NIMHANS approved', w: 51, h: 53, src: 'https://static.wixstatic.com/media/624142_79c12a9afcab4a4ca06a75efcf7079db~mv2.jpg' },
  { alt: 'RCI approved', w: 51, h: 53, src: 'https://static.wixstatic.com/media/624142_ff168ec784804e54ac4e8f7e49f1fd39~mv2.jpg' },
  { alt: 'MCI supported', w: 91, h: 63, src: 'https://static.wixstatic.com/media/624142_60154437564e4f428328b1ae6bc4b799~mv2.jpg' },
  { alt: 'Kerala State approved', w: 62, h: 53, src: 'https://static.wixstatic.com/media/624142_1be8cc5c98644b548570cc474575e38f~mv2.jpg' },
];

const MISSION_MEDIA = 'https://static.wixstatic.com/media/624142_186cb82487bd42c2a48ad90641fabacf~mv2.gif';

const REVIEWS = [
  { alt: 'Review for Aswathy, chief psychologist at Koott', src: 'https://static.wixstatic.com/media/624142_93b55ac793ce4201a2aef766ac47a6f4~mv2.png' },
  { alt: 'Review for Dr. Albin, clinical psychologist at Koott', src: 'https://static.wixstatic.com/media/624142_172eacefcda242f18a19828949935786~mv2.png' },
];

const BLOGS = [
  { title: 'Teen Depression: Signs, Causes, and How Parents Can Help', href: '/blog', img: 'https://static.wixstatic.com/media/624142_51575981577f408091beb9c550244f54~mv2.webp' },
  { title: 'Postpartum Depression: Signs, Causes, Symptoms, and Treatment for New Mothers', href: '/blog', img: 'https://static.wixstatic.com/media/624142_a52077a2920044ff826cf38ecc2a5761~mv2.webp' },
];

/* Live order fills across each row of four, not down the columns. */
const CONCERNS = [
  'Depression', 'Relationship Issues', 'Stress', 'Eating Disorders',
  'Anxiety', 'Mood Disorders', 'Anger Issues', 'ADHD',
  'Trauma', 'Chronic Illness', 'OCD', 'Panic Attacks',
];

const ACTION = {
  title: 'Koott Psychologists',
  sub: '30 Mints, Free Assessment',
  cta: 'Book a Google Meet',
  href: '/assessments',
};

const STEPS = [
  { label: 'Today', mark: '😔', body: 'Feeling a bit blue due to an undiagnosed mental health concern.' },
  { label: 'In few days', mark: '🌱', body: 'Personalized sessions with certified Professionals to address your concerns and make gradual progress.' },
  { label: 'After few sessions', mark: '✨', body: 'Make some big changes, and meet the improved, new you!' },
];

const SERVICES = [
  { tab: 'Therapy', title: 'Therapy', body: 'Psychotherapy involves talking with a trained therapist to address emotional challenges and improve mental well-being through supportive conversation and coping strategies.', duration: 'Duration: 50 minutes', from: 749 },
  { tab: 'Counselling', title: 'Counselling', body: 'Counselling gives you a confidential space to talk through what is weighing on you, with practical guidance you can use between sessions.', duration: 'Duration: 50 minutes', from: 749 },
  { tab: 'Psychiatrist', title: 'Psychiatry', body: 'Medical support and expert guidance from a psychiatrist, alongside therapy where it is needed.', duration: 'Duration: 30 minutes', from: 1699 },
  { tab: 'Couple', title: 'Couple Consultation', body: 'Sessions for couples to rebuild communication, resolve conflict and reconnect with each other.', duration: 'Duration: 60 minutes', from: 1499 },
];

const FAQS = [
  { q: 'Can I have therapy sessions entirely in Malayalam?', a: 'Yes. Every Koott psychologist speaks Malayalam, and you can hold the entire session in the language you are most comfortable in.' },
  { q: 'I often experience anxiety - Am I overthinking things?', a: 'Persistent worry that affects your sleep, focus or daily routine is worth talking through. A therapist can help you tell ordinary stress apart from anxiety that needs support.' },
  { q: 'Is online therapy just as effective as traditional therapy?', a: 'For most common concerns, research finds online sessions as effective as in-person ones — with the added benefit that you can attend from wherever you are.' },
  { q: 'Is online counseling a good option for family issues?', a: 'Yes. Online sessions make it far easier to bring family members together when they live in different cities or countries.' },
  { q: 'Can i book a Malayali Psychologist while am outside the country?', a: 'Yes. A large share of our clients are Malayalees living abroad, and sessions are scheduled to suit your local time.' },
  { q: 'I don’t necessarily feel like I have a mental health condition, but I’m just not feeling happy. Can therapy help me figure out why?', a: 'Absolutely. You do not need a diagnosis to benefit from therapy — many people come simply to understand themselves better.' },
];

export default function HomeBody() {
  const [service, setService] = useState(0);
  const [openFaq, setOpenFaq] = useState(-1);
  const [faces, setFaces] = useState([]);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const res = await publicApi.getPsychologists();
        const rows = res?.data?.psychologists || res?.psychologists
          || (Array.isArray(res?.data) ? res.data : null)
          || (Array.isArray(res) ? res : []);
        if (off) return;
        setFaces(rows.map((p) => ({
          id: p.id,
          name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          img: p.cover_image_url || null,
        })).filter((f) => f.img));
      } catch (err) {
        console.error('[home] therapist faces failed to load:', err);
      }
    })();
    return () => { off = true; };
  }, []);

  const svc = SERVICES[service];
  /* Duplicated so the marquee can loop without a visible seam. When no therapist
     has a cover image yet, fall back to empty tinted circles so the section keeps
     its height and the page rhythm still matches the design. */
  const loop = useMemo(() => {
    if (faces.length) return [...faces, ...faces];
    return Array.from({ length: 24 }, (_, i) => ({ id: `ph-${i}`, name: '', img: null }));
  }, [faces]);

  return (
    <div className="khb">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── Mission: copy left, media right ──────────────────────────── */}
      <section className="khb-sec">
        <div className="khb-in khb-split">
          <div>
            <h2 className="khb-h2">
              Koott is a passion project of Malayali Psychologists and Malayali Counsellors!
            </h2>
            <p className="khb-p">
              At Koott, we’re bringing powerful transformation to individuals in a world where 13% of
              us need psychological help, and 7/10 individuals’ productivity is reduced due to a lack
              of mental health support. Our mission is to help individuals pursue their lives with
              greater clarity, purpose, and passion.
            </p>
            <p className="khb-p">
              Don’t know where to start? Koott is here to help. Book Kerala’s best Malayali
              Psychologist, or book a free consultation with one of our Koott Listeners. We shall
              guide you on how to proceed and heal yourself.
            </p>

            <div className="khb-actions">
              <div className="khb-action">
                <span className="khb-stack" aria-hidden>
                  {(faces.length
                    ? faces.slice(0, 3)
                    : [0, 1, 2].map((n) => ({ id: `ph-${n}`, img: null }))
                  ).map((f) => (
                    f.img
                      ? <img key={f.id} src={f.img} alt="" loading="lazy" />
                      : <span key={f.id} className="khb-stack-ph" />
                  ))}
                </span>
                <span className="khb-action-txt">
                  <span className="khb-action-t">{ACTION.title}</span>
                  <span className="khb-action-s">{ACTION.sub}</span>
                </span>
                <a href={ACTION.href} className="khb-pill">{ACTION.cta}</a>
              </div>
            </div>
          </div>

          <div className="khb-phone">
            <span className="khb-bubble">Get a swift reply<br />on your WhatsApp</span>
            <img className="khb-split-media" src={MISSION_MEDIA}
              alt="Online counselling in Malayalam over WhatsApp" loading="lazy" />
          </div>
        </div>
      </section>

      {/* ── Best therapists · accreditations · concerns ──────────────── */}
      <section className="khb-sec">
        <div className="khb-in">
          <h2 className="khb-h2--quick">
            Kerala’s best Malayali counsellors and therapists are your koott now.
          </h2>
          <p className="khb-p khb-center khb-narrow">
            We pick the best of the best by looking at their experience and qualifications to help
            and understand you better.
          </p>

          <div className="khb-logos">
            {LOGOS.map((l) => (
              <img key={l.alt} src={l.src} alt={l.alt} width={l.w} height={l.h} loading="lazy" />
            ))}
          </div>

          <ul className="khb-concerns">
            {CONCERNS.map((c) => (
              <li key={c} className="khb-concern">
                <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden focusable="false">
                  <rect x="0" y="0" width="20" height="20" rx="5" fill="#2FA84F" />
                  <path d="M5.5 10.4l3 3 6-6.6" fill="none" stroke="#fff" strokeWidth="2.1"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Therapist marquee ────────────────────────────────────────── */}
      <section className="khb-marquee" aria-label="Our therapists">
        <button type="button" className="khb-arrow is-prev" aria-label="Previous"
          onClick={() => document.querySelector('.khb-marquee-track')?.scrollBy({ left: -400, behavior: 'smooth' })}>‹</button>
        <button type="button" className="khb-arrow is-next" aria-label="Next"
          onClick={() => document.querySelector('.khb-marquee-track')?.scrollBy({ left: 400, behavior: 'smooth' })}>›</button>
        <div className="khb-marquee-track">
          {loop.map((f, i) => (
            f.img
              ? <img key={`${f.id}-${i}`} src={f.img} alt={i < faces.length ? f.name : ''}
                  aria-hidden={i >= faces.length} loading="lazy" />
              : <span key={`${f.id}-${i}`} className="khb-face-ph" aria-hidden />
          ))}
        </div>
      </section>

      {/* ── Easy, simple & confidential + steps (mint band) ──────────── */}
      <section className="khb-band">
        <div className="khb-in">
          <h2 className="khb-h2--mid">Koott is Easy, Simple &amp; Confidential</h2>
          <p className="khb-p khb-center khb-wide">
            Koott psychologists offer expert counseling that is effective, budget-friendly, and
            tailored to your specific needs. Enjoy our personalized online counselling from the best
            Malayali psychologists of Kerala, right from your home, with convenient, affordable, and
            accessible mental health support for all Keralites.
          </p>

          <ol className="khb-steps">
            {STEPS.map((t) => (
              <li key={t.label} className="khb-step">
                <span className="khb-step-label">{t.label}</span>
                <span className="khb-step-track" aria-hidden>
                  <span className="khb-step-dot">{t.mark}</span>
                </span>
                <p className="khb-step-body">{t.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Service picker ───────────────────────────────────────────── */}
      <section className="khb-sec">
        <div className="khb-in">
          <div className="khb-tabs" role="tablist" aria-label="Session types">
            {SERVICES.map((s, i) => (
              <button key={s.tab} type="button" role="tab" aria-selected={i === service}
                className={`khb-tab ${i === service ? 'is-on' : ''}`} onClick={() => setService(i)}>
                {s.tab}
              </button>
            ))}
          </div>

          <div className="khb-panel">
            <h3 className="khb-panel-t">{svc.title}</h3>
            <p className="khb-panel-b">{svc.body}</p>
            <p className="khb-panel-d">{svc.duration}</p>
            <div className="khb-panel-foot">
              <p className="khb-panel-price">Book a session, Starting from {svc.from}</p>
              <a href="/book-malayali-psychologists" className="khb-pill is-solid">Book a Session</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Reviews ──────────────────────────────────────────────────── */}
      <section className="khb-sec">
        <div className="khb-in">
          <h2 className="khb-h2--stat">We Helped 🤝 9,000+ People Around The Globe.</h2>
          <p className="khb-kicker">What people say about our therapists.</p>
          <div className="khb-reviews">
            {REVIEWS.map((r) => (
              <img key={r.alt} className="khb-review" src={r.src} alt={r.alt} loading="lazy" />
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="khb-sec">
        <div className="khb-in khb-faqs">
          {FAQS.map((f, i) => (
            <div key={i} className="khb-faq">
              <button type="button" className="khb-faq-q" aria-expanded={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                <span>{f.q}</span>
                <span className="khb-faq-sign" aria-hidden>{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && <p className="khb-faq-a">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Blog ─────────────────────────────────────────────────────── */}
      <section className="khb-sec">
        <div className="khb-in khb-blogs">
          {BLOGS.map((b) => (
            <a key={b.title} href={b.href} className="khb-blog">
              <img src={b.img} alt="" loading="lazy" />
              <span className="khb-blog-t">{b.title}</span>
            </a>
          ))}
        </div>
      </section>

      {/* ── Help someone ─────────────────────────────────────────────── */}
      <section className="khb-sec khb-sec--last">
        <div className="khb-in khb-help">
          <h2 className="khb-help-t">Help Someone.</h2>
          <p className="khb-help-b">
            As somebody’s dear one you are the first one to reach out when they are in pain. You were
            there to feel them and were really worried about them. So, now be there to make sure that
            they get what they actually need — mental health care is the best gift to your loved ones.
          </p>
          <a href="/book-malayali-psychologists" className="khb-pill is-solid">Refer a Friend</a>
        </div>
      </section>
    </div>
  );
}

const CSS = `
.khb{
  --k-ink:#100E0E;
  --k-accent:#3D985C;
  --k-green:#4FAB69;
  --k-green-hover:#025545;
  --k-cta:#493D3D;
  --k-price:#6E3206;
  --k-band:#F2FCF7;
  --k-sans:'Work Sans',ui-sans-serif,system-ui,sans-serif;
  --k-body:'Mulish','Avenir Light','Avenir Next','Avenir',ui-sans-serif,system-ui,sans-serif;
  --k-quick:'Quicksand',ui-sans-serif,system-ui,sans-serif;
  display:block;background:#fff;color:var(--k-ink);font-family:var(--k-body)!important;
}
.khb *{box-sizing:border-box;}
.khb-sec{padding:56px 0;}
.khb-sec--last{padding-bottom:84px;}
.khb-in{max-width:980px;margin:0 auto;padding:0 20px;}
.khb-center{text-align:center!important;}
.khb-narrow{max-width:600px;margin-left:auto;margin-right:auto;}
.khb-wide{max-width:746px;margin-left:auto;margin-right:auto;}

.khb-h2{
  font-family:var(--k-sans)!important;font-size:26px!important;font-weight:400!important;
  line-height:1.4em!important;letter-spacing:-.05em!important;color:var(--k-ink)!important;
  margin:0;max-width:397px;
}
.khb-h2--mid{
  font-family:var(--k-sans)!important;font-size:25px!important;font-weight:400!important;
  line-height:1.4em!important;letter-spacing:-.05em!important;color:var(--k-ink)!important;
  margin:0 auto;text-align:center;max-width:470px;
}
.khb-h2--quick{
  font-family:var(--k-quick)!important;font-size:23px!important;font-weight:700!important;
  line-height:1.35em!important;letter-spacing:-.05em!important;color:var(--k-ink)!important;
  margin:0 auto;text-align:center;max-width:780px;
}
.khb-h2--stat{
  font-family:var(--k-quick)!important;font-size:25px!important;font-weight:700!important;
  line-height:1.3em!important;letter-spacing:0!important;color:var(--k-ink)!important;
  margin:0 auto;text-align:center;max-width:560px;
}
.khb-p{
  font-family:var(--k-body)!important;font-size:15px!important;font-weight:400!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--k-ink)!important;margin:16px 0 0;
}
.khb-kicker{
  font-family:var(--k-body)!important;font-size:13px!important;font-weight:400!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--k-ink)!important;
  margin:10px 0 0;text-align:center;
}

/* mission split --------------------------------------------------------- */
.khb-split{display:grid;grid-template-columns:1fr 397px;gap:60px;align-items:start;}
/* Live drops the copy 111px below the media's top edge. */
.khb-split > div:first-child{padding-top:111px;}
.khb-phone{position:relative;width:397px;}
.khb-split-media{width:397px;height:570px;object-fit:contain;display:block;}
.khb-bubble{
  position:absolute;top:8px;left:-4px;z-index:2;
  background:#fff;border-radius:14px 14px 14px 2px;padding:10px 14px;
  box-shadow:0 4px 14px rgba(16,14,14,.10);
  font-family:var(--k-body)!important;font-size:13px!important;font-weight:400!important;
  line-height:1.35em!important;letter-spacing:0!important;color:var(--k-ink)!important;
}

/* action rows ----------------------------------------------------------- */
.khb-actions{margin:34px 0 0;}
.khb-action{display:flex;align-items:center;gap:14px;}
.khb-stack{display:inline-flex;flex:none;}
.khb-stack img,.khb-stack-ph{
  width:66px;height:66px;border-radius:50%;object-fit:cover;display:block;
  border:2px solid #fff;margin-left:-18px;background:#D9F0DA;
}
.khb-stack img:first-child,.khb-stack-ph:first-child{margin-left:0;}
.khb-action-txt{display:flex;flex-direction:column;flex:none;min-width:190px;}
.khb-action-t{
  font-family:var(--k-body)!important;font-size:15px!important;font-weight:700!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--k-ink)!important;
}
.khb-action-s{
  font-family:var(--k-body)!important;font-size:13px!important;font-weight:400!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--k-ink)!important;
}

/* pills ----------------------------------------------------------------- */
.khb-pill{
  display:inline-flex;align-items:center;justify-content:center;flex:none;
  min-height:38px;padding:0 20px;border-radius:15px;
  border:1px solid rgba(61,152,92,.45);background:#fff;
  font-family:var(--k-body)!important;font-size:12px;font-weight:400;
  letter-spacing:.1em!important;text-transform:uppercase;
  color:var(--k-cta)!important;text-decoration:none;white-space:nowrap;
  transition:background-color .2s ease,border-color .2s ease;
}
.khb-pill:hover{border-color:var(--k-accent);background:#F5FFF6;}
.khb-pill.is-solid{background:var(--k-green);border-color:var(--k-green);color:#fff!important;}
.khb-pill.is-solid:hover{background:var(--k-green-hover);border-color:var(--k-green-hover);}

/* accreditation logos --------------------------------------------------- */
.khb-logos{
  display:flex;align-items:center;justify-content:center;gap:57px;
  flex-wrap:wrap;margin:44px 0 0;
}
.khb-logos img{height:53px;width:auto;object-fit:contain;}

/* concerns: 4 across, filled row-wise ----------------------------------- */
.khb-concerns{
  display:grid;grid-template-columns:repeat(4,165px);justify-content:center;gap:22px 0;
  list-style:none;margin:38px auto 0;padding:0;
}
.khb-concern svg{flex:none;}
.khb-concern{
  display:flex;align-items:center;gap:7px;
  font-family:var(--k-body)!important;font-size:15px!important;font-weight:400!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--k-ink)!important;
}

/* marquee --------------------------------------------------------------- */
.khb-marquee{position:relative;padding:8px 0 40px;max-width:760px;margin:0 auto;}
.khb-marquee-track{
  display:flex;gap:15px;overflow-x:auto;scroll-behavior:smooth;
  padding:4px 46px;scrollbar-width:none;
}
.khb-marquee-track::-webkit-scrollbar{display:none;}
.khb-arrow{
  position:absolute;top:50%;transform:translateY(-50%);z-index:2;
  width:34px;height:34px;border-radius:50%;border:0;background:none;cursor:pointer;
  font-size:30px;line-height:1;color:#8B8B8B;
}
.khb-arrow:hover{color:var(--k-accent);}
.khb-arrow.is-prev{left:2px;}
.khb-arrow.is-next{right:2px;}
.khb-marquee-track img,.khb-face-ph{
  width:78px;height:78px;border-radius:50%;object-fit:cover;flex:none;background:#D9F0DA;
}
.khb-face-ph{display:block;}

/* mint band + steps ----------------------------------------------------- */
.khb-band{background:var(--k-band);padding:64px 0 56px;border-radius:50% 50% 0 0 / 44px 44px 0 0;}
.khb-steps{
  display:grid;grid-template-columns:repeat(3,1fr);gap:40px;
  list-style:none;margin:46px 0 0;padding:0;
}
.khb-step{display:flex;flex-direction:column;}
.khb-step-label{
  font-family:var(--k-body)!important;font-size:17px!important;font-weight:700!important;
  line-height:1.3em!important;letter-spacing:0!important;color:#242323!important;
}
.khb-step-track{
  position:relative;display:block;height:44px;margin:18px 0 26px;
}
.khb-step-track::before{
  content:'';position:absolute;left:22px;right:-40px;top:50%;height:2px;
  background:#3D985C;opacity:.55;
}
.khb-step:last-child .khb-step-track::before{right:0;}
.khb-step-dot{
  position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;
  width:44px;height:44px;border-radius:50%;background:#fff;font-size:20px;line-height:1;
  box-shadow:0 2px 10px rgba(16,14,14,.10);
}
.khb-step-body{
  font-family:var(--k-body)!important;font-size:14px!important;font-weight:400!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--k-ink)!important;margin:0;
}

/* service picker -------------------------------------------------------- */
.khb-tabs{display:flex;flex-wrap:wrap;gap:36px;justify-content:center;}
.khb-tab{
  border:0;background:none;padding:6px 2px;cursor:pointer;
  font-family:var(--k-sans)!important;font-size:19px;font-weight:400;
  letter-spacing:0!important;color:#000;border-bottom:2px solid transparent;
  transition:color .2s ease,border-color .2s ease;
}
.khb-tab:hover{color:var(--k-accent);}
.khb-tab.is-on{color:var(--k-accent);border-bottom-color:var(--k-accent);}
.khb-panel{
  max-width:655px;margin:30px auto 0;background:#fff;border-radius:30px;
  border:1px solid #DFFFD2;padding:30px 34px;
}
.khb-panel-t{
  font-family:var(--k-sans)!important;font-size:26px!important;font-weight:400!important;
  line-height:1.3em!important;letter-spacing:-.05em!important;color:var(--k-ink)!important;margin:0;
}
.khb-panel-b{
  font-family:var(--k-body)!important;font-size:15px!important;font-weight:400!important;
  line-height:1.5em!important;letter-spacing:0!important;color:var(--k-ink)!important;margin:16px 0 0;
}
.khb-panel-d{
  font-family:var(--k-body)!important;font-size:16px!important;font-weight:700!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--k-ink)!important;margin:20px 0 0;
}
.khb-panel-foot{
  display:flex;align-items:center;justify-content:space-between;gap:20px;
  flex-wrap:wrap;margin:18px 0 0;
}
.khb-panel-price{
  font-family:var(--k-sans)!important;font-size:17px!important;font-weight:400!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--k-price)!important;margin:0;
}

/* reviews --------------------------------------------------------------- */
.khb-reviews{display:flex;gap:43px;justify-content:center;flex-wrap:wrap;margin:34px 0 0;}
.khb-review{width:213px;height:285px;object-fit:cover;border-radius:12px;display:block;}

/* faq ------------------------------------------------------------------- */
.khb-faqs{max-width:900px;}
.khb-faq{border-bottom:1px solid rgba(38,34,34,.13);}
.khb-faq-q{
  width:100%;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;
  background:none;border:0;padding:20px 0;cursor:pointer;text-align:left;
  font-family:var(--k-body)!important;font-size:18px!important;font-weight:400!important;
  line-height:1.22em!important;letter-spacing:0!important;color:var(--k-ink)!important;
}
.khb-faq-sign{flex:none;font-size:20px;line-height:1;color:var(--k-accent);}
.khb-faq-a{
  font-family:var(--k-body)!important;font-size:15px!important;font-weight:400!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--k-ink)!important;
  margin:0 0 20px;max-width:64ch;
}

/* blog ------------------------------------------------------------------ */
.khb-blogs{display:grid;grid-template-columns:repeat(2,1fr);gap:24px;max-width:612px;}
.khb-blog{display:block;text-decoration:none;}
.khb-blog img{width:100%;height:307px;object-fit:cover;border-radius:10px;display:block;}
.khb-blog-t{
  display:block;margin-top:16px;
  font-family:var(--k-body)!important;font-size:15px!important;font-weight:400!important;
  line-height:1.45em!important;letter-spacing:0!important;color:var(--k-ink)!important;
}

/* help someone ---------------------------------------------------------- */
.khb-help{text-align:center;}
.khb-help-t{
  font-family:var(--k-sans)!important;font-size:20px!important;font-weight:700!important;
  line-height:1.3em!important;letter-spacing:0!important;color:#292929!important;margin:0;
}
.khb-help-b{
  font-family:var(--k-body)!important;font-size:15px!important;font-weight:500!important;
  line-height:1.6em!important;letter-spacing:0!important;color:#545454!important;
  margin:14px auto 24px;max-width:290px;
}

@media (max-width:900px){
  .khb-split{grid-template-columns:1fr;gap:32px;}
  .khb-split > div:first-child{padding-top:0;}
  .khb-split-media{width:100%;height:auto;}
  .khb-steps{grid-template-columns:1fr;gap:28px;}
  .khb-concerns{grid-template-columns:repeat(2,1fr);}
  .khb-blogs{grid-template-columns:1fr;max-width:none;}
  .khb-logos{gap:28px;}
}
@media (max-width:640px){
  .khb-sec,.khb-band{padding:40px 0;}
  .khb-h2,.khb-h2--mid,.khb-h2--quick,.khb-h2--stat{font-size:20px!important;}
  .khb-action{flex-wrap:wrap;}
  .khb-pill{width:100%;}
  .khb-tabs{gap:18px;}
  .khb-tab{font-size:16px;}
  .khb-panel{padding:22px;border-radius:20px;}
  .khb-panel-foot{flex-direction:column;align-items:stretch;}
}
`;
