/**
 * The imported posts' body format → HTML, for the admin editor.
 *
 * The 144 posts brought over from Wix are stored as a small markdown dialect —
 * "## " and "### " headings, "- " list items, "> " quotes, "![alt](src)" images,
 * a blank line between paragraphs, and inline "[text](url)" links. BlogArticle
 * renders that directly, but the admin editor is a rich-text surface that sets
 * innerHTML, so opening an imported post showed the raw "##" marks and saving
 * would have written them into the page as literal text.
 *
 * Converting on the way into the editor fixes that: a post opens formatted, and
 * once saved it is stored as HTML, which BlogArticle already renders through its
 * other path. Posts nobody edits stay exactly as they were imported.
 */

const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const SAFE_URL = /^(https?:\/\/|\/|mailto:|tel:)/i;

/** Inline marks, in the order they must be applied. */
function inline(text) {
  let out = escapeHtml(text);
  // [label](href) — only to a URL we would be willing to render
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => (SAFE_URL.test(href)
    ? `<a href="${escapeHtml(href)}">${label}</a>`
    : label));
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return out;
}

/** True when the value is already HTML and needs no conversion. */
export const isHtml = (s) => /<(p|div|h[1-6]|ul|ol|li|img|figure|blockquote|br|strong|em|a)\b/i.test(String(s || ''));

export function markdownToHtml(markdown) {
  const src = String(markdown || '');
  if (!src.trim()) return '';
  if (isHtml(src)) return src;

  const out = [];
  let list = null;

  const closeList = () => {
    if (list && list.length) out.push(`<ul>${list.join('')}</ul>`);
    list = null;
  };

  src.split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) return;                       // imported posts separate blocks with blank lines

    if (line.startsWith('- ')) {
      list = list || [];
      list.push(`<li>${inline(line.slice(2))}</li>`);
      return;
    }
    closeList();

    const img = line.match(/^!\[([^\]]*)\]\((https?:[^)\s]+)\)$/);
    if (img) {
      out.push(`<figure><img src="${escapeHtml(img[2])}" alt="${escapeHtml(img[1])}" /></figure>`);
      return;
    }
    if (line.startsWith('### ')) { out.push(`<h3>${inline(line.slice(4))}</h3>`); return; }
    if (line.startsWith('## ')) { out.push(`<h2>${inline(line.slice(3))}</h2>`); return; }
    if (line.startsWith('# ')) { out.push(`<h2>${inline(line.slice(2))}</h2>`); return; }
    if (line.startsWith('> ')) { out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); return; }
    out.push(`<p>${inline(line)}</p>`);
  });
  closeList();

  return out.join('\n');
}

export default markdownToHtml;
