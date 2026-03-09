import React, { useState, useEffect } from 'react'
import api from '../services/api'

const PRESET_HABITS = [
  { emoji:'💧', title:'Drink 8 glasses of water', color:'#60a5fa' },
  { emoji:'🏃', title:'Exercise 30 minutes',       color:'#6bcb77' },
  { emoji:'📖', title:'Read for 20 minutes',        color:'#f59e0b' },
  { emoji:'🧘', title:'Meditate',                   color:'#a855f7' },
  { emoji:'😴', title:'Sleep by 11pm',              color:'#6366f1' },
  { emoji:'✍️', title:'Journal daily',              color:'#ec4899' },
  { emoji:'🥗', title:'Eat healthy meals',          color:'#10b981' },
  { emoji:'📵', title:'No phone before bed',        color:'#ff6b6b' },
]
const COLORS = ['#7c3aed','#a855f7','#60a5fa','#6bcb77','#f59e0b','#ef4444','#ec4899','#10b981','#6366f1','#14b8a6']
const EMOJIS = ['✅','💧','🏃','📖','🧘','😴','✍️','🥗','📵','🎯','💪','🎨','🎵','🧠','❤️']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function Spin() {
  return <span style={{width:20,height:20,border:'2px solid #a855f7',borderTopColor:'transparent',
    borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/>
}

const css = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes checkPop{0%{transform:scale(0) rotate(-20deg)}70%{transform:scale(1.2) rotate(5deg)}100%{transform:scale(1) rotate(0)}}
  @keyframes streakGlow{0%,100%{box-shadow:0 0 8px currentColor}50%{box-shadow:0 0 20px currentColor}}
  .habit-card:hover{border-color:var(--hc,rgba(124,58,237,.3))!important;transform:translateY(-1px)}
  .check-btn:hover{transform:scale(1.08)!important}
  .check-btn:active{transform:scale(.95)!important}
  .preset-row:hover{background:rgba(124,58,237,.08)!important;border-color:rgba(124,58,237,.25)!important}
  .del-btn:hover{background:rgba(255,107,107,.15)!important;color:#ff6b6b!important}
  .color-sw:hover{transform:scale(1.2)!important}
`

export default function HabitTracker() {
  const [habits, setHabits]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [showNew, setShowNew]   = useState(false)
  const [toggling, setToggling] = useState({})
  const [form, setForm]         = useState({ title:'', emoji:'✅', color:'#7c3aed' })
  const [saving, setSaving]     = useState(false)
  const [showPresets, setShowPresets] = useState(true)

  const load = () => {
    api.get('/api/habits').then(r => { setHabits(r.data); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(load, [])

  async function toggle(id) {
    setToggling(t => ({...t,[id]:true}))
    try {
      const r = await api.post(`/api/habits/${id}/toggle`)
      setHabits(hs => hs.map(h => h.id===id
        ? {...h, doneToday:r.data.doneToday, currentStreak:r.data.streak,
            week:h.week.map((d,i) => i===6 ? {...d, done:r.data.doneToday} : d)}
        : h))
    } catch(e) {}
    setToggling(t => ({...t,[id]:false}))
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await api.post('/api/habits', form)
      setShowNew(false)
      setForm({ title:'', emoji:'✅', color:'#7c3aed' })
      load()
    } catch(e) {}
    setSaving(false)
  }

  async function remove(id) {
    await api.delete(`/api/habits/${id}`)
    setHabits(hs => hs.filter(h => h.id !== id))
  }

  const doneToday  = habits.filter(h => h.doneToday).length
  const totalToday = habits.length
  const pct        = totalToday ? Math.round(doneToday/totalToday*100) : 0

  const today = new Date()

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:660,margin:'0 auto',animation:'fadeUp .4s ease'}}>

        {/* Header card */}
        <div style={{background:'linear-gradient(135deg,rgba(124,58,237,.1),rgba(16,185,129,.06))',
          border:'1px solid rgba(124,58,237,.2)',borderRadius:20,padding:'22px 24px',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div>
              <h1 style={{fontSize:20,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:'0 0 4px'}}>
                🔥 Habit Tracker
              </h1>
              <p style={{fontSize:12,color:'#6b6b8a',margin:0}}>
                {today.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
              </p>
            </div>
            <button onClick={() => setShowNew(s=>!s)}
              style={{padding:'9px 18px',borderRadius:12,border:'none',
                background:'linear-gradient(135deg,#7c3aed,#a855f7)',
                color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',
                boxShadow:'0 4px 16px rgba(124,58,237,.4)'}}>
              + New Habit
            </button>
          </div>

          {/* Progress bar */}
          {totalToday > 0 && (
            <div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontSize:12,color:'#6b6b8a',fontWeight:600}}>Today's progress</span>
                <span style={{fontSize:12,fontWeight:700,color:pct===100?'#6bcb77':'#a855f7'}}>{doneToday}/{totalToday} done</span>
              </div>
              <div style={{height:8,background:'rgba(255,255,255,.06)',borderRadius:4,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:4,transition:'width .6s ease',
                  width:`${pct}%`,
                  background:pct===100?'linear-gradient(90deg,#6bcb77,#10b981)':'linear-gradient(90deg,#7c3aed,#a855f7)'}}/>
              </div>
              {pct===100 && (
                <p style={{fontSize:12,color:'#6bcb77',margin:'8px 0 0',fontWeight:600,textAlign:'center'}}>
                  🎉 All habits done today! You're on fire!
                </p>
              )}
            </div>
          )}
        </div>

        {/* New habit form */}
        {showNew && (
          <div style={{background:'#111118',border:'1px solid rgba(124,58,237,.2)',borderRadius:18,
            padding:20,marginBottom:20,animation:'fadeUp .3s ease'}}>
            <p style={{fontSize:14,fontWeight:700,color:'#f0f0f8',margin:'0 0 14px'}}>Create New Habit</p>

            {/* Presets */}
            {showPresets && (
              <div style={{marginBottom:16}}>
                <p style={{fontSize:11,color:'#6b6b8a',margin:'0 0 8px',fontWeight:600,letterSpacing:'1px'}}>QUICK START</p>
                <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:200,overflowY:'auto'}}>
                  {PRESET_HABITS.map(p => (
                    <button key={p.title} className="preset-row"
                      onClick={() => { setForm({title:p.title,emoji:p.emoji,color:p.color}); setShowPresets(false) }}
                      style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',
                        background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',
                        borderRadius:10,cursor:'pointer',textAlign:'left',transition:'all .15s'}}>
                      <span style={{fontSize:18}}>{p.emoji}</span>
                      <span style={{fontSize:13,color:'#f0f0f8',fontWeight:500}}>{p.title}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowPresets(false)}
                  style={{marginTop:8,background:'none',border:'none',color:'#6b6b8a',fontSize:12,cursor:'pointer'}}>
                  Or create custom →
                </button>
              </div>
            )}

            {!showPresets && (
              <>
                {/* Emoji picker */}
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setForm(f=>({...f,emoji:e}))}
                      style={{width:36,height:36,borderRadius:9,fontSize:18,cursor:'pointer',
                        background:form.emoji===e?'rgba(124,58,237,.2)':'rgba(255,255,255,.04)',
                        border:`2px solid ${form.emoji===e?'#7c3aed':'transparent'}`,transition:'all .15s'}}>
                      {e}
                    </button>
                  ))}
                </div>

                {/* Title */}
                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                  placeholder="Habit name e.g. Drink 8 glasses of water"
                  onKeyDown={e=>e.key==='Enter'&&save()}
                  style={{width:'100%',padding:'12px 14px',background:'#1a1a24',
                    border:'1px solid rgba(255,255,255,.1)',borderRadius:11,color:'#f0f0f8',
                    fontSize:14,marginBottom:12,boxSizing:'border-box',fontFamily:'DM Sans,sans-serif'}}/>

                {/* Color */}
                <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
                  {COLORS.map(c => (
                    <button key={c} className="color-sw" onClick={() => setForm(f=>({...f,color:c}))}
                      style={{width:26,height:26,borderRadius:8,background:c,cursor:'pointer',
                        border:form.color===c?'3px solid #fff':'3px solid transparent',
                        transition:'transform .15s'}}/>
                  ))}
                </div>
              </>
            )}

            <div style={{display:'flex',gap:8}}>
              <button onClick={() => { setShowNew(false); setShowPresets(true); setForm({title:'',emoji:'✅',color:'#7c3aed'}) }}
                style={{flex:1,padding:'11px',borderRadius:11,background:'transparent',
                  border:'1px solid rgba(255,255,255,.1)',color:'#6b6b8a',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                Cancel
              </button>
              <button onClick={save} disabled={!form.title.trim()||saving}
                style={{flex:2,padding:'11px',borderRadius:11,border:'none',
                  background:form.title.trim()?'linear-gradient(135deg,#7c3aed,#a855f7)':'#22222f',
                  color:'#fff',fontSize:13,fontWeight:700,cursor:form.title.trim()?'pointer':'default',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                {saving ? <Spin/> : `${form.emoji} Add Habit`}
              </button>
            </div>
          </div>
        )}

        {/* Habit list */}
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:48}}><Spin/></div>
        ) : habits.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 24px',background:'#111118',
            border:'1px solid rgba(255,255,255,.06)',borderRadius:18}}>
            <p style={{fontSize:48,marginBottom:12}}>🌱</p>
            <p style={{fontSize:16,fontWeight:700,color:'#f0f0f8',margin:'0 0 6px'}}>No habits yet</p>
            <p style={{fontSize:13,color:'#6b6b8a',margin:'0 0 20px'}}>Start building your best self — add your first habit!</p>
            <button onClick={() => setShowNew(true)}
              style={{padding:'11px 24px',borderRadius:12,border:'none',
                background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',
                fontSize:14,fontWeight:700,cursor:'pointer'}}>
              + Add First Habit
            </button>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {habits.map((h, idx) => (
              <div key={h.id} className="habit-card"
                style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',
                  borderRadius:18,padding:'16px 18px',transition:'all .2s',
                  '--hc': h.color+'44',
                  animation:`fadeUp .4s ease ${idx*.06}s both`}}>

                <div style={{display:'flex',alignItems:'center',gap:14}}>
                  {/* Check button */}
                  <button className="check-btn" onClick={() => toggle(h.id)}
                    disabled={toggling[h.id]}
                    style={{width:48,height:48,borderRadius:14,flexShrink:0,cursor:'pointer',
                      border:`2px solid ${h.doneToday?h.color:'rgba(255,255,255,.12)'}`,
                      background:h.doneToday?`linear-gradient(135deg,${h.color},${h.color}99)`:'transparent',
                      fontSize:22,display:'flex',alignItems:'center',justifyContent:'center',
                      transition:'all .25s',
                      boxShadow:h.doneToday?`0 4px 16px ${h.color}44`:'none',
                      animation:h.doneToday?'none':'none'}}>
                    {toggling[h.id] ? <Spin/> : h.doneToday ? '✓' : h.emoji}
                  </button>

                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                      <p style={{fontSize:14,fontWeight:700,color:h.doneToday?h.color:'#f0f0f8',
                        margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                        textDecoration:h.doneToday?'none':'none',transition:'color .2s'}}>
                        {h.title}
                      </p>
                      {h.currentStreak > 0 && (
                        <span style={{fontSize:11,padding:'2px 8px',borderRadius:20,flexShrink:0,
                          background:`${h.color}18`,color:h.color,fontWeight:700,
                          border:`1px solid ${h.color}33`}}>
                          🔥 {h.currentStreak}d
                        </span>
                      )}
                    </div>
                    {/* 7-day grid */}
                    <div style={{display:'flex',gap:4,alignItems:'center'}}>
                      {h.week.map((day, i) => {
                        const d = new Date(day.date+'T00:00:00')
                        return (
                          <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                            <span style={{fontSize:9,color:'#4b5563',fontWeight:600,textTransform:'uppercase'}}>
                              {DAYS[d.getDay()]}
                            </span>
                            <div style={{width:22,height:22,borderRadius:6,transition:'all .2s',
                              background:day.done?`linear-gradient(135deg,${h.color},${h.color}99)`:'rgba(255,255,255,.06)',
                              border:`1px solid ${day.done?h.color+'55':'rgba(255,255,255,.08)'}`,
                              display:'flex',alignItems:'center',justifyContent:'center',fontSize:10}}>
                              {day.done && <span style={{color:'#fff',fontWeight:800}}>✓</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Stats + delete */}
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,flexShrink:0}}>
                    <div style={{textAlign:'right'}}>
                      <p style={{fontSize:16,fontWeight:800,color:h.color,fontFamily:'Syne,sans-serif',margin:'0 0 1px'}}>{h.totalDone}</p>
                      <p style={{fontSize:9,color:'#4b5563',margin:0,letterSpacing:'1px'}}>TOTAL</p>
                    </div>
                    <button className="del-btn" onClick={() => remove(h.id)}
                      style={{width:28,height:28,borderRadius:8,background:'transparent',
                        border:'1px solid rgba(255,255,255,.08)',color:'#4b5563',fontSize:12,
                        display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .15s'}}>
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {habits.length > 0 && (
          <div style={{marginTop:16,padding:'12px 16px',background:'rgba(124,58,237,.05)',
            border:'1px solid rgba(124,58,237,.1)',borderRadius:12}}>
            <p style={{fontSize:11,color:'#6b6b8a',margin:0,lineHeight:1.7}}>
              💡 <strong style={{color:'#a855f7'}}>Pro tip:</strong> Check off habits every day to build streaks. Missing a day resets your streak — consistency is everything!
            </p>
          </div>
        )}
      </div>
    </>
  )
}