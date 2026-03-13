import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import AIPanel from './AIPanel'
import AnalyticsPanel from './AnalyticsPanel'
import TeamsPanel from './TeamsPanel'
import AdminDashboard from './AdminDashboard'
import NotificationBell from './NotificationBell'
import ProfilePage from './ProfilePage'
import DailyFocus from './DailyFocus'
import WeeklyReview from './WeeklyReview'
import PomodoroTimer from './PomodoroTimer'
import Leaderboard from './Leaderboard'
import OnboardingWizard from './OnboardingWizard'
import HabitTracker from './HabitTracker'
import CalendarView from './CalendarView'
import EisenhowerMatrix from './EisenhowerMatrix'
import ExportPanel from './ExportPanel'
import SmartReminders from './SmartReminders'
import AdvancedAnalytics from './AdvancedAnalytics'
import GoogleCalendarSync from './GoogleCalendarSync'
import EmailToTask from './EmailToTask'
import AITaskBreakdown from './AITaskBreakdown'

// ── Constants ────────────────────────────────────────────────
const PRI = {
  HIGH:   { color:'#ff6b6b', bg:'rgba(255,107,107,.12)', label:'High',   pts:30, emoji:'🔴' },
  MEDIUM: { color:'#ffd93d', bg:'rgba(255,217,61,.12)',  label:'Medium', pts:15, emoji:'🟡' },
  LOW:    { color:'#6bcb77', bg:'rgba(107,203,119,.12)', label:'Low',    pts:5,  emoji:'🟢' },
}
const STATUS = {
  TODO:        { color:'#a78bfa', label:'To Do',       emoji:'📋' },
  IN_PROGRESS: { color:'#60a5fa', label:'In Progress', emoji:'⚡' },
  DONE:        { color:'#6bcb77', label:'Done',        emoji:'✅' },
}
const LVL = ['','Novice','Apprentice','Achiever','Hustler','Warrior','Champion','Master','Elite','Legend','God Mode']

