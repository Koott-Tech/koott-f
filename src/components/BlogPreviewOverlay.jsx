'use client';

/**
 * Full-screen preview of a blog post in the public article design
 * (BlogArticle), fed from the editor's current state — so drafts can be
 * checked before they are published, and what the editor shows is what the
 * site will show.
 */

import { useEffect, useState } from 'react';
import BlogArticle from '@/components/BlogArticle';

/**
 * "Preview" button for the editor header. `getPost` is called when it is
 * clicked, so the preview shows the document exactly as it stands then
 * (unsaved edits included).
 */
export function BlogPreviewButton({ getPost, className = '' }) {
  const [post, setPost] = useState(null);
  return (
    <>
      <button
        type="button"
        onClick={() => setPost(getPost())}
        className={className || 'flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'}
        title="Preview in the site's article design"
      >
        Preview
      </button>
      <BlogPreviewOverlay open={Boolean(post)} post={post} onClose={() => setPost(null)} />
    </>
  );
}

export default function BlogPreviewOverlay({ open, post, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !post) return null;

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Post preview"
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#fff', overflowY: 'auto' }}
    >
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 1, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12, padding: '10px 18px',
          background: '#012F23', color: '#fff', fontSize: 14,
        }}
      >
        <span>
          Preview — how this post will look on the site
          {post.status !== 'published' ? ' · draft, not live yet' : ''}
        </span>
        <button
          type="button" onClick={onClose}
          style={{
            background: '#fff', color: '#012F23', border: 0, borderRadius: 8,
            padding: '6px 14px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Close preview
        </button>
      </div>
      <BlogArticle post={post} preview />
    </div>
  );
}
