import React, { useState, useEffect, useRef } from 'react'
import api from '../services/api'

const css = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes countUp { from{opacity:0;transform:scale(.8)} to{opacity:1;transform:scale(1)} }
  @keyframes barGrow { from{height:0} to{height:var(--h)} }
  @keyframes drawLine { from{stroke-dashoffset:1000} to{stroke-dashoffset:0} }
  .range-btn:hover { background: var(--surface3) !important; }
  .chart-bar:hover { filter: brightness(1.3); }
`

function StatBox({ label, value, sub, color, emoji, delay=0 }) {
  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'18px 20px',position:'relative',overflow:'hidden',animation:`fadeUp .4s ease both`,animationDelay:`${delay}ms`}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${color},transparent)`}}/>
      <div style={{fontSize:24,marginBottom:8}}>{emoji}</div>
      <p style={{fontSize:28,fontWeight:800,color,fontFamily:'Syne,sans-serif',margin:'0 0 4px'}}>{value}</p>
      <p style={{fontSize:12,fontWeight:600,color:'var(--text)',margin:'0 0 2px'}}>{label}</p>
      <p style={{fontSize:11,color:'var(--muted)',margin:0}}>{sub}</p>
    </div>
  )
}

// Line Chart
function LineChart({ data, color, label }) {
  if (!data?.length) return <EmptyChart/>
  const max = Math.max(...data.map(d => d.value), 1)
  const W = 500, H = 140, pad = 30
  const pts = data.map((d,i) => ({
    x: pad + (i / (data.length-1||1)) * (W - pad*2),
    y: H - pad - (d.value / max) * (H - pad*2),
    ...d
  }))
  const pathD = pts.map((p,i) => `${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${H-pad} L ${pts[0].x} ${H-pad} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'100%',overflow:'visible'}}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0,0.25,0.5,0.75,1].map((t,i) => (
        <line key={i} x1={pad} y1={pad+(1-t)*(H-pad*2)} x2={W-pad} y2={pad+(1-t)*(H-pad*2)}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
      ))}
      {/* Area fill */}
      <path d={areaD} fill="url(#lineGrad)"/>
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{strokeDasharray:1000,animation:'drawLine 1.2s ease forwards'}}/>
      {/* Dots */}
      {pts.map((p,i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={color} stroke="var(--surface)" strokeWidth="2"/>
          <title>{p.label}: {p.value}</title>
        </g>
      ))}
      {/* X labels - show every nth */}
      {pts.filter((_,i)=>i%(Math.ceil(pts.length/7))===0||i===pts.length-1).map((p,i)=>(
        <text key={i} x={p.x} y={H-6} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)">{p.label}</text>
      ))}
    </svg>
  )
}

// Bar Chart
function BarChart({ data, color }) {
  if (!data?.length) return <EmptyChart/>
  const max = Math.max(...data.map(d=>d.value),1)
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:6,height:'100%',padding:'0 4px'}}>
      {data.map((d,i)=>{
        const pct = (d.value/max)*100
        const barColor = d.value === Math.max(...data.map(x=>x.value)) ? color : `${color}88`
        return (
          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,height:'100%',justifyContent:'flex-end'}}>
            <span style={{fontSize:9,color:'var(--muted)',fontWeight:600}}>{d.value>0?d.value:''}</span>
            <div className="chart-bar" title={`${d.label}: ${d.value} tasks`}
              style={{width:'100%',borderRadius:'4px 4px 0 0',background:`linear-gradient(180deg,${barColor},${barColor}bb)`,height:`${Math.max(pct,d.value>0?4:0)}%`,transition:'height .6s ease',animationDelay:`${i*40}ms`,boxShadow:d.value>0?`0 -2px 8px ${color}40`:'none'}}/>
            <span style={{fontSize:9,color:'var(--muted)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%',textAlign:'center'}}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// Donut / Pie Chart
function DonutChart({ data }) {
  if (!data?.length) return <EmptyChart/>
  const total = data.reduce((s,d)=>s+d.value,0)||1
  let cumAngle = -90
  const cx=80, cy=80, r=60, inner=38
  const slices = data.map(d=>{
    const angle = (d.value/total)*360
    const start = cumAngle
    cumAngle += angle
    return {...d, startAngle:start, endAngle:cumAngle, angle}
  })

  function polarToXY(angle, radius) {
    const rad = (angle * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  function slicePath(s) {
    const s1 = polarToXY(s.startAngle, r)
    const e1 = polarToXY(s.endAngle, r)
    const s2 = polarToXY(s.endAngle, inner)
    const e2 = polarToXY(s.startAngle, inner)
    const large = s.angle > 180 ? 1 : 0
    return `M ${s1.x} ${s1.y} A ${r} ${r} 0 ${large} 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${inner} ${inner} 0 ${large} 0 ${e2.x} ${e2.y} Z`
  }

  return (
    <div style={{display:'flex',alignItems:'center',gap:20,height:'100%'}}>
      <svg viewBox="0 0 160 160" style={{width:140,height:140,flexShrink:0}}>
        {slices.map((s,i)=>(
          <path key={i} d={slicePath(s)} fill={s.color} opacity={0.9} style={{transition:'opacity .2s'}}><title>{s.label}: {s.value} ({Math.round(s.value/total*100)}%)</title></path>
        ))}
        <text x={cx} y={cy-8} textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--text)">{total}</text>
        <text x={cx} y={cy+10} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)">TOTAL</text>
      </svg>
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
        {slices.map((s,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:10,height:10,borderRadius:3,background:s.color,flexShrink:0}}/>
            <span style={{fontSize:12,color:'var(--muted)',flex:1}}>{s.label}</span>
            <span style={{fontSize:13,fontWeight:700,color:'var(--text)'}}>{s.value}</span>
            <span style={{fontSize:10,color:'var(--muted)'}}>{Math.round(s.value/total*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// GitHub Heatmap
function Heatmap({ data }) {
  if (!data?.length) return <EmptyChart/>
  const max = Math.max(...data.map(d=>d.count),1)
  const weeks = []
  for (let i=0;i<data.length;i+=7) weeks.push(data.slice(i,i+7))
  const days = ['S','M','T','W','T','F','S']

  function intensity(count) {
    if (!count) return 'rgba(255,255,255,0.04)'
    const t = count/max
    if (t < 0.25) return 'rgba(124,58,237,0.25)'
    if (t < 0.5)  return 'rgba(124,58,237,0.5)'
    if (t < 0.75) return 'rgba(168,85,247,0.75)'
    return '#a855f7'
  }

  return (
    <div style={{overflowX:'auto'}}>
      <div style={{display:'flex',gap:3,minWidth:'fit-content'}}>
        <div style={{display:'flex',flexDirection:'column',gap:3,marginRight:4}}>
          {days.map((d,i)=><div key={i} style={{height:12,width:12,fontSize:8,color:'var(--muted)',display:'flex',alignItems:'center',justifyContent:'center'}}>{d}</div>)}
        </div>
        {weeks.map((week,wi)=>(
          <div key={wi} style={{display:'flex',flexDirection:'column',gap:3}}>
            {week.map((day,di)=>(
              <div key={di} title={`${day.date}: ${day.count} tasks`}
                style={{width:12,height:12,borderRadius:2,background:intensity(day.count),cursor:'default',transition:'background .2s'}}/>
            ))}
          </div>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:6,marginTop:10,justifyContent:'flex-end'}}>
        <span style={{fontSize:10,color:'var(--muted)'}}>Less</span>
        {[0,0.25,0.5,0.75,1].map((t,i)=>(
          <div key={i} style={{width:10,height:10,borderRadius:2,background:t===0?'rgba(255,255,255,0.04)':`rgba(168,85,247,${t})`}}/>
        ))}
        <span style={{fontSize:10,color:'var(--muted)'}}>More</span>
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:8,opacity:.5}}>
      <span style={{fontSize:28}}>📭</span>
      <p style={{fontSize:12,color:'var(--muted)'}}>No data yet — complete some tasks!</p>
    </div>
  )
}

function ChartCard({ title, emoji, children, height=180, delay=0 }) {
  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:20,animation:`fadeUp .4s ease both`,animationDelay:`${delay}ms`}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
        <span style={{fontSize:18}}>{emoji}</span>
        <h3 style={{fontSize:14,fontWeight:700,color:'var(--text)',fontFamily:'Syne,sans-serif',margin:0}}>{title}</h3>
      </div>
      <div style={{height}}>{children}</div>
    </div>
  )
}

function RangeBtn({ label, active, onClick }) {
  return (
    <button className="range-btn" onClick={onClick}
      style={{padding:'6px 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',background:active?'var(--accent)':'var(--surface2)',color:active?'#fff':'var(--muted)',border:active?'none':'1px solid var(--border)',transition:'all .15s'}}>
      {label}
    </button>
  )
}

export default function AnalyticsPanel() {
  const [tasks, setTasks] = useState([])
  const [range, setRange] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/tasks')
        const data = Array.isArray(res.data?.content) ? res.data.content : Array.isArray(res.data) ? res.data : []
        setTasks(data)
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  // ── Compute analytics from tasks ────────────────────────────────────────────
  const now = new Date()
  const cutoff = new Date(now - range * 86400000)

  const inRange = tasks.filter(t => {
    const d = new Date(t.createdAt || t.dueDate || now)
    return d >= cutoff
  })

  const done = tasks.filter(t => t.status === 'DONE')
  const doneInRange = done.filter(t => {
    const d = new Date(t.updatedAt || t.createdAt || now)
    return d >= cutoff
  })

  // Tasks completed per day (line chart)
  const completionByDay = (() => {
    const map = {}
    for (let i = range-1; i >= 0; i--) {
      const d = new Date(now - i*86400000)
      const key = d.toLocaleDateString('en-IN',{month:'short',day:'numeric'})
      map[key] = 0
    }
    doneInRange.forEach(t => {
      const d = new Date(t.updatedAt || t.createdAt || now)
      const key = d.toLocaleDateString('en-IN',{month:'short',day:'numeric'})
      if (key in map) map[key]++
    })
    return Object.entries(map).map(([label,value])=>({label,value}))
  })()

  // Priority breakdown (donut)
  const priorityData = [
    { label:'High',   value: tasks.filter(t=>t.priority==='HIGH').length,   color:'#ff6b6b' },
    { label:'Medium', value: tasks.filter(t=>t.priority==='MEDIUM').length, color:'#ffd93d' },
    { label:'Low',    value: tasks.filter(t=>t.priority==='LOW').length,    color:'#6bcb77' },
  ].filter(d=>d.value>0)

  // Weekly comparison (bar chart)
  const weeklyData = (() => {
    const weeks = []
    for (let w = 3; w >= 0; w--) {
      const start = new Date(now - (w+1)*7*86400000)
      const end   = new Date(now - w*7*86400000)
      const count = done.filter(t => {
        const d = new Date(t.updatedAt || t.createdAt || now)
        return d >= start && d < end
      }).length
      const label = w===0 ? 'This wk' : w===1 ? 'Last wk' : `${w+1}w ago`
      weeks.push({ label, value: count })
    }
    return weeks
  })()

  // Productivity score over time (line chart)
  const scoreByDay = (() => {
    const PTS = { HIGH:30, MEDIUM:15, LOW:5 }
    const map = {}
    for (let i = range-1; i >= 0; i--) {
      const d = new Date(now - i*86400000)
      const key = d.toLocaleDateString('en-IN',{month:'short',day:'numeric'})
      map[key] = 0
    }
    doneInRange.forEach(t => {
      const d = new Date(t.updatedAt || t.createdAt || now)
      const key = d.toLocaleDateString('en-IN',{month:'short',day:'numeric'})
      if (key in map) map[key] += PTS[t.priority] || 5
    })
    // Cumulative
    let cum = 0
    return Object.entries(map).map(([label,value])=>{ cum+=value; return {label,value:cum} })
  })()

  // Heatmap (last 84 days = 12 weeks)
  const heatmapData = (() => {
    const days = []
    for (let i = 83; i >= 0; i--) {
      const d = new Date(now - i*86400000)
      const dateStr = d.toLocaleDateString('en-IN',{month:'short',day:'numeric'})
      const count = done.filter(t => {
        const td = new Date(t.updatedAt || t.createdAt || now)
        return td.toLocaleDateString('en-IN',{month:'short',day:'numeric'}) === dateStr
      }).length
      days.push({ date: dateStr, count })
    }
    return days
  })()

  // Summary stats
  const totalPts = done.reduce((s,t)=>s+({HIGH:30,MEDIUM:15,LOW:5}[t.priority]||5),0)
  const avgPerDay = range > 0 ? (doneInRange.length/range).toFixed(1) : 0
  const streak = (() => {
    let s=0
    for (let i=0;i<30;i++) {
      const d=new Date(now-i*86400000)
      const key=d.toLocaleDateString('en-IN',{month:'short',day:'numeric'})
      const had=done.some(t=>{const td=new Date(t.updatedAt||t.createdAt||now);return td.toLocaleDateString('en-IN',{month:'short',day:'numeric'})===key})
      if(had)s++; else break
    }
    return s
  })()
  const completionRate = tasks.length ? Math.round(done.length/tasks.length*100) : 0

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,flexDirection:'column',gap:12}}>
      <div style={{width:32,height:32,border:'3px solid var(--accent)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <p style={{color:'var(--muted)',fontSize:13}}>Loading analytics…</p>
    </div>
  )

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:900,margin:'0 auto'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,var(--accent),var(--accent2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,boxShadow:'0 4px 14px var(--glow)'}}>📊</div>
            <div>
              <h2 style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:'Syne,sans-serif',margin:0}}>Analytics</h2>
              <p style={{fontSize:12,color:'var(--muted)',margin:0}}>Your productivity insights</p>
            </div>
          </div>
          <div style={{display:'flex',gap:6}}>
            {[7,30,90].map(r=><RangeBtn key={r} label={`${r}d`} active={range===r} onClick={()=>setRange(r)}/>)}
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          <StatBox emoji="✅" label="Completed" value={done.length} sub={`${doneInRange.length} in last ${range}d`} color="var(--success)" delay={0}/>
          <StatBox emoji="⚡" label="Focus Points" value={totalPts} sub={`${avgPerDay}/day avg`} color="var(--accent2)" delay={80}/>
          <StatBox emoji="🔥" label="Current Streak" value={`${streak}d`} sub="consecutive days" color="var(--warn)" delay={160}/>
          <StatBox emoji="🎯" label="Completion Rate" value={`${completionRate}%`} sub={`${tasks.length} total tasks`} color="var(--danger)" delay={240}/>
        </div>

        {/* Charts Grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
          <ChartCard emoji="📈" title={`Tasks Completed — Last ${range} Days`} height={160} delay={100}>
            <LineChart data={completionByDay} color="var(--success)" label="Tasks"/>
          </ChartCard>
          <ChartCard emoji="🥧" title="Priority Breakdown" height={160} delay={150}>
            <DonutChart data={priorityData}/>
          </ChartCard>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
          <ChartCard emoji="📊" title="Weekly Comparison" height={160} delay={200}>
            <BarChart data={weeklyData} color="var(--accent2)"/>
          </ChartCard>
          <ChartCard emoji="⚡" title="Productivity Score (Cumulative)" height={160} delay={250}>
            <LineChart data={scoreByDay} color="var(--accent2)" label="Points"/>
          </ChartCard>
        </div>

        {/* Heatmap - full width */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:20,animation:`fadeUp .4s ease both`,animationDelay:'300ms'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
            <span style={{fontSize:18}}>🔥</span>
            <h3 style={{fontSize:14,fontWeight:700,color:'var(--text)',fontFamily:'Syne,sans-serif',margin:0}}>Activity Heatmap — Last 84 Days</h3>
          </div>
          <Heatmap data={heatmapData}/>
        </div>

      </div>
    </>
  )
}