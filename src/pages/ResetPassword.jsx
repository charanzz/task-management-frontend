import React, { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0f; font-family: 'DM Sans', sans-serif; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
`

function Spinner() {
  return <span style={{width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/>
}

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setValidating(false); return }
    api.get(`/api/auth/validate-reset-token?token=${token}`)
      .then(() => setTokenValid(true))
      .catch(() => setTokenValid(false))
      .finally(() => setValidating(false))
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true); setError('')
    try {
      await api.post('/api/auth/reset-password', { token, newPassword: password })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.')
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

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthColor = ['transparent','#ff6b6b','#ffd93d','#6bcb77'][strength]
  const strengthLabel = ['','Weak','Fair','Strong'][strength]

  return (
    <>
      <style>{css}</style>
      <div style={{minHeight:'100vh',background:'#0a0a0f',display:'flex',alignItems:'center',justifyContent:'center',padding:16,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-20%',left:'-10%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,.15),transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:'-20%',right:'-10%',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(168,85,247,.1),transparent 70%)',pointerEvents:'none'}}/>

        <div style={{width:'100%',maxWidth:440,animation:'fadeUp .5s ease'}}>
          <div style={{textAlign:'center',marginBottom:32}}>
            <div style={{width:52,height:52,borderRadius:16,background:'linear-gradient(135deg,#7c3aed,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,margin:'0 auto 12px',boxShadow:'0 8px 30px rgba(124,58,237,.4)',animation:'float 3s ease-in-out infinite'}}>⚡</div>
            <h1 style={{fontSize:28,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne, sans-serif'}}>TaskFlow</h1>
          </div>

          <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:24,padding:36,boxShadow:'0 30px 80px rgba(0,0,0,.6)'}}>
            {validating ? (
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <Spinner/> <span style={{color:'#6b6b8a',marginLeft:10,fontSize:14}}>Validating link…</span>
              </div>
            ) : !token || !tokenValid ? (
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:48,marginBottom:16}}>❌</div>
                <h2 style={{fontSize:20,fontWeight:700,color:'#f0f0f8',marginBottom:10,fontFamily:'Syne, sans-serif'}}>Invalid or Expired Link</h2>
                <p style={{color:'#6b6b8a',fontSize:14,marginBottom:24}}>This reset link is no longer valid. Please request a new one.</p>
                <Link to="/forgot-password" style={{display:'inline-block',padding:'12px 28px',borderRadius:12,background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',textDecoration:'none',fontWeight:700,fontSize:14}}>Request New Link</Link>
              </div>
            ) : done ? (
              <div style={{textAlign:'center',animation:'fadeUp .4s ease'}}>
                <div style={{fontSize:56,marginBottom:16}}>🎉</div>
                <h2 style={{fontSize:22,fontWeight:700,color:'#f0f0f8',marginBottom:10,fontFamily:'Syne, sans-serif'}}>Password Reset!</h2>
                <p style={{color:'#6b6b8a',fontSize:14,marginBottom:20}}>Your password has been updated. Redirecting to login…</p>
                <div style={{height:4,background:'rgba(255,255,255,.06)',borderRadius:4,overflow:'hidden'}}>
                  <div style={{height:'100%',background:'linear-gradient(90deg,#7c3aed,#a855f7)',animation:'fillBar 3s linear forwards',borderRadius:4}}/>
                </div>
              </div>
            ) : (
              <>
                <div style={{marginBottom:28}}>
                  <h2 style={{fontSize:22,fontWeight:700,color:'#f0f0f8',marginBottom:8,fontFamily:'Syne, sans-serif'}}>Set new password</h2>
                  <p style={{color:'#6b6b8a',fontSize:14}}>Choose a strong password for your account.</p>
                </div>

                {error && (
                  <div style={{background:'rgba(255,107,107,.08)',border:'1px solid rgba(255,107,107,.2)',borderRadius:10,padding:'11px 14px',fontSize:13,color:'#ff6b6b',marginBottom:18}}>⚠ {error}</div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{marginBottom:14}}>
                    <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'#6b6b8a',marginBottom:8}}>New Password</label>
                    <div style={{position:'relative'}}>
                      <input style={{...inp,paddingRight:44}} type={show?'text':'password'} placeholder="Min. 6 characters"
                        value={password} onChange={e=>setPassword(e.target.value)}
                        onFocus={e=>{e.target.style.borderColor='#7c3aed';e.target.style.background='rgba(124,58,237,.05)'}}
                        onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,.1)';e.target.style.background='rgba(255,255,255,.04)'}}
                      />
                      <button type="button" onClick={()=>setShow(s=>!s)} style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#6b6b8a',cursor:'pointer',fontSize:16}}>
                        {show?'🙈':'👁'}
                      </button>
                    </div>
                    {password.length > 0 && (
                      <div style={{marginTop:8}}>
                        <div style={{height:3,background:'rgba(255,255,255,.06)',borderRadius:4,overflow:'hidden',marginBottom:4}}>
                          <div style={{height:'100%',width:`${(strength/3)*100}%`,background:strengthColor,borderRadius:4,transition:'width .3s, background .3s'}}/>
                        </div>
                        <span style={{fontSize:11,color:strengthColor}}>{strengthLabel}</span>
                      </div>
                    )}
                  </div>

                  <div style={{marginBottom:22}}>
                    <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'#6b6b8a',marginBottom:8}}>Confirm Password</label>
                    <input style={{...inp,borderColor:confirm&&confirm!==password?'#ff6b6b':'rgba(255,255,255,.1)'}} type={show?'text':'password'} placeholder="Repeat password"
                      value={confirm} onChange={e=>setConfirm(e.target.value)}
                      onFocus={e=>{e.target.style.borderColor='#7c3aed';e.target.style.background='rgba(124,58,237,.05)'}}
                      onBlur={e=>{e.target.style.borderColor=confirm&&confirm!==password?'#ff6b6b':'rgba(255,255,255,.1)';e.target.style.background='rgba(255,255,255,.04)'}}
                    />
                    {confirm && confirm !== password && <p style={{fontSize:11,color:'#ff6b6b',marginTop:4}}>Passwords don't match</p>}
                  </div>

                  <button type="submit" disabled={loading} style={{width:'100%',padding:14,borderRadius:12,border:'none',background:loading?'#1a1a24':'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',fontSize:14,fontWeight:700,cursor:loading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:loading?'none':'0 4px 20px rgba(124,58,237,.4)',transition:'all .2s'}}>
                    {loading?<><Spinner/> Resetting…</>:'🔐 Reset Password'}
                  </button>
                </form>

                <div style={{textAlign:'center',paddingTop:20,borderTop:'1px solid rgba(255,255,255,.06)',marginTop:20}}>
                  <Link to="/login" style={{color:'#7c3aed',fontSize:13,textDecoration:'none',fontWeight:500}}>← Back to Login</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}