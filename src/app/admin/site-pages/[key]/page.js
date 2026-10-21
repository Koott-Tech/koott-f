"use client";

/**
 * The fixed site pages are now edited in the Marketing dashboard, where their
 * content and their SEO settings sit together: /marketing → Content → Edit
 * Pages. This route is kept so existing links and bookmarks still land
 * somewhere useful rather than 404ing.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SitePageAdminMoved() {
  const router = useRouter();
  useEffect(() => { router.replace('/marketing'); }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-center px-6">
      <p className="text-sm text-gray-700">
        Page editing has moved to the <b>Marketing dashboard</b>.
      </p>
      <p className="text-xs text-gray-500">
        Marketing → Content → Edit Pages. Taking you there…
      </p>
    </div>
  );
}
