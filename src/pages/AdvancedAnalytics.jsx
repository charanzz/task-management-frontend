import React, { useState, useEffect, useMemo } from 'react'
import api from '../services/api'

const css = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes scoreCount{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
  @keyframes barGrow{from{height:0}to{height:var(--h)}}
  .tab-btn:hover{background:rgba(255,255,255,.06)!important}
  .heat-cell:hover{transform:scale(1.4);z-index:10;position:relative}
`
const WEEK_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const SCORE_TIERS = [
  { min:90, label:'🏆 Elite',      color:'#ffd93d' },
  { min:75, label:'🚀 Champion',   color:'#a855f7' },
  { min:60, label:'⚡ On Track',   color:'#60a5fa' },
  { min:40, label:'📈 Growing',    color:'#6bcb77' },
  { min:0,  label:'🌱 Starting',   color:'#6b6b8a' },
]
function getTier(score) { return SCORE_TIERS.find(t => score >= t.min) || SCORE_TIERS.at(-1) }
function Spin(){ return <span style={{width:22,height:22,border:'2px solid #a855f7',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/> }

function HeatCell({ count, max }) {
  const intensity = max > 0 ? count / max : 0
  const bg = count === 0 ? 'rgba(255,255,255,.04)'
    : intensity < .25  ? 'rgba(124,58,237,.3)'
    : intensity < .5   ? 'rgba(124,58,237,.55)'
    : intensity < .75  ? 'rgba(168,85,247,.75)'
    : '#a855f7'
  return (
    <div className="heat-cell" title={`${count} task${count!==1?'s':''} completed`}
      style={{width:12,height:12,borderRadius:2,background:bg,cursor:'default',transition:'transform .15s'}}/>
  )
}

function MiniBar({ value, max, color, label, sub }) {
  const pct = max > 0 ? (value/max)*100 : 0
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
        <span style={{fontSize:12,color:'#9ca3af',fontWeight:500}}>{label}</span>
        <span style={{fontSize:12,fontWeight:700,color}}>{value}{sub||''}</span>
      </div>
      <div style={{height:6,background:'rgba(255,255,255,.06)',borderRadius:3,overflow:'hidden'}}>
        <div style={{height:'100%',borderRadius:3,background:color,width:`${pct}%`,transition:'width .8s ease'}}/>
      </div>
    </div>
  )
}

export default function AdvancedAnalytics() {
  const [data, setData]   = useState(null)
  const [loading, setLoad]= useState(true)
  const [tab, setTab]     = useState('overview') // overview | heatmap | trends | time

  useEffect(() => {
    api.get('/api/analytics/advanced')
      .then(r => { setData(r.data); setLoad(false) })
      .catch(() => setLoad(false))
  }, [])

  // Build heatmap weeks
  const heatWeeks = useMemo(() => {
    if (!data?.heatmap) return []
    const entries = Object.entries(data.heatmap)
    const max = Math.max(...entries.map(([,v])=>v), 1)
    // Group into weeks of 7
    const weeks = []
    for (let i = 0; i < entries.length; i += 7) {
      weeks.push(entries.slice(i, i+7).map(([date,count]) => ({ date, count, max })))
    }
    return weeks
  }, [data])

  const maxBar = useMemo(() => {
    if (!data) return 1
    const dowMax = Math.max(...(data.byDayOfWeek||[]).map(d=>d.count), 1)
    return dowMax
  }, [data])

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:80}}><Spin/></div>
  if (!data) return <p style={{color:'#ff6b6b',textAlign:'center'}}>Failed to load analytics</p>

  if (data.total === 0) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      minHeight:400,textAlign:'center',padding:'60px 24px',fontFamily:'DM Sans,sans-serif'}}>
      <div style={{fontSize:72,marginBottom:20,filter:'grayscale(.3)'}}>📊</div>
      <p style={{fontSize:22,fontWeight:800,color:'#f0f0f8',margin:'0 0 10px',fontFamily:'Syne,sans-serif'}}>
        No data yet
      </p>
      <p style={{fontSize:14,color:'#6b6b8a',maxWidth:320,lineHeight:1.7,margin:'0 0 28px'}}>
        Complete some tasks to unlock your productivity analytics — heatmap, trends, best focus hours and more.
      </p>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center'}}>
        {[['🎯','Complete a task'],['🔥','Build a streak'],['⏱','Run a Pomodoro']].map(([ic,lb])=>(
          <div key={lb} style={{padding:'12px 18px',borderRadius:12,background:'rgba(124,58,237,.08)',
            border:'1px solid rgba(124,58,237,.2)',fontSize:13,color:'#a78bfa',fontWeight:600}}>
            {ic} {lb}
          </div>
        ))}
      </div>
    </div>
  )

  const tier = getTier(data.productivityScore)

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:720,margin:'0 auto',animation:'fadeUp .4s ease'}}>

        {/* Productivity Score Hero */}
        <div style={{background:'linear-gradient(135deg,rgba(124,58,237,.12),rgba(255,217,61,.06))',
          border:'1px solid rgba(124,58,237,.2)',borderRadius:22,padding:'28px 28px',marginBottom:20,
          display:'flex',alignItems:'center',gap:28,flexWrap:'wrap'}}>
          {/* Score circle */}
          <div style={{position:'relative',flexShrink:0}}>
            <svg width={120} height={120} style={{transform:'rotate(-90deg)'}}>
              <circle cx={60} cy={60} r={50} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={10}/>
              <circle cx={60} cy={60} r={50} fill="none" stroke={tier.color} strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={`${2*Math.PI*50}`}
                strokeDashoffset={`${2*Math.PI*50*(1-data.productivityScore/100)}`}
                style={{transition:'stroke-dashoffset 1s ease',filter:`drop-shadow(0 0 8px ${tier.color}66)`}}/>
            </svg>
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center'}}>
              <p style={{fontSize:28,fontWeight:800,color:tier.color,fontFamily:'Syne,sans-serif',
                margin:0,lineHeight:1,animation:'scoreCount .8s ease'}}>{data.productivityScore}</p>
              <p style={{fontSize:10,color:'#6b6b8a',margin:'2px 0 0',letterSpacing:'1px'}}>SCORE</p>
            </div>
          </div>

          <div style={{flex:1,minWidth:200}}>
            <p style={{fontSize:22,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:'0 0 4px'}}>{tier.label}</p>
            <p style={{fontSize:13,color:'#6b6b8a',margin:'0 0 18px',lineHeight:1.5}}>
              Based on completion rate, priority handling, streak and consistency
            </p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[
                { label:'Completion Rate', val:`${data.completionRate}%`,  color:'#6bcb77' },
                { label:'Streak',          val:`${data.streak||0}d 🔥`,    color:'#ffd93d' },
                { label:'Tasks Done',      val:data.done,                  color:'#a855f7' },
                { label:'Avg Time',        val:`${data.avgCompletionHrs}h`,color:'#60a5fa' },
              ].map(s => (
                <div key={s.label} style={{padding:'10px 12px',background:'rgba(255,255,255,.04)',
                  borderRadius:10,border:'1px solid rgba(255,255,255,.06)'}}>
                  <p style={{fontSize:16,fontWeight:800,color:s.color,fontFamily:'Syne,sans-serif',margin:'0 0 2px'}}>{s.val}</p>
                  <p style={{fontSize:10,color:'#6b6b8a',margin:0}}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4,
          background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,padding:5,marginBottom:20}}>
          {[['overview','📊','Overview'],['heatmap','🔥','Heatmap'],['trends','📈','Trends'],['time','⏰','Best Times']].map(([v,ic,lb]) => (
            <button key={v} className="tab-btn" onClick={() => setTab(v)}
              style={{padding:'8px 4px',borderRadius:10,fontSize:12,fontWeight:700,cursor:'pointer',
                border:'none',transition:'all .15s',
                background:tab===v?'linear-gradient(135deg,#7c3aed,#a855f7)':'transparent',
                color:tab===v?'#fff':'#6b6b8a'}}>
              {ic} {lb}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,animation:'fadeUp .3s ease'}}>
            {/* Priority breakdown */}
            <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:18,padding:20}}>
              <p style={{fontSize:14,fontWeight:700,color:'#f0f0f8',margin:'0 0 16px'}}>Priority Breakdown</p>
              <MiniBar value={data.byPriority?.HIGH||0}   max={data.total||1} color='#ff6b6b' label='🔴 High'/>
              <MiniBar value={data.byPriority?.MEDIUM||0} max={data.total||1} color='#ffd93d' label='🟡 Medium'/>
              <MiniBar value={data.byPriority?.LOW||0}    max={data.total||1} color='#6bcb77' label='🟢 Low'/>
            </div>

            {/* Weekly velocity */}
            <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:18,padding:20}}>
              <p style={{fontSize:14,fontWeight:700,color:'#f0f0f8',margin:'0 0 16px'}}>Weekly Velocity</p>
              <div style={{display:'flex',alignItems:'flex-end',gap:8,height:80}}>
                {(data.velocity||[]).map((w,i) => {
                  const maxV = Math.max(...(data.velocity||[]).map(v=>v.completed), 1)
                  const h = Math.max(4, (w.completed/maxV)*72)
                  return (
                    <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                      <span style={{fontSize:10,fontWeight:700,color:'#a855f7'}}>{w.completed}</span>
                      <div style={{width:'100%',height:h,borderRadius:4,
                        background:`linear-gradient(180deg,#a855f7,#7c3aed)`,
                        transition:'height .6s ease'}}/>
                      <span style={{fontSize:9,color:'#6b6b8a'}}>{w.week}</span>
                    </div>
                  )
                })}
              </div>
              <p style={{fontSize:10,color:'#6b6b8a',margin:'8px 0 0',textAlign:'center'}}>Tasks completed per week</p>
            </div>

            {/* Status summary */}
            <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:18,padding:20,gridColumn:'1/-1'}}>
              <p style={{fontSize:14,fontWeight:700,color:'#f0f0f8',margin:'0 0 16px'}}>Task Health</p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                {[
                  { label:'Total',   val:data.total,                              color:'#f0f0f8' },
                  { label:'Done ✅',  val:data.done,                               color:'#6bcb77' },
                  { label:'Overdue ⚠️',val:data.overdue,                          color:'#ff6b6b' },
                  { label:'Focus Pts',val:data.focusScore||0,                     color:'#a855f7' },
                ].map(s => (
                  <div key={s.label} style={{textAlign:'center',padding:'12px 8px',
                    background:'rgba(255,255,255,.03)',borderRadius:12,border:'1px solid rgba(255,255,255,.06)'}}>
                    <p style={{fontSize:24,fontWeight:800,color:s.color,fontFamily:'Syne,sans-serif',margin:'0 0 3px'}}>{s.val}</p>
                    <p style={{fontSize:10,color:'#6b6b8a',margin:0}}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── HEATMAP TAB ── */}
        {tab === 'heatmap' && (
          <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:18,padding:24,animation:'fadeUp .3s ease'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <p style={{fontSize:14,fontWeight:700,color:'#f0f0f8',margin:0}}>
                Activity Heatmap — Last 12 Weeks
              </p>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:10,color:'#6b6b8a'}}>Less</span>
                {['rgba(255,255,255,.04)','rgba(124,58,237,.3)','rgba(124,58,237,.55)','rgba(168,85,247,.75)','#a855f7'].map((bg,i) => (
                  <div key={i} style={{width:12,height:12,borderRadius:2,background:bg}}/>
                ))}
                <span style={{fontSize:10,color:'#6b6b8a'}}>More</span>
              </div>
            </div>

            {/* Day labels */}
            <div style={{display:'flex',gap:3,marginBottom:4}}>
              <div style={{width:28}}/>
              {heatWeeks[0]?.map((_,i) => (
                <div key={i} style={{width:12,fontSize:8,color:'#4b5563',textAlign:'center'}}/>
              ))}
            </div>

            <div style={{display:'flex',gap:6}}>
              {/* Week day labels */}
              <div style={{display:'flex',flexDirection:'column',gap:3}}>
                {WEEK_LABELS.map(d => (
                  <div key={d} style={{height:12,fontSize:8,color:'#4b5563',width:28,display:'flex',alignItems:'center'}}>
                    {['Mon','Wed','Fri'].includes(d) ? d : ''}
                  </div>
                ))}
              </div>
              {/* Heatmap grid */}
              <div style={{display:'flex',gap:3,overflowX:'auto',flex:1}}>
                {heatWeeks.map((week, wi) => (
                  <div key={wi} style={{display:'flex',flexDirection:'column',gap:3}}>
                    {week.map((day, di) => <HeatCell key={di} count={day.count} max={day.max}/>)}
                  </div>
                ))}
              </div>
            </div>

            <p style={{fontSize:11,color:'#4b5563',marginTop:16,textAlign:'center'}}>
              Each cell = 1 day · Darker = more tasks completed
            </p>
          </div>
        )}

        {/* ── TRENDS TAB ── */}
        {tab === 'trends' && (
          <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:18,padding:24,animation:'fadeUp .3s ease'}}>
            <p style={{fontSize:14,fontWeight:700,color:'#f0f0f8',margin:'0 0 20px'}}>30-Day Trend — Created vs Completed</p>
            <div style={{display:'flex',alignItems:'flex-end',gap:3,height:120,marginBottom:8}}>
              {(data.trend||[]).map((d,i) => {
                const maxVal = Math.max(...(data.trend||[]).map(t=>Math.max(t.created,t.completed)),1)
                const hC = Math.max(2, (d.created/maxVal)*110)
                const hD = Math.max(2, (d.completed/maxVal)*110)
                return (
                  <div key={i} style={{flex:1,display:'flex',gap:1,alignItems:'flex-end',
                    position:'relative'}} title={`${d.date}: ${d.created} created, ${d.completed} done`}>
                    <div style={{flex:1,background:'rgba(96,165,250,.4)',height:hC,borderRadius:'2px 2px 0 0',
                      transition:'height .5s ease'}}/>
                    <div style={{flex:1,background:'rgba(107,203,119,.6)',height:hD,borderRadius:'2px 2px 0 0',
                      transition:'height .5s ease'}}/>
                  </div>
                )
              })}
            </div>
            <div style={{display:'flex',gap:6,overflowX:'auto',marginBottom:16}}>
              {(data.trend||[]).filter((_,i)=>i%5===0).map((d,i) => (
                <span key={i} style={{fontSize:9,color:'#4b5563',flexShrink:0,minWidth:32}}>{d.date}</span>
              ))}
            </div>
            <div style={{display:'flex',gap:16,justifyContent:'center'}}>
              {[['rgba(96,165,250,.6)','Created'],['rgba(107,203,119,.7)','Completed']].map(([bg,lb]) => (
                <div key={lb} style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{width:12,height:12,borderRadius:2,background:bg}}/>
                  <span style={{fontSize:11,color:'#6b6b8a'}}>{lb}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BEST TIMES TAB ── */}
        {tab === 'time' && (
          <div style={{display:'flex',flexDirection:'column',gap:16,animation:'fadeUp .3s ease'}}>
            {/* By day of week */}
            <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:18,padding:20}}>
              <p style={{fontSize:14,fontWeight:700,color:'#f0f0f8',margin:'0 0 16px'}}>🗓 Most Productive Days</p>
              <div style={{display:'flex',alignItems:'flex-end',gap:8,height:80}}>
                {(data.byDayOfWeek||[]).map((d,i) => {
                  const h = Math.max(4,(d.count/maxBar)*72)
                  const isTop = d.count === maxBar && maxBar > 0
                  return (
                    <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                      {isTop && <span style={{fontSize:9,color:'#ffd93d'}}>★</span>}
                      {!isTop && <span style={{fontSize:9,color:'transparent'}}>★</span>}
                      <div style={{width:'100%',height:h,borderRadius:4,
                        background:isTop?'linear-gradient(180deg,#ffd93d,#f59e0b)':'linear-gradient(180deg,#a855f7,#7c3aed)',
                        transition:'height .6s ease'}}/>
                      <span style={{fontSize:10,color:'#6b6b8a',fontWeight:600}}>{d.day}</span>
                      <span style={{fontSize:10,fontWeight:700,color:isTop?'#ffd93d':'#9ca3af'}}>{d.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* By hour */}
            <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:18,padding:20}}>
              <p style={{fontSize:14,fontWeight:700,color:'#f0f0f8',margin:'0 0 16px'}}>⏰ Most Productive Hours</p>
              <div style={{display:'flex',alignItems:'flex-end',gap:2,height:60,overflowX:'auto'}}>
                {(data.byHourOfDay||[]).map((h,i) => {
                  const maxH = Math.max(...(data.byHourOfDay||[]).map(x=>x.count),1)
                  const ht = Math.max(2,(h.count/maxH)*56)
                  const isAM = i < 12
                  return (
                    <div key={i} style={{flexShrink:0,width:20,display:'flex',flexDirection:'column',alignItems:'center',gap:2}} title={`${h.hour}: ${h.count} tasks`}>
                      <div style={{width:14,height:ht,borderRadius:2,
                        background:isAM?'rgba(96,165,250,.6)':'rgba(168,85,247,.7)',
                        transition:'height .4s ease'}}/>
                      {i%6===0&&<span style={{fontSize:8,color:'#4b5563'}}>{h.hour}</span>}
                    </div>
                  )
                })}
              </div>
              <div style={{display:'flex',gap:16,justifyContent:'center',marginTop:8}}>
                {[['rgba(96,165,250,.6)','AM'],['rgba(168,85,247,.7)','PM']].map(([bg,lb]) => (
                  <div key={lb} style={{display:'flex',alignItems:'center',gap:5}}>
                    <div style={{width:10,height:10,borderRadius:2,background:bg}}/>
                    <span style={{fontSize:10,color:'#6b6b8a'}}>{lb}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}