/**
 * /event-list — "Upcoming Mental Health Workshops", matching the live koott.in page.
 *
 * Driven by the event_pages CMS table (imported from the live site by
 * backend/scripts/importJobsEvents.js), so adding a workshop in the admin adds
 * it here. Kept separate from /events, which is the older Koott summer-workshop
 * page with its own design and data source.
 */

import Link from 'next/link';
import { eventHasEnded, wixOriginal } from '@/data/workshopEventPageCms';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SITE = 'https://www.koott.in';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const metadata = {
  title: { absolute: 'Events | Koott' },
  description:
    'Upcoming mental health workshops from Koott — pre-marital, marital conflict and positive parenting sessions, run online by Malayali psychologists.',
  alternates: { canonical: `${SITE}/event-list` },
  openGraph: {
    title: 'Events | Koott',
    description: 'Upcoming mental health workshops from Koott.',
    url: `${SITE}/event-list`,
    type: 'website',
    siteName: 'Koott',
    images: [{ url: `${SITE}/logo.png`, width: 1200, height: 630, alt: 'Koott' }],
  },
};

async function fetchEvents() {
  try {
    const res = await fetch(`${API}/event-pages/public?limit=50`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    const list = json?.data ?? json?.message ?? json;
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return [];
  }
}

const isPast = (ev) => {
  const d = ev.cms_data || {};
  return eventHasEnded([d.schedule, d.time, d.date].filter(Boolean).join(' '));
};

function EventCard({ ev, past = false }) {
  const d = ev.cms_data || {};
  return (
    <article className={`kev-card${past ? ' is-past' : ''}`}>
      {d.image && (
        // Wix media, not in next/image's remote allowlist under every host.
        // The imported URL is a 49px blurred thumbnail; wixOriginal() drops
        // the resize suffix so the card shows the real image.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="kev-img" src={wixOriginal(d.image)} alt={d.title || ev.seo_title || ''} />
      )}
      <div className="kev-card-b">
        <p className="kev-meta">
          {past && <span className="kev-tag">Past event</span>}
          {d.date}{d.venue ? ` · ${d.venue}` : ''}
        </p>
        <h2 className="kev-card-t">{d.title || ev.seo_title}</h2>
        {d.summary && <p className="kev-card-x">{d.summary}</p>}
        {d.schedule && <p className="kev-when">{d.schedule}</p>}
        <Link className="kev-btn" href={`/events/${ev.slug}`}>{past ? 'View event' : 'More info'}</Link>
      </div>
    </article>
  );
}

export default async function EventListPage() {
  const events = await fetchEvents();
  const upcoming = events.filter((ev) => !isPast(ev));
  const past = events.filter(isPast);

  return (
    // Header.jsx is position:fixed and reserves no space of its own.
    <main className="kev" style={{ paddingTop: 64 }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <section className="kev-head">
        <div className="kev-in">
          <h1 className="kev-h1">Upcoming Mental Health Workshops</h1>
          <p className="kev-lead">
            Small, guided online sessions run by our Malayali psychologists. Bring your questions —
            everything stays confidential.
          </p>
        </div>
      </section>

      <section className="kev-body">
        <div className="kev-in">
          {upcoming.length === 0 ? (
            <p className="kev-empty">No workshops are scheduled right now. Please check back soon.</p>
          ) : (
            <div className="kev-grid">
              {upcoming.map((ev) => <EventCard key={ev.slug} ev={ev} />)}
            </div>
          )}
          {past.length > 0 && (
            <>
              <h2 className="kev-past-h">Past workshops</h2>
              <div className="kev-grid">
                {past.map((ev) => <EventCard key={ev.slug} ev={ev} past />)}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

const CSS = `
.kev{
  --ink:#100E0E; --accent:#3D985C; --btn:#4FAB69; --btn-hover:#025545; --deep:#29653D;
  --sans:'Work Sans',ui-sans-serif,system-ui,sans-serif;
  --body:'Mulish',ui-sans-serif,system-ui,sans-serif;
  background:#fff;
}
.kev *{box-sizing:border-box;}
.kev-in{max-width:980px;margin:0 auto;padding:0 24px;}
.kev-head{background:linear-gradient(180deg,#F0FFEC,#FFFFFF);padding:60px 0 44px;text-align:center;}
.kev-h1{
  /* size from the global --h1-size scale */
  font-family:var(--sans)!important;font-weight:500!important;
  line-height:1.2em!important;letter-spacing:-.02em!important;color:var(--ink)!important;margin:0 0 14px;
}
.kev-lead{
  font-family:var(--body)!important;font-size:16px!important;font-weight:400!important;
  line-height:1.7em!important;letter-spacing:0!important;color:var(--ink)!important;
  margin:0 auto;max-width:620px;
}
.kev-body{padding:44px 0 68px;}
.kev-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(288px,1fr));gap:24px;}
.kev-card{border:1px solid rgba(38,34,34,.13);border-radius:10px;overflow:hidden;background:#fff;display:flex;flex-direction:column;}
.kev-img{width:100%;height:172px;object-fit:cover;display:block;}
.kev-card-b{padding:18px;display:flex;flex-direction:column;flex:1;}
.kev-meta{
  font-family:var(--body)!important;font-size:12px!important;font-weight:400!important;
  letter-spacing:.04em!important;color:var(--accent)!important;margin:0 0 8px;text-transform:uppercase;
}
.kev-card-t{
  font-family:var(--sans)!important;font-size:20px!important;font-weight:500!important;
  line-height:1.3em!important;letter-spacing:-.01em!important;color:var(--ink)!important;margin:0 0 10px;
}
.kev-card-x{
  font-family:var(--body)!important;font-size:14px!important;font-weight:400!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--ink)!important;margin:0 0 10px;flex:1;
}
.kev-when{
  font-family:var(--body)!important;font-size:13px!important;letter-spacing:0!important;
  color:#5B5757!important;margin:0 0 14px;
}
.kev-btn{
  align-self:flex-start;background:var(--btn);color:#fff!important;text-decoration:none;
  font-family:var(--body)!important;font-size:14px!important;font-weight:500!important;letter-spacing:0!important;
  padding:10px 22px;border-radius:24px;transition:background .18s ease;
}
.kev-btn:hover{background:var(--btn-hover);}
.kev-past-h{
  font-family:var(--sans)!important;font-size:24px!important;font-weight:500!important;
  letter-spacing:-.01em!important;color:var(--ink)!important;margin:56px 0 20px;
}
.kev-card.is-past .kev-img{filter:grayscale(.6);opacity:.85;}
.kev-tag{display:inline-block;margin-right:8px;padding:2px 8px;border-radius:10px;background:#F1F1F1;color:#5B5757;}
.kev-empty{
  font-family:var(--body)!important;font-size:16px!important;letter-spacing:0!important;
  color:#5B5757!important;text-align:center;padding:40px 0;
}
@media (max-width:640px){
  .kev-grid{grid-template-columns:1fr;}
}
`;
