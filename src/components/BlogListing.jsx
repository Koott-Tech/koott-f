'use client';

/**
 * BlogListing — port of koott.in/blog.
 *
 * Measured off the live page (940px content column, cards 454 wide, 32px gutter):
 *   malayalam h1  work-sans 31/500, -0.05em, #29653D, centred
 *   sub h2        work-sans 25/500, -0.05em, ink, centred
 *   intro         avenir 15/400, 1.7em, centred, 505 wide
 *   newsletter    label avenir 14/400 · input + a #6B5D57 "Join us!" button
 *   card cover    454x255
 *   card meta     avenir 12/400
 *   card title    brandon-grot-w01-light 26/400  → Poppins stands in
 *   card excerpt  avenir 16/400, 1.5em
 *
 * Brandon Grotesque and Avenir are licensed Wix faces. Poppins is the closest free
 * geometric grotesque to Brandon; Inter continues to stand in for Avenir.
 *
 * Content is CMS-driven: it reads /api/blogs and only falls back to
 * data/blogSampleData.js while the CMS has no published posts.
 */

import { useEffect, useMemo, useState } from 'react';
import { blogApi } from '@/lib/blogApi';
import { BLOG_SAMPLE_POSTS, BLOG_CATEGORIES } from '@/data/blogSampleData';

/** Two letters for the author chip, where koott.in shows the author's photo. */
function initialsOf(name) {
  const parts = String(name || 'Koott').trim().split(/\s+/);
  return ((parts[0] || '')[0] || 'K').concat((parts[1] || '')[0] || '').toUpperCase();
}

export function formatPostDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * @param {string}   [initialCategory] preselect a tag — used by
 *        /blog/categories/[slug] so a category URL lands already filtered.
 * @param {string[]} [extraSlugs] post slugs the live category page lists but
 *        which do not carry the category as a tag; they are shown alongside.
 * @param {object}   [heading] override the page heading for a category page.
 */
/** Cards per page, and per press of "Load more posts". */
const PAGE = 12;

export default function BlogListing({ initialCategory, extraSlugs, heading, initialPosts = null }) {
  // Server-rendered posts arrive as a prop, so the first screen needs no fetch.
  const [posts, setPosts] = useState(initialPosts);
  const [usingSample, setUsingSample] = useState(false);
  const [category, setCategory] = useState(initialCategory || 'All Posts');
  const [email, setEmail] = useState('');
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    if (initialPosts && initialPosts.length) return undefined;
    let off = false;
    (async () => {
      const rows = await blogApi.list();
      if (off) return;
      if (rows.length) { setPosts(rows); setUsingSample(false); }
      else { setPosts(BLOG_SAMPLE_POSTS); setUsingSample(true); }
    })();
    return () => { off = true; };
  }, []);

  const visible = useMemo(() => {
    if (!posts) return [];
    if (category === 'All Posts') return posts;
    const want = category.toLowerCase();
    const extra = new Set(extraSlugs || []);
    return posts.filter((p) =>
      (p.categories || []).some((c) => String(c).toLowerCase() === want)
      || (category === initialCategory && extra.has(p.slug)));
  }, [posts, category, extraSlugs, initialCategory]);

  // A new category starts again from the first page.
  useEffect(() => { setShown(PAGE); }, [category]);

  // Build the tag row from the posts actually published, falling back to the
  // sample list only while the CMS is empty. With the real corpus loaded there
  // are far more tags than the sample knew about, ordered by how often they are used.
  const categories = useMemo(() => {
    if (!posts || usingSample) return BLOG_CATEGORIES;
    const counts = new Map();
    posts.forEach((p) => (p.categories || []).forEach((c) => counts.set(c, (counts.get(c) || 0) + 1)));
    const ordered = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([c]) => c);
    // A category arrived at by URL must stay visible even if it is rarely used.
    if (initialCategory && !ordered.includes(initialCategory)) ordered.unshift(initialCategory);
    return ['All Posts', ...ordered];
  }, [posts, usingSample, initialCategory]);


  return (
    <main className="kbl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <section className="kbl-head">
        <h1 className="kbl-mal">{heading?.title || 'കൂട്ടക്ഷരങ്ങൾ'}</h1>
        <p className="kbl-sub">{heading?.subtitle || 'Mental Health Updates for Kerala'}</p>
        <p className="kbl-intro">
          {heading?.intro || `We write passionately to bring more awareness about mental health in our community
          and to be resourceful for the students in Kerala.`}
        </p>

        <form
          className="kbl-form"
          onSubmit={(e) => { e.preventDefault(); setEmail(''); }}
        >
          <label className="kbl-label" htmlFor="kbl-email">Enter your email here *</label>
          <div className="kbl-row">
            <input
              id="kbl-email"
              className="kbl-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="kbl-join">Join us!</button>
          </div>
        </form>
      </section>

      {/* koott.in's blog listing has no category bar and no search: it is the
          heading, the sign-up, then the grid. A category is still reachable at
          /blog/categories/<slug>, which passes initialCategory in. */}

      <section className="kbl-body">
        {posts === null && <p className="kbl-state">Loading posts…</p>}

        {posts !== null && visible.length === 0 && (
          <p className="kbl-state">No posts in this category yet.</p>
        )}

        {visible.length > 0 && (
          <div className="kbl-grid">
            {visible.slice(0, shown).map((p) => (
              <article key={p.id || p.slug} className="kbl-card">
                <a href={`/blog/${p.slug}`} className="kbl-cover-link">
                  {p.featured_image_url
                    ? <img className="kbl-cover" src={p.featured_image_url} alt="" />
                    : <span className="kbl-cover kbl-cover--ph" aria-hidden />}
                </a>

                <div className="kbl-meta">
                  <span className="kbl-ava" aria-hidden>{initialsOf(p.author_name)}</span>
                  <span className="kbl-metacol">
                    <span className="kbl-author">{p.author_name || 'Koott'}</span>
                    <span className="kbl-dates">
                      <span>{formatPostDate(p.created_at)}</span>
                      {p.read_time_minutes ? (
                        <>
                          <i className="kbl-dot" aria-hidden />
                          <span>{p.read_time_minutes} min read</span>
                        </>
                      ) : null}
                    </span>
                  </span>
                </div>

                <h2 className="kbl-title">
                  <a href={`/blog/${p.slug}`}>{p.title}</a>
                </h2>
                <p className="kbl-excerpt">{p.excerpt || ''}</p>

                <div className="kbl-foot">
                  <span className="kbl-heart" aria-hidden>♡</span>
                </div>
              </article>
            ))}
          </div>
        )}

        {visible.length > shown && (
          <div className="kbl-more-wrap">
            <button type="button" className="kbl-more" onClick={() => setShown((n) => n + PAGE)}>
              Load more posts
              <span className="kbl-more-n">{visible.length - shown} more</span>
            </button>
          </div>
        )}

        {usingSample && (
          <p className="kbl-note">
            Showing sample posts — these are replaced automatically once the CMS has
            published articles.
          </p>
        )}
      </section>
    </main>
  );
}

