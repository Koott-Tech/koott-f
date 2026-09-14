/**
 * Allow-list HTML sanitiser for CMS-authored rich text (blog bodies).
 *
 * The admin blog editor saves its document as HTML. Only admins write it, but
 * it is still rendered with dangerouslySetInnerHTML on public pages, so it is
 * cleaned first: known-safe tags survive, everything else is unwrapped (its
 * text kept) or dropped with its content (script, style, iframe, forms…);
 * attributes are reduced to a short per-tag list, inline styles and classes go
 * (the page's own typography applies), and link / image URLs must use a safe
 * scheme.
 *
 * Uses the browser's DOMParser — the pages that render blog bodies fetch them
 * on the client. On the server it degrades to escaped plain text.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
  'blockquote', 'pre', 'code', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
  'a', 'img', 'figure', 'figcaption', 'span', 'div',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]);

// Removed together with everything inside them.
const DROP_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'link', 'meta',
  'form', 'input', 'button', 'textarea', 'select', 'option', 'svg', 'math', 'video', 'audio', 'canvas',
]);

const ALLOWED_ATTRS = {
  a: ['href', 'title', 'target'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan'],
};

const SAFE_HREF = /^(https?:|mailto:|tel:|\/|#)/i;
const SAFE_SRC = /^(https?:|\/|data:image\/(png|jpe?g|gif|webp);base64,)/i;

/** Does this string carry HTML block structure (vs plain / markdown-ish text)? */
export function looksLikeHtml(value) {
  return /<\/?(p|div|br|h[1-6]|ul|ol|li|blockquote|img|strong|em|a|span|table|figure)\b/i.test(String(value || ''));
}

const escapeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function clean(node) {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === 8) { child.remove(); return; }          // comment
    if (child.nodeType !== 1) return;                               // text stays

    const tag = child.tagName.toLowerCase();
    if (DROP_TAGS.has(tag)) { child.remove(); return; }
    if (!ALLOWED_TAGS.has(tag)) {
      clean(child);
      child.replaceWith(...Array.from(child.childNodes));           // unwrap, keep text
      return;
    }

    const keep = ALLOWED_ATTRS[tag] || [];
    Array.from(child.attributes).forEach((a) => {
      if (!keep.includes(a.name.toLowerCase())) child.removeAttribute(a.name);
    });

    if (tag === 'a') {
      const href = (child.getAttribute('href') || '').trim();
      if (!SAFE_HREF.test(href)) child.removeAttribute('href');
      if (child.getAttribute('target') === '_blank') child.setAttribute('rel', 'noopener noreferrer');
      else child.removeAttribute('target');
    }
    if (tag === 'img') {
      const src = (child.getAttribute('src') || '').trim();
      if (!SAFE_SRC.test(src)) { child.remove(); return; }
      child.setAttribute('loading', 'lazy');
    }

    clean(child);
  });
}

/** Clean HTML string -> safe HTML string. */
export function sanitizeHtml(html) {
  const raw = String(html || '');
  if (!raw.trim()) return '';
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
    return escapeText(raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
  }
  const doc = new window.DOMParser().parseFromString(`<div>${raw}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';
  clean(root);
  return root.innerHTML;
}

export default sanitizeHtml;
