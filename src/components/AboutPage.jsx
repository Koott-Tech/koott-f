'use client';

/**
 * AboutPage — port of koott.in/about-us, built from a full-page screenshot plus
 * the live page's computed styles at a 980px content column.
 *
 * Measured off the live page:
 *   h1            work-sans 38/500, 1.3em, -0.05em, centred, y=150
 *   team photo    980x467, torn top edge, y=271
 *   story h2      work-sans 25/500, 1.3em, -0.05em, centred, y=823
 *   story copy    avenir 15/400, 1.4em, centred, 709 wide
 *   stats band    #E8FEDF, full-bleed, y=1341 h=519; heading + copy LEFT,
 *                 a 2x2 stat grid, two pills, and a 305x381 photo on the right
 *   stat number   work-sans 25/500 -0.05em · caption avenir 13/400
 *   pills         avenir 13/400, tracking 0.1em — outlined green + solid green
 *   advisory      centred h2, 133px circular photos two-up, name work-sans
 *                 16/500 -0.05em, role avenir 15/400, centred bio
 *   leadership    list on the left with 115px photos, founder photo 305x381 right
 *
 * Images still come from static.wixstatic.com (an allowed host in
 * next.config.mjs) — open migration task #4 is to move them to our own storage.
 */

import { useSiteContent } from '@/lib/useSiteContent';
import ABOUT_DEFAULTS from '@/data/aboutContent';

/**
 * Copy lives in data/aboutContent.js; the admin "Pages → About" editor stores
 * changes under site-config `site_about`. `content` (the editor's live preview)
 * replaces the stored copy.
 */
