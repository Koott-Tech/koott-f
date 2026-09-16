'use client';

/**
 * CustomSelect — a drop-in replacement for <select> on client-facing pages.
 *
 * Same props as a native select (value, onChange, name, id, className, style,
 * required, disabled, aria-label) and the same <option> children, so swapping
 * `<select` for `<CustomSelect` is enough. onChange receives an event-like
 * object ({ target: { name, value } }), so existing handlers keep working.
 * An `options` prop ([{ value, label }] or plain strings) works too.
 *
 * `className`/`style` style the trigger button. The list opens in a portal with
 * fixed positioning, so it is never clipped by a modal or a scrolling card, and
 * flips above the trigger when there is no room below. Long lists (country
 * codes) get a search box at the top.
 *
 * Keyboard: Enter / Space / arrows open; arrows, Home / End and type-ahead move;
 * Enter picks; Escape or Tab closes.
 */

import { Children, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const textOf = (node) => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement(node)) return textOf(node.props.children);
  return '';
};

function collectOptions(children, out = []) {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === 'option') {
      const label = textOf(child.props.children);
      out.push({
        value: child.props.value !== undefined ? String(child.props.value) : label,
        label,
        disabled: Boolean(child.props.disabled),
      });
    } else if (child.props?.children) {
      collectOptions(child.props.children, out); // fragments, optgroups
    }
  });
  return out;
}

const normalise = (options) => options.map((o) => (typeof o === 'object' && o !== null
  ? { value: String(o.value), label: o.label ?? String(o.value), disabled: Boolean(o.disabled) }
  : { value: String(o), label: String(o), disabled: false }));

// Flags and other symbols at the front of a label don't count for matching.
const plain = (s) => s.replace(/^[^\p{L}\p{N}+]+/u, '').toLowerCase();

