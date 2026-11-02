'use client';

/**
 * The condition menu as it appears on koott.in.
 *
 * Three top-level groups — INDIVIDUAL, RELATIONSHIP, SEXUAL & INTIMACY — and,
 * under INDIVIDUAL only, a nested third level (OTHER DISORDERS, OTHER CRISIS,
 * OTHER BEHAVIOUR). The pages are static, so the menu is too: it comes from
 * data/conditions/menu.js and is whole in the first HTML, backend or no backend.
 *
 * Links point at the top-level slug (/depression-treatment), matching the live
 * site and the app/[conditionSlug] route.
 *
 * Two renderers:
 *   <ConditionMenuPanel />  the desktop hover/click flyout
 *   <ConditionMenuMobile /> the stacked accordion inside the mobile drawer
 */

import { useState } from 'react';
import Link from 'next/link';
import { CONDITION_MENU } from '@/data/conditions/menu';

const Chevron = ({ className = '' }) => (
  <svg className={`w-4 h-4 text-gray-500 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

/**
 * True when a mouseleave genuinely left `currentTarget`.
 *
 * `relatedTarget` is null when the pointer leaves the window, and in some cases
 * is a non-Node such as Window. `Node.contains()` throws a TypeError when handed
 * anything that is not a Node, so it has to be type-checked rather than merely
 * null-checked.
 */
export function pointerLeft(e) {
  const to = e.relatedTarget;
  return !(to instanceof Node) || !e.currentTarget.contains(to);
}

const itemStyle = { fontSize: '14px', fontWeight: 400, lineHeight: '1.2', margin: 0, letterSpacing: '0.02em' };
const headStyle = { fontSize: '15px', fontWeight: 500, lineHeight: '1.2', margin: 0, letterSpacing: '0.02em' };

/** One condition link. */
const Item = ({ m, onNavigate }) => (
  <Link
    href={`/${m.slug}`}
    onClick={onNavigate}
    className="block py-2 px-4 hover:bg-gray-50 transition-all duration-200"
  >
    <span className="text-gray-700 hover:translate-x-1 inline-block transition-all duration-200" style={itemStyle}>
      {m.label}
    </span>
  </Link>
);

/* --------------------- one category, as its own flyout ------------------- */

/**
 * The panel that drops from a single top-level menu (INDIVIDUAL, RELATIONSHIP,
 * SEXUAL & INTIMACY) in the site header, matching koott.in: the category's own
 * links first, then any nested group opening to the side.
 */
export function ConditionCategoryFlyout({ category, onNavigate }) {
  const [openGroup, setOpenGroup] = useState(null);
  const [anchor, setAnchor] = useState(null);

  if (!category) return null;

  /**
   * The nested panel is positioned fixed, from the trigger row's own rect.
   *
   * It cannot be an absolutely positioned child: this flyout scrolls (27 links
   * do not fit on a laptop), and a scroll container clips on BOTH axes — setting
   * overflow-y alone still computes overflow-x to `auto` — so a child opening to
   * the side was being cut off and read as an empty submenu. Fixed positioning
   * takes it out of that clip; the top is then clamped so a group near the
   * bottom of a long list still opens fully on screen.
   */
  const openAt = (label, rowEl) => {
    const r = rowEl.getBoundingClientRect();
    const PANEL_W = 256;
    const estimated = Math.min(g_height(label), window.innerHeight - 24);
    const top = Math.max(8, Math.min(r.top, window.innerHeight - estimated - 12));
    const spaceRight = window.innerWidth - r.right;
    const left = spaceRight >= PANEL_W + 12 ? r.right + 2 : r.left - PANEL_W - 2;
    setAnchor({ top, left, maxHeight: window.innerHeight - top - 16 });
    setOpenGroup(label);
  };

  // Rough height so the clamp has something to work with before paint:
  // each row is ~36px, plus the panel's own padding.
  function g_height(label) {
    const grp = category.groups.find((x) => x.label === label);
    return (grp ? grp.items.length : 0) * 36 + 16;
  }

  const close = () => { setOpenGroup(null); setAnchor(null); };

  return (
    <div className="counselling-dropdown header-dropdown absolute top-full left-0 mt-0 w-64 bg-white rounded-b-lg shadow-lg border border-gray-100 py-2 z-50 max-h-[74vh] overflow-y-auto">
      {category.items.map((m) => <Item key={m.slug} m={m} onNavigate={onNavigate} />)}

      {category.groups.map((g) => (
        <div
          key={g.label}
          onMouseEnter={(e) => openAt(g.label, e.currentTarget)}
          onMouseLeave={(e) => { if (pointerLeft(e)) close(); }}
        >
          <div
            className="flex items-center justify-between py-2 px-4 cursor-pointer hover:bg-gray-50 transition-all duration-200"
            onClick={(e) => (openGroup === g.label ? close() : openAt(g.label, e.currentTarget.parentElement))}
          >
            <span className="kcm-label text-gray-900" style={itemStyle}>{g.label}</span>
            <Chevron />
          </div>

          {openGroup === g.label && anchor && (
            <div
              className="counselling-dropdown w-64 bg-white rounded-lg shadow-lg border border-gray-100 py-2 overflow-y-auto"
              style={{ position: 'fixed', top: anchor.top, left: anchor.left, maxHeight: anchor.maxHeight, zIndex: 70 }}
              onMouseEnter={() => setOpenGroup(g.label)}
              onMouseLeave={(e) => { if (pointerLeft(e)) close(); }}
            >
              {g.items.map((m) => (
                <Item key={m.slug} m={m} onNavigate={() => { close(); onNavigate?.(); }} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- desktop -------------------------------- */

export function ConditionMenuPanel({ onNavigate }) {
  const [openCat, setOpenCat] = useState(null);
  const [openGroup, setOpenGroup] = useState(null);

  return (
    <div className="counselling-dropdown header-dropdown absolute top-full left-1/2 -translate-x-1/2 w-72 bg-white rounded-lg shadow-lg border border-gray-100 py-3 z-50 mt-4">
      {CONDITION_MENU.map((cat) => (
        <div
          key={cat.key}
          className="relative"
          onMouseEnter={() => { setOpenCat(cat.key); setOpenGroup(null); }}
          onMouseLeave={(e) => {
            if (pointerLeft(e)) { setOpenCat(null); setOpenGroup(null); }
          }}
        >
          {/* Opens on hover, and on click too so it works on touch and hybrid devices. */}
          <div
            className="flex items-center justify-between py-2 px-4 cursor-pointer hover:bg-gray-50 transition-all duration-200"
            onClick={() => { setOpenCat(openCat === cat.key ? null : cat.key); setOpenGroup(null); }}
          >
            <span className="kcm-label text-gray-900" style={headStyle}>{cat.label}</span>
            <Chevron />
          </div>

          {openCat === cat.key && (
            <div className="absolute left-full top-0 -ml-1 w-64 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50 max-h-[70vh] overflow-y-auto">
              {cat.items.map((m) => <Item key={m.slug} m={m} onNavigate={onNavigate} />)}

              {cat.groups.map((g) => (
                <div
                  key={g.label}
                  className="relative"
                  onMouseEnter={() => setOpenGroup(g.label)}
                  onMouseLeave={(e) => {
                    if (pointerLeft(e)) setOpenGroup(null);
                  }}
                >
                  <div
                    className="flex items-center justify-between py-2 px-4 cursor-pointer hover:bg-gray-50 transition-all duration-200"
                    onClick={() => setOpenGroup(openGroup === g.label ? null : g.label)}
                  >
                    <span className="kcm-label text-gray-900" style={itemStyle}>{g.label}</span>
                    <Chevron />
                  </div>
                  {openGroup === g.label && (
                    <div className="absolute left-full top-0 -ml-1 w-64 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                      {g.items.map((m) => <Item key={m.slug} m={m} onNavigate={onNavigate} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------- mobile -------------------------------- */

/** The accordion inside the mobile drawer. */
export function ConditionMenuMobile({ onNavigate }) {
  const [openCat, setOpenCat] = useState(null);
  const [openGroup, setOpenGroup] = useState(null);

  return (
    <div className="kcm-mobile space-y-1 py-1">
      {CONDITION_MENU.map((cat) => (
        <div key={cat.key}>
          <button
            type="button"
            aria-expanded={openCat === cat.key}
            className="kcm-row flex w-full items-center justify-between px-2 cursor-pointer hover:bg-gray-50 rounded-md"
            onClick={() => setOpenCat(openCat === cat.key ? null : cat.key)}
          >
            <span className="kcm-label text-gray-900" style={{ ...headStyle, fontSize: '16px' }}>{cat.label}</span>
            <Chevron className={openCat === cat.key ? 'rotate-90' : ''} />
          </button>

          {openCat === cat.key && (
            <div className="ml-3 space-y-0.5">
              {cat.items.map((m) => <Item key={m.slug} m={m} onNavigate={onNavigate} />)}

              {cat.groups.map((g) => (
                <div key={g.label}>
                  <button
                    type="button"
                    aria-expanded={openGroup === g.label}
                    className="kcm-row flex w-full items-center justify-between px-4 cursor-pointer hover:bg-gray-50 rounded-md"
                    onClick={() => setOpenGroup(openGroup === g.label ? null : g.label)}
                  >
                    <span className="kcm-label text-gray-900" style={itemStyle}>{g.label}</span>
                    <Chevron className={openGroup === g.label ? 'rotate-90' : ''} />
                  </button>
                  {openGroup === g.label && (
                    <div className="ml-3">
                      {g.items.map((m) => <Item key={m.slug} m={m} onNavigate={onNavigate} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ConditionMenuPanel;
