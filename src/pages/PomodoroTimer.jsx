import { useState, useEffect, useRef, useCallback } from "react"

// ─── Constants ───────────────────────────────────────────
const MODES = {
  focus: { label: "Focus", color: "#e8d5b0", accent: "#c9a96e", glow: "rgba(201,169,110,0.2)", dim: "rgba(232,213,176,0.06)", tip: "Deep work" },
  short: { label: "Short Break", color: "#a8c4b8", accent: "#6ba898", glow: "rgba(107,168,152,0.2)", dim: "rgba(168,196,184,0.06)", tip: "Rest eyes" },
  long:  { label: "Long Break",  color: "#a8b8d4", accent: "#6b8ec9", glow: "rgba(107,142,201,0.2)", dim: "rgba(168,184,212,0.06)", tip: "Recharge" },
}
const DEFAULTS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 }

const PRESET_TASKS = [
  "Design system", "Code review", "Deep work", "Writing", "Research", "Planning", "Learning"
]

function p2(n) { return String(Math.max(0, n)).padStart(2, "0") }
function fmtHMS(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  if (h > 0) return `${p2(h)}:${p2(m)}:${p2(sec)}`
  return `${p2(m)}:${p2(sec)}`
}
function fmtShort(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  if (m > 0) return `${m}m`
  return `${s}s`
}
function parseInput(v) {
  v = v.trim()
  if (/^\d+:\d+:\d+$/.test(v)) { const [h,m,s]=v.split(":").map(Number); return Math.min(h*3600+m*60+s,43200) }
  if (/^\d+:\d+$/.test(v))     { const [m,s]=v.split(":").map(Number); return Math.min(m*60+s,43200) }
  const hm = v.match(/^(\d+)h(\d+)m?$/); if (hm) return Math.min(+hm[1]*3600 + +hm[2]*60, 43200)
  const h  = v.match(/^(\d+)h$/);        if (h)  return Math.min(+h[1]*3600, 43200)
  const m  = v.match(/^(\d+)m$/);        if (m)  return Math.min(+m[1]*60, 43200)
  const n  = parseInt(v);                 if (!isNaN(n)) return Math.min(n*60, 43200)
  return null
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    [[523,0],[659,0.2],[784,0.4],[1047,0.6],[784,0.9]].forEach(([f,t]) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = f; o.type = "sine"
      g.gain.setValueAtTime(0, ctx.currentTime+t)
      g.gain.linearRampToValueAtTime(0.22, ctx.currentTime+t+0.05)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+t+0.5)
      o.start(ctx.currentTime+t); o.stop(ctx.currentTime+t+0.55)
    })
    setTimeout(() => ctx.close(), 4000)
  } catch(e) {}
}

// ─── Ring SVG ──────────────────────────────────────────
function Ring({ progress, color, size = 280, strokeWidth = 3 }) {
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)))
  return (
    <svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease" }} />
    </svg>
  )
}

// ─── Spin Field ────────────────────────────────────────
function SpinField({ val, onChange, max, fontSize = 68, color }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const inputRef = useRef(null)

  const commit = () => {
    const n = parseInt(draft)
    if (!isNaN(n)) onChange(Math.max(0, Math.min(max, n)))
    setEditing(false)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <button onClick={() => onChange(Math.min(max, val + 1))}
        style={{ width: 28, height: 22, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6, color: "rgba(255,255,255,0.35)", fontSize: 14, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
          lineHeight: 1, fontFamily: "inherit" }}
        onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}
        onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.05)"}>
        +
      </button>
      {editing ? (
        <input ref={inputRef} value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false) }}
          autoFocus
          style={{ width: fontSize < 50 ? 60 : 90, fontSize, fontFamily: "'DM Mono', monospace",
            fontWeight: 500, color, background: "transparent", border: "none",
            borderBottom: `1px solid ${color}`, textAlign: "center", outline: "none",
            letterSpacing: "-2px" }} />
      ) : (
        <div onClick={() => { setDraft(p2(val)); setEditing(true) }}
          style={{ fontSize, fontFamily: "'DM Mono', monospace", fontWeight: 500,
            color, letterSpacing: "-3px", lineHeight: 1, cursor: "text",
            minWidth: fontSize < 50 ? 60 : 90, textAlign: "center",
            transition: "color 0.3s" }}>
          {p2(val)}
        </div>
      )}
      <button onClick={() => onChange(Math.max(0, val - 1))}
        style={{ width: 28, height: 22, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 6, color: "rgba(255,255,255,0.35)", fontSize: 14, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
          lineHeight: 1, fontFamily: "inherit" }}
        onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}
        onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.05)"}>
        −
      </button>
    </div>
  )
}

