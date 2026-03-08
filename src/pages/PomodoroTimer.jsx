import React, { useState, useEffect, useRef, useCallback } from 'react'

const MODES = {
  focus:      { label:'Focus',       mins:25, color:'#a855f7', bg:'rgba(168,85,247,.12)', emoji:'🎯' },
  short:      { label:'Short Break', mins:5,  color:'#6bcb77', bg:'rgba(107,203,119,.12)', emoji:'☕' },
  long:       { label:'Long Break',  mins:15, color:'#60a5fa', bg:'rgba(96,165,250,.12)', emoji:'🌿' },
}

const css = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
  @keyframes ring{0%{transform:scale(1)}20%{transform:scale(1.15)}40%{transform:scale(1)}60%{transform:scale(1.08)}80%{transform:scale(1)}100%{transform:scale(1)}}
  @keyframes tickIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
  .mode-btn:hover{background:rgba(255,255,255,.06)!important}
  .pom-action:hover{transform:scale(1.04)!important}
  .pom-action:active{transform:scale(.97)!important}
  .task-chip:hover{background:rgba(124,58,237,.15)!important}
`

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function CircleTimer({ progress, color, size = 200, children }) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - progress)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position:'absolute',inset:0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,.06)" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .5s ease, stroke .3s ease' }} />
      </svg>
      <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
        {children}
      </div>
    </div>
  )
}

export default function PomodoroTimer({ tasks = [], onSessionComplete }) {
  const [mode, setMode]           = useState('focus')
  const [secs, setSecs]           = useState(MODES.focus.mins * 60)
  const [running, setRunning]     = useState(false)
  const [sessions, setSessions]   = useState(0)
  const [selectedTask, setSel]    = useState(null)
  const [finished, setFinished]   = useState(false)
  const [showTasks, setShowTasks] = useState(false)
  const intervalRef               = useRef(null)
  const totalSecs                 = MODES[mode].mins * 60
  const cfg                       = MODES[mode]
  const progress                  = secs / totalSecs

  const stop = useCallback(() => {
    clearInterval(intervalRef.current)
    setRunning(false)
  }, [])

  const reset = useCallback((newMode = mode) => {
    stop()
    setFinished(false)
    setSecs(MODES[newMode].mins * 60)
  }, [mode, stop])

  const switchMode = (m) => {
    setMode(m)
    reset(m)
    setSecs(MODES[m].mins * 60)
  }

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          setFinished(true)
          if (mode === 'focus') {
            setSessions(p => p + 1)
            onSessionComplete && onSessionComplete(selectedTask)
          }
          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification(mode === 'focus' ? '🎯 Focus session done!' : '⏰ Break over!', {
              body: mode === 'focus' ? 'Great work! Take a break.' : 'Back to focus!',
              icon: '/favicon.ico'
            })
          }
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running, mode, selectedTask, onSessionComplete])

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Update title bar while running
  useEffect(() => {
    if (running) {
      document.title = `${formatTime(secs)} — ${cfg.label} | TaskFlow`
    } else {
      document.title = 'TaskFlow'
    }
    return () => { document.title = 'TaskFlow' }
  }, [running, secs, cfg])

  const pendingTasks = tasks.filter(t => t.status !== 'DONE')

  return (
    <>
      <style>{css}</style>
      <div style={{ maxWidth: 480, margin: '0 auto', animation: 'fadeUp .4s ease' }}>

        {/* Mode selector */}
        <div style={{ display:'flex',gap:6,background:'#111118',border:'1px solid rgba(255,255,255,.07)',
          borderRadius:14,padding:5,marginBottom:24 }}>
          {Object.entries(MODES).map(([key, m]) => (
            <button key={key} className="mode-btn" onClick={() => switchMode(key)}
              style={{ flex:1,padding:'8px 4px',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',
                border:'none',transition:'all .15s',
                background: mode===key ? m.bg : 'transparent',
                color: mode===key ? m.color : '#6b6b8a' }}>
              {m.emoji} {m.label}
            </button>
          ))}
        </div>

        {/* Timer circle */}
        <div style={{ display:'flex',justifyContent:'center',marginBottom:24 }}>
          <CircleTimer progress={progress} color={cfg.color} size={220}>
            <div style={{ textAlign:'center' }}>
              {finished ? (
                <div style={{ animation:'ring .6s ease' }}>
                  <p style={{ fontSize:44,margin:0 }}>🎉</p>
                  <p style={{ fontSize:14,fontWeight:700,color:cfg.color,margin:'4px 0 0' }}>Done!</p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize:52,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',
                    margin:0,letterSpacing:'-2px',lineHeight:1,
                    animation:running&&secs<=10?'pulse 1s ease infinite':'none',
                    color:secs<=10&&running?'#ff6b6b':cfg.color }}>
                    {formatTime(secs)}
                  </p>
                  <p style={{ fontSize:12,color:'#6b6b8a',margin:'6px 0 0',fontWeight:600 }}>
                    {cfg.emoji} {cfg.label}
                  </p>
                </>
              )}
            </div>
          </CircleTimer>
        </div>

        {/* Controls */}
        <div style={{ display:'flex',justifyContent:'center',gap:14,marginBottom:24 }}>
          {/* Reset */}
          <button onClick={() => reset()} className="pom-action"
            style={{ width:46,height:46,borderRadius:14,background:'#1a1a24',
              border:'1px solid rgba(255,255,255,.08)',color:'#6b6b8a',fontSize:18,
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .15s' }}>
            ↺
          </button>
          {/* Play/Pause */}
          <button onClick={() => { setFinished(false); setRunning(r => !r) }} className="pom-action"
            style={{ width:72,height:72,borderRadius:22,
              background:`linear-gradient(135deg,${cfg.color},${cfg.color}bb)`,
              border:'none',color:'#fff',fontSize:28,
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
              boxShadow:`0 8px 28px ${cfg.color}55`,transition:'all .2s' }}>
            {running ? '⏸' : '▶'}
          </button>
          {/* Skip */}
          <button onClick={() => {
            const next = mode==='focus' ? (sessions>0&&sessions%4===0?'long':'short') : 'focus'
            switchMode(next)
          }} className="pom-action"
            style={{ width:46,height:46,borderRadius:14,background:'#1a1a24',
              border:'1px solid rgba(255,255,255,.08)',color:'#6b6b8a',fontSize:18,
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .15s' }}>
            ⏭
          </button>
        </div>

        {/* Sessions counter */}
        <div style={{ display:'flex',justifyContent:'center',gap:8,marginBottom:24 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width:32,height:8,borderRadius:4,transition:'background .3s',
              background: i < sessions%4 ? cfg.color : i < sessions ? '#6bcb77' : 'rgba(255,255,255,.08)' }}/>
          ))}
          <span style={{ fontSize:11,color:'#6b6b8a',marginLeft:6,alignSelf:'center' }}>
            {sessions} session{sessions!==1?'s':''} today
          </span>
        </div>

        {/* Task selector */}
        <div style={{ background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:16,overflow:'hidden' }}>
          <button onClick={() => setShowTasks(s=>!s)}
            style={{ width:'100%',padding:'14px 18px',background:'none',border:'none',
              display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',color:'#f0f0f8' }}>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <span style={{ fontSize:16 }}>📋</span>
              <div style={{ textAlign:'left' }}>
                <p style={{ fontSize:13,fontWeight:600,margin:0 }}>
                  {selectedTask ? selectedTask.title : 'Link a task (optional)'}
                </p>
                {selectedTask && (
                  <p style={{ fontSize:11,color:'#6b6b8a',margin:0 }}>Focusing on this task</p>
                )}
              </div>
            </div>
            <span style={{ color:'#6b6b8a',fontSize:12,transform:showTasks?'rotate(180deg)':'none',transition:'transform .2s' }}>▼</span>
          </button>

          {showTasks && (
            <div style={{ borderTop:'1px solid rgba(255,255,255,.06)',maxHeight:200,overflowY:'auto' }}>
              <button className="task-chip" onClick={() => { setSel(null); setShowTasks(false) }}
                style={{ width:'100%',padding:'11px 18px',background:'none',border:'none',
                  textAlign:'left',color:'#6b6b8a',fontSize:12,cursor:'pointer',
                  borderBottom:'1px solid rgba(255,255,255,.04)',transition:'background .15s' }}>
                — No task selected
              </button>
              {pendingTasks.length === 0 ? (
                <p style={{ padding:'14px 18px',fontSize:12,color:'#6b6b8a',margin:0 }}>No pending tasks</p>
              ) : pendingTasks.slice(0,10).map(t => (
                <button key={t.id} className="task-chip"
                  onClick={() => { setSel(t); setShowTasks(false) }}
                  style={{ width:'100%',padding:'11px 18px',background:selectedTask?.id===t.id?'rgba(124,58,237,.1)':'none',
                    border:'none',textAlign:'left',cursor:'pointer',transition:'background .15s',
                    borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                  <p style={{ fontSize:13,fontWeight:500,color:selectedTask?.id===t.id?'#a855f7':'#f0f0f8',margin:'0 0 2px',
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.title}</p>
                  <p style={{ fontSize:10,color:'#6b6b8a',margin:0 }}>
                    {t.priority} · {t.status}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div style={{ marginTop:16,padding:'12px 16px',background:'rgba(124,58,237,.05)',
          border:'1px solid rgba(124,58,237,.1)',borderRadius:12 }}>
          <p style={{ fontSize:11,color:'#6b6b8a',margin:0,lineHeight:1.6 }}>
            💡 <strong style={{ color:'#a855f7' }}>Pomodoro technique:</strong> 25 min focus → 5 min break → repeat 4× → 15 min long break. Each completed session earns focus points!
          </p>
        </div>
      </div>
    </>
  )
}