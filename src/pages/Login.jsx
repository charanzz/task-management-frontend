import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [form,    setForm]    = useState({ username: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    try {
      const res = await authAPI.login(form)
      // handle both { token } and { token, username } response shapes
      const token    = res.data.token    || res.data.accessToken
      const username = res.data.username || form.username
      login(token, { username })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--ink)', fontFamily:"'Bricolage Grotesque',sans-serif" }}>

      {/* ── LEFT PANEL (hidden on mobile) ── */}
      <div style={{
        width: 440, flexShrink: 0, background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 44px', position: 'relative', overflow: 'hidden',
      }} className="hidden lg:flex">
        {/* Glow orbs */}
        <div style={{ position:'absolute', bottom:-80, left:-80, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(110,231,183,0.12), transparent)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'35%', right:-60, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(96,165,250,0.08), transparent)', pointerEvents:'none' }}/>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'var(--ink)', flexShrink:0 }}>⚡</div>
          <span style={{ fontSize:20, fontWeight:800, color:'var(--text)', letterSpacing:'-0.3px' }}>TaskFlow</span>
        </div>

        {/* Hero text */}
        <div>
          <div style={{ fontSize:46, fontWeight:800, lineHeight:1.1, color:'var(--text)', marginBottom:16 }}>
            Discipline<br/>
            <span style={{ color:'var(--accent)' }}>builds</span><br/>
            empires.
          </div>
          <p style={{ fontSize:13, lineHeight:1.7, color:'var(--muted)', marginBottom:32 }}>
            Track every task. Build every streak.<br/>Measure your focus, own your progress.
          </p>
          {/* Mini stat chips */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[['2.8K','Focus Pts'],['14','Day Streak'],['47','Completed']].map(([v,l],i) => (
              <div key={i} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 12px' }}>
                <div style={{ fontSize:22, fontWeight:800, color:'var(--accent)', marginBottom:2 }}>{v}</div>
                <div style={{ fontSize:10, color:'var(--muted)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize:11, color:'var(--muted)', opacity:0.4 }}>© 2025 TaskFlow</p>
      </div>

      {/* ── RIGHT FORM ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:32 }}>
        <div style={{ width:'100%', maxWidth:400 }} className="anim-up">

          <h1 style={{ fontSize:30, fontWeight:800, color:'var(--text)', marginBottom:6 }}>Welcome back</h1>
          <p style={{ fontSize:13, color:'var(--muted)', marginBottom:28 }}>Sign in to continue your streak</p>

          {error && (
            <div className="anim-in" style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.25)', borderRadius:12, padding:'12px 16px', marginBottom:20, fontSize:13, color:'var(--danger)' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>Username</label>
              <input
                type="text" placeholder="your username"
                value={form.username} onChange={e => set('username', e.target.value)}
                style={{ display:'block', width:'100%', padding:'12px 16px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:12, color:'var(--text)', fontFamily:'inherit', fontSize:14, outline:'none', transition:'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border2)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  style={{ display:'block', width:'100%', padding:'12px 44px 12px 16px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:12, color:'var(--text)', fontFamily:'inherit', fontSize:14, outline:'none', transition:'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor='var(--accent)'}
                  onBlur={e => e.target.style.borderColor='var(--border2)'}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:13 }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'13px', borderRadius:12, border:'none', background: loading ? 'var(--surface3)' : 'var(--accent)', color:'var(--ink)', fontFamily:'inherit', fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', transition:'all 0.2s' }}>
              {loading
                ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <span style={{ width:16, height:16, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }}/>
                    Signing in…
                  </span>
                : 'Sign In →'
              }
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:13, color:'var(--muted)', marginTop:24 }}>
            No account?{' '}
            <Link to="/register" style={{ color:'var(--accent)', fontWeight:700, textDecoration:'none' }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}