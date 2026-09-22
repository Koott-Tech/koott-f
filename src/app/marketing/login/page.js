'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/backendApi';

const ROLES = ['marketing', 'admin', 'superadmin'];

export default function MarketingLogin() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated() && ROLES.includes(user?.role)) router.replace('/marketing');
  }, [isLoading, user, isAuthenticated, router]);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const data = await authApi.login({ email: email.trim(), password });
      const u = data?.data?.user; const token = data?.data?.token;
      if (!u || !token) throw new Error(data?.message || 'Sign-in failed.');
      if (!ROLES.includes(u.role)) {
        setError('This account does not have access to the marketing dashboard.');
        return;
      }
      login(u, token, { remember: true });
      router.replace('/marketing');
    } catch (err) {
      setError(err?.message || 'Wrong email or password.');
    } finally {
      setBusy(false);
    }
  };

  const signedInElsewhere = isAuthenticated() && user && !ROLES.includes(user.role);

  return (
    <main className="mkl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <form className="mkl-card" onSubmit={submit}>
        <div className="mkl-brand"><span className="mkl-mk" aria-hidden="true">K</span><div><b>Koott Insights</b><span>Marketing &amp; analytics</span></div></div>
        <h1>Sign in</h1>
        <p className="mkl-sub">For the Koott marketing team. Totals only — no client details are shown here.</p>

        {signedInElsewhere && (
          <p className="mkl-note">You are signed in as {user.email} ({user.role}), which has no dashboard access. <button type="button" onClick={() => logout()}>Sign out</button></p>
        )}

        <label htmlFor="mkl-email">Work email</label>
        <input id="mkl-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="mkl-pass">Password</label>
        <input id="mkl-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="mkl-err" role="alert">{error}</p>}
        <button className="mkl-btn" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>

      </form>
    </main>
  );
}

const CSS = `
.mkl{min-height:100vh;display:grid;place-items:center;background:#F3F6F4;padding:24px 16px;font-family:'Public Sans','Work Sans',ui-sans-serif,system-ui,sans-serif}
.mkl-card{width:100%;max-width:400px;background:#fff;border:1px solid #DCE4DE;border-radius:16px;padding:28px;display:flex;flex-direction:column;gap:8px;box-shadow:0 10px 30px rgba(6,51,39,.08)}
.mkl-brand{display:flex;gap:10px;align-items:center;margin-bottom:10px}
.mkl-mk{width:34px;height:34px;border-radius:9px;background:#1B6930;color:#fff!important;display:grid;place-items:center;font-weight:800;font-size:16px}
.mkl-brand b{display:block;color:#131C16;font-size:14px}
.mkl-brand span{font-size:12px;color:#6A776E}
.mkl h1{font-size:22px!important;margin:4px 0 0!important;color:#131C16!important;letter-spacing:-.01em!important;line-height:1.2!important;font-weight:750!important}
.mkl-sub{margin:0 0 10px;font-size:13px;color:#6A776E}
.mkl label{font-size:12.5px;font-weight:600;color:#3A463E;margin-top:6px}
.mkl input{border:1px solid #CFDAD2;border-radius:10px;padding:10px 12px;font-size:14px;font-family:inherit;color:#131C16}
.mkl input:focus{outline:2px solid #1B6930;outline-offset:1px;border-color:#1B6930}
.mkl-btn{margin-top:12px;background:#1B6930;color:#fff;border:0;border-radius:10px;padding:11px;font-size:14.5px;font-weight:700;cursor:pointer;font-family:inherit}
.mkl-btn:disabled{opacity:.7;cursor:wait}
.mkl-err{margin:4px 0 0;color:#B42318;font-size:13px}
.mkl-note{background:#FFF6DF;color:#6B4A00;border-radius:10px;padding:10px 12px;font-size:13px;margin:0}
.mkl-note button{background:none;border:0;color:#1B6930;text-decoration:underline;cursor:pointer;font:inherit;padding:0}
`;