/* Scoped to .kbl and !important throughout, because globals.css (marked
   "never edit") forces Poppins / 60px on h1, Inter / 16px on p, and
   letter-spacing on span, a and button. */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;500;600;700&family=Jost:wght@300;400;500;600;700&family=Work+Sans:wght@400;500;600&display=swap');

.kbl{
  --k-ink:#100E0E;
  --k-deep2:#29653D;
  --k-accent:#3D985C;
  --k-join:#6B5D57;
  --k-line:rgba(38,34,34,.16);
  --k-sans:'Work Sans',ui-sans-serif,system-ui,sans-serif;
  --k-display:'Jost','Brandon Grotesque',ui-sans-serif,system-ui,sans-serif;
  --k-display-w:300;            /* Brandon Grotesque Light */
  --k-body:'Mulish','Avenir Light','Avenir Next','Avenir',ui-sans-serif,system-ui,sans-serif;
  --k-body-w:300;               /* Avenir LT 35 Light */
  padding-top:64px;              /* Header.jsx is fixed and h-16 */
  display:block;background:#fff;color:var(--k-ink);font-family:var(--k-body)!important;
}
.kbl *{box-sizing:border-box;}

.kbl-head{max-width:980px;margin:0 auto;padding:56px 20px 0;text-align:center;}
.kbl-mal,.kbl-mal:not(#_){
  /* size from the global --h1-size scale; Malayalam glyphs need the taller line */
  font-family:var(--k-sans)!important;font-size:31px!important;font-weight:500!important;
  line-height:32.5px!important;letter-spacing:-1.25px!important;color:var(--k-deep2)!important;margin:0;
}
.kbl-sub{
  /* 25/32.5, tracking -1.25px, 2px under the heading — koott.in's own numbers */
  font-family:var(--k-sans)!important;font-size:25px!important;font-weight:500!important;
  line-height:32.5px!important;letter-spacing:-1.25px!important;color:var(--k-ink)!important;margin:2px 0 0;
}
.kbl-intro{
  font-family:var(--k-body)!important;font-size:15px!important;font-weight:var(--k-body-w)!important;
  line-height:25.5px!important;letter-spacing:normal!important;color:var(--k-ink)!important;
  margin:11px auto 0;max-width:505px;
}

