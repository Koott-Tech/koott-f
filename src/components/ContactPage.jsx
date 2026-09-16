'use client';

/**
 * ContactPage — port of koott.in/get-in-touch.
 *
 * Measured off the live page:
 *   banner        full-bleed photo, 375 tall
 *   book bar      "Looking to book a session?" work-sans 20/400 #242323 + outlined pill
 *   left panel    grey card — "WHY PEOPLE TALK?" work-sans 20/400, body avenir 15/400,
 *                 three icon rows, contact values avenir 15/700, social row
 *   form heading  work-sans 22/400, 1.4em, -0.05em, #404041
 *   field label   avenir 15/400, #373B4D
 *   input         230x50, radius 20, bg #F2FCF7, border 0.8px #EFEFF4, 34px gutter
 *   textarea      499x145, radius 20
 *   submit        green pill, 13px label
 *
 * The form posts to /api/contact. That route relays by email when RESEND_API_KEY
 * is configured and otherwise reports that delivery is not set up, so a
 * submission never silently disappears.
 */

import { useState } from 'react';
import CustomSelect from '@/components/CustomSelect';

const BANNER = 'https://static.wixstatic.com/media/11062b_4d7e8926f2754d96b1473dda3a8f8171~mv2.jpg';

const REASONS = ['General enquiry', 'Book a session', 'Careers', 'Partnership', 'Feedback'];
const POSITIONS = ['Not applicable', 'Psychologist', 'Psychiatrist', 'Intern', 'Operations', 'Engineering', 'Marketing'];

