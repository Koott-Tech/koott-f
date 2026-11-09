'use client';

/**
 * CareerDetail — port of a koott.in/jobs/<slug> page.
 *
 * Live structure: "< Back", the role title, an Apply Now button, a "Job Type"
 * block listing location and employment type, the share row, then the body —
 * "About the Role", a numbered "Responsibilities" list and "Requirements".
 *
 * CMS-driven: reads /api/careers (by slug, falling back to a list scan) and uses
 * data/careerSampleData.js only while the CMS has no matching role.
 */

import { useEffect, useState } from 'react';
import { careerApi } from '@/lib/careerApi';
import { CAREER_SAMPLE_JOBS } from '@/data/careerSampleData';

/** Render the markdown-ish `description`: "## " heading, "1. "/"- " list items. */
function renderBody(text) {
  const blocks = [];
  let list = null;
  let ordered = false;

  const flush = (key) => {
    if (list && list.length) {
      blocks.push(ordered
        ? <ol key={`l-${key}`} className="kcd-ol">{list}</ol>
        : <ul key={`l-${key}`} className="kcd-ul">{list}</ul>);
    }
    list = null;
  };

  String(text || '').split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line) { flush(i); return; }

    const num = line.match(/^(\d+)\.\s+(.*)$/);
    if (num) {
      if (list && !ordered) flush(i);
      ordered = true; list = list || [];
      list.push(<li key={i}>{num[2]}</li>);
      return;
    }
    if (line.startsWith('- ')) {
      if (list && ordered) flush(i);
      ordered = false; list = list || [];
      list.push(<li key={i}>{line.slice(2)}</li>);
      return;
    }
    flush(i);
    if (line.startsWith('## ')) blocks.push(<h2 key={i} className="kcd-h2">{line.slice(3)}</h2>);
    else blocks.push(<p key={i} className="kcd-p">{line}</p>);
  });
  flush('end');
  return blocks;
}

/**
 * Apply form: lands in HR → Applications (backend POST /careers/slug/:slug/apply) and
 * creates a "Review the application" task for the HR team. Sample roles (no CMS row)
 * keep the contact page.
 */