export default function AboutPage({ content: override } = {}) {
  const { mission, story, trust, advisors, leadership, closing } = useSiteContent('site_about', ABOUT_DEFAULTS, override);
  const founder = leadership.founder || {};

  return (
    <main className="kab">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── Mission + team photo ─────────────────────────────────────── */}
      <section className="kab-sec kab-sec--top">
        <div className="kab-in">
          <h1 className="kab-h1">{mission.title}</h1>
        </div>
        {mission.photo && (
          <div className="kab-in">
            <div className="kab-teamwrap">
              <img className="kab-team" src={mission.photo} alt="The Koott team" />
            </div>
          </div>
        )}
      </section>

      {/* ── Story ────────────────────────────────────────────────────── */}
      <section className="kab-sec">
        <div className="kab-in kab-story">
          <h2 className="kab-h2">{story.title}</h2>
          {(story.paragraphs || []).map((p, i) => <p key={i} className="kab-p">{p}</p>)}
        </div>
      </section>

      {/* ── Trusted by Malayalees (mint band) ────────────────────────── */}
      <section className="kab-band">
        <div className="kab-in kab-split">
          <div>
            <h2 className="kab-h2 kab-left">{trust.title}</h2>
            <p className="kab-p kab-left kab-lead">{trust.lead}</p>

            <div className="kab-stats">
              {(trust.stats || []).map((s, i) => (
                <div key={i} className="kab-stat">
                  <span className="kab-stat-mark" aria-hidden>{s.mark}</span>
                  <div>
                    <span className="kab-stat-v">{s.value}</span>
                    <span className="kab-stat-c">{s.caption}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="kab-btns">
              {trust.secondaryCta?.label && <a href={trust.secondaryCta.href} className="kab-pill">{trust.secondaryCta.label}</a>}
              {trust.primaryCta?.label && <a href={trust.primaryCta.href} className="kab-pill is-solid">{trust.primaryCta.label}</a>}
            </div>
          </div>

          {trust.photo && <img className="kab-side" src={trust.photo} alt="" aria-hidden />}
        </div>
      </section>

      {/* ── Advisory board ───────────────────────────────────────────── */}
      <section className="kab-sec">
        <div className="kab-in">
          <h2 className="kab-h2 kab-center">{advisors.title}</h2>
          <p className="kab-p kab-center kab-narrow">{advisors.lead}</p>

          <div className="kab-people">
            {(advisors.people || []).map((a, i) => (
              <article key={i} className="kab-person">
                {a.photo && <img className="kab-avatar" src={a.photo} alt={a.name} />}
                <h3 className="kab-person-n">{a.name}</h3>
                <p className="kab-person-r">{a.role || advisors.role}</p>
                <p className="kab-person-b">{a.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leadership ───────────────────────────────────────────────── */}
      <section className="kab-sec">
        <div className="kab-in">
          <h2 className="kab-h2 kab-center">{leadership.title}</h2>
          <p className="kab-p kab-center kab-narrow">{leadership.lead}</p>

          <div className="kab-split kab-split--lead">
            <ul className="kab-leaders">
              {(leadership.people || []).map((l, i) => (
                <li key={i} className="kab-leader">
                  {l.photo && <img className="kab-leader-img" src={l.photo} alt={l.name} />}
                  <div>
                    <span className="kab-person-n">{l.name}</span>
                    <span className="kab-person-r">{l.role}</span>
                    <p className="kab-leader-b">{l.bio}</p>
                  </div>
                </li>
              ))}
            </ul>

            {founder.name && (
              <figure className="kab-founder">
                {founder.photo && <img className="kab-side" src={founder.photo} alt={founder.name} />}
                <figcaption>
                  <span className="kab-person-n">{founder.name}</span>
                  <span className="kab-person-r">{founder.role}</span>
                  <p className="kab-leader-b">{founder.quote}</p>
                </figcaption>
              </figure>
            )}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────────────── */}
      <section className="kab-sec kab-sec--last">
        <div className="kab-in kab-cta">
          <h2 className="kab-h2 kab-center">{closing.title}</h2>
          {closing.cta?.label && <a href={closing.cta.href} className="kab-pill is-solid">{closing.cta.label}</a>}
        </div>
      </section>
    </main>
  );
}

/* Scoped to .kab and !important throughout, because globals.css (marked
   "never edit") forces Poppins / 60px on h1, 48px on h2, Inter / 16px on p,
   and letter-spacing on span, li and a. */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');

.kab{
  --k-ink:#100E0E;
  --k-accent:#3D985C;
  --k-green:#4FAB69;
  --k-green-hover:#025545;
  --k-band:#E8FEDF;
  --k-sans:'Inter',ui-sans-serif,system-ui,sans-serif;
  --k-body:'Inter','Avenir Light','Avenir Next','Avenir',ui-sans-serif,system-ui,sans-serif;
  /* Header.jsx is position:fixed and h-16, so it reserves no space in flow. */
  padding-top:64px;
  display:block;background:#fff;color:var(--k-ink);font-family:var(--k-body)!important;
}
.kab *{box-sizing:border-box;}
.kab-sec{padding:56px 0;}
.kab-sec--top{padding-top:86px;}
.kab-sec--last{padding-bottom:88px;}
.kab-in{max-width:1020px;margin:0 auto;padding:0 20px;}
.kab-center{text-align:center!important;}
.kab-left{text-align:left!important;}
.kab-narrow{max-width:430px;margin-left:auto;margin-right:auto;}

.kab-h1{
  /* size from the global --h1-size scale */
  font-family:var(--k-sans)!important;font-weight:500!important;
  line-height:1.3em!important;letter-spacing:-.05em!important;color:var(--k-ink)!important;
  margin:0 auto;text-align:center;max-width:740px;
}
.kab-h2{
  font-family:var(--k-sans)!important;font-size:25px!important;font-weight:500!important;
  line-height:1.3em!important;letter-spacing:-.05em!important;color:var(--k-ink)!important;
  margin:0;text-align:center;
}
.kab-p{
  font-family:var(--k-body)!important;font-size:15px!important;font-weight:400!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--k-ink)!important;
  margin:18px 0 0;white-space:pre-line;
}
.kab-lead{line-height:1.7em!important;max-width:394px;margin-top:12px;}

/* team photo with the live page's torn top edge */
.kab-teamwrap{margin-top:38px;}
.kab-team{
  display:block;width:100%;max-width:980px;height:467px;object-fit:cover;margin:0 auto;
  -webkit-mask-image:url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' preserveAspectRatio='none' viewBox='0 0 100 100'%3E%3Cpath d='M0 3 L4 1 L9 4 L14 1.5 L20 4 L26 1 L32 3.5 L38 1 L44 3 L50 1 L56 3.5 L62 1 L68 4 L74 1.5 L80 3.5 L86 1 L92 4 L96 1.5 L100 3 L100 100 L0 100 Z' fill='%23000'/%3E%3C/svg%3E");
  mask-image:url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' preserveAspectRatio='none' viewBox='0 0 100 100'%3E%3Cpath d='M0 3 L4 1 L9 4 L14 1.5 L20 4 L26 1 L32 3.5 L38 1 L44 3 L50 1 L56 3.5 L62 1 L68 4 L74 1.5 L80 3.5 L86 1 L92 4 L96 1.5 L100 3 L100 100 L0 100 Z' fill='%23000'/%3E%3C/svg%3E");
  -webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;
}

/* story */
.kab-story{max-width:749px;text-align:center;}
.kab-story .kab-h2{margin-bottom:8px;}

/* mint band */
.kab-band{background:var(--k-band);padding:76px 0;}
.kab-split{display:grid;grid-template-columns:1fr 305px;gap:60px;align-items:start;}
.kab-side{width:305px;height:381px;object-fit:cover;border-radius:10px;display:block;}

.kab-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:26px 30px;margin:34px 0 0;}
.kab-stat{display:flex;align-items:flex-start;gap:12px;}
.kab-stat-mark{font-size:18px;line-height:1.2;flex:none;}
.kab-stat-v{
  display:block;font-family:var(--k-sans)!important;font-size:25px!important;font-weight:500!important;
  line-height:1.4em!important;letter-spacing:-.05em!important;color:var(--k-ink)!important;
}
.kab-stat-c{
  display:block;font-family:var(--k-body)!important;font-size:13px!important;font-weight:400!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--k-ink)!important;
}
.kab-btns{display:flex;flex-wrap:wrap;gap:18px;margin:38px 0 0;}
.kab-pill{
  display:inline-flex;align-items:center;justify-content:center;
  min-height:38px;padding:0 22px;border-radius:8px;
  border:1px solid var(--k-accent);background:transparent;
  font-family:var(--k-body)!important;font-size:13px;font-weight:400;
  letter-spacing:.1em!important;color:var(--k-accent)!important;text-decoration:none;
  white-space:nowrap;transition:background-color .2s ease,color .2s ease;
}
.kab-pill:hover{background:rgba(61,152,92,.10);}
.kab-pill.is-solid{background:var(--k-green);border-color:var(--k-green);color:#fff!important;}
.kab-pill.is-solid:hover{background:var(--k-green-hover);border-color:var(--k-green-hover);}

/* advisory board */
.kab-people{display:grid;grid-template-columns:repeat(2,1fr);gap:56px 60px;margin:52px 0 0;}
.kab-person{text-align:center;margin:0;}
.kab-avatar{
  width:133px;height:133px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 16px;
  border:3px solid #DFFFD2;background:#D9F0DA;
}
.kab-person-n{
  display:block;font-family:var(--k-sans)!important;font-size:16px!important;font-weight:500!important;
  line-height:1.4em!important;letter-spacing:-.05em!important;color:var(--k-ink)!important;margin:0;
}
.kab-person-r{
  display:block;font-family:var(--k-body)!important;font-size:15px!important;font-weight:400!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--k-ink)!important;margin:2px 0 0;
}
.kab-person-b{
  font-family:var(--k-body)!important;font-size:13px!important;font-weight:400!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--k-ink)!important;
  margin:14px auto 0;max-width:34ch;
}

/* leadership */
.kab-split--lead{margin-top:48px;align-items:start;}
.kab-leaders{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:38px;}
.kab-leader{display:flex;align-items:flex-start;gap:22px;}
.kab-leader-img{
  width:115px;height:121px;object-fit:cover;border-radius:10px;flex:none;background:#D9F0DA;
}
.kab-leader-b{
  font-family:var(--k-body)!important;font-size:13px!important;font-weight:400!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--k-ink)!important;margin:10px 0 0;
}
.kab-founder{margin:0;}
.kab-founder figcaption{margin-top:16px;}

.kab-cta{text-align:center;}
.kab-cta .kab-pill{margin-top:22px;}

@media (max-width:900px){
  .kab-split,.kab-split--lead{grid-template-columns:1fr;gap:34px;}
  .kab-side{width:100%;height:auto;}
  .kab-people{grid-template-columns:1fr;gap:40px;}
  .kab-team{height:280px;}
}
@media (max-width:640px){
  .kab-sec,.kab-band{padding:40px 0;}
  .kab-h2{font-size:20px!important;}
  .kab-stats{grid-template-columns:1fr;}
  .kab-leader{flex-direction:column;gap:14px;}
  .kab-pill{width:100%;}
  .kab-team{height:200px;}
}
`;
