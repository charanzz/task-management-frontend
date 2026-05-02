import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

export default function Register() {
  const [form, setForm]       = useState({ name:'', email:'', password:'', confirm:'' })
  const [showPw,  setShowPw]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
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
    if (!form.name || !form.email || !form.password) { setError('All fields are required.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }

    setLoading(true); setError('')
    try {
      await authAPI.post('/api/users/register', {
        name:     form.name.trim(),
        email:    form.email.trim(),
        password: form.password,
      })
      setSuccess('Account created! Redirecting to login…')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      const msg = err.response?.data
      if (typeof msg === 'string') {
        setError(msg)
      } else if (msg?.message) {
        setError(msg.message)
      } else if (msg?.errors) {
        setError(Object.values(msg.errors)[0])
      } else {
        setError('Registration failed. Username or email may already be taken.')
      }
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--ink)' }}>

      {/* LEFT PANEL */}
      <div style={{ width:420, flexShrink:0, background:'var(--surface)', borderRight:'1px solid var(--border)', padding:'48px 44px', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-70, right:-70, width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle,rgba(96,165,250,.1),transparent)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(244,114,182,.08),transparent)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:11, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'var(--ink)' }}>⚡</div>
          <span style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>TaskFlow</span>
        </div>

        <div>
          <div style={{ fontSize:40, fontWeight:800, lineHeight:1.15, color:'var(--text)', marginBottom:16 }}>
            Your journey<br/><span style={{ color:'var(--accent3)' }}>starts here.</span>
          </div>
          <p style={{ fontSize:13, lineHeight:1.75, color:'var(--muted)', marginBottom:28 }}>
            Every master was once a beginner.<br/>Start tracking. Start winning.
          </p>
          {[['⚡','Priority-based focus scoring'],['🔥','Daily completion streaks'],['📊','Productivity analytics'],['🔐','Secure JWT authentication']].map(([ic,tx]) => (
            <div key={tx} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'var(--muted)', marginBottom:10 }}>
              <span>{ic}</span>{tx}
            </div>
          ))}
        </div>

        <p style={{ fontSize:11, color:'var(--muted)', opacity:.4 }}>© 2025 TaskFlow · Free forever</p>
      </div>

      {/* RIGHT FORM */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:32 }}>
        <div style={{ width:'100%', maxWidth:400 }}>
          <h1 style={{ fontSize:30, fontWeight:800, color:'var(--text)', marginBottom:6 }}>Create account</h1>
          <p style={{ fontSize:13, color:'var(--muted)', marginBottom:28 }}>Free forever · No credit card needed</p>

          {error && (
            <div style={{ background:'rgba(248,113,113,.08)', border:'1px solid rgba(248,113,113,.25)', borderRadius:10, padding:'11px 14px', fontSize:13, color:'var(--danger)', marginBottom:18 }}>
              ⚠ {error}
            </div>
          )}
          {success && (
            <div style={{ background:'rgba(110,231,183,.08)', border:'1px solid rgba(110,231,183,.25)', borderRadius:10, padding:'11px 14px', fontSize:13, color:'var(--accent)', marginBottom:18 }}>
              ✓ {success}
            </div>
          )}

          <form onSubmit={submit}>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>Username</label>
              <input style={inputStyle} type="text" placeholder="choose a name"
                value={form.name} onChange={e => set('name', e.target.value)}
                onFocus={focus} onBlur={blur_} autoComplete="name" />
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>Email</label>
              <input style={inputStyle} type="email" placeholder="you@email.com"
                value={form.email} onChange={e => set('email', e.target.value)}
                onFocus={focus} onBlur={blur_} autoComplete="email" />
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input style={{ ...inputStyle, paddingRight:44 }}
                  type={showPw ? 'text' : 'password'} placeholder="min. 6 characters"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  onFocus={focus} onBlur={blur_} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:13 }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom:26 }}>
              <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>Confirm Password</label>
              <input style={inputStyle} type={showPw ? 'text' : 'password'} placeholder="repeat password"
                value={form.confirm} onChange={e => set('confirm', e.target.value)}
                onFocus={focus} onBlur={blur_} />
            </div>

            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:13, borderRadius:12, border:'none', background: loading ? 'var(--surface3)' : 'var(--accent)', color:'var(--ink)', fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit' }}>
              {loading
                ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <span style={{ width:15, height:15, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }} />
                    Creating…
                  </span>
                : 'Create Account →'
              }
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:13, color:'var(--muted)', marginTop:22 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--accent)', fontWeight:700, textDecoration:'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}