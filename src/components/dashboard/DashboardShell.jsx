'use client';

/**
 * The frame for the staff dashboards (Operations, HR, Staff and the Marketing pages):
 * the Koott green sidebar on laptops, a top bar with a slide-in menu on phones, a role
 * check (anyone else goes to the staff login), the signed-in person and Sign out, and
 * the task dock (notifications, quick add, report a problem) on every page.
 *
 * nav = [{ group: 'Leads', items: [{ label, href, icon, exact? }] }]
 */
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABEL, dashboardFor } from '@/lib/staffRoles';
import TaskDock from '@/components/tasks/TaskDock';

function NavList({ nav, pathname, onNavigate }) {
  return (
    <nav className="space-y-5">
      {nav.map((g) => (
        <div key={g.group || 'main'}>
          {g.group && <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-100/50">{g.group}</div>}
          <div className="space-y-0.5">
            {g.items.map((it) => {
              const Icon = it.icon;
              const active = it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(`${it.href}/`);
              return (
                <a key={it.href} href={it.href} onClick={onNavigate} aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${active ? 'font-medium text-white' : 'text-emerald-50/80 hover:bg-white/10 hover:text-white'}`}
                  style={active ? { background: 'rgba(255,255,255,.12)' } : undefined}>
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  <span className="truncate">{it.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function DashboardShell({ title, roles, nav, children }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';
  const [menu, setMenu] = useState(false);
  const signedIn = isAuthenticated();
  const allowed = signedIn && (roles.includes(user?.role) || ['admin', 'superadmin'].includes(user?.role));

  useEffect(() => {
    if (isLoading) return;
    if (!signedIn) { router.replace(`/staff-login?next=${encodeURIComponent(pathname)}`); return; }
    if (!allowed) router.replace(dashboardFor(user?.role) || '/');
  }, [isLoading, signedIn, allowed, user, router, pathname]);
  useEffect(() => { setMenu(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    const esc = (e) => { if (e.key === 'Escape') setMenu(false); };
    if (menu) document.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', esc); };
  }, [menu]);

  if (isLoading || !allowed) {
    return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">Checking access…</div>;
  }

  const who = (
    <div className="border-t border-white/10 px-4 py-4">
      <div className="truncate text-sm font-medium text-white">{user?.name || user?.email}</div>
      <div className="text-xs text-emerald-100/60">{ROLE_LABEL[user?.role] || user?.role}</div>
      <div className="mt-2 flex gap-3 text-xs">
        {['admin', 'superadmin'].includes(user?.role) && <a href={dashboardFor(user.role)} className="text-emerald-100/80 hover:text-white">Admin panel</a>}
        <button type="button" onClick={() => { logout(); window.location.href = '/staff-login'; }} className="text-emerald-100/80 hover:text-white">Sign out</button>
      </div>
    </div>
  );
  const brand = (
    <a href={nav[0]?.items[0]?.href || '/'} className="flex items-center gap-2.5 px-4 py-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-[#025545]">K</span>
      <span className="leading-tight"><span className="block text-sm font-semibold text-white">Koott</span><span className="block text-[11px] text-emerald-100/60">{title}</span></span>
    </a>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Laptop / desktop: fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-[#033D30] lg:flex">
        {brand}
        <div className="flex-1 overflow-y-auto px-2 py-2"><NavList nav={nav} pathname={pathname} /></div>
        {who}
      </aside>

      {/* Phone / tablet: top bar + slide-in menu */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-[#033D30] px-3 lg:hidden">
        <a href={nav[0]?.items[0]?.href || '/'} className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-[#025545]">K</span>
          <span className="text-sm font-semibold text-white">Koott · {title}</span>
        </a>
        <button type="button" onClick={() => setMenu(true)} className="rounded-lg p-2 text-white hover:bg-white/10" aria-label="Open menu">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </header>
      {menu && (
        <div className="fixed inset-0 z-[96] lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMenu(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-[#033D30] shadow-2xl">
            <div className="flex items-center justify-between pr-2">
              {brand}
              <button type="button" onClick={() => setMenu(false)} className="rounded-lg p-2 text-white hover:bg-white/10" aria-label="Close menu">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2"><NavList nav={nav} pathname={pathname} onNavigate={() => setMenu(false)} /></div>
            {who}
          </aside>
        </div>
      )}

      <main className="min-w-0 pb-24 lg:ml-60">{children}</main>
      <TaskDock />
    </div>
  );
}

/** A page heading block used by the dashboard pages. */
export function PageHead({ title, sub, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="text-2xl font-semibold text-slate-900" role="heading" aria-level={1}>{title}</div>
        {sub && <div className="mt-0.5 text-sm text-slate-500">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
