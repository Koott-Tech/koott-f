/**
 * Right-sized images from the hosts that resize on request, without Next's image
 * optimiser (no Vercel image quota, no round trip through our servers).
 *
 *   · static.wixstatic.com: Wix resizes and re-encodes from the URL
 *     (…/media/<file>/v1/fit/w_<w>,h_<h>,q_80,enc_auto/<file>). enc_auto serves AVIF or
 *     WebP when the browser accepts it. Blog covers imported from Wix were full-size
 *     PNGs of up to 3 MB, shown as 80 px thumbnails and 454 px cards.
 *   · images.unsplash.com: the w / q / auto=format query parameters.
 *   · anything else (our own /public files, /api/images, Supabase): returned unchanged.
 *
 * Usage:  <img {...sizedImg(url, [400, 800], '(max-width: 768px) 100vw, 454px')} alt="" />
 */

const WIX = /^https?:\/\/static\.wixstatic\.com\/media\/([^/?#]+)/i;
const UNSPLASH = /^https?:\/\/images\.unsplash\.com\//i;

export function canResize(src) {
  return typeof src === 'string' && (WIX.test(src) || UNSPLASH.test(src));
}

/** The image at `width` CSS pixels wide (height follows the aspect ratio). */
export function sizedImage(src, width, { quality = 80 } = {}) {
  if (!canResize(src)) return src;
  const w = Math.max(16, Math.round(width));
  const wix = src.match(WIX);
  if (wix) {
    const file = wix[1];
    // `fit` keeps the aspect ratio; a tall height box means only the width limits it.
    return `https://static.wixstatic.com/media/${file}/v1/fit/w_${w},h_${w * 3},q_${quality},enc_auto/${file}`;
  }
  try {
    const u = new URL(src);
    u.searchParams.set('w', String(w));
    u.searchParams.set('q', String(Math.min(quality, 75)));
    u.searchParams.set('auto', 'format');
    return u.toString();
  } catch (_) {
    return src;
  }
}

/** src / srcSet / sizes for an <img>; plain src when the host can't resize. */
export function sizedImg(src, widths, sizes) {
  if (!canResize(src)) return { src };
  const list = [...new Set(widths)].sort((a, b) => a - b);
  return {
    src: sizedImage(src, list[list.length - 1]),
    srcSet: list.map((w) => `${sizedImage(src, w)} ${w}w`).join(', '),
    sizes,
  };
}
