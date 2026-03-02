import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0f; font-family: 'DM Sans', sans-serif; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes float {
    0%,100%{transform:translateY(0) rotate(0deg)}
    33%{transform:translateY(-12px) rotate(2deg)}
    66%{transform:translateY(-6px) rotate(-1deg)}
  }
`

function Spinner() {
  return <span style={{width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/>
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email'); return }
    setLoading(true); setError('')
    try {
      await api.post('/api/auth/forgot-password', { email: email.trim().toLowerCase() })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
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
        {/* Background orbs */}
        <div style={{position:'absolute',top:'-20%',left:'-10%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,.15),transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:'-20%',right:'-10%',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(168,85,247,.1),transparent 70%)',pointerEvents:'none'}}/>

        <div style={{width:'100%',maxWidth:440,animation:'fadeUp .5s ease'}}>
          {/* Logo */}
          <div style={{textAlign:'center',marginBottom:32}}>
            <div style={{width:52,height:52,borderRadius:16,background:'linear-gradient(135deg,#7c3aed,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,margin:'0 auto 12px',boxShadow:'0 8px 30px rgba(124,58,237,.4)',animation:'float 4s ease-in-out infinite'}}>⚡</div>
            <h1 style={{fontSize:28,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne, sans-serif',letterSpacing:'-0.5px'}}>TaskFlow</h1>
          </div>

          <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:24,padding:36,boxShadow:'0 30px 80px rgba(0,0,0,.6)'}}>
            {sent ? (
              <div style={{textAlign:'center',animation:'fadeUp .4s ease'}}>
                <div style={{fontSize:56,marginBottom:16}}>📬</div>
                <h2 style={{fontSize:22,fontWeight:700,color:'#f0f0f8',marginBottom:10,fontFamily:'Syne, sans-serif'}}>Check your inbox!</h2>
                <p style={{color:'#6b6b8a',fontSize:14,lineHeight:1.6,marginBottom:24}}>
                  We sent a password reset link to <strong style={{color:'#c084fc'}}>{email}</strong>. Check your spam folder too!
                </p>
                <div style={{background:'rgba(124,58,237,.08)',border:'1px solid rgba(124,58,237,.2)',borderRadius:12,padding:'14px 16px',marginBottom:24,textAlign:'left'}}>
                  <p style={{color:'#a0a0b8',fontSize:13,lineHeight:1.6}}>⏰ The link expires in <strong style={{color:'#f0f0f8'}}>1 hour</strong>. If you don't see it, check spam or request another.</p>
                </div>
                <button onClick={()=>{setSent(false);setEmail('')}} style={{width:'100%',padding:13,borderRadius:12,border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.04)',color:'#a0a0b8',fontSize:14,cursor:'pointer'}}>
                  Try a different email
                </button>
              </div>
            ) : (
              <>
                <div style={{marginBottom:28}}>
                  <h2 style={{fontSize:22,fontWeight:700,color:'#f0f0f8',marginBottom:8,fontFamily:'Syne, sans-serif'}}>Forgot password?</h2>
                  <p style={{color:'#6b6b8a',fontSize:14}}>No worries — enter your email and we'll send a reset link.</p>
                </div>

                {error && (
                  <div style={{background:'rgba(255,107,107,.08)',border:'1px solid rgba(255,107,107,.2)',borderRadius:10,padding:'11px 14px',fontSize:13,color:'#ff6b6b',marginBottom:18}}>⚠ {error}</div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{marginBottom:18}}>
                    <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'#6b6b8a',marginBottom:8}}>Email Address</label>
                    <input style={inp} type="email" placeholder="you@example.com"
                      value={email} onChange={e=>setEmail(e.target.value)}
                      onFocus={e=>{e.target.style.borderColor='#7c3aed';e.target.style.background='rgba(124,58,237,.05)'}}
                      onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,.1)';e.target.style.background='rgba(255,255,255,.04)'}}
                    />
                  </div>

                  <button type="submit" disabled={loading} style={{width:'100%',padding:14,borderRadius:12,border:'none',background:loading?'#1a1a24':'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',fontSize:14,fontWeight:700,cursor:loading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:loading?'none':'0 4px 20px rgba(124,58,237,.4)',transition:'all .2s',marginBottom:20}}>
                    {loading ? <><Spinner/> Sending…</> : '📧 Send Reset Link'}
                  </button>
                </form>
              </>
            )}

            <div style={{textAlign:'center',paddingTop:16,borderTop:'1px solid rgba(255,255,255,.06)'}}>
              <Link to="/login" style={{color:'#7c3aed',fontSize:13,textDecoration:'none',fontWeight:500}}>← Back to Login</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}