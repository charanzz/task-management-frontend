import { useState, useEffect, useRef, useCallback } from "react"

// ─── helpers ────────────────────────────────────────────────────────────────
const pad = n => String(Math.max(0, n)).padStart(2, "0")

function fmtClock(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

function fmtDuration(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  if (m) return `${m}m`
  return `${s}s`
}

function chime() {
  try {
    const C = new (window.AudioContext || window.webkitAudioContext)()
    ;[[523,0],[659,.18],[784,.36],[1047,.54]].forEach(([f,t]) => {
      const o = C.createOscillator(), g = C.createGain()
      o.connect(g); g.connect(C.destination)
      o.frequency.value = f; o.type = "sine"
      g.gain.setValueAtTime(0, C.currentTime+t)
      g.gain.linearRampToValueAtTime(.18, C.currentTime+t+.04)
      g.gain.exponentialRampToValueAtTime(.001, C.currentTime+t+.55)
      o.start(C.currentTime+t); o.stop(C.currentTime+t+.6)
    })
    setTimeout(() => C.close(), 4000)
  } catch(_) {}
}

// ─── mode config ─────────────────────────────────────────────────────────────
const MODE = {
  focus: { label:"Focus",       mins:25, color:"#f0c27f", track:"rgba(240,194,127,.12)" },
  short: { label:"Short Break", mins:5,  color:"#7fb8a0", track:"rgba(127,184,160,.12)" },
  long:  { label:"Long Break",  mins:15, color:"#7fa8d4", track:"rgba(127,168,212,.12)" },
}

// ─── SVG Arc ring ─────────────────────────────────────────────────────────────
function Ring({ pct, color, track, r = 120, sw = 3 }) {
  const C = 2 * Math.PI * r
  return (
    <svg width={r*2+sw*2} height={r*2+sw*2}
      style={{ position:"absolute", inset:0, transform:"rotate(-90deg)" }}>
      <circle cx={r+sw} cy={r+sw} r={r} fill="none"
        stroke={track} strokeWidth={sw} />
      <circle cx={r+sw} cy={r+sw} r={r} fill="none"
        stroke={color} strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - Math.max(0, Math.min(1, pct)))}
        style={{ transition:"stroke-dashoffset .85s cubic-bezier(.4,0,.2,1), stroke .3s" }} />
    </svg>
  )
}

// ─── Digit spinner ─────────────────────────────────────────────────────────
function Digit({ val, max, onChange, size, color, disabled }) {
  const [ed, setEd] = useState(false)
  const [draft, setDraft] = useState("")
  const ref = useRef()

  const commit = () => {
    const n = parseInt(draft)
    if (!isNaN(n)) onChange(Math.max(0, Math.min(max, n)))
    setEd(false)
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, userSelect:"none" }}>
      {!disabled && (
        <button onClick={() => !disabled && onChange(val >= max ? 0 : val + 1)}
          style={{ width:26, height:20, background:"rgba(255,255,255,.04)",
            border:"1px solid rgba(255,255,255,.07)", borderRadius:5,
            color:"rgba(255,255,255,.25)", fontSize:13, lineHeight:1,
            cursor:"pointer", transition:"all .15s", fontFamily:"inherit" }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.09)";e.currentTarget.style.color="rgba(255,255,255,.6)"}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.04)";e.currentTarget.style.color="rgba(255,255,255,.25)"}}>
          +
        </button>
      )}
      {ed && !disabled ? (
        <input ref={ref} value={draft} autoFocus
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if(e.key==="Enter") commit(); if(e.key==="Escape") setEd(false) }}
          style={{ width:size*.72, fontSize:size, fontFamily:"'DM Mono',monospace",
            fontWeight:500, color, background:"transparent",
            border:"none", borderBottom:`1.5px solid ${color}80`,
            textAlign:"center", outline:"none", letterSpacing:"-2px" }} />
      ) : (
        <div onClick={() => !disabled && (setDraft(pad(val)), setEd(true))}
          style={{ fontSize:size, fontFamily:"'DM Mono',monospace", fontWeight:500,
            color, letterSpacing:"-3px", lineHeight:1,
            cursor: disabled ? "default" : "text",
            minWidth:size*.72, textAlign:"center",
            transition:"color .3s" }}>
          {pad(val)}
        </div>
      )}
      {!disabled && (
        <button onClick={() => !disabled && onChange(val <= 0 ? max : val - 1)}
          style={{ width:26, height:20, background:"rgba(255,255,255,.04)",
            border:"1px solid rgba(255,255,255,.07)", borderRadius:5,
            color:"rgba(255,255,255,.25)", fontSize:13, lineHeight:1,
            cursor:"pointer", transition:"all .15s", fontFamily:"inherit" }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.09)";e.currentTarget.style.color="rgba(255,255,255,.6)"}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.04)";e.currentTarget.style.color="rgba(255,255,255,.25)"}}>
          −
        </button>
      )}
    </div>
  )
}

