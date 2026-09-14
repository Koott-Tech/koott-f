'use client';

/**
 * BlogArticle — port of a koott.in/post/<slug> article page.
 *
 * Measured off the live page (article column 740 wide):
 *   category nav  avenir 15/400, above the article
 *   meta row      28px avatar + avenir 14/400 "author · date · N min read"
 *   title         brandon-grot-w01-light 40/400, 1.25em  → Jost stands in
 *   cover         740x416
 *   lede          avenir 18/400 ITALIC, 1.5em
 *   body          avenir 18/400, 1.5em
 *   h2            brandon-grot 28/700, 1.25em
 *   h3            brandon-grot 22/700, 1.23em
 *   list item     avenir 18/400, indented 27px
 *
 * Content is CMS-driven: it reads /api/blogs/slug/<slug> and only falls back to
 * data/blogSampleData.js while the CMS has no matching post. Pass `post` to
 * render a given post instead (the admin editor's preview) — `preview` drops
 * the space kept for the fixed site header.
 *
 * The body comes in one of three shapes, depending on which editor wrote it:
 *   - HTML in `content`          the current admin editor (DocumentStyleEditor)
 *   - `structured_content` blocks the older block editor (heading/paragraph/
 *                                 image/quote/spacer, inline [text](url) links)
 *                                 and the imported shape (h2/h3/quote/list)
 *   - markdown-ish `content`     imported posts: "## ", "### ", "> ", "- "
 */

import { useEffect, useState } from 'react';
import { blogApi } from '@/lib/blogApi';
import { BLOG_SAMPLE_POSTS, BLOG_CATEGORIES } from '@/data/blogSampleData';
import { looksLikeHtml, sanitizeHtml } from '@/lib/sanitizeHtml';
import { formatPostDate } from './BlogListing';

