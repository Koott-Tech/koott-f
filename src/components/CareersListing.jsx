'use client';

/**
 * CareersListing — port of koott.in/jobs.
 *
 * Measured off the live page:
 *   band       linear-gradient(180deg, rgba(240,255,236,.31), #D4FFC2), 451 tall
 *   intro      avenir 16/400, 1.4em, centred, 698 wide
 *   "Join us." avenir 20/700
 *   share      white pill, avenir 15/400
 *   job card   630x102, radius 10, 27px gap, content inset 39px
 *   job title  work-sans 18/500, -0.05em
 *   location   avenir 15/400, 1.6em
 *   view job   115x42, #4FAB69, radius 10
 *
 * CMS-driven: reads /api/careers and falls back to data/careerSampleData.js
 * only while the CMS has no published openings.
 */

import { useEffect, useState } from 'react';
import { careerApi } from '@/lib/careerApi';
import { CAREER_SAMPLE_JOBS } from '@/data/careerSampleData';

export const CAREERS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');

.kcr{
  --k-ink:#100E0E;
  --k-accent:#3D985C;
  --k-green:#4FAB69;
  --k-green-hover:#025545;
  --k-line:rgba(38,34,34,.13);
  --k-sans:'Inter',ui-sans-serif,system-ui,sans-serif;
  --k-body:'Inter','Avenir Light','Avenir Next','Avenir',ui-sans-serif,system-ui,sans-serif;
  padding-top:64px;              /* Header.jsx is fixed and h-16 */
  display:block;background:#fff;color:var(--k-ink);font-family:var(--k-body)!important;
}
.kcr *{box-sizing:border-box;}

.kcr-band{
  background:linear-gradient(180deg,rgba(240,255,236,.31) 0%,#D4FFC2 100%);
  padding:44px 20px 40px;text-align:center;
}
.kcr-bandin{max-width:740px;margin:0 auto;}
.kcr-icon{display:flex;justify-content:center;margin-bottom:22px;}
.kcr-p{
  font-family:var(--k-body)!important;font-size:16px!important;font-weight:400!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--k-ink)!important;
  margin:0 auto 18px;max-width:698px;
}
.kcr-join{
  font-family:var(--k-body)!important;font-size:20px!important;font-weight:700!important;
  line-height:1.05em!important;letter-spacing:0!important;color:var(--k-ink)!important;margin:22px 0 0;
}
.kcr-share{
  display:inline-flex;align-items:center;gap:14px;margin:24px 0 0;
  background:#fff;border-radius:8px;padding:12px 20px;
}
.kcr-sharelabel{
  font-family:var(--k-body)!important;font-size:15px!important;font-weight:400!important;
  letter-spacing:0!important;color:var(--k-ink)!important;
}
.kcr-shareicons{display:inline-flex;gap:12px;}
.kcr-shareicons a{color:#3D985C!important;display:inline-flex;}

.kcr-list{max-width:1020px;margin:0 auto;padding:44px 20px 84px;
  display:flex;flex-direction:column;align-items:center;gap:27px;}
.kcr-card{
  width:100%;max-width:630px;min-height:102px;border-radius:10px;background:#fff;
  box-shadow:0 3px 14px rgba(16,14,14,.08);
  display:flex;align-items:center;justify-content:space-between;gap:24px;
  padding:24px 39px;
}
.kcr-cardtxt{min-width:0;}
.kcr-title{
  font-family:var(--k-sans)!important;font-size:18px!important;font-weight:500!important;
  line-height:1.4em!important;letter-spacing:-.05em!important;color:var(--k-ink)!important;margin:0;
}
.kcr-loc{
  font-family:var(--k-body)!important;font-size:15px!important;font-weight:400!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--k-ink)!important;margin:4px 0 0;
}
.kcr-view{
  flex:none;display:inline-flex;align-items:center;justify-content:center;
  width:115px;height:42px;border-radius:10px;background:var(--k-green);
  color:#fff!important;text-decoration:none;
  font-family:var(--k-body)!important;font-size:14px;font-weight:400;letter-spacing:0!important;
  transition:background-color .2s ease;
}
.kcr-view:hover{background:var(--k-green-hover);}

