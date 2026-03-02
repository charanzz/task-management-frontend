import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0f; font-family: 'DM Sans', sans-serif; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes float { 0%,100%{transform:translateY(0) rotate(0deg)} 33%{transform:translateY(-12px) rotate(2deg)} 66%{transform:translateY(-6px) rotate(-1deg)} }
  .google-btn:hover { background: rgba(255,255,255,.08) !important; transform: translateY(-1px); }
  .google-btn:active { transform: translateY(0); }
`

function Spinner() {
  return <span style={{width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/>
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const googleConfigured = !!import.meta.env.VITE_GOOGLE_CLIENT_ID

  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!googleConfigured) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [googleConfigured])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Please fill in all fields'); return }
    setLoading(true); setError('')
    try {
      const res = await authAPI.login({ email: form.email.trim(), password: form.password })
      const { token, email, name, id } = res.data
      login(token, { id, name, email })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleLogin() {
    if (!window.google) {
      setError('Google Sign-In is still loading. Please wait a moment and try again.')
      return
    }
    setGoogleLoading(true)
    setError('')

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const res = await authAPI.googleLogin({ idToken: response.credential })
          const { token, email, name, id } = res.data
          login(token, { id, name, email })
          navigate('/dashboard')
        } catch (err) {
          setError(err.response?.data?.message || 'Google Sign-In failed. Try email login.')
        } finally {
          setGoogleLoading(false)
        }
      },
    })

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setGoogleLoading(false)
        window.google.accounts.id.renderButton(
          document.getElementById('google-btn-container'),
          { theme: 'filled_black', size: 'large', width: 356 }
        )
      }
    })
  }

  const inp = {
    width:'100%', padding:'13px 16px',
    background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)',
    borderRadius:12, color:'#f0f0f8', fontSize:14, outline:'none',
    transition:'border-color .2s, background .2s',
  }

  return (
    <>
      <style>{css}</style>
      <div style={{minHeight:'100vh',background:'#0a0a0f',display:'flex',alignItems:'center',justifyContent:'center',padding:16,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-20%',left:'-10%',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,.15),transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:'-20%',right:'-10%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(168,85,247,.1),transparent 70%)',pointerEvents:'none'}}/>
        {[...Array(5)].map((_,i)=>(
          <div key={i} style={{position:'absolute',width:4,height:4,borderRadius:'50%',background:'rgba(124,58,237,.4)',top:`${15+i*18}%`,left:`${5+i*22}%`,animation:`float ${3+i}s ease-in-out infinite`,animationDelay:`${i*0.5}s`,pointerEvents:'none'}}/>
        ))}

        <div style={{width:'100%',maxWidth:420,animation:'fadeUp .5s ease'}}>
          <div style={{textAlign:'center',marginBottom:32}}>
            <div style={{width:56,height:56,borderRadius:18,background:'linear-gradient(135deg,#7c3aed,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,margin:'0 auto 14px',boxShadow:'0 8px 32px rgba(124,58,237,.5)',animation:'float 4s ease-in-out infinite'}}>⚡</div>
            <h1 style={{fontSize:30,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne, sans-serif',letterSpacing:'-0.5px'}}>TaskFlow</h1>
            <p style={{color:'#6b6b8a',fontSize:14,marginTop:6}}>Your productivity, supercharged.</p>
          </div>

          <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:24,padding:'36px 32px',boxShadow:'0 30px 80px rgba(0,0,0,.6)'}}>
            <h2 style={{fontSize:20,fontWeight:700,color:'#f0f0f8',marginBottom:6,fontFamily:'Syne, sans-serif'}}>Welcome back</h2>
            <p style={{color:'#6b6b8a',fontSize:13,marginBottom:26}}>Sign in to your account</p>

            {error && (
              <div style={{background:'rgba(255,107,107,.08)',border:'1px solid rgba(255,107,107,.2)',borderRadius:10,padding:'11px 14px',fontSize:13,color:'#ff6b6b',marginBottom:18}}>⚠ {error}</div>
            )}

            {/* Google Button — only renders when VITE_GOOGLE_CLIENT_ID is set */}
            {googleConfigured && (
              <>
                <button onClick={handleGoogleLogin} disabled={googleLoading} className="google-btn" style={{
                  width:'100%', padding:'13px 16px', borderRadius:12,
                  background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.12)',
                  color:'#f0f0f8', fontSize:14, fontWeight:500, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                  marginBottom:6, transition:'all .2s',
                }}>
                  {googleLoading ? <Spinner/> : <GoogleIcon/>}
                  {googleLoading ? 'Connecting…' : 'Continue with Google'}
                </button>
                <div id="google-btn-container"/>
                <div style={{display:'flex',alignItems:'center',gap:12,margin:'20px 0'}}>
                  <div style={{flex:1,height:1,background:'rgba(255,255,255,.07)'}}/>
                  <span style={{color:'#6b6b8a',fontSize:12}}>or sign in with email</span>
                  <div style={{flex:1,height:1,background:'rgba(255,255,255,.07)'}}/>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'#6b6b8a',marginBottom:8}}>Email</label>
                <input style={inp} type="email" placeholder="you@example.com"
                  value={form.email} onChange={e=>set('email',e.target.value)}
                  onFocus={e=>{e.target.style.borderColor='#7c3aed';e.target.style.background='rgba(124,58,237,.05)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,.1)';e.target.style.background='rgba(255,255,255,.04)'}}
                />
              </div>

              <div style={{marginBottom:6}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <label style={{fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'#6b6b8a'}}>Password</label>
                  <Link to="/forgot-password" style={{fontSize:12,color:'#7c3aed',textDecoration:'none',fontWeight:500}}>Forgot password?</Link>
                </div>
                <div style={{position:'relative'}}>
                  <input style={{...inp,paddingRight:44}} type={show?'text':'password'} placeholder="Enter your password"
                    value={form.password} onChange={e=>set('password',e.target.value)}
                    onFocus={e=>{e.target.style.borderColor='#7c3aed';e.target.style.background='rgba(124,58,237,.05)'}}
                    onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,.1)';e.target.style.background='rgba(255,255,255,.04)'}}
                  />
                  <button type="button" onClick={()=>setShow(s=>!s)} style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#6b6b8a',cursor:'pointer',fontSize:16,lineHeight:1}}>
                    {show?'🙈':'👁'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{
                width:'100%', padding:14, borderRadius:12, border:'none',
                background: loading?'#1a1a24':'linear-gradient(135deg,#7c3aed,#a855f7)',
                color:'#fff', fontSize:14, fontWeight:700,
                cursor:loading?'not-allowed':'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                boxShadow:loading?'none':'0 4px 20px rgba(124,58,237,.4)',
                transition:'all .2s', marginTop:20,
              }}
                onMouseEnter={e=>{ if(!loading) e.currentTarget.style.transform='translateY(-1px)' }}
                onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}
              >
                {loading?<><Spinner/> Signing in…</>:'Sign In →'}
              </button>
            </form>

            <p style={{textAlign:'center',color:'#6b6b8a',fontSize:13,marginTop:22,paddingTop:20,borderTop:'1px solid rgba(255,255,255,.06)'}}>
              Don't have an account?{' '}
              <Link to="/register" style={{color:'#a855f7',fontWeight:600,textDecoration:'none'}}>Create one free →</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}