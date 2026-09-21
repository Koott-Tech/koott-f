'use client';

/**
 * HomeHero — hero + category cards, rebuilt against a full-page screenshot of
 * koott.in plus its measured geometry.
 *
 * What the live page actually does:
 *   · the hero photo occupies the RIGHT half; the left is a warm cream ground
 *   · copy sits left: h1, a sub whose "#1" is green, two OUTLINED pill CTAs
 *     that each carry an icon (calendar / video)
 *   · social proof is a laurel wreath with five green stars and "Happy Clients"
 *     on the left, with the client quote beside it — not stacked
 *   · the four category items are WHITE ELEVATED CARDS with a grey figure icon,
 *     and they overlap the bottom edge of the hero photo
 *
 * Measured: h1 y=228 poppins 46/600 -0.05em · sub y=298 work-sans 18/500
 * · CTAs y=357 avenir 12/400 tracking 0.1em · proof y=574 quicksand 15
 * · card titles y=841 work-sans 16/700, subs y=865 avenir 15/400.
 */

const HERO_IMG = 'https://static.wixstatic.com/media/624142_bfbd7b8729794870ade5e7d9f2aa27aa~mv2.png';

const CATEGORIES = [
  { title: 'Individual', sub: 'Therapy for me', href: '/book-malayali-psychologists', icon: 'one' },
  { title: 'Teens', sub: 'For Ages 13-17', href: '/online-child-psychologist', icon: 'teen' },
  { title: 'Couples', sub: 'Therapy for us.', href: '/book-malayali-psychologists', icon: 'two' },
  { title: 'Assessment', sub: 'Instant Results.', href: '/assessments', icon: 'clip' },
];

/* Flat grey figures, matching the pictograms on the live cards. */
const FigureIcon = ({ name }) => {
  const p = { fill: '#8B8B8B', 'aria-hidden': true, focusable: 'false' };
  if (name === 'two') return (
    <svg viewBox="0 0 40 40" width="34" height="34" {...p}>
      <circle cx="14" cy="9" r="4" /><path d="M8 16h12v13h-3v10h-6V29H8z" />
      <circle cx="28" cy="10" r="3.4" /><path d="M23 17h10v11h-2.5v11h-5V28H23z" />
    </svg>
  );
  if (name === 'clip') return (
    <svg viewBox="0 0 40 40" width="34" height="34" {...p}>
      <circle cx="17" cy="9" r="4" /><path d="M11 16h12v13h-3v10h-6V29h-3z" />
      <rect x="26" y="12" width="10" height="13" rx="1.6" />
    </svg>
  );
  if (name === 'teen') return (
    <svg viewBox="0 0 40 40" width="34" height="34" {...p}>
      <circle cx="20" cy="10" r="4" /><path d="M14 17h12v12h-3.5v10h-5V29H14z" />
    </svg>
  );
  return (
    <svg viewBox="0 0 40 40" width="34" height="34" {...p}>
      <circle cx="20" cy="9" r="4.2" /><path d="M13.5 16h13v14h-4v9h-5v-9h-4z" />
    </svg>
  );
};

const Laurel = () => (
  <svg viewBox="0 0 132 84" width="168" height="100" aria-hidden focusable="false">
    <g fill="none" stroke="#6B6257" strokeWidth="1.3" strokeLinecap="round">
      <path d="M34 10C14 20 6 38 12 60c2 6 5 10 9 13" />
      <path d="M86 10c20 10 28 28 22 50-2 6-5 10-9 13" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={`l${i}`}>
          <path d={`M${20 - i * 1.5} ${22 + i * 10}c-7-4-12-3-15 1 3 5 9 6 15 1`} />
          <path d={`M${100 + i * 1.5} ${22 + i * 10}c7-4 12-3 15 1-3 5-9 6-15 1`} />
        </g>
      ))}
    </g>
  </svg>
);

export default function HomeHero() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <section className="khh" aria-label="Welcome">
        <img className="khh-photo" src={HERO_IMG} alt="" aria-hidden />

        <div className="khh-in">
          <div className="khh-copy">
            <h1 className="khh-h1">Hey, How are you?</h1>
            <p className="khh-sub">
              We got the <span className="khh-hl">#1</span> Malayali Psychologists for you!
            </p>

            <div className="khh-cta">
              <a href="/book-malayali-psychologists" className="khh-btn">
                View Instant Availability
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#3D985C"
                  strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <rect x="3" y="5" width="18" height="16" rx="2.5" />
                  <path d="M3 10h18M8 3v4M16 3v4" />
                </svg>
              </a>
              <a href="/book-malayali-psychologists" className="khh-btn">
                Book a Therapist
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#3D985C"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2" y="6" width="14" height="12" rx="2.5" />
                  <path d="M16 10l6-3v10l-6-3z" />
                </svg>
              </a>
            </div>

            <div className="khh-proof">
              <div className="khh-wreath">
                <Laurel />
                <span className="khh-stars" aria-hidden>★★★★★</span>
                <span className="khh-proof-label">Happy Clients</span>
              </div>
              <p className="khh-quote">
                ‘I would give 10 stars to Koott for being with me’
                <span className="khh-by">- Aylani Adam</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <nav className="khh-cats" aria-label="Choose a session type">
        <div className="khh-cats-in">
          {CATEGORIES.map((c) => (
            <a key={c.title} href={c.href} className="khh-card">
              <FigureIcon name={c.icon} />
              <span className="khh-card-t">{c.title}</span>
              <span className="khh-card-s">{c.sub}</span>
            </a>
          ))}
        </div>
      </nav>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');

