'use client';

/**
 * StaticPageTemplate — renders a koott.in content page from a list of sections.
 *
 * The condition pages share one fixed strip order, so they get a bespoke layout
 * (ConditionPageTemplate). The rest of the site — the city landing pages, /business,
 * /selfhelp, /partnership-clinic and so on — does not: each page has its own mix of
 * headings, copy and card grids. So this takes whatever sections a page has and
 * renders them generically, alternating band backgrounds for rhythm.
 *
 * Type and palette follow the same measurements taken off the live site for the
 * condition pages:
 *   ink #100E0E · accent #3D985C · button #4FAB69 → hover #025545
 *   bands #FFF / #F5FFF6 / #FBFFF9 · cards radius 10px, 1px rgba(38,34,34,.13)
 *   headings Work Sans · body Mulish (standing in for Avenir, a licensed Wix face)
 *
 * Styles are scoped to .kst and marked !important because globals.css (marked
 * "never edit") forces DM Sans / 48px on h2, Work Sans / 16px on p, and so on.
 */

const BOOK_HREF = '/book-malayali-psychologists';

const Card = ({ title, body, items }) => (
  <div className="kst-card">
    <h3 className="kst-card-t">{title}</h3>
    {items && items.length ? (
      <ul className="kst-card-list">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    ) : body ? (
      <p className="kst-card-b">{body}</p>
    ) : null}
  </div>
);

/** Bands alternate so consecutive sections stay visually separated. */
const BANDS = ['#FFFFFF', '#F5FFF6', '#FFFFFF', '#FBFFF9'];

export default function StaticPageTemplate({ page }) {
  if (!page) return null;
  const { title, intro, sections = [], cta } = page;

  return (
    <main className="kst">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <section className="kst-hero">
        <div className="kst-in">
          <h1 className="kst-h1">{title}</h1>
          {intro && <p className="kst-lead">{intro}</p>}
          <a className="kst-btn" href={BOOK_HREF}>Book Now</a>
        </div>
      </section>

      {sections.map((s, i) => {
        const hasBody = (s.paras && s.paras.length) || (s.cards && s.cards.length);
        if (!s.heading && !hasBody) return null;
        return (
          <section key={i} className="kst-sec" style={{ background: BANDS[i % BANDS.length] }}>
            <div className="kst-in">
              {s.heading && <h2 className="kst-h2">{s.heading}</h2>}
              {(s.paras || []).map((p, j) => <p key={j} className="kst-p">{p}</p>)}
              {s.cards && s.cards.length > 0 && (
                <div className={`kst-grid ${s.cards.length === 2 ? 'is-2' : s.cards.length % 3 === 0 ? 'is-3' : 'is-auto'}`}>
                  {s.cards.map((c, j) => <Card key={j} {...c} />)}
                </div>
              )}
            </div>
          </section>
        );
      })}

      <section className="kst-cta">
        <div className="kst-in">
          <p className="kst-cta-t">{cta || 'Talk to a licensed Malayali psychologist who understands your language and context.'}</p>
          <a className="kst-btn is-light" href={BOOK_HREF}>View Therapists</a>
        </div>
      </section>
    </main>
  );
}

const CSS = `
.kst{
  --ink:#100E0E; --accent:#3D985C; --btn:#4FAB69; --btn-hover:#025545; --deep:#29653D;
  --sans:'Work Sans',ui-sans-serif,system-ui,sans-serif;
  --body:'Mulish',ui-sans-serif,system-ui,sans-serif;
  background:#fff;
}
.kst *{box-sizing:border-box;}
.kst-in{max-width:980px;margin:0 auto;padding:0 24px;}
.kst-hero{background:linear-gradient(180deg,#F0FFEC,#FFFFFF);padding:64px 0 52px;text-align:center;}
.kst-h1{
  font-family:var(--sans)!important;font-size:40px!important;font-weight:500!important;
  line-height:1.18em!important;letter-spacing:-.02em!important;color:var(--ink)!important;margin:0 0 18px;
}
.kst-lead{
  font-family:var(--body)!important;font-size:17px!important;font-weight:400!important;
  line-height:1.7em!important;letter-spacing:0!important;color:var(--ink)!important;
  margin:0 auto 26px;max-width:680px;
}
.kst-sec{padding:52px 0;}
.kst-h2{
  font-family:var(--sans)!important;font-size:29px!important;font-weight:500!important;
  line-height:1.25em!important;letter-spacing:-.02em!important;color:var(--ink)!important;
  margin:0 0 18px;text-align:center;
}
.kst-p{
  font-family:var(--body)!important;font-size:15px!important;font-weight:400!important;
  line-height:1.75em!important;letter-spacing:0!important;color:var(--ink)!important;margin:0 0 14px;
}
.kst-grid{display:grid;gap:20px;margin-top:26px;}
.kst-grid.is-3{grid-template-columns:repeat(3,1fr);}
.kst-grid.is-2{grid-template-columns:repeat(2,1fr);}
.kst-grid.is-auto{grid-template-columns:repeat(auto-fit,minmax(268px,1fr));}
.kst-card{border:1px solid rgba(38,34,34,.13);border-radius:10px;background:#fff;padding:20px;}
.kst-card-t{
  font-family:var(--body)!important;font-size:17px!important;font-weight:700!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--ink)!important;margin:0 0 8px;
}
.kst-card-b{
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--ink)!important;margin:0;
}
/* globals.css strips list markers site-wide, so force them back on. */
.kst-card-list{
  margin:0;padding:0 0 0 18px;list-style:disc!important;
  font-family:var(--body)!important;font-size:14px!important;line-height:1.6em!important;
  letter-spacing:0!important;color:var(--ink)!important;
}
.kst-card-list li{display:list-item!important;margin:0 0 5px;}
.kst-card-list li::marker{color:var(--accent);}
.kst-btn{
  display:inline-block;background:var(--btn);color:#fff!important;text-decoration:none;
  font-family:var(--body)!important;font-size:15px!important;font-weight:500!important;letter-spacing:0!important;
  padding:13px 30px;border-radius:26px;transition:background .18s ease;
}
.kst-btn:hover{background:var(--btn-hover);}
.kst-btn.is-light{background:#fff;color:var(--deep)!important;}
.kst-btn.is-light:hover{background:#F0FFEC;}
.kst-cta{background:var(--deep);padding:48px 0;text-align:center;}
.kst-cta-t{
  font-family:var(--body)!important;font-size:17px!important;font-weight:400!important;
  line-height:1.65em!important;letter-spacing:0!important;color:#fff!important;
  margin:0 auto 22px;max-width:640px;
}
@media (max-width:900px){
  .kst-grid.is-3,.kst-grid.is-2{grid-template-columns:1fr 1fr;}
}
@media (max-width:640px){
  .kst-hero{padding:44px 0 36px;}
  .kst-h1{font-size:29px!important;}
  .kst-h2{font-size:23px!important;}
  .kst-grid.is-3,.kst-grid.is-2,.kst-grid.is-auto{grid-template-columns:1fr;}
}
`;
