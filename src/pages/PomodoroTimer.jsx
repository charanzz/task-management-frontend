import { useState, useEffect, useRef, useCallback } from "react"

const MODES = {
  focus: { label: "Focus", color: "#c084fc", glow: "rgba(192,132,252,0.35)", bg: "rgba(192,132,252,0.08)", emoji: "🎯" },
  short: { label: "Short Break", color: "#34d399", glow: "rgba(52,211,153,0.35)", bg: "rgba(52,211,153,0.08)", emoji: "☕" },
  long:  { label: "Long Break",  color: "#60a5fa", glow: "rgba(96,165,250,0.35)", bg: "rgba(96,165,250,0.08)", emoji: "🌿" },
}

const DEFAULT_SECS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 }

function secsToHMS(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return { h, m, sec }
}

function formatDisplay(s) {
  const { h, m, sec } = secsToHMS(s)
  if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`
}

function fmtHM(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const freqs = [523, 659, 784, 1047]
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = f; o.type = "sine"
      const t = ctx.currentTime + i * 0.18
      g.gain.setValueAtTime(0.35, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
      o.start(t); o.stop(t + 0.45)
    })
    setTimeout(() => ctx.close(), 3000)
  } catch(e) {}
}

// Time input parser: accepts "1:30:00", "90:00", "1h30m", "5400", plain number = minutes
function parseTimeInput(val) {
  val = val.trim()
  // hh:mm:ss or mm:ss
  if (/^\d+:\d+:\d+$/.test(val)) {
    const [h,m,s] = val.split(":").map(Number)
    return Math.min(h*3600 + m*60 + s, 12*3600)
  }
  if (/^\d+:\d+$/.test(val)) {
    const [m,s] = val.split(":").map(Number)
    return Math.min(m*60 + s, 12*3600)
  }
  // 1h30m style
  const hm = val.match(/^(\d+)h(\d+)m?$/)
  if (hm) return Math.min(parseInt(hm[1])*3600 + parseInt(hm[2])*60, 12*3600)
  const h = val.match(/^(\d+)h$/)
  if (h) return Math.min(parseInt(h[1])*3600, 12*3600)
  const m = val.match(/^(\d+)m$/)
  if (m) return Math.min(parseInt(m[1])*60, 12*3600)
  // plain number = minutes
  const n = parseInt(val)
  if (!isNaN(n)) return Math.min(n * 60, 12*3600)
  return null
}

function secsToInput(s) {
  const { h, m, sec } = secsToHMS(s)
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`
  return `${m}:${String(sec).padStart(2,"0")}`
}

const BAR_COLORS = ["#c084fc","#818cf8","#60a5fa","#34d399","#f59e0b"]