.kcr-state,.kcr-note{
  font-family:var(--k-body)!important;font-size:14px!important;letter-spacing:0!important;
  color:#5B5757!important;text-align:center;margin:0;
}

@media (max-width:640px){
  .kcr-card{flex-direction:column;align-items:flex-start;padding:20px 22px;}
  .kcr-view{width:100%;}
  .kcr-p{font-size:15px!important;}
}
`;

const TeamIcon = () => (
  <svg viewBox="0 0 48 40" width="48" height="40" fill="none" stroke="#3D985C"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
    <circle cx="24" cy="10" r="6" /><path d="M13 30c0-6.1 4.9-10 11-10s11 3.9 11 10" />
    <circle cx="9" cy="15" r="4.5" /><path d="M1 31c0-4.6 3.6-7.5 8-7.5" />
    <circle cx="39" cy="15" r="4.5" /><path d="M47 31c0-4.6-3.6-7.5-8-7.5" />
  </svg>
);

const ShareIcons = () => (
  <span className="kcr-shareicons">
    <a href="#" aria-label="Share on WhatsApp">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <path d="M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3.5 20.5l1.6-5.1A8.4 8.4 0 1 1 21 11.5z" />
      </svg>
    </a>
    <a href="#" aria-label="Share on LinkedIn">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
        <path d="M4.5 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM3 9h3v12H3zM9 9h2.9v1.7c.5-.9 1.7-1.9 3.5-1.9 3 0 3.6 1.9 3.6 4.5V21h-3v-6c0-1.5-.3-2.6-1.8-2.6s-2.2 1-2.2 2.5V21H9z" />
      </svg>
    </a>
    <a href="#" aria-label="Copy link">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <path d="M10 13a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 0 0-5.7-5.7L11.2 6" />
        <path d="M14 11a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 0 0 5.7 5.7L12.8 18" />
      </svg>
    </a>
  </span>
);

export default function CareersListing() {
  const [jobs, setJobs] = useState(null);
  const [usingSample, setUsingSample] = useState(false);

  useEffect(() => {
    let off = false;
    (async () => {
      const rows = await careerApi.list();
      if (off) return;
      if (rows.length) { setJobs(rows); setUsingSample(false); }
      else { setJobs(CAREER_SAMPLE_JOBS); setUsingSample(true); }
    })();
    return () => { off = true; };
  }, []);

  return (
    <main className="kcr">
      <style dangerouslySetInnerHTML={{ __html: CAREERS_CSS }} />

      <section className="kcr-band">
        <div className="kcr-bandin">
          <span className="kcr-icon"><TeamIcon /></span>
          <p className="kcr-p">
            At Koott, we’re building more than a mental health platform. We’re building a space
            where people feel understood, supported, and valued. As Kerala’s first mental health
            platform, our work is rooted in empathy and real human connection.
          </p>
          <p className="kcr-p">
            When you join Koott, you don’t just grow in your role—you grow as a person. With
            continuous training, learning opportunities, and real-world exposure, we invest in your
            personal and professional development every step of the way. You’ll be part of a team
            that believes care starts from within, and growth is something we build together.
          </p>
          <p className="kcr-join">Join us.</p>

          <span className="kcr-share">
            <span className="kcr-sharelabel">Share this job with your network:</span>
            <ShareIcons />
          </span>
        </div>
      </section>

      <section className="kcr-list">
        {jobs === null && <p className="kcr-state">Loading openings…</p>}

        {jobs !== null && jobs.length === 0 && (
          <p className="kcr-state">No openings right now — do check back.</p>
        )}

        {(jobs || []).map((j) => (
          <article key={j.id || j.slug} className="kcr-card">
            <div className="kcr-cardtxt">
              <h2 className="kcr-title">{j.title}</h2>
              <p className="kcr-loc">{j.location || 'Remote'}</p>
            </div>
            <a href={`/career/${j.slug}`} className="kcr-view">View Job</a>
          </article>
        ))}

        {usingSample && (
          <p className="kcr-note">
            Showing sample openings — these are replaced automatically once the CMS has
            published roles.
          </p>
        )}
      </section>
    </main>
  );
}
