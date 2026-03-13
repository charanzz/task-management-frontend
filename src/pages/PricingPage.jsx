import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(168,85,247,.3)} 50%{box-shadow:0 0 50px rgba(168,85,247,.6)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes trialPulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,217,61,.3)} 70%{box-shadow:0 0 0 8px rgba(255,217,61,0)} }
  @keyframes countdown { from{width:100%} to{width:0%} }
  .plan-card { transition:transform .25s,box-shadow .25s; }
  .plan-card:hover { transform:translateY(-5px); }
  .copy-btn:hover { background:rgba(168,85,247,.2)!important; }
  .period-tab:hover { background:rgba(255,255,255,.06)!important; }
  .feature-row { transition:background .15s; }
  .feature-row:hover { background:rgba(255,255,255,.03)!important; }
  .lock-badge { animation:trialPulse 2s infinite; }
`

const ADMIN_EMAIL = 'saransaran53091@gmail.com'

const PRO_FEATURES = [
  { icon:'🤖', label:'AI Smart Priority & NLP Input',      free:false },
  { icon:'🧠', label:'AI Task Breakdown (any goal → steps)',free:false },
  { icon:'☀️', label:'Daily AI Digest Emails',             free:false },
  { icon:'📊', label:'Deep Analytics & Heatmap',           free:false },
  { icon:'👥', label:'Team Collaboration (up to 10)',       free:false },
  { icon:'🏆', label:'Leaderboard & Team Challenges',       free:false },
  { icon:'⏱', label:'Pomodoro + Focus Sounds',             free:true  },
  { icon:'🔥', label:'Habit Tracker & Streaks',            free:true  },
  { icon:'📅', label:'Calendar & Eisenhower Matrix',        free:true  },
  { icon:'⏰', label:'Smart Reminders & Snooze',           free:false },
  { icon:'📧', label:'Email → Task Extraction',            free:false },
  { icon:'📤', label:'Export (CSV / JSON / Markdown)',      free:false },
  { icon:'⭐', label:'Pro Badge & Exclusive Themes',        free:false },
  { icon:'⚡', label:'Priority Support',                    free:false },
]

const PRICING = {
  monthly: { amount: 30,  label: '₹30 / month',  save: null },
  daily:   { amount: 1,   label: '₹1 / day',     save: 'Most Flexible' },
  yearly:  { amount: 364, label: '₹364 / year',  save: 'Save ₹ 6!' },
}

export default function PricingPage() {
  const [isPro, setIsPro]           = useState(false)
  const [trialDaysLeft, setTrial]   = useState(null)
  const [copied, setCopied]         = useState(false)
  const [showModal, setShowModal]   = useState(false)
  const [period, setPeriod]         = useState('monthly')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/stripe/status').then(r => {
      setIsPro(r.data.isPro)
    }).catch(() => {})

    // Calculate trial days left from account creation
    api.get('/api/users/me').then(r => {
      const created = new Date(r.data.createdAt)
      const now = new Date()
      const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24))
      const left = Math.max(0, 15 - diffDays)
      setTrial(left)
    }).catch(() => {})
  }, [])

  function copyEmail() {
    navigator.clipboard.writeText(ADMIN_EMAIL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function openMail() {
    const p = PRICING[period]
    const subject = encodeURIComponent('TaskFlow Pro Access Request')
    const body = encodeURIComponent(
      `Hi Saran,\n\nI would like to upgrade to TaskFlow Pro.\n\nMy account email: ${user?.email || '[your email]'}\nMy name: ${user?.name || '[your name]'}\nPlan: ${p.label}\n\nPlease activate Pro on my account.\n\nThank you!`
    )
    window.open(`mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`)
  }

  const trialActive  = trialDaysLeft !== null && trialDaysLeft > 0
  const trialExpired = trialDaysLeft !== null && trialDaysLeft === 0
  const trialPct     = trialDaysLeft !== null ? (trialDaysLeft / 15) * 100 : 100
  const sel          = PRICING[period]

  return (
    <>
      <style>{css}</style>
      <div style={{minHeight:'100vh',background:'#0a0a0f',padding:'50px 20px 80px',fontFamily:'DM Sans,sans-serif'}}>

        {/* Back */}
        <button onClick={()=>navigate('/dashboard')}
          style={{position:'fixed',top:18,left:18,padding:'8px 16px',borderRadius:10,
            background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',
            color:'#a0a0b8',fontSize:13,cursor:'pointer',zIndex:10}}>
          ← Back
        </button>

        {/* Hero */}
        <div style={{textAlign:'center',marginBottom:44,animation:'fadeUp .5s ease'}}>
          <div style={{display:'inline-block',padding:'6px 18px',borderRadius:20,
            background:'rgba(168,85,247,.1)',border:'1px solid rgba(168,85,247,.3)',
            color:'#a855f7',fontSize:11,fontWeight:700,letterSpacing:'2px',marginBottom:16}}>
            TASKFLOW PRO
          </div>
          <h1 style={{fontSize:44,fontWeight:800,fontFamily:'Syne,sans-serif',lineHeight:1.1,marginBottom:14,color:'#f0f0f8'}}>
            Unlock everything<br/>
            <span style={{background:'linear-gradient(135deg,#a855f7,#ec4899)',
              WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              for just ₹1/day
            </span>
          </h1>
          <p style={{fontSize:16,color:'#8080a0',maxWidth:440,margin:'0 auto 0'}}>
            The most affordable productivity upgrade — less than a cup of chai ☕
          </p>
        </div>

        {/* Trial Banner */}
        {!isPro && trialDaysLeft !== null && (
          <div className={trialActive ? 'lock-badge' : ''} style={{
            maxWidth:640,margin:'0 auto 36px',padding:'16px 22px',
            borderRadius:16,textAlign:'center',
            background: trialActive
              ? 'linear-gradient(135deg,rgba(255,217,61,.08),rgba(255,165,0,.05))'
              : 'linear-gradient(135deg,rgba(255,107,107,.08),rgba(255,0,0,.05))',
            border: `1px solid ${trialActive ? 'rgba(255,217,61,.3)' : 'rgba(255,107,107,.3)'}`,
          }}>
            <p style={{fontSize:15,fontWeight:700,color: trialActive ? '#ffd93d' : '#ff6b6b',marginBottom:6}}>
              {trialActive
                ? `🎁 Free Trial — ${trialDaysLeft} day${trialDaysLeft!==1?'s':''} remaining`
                : '⚠️ Your free trial has ended'}
            </p>
            <p style={{fontSize:12,color:'#8080a0',marginBottom:trialActive?10:0}}>
              {trialActive
                ? 'Enjoy all features during your trial. Upgrade before it ends to keep access.'
                : 'Upgrade to Pro to continue using premium features.'}
            </p>
            {trialActive && (
              <div style={{height:6,borderRadius:10,background:'rgba(255,255,255,.06)',overflow:'hidden',marginTop:4}}>
                <div style={{height:'100%',borderRadius:10,width:`${trialPct}%`,
                  background:'linear-gradient(90deg,#ffd93d,#ff9500)',transition:'width .5s'}}/>
              </div>
            )}
          </div>
        )}

        {/* Period Tabs */}
        {!isPro && (
          <div style={{display:'flex',justifyContent:'center',marginBottom:32}}>
            <div style={{display:'inline-flex',background:'#111118',border:'1px solid rgba(255,255,255,.08)',
              borderRadius:14,padding:4,gap:2}}>
              {Object.entries(PRICING).map(([key,val])=>(
                <button key={key} className="period-tab" onClick={()=>setPeriod(key)}
                  style={{padding:'9px 20px',borderRadius:10,border:'none',cursor:'pointer',
                    fontFamily:'DM Sans,sans-serif',fontSize:13,fontWeight:600,transition:'all .15s',
                    background:period===key?'linear-gradient(135deg,#7c3aed,#a855f7)':'transparent',
                    color:period===key?'#fff':'#6b6b8a',position:'relative'}}>
                  {key.charAt(0).toUpperCase()+key.slice(1)}
                  {val.save && (
                    <span style={{position:'absolute',top:-8,right:-6,fontSize:8,padding:'2px 5px',
                      borderRadius:6,background:'#ffd93d',color:'#0a0a0f',fontWeight:800,
                      letterSpacing:'.3px',whiteSpace:'nowrap'}}>
                      {val.save}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Plans */}
        <div style={{display:'flex',gap:22,justifyContent:'center',maxWidth:820,
          margin:'0 auto',flexWrap:'wrap',alignItems:'stretch'}}>

          {/* Free Plan */}
          <div className="plan-card" style={{flex:'1',minWidth:290,maxWidth:350,
            background:'#111118',border:'1px solid rgba(255,255,255,.08)',
            borderRadius:20,padding:28,animation:'fadeUp .5s ease both',animationDelay:'100ms'}}>
            <p style={{fontSize:10,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',
              color:'#6b6b8a',marginBottom:10}}>FREE FOREVER</p>
            <div style={{display:'flex',alignItems:'flex-end',gap:4,marginBottom:4}}>
              <span style={{fontSize:40,fontWeight:800,fontFamily:'Syne,sans-serif',color:'#f0f0f8'}}>₹0</span>
              <span style={{fontSize:13,color:'#6b6b8a',paddingBottom:8}}>/month</span>
            </div>
            <p style={{fontSize:12,color:'#6b6b8a',marginBottom:22}}>15-day full trial included</p>

            <div style={{display:'flex',flexDirection:'column',gap:9,marginBottom:24}}>
              {PRO_FEATURES.map((f,i)=>(
                <div key={i} className="feature-row" style={{display:'flex',alignItems:'center',gap:10,
                  padding:'4px 6px',borderRadius:8,
                  opacity: f.free ? 1 : (trialActive||isPro) ? 1 : 0.35}}>
                  <span style={{fontSize:14}}>{f.free ? f.icon : (trialActive||isPro) ? f.icon : '🔒'}</span>
                  <span style={{fontSize:12,color: f.free ? '#c0c0d8' : (trialActive||isPro)?'#c0c0d8':'#555570',
                    textDecoration: !f.free && !trialActive && !isPro ? 'line-through' : 'none'}}>
                    {f.label}
                  </span>
                  {!f.free && !trialActive && !isPro && (
                    <span style={{marginLeft:'auto',fontSize:9,padding:'1px 6px',borderRadius:5,
                      background:'rgba(255,107,107,.1)',color:'#ff6b6b',fontWeight:700,
                      border:'1px solid rgba(255,107,107,.2)',whiteSpace:'nowrap'}}>PRO</span>
                  )}
                </div>
              ))}
            </div>

            <div style={{padding:11,borderRadius:12,background:'rgba(107,203,119,.06)',
              border:'1px solid rgba(107,203,119,.15)',textAlign:'center'}}>
              <p style={{fontSize:13,fontWeight:700,color:'#6bcb77',margin:0}}>
                {isPro ? '✅ Included in Pro' : '✅ Your current plan'}
              </p>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="plan-card" style={{flex:'1',minWidth:290,maxWidth:350,
            background:'linear-gradient(160deg,#150d24,#1e1230)',
            border:'2px solid rgba(168,85,247,.45)',borderRadius:20,padding:28,position:'relative',
            animation:'fadeUp .5s ease both, glow 3s ease infinite',animationDelay:'200ms',
            boxShadow:'0 0 50px rgba(168,85,247,.15)'}}>

            <div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',
              padding:'5px 20px',borderRadius:20,
              background:'linear-gradient(135deg,#7c3aed,#a855f7)',
              color:'#fff',fontSize:10,fontWeight:800,letterSpacing:'1.5px',whiteSpace:'nowrap'}}>
              ⭐ BEST VALUE
            </div>

            <p style={{fontSize:10,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',
              color:'#a855f7',marginBottom:10}}>PRO PLAN</p>

            <div style={{display:'flex',alignItems:'flex-end',gap:4,marginBottom:4}}>
              <span style={{fontSize:40,fontWeight:800,fontFamily:'Syne,sans-serif',color:'#f0f0f8'}}>
                {sel.amount === 1 ? '₹1' : sel.amount === 364 ? '₹364' : '₹30'}
              </span>
              <span style={{fontSize:13,color:'#8b6aaa',paddingBottom:8}}>
                {period==='monthly'?' /month':period==='daily'?' /day':' /year'}
              </span>
            </div>

            {/* Equivalence line */}
            <p style={{fontSize:11,color:'#8b6aaa',marginBottom:20}}>
              {period==='monthly' && '= ₹1/day · less than a cup of chai'}
              {period==='daily'   && 'Pay only when you need it'}
              {period==='yearly'  && '= ₹30.3/month · best annual deal'}
            </p>

            <div style={{display:'flex',flexDirection:'column',gap:9,marginBottom:24}}>
              {PRO_FEATURES.map((f,i)=>(
                <div key={i} className="feature-row" style={{display:'flex',alignItems:'center',
                  gap:10,padding:'4px 6px',borderRadius:8}}>
                  <span style={{fontSize:14}}>{f.icon}</span>
                  <span style={{fontSize:12,color:'#e0d0ff'}}>{f.label}</span>
                  {!f.free && (
                    <span style={{marginLeft:'auto',fontSize:9,padding:'1px 6px',borderRadius:5,
                      background:'rgba(168,85,247,.15)',color:'#a855f7',fontWeight:700,
                      border:'1px solid rgba(168,85,247,.2)'}}>PRO</span>
                  )}
                </div>
              ))}
            </div>

            {isPro ? (
              <div style={{padding:13,borderRadius:12,background:'rgba(107,203,119,.1)',
                border:'1px solid rgba(107,203,119,.2)',textAlign:'center'}}>
                <p style={{fontSize:14,fontWeight:700,color:'#6bcb77',margin:0}}>✅ You're on Pro!</p>
                <p style={{fontSize:11,color:'#4a9a6a',marginTop:3}}>All features unlocked</p>
              </div>
            ) : (
              <button onClick={()=>setShowModal(true)}
                style={{width:'100%',padding:'14px',borderRadius:12,border:'none',cursor:'pointer',
                  background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',
                  fontSize:15,fontWeight:700,fontFamily:'DM Sans,sans-serif',
                  boxShadow:'0 6px 24px rgba(124,58,237,.45)',transition:'all .2s'}}>
                ✉️ Get Pro — {sel.label}
              </button>
            )}
          </div>
        </div>

        {/* How it works */}
        <div style={{maxWidth:600,margin:'50px auto 0',animation:'fadeUp .6s ease both',animationDelay:'300ms'}}>
          <p style={{textAlign:'center',fontSize:11,fontWeight:700,color:'#6b6b8a',
            letterSpacing:'2px',textTransform:'uppercase',marginBottom:18}}>HOW TO UPGRADE</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            {[
              {n:'1',icon:'✉️',title:'Email us',     desc:`Send your account email to ${ADMIN_EMAIL}`},
              {n:'2',icon:'⚡',title:'We activate',  desc:'Pro is manually activated on your account within 24h'},
              {n:'3',icon:'🚀',title:'You\'re Pro',   desc:'All features unlocked instantly, no card needed'},
            ].map((s,i)=>(
              <div key={i} style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',
                borderRadius:14,padding:16,textAlign:'center'}}>
                <div style={{width:26,height:26,borderRadius:'50%',
                  background:'linear-gradient(135deg,#7c3aed,#a855f7)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:11,fontWeight:800,color:'#fff',margin:'0 auto 10px'}}>
                  {s.n}
                </div>
                <p style={{fontSize:17,marginBottom:6}}>{s.icon}</p>
                <p style={{fontSize:13,fontWeight:700,color:'#f0f0f8',marginBottom:4}}>{s.title}</p>
                <p style={{fontSize:11,color:'#6b6b8a',lineHeight:1.5}}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div style={{display:'flex',justifyContent:'center',gap:28,marginTop:36,flexWrap:'wrap'}}>
          {['🔒 No credit card','⚡ Activated in 24h','💬 Direct support','🇮🇳 INR pricing','❤️ Cancel anytime'].map((t,i)=>(
            <span key={i} style={{fontSize:12,color:'#555570'}}>{t}</span>
          ))}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showModal && (
        <div onClick={e=>e.target===e.currentTarget&&setShowModal(false)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,.88)',backdropFilter:'blur(12px)',
            zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{width:'100%',maxWidth:440,background:'#111118',
            border:'1px solid rgba(168,85,247,.3)',borderRadius:22,overflow:'hidden',
            boxShadow:'0 30px 80px rgba(0,0,0,.8)',animation:'fadeUp .25s ease'}}>

            {/* Modal header */}
            <div style={{padding:'20px 24px 16px',borderBottom:'1px solid rgba(255,255,255,.06)',
              background:'linear-gradient(135deg,rgba(124,58,237,.1),transparent)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <h3 style={{fontSize:17,fontWeight:800,color:'#f0f0f8',
                    fontFamily:'Syne,sans-serif',margin:'0 0 3px'}}>
                    ✉️ Request Pro Access
                  </h3>
                  <p style={{fontSize:11,color:'#8b6aaa',margin:0}}>
                    Activated within 24 hours — {sel.label}
                  </p>
                </div>
                <button onClick={()=>setShowModal(false)}
                  style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,.06)',
                    border:'1px solid rgba(255,255,255,.1)',color:'#8080a0',cursor:'pointer',
                    fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
              </div>
            </div>

            <div style={{padding:22}}>

              {/* Plan selected */}
              <div style={{display:'flex',gap:8,marginBottom:18}}>
                {Object.entries(PRICING).map(([key,val])=>(
                  <button key={key} onClick={()=>setPeriod(key)}
                    style={{flex:1,padding:'10px 6px',borderRadius:10,border:'none',cursor:'pointer',
                      fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:700,transition:'all .15s',
                      background:period===key?'linear-gradient(135deg,#7c3aed,#a855f7)':'rgba(255,255,255,.04)',
                      color:period===key?'#fff':'#6b6b8a',
                      outline:period===key?'2px solid rgba(168,85,247,.4)':'none'}}>
                    {val.label}
                  </button>
                ))}
              </div>

              {/* Your account */}
              {user && (
                <div style={{padding:'11px 15px',borderRadius:12,
                  background:'rgba(168,85,247,.07)',border:'1px solid rgba(168,85,247,.15)',marginBottom:18}}>
                  <p style={{fontSize:10,color:'#8b6aaa',marginBottom:5,fontWeight:700,
                    letterSpacing:'1px',textTransform:'uppercase'}}>Your Account</p>
                  <p style={{fontSize:13,color:'#f0f0f8',margin:'0 0 2px',fontWeight:600}}>{user.name}</p>
                  <p style={{fontSize:11,color:'#a0a0c0',margin:0}}>{user.email}</p>
                </div>
              )}

              <p style={{fontSize:13,color:'#a0a0c0',marginBottom:16,lineHeight:1.6}}>
                Send an email to <strong style={{color:'#a855f7'}}>{ADMIN_EMAIL}</strong> mentioning your account email and chosen plan. We'll activate Pro for you.
              </p>

              {/* Email box */}
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 15px',
                borderRadius:12,background:'rgba(255,255,255,.04)',
                border:'1px solid rgba(255,255,255,.1)',marginBottom:18}}>
                <span style={{flex:1,fontSize:13,color:'#f0f0f8',fontWeight:600,
                  fontFamily:'monospace',wordBreak:'break-all'}}>{ADMIN_EMAIL}</span>
                <button className="copy-btn" onClick={copyEmail}
                  style={{padding:'5px 12px',borderRadius:8,fontSize:11,fontWeight:700,
                    cursor:'pointer',transition:'all .2s',flexShrink:0,
                    background:copied?'rgba(107,203,119,.15)':'rgba(168,85,247,.1)',
                    color:copied?'#6bcb77':'#a855f7',
                    border:`1px solid ${copied?'rgba(107,203,119,.3)':'rgba(168,85,247,.25)'}`}}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>

              {/* Buttons */}
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setShowModal(false)}
                  style={{flex:1,padding:12,borderRadius:10,
                    border:'1px solid rgba(255,255,255,.08)',background:'rgba(255,255,255,.04)',
                    color:'#8080a0',fontSize:13,fontWeight:600,cursor:'pointer',
                    fontFamily:'DM Sans,sans-serif'}}>
                  Later
                </button>
                <button onClick={openMail}
                  style={{flex:2,padding:12,borderRadius:10,border:'none',cursor:'pointer',
                    background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',
                    fontSize:13,fontWeight:700,fontFamily:'DM Sans,sans-serif',
                    boxShadow:'0 4px 16px rgba(124,58,237,.4)',
                    display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  ✉️ Open Email App
                </button>
              </div>

              <p style={{fontSize:10,color:'#555570',textAlign:'center',marginTop:12,lineHeight:1.6}}>
                No spam. Only used to activate your Pro account.<br/>
                Payment is manual — UPI / cash / your choice. Contact us.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}