import React, { useMemo, useState } from 'react'

const QUADRANTS = [
  { key:'do',    label:'Do First',    sub:'Urgent + Important',     color:'#ff6b6b', bg:'rgba(255,107,107,.07)', border:'rgba(255,107,107,.2)', icon:'🔥', desc:'Do these immediately' },
  { key:'schedule', label:'Schedule', sub:'Not Urgent + Important', color:'#60a5fa', bg:'rgba(96,165,250,.07)',  border:'rgba(96,165,250,.2)',  icon:'📅', desc:'Plan time for these' },
  { key:'delegate', label:'Delegate', sub:'Urgent + Not Important', color:'#ffd93d', bg:'rgba(255,217,61,.07)', border:'rgba(255,217,61,.2)',  icon:'👥', desc:'Delegate or batch' },
  { key:'eliminate',label:'Eliminate',sub:'Not Urgent + Not Important',color:'#6b6b8a',bg:'rgba(107,107,138,.07)',border:'rgba(107,107,138,.2)',icon:'🗑️',desc:'Cut these out' },
]

const css = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .q-card:hover .q-task-item{} 
  .q-task-item:hover{background:rgba(255,255,255,.05)!important}
  .q-task-item:active{transform:scale(.99)}
`

function classifyTask(task) {
  const isHighPriority = task.priority === 'HIGH'
  const isMediumPriority = task.priority === 'MEDIUM'
  const isDone = task.status === 'DONE'

  if (isDone) return null

  // Is urgent = high priority OR overdue
  const isUrgent = isHighPriority || (task.dueDate && new Date(task.dueDate) < new Date())
  // Is important = high or medium priority
  const isImportant = isHighPriority || isMediumPriority

  if (isUrgent && isImportant)   return 'do'
  if (!isUrgent && isImportant)  return 'schedule'
  if (isUrgent && !isImportant)  return 'delegate'
  return 'eliminate'
}

export default function EisenhowerMatrix({ tasks = [], onTaskClick }) {
  const [view, setView] = useState('matrix') // matrix | list

  const quadrantTasks = useMemo(() => {
    const groups = { do: [], schedule: [], delegate: [], eliminate: [] }
    tasks.forEach(t => {
      const q = classifyTask(t)
      if (q) groups[q].push(t)
    })
    return groups
  }, [tasks])

  const total = Object.values(quadrantTasks).flat().length

  return (
    <>
      <style>{css}</style>
      <div style={{animation:'fadeUp .4s ease'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <div>
            <h1 style={{fontSize:20,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:'0 0 4px'}}>
              🎯 Eisenhower Matrix
            </h1>
            <p style={{fontSize:12,color:'#6b6b8a',margin:0}}>
              {total} active tasks classified by urgency & importance
            </p>
          </div>
          <div style={{display:'flex',gap:4,background:'#111118',border:'1px solid rgba(255,255,255,.07)',
            borderRadius:12,padding:4}}>
            {['matrix','list'].map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{padding:'6px 14px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',
                  border:'none',transition:'all .15s',textTransform:'capitalize',
                  background:view===v?'linear-gradient(135deg,#7c3aed,#a855f7)':'transparent',
                  color:view===v?'#fff':'#6b6b8a'}}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Axis labels */}
        {view === 'matrix' && (
          <div style={{position:'relative'}}>
            {/* URGENT axis top */}
            <div style={{display:'flex',justifyContent:'space-around',marginBottom:4,paddingLeft:60}}>
              <span style={{fontSize:11,fontWeight:700,color:'#ff6b6b',letterSpacing:'2px'}}>URGENT</span>
              <span style={{fontSize:11,fontWeight:700,color:'#6b6b8a',letterSpacing:'2px'}}>NOT URGENT</span>
            </div>

            <div style={{display:'flex',gap:0}}>
              {/* IMPORTANT axis left */}
              <div style={{display:'flex',flexDirection:'column',justifyContent:'space-around',
                width:56,flexShrink:0,paddingRight:8}}>
                <span style={{fontSize:10,fontWeight:700,color:'#60a5fa',letterSpacing:'1px',
                  writingMode:'vertical-rl',transform:'rotate(180deg)',textAlign:'center'}}>IMPORTANT</span>
                <span style={{fontSize:10,fontWeight:700,color:'#6b6b8a',letterSpacing:'1px',
                  writingMode:'vertical-rl',transform:'rotate(180deg)',textAlign:'center'}}>NOT IMPORTANT</span>
              </div>

              {/* 2×2 Grid */}
              <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr',
                gridTemplateRows:'1fr 1fr',gap:8}}>
                {[QUADRANTS[0], QUADRANTS[1], QUADRANTS[2], QUADRANTS[3]].map((q, i) => {
                  const qTasks = quadrantTasks[q.key]
                  return (
                    <div key={q.key} className="q-card"
                      style={{background:q.bg,border:`1px solid ${q.border}`,borderRadius:16,
                        padding:'14px',minHeight:180,animation:`fadeUp .4s ease ${i*.1}s both`}}>
                      {/* Quadrant header */}
                      <div style={{marginBottom:12}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                          <span style={{fontSize:16}}>{q.icon}</span>
                          <span style={{fontSize:14,fontWeight:800,color:q.color,fontFamily:'Syne,sans-serif'}}>{q.label}</span>
                          <span style={{marginLeft:'auto',fontSize:11,fontWeight:700,
                            padding:'2px 8px',borderRadius:20,
                            background:`${q.color}20`,color:q.color}}>{qTasks.length}</span>
                        </div>
                        <p style={{fontSize:10,color:'#6b6b8a',margin:0,letterSpacing:'.5px'}}>{q.desc}</p>
                      </div>

                      {/* Tasks */}
                      <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:160,overflowY:'auto'}}>
                        {qTasks.length === 0 ? (
                          <p style={{fontSize:11,color:'#3d3d4a',textAlign:'center',padding:'12px 0'}}>No tasks here</p>
                        ) : qTasks.slice(0,8).map(t => (
                          <div key={t.id} className="q-task-item"
                            onClick={() => onTaskClick && onTaskClick(t)}
                            style={{padding:'7px 10px',borderRadius:9,cursor:'pointer',
                              background:'rgba(0,0,0,.2)',border:'1px solid rgba(255,255,255,.06)',
                              transition:'background .15s'}}>
                            <p style={{fontSize:12,fontWeight:600,color:'#f0f0f8',margin:'0 0 3px',
                              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                              {t.title}
                            </p>
                            <div style={{display:'flex',gap:5,alignItems:'center'}}>
                              {t.dueDate && (
                                <span style={{fontSize:9,color:new Date(t.dueDate)<new Date()?'#ff6b6b':'#6b6b8a',fontWeight:600}}>
                                  📅 {new Date(t.dueDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                                </span>
                              )}
                              <span style={{fontSize:9,padding:'1px 5px',borderRadius:4,
                                background:`${q.color}18`,color:q.color,fontWeight:700}}>{t.priority}</span>
                            </div>
                          </div>
                        ))}
                        {qTasks.length > 8 && (
                          <p style={{fontSize:10,color:'#6b6b8a',textAlign:'center',margin:0}}>+{qTasks.length-8} more</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {view === 'list' && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {QUADRANTS.map((q, qi) => (
              <div key={q.key} style={{background:'#111118',border:`1px solid ${q.border}`,
                borderRadius:16,overflow:'hidden',animation:`fadeUp .4s ease ${qi*.08}s both`}}>
                <div style={{padding:'14px 18px',background:q.bg,display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:18}}>{q.icon}</span>
                  <div>
                    <p style={{fontSize:14,fontWeight:800,color:q.color,fontFamily:'Syne,sans-serif',margin:'0 0 1px'}}>{q.label}</p>
                    <p style={{fontSize:11,color:'#6b6b8a',margin:0}}>{q.sub}</p>
                  </div>
                  <span style={{marginLeft:'auto',fontSize:12,fontWeight:800,
                    padding:'3px 10px',borderRadius:20,background:`${q.color}20`,color:q.color}}>
                    {quadrantTasks[q.key].length}
                  </span>
                </div>
                {quadrantTasks[q.key].length === 0 ? (
                  <p style={{padding:'14px 18px',fontSize:12,color:'#4b5563',margin:0}}>No tasks in this quadrant</p>
                ) : quadrantTasks[q.key].map(t => (
                  <div key={t.id} className="q-task-item"
                    onClick={() => onTaskClick && onTaskClick(t)}
                    style={{padding:'12px 18px',borderTop:'1px solid rgba(255,255,255,.04)',
                      cursor:'pointer',transition:'background .15s',
                      display:'flex',alignItems:'center',gap:12}}>
                    <div style={{flex:1}}>
                      <p style={{fontSize:13,fontWeight:600,color:'#f0f0f8',margin:'0 0 3px'}}>{t.title}</p>
                      <div style={{display:'flex',gap:8}}>
                        <span style={{fontSize:10,color:'#6b6b8a'}}>{t.status?.replace('_',' ')}</span>
                        {t.dueDate && <span style={{fontSize:10,color:new Date(t.dueDate)<new Date()?'#ff6b6b':'#6b6b8a'}}>
                          Due {new Date(t.dueDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                        </span>}
                      </div>
                    </div>
                    <span style={{fontSize:10,padding:'3px 9px',borderRadius:6,fontWeight:700,
                      background:`${q.color}15`,color:q.color}}>{t.priority}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <p style={{fontSize:11,color:'#4b5563',marginTop:14,textAlign:'center',lineHeight:1.7}}>
          Tasks are auto-classified: High priority = Important · Overdue = Urgent · Complete tasks to move them out
        </p>
      </div>
    </>
  )
}