.khh{
  --k-ink:#100E0E;
  --k-subink:#3E3936;
  --k-cta:#493D3D;
  --k-accent:#3D985C;
  --k-display:'Poppins',ui-sans-serif,system-ui,sans-serif;
  --k-sans:'Inter',ui-sans-serif,system-ui,sans-serif;
  --k-body:'Inter','Avenir Light','Avenir Next','Avenir',ui-sans-serif,system-ui,sans-serif;
  --k-quick:'Poppins',ui-sans-serif,system-ui,sans-serif;
  position:relative;display:block;height:791px;overflow:hidden;
  background:linear-gradient(90deg,#EFE8E0 0%,#EDE6DD 38%,#E9E4DA 55%,#DCE3D4 100%);
  font-family:var(--k-body)!important;
}
.khh *{box-sizing:border-box;}
/* The photo covers the right half; the left stays as the cream ground. */
.khh-photo{
  position:absolute;top:0;right:calc(50% - 570px);height:791px;width:660px;
  object-fit:cover;object-position:center top;z-index:0;
  -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 22%,#000 100%);
  mask-image:linear-gradient(90deg,transparent 0,#000 22%,#000 100%);
}
.khh-in{position:relative;z-index:1;max-width:980px;margin:0 auto;padding:0 20px;height:791px;}
.khh-copy{max-width:530px;padding-top:228px;}

.khh-h1{
  font-family:var(--k-display)!important;font-size:46px!important;font-weight:600!important;
  line-height:1.4em!important;letter-spacing:-.05em!important;color:var(--k-ink)!important;margin:0;
}
.khh-sub{
  font-family:var(--k-sans)!important;font-size:18px!important;font-weight:500!important;
  line-height:1.3em!important;letter-spacing:-.05em!important;color:var(--k-subink)!important;
  margin:12px 0 0;
}
.khh-hl{color:var(--k-accent)!important;font-weight:500!important;}

.khh-cta{display:flex;flex-wrap:nowrap;gap:14px;margin:30px 0 0;}
.khh-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:9px;
  min-height:36px;padding:0 18px;border-radius:18px;
  border:1px solid rgba(61,152,92,.5);background:transparent;
  font-family:var(--k-body)!important;font-size:12px;font-weight:400;
  letter-spacing:.1em!important;text-transform:uppercase;
  color:var(--k-cta)!important;text-decoration:none;white-space:nowrap;
  transition:background-color .2s ease,border-color .2s ease;
}
.khh-btn:hover{border-color:var(--k-accent);background:rgba(255,255,255,.55);}
.khh-btn svg{flex:none;}

/* social proof: wreath left, quote right */
.khh-proof{display:flex;align-items:center;gap:26px;margin:160px 0 0;}
.khh-wreath{position:relative;flex:none;width:168px;height:100px;}
.khh-wreath svg{position:absolute;inset:0;}
.khh-stars{
  position:absolute;top:26px;left:0;right:0;text-align:center;
  color:#3D985C;font-size:13px;letter-spacing:2px!important;line-height:1;
}
.khh-proof-label{
  position:absolute;top:46px;left:0;right:0;text-align:center;
  font-family:var(--k-quick)!important;font-size:15px!important;font-weight:500!important;
  letter-spacing:0!important;color:var(--k-ink)!important;
}
.khh-quote{
  font-family:var(--k-body)!important;font-size:15px!important;font-weight:400!important;
  line-height:1.45em!important;letter-spacing:0!important;color:var(--k-ink)!important;
  margin:0;min-width:330px;
}
.khh-by{display:block;}

/* category cards — white, elevated, overlapping the hero's lower edge */
.khh-cats{display:block;background:#fff;}
.khh-cats-in{
  max-width:980px;margin:0 auto;padding:0 20px;
  display:grid;grid-template-columns:repeat(4,1fr);gap:56px;
  transform:translateY(-118px);
}
.khh-card{
  display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;
  background:#fff;border-radius:14px;padding:16px 12px 14px;
  box-shadow:0 6px 22px rgba(16,14,14,.10);text-decoration:none;
  transition:transform .2s ease,box-shadow .2s ease;
}
.khh-card:hover{transform:translateY(-3px);box-shadow:0 10px 26px rgba(16,14,14,.14);}
.khh-card svg{margin-bottom:8px;}
.khh-card-t{
  font-family:var(--k-sans)!important;font-size:16px!important;font-weight:700!important;
  line-height:1.4em!important;letter-spacing:-.05em!important;color:#100E0E!important;
}
.khh-card-s{
  font-family:var(--k-body)!important;font-size:15px!important;font-weight:400!important;
  line-height:1.4em!important;letter-spacing:0!important;color:#100E0E!important;
}

@media (max-width:900px){
  .khh-cats-in{grid-template-columns:repeat(2,1fr);gap:20px;transform:translateY(-60px);}
  .khh-photo{right:0;width:46%;}
}
@media (max-width:640px){
  .khh{height:auto;background:#EFE8E0;}
  .khh-photo{position:relative;right:auto;width:100%;height:240px;object-position:center 20%;}
  .khh-in{height:auto;}
  .khh-copy{max-width:none;padding:28px 0 36px;}
  .khh-h1{font-size:30px!important;}
  .khh-sub{font-size:16px!important;}
  .khh-cta{flex-wrap:wrap;}
  .khh-btn{width:100%;}
  .khh-proof{margin-top:34px;flex-direction:column;align-items:flex-start;gap:14px;}
  .khh-cats-in{transform:none;padding:28px 20px 0;}
}
`;
