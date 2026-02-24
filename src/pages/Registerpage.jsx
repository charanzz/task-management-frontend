import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function RegisterPage() {
  const [form, setForm]       = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) { setError('All fields are required.'); return; }
    if (form.password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      await authAPI.register({ username: form.username, email: form.email, password: form.password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try a different username.');
    } finally { setLoading(false); }
  };

  const Field = ({ label, name, type='text', placeholder }) => (
    <div>
      <label className="block text-xs font-semibold mb-2 tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
        {label}
      </label>
      <input
        type={type === 'password' ? (showPw ? 'text' : 'password') : type}
        placeholder={placeholder}
        value={form[name]}
        onChange={e => setForm({...form, [name]: e.target.value})}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', fontFamily: 'inherit' }}
        onFocus={e => e.target.style.borderColor='var(--accent)'}
        onBlur={e => e.target.style.borderColor='var(--border2)'}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--ink)', fontFamily: "'Bricolage Grotesque', sans-serif" }}>

      {/* LEFT */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, var(--accent3), transparent)' }}/>
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, var(--accent2), transparent)' }}/>

        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: 'var(--accent)', color: 'var(--ink)' }}>⚡</div>
          <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>TaskFlow</span>
        </div>

        <div className="animate-fade-up">
          <div className="text-4xl font-extrabold leading-tight mb-5" style={{ color: 'var(--text)' }}>
            Your journey<br/>starts <span style={{ color: 'var(--accent3)' }}>here.</span>
          </div>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--muted)' }}>
            Every master was once a beginner.<br/>Start tracking. Start winning.
          </p>
          <div className="space-y-3">
            {[
              { icon: '⚡', text: 'Priority-based focus scoring' },
              { icon: '🔥', text: 'Daily completion streaks' },
              { icon: '📊', text: 'Productivity analytics dashboard' },
              { icon: '🔐', text: 'Secure JWT authentication' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm" style={{ color: 'var(--muted)' }}>
                <span>{f.icon}</span> {f.text}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.4 }}>
          © 2025 TaskFlow · Free forever
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-up">
          <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--text)' }}>Create account</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>Free forever · No credit card needed</p>

          {error && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6 text-sm animate-fade-in"
              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--danger)' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Username"         name="username"        placeholder="choose a username" />
            <Field label="Email"            name="email"           type="email" placeholder="you@email.com" />
            <div>
              <label className="block text-xs font-semibold mb-2 tracking-widest uppercase" style={{ color: 'var(--muted)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="min. 6 characters"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor='var(--accent)'}
                  onBlur={e => e.target.style.borderColor='var(--border2)'}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <Field label="Confirm Password" name="confirmPassword" type="password" placeholder="repeat password" />

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 mt-2"
              style={{ background: loading ? 'var(--surface3)' : 'var(--accent)', color: 'var(--ink)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full inline-block" style={{ animation: 'spin 0.7s linear infinite' }}/>
                  Creating…
                </span>
              ) : 'Create Account →'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}