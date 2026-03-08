import React, { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const css = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  @keyframes checkIn{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
  @keyframes streakPop{0%{transform:scale(1)}60%{transform:scale(1.25) rotate(-5deg)}100%{transform:scale(1)}}
  .focus-card:hover{transform:translateY(-2px)!important;box-shadow:0 12px 40px rgba(124,58,237,.2)!important}
  .check-btn:hover{background:rgba(124,58,237,.2)!important;border-color:#7c3aed!important}
  .check-btn.done{animation:checkIn .3s ease}
  .refresh-btn:hover{background:rgba(255,255,255,.08)!important}
`

const PRIORITY_CFG = {
  HIGH:   {color:'#ff6b6b', bg:'rgba(255,107,107,.1)', label:'HIGH'},
  MEDIUM: {color:'#ffd93d', bg:'rgba(255,217,61,.1)',  label:'MED'},
  LOW:    {color:'#6bcb77', bg:'rgba(107,203,119,.1)', label:'LOW'},
}

const GREETINGS = [
  "Let's make today count", "Time to crush it", "Focus drives everything",
  "Small steps, big wins", "One task at a time", "You've got this"
]

function getGreeting(name) {
  const h = new Date().getHours()
  const time = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const quote = GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
  return { time, quote, name: name || 'there' }
}

function SkeletonCard() {
  return (
    <div style={{background:'#111118',borderRadius:16,padding:20,border:'1px solid rgba(255,255,255,.06)',marginBottom:12}}>
      {[70,50,85].map((w,i)=>(
        <div key={i} style={{height:12,borderRadius:6,marginBottom:i<2?10:0,width:`${w}%`,
          background:'linear-gradient(90deg,#1a1a24 25%,#22222f 50%,#1a1a24 75%)',
          backgroundSize:'400px 100%',animation:`shimmer 1.4s ease infinite`,animationDelay:`${i*0.15}s`}}/>
      ))}
    </div>
  )
}

export default function DailyFocus({ onNavigateToTasks }) {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [completing, setComp]   = useState({})
  const [done, setDone]         = useState({})
  const [refreshing, setRef]    = useState(false)
  const greeting = data ? getGreeting(data.userName) : null

  const load = useCallback(async (isRefresh=false) => {
    if (isRefresh) setRef(true); else setLoading(true)
    try {
      const r = await api.get('/api/ai/daily-focus')
      setData(r.data)
      setDone({})
    } catch(e) { console.error(e) }
    finally { setLoading(false); setRef(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function completeTask(taskId) {
    setComp(p => ({...p, [taskId]: true}))
    try {
      await api.patch(`/api/tasks/${taskId}/status`, { status: 'DONE' })
      setDone(p => ({...p, [taskId]: true}))
      // Refresh after short delay
      setTimeout(() => load(true), 1200)
    } catch(e) { console.error(e) }
    finally { setComp(p => ({...p, [taskId]: false})) }
  }

  const allDone = data?.focusTasks?.length > 0 && data.focusTasks.every(t => done[t.id])
  const doneCount = data?.focusTasks?.filter(t => done[t.id]).length || 0

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:680,margin:'0 auto',animation:'fadeUp .4s ease'}}>

        {/* Header greeting */}
        <div style={{marginBottom:24,position:'relative'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
            <div>
              {loading ? (
                <div style={{height:28,width:220,borderRadius:8,background:'#1a1a24',animation:'pulse 1.4s ease infinite',marginBottom:8}}/>
              ) : (
                <h1 style={{fontSize:24,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:'0 0 6px',lineHeight:1.2}}>
                  {greeting?.time}, <span style={{color:'#a855f7'}}>{greeting?.name}</span> 👋
                </h1>
              )}
              <p style={{fontSize:13,color:'#6b6b8a',margin:0}}>
                {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
              </p>
            </div>
            <button className="refresh-btn" onClick={()=>load(true)} disabled={refreshing||loading}
              style={{padding:'8px 14px',borderRadius:10,background:'var(--surface2,#1a1a24)',
                border:'1px solid rgba(255,255,255,.08)',color:'#6b6b8a',fontSize:12,fontWeight:600,
                cursor:'pointer',display:'flex',alignItems:'center',gap:6,flexShrink:0,transition:'all .15s'}}>
              <span style={{display:'inline-block',animation:refreshing?'spin .7s linear infinite':'none'}}>↻</span>
              Refresh
            </button>
          </div>
        </div>

        {/* Streak + score banner */}
        {!loading && data && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24,animation:'fadeUp .4s ease .1s both'}}>
            {[
              {icon:'🔥',label:'Day Streak',value:data.streak,color:'#ffd93d',sub:data.streak>0?'Keep it up!':'Complete a task!'},
              {icon:'⚡',label:'Focus Score',value:data.focusScore,color:'#a855f7',sub:'Total points earned'},
            ].map(s=>(
              <div key={s.label} style={{background:'#111118',border:'1px solid rgba(255,255,255,.06)',
                borderRadius:16,padding:'16px 18px',display:'flex',alignItems:'center',gap:14}}>
                <span style={{fontSize:28,animation:s.icon==='🔥'&&data.streak>0?'streakPop 2s ease infinite':'none'}}>{s.icon}</span>
                <div>
                  <p style={{fontSize:22,fontWeight:800,color:s.color,fontFamily:'Syne,sans-serif',margin:'0 0 2px',lineHeight:1}}>{s.value}</p>
                  <p style={{fontSize:12,fontWeight:600,color:'#f0f0f8',margin:'0 0 2px'}}>{s.label}</p>
                  <p style={{fontSize:11,color:'#6b6b8a',margin:0}}>{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Daily Focus section */}
        <div style={{background:'linear-gradient(135deg,rgba(124,58,237,.08),rgba(168,85,247,.04))',
          border:'1px solid rgba(124,58,237,.2)',borderRadius:20,padding:'22px 22px 18px',marginBottom:20}}>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#7c3aed,#a855f7)',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🎯</div>
              <div>
                <h2 style={{fontSize:16,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:0}}>Today's Focus</h2>
                <p style={{fontSize:11,color:'#6b6b8a',margin:0}}>AI-picked top 3 tasks for maximum impact</p>
              </div>
            </div>
            {/* Progress pills */}
            {!loading && data?.focusTasks?.length > 0 && (
              <div style={{display:'flex',gap:5}}>
                {data.focusTasks.map((t,i)=>(
                  <div key={t.id} style={{width:24,height:8,borderRadius:4,
                    background:done[t.id]?'#6bcb77':'rgba(255,255,255,.1)',transition:'background .3s'}}/>
                ))}
              </div>
            )}
          </div>

          {/* Task cards */}
          {loading ? (
            <><SkeletonCard/><SkeletonCard/><SkeletonCard/></>
          ) : !data?.focusTasks?.length ? (
            <div style={{textAlign:'center',padding:'32px 20px'}}>
              <div style={{fontSize:40,marginBottom:12}}>🎉</div>
              <p style={{fontSize:15,fontWeight:700,color:'#f0f0f8',fontFamily:'Syne,sans-serif',marginBottom:6}}>All caught up!</p>
              <p style={{fontSize:13,color:'#6b6b8a',marginBottom:16}}>No pending tasks. Add some new ones to stay productive.</p>
              <button onClick={onNavigateToTasks}
                style={{padding:'10px 22px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                + Add Tasks
              </button>
            </div>
          ) : (
            data.focusTasks.map((task, i) => {
              const p = PRIORITY_CFG[task.priority] || PRIORITY_CFG.MEDIUM
              const isDone = done[task.id]
              const isComp = completing[task.id]
              const due = task.dueDate ? new Date(task.dueDate) : null
              const isOverdue = due && due < new Date() && !isDone

              return (
                <div key={task.id} className="focus-card"
                  style={{background:isDone?'rgba(107,203,119,.05)':'#111118',
                    border:`1px solid ${isDone?'rgba(107,203,119,.2)':'rgba(255,255,255,.06)'}`,
                    borderRadius:16,padding:'16px 18px',marginBottom:i<2?12:0,
                    transition:'all .25s',opacity:isDone?.6:1,
                    animation:`fadeUp .4s ease ${i*0.08}s both`}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:13}}>
                    {/* Rank badge */}
                    <div style={{width:28,height:28,borderRadius:8,flexShrink:0,marginTop:1,
                      background:isDone?'rgba(107,203,119,.15)':`linear-gradient(135deg,rgba(124,58,237,.2),rgba(168,85,247,.1))`,
                      border:`1px solid ${isDone?'rgba(107,203,119,.3)':'rgba(124,58,237,.2)'}`,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:13,fontWeight:800,color:isDone?'#6bcb77':'#a855f7',fontFamily:'Syne,sans-serif'}}>
                      {isDone ? '✓' : i+1}
                    </div>

                    {/* Content */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,flexWrap:'wrap'}}>
                        <p style={{fontSize:14,fontWeight:isDone?500:700,color:isDone?'#6b6b8a':'#f0f0f8',
                          margin:0,textDecoration:isDone?'line-through':'none',lineHeight:1.3}}>
                          {task.title}
                        </p>
                        <span style={{fontSize:9,padding:'2px 7px',borderRadius:5,fontWeight:700,
                          background:p.bg,color:p.color,flexShrink:0}}>
                          {p.label}
                        </span>
                        {isOverdue && <span style={{fontSize:9,padding:'2px 7px',borderRadius:5,fontWeight:700,
                          background:'rgba(255,107,107,.1)',color:'#ff6b6b',flexShrink:0}}>OVERDUE</span>}
                      </div>

                      {/* AI reason */}
                      <p style={{fontSize:12,color:'#6b6b8a',margin:'0 0 6px',lineHeight:1.4,fontStyle:'italic'}}>
                        🤖 {task.reason}
                      </p>

                      {due && (
                        <p style={{fontSize:11,color:isOverdue?'#ff6b6b':'#4b5563',margin:0}}>
                          📅 Due {due.toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                        </p>
                      )}
                    </div>

                    {/* Complete button */}
                    <button className={`check-btn${isDone?' done':''}`}
                      onClick={() => !isDone && completeTask(task.id)}
                      disabled={isDone || isComp}
                      style={{width:36,height:36,borderRadius:10,flexShrink:0,
                        background:isDone?'rgba(107,203,119,.15)':'transparent',
                        border:`2px solid ${isDone?'#6bcb77':'rgba(255,255,255,.15)'}`,
                        color:isDone?'#6bcb77':'#6b6b8a',fontSize:16,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        cursor:isDone?'default':'pointer',transition:'all .2s'}}>
                      {isComp ? <span style={{width:14,height:14,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/> : isDone ? '✓' : '○'}
                    </button>
                  </div>
                </div>
              )
            })
          )}

          {/* All done celebration */}
          {allDone && (
            <div style={{textAlign:'center',padding:'16px 0 4px',animation:'fadeUp .4s ease'}}>
              <p style={{fontSize:15,fontWeight:700,color:'#6bcb77',margin:'0 0 4px',fontFamily:'Syne,sans-serif'}}>🎉 All 3 focus tasks done!</p>
              <p style={{fontSize:12,color:'#6b6b8a',margin:0}}>Outstanding work today. Keep the momentum going!</p>
            </div>
          )}
        </div>

        {/* Progress tracker */}
        {!loading && data?.focusTasks?.length > 0 && (
          <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.06)',borderRadius:16,
            padding:'16px 20px',display:'flex',alignItems:'center',gap:16,animation:'fadeUp .4s ease .3s both'}}>
            <div style={{flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontSize:12,fontWeight:600,color:'#f0f0f8'}}>Today's progress</span>
                <span style={{fontSize:12,color:'#a855f7',fontWeight:700}}>{doneCount}/{data.focusTasks.length} done</span>
              </div>
              <div style={{height:6,background:'rgba(255,255,255,.06)',borderRadius:6,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:6,transition:'width .5s ease',
                  background:'linear-gradient(90deg,#7c3aed,#6bcb77)',
                  width:`${(doneCount/data.focusTasks.length)*100}%`}}/>
              </div>
            </div>
            <button onClick={onNavigateToTasks}
              style={{padding:'9px 16px',borderRadius:10,border:'1px solid rgba(255,255,255,.08)',
                background:'transparent',color:'#6b6b8a',fontSize:12,fontWeight:600,cursor:'pointer',
                whiteSpace:'nowrap',flexShrink:0}}>
              All tasks →
            </button>
          </div>
        )}

      </div>
    </>
  )
}