// ─── Task Log Row ──────────────────────────────────────
function TaskRow({ name, secs, sessions, color, rank }) {
  const w = Math.min(100, Math.round((secs / Math.max(secs, 1)) * 100))
  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{sessions} session{sessions !== 1 ? "s" : ""}</span>
          <span style={{ fontSize: 13, color, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{fmtShort(secs)}</span>
        </div>
      </div>
      <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1 }}>
        <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 1,
          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)", opacity: 0.7 }} />
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────
export default function PremiumPomodoro() {
  const [mode, setMode]         = useState("focus")
  const [durations, setDur]     = useState({ ...DEFAULTS })
  const [secs, setSecs]         = useState(DEFAULTS.focus)
  const [running, setRunning]   = useState(false)
  const [sessions, setSessions] = useState(0)
  const [alert, setAlert]       = useState(null)

  // Task tracking
  const [task, setTask]         = useState("")
  const [taskInput, setTaskInput] = useState("")
  const [showTaskInput, setShowTaskInput] = useState(false)
  // log: { mode, secs, task, at }
  const [log, setLog]           = useState([])

  const timerRef = useRef(null)
  const cfg = MODES[mode]

  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const total = durations[mode]
  const progress = total > 0 ? secs / total : 0

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current); setRunning(false)
  }, [])

  const switchMode = (m) => {
    stopTimer(); setMode(m); setSecs(durations[m]); setAlert(null)
  }

  const reset = () => { stopTimer(); setSecs(durations[mode]); setAlert(null) }

  const setH = (v) => { const ns = v*3600+m*60+s; const nd={...durations,[mode]:Math.max(10,ns)}; setDur(nd); setSecs(nd[mode]) }
  const setM = (v) => { const ns = h*3600+Math.min(59,v)*60+s; const nd={...durations,[mode]:Math.max(10,ns)}; setDur(nd); setSecs(nd[mode]) }
  const setS = (v) => { const ns = h*3600+m*60+Math.min(59,v); const nd={...durations,[mode]:Math.max(10,ns)}; setDur(nd); setSecs(nd[mode]) }

  useEffect(() => {
    if (!running) return
    timerRef.current = setInterval(() => {
      setSecs(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current); setRunning(false)
          playChime()
          const entry = { mode, secs: durations[mode], task: task || "Untitled", at: Date.now() }
          setLog(l => [...l, entry])
          if (mode === "focus") setSessions(p => p + 1)
          setAlert(mode)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [running, mode, durations, task])

  // Derived analytics
  const today = new Date(); today.setHours(0,0,0,0)
  const todayLog = log.filter(l => l.at >= today.getTime())
  const focusSecs = todayLog.filter(l => l.mode === "focus").reduce((a, b) => a + b.secs, 0)
  const breakSecs = todayLog.filter(l => l.mode !== "focus").reduce((a, b) => a + b.secs, 0)
  const todaySessions = todayLog.filter(l => l.mode === "focus").length

  // Per-task totals (all time)
  const taskMap = {}
  log.filter(l => l.mode === "focus").forEach(l => {
    if (!taskMap[l.task]) taskMap[l.task] = { secs: 0, sessions: 0 }
    taskMap[l.task].secs += l.secs
    taskMap[l.task].sessions += 1
  })
  const taskList = Object.entries(taskMap).sort((a, b) => b[1].secs - a[1].secs)
  const maxTaskSecs = taskList.length > 0 ? taskList[0][1].secs : 1

  // Bar chart last 8 focus sessions
  const recentFocus = log.filter(l => l.mode === "focus").slice(-8)
  const maxBarSecs = Math.max(...recentFocus.map(l => l.secs), 1)

  const TASK_COLORS = ["#e8d5b0","#a8c4b8","#a8b8d4","#d4a8c4","#c4d4a8","#d4c4a8","#a8c4d4"]

  const isLastMin = secs <= 60 && secs > 10 && running
  const isLastTen = secs <= 10 && running

  const timeColor = isLastTen ? "#e88a8a" : isLastMin ? "#e8c878" : cfg.color

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0 }
        body { background: #0c0c10 }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.92) } to { opacity:1; transform:scale(1) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes shimmer { 0% { opacity:0.4 } 50% { opacity:1 } 100% { opacity:0.4 } }
        .pm-root { min-height:100vh; background:#0c0c10; color:rgba(255,255,255,0.85);
          font-family:'DM Sans',sans-serif; display:flex; flex-direction:column;
          align-items:center; padding:40px 16px 60px; gap:0 }
        .mode-pill { display:flex; gap:2px; background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.06); border-radius:100px; padding:3px }
        .mode-btn { padding:7px 18px; border-radius:100px; border:none; background:transparent;
          font-family:'DM Sans',sans-serif; font-size:12px; font-weight:400; cursor:pointer;
          transition:all 0.2s; letter-spacing:0.02em; white-space:nowrap }
        .mode-btn.active { background:rgba(255,255,255,0.09); color:rgba(255,255,255,0.9) }
        .mode-btn:not(.active) { color:rgba(255,255,255,0.3) }
        .glass-card { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06);
          border-radius:20px; backdrop-filter:blur(20px) }
        .stat-card { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);
          border-radius:14px; padding:16px; text-align:center; transition:border-color 0.2s }
        .stat-card:hover { border-color:rgba(255,255,255,0.1) }
        .divider { height:1px; background:rgba(255,255,255,0.05); margin:0 }
        .task-chip { padding:6px 14px; border-radius:100px; border:1px solid rgba(255,255,255,0.08);
          background:rgba(255,255,255,0.03); font-family:'DM Sans',sans-serif; font-size:11px;
          color:rgba(255,255,255,0.45); cursor:pointer; transition:all 0.15s; white-space:nowrap }
        .task-chip:hover { background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.7);
          border-color:rgba(255,255,255,0.15) }
        .task-chip.selected { color:rgba(255,255,255,0.9); border-color:rgba(255,255,255,0.2);
          background:rgba(255,255,255,0.06) }
        .ctrl-btn { display:flex; align-items:center; justify-content:center;
          border:1px solid rgba(255,255,255,0.08); border-radius:14px; cursor:pointer;
          transition:all 0.18s; font-family:'DM Sans',sans-serif }
        .ctrl-btn:hover { border-color:rgba(255,255,255,0.18); background:rgba(255,255,255,0.06) }
        .ctrl-btn:active { transform:scale(0.93) }
        .alert-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7);
          backdrop-filter:blur(24px); z-index:1000;
          display:flex; align-items:center; justify-content:center; padding:16px }
        .alert-card { background:#111116; border:1px solid rgba(255,255,255,0.08);
          border-radius:24px; padding:36px 32px 28px; text-align:center;
          max-width:360px; width:100%; animation:scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) }
        .al-btn { flex:1; padding:12px; border-radius:12px; border:none; cursor:pointer;
          font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; transition:all 0.15s }
        ::-webkit-scrollbar { width:4px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px }
      `}</style>

      <div className="pm-root">

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36, animation: "fadeIn 0.5s ease" }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, fontWeight: 300,
            letterSpacing: "0.35em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase",
            marginBottom: 4 }}>
            FOCUS STUDIO
          </h1>
        </div>

        {/* Mode pills */}
        <div className="mode-pill" style={{ marginBottom: 48, animation: "fadeIn 0.5s ease 0.05s both" }}>
          {Object.entries(MODES).map(([k, v]) => (
            <button key={k} className={`mode-btn${mode === k ? " active" : ""}`}
              onClick={() => switchMode(k)}
              style={{ color: mode === k ? v.color : undefined }}>
              {v.label}
            </button>
          ))}
        </div>

        {/* Timer Circle */}
        <div style={{ position: "relative", width: 280, height: 280, marginBottom: 12,
          animation: "fadeIn 0.5s ease 0.1s both" }}>
          <Ring progress={progress} color={cfg.accent} size={280} strokeWidth={2} />

          {/* Outer subtle ring */}
          <svg width={280} height={280} style={{ position: "absolute", inset: 0 }}>
            <circle cx={140} cy={140} r={136} fill="none"
              stroke="rgba(255,255,255,0.025)" strokeWidth={1} />
          </svg>

          {/* Center content */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 0 }}>

            {/* Time display with spinboxes */}
            <div style={{ display: "flex", alignItems: "center", gap: h > 0 ? 2 : 4 }}>
              {h > 0 && (
                <>
                  <SpinField val={h} onChange={setH} max={11} fontSize={52} color={timeColor} />
                  <span style={{ fontSize: 40, color: "rgba(255,255,255,0.15)", fontFamily: "'DM Mono'",
                    marginTop: -4, paddingBottom: 8 }}>:</span>
                </>
              )}
              <SpinField val={m} onChange={setM} max={59} fontSize={h > 0 ? 52 : 68} color={timeColor} />
              <span style={{ fontSize: h > 0 ? 40 : 52, color: "rgba(255,255,255,0.15)",
                fontFamily: "'DM Mono'", marginTop: -4, paddingBottom: 8 }}>:</span>
              <SpinField val={s} onChange={setS} max={59} fontSize={h > 0 ? 52 : 68} color={timeColor} />
            </div>

            {/* Mode label */}
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
              {running && (
                <div style={{ display: "flex", gap: 3 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: cfg.accent,
                      animation: `pulse 1.2s ease ${i * 0.3}s infinite` }} />
                  ))}
                </div>
              )}
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em",
                textTransform: "uppercase", fontWeight: 300 }}>
                {cfg.tip}
              </span>
            </div>

            {/* Countdown warning */}
            {isLastTen && (
              <div style={{ marginTop: 4, fontSize: 11, color: "#e88a8a",
                animation: "pulse 0.6s ease infinite" }}>
                {secs}s left
              </div>
            )}
          </div>
        </div>

        {/* Progress % */}
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", letterSpacing: "0.08em",
          marginBottom: 36, animation: "fadeIn 0.5s ease 0.15s both" }}>
          {Math.round(progress * 100)}% remaining
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40,
          animation: "fadeIn 0.5s ease 0.2s both" }}>
          <button className="ctrl-btn"
            onClick={reset}
            style={{ width: 48, height: 48, background: "rgba(255,255,255,0.02)",
              color: "rgba(255,255,255,0.3)", fontSize: 16 }}
            title="Reset">
            ↺
          </button>

          <button
            onClick={() => { setAlert(null); setRunning(r => !r) }}
            style={{
              width: 72, height: 72, borderRadius: 22,
              background: running
                ? "rgba(255,255,255,0.06)"
                : `rgba(${cfg.accent === "#c9a96e" ? "201,169,110" : cfg.accent === "#6ba898" ? "107,168,152" : "107,142,201"},0.15)`,
              border: `1px solid ${running ? "rgba(255,255,255,0.1)" : cfg.accent + "55"}`,
              color: running ? "rgba(255,255,255,0.6)" : cfg.color,
              fontSize: 26, cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", transition: "all 0.2s",
              boxShadow: running ? "none" : `0 0 32px ${cfg.glow}`,
              fontFamily: "inherit"
            }}
            onMouseEnter={e => !running && (e.currentTarget.style.boxShadow = `0 0 48px ${cfg.glow}`)}
            onMouseLeave={e => e.currentTarget.style.boxShadow = running ? "none" : `0 0 32px ${cfg.glow}`}>
            {running ? "⏸" : "▶"}
          </button>

          <button className="ctrl-btn"
            onClick={() => {
              const next = mode === "focus" ? (sessions > 0 && sessions % 4 === 3 ? "long" : "short") : "focus"
              switchMode(next)
            }}
            style={{ width: 48, height: 48, background: "rgba(255,255,255,0.02)",
              color: "rgba(255,255,255,0.3)", fontSize: 16 }}
            title="Skip">
            ⏭
          </button>
        </div>

        {/* Session dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40,
          animation: "fadeIn 0.5s ease 0.25s both" }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              height: 4, borderRadius: 2, transition: "all 0.4s",
              width: i < sessions % 4 ? 28 : i === sessions % 4 && running ? 28 : i === 3 ? 6 : 16,
              background: i < sessions % 4
                ? cfg.accent
                : i === sessions % 4 && running
                  ? `linear-gradient(90deg, ${cfg.accent} ${Math.round((1-progress)*100)}%, rgba(255,255,255,0.07) 0%)`
                  : "rgba(255,255,255,0.07)"
            }} />
          ))}
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginLeft: 4, letterSpacing: "0.05em" }}>
            {sessions} session{sessions !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Main content card */}
        <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 12,
          animation: "fadeIn 0.5s ease 0.3s both" }}>

          {/* Task selector */}
          <div className="glass-card" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em",
                textTransform: "uppercase" }}>
                Current Task
              </span>
              {task && (
                <button onClick={() => setTask("")}
                  style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", background: "none",
                    border: "none", cursor: "pointer", letterSpacing: "0.05em" }}>
                  clear
                </button>
              )}
            </div>

            {/* Selected task display */}
            {task ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.accent }} />
                <span style={{ fontSize: 14, color: cfg.color, fontWeight: 500 }}>{task}</span>
              </div>
            ) : (
              <div style={{ marginBottom: 12 }}>
                {showTaskInput ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      autoFocus
                      value={taskInput}
                      onChange={e => setTaskInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && taskInput.trim()) { setTask(taskInput.trim()); setTaskInput(""); setShowTaskInput(false) }
                        if (e.key === "Escape") setShowTaskInput(false)
                      }}
                      placeholder="What are you working on?"
                      style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10, padding: "8px 12px", color: "rgba(255,255,255,0.8)", fontSize: 13,
                        fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
                    <button onClick={() => { if (taskInput.trim()) { setTask(taskInput.trim()); setTaskInput(""); setShowTaskInput(false) } }}
                      style={{ padding: "8px 14px", background: cfg.dim, border: `1px solid ${cfg.accent}44`,
                        borderRadius: 10, color: cfg.color, fontSize: 12, cursor: "pointer",
                        fontFamily: "'DM Sans',sans-serif" }}>
                      Set
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowTaskInput(true)}
                    style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.03)",
                      border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px",
                      cursor: "pointer", fontFamily: "'DM Sans',sans-serif", width: "100%", textAlign: "left" }}>
                    + Add task name…
                  </button>
                )}
              </div>
            )}

            {/* Preset chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {PRESET_TASKS.map(t => (
                <button key={t} className={`task-chip${task === t ? " selected" : ""}`}
                  onClick={() => setTask(task === t ? "" : t)}
                  style={{ color: task === t ? cfg.color : undefined,
                    borderColor: task === t ? cfg.accent + "55" : undefined,
                    background: task === t ? cfg.dim : undefined }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Today's stats */}
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 20px 12px", fontSize: 10, color: "rgba(255,255,255,0.2)",
              letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Today
            </div>
            <div className="divider" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
              {[
                { label: "Focus", val: fmtShort(focusSecs) || "—", c: "#e8d5b0" },
                { label: "Break", val: fmtShort(breakSecs) || "—", c: "#a8c4b8" },
                { label: "Sessions", val: todaySessions || "—", c: "#a8b8d4" },
              ].map((s, i) => (
                <div key={s.label} style={{
                  padding: "16px 12px", textAlign: "center",
                  borderRight: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none"
                }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 500,
                    color: s.c, letterSpacing: "-0.5px", marginBottom: 4 }}>
                    {s.val}
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em",
                    textTransform: "uppercase" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Per-task totals */}
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 20px 12px", display: "flex", justifyContent: "space-between",
              alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em",
                textTransform: "uppercase" }}>
                Task Totals
              </span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: "0.05em" }}>
                All time
              </span>
            </div>
            <div className="divider" />
            <div style={{ padding: "4px 20px 16px" }}>
              {taskList.length === 0 ? (
                <div style={{ padding: "20px 0", fontSize: 12, color: "rgba(255,255,255,0.18)",
                  textAlign: "center", letterSpacing: "0.05em" }}>
                  Complete a session to see task totals
                </div>
              ) : (
                taskList.map(([name, data], i) => (
                  <TaskRow key={name} name={name} secs={data.secs} sessions={data.sessions}
                    color={TASK_COLORS[i % TASK_COLORS.length]} rank={i} />
                ))
              )}
              {/* Grand total */}
              {taskList.length > 0 && (
                <div style={{ paddingTop: 12, display: "flex", justifyContent: "space-between",
                  alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em",
                    textTransform: "uppercase" }}>
                    Total focused
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 500,
                    color: "rgba(255,255,255,0.7)" }}>
                    {fmtShort(log.filter(l => l.mode === "focus").reduce((a, b) => a + b.secs, 0))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Session bar chart */}
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 20px 12px", fontSize: 10, color: "rgba(255,255,255,0.2)",
              letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Session History
            </div>
            <div className="divider" />
            <div style={{ padding: "16px 20px 20px" }}>
              {recentFocus.length === 0 ? (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.18)", textAlign: "center",
                  padding: "16px 0", letterSpacing: "0.05em" }}>
                  No sessions yet
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 72 }}>
                  {recentFocus.map((l, i) => {
                    const pct = l.secs / maxBarSecs
                    const taskIdx = taskList.findIndex(([n]) => n === l.task)
                    const barColor = TASK_COLORS[taskIdx >= 0 ? taskIdx % TASK_COLORS.length : i % TASK_COLORS.length]
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column",
                        alignItems: "center", gap: 4, height: "100%" }}>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
                          {Math.round(l.secs / 60)}m
                        </span>
                        <div style={{
                          width: "100%", height: Math.max(pct * 52, 4),
                          borderRadius: "3px 3px 0 0", background: barColor,
                          opacity: 0.55 + 0.45 * pct,
                          transition: "height 0.5s cubic-bezier(0.4,0,0.2,1)",
                          marginTop: "auto"
                        }} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Clear data */}
          {log.length > 0 && (
            <button onClick={() => { setLog([]); setSessions(0) }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11,
                color: "rgba(255,255,255,0.15)", letterSpacing: "0.08em", padding: "4px 0",
                fontFamily: "'DM Sans',sans-serif", textAlign: "center",
                transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.15)"}>
              clear all data
            </button>
          )}
        </div>
      </div>

      {/* Alert overlay */}
      {alert && (
        <div className="alert-overlay" onClick={() => setAlert(null)}>
          <div className="alert-card" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>
              {alert === "focus" ? "✦" : "◈"}
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300,
              color: "rgba(255,255,255,0.85)", marginBottom: 6, letterSpacing: "0.02em" }}>
              {alert === "focus" ? "Session complete" : "Break over"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 6,
              lineHeight: 1.7 }}>
              {alert === "focus"
                ? `${Math.round(durations.focus / 60)} minutes of deep work${task ? ` on ${task}` : ""}. Session #${sessions}.`
                : "Time to return to focus."}
            </div>
            {alert === "focus" && task && (
              <div style={{ marginBottom: 16, padding: "8px 14px", background: "rgba(255,255,255,0.03)",
                borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em",
                  textTransform: "uppercase", display: "block", marginBottom: 4 }}>Total on "{task}"</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 18,
                  color: cfg.color, fontWeight: 500 }}>
                  {fmtShort(log.filter(l => l.mode === "focus" && l.task === task).reduce((a, b) => a + b.secs, 0) + durations.focus)}
                </span>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {alert === "focus" && (
                <button className="al-btn"
                  onClick={() => { setAlert(null); switchMode("short") }}
                  style={{ background: "rgba(168,196,184,0.1)", color: "#a8c4b8",
                    border: "1px solid rgba(168,196,184,0.2)" }}>
                  Short break
                </button>
              )}
              <button className="al-btn"
                onClick={() => { setAlert(null); switchMode("focus") }}
                style={{
                  background: alert === "focus" ? "rgba(255,255,255,0.04)" : "rgba(232,213,176,0.1)",
                  color: alert === "focus" ? "rgba(255,255,255,0.5)" : "#e8d5b0",
                  border: alert === "focus" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(232,213,176,0.2)"
                }}>
                {alert === "focus" ? "Skip break" : "Start focus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}