import React, { useState } from 'react'
import api from '../services/api'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  @keyframes pop{0%{transform:scale(.85);opacity:0}70%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
  .goal-input:focus{border-color:#7c3aed!important;outline:none;box-shadow:0 0 0 3px rgba(124,58,237,.15)!important}
  .sub-row{transition:all .15s}
  .sub-row:hover{background:rgba(124,58,237,.06)!important;transform:translateX(3px)}
  .pri-badge{font-size:10px;padding:2px 8px;border-radius:6px;font-weight:700;letter-spacing:.5px}
  .save-btn:hover{transform:translateY(-2px)!important;box-shadow:0 10px 30px rgba(124,58,237,.5)!important}
  .try-btn:hover{background:rgba(124,58,237,.15)!important}
  .edit-input{background:transparent;border:none;border-bottom:1px solid rgba(124,58,237,.3);
    color:#f0f0f8;font-size:13px;font-family:DM Sans,sans-serif;padding:2px 4px;width:100%}
  .edit-input:focus{outline:none;border-bottom-color:#7c3aed}
`

const PRI_STYLE = {
  HIGH:   { bg:'rgba(255,107,107,.12)', color:'#ff6b6b', border:'rgba(255,107,107,.25)' },
  MEDIUM: { bg:'rgba(255,217,61,.10)',  color:'#ffd93d', border:'rgba(255,217,61,.25)'  },
  LOW:    { bg:'rgba(107,203,119,.10)', color:'#6bcb77', border:'rgba(107,203,119,.25)' },
}

const EXAMPLES = [
  'Launch my personal portfolio website',
  'Prepare for a software engineering interview',
  'Build a habit of exercising daily',
  'Learn React JS from scratch',
  'Plan and execute a team product launch',
]

function Spin() {
  return <span style={{width:18,height:18,border:'2px solid #a855f7',borderTopColor:'transparent',
    borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/>
}

export default function AITaskBreakdown({ onSaved }) {
  const [goal,      setGoal]      = useState('')
  const [subtasks,  setSubtasks]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [saved,     setSaved]     = useState(false)
  const [editIdx,   setEditIdx]   = useState(null)

  async function generate() {
    if (!goal.trim()) return
    setLoading(true)
    setError('')
    setSubtasks([])
    setSaved(false)
    try {
      const res = await api.post('/api/ai-breakdown', { goal })
      const parsed = JSON.parse(res.data.subtasks)
      setSubtasks(parsed.map((s,i) => ({ ...s, id:i, checked:true })))
    } catch(e) {
      setError('Could not generate breakdown. Try again.')
    }
    setLoading(false)
  }

  async function saveAll() {
    setSaving(true)
    try {
      const toSave = subtasks.filter(s => s.checked)
      await api.post('/api/ai-breakdown/save', { goal, subtasks: toSave })
      setSaved(true)
      if (onSaved) onSaved()
    } catch(e) {
      setError('Failed to save. Please try again.')
    }
    setSaving(false)
  }

  function updateSubtask(idx, field, val) {
    setSubtasks(p => p.map((s,i) => i===idx ? {...s,[field]:val} : s))
  }

  function toggleCheck(idx) {
    setSubtasks(p => p.map((s,i) => i===idx ? {...s, checked:!s.checked} : s))
  }

  function removeSubtask(idx) {
    setSubtasks(p => p.filter((_,i) => i!==idx))
  }

  function addSubtask() {
    setSubtasks(p => [...p, { id:Date.now(), title:'New subtask', priority:'MEDIUM', estimatedHours:1, checked:true }])
    setEditIdx(subtasks.length)
  }

  const checkedCount = subtasks.filter(s => s.checked).length

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:680,margin:'0 auto',fontFamily:'DM Sans,sans-serif',animation:'fadeUp .4s ease'}}>

        {/* Header */}
        <div style={{marginBottom:28}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
            <span style={{fontSize:32}}>🧠</span>
            <div>
              <h2 style={{margin:0,fontSize:24,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif'}}>
                AI Task Breakdown
              </h2>
              <p style={{margin:0,fontSize:13,color:'#6b6b8a'}}>
                Type any goal — AI breaks it into actionable steps
              </p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.08)',borderRadius:18,padding:24,marginBottom:20}}>
          <label style={{fontSize:12,fontWeight:700,color:'#6b6b8a',letterSpacing:'1px',textTransform:'uppercase',display:'block',marginBottom:10}}>
            Your Goal
          </label>
          <textarea
            className="goal-input"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            onKeyDown={e => e.key==='Enter' && !e.shiftKey && (e.preventDefault(), generate())}
            placeholder="e.g. Launch my portfolio website, Prepare for interviews, Learn a new skill..."
            rows={3}
            style={{width:'100%',boxSizing:'border-box',background:'rgba(255,255,255,.03)',
              border:'1px solid rgba(255,255,255,.1)',borderRadius:12,padding:'12px 14px',
              color:'#f0f0f8',fontSize:15,fontFamily:'DM Sans,sans-serif',resize:'vertical',
              lineHeight:1.6,transition:'all .2s'}}
          />

          {/* Example chips */}
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:12,marginBottom:16}}>
            {EXAMPLES.map(ex => (
              <button key={ex} className="try-btn" onClick={() => setGoal(ex)}
                style={{padding:'5px 12px',borderRadius:20,border:'1px solid rgba(255,255,255,.1)',
                  background:'transparent',color:'#6b6b8a',fontSize:11,cursor:'pointer',
                  fontFamily:'DM Sans,sans-serif',transition:'all .15s',whiteSpace:'nowrap'}}>
                {ex}
              </button>
            ))}
          </div>

          <button onClick={generate} disabled={loading || !goal.trim()}
            style={{width:'100%',padding:'13px',borderRadius:12,border:'none',cursor:loading||!goal.trim()?'not-allowed':'pointer',
              background:loading||!goal.trim()?'rgba(124,58,237,.3)':'linear-gradient(135deg,#7c3aed,#a855f7)',
              color:'#fff',fontSize:15,fontWeight:700,fontFamily:'DM Sans,sans-serif',
              display:'flex',alignItems:'center',justifyContent:'center',gap:10,transition:'all .2s'}}>
            {loading ? <><Spin/> Generating breakdown…</> : '✨ Break It Down with AI'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{padding:'12px 16px',borderRadius:10,background:'rgba(255,107,107,.1)',
            border:'1px solid rgba(255,107,107,.2)',color:'#ff6b6b',fontSize:13,marginBottom:16}}>
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {subtasks.length > 0 && (
          <div style={{animation:'fadeUp .3s ease'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div>
                <h3 style={{margin:'0 0 2px',fontSize:16,fontWeight:700,color:'#f0f0f8'}}>
                  {subtasks.length} Steps Generated
                </h3>
                <p style={{margin:0,fontSize:12,color:'#6b6b8a'}}>
                  {checkedCount} selected · Click to edit · Uncheck to skip
                </p>
              </div>
              <button onClick={addSubtask}
                style={{padding:'7px 14px',borderRadius:9,border:'1px solid rgba(124,58,237,.3)',
                  background:'rgba(124,58,237,.08)',color:'#a78bfa',fontSize:12,fontWeight:600,
                  cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>
                + Add Step
              </button>
            </div>

            <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:18,overflow:'hidden',marginBottom:16}}>
              {subtasks.map((s,i) => {
                const pri = PRI_STYLE[s.priority] || PRI_STYLE.MEDIUM
                const isEditing = editIdx === i
                return (
                  <div key={s.id} className="sub-row"
                    style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',
                      borderBottom:i<subtasks.length-1?'1px solid rgba(255,255,255,.05)':'none',
                      background:s.checked?'transparent':'rgba(255,255,255,.01)',
                      opacity:s.checked?1:.5,animation:`pop .2s ease ${i*0.05}s both`}}>

                    {/* Checkbox */}
                    <div onClick={() => toggleCheck(i)}
                      style={{width:20,height:20,borderRadius:6,border:`2px solid ${s.checked?'#7c3aed':'rgba(255,255,255,.2)'}`,
                        background:s.checked?'#7c3aed':'transparent',cursor:'pointer',flexShrink:0,
                        display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}>
                      {s.checked && <span style={{color:'#fff',fontSize:12,lineHeight:1}}>✓</span>}
                    </div>

                    {/* Step number */}
                    <span style={{width:24,height:24,borderRadius:'50%',background:'rgba(124,58,237,.15)',
                      color:'#a78bfa',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',
                      justifyContent:'center',flexShrink:0}}>{i+1}</span>

                    {/* Title */}
                    <div style={{flex:1,minWidth:0}}>
                      {isEditing ? (
                        <input className="edit-input" autoFocus
                          value={s.title}
                          onChange={e => updateSubtask(i,'title',e.target.value)}
                          onBlur={() => setEditIdx(null)}
                          onKeyDown={e => e.key==='Enter' && setEditIdx(null)}
                        />
                      ) : (
                        <p onClick={() => setEditIdx(i)} style={{margin:0,fontSize:13,fontWeight:500,
                          color:s.checked?'#f0f0f8':'#6b6b8a',cursor:'text',
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {s.title}
                        </p>
                      )}
                      <p style={{margin:'2px 0 0',fontSize:11,color:'#4b5563'}}>
                        ~{s.estimatedHours}h estimated
                      </p>
                    </div>

                    {/* Priority selector */}
                    <select value={s.priority} onChange={e => updateSubtask(i,'priority',e.target.value)}
                      style={{background:pri.bg,border:`1px solid ${pri.border}`,color:pri.color,
                        borderRadius:8,padding:'4px 8px',fontSize:11,fontWeight:700,cursor:'pointer',
                        fontFamily:'DM Sans,sans-serif'}}>
                      <option value="HIGH">🔴 HIGH</option>
                      <option value="MEDIUM">🟡 MED</option>
                      <option value="LOW">🟢 LOW</option>
                    </select>

                    {/* Delete */}
                    <button onClick={() => removeSubtask(i)}
                      style={{width:28,height:28,borderRadius:7,border:'1px solid rgba(255,107,107,.2)',
                        background:'rgba(255,107,107,.06)',color:'#ff6b6b',fontSize:14,cursor:'pointer',
                        display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      ×
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Summary bar */}
            <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
              {['HIGH','MEDIUM','LOW'].map(p => {
                const count = subtasks.filter(s=>s.priority===p && s.checked).length
                if (!count) return null
                const pri = PRI_STYLE[p]
                return (
                  <div key={p} style={{padding:'6px 14px',borderRadius:10,background:pri.bg,
                    border:`1px solid ${pri.border}`,color:pri.color,fontSize:12,fontWeight:700}}>
                    {p === 'HIGH'?'🔴':p==='MEDIUM'?'🟡':'🟢'} {count} {p}
                  </div>
                )
              })}
              <div style={{padding:'6px 14px',borderRadius:10,background:'rgba(124,58,237,.1)',
                border:'1px solid rgba(124,58,237,.2)',color:'#a78bfa',fontSize:12,fontWeight:700}}>
                ⏱ ~{subtasks.filter(s=>s.checked).reduce((a,s)=>a+(s.estimatedHours||1),0)}h total
              </div>
            </div>

            {/* Save button */}
            {saved ? (
              <div style={{textAlign:'center',padding:'20px',borderRadius:14,
                background:'rgba(107,203,119,.08)',border:'1px solid rgba(107,203,119,.2)'}}>
                <p style={{fontSize:24,margin:'0 0 6px'}}>🎉</p>
                <p style={{fontSize:15,fontWeight:700,color:'#6bcb77',margin:'0 0 4px'}}>
                  Saved to your tasks!
                </p>
                <p style={{fontSize:12,color:'#6b6b8a',margin:0}}>
                  {checkedCount} steps added — go to Tasks to start
                </p>
              </div>
            ) : (
              <button className="save-btn" onClick={saveAll} disabled={saving || checkedCount===0}
                style={{width:'100%',padding:'14px',borderRadius:12,border:'none',
                  cursor:saving||checkedCount===0?'not-allowed':'pointer',
                  background:saving||checkedCount===0?'rgba(124,58,237,.3)':'linear-gradient(135deg,#7c3aed,#a855f7)',
                  color:'#fff',fontSize:15,fontWeight:700,fontFamily:'DM Sans,sans-serif',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:10,transition:'all .25s'}}>
                {saving ? <><Spin/> Saving…</> : `🚀 Save ${checkedCount} Step${checkedCount!==1?'s':''} to Tasks`}
              </button>
            )}
          </div>
        )}

        {/* Idle state */}
        {subtasks.length === 0 && !loading && (
          <div style={{textAlign:'center',padding:'48px 24px',background:'#111118',
            border:'1px solid rgba(255,255,255,.06)',borderRadius:18}}>
            <div style={{fontSize:56,marginBottom:16}}>🎯</div>
            <p style={{fontSize:16,fontWeight:700,color:'#f0f0f8',margin:'0 0 8px',fontFamily:'Syne,sans-serif'}}>
              Any goal, broken down in seconds
            </p>
            <p style={{fontSize:13,color:'#6b6b8a',maxWidth:320,margin:'0 auto',lineHeight:1.7}}>
              Type your goal above and AI will create a clear, prioritized action plan you can save directly to your tasks
            </p>
          </div>
        )}
      </div>
    </>
  )
}