import React, { useState, useEffect } from 'react'
import api from '../services/api'

const css = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes barGrow{from{width:0}to{width:var(--w)}}
  .stat-card:hover{border-color:rgba(124,58,237,.3)!important;transform:translateY(-2px)!important}
`

function StatCard({icon, value, label, color, delay=0, sub}) {
  return (
    <div className="stat-card"
      style={{background:'#111118',border:'1px solid rgba(255,255,255,.06)',borderRadius:16,
        padding:'18px 16px',textAlign:'center',transition:'all .2s',
        animation:`countUp .5s ease ${delay}s both`}}>
      <p style={{fontSize:26,margin:'0 0 6px'}}>{icon}</p>
      <p style={{fontSize:28,fontWeight:800,color,fontFamily:'Syne,sans-serif',margin:'0 0 4px',lineHeight:1}}>{value}</p>
      <p style={{fontSize:11,color:'#6b6b8a',margin:sub?'0 0 2px':0,textTransform:'uppercase',letterSpacing:'1px',fontWeight:600}}>{label}</p>
      {sub && <p style={{fontSize:10,color:'#4b5563',margin:0}}>{sub}</p>}
    </div>
  )
}

export default function WeeklyReview() {
  const [data, setData]     = useState(null)
  const [loading, setLoad]  = useState(true)
  const [sending, setSend]  = useState(false)
  const [sent, setSent]     = useState(false)

  useEffect(()=>{
    api.get('/api/ai/weekly-review')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(()=>setLoad(false))
  },[])

  async function sendEmail() {
    setSend(true)
    try {
      await api.post('/api/ai/send-weekly-coach')
      setSent(true)
      setTimeout(()=>setSent(false), 3000)
    } catch(e){ console.error(e) }
    finally { setSend(false) }
  }

  const completionRate = data
    ? data.completedThisWeek + data.pendingTasks > 0
      ? Math.round((data.completedThisWeek / (data.completedThisWeek + data.pendingTasks)) * 100)
      : 0
    : 0

  const perfLabel = completionRate >= 80 ? ['🔥 Excellent','#6bcb77']
    : completionRate >= 50 ? ['💪 Good','#ffd93d']
    : ['📈 Keep Going','#ff6b6b']

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:300,flexDirection:'column',gap:14}}>
      <span style={{width:28,height:28,border:'2px solid #a855f7',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/>
      <p style={{color:'#6b6b8a',fontSize:13}}>Generating your weekly review…</p>
    </div>
  )

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:700,margin:'0 auto',animation:'fadeUp .4s ease'}}>

        {/* Hero */}
        <div style={{background:'linear-gradient(135deg,rgba(124,58,237,.12),rgba(168,85,247,.06))',
          border:'1px solid rgba(124,58,237,.2)',borderRadius:20,padding:'28px 28px 24px',marginBottom:20,
          position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-50,right:-50,width:180,height:180,borderRadius:'50%',background:'rgba(124,58,237,.06)',pointerEvents:'none'}}/>
          <div style={{position:'relative',zIndex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
              <div style={{width:48,height:48,borderRadius:14,background:'linear-gradient(135deg,#7c3aed,#a855f7)',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0,
                boxShadow:'0 6px 20px rgba(124,58,237,.4)'}}>📊</div>
              <div>
                <h1 style={{fontSize:20,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:'0 0 4px'}}>Weekly Review</h1>
                <p style={{fontSize:12,color:'#6b6b8a',margin:0}}>
                  Week of {new Date(Date.now()-6*86400000).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – {new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                </p>
              </div>
              <div style={{marginLeft:'auto',textAlign:'center'}}>
                <p style={{fontSize:22,fontWeight:800,color:perfLabel[1],fontFamily:'Syne,sans-serif',margin:'0 0 2px'}}>{perfLabel[0]}</p>
                <p style={{fontSize:11,color:'#6b6b8a',margin:0}}>{completionRate}% completion rate</p>
              </div>
            </div>

            {/* Completion progress bar */}
            <div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#6b6b8a',marginBottom:6}}>
                <span>Weekly completion</span>
                <span style={{color:perfLabel[1],fontWeight:700}}>{data.completedThisWeek} tasks done this week</span>
              </div>
              <div style={{height:8,background:'rgba(255,255,255,.06)',borderRadius:8,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:8,
                  background:`linear-gradient(90deg,#7c3aed,${perfLabel[1]})`,
                  width:`${completionRate}%`,transition:'width 1s ease'}}/>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className='weekly-stats-grid' style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
          <StatCard icon="✅" value={data.completedThisWeek} label="Done This Week"   color="#6bcb77" delay={0}   sub="tasks completed"/>
          <StatCard icon="⭐" value={data.highPriorityDone}  label="High Priority"    color="#a855f7" delay={0.1} sub="done this week"/>
          <StatCard icon="⚡" value={data.focusScore}        label="Focus Score"      color="#60a5fa" delay={0.2} sub="total points"/>
          <StatCard icon="🔥" value={`${data.streak}d`}      label="Current Streak"   color="#ffd93d" delay={0.3} sub={data.streak>0?"keep it alive!":"complete a task"}/>
        </div>

        {/* Overdue warning */}
        {data.overdueTasks > 0 && (
          <div style={{background:'rgba(255,107,107,.06)',border:'1px solid rgba(255,107,107,.2)',
            borderRadius:14,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:12,
            animation:'fadeUp .4s ease .4s both'}}>
            <span style={{fontSize:22,flexShrink:0}}>⚠️</span>
            <div>
              <p style={{fontSize:14,fontWeight:700,color:'#ff6b6b',margin:'0 0 3px'}}>
                {data.overdueTasks} overdue task{data.overdueTasks>1?'s':''} need attention
              </p>
              <p style={{fontSize:12,color:'#6b6b8a',margin:0}}>Tackle these first next week to clear your backlog.</p>
            </div>
          </div>
        )}

        {/* AI Insight */}
        <div style={{background:'#111118',border:'1px solid rgba(124,58,237,.2)',
          borderLeft:'4px solid #a855f7',borderRadius:16,padding:'20px 22px',marginBottom:20,
          animation:'fadeUp .4s ease .35s both'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <span style={{fontSize:18}}>🤖</span>
            <p style={{fontSize:10,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'#a855f7',margin:0}}>AI COACH INSIGHT</p>
          </div>
          <p style={{fontSize:14,color:'#f0f0f8',lineHeight:1.7,margin:0,fontStyle:'italic'}}>
            "{data.aiInsight}"
          </p>
        </div>

        {/* Pending tasks heading into next week */}
        <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.06)',
          borderRadius:16,padding:'18px 20px',marginBottom:20,
          display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,
          animation:'fadeUp .4s ease .45s both'}}>
          <div>
            <p style={{fontSize:14,fontWeight:700,color:'#f0f0f8',margin:'0 0 4px'}}>
              📋 {data.pendingTasks} task{data.pendingTasks!==1?'s':''} heading into next week
            </p>
            <p style={{fontSize:12,color:'#6b6b8a',margin:0}}>Plan ahead — prioritize what matters most.</p>
          </div>
          <div style={{display:'flex',gap:6}}>
            {[0,1,2].map(i=>(
              <div key={i} style={{width:8,height:8,borderRadius:'50%',
                background: i < Math.min(3, data.pendingTasks) ? '#a855f7' : 'rgba(255,255,255,.08)'}}/>
            ))}
          </div>
        </div>

        {/* Send email button */}
        <div style={{textAlign:'center',animation:'fadeUp .4s ease .5s both'}}>
          <button onClick={sendEmail} disabled={sending||sent}
            style={{padding:'13px 32px',borderRadius:14,border:'none',
              background:sent?'rgba(107,203,119,.15)':sending?'#22222f':'linear-gradient(135deg,#7c3aed,#a855f7)',
              color:sent?'#6bcb77':'#fff',fontSize:14,fontWeight:700,cursor:sending||sent?'default':'pointer',
              display:'inline-flex',alignItems:'center',gap:10,
              boxShadow:sent||sending?'none':'0 6px 24px rgba(124,58,237,.4)',transition:'all .2s'}}>
            {sending ? (
              <><span style={{width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/>  Sending…</>
            ) : sent ? (
              <>✓ Sent to your email!</>
            ) : (
              <>📩 Email Me My Weekly Review</>
            )}
          </button>
          <p style={{fontSize:11,color:'#4b5563',marginTop:10}}>
            Weekly review emails auto-send every Monday at 8 AM
          </p>
        </div>

      </div>
    </>
  )
}