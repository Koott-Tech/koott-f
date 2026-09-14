'use client';

/**
 * TherapistCard — the therapist card used on the condition-page template and on
 * the /book-malayali-psychologists listing.
 *
 * Measured off the live page koott.in/book-malayali-psychologists:
 *   card    480x394, 1px #DFFFD2 border at radius 8, 10px padding
 *   photo   128x150 at radius 15
 *   name    Work Sans 20/400 #262222 · role Avenir 15/700
 *   book    121x40 at radius 10, #4FAB69
 * The tinted panel behind the bio and footer follows the Koott design comps.
 *
 * Self-contained on purpose: it declares its own custom properties on .ktc so it
 * renders identically inside .kct (the condition template) or on a bare page.
 * `availability` is optional — the public list endpoint does not return it, and
 * the footer collapses to just the button when it is absent.
 */

const ModeIcon = ({ name }) =>
  name === 'audio' ? (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#29653D" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v4" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#29653D" strokeWidth="1.9"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <rect x="2" y="7" width="13" height="10" rx="2.5" />
      <path d="M15 11l6-3v8l-6-3z" />
    </svg>
  );

/* viewBox padded 4 units per side so the circle's edge is not shaved at 13px. */
const ARROW = { vb: '16 16 168 168', d: 'M100 20c-44.184 0-80 35.817-80 80.001C20 144.184 55.817 180 100 180s80-35.817 80-79.999S144.183 20 100 20zm28.726 82.946l-4.492 4.492-33.758 33.758a4.164 4.164 0 0 1-5.89 0l-1.547-1.547a4.167 4.167 0 0 1 0-5.891l30.812-30.812a4.165 4.165 0 0 0 0-5.891L83.038 66.243a4.167 4.167 0 0 1 0-5.891l1.547-1.547a4.164 4.164 0 0 1 5.89 0l33.758 33.758 4.492 4.492a4.164 4.164 0 0 1 .001 5.891z' };

export default function TherapistCard({ t, profileHref, bookHref }) {
  const href = profileHref ?? t.profileHref ?? '#';
  const book = bookHref ?? t.bookHref ?? href;

  return (
    <article className="ktc">
      <div className="ktc-head">
        <a href={href} className="ktc-photo">
          {t.photo && <img src={t.photo} alt={t.name} loading="lazy" />}
          <span className="ktc-view">
            VIEW PROFILE
            <svg viewBox={ARROW.vb} width="13" height="13" aria-hidden focusable="false">
              <path d={ARROW.d} fill="#FFFFFF" />
            </svg>
          </span>
        </a>

        <div className="ktc-meta">
          <div className="ktc-topline">
            <div>
              <h3 className="ktc-name">{t.name}</h3>
              {t.role && <p className="ktc-role">{t.role}</p>}
            </div>
            {t.modes?.length > 0 && (
              <div className="ktc-modes">
                {t.modes.map((m) => (
                  <span key={m} className="ktc-mode" title={`${m} session`}>
                    <ModeIcon name={m} />
                  </span>
                ))}
              </div>
            )}
          </div>

          {t.experience && <p className="ktc-exp">{t.experience}</p>}
          {t.languages && <p className="ktc-line">{t.languages}</p>}
          {t.priceFrom && <p className="ktc-line">{t.priceFrom}</p>}
        </div>
      </div>

      <div className="ktc-panel">
        {t.bio && <p className="ktc-bio">{t.bio}</p>}
        <div className="ktc-foot">
          {t.availability ? (
            <div>
              <p className="ktc-avail-label">{t.availabilityLabel || 'Next Availability'}</p>
              <p className="ktc-avail">{t.availability}</p>
            </div>
          ) : <span />}
          <a href={book} className="ktc-book">Book Now</a>
        </div>
      </div>
    </article>
  );
}