const MAX_UPLOAD_MB = 15;

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', reason: '', position: '', message: '',
  });
  const [file, setFile] = useState(null);
  const [state, setState] = useState({ status: 'idle', note: '' });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onFile = (e) => {
    const f = e.target.files?.[0] || null;
    if (f && f.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setState({ status: 'error', note: `That file is over ${MAX_UPLOAD_MB}MB. Please attach a smaller one.` });
      e.target.value = '';
      return;
    }
    setFile(f);
    setState({ status: 'idle', note: '' });
  };

  async function onSubmit(e) {
    e.preventDefault();
    setState({ status: 'sending', note: '' });
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fileName: file?.name || null }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setState({ status: 'sent', note: 'Thanks — we’ll get back to you shortly.' });
        setForm({ name: '', phone: '', email: '', reason: '', position: '', message: '' });
        setFile(null);
      } else {
        setState({
          status: 'error',
          note: json.message || 'We couldn’t send that just now. Please email admin@koott.in.',
        });
      }
    } catch {
      setState({ status: 'error', note: 'Network problem. Please email admin@koott.in.' });
    }
  }

  return (
    <main className="kct2">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <img className="kct2-banner" src={BANNER} alt="" aria-hidden />

      <div className="kct2-bookbar">
        <div className="kct2-bookin">
          <span className="kct2-booktext">Looking to book a session?</span>
          <a href="/book-malayali-psychologists" className="kct2-bookbtn">
            Book a Therapist
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#3D985C"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="2" y="6" width="14" height="12" rx="2.5" />
              <path d="M16 10l6-3v10l-6-3z" />
            </svg>
          </a>
        </div>
      </div>

      <div className="kct2-in kct2-split">
        {/* ── Why people talk ─────────────────────────────────────────── */}
        <aside className="kct2-aside">
          <h2 className="kct2-asideh">WHY PEOPLE TALK?</h2>
          <p className="kct2-asidep">
            We talk to survive, Form social bonds, help others, manage how others perceive and
            there are definitely more, Let’s talk!
          </p>

          <div className="kct2-ways">
            <div className="kct2-way">
              <span className="kct2-wayicon" aria-hidden>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#3D985C" strokeWidth="1.6">
                  <rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M3 7l9 6 9-6" />
                </svg>
              </span>
              <div>
                <p className="kct2-wayt">Like to write ?<br />We would love to read!</p>
                <a className="kct2-wayv" href="mailto:admin@koott.in">admin@koott.in</a>
                <a className="kct2-wayv" href="mailto:hr@koott.in">hr@koott.in</a>
              </div>
            </div>

            <div className="kct2-way">
              <span className="kct2-wayicon" aria-hidden>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#3D985C" strokeWidth="1.6">
                  <path d="M4 4h4l2 5-2.5 1.5a12 12 0 0 0 6 6L15 14l5 2v4a1.5 1.5 0 0 1-1.7 1.5A17 17 0 0 1 2.5 5.7 1.5 1.5 0 0 1 4 4z" />
                </svg>
              </span>
              <div>
                <p className="kct2-wayt">Need to talk ?<br />Talk to the team!</p>
                <a className="kct2-wayv" href="tel:+919567161611">+91 95671 61611</a>
              </div>
            </div>

            <div className="kct2-way">
              <span className="kct2-wayicon" aria-hidden>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#3D985C" strokeWidth="1.6">
                  <path d="M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3.5 20.5l1.6-5.1A8.4 8.4 0 1 1 21 11.5z" />
                </svg>
              </span>
              <div>
                <p className="kct2-wayt">Love text ?<br />Lets get connected WhatsApp</p>
                <a className="kct2-wayv" href="https://wa.me/918606040400">+91 86060 40400</a>
              </div>
            </div>
          </div>

          <h3 className="kct2-asideh kct2-asideh--sm">Follow us on social media</h3>
          <div className="kct2-social">
            {['Facebook', 'Instagram', 'Twitter', 'LinkedIn'].map((n) => (
              <a key={n} href="#" aria-label={n} className="kct2-soc">
                <span aria-hidden>{n[0]}</span>
              </a>
            ))}
          </div>
        </aside>

        {/* ── Form ────────────────────────────────────────────────────── */}
        <section className="kct2-card">
          <h2 className="kct2-formh">We will be happy to get back to you.</h2>

          <form className="kct2-form" onSubmit={onSubmit}>
            <div className="kct2-field">
              <label className="kct2-label" htmlFor="c-name">Name *</label>
              <input id="c-name" className="kct2-input" required value={form.name} onChange={set('name')} />
            </div>
            <div className="kct2-field">
              <label className="kct2-label" htmlFor="c-phone">Phone *</label>
              <input id="c-phone" className="kct2-input" type="tel" required value={form.phone} onChange={set('phone')} />
            </div>

            <div className="kct2-field">
              <label className="kct2-label" htmlFor="c-email">Email *</label>
              <input id="c-email" className="kct2-input" type="email" required value={form.email} onChange={set('email')} />
            </div>
            <div className="kct2-field">
              <label className="kct2-label" htmlFor="c-reason">Choose an option *</label>
              <CustomSelect id="c-reason" className="kct2-input kct2-select" required value={form.reason} onChange={set('reason')}
                placeholder="Select a reason" options={REASONS} />
            </div>

            <div className="kct2-field">
              <label className="kct2-label" htmlFor="c-position">Position (If Career)</label>
              <CustomSelect id="c-position" className="kct2-input kct2-select" value={form.position} onChange={set('position')}
                placeholder="Select a position" options={POSITIONS} />
            </div>
            <div className="kct2-field">
              <label className="kct2-label kct2-label--hidden" htmlFor="c-file">Attachment</label>
              <label className="kct2-upload" htmlFor="c-file">
                <span>{file ? file.name : 'Upload File'}</span>
                <span className="kct2-plus" aria-hidden>+</span>
              </label>
              <input id="c-file" className="kct2-filein" type="file" onChange={onFile} />
              <span className="kct2-hint">Upload supported file (Max {MAX_UPLOAD_MB}MB)</span>
            </div>

            <div className="kct2-field kct2-field--full">
              <label className="kct2-label" htmlFor="c-msg">Message (Cover Letter) *</label>
              <textarea id="c-msg" className="kct2-input kct2-textarea" required value={form.message} onChange={set('message')} />
            </div>

            <div className="kct2-field kct2-field--full kct2-submitrow">
              {state.note && (
                <p className={`kct2-note ${state.status === 'error' ? 'is-error' : 'is-ok'}`} role="status">
                  {state.note}
                </p>
              )}
              <button type="submit" className="kct2-submit" disabled={state.status === 'sending'}>
                {state.status === 'sending' ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

/* Scoped to .kct2 and !important throughout, because globals.css (marked
   "never edit") forces DM Sans on headings, Work Sans / 16px on p, and
   letter-spacing on span, a and button. */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;500;600;700&family=Work+Sans:wght@400;500;700&display=swap');

.kct2{
  --k-ink:#100E0E;
  --k-head:#242323;
  --k-formh:#404041;
  --k-label:#373B4D;
  --k-accent:#3D985C;
  --k-green:#4FAB69;
  --k-green-hover:#025545;
  --k-fill:#F2FCF7;
  --k-line:#EFEFF4;
  --k-sans:'Work Sans',ui-sans-serif,system-ui,sans-serif;
  --k-body:'Mulish','Avenir Light','Avenir Next','Avenir',ui-sans-serif,system-ui,sans-serif;
  padding-top:64px;               /* Header.jsx is fixed and h-16 */
  display:block;background:#fff;color:var(--k-ink);font-family:var(--k-body)!important;
}
.kct2 *{box-sizing:border-box;}
.kct2-banner{display:block;width:100%;height:375px;object-fit:cover;}

.kct2-bookbar{background:#FAFAFA;}
.kct2-bookin{
  max-width:1020px;margin:0 auto;padding:22px 20px;
  display:flex;align-items:center;justify-content:center;gap:28px;flex-wrap:wrap;
}
.kct2-booktext{
  font-family:var(--k-sans)!important;font-size:20px!important;font-weight:400!important;
  letter-spacing:0!important;color:var(--k-head)!important;
}
.kct2-bookbtn{
  display:inline-flex;align-items:center;gap:9px;min-height:38px;padding:0 20px;
  border:1px solid rgba(61,152,92,.5);border-radius:19px;background:#fff;
  font-family:var(--k-body)!important;font-size:12px;font-weight:400;
  letter-spacing:.1em!important;text-transform:uppercase;
  color:#493D3D!important;text-decoration:none;white-space:nowrap;
  transition:background-color .2s ease,border-color .2s ease;
}
.kct2-bookbtn:hover{border-color:var(--k-accent);background:#F5FFF6;}

.kct2-in{max-width:1020px;margin:0 auto;padding:0 20px;}
.kct2-split{display:grid;grid-template-columns:300px 1fr;gap:40px;align-items:start;padding-top:52px;padding-bottom:80px;}

/* left panel */
.kct2-aside{background:#F2F2F2;padding:34px 30px;}
.kct2-asideh{
  font-family:var(--k-sans)!important;font-size:20px!important;font-weight:400!important;
  line-height:1.3em!important;letter-spacing:0!important;color:var(--k-head)!important;margin:0;
}
.kct2-asideh--sm{margin-top:34px;}
.kct2-asidep{
  font-family:var(--k-body)!important;font-size:15px!important;font-weight:400!important;
  line-height:1.45em!important;letter-spacing:0!important;color:var(--k-ink)!important;margin:14px 0 0;
}
.kct2-ways{display:flex;flex-direction:column;gap:26px;margin:28px 0 0;}
.kct2-way{display:flex;align-items:flex-start;gap:14px;}
.kct2-wayicon{flex:none;display:flex;align-items:center;justify-content:center;width:34px;height:34px;}
.kct2-wayt{
  font-family:var(--k-body)!important;font-size:14px!important;font-weight:400!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--k-ink)!important;margin:0 0 8px;
}
.kct2-wayv{
  display:block;font-family:var(--k-body)!important;font-size:15px!important;font-weight:700!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--k-ink)!important;text-decoration:none;
  /* 21px tall before; a phone needs a bigger target for a tap-to-call link */
  padding:6px 0;
}
.kct2-wayv:hover{color:var(--k-accent)!important;}
.kct2-social{display:flex;gap:14px;margin:16px 0 0;}
.kct2-soc{
  width:30px;height:30px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;
  background:#fff;color:#5B5757!important;text-decoration:none;
  font-family:var(--k-sans)!important;font-size:13px;letter-spacing:0!important;
}
.kct2-soc:hover{color:var(--k-accent)!important;}

/* form card */
.kct2-card{border:1px solid var(--k-line);background:#fff;padding:38px 40px 44px;}
.kct2-formh{
  font-family:var(--k-sans)!important;font-size:22px!important;font-weight:400!important;
  line-height:1.4em!important;letter-spacing:-.05em!important;color:var(--k-formh)!important;margin:0 0 26px;
}
.kct2-form{display:grid;grid-template-columns:repeat(2,1fr);gap:22px 34px;}
.kct2-field{display:flex;flex-direction:column;min-width:0;}
.kct2-field--full{grid-column:1 / -1;}
.kct2-label{
  font-family:var(--k-body)!important;font-size:15px!important;font-weight:400!important;
  line-height:1em!important;letter-spacing:0!important;color:var(--k-label)!important;margin-bottom:8px;
}
.kct2-label--hidden{visibility:hidden;}
.kct2-input{
  width:100%;height:50px;padding:0 18px;border-radius:20px;
  background:var(--k-fill);border:1px solid var(--k-line);
  font-family:var(--k-body)!important;font-size:15px;color:var(--k-ink);
  transition:border-color .2s ease,box-shadow .2s ease;
}
.kct2-input:focus{outline:none;border-color:var(--k-accent);box-shadow:0 0 0 3px rgba(61,152,92,.15);}
.kct2-select{
  appearance:none;cursor:pointer;
  background-image:url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%23404041' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 18px center;background-size:11px;
}
.kct2-textarea{height:145px;padding:16px 18px;resize:vertical;line-height:1.5em;}
.kct2-upload{
  display:flex;align-items:center;justify-content:center;gap:10px;
  height:50px;border-radius:20px;background:var(--k-fill);border:1px solid var(--k-line);
  cursor:pointer;font-family:var(--k-body)!important;font-size:15px;color:var(--k-ink);
  overflow:hidden;white-space:nowrap;padding:0 18px;
}
.kct2-upload:hover{border-color:var(--k-accent);}
.kct2-plus{font-size:18px;line-height:1;}
.kct2-filein{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;}
.kct2-hint{
  font-family:var(--k-body)!important;font-size:12px!important;letter-spacing:0!important;
  color:#8B8B8B!important;margin-top:6px;
}

.kct2-submitrow{align-items:center;}
.kct2-submit{
  min-width:186px;height:46px;border:0;border-radius:23px;cursor:pointer;
  background:var(--k-green);color:#fff;
  font-family:var(--k-body)!important;font-size:13px;font-weight:400;
  letter-spacing:.1em!important;text-transform:uppercase;
  transition:background-color .2s ease;
}
.kct2-submit:hover:not(:disabled){background:var(--k-green-hover);}
.kct2-submit:disabled{opacity:.6;cursor:default;}
.kct2-note{
  font-family:var(--k-body)!important;font-size:14px!important;letter-spacing:0!important;
  margin:0 0 14px;text-align:center;
}
.kct2-note.is-ok{color:var(--k-accent)!important;}
.kct2-note.is-error{color:#B3261E!important;}

@media (max-width:900px){
  .kct2-split{grid-template-columns:1fr;gap:28px;}
  .kct2-banner{height:240px;}
}
@media (max-width:640px){
  .kct2-form{grid-template-columns:1fr;}
  .kct2-card{padding:26px 20px 32px;}
  .kct2-booktext{font-size:17px!important;}
  .kct2-submit{width:100%;}
}
`;
