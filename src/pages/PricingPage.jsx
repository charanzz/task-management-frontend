import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { background:#0a0a0f; color:#f0f0f8; font-family:'DM Sans',sans-serif; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(168,85,247,.3)} 50%{box-shadow:0 0 40px rgba(168,85,247,.6)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
  .plan-card { transition: transform .25s, box-shadow .25s; }
  .plan-card:hover { transform:translateY(-4px); }
  .copy-btn:hover { background: rgba(168,85,247,.2) !important; }
`

const PRO_FEATURES = [
  { icon:'🤖', label:'AI Smart Priority & Natural Language' },
  { icon:'☀️', label:'Daily AI Digest Emails' },
  { icon:'🧠', label:'Weekly Productivity Coach' },
  { icon:'📊', label:'Full Analytics & Charts' },
  { icon:'👥', label:'Team Collaboration (up to 10 members)' },
  { icon:'🎨', label:'All Premium Themes' },
  { icon:'🔥', label:'Advanced Streak Tracking' },
  { icon:'⚡', label:'Priority Support' },
  { icon:'🏆', label:'Exclusive Pro Badges' },
]

const FREE_FEATURES = [
  { icon:'✅', label:'Unlimited Tasks' },
  { icon:'🎯', label:'Priority Labels (High / Medium / Low)' },
  { icon:'📋', label:'Task Status Tracking' },
  { icon:'⚡', label:'Focus Score & Levels' },
  { icon:'🏅', label:'Basic Badges' },
  { icon:'🔔', label:'Email Reminders' },
]

const ADMIN_EMAIL = 'hello@todoperks.online'

export default function PricingPage() {
  const [isPro, setIsPro]         = useState(false)
  const [copied, setCopied]       = useState(false)
  const [showModal, setShowModal] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/stripe/status').then(r => setIsPro(r.data.isPro)).catch(()=>{})
  }, [])

  function copyEmail() {
    navigator.clipboard.writeText(ADMIN_EMAIL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function openMail() {
    const subject = encodeURIComponent('TaskFlow Pro Access Request')
    const body = encodeURIComponent(
      `Hi,\n\nI would like to upgrade to TaskFlow Pro.\n\nMy account email: ${user?.email || '[your email]'}\nMy name: ${user?.name || '[your name]'}\n\nPlease activate Pro on my account.\n\nThank you!`
    )
    window.open(`mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`)
  }

  return (
    <>
      <style>{css}</style>
      <div style={{minHeight:'100vh', background:'#0a0a0f', padding:'60px 20px'}}>

        {/* Back */}
        <button onClick={()=>navigate('/dashboard')} style={{position:'fixed',top:18,left:18,padding:'8px 16px',
          borderRadius:10,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',
          color:'#a0a0b8',fontSize:13,cursor:'pointer'}}>← Back</button>

        {/* Hero */}
        <div style={{textAlign:'center',marginBottom:50,animation:'fadeUp .6s ease'}}>
          <div style={{display:'inline-block',padding:'6px 18px',borderRadius:20,
            background:'rgba(168,85,247,.1)',border:'1px solid rgba(168,85,247,.3)',
            color:'#a855f7',fontSize:12,fontWeight:700,marginBottom:16,letterSpacing:'2px'}}>
            TASKFLOW PRO
          </div>
          <h1 style={{fontSize:46,fontWeight:800,fontFamily:'Syne,sans-serif',lineHeight:1.1,marginBottom:16}}>
            Unlock your full<br/>
            <span style={{background:'linear-gradient(135deg,#a855f7,#ec4899)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>potential</span>
          </h1>
          <p style={{fontSize:17,color:'#8080a0',maxWidth:460,margin:'0 auto'}}>
            Get Pro access by simply emailing us — we'll activate it on your account within 24 hours.
          </p>
        </div>

        {/* Plans */}
        <div style={{display:'flex',gap:24,justifyContent:'center',maxWidth:820,
          margin:'0 auto',flexWrap:'wrap',alignItems:'stretch'}}>

          {/* Free */}
          <div className="plan-card" style={{flex:'1',minWidth:300,maxWidth:360,background:'#111118',
            border:'1px solid rgba(255,255,255,.08)',borderRadius:20,padding:30,
            animation:'fadeUp .5s ease both',animationDelay:'100ms'}}>
            <p style={{fontSize:11,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'#6b6b8a',marginBottom:10}}>FREE FOREVER</p>
            <div style={{display:'flex',alignItems:'flex-end',gap:4,marginBottom:6}}>
              <span style={{fontSize:42,fontWeight:800,fontFamily:'Syne,sans-serif',color:'#f0f0f8'}}>$0</span>
              <span style={{fontSize:14,color:'#6b6b8a',paddingBottom:8}}>/month</span>
            </div>
            <p style={{fontSize:13,color:'#6b6b8a',marginBottom:24}}>Everything you need to get started</p>
            <div style={{display:'flex',flexDirection:'column',gap:11,marginBottom:28}}>
              {FREE_FEATURES.map((f,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,fontSize:13,color:'#c0c0d8'}}>
                  <span style={{fontSize:15}}>{f.icon}</span>{f.label}
                </div>
              ))}
            </div>
            <div style={{padding:12,borderRadius:12,background:'rgba(107,203,119,.06)',
              border:'1px solid rgba(107,203,119,.15)',textAlign:'center'}}>
              <p style={{fontSize:13,fontWeight:700,color:'#6bcb77',margin:0}}>
                {isPro ? '✅ Included in your Pro plan' : '✅ Your current plan'}
              </p>
            </div>
          </div>

          {/* Pro */}
          <div className="plan-card" style={{flex:'1',minWidth:300,maxWidth:360,
            background:'linear-gradient(160deg,#150d24,#1e1230)',
            border:'2px solid rgba(168,85,247,.4)',borderRadius:20,padding:30,position:'relative',
            animation:'fadeUp .5s ease both, glow 3s ease infinite',animationDelay:'200ms',
            boxShadow:'0 0 40px rgba(168,85,247,.15)'}}>
            <div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',
              padding:'5px 20px',borderRadius:20,background:'linear-gradient(135deg,#7c3aed,#a855f7)',
              color:'#fff',fontSize:11,fontWeight:800,letterSpacing:'1.5px',whiteSpace:'nowrap'}}>
              ⭐ MOST POPULAR
            </div>

            <p style={{fontSize:11,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'#a855f7',marginBottom:10}}>PRO PLAN</p>
            <div style={{display:'flex',alignItems:'flex-end',gap:4,marginBottom:6}}>
              <span style={{fontSize:42,fontWeight:800,fontFamily:'Syne,sans-serif',color:'#f0f0f8'}}>$9</span>
              <span style={{fontSize:14,color:'#8b6aaa',paddingBottom:8}}>/month</span>
            </div>
            <p style={{fontSize:13,color:'#8b6aaa',marginBottom:24}}>All features, cancel anytime</p>

            <div style={{display:'flex',flexDirection:'column',gap:11,marginBottom:28}}>
              {PRO_FEATURES.map((f,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,fontSize:13,color:'#e0d0ff'}}>
                  <span style={{fontSize:15}}>{f.icon}</span>{f.label}
                </div>
              ))}
            </div>

            {isPro ? (
              <div style={{padding:'13px 16px',borderRadius:12,background:'rgba(107,203,119,.1)',
                border:'1px solid rgba(107,203,119,.2)',textAlign:'center'}}>
                <p style={{fontSize:14,fontWeight:700,color:'#6bcb77',margin:0}}>✅ You're on Pro!</p>
                <p style={{fontSize:11,color:'#4a9a6a',marginTop:4}}>Enjoy all Pro features</p>
              </div>
            ) : (
              <button onClick={()=>setShowModal(true)}
                style={{width:'100%',padding:14,borderRadius:12,border:'none',cursor:'pointer',
                  background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',
                  fontSize:15,fontWeight:700,boxShadow:'0 4px 20px rgba(124,58,237,.4)',
                  transition:'all .2s',fontFamily:'DM Sans,sans-serif'}}>
                ✉️ Get Pro Access — $9/mo
              </button>
            )}
          </div>
        </div>

        {/* How it works */}
        <div style={{maxWidth:600,margin:'50px auto 0',animation:'fadeUp .6s ease both',animationDelay:'400ms'}}>
          <p style={{textAlign:'center',fontSize:13,fontWeight:700,color:'#6b6b8a',letterSpacing:'2px',
            textTransform:'uppercase',marginBottom:20}}>HOW IT WORKS</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
            {[
              {step:'1',icon:'✉️',title:'Email us',desc:'Send us your account email at hello@todoperks.online'},
              {step:'2',icon:'⚡',title:'We activate',desc:'We manually activate Pro on your account within 24h'},
              {step:'3',icon:'🚀',title:'Enjoy Pro',desc:'All features unlocked immediately, no card needed'},
            ].map((s,i)=>(
              <div key={i} style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',
                borderRadius:14,padding:16,textAlign:'center'}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#a855f7)',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,
                  color:'#fff',margin:'0 auto 10px'}}>
                  {s.step}
                </div>
                <p style={{fontSize:18,marginBottom:6}}>{s.icon}</p>
                <p style={{fontSize:13,fontWeight:700,color:'#f0f0f8',marginBottom:4}}>{s.title}</p>
                <p style={{fontSize:11,color:'#6b6b8a',lineHeight:1.5}}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust */}
        <div style={{display:'flex',justifyContent:'center',gap:30,marginTop:40,flexWrap:'wrap'}}>
          {['🔒 No credit card required','⚡ Activated within 24h','💬 Direct support','❤️ Cancel anytime'].map((t,i)=>(
            <span key={i} style={{fontSize:12,color:'#6b6b8a'}}>{t}</span>
          ))}
        </div>
      </div>

      {/* Contact Modal */}
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',backdropFilter:'blur(10px)',
          zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
          onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div style={{width:'100%',maxWidth:460,background:'#111118',border:'1px solid rgba(168,85,247,.3)',
            borderRadius:20,overflow:'hidden',boxShadow:'0 30px 80px rgba(0,0,0,.8)',animation:'fadeUp .25s ease'}}>

            {/* Modal header */}
            <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(255,255,255,.06)',
              background:'linear-gradient(135deg,rgba(124,58,237,.1),transparent)',
              display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <h3 style={{fontSize:17,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:0}}>
                  ✉️ Request Pro Access
                </h3>
                <p style={{fontSize:11,color:'#8b6aaa',marginTop:3}}>We'll activate your account within 24 hours</p>
              </div>
              <button onClick={()=>setShowModal(false)} style={{width:30,height:30,borderRadius:8,
                background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',
                color:'#8080a0',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>

            <div style={{padding:24}}>
              {/* Account info */}
              {user && (
                <div style={{padding:'12px 16px',borderRadius:12,background:'rgba(168,85,247,.07)',
                  border:'1px solid rgba(168,85,247,.15)',marginBottom:20}}>
                  <p style={{fontSize:11,color:'#8b6aaa',marginBottom:6,fontWeight:600,letterSpacing:'1px',textTransform:'uppercase'}}>Your Account</p>
                  <p style={{fontSize:13,color:'#f0f0f8',margin:'0 0 3px',fontWeight:600}}>{user.name}</p>
                  <p style={{fontSize:12,color:'#a0a0c0',margin:0}}>{user.email}</p>
                </div>
              )}

              <p style={{fontSize:13,color:'#a0a0c0',marginBottom:20,lineHeight:1.6}}>
                Send an email to <strong style={{color:'#a855f7'}}>{ADMIN_EMAIL}</strong> with your account email and we'll activate Pro access for you.
              </p>

              {/* Email address box */}
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',
                borderRadius:12,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',marginBottom:20}}>
                <span style={{flex:1,fontSize:14,color:'#f0f0f8',fontWeight:600,fontFamily:'monospace'}}>{ADMIN_EMAIL}</span>
                <button className="copy-btn" onClick={copyEmail}
                  style={{padding:'5px 12px',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',
                    background:copied?'rgba(107,203,119,.15)':'rgba(168,85,247,.1)',
                    color:copied?'#6bcb77':'#a855f7',
                    border:`1px solid ${copied?'rgba(107,203,119,.3)':'rgba(168,85,247,.25)'}`,
                    transition:'all .2s'}}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>

              {/* Action buttons */}
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setShowModal(false)}
                  style={{flex:1,padding:12,borderRadius:10,border:'1px solid rgba(255,255,255,.08)',
                    background:'rgba(255,255,255,.04)',color:'#8080a0',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                  Maybe later
                </button>
                <button onClick={openMail}
                  style={{flex:2,padding:12,borderRadius:10,border:'none',cursor:'pointer',
                    background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',
                    fontSize:13,fontWeight:700,boxShadow:'0 4px 16px rgba(124,58,237,.4)',
                    display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:'DM Sans,sans-serif'}}>
                  ✉️ Open Email App
                </button>
              </div>

              <p style={{fontSize:11,color:'#6b6b8a',textAlign:'center',marginTop:14}}>
                No spam. Only used to activate your Pro account.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}