const Chevron = () => (
  <svg className="ks-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const Tick = () => (
  <svg className="ks-tick" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

const MENU_MAX = 300;
const GAP = 6;
const SEARCH_FROM = 13; // lists this long get a search box

export default function CustomSelect({
  value, onChange, options, children, name, id, className = '', style, required, disabled,
  placeholder = 'Select an option', 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby,
  menuClassName = '', onClick, searchable,
}) {
  const list = useMemo(
    () => (options ? normalise(options) : collectOptions(children)),
    [options, children],
  );
  // Blank disabled options are the native "nothing picked yet" trick; they are
  // shown as the placeholder rather than as a row in the list.
  const rows = useMemo(() => list.filter((o) => !(o.disabled && o.label.trim() === '')), [list]);
  const current = String(value ?? '');
  const selected = list.find((o) => o.value === current);
  const shown = selected && selected.label.trim() ? selected.label : '';
  const withSearch = searchable ?? rows.length >= SEARCH_FROM;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const typed = useRef({ text: '', at: 0 });
  const uid = useId().replace(/:/g, '');
  const listId = `ks-list-${uid}`;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [rows, query]);

  const place = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - GAP - 8;
    const above = r.top - GAP - 8;
    const want = Math.min(MENU_MAX, rows.length * 40 + 12 + (withSearch ? 52 : 0));
    const up = below < want && above > below;
    const room = Math.max(140, Math.min(MENU_MAX, up ? above : below));
    const minWidth = Math.max(r.width, withSearch ? 220 : 140);
    const left = Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - minWidth - 8));
    // The list is portalled to <body>, so it borrows the trigger's font rather
    // than whatever the body has.
    const fontFamily = window.getComputedStyle(el).fontFamily;
    setPos(up
      ? { left, bottom: window.innerHeight - r.top + GAP, minWidth, maxHeight: room, fontFamily }
      : { left, top: r.bottom + GAP, minWidth, maxHeight: room, fontFamily });
  }, [rows.length, withSearch]);

  const openMenu = useCallback(() => {
    if (disabled) return;
    const idx = rows.findIndex((o) => o.value === current);
    setQuery('');
    setActive(idx >= 0 ? idx : rows.findIndex((o) => !o.disabled));
    setOpen(true);
  }, [disabled, rows, current]);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    setQuery('');
    if (refocus) btnRef.current?.focus();
  }, []);

  const pick = useCallback((opt) => {
    if (!opt || opt.disabled) return;
    if (opt.value !== current) {
      const target = { name, id, value: opt.value };
      onChange?.({ target, currentTarget: target, preventDefault() {}, stopPropagation() {}, persist() {} });
    }
    close();
  }, [current, name, id, onChange, close]);

  useLayoutEffect(() => { if (open) place(); }, [open, place]);

  // The search box takes the typing as soon as the list opens.
  useEffect(() => {
    if (open && pos && withSearch) searchRef.current?.focus({ preventScroll: true });
  }, [open, pos, withSearch]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      close(false);
    };
    // Scrolling the page moves the trigger; scrolling inside the list does not.
    const onScroll = (e) => { if (!menuRef.current?.contains(e.target)) place(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('resize', place);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, close, place]);

  // Keep the highlighted row in view while moving with the keyboard.
  useEffect(() => {
    if (!open || active < 0) return;
    menuRef.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, pos]);

  const step = (from, dir) => {
    for (let i = from + dir; i >= 0 && i < visible.length; i += dir) if (!visible[i].disabled) return i;
    return from;
  };

  const typeAhead = (key) => {
    const now = Date.now();
    typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : '') + key.toLowerCase(), at: now };
    const i = rows.findIndex((o) => !o.disabled && plain(o.label).startsWith(typed.current.text));
    if (i < 0) return;
    if (open) setActive(i);
    else pick(rows[i]);
  };

  const onListKeys = (e, fromSearch) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActive((a) => step(a, 1)); break;
      case 'ArrowUp': e.preventDefault(); setActive((a) => step(a, -1)); break;
      case 'Home': if (!fromSearch) { e.preventDefault(); setActive(step(-1, 1)); } break;
      case 'End': if (!fromSearch) { e.preventDefault(); setActive(step(visible.length, -1)); } break;
      case 'Enter': e.preventDefault(); pick(visible[active]); break;
      case ' ': if (!fromSearch) { e.preventDefault(); pick(visible[active]); } break;
      case 'Escape': e.preventDefault(); e.stopPropagation(); close(); break; // not the modal's Escape
      case 'Tab': close(false); break;
      default:
        if (!fromSearch && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeAhead(e.key);
    }
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (open) { onListKeys(e, false); return; }
    if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); openMenu(); }
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeAhead(e.key);
  };

  const onSearch = (e) => {
    const q = e.target.value;
    setQuery(q);
    const t = q.trim().toLowerCase();
    const first = rows.filter((o) => !t || o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t))
      .findIndex((o) => !o.disabled);
    setActive(first);
  };

  const menu = open && pos && typeof document !== 'undefined' ? createPortal(
    <div
      ref={menuRef}
      className={`ks-menu ${pos.bottom != null ? 'is-up' : ''} ${menuClassName}`}
      style={pos}
      // Keep focus where it is (trigger or search) when a row is pressed.
      onMouseDown={(e) => { if (e.target !== searchRef.current) e.preventDefault(); }}
    >
      {withSearch && (
        <div className="ks-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={onSearch}
            onKeyDown={(e) => onListKeys(e, true)}
            placeholder="Search"
            aria-label="Search options"
            aria-controls={listId}
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      )}
      <ul id={listId} role="listbox" aria-label={ariaLabel} className="ks-list">
        {visible.map((o, i) => {
          const isSel = o.value === current;
          return (
            <li
              key={`${o.value}-${i}`}
              id={`${listId}-${i}`}
              data-i={i}
              role="option"
              aria-selected={isSel}
              aria-disabled={o.disabled || undefined}
              className={`ks-opt${isSel ? ' is-sel' : ''}${i === active ? ' is-active' : ''}${o.disabled ? ' is-off' : ''}`}
              onMouseEnter={() => !o.disabled && setActive(i)}
              onClick={() => pick(o)}
            >
              <span className="ks-opt-label">{o.label || placeholder}</span>
              {isSel && <Tick />}
            </li>
          );
        })}
        {!visible.length && <li className="ks-empty" role="presentation">No matches</li>}
      </ul>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        id={id}
        className={`ks-trigger ${open ? 'is-open' : ''} ${className}`}
        style={style}
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && !withSearch && active >= 0 ? `${listId}-${active}` : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-required={required || undefined}
        onClick={(e) => { onClick?.(e); if (open) close(); else openMenu(); }}
        onKeyDown={onKeyDown}
      >
        <span className={`ks-value${shown ? '' : ' is-placeholder'}`}>{shown || placeholder}</span>
        <Chevron />
      </button>
      {/* Carries the value for form posts and lets the browser's own "please
          fill in this field" check still run. */}
      {(required || name) && (
        <input
          tabIndex={-1}
          aria-hidden
          className="ks-native"
          name={name}
          value={current}
          required={required}
          onChange={() => {}}
          onFocus={() => btnRef.current?.focus()}
        />
      )}
      {menu}
      <style>{CUSTOM_SELECT_CSS}</style>
    </>
  );
}

