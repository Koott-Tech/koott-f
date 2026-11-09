'use client';

import { useEffect, useRef } from 'react';

/**
 * Call `fn` every `ms` while the browser tab is visible, and once right away when the
 * tab comes back. Staff keep dashboards open all day in background tabs; polling those
 * every minute multiplied the API load by the number of open tabs for nothing.
 */
export function useVisiblePoll(fn, ms, enabled = true) {
  const saved = useRef(fn);
  useEffect(() => { saved.current = fn; }, [fn]);
  useEffect(() => {
    if (!enabled) return undefined;
    const tick = () => { if (typeof document === 'undefined' || !document.hidden) saved.current(); };
    const t = setInterval(tick, ms);
    const onVisible = () => { if (!document.hidden) saved.current(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible); };
  }, [ms, enabled]);
}
