'use client';

/**
 * Client hook for the site pages' editable copy (see lib/siteContent.js).
 * `override` (the admin editor's live preview) wins and skips the fetch;
 * otherwise the defaults render first and the stored copy is merged in once it
 * arrives.
 */

import { useEffect, useState } from 'react';
import { loadStoredSiteContent, mergeSiteContent } from '@/lib/siteContent';

export function useSiteContent(key, defaults, override) {
  const [content, setContent] = useState(override ? mergeSiteContent(defaults, override) : defaults);

  useEffect(() => {
    if (override) { setContent(mergeSiteContent(defaults, override)); return undefined; }
    let off = false;
    loadStoredSiteContent(key).then((stored) => {
      if (!off && stored) setContent(mergeSiteContent(defaults, stored));
    });
    return () => { off = true; };
    // `defaults` is a module constant at every call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, override]);

  return content;
}

export default useSiteContent;
