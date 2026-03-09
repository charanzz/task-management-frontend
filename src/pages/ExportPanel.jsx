import React, { useState } from 'react'
import api from '../services/api'

const css = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes check{0%{transform:scale(0)}70%{transform:scale(1.2)}100%{transform:scale(1)}}
  .export-card:hover{border-color:rgba(124,58,237,.3)!important;transform:translateY(-2px)}
  .export-btn:hover{transform:translateY(-1px)!important;filter:brightness(1.1)}
  .export-btn:active{transform:translateY(0)!important}
`
function Spin({c='#fff'}){return<span style={{width:18,height:18,border:`2px solid ${c}33`,borderTopColor:c,borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/>}

export default function ExportPanel({ tasks = [] }) {
  const [loading, setLoading]   = useState({})
  const [done, setDone]         = useState({})
  const [filters, setFilters]   = useState({ status:'ALL', priority:'ALL' })

  const filtered = tasks.filter(t => {
    if (filters.status !== 'ALL' && t.status !== filters.status) return false
    if (filters.priority !== 'ALL' && t.priority !== filters.priority) return false
    return true
  })

  async function exportCSV() {
    setLoading(l=>({...l,csv:true}))
    try {
      const r = await api.get('/api/tasks/export/csv', { responseType:'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url; a.download = 'taskflow-tasks.csv'; a.click()
      URL.revokeObjectURL(url)
      setDone(d=>({...d,csv:true}))
      setTimeout(()=>setDone(d=>({...d,csv:false})),3000)
    } catch(e) { alert('Export failed. Please try again.') }
    setLoading(l=>({...l,csv:false}))
  }

  function exportJSON() {
    setLoading(l=>({...l,json:true}))
    try {
      const data = filtered.map(t => ({
        id: t.id, title: t.title, status: t.status, priority: t.priority,
        dueDate: t.dueDate, tags: t.tags, description: t.description,
        createdAt: t.createdAt, completedAt: t.completedAt,
        recurring: t.recurring, recurringInterval: t.recurringInterval,
      }))
      const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'})
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href=url; a.download='taskflow-tasks.json'; a.click()
      URL.revokeObjectURL(url)
      setDone(d=>({...d,json:true}))
      setTimeout(()=>setDone(d=>({...d,json:false})),3000)
    } catch(e) {}
    setLoading(l=>({...l,json:false}))
  }

  function exportMarkdown() {
    const lines = ['# My TaskFlow Tasks', '', `_Exported ${new Date().toLocaleDateString()}_`, '']
    const groups = {}
    filtered.forEach(t => {
      if (!groups[t.status]) groups[t.status] = []
      groups[t.status].push(t)
    })
    Object.entries(groups).forEach(([status, tasks]) => {
      lines.push(`## ${status.replace('_',' ')}`)
      tasks.forEach(t => {
        const check = t.status === 'DONE' ? '[x]' : '[ ]'
        lines.push(`- ${check} **${t.title}**${t.priority?' ('+t.priority+')':''}${t.dueDate?' — due '+new Date(t.dueDate).toLocaleDateString():''}`)
      })
      lines.push('')
    })
    const blob = new Blob([lines.join('\n')], {type:'text/markdown'})
    const url = URL.createObjectURL(blob); const a=document.createElement('a')
    a.href=url; a.download='taskflow-tasks.md'; a.click(); URL.revokeObjectURL(url)
    setDone(d=>({...d,md:true}))
    setTimeout(()=>setDone(d=>({...d,md:false})),3000)
  }

  const EXPORTS = [
    { key:'csv', icon:'📊', label:'CSV Spreadsheet', sub:'Open in Excel, Google Sheets', color:'#10b981', action:exportCSV,
      note:'All your tasks with status, priority, due dates, tags' },
    { key:'json', icon:'{ }', label:'JSON Data', sub:'For developers & backups', color:'#60a5fa', action:exportJSON,
      note:'Complete task data in machine-readable format' },
    { key:'md', icon:'📝', label:'Markdown', sub:'For Notion, Obsidian, GitHub', color:'#a855f7', action:exportMarkdown,
      note:'Formatted checklist — paste anywhere' },
  ]

  const statusOpts = ['ALL','TODO','IN_PROGRESS','DONE','CANCELLED']
  const prioOpts   = ['ALL','HIGH','MEDIUM','LOW']

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:580,margin:'0 auto',animation:'fadeUp .4s ease'}}>

        {/* Header */}
        <div style={{background:'linear-gradient(135deg,rgba(16,185,129,.08),rgba(96,165,250,.06))',
          border:'1px solid rgba(16,185,129,.2)',borderRadius:20,padding:'22px 24px',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:4}}>
            <div style={{width:44,height:44,borderRadius:13,background:'linear-gradient(135deg,#10b981,#059669)',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,
              boxShadow:'0 6px 20px rgba(16,185,129,.4)',flexShrink:0}}>📤</div>
            <div>
              <h1 style={{fontSize:20,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:'0 0 2px'}}>Export Tasks</h1>
              <p style={{fontSize:12,color:'#6b6b8a',margin:0}}>{tasks.length} total tasks · {filtered.length} matching filter</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:16,
          padding:'16px 18px',marginBottom:20}}>
          <p style={{fontSize:12,fontWeight:700,color:'#6b6b8a',margin:'0 0 12px',letterSpacing:'1px'}}>FILTER EXPORT</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <p style={{fontSize:11,color:'#6b6b8a',margin:'0 0 6px'}}>Status</p>
              <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))}
                style={{width:'100%',padding:'9px 12px',background:'#1a1a24',border:'1px solid rgba(255,255,255,.1)',
                  borderRadius:10,color:'#f0f0f8',fontSize:13,colorScheme:'dark',cursor:'pointer'}}>
                {statusOpts.map(o=><option key={o}>{o.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <p style={{fontSize:11,color:'#6b6b8a',margin:'0 0 6px'}}>Priority</p>
              <select value={filters.priority} onChange={e=>setFilters(f=>({...f,priority:e.target.value}))}
                style={{width:'100%',padding:'9px 12px',background:'#1a1a24',border:'1px solid rgba(255,255,255,.1)',
                  borderRadius:10,color:'#f0f0f8',fontSize:13,colorScheme:'dark',cursor:'pointer'}}>
                {prioOpts.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <p style={{fontSize:11,color:'#6b6b8a',margin:'10px 0 0'}}>
            {filtered.length} task{filtered.length!==1?'s':''} will be exported
          </p>
        </div>

        {/* Export options */}
        <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:20}}>
          {EXPORTS.map((ex, i) => (
            <div key={ex.key} className="export-card"
              style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:16,
                padding:'18px',transition:'all .2s',animation:`fadeUp .4s ease ${i*.08}s both`,
                display:'flex',alignItems:'center',gap:16}}>
              {/* Icon */}
              <div style={{width:48,height:48,borderRadius:14,flexShrink:0,
                background:`${ex.color}15`,border:`1px solid ${ex.color}33`,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:ex.key==='json'?16:22,fontWeight:800,color:ex.color,fontFamily:'Syne,sans-serif'}}>
                {ex.icon}
              </div>

              {/* Info */}
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:14,fontWeight:700,color:'#f0f0f8',margin:'0 0 2px'}}>{ex.label}</p>
                <p style={{fontSize:11,color:'#6b6b8a',margin:'0 0 4px'}}>{ex.sub}</p>
                <p style={{fontSize:10,color:'#4b5563',margin:0,lineHeight:1.5}}>{ex.note}</p>
              </div>

              {/* Button */}
              <button className="export-btn" onClick={ex.action}
                disabled={loading[ex.key]}
                style={{padding:'10px 18px',borderRadius:12,border:'none',flexShrink:0,
                  background:done[ex.key]?'rgba(107,203,119,.15)':loading[ex.key]?'#1a1a24':`${ex.color}15`,
                  color:done[ex.key]?'#6bcb77':loading[ex.key]?'#6b6b8a':ex.color,
                  border:`1px solid ${done[ex.key]?'rgba(107,203,119,.3)':ex.color+'33'}`,
                  fontSize:13,fontWeight:700,cursor:loading[ex.key]?'default':'pointer',
                  display:'flex',alignItems:'center',gap:6,transition:'all .2s',whiteSpace:'nowrap'}}>
                {loading[ex.key] ? <Spin c={ex.color}/> : done[ex.key] ? '✓ Done!' : '⬇ Export'}
              </button>
            </div>
          ))}
        </div>

        {/* Stats summary */}
        <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.06)',borderRadius:16,padding:'16px 18px'}}>
          <p style={{fontSize:12,fontWeight:700,color:'#6b6b8a',margin:'0 0 12px',letterSpacing:'1px'}}>TASK SUMMARY</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            {[
              { label:'Total', val:tasks.length, color:'#f0f0f8' },
              { label:'Done', val:tasks.filter(t=>t.status==='DONE').length, color:'#6bcb77' },
              { label:'Pending', val:tasks.filter(t=>t.status==='TODO'||t.status==='IN_PROGRESS').length, color:'#ffd93d' },
              { label:'High Pri', val:tasks.filter(t=>t.priority==='HIGH').length, color:'#ff6b6b' },
            ].map(s => (
              <div key={s.label} style={{textAlign:'center',padding:'10px 8px',
                background:'rgba(255,255,255,.03)',borderRadius:10,border:'1px solid rgba(255,255,255,.06)'}}>
                <p style={{fontSize:22,fontWeight:800,color:s.color,fontFamily:'Syne,sans-serif',margin:'0 0 2px'}}>{s.val}</p>
                <p style={{fontSize:10,color:'#6b6b8a',margin:0,letterSpacing:'1px'}}>{s.label.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}