// ─── Colon ─────────────────────────────────────────────────────────────────
const Colon = ({ size, color }) => (
  <div style={{ fontSize:size*.8, fontFamily:"'DM Mono',monospace", fontWeight:300,
    color:`${color}40`, lineHeight:1, marginBottom:2, letterSpacing:0,
    flexShrink:0, paddingBottom: size > 60 ? 0 : 20 }}>
    :
  </div>
)

// ─── Main ──────────────────────────────────────────────────────────────────
export default function PomodoroTimer({ tasks = [] }) {
  const [mode, setMode]         = useState("focus")
  const [durations, setDur]     = useState({ focus:25*60, short:5*60, long:15*60 })
  const [secs, setSecs]         = useState(25*60)
  const [running, setRunning]   = useState(false)
  const [sessions, setSessions] = useState(0)
  const [done, setDone]         = useState(null)   // alert
  const [taskId, setTaskId]     = useState(null)
  const [showTasks, setShowTasks] = useState(false)
  const [log, setLog]           = useState([])     // {task, secs, at}

  const timerRef = useRef(null)
  const cfg = MODE[mode]
  const total = durations[mode]
  const pct = total > 0 ? secs / total : 0

  const H = Math.floor(secs / 3600)
  const M = Math.floor((secs % 3600) / 60)
  const S = secs % 60
  const big = total > 3600  // show hours column

  const stop = useCallback(() => { clearInterval(timerRef.current); setRunning(false) }, [])

  const applyDuration = (h, m, s) => {
    const t = Math.max(10, Math.min(43200, h*3600 + m*60 + s))
    setDur(d => ({ ...d, [mode]: t }))
    setSecs(t)
  }

  const switchMode = m => {
    stop(); setMode(m); setSecs(durations[m]); setDone(null)
  }

  const reset = () => { stop(); setSecs(durations[mode]); setDone(null) }

  useEffect(() => {
    if (!running) return
    timerRef.current = setInterval(() => {
      setSecs(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current); setRunning(false)
          chime()
          if (mode === "focus") {
            setSessions(p => p + 1)
            setLog(l => [...l, { task: taskId, secs: durations[mode], at: Date.now() }])
          }
          setDone(mode)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [running, mode, durations, taskId])

  // per-task totals (all time focus log)
  const taskTotals = {}
  log.forEach(l => {
    if (!l.task) return
    taskTotals[l.task] = (taskTotals[l.task] || 0) + l.secs
  })

  const selectedTask = tasks.find(t => t.id === taskId)
  const pendingTasks = tasks.filter(t => t.status !== "DONE")

  const isLastMin = secs <= 60 && secs > 10 && running
  const isLastTen = secs <= 10 && running
  const tickColor = isLastTen ? "#e87070" : isLastMin ? "#e8c060" : cfg.color

  const focusDoneToday = log.filter(l => {
    const d = new Date(); d.setHours(0,0,0,0)
    return l.at >= d.getTime()
  }).reduce((a, b) => a + b.secs, 0)

  return (<>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
      .pt-root{min-height:100vh;background:#080810;display:flex;align-items:center;justify-content:center;padding:24px 16px;font-family:'DM Sans',sans-serif}
      .pt-wrap{width:100%;max-width:400px;display:flex;flex-direction:column;align-items:center;gap:0}
      @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pop{0%{opacity:0;transform:scale(.88)}60%{transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}
      @keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}
      @keyframes dot{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.4);opacity:1}}
      .mode-rail{display:flex;gap:0;background:#0d0d18;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:3px;overflow:hidden}
      .mode-tab{padding:8px 16px;border-radius:9px;border:none;background:transparent;font-family:'DM Sans',sans-serif;font-size:11.5px;font-weight:400;cursor:pointer;letter-spacing:.02em;transition:all .18s;white-space:nowrap}
      .mode-tab.on{font-weight:500}
      .mode-tab:not(.on){color:rgba(255,255,255,.25)}
      .icn-btn{display:flex;align-items:center;justify-content:center;border-radius:13px;cursor:pointer;border:1px solid rgba(255,255,255,.07);background:#0d0d18;transition:all .16s;font-family:inherit}
      .icn-btn:hover{border-color:rgba(255,255,255,.16);background:rgba(255,255,255,.05)}
      .icn-btn:active{transform:scale(.91)}
      .play-btn{display:flex;align-items:center;justify-content:center;border-radius:18px;cursor:pointer;border:none;transition:all .2s;font-family:inherit}
      .play-btn:active{transform:scale(.92)}
      .task-row{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;transition:background .12s}
      .task-row:hover{background:rgba(255,255,255,.04)}
      .task-row:last-child{border-bottom:none}
      .glass{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:16px}
    `}</style>

    <div className="pt-root">
      <div className="pt-wrap">

        {/* ── Mode rail ── */}
        <div className="mode-rail" style={{ marginBottom:32, animation:"up .4s ease both" }}>
          {Object.entries(MODE).map(([k,v]) => (
            <button key={k} className={`mode-tab${mode===k?" on":""}`}
              onClick={() => switchMode(k)}
              style={{ color: mode===k ? v.color : undefined,
                background: mode===k ? `${v.track}` : "transparent" }}>
              {v.label}
            </button>
          ))}
        </div>

        {/* ── Circle + Timer ── */}
        <div style={{ position:"relative", width:246, height:246,
          display:"flex", alignItems:"center", justifyContent:"center",
          marginBottom:8, animation:"up .4s .05s ease both" }}>

          <Ring pct={pct} color={cfg.color} track={cfg.track} r={120} sw={2} />

          {/* subtle second ring */}
          <svg width={246} height={246} style={{ position:"absolute", inset:0 }}>
            <circle cx={123} cy={123} r={112} fill="none"
              stroke="rgba(255,255,255,.025)" strokeWidth={.75}
              strokeDasharray="3 6" />
          </svg>

          {/* digits */}
          <div style={{ display:"flex", alignItems:"center", gap: big?2:6,
            zIndex:2, position:"relative" }}>
            {big && <>
              <Digit val={H} max={11} size={54} color={tickColor} disabled={running}
                onChange={v => applyDuration(v, M, S)} />
              <Colon size={54} color={tickColor} />
            </>}
            <Digit val={M} max={59} size={big?54:72} color={tickColor} disabled={running}
              onChange={v => applyDuration(H, v, S)} />
            <Colon size={big?54:72} color={tickColor} />
            <Digit val={S} max={59} size={big?54:72} color={tickColor} disabled={running}
              onChange={v => applyDuration(H, M, v)} />
          </div>
        </div>

        {/* status line */}
        <div style={{ height:20, display:"flex", alignItems:"center", gap:6,
          marginBottom:28, animation:"up .4s .08s ease both" }}>
          {running && !isLastMin && (
            <div style={{ display:"flex", gap:3 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:3, height:3, borderRadius:"50%",
                  background:cfg.color, animation:`dot 1.1s ease ${i*.25}s infinite` }} />
              ))}
            </div>
          )}
          {isLastTen && <span style={{ fontSize:12, color:"#e87070",
            animation:"blink .55s ease infinite", fontWeight:500 }}>
            {secs}s remaining
          </span>}
          {isLastMin && !isLastTen && <span style={{ fontSize:11, color:"#e8c060",
            animation:"blink 1.1s ease infinite" }}>almost done</span>}
          {!running && !isLastMin && <span style={{ fontSize:11,
            color:"rgba(255,255,255,.15)", letterSpacing:".05em" }}>
            {running ? cfg.label : `${Math.round(total/60)}m · tap to edit`}
          </span>}
        </div>

        {/* ── Controls ── */}
        <div style={{ display:"flex", alignItems:"center", gap:14,
          marginBottom:32, animation:"up .4s .1s ease both" }}>
          <button className="icn-btn" onClick={reset}
            style={{ width:48, height:48, color:"rgba(255,255,255,.3)", fontSize:17 }}>
            ↺
          </button>
          <button className="play-btn"
            onClick={() => { setDone(null); setRunning(r=>!r) }}
            style={{ width:70, height:70,
              background: running ? "rgba(255,255,255,.06)" : cfg.color + "22",
              border: `1.5px solid ${running ? "rgba(255,255,255,.1)" : cfg.color+"55"}`,
              color: running ? "rgba(255,255,255,.55)" : cfg.color,
              fontSize:28,
              boxShadow: running ? "none" : `0 0 36px ${cfg.color}28` }}>
            {running ? "⏸" : "▶"}
          </button>
          <button className="icn-btn"
            onClick={() => {
              const next = mode==="focus"?(sessions%4===3?"long":"short"):"focus"
              switchMode(next)
            }}
            style={{ width:48, height:48, color:"rgba(255,255,255,.3)", fontSize:17 }}>
            ⏭
          </button>
        </div>

        {/* ── Session pips ── */}
        <div style={{ display:"flex", alignItems:"center", gap:7,
          marginBottom:36, animation:"up .4s .13s ease both" }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ height:3, borderRadius:2, transition:"all .35s",
              width: i<3 ? (i < sessions%4 ? 28 : 18) : 6,
              background: i < sessions%4 ? cfg.color
                : i===sessions%4&&running
                  ? `linear-gradient(90deg,${cfg.color} ${Math.round((1-pct)*100)}%,rgba(255,255,255,.07) 0%)`
                  : "rgba(255,255,255,.07)" }} />
          ))}
          <span style={{ fontSize:10, color:"rgba(255,255,255,.18)",
            marginLeft:3, letterSpacing:".04em" }}>
            {sessions} session{sessions!==1?"s":""}
          </span>
          {focusDoneToday>0 && (
            <span style={{ fontSize:10, color:"rgba(255,255,255,.13)" }}>
              · {fmtDuration(focusDoneToday)} today
            </span>
          )}
        </div>

        {/* ── Task linker ── */}
        <div className="glass" style={{ width:"100%", overflow:"hidden",
          marginBottom:12, animation:"up .4s .16s ease both" }}>

          <button onClick={() => !running && setShowTasks(s=>!s)}
            style={{ width:"100%", padding:"13px 16px", background:"none", border:"none",
              display:"flex", alignItems:"center", gap:10, cursor: running?"default":"pointer",
              opacity: running?.7:1 }}>
            <div style={{ width:32, height:32, borderRadius:9, flexShrink:0,
              background: selectedTask ? cfg.color+"18" : "rgba(255,255,255,.04)",
              border:`1px solid ${selectedTask ? cfg.color+"33" : "rgba(255,255,255,.07)"}`,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>
              {selectedTask ? "📌" : "📋"}
            </div>
            <div style={{ flex:1, textAlign:"left", minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:500,
                color: selectedTask ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.3)",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {selectedTask ? selectedTask.title : "Link a task"}
              </div>
              {selectedTask && taskTotals[taskId] && (
                <div style={{ fontSize:10, color:cfg.color, marginTop:1 }}>
                  {fmtDuration(taskTotals[taskId])} total on this task
                </div>
              )}
              {selectedTask && !taskTotals[taskId] && (
                <div style={{ fontSize:10, color:"rgba(255,255,255,.2)", marginTop:1 }}>
                  {selectedTask.priority} · {selectedTask.status?.replace("_"," ")}
                </div>
              )}
            </div>
            {!running && (
              <div style={{ fontSize:10, color:"rgba(255,255,255,.18)",
                transform: showTasks?"rotate(180deg)":"none", transition:"transform .2s" }}>▼</div>
            )}
          </button>

          {showTasks && (
            <div style={{ borderTop:"1px solid rgba(255,255,255,.05)",
              maxHeight:220, overflowY:"auto" }}>
              <div className="task-row" onClick={() => { setTaskId(null); setShowTasks(false) }}>
                <div style={{ width:6, height:6, borderRadius:"50%",
                  background:"rgba(255,255,255,.15)", flexShrink:0 }} />
                <span style={{ fontSize:12, color:"rgba(255,255,255,.3)" }}>No task</span>
              </div>
              {pendingTasks.length === 0 ? (
                <div style={{ padding:"14px 16px", fontSize:12,
                  color:"rgba(255,255,255,.2)" }}>No pending tasks</div>
              ) : pendingTasks.map(t => (
                <div key={t.id} className="task-row"
                  onClick={() => { setTaskId(t.id); setShowTasks(false) }}
                  style={{ background: taskId===t.id ? `${cfg.color}10` : undefined }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", flexShrink:0,
                    background: taskId===t.id ? cfg.color : "rgba(255,255,255,.15)" }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500,
                      color: taskId===t.id ? cfg.color : "rgba(255,255,255,.75)",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,.25)", marginTop:1 }}>
                      {t.priority} · {t.status?.replace("_"," ")}
                      {taskTotals[t.id] ? ` · ${fmtDuration(taskTotals[t.id])} logged` : ""}
                    </div>
                  </div>
                  {taskId===t.id && (
                    <div style={{ fontSize:9, color:cfg.color, letterSpacing:".05em" }}>✓</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Tip ── */}
        <div style={{ fontSize:10.5, color:"rgba(255,255,255,.13)", textAlign:"center",
          lineHeight:1.7, letterSpacing:".02em", animation:"up .4s .2s ease both" }}>
          Tap <span style={{ color:"rgba(255,255,255,.25)" }}>+</span> /{" "}
          <span style={{ color:"rgba(255,255,255,.25)" }}>−</span> or click the digits to set any duration up to 12 h
        </div>

      </div>
    </div>

    {/* ── Completion overlay ── */}
    {done && (
      <div onClick={() => setDone(null)}
        style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)",
          backdropFilter:"blur(20px)", zIndex:900,
          display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
        <div onClick={e => e.stopPropagation()}
          style={{ background:"#0e0e18", border:"1px solid rgba(255,255,255,.09)",
            borderRadius:22, padding:"36px 30px 28px", textAlign:"center",
            maxWidth:340, width:"100%", animation:"pop .45s cubic-bezier(.34,1.56,.64,1)" }}>

          <div style={{ fontSize:44, marginBottom:12 }}>
            {done==="focus" ? "✦" : "◈"}
          </div>
          <div style={{ fontSize:20, fontWeight:500, color:"rgba(255,255,255,.88)",
            marginBottom:6 }}>
            {done==="focus" ? "Session done" : "Break over"}
          </div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,.33)",
            lineHeight:1.75, marginBottom:20 }}>
            {done==="focus"
              ? `${Math.round(durations.focus/60)} min deep work · session #${sessions}`
              : "Time to get back in the zone."}
            {done==="focus" && selectedTask && (
              <><br />
                <span style={{ color:cfg.color }}>
                  {fmtDuration((taskTotals[taskId]||0) + durations.focus)} total on "{selectedTask.title}"
                </span>
              </>
            )}
          </div>

          <div style={{ display:"flex", gap:8 }}>
            {done==="focus" && (
              <button onClick={() => { setDone(null); switchMode("short") }}
                style={{ flex:1, padding:"11px", borderRadius:11, border:"none",
                  background:"rgba(127,184,160,.12)", color:"#7fb8a0",
                  fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                  border:"1px solid rgba(127,184,160,.22)" }}>
                Short break
              </button>
            )}
            <button onClick={() => { setDone(null); switchMode("focus") }}
              style={{ flex:1, padding:"11px", borderRadius:11, border:"none",
                background: done==="focus"?"rgba(255,255,255,.05)":"rgba(240,194,127,.12)",
                color: done==="focus"?"rgba(255,255,255,.4)":"#f0c27f",
                fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
                border: done==="focus"?"1px solid rgba(255,255,255,.08)":"1px solid rgba(240,194,127,.22)" }}>
              {done==="focus" ? "Skip break" : "Start focus"}
            </button>
          </div>
        </div>
      </div>
    )}
  </>)
}