export default function Pomodoro() {
  const [mode, setMode] = useState("focus")
  const [durations, setDurations] = useState({...DEFAULT_SECS})
  const [secs, setSecs] = useState(DEFAULT_SECS.focus)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [alert, setAlert] = useState(null)

  // Analytics: array of { mode, secs, at }
  const [log, setLog] = useState([])
  const [editingTime, setEditingTime] = useState(false)
  const [editVal, setEditVal] = useState("")
  const [editErr, setEditErr] = useState(false)

  const intervalRef = useRef(null)
  const cfg = MODES[mode]
  const total = durations[mode]
  const progress = total > 0 ? secs / total : 0

  const SIZE = 280, R = (SIZE - 18) / 2, CIRC = 2 * Math.PI * R
  const offset = CIRC * (1 - progress)

  const stopTimer = useCallback(() => {
    clearInterval(intervalRef.current)
    setRunning(false)
  }, [])

  const switchMode = useCallback((m) => {
    stopTimer()
    setMode(m)
    setAlert(null)
    setSecs(durations[m])
  }, [durations, stopTimer])

  const reset = () => {
    stopTimer()
    setAlert(null)
    setSecs(durations[mode])
  }

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          playChime()
          setLog(l => [...l, { mode, secs: durations[mode], at: Date.now() }])
          if (mode === "focus") setSessions(p => p + 1)
          setAlert(mode)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running, mode])

  // Analytics derived
  const todayStart = new Date(); todayStart.setHours(0,0,0,0)
  const todayLog = log.filter(l => l.at >= todayStart.getTime())
  const focusTotal = todayLog.filter(l => l.mode === "focus").reduce((a, b) => a + b.secs, 0)
  const breakTotal = todayLog.filter(l => l.mode !== "focus").reduce((a, b) => a + b.secs, 0)
  const todaySessions = todayLog.filter(l => l.mode === "focus").length

  // Bar chart: last 7 completed focus sessions in minutes
  const last7 = log.filter(l => l.mode === "focus").slice(-7)
  const maxBar = Math.max(...last7.map(l => l.secs), 1)

  const startEdit = () => {
    setEditVal(secsToInput(durations[mode]))
    setEditErr(false)
    setEditingTime(true)
  }

  const commitEdit = () => {
    const parsed = parseTimeInput(editVal)
    if (!parsed || parsed < 10) { setEditErr(true); return }
    const nd = { ...durations, [mode]: parsed }
    setDurations(nd)
    setSecs(parsed)
    setEditingTime(false)
    setEditErr(false)
  }

  const isLastMin = secs <= 60 && secs > 10 && running
  const isLastTen = secs <= 10 && running

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Bebas+Neue&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#0a0a0f;min-height:100vh;font-family:'Space Grotesk',sans-serif;color:#e2e2ee}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2a2a3a;border-radius:4px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}
        @keyframes blink{0%,100%{border-color:rgba(192,132,252,0.6)}50%{border-color:rgba(192,132,252,0.15)}}
        @keyframes alertIn{0%{opacity:0;transform:scale(0.85)}60%{transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}
        @keyframes tick{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        .mode-tab:hover{background:rgba(255,255,255,0.06)!important}
        .ctrl:hover{filter:brightness(1.15);transform:scale(1.05)}
        .ctrl:active{transform:scale(0.93)}
      `}</style>

      <div style={{
        minHeight:"100vh", background:"#0a0a0f",
        display:"flex", flexDirection:"column", alignItems:"center",
        padding:"32px 16px 48px", gap:28, animation:"fadeUp .5s ease"
      }}>

        {/* Header */}
        <div style={{textAlign:"center"}}>
          <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,letterSpacing:4,
            color:"#e2e2ee",marginBottom:4}}>POMODORO</h1>
          <p style={{fontSize:11,color:"#4b4b6b",letterSpacing:2,textTransform:"uppercase"}}>Deep Work Timer</p>
        </div>

        {/* Mode tabs */}
        <div style={{display:"flex",gap:4,background:"#111118",borderRadius:14,padding:4,
          border:"1px solid rgba(255,255,255,0.06)"}}>
          {Object.entries(MODES).map(([k,m]) => (
            <button key={k} className="mode-tab"
              onClick={() => switchMode(k)}
              style={{
                padding:"9px 20px", borderRadius:10, border:"none",
                background: mode===k ? m.bg : "transparent",
                color: mode===k ? m.color : "#4b4b6b",
                fontSize:12, fontWeight:600, cursor:"pointer",
                outline: mode===k ? `1px solid ${m.color}33` : "none",
                transition:"all .2s", whiteSpace:"nowrap"
              }}>
              {m.emoji} {m.label}
            </button>
          ))}
        </div>

        {/* Circle Timer */}
        <div style={{position:"relative",width:SIZE,height:SIZE}}>
          <svg width={SIZE} height={SIZE} style={{transform:"rotate(-90deg)",position:"absolute",inset:0}}>
            <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={9}/>
            <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
              stroke={cfg.color} strokeWidth={9}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              style={{
                transition:"stroke-dashoffset 0.9s ease, stroke 0.3s",
                filter:`drop-shadow(0 0 10px ${cfg.glow})`
              }}/>
          </svg>

          {/* Inner */}
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
            alignItems:"center",justifyContent:"center",gap:6}}>

            {/* Editable time */}
            {editingTime && !running ? (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                <input
                  autoFocus
                  value={editVal}
                  onChange={e => { setEditVal(e.target.value); setEditErr(false) }}
                  onKeyDown={e => { if(e.key==="Enter") commitEdit(); if(e.key==="Escape") setEditingTime(false) }}
                  onBlur={commitEdit}
                  style={{
                    background:"transparent",
                    border:"none",
                    borderBottom:`2px solid ${editErr?"#f87171":cfg.color}`,
                    color: editErr?"#f87171":cfg.color,
                    fontFamily:"'Bebas Neue',sans-serif",
                    fontSize:52, letterSpacing:2,
                    textAlign:"center", width:180, outline:"none",
                    animation:"blink .8s ease infinite"
                  }}
                  placeholder="25:00"
                />
                <p style={{fontSize:10,color:"#4b4b6b",letterSpacing:1}}>
                  {editErr ? "INVALID FORMAT" : "hh:mm:ss · mm:ss · 90m · 1h30m"}
                </p>
              </div>
            ) : (
              <div
                onClick={() => !running && startEdit()}
                title={running ? "" : "Click to edit time"}
                style={{
                  cursor: running ? "default" : "text",
                  display:"flex",flexDirection:"column",alignItems:"center",gap:2
                }}>
                <p style={{
                  fontFamily:"'Bebas Neue',sans-serif",
                  fontSize: secs >= 36000 ? 42 : secs >= 3600 ? 52 : 64,
                  letterSpacing:2, lineHeight:1, margin:0,
                  color: isLastTen ? "#f87171" : isLastMin ? "#fbbf24" : cfg.color,
                  animation: isLastTen ? "tick .5s ease infinite" : "none",
                  textShadow: running ? `0 0 24px ${isLastTen?"rgba(248,113,113,0.6)":cfg.glow}` : "none",
                  transition:"color .3s, font-size .2s"
                }}>
                  {formatDisplay(secs)}
                </p>
                {!running && (
                  <p style={{fontSize:9,color:"#2a2a4b",letterSpacing:2,textTransform:"uppercase"}}>
                    TAP TO EDIT
                  </p>
                )}
              </div>
            )}

            <p style={{fontSize:11,color:"#4b4b6b",letterSpacing:2,textTransform:"uppercase",
              marginTop:2}}>
              {cfg.emoji} {cfg.label}
            </p>

            {running && (
              <div style={{display:"flex",gap:4,marginTop:2}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:4,height:4,borderRadius:"50%",background:cfg.color,
                    animation:`pulse 1s ease ${i*0.25}s infinite`}}/>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Warning */}
        {isLastMin && !isLastTen && (
          <p style={{fontSize:12,color:"#fbbf24",fontWeight:600,letterSpacing:1,
            animation:"pulse 1.2s ease infinite",marginTop:-16}}>
            ⚡ Almost done — keep going!
          </p>
        )}
        {isLastTen && (
          <p style={{fontSize:13,color:"#f87171",fontWeight:700,letterSpacing:1,
            animation:"pulse 0.6s ease infinite",marginTop:-16}}>
            🔥 {secs}s remaining
          </p>
        )}

        {/* Controls */}
        <div style={{display:"flex",alignItems:"center",gap:14,marginTop:-8}}>
          <button className="ctrl" onClick={reset}
            style={{width:50,height:50,borderRadius:15,background:"#111118",
              border:"1px solid rgba(255,255,255,0.08)",color:"#4b4b6b",
              fontSize:20,cursor:"pointer",transition:"all .2s",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
            ↺
          </button>

          <button className="ctrl" onClick={() => { setAlert(null); setRunning(r=>!r) }}
            style={{
              width:76,height:76,borderRadius:22,border:"none",
              background:`linear-gradient(135deg,${cfg.color},${cfg.color}bb)`,
              color:"#fff",fontSize:30,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:`0 8px 28px ${cfg.glow}`,transition:"all .2s"
            }}>
            {running ? "⏸" : "▶"}
          </button>

          <button className="ctrl" onClick={() => {
            const next = mode==="focus"?(sessions>0&&(sessions+1)%4===0?"long":"short"):"focus"
            switchMode(next)
          }}
            style={{width:50,height:50,borderRadius:15,background:"#111118",
              border:"1px solid rgba(255,255,255,0.08)",color:"#4b4b6b",
              fontSize:20,cursor:"pointer",transition:"all .2s",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
            ⏭
          </button>
        </div>

        {/* Session dots */}
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{
              width:i===3?8:24,height:6,borderRadius:3,transition:"all .4s",
              background: i < sessions%4
                ? cfg.color
                : i===sessions%4&&running
                  ? `linear-gradient(90deg,${cfg.color} ${Math.round((1-progress)*100)}%,rgba(255,255,255,0.07) 0%)`
                  : "rgba(255,255,255,0.07)"
            }}/>
          ))}
          <span style={{fontSize:10,color:"#3a3a5a",marginLeft:4,letterSpacing:1}}>
            {sessions} SESSION{sessions!==1?"S":""}
          </span>
        </div>

        {/* ── Analytics ── */}
        <div style={{
          width:"100%",maxWidth:480,
          background:"#0d0d15",
          border:"1px solid rgba(255,255,255,0.06)",
          borderRadius:20,overflow:"hidden"
        }}>
          {/* Header */}
          <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.05)",
            display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <p style={{fontSize:12,fontWeight:700,letterSpacing:2,color:"#4b4b6b",textTransform:"uppercase"}}>
              📊 Today's Analytics
            </p>
            {log.length > 0 && (
              <button onClick={() => setLog([])}
                style={{fontSize:9,color:"#2a2a4a",background:"none",border:"none",
                  cursor:"pointer",letterSpacing:1,textTransform:"uppercase"}}>
                RESET
              </button>
            )}
          </div>

          {/* Stats row */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:1,
            borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
            {[
              { label:"Focus Time", val: focusTotal>0 ? fmtHM(focusTotal) : "—", color:"#c084fc" },
              { label:"Breaks", val: breakTotal>0 ? fmtHM(breakTotal) : "—", color:"#34d399" },
              { label:"Sessions", val: todaySessions>0 ? todaySessions : "—", color:"#60a5fa" },
            ].map(s => (
              <div key={s.label} style={{padding:"14px 16px",textAlign:"center"}}>
                <p style={{fontSize:22,fontWeight:700,fontFamily:"'Bebas Neue',sans-serif",
                  letterSpacing:2,color:s.color,margin:"0 0 3px"}}>{s.val}</p>
                <p style={{fontSize:9,color:"#2a2a4a",letterSpacing:1,textTransform:"uppercase"}}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div style={{padding:"16px 20px"}}>
            <p style={{fontSize:9,color:"#2a2a4a",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>
              Last {last7.length} Focus Sessions
            </p>
            {last7.length === 0 ? (
              <div style={{height:60,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <p style={{fontSize:11,color:"#2a2a4a",letterSpacing:1}}>Complete a session to see data</p>
              </div>
            ) : (
              <div style={{display:"flex",alignItems:"flex-end",gap:6,height:64}}>
                {last7.map((l, i) => {
                  const pct = l.secs / maxBar
                  return (
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <p style={{fontSize:8,color:BAR_COLORS[i%5],opacity:0.7}}>
                        {Math.round(l.secs/60)}m
                      </p>
                      <div style={{
                        width:"100%", height: Math.max(pct * 48, 4),
                        borderRadius:4, background:BAR_COLORS[i%5],
                        opacity:0.7+(0.3*pct),
                        transition:"height .4s ease",
                        boxShadow:`0 0 8px ${BAR_COLORS[i%5]}55`
                      }}/>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tip */}
        <p style={{fontSize:10,color:"#2a2a4a",letterSpacing:1,textAlign:"center",maxWidth:340}}>
          💡 Tap the timer to type any duration — e.g. <span style={{color:"#3a3a6a"}}>1:30:00</span>, <span style={{color:"#3a3a6a"}}>90m</span>, or <span style={{color:"#3a3a6a"}}>2h</span>. Up to 12 hours.
        </p>
      </div>

      {/* ── Alert overlay ── */}
      {alert && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",
          backdropFilter:"blur(20px)",zIndex:999,
          display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={() => setAlert(null)}>
          <div onClick={e=>e.stopPropagation()}
            style={{
              background:"#0d0d15",
              border:`1px solid ${alert==="focus"?"rgba(52,211,153,0.25)":"rgba(96,165,250,0.25)"}`,
              borderRadius:24,padding:"40px 44px",textAlign:"center",maxWidth:380,width:"90%",
              boxShadow:`0 32px 80px rgba(0,0,0,0.9)`,
              animation:"alertIn .45s cubic-bezier(0.34,1.56,0.64,1) both"
            }}>
            <p style={{fontSize:56,marginBottom:12,animation:"pop 0.8s ease"}}>
              {alert==="focus"?"🎉":"💪"}
            </p>
            <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,letterSpacing:3,
              color:"#e2e2ee",marginBottom:8}}>
              {alert==="focus"?"SESSION DONE!":"BREAK OVER"}
            </h2>
            <p style={{fontSize:13,color:"#4b4b6b",lineHeight:1.7,marginBottom:20}}>
              {alert==="focus"
                ? `Session #${sessions} complete. ${Math.round(durations.focus/60)} minutes of deep work. 🔥`
                : "Time to get back in the zone. You've got this."}
            </p>

            {alert==="focus" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                <div style={{padding:"12px",background:"rgba(192,132,252,0.08)",
                  border:"1px solid rgba(192,132,252,0.15)",borderRadius:12}}>
                  <p style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#c084fc",letterSpacing:2}}>
                    {sessions}
                  </p>
                  <p style={{fontSize:9,color:"#3a3a5a",letterSpacing:1,textTransform:"uppercase"}}>Sessions</p>
                </div>
                <div style={{padding:"12px",background:"rgba(52,211,153,0.08)",
                  border:"1px solid rgba(52,211,153,0.15)",borderRadius:12}}>
                  <p style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:"#34d399",letterSpacing:2}}>
                    {fmtHM(focusTotal)}
                  </p>
                  <p style={{fontSize:9,color:"#3a3a5a",letterSpacing:1,textTransform:"uppercase"}}>Focused</p>
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:8}}>
              {alert==="focus" && (
                <button onClick={() => { setAlert(null); switchMode("short") }}
                  style={{flex:1,padding:"12px",borderRadius:12,border:"none",cursor:"pointer",
                    background:"linear-gradient(135deg,#34d399,#059669)",
                    color:"#fff",fontSize:13,fontWeight:700,
                    boxShadow:"0 6px 20px rgba(52,211,153,0.35)"}}>
                  ☕ Short Break
                </button>
              )}
              <button onClick={() => { setAlert(null); switchMode("focus") }}
                style={{flex:1,padding:"12px",borderRadius:12,border:"none",cursor:"pointer",
                  background: alert==="focus"?"rgba(255,255,255,0.06)":"linear-gradient(135deg,#7c3aed,#a855f7)",
                  color: alert==="focus"?"#6b6b8a":"#fff",
                  border: alert==="focus"?"1px solid rgba(255,255,255,0.08)":"none",
                  fontSize:13,fontWeight:700,
                  boxShadow:alert!=="focus"?"0 6px 20px rgba(124,58,237,0.4)":"none"}}>
                {alert==="focus"?"⏭ Skip Break":"🎯 Focus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}