import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm]       = useState({ username: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    try {
      const res = await authAPI.login(form);
      login(res.data.token, { username: res.data.username });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--ink)', fontFamily: "'Bricolage Grotesque', sans-serif" }}>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>

        {/* Decorative circles */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, var(--accent), transparent)' }}/>
        <div className="absolute top-1/3 -right-16 w-48 h-48 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, var(--accent3), transparent)' }}/>

        {/* Brand */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'var(--accent)', color: 'var(--ink)' }}>⚡</div>
          <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>TaskFlow</span>
        </div>

        {/* Quote */}
        <div className="animate-fade-up">
          <div className="text-5xl font-extrabold leading-tight mb-6" style={{ color: 'var(--text)' }}>
            Discipline<br/>
            <span style={{ color: 'var(--accent)' }}>builds</span><br/>
            empires.
          </div>
          <p className="text-sm leading-relaxed mb-10" style={{ color: 'var(--muted)' }}>
            Track every task. Build every streak.<br/>
            Measure your focus, own your progress.
          </p>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { val: '2.8K', lbl: 'Focus Pts' },
              { val: '14',   lbl: 'Day Streak' },
              { val: '47',   lbl: 'Completed' },
            ].map((s,i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <div className="text-2xl font-extrabold mb-1" style={{ color: 'var(--accent)' }}>{s.val}</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.5 }}>
          © 2025 TaskFlow · Behavioral Productivity Engine
        </p>
      </div>

      {/* ── RIGHT FORM ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-up">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: 'var(--accent)', color: 'var(--ink)' }}>⚡</div>
            <span className="text-lg font-bold" style={{ color: 'var(--text)' }}>TaskFlow</span>
          </div>

          <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--text)' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
            Sign in to continue your streak
          </p>

          {error && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6 text-sm animate-fade-in"
              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--danger)' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold mb-2 tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
                Username
              </label>
              <input
                type="text"
                placeholder="your username"
                value={form.username}
                onChange={e => setForm({...form, username: e.target.value})}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border2)',
                  color: 'var(--text)',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border2)'}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold mb-2 tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border2)',
                    color: 'var(--text)',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => e.target.style.borderColor='var(--accent)'}
                  onBlur={e => e.target.style.borderColor='var(--border2)'}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 mt-2"
              style={{
                background: loading ? 'var(--surface3)' : 'var(--accent)',
                color: 'var(--ink)',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.3px',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full inline-block" style={{ animation: 'spin 0.7s linear infinite' }}/>
                  Signing in…
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--muted)' }}>
            No account?{' '}
            <Link to="/register" className="font-semibold transition-colors duration-150"
              style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}