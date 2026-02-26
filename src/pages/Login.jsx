import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const focus = e => { e.target.style.borderColor = 'var(--accent)' }
  const blur_ = e => { e.target.style.borderColor = 'var(--border2)' }

  const inputStyle = {
    display:'block', width:'100%', padding:'12px 14px',
    background:'var(--surface2)', border:'1px solid var(--border2)',
    borderRadius:12, color:'var(--text)', fontSize:14,
    outline:'none', fontFamily:'inherit', transition:'border-color .2s',
  }

  async function submit(e) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter email and password.'); return }
    setLoading(true); setError('')
    try {
      const res = await authAPI.login({ email: email.trim(), password })

      // Backend returns a plain string token (not JSON object)
      const token = typeof res.data === 'string'
        ? res.data
        : res.data?.token || res.data?.accessToken

      if (!token) throw new Error('No token in response')

      // Save token + user info
      login(token, { username: email.trim(), email: email.trim() })
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data
      setError(typeof msg === 'string' ? msg : msg?.message || 'Invalid email or password.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--ink)' }}>

      {/* LEFT PANEL */}
      <div style={{ width:420, flexShrink:0, background:'var(--surface)', borderRight:'1px solid var(--border)', padding:'48px 44px', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', bottom:-80, left:-80, width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle,rgba(110,231,183,.13),transparent)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'38%', right:-60, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(96,165,250,.08),transparent)', pointerEvents:'none' }} />

        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:11, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'var(--ink)' }}>⚡</div>
          <span style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>TaskFlow</span>
        </div>

        {/* Hero */}
        <div>
          <div style={{ fontSize:44, fontWeight:800, lineHeight:1.1, color:'var(--text)', marginBottom:16 }}>
            Discipline<br/><span style={{ color:'var(--accent)' }}>builds</span><br/>empires.
          </div>
          <p style={{ fontSize:13, lineHeight:1.75, color:'var(--muted)', marginBottom:30 }}>
            Track every task. Build every streak.<br/>Own your focus, own your progress.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[['2.8K','Focus Pts'],['14','Streak'],['47','Done']].map(([v,l]) => (
              <div key={l} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 10px' }}>
                <div style={{ fontSize:22, fontWeight:800, color:'var(--accent)', marginBottom:3 }}>{v}</div>
                <div style={{ fontSize:10, color:'var(--muted)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize:11, color:'var(--muted)', opacity:.4 }}>© 2025 TaskFlow</p>
      </div>

      {/* RIGHT FORM */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:32 }}>
        <div style={{ width:'100%', maxWidth:400 }} className="anim-up">
          <h1 style={{ fontSize:30, fontWeight:800, color:'var(--text)', marginBottom:6 }}>Welcome back</h1>
          <p style={{ fontSize:13, color:'var(--muted)', marginBottom:28 }}>Sign in with your email to continue</p>

          {error && (
            <div style={{ background:'rgba(248,113,113,.08)', border:'1px solid rgba(248,113,113,.25)', borderRadius:10, padding:'11px 14px', fontSize:13, color:'var(--danger)', marginBottom:18 }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={submit}>
            {/* EMAIL FIELD — backend login uses email */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>
                Email
              </label>
              <input
                style={inputStyle}
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={focus}
                onBlur={blur_}
                autoComplete="email"
              />
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom:26 }}>
              <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>
                Password
              </label>
              <div style={{ position:'relative' }}>
                <input
                  style={{ ...inputStyle, paddingRight:44 }}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={focus}
                  onBlur={blur_}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:13 }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:13, borderRadius:12, border:'none', background: loading ? 'var(--surface3)' : 'var(--accent)', color:'var(--ink)', fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
              {loading
                ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <span style={{ width:15, height:15, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }} />
                    Signing in…
                  </span>
                : 'Sign In →'
              }
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:13, color:'var(--muted)', marginTop:22 }}>
            No account?{' '}
            <Link to="/register" style={{ color:'var(--accent)', fontWeight:700, textDecoration:'none' }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}