function ApplyForm({ slug, title, onClose }) {
  const [f, setF] = useState({ name: '', email: '', phone: '', resume_url: '', linkedin_url: '', cover_note: '' });
  const [state, setState] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setState('sending');
    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/+$/, '');
      const res = await fetch(`${base}/careers/slug/${encodeURIComponent(slug)}/apply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) throw new Error(json.message || 'Could not send your application.');
      setState('sent');
    } catch (err) { setState(err.message); }
  };
  return (
    <div className="kcd-modal" role="dialog" aria-modal="true" aria-labelledby="kcd-apply-h">
      <div className="kcd-scrim" onClick={onClose} aria-hidden />
      <form className="kcd-form" onSubmit={submit}>
        <div className="kcd-form-top"><span id="kcd-apply-h" className="kcd-form-h">Apply — {title}</span><button type="button" className="kcd-x" onClick={onClose} aria-label="Close">✕</button></div>
        {state === 'sent' ? (
          <div className="kcd-sent">Thank you — we have your application. Our team will get back to you by email.</div>
        ) : (
          <>
            <input required placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input required type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <input placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            <input type="url" placeholder="Link to your résumé (Google Drive, Dropbox…)" value={f.resume_url} onChange={(e) => setF({ ...f, resume_url: e.target.value })} />
            <input type="url" placeholder="LinkedIn profile (optional)" value={f.linkedin_url} onChange={(e) => setF({ ...f, linkedin_url: e.target.value })} />
            <textarea rows={4} placeholder="A few lines about you (optional)" value={f.cover_note} onChange={(e) => setF({ ...f, cover_note: e.target.value })} />
            {state && state !== 'sending' && <div className="kcd-err">{state}</div>}
            <button type="submit" className="kcd-apply" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send application'}</button>
          </>
        )}
      </form>
    </div>
  );
}

export default function CareerDetail({ slug }) {
  const [job, setJob] = useState(undefined); // undefined = loading, null = missing
  const [usingSample, setUsingSample] = useState(false);
  const [applying, setApplying] = useState(false);
  const applyBtn = usingSample
    ? <a href="/get-in-touch" className="kcd-apply">Apply Now</a>
    : <button type="button" className="kcd-apply" onClick={() => setApplying(true)}>Apply Now</button>;

  useEffect(() => {
    let off = false;
    (async () => {
      const found = await careerApi.bySlug(slug);
      if (off) return;
      if (found) { setJob(found); setUsingSample(false); return; }
      const sample = CAREER_SAMPLE_JOBS.find((j) => j.slug === slug);
      setJob(sample || null);
      setUsingSample(Boolean(sample));
    })();
    return () => { off = true; };
  }, [slug]);

  return (
    <main className="kcd">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="kcd-in">
        <a className="kcd-back" href="/career">‹ Back</a>

        {job === undefined && <p className="kcd-state">Loading…</p>}

        {job === null && (
          <div className="kcd-state">
            <p>We couldn’t find that role.</p>
            <p><a className="kcd-link" href="/career">See all openings</a></p>
          </div>
        )}

        {job && (
          <>
            <div className="kcd-head">
              <h1 className="kcd-title">{job.title}</h1>
              {applyBtn}
            </div>

            <section className="kcd-type">
              <h2 className="kcd-h3">Job Type</h2>
              <div className="kcd-chips">
                {job.location && <span className="kcd-chip">{job.location}</span>}
                {job.employment_type && <span className="kcd-chip">{job.employment_type}</span>}
                {(job.min_experience_years || job.max_experience_years) && (
                  <span className="kcd-chip">
                    {job.min_experience_years ?? 0}
                    {job.max_experience_years ? `–${job.max_experience_years}` : '+'} yrs
                  </span>
                )}
              </div>
            </section>

            <div className="kcd-body">{renderBody(job.description)}</div>

            {usingSample && (
              <p className="kcd-note">
                This is a sample role — it is replaced automatically once the CMS has a
                published opening at this slug.
              </p>
            )}

            <div className="kcd-applyrow">{applyBtn}</div>
            {applying && <ApplyForm slug={slug} title={job.title} onClose={() => setApplying(false)} />}
          </>
        )}
      </div>
    </main>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');

.kcd{
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
.kcd *{box-sizing:border-box;}
.kcd-in{max-width:820px;margin:0 auto;padding:36px 20px 88px;}

.kcd-back{
  font-family:var(--k-body)!important;font-size:15px!important;letter-spacing:0!important;
  color:var(--k-accent)!important;text-decoration:none;
}
.kcd-back:hover{text-decoration:underline;}

.kcd-head{
  display:flex;align-items:center;justify-content:space-between;gap:24px;
  flex-wrap:wrap;margin:22px 0 0;
}
.kcd-title{
  font-family:var(--k-sans)!important;font-size:30px!important;font-weight:500!important;
  line-height:1.3em!important;letter-spacing:-.05em!important;color:var(--k-ink)!important;margin:0;
}
.kcd-apply{
  flex:none;display:inline-flex;align-items:center;justify-content:center;
  min-width:130px;height:42px;padding:0 22px;border-radius:10px;background:var(--k-green);
  color:#fff!important;text-decoration:none;
  font-family:var(--k-body)!important;font-size:14px;font-weight:400;letter-spacing:0!important;
  transition:background-color .2s ease;
}
.kcd-apply:hover{background:var(--k-green-hover);}

.kcd-type{margin:30px 0 0;padding:22px 0;border-top:1px solid var(--k-line);border-bottom:1px solid var(--k-line);}
.kcd-h3{
  font-family:var(--k-sans)!important;font-size:18px!important;font-weight:500!important;
  line-height:1.4em!important;letter-spacing:-.05em!important;color:var(--k-ink)!important;margin:0 0 12px;
}
.kcd-chips{display:flex;flex-wrap:wrap;gap:10px;}
.kcd-chip{
  display:inline-flex;align-items:center;height:32px;padding:0 14px;border-radius:16px;
  background:#F2FCF7;border:1px solid rgba(61,152,92,.35);
  font-family:var(--k-body)!important;font-size:14px!important;letter-spacing:0!important;
  color:#29653D!important;
}

.kcd-body{margin:32px 0 0;}
.kcd-h2{
  font-family:var(--k-sans)!important;font-size:22px!important;font-weight:500!important;
  line-height:1.4em!important;letter-spacing:-.05em!important;color:var(--k-ink)!important;margin:34px 0 0;
}
.kcd-p{
  font-family:var(--k-body)!important;font-size:16px!important;font-weight:400!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--k-ink)!important;margin:16px 0 0;
}
.kcd-ol,.kcd-ul{margin:14px 0 0;padding-left:26px;}
.kcd-ol{list-style:decimal!important;}
.kcd-ul{list-style:disc!important;}
.kcd-ol li,.kcd-ul li{
  list-style:inherit!important;display:list-item!important;
  font-family:var(--k-body)!important;font-size:16px!important;font-weight:400!important;
  line-height:1.6em!important;letter-spacing:0!important;color:var(--k-ink)!important;margin:8px 0 0;
}

.kcd-applyrow{margin:38px 0 0;}
button.kcd-apply{border:0;cursor:pointer;font-family:inherit;}
.kcd-modal{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;}
.kcd-scrim{position:absolute;inset:0;background:rgba(16,14,14,.45);}
.kcd-form{position:relative;width:100%;max-width:480px;max-height:92vh;overflow:auto;background:#fff;border-radius:16px;padding:22px;display:flex;flex-direction:column;gap:10px;}
.kcd-form-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:4px;}
.kcd-form-h{font-family:'Poppins',sans-serif;font-size:18px;font-weight:600;color:var(--k-ink);}
.kcd-x{background:none;border:0;font-size:18px;color:#666;cursor:pointer;}
.kcd-form input,.kcd-form textarea{border:1px solid var(--k-line);border-radius:10px;padding:11px 12px;font-size:16px;font-family:'Inter',sans-serif;}
.kcd-form .kcd-apply{margin-top:6px;}
.kcd-err{color:#B42318;font-size:14px;}
.kcd-sent{font-family:'Inter',sans-serif;font-size:16px;color:var(--k-ink);padding:8px 0 4px;}
.kcd-state{
  font-family:var(--k-body)!important;font-size:16px!important;letter-spacing:0!important;
  color:#5B5757!important;text-align:center;margin:70px 0;
}
.kcd-link{color:var(--k-accent)!important;text-decoration:none;}
.kcd-note{
  font-family:var(--k-body)!important;font-size:14px!important;letter-spacing:0!important;
  color:#5B5757!important;margin:38px 0 0;padding-top:16px;border-top:1px solid var(--k-line);
}

@media (max-width:640px){
  .kcd-title{font-size:23px!important;}
  .kcd-apply{width:100%;}
  .kcd-h2{font-size:19px!important;}
}
`;
