import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

export default function RegisterPage() {
  const [form,    setForm]    = useState({ username:'', email:'', password:'', confirm:'' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)
  const navigate = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.email || !form.password) { setError('All fields are required.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try {
      await authAPI.register({ username: form.username, email: form.email, password: form.password })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Username or email may already be taken.')
    } finally { setLoading(false) }
  }

  const inputStyle = {
    display:'block', width:'100%', padding:'12px 16px',
    background:'var(--surface2)', border:'1px solid var(--border2)',
    borderRadius:12, color:'var(--text)', fontFamily:'inherit',
    fontSize:14, outline:'none', transition:'border-color 0.2s',
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--ink)', fontFamily:"'Bricolage Grotesque',sans-serif" }}>

      {/* LEFT PANEL */}
      <div style={{
        width:440, flexShrink:0, background:'var(--surface)',
        borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column', justifyContent:'space-between',
        padding:'48px 44px', position:'relative', overflow:'hidden',
      }} className="hidden lg:flex">
        <div style={{ position:'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%', background:'radial-gradient(circle, rgba(96,165,250,0.1), transparent)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-60, left:-60, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(244,114,182,0.08), transparent)', pointerEvents:'none' }}/>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'var(--ink)' }}>⚡</div>
          <span style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>TaskFlow</span>
        </div>

        <div>
          <div style={{ fontSize:42, fontWeight:800, lineHeight:1.15, color:'var(--text)', marginBottom:16 }}>
            Your journey<br/><span style={{ color:'var(--accent3)' }}>starts here.</span>
          </div>
          <p style={{ fontSize:13, lineHeight:1.7, color:'var(--muted)', marginBottom:28 }}>
            Every master was once a beginner.<br/>Start tracking. Start winning.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[['⚡','Priority-based focus scoring'],['🔥','Daily completion streaks'],['📊','Productivity analytics'],['🔐','Secure JWT auth']].map(([ic,tx],i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'var(--muted)' }}>
                <span>{ic}</span>{tx}
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize:11, color:'var(--muted)', opacity:0.4 }}>© 2025 TaskFlow · Free forever</p>
      </div>

      {/* RIGHT FORM */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:32 }}>
        <div style={{ width:'100%', maxWidth:400 }} className="anim-up">
          <h1 style={{ fontSize:30, fontWeight:800, color:'var(--text)', marginBottom:6 }}>Create account</h1>
          <p style={{ fontSize:13, color:'var(--muted)', marginBottom:28 }}>Free forever · No credit card needed</p>

          {error && (
            <div className="anim-in" style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.25)', borderRadius:12, padding:'12px 16px', marginBottom:20, fontSize:13, color:'var(--danger)' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {[
              { label:'Username', key:'username', type:'text',     placeholder:'choose a username' },
              { label:'Email',    key:'email',    type:'email',    placeholder:'you@email.com' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>{label}</label>
                <input type={type} placeholder={placeholder} value={form[key]}
                  onChange={e => set(key, e.target.value)} style={inputStyle}
                  onFocus={e => e.target.style.borderColor='var(--accent)'}
                  onBlur={e => e.target.style.borderColor='var(--border2)'} />
              </div>
            ))}

            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPw?'text':'password'} placeholder="min. 6 characters" value={form.password}
                  onChange={e => set('password', e.target.value)}
                  style={{ ...inputStyle, paddingRight:44 }}
                  onFocus={e => e.target.style.borderColor='var(--accent)'}
                  onBlur={e => e.target.style.borderColor='var(--border2)'} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:13 }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>Confirm Password</label>
              <input type={showPw?'text':'password'} placeholder="repeat password" value={form.confirm}
                onChange={e => set('confirm', e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border2)'} />
            </div>

            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:13, borderRadius:12, border:'none', background: loading?'var(--surface3)':'var(--accent)', color:'var(--ink)', fontFamily:'inherit', fontSize:14, fontWeight:700, cursor: loading?'not-allowed':'pointer' }}>
              {loading
                ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <span style={{ width:16, height:16, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }}/>
                    Creating…
                  </span>
                : 'Create Account →'
              }
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:13, color:'var(--muted)', marginTop:24 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--accent)', fontWeight:700, textDecoration:'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}