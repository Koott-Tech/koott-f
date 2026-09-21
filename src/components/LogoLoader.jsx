'use client';

/**
 * Holds the site's logo loader (#initial-loader in app/layout.js) up while a
 * client page is still fetching what it needs to draw itself.
 *
 * The loader is driven by the `loaded` class on <body>: layout.js styles it with
 * !important, so inline styles cannot show or hide it. Two other things add that
 * class — the inline script in layout.js on DOMContentLoaded, and
 * PageLoadingOverlay when a client-side route renders — and either can land after
 * this mounts, which would drop the loader while the page is still empty. The
 * observer puts it back, so the loader stays up until `active` goes false.
 *
 *   <LogoLoader active={status === 'loading'} />
 */

import { useEffect } from 'react';

export default function LogoLoader({ active = true }) {
  useEffect(() => {
    if (!active) return undefined;
    const { body } = document;
    const hold = () => body.classList.remove('loaded');
    hold();
    const observer = new MutationObserver(() => {
      if (body.classList.contains('loaded')) hold();
    });
    observer.observe(body, { attributes: true, attributeFilter: ['class'] });
    return () => {
      observer.disconnect();
      body.classList.add('loaded');
    };
  }, [active]);

  return null;
}