const SAFE_LINK = /^(https?:|mailto:|tel:|\/|#)/i;

/** "see [our guide](https://…) here" -> text and <a> nodes */
function withLinks(text, keyBase) {
  const out = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const href = /^www\./i.test(m[2]) ? `https://${m[2]}` : m[2];
    out.push(SAFE_LINK.test(href)
      ? <a key={`${keyBase}-${m.index}`} href={href}>{m[1]}</a>
      : m[1]);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const blockText = (b) => String(b?.text ?? b?.content ?? '');

function renderBlocks(blocks) {
  const out = [];
  blocks.forEach((b, i) => {
    const type = b?.type;
    const text = blockText(b);

    if (type === 'image') {
      const src = b.src || b.url;
      if (src && /^(https?:|\/)/i.test(src)) {
        out.push(
          <figure key={i} className="kba-fig">
            <img className="kba-img" src={src} alt={b.alt || ''} loading="lazy" />
            {b.caption && <figcaption className="kba-cap">{b.caption}</figcaption>}
          </figure>,
        );
      }
      return;
    }
    if (type === 'spacer') { out.push(<div key={i} className="kba-spacer" aria-hidden />); return; }
    if (type === 'link' && b.href) {
      out.push(
        <p key={i} className="kba-p">
          {SAFE_LINK.test(b.href) ? <a href={b.href}>{b.text || b.href}</a> : (b.text || b.href)}
        </p>,
      );
      return;
    }
    if ((type === 'list' || type === 'ul' || type === 'ol') && Array.isArray(b.items)) {
      const ordered = type === 'ol' || b.ordered;
      const Tag = ordered ? 'ol' : 'ul';
      out.push(
        <Tag key={i} className={ordered ? 'kba-ol' : 'kba-ul'}>
          {b.items.map((it, j) => <li key={j}>{withLinks(typeof it === 'string' ? it : blockText(it), `${i}-${j}`)}</li>)}
        </Tag>,
      );
      return;
    }
    if (!text) return;

    const level = type === 'heading' ? (Number(b.level) || 2) : (/^h[1-6]$/.test(type || '') ? Number(type[1]) : 0);
    if (level) {
      out.push(level <= 2
        ? <h2 key={i} className="kba-h2">{text}</h2>
        : <h3 key={i} className="kba-h3">{text}</h3>);
      return;
    }
    if (type === 'quote') {
      out.push(
        <blockquote key={i} className="kba-quote">
          <p>{withLinks(text, i)}</p>
          {b.author && <cite>— {b.author}</cite>}
        </blockquote>,
      );
      return;
    }
    out.push(<p key={i} className="kba-p">{withLinks(text, i)}</p>);
  });
  return out;
}

function renderMarkdownish(content) {
  const blocks = [];
  const lines = String(content || '').split('\n');
  let list = null;
  const flush = (key) => {
    if (list && list.length) blocks.push(<ul key={`ul-${key}`} className="kba-ul">{list}</ul>);
    list = null;
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();
    // Imported posts put a blank line between bullets; that must not split one
    // list into a list per item — only a non-bullet line ends the list.
    if (!line) return;
    if (line.startsWith('- ')) {
      list = list || [];
      list.push(<li key={i}>{withLinks(line.slice(2), i)}</li>);
      return;
    }
    flush(i);
    if (line.startsWith('## ')) blocks.push(<h2 key={i} className="kba-h2">{line.slice(3)}</h2>);
    else if (line.startsWith('### ')) blocks.push(<h3 key={i} className="kba-h3">{line.slice(4)}</h3>);
    else if (line.startsWith('> ')) blocks.push(<p key={i} className="kba-lede">{withLinks(line.slice(2), i)}</p>);
    else blocks.push(<p key={i} className="kba-p">{withLinks(line, i)}</p>);
  });
  flush('end');
  return blocks;
}

/** HTML from the current editor wins, then structured blocks, then plain text. */
function renderBody(post) {
  const content = String(post.content || '');
  if (looksLikeHtml(content)) {
    return <div className="kba-html" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />;
  }
  if (Array.isArray(post.structured_content) && post.structured_content.length) {
    return renderBlocks(post.structured_content);
  }
  return renderMarkdownish(content);
}

export default function BlogArticle({ slug, post: givenPost, preview = false }) {
  // undefined = loading, null = not found
  const [post, setPost] = useState(givenPost || undefined);
  const [usingSample, setUsingSample] = useState(false);

  useEffect(() => {
    if (givenPost) { setPost(givenPost); return undefined; }
    let off = false;
    (async () => {
      const found = await blogApi.bySlug(slug);
      if (off) return;
      if (found) { setPost(found); setUsingSample(false); return; }
      const sample = BLOG_SAMPLE_POSTS.find((p) => p.slug === slug);
      setPost(sample || null);
      setUsingSample(Boolean(sample));
    })();
    return () => { off = true; };
  }, [slug, givenPost]);

  return (
    <main className={`kba ${preview ? 'kba--preview' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <nav className="kba-cats" aria-label="Blog categories">
        {BLOG_CATEGORIES.map((c) => (
          <a key={c} href="/blog" className="kba-cat">{c}</a>
        ))}
      </nav>

      {post === undefined && <p className="kba-state">Loading…</p>}

      {post === null && (
        <div className="kba-state">
          <p>We couldn’t find that post.</p>
          <p><a className="kba-back" href="/blog">Back to all posts</a></p>
        </div>
      )}

      {post && (
        <article className="kba-article">
          <div className="kba-meta">
            <span className="kba-avatar" aria-hidden />
            <span className="kba-byline">
              {post.author_name || 'Koott'} · {formatPostDate(post.published_at || post.created_at)}
              {post.read_time_minutes ? ` · ${post.read_time_minutes} min read` : ''}
            </span>
          </div>

          <h1 className="kba-title">{post.title}</h1>

          {post.featured_image_url && (
            <img className="kba-cover" src={post.featured_image_url} alt="" />
          )}

          <div className="kba-body">{renderBody(post)}</div>

          {usingSample && (
            <p className="kba-note">
              This is a sample post — it is replaced automatically once the CMS has a
              published article at this slug.
            </p>
          )}

          <p className="kba-backrow"><a className="kba-back" href="/blog">← All posts</a></p>
        </article>
      )}
    </main>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;700&family=Mulish:wght@300;400;500;600;700&display=swap');

.kba{
  --k-ink:#100E0E;
  --k-accent:#3D985C;
  --k-line:rgba(38,34,34,.16);
  --k-display:'Jost','Brandon Grotesque',ui-sans-serif,system-ui,sans-serif;
  --k-body:'Mulish','Avenir Light','Avenir Next','Avenir',ui-sans-serif,system-ui,sans-serif;
  padding-top:64px;              /* Header.jsx is fixed and h-16 */
  display:block;background:#fff;color:var(--k-ink);font-family:var(--k-body)!important;
}
.kba.kba--preview{padding-top:0;}
.kba *{box-sizing:border-box;}

.kba-cats{
  max-width:980px;margin:0 auto;padding:26px 20px 14px;
  display:flex;flex-wrap:wrap;gap:26px;border-bottom:1px solid var(--k-line);
}
.kba-cat{
  font-family:var(--k-body)!important;font-size:15px!important;font-weight:400!important;
  letter-spacing:0!important;color:var(--k-ink)!important;text-decoration:none;
}
.kba-cat:hover{color:var(--k-accent)!important;}

.kba-article{max-width:780px;margin:0 auto;padding:44px 20px 90px;}

.kba-meta{display:flex;align-items:center;gap:12px;}
.kba-avatar{
  width:28px;height:28px;border-radius:50%;flex:none;
  background:linear-gradient(180deg,#F0FFEC 0%,#D4FFC2 100%);
}
.kba-byline{
  font-family:var(--k-body)!important;font-size:14px!important;font-weight:400!important;
  line-height:1.5em!important;letter-spacing:0!important;color:var(--k-ink)!important;
}

.kba-title{
  font-family:var(--k-display)!important;font-size:40px!important;font-weight:400!important;
  line-height:1.25em!important;letter-spacing:0!important;color:var(--k-ink)!important;
  margin:22px 0 0;
}
.kba-cover{
  display:block;width:100%;height:416px;object-fit:cover;margin:28px 0 0;background:#EFF4F0;
}

.kba-body{margin:30px 0 0;}
.kba-p,.kba-html p{
  font-family:var(--k-body)!important;font-size:18px!important;font-weight:400!important;
  line-height:1.5em!important;letter-spacing:0!important;color:var(--k-ink)!important;margin:20px 0 0;
}
.kba-lede{
  font-family:var(--k-body)!important;font-size:18px!important;font-weight:400!important;
  font-style:italic;line-height:1.5em!important;letter-spacing:0!important;
  color:var(--k-ink)!important;margin:20px 0 0;
}
.kba-h2,.kba-html h1,.kba-html h2{
  font-family:var(--k-display)!important;font-size:28px!important;font-weight:700!important;
  line-height:1.25em!important;letter-spacing:0!important;color:var(--k-ink)!important;margin:38px 0 0;
}
.kba-h3,.kba-html h3,.kba-html h4,.kba-html h5,.kba-html h6{
  font-family:var(--k-display)!important;font-size:22px!important;font-weight:700!important;
  line-height:1.23em!important;letter-spacing:0!important;color:var(--k-ink)!important;margin:30px 0 0;
}
.kba-ul,.kba-html ul{margin:14px 0 0;padding-left:27px;list-style:disc!important;}
.kba-ol,.kba-html ol{margin:14px 0 0;padding-left:27px;list-style:decimal!important;}
.kba-ul li,.kba-ol li,.kba-html li{
  display:list-item!important;list-style:inherit!important;
  font-family:var(--k-body)!important;font-size:18px!important;font-weight:400!important;
  line-height:1.5em!important;letter-spacing:0!important;color:var(--k-ink)!important;margin:8px 0 0;
}
.kba-html li p{margin:0!important;}
.kba-quote,.kba-html blockquote{
  margin:26px 0 0;padding:4px 0 4px 20px;border-left:3px solid var(--k-accent);
}
.kba-quote p,.kba-html blockquote p,.kba-html blockquote{
  font-family:var(--k-body)!important;font-size:18px!important;font-style:italic;
  line-height:1.5em!important;letter-spacing:0!important;color:var(--k-ink)!important;margin:0;
}
.kba-quote cite{display:block;margin-top:8px;font-style:normal;font-size:15px;color:#5B5757;}
.kba-fig,.kba-html figure{margin:28px 0 0;}
.kba-img,.kba-html img{display:block;max-width:100%;height:auto;margin:28px auto 0;border-radius:6px;}
.kba-fig .kba-img{margin-top:0;}
.kba-cap,.kba-html figcaption{
  margin-top:8px;text-align:center;font-family:var(--k-body)!important;font-size:14px!important;color:#5B5757!important;
}
.kba-html pre{
  margin:22px 0 0;padding:14px 16px;background:#F5F7F6;border-radius:6px;overflow-x:auto;
  font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px;line-height:1.5;
}
.kba-html code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.9em;}
.kba-html hr{border:0;border-top:1px solid var(--k-line);margin:34px 0 0;}
.kba-html table{border-collapse:collapse;margin:22px 0 0;width:100%;display:block;overflow-x:auto;}
.kba-html th,.kba-html td{border:1px solid var(--k-line);padding:8px 10px;font-size:16px;text-align:left;}
.kba-html > :first-child{margin-top:0;}
.kba-spacer{height:28px;}
.kba-body a{color:var(--k-accent)!important;text-decoration:underline;}

.kba-state{
  font-family:var(--k-body)!important;font-size:16px!important;letter-spacing:0!important;
  color:#5B5757!important;text-align:center;margin:80px 0;
}
.kba-note{
  font-family:var(--k-body)!important;font-size:14px!important;letter-spacing:0!important;
  color:#5B5757!important;margin:40px 0 0;padding-top:16px;border-top:1px solid var(--k-line);
}
.kba-backrow{margin:28px 0 0;}
.kba-back{
  font-family:var(--k-body)!important;font-size:15px!important;letter-spacing:0!important;
  color:var(--k-accent)!important;text-decoration:none;
}
.kba-back:hover{text-decoration:underline;}

@media (max-width:640px){
  .kba-title{font-size:28px!important;}
  .kba-cover{height:230px;}
  .kba-p,.kba-lede,.kba-ul li,.kba-ol li,.kba-html p,.kba-html li,.kba-quote p,.kba-html blockquote{font-size:16px!important;}
  .kba-h2,.kba-html h1,.kba-html h2{font-size:23px!important;}
  .kba-h3,.kba-html h3,.kba-html h4,.kba-html h5,.kba-html h6{font-size:19px!important;}
  .kba-cats{gap:16px;}
}
`;