// ── Styles ───────────────────────────────────────────────────
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#060608;--surface:#0e0e14;--surface2:#16161f;--surface3:#1e1e2a;--surface4:#252533;
    --border:rgba(255,255,255,.05);--border2:rgba(255,255,255,.09);--border3:rgba(255,255,255,.14);
    --text:#eeeef5;--text2:#c4c4d4;--muted:#52526e;--muted2:#7474a0;
    --accent:#6d28d9;--accent2:#8b5cf6;--accent3:#a78bfa;--accent4:#c4b5fd;
    --glow:rgba(109,40,217,.4);--glow2:rgba(139,92,246,.25);
    --danger:#f43f5e;--danger2:rgba(244,63,94,.12);
    --warn:#f59e0b;--warn2:rgba(245,158,11,.12);
    --success:#10b981;--success2:rgba(16,185,129,.12);
    --blue:#3b82f6;--blue2:rgba(59,130,246,.12);
    --radius:16px;--radius2:12px;--radius3:8px;
    --sidebar-w:248px;
  }
  body{background:var(--bg);color:var(--text);font-family:'Space Grotesk',sans-serif;-webkit-font-smoothing:antialiased}

  /* ── Keyframes ── */
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  @keyframes modalIn{from{opacity:0;transform:scale(.97) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
  @keyframes slideRight{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
  @keyframes pulseRing{0%,100%{box-shadow:0 0 0 0 rgba(109,40,217,.5)}70%{box-shadow:0 0 0 10px rgba(109,40,217,0)}}
  @keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes gradMove{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
  @keyframes taskPop{0%{opacity:0;transform:scale(.97) translateY(6px)}100%{opacity:1;transform:scale(1) translateY(0)}}

  /* ── Scrollbar ── */
  ::-webkit-scrollbar{width:3px;height:3px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:var(--surface4);border-radius:4px}

  /* ── Base elements ── */
  button,input,select,textarea{font-family:'Space Grotesk',sans-serif}

  /* ── Skeleton ── */
  .skel{background:linear-gradient(90deg,var(--surface2) 0%,var(--surface3) 50%,var(--surface2) 100%);background-size:400px 100%;animation:shimmer 1.6s ease infinite;border-radius:var(--radius2)}

  /* ── Sidebar ── */
  .sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:99;backdrop-filter:blur(8px)}
  .nav-item{transition:all .14s ease!important}
  .nav-item:hover{background:var(--surface3)!important;color:var(--text2)!important}
  .nav-group-btn:hover{background:rgba(255,255,255,.04)!important}

  /* ── Task rows ── */
  .task-row{transition:all .16s ease!important}
  .task-row:hover{background:var(--surface2)!important;border-color:var(--border2)!important;transform:translateX(2px)}
  .task-row:hover .task-actions{opacity:1!important}
  .task-actions{opacity:0;transition:opacity .16s}

  /* ── Kanban ── */
  .kcard{cursor:grab;transition:all .16s ease}
  .kcard:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.4)!important}
  .kcard:active{cursor:grabbing;opacity:.8;transform:scale(.98)}
  .kcol.dragover{background:rgba(109,40,217,.07)!important;border-color:rgba(109,40,217,.35)!important}

  /* ── Buttons ── */
  .btn-primary{transition:all .18s ease}
  .btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 20px var(--glow)!important}
  .btn-primary:active{transform:translateY(0)}
  .btn-ghost:hover{background:var(--surface3)!important;color:var(--text2)!important}

  /* ── Filter pills ── */
  .filter-pill{transition:all .14s ease}
  .filter-pill:hover{border-color:var(--border3)!important;color:var(--text2)!important}

  /* ── Calendar ── */
  .cal-day:hover{background:var(--surface3)!important;border-color:var(--border2)!important}

  /* ── Stat cards ── */
  .stat-card{transition:all .2s ease}
  .stat-card:hover{transform:translateY(-3px);border-color:var(--border2)!important}

  /* ── Pomodoro mini-bar ── */
  @keyframes pomPulse{0%,100%{box-shadow:0 0 0 0 rgba(109,40,217,.5)}70%{box-shadow:0 0 0 12px rgba(109,40,217,0)}}
  .pom-minibar{animation:pomPulse 2.5s infinite}

  /* ── Empty state ── */
  .empty-state-btn:hover{transform:translateY(-2px)!important;box-shadow:0 10px 30px var(--glow)!important}

  /* ── FAB ── */
  .fab{display:none;position:fixed;bottom:90px;right:20px;z-index:50;width:52px;height:52px;border-radius:15px;
    background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:24px;
    align-items:center;justify-content:center;
    box-shadow:0 8px 32px var(--glow);border:none;cursor:pointer;transition:all .18s}
  .fab:hover{transform:scale(1.08) translateY(-2px);box-shadow:0 12px 40px var(--glow)}
  .fab:active{transform:scale(.94)}

  /* ── Bottom nav ── */
  .bnav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:50;
    background:var(--surface);border-top:1px solid var(--border);
    padding:6px 0 env(safe-area-inset-bottom,6px);backdrop-filter:blur(24px);
    -webkit-backdrop-filter:blur(24px)}
  .bnav-btn{display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 0;
    background:none;border:none;cursor:pointer;flex:1;position:relative;transition:all .15s}
  .bnav-btn:active{opacity:.7;transform:scale(.9)}
  .bnav-dot{width:4px;height:4px;border-radius:50%;background:var(--accent2);position:absolute;bottom:1px;
    box-shadow:0 0 6px var(--accent2)}

  /* ── Glass card utility ── */
  .glass{background:rgba(22,22,31,.8);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}

  /* ── Theme Picker ── */
  @keyframes pickerIn{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes themeIconSpin{0%{transform:rotate(0) scale(1)}50%{transform:rotate(180deg) scale(.8)}100%{transform:rotate(360deg) scale(1)}}
  .theme-option{transition:all .16s ease;cursor:pointer;position:relative;overflow:hidden}
  .theme-option:hover{transform:translateY(-2px)}
  .theme-option.active{box-shadow:0 4px 20px rgba(109,40,217,.35)}
  .theme-btn-trigger{transition:all .2s ease}
  .theme-btn-trigger:hover{transform:scale(1.05)}

  /* ── Mobile ── */
  @media(max-width:768px){
    .sidebar-overlay.open{display:block}
    .sidebar{position:fixed!important;left:0;top:0;bottom:0;z-index:100;transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1)!important;width:260px!important}
    .sidebar.open{transform:translateX(0)!important;box-shadow:24px 0 60px rgba(0,0,0,.6)}
    .stat-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
    .header-search{display:none!important}
    .fab{display:flex!important}
    .kgrid{display:flex!important;overflow-x:auto!important;gap:12px!important;padding-bottom:8px!important;-webkit-overflow-scrolling:touch;scrollbar-width:none}
    .kgrid::-webkit-scrollbar{display:none}
    .kgrid>div{min-width:270px!important;flex-shrink:0!important}
    .task-form-grid{grid-template-columns:1fr!important}
    .main-pad{padding:14px!important;padding-bottom:94px!important}
    .bnav{display:flex!important}
    .task-card-status{display:none!important}
    .modal-box{max-width:100%!important;max-height:100%!important;border-radius:0!important;height:100%!important}
    .header-date{display:none!important}
    .filter-bar{overflow-x:auto!important;flex-wrap:nowrap!important;-webkit-overflow-scrolling:touch;scrollbar-width:none}
    .filter-bar::-webkit-scrollbar{display:none}
    .focus-stats-grid{grid-template-columns:1fr 1fr!important}
    .weekly-stats-grid{grid-template-columns:1fr 1fr!important}
    .profile-stat-grid{grid-template-columns:1fr 1fr!important}
  }
  @media(max-width:480px){
    .main-pad{padding:10px!important;padding-bottom:94px!important}
    .stat-grid{grid-template-columns:1fr 1fr!important}
  }

  /* ── Light theme overrides ── */
  [data-theme="light"] .skel{background:linear-gradient(90deg,#e8e8f0 0%,#f0f0f8 50%,#e8e8f0 100%)!important}
  [data-theme="light"] ::-webkit-scrollbar-thumb{background:#c8c8dc}
  [data-theme="light"] .task-row:hover{background:#ececf5!important}
  [data-theme="light"] .nav-item:hover{background:#e8e8f2!important;color:#2c2c42!important}
  [data-theme="light"] .nav-group-btn:hover{background:rgba(109,40,217,.06)!important}
  [data-theme="light"] .btn-ghost:hover{background:#e8e8f2!important;color:#2c2c42!important}
  [data-theme="light"] .cal-day:hover{background:#e8e8f2!important}
  [data-theme="light"] .stat-card{border-color:rgba(90,70,180,.1)!important}
  [data-theme="light"] .stat-card:hover{border-color:rgba(90,70,180,.2)!important;box-shadow:0 8px 32px rgba(109,40,217,.08)!important}
  [data-theme="light"] .kcol{background:#ececf5!important;border-color:rgba(90,70,180,.1)!important}
  [data-theme="light"] .kcard:hover{box-shadow:0 8px 32px rgba(109,40,217,.12)!important}
  [data-theme="light"] .modal-box{box-shadow:0 40px 80px rgba(0,0,0,.12), 0 0 0 1px rgba(109,40,217,.1)!important}
`

// ── Tiny helpers ─────────────────────────────────────────────
function Spin({s=16,c='var(--accent2)'}){return <span style={{width:s,height:s,border:`2px solid ${c}`,borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite',flexShrink:0,opacity:.9}}/>}

const INP = {width:'100%',padding:'10px 14px',background:'var(--surface2)',border:'1px solid var(--border2)',borderRadius:10,color:'var(--text)',fontSize:13,outline:'none',transition:'border-color .2s, box-shadow .2s',colorScheme:resolvedTheme,fontFamily:'Space Grotesk,sans-serif',letterSpacing:'-0.1px'}
const focus = e => {e.target.style.borderColor='rgba(139,92,246,.6)';e.target.style.boxShadow='0 0 0 3px rgba(109,40,217,.12)'}
const blur  = e => {e.target.style.borderColor='var(--border2)';e.target.style.boxShadow='none'}

function Avatar({name,size=28}){
  const palettes=[['#6d28d9','#8b5cf6'],['#0369a1','#0ea5e9'],['#b45309','#f59e0b'],['#065f46','#10b981'],['#be123c','#f43f5e'],['#7c3aed','#a78bfa']]
  const p=palettes[(name?.charCodeAt(0)||0)%palettes.length]
  return <div style={{width:size,height:size,borderRadius:size*.3,background:`linear-gradient(135deg,${p[0]},${p[1]})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.4,fontWeight:700,color:'#fff',flexShrink:0,boxShadow:`0 2px 8px ${p[0]}60`}}>{(name?.[0]||'?').toUpperCase()}</div>
}

// ── Sub-tasks ─────────────────────────────────────────────────
function SubTaskList({taskId}){
  const [subs,setSubs]=useState([])
  const [val,setVal]=useState('')
  const [loading,setLoading]=useState(true)
  useEffect(()=>{api.get(`/api/tasks/${taskId}/subtasks`).then(r=>setSubs(Array.isArray(r.data)?r.data:[])).finally(()=>setLoading(false))},[taskId])
  async function add(){if(!val.trim())return;const r=await api.post(`/api/tasks/${taskId}/subtasks`,{title:val});setSubs(p=>[...p,r.data]);setVal('')}
  async function toggle(id){const r=await api.patch(`/api/tasks/${taskId}/subtasks/${id}/toggle`);setSubs(p=>p.map(s=>s.id===id?r.data:s))}
  async function del(id){await api.delete(`/api/tasks/${taskId}/subtasks/${id}`);setSubs(p=>p.filter(s=>s.id!==id))}
  const done=subs.filter(s=>s.completed).length
  return(
    <div style={{marginTop:16}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--muted)'}}>SUBTASKS</p>
        {subs.length>0&&<span style={{fontSize:10,color:'var(--muted)'}}>{done}/{subs.length} done</span>}
      </div>
      {subs.length>0&&<div style={{height:3,background:'var(--surface3)',borderRadius:3,marginBottom:10,overflow:'hidden'}}><div style={{height:'100%',width:`${(done/subs.length)*100}%`,background:'linear-gradient(90deg,var(--accent),var(--accent2))',transition:'width .3s'}}/></div>}
      {loading?<Spin s={14}/>:subs.map(s=>(
        <div key={s.id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:'1px solid var(--border)'}}>
          <button onClick={()=>toggle(s.id)} style={{width:20,height:20,borderRadius:6,flexShrink:0,background:s.completed?'var(--accent)':'transparent',border:`2px solid ${s.completed?'var(--accent)':'var(--border2)'}`,color:'#fff',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
            {s.completed?'✓':''}
          </button>
          <span style={{flex:1,fontSize:13,color:s.completed?'var(--muted)':'var(--text)',textDecoration:s.completed?'line-through':'none',lineHeight:1.4}}>{s.title}</span>
          <button onClick={()=>del(s.id)} style={{background:'none',border:'none',color:'var(--muted)',fontSize:13,cursor:'pointer',padding:'0 2px'}}>✕</button>
        </div>
      ))}
      <div style={{display:'flex',gap:8,marginTop:10}}>
        <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="Add subtask…" style={{...INP,flex:1,padding:'8px 12px'}} onFocus={focus} onBlur={blur}/>
        <button onClick={add} style={{padding:'8px 14px',borderRadius:9,background:'var(--accent)',border:'none',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>+</button>
      </div>
    </div>
  )
}

// ── Comments ──────────────────────────────────────────────────
function Comments({taskId,me}){
  const [list,setList]=useState([])
  const [txt,setTxt]=useState('')
  const [loading,setLoading]=useState(true)
  useEffect(()=>{api.get(`/api/tasks/${taskId}/comments`).then(r=>setList(Array.isArray(r.data)?r.data:[])).finally(()=>setLoading(false))},[taskId])
  async function send(){if(!txt.trim())return;const r=await api.post(`/api/tasks/${taskId}/comments`,{text:txt});setList(p=>[...p,r.data]);setTxt('')}
  async function del(id){await api.delete(`/api/tasks/${taskId}/comments/${id}`);setList(p=>p.filter(c=>c.id!==id))}
  return(
    <div style={{marginTop:16}}>
      <p style={{fontSize:11,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--muted)',marginBottom:12}}>COMMENTS ({list.length})</p>
      {loading?<Spin s={14}/>:list.length===0?<p style={{fontSize:12,color:'var(--muted)',textAlign:'center',padding:'12px 0'}}>No comments yet</p>:
        list.map(c=>(
          <div key={c.id} style={{display:'flex',gap:9,marginBottom:12,animation:'fadeUp .2s ease'}}>
            <Avatar name={c.author?.name} size={30}/>
            <div style={{flex:1,background:'var(--surface2)',borderRadius:10,padding:'8px 12px'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:11,fontWeight:600,color:'var(--accent3)'}}>{c.author?.name||'User'}</span>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontSize:10,color:'var(--muted)'}}>{c.createdAt?new Date(c.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</span>
                  {c.author?.id===me?.id&&<button onClick={()=>del(c.id)} style={{background:'none',border:'none',color:'var(--muted)',fontSize:11,cursor:'pointer'}}>✕</button>}
                </div>
              </div>
              <p style={{fontSize:13,color:'var(--text)',lineHeight:1.5,margin:0}}>{c.text}</p>
            </div>
          </div>
        ))
      }
      <div style={{display:'flex',gap:8,marginTop:8}}>
        <input value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Write a comment…" style={{...INP,flex:1}} onFocus={focus} onBlur={blur}/>
        <button onClick={send} disabled={!txt.trim()} style={{padding:'10px 16px',borderRadius:10,background:txt.trim()?'var(--accent)':'var(--surface3)',border:'none',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',transition:'all .15s'}}>Send</button>
      </div>
    </div>
  )
}

// ── Task Modal ────────────────────────────────────────────────
function TaskModal({task,onClose,onSave,me}){
  const isEdit=!!(task?.id)
  const [f,setF]=useState({
    title:task?.title||'',description:task?.description||'',
    priority:task?.priority||'MEDIUM',status:task?.status||'TODO',
    dueDate:task?.dueDate?task.dueDate.split('T')[0]:'',
    dueTime:task?.dueDate?task.dueDate.split('T')[1]?.slice(0,5)||'09:00':'09:00',
    recurring:task?.recurring||false,
    recurringInterval:task?.recurringInterval||'DAILY',
  })
  const [saving,setSaving]=useState(false)
  const [tab,setTab]=useState('details')
  const [nlpInput,setNlpInput]=useState('')
  const [nlpLoading,setNlpLoading]=useState(false)
  const [nlpActive,setNlpActive]=useState(false)
  const set=(k,v)=>setF(p=>({...p,[k]:v}))

  async function parseNlp(){
    if(!nlpInput.trim()) return
    setNlpLoading(true)
    try{
      const res = await import('../services/api').then(m=>m.default.post('/api/ai/parse-task',{input:nlpInput}))
      const d = res.data
      setF(p=>({...p,
        title: d.title||p.title,
        description: d.description||p.description,
        priority: d.priority||p.priority,
        dueDate: d.dueDate?d.dueDate.split('T')[0]:p.dueDate,
        dueTime: d.dueDate?d.dueDate.split('T')[1]?.slice(0,5)||'09:00':p.dueTime,
      }))
      setNlpInput('')
      setNlpActive(false)
    }catch(e){console.error(e)}
    finally{setNlpLoading(false)}
  }

  useEffect(()=>{const h=e=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[onClose])

  async function submit(){
    if(!f.title.trim())return
    setSaving(true)
    try{
      const dueDate=f.dueDate?`${f.dueDate}T${f.dueTime||'00:00'}:00`:null
      await onSave({title:f.title,description:f.description,priority:f.priority,status:f.status,dueDate,recurring:f.recurring,recurringInterval:f.recurring?f.recurringInterval:null})
    }finally{setSaving(false)}
  }

  const TABS=isEdit?[['details','📝','Details'],['subtasks','☑','Subtasks'],['comments','💬','Comments']]:[['details','📝','Details']]

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.88)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box" style={{width:'100%',maxWidth:560,maxHeight:'90vh',
        background:resolvedTheme==='light'?'#ffffff':'#0e0e14',
        border:'1px solid rgba(255,255,255,.1)',
        borderRadius:22,overflow:'hidden',
        boxShadow:'0 40px 100px rgba(0,0,0,.9), 0 0 0 1px rgba(109,40,217,.15)',
        animation:'modalIn .22s cubic-bezier(.4,0,.2,1)',display:'flex',flexDirection:'column'}}>
        
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'20px 24px',borderBottom:'1px solid rgba(255,255,255,.06)',
          background:resolvedTheme==='light'?'linear-gradient(135deg,rgba(109,40,217,.05),transparent)':'linear-gradient(135deg,rgba(109,40,217,.08),transparent)',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:36,height:36,borderRadius:11,
              background:isEdit?'rgba(109,40,217,.15)':'linear-gradient(135deg,var(--accent),var(--accent2))',
              border:isEdit?'1px solid rgba(139,92,246,.3)':'none',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,
              boxShadow:isEdit?'none':'0 4px 14px var(--glow)'}}>
              {isEdit?'✎':'⚡'}
            </div>
            <div>
              <h2 style={{fontSize:16,fontWeight:700,color:'var(--text)',
                fontFamily:'Outfit,sans-serif',margin:0,letterSpacing:'-0.2px'}}>
                {isEdit?'Edit Task':'New Task'}
              </h2>
              <p style={{fontSize:11,color:'var(--muted)',marginTop:2}}>
                {isEdit?'Update task details':'Add to your board'}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            style={{width:32,height:32,borderRadius:9,background:'rgba(255,255,255,.05)',
              border:'1px solid rgba(255,255,255,.08)',color:'var(--muted)',fontSize:14,
              display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .14s'}}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:2,padding:'12px 24px 0',
          borderBottom:'1px solid rgba(255,255,255,.06)',flexShrink:0}}>
          {TABS.map(([key,ic,lb])=>(
            <button key={key} onClick={()=>setTab(key)}
              style={{padding:'7px 16px',borderRadius:'10px 10px 0 0',fontSize:12,fontWeight:600,
                cursor:'pointer',transition:'all .15s',fontFamily:'Space Grotesk,sans-serif',
                background:tab===key?'rgba(109,40,217,.1)':'transparent',
                color:tab===key?'var(--accent3)':'var(--muted)',
                border:tab===key?'1px solid rgba(139,92,246,.2)':'1px solid transparent',
                borderBottom:tab===key?'1px solid rgba(109,40,217,.1)':'none'}}>
              {ic} {lb}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:'auto',padding:22}}>
          {tab==='details'&&(
            <>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Task Title *</label>
                <input autoFocus style={INP} placeholder="What needs to be done?" value={f.title} onChange={e=>set('title',e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} onFocus={focus} onBlur={blur}/>
              </div>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Description</label>
                <textarea style={{...INP,resize:'vertical',lineHeight:1.6}} rows={2} placeholder="Add details… (optional)" value={f.description} onChange={e=>set('description',e.target.value)} onFocus={focus} onBlur={blur}/>
              </div>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Tags</label>
                <input style={INP} placeholder="work, urgent, personal…" value={f.tags||''} onChange={e=>set('tags',e.target.value)} onFocus={focus} onBlur={blur}/>
                {f.tags&&<div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:6}}>
                  {f.tags.split(',').map(t=>t.trim()).filter(Boolean).map(tag=>(
                    <span key={tag} style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:'rgba(124,58,237,.12)',color:'#a855f7',border:'1px solid rgba(124,58,237,.2)',fontWeight:600}}>#{tag}</span>
                  ))}
                </div>}
              </div>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Priority</label>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                  {Object.entries(PRI).map(([v,cfg])=>(
                    <button key={v} onClick={()=>set('priority',v)} style={{padding:'10px 8px',borderRadius:10,cursor:'pointer',
                      background:f.priority===v?cfg.bg:'var(--surface2)',border:`1.5px solid ${f.priority===v?cfg.color:'var(--border)'}`,
                      color:f.priority===v?cfg.color:'var(--muted)',fontSize:12,fontWeight:600,display:'flex',flexDirection:'column',alignItems:'center',gap:4,transition:'all .15s'}}>
                      <span style={{fontSize:17}}>{cfg.emoji}</span><span>{cfg.label}</span>
                      <span style={{fontSize:10,opacity:.7}}>+{cfg.pts}pts</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
                <div>
                  <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Due Date</label>
                  <input style={INP} type="date" value={f.dueDate} onChange={e=>set('dueDate',e.target.value)} onFocus={focus} onBlur={blur}/>
                </div>
                <div>
                  <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Time</label>
                  <input style={INP} type="time" value={f.dueTime} onChange={e=>set('dueTime',e.target.value)} onFocus={focus} onBlur={blur}/>
                </div>
              </div>
              {isEdit&&(
                <div style={{marginBottom:14}}>
                  <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Status</label>
                  <select style={{...INP,cursor:'pointer'}} value={f.status} onChange={e=>set('status',e.target.value)}>
                    {Object.entries(STATUS).map(([v,s])=><option key={v} value={v}>{s.emoji} {s.label}</option>)}
                  </select>
                </div>
              )}
              {/* Recurring toggle */}
              <div style={{padding:14,background:'var(--surface2)',borderRadius:12,border:'1px solid var(--border)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',alignItems:'center',gap:9}}>
                    <span style={{fontSize:17}}>🔁</span>
                    <div>
                      <p style={{fontSize:13,fontWeight:600,color:'var(--text)',margin:0}}>Recurring Task</p>
                      <p style={{fontSize:11,color:'var(--muted)',margin:0}}>Auto-recreate when completed</p>
                    </div>
                  </div>
                  <button onClick={()=>set('recurring',!f.recurring)} style={{width:42,height:24,borderRadius:12,border:'none',cursor:'pointer',position:'relative',background:f.recurring?'var(--accent)':'var(--surface3)',transition:'background .2s'}}>
                    <span style={{position:'absolute',top:2,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left .2s',left:f.recurring?20:2}}/>
                  </button>
                </div>
                {f.recurring&&(
                  <select style={{...INP,marginTop:12}} value={f.recurringInterval} onChange={e=>set('recurringInterval',e.target.value)}>
                    <option value="DAILY">🔁 Daily</option>
                    <option value="WEEKLY">📅 Weekly</option>
                    <option value="MONTHLY">🗓 Monthly</option>
                  </select>
                )}
              </div>
            </>
          )}
          {tab==='subtasks'&&isEdit&&<SubTaskList taskId={task.id}/>}
          {tab==='comments'&&isEdit&&<Comments taskId={task.id} me={me}/>}
        </div>

        {/* Footer */}
        {tab==='details'&&(
          <div style={{display:'flex',gap:10,padding:'16px 22px',borderTop:'1px solid var(--border)',flexShrink:0}}>
            <button onClick={onClose} style={{flex:1,padding:12,borderRadius:10,border:'1px solid var(--border)',background:'var(--surface2)',color:'var(--muted)',fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
            <button onClick={submit} disabled={saving||!f.title.trim()} style={{flex:2,padding:12,borderRadius:10,border:'none',background:saving?'var(--surface3)':'linear-gradient(135deg,var(--accent),var(--accent2))',color:'#fff',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:f.title.trim()?1:.5,cursor:'pointer',boxShadow:saving?'none':'0 4px 16px var(--glow)',transition:'all .2s'}}>
              {saving?<><Spin s={14}/> Saving…</>:isEdit?'✓ Save Changes':'⚡ Create Task'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Kanban ────────────────────────────────────────────────────
function Kanban({tasks,onEdit,onStatusChange}){
  const [dragId,setDragId]=useState(null)
  const cols=[
    {key:'TODO',label:'To Do',emoji:'📋',color:'#a78bfa'},
    {key:'IN_PROGRESS',label:'In Progress',emoji:'⚡',color:'#60a5fa'},
    {key:'DONE',label:'Done',emoji:'✅',color:'#6bcb77'},
  ]
  return(
    <div className="kgrid" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
      {cols.map(col=>{
        const ct=tasks.filter(t=>t.status===col.key)
        return(
          <div key={col.key} className="kcol" style={{background:'var(--surface2)',borderRadius:16,padding:14,border:'1px solid var(--border)',minHeight:300,transition:'all .2s'}}
            onDragOver={e=>{e.preventDefault();e.currentTarget.classList.add('dragover')}}
            onDragLeave={e=>e.currentTarget.classList.remove('dragover')}
            onDrop={e=>{e.preventDefault();e.currentTarget.classList.remove('dragover');if(dragId)onStatusChange(dragId,col.key);setDragId(null)}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
              <span style={{fontSize:15}}>{col.emoji}</span>
              <span style={{fontSize:13,fontWeight:700,color:col.color}}>{col.label}</span>
              <span style={{marginLeft:'auto',fontSize:10,padding:'2px 7px',borderRadius:6,background:'var(--surface3)',color:'var(--muted)'}}>{ct.length}</span>
            </div>
            {ct.map(task=>{
              const cfg=PRI[task.priority]||PRI.MEDIUM
              const st=(task.subTasks||[]).filter(s=>s.completed).length
              const stTotal=(task.subTasks||[]).length
              return(
                <div key={task.id} className="kcard" draggable onDragStart={()=>setDragId(task.id)}
                  style={{background:'var(--surface)',border:'1px solid var(--border)',borderLeft:`3px solid ${cfg.color}`,borderRadius:12,padding:12,marginBottom:10,animation:'fadeUp .25s ease'}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.3)'}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                  <p style={{fontSize:13,fontWeight:600,color:'var(--text)',margin:'0 0 8px',lineHeight:1.4}}>{task.title}</p>
                  {stTotal>0&&(
                    <div style={{marginBottom:8}}>
                      <div style={{height:3,background:'var(--surface3)',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${(st/stTotal)*100}%`,background:'linear-gradient(90deg,var(--accent),var(--accent2))',transition:'width .3s'}}/></div>
                      <p style={{fontSize:10,color:'var(--muted)',marginTop:2}}>{st}/{stTotal} subtasks</p>
                    </div>
                  )}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:6,background:cfg.bg,color:cfg.color}}>{cfg.label}</span>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      {task.dueDate&&<span style={{fontSize:10,color:'var(--muted)'}}>{new Date(task.dueDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>}
                      <button onClick={()=>onEdit(task)} style={{width:22,height:22,borderRadius:6,background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--muted)',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>✎</button>
                    </div>
                  </div>
                </div>
              )
            })}
            {ct.length===0&&<p style={{fontSize:12,color:'var(--muted)',textAlign:'center',padding:'24px 0',opacity:.4}}>Drop tasks here</p>}
          </div>
        )
      })}
    </div>
  )
}

// ── Calendar ──────────────────────────────────────────────────
function Calendar({tasks,onEdit}){
  const [cur,setCur]=useState(new Date())
  const [sel,setSel]=useState(null)
  const y=cur.getFullYear(),m=cur.getMonth()
  const first=new Date(y,m,1).getDay()
  const days=new Date(y,m+1,0).getDate()
  const today=new Date()
  const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December']

  function getDay(d){
    return tasks.filter(t=>{
      if(!t.dueDate)return false
      const td=new Date(t.dueDate)
      return td.getFullYear()===y&&td.getMonth()===m&&td.getDate()===d
    })
  }
  const selTasks=sel?getDay(sel):[]

  return(
    <div style={{animation:'fadeUp .3s ease'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <button onClick={()=>setCur(new Date(y,m-1,1))} style={{width:34,height:34,borderRadius:9,background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--muted)',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>‹</button>
        <h3 style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:'Syne,sans-serif'}}>{MONTHS[m]} {y}</h3>
        <button onClick={()=>setCur(new Date(y,m+1,1))} style={{width:34,height:34,borderRadius:9,background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--muted)',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>›</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:4}}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} style={{textAlign:'center',fontSize:10,fontWeight:700,color:'var(--muted)',padding:'6px 0',letterSpacing:'1px'}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
        {Array.from({length:first}).map((_,i)=><div key={`e${i}`}/>)}
        {Array.from({length:days}).map((_,i)=>{
          const d=i+1
          const dt=getDay(d)
          const isToday=today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===d
          const isSel=sel===d
          return(
            <div key={d} className="cal-day" onClick={()=>setSel(sel===d?null:d)}
              style={{minHeight:72,padding:7,borderRadius:12,cursor:dt.length?'pointer':'default',transition:'all .15s',
                background:isSel?'rgba(124,58,237,.1)':isToday?'rgba(124,58,237,.05)':'var(--surface)',
                border:`1px solid ${isSel?'var(--accent)':isToday?'rgba(124,58,237,.3)':'var(--border)'}`}}>
              <p style={{fontSize:12,fontWeight:isToday?800:500,color:isToday?'var(--accent2)':'var(--muted)',marginBottom:3}}>{d}</p>
              {dt.slice(0,2).map(t=>{const cfg=PRI[t.priority]||PRI.MEDIUM;return(
                <div key={t.id} style={{fontSize:9,padding:'2px 4px',borderRadius:4,marginBottom:2,background:cfg.bg,color:cfg.color,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
              )})}
              {dt.length>2&&<p style={{fontSize:9,color:'var(--muted)'}}>+{dt.length-2}</p>}
            </div>
          )
        })}
      </div>
      {sel&&selTasks.length>0&&(
        <div style={{marginTop:16,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:16,animation:'fadeUp .25s ease'}}>
          <p style={{fontSize:13,fontWeight:700,color:'var(--text)',marginBottom:12}}>{MONTHS[m]} {sel} — {selTasks.length} task{selTasks.length!==1?'s':''}</p>
          {selTasks.map(t=>{const cfg=PRI[t.priority]||PRI.MEDIUM;const scfg=STATUS[t.status]||STATUS.TODO;return(
            <div key={t.id} onClick={()=>onEdit(t)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,background:'var(--surface2)',marginBottom:8,cursor:'pointer',borderLeft:`3px solid ${cfg.color}`}}>
              <span style={{flex:1,fontSize:13,color:'var(--text)',fontWeight:500}}>{t.title}</span>
              <span style={{fontSize:10,padding:'2px 8px',borderRadius:6,background:`${scfg.color}18`,color:scfg.color,fontWeight:600}}>{scfg.label}</span>
              <span style={{fontSize:10,padding:'2px 8px',borderRadius:6,background:cfg.bg,color:cfg.color,fontWeight:700}}>{cfg.label}</span>
            </div>
          )})}
        </div>
      )}
      {sel&&selTasks.length===0&&<p style={{marginTop:12,textAlign:'center',fontSize:13,color:'var(--muted)'}}>No tasks due on {MONTHS[m]} {sel}</p>}
    </div>
  )
}

// ── Task Row ──────────────────────────────────────────────────
function TaskRow({task,onToggle,onEdit,onDelete,idx}){
  const [hover,setHover]=useState(false)
  const [confirmDel,setConfirm]=useState(false)
  const isDone=task.status==='DONE'
  const cfg=PRI[task.priority]||PRI.MEDIUM
  const scfg=STATUS[task.status]||STATUS.TODO
  const st=(task.subTasks||[]).filter(s=>s.completed).length
  const stTotal=(task.subTasks||[]).length

  function dueInfo(){
    if(!task.dueDate)return null
    const d=new Date(task.dueDate)
    const diff=Math.ceil((d-Date.now())/86400000)
    if(diff<0)return{text:`${-diff}d overdue`,color:'var(--danger)',bg:'var(--danger2)'}
    if(diff===0)return{text:'Today',color:'var(--warn)',bg:'var(--warn2)'}
    if(diff<=2)return{text:`${diff}d`,color:'var(--warn)',bg:'var(--warn2)'}
    return{text:d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}),color:'var(--muted2)',bg:'transparent'}
  }
  const due=dueInfo()

  function handleDel(){
    if(confirmDel){onDelete();setConfirm(false)}
    else{setConfirm(true);setTimeout(()=>setConfirm(false),3000)}
  }

  const priorityDot = {HIGH:'var(--danger)',MEDIUM:'var(--warn)',LOW:'var(--success)'}[task.priority]||'var(--muted)'

  return(
    <div className="task-row" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',
        background:isDone?'rgba(255,255,255,.01)':'var(--surface)',
        border:`1px solid ${hover?'var(--border2)':'var(--border)'}`,
        borderRadius:14,marginBottom:6,transition:'all .16s ease',
        opacity:isDone?.55:1,
        animation:'taskPop .3s ease both',animationDelay:`${idx*.035}s`,
        position:'relative',overflow:'hidden'}}>

      {/* Priority left bar */}
      <div style={{position:'absolute',left:0,top:'20%',bottom:'20%',width:2.5,
        background:cfg.color,borderRadius:'0 3px 3px 0',
        boxShadow:`0 0 8px ${cfg.color}80`,
        opacity:isDone?.3:1}}/>

      {/* Checkbox */}
      <button onClick={onToggle}
        style={{width:22,height:22,borderRadius:7,flexShrink:0,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
          transition:'all .16s ease',
          background:isDone?`linear-gradient(135deg,${cfg.color},${cfg.color}bb)`:'transparent',
          border:`2px solid ${isDone?cfg.color:'var(--border3)'}`,
          color:'#fff',fontSize:11,fontWeight:700,
          boxShadow:isDone?`0 2px 10px ${cfg.color}50`:'none'}}>
        {isDone&&'✓'}
      </button>

      {/* Content */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:stTotal>0?4:0}}>
          <p style={{fontSize:14,fontWeight:isDone?400:500,
            color:isDone?'var(--muted)':'var(--text)',
            textDecoration:isDone?'line-through':'none',
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',margin:0,
            letterSpacing:'-0.1px'}}>
            {task.title}
          </p>
          {task.recurring&&<span style={{fontSize:9,padding:'1px 5px',borderRadius:4,
            background:'var(--blue2)',color:'var(--blue)',fontWeight:600,flexShrink:0}}>↻</span>}
          {(task.comments?.length||0)>0&&<span style={{fontSize:10,padding:'1px 6px',borderRadius:4,
            background:'rgba(255,255,255,.05)',color:'var(--muted2)',flexShrink:0}}>
            💬{task.comments.length}</span>}
        </div>
        {stTotal>0&&(
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <div style={{width:60,height:2.5,background:'var(--surface3)',borderRadius:4,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${(st/stTotal)*100}%`,
                background:`linear-gradient(90deg,var(--accent),var(--accent2))`,borderRadius:4,
                transition:'width .4s ease'}}/>
            </div>
            <span style={{fontSize:10,color:'var(--muted)',fontWeight:500}}>{st}/{stTotal}</span>
          </div>
        )}
        {task.description&&!stTotal&&(
          <p style={{fontSize:11,color:'var(--muted)',overflow:'hidden',textOverflow:'ellipsis',
            whiteSpace:'nowrap',marginTop:2,lineHeight:1.4}}>{task.description}</p>
        )}
      </div>

      {/* Tags row */}
      {due&&(
        <span style={{fontSize:10,fontWeight:600,padding:'3px 9px',borderRadius:20,
          background:due.bg,color:due.color,flexShrink:0,whiteSpace:'nowrap',
          border:`1px solid ${due.color}30`}}>
          {due.text}
        </span>
      )}

      {/* Status badge */}
      <span className="task-card-status" style={{fontSize:10,fontWeight:600,padding:'3px 10px',
        borderRadius:20,background:`${scfg.color}15`,color:scfg.color,
        border:`1px solid ${scfg.color}25`,flexShrink:0,whiteSpace:'nowrap'}}>
        {scfg.emoji} {scfg.label}
      </span>

      {/* Priority */}
      <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
        <div style={{width:6,height:6,borderRadius:'50%',background:priorityDot,
          boxShadow:`0 0 6px ${priorityDot}80`}}/>
        <span style={{fontSize:10,fontWeight:600,color:cfg.color}}>{cfg.label}</span>
      </div>

      {/* XP */}
      <span style={{fontSize:11,fontWeight:700,color:'var(--accent3)',
        minWidth:28,textAlign:'right',fontFamily:'Outfit,sans-serif',flexShrink:0}}>
        +{cfg.pts}
      </span>

      {/* Actions */}
      <div className="task-actions" style={{display:'flex',gap:4,flexShrink:0}}>
        <button onClick={onEdit}
          style={{width:28,height:28,borderRadius:8,background:'var(--surface2)',
            border:'1px solid var(--border2)',color:'var(--muted2)',fontSize:12,
            display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
            transition:'all .14s'}}>✎</button>
        <button onClick={handleDel} title={confirmDel?'Confirm?':'Delete'}
          style={{width:28,height:28,borderRadius:8,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,
            transition:'all .14s',
            background:confirmDel?'var(--danger2)':'var(--surface2)',
            border:`1px solid ${confirmDel?'var(--danger)30':'var(--border2)'}`,
            color:confirmDel?'var(--danger)':'var(--muted2)'}}>
          {confirmDel?'!':'✕'}
        </button>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard(){
  // Persistent Pomodoro mini-bar state (lifted from PomodoroTimer)
  const [pomRunning,setPomRunning]=useState(false)
  const [pomSecs,setPomSecs]=useState(25*60)
  const [pomMode,setPomMode]=useState('focus')
  const [pomSessions,setPomSessions]=useState(0)
  const pomRef=useRef(null)
  useEffect(()=>{
    if(pomRunning){
      pomRef.current=setInterval(()=>{
        setPomSecs(s=>{
          if(s<=1){
            clearInterval(pomRef.current)
            setPomRunning(false)
            if(pomMode==='focus') setPomSessions(p=>p+1)
            return 0
          }
          return s-1
        })
      },1000)
    } else {
      clearInterval(pomRef.current)
    }
    return ()=>clearInterval(pomRef.current)
  },[pomRunning,pomMode])
  const pomFormatTime=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const pomModeColor=pomMode==='focus'?'#7c3aed':pomMode==='short'?'#10b981':'#0ea5e9'

  const [tasks,setTasks]=useState([])
  const [stats,setStats]=useState(null)
  const [lvl,setLvl]=useState({level:1,focusScore:0,nextLevelAt:100})
  const [badges,setBadges]=useState([])
  const [filter,setFilter]=useState('ALL')
  const [search,setSearch]=useState('')
  const [loading,setLoading]=useState(true)
  const [modal,setModal]=useState(false)
  const [editTask,setEditTask]=useState(null)
  const [toast,setToast]=useState(null)
  const [sideOpen,setSideOpen]=useState(true)
  const [showOnboarding,setShowOnboarding]=useState(false)
  const [navOpen,setNavOpen]=useState({focus:true,insights:false,collaborate:false,tools:false})
  const toggleNav = (k) => setNavOpen(p=>({...p,[k]:!p[k]}))
  const NAV_GROUPS = {
    focus:['focus','pomodoro','habits','calendar'],
    insights:['analytics','weekly','advanced-analytics','matrix'],
    collaborate:['teams','leaderboard','ai'],
    tools:['reminders','export','gcal','email-task','ai-breakdown'],
  }
  const openGroupForView = (v) => {
    const grp = Object.entries(NAV_GROUPS).find(([,items])=>items.includes(v))
    if (grp) setNavOpen(p=>({...p,[grp[0]]:true}))
  }
  const [theme,setTheme]=useState(()=>localStorage.getItem('tf_theme')||'dark')
  const [showThemePicker,setShowThemePicker]=useState(false)
  const systemDark = typeof window!=='undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolvedTheme = theme==='system' ? (systemDark?'dark':'light') : theme
  const saveTheme = (t) => { setTheme(t); localStorage.setItem('tf_theme',t); setShowThemePicker(false) }
  // Close theme picker on outside click
  useEffect(()=>{
    if(!showThemePicker) return
    const h = e => {
      if(!e.target.closest('.theme-picker-area')) setShowThemePicker(false)
    }
    setTimeout(()=>document.addEventListener('click',h),10)
    return()=>document.removeEventListener('click',h)
  },[showThemePicker])
  const [view,setView]=useState('tasks')
  const [viewMode,setViewMode]=useState('list')
  const [roleFromApi,setRoleFromApi]=useState('USER')
  const [trialDaysLeft,setTrialDaysLeft]=useState(null)
  const {user,login,logout}=useAuth()
  const navigate=useNavigate()

  useEffect(()=>{
    api.get('/api/users/me').then(r=>{
      setRoleFromApi(r.data.role||'USER')
      if(r.data.createdAt){
        const diffDays=Math.floor((new Date()-new Date(r.data.createdAt))/(1000*60*60*24))
        setTrialDaysLeft(Math.max(0,15-diffDays))
      }
      if(user) login(localStorage.getItem('token'),{...user,role:r.data.role,isPro:r.data.isPro})
    }).catch(()=>{})
  },[])

  // Onboarding check
  useEffect(()=>{
    api.get('/api/users/onboarding-status')
      .then(r=>{ if(!r.data.done) setShowOnboarding(true) })
      .catch(()=>{})
  },[])

  const isAdmin=roleFromApi==='ADMIN'

  const fetchAll=useCallback(async()=>{
    try{
      const [tr,sr,lr,br]=await Promise.all([
        api.get('/api/tasks'),
        api.get('/api/tasks/stats').catch(()=>({data:null})),
        api.get('/api/users/level').catch(()=>({data:{level:1,focusScore:0,nextLevelAt:100}})),
        api.get('/api/users/badges').catch(()=>({data:[]})),
      ])
      setTasks(Array.isArray(tr.data?.content)?tr.data.content:Array.isArray(tr.data)?tr.data:[])
      setStats(sr.data)
      if(lr.data)setLvl(lr.data)
      if(Array.isArray(br.data))setBadges(br.data)
    }catch(e){console.error(e);flash('error','⚠ Failed to load')}
    finally{setLoading(false)}
  },[])

  useEffect(()=>{fetchAll()},[fetchAll])

  function flash(type,msg){setToast({type,msg});setTimeout(()=>setToast(null),3500)}

  async function handleSave(data){
    if(editTask){await api.put(`/api/tasks/${editTask.id}`,data);flash('success','✓ Task updated!')}
    else{await api.post('/api/tasks',data);flash('success','⚡ Task created!')}
    setModal(false);setEditTask(null);fetchAll()
  }

  async function handleToggle(id){
    const t=tasks.find(t=>t.id===id)
    if(!t)return
    const s=t.status==='DONE'?'TODO':'DONE'
    await api.put(`/api/tasks/${id}`,{title:t.title,description:t.description,priority:t.priority,dueDate:t.dueDate,status:s})
    fetchAll()
    flash('success',s==='DONE'?'🎉 Completed!':'↩ Reopened')
  }

  async function handleDelete(id){
    await api.delete(`/api/tasks/${id}`)
    fetchAll();flash('success','Deleted')
  }

  async function handleStatusChange(id,status){
    await api.patch(`/api/tasks/${id}/status`,{status})
    fetchAll();flash('success',`→ ${STATUS[status]?.label}`)
  }

  function openEdit(task){setEditTask(task);setModal(true)}
  function openNew(){setEditTask(null);setModal(true)}

  const filtered=tasks.filter(t=>{
    const mf=filter==='ALL'||t.status===filter
    const mq=!search||t.title?.toLowerCase().includes(search.toLowerCase())||t.description?.toLowerCase().includes(search.toLowerCase())
    return mf&&mq
  })

  const done=tasks.filter(t=>t.status==='DONE').length
  const pending=tasks.filter(t=>t.status!=='DONE').length
  const high=tasks.filter(t=>t.priority==='HIGH'&&t.status!=='DONE').length
  const overdue=tasks.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date()&&t.status!=='DONE').length
  const h=new Date().getHours()
  const greet=h<12?'Good morning':h<17?'Good afternoon':'Good evening'
  const pct=Math.min(100,Math.round((lvl.focusScore%100)/100*100))

  const navItems=[
    {key:'ALL',icon:'◈',label:'All Tasks',count:tasks.length},
    {key:'TODO',icon:'○',label:'To Do',count:tasks.filter(t=>t.status==='TODO').length},
    {key:'IN_PROGRESS',icon:'◉',label:'In Progress',count:tasks.filter(t=>t.status==='IN_PROGRESS').length},
    {key:'DONE',icon:'✓',label:'Completed',count:done},
  ]

  const fBtn=(key,label,count)=>(
    <button className="filter-pill" onClick={()=>setFilter(key)}
      style={{display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:20,fontSize:12,
        fontWeight:filter===key?600:500,cursor:'pointer',transition:'all .14s',fontFamily:'Space Grotesk,sans-serif',
        background:filter===key?'linear-gradient(135deg,var(--accent),var(--accent2))':'transparent',
        color:filter===key?'#fff':'var(--muted2)',
        border:filter===key?'none':'1px solid var(--border2)',
        boxShadow:filter===key?'0 2px 12px var(--glow)':'none'}}>
      {label}
      <span style={{fontSize:10,padding:'1px 7px',borderRadius:10,fontWeight:600,
        background:filter===key?'rgba(255,255,255,.2)':'var(--surface3)',
        color:filter===key?'#fff':'var(--muted)'}}>{count}</span>
    </button>
  )

  function headerTitle(){
    if(view==='ai')return<>🤖 <span style={{color:'var(--accent2)'}}>AI Assistant</span></>
    if(view==='analytics')return<>📊 <span style={{color:'var(--accent2)'}}>Analytics</span></>
    if(view==='teams')return<>👥 <span style={{color:'var(--accent2)'}}>Teams</span></>
    if(view==='admin')return<>🛡️ <span style={{color:'var(--danger)'}}>Admin</span></>
    if(view==='profile')return<>👤 <span style={{color:'var(--accent2)'}}>My Profile</span></>
    if(view==='focus')return<>🎯 <span style={{color:'var(--accent2)'}}>Daily Focus</span></>
    if(view==='weekly')return<>📊 <span style={{color:'var(--accent2)'}}>Weekly Review</span></>
    if(view==='pomodoro')return<>⏱ <span style={{color:'var(--accent2)'}}>Pomodoro Timer</span></>
    if(view==='leaderboard')return<>🏆 <span style={{color:'var(--accent2)'}}>Leaderboard</span></>
    if(view==='habits')return<>🔥 <span style={{color:'var(--accent2)'}}>Habit Tracker</span></>
    if(view==='calendar')return<>📅 <span style={{color:'var(--accent2)'}}>Calendar</span></>
    if(view==='matrix')return<>🎯 <span style={{color:'var(--accent2)'}}>Eisenhower Matrix</span></>
    if(view==='export')return<>📤 <span style={{color:'var(--accent2)'}}>Export</span></>
    if(view==='reminders')return<>⏰ <span style={{color:'var(--accent2)'}}>Smart Reminders</span></>
    if(view==='advanced-analytics')return<>📊 <span style={{color:'var(--accent2)'}}>Advanced Analytics</span></>
    if(view==='gcal')return<>📅 <span style={{color:'var(--accent2)'}}>Google Calendar</span></>
    if(view==='email-task')return<>📧 <span style={{color:'var(--accent2)'}}>Email → Task</span></>
    if(view==='ai-breakdown')return<>🧠 <span style={{color:'var(--accent2)'}}>AI Task Breakdown</span></>
    return<>{greet}, <span style={{color:'var(--accent2)'}}>{user?.name||'there'}</span> ✦</>
  }

  return(
    <>
      <style>{G}</style>
      <div data-theme={resolvedTheme} style={{display:'flex',height:'100vh',overflow:'hidden',
        background:resolvedTheme==='light'?'#f5f5fb':'var(--bg)',
        color:resolvedTheme==='light'?'#13131f':'var(--text)',
        '--bg':resolvedTheme==='light'?'#f5f5fb':'#060608',
        '--surface':resolvedTheme==='light'?'#ffffff':'#0e0e14',
        '--surface2':resolvedTheme==='light'?'#ececf5':'#16161f',
        '--surface3':resolvedTheme==='light'?'#e2e2ee':'#1e1e2a',
        '--surface4':resolvedTheme==='light'?'#d8d8e8':'#252533',
        '--border':resolvedTheme==='light'?'rgba(90,70,180,.09)':'rgba(255,255,255,.05)',
        '--border2':resolvedTheme==='light'?'rgba(90,70,180,.14)':'rgba(255,255,255,.09)',
        '--border3':resolvedTheme==='light'?'rgba(90,70,180,.22)':'rgba(255,255,255,.14)',
        '--text':resolvedTheme==='light'?'#13131f':'#eeeef5',
        '--text2':resolvedTheme==='light'?'#2c2c42':'#c4c4d4',
        '--muted':resolvedTheme==='light'?'#7070a0':'#52526e',
        '--muted2':resolvedTheme==='light'?'#8888bb':'#7474a0',
        '--glow':resolvedTheme==='light'?'rgba(109,40,217,.2)':'rgba(109,40,217,.4)',
        '--accent':'#6d28d9','--accent2':'#8b5cf6','--accent3':'#a78bfa','--accent4':'#c4b5fd',
      }}>

        {/* Sidebar overlay */}
        {sideOpen&&<div className="sidebar-overlay open" onClick={()=>setSideOpen(false)}/>}

        {/* Sidebar */}
        {sideOpen&&(
          <aside className="sidebar open" style={{width:248,flexShrink:0,
            background:resolvedTheme==='light'?'rgba(248,248,255,.98)':'rgba(10,10,16,.97)',borderRight:'1px solid var(--border)',
            display:'flex',flexDirection:'column',height:'100%',
            transition:'transform .28s cubic-bezier(.4,0,.2,1)',
            backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)'}}>
            {/* Logo */}
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'18px 16px 14px',borderBottom:'1px solid var(--border)'}}>
              <div style={{width:36,height:36,borderRadius:11,
                background:'linear-gradient(135deg,var(--accent),var(--accent2))',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0,
                boxShadow:'0 4px 16px var(--glow),inset 0 1px 0 rgba(255,255,255,.2)'}}>⚡</div>
              <div>
                <span style={{fontSize:16,fontWeight:700,color:'var(--text)',fontFamily:'Outfit,sans-serif',letterSpacing:'-0.3px',display:'block',lineHeight:1.1}}>TaskFlow</span>
                <span style={{fontSize:9,color:'var(--muted)',fontWeight:500,letterSpacing:'1.5px',textTransform:'uppercase'}}>Productivity OS</span>
              </div>
            </div>

            <nav style={{flex:1,padding:'12px 10px',overflowY:'auto'}}>
              <p style={{fontSize:9,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',padding:'2px 11px 6px',fontFamily:'Outfit,sans-serif'}}>TASKS</p>
              {navItems.map(item=>{
                const active=view==='tasks'&&filter===item.key
                return(
                  <button key={item.key} className="nav-item" onClick={()=>{setFilter(item.key);setView('tasks')}}
                    style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'8px 11px',borderRadius:10,marginBottom:1,cursor:'pointer',fontSize:12,fontWeight:500,textAlign:'left',transition:'all .14s',
                      background:active?'rgba(109,40,217,.12)':'transparent',
                      color:active?'var(--accent3)':'var(--muted2)',
                      border:active?'1px solid rgba(139,92,246,.2)':'1px solid transparent'}}>
                    <span style={{width:16,textAlign:'center',fontSize:12,opacity:active?1:.7}}>{item.icon}</span>
                    <span style={{flex:1,letterSpacing:'-0.1px'}}>{item.label}</span>
                    <span style={{fontSize:10,padding:'1px 8px',borderRadius:8,
                      background:active?'rgba(139,92,246,.2)':'var(--surface3)',
                      color:active?'var(--accent3)':'var(--muted)',fontWeight:600}}>{item.count}</span>
                  </button>
                )
              })}

              {/* ── NAV GROUPS ── */}
              {[
                { key:'focus', label:'Focus & Habits', icon:'🎯',
                  items:[['focus','🎯','Daily Focus',null],['pomodoro','⏱','Pomodoro',null],['habits','🔥','Habits',null],['calendar','📅','Calendar',null]] },
                { key:'insights', label:'Insights', icon:'📊',
                  items:[['analytics','📊','Analytics',null],['advanced-analytics','📈','Deep Analytics',null],['weekly','📋','Weekly Review',null],['matrix','⚡','Priority Matrix',null]] },
                { key:'collaborate', label:'Teams & Social', icon:'👥',
                  items:[['teams','👥','Teams',null],['leaderboard','🏆','Leaderboard',null],['ai','🤖','AI Assistant',null]] },
                { key:'tools', label:'Tools', icon:'🔧',
                  items:[['reminders','⏰','Reminders',null],['gcal','📅','Google Cal',null],['email-task','📧','Email→Task',null],['ai-breakdown','🧠','AI Breakdown','NEW'],['export','📤','Export',null]] },
              ].map(group => {
                const isGroupActive = group.items.some(([v])=>v===view)
                const isOpen = navOpen[group.key]
                return (
                  <div key={group.key} style={{marginBottom:4}}>
                    {/* Group header */}
                    <button className="nav-group-btn" onClick={()=>toggleNav(group.key)}
                      style={{width:'100%',display:'flex',alignItems:'center',gap:8,
                        padding:'7px 11px',borderRadius:9,cursor:'pointer',transition:'all .14s',
                        background:isGroupActive?'rgba(109,40,217,.08)':'transparent',
                        border:`1px solid ${isGroupActive?'rgba(139,92,246,.15)':'transparent'}`}}>
                      <span style={{fontSize:13,opacity:isGroupActive?1:.6}}>{group.icon}</span>
                      <span style={{flex:1,fontSize:10,fontWeight:700,letterSpacing:'1.2px',
                        textTransform:'uppercase',fontFamily:'Outfit,sans-serif',
                        color:isGroupActive?'var(--accent3)':'var(--muted)',textAlign:'left'}}>
                        {group.label}
                      </span>
                      <span style={{fontSize:11,color:'var(--muted)',transition:'transform .2s ease',
                        transform:isOpen?'rotate(90deg)':'rotate(0deg)',display:'block'}}>›</span>
                    </button>
                    {/* Group items */}
                    {isOpen && (
                      <div style={{paddingLeft:8,marginTop:2}}>
                        {group.items.map(([v,ic,lb,badge])=>(
                          <button key={v} className="nav-item" onClick={()=>{setView(v);openGroupForView(v)}}
                            style={{width:'100%',display:'flex',alignItems:'center',gap:8,
                              padding:'7px 10px',borderRadius:8,marginBottom:1,cursor:'pointer',
                              fontSize:12,fontWeight:view===v?600:400,textAlign:'left',transition:'all .14s',
                              background:view===v?'rgba(109,40,217,.14)':'transparent',
                              color:view===v?'var(--accent3)':'var(--muted)',
                              border:view===v?'1px solid rgba(139,92,246,.22)':'1px solid transparent'}}>
                            <span style={{width:15,textAlign:'center',fontSize:12,opacity:view===v?1:.65}}>{ic}</span>
                            <span style={{flex:1,letterSpacing:'-0.1px'}}>{lb}</span>
                            {badge&&<span style={{fontSize:8,padding:'2px 6px',borderRadius:10,
                              background:'linear-gradient(135deg,var(--accent),var(--accent2))',
                              color:'#fff',fontWeight:700,letterSpacing:'.5px'}}>{badge}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {!isAdmin && (
                <button onClick={()=>navigate('/pricing')}
                  style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'10px 12px',
                    borderRadius:12,marginBottom:2,cursor:'pointer',textAlign:'left',
                    background:'linear-gradient(135deg,rgba(245,158,11,.08),rgba(251,191,36,.04))',
                    border:'1px solid rgba(245,158,11,.2)',transition:'all .18s'}}>
                  <div style={{width:24,height:24,borderRadius:7,
                    background:'linear-gradient(135deg,#f59e0b,#fbbf24)',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,flexShrink:0}}>⭐</div>
                  <span style={{flex:1,fontSize:12,fontWeight:600,color:'#fbbf24',letterSpacing:'-0.1px'}}>Upgrade to Pro</span>
                  {trialDaysLeft!==null&&trialDaysLeft>0&&(
                    <span style={{fontSize:9,padding:'2px 7px',borderRadius:8,
                      background:'rgba(245,158,11,.2)',color:'#fbbf24',
                      fontWeight:700,border:'1px solid rgba(245,158,11,.3)',whiteSpace:'nowrap'}}>
                      {trialDaysLeft}d left
                    </span>
                  )}
                  {trialDaysLeft===0&&(
                    <span style={{fontSize:9,padding:'2px 7px',borderRadius:8,
                      background:'rgba(244,63,94,.15)',color:'var(--danger)',
                      fontWeight:700,border:'1px solid rgba(244,63,94,.3)',whiteSpace:'nowrap'}}>
                      Expired
                    </span>
                  )}
                </button>
              )}

              {isAdmin&&(
                <>
                  <p style={{fontSize:9,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',padding:'16px 8px 6px'}}>ADMIN</p>
                  <button className="nav-item" onClick={()=>setView('admin')}
                    style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'9px 10px',borderRadius:10,marginBottom:2,cursor:'pointer',fontSize:13,fontWeight:500,textAlign:'left',transition:'all .12s',
                      background:view==='admin'?'rgba(255,107,107,.08)':'transparent',color:view==='admin'?'var(--danger)':'var(--muted)',
                      border:view==='admin'?'1px solid rgba(255,107,107,.2)':'1px solid transparent'}}>
                    <span style={{width:17,textAlign:'center'}}>🛡️</span><span>Admin Dashboard</span>
                  </button>
                </>
              )}

              {/* Level bar */}
              <div style={{margin:'12px 2px 0',padding:'14px 13px',
                background:'linear-gradient(135deg,rgba(109,40,217,.08),rgba(139,92,246,.04))',
                border:'1px solid rgba(139,92,246,.15)',borderRadius:14}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:28,height:28,borderRadius:8,
                      background:'linear-gradient(135deg,var(--accent),var(--accent2))',
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,
                      boxShadow:'0 2px 8px var(--glow)'}}>⚡</div>
                    <div>
                      <p style={{fontSize:12,fontWeight:700,color:'var(--accent3)',margin:0,fontFamily:'Outfit,sans-serif'}}>Level {lvl.level}</p>
                      <p style={{fontSize:9,color:'var(--muted)',margin:0,letterSpacing:'.5px',textTransform:'uppercase'}}>{LVL[lvl.level]||'Legend'}</p>
                    </div>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:'var(--accent4)',fontFamily:'Outfit,sans-serif'}}>{lvl.focusScore}<span style={{fontSize:9,color:'var(--muted)',fontWeight:400}}> xp</span></span>
                </div>
                <div style={{background:'rgba(255,255,255,.06)',borderRadius:8,height:4,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,
                    background:'linear-gradient(90deg,var(--accent),var(--accent2),var(--accent3))',
                    borderRadius:8,transition:'width .5s ease',
                    boxShadow:'0 0 8px var(--accent2)'}}/>
                </div>
                <p style={{fontSize:9,color:'var(--muted)',marginTop:5,fontWeight:500}}>{lvl.nextLevelAt-lvl.focusScore} xp to next level</p>
              </div>

              {/* Badges */}
              {badges.length>0&&(
                <div style={{margin:'10px 2px 0',padding:'12px',
                  background:'rgba(109,40,217,.05)',border:'1px solid rgba(139,92,246,.1)',borderRadius:12}}>
                  <p style={{fontSize:9,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',
                    color:'var(--muted)',marginBottom:9,fontFamily:'Outfit,sans-serif'}}>BADGES</p>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {badges.map(b=>(
                      <div key={b.id} title={b.description}
                        style={{padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:600,
                          background:'rgba(109,40,217,.12)',border:'1px solid rgba(139,92,246,.2)',
                          color:'var(--accent4)',cursor:'default',letterSpacing:'.2px'}}>
                        {b.emoji} {b.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {overdue>0&&(
                <div style={{margin:'10px 2px 0',padding:'11px 13px',
                  background:'var(--danger2)',border:'1px solid rgba(244,63,94,.2)',borderRadius:12}}>
                  <p style={{fontSize:11,fontWeight:700,color:'var(--danger)',marginBottom:2,display:'flex',alignItems:'center',gap:5}}>
                    <span>⚠</span> {overdue} Overdue
                  </p>
                  <p style={{fontSize:10,color:'var(--muted)',fontWeight:500}}>
                    {overdue} task{overdue>1?'s':''} past deadline
                  </p>
                </div>
              )}
            </nav>

            {/* Theme Picker Popup */}
            <div className="theme-picker-area" style={{position:'relative'}}>
            {showThemePicker&&(
              <div style={{position:'absolute',bottom:80,left:12,right:12,zIndex:200,
                background:resolvedTheme==='light'?'#ffffff':'#12121c',
                border:`1px solid ${resolvedTheme==='light'?'rgba(90,70,180,.18)':'rgba(139,92,246,.25)'}`,
                borderRadius:18,padding:16,
                boxShadow:resolvedTheme==='light'
                  ?'0 -8px 40px rgba(109,40,217,.12), 0 0 0 1px rgba(109,40,217,.06)'
                  :'0 -8px 40px rgba(0,0,0,.6), 0 0 0 1px rgba(139,92,246,.1)',
                animation:'pickerIn .22s cubic-bezier(.4,0,.2,1)'}}>
                <p style={{fontSize:10,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',
                  color:'var(--muted)',marginBottom:12,fontFamily:'Outfit,sans-serif'}}>APPEARANCE</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                  {[
                    {id:'light', label:'Light', icon:'☀️',
                     preview:['#f5f5fb','#ffffff','#6d28d9'],
                     desc:'Clean & bright'},
                    {id:'dark', label:'Dark', icon:'🌙',
                     preview:['#060608','#0e0e14','#8b5cf6'],
                     desc:'Easy on eyes'},
                    {id:'system', label:'System', icon:'💻',
                     preview:['#1a1a2e','#6d28d9','#a78bfa'],
                     desc:'Auto detect'},
                  ].map(opt=>(
                    <button key={opt.id}
                      className={`theme-option${theme===opt.id?' active':''}`}
                      onClick={()=>saveTheme(opt.id)}
                      style={{padding:'12px 8px',borderRadius:13,border:'none',cursor:'pointer',
                        background:theme===opt.id
                          ?'linear-gradient(135deg,rgba(109,40,217,.18),rgba(139,92,246,.1))'
                          :resolvedTheme==='light'?'rgba(109,40,217,.04)':'rgba(255,255,255,.04)',
                        outline:theme===opt.id
                          ?'1.5px solid rgba(139,92,246,.5)':'1.5px solid transparent',
                        display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                      {/* Mini preview */}
                      <div style={{width:44,height:32,borderRadius:8,overflow:'hidden',
                        border:'1px solid rgba(255,255,255,.1)',position:'relative',flexShrink:0}}>
                        <div style={{position:'absolute',inset:0,background:opt.preview[0]}}/>
                        <div style={{position:'absolute',top:4,left:4,right:4,height:8,
                          borderRadius:4,background:opt.preview[1],
                          boxShadow:'0 1px 3px rgba(0,0,0,.2)'}}/>
                        <div style={{position:'absolute',bottom:4,left:4,width:16,height:5,
                          borderRadius:3,background:opt.preview[2]}}/>
                        {theme===opt.id&&(
                          <div style={{position:'absolute',top:2,right:2,width:8,height:8,
                            borderRadius:'50%',background:'var(--accent2)',
                            boxShadow:'0 0 6px var(--accent2)'}}/>
                        )}
                      </div>
                      <span style={{fontSize:11,fontWeight:theme===opt.id?700:500,
                        color:theme===opt.id?'var(--accent3)':'var(--muted2)',letterSpacing:'-0.1px'}}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Profile */}
            <div style={{padding:'12px 14px',borderTop:'1px solid var(--border)',
              background:resolvedTheme==='light'?'rgba(240,240,252,.6)':'rgba(255,255,255,.01)',
              position:'relative'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div onClick={()=>setView('profile')} style={{cursor:'pointer',flexShrink:0}}>
                  <Avatar name={user?.name} size={36}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <p onClick={()=>setView('profile')}
                      style={{fontSize:13,fontWeight:600,color:'var(--text)',
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                        margin:0,cursor:'pointer',letterSpacing:'-0.2px'}}>
                      {user?.name||'User'}
                    </p>
                    {isAdmin&&<span style={{fontSize:8,padding:'1px 6px',borderRadius:4,
                      background:'rgba(244,63,94,.15)',color:'var(--danger)',
                      fontWeight:700,flexShrink:0,letterSpacing:'.5px'}}>ADMIN</span>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:5,marginTop:3}}>
                    <div style={{width:5,height:5,borderRadius:'50%',background:'var(--success)',
                      boxShadow:'0 0 6px rgba(16,185,129,.7)'}}/>
                    <span style={{fontSize:10,color:'var(--muted)',fontWeight:500}}>Lv.{lvl.level} · Active</span>
                  </div>
                </div>

                {/* Beautiful theme toggle button */}
                <button className="theme-btn-trigger"
                  onClick={()=>setShowThemePicker(p=>!p)}
                  title="Change theme"
                  style={{width:30,height:30,borderRadius:9,cursor:'pointer',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,
                    background:showThemePicker
                      ?'linear-gradient(135deg,rgba(109,40,217,.2),rgba(139,92,246,.1))'
                      :'var(--surface2)',
                    border:`1px solid ${showThemePicker?'rgba(139,92,246,.4)':'var(--border)'}`,
                    color:showThemePicker?'var(--accent3)':'var(--muted2)',
                    boxShadow:showThemePicker?'0 0 12px rgba(109,40,217,.25)':'none',
                    transition:'all .18s ease'}}>
                  {resolvedTheme==='light'?'☀️':'🌙'}
                </button>

                <button className="btn-ghost" onClick={()=>{logout();navigate('/login')}} title="Logout"
                  style={{width:30,height:30,borderRadius:8,background:'var(--surface2)',
                    border:'1px solid var(--border)',color:'var(--muted)',fontSize:13,
                    display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>⏻</button>
              </div>
            </div>
            </div>{/* /theme-picker-area */}
          </aside>
        )}

        {/* Main content */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',
          background:'var(--bg)',
          backgroundImage:resolvedTheme==='light'
            ?'radial-gradient(ellipse at 20% 0%,rgba(109,40,217,.04) 0%,transparent 60%),radial-gradient(ellipse at 80% 100%,rgba(59,130,246,.03) 0%,transparent 50%)'
            :'radial-gradient(ellipse at 20% 0%,rgba(109,40,217,.06) 0%,transparent 60%),radial-gradient(ellipse at 80% 100%,rgba(59,130,246,.04) 0%,transparent 50%)'}}>
          {/* Header */}
          <header style={{flexShrink:0,display:'flex',alignItems:'center',gap:10,padding:'12px 20px',
            background:resolvedTheme==='light'?'rgba(250,250,255,.97)':'rgba(14,14,20,.95)',borderBottom:'1px solid var(--border)',
            backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)'}}>
            <button className="btn-ghost" onClick={()=>setSideOpen(s=>!s)}
              style={{width:34,height:34,borderRadius:10,background:'var(--surface2)',
                border:'1px solid var(--border)',color:'var(--muted2)',fontSize:16,
                display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>☰</button>
            <div style={{flex:1,minWidth:0}}>
              <h1 style={{fontSize:15,fontWeight:600,color:'var(--text)',fontFamily:'Outfit,sans-serif',
                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:'-0.2px'}}>{headerTitle()}</h1>
              <p className="header-date" style={{fontSize:10,color:'var(--muted)',marginTop:1,fontWeight:500}}>
                {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
              </p>
            </div>
            <NotificationBell />
            {view==='tasks'&&(
              <>
                <div className="header-search" style={{position:'relative'}}>
                  <span style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',
                    color:'var(--muted)',fontSize:13,pointerEvents:'none'}}>⌕</span>
                  <input type="text" placeholder="Search tasks…" value={search} onChange={e=>setSearch(e.target.value)}
                    style={{paddingLeft:32,paddingRight:12,paddingTop:8,paddingBottom:8,
                      borderRadius:10,background:'var(--surface2)',border:'1px solid var(--border)',
                      color:'var(--text)',fontSize:13,outline:'none',width:180,transition:'all .2s',
                      fontFamily:'Space Grotesk,sans-serif'}}
                    onFocus={e=>{e.target.style.borderColor='var(--accent2)';e.target.style.width='210px'}}
                    onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.width='180px'}}/>
                </div>
                <div style={{display:'flex',gap:2,background:'var(--surface2)',borderRadius:10,padding:3,border:'1px solid var(--border)'}}>
                  {[['list','≡'],['kanban','⊞'],['calendar','▦']].map(([mode,ic])=>(
                    <button key={mode} onClick={()=>setViewMode(mode)}
                      style={{width:30,height:26,borderRadius:7,border:'none',fontSize:14,cursor:'pointer',
                        transition:'all .14s',
                        background:viewMode===mode?'var(--accent)':'transparent',
                        color:viewMode===mode?'#fff':'var(--muted)',
                        boxShadow:viewMode===mode?'0 2px 8px var(--glow)':'none'}}>
                      {ic}
                    </button>
                  ))}
                </div>
                {overdue>0&&(
                  <div style={{padding:'5px 10px',borderRadius:8,background:'var(--danger2)',
                    border:'1px solid rgba(244,63,94,.25)',color:'var(--danger)',
                    fontSize:11,fontWeight:700,flexShrink:0,animation:'pulseRing 2s infinite'}}>
                    ⚠ {overdue}
                  </div>
                )}
                <button className="btn-primary" onClick={openNew}
                  style={{padding:'9px 18px',borderRadius:10,border:'none',
                    background:'linear-gradient(135deg,var(--accent),var(--accent2))',
                    color:'#fff',fontSize:13,fontWeight:600,letterSpacing:'-0.1px',
                    boxShadow:'0 4px 16px var(--glow)',flexShrink:0,cursor:'pointer',
                    fontFamily:'Space Grotesk,sans-serif'}}>
                  + New Task
                </button>
              </>
            )}
          </header>

          {/* Content */}
          <div className="main-pad" style={{flex:1,overflowY:'auto',padding:22}}>
            {view==='focus'?<DailyFocus onNavigateToTasks={()=>setView('tasks')}/>
            :view==='weekly'?<WeeklyReview/>
            :view==='pomodoro'?<PomodoroTimer tasks={tasks} onSessionComplete={()=>loadTasks&&loadTasks()} running={pomRunning} setRunning={setPomRunning} secs={pomSecs} setSecs={setPomSecs} mode={pomMode} setMode={setPomMode} sessions={pomSessions} setSessions={setPomSessions}/>
            :view==='leaderboard'?<Leaderboard/>
            :view==='habits'?<HabitTracker/>
            :view==='calendar'?<CalendarView tasks={tasks} onTaskClick={t=>{setEditTask(t);setModal(true)}} onDayClick={d=>{setModal(true)}}/>
            :view==='matrix'?<EisenhowerMatrix tasks={tasks} onTaskClick={t=>{setEditTask(t);setModal(true)}}/>
            :view==='export'?<ExportPanel tasks={tasks}/>
            :view==='reminders'?<SmartReminders onTaskClick={t=>{setEditTask(t);setModal(true)}}/>
            :view==='advanced-analytics'?<AdvancedAnalytics/>
            :view==='gcal'?<GoogleCalendarSync tasks={tasks}/>
            :view==='email-task'?<EmailToTask onTaskCreated={fetchAll}/>
            :view==='ai-breakdown'?<AITaskBreakdown onSaved={fetchAll}/>
            :view==='profile'?<ProfilePage/>
            :view==='analytics'?<AnalyticsPanel/>
            :view==='ai'?<AIPanel onTaskParsed={t=>{setEditTask(null);setModal(true)}}/>
            :view==='teams'?<TeamsPanel/>
            :view==='admin'&&isAdmin?<AdminDashboard/>
            :(
              <>
                {/* Stats */}
                <div className="stat-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
                  {[
                    {label:'Completed',value:stats?.completedTasks??done,sub:`of ${tasks.length} tasks`,color:'var(--success)',glow:'rgba(16,185,129,.2)',icon:'✓',delay:0},
                    {label:'Focus Score',value:stats?.focusScore??0,sub:'XP earned',color:'var(--accent3)',glow:'rgba(139,92,246,.2)',icon:'⚡',delay:60},
                    {label:'Streak',value:stats?.streak??0,sub:'days running',color:'var(--warn)',glow:'rgba(245,158,11,.2)',icon:'🔥',delay:120},
                    {label:'Pending',value:pending,sub:`${high} high priority`,color:'var(--danger)',glow:'rgba(244,63,94,.2)',icon:'◎',delay:180},
                  ].map(s=>(
                    <div key={s.label} className="stat-card" style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:18,padding:'20px 22px',position:'relative',overflow:'hidden',animation:'fadeUp .5s ease both',animationDelay:`${s.delay}ms`}}>
                      <div style={{position:'absolute',top:0,left:0,right:0,height:1.5,background:`linear-gradient(90deg,${s.color},${s.color}00)`}}/>
                      <div style={{position:'absolute',bottom:-10,right:-10,width:70,height:70,borderRadius:'50%',background:s.glow,filter:'blur(20px)',pointerEvents:'none'}}/>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                        <p style={{fontSize:10,fontWeight:600,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--muted)',fontFamily:'Outfit,sans-serif'}}>{s.label}</p>
                        <div style={{width:28,height:28,borderRadius:8,background:`${s.color}15`,border:`1px solid ${s.color}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:s.color}}>{s.icon}</div>
                      </div>
                      <p style={{fontSize:34,fontWeight:800,color:s.color,lineHeight:1,marginBottom:4,fontFamily:'Outfit,sans-serif',letterSpacing:'-1px',animation:'countUp .5s ease both'}}>{s.value}</p>
                      <p style={{fontSize:11,color:'var(--muted)',fontWeight:500}}>{s.sub}</p>
                    </div>
                  ))}
                </div>

                {viewMode==='list'&&(
                  <>
                    <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:14,flexWrap:'wrap'}}>
                      {fBtn('ALL','All',tasks.length)}
                      {fBtn('TODO','To Do',tasks.filter(t=>t.status==='TODO').length)}
                      {fBtn('IN_PROGRESS','In Progress',tasks.filter(t=>t.status==='IN_PROGRESS').length)}
                      {fBtn('DONE','Done',done)}
                      <span style={{marginLeft:'auto',fontSize:11,color:'var(--muted)'}}>{filtered.length} task{filtered.length!==1?'s':''}</span>
                    </div>
                    {loading
                      ? [1,2,3,4,5].map(i=>(
                          <div key={i} className="skel" style={{height:70,marginBottom:7,
                            borderRadius:14,opacity:1-(i*0.12)}}/>
                        ))
                      : filtered.length===0
                        ? <div style={{textAlign:'center',padding:'70px 0',animation:'fadeUp .4s ease'}}>
                            <div style={{fontSize:60,marginBottom:16,filter:'grayscale(.1)',animation:'fadeIn .4s ease'}}>{search?'🔍':filter==='DONE'?'🎉':'✦'}</div>
                            <p style={{fontSize:18,fontWeight:700,color:'var(--text)',marginBottom:8,fontFamily:'Outfit,sans-serif',letterSpacing:'-0.3px'}}>{search?'No results found':filter==='DONE'?'Nothing completed yet':'Start your first task'}</p>
                            <p style={{fontSize:13,color:'var(--muted)',marginBottom:28,maxWidth:260,lineHeight:1.6}}>{search?'Try different keywords':'Add a task and start crushing your goals'}</p>
                            {!search&&<button className="empty-state-btn" onClick={openNew}
                              style={{padding:'11px 28px',borderRadius:12,border:'none',
                                background:'linear-gradient(135deg,var(--accent),var(--accent2))',
                                color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',
                                boxShadow:'0 4px 20px var(--glow)',letterSpacing:'-0.1px',
                                fontFamily:'Space Grotesk,sans-serif'}}>
                              + Create First Task
                            </button>}
                          </div>
                        : filtered.map((t,i)=><TaskRow key={t.id} task={t} idx={i} onToggle={()=>handleToggle(t.id)} onEdit={()=>openEdit(t)} onDelete={()=>handleDelete(t.id)}/>)
                    }
                  </>
                )}

                {viewMode==='kanban'&&<Kanban tasks={filtered} onEdit={openEdit} onStatusChange={handleStatusChange}/>}
                {viewMode==='calendar'&&<Calendar tasks={tasks} onEdit={openEdit}/>}
              </>
            )}
          </div>
        </div>

        {/* Mobile FAB */}
        {view==='tasks'&&<button className="fab" onClick={openNew}>+</button>}

        {/* Onboarding wizard */}
        {showOnboarding&&<OnboardingWizard onComplete={()=>{setShowOnboarding(false)}} />}

        {/* Persistent Pomodoro Mini-bar — shows when timer running and not on pomodoro view */}
        {pomRunning && view!=='pomodoro' && (
          <div className="pom-minibar" onClick={()=>setView('pomodoro')} style={{
            position:'fixed',bottom:0,left:0,right:0,zIndex:200,
            background:`linear-gradient(135deg,${pomModeColor}22,${pomModeColor}11)`,
            borderTop:`2px solid ${pomModeColor}`,
            backdropFilter:'blur(20px)',
            display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'10px 20px',cursor:'pointer',gap:12}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:20,animation:'pomPulse 1s infinite'}}>{pomMode==='focus'?'🎯':pomMode==='short'?'☕':'🌙'}</span>
              <div>
                <p style={{margin:0,fontSize:11,color:'var(--muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px'}}>
                  {pomMode==='focus'?'Focus Session':pomMode==='short'?'Short Break':'Long Break'}
                </p>
                <p style={{margin:0,fontSize:22,fontWeight:800,color:'#fff',fontFamily:'monospace',letterSpacing:'2px'}}>
                  {pomFormatTime(pomSecs)}
                </p>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:11,color:'var(--muted)'}}>Session {pomSessions+1}</span>
              <button onClick={e=>{e.stopPropagation();setPomRunning(false)}}
                style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${pomModeColor}44`,
                  background:`${pomModeColor}22`,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                Pause
              </button>
              <button onClick={e=>{e.stopPropagation();setPomRunning(false);setPomSecs(25*60);setPomMode('focus')}}
                style={{padding:'6px 14px',borderRadius:8,border:'1px solid rgba(255,255,255,.1)',
                  background:'rgba(255,255,255,.05)',color:'var(--muted)',fontSize:12,cursor:'pointer'}}>
                Stop
              </button>
            </div>
          </div>
        )}

        {/* Mobile bottom nav */}
        <nav className="bnav" style={{justifyContent:'space-around',alignItems:'center'}}>
          {[['tasks','📋','Tasks'],['focus','🎯','Focus'],['pomodoro','⏱','Timer'],['leaderboard','🏆','Ranks'],['profile','👤','Me']].map(([v,ic,lb])=>(
            <button key={v} className="bnav-btn" onClick={()=>{setView(v);setSideOpen(false)}}
              style={{color:view===v?'var(--accent3)':'var(--muted)',fontWeight:view===v?600:400}}>
              <div style={{width:36,height:28,display:'flex',alignItems:'center',justifyContent:'center',
                borderRadius:10,transition:'all .15s',
                background:view===v?'rgba(109,40,217,.15)':'transparent',
                border:view===v?'1px solid rgba(139,92,246,.2)':'1px solid transparent'}}>
                <span style={{fontSize:17,lineHeight:1}}>{ic}</span>
              </div>
              <span style={{fontSize:9,letterSpacing:'.3px',fontFamily:'Space Grotesk,sans-serif'}}>{lb}</span>
              {view===v&&<div className="bnav-dot"/>}
            </button>
          ))}
        </nav>

        {/* Task Modal */}
        {modal&&<TaskModal task={editTask} onClose={()=>{setModal(false);setEditTask(null)}} onSave={handleSave} me={user}/>}

        {/* Toast */}
        {toast&&(
          <div style={{position:'fixed',bottom:88,right:20,zIndex:999,
            padding:'12px 18px',borderRadius:14,
            background:resolvedTheme==='light'?'rgba(255,255,255,.97)':'rgba(10,10,16,.96)',
            border:`1px solid ${toast.type==='success'?'rgba(16,185,129,.4)':'rgba(244,63,94,.4)'}`,
            color:toast.type==='success'?'var(--success)':'var(--danger)',
            fontSize:13,fontWeight:600,letterSpacing:'-0.1px',
            boxShadow:'0 8px 40px rgba(0,0,0,.6)',
            backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
            animation:'fadeUp .25s ease',display:'flex',alignItems:'center',gap:9,
            fontFamily:'Space Grotesk,sans-serif'}}>
            <div style={{width:7,height:7,borderRadius:'50%',flexShrink:0,
              background:toast.type==='success'?'var(--success)':'var(--danger)',
              boxShadow:`0 0 8px ${toast.type==='success'?'var(--success)':'var(--danger)'}`}}/>
            {toast.msg}
          </div>
        )}
      </div>
    </>
  )
}