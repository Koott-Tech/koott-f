'use client';

import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// A navigation that finishes within this time never shows the loader.
const SHOW_AFTER_MS = 300;
// Never leave the loader up if a navigation is abandoned or fails.
const GIVE_UP_MS = 10000;

/**
 * The logo loader (#initial-loader from layout.js) for client-side navigations —
 * shown only when a page is actually slow. Clicking an internal link starts a short
 * timer; if the new route hasn't rendered within SHOW_AFTER_MS the loader appears,
 * and it goes away the moment the route changes. There is no minimum display time.
 *
 * The loader's visibility is driven by the `loaded` class on <body>: layout.js styles
 * #initial-loader with !important, so inline styles can't show or hide it.
 */
function PageLoadingOverlayContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showTimer = useRef(null);
  const giveUpTimer = useRef(null);
  const shown = useRef(false);
  const firstRender = useRef(true);

  const navigationKey = useMemo(() => {
    const search = searchParams?.toString();
    return search ? `${pathname}?${search}` : pathname;
  }, [pathname, searchParams]);

  const stop = () => {
    clearTimeout(showTimer.current);
    clearTimeout(giveUpTimer.current);
    if (shown.current) {
      shown.current = false;
      document.body.classList.add('loaded');
    }
  };

  // Internal link clicks. Capture phase: Next's <Link> prevents the default in its
  // own handler, so a bubbling listener would never see these clicks as navigations.
  useEffect(() => {
    const onClick = (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target?.closest?.('a[href]');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      let url;
      try { url = new URL(a.href, window.location.href); } catch (_) { return; }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      clearTimeout(showTimer.current);
      clearTimeout(giveUpTimer.current);
      showTimer.current = setTimeout(() => {
        shown.current = true;
        document.body.classList.remove('loaded');
      }, SHOW_AFTER_MS);
      giveUpTimer.current = setTimeout(stop, GIVE_UP_MS);
    };
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      stop();
    };
  }, []);

  // The new route has rendered: drop any pending or visible loader at once.
  useEffect(() => {
    if (firstRender.current) {
      // First page load: layout.js hides the loader when the HTML is ready; once the
      // app has hydrated the page is certainly usable, so make sure it's gone.
      firstRender.current = false;
      document.body.classList.add('loaded');
      return;
    }
    stop();
  }, [navigationKey]);

  return null;
}

export default function PageLoadingOverlay() {
  return <PageLoadingOverlayContent />;
}
