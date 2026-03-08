import React, { useState, useEffect, useRef, useCallback } from 'react'

const DEFAULT_MINS = { focus: 25, short: 5, long: 15 }

const MODE_CFG = {
  focus: { label:'Focus',       color:'#a855f7', glow:'rgba(168,85,247,.4)', bg:'rgba(168,85,247,.08)', emoji:'🎯', tip:'Deep work time' },
  short: { label:'Short Break', color:'#6bcb77', glow:'rgba(107,203,119,.4)', bg:'rgba(107,203,119,.08)', emoji:'☕', tip:'Rest your eyes' },
  long:  { label:'Long Break',  color:'#60a5fa', glow:'rgba(96,165,250,.4)',  bg:'rgba(96,165,250,.08)',  emoji:'🌿', tip:'Great job! Recharge' },
}

const ALERT_SOUNDS = {
  bell: [880, 660, 880],
  chime: [523, 659, 784, 1047],
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes ringPop{0%{transform:scale(1)}15%{transform:scale(1.18)}30%{transform:scale(.95)}45%{transform:scale(1.08)}60%{transform:scale(.98)}100%{transform:scale(1)}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px var(--gc)}50%{box-shadow:0 0 40px var(--gc),0 0 60px var(--gc)}}
  @keyframes alertPop{0%{opacity:0;transform:translate(-50%,-50%) scale(.7)}60%{transform:translate(-50%,-50%) scale(1.05)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}
  @keyframes confetti{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(80px) rotate(720deg);opacity:0}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  @keyframes tickBig{0%{transform:scale(1)}50%{transform:scale(1.03)}100%{transform:scale(1)}}
  .mode-btn:hover{background:rgba(255,255,255,.08)!important;transform:translateY(-1px)}
  .ctrl-btn:hover{background:rgba(255,255,255,.1)!important;transform:scale(1.06)}
  .ctrl-btn:active{transform:scale(.95)!important}
  .adj-btn:hover{background:rgba(255,255,255,.12)!important}
  .adj-btn:active{transform:scale(.9)}
  .task-row:hover{background:rgba(124,58,237,.12)!important}
  .dismiss-btn:hover{opacity:.85!important;transform:translateY(-1px)}
`

function playBeep(freqs) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = f
      osc.type = 'sine'
      gain.gain.setValueAtTime(.4, ctx.currentTime + i * .18)
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + i * .18 + .3)
      osc.start(ctx.currentTime + i * .18)
      osc.stop(ctx.currentTime + i * .18 + .35)
    })
    setTimeout(() => ctx.close(), 2000)
  } catch(e) {}
}

function formatTime(s) {
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
}

function Confetti({ color }) {
  const pieces = Array.from({length:12}, (_,i) => i)
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden',borderRadius:'50%'}}>
      {pieces.map(i => (
        <div key={i} style={{
          position:'absolute',
          left:`${20+Math.random()*60}%`,
          top:'20%',
          width:6, height:6,
          borderRadius: i%2===0 ? '50%' : 2,
          background: [color,'#ffd93d','#6bcb77','#60a5fa','#ff6b6b'][i%5],
          animation:`confetti ${.8+Math.random()*.6}s ease ${i*.05}s both`,
        }}/>
      ))}
    </div>
  )
}

export default function PomodoroTimer({ tasks = [] }) {
  const [mode, setMode]           = useState('focus')
  const [customMins, setCustom]   = useState({...DEFAULT_MINS})
  const [secs, setSecs]           = useState(DEFAULT_MINS.focus * 60)
  const [running, setRunning]     = useState(false)
  const [sessions, setSessions]   = useState(0)
  const [selectedTask, setSel]    = useState(null)
  const [showTasks, setShowTasks] = useState(false)
  const [alert, setAlert]         = useState(null)   // null | 'focus' | 'break'
  const [showConf, setShowConf]   = useState(false)
  const [editing, setEditing]     = useState(false)  // editing time
  const intervalRef               = useRef(null)
  const cfg                       = MODE_CFG[mode]
  const totalSecs                 = customMins[mode] * 60
  const progress                  = totalSecs > 0 ? secs / totalSecs : 0
  const SIZE                      = 260
  const R                         = (SIZE - 20) / 2
  const CIRC                      = 2 * Math.PI * R
  const offset                    = CIRC * (1 - progress)

  const stopTimer = useCallback(() => {
    clearInterval(intervalRef.current)
    setRunning(false)
  }, [])

  const resetTimer = useCallback((m = mode, mins = customMins) => {
    stopTimer()
    setAlert(null)
    setShowConf(false)
    setSecs(mins[m] * 60)
  }, [mode, customMins, stopTimer])

  const switchMode = useCallback((m) => {
    setMode(m)
    stopTimer()
    setAlert(null)
    setShowConf(false)
    setSecs(customMins[m] * 60)
  }, [customMins, stopTimer])

  // Adjust time by ±1 min while not running
  function adjustTime(delta) {
    const newMins = Math.max(1, Math.min(99, customMins[mode] + delta))
    const newCustom = { ...customMins, [mode]: newMins }
    setCustom(newCustom)
    setSecs(newMins * 60)
  }

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          // Play sound
          playBeep(ALERT_SOUNDS.chime)
          // Show in-page alert
          if (mode === 'focus') {
            setSessions(p => p + 1)
            setAlert('focus')
            setShowConf(true)
            setTimeout(() => setShowConf(false), 2500)
          } else {
            setAlert('break')
          }
          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification(mode === 'focus' ? '🎯 Focus session complete!' : '⏰ Break time over!', {
              body: mode === 'focus' ? 'Amazing work! Time for a break 🎉' : 'Back to focus mode! You got this 💪',
              icon: '/favicon.ico'
            })
          }
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running, mode])

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission()
  }, [])

  useEffect(() => {
    document.title = running ? `${formatTime(secs)} ${cfg.emoji} ${cfg.label} | TaskFlow` : 'TaskFlow'
    return () => { document.title = 'TaskFlow' }
  }, [running, secs, cfg])

  const pendingTasks = tasks.filter(t => t.status !== 'DONE')
  const isLastMin = secs <= 60 && running
  const isLastTen = secs <= 10 && running

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:520,margin:'0 auto',animation:'fadeUp .4s ease',fontFamily:'DM Sans,sans-serif'}}>

        {/* Mode selector */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,
          background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:16,padding:5,marginBottom:28}}>
          {Object.entries(MODE_CFG).map(([key, m]) => (
            <button key={key} className="mode-btn" onClick={() => switchMode(key)}
              style={{padding:'10px 6px',borderRadius:11,fontSize:12,fontWeight:700,cursor:'pointer',
                border:'none',transition:'all .2s',textAlign:'center',
                background: mode===key ? m.bg : 'transparent',
                color: mode===key ? m.color : '#6b6b8a',
                boxShadow: mode===key ? `0 0 0 1px ${m.color}33` : 'none'}}>
              <span style={{display:'block',fontSize:18,marginBottom:3}}>{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* Timer circle */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:28,position:'relative'}}>

          {/* Confetti */}
          {showConf && (
            <div style={{position:'absolute',width:SIZE,height:SIZE,pointerEvents:'none',zIndex:10}}>
              <Confetti color={cfg.color}/>
            </div>
          )}

          {/* SVG circle */}
          <div style={{position:'relative',width:SIZE,height:SIZE}}>
            <svg width={SIZE} height={SIZE} style={{transform:'rotate(-90deg)',position:'absolute',inset:0}}>
              {/* Track */}
              <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
                stroke="rgba(255,255,255,.05)" strokeWidth={10}/>
              {/* Glow layer */}
              <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
                stroke={cfg.color} strokeWidth={10} opacity={.15}
                strokeDasharray={CIRC} strokeDashoffset={0}/>
              {/* Progress */}
              <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
                stroke={cfg.color} strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={offset}
                style={{transition:'stroke-dashoffset .8s ease, stroke .3s ease',
                  filter:`drop-shadow(0 0 8px ${cfg.glow})`}}/>
            </svg>

            {/* Inner content */}
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',gap:4}}>
              {/* Time adjust buttons — show when not running */}
              {!running && !alert && (
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                  <button className="adj-btn" onClick={() => adjustTime(-1)}
                    style={{width:28,height:28,borderRadius:8,background:'rgba(255,255,255,.06)',
                      border:'1px solid rgba(255,255,255,.1)',color:'#6b6b8a',fontSize:16,
                      display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .15s'}}>
                    −
                  </button>
                  <p style={{fontSize:11,color:'#6b6b8a',margin:0,fontWeight:600,letterSpacing:'1px'}}>
                    {customMins[mode]} MIN
                  </p>
                  <button className="adj-btn" onClick={() => adjustTime(1)}
                    style={{width:28,height:28,borderRadius:8,background:'rgba(255,255,255,.06)',
                      border:'1px solid rgba(255,255,255,.1)',color:'#6b6b8a',fontSize:16,
                      display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .15s'}}>
                    +
                  </button>
                </div>
              )}

              {/* Time display */}
              <p style={{
                fontSize: secs >= 600 ? 58 : 64,
                fontWeight:800,fontFamily:'Syne,sans-serif',margin:0,letterSpacing:'-3px',lineHeight:1,
                color: isLastTen ? '#ff6b6b' : isLastMin ? '#ffd93d' : cfg.color,
                animation: isLastTen ? 'tickBig .5s ease infinite' : 'none',
                transition:'color .3s',
                textShadow: running ? `0 0 20px ${isLastTen?'rgba(255,107,107,.5)':cfg.glow}` : 'none',
              }}>
                {formatTime(secs)}
              </p>

              {/* Mode label */}
              <p style={{fontSize:12,color:'#6b6b8a',margin:'4px 0 0',fontWeight:600,letterSpacing:'1px'}}>
                {cfg.emoji} {running ? cfg.tip : cfg.label}
              </p>

              {/* Running indicator */}
              {running && (
                <div style={{display:'flex',gap:3,marginTop:4}}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{width:4,height:4,borderRadius:'50%',background:cfg.color,
                      animation:`pulse .9s ease ${i*.2}s infinite`}}/>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tip text below circle */}
          {isLastMin && !isLastTen && (
            <p style={{fontSize:12,color:'#ffd93d',margin:'12px 0 0',fontWeight:600,animation:'pulse 1s ease infinite'}}>
              ⚡ Almost there! Keep going…
            </p>
          )}
          {isLastTen && (
            <p style={{fontSize:13,color:'#ff6b6b',margin:'12px 0 0',fontWeight:700,animation:'pulse .5s ease infinite'}}>
              🔥 {secs} seconds left!
            </p>
          )}
        </div>

        {/* Controls */}
        <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:16,marginBottom:24}}>
          {/* Reset */}
          <button className="ctrl-btn" onClick={() => resetTimer()}
            title="Reset"
            style={{width:50,height:50,borderRadius:15,background:'#1a1a24',
              border:'1px solid rgba(255,255,255,.09)',color:'#6b6b8a',fontSize:20,
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s'}}>
            ↺
          </button>

          {/* Play/Pause — big */}
          <button className="ctrl-btn" onClick={() => { setAlert(null); setRunning(r => !r) }}
            style={{width:80,height:80,borderRadius:25,
              background:`linear-gradient(135deg,${cfg.color},${cfg.color}99)`,
              border:'none',color:'#fff',fontSize:32,
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
              boxShadow:`0 10px 32px ${cfg.glow}`,transition:'all .2s',
              '--gc': cfg.glow}}>
            {running ? '⏸' : '▶'}
          </button>

          {/* Skip to next mode */}
          <button className="ctrl-btn" onClick={() => {
            const next = mode==='focus' ? (sessions>0&&(sessions+1)%4===0?'long':'short') : 'focus'
            switchMode(next)
          }}
            title="Skip"
            style={{width:50,height:50,borderRadius:15,background:'#1a1a24',
              border:'1px solid rgba(255,255,255,.09)',color:'#6b6b8a',fontSize:20,
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s'}}>
            ⏭
          </button>
        </div>

        {/* Session dots */}
        <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,marginBottom:24}}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{width:i===3?8:28,height:8,borderRadius:4,transition:'all .4s ease',
              background: i < sessions%4
                ? cfg.color
                : i === sessions%4 && running
                  ? `linear-gradient(90deg,${cfg.color} ${Math.round((1-progress)*100)}%,rgba(255,255,255,.08) ${Math.round((1-progress)*100)}%)`
                  : 'rgba(255,255,255,.08)'}}/>
          ))}
          <span style={{fontSize:11,color:'#6b6b8a',marginLeft:4,fontWeight:600}}>
            {sessions} session{sessions!==1?'s':''} · {Math.floor(sessions*customMins.focus)} min focused
          </span>
        </div>

        {/* Task selector */}
        <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:16,
          overflow:'hidden',marginBottom:16}}>
          <button onClick={() => setShowTasks(s=>!s)}
            style={{width:'100%',padding:'14px 18px',background:'none',border:'none',
              display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:32,height:32,borderRadius:9,flexShrink:0,
                background:selectedTask?cfg.bg:'rgba(255,255,255,.04)',
                border:`1px solid ${selectedTask?cfg.color+'44':'rgba(255,255,255,.08)'}`,
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>
                {selectedTask ? '📌' : '📋'}
              </div>
              <div style={{textAlign:'left'}}>
                <p style={{fontSize:13,fontWeight:600,color:selectedTask?'#f0f0f8':'#6b6b8a',margin:0,
                  maxWidth:260,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {selectedTask ? selectedTask.title : 'Link a task (optional)'}
                </p>
                {selectedTask && <p style={{fontSize:10,color:'#6b6b8a',margin:0}}>Focusing on this task</p>}
              </div>
            </div>
            <span style={{color:'#6b6b8a',fontSize:11,transform:showTasks?'rotate(180deg)':'none',transition:'transform .2s'}}>▼</span>
          </button>

          {showTasks && (
            <div style={{borderTop:'1px solid rgba(255,255,255,.06)',maxHeight:200,overflowY:'auto'}}>
              <button className="task-row" onClick={() => { setSel(null); setShowTasks(false) }}
                style={{width:'100%',padding:'11px 18px',background:'none',border:'none',
                  textAlign:'left',color:'#6b6b8a',fontSize:12,fontWeight:500,cursor:'pointer',
                  borderBottom:'1px solid rgba(255,255,255,.04)',transition:'background .15s'}}>
                — No task
              </button>
              {pendingTasks.length === 0 ? (
                <p style={{padding:'14px 18px',fontSize:12,color:'#6b6b8a',margin:0}}>No pending tasks found</p>
              ) : pendingTasks.slice(0,12).map(t => (
                <button key={t.id} className="task-row"
                  onClick={() => { setSel(t); setShowTasks(false) }}
                  style={{width:'100%',padding:'11px 18px',
                    background:selectedTask?.id===t.id?'rgba(124,58,237,.1)':'none',
                    border:'none',textAlign:'left',cursor:'pointer',
                    borderBottom:'1px solid rgba(255,255,255,.04)',transition:'background .15s'}}>
                  <p style={{fontSize:13,fontWeight:500,
                    color:selectedTask?.id===t.id?cfg.color:'#f0f0f8',
                    margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {t.title}
                  </p>
                  <p style={{fontSize:10,color:'#6b6b8a',margin:0}}>
                    {t.priority} priority · {t.status?.replace('_',' ')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tip card */}
        <div style={{padding:'12px 16px',background:'rgba(124,58,237,.05)',
          border:'1px solid rgba(124,58,237,.1)',borderRadius:12}}>
          <p style={{fontSize:11,color:'#6b6b8a',margin:0,lineHeight:1.7}}>
            💡 <strong style={{color:'#a855f7'}}>Technique:</strong> 25 min focus → 5 min break → ×4 → 15 min long break.
            Use <strong style={{color:'#f0f0f8'}}>+ / −</strong> to adjust time. Press play and stay in flow!
          </p>
        </div>
      </div>

      {/* ── Full-screen alert overlay ── */}
      {alert && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',backdropFilter:'blur(16px)',
          zIndex:500,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{position:'absolute',top:'50%',left:'50%',
            transform:'translate(-50%,-50%)',
            background:'#111118',border:`1px solid ${alert==='focus'?'rgba(107,203,119,.3)':'rgba(96,165,250,.3)'}`,
            borderRadius:28,padding:'44px 52px',textAlign:'center',maxWidth:420,width:'90%',
            boxShadow:`0 32px 80px rgba(0,0,0,.8), 0 0 80px ${alert==='focus'?'rgba(107,203,119,.15)':'rgba(96,165,250,.15)'}`,
            animation:'alertPop .5s cubic-bezier(.34,1.56,.64,1) both'}}>

            {/* Icon */}
            <div style={{fontSize:64,marginBottom:12,animation:'ringPop .8s ease'}}>
              {alert==='focus' ? '🎉' : '💪'}
            </div>

            {/* Title */}
            <h2 style={{fontSize:26,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',
              margin:'0 0 10px',lineHeight:1.2}}>
              {alert==='focus' ? 'Session Complete!' : 'Break Time Over!'}
            </h2>

            {/* Body */}
            <p style={{fontSize:14,color:'#9ca3af',margin:'0 0 8px',lineHeight:1.7}}>
              {alert==='focus'
                ? <>You completed session <strong style={{color:'#6bcb77'}}>#{sessions}</strong> today! 🔥<br/>
                    Time to take a well-earned break.</>
                : <>Time to get back in the zone.<br/>
                    You've got this — stay consistent! ⚡</>}
            </p>

            {/* Stats row */}
            <div style={{display:'flex',gap:12,margin:'20px 0 28px',justifyContent:'center'}}>
              {alert==='focus' && (
                <>
                  <div style={{flex:1,padding:'12px 8px',background:'rgba(107,203,119,.08)',
                    border:'1px solid rgba(107,203,119,.2)',borderRadius:12}}>
                    <p style={{fontSize:20,fontWeight:800,color:'#6bcb77',fontFamily:'Syne,sans-serif',margin:'0 0 2px'}}>{sessions}</p>
                    <p style={{fontSize:10,color:'#6b6b8a',margin:0}}>Sessions today</p>
                  </div>
                  <div style={{flex:1,padding:'12px 8px',background:'rgba(168,85,247,.08)',
                    border:'1px solid rgba(168,85,247,.2)',borderRadius:12}}>
                    <p style={{fontSize:20,fontWeight:800,color:'#a855f7',fontFamily:'Syne,sans-serif',margin:'0 0 2px'}}>{Math.floor(sessions*customMins.focus)}m</p>
                    <p style={{fontSize:10,color:'#6b6b8a',margin:0}}>Focused today</p>
                  </div>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div style={{display:'flex',gap:10}}>
              {alert==='focus' && (
                <button className="dismiss-btn" onClick={() => { setAlert(null); switchMode('short') }}
                  style={{flex:1,padding:'13px',borderRadius:13,border:'none',
                    background:'linear-gradient(135deg,#6bcb77,#10b981)',
                    color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',
                    transition:'all .2s',boxShadow:'0 6px 20px rgba(107,203,119,.4)'}}>
                  ☕ Take Short Break
                </button>
              )}
              <button className="dismiss-btn" onClick={() => { setAlert(null); switchMode('focus') }}
                style={{flex:1,padding:'13px',borderRadius:13,border:'none',
                  background:alert==='focus'?'rgba(255,255,255,.07)':'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color: alert==='focus'?'#9ca3af':'#fff',
                  fontSize:14,fontWeight:700,cursor:'pointer',
                  border:alert==='focus'?'1px solid rgba(255,255,255,.1)':'none',
                  transition:'all .2s',
                  boxShadow:alert!=='focus'?'0 6px 20px rgba(124,58,237,.4)':'none'}}>
                {alert==='focus' ? 'Skip Break' : '🎯 Start Focus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}