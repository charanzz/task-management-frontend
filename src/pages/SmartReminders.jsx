import React, { useState, useEffect } from 'react'
import api from '../services/api'

const css = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  .reminder-row:hover{background:rgba(255,255,255,.04)!important;transform:translateX(3px)}
  .action-btn:hover{opacity:.85!important;transform:scale(1.04)}
  .snooze-opt:hover{background:rgba(124,58,237,.15)!important}
`
const URGENCY_CFG = {
  TODAY:    { color:'#ff6b6b', bg:'rgba(255,107,107,.1)',  border:'rgba(255,107,107,.2)',  icon:'🔥', label:'Due Today' },
  TOMORROW: { color:'#ffd93d', bg:'rgba(255,217,61,.1)',   border:'rgba(255,217,61,.2)',   icon:'⚡', label:'Tomorrow' },
  UPCOMING: { color:'#60a5fa', bg:'rgba(96,165,250,.1)',   border:'rgba(96,165,250,.2)',   icon:'📅', label:'Upcoming' },
  OVERDUE:  { color:'#ff6b6b', bg:'rgba(255,107,107,.08)', border:'rgba(255,107,107,.3)', icon:'⚠️', label:'Overdue' },
}
const PRI_COLOR = { HIGH:'#ff6b6b', MEDIUM:'#ffd93d', LOW:'#6bcb77' }
const SNOOZE_OPTS = [
  { label:'1 hour',   hours:1  },
  { label:'3 hours',  hours:3  },
  { label:'Tomorrow', hours:24 },
  { label:'2 days',   hours:48 },
]
function Spin(){ return <span style={{width:20,height:20,border:'2px solid #a855f7',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/> }

export default function SmartReminders({ onTaskClick }) {
  const [data, setData]         = useState(null)
  const [loading, setLoad]      = useState(true)
  const [snoozing, setSnoozing] = useState(null)
  const [sending, setSending]   = useState({})
  const [toast, setToast]       = useState(null)
  const [filter, setFilter]     = useState('all') // all | today | overdue

  const load = () => {
    setLoad(true)
    api.get('/api/reminders').then(r => { setData(r.data); setLoad(false) }).catch(() => setLoad(false))
  }
  useEffect(load, [])

  function showToast(msg, type='success') {
    setToast({msg,type})
    setTimeout(() => setToast(null), 3000)
  }

  async function sendNow(taskId) {
    setSending(s => ({...s,[taskId]:true}))
    try {
      await api.post('/api/reminders/send-now', { taskId })
      showToast('Reminder email sent! 📧')
    } catch(e) { showToast('Failed to send','error') }
    setSending(s => ({...s,[taskId]:false}))
  }

  async function snooze(taskId, hours) {
    try {
      await api.post(`/api/reminders/${taskId}/snooze`, { hours })
      showToast(`Snoozed for ${hours < 24 ? hours+' hours' : (hours/24)+' day(s)'} 💤`)
      setSnoozing(null)
      load()
    } catch(e) { showToast('Failed to snooze','error') }
  }

  const upcoming = data?.upcoming || []
  const overdue  = data?.overdue  || []
  const todayTasks = upcoming.filter(t => t.urgency === 'TODAY')

  const shown = filter === 'today'   ? todayTasks
              : filter === 'overdue' ? overdue
              : [...overdue.map(t => ({...t, urgency:'OVERDUE'})), ...upcoming]

  function TaskRow({ task, isOverdue }) {
    const urg = isOverdue ? 'OVERDUE' : (task.urgency || 'UPCOMING')
    const cfg = URGENCY_CFG[urg]
    return (
      <div className="reminder-row" style={{display:'flex',alignItems:'center',gap:14,
        padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,.04)',
        transition:'all .2s',cursor:'pointer',position:'relative'}}
        onClick={() => onTaskClick && onTaskClick(task)}>

        {/* Urgency badge */}
        <div style={{flexShrink:0,width:72,textAlign:'center',padding:'6px 0',borderRadius:10,
          background:cfg.bg,border:`1px solid ${cfg.border}`}}>
          <p style={{fontSize:16,margin:'0 0 1px'}}>{cfg.icon}</p>
          <p style={{fontSize:9,fontWeight:700,color:cfg.color,margin:0,letterSpacing:'1px'}}>{cfg.label}</p>
        </div>

        {/* Task info */}
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:14,fontWeight:600,color:'#f0f0f8',margin:'0 0 4px',
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.title}</p>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:5,
              background:`${PRI_COLOR[task.priority]||'#6b6b8a'}18`,
              color:PRI_COLOR[task.priority]||'#6b6b8a'}}>{task.priority}</span>
            {isOverdue ? (
              <span style={{fontSize:10,color:'#ff6b6b',fontWeight:600}}>
                ⚠️ {task.daysOverdue}d overdue
              </span>
            ) : (
              <span style={{fontSize:10,color:'#6b6b8a'}}>
                📅 {new Date(task.dueDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{display:'flex',gap:6,flexShrink:0}} onClick={e => e.stopPropagation()}>
          <button className="action-btn" onClick={() => sendNow(task.id)}
            disabled={sending[task.id]}
            title="Send reminder email"
            style={{width:32,height:32,borderRadius:9,background:'rgba(168,85,247,.12)',
              border:'1px solid rgba(168,85,247,.2)',color:'#a855f7',fontSize:14,
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .15s'}}>
            {sending[task.id] ? <Spin/> : '📧'}
          </button>
          <button className="action-btn" onClick={() => setSnoozing(snoozing===task.id?null:task.id)}
            title="Snooze"
            style={{width:32,height:32,borderRadius:9,background:'rgba(255,217,61,.1)',
              border:'1px solid rgba(255,217,61,.2)',color:'#ffd93d',fontSize:14,
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .15s'}}>
            💤
          </button>
        </div>

        {/* Snooze dropdown */}
        {snoozing === task.id && (
          <div style={{position:'absolute',right:16,top:56,background:'#1a1a24',
            border:'1px solid rgba(255,255,255,.1)',borderRadius:12,
            overflow:'hidden',zIndex:100,minWidth:140,boxShadow:'0 12px 40px rgba(0,0,0,.6)'}}>
            {SNOOZE_OPTS.map(o => (
              <button key={o.label} className="snooze-opt" onClick={() => snooze(task.id, o.hours)}
                style={{width:'100%',padding:'10px 16px',background:'none',border:'none',
                  color:'#f0f0f8',fontSize:13,fontWeight:500,textAlign:'left',cursor:'pointer',
                  borderBottom:'1px solid rgba(255,255,255,.05)',transition:'background .15s'}}>
                💤 {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:660,margin:'0 auto',animation:'fadeUp .4s ease'}}>

        {/* Header */}
        <div style={{background:'linear-gradient(135deg,rgba(255,107,107,.08),rgba(255,217,61,.05))',
          border:'1px solid rgba(255,107,107,.15)',borderRadius:20,padding:'22px 24px',marginBottom:20}}>
          <div style={{display:'flex',gap:14,alignItems:'center',marginBottom:data?16:0}}>
            <div style={{width:48,height:48,borderRadius:14,flexShrink:0,
              background:'linear-gradient(135deg,#ef4444,#f97316)',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,
              boxShadow:'0 6px 20px rgba(239,68,68,.4)'}}>⏰</div>
            <div>
              <h1 style={{fontSize:20,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:'0 0 3px'}}>Smart Reminders</h1>
              <p style={{fontSize:12,color:'#6b6b8a',margin:0}}>
                {data ? `${data.totalOverdue} overdue · ${data.totalDue} upcoming in 7 days` : 'Loading…'}
              </p>
            </div>
            <button onClick={load} style={{marginLeft:'auto',padding:'7px 14px',borderRadius:10,
              background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',
              color:'#6b6b8a',fontSize:12,fontWeight:600,cursor:'pointer'}}>
              ↺ Refresh
            </button>
          </div>

          {/* Summary stats */}
          {data && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
              {[
                { label:'Overdue',  val:data.totalOverdue,                 color:'#ff6b6b', icon:'⚠️' },
                { label:'Due Today', val:todayTasks.length,                color:'#ffd93d', icon:'🔥' },
                { label:'This Week', val:upcoming.filter(t=>t.urgency!=='TODAY').length, color:'#60a5fa', icon:'📅' },
              ].map(s => (
                <div key={s.label} style={{textAlign:'center',padding:'10px',
                  background:'rgba(0,0,0,.2)',borderRadius:12,border:`1px solid ${s.color}22`}}>
                  <p style={{fontSize:22,fontWeight:800,color:s.color,fontFamily:'Syne,sans-serif',margin:'0 0 2px'}}>{s.val}</p>
                  <p style={{fontSize:10,color:'#6b6b8a',margin:0}}>{s.icon} {s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{display:'flex',gap:4,background:'#111118',border:'1px solid rgba(255,255,255,.07)',
          borderRadius:14,padding:5,marginBottom:16}}>
          {[['all','All'],['today','Today 🔥'],['overdue','Overdue ⚠️']].map(([v,lb]) => (
            <button key={v} onClick={() => setFilter(v)}
              style={{flex:1,padding:'8px',borderRadius:10,fontSize:12,fontWeight:700,cursor:'pointer',
                border:'none',transition:'all .15s',
                background:filter===v?'linear-gradient(135deg,#7c3aed,#a855f7)':'transparent',
                color:filter===v?'#fff':'#6b6b8a'}}>
              {lb}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:18,overflow:'hidden'}}>
          {loading ? (
            <div style={{display:'flex',justifyContent:'center',padding:48}}><Spin/></div>
          ) : shown.length === 0 ? (
            <div style={{textAlign:'center',padding:'48px 24px'}}>
              <p style={{fontSize:40,marginBottom:12}}>🎉</p>
              <p style={{fontSize:15,fontWeight:700,color:'#f0f0f8',margin:'0 0 6px'}}>All caught up!</p>
              <p style={{fontSize:12,color:'#6b6b8a'}}>No {filter==='overdue'?'overdue':filter==='today'?'tasks due today':'upcoming'} tasks</p>
            </div>
          ) : shown.map((t,i) => (
            <TaskRow key={t.id+'-'+i} task={t} isOverdue={t.urgency==='OVERDUE'||overdue.some(o=>o.id===t.id&&t.urgency==='OVERDUE')}/>
          ))}
        </div>

        <p style={{fontSize:11,color:'#4b5563',margin:'12px 0 0',textAlign:'center',lineHeight:1.7}}>
          💡 Click 📧 to send yourself an email reminder · Click 💤 to snooze a task
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{position:'fixed',bottom:90,right:20,padding:'12px 18px',borderRadius:12,
          fontSize:13,fontWeight:600,zIndex:500,
          background:toast.type==='success'?'rgba(107,203,119,.15)':'rgba(255,107,107,.15)',
          border:`1px solid ${toast.type==='success'?'rgba(107,203,119,.3)':'rgba(255,107,107,.3)'}`,
          color:toast.type==='success'?'#6bcb77':'#ff6b6b',
          backdropFilter:'blur(12px)',boxShadow:'0 8px 30px rgba(0,0,0,.4)'}}>
          {toast.msg}
        </div>
      )}
    </>
  )
}