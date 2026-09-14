'use client';

/**
 * KoottHeader — the koott.in site header, cloned.
 *
 * Measured off the live site at 1265px wide (home and inner pages are identical):
 *   band      63px tall, pinned, solid #063327 (the design; live Wix uses a
 *             translucent brown wash instead)
 *   nav       13px / 400 / uppercase, white, Avenir → Mulish stands in
 *   items     INDIVIDUAL ⌄ · RELATIONSHIP ⌄ · SEXUAL & INTIMACY ⌄ · THERAPISTS
 *   BOOK NOW  109x30 pill, transparent fill, 1px white border, radius 15px
 *   logo      143x56
 *   column    980px, matching the condition pages
 *
 * The three dropdowns are CMS-driven (see ConditionMenu), so publishing a
 * condition page in the admin puts it in the nav with no code change.
 *
 * Responsive:
 *   ≥1024px   full nav (fits from ~930px; 1024 is tablet landscape)
 *   <1024px   burger + drawer; the drawer reuses the menu the header loaded
 *   ≤520px    smaller logo crop and BOOK NOW pill
 * Icon buttons keep their drawn size but get a 44px touch target.
 *
 * One deliberate departure from the live site: koott.in is a Wix marketing site
 * with no accounts, while this app has real auth and dashboards. The account
 * control and its menu are kept, drawn to match the header rather than dropped.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import {
  useConditionMenu,
  ConditionCategoryFlyout,
  ConditionMenuMobile,
  pointerLeft,
} from '@/components/ConditionMenu';

const BOOK_HREF = '/book-malayali-psychologists';

const Caret = ({ open }) => (
  <svg
    width="9" height="6" viewBox="0 0 9 6" aria-hidden focusable="false"
    className={`kh-caret ${open ? 'is-open' : ''}`}
  >
    <path d="M1 1l3.5 3.5L8 1" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const AccountIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
  </svg>
);

export default function KoottHeader({ conditionMenu } = {}) {
  // Starts from the server-rendered menu (app/layout.js), refreshed in the browser.
  const cats = useConditionMenu({ initial: conditionMenu });
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const [openCat, setOpenCat] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Close everything on navigation.
  useEffect(() => {
    setOpenCat(null);
    setUserMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Click-away for the desktop menus.
  useEffect(() => {
    if (!openCat && !userMenuOpen) return;
    const onDown = (e) => {
      if (!e.target.closest('.kh-nav') && !e.target.closest('.counselling-dropdown')) setOpenCat(null);
      if (!e.target.closest('.kh-user')) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openCat, userMenuOpen]);

  // The drawer must not leave the page scrollable behind it; Escape closes it.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  // Rotating a tablet into the desktop layout must not leave the drawer (and the
  // body scroll lock) behind.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e) => { if (e.matches) setMobileOpen(false); };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [mobileOpen]);

  const displayName = user?.name || user?.first_name || user?.email?.split('@')[0] || 'Account';

  const onLogout = async () => {
    setUserMenuOpen(false);
    try { await logout(); } catch (_) { /* already signed out */ }
    router.push('/');
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="kh">
        <div className="kh-in">
          <Link href="/" className="kh-logo" aria-label="Koott home">
            {/* public/logo.png is the green wordmark centred in a square with wide
                margins. The box crops that padding away and the filter renders it
                white, matching the live 143x56 mark on the dark band. */}
            <img src="/logo.png" alt="Koott" width={210} height={210} />
          </Link>

          {/* ---- desktop nav ---- */}
          <nav className="kh-nav" aria-label="Main">
            {cats.map((cat) => (
              <div
                key={cat.key}
                className="kh-item"
                onMouseEnter={() => setOpenCat(cat.key)}
                onMouseLeave={(e) => { if (pointerLeft(e)) setOpenCat(null); }}
              >
                <button
                  type="button"
                  className="kh-link"
                  aria-expanded={openCat === cat.key}
                  onClick={() => setOpenCat(openCat === cat.key ? null : cat.key)}
                >
                  {cat.label}
                  <Caret open={openCat === cat.key} />
                </button>
                {openCat === cat.key && (
                  <ConditionCategoryFlyout category={cat} onNavigate={() => setOpenCat(null)} />
                )}
              </div>
            ))}

            <Link href={BOOK_HREF} className="kh-link kh-link--plain">THERAPISTS</Link>
          </nav>

          {/* ---- right side ---- */}
          <div className="kh-right">
            {isAuthenticated() ? (
              <div className="kh-user">
                <button
                  type="button"
                  className="kh-icon"
                  aria-label="Account menu"
                  aria-expanded={userMenuOpen}
                  onClick={() => setUserMenuOpen((v) => !v)}
                >
                  <AccountIcon />
                </button>
                {userMenuOpen && (
                  <div className="kh-usermenu">
                    <p className="kh-uname">{displayName}</p>
                    {user?.email && <p className="kh-umail">{user.email}</p>}
                    <button type="button" onClick={() => { setUserMenuOpen(false); router.push('/profile'); }}>
                      Dashboard
                    </button>
                    <button type="button" className="is-danger" onClick={onLogout}>Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="kh-icon"
                aria-label="Log in"
                onClick={() => setShowAuth(true)}
              >
                <AccountIcon />
              </button>
            )}

            <Link href={BOOK_HREF} className="kh-book">BOOK NOW</Link>

            <button
              type="button"
              className="kh-burger"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span className={mobileOpen ? 'is-x' : ''} />
              <span className={mobileOpen ? 'is-x' : ''} />
              <span className={mobileOpen ? 'is-x' : ''} />
            </button>
          </div>
        </div>

        {/* ---- mobile / tablet drawer ---- */}
        {mobileOpen && (
          <>
            <button
              type="button" className="kh-scrim" aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <div className="kh-drawer">
              <ConditionMenuMobile cats={cats} onNavigate={() => setMobileOpen(false)} />
              <Link href={BOOK_HREF} className="kh-drawer-link" onClick={() => setMobileOpen(false)}>
                THERAPISTS
              </Link>
              <div className="kh-drawer-foot">
                {isAuthenticated() ? (
                  <>
                    <button type="button" onClick={() => { setMobileOpen(false); router.push('/profile'); }}>Dashboard</button>
                    <button type="button" className="is-danger" onClick={onLogout}>Logout</button>
                  </>
                ) : (
                  <button type="button" onClick={() => { setMobileOpen(false); setShowAuth(true); }}>Login</button>
                )}
                <Link href={BOOK_HREF} className="kh-book is-wide" onClick={() => setMobileOpen(false)}>BOOK NOW</Link>
              </div>
            </div>
          </>
        )}
      </header>

      {showAuth && <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />}
    </>
  );
}

