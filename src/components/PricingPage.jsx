/**
 * /plans-pricing body — "Choose your pricing plan", the page koott.in serves
 * from a Wix Pricing Plans widget.
 *
 * Pure render of `content` (no hooks), so the route can load it on the server
 * and the admin "Pages → Pricing" editor can render it as its live preview.
 * Defaults and the notes on the two live-site entries not reproduced verbatim
 * are in data/pricingPlans.js.
 */

import Link from 'next/link';

const BOOK_HREF = '/book-malayali-psychologists';

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

/** Turn the words "refund policy" in the fine print into the link. */
function withRefundLink(text) {
  const parts = String(text || '').split(/(refund policy)/i);
  return parts.map((p, i) => (/^refund policy$/i.test(p)
    ? <Link key={i} href="/refund-policy">{p}</Link>
    : p));
}

export default function PricingPage({ content }) {
  const { intro = {}, plans = [], fine = '' } = content || {};
  return (
    // Header.jsx is position:fixed and reserves no space of its own.
    <main className="kpp" style={{ paddingTop: 64 }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <section className="kpp-head">
        <div className="kpp-in">
          <h1 className="kpp-h1">{intro.title}</h1>
          {intro.lead && <p className="kpp-lead">{intro.lead}</p>}
        </div>
      </section>

      <section className="kpp-body">
        <div className="kpp-in">
          <div className="kpp-grid">
            {plans.map((p, idx) => {
              const noPrice = p.price === null || p.price === '' || p.price === undefined;
              return (
                <article key={p.id || idx} className={`kpp-card ${p.highlight ? 'is-on' : ''}`}>
                  <h2 className="kpp-name">{p.name}</h2>

                  <p className="kpp-price">
                    {noPrice
                      ? <span className="kpp-ask">Contact us</span>
                      : <>{inr(p.price)}{p.unit && <span className="kpp-unit"> {p.unit}</span>}</>}
                  </p>
                  {p.note && <p className="kpp-note">{p.note}</p>}

                  <ul className="kpp-list">
                    {(p.features || []).map((f, i) => <li key={i}>{f}</li>)}
                  </ul>

                  <Link className={`kpp-btn ${p.highlight ? 'is-on' : ''}`} href={BOOK_HREF}>
                    {noPrice ? 'Ask about this plan' : 'Buy Now'}
                  </Link>
                </article>
              );
            })}
          </div>

          {fine && <p className="kpp-fine">{withRefundLink(fine)}</p>}
        </div>
      </section>
    </main>
  );
}

const CSS = `
.kpp{
  --ink:#100E0E; --accent:#3D985C; --btn:#4FAB69; --btn-hover:#025545; --deep:#29653D;
  --sans:'Work Sans',ui-sans-serif,system-ui,sans-serif;
  --body:'Mulish',ui-sans-serif,system-ui,sans-serif;
  background:#fff;
}
.kpp *{box-sizing:border-box;}
.kpp-in{max-width:1040px;margin:0 auto;padding:0 24px;}
.kpp-head{background:linear-gradient(180deg,#F0FFEC,#FFFFFF);padding:60px 0 42px;text-align:center;}
.kpp-h1{
  /* size from the global --h1-size scale */
  font-family:var(--sans)!important;font-weight:500!important;
  line-height:1.2em!important;letter-spacing:-.02em!important;color:var(--ink)!important;margin:0 0 14px;
}
.kpp-lead{
  font-family:var(--body)!important;font-size:16px!important;font-weight:400!important;
  line-height:1.7em!important;letter-spacing:0!important;color:var(--ink)!important;
  margin:0 auto;max-width:620px;
}
.kpp-body{padding:42px 0 66px;}
.kpp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(276px,1fr));gap:22px;}
.kpp-card{
  border:1px solid rgba(38,34,34,.13);border-radius:10px;background:#fff;padding:24px;
  display:flex;flex-direction:column;
}
.kpp-card.is-on{border-color:#5EA277;box-shadow:0 4px 22px rgba(61,152,92,.12);}
.kpp-name{
  font-family:var(--sans)!important;font-size:20px!important;font-weight:500!important;
  line-height:1.3em!important;letter-spacing:-.01em!important;color:var(--ink)!important;margin:0 0 10px;
}
.kpp-price{
  font-family:var(--sans)!important;font-size:31px!important;font-weight:500!important;
  line-height:1.15em!important;letter-spacing:-.02em!important;color:var(--deep)!important;margin:0 0 4px;
}
.kpp-unit{
  font-family:var(--body)!important;font-size:13px!important;font-weight:400!important;
  letter-spacing:0!important;color:#5B5757!important;
}
.kpp-ask{font-size:24px!important;color:var(--accent)!important;}
.kpp-note{
  font-family:var(--body)!important;font-size:13px!important;letter-spacing:0!important;
  color:#5B5757!important;margin:0 0 16px;
}
/* globals.css strips list markers site-wide, so force them back on. */
.kpp-list{
  margin:0 0 20px;padding:0 0 0 18px;list-style:disc!important;flex:1;
  font-family:var(--body)!important;font-size:14px!important;line-height:1.65em!important;
  letter-spacing:0!important;color:var(--ink)!important;
}
.kpp-list li{display:list-item!important;margin:0 0 6px;}
.kpp-list li::marker{color:var(--accent);}
.kpp-btn{
  display:block;text-align:center;background:#fff;color:var(--deep)!important;text-decoration:none;
  border:1px solid rgba(41,101,61,.31);
  font-family:var(--body)!important;font-size:14px!important;font-weight:500!important;letter-spacing:0!important;
  padding:11px 20px;border-radius:24px;transition:background .18s ease,color .18s ease;
}
.kpp-btn:hover{background:#F0FFEC;}
.kpp-btn.is-on{background:var(--btn);color:#fff!important;border-color:var(--btn);}
.kpp-btn.is-on:hover{background:var(--btn-hover);}
.kpp-fine{
  font-family:var(--body)!important;font-size:13px!important;line-height:1.7em!important;
  letter-spacing:0!important;color:#5B5757!important;margin:30px auto 0;max-width:640px;text-align:center;
}
.kpp-fine a{color:var(--accent)!important;text-decoration:underline;}
@media (max-width:640px){
  .kpp-grid{grid-template-columns:1fr;}
}
`;
