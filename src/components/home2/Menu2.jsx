'use client';

/**
 * The home page's slide-in menu — Figma "Menu · B · Signed out" (8049:37317).
 * 323 px of white over a dark veil, the same links the site header carries.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

const LINKS = [
  { label: 'Find a therapist', href: '/book-malayali-psychologists' },
  {
    label: 'Therapy types',
    children: [
      { label: 'Individual', href: '/counselling/individual-therapy' },
      { label: 'Couples', href: '/counselling/couples-therapy' },
      { label: 'Psychiatry', href: '/counselling/adult-psychiatry' },
      { label: 'Sexual wellness', href: '/counselling/sex-therapy' },
    ],
  },
  { label: 'How it works', href: '/guide' },
  { label: 'Blog', href: '/blog' },
  { label: 'About Koott', href: '/about-us' },
];

export default function Menu2({ open, onClose }) {
  const [openTypes, setOpenTypes] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="h2-menu-wrap" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="h2-menu-panel">
        <div className="h2-menu-head">
          <Link href="/" className="h2-menu-logo" onClick={onClose} aria-label="Koott home">
            <img src="/design/footer-logo.svg" alt="Koott" width={74} height={23} />
          </Link>
          <button type="button" className="h2-menu-x" onClick={onClose} aria-label="Close menu">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="#3D4842" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>
        <nav className="h2-menu-links">
          {LINKS.map((l, i) => (
            <div className="h2-menu-item" key={l.label}>
              {i > 0 && <i className="h2-menu-rule" aria-hidden="true" />}
              {l.children ? (
                <>
                  <button type="button" className="h2-menu-row" aria-expanded={openTypes} onClick={() => setOpenTypes((v) => !v)}>
                    <span>{l.label}</span>
                    <svg viewBox="0 0 22 22" aria-hidden="true" style={{ transform: openTypes ? 'rotate(180deg)' : 'none' }}>
                      <path d="m6 9 5 5 5-5" stroke="#3D4842" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </button>
                  {openTypes && (
                    <div className="h2-menu-sub">
                      {l.children.map((c) => (
                        <Link key={c.label} href={c.href} onClick={onClose}>{c.label}</Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link className="h2-menu-row" href={l.href} onClick={onClose}>
                  <span>{l.label}</span>
                  <svg viewBox="0 0 22 22" aria-hidden="true"><path d="m9 6 5 5-5 5" stroke="#3D4842" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
      <button type="button" className="h2-menu-veil" onClick={onClose} aria-label="Close menu" />
    </div>
  );
}
