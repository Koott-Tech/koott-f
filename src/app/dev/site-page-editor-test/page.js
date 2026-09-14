'use client';

/**
 * Dev-only page to exercise SitePageEditor without admin auth.
 * /dev/site-page-editor-test?page=home|about|faq|pricing|footer
 * Saving needs an admin token, so here it fails with 401 — nothing is written.
 */
import { useEffect, useState } from 'react';
import SitePageEditor from '@/components/SitePageEditor';

export default function DevSitePageEditorTest() {
  const [pageId, setPageId] = useState(null);
  useEffect(() => {
    setPageId(new URLSearchParams(window.location.search).get('page') || 'home');
  }, []);
  return pageId ? <SitePageEditor pageId={pageId} /> : null;
}
