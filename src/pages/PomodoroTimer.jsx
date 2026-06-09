import React, { useState, useEffect, useRef, useCallback } from 'react'

const DEFAULT_MINS = { focus: 25, short: 5, long: 15 }
const STORAGE_KEY = 'pomo_v3'

const MODE_CFG = {
  focus: { label:'Focus',       color:'#a855f7', glow:'rgba(168,85,247,.4)', bg:'rgba(168,85,247,.08)', emoji:'🎯', tip:'Deep work time' },
  short: { label:'Short Break', color:'#6bcb77', glow:'rgba(107,203,119,.4)', bg:'rgba(107,203,119,.08)', emoji:'☕', tip:'Rest your eyes' },
  long:  { label:'Long Break',  color:'#60a5fa', glow:'rgba(96,165,250,.4)',  bg:'rgba(96,165,250,.08)',  emoji:'🌿', tip:'Great job! Recharge' },
}

const ALERT_SOUNDS = {
  bell: [880, 660, 880],
  chime: [523, 659, 784, 1047],
}

const SOUNDS = {
  none:   { label:'None',       emoji:'🔇' },
  rain:   { label:'Rain',       emoji:'🌧️' },
  cafe:   { label:'Café',       emoji:'☕' },
  nature: { label:'Forest',     emoji:'🌲' },
  white:  { label:'White Noise',emoji:'〰️' },
  waves:  { label:'Ocean',      emoji:'🌊' },
  fire:   { label:'Fireplace',  emoji:'🔥' },
}

// ── Persist helpers ───────────────────────────────────────
function loadStorage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function saveStorage(patch) {
  try {
    const prev = loadStorage()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...patch }))
  } catch {}
}

// ── Sound engine ──────────────────────────────────────────
class SoundEngine {
  constructor() { this.ctx = null; this.nodes = []; this.gain = null }