export const CUSTOM_SELECT_CSS = `
.ks-trigger{
  display:inline-flex;align-items:center;justify-content:space-between;gap:10px;
  text-align:left;cursor:pointer;min-width:0;background-image:none!important;
  -webkit-tap-highlight-color:transparent;
}
.ks-trigger:disabled{cursor:not-allowed;opacity:.6;}
.ks-trigger:focus{outline:none;}
.ks-trigger:focus-visible,.ks-trigger.is-open{outline:none;border-color:#189E4F;box-shadow:0 0 0 3px rgba(24,158,79,.16);}
.ks-value{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ks-value.is-placeholder{color:#9A9A9A;}
.ks-chev{flex:none;color:#189E4F;transition:transform .2s ease;}
.ks-trigger.is-open .ks-chev{transform:rotate(180deg);}
.ks-native{
  position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;
  border:0;padding:0;margin:0;clip-path:inset(50%);
}
.ks-menu{
  position:fixed;z-index:2147483000;display:flex;flex-direction:column;
  width:max-content;max-width:min(360px,calc(100vw - 16px));overflow:hidden;
  background:#fff;border:1px solid rgba(24,158,79,.18);border-radius:14px;
  box-shadow:0 14px 34px rgba(16,40,28,.14),0 3px 8px rgba(16,40,28,.06);
  animation:ks-in .14s ease-out;transform-origin:top center;
}
.ks-menu.is-up{transform-origin:bottom center;animation-name:ks-in-up;}
@keyframes ks-in{from{opacity:0;transform:translateY(-4px) scale(.98);}to{opacity:1;transform:none;}}
@keyframes ks-in-up{from{opacity:0;transform:translateY(4px) scale(.98);}to{opacity:1;transform:none;}}
.ks-search{
  display:flex;align-items:center;gap:8px;flex:none;margin:6px 6px 2px;padding:0 10px;
  height:38px;border-radius:10px;background:#F4F7F5;color:#8A8A8A;
}
.ks-search input{
  flex:1;min-width:0;height:100%;border:0;outline:none;background:none;padding:0;
  font:inherit;font-size:14px;color:#2B2B2B;box-shadow:none;
}
.ks-search:focus-within{box-shadow:0 0 0 2px rgba(24,158,79,.25);}
.ks-list{
  margin:0;padding:6px;list-style:none;overflow-y:auto;overscroll-behavior:contain;flex:1 1 auto;min-height:0;
}
.ks-opt{
  display:flex;align-items:center;justify-content:space-between;gap:14px;
  padding:9px 12px;border-radius:9px;cursor:pointer;
  font-size:14px;line-height:1.35;color:#2B2B2B;
}
.ks-opt-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ks-opt.is-active{background:#EEF8F1;}
.ks-opt.is-sel{color:#107A3B;font-weight:600;}
.ks-opt.is-off{color:#B5B5B5;cursor:not-allowed;}
.ks-empty{padding:12px;font-size:14px;color:#9A9A9A;text-align:center;}
.ks-tick{flex:none;color:#189E4F;}
.ks-list::-webkit-scrollbar{width:8px;}
.ks-list::-webkit-scrollbar-thumb{background:#D5E7DB;border-radius:8px;border:2px solid #fff;}
@media (max-width:640px){ .ks-opt{padding:11px 12px;font-size:15px;} }
`;