export const THERAPIST_CARD_CSS = `
.ktc{
  --ktc-ink:#100E0E;
  --ktc-green:#4FAB69;
  --ktc-green-hover:#025545;
  --ktc-accent:#3D985C;
  --ktc-deep2:#29653D;
  --ktc-band:linear-gradient(180deg,#F0FFEC 0%,#D4FFC2 100%);
  --ktc-sans:'Work Sans',ui-sans-serif,system-ui,sans-serif;
  --ktc-body:'Mulish','Avenir Light','Avenir Next','Avenir',ui-sans-serif,system-ui,sans-serif;
  display:flex;flex-direction:column;background:#fff;
  border:1px solid #DFFFD2;border-radius:8px;padding:10px;
}
.ktc *{box-sizing:border-box;}
.ktc-head{display:flex;gap:14px;align-items:flex-start;}

.ktc-photo{
  position:relative;flex:none;width:128px;height:150px;
  border-radius:15px;background:var(--ktc-band);overflow:hidden;display:block;
}
.ktc-photo img{width:100%;height:100%;object-fit:cover;display:block;}
.ktc-view{
  position:absolute;left:50%;bottom:10px;transform:translateX(-50%);
  display:inline-flex;align-items:center;gap:5px;white-space:nowrap;
  padding:5px 9px;border-radius:999px;background:var(--ktc-accent);
  font-family:var(--ktc-sans)!important;font-size:8px;font-weight:500;
  letter-spacing:.04em;color:#fff!important;text-decoration:none;
}
.ktc-photo:hover .ktc-view{background:var(--ktc-green-hover);}

.ktc-meta{flex:1;min-width:0;}
.ktc-topline{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
.ktc-modes{display:flex;gap:3px;flex:none;}
.ktc-mode{
  width:25px;height:25px;border-radius:50%;display:inline-flex;
  align-items:center;justify-content:center;
  border:1px solid rgba(61,152,92,.5);background:#fff;
}
.ktc-name{
  font-family:var(--ktc-sans)!important;font-size:20px!important;font-weight:400!important;
  line-height:1.2em!important;letter-spacing:0!important;color:#262222!important;margin:0;
}
.ktc-role{
  font-family:var(--ktc-body)!important;font-size:15px!important;font-weight:700!important;
  line-height:1.2em!important;letter-spacing:0!important;color:#262222!important;margin:6px 0 0;
}
.ktc-exp{
  font-family:var(--ktc-body)!important;font-size:15px!important;font-weight:700!important;
  line-height:1.2em!important;letter-spacing:0!important;color:var(--ktc-ink)!important;margin:24px 0 0;
}
.ktc-line{
  font-family:var(--ktc-body)!important;font-size:15px!important;font-weight:400!important;
  line-height:1.4em!important;letter-spacing:0!important;color:var(--ktc-ink)!important;margin:7px 0 0;
}

.ktc-panel{
  display:flex;flex-direction:column;flex:1;
  margin:18px 0 0;padding:16px 18px;border-radius:10px;background:var(--ktc-band);
}
.ktc-bio{
  font-family:var(--ktc-body)!important;font-size:14px!important;font-weight:400!important;
  line-height:1.48em!important;letter-spacing:0!important;color:#262222!important;margin:0;
}
.ktc-foot{
  display:flex;align-items:flex-end;justify-content:space-between;gap:16px;
  margin-top:auto;padding-top:24px;
}
.ktc-avail-label{
  font-family:var(--ktc-body)!important;font-size:14px!important;font-weight:400!important;
  line-height:1.2em!important;letter-spacing:0!important;color:var(--ktc-ink)!important;margin:0;
}
.ktc-avail{
  font-family:var(--ktc-body)!important;font-size:15px!important;font-weight:700!important;
  line-height:1.2em!important;letter-spacing:0!important;color:#399F5F!important;margin:4px 0 0;
}
.ktc-book{
  flex:none;display:inline-flex;align-items:center;justify-content:center;
  width:121px;height:40px;border-radius:10px;
  background:var(--ktc-green);color:#fff!important;text-decoration:none;
  font-family:var(--ktc-sans)!important;font-size:15px;font-weight:400;
  transition:background-color .2s ease;
}
.ktc-book:hover{background:var(--ktc-green-hover);}

@media (max-width:560px){
  .ktc-panel{margin:14px 0 0;padding:14px 15px;}
  .ktc-foot{flex-direction:column;align-items:stretch;gap:12px;}
  .ktc-book{width:100%;}
}
`;
