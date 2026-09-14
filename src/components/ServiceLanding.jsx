'use client';

/**
 * ServiceLanding — the index page for a service that only had per-item pages.
 *
 * /assessments and /better-parenting are linked from the header, the footer
 * and the services tabs, but only /assessments/<slug> and
 * /better-parenting/<slug> existed, so the index URLs were 404s. This gives
 * each a real page: what the service is, how it runs, a way to book, and the
 * individual pages from the CMS listed underneath once any are published.
 *
 * Built phone-first: one column, full-width buttons under 640px.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function ServiceLanding({
  eyebrow, title, lead, points = [], steps = [], cta, listPath, listLabel,
}) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!listPath) return undefined;
    let off = false;
    (async () => {
      try {
        const res = await fetch(`${API}/${listPath}`);
        if (!res.ok) return;
        const json = await res.json();
        const d = json?.data ?? json?.message ?? json;
        const rows = Array.isArray(d) ? d : (d?.assessments || d?.pages || d?.items || []);
        if (!off) setItems(rows.filter((r) => r.slug && r.status !== 'draft'));
      } catch (_) { /* the page stands on its own without the list */ }
    })();
    return () => { off = true; };
  }, [listPath]);

  return (
    <div className="sl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <section className="sl-hero">
        <div className="sl-in">
          <p className="sl-eyebrow">{eyebrow}</p>
          <h1 className="sl-h1">{title}</h1>
          <p className="sl-lead">{lead}</p>
          <div className="sl-ctas">
            <Link href={cta.href} className="sl-btn">{cta.label}</Link>
            <Link href="/get-in-touch" className="sl-btn sl-btn--ghost">Talk to us first</Link>
          </div>
        </div>
      </section>

      {points.length > 0 && (
        <section className="sl-sec">
          <div className="sl-in sl-points">
            {points.map((p) => (
              <div key={p.title} className="sl-point">
                <h2 className="sl-point-t">{p.title}</h2>
                <p className="sl-point-b">{p.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {steps.length > 0 && (
        <section className="sl-sec sl-sec--tint">
          <div className="sl-in">
            <h2 className="sl-h2">How it works</h2>
            <ol className="sl-steps">
              {steps.map((st, i) => (
                <li key={st}><span className="sl-step-n">{i + 1}</span>{st}</li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {items.length > 0 && (
        <section className="sl-sec">
          <div className="sl-in">
            <h2 className="sl-h2">{listLabel}</h2>
            <div className="sl-list">
              {items.map((it) => (
                <Link key={it.slug} href={`/${listPath}/${it.slug}`} className="sl-item">
                  <span className="sl-item-t">{it.hero_title || it.title || it.name || it.slug}</span>
                  <span className="sl-item-go" aria-hidden>→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

const CSS = `
.sl{--green:#189E4F;--green-d:#12813F;--deep:#012F23;--tint:#F5FBF3;--line:rgba(1,47,35,.12);
  background:#fff;color:#171717;font-family:'Mulish',system-ui,sans-serif;}
.sl-in{max-width:980px;margin:0 auto;padding:0 24px;}
.sl-hero{padding:120px 0 72px;background:linear-gradient(180deg,var(--tint),#fff);}
.sl-eyebrow{
  display:inline-block;background:#EAF9E4;color:var(--deep)!important;border-radius:6px;padding:5px 12px;
  font-size:13px!important;letter-spacing:0!important;margin:0 0 16px;
}
.sl-h1{
  /* size from the global --h1-size scale */
  font-family:'Work Sans',system-ui,sans-serif!important;font-weight:600!important;
  line-height:1.15em!important;letter-spacing:-.01em!important;color:var(--deep)!important;margin:0 0 16px;max-width:760px;
}
.sl-lead{font-size:17px!important;line-height:1.65em!important;letter-spacing:0!important;color:#3B3B3B!important;margin:0 0 28px;max-width:640px;}
.sl-ctas{display:flex;gap:12px;flex-wrap:wrap;}
.sl-btn{
  display:inline-flex;align-items:center;justify-content:center;background:var(--green);color:#fff!important;
  border:1px solid var(--green);border-radius:10px;padding:13px 26px;text-decoration:none;
  font-size:15px!important;font-weight:600!important;letter-spacing:0!important;
}
.sl-btn:hover{background:var(--green-d);}
.sl-btn--ghost{background:transparent;color:var(--deep)!important;border-color:rgba(1,47,35,.35);}
.sl-btn--ghost:hover{background:var(--tint);}

.sl-sec{padding:72px 0;}
.sl-sec--tint{background:var(--tint);}
.sl-h2{
  font-family:'Work Sans',system-ui,sans-serif!important;font-size:30px!important;font-weight:600!important;
  letter-spacing:0!important;color:var(--deep)!important;margin:0 0 24px;
}
.sl-points{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;}
.sl-point{border:1px solid var(--line);border-radius:14px;padding:24px;background:#fff;}
.sl-point-t{
  font-family:'Work Sans',system-ui,sans-serif!important;font-size:19px!important;font-weight:600!important;
  letter-spacing:0!important;color:var(--deep)!important;margin:0 0 10px;line-height:1.3em!important;
}
.sl-point-b{font-size:15px!important;line-height:1.6em!important;letter-spacing:0!important;color:#3B3B3B!important;margin:0;}
.sl-steps{list-style:none!important;margin:0;padding:0;display:grid;gap:14px;}
.sl-steps li{
  display:flex!important;align-items:flex-start;gap:14px;font-size:16px!important;line-height:1.55em!important;
  letter-spacing:0!important;color:#171717!important;
}
.sl-step-n{
  flex:none;width:30px;height:30px;border-radius:50%;background:var(--green);color:#fff;
  display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;
}
.sl-list{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.sl-item{
  display:flex;align-items:center;justify-content:space-between;gap:14px;border:1px solid var(--line);
  border-radius:12px;padding:16px 18px;text-decoration:none;color:var(--deep)!important;
  font-size:15px!important;font-weight:600!important;letter-spacing:0!important;
}
.sl-item:hover{border-color:var(--green);}

@media (max-width:760px){
  .sl-points,.sl-list{grid-template-columns:1fr;}
}
@media (max-width:640px){
  .sl-hero{padding:96px 0 48px;}
  .sl-in{padding:0 20px;}
  .sl-lead{font-size:16px!important;}
  .sl-ctas{flex-direction:column;}
  .sl-btn{width:100%;}
  .sl-sec{padding:48px 0;}
  .sl-h2{font-size:24px!important;}
  .sl-point{padding:20px;}
}
`;