  start(type, volume = 0.5) {
    this.stop()
    if (type === 'none') return
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
      this.gain = this.ctx.createGain()
      this.gain.gain.value = volume
      this.gain.connect(this.ctx.destination)

      if (type === 'white') {
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
        const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true
        src.connect(this.gain); src.start(); this.nodes.push(src)
      } else if (type === 'rain') {
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate)
        const data = buf.getChannelData(0)
        let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0
        for (let i = 0; i < data.length; i++) {
          const white = Math.random() * 2 - 1
          b0=.99886*b0+white*.0555179; b1=.99332*b1+white*.0750759
          b2=.96900*b2+white*.1538520; b3=.86650*b3+white*.3104856
          b4=.55000*b4+white*.5329522; b5=-.7616*b5-white*.0168980
          data[i] = (b0+b1+b2+b3+b4+b5+white*.5362) * .11
        }
        const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true
        const lp = this.ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=600
        src.connect(lp); lp.connect(this.gain); src.start(); this.nodes.push(src)
      } else if (type === 'cafe') {
        const mkNoise = (freq, q, vol) => {
          const buf = this.ctx.createBuffer(1, this.ctx.sampleRate*2, this.ctx.sampleRate)
          const d = buf.getChannelData(0)
          for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1
          const src = this.ctx.createBufferSource(); src.buffer=buf; src.loop=true
          const f = this.ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq; f.Q.value=q
          const g = this.ctx.createGain(); g.gain.value=vol
          src.connect(f); f.connect(g); g.connect(this.gain); src.start(); this.nodes.push(src)
        }
        mkNoise(300, 0.5, 0.4); mkNoise(800, 0.3, 0.2)
      } else if (type === 'nature') {
        const chirp = () => {
          if (!this.ctx) return
          const o = this.ctx.createOscillator(); const g = this.ctx.createGain()
          o.connect(g); g.connect(this.gain)
          o.frequency.setValueAtTime(2000+Math.random()*800, this.ctx.currentTime)
          o.frequency.exponentialRampToValueAtTime(2500+Math.random()*500, this.ctx.currentTime+.15)
          g.gain.setValueAtTime(0.015, this.ctx.currentTime)
          g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime+.2)
          o.start(this.ctx.currentTime); o.stop(this.ctx.currentTime+.2)
          this.nodes.push(o)
          setTimeout(chirp, 800+Math.random()*2000)
        }
        chirp()
        const buf = this.ctx.createBuffer(1,this.ctx.sampleRate*2,this.ctx.sampleRate)
        const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1
        const src = this.ctx.createBufferSource(); src.buffer=buf; src.loop=true
        const lp = this.ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=200
        const wg = this.ctx.createGain(); wg.gain.value=0.1
        src.connect(lp); lp.connect(wg); wg.connect(this.gain); src.start(); this.nodes.push(src)
      } else if (type === 'waves') {
        const buf = this.ctx.createBuffer(1,this.ctx.sampleRate*4,this.ctx.sampleRate)
        const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1
        const src = this.ctx.createBufferSource(); src.buffer=buf; src.loop=true
        const lp = this.ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=500
        const lfo = this.ctx.createOscillator(); const lfog = this.ctx.createGain()
        lfo.frequency.value=0.12; lfog.gain.value=0.3
        lfo.connect(lfog); lfog.connect(lp.frequency)
        lfo.start(); src.connect(lp); lp.connect(this.gain); src.start(); this.nodes.push(src,lfo)
      } else if (type === 'fire') {
        const buf = this.ctx.createBuffer(1,this.ctx.sampleRate*2,this.ctx.sampleRate)
        const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1
        const src = this.ctx.createBufferSource(); src.buffer=buf; src.loop=true
        const lp = this.ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=400
        src.connect(lp); lp.connect(this.gain); src.start(); this.nodes.push(src)
      }
    } catch(e) { console.warn('Audio not supported',e) }
  }

  setVolume(v) { if (this.gain) this.gain.gain.value = v }

  stop() {
    this.nodes.forEach(n => { try { n.stop?.(); n.disconnect?.() } catch(e){} })
    this.nodes = []
    if (this.ctx) { this.ctx.close().catch(()=>{}); this.ctx = null }
  }
}
const soundEngine = new SoundEngine()

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
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function formatLifetime(secs) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h >= 1000) return `${h.toLocaleString()}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
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

export default function PomodoroTimer({ tasks = [], running: extRunning, setRunning: extSetRunning, secs: extSecs, setSecs: extSetSecs, mode: extMode, setMode: extSetMode, sessions: extSessions, setSessions: extSetSessions }) {
  // ── Restore persisted state ──────────────────────────────
  const stored = loadStorage()

  const [modeLocal, setModeLocal]         = useState(stored.mode || 'focus')
  const [customMins, setCustom]           = useState(stored.customMins || {...DEFAULT_MINS})
  const [secsLocal, setSecsLocal]         = useState(stored.secs ?? (stored.customMins?.[stored.mode||'focus'] ?? DEFAULT_MINS[stored.mode||'focus']) * 60)
  const [runningLocal, setRunningLocal]   = useState(false) // never auto-resume on mount
  const [sessionsLocal, setSessionsLocal] = useState(stored.sessions || 0)

  // Lifted state passthrough
  const mode       = extMode       ?? modeLocal
  const setMode    = extSetMode    ?? setModeLocal
  const secs       = extSecs       ?? secsLocal
  const setSecs    = extSetSecs    ?? setSecsLocal
  const running    = extRunning    ?? runningLocal
  const setRunning = extSetRunning ?? setRunningLocal
  const sessions   = extSessions   ?? sessionsLocal
  const setSessions= extSetSessions?? setSessionsLocal

  // Lifetime focus seconds
  const [lifetimeSecs, setLifetime] = useState(stored.lifetimeSecs || 0)

  const [selectedTask, setSel]     = useState(null)
  const [showTasks, setShowTasks]  = useState(false)
  const [sound, setSound]          = useState('none')
  const [volume, setVolume]        = useState(0.4)
  const [showSounds, setShowSnd]   = useState(false)
  const [alert, setAlert]          = useState(null)
  const [showConf, setShowConf]    = useState(false)

  const intervalRef   = useRef(null)
  // For tab-hidden drift correction
  const startedAtRef  = useRef(null) // wall-clock ms when timer last started / resumed
  const secsAtStartRef= useRef(null) // secs value when timer last started / resumed

  const cfg      = MODE_CFG[mode]
  const totalSecs= customMins[mode] * 60
  const progress = totalSecs > 0 ? secs / totalSecs : 0
  const SIZE     = 260
  const R        = (SIZE - 20) / 2
  const CIRC     = 2 * Math.PI * R
  const offset   = CIRC * (1 - progress)

  // ── Persist on key state changes ────────────────────────
  useEffect(() => {
    saveStorage({ mode, secs, sessions, customMins, lifetimeSecs })
  }, [mode, secs, sessions, customMins, lifetimeSecs])

  // ── Core timer logic ─────────────────────────────────────
  function handleExpiry() {
    clearInterval(intervalRef.current)
    setRunning(false)
    startedAtRef.current = null
    playBeep(ALERT_SOUNDS.chime)
    if (mode === 'focus') {
      const newSessions = sessions + 1
      setSessions(newSessions)
      // Accumulate lifetime
      setLifetime(lt => {
        const updated = lt + customMins.focus * 60
        saveStorage({ lifetimeSecs: updated })
        return updated
      })
      setAlert('focus')
      setShowConf(true)
      setTimeout(() => setShowConf(false), 2500)
    } else {
      setAlert('break')
    }
    if (Notification.permission === 'granted') {
      new Notification(mode === 'focus' ? '🎯 Focus session complete!' : '⏰ Break time over!', {
        body: mode === 'focus' ? 'Amazing work! Time for a break 🎉' : 'Back to focus mode! You got this 💪',
      })
    }
  }

  const startInterval = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) { handleExpiry(); return 0 }
        return s - 1
      })
    }, 1000)
  }, [mode, sessions, customMins])

  useEffect(() => {
    if (running) {
      startedAtRef.current   = Date.now()
      secsAtStartRef.current = secs
      startInterval()
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  // ── Tab visibility drift correction ──────────────────────
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === 'visible' && running && startedAtRef.current !== null) {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000)
        const corrected = Math.max(0, secsAtStartRef.current - elapsed)
        clearInterval(intervalRef.current)
        if (corrected <= 0) {
          setSecs(0)
          handleExpiry()
        } else {
          setSecs(corrected)
          // Restart interval from corrected position
          startedAtRef.current   = Date.now()
          secsAtStartRef.current = corrected
          intervalRef.current = setInterval(() => {
            setSecs(s => {
              if (s <= 1) { handleExpiry(); return 0 }
              return s - 1
            })
          }, 1000)
        }
      }
      // When hidden, snapshot wall clock so we can correct on return
      if (document.visibilityState === 'hidden' && running) {
        startedAtRef.current   = Date.now()
        secsAtStartRef.current = secs
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [running, secs, mode, sessions, customMins])

  // ── Notification permission ───────────────────────────────
  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission()
  }, [])

  // ── Sound control ─────────────────────────────────────────
  useEffect(() => {
    if (running && sound !== 'none') soundEngine.start(sound, volume)
    else soundEngine.stop()
    return () => soundEngine.stop()
  }, [running, sound])

  useEffect(() => { soundEngine.setVolume(volume) }, [volume])

  // ── Document title ────────────────────────────────────────
  useEffect(() => {
    document.title = running ? `${formatTime(secs)} ${cfg.emoji} ${cfg.label} | TaskFlow` : 'TaskFlow'
    return () => { document.title = 'TaskFlow' }
  }, [running, secs, cfg])

  // ── Timer controls ────────────────────────────────────────
  const stopTimer = useCallback(() => {
    clearInterval(intervalRef.current)
    setRunning(false)
    startedAtRef.current = null
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

  function adjustTime(delta) {
    // Max 360 mins (6 hours), min 1 min
    const newMins = Math.max(1, Math.min(360, customMins[mode] + delta))
    const newCustom = { ...customMins, [mode]: newMins }
    setCustom(newCustom)
    setSecs(newMins * 60)
  }

  function adjustTimeBy(delta) {
    // Large jumps: ±5 min for quick navigation on long timers
    const step = customMins[mode] >= 60 ? 5 : 1
    const newMins = Math.max(1, Math.min(360, customMins[mode] + delta * step))
    const newCustom = { ...customMins, [mode]: newMins }
    setCustom(newCustom)
    setSecs(newMins * 60)
  }

  const pendingTasks = tasks.filter(t => t.status !== 'DONE')
  const isLastMin  = secs <= 60  && running
  const isLastTen  = secs <= 10  && running
  const hasHours   = secs >= 3600

  // Lifetime display
  const lifetimeHours = (lifetimeSecs / 3600).toFixed(1)

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:520,margin:'0 auto',animation:'fadeUp .4s ease',fontFamily:'DM Sans,sans-serif'}}>

        {/* Lifetime stats bar */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
          marginBottom:16,padding:'10px 16px',
          background:'#0d0d14',border:'1px solid rgba(255,255,255,.06)',borderRadius:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:16}}>⏳</span>
            <div>
              <p style={{fontSize:10,color:'#6b6b8a',margin:0,fontWeight:600,letterSpacing:'1px'}}>LIFETIME FOCUS</p>
              <p style={{fontSize:15,fontWeight:800,color:'#a855f7',fontFamily:'Syne,sans-serif',margin:0}}>
                {formatLifetime(lifetimeSecs)}
              </p>
            </div>
          </div>
          <div style={{display:'flex',gap:20}}>
            <div style={{textAlign:'center'}}>
              <p style={{fontSize:10,color:'#6b6b8a',margin:0,fontWeight:600,letterSpacing:'1px'}}>SESSIONS</p>
              <p style={{fontSize:15,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:0}}>{sessions}</p>
            </div>
            <div style={{textAlign:'center'}}>
              <p style={{fontSize:10,color:'#6b6b8a',margin:0,fontWeight:600,letterSpacing:'1px'}}>TODAY</p>
              <p style={{fontSize:15,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:0}}>
                {formatLifetime(sessions * customMins.focus * 60)}
              </p>
            </div>
          </div>
        </div>

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
          {showConf && (
            <div style={{position:'absolute',width:SIZE,height:SIZE,pointerEvents:'none',zIndex:10}}>
              <Confetti color={cfg.color}/>
            </div>
          )}

          <div style={{position:'relative',width:SIZE,height:SIZE}}>
            <svg width={SIZE} height={SIZE} style={{transform:'rotate(-90deg)',position:'absolute',inset:0}}>
              <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={10}/>
              <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke={cfg.color} strokeWidth={10} opacity={.15}
                strokeDasharray={CIRC} strokeDashoffset={0}/>
              <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke={cfg.color} strokeWidth={10}
                strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset}
                style={{transition:'stroke-dashoffset .8s ease, stroke .3s ease',
                  filter:`drop-shadow(0 0 8px ${cfg.glow})`}}/>
            </svg>

            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',gap:4}}>

              {/* Time adjust — show when not running */}
              {!running && !alert && (
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  {/* −5 / −1 */}
                  {customMins[mode] >= 60 && (
                    <button className="adj-btn" onClick={() => adjustTimeBy(-1)}
                      style={{width:28,height:22,borderRadius:6,background:'rgba(255,255,255,.04)',
                        border:'1px solid rgba(255,255,255,.08)',color:'#6b6b8a',fontSize:9,
                        display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .15s',fontWeight:700}}>
                      −5
                    </button>
                  )}
                  <button className="adj-btn" onClick={() => adjustTime(-1)}
                    style={{width:28,height:28,borderRadius:8,background:'rgba(255,255,255,.06)',
                      border:'1px solid rgba(255,255,255,.1)',color:'#6b6b8a',fontSize:16,
                      display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .15s'}}>
                    −
                  </button>
                  <div style={{textAlign:'center',minWidth:60}}>
                    <p style={{fontSize:10,color:'#6b6b8a',margin:0,fontWeight:600,letterSpacing:'1px',lineHeight:1}}>
                      {customMins[mode] >= 60
                        ? `${Math.floor(customMins[mode]/60)}h ${customMins[mode]%60 > 0 ? customMins[mode]%60+'m' : ''}`
                        : `${customMins[mode]} MIN`}
                    </p>
                    {customMins[mode] >= 60 && (
                      <p style={{fontSize:9,color:'#6b6b8a40',margin:0}}>{customMins[mode]}m total</p>
                    )}
                  </div>
                  <button className="adj-btn" onClick={() => adjustTime(1)}
                    style={{width:28,height:28,borderRadius:8,background:'rgba(255,255,255,.06)',
                      border:'1px solid rgba(255,255,255,.1)',color:'#6b6b8a',fontSize:16,
                      display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .15s'}}>
                    +
                  </button>
                  {customMins[mode] >= 55 && (
                    <button className="adj-btn" onClick={() => adjustTimeBy(1)}
                      style={{width:28,height:22,borderRadius:6,background:'rgba(255,255,255,.04)',
                        border:'1px solid rgba(255,255,255,.08)',color:'#6b6b8a',fontSize:9,
                        display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .15s',fontWeight:700}}>
                      +5
                    </button>
                  )}
                </div>
              )}

              {/* Time display */}
              <p style={{
                fontSize: hasHours ? 44 : secs >= 600 ? 58 : 64,
                fontWeight:800,fontFamily:'Syne,sans-serif',margin:0,
                letterSpacing: hasHours ? '-2px' : '-3px',lineHeight:1,
                color: isLastTen ? '#ff6b6b' : isLastMin ? '#ffd93d' : cfg.color,
                animation: isLastTen ? 'tickBig .5s ease infinite' : 'none',
                transition:'color .3s',
                textShadow: running ? `0 0 20px ${isLastTen?'rgba(255,107,107,.5)':cfg.glow}` : 'none',
              }}>
                {formatTime(secs)}
              </p>

              <p style={{fontSize:12,color:'#6b6b8a',margin:'4px 0 0',fontWeight:600,letterSpacing:'1px'}}>
                {cfg.emoji} {running ? cfg.tip : cfg.label}
              </p>

              {running && (
                <div style={{display:'flex',gap:3,marginTop:4}}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{width:4,height:4,borderRadius:'50%',background:cfg.color,
                      animation:`pulse .9s ease ${i*.2}s infinite`}}/>
                  ))}
                </div>
              )}

              {/* Tab-switch notice while running */}
              {running && (
                <p style={{fontSize:9,color:'#6b6b8a40',margin:'6px 0 0',textAlign:'center',lineHeight:1.4,maxWidth:120}}>
                  tab-safe ✓
                </p>
              )}
            </div>
          </div>

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
          <button className="ctrl-btn" onClick={() => resetTimer()} title="Reset"
            style={{width:50,height:50,borderRadius:15,background:'#1a1a24',
              border:'1px solid rgba(255,255,255,.09)',color:'#6b6b8a',fontSize:20,
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s'}}>
            ↺
          </button>

          <button className="ctrl-btn" onClick={() => { setAlert(null); setRunning(r => !r) }}
            style={{width:80,height:80,borderRadius:25,
              background:`linear-gradient(135deg,${cfg.color},${cfg.color}99)`,
              border:'none',color:'#fff',fontSize:32,
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
              boxShadow:`0 10px 32px ${cfg.glow}`,transition:'all .2s'}}>
            {running ? '⏸' : '▶'}
          </button>

          <button className="ctrl-btn" onClick={() => {
            const next = mode==='focus' ? (sessions>0&&(sessions+1)%4===0?'long':'short') : 'focus'
            switchMode(next)
          }} title="Skip"
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

        {/* Focus Sounds */}
        <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:16,
          overflow:'hidden',marginBottom:12}}>
          <button onClick={() => setShowSnd(s=>!s)}
            style={{width:'100%',padding:'13px 18px',background:'none',border:'none',
              display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:32,height:32,borderRadius:9,
                background:sound!=='none'?'rgba(96,165,250,.15)':'rgba(255,255,255,.04)',
                border:`1px solid ${sound!=='none'?'rgba(96,165,250,.3)':'rgba(255,255,255,.08)'}`,
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>
                {SOUNDS[sound]?.emoji||'🔇'}
              </div>
              <div style={{textAlign:'left'}}>
                <p style={{fontSize:13,fontWeight:600,color:'#f0f0f8',margin:0}}>
                  {sound==='none'?'Focus Sounds (off)':SOUNDS[sound]?.label+' playing…'}
                </p>
                {sound!=='none'&&running&&<p style={{fontSize:10,color:'#60a5fa',margin:0,animation:'pulse 2s ease infinite'}}>🎵 Playing</p>}
              </div>
            </div>
            <span style={{color:'#6b6b8a',fontSize:11,transform:showSounds?'rotate(180deg)':'none',transition:'transform .2s'}}>▼</span>
          </button>
          {showSounds && (
            <div style={{borderTop:'1px solid rgba(255,255,255,.06)',padding:'12px 14px'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:12}}>
                {Object.entries(SOUNDS).map(([key,s]) => (
                  <button key={key} onClick={() => { setSound(key); if(running&&key!=='none') soundEngine.start(key,volume); else if(key==='none') soundEngine.stop() }}
                    style={{padding:'8px 4px',borderRadius:10,border:'none',cursor:'pointer',
                      textAlign:'center',transition:'all .15s',
                      background:sound===key?'rgba(96,165,250,.15)':'rgba(255,255,255,.04)',
                      outline:sound===key?'1.5px solid rgba(96,165,250,.5)':'none'}}>
                    <p style={{fontSize:18,margin:'0 0 2px'}}>{s.emoji}</p>
                    <p style={{fontSize:9,color:sound===key?'#60a5fa':'#6b6b8a',margin:0,fontWeight:600}}>{s.label}</p>
                  </button>
                ))}
              </div>
              {sound !== 'none' && (
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:11,color:'#6b6b8a',flexShrink:0}}>🔉</span>
                  <input type="range" min={0} max={1} step={.05} value={volume}
                    onChange={e => setVolume(parseFloat(e.target.value))}
                    style={{flex:1,accentColor:'#60a5fa'}}/>
                  <span style={{fontSize:11,color:'#6b6b8a',flexShrink:0}}>🔊</span>
                </div>
              )}
            </div>
          )}
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
            Use <strong style={{color:'#f0f0f8'}}>+ / −</strong> to adjust up to <strong style={{color:'#f0f0f8'}}>6 hours</strong>. Timer stays accurate across tab switches!
          </p>
        </div>
      </div>

      {/* ── Alert overlay ── */}
      {alert && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',backdropFilter:'blur(16px)',
          zIndex:500,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{position:'absolute',top:'50%',left:'50%',
            transform:'translate(-50%,-50%)',
            background:'#111118',border:`1px solid ${alert==='focus'?'rgba(107,203,119,.3)':'rgba(96,165,250,.3)'}`,
            borderRadius:28,padding:'44px 52px',textAlign:'center',maxWidth:420,width:'90%',
            boxShadow:`0 32px 80px rgba(0,0,0,.8), 0 0 80px ${alert==='focus'?'rgba(107,203,119,.15)':'rgba(96,165,250,.15)'}`,
            animation:'alertPop .5s cubic-bezier(.34,1.56,.64,1) both'}}>

            <div style={{fontSize:64,marginBottom:12,animation:'ringPop .8s ease'}}>
              {alert==='focus' ? '🎉' : '💪'}
            </div>

            <h2 style={{fontSize:26,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',
              margin:'0 0 10px',lineHeight:1.2}}>
              {alert==='focus' ? 'Session Complete!' : 'Break Time Over!'}
            </h2>

            <p style={{fontSize:14,color:'#9ca3af',margin:'0 0 8px',lineHeight:1.7}}>
              {alert==='focus'
                ? <>You completed session <strong style={{color:'#6bcb77'}}>#{sessions}</strong> today! 🔥<br/>Time to take a well-earned break.</>
                : <>Time to get back in the zone.<br/>You've got this — stay consistent! ⚡</>}
            </p>

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
                    <p style={{fontSize:20,fontWeight:800,color:'#a855f7',fontFamily:'Syne,sans-serif',margin:'0 0 2px'}}>{formatLifetime(lifetimeSecs)}</p>
                    <p style={{fontSize:10,color:'#6b6b8a',margin:0}}>Lifetime focus</p>
                  </div>
                </>
              )}
            </div>

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