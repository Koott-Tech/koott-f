'use client';

/**
 * One staff login page for everyone who works at Koott — Admin, Operations, HR,
 * Marketing, Finance, event organizers, staff and therapists. After signing in each
 * person goes to their own dashboard (one email, one role, one dashboard).
 * ?next=/some/dashboard/page returns there when that page belongs to the role.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/backendApi';
import { ROLE_LABEL, dashboardFor } from '@/lib/staffRoles';
import AuthModal from '@/components/AuthModal';

function destination(role) {
  const home = dashboardFor(role);
  if (!home) return null;
  try {
    const next = new URLSearchParams(window.location.search).get('next');
    const adminish = role === 'admin' || role === 'superadmin';
    if (next && next.startsWith('/') && !next.startsWith('//') && (next === home || next.startsWith(`${home}/`) || next.startsWith('/tasks/open') || adminish)) return next;
  } catch (_) { /* no window */ }
  return home;
}

export default function StaffLogin() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated() && dashboardFor(user?.role)) window.location.replace(destination(user.role));
  }, [isLoading, user, isAuthenticated]);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const data = await authApi.login({ email: email.trim(), password });
      const u = data?.data?.user; const token = data?.data?.token;
      if (!u || !token) throw new Error(data?.message || 'Sign-in failed.');
      if (!dashboardFor(u.role)) {
        setError('This is the staff login. Clients sign in from the Log In button on koott.in.');
        return;
      }
      login(u, token, { remember: true });
      window.location.replace(destination(u.role));
    } catch (err) {
      setError(err?.message || 'Wrong email or password.');
    } finally {
      setBusy(false);
    }
  };

  const client = isAuthenticated() && user && !dashboardFor(user.role);

  return (
    <main className="stl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <form className="stl-card" onSubmit={submit}>
        <div className="stl-brand"><span className="stl-mk" aria-hidden="true">K</span><div><b>Koott</b><span>Team sign-in</span></div></div>
        <div className="stl-h" role="heading" aria-level={1}>Sign in to your dashboard</div>
        <div className="stl-sub">For everyone who works at Koott — therapists, operations, HR, marketing, finance and the team.</div>

        {client && (
          <div className="stl-note">You are signed in as {user.email} ({ROLE_LABEL[user.role] || user.role}). <button type="button" onClick={() => logout()}>Sign out</button></div>
        )}

        <label htmlFor="stl-email">Work email</label>
        <input id="stl-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="stl-pass">Password</label>
        <input id="stl-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div className="stl-err" role="alert">{error}</div>}
        <button className="stl-btn" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <button type="button" className="stl-forgot" onClick={() => setResetOpen(true)}>Forgot password?</button>
      </form>
      {/* The site's sign-in window holds the password reset ("Forgot password?" inside it). */}
      <AuthModal open={resetOpen} onClose={() => setResetOpen(false)} />
    </main>
  );
}

const CSS = `
.stl{min-height:100vh;display:grid;place-items:center;background:#F3F6F4;padding:24px 16px;font-family:'Inter',ui-sans-serif,system-ui,sans-serif}
.stl-card{width:100%;max-width:400px;background:#fff;border:1px solid #DCE4DE;border-radius:16px;padding:28px;display:flex;flex-direction:column;gap:8px;box-shadow:0 10px 30px rgba(6,51,39,.08)}
.stl-brand{display:flex;gap:10px;align-items:center;margin-bottom:10px}
.stl-mk{width:34px;height:34px;border-radius:9px;background:#025545;color:#fff!important;display:grid;place-items:center;font-weight:800;font-size:16px}
.stl-brand b{display:block;color:#131C16;font-size:14px}
.stl-brand span{font-size:12px;color:#6A776E}
.stl-h{font-size:22px;margin:4px 0 0;color:#131C16;line-height:1.2;font-weight:700}
.stl-sub{margin:0 0 10px;font-size:13px;color:#6A776E}
.stl label{font-size:12.5px;font-weight:600;color:#3A463E;margin-top:6px}
.stl input{border:1px solid #CFDAD2;border-radius:10px;padding:10px 12px;font-size:16px;font-family:inherit;color:#131C16}
.stl input:focus{outline:2px solid #025545;outline-offset:1px;border-color:#025545}
.stl-btn{margin-top:12px;background:#025545;color:#fff;border:0;border-radius:10px;padding:11px;font-size:14.5px;font-weight:700;cursor:pointer;font-family:inherit}
.stl-btn:disabled{opacity:.7;cursor:wait}
.stl-err{margin:4px 0 0;color:#B42318;font-size:13px}
.stl-note{background:#FFF6DF;color:#6B4A00;border-radius:10px;padding:10px 12px;font-size:13px}
.stl-note button{background:none;border:0;color:#025545;text-decoration:underline;cursor:pointer;font:inherit;padding:0}
.stl-forgot{align-self:center;margin-top:6px;font-size:13px;color:#025545;background:none;border:0;cursor:pointer;font-family:inherit}
`;
