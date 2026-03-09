import React, { useState, useMemo } from 'react'

const PRIORITY_CFG = {
  HIGH:   { color:'#ff6b6b', bg:'rgba(255,107,107,.15)', dot:'#ff6b6b' },
  MEDIUM: { color:'#ffd93d', bg:'rgba(255,217,61,.15)',  dot:'#ffd93d' },
  LOW:    { color:'#6bcb77', bg:'rgba(107,203,119,.15)', dot:'#6bcb77' },
}
const STATUS_CFG = {
  TODO:        { color:'#6b6b8a', label:'To Do' },
  IN_PROGRESS: { color:'#60a5fa', label:'In Progress' },
  DONE:        { color:'#6bcb77', label:'Done' },
  CANCELLED:   { color:'#ff6b6b', label:'Cancelled' },
}
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const css = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideRight{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
  .cal-cell:hover{background:rgba(124,58,237,.07)!important;cursor:pointer}
  .cal-cell.today{background:rgba(124,58,237,.1)!important}
  .cal-nav:hover{background:rgba(255,255,255,.08)!important}
  .task-pill:hover{opacity:.85!important}
  .view-toggle:hover{background:rgba(255,255,255,.07)!important}
`

function TaskPill({ task, onClick }) {
  const p = PRIORITY_CFG[task.priority] || PRIORITY_CFG.MEDIUM
  const done = task.status === 'DONE'
  return (
    <div className="task-pill" onClick={e => { e.stopPropagation(); onClick(task) }}
      style={{ fontSize:10,padding:'2px 6px',borderRadius:5,marginBottom:2,cursor:'pointer',
        background:done?'rgba(107,203,119,.1)':p.bg,
        color:done?'#6bcb77':p.color,
        textDecoration:done?'line-through':'none',
        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
        border:`1px solid ${done?'rgba(107,203,119,.2)':p.color+'33'}`,
        transition:'opacity .15s',fontWeight:600 }}>
      {task.title}
    </div>
  )
}

export default function CalendarView({ tasks = [], onTaskClick, onDayClick }) {
  const [now, setNow]           = useState(new Date())
  const [selected, setSelected] = useState(null)
  const [view, setView]         = useState('month') // month | week

  const year  = now.getFullYear()
  const month = now.getMonth()

  // Build calendar grid
  const { days, tasksByDate } = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month+1, 0).getDate()
    const daysInPrev  = new Date(year, month, 0).getDate()

    const cells = []
    // Prev month padding
    for (let i = firstDay-1; i >= 0; i--) {
      cells.push({ day: daysInPrev-i, month:'prev', date: new Date(year, month-1, daysInPrev-i) })
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month:'cur', date: new Date(year, month, d) })
    }
    // Next month padding
    const remaining = 42 - cells.length
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, month:'next', date: new Date(year, month+1, d) })
    }

    // Group tasks by date string
    const byDate = {}
    tasks.forEach(t => {
      if (!t.dueDate) return
      const d = new Date(t.dueDate)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!byDate[key]) byDate[key] = []
      byDate[key].push(t)
    })

    return { days: cells, tasksByDate: byDate }
  }, [year, month, tasks])

  // Week view
  const weekDays = useMemo(() => {
    const today = selected || new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - today.getDay())
    return Array.from({length:7}, (_,i) => {
      const d = new Date(start); d.setDate(start.getDate()+i)
      return d
    })
  }, [selected])

  const todayKey = (() => { const t=new Date(); return `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}` })()

  const selectedTasks = selected
    ? tasks.filter(t => {
        if (!t.dueDate) return false
        const d = new Date(t.dueDate)
        return d.getFullYear()===selected.getFullYear() &&
               d.getMonth()===selected.getMonth() &&
               d.getDate()===selected.getDate()
      })
    : []

  function prevMonth() { setNow(d => { const n=new Date(d); n.setMonth(n.getMonth()-1); return n }) }
  function nextMonth() { setNow(d => { const n=new Date(d); n.setMonth(n.getMonth()+1); return n }) }
  function goToday()   { setNow(new Date()); setSelected(new Date()) }

  return (
    <>
      <style>{css}</style>
      <div style={{animation:'fadeUp .4s ease'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,gap:12,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <button className="cal-nav" onClick={prevMonth}
              style={{width:34,height:34,borderRadius:10,background:'#111118',
                border:'1px solid rgba(255,255,255,.08)',color:'#f0f0f8',
                fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'background .15s'}}>
              ‹
            </button>
            <h2 style={{fontSize:18,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:0,minWidth:160}}>
              {MONTHS[month]} {year}
            </h2>
            <button className="cal-nav" onClick={nextMonth}
              style={{width:34,height:34,borderRadius:10,background:'#111118',
                border:'1px solid rgba(255,255,255,.08)',color:'#f0f0f8',
                fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'background .15s'}}>
              ›
            </button>
            <button onClick={goToday}
              style={{padding:'6px 14px',borderRadius:9,background:'rgba(124,58,237,.12)',
                border:'1px solid rgba(124,58,237,.25)',color:'#a855f7',fontSize:12,
                fontWeight:700,cursor:'pointer'}}>
              Today
            </button>
          </div>

          {/* View toggle */}
          <div style={{display:'flex',gap:4,background:'#111118',border:'1px solid rgba(255,255,255,.07)',
            borderRadius:12,padding:4}}>
            {['month','week'].map(v => (
              <button key={v} className="view-toggle" onClick={() => setView(v)}
                style={{padding:'6px 14px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',
                  border:'none',transition:'all .15s',textTransform:'capitalize',
                  background:view===v?'linear-gradient(135deg,#7c3aed,#a855f7)':'transparent',
                  color:view===v?'#fff':'#6b6b8a'}}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {view === 'month' ? (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {/* Calendar grid */}
            <div style={{minWidth:0}}>
              {/* Weekday headers */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:1,marginBottom:4}}>
                {WEEKDAYS.map(d => (
                  <div key={d} style={{textAlign:'center',fontSize:10,fontWeight:700,
                    color:'#4b5563',padding:'4px 0',letterSpacing:'1px'}}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:1}}>
                {days.map((cell, i) => {
                  const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`
                  const cellTasks = tasksByDate[key] || []
                  const isToday = key === todayKey
                  const isSel = selected &&
                    selected.getFullYear()===cell.date.getFullYear() &&
                    selected.getMonth()===cell.date.getMonth() &&
                    selected.getDate()===cell.date.getDate()
                  return (
                    <div key={i} className={`cal-cell${isToday?' today':''}`}
                      onClick={() => setSelected(cell.date)}
                      style={{minHeight:70,padding:'5px 4px',borderRadius:10,
                        background:isSel?'rgba(124,58,237,.15)':isToday?'rgba(124,58,237,.08)':'#111118',
                        border:`1px solid ${isSel?'rgba(124,58,237,.4)':isToday?'rgba(124,58,237,.2)':'rgba(255,255,255,.04)'}`,
                        transition:'all .15s',opacity:cell.month!=='cur'?.35:1}}>
                      <p style={{fontSize:12,fontWeight:isToday?800:600,margin:'0 0 3px',textAlign:'right',
                        color:isToday?'#a855f7':'#9ca3af',
                        width:20,height:20,borderRadius:'50%',marginLeft:'auto',
                        background:isToday?'rgba(168,85,247,.15)':'transparent',
                        display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {cell.day}
                      </p>
                      {cellTasks.slice(0,3).map(t => (
                        <TaskPill key={t.id} task={t} onClick={onTaskClick||(() => {})}/>
                      ))}
                      {cellTasks.length > 3 && (
                        <p style={{fontSize:9,color:'#6b6b8a',margin:0,fontWeight:600}}>+{cellTasks.length-3} more</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Day detail panel */}
            <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',
              borderRadius:18,padding:18,minHeight:300}}>
              {selected ? (
                <div style={{animation:'slideRight .3s ease'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                    <div>
                      <p style={{fontSize:16,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:'0 0 2px'}}>
                        {selected.toLocaleDateString('en-IN',{weekday:'long'})}
                      </p>
                      <p style={{fontSize:12,color:'#6b6b8a',margin:0}}>
                        {selected.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
                      </p>
                    </div>
                    {onDayClick && (
                      <button onClick={() => onDayClick(selected)}
                        style={{padding:'6px 12px',borderRadius:9,background:'rgba(124,58,237,.1)',
                          border:'1px solid rgba(124,58,237,.2)',color:'#a855f7',
                          fontSize:11,fontWeight:700,cursor:'pointer'}}>
                        + Add Task
                      </button>
                    )}
                  </div>
                  {selectedTasks.length === 0 ? (
                    <div style={{textAlign:'center',padding:'32px 0'}}>
                      <p style={{fontSize:28,marginBottom:8}}>📅</p>
                      <p style={{fontSize:13,color:'#6b6b8a'}}>No tasks due this day</p>
                    </div>
                  ) : selectedTasks.map(t => {
                    const p = PRIORITY_CFG[t.priority] || PRIORITY_CFG.MEDIUM
                    const s = STATUS_CFG[t.status] || STATUS_CFG.TODO
                    return (
                      <div key={t.id} onClick={() => onTaskClick && onTaskClick(t)}
                        style={{padding:'11px 13px',background:'rgba(255,255,255,.03)',
                          border:'1px solid rgba(255,255,255,.07)',borderRadius:12,
                          marginBottom:8,cursor:'pointer',transition:'background .15s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(124,58,237,.07)'}
                        onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.03)'}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                          <div style={{width:8,height:8,borderRadius:'50%',flexShrink:0,background:p.color}}/>
                          <p style={{fontSize:13,fontWeight:600,color:'#f0f0f8',margin:0,flex:1,
                            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                            textDecoration:t.status==='DONE'?'line-through':'none'}}>
                            {t.title}
                          </p>
                        </div>
                        <div style={{display:'flex',gap:6,paddingLeft:16}}>
                          <span style={{fontSize:10,padding:'2px 7px',borderRadius:5,
                            background:p.bg,color:p.color,fontWeight:700}}>{t.priority}</span>
                          <span style={{fontSize:10,padding:'2px 7px',borderRadius:5,
                            background:'rgba(255,255,255,.05)',color:s.color,fontWeight:600}}>{s.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',
                  justifyContent:'center',height:'100%',gap:10}}>
                  <p style={{fontSize:36}}>📅</p>
                  <p style={{fontSize:13,color:'#6b6b8a',textAlign:'center'}}>
                    Click any date to see tasks due that day
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Week view
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6}}>
            {weekDays.map((d, i) => {
              const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
              const dayTasks = tasksByDate[key] || []
              const isToday = key === todayKey
              return (
                <div key={i} style={{background:'#111118',border:`1px solid ${isToday?'rgba(124,58,237,.3)':'rgba(255,255,255,.06)'}`,
                  borderRadius:14,padding:'10px 8px',minHeight:180}}>
                  <div style={{textAlign:'center',marginBottom:10}}>
                    <p style={{fontSize:10,color:'#4b5563',fontWeight:700,margin:'0 0 4px',letterSpacing:'1px'}}>
                      {WEEKDAYS[d.getDay()]}
                    </p>
                    <div style={{width:28,height:28,borderRadius:'50%',margin:'0 auto',
                      background:isToday?'linear-gradient(135deg,#7c3aed,#a855f7)':'transparent',
                      display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <p style={{fontSize:14,fontWeight:800,color:isToday?'#fff':'#f0f0f8',margin:0}}>{d.getDate()}</p>
                    </div>
                  </div>
                  {dayTasks.map(t => <TaskPill key={t.id} task={t} onClick={onTaskClick||(() => {})}/>)}
                  {dayTasks.length === 0 && (
                    <p style={{fontSize:10,color:'#2d2d3a',textAlign:'center',marginTop:16}}>—</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{display:'flex',gap:14,marginTop:16,flexWrap:'wrap'}}>
          {Object.entries(PRIORITY_CFG).map(([k,v]) => (
            <div key={k} style={{display:'flex',alignItems:'center',gap:5}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:v.dot}}/>
              <span style={{fontSize:11,color:'#6b6b8a'}}>{k}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}