.kbl-form{max-width:520px;margin:30px auto 0;text-align:left;}
.kbl-label{
  display:block;font-family:var(--k-body)!important;font-size:14px!important;
  font-weight:400!important;line-height:1em!important;letter-spacing:0!important;
  color:var(--k-ink)!important;margin-bottom:8px;
}
.kbl-row{display:flex;}
.kbl-input{
  flex:1;min-width:0;height:38px;padding:0 12px;
  border:1px solid var(--k-line);border-right:0;background:#fff;
  font-family:var(--k-body)!important;font-size:14px;color:var(--k-ink);
}
.kbl-input:focus{outline:none;border-color:var(--k-accent);}
.kbl-join{
  flex:none;height:38px;padding:0 22px;border:0;cursor:pointer;
  background:var(--k-join);color:#fff;
  font-family:var(--k-body)!important;font-size:14px;font-weight:400;letter-spacing:0!important;
  transition:background-color .2s ease;
}
.kbl-join:hover{background:#54483F;}

/* koott.in's gallery column measures 940px, with the page gutter outside it. */
.kbl-body{max-width:980px;margin:0 auto;padding:38px 20px 80px;}

.kbl-more-wrap{display:flex;justify-content:center;margin-top:48px;}
.kbl-more{
  display:inline-flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--k-line);
  border-radius:999px;padding:12px 26px;cursor:pointer;
  font-family:var(--k-body)!important;font-size:15px;letter-spacing:0!important;color:var(--k-ink);
}
.kbl-more:hover{border-color:var(--k-accent);color:var(--k-accent);}
.kbl-more-n{font-size:13px;color:#8A8A8A;}
.kbl-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:56px 34px;}
.kbl-card{margin:0;}
.kbl-cover-link{display:block;}
.kbl-cover{
  /* 16:9, the ratio the live gallery crops to (454x255) */
  display:block;width:100%;aspect-ratio:16/9;height:auto;object-fit:cover;background:#EFF4F0;
}
.kbl-cover--ph{background:linear-gradient(180deg,#F0FFEC 0%,#D4FFC2 100%);}

/* The live card insets its text 31px inside the 454px cover, and runs
   cover -> 28 -> author row -> 13 -> title -> 10 -> excerpt -> 17 -> like. */
.kbl-meta{display:flex;align-items:center;gap:10px;margin:28px 0 0;padding:0 31px;}
.kbl-ava{
  width:32px;height:32px;flex:none;border-radius:50%;background:#E4EFE6;
  display:inline-flex;align-items:center;justify-content:center;
  font-family:var(--k-body)!important;font-size:12px!important;font-weight:500!important;
  letter-spacing:0!important;color:var(--k-deep2)!important;
}
.kbl-metacol{display:flex;flex-direction:column;gap:2px;min-width:0;}
.kbl-author,.kbl-dates{
  font-family:var(--k-body)!important;font-size:12px!important;font-weight:var(--k-body-w)!important;
  line-height:14.4px!important;letter-spacing:0!important;color:var(--k-ink)!important;
}
.kbl-dates{display:inline-flex;align-items:center;}
.kbl-dot{width:4px;height:4px;flex:none;border-radius:50%;background:var(--k-ink);margin:0 7px;}
/* Three lines at koott.in's own 36.4px leading. The cards used to be set
   tighter because Poppins Regular reads heavier than Brandon Light; now that
   the titles use the Light cut, the live figure is right again.

   The size and leading have to sit on the h2, not only on the link inside it:
   globals.css sets h2 to --h2-size (clamping up to 48px) at !important, and
   that strut sets the height of every line box in the block however small the
   inline text is. :not(#_) outranks it the same way globals.css does. */
.kbl-title,.kbl-title:not(#_){
  margin:18px 0 0;padding:0 31px;
  font-family:var(--k-display)!important;font-size:26px!important;font-weight:var(--k-display-w)!important;
  line-height:36.4px!important;letter-spacing:normal!important;
  height:109.2px;overflow:hidden;
}
.kbl-title a{
  /* 26px at 36.4px leading, as koott.in sets it. */
  font-family:var(--k-display)!important;font-size:26px!important;font-weight:var(--k-display-w)!important;
  line-height:36.4px!important;letter-spacing:normal!important;color:var(--k-ink)!important;
  text-decoration:none;
}
.kbl-title a:hover{color:var(--k-accent)!important;}
.kbl-excerpt{
  font-family:var(--k-body)!important;font-size:16px!important;font-weight:var(--k-body-w)!important;
  line-height:24px!important;letter-spacing:normal!important;color:var(--k-ink)!important;
  margin:10px 0 0;padding:0 31px;
  /* three lines, held whether or not the excerpt fills them — the title above
     does the same, so every card's like row sits on one line across the row */
  height:72px;overflow:hidden;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;
}
.kbl-foot{margin:17px 31px 0;}
.kbl-heart{color:#E0748A;font-size:16px;line-height:1;}

/* While the posts are still coming, the body holds the height a screen of cards
   will take. Without it the page is a heading and one line, the footer sits in
   the middle of the screen, and everything jumps when the cards arrive. */
.kbl-body:has(.kbl-state){min-height:72vh;}
.kbl-state,.kbl-note{
  font-family:var(--k-body)!important;font-size:14px!important;font-weight:var(--k-body-w)!important;
  letter-spacing:0!important;color:#5B5757!important;text-align:center;margin:40px 0 0;
}

@media (max-width:900px){
  .kbl-grid{grid-template-columns:1fr;gap:44px;}
}
@media (max-width:640px){
  /* koott.in serves the blog on a fixed 320px canvas (<meta name="viewport"
     content="width=320">) and lets the browser scale that canvas up to the
     device, so every length it authors renders at viewport/320 — 1.17x on a
     375px phone, 1.29x on a 414px one. --k-u is that same unit, so the figures
     below are koott.in's own numbers and land at its rendered size.

     Capped at 1.35px (a 432px viewport): past that koott.in is serving its
     desktop layout anyway, and uncapped the type would keep growing on
     foldables and small tablets. */
  .kbl{--k-u:min(calc(100vw / 320),1.35px);}

  .kbl-head{padding:calc(56 * var(--k-u)) calc(18 * var(--k-u)) 0;}
  /* .kbl-mal carries :not(#_) above to outrank globals.css, so it needs it here too. */
  .kbl-mal,.kbl-mal:not(#_){
    font-size:calc(18 * var(--k-u))!important;line-height:calc(22.1 * var(--k-u))!important;
    letter-spacing:calc(-.85 * var(--k-u))!important;
  }
  .kbl-sub{
    font-size:calc(17 * var(--k-u))!important;line-height:calc(22.1 * var(--k-u))!important;
    letter-spacing:calc(-.85 * var(--k-u))!important;
  }
  .kbl-intro{
    font-size:calc(13 * var(--k-u))!important;line-height:calc(22.1 * var(--k-u))!important;
    margin-top:calc(11 * var(--k-u));
  }
  .kbl-form{margin-top:calc(30 * var(--k-u));}
  .kbl-label{font-size:calc(14 * var(--k-u))!important;margin-bottom:calc(8 * var(--k-u));}
  .kbl-input,.kbl-join{height:calc(38 * var(--k-u));font-size:calc(14 * var(--k-u))!important;}
  .kbl-input{padding:0 calc(12 * var(--k-u));}
  .kbl-join{padding:0 calc(22 * var(--k-u));}

  .kbl-body{padding:calc(38 * var(--k-u)) calc(18 * var(--k-u)) calc(80 * var(--k-u));}
  .kbl-grid{grid-template-columns:1fr;gap:calc(44 * var(--k-u));}

  /* The card text drops its 31px inset and sits on the page gutter. */
  .kbl-meta{margin-top:calc(28 * var(--k-u));gap:calc(10 * var(--k-u));padding:0;}
  .kbl-ava{
    width:calc(32 * var(--k-u));height:calc(32 * var(--k-u));
    font-size:calc(12 * var(--k-u))!important;
  }
  .kbl-author,.kbl-dates{
    font-size:calc(12 * var(--k-u))!important;line-height:calc(14.4 * var(--k-u))!important;
  }
  .kbl-dot{width:calc(4 * var(--k-u));height:calc(4 * var(--k-u));margin:0 calc(7 * var(--k-u));}
  .kbl-title,.kbl-title:not(#_){
    padding:0;margin-top:calc(18 * var(--k-u));
    font-size:calc(26 * var(--k-u))!important;line-height:calc(36.4 * var(--k-u))!important;
    height:calc(109.2 * var(--k-u));
  }
  .kbl-title a{
    font-size:calc(26 * var(--k-u))!important;line-height:calc(36.4 * var(--k-u))!important;
  }
  .kbl-excerpt{
    padding:0;margin-top:calc(10 * var(--k-u));
    font-size:calc(16 * var(--k-u))!important;line-height:calc(24 * var(--k-u))!important;
    height:calc(72 * var(--k-u));
  }
  .kbl-foot{margin:calc(17 * var(--k-u)) 0 0;}
  .kbl-heart{font-size:calc(16 * var(--k-u));}
  .kbl-cover{aspect-ratio:16/9;}
  .kbl-more-wrap{margin-top:calc(48 * var(--k-u));}
  .kbl-more{
    width:100%;justify-content:center;
    font-size:calc(15 * var(--k-u))!important;
    padding:calc(12 * var(--k-u)) calc(26 * var(--k-u));
  }
  .kbl-state,.kbl-note{font-size:calc(14 * var(--k-u))!important;margin-top:calc(40 * var(--k-u));}
}
`;