const CSS = `
.kh{
  /* Live uses position:sticky at top:0 and stays translucent at every scroll
     position. Fixed is visually identical while reserving no space in flow,
     which is what the previous header did — so every page that already adds its
     own 64px top offset keeps working unchanged. */
  position:fixed;top:0;left:0;right:0;z-index:60;
  height:63px;
  /* Solid dark green, sampled from the Sep-26 design. The live Wix site washes a
     translucent brown over the page instead; the design's opaque band is what
     this follows, and it keeps the white nav legible over any hero. */
  background:#063327;
  font-family:'Mulish',ui-sans-serif,system-ui,sans-serif;
}
.kh *{box-sizing:border-box;}
.kh-in{
  max-width:1180px;margin:0 auto;height:100%;padding:0 24px;
  display:flex;align-items:center;gap:20px;
}
.kh-logo{position:relative;flex:none;display:block;width:148px;height:46px;overflow:hidden;}
.kh-logo img{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:210px;height:210px;max-width:none;
  /* Green wordmark -> flat white, the treatment the live header uses. */
  filter:brightness(0) invert(1);
}

.kh-nav{display:flex;align-items:center;gap:26px;margin-left:auto;}
.kh-item{position:relative;display:flex;align-items:center;height:63px;}
.kh-link{
  display:inline-flex;align-items:center;gap:6px;
  background:none;border:0;cursor:pointer;padding:0;
  font-family:inherit!important;font-size:13px!important;font-weight:400!important;
  line-height:1!important;letter-spacing:.01em!important;text-transform:uppercase;
  color:#fff!important;text-decoration:none;white-space:nowrap;opacity:.94;
  transition:opacity .16s ease;
}
.kh-link:hover{opacity:1;}
.kh-link:focus-visible,.kh-icon:focus-visible,.kh-burger:focus-visible,.kh-book:focus-visible{
  outline:2px solid #9BE7B4;outline-offset:3px;border-radius:6px;
}
.kh-link--plain{display:inline-flex;align-items:center;}
.kh-caret{transition:transform .18s ease;}
.kh-caret.is-open{transform:rotate(180deg);}

.kh-right{display:flex;align-items:center;gap:6px;flex:none;}
/* Drawn at 21px, tapped at 44px. */
.kh-icon{
  background:none;border:0;padding:0;cursor:pointer;color:#fff;opacity:.94;
  display:inline-flex;align-items:center;justify-content:center;
  width:44px;height:44px;border-radius:50%;
}
.kh-icon:hover{opacity:1;background:rgba(255,255,255,.08);}
.kh-book{
  display:inline-flex;align-items:center;justify-content:center;
  width:109px;height:30px;border-radius:15px;margin-left:6px;
  border:1px solid #fff;background:transparent;
  font-family:inherit!important;font-size:13px!important;font-weight:400!important;
  letter-spacing:.01em!important;color:#fff!important;text-decoration:none;white-space:nowrap;
  transition:background .18s ease,color .18s ease;
}
.kh-book:hover{background:#fff;color:#29653D!important;}
.kh-book.is-wide{width:100%;height:46px;border-radius:23px;margin:4px 0 0;font-size:14px!important;}

/* Menu labels inside the dropdowns and the mobile drawer. globals.css sets
   h1-h6 to 60/48/36px with !important, which beats inline styles — so those
   labels are spans, and their size is pinned here rather than left to inherit. */
.kcm-label{
  font-family:'Mulish',ui-sans-serif,system-ui,sans-serif!important;
  letter-spacing:.02em!important;
  line-height:1.2!important;
  margin:0!important;
}

.kh-user{position:relative;}
.kh-usermenu{
  position:absolute;top:calc(100% + 10px);right:0;width:220px;max-width:calc(100vw - 24px);
  background:#fff;border:1px solid rgba(38,34,34,.13);border-radius:10px;
  box-shadow:0 8px 26px rgba(16,14,14,.14);padding:14px;z-index:70;
}
.kh-uname{margin:0;font-size:14px!important;font-weight:600!important;color:#100E0E!important;letter-spacing:0!important;}
.kh-umail{margin:2px 0 10px;font-size:12px!important;color:#5B5757!important;letter-spacing:0!important;word-break:break-all;}
.kh-usermenu button{
  display:block;width:100%;text-align:left;background:none;border:0;cursor:pointer;
  padding:10px 8px;border-radius:6px;font-family:inherit;font-size:14px;color:#100E0E;
}
.kh-usermenu button:hover{background:#F5FFF6;}
.kh-usermenu button.is-danger{color:#B3261E;}
.kh-usermenu button.is-danger:hover{background:#FDF2F2;}

/* Drawn as three 22px lines, tapped at 44px. */
.kh-burger{
  display:none;flex-direction:column;align-items:center;justify-content:center;gap:5px;
  width:44px;height:44px;margin-right:-10px;background:none;border:0;padding:0;cursor:pointer;border-radius:50%;
}
.kh-burger:hover{background:rgba(255,255,255,.08);}
.kh-burger span{display:block;height:1.6px;width:22px;background:#fff;border-radius:2px;transition:transform .2s ease,opacity .2s ease;}
.kh-burger span.is-x:nth-child(1){transform:translateY(6.6px) rotate(45deg);}
.kh-burger span.is-x:nth-child(2){opacity:0;}
.kh-burger span.is-x:nth-child(3){transform:translateY(-6.6px) rotate(-45deg);}

/* Tapping the dimmed page closes the drawer. */
.kh-scrim{
  position:fixed;left:0;right:0;top:63px;bottom:0;border:0;padding:0;cursor:pointer;
  background:rgba(1,47,35,.35);
}
.kh-drawer{
  position:absolute;top:63px;left:0;right:0;
  /* dvh so the bottom rows sit above a phone's browser toolbar, not under it. */
  max-height:calc(100vh - 63px);max-height:calc(100dvh - 63px);
  overflow-y:auto;overscroll-behavior:contain;
  background:#fff;border-top:1px solid rgba(38,34,34,.1);
  box-shadow:0 10px 26px rgba(16,14,14,.14);padding:10px 18px 22px;
  padding-bottom:max(22px, env(safe-area-inset-bottom));
}
.kh-drawer .kcm-row{min-height:46px;background:none;border:0;text-align:left;}
.kh-drawer .kcm-mobile a{min-height:40px;display:flex!important;align-items:center;}
.kh-drawer-link{
  display:flex;align-items:center;min-height:46px;padding:0 10px;text-decoration:none;
  font-size:16px!important;font-weight:500!important;letter-spacing:.02em!important;color:#100E0E!important;
}
.kh-drawer-foot{margin-top:10px;padding-top:12px;border-top:1px solid rgba(38,34,34,.1);display:flex;flex-direction:column;gap:6px;}
.kh-drawer-foot button{
  background:none;border:0;text-align:left;cursor:pointer;min-height:46px;padding:0 10px;
  font-family:inherit;font-size:16px;color:#100E0E;
}
.kh-drawer-foot button.is-danger{color:#B3261E;}
.kh-drawer-foot .kh-book{color:#100E0E!important;border-color:rgba(38,34,34,.4);}
.kh-drawer-foot .kh-book:hover{background:#F5FFF6;color:#29653D!important;}

/* Tablet (portrait) and down: burger + drawer. On a wide tablet the drawer is a
   right-hand panel rather than a full-width sheet. */
@media (max-width:1023px){
  .kh-nav{display:none;}
  .kh-burger{display:flex;}
  .kh-in{gap:12px;}
  .kh-right{margin-left:auto;}
}
@media (min-width:641px) and (max-width:1023px){
  .kh-drawer{left:auto;width:380px;border-left:1px solid rgba(38,34,34,.1);}
}
/* Narrow laptops: keep the full nav on one line. */
@media (min-width:1024px) and (max-width:1180px){
  .kh-in{gap:16px;padding:0 20px;}
  .kh-nav{gap:20px;}
}
@media (max-width:520px){
  .kh-in{padding:0 14px 0 16px;gap:8px;}
  .kh-right{gap:2px;}
  .kh-book{width:92px;font-size:12px!important;margin-left:2px;}
  /* Shrink the crop box, never the image — the image is absolutely sized and
     centred inside it, so resizing the image alone distorts the wordmark. */
  .kh-logo{width:112px;height:38px;}
  .kh-logo img{width:170px;height:170px;}
}
@media (max-width:360px){
  .kh-book{width:84px;font-size:11.5px!important;}
  .kh-logo{width:100px;}
}
`;
