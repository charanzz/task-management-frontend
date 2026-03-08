import React, { useState } from 'react'
import api from '../services/api'

const AVATAR_COLORS = [
  '#7c3aed','#a855f7','#0ea5e9','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1','#14b8a6','#06b6d4'
]
const TIMEZONES = ['Asia/Kolkata','Asia/Dubai','Asia/Singapore','Asia/Tokyo','Europe/London','Europe/Paris','America/New_York','America/Los_Angeles','Australia/Sydney']
const TASK_TEMPLATES = [
  'Plan my week every Monday morning',
  'Review and reply to emails',
  'Exercise for 30 minutes',
  'Read for 20 minutes before bed',
  'Complete top 3 priority tasks',
]

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pop{0%{transform:scale(.8);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
  @keyframes progress{from{width:0}to{width:var(--w)}}
  .color-sw:hover{transform:scale(1.2)!important}
  .tmpl-btn:hover{background:rgba(124,58,237,.1)!important;border-color:rgba(124,58,237,.3)!important}
  .ob-inp:focus{border-color:#7c3aed!important;outline:none}
  .next-btn:hover{transform:translateY(-1px)!important;box-shadow:0 8px 28px rgba(124,58,237,.5)!important}
  .skip-btn:hover{color:#9ca3af!important}
`

const STEPS = [
  { id:'welcome',  title:"Welcome to TaskFlow! 🎉",      sub:"Let's get you set up in 60 seconds" },
  { id:'name',     title:"What should we call you?",      sub:"Personalise your experience" },
  { id:'avatar',   title:"Pick your avatar colour",       sub:"Make your profile uniquely yours" },
  { id:'timezone', title:"Where are you based?",          sub:"So reminders arrive at the right time" },
  { id:'task',     title:"What's your first task?",       sub:"Start strong — add your most important task" },
  { id:'done',     title:"You're all set! 🚀",            sub:"TaskFlow is ready for you" },
]

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep]           = useState(0)
  const [name, setName]           = useState('')
  const [color, setColor]         = useState('#7c3aed')
  const [timezone, setTimezone]   = useState('Asia/Kolkata')
  const [task, setTask]           = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const progress = (step / (STEPS.length - 1)) * 100
  const current  = STEPS[step]
  const isLast   = step === STEPS.length - 1

  async function finish() {
    setSaving(true)
    setError('')
    try {
      await api.post('/api/users/complete-onboarding', {
        name: name.trim() || undefined,
        avatarColor: color,
        timezone,
        firstTask: task.trim() || undefined,
      })
      onComplete()
    } catch(e) {
      setError(e.response?.data?.error || 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  function next() {
    if (step === STEPS.length - 2) { finish(); return }
    if (isLast) { onComplete(); return }
    setStep(s => s + 1)
  }

  function canNext() {
    if (current.id === 'name') return name.trim().length >= 2
    return true
  }

  const inp = {
    width:'100%',padding:'13px 16px',background:'#1a1a24',
    border:'1px solid rgba(255,255,255,.1)',borderRadius:12,
    color:'#f0f0f8',fontSize:15,fontFamily:'DM Sans,sans-serif',
    transition:'border-color .2s',boxSizing:'border-box'
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'#0a0a0f',zIndex:1000,
      display:'flex',alignItems:'center',justifyContent:'center',padding:20,
      fontFamily:'DM Sans,sans-serif' }}>
      <style>{css}</style>

      <div style={{ width:'100%',maxWidth:480,animation:'fadeIn .5s ease' }}>

        {/* Progress bar */}
        <div style={{ marginBottom:32 }}>
          <div style={{ height:3,background:'rgba(255,255,255,.06)',borderRadius:3,overflow:'hidden' }}>
            <div style={{ height:'100%',background:'linear-gradient(90deg,#7c3aed,#a855f7)',
              borderRadius:3,width:`${progress}%`,transition:'width .4s ease' }}/>
          </div>
          <p style={{ fontSize:11,color:'#4b5563',marginTop:6,textAlign:'right' }}>
            Step {step + 1} of {STEPS.length}
          </p>
        </div>

        {/* Card */}
        <div key={step} style={{ animation:'fadeUp .4s ease' }}>

          {/* Step: Welcome */}
          {current.id === 'welcome' && (
            <div style={{ textAlign:'center',paddingBottom:8 }}>
              <div style={{ width:80,height:80,borderRadius:24,background:'linear-gradient(135deg,#7c3aed,#a855f7)',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:38,
                margin:'0 auto 24px',boxShadow:'0 12px 40px rgba(124,58,237,.5)',
                animation:'pop .6s ease' }}>⚡</div>
              <h1 style={{ fontSize:28,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:'0 0 12px' }}>
                {current.title}
              </h1>
              <p style={{ fontSize:14,color:'#6b6b8a',margin:'0 0 32px',lineHeight:1.7 }}>
                TaskFlow helps you stay focused, beat procrastination, and crush your goals — better than any other app out there. 💪
              </p>
              {['🎯 AI-powered daily focus', '🔔 Smart reminders', '🏆 Leaderboard & gamification', '⏱ Pomodoro timer built-in'].map((f,i) => (
                <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 16px',
                  background:'#111118',border:'1px solid rgba(255,255,255,.06)',borderRadius:12,
                  marginBottom:8,textAlign:'left',animation:`fadeUp .4s ease ${i*0.08}s both` }}>
                  <span style={{ fontSize:16 }}>{f.split(' ')[0]}</span>
                  <span style={{ fontSize:13,color:'#f0f0f8',fontWeight:500 }}>{f.split(' ').slice(1).join(' ')}</span>
                </div>
              ))}
            </div>
          )}

          {/* Step: Name */}
          {current.id === 'name' && (
            <div>
              <h2 style={{ fontSize:26,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:'0 0 8px' }}>{current.title}</h2>
              <p style={{ fontSize:13,color:'#6b6b8a',margin:'0 0 28px' }}>{current.sub}</p>
              <input className="ob-inp" style={inp}
                placeholder="e.g. Saran, Alex, Maya…"
                value={name} onChange={e=>setName(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&canNext()&&next()}
                autoFocus/>
              {name.trim().length > 0 && name.trim().length < 2 && (
                <p style={{ fontSize:11,color:'#ff6b6b',marginTop:6 }}>Name must be at least 2 characters</p>
              )}
            </div>
          )}

          {/* Step: Avatar color */}
          {current.id === 'avatar' && (
            <div>
              <h2 style={{ fontSize:26,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:'0 0 8px' }}>{current.title}</h2>
              <p style={{ fontSize:13,color:'#6b6b8a',margin:'0 0 28px' }}>{current.sub}</p>
              <div style={{ display:'flex',justifyContent:'center',marginBottom:28 }}>
                <div style={{ width:80,height:80,borderRadius:24,
                  background:`linear-gradient(135deg,${color},${color}99)`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:36,fontWeight:800,color:'#fff',fontFamily:'Syne,sans-serif',
                  boxShadow:`0 12px 40px ${color}55`,transition:'all .3s',
                  animation:'pop .4s ease' }}>
                  {(name?.[0]||'?').toUpperCase()}
                </div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12 }}>
                {AVATAR_COLORS.map(c => (
                  <button key={c} className="color-sw" onClick={()=>setColor(c)}
                    style={{ width:'100%',aspectRatio:'1',borderRadius:14,cursor:'pointer',
                      background:`linear-gradient(135deg,${c},${c}99)`,
                      border:color===c?'3px solid #fff':'3px solid transparent',
                      transition:'transform .15s',
                      boxShadow:color===c?`0 0 0 3px ${c}`:'' }}/>
                ))}
              </div>
            </div>
          )}

          {/* Step: Timezone */}
          {current.id === 'timezone' && (
            <div>
              <h2 style={{ fontSize:26,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:'0 0 8px' }}>{current.title}</h2>
              <p style={{ fontSize:13,color:'#6b6b8a',margin:'0 0 28px' }}>{current.sub}</p>
              <select className="ob-inp" style={{ ...inp,cursor:'pointer',colorScheme:'dark' }}
                value={timezone} onChange={e=>setTimezone(e.target.value)}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace('_',' ')}</option>)}
              </select>
              <p style={{ fontSize:12,color:'#6b6b8a',marginTop:10,lineHeight:1.5 }}>
                📅 We'll send your daily focus reminder and weekly review at the right local time.
              </p>
            </div>
          )}

          {/* Step: First task */}
          {current.id === 'task' && (
            <div>
              <h2 style={{ fontSize:26,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:'0 0 8px' }}>{current.title}</h2>
              <p style={{ fontSize:13,color:'#6b6b8a',margin:'0 0 20px' }}>{current.sub}</p>
              <input className="ob-inp" style={{ ...inp,marginBottom:16 }}
                placeholder="e.g. Finish project proposal"
                value={task} onChange={e=>setTask(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&next()}
                autoFocus/>
              <p style={{ fontSize:11,color:'#6b6b8a',marginBottom:10 }}>Or pick a quick start:</p>
              <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                {TASK_TEMPLATES.map(t => (
                  <button key={t} className="tmpl-btn" onClick={()=>setTask(t)}
                    style={{ padding:'10px 14px',borderRadius:10,background:task===t?'rgba(124,58,237,.1)':'rgba(255,255,255,.03)',
                      border:`1px solid ${task===t?'rgba(124,58,237,.3)':'rgba(255,255,255,.07)'}`,
                      color:task===t?'#a855f7':'#9ca3af',fontSize:12,fontWeight:500,
                      textAlign:'left',cursor:'pointer',transition:'all .15s' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Done */}
          {current.id === 'done' && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:64,marginBottom:20,animation:'pop .6s ease' }}>🚀</div>
              <h2 style={{ fontSize:28,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:'0 0 12px' }}>{current.title}</h2>
              <p style={{ fontSize:14,color:'#6b6b8a',margin:'0 0 28px',lineHeight:1.7 }}>
                Hey <strong style={{ color:'#a855f7' }}>{name||'there'}</strong>! Your workspace is ready. Start with your Daily Focus, use the Pomodoro timer to stay on track, and compete on the leaderboard!
              </p>
              {[['🎯','Daily Focus','AI picks your top 3 tasks every morning'],
                ['⏱','Pomodoro Timer','Stay in flow with 25-min focus sessions'],
                ['🏆','Leaderboard','Compete with others and climb the ranks']].map(([ic,lb,sub],i)=>(
                <div key={lb} style={{ display:'flex',gap:12,padding:'12px 16px',background:'#111118',
                  border:'1px solid rgba(255,255,255,.06)',borderRadius:12,marginBottom:8,textAlign:'left',
                  animation:`fadeUp .4s ease ${i*0.1}s both` }}>
                  <span style={{ fontSize:20,flexShrink:0 }}>{ic}</span>
                  <div>
                    <p style={{ fontSize:13,fontWeight:700,color:'#f0f0f8',margin:'0 0 2px' }}>{lb}</p>
                    <p style={{ fontSize:11,color:'#6b6b8a',margin:0 }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && <p style={{ fontSize:12,color:'#ff6b6b',marginTop:12,textAlign:'center' }}>{error}</p>}

        {/* Actions */}
        <div style={{ display:'flex',gap:10,marginTop:32,alignItems:'center' }}>
          {step > 0 && !isLast && (
            <button onClick={() => setStep(s=>s-1)}
              style={{ padding:'13px 20px',borderRadius:12,background:'transparent',
                border:'1px solid rgba(255,255,255,.1)',color:'#6b6b8a',fontSize:14,
                fontWeight:600,cursor:'pointer' }}>
              ← Back
            </button>
          )}
          <button className="next-btn" onClick={next} disabled={!canNext()||saving}
            style={{ flex:1,padding:'14px',borderRadius:14,border:'none',
              background:canNext()&&!saving?'linear-gradient(135deg,#7c3aed,#a855f7)':'#22222f',
              color:'#fff',fontSize:15,fontWeight:700,cursor:canNext()&&!saving?'pointer':'default',
              display:'flex',alignItems:'center',justifyContent:'center',gap:10,
              boxShadow:canNext()&&!saving?'0 6px 24px rgba(124,58,237,.4)':'none',
              transition:'all .2s' }}>
            {saving ? (
              <><span style={{ width:18,height:18,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite' }}/> Setting up…</>
            ) : isLast ? (
              '🚀 Let\'s Go!'
            ) : current.id==='task'&&!task.trim() ? (
              'Skip & Continue →'
            ) : (
              'Continue →'
            )}
          </button>
        </div>

        {/* Skip all */}
        {!isLast && step > 0 && (
          <button className="skip-btn" onClick={finish}
            style={{ display:'block',margin:'12px auto 0',background:'none',border:'none',
              color:'#4b5563',fontSize:11,cursor:'pointer',transition:'color .15s' }}>
            Skip setup
          </button>
        )}
      </div>
    </div>
  )
}