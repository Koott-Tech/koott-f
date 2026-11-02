/**
 * /counselling — every condition page, laid out as the header menu groups them:
 * the three categories, with INDIVIDUAL's three sub-categories under its own
 * list. The footer's "All Conditions" links land here. It reads the menu file,
 * so a condition added there appears here too.
 */
import Link from 'next/link';
import { CONDITION_MENU } from '@/data/conditions/menu';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'All Conditions | Online Counselling in Malayalam | Koott',
  description:
    'Every condition Koott helps with, from anxiety and depression to relationships and intimacy. Find the right page and book a Malayali psychologist online.',
  canonical: '/counselling',
});

const Links = ({ items }) => (
  <ul className="kac-list">
    {items.map((m) => (
      <li key={m.slug}><Link href={`/${m.slug}`} className="kac-link">{m.label}</Link></li>
    ))}
  </ul>
);

export default function AllConditions() {
  return (
    <div style={{ paddingTop: 63 }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <main className="kac">
        <div className="kac-in">
          <h1 className="kac-h1">All conditions</h1>
          <p className="kac-sub">Find what you are going through, and read how a Malayali psychologist can help.</p>

          {CONDITION_MENU.map((cat) => (
            <section key={cat.key} className="kac-cat">
              <h2 className="kac-h2">{cat.label}</h2>
              <Links items={cat.items} />
              {cat.groups.length > 0 && (
                <div className="kac-groups">
                  {cat.groups.map((g) => (
                    <div key={g.label} className="kac-group">
                      <h3 className="kac-h3">{g.label}</h3>
                      <Links items={g.items} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}

          <div className="kac-foot">
            <Link href="/book-malayali-psychologists" className="kac-cta">Find your therapist</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

/* globals.css sets headings, paragraphs and letter-spacing with !important. */
const CSS = `
.kac{background:#fff;color:#0F0F0F;font-family:'Inter',ui-sans-serif,system-ui,sans-serif;}
.kac *{box-sizing:border-box;letter-spacing:0!important;}
.kac-in{width:100%;max-width:1228px;margin:0 auto;padding:80px 24px;}
.kac-h1,.kac-h1:not(#_){margin:0;text-align:center;font-family:'Poppins',ui-sans-serif,system-ui,sans-serif!important;font-size:32px!important;font-weight:600!important;line-height:48px!important;color:#0F0F0F!important;}
.kac-sub,.kac-sub:not(#_){margin:8px 0 0;text-align:center;font-family:'Inter',ui-sans-serif,system-ui,sans-serif!important;font-size:16px!important;line-height:24px!important;color:#373737!important;}
.kac-cat{margin-top:40px;padding:24px;background:#FAFCF9;border:1px solid #E8EFE5;border-radius:16px;}
.kac-h2,.kac-h2:not(#_){margin:0 0 16px;font-family:'Poppins',ui-sans-serif,system-ui,sans-serif!important;font-size:20px!important;font-weight:600!important;line-height:28px!important;color:#0F0F0F!important;}
.kac-h3,.kac-h3:not(#_){margin:0 0 12px;font-family:'Inter',ui-sans-serif,system-ui,sans-serif!important;font-size:14px!important;font-weight:500!important;line-height:22px!important;color:#1B6930!important;}
.kac-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 24px;}
.kac-link{display:block;padding:7px 0;text-decoration:none;font-family:'Inter',ui-sans-serif,system-ui,sans-serif!important;font-size:14px!important;line-height:22px!important;color:#373737!important;}
.kac-link:hover{color:#189E4F!important;}
.kac-groups{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin-top:24px;padding-top:24px;border-top:1px solid #E8EFE5;}
.kac-group .kac-list{grid-template-columns:1fr;gap:0;}
.kac-foot{margin-top:40px;text-align:center;}
.kac-cta{display:inline-flex;align-items:center;justify-content:center;height:40px;padding:0 22px;border-radius:8px;background:#189E4F;color:#fff!important;text-decoration:none;font-family:'Inter',ui-sans-serif,system-ui,sans-serif!important;font-size:16px!important;font-weight:500!important;line-height:24px!important;}
.kac-cta:hover{background:#0D4F1F;}
@media (max-width:860px){
  .kac-list{grid-template-columns:repeat(2,minmax(0,1fr));}
  .kac-groups{grid-template-columns:repeat(2,minmax(0,1fr));}
}
@media (max-width:640px){
  .kac-in{padding:48px 16px;}
  .kac-h1,.kac-h1:not(#_){font-size:24px!important;line-height:32px!important;}
  .kac-sub,.kac-sub:not(#_){font-size:14px!important;line-height:22px!important;}
  .kac-cat{margin-top:24px;padding:16px;}
  .kac-list{grid-template-columns:1fr;gap:0;}
  .kac-groups{grid-template-columns:1fr;gap:16px;margin-top:16px;padding-top:16px;}
}
`;
