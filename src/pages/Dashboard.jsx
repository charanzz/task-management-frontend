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
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0a0a0f;--surface:#111118;--surface2:#1a1a24;--surface3:#22222f;
    --border:rgba(255,255,255,.06);--border2:rgba(255,255,255,.1);
    --text:#f0f0f8;--muted:#6b6b8a;
    --accent:#7c3aed;--accent2:#a855f7;--accent3:#c084fc;
    --glow:rgba(124,58,237,.3);--danger:#ff6b6b;--warn:#ffd93d;--success:#6bcb77;
  }
  body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes modalIn{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
  .skel{background:linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 50%,var(--surface2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:12px}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:var(--surface3);border-radius:4px}
  button,input,select,textarea{font-family:'DM Sans',sans-serif}
  .task-row:hover{background:var(--surface2)!important;border-color:var(--border2)!important}
  .kcard{cursor:grab;transition:box-shadow .15s}.kcard:active{cursor:grabbing;opacity:.7}
  .kcol.dragover{background:rgba(124,58,237,.08)!important;border-color:rgba(124,58,237,.3)!important}
  .cal-day:hover{background:var(--surface2)!important}
  .nav-item:hover{background:var(--surface2)!important}
  .sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99;backdrop-filter:blur(4px)}
  @media(max-width:768px){
    .sidebar-overlay.open{display:block}
    .sidebar{position:fixed!important;left:0;top:0;bottom:0;z-index:100;transform:translateX(-100%);transition:transform .25s ease!important}
    .sidebar.open{transform:translateX(0)!important}
    .stat-grid{grid-template-columns:1fr 1fr!important;gap:10px!important}
    .header-search{display:none!important}
    .fab{display:flex!important}
    .kgrid{grid-template-columns:1fr!important}
    .task-form-grid{grid-template-columns:1fr!important}
    .main-pad{padding-bottom:80px!important}
  }
  .fab{display:none;position:fixed;bottom:80px;right:20px;z-index:50;width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:24px;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(124,58,237,.5);border:none;cursor:pointer}
  .bnav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:50;background:var(--surface);border-top:1px solid var(--border);padding:8px 0 env(safe-area-inset-bottom,8px)}
  @media(max-width:768px){.bnav{display:flex}.main-pad{padding-bottom:80px!important}}
`

// ── Tiny helpers ─────────────────────────────────────────────
function Spin({s=16}){return <span style={{width:s,height:s,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite',flexShrink:0}}/>}

const INP = {width:'100%',padding:'10px 13px',background:'var(--surface2)',border:'1px solid var(--border2)',borderRadius:10,color:'var(--text)',fontSize:13,outline:'none',transition:'border-color .2s',colorScheme:'dark'}
const focus = e => e.target.style.borderColor='var(--accent)'
const blur  = e => e.target.style.borderColor='var(--border2)'

function Avatar({name,size=28}){
  const colors=['#7c3aed','#0ea5e9','#f59e0b','#10b981','#ef4444']
  const bg=colors[(name?.charCodeAt(0)||0)%colors.length]
  return <div style={{width:size,height:size,borderRadius:size*.28,background:`linear-gradient(135deg,${bg},${bg}bb)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.42,fontWeight:800,color:'#fff',flexShrink:0}}>{(name?.[0]||'?').toUpperCase()}</div>
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
  const set=(k,v)=>setF(p=>({...p,[k]:v}))

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
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',backdropFilter:'blur(10px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:'100%',maxWidth:560,maxHeight:'90vh',background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:22,overflow:'hidden',boxShadow:'0 30px 80px rgba(0,0,0,.8)',animation:'modalIn .25s ease',display:'flex',flexDirection:'column'}}>
        
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',borderBottom:'1px solid var(--border)',background:'linear-gradient(135deg,rgba(124,58,237,.07),transparent)',flexShrink:0}}>
          <div>
            <h2 style={{fontSize:17,fontWeight:700,color:'var(--text)',fontFamily:'Syne,sans-serif'}}>{isEdit?'✎ Edit Task':'⚡ New Task'}</h2>
            <p style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{isEdit?'Update details':'Add to your board'}</p>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:9,background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--muted)',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:4,padding:'10px 22px 0',borderBottom:'1px solid var(--border)',flexShrink:0}}>
          {TABS.map(([key,ic,lb])=>(
            <button key={key} onClick={()=>setTab(key)} style={{padding:'7px 14px',borderRadius:'9px 9px 0 0',fontSize:12,fontWeight:600,cursor:'pointer',
              background:tab===key?'var(--surface2)':'transparent',color:tab===key?'var(--accent3)':'var(--muted)',
              border:tab===key?'1px solid var(--border)':'1px solid transparent',borderBottom:tab===key?'1px solid var(--surface2)':'none',transition:'all .15s'}}>
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
    if(diff<0)return{text:`${-diff}d overdue`,color:'var(--danger)'}
    if(diff===0)return{text:'Due today',color:'var(--warn)'}
    if(diff<=2)return{text:`In ${diff}d`,color:'var(--warn)'}
    return{text:d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}),color:'var(--muted)'}
  }
  const due=dueInfo()

  function handleDel(){
    if(confirmDel){onDelete();setConfirm(false)}
    else{setConfirm(true);setTimeout(()=>setConfirm(false),3000)}
  }

  return(
    <div className="task-row" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,marginBottom:8,transition:'all .18s',opacity:isDone?.6:1,animation:`slideIn .35s ease both`,animationDelay:`${idx*.04}s`,position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:cfg.color,borderRadius:'3px 0 0 3px'}}/>
      <button onClick={onToggle} style={{width:22,height:22,borderRadius:7,flexShrink:0,background:isDone?cfg.color:'transparent',border:`2px solid ${isDone?cfg.color:'var(--border2)'}`,color:'#fff',fontSize:11,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .15s'}}>
        {isDone?'✓':''}
      </button>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
          <p style={{fontSize:14,fontWeight:500,color:isDone?'var(--muted)':'var(--text)',textDecoration:isDone?'line-through':'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',margin:0}}>
            {task.title}
          </p>
          {task.recurring&&<span style={{fontSize:9,padding:'1px 5px',borderRadius:4,background:'rgba(96,165,250,.15)',color:'#60a5fa',fontWeight:700,flexShrink:0}}>🔁</span>}
          {(task.comments?.length||0)>0&&<span style={{fontSize:9,padding:'1px 5px',borderRadius:4,background:'rgba(255,255,255,.06)',color:'var(--muted)',flexShrink:0}}>💬{task.comments.length}</span>}
        </div>
        {stTotal>0&&(
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <div style={{width:50,height:3,background:'var(--surface3)',borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${(st/stTotal)*100}%`,background:'var(--accent)',borderRadius:3}}/></div>
            <span style={{fontSize:10,color:'var(--muted)'}}>{st}/{stTotal}</span>
          </div>
        )}
        {task.description&&!stTotal&&<p style={{fontSize:11,color:'var(--muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.description}</p>}
      </div>
      {due&&<span style={{fontSize:11,color:due.color,flexShrink:0,whiteSpace:'nowrap'}}>{due.text}</span>}
      <span className="task-card-status" style={{fontSize:10,fontWeight:600,padding:'3px 9px',borderRadius:20,background:`${scfg.color}18`,color:scfg.color,border:`1px solid ${scfg.color}30`,flexShrink:0,whiteSpace:'nowrap'}}>{scfg.emoji} {scfg.label}</span>
      <span style={{fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:7,background:cfg.bg,color:cfg.color,flexShrink:0,whiteSpace:'nowrap'}}>{cfg.label}</span>
      <span style={{fontSize:12,fontWeight:700,color:cfg.color,minWidth:32,textAlign:'right',fontFamily:'Syne,sans-serif',flexShrink:0}}>+{cfg.pts}</span>
      <div style={{display:'flex',gap:5,opacity:hover?1:0,transition:'opacity .15s',flexShrink:0}}>
        <button onClick={onEdit} style={{width:28,height:28,borderRadius:8,background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--muted)',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>✎</button>
        <button onClick={handleDel} title={confirmDel?'Confirm?':'Delete'} style={{width:28,height:28,borderRadius:8,background:confirmDel?'rgba(255,107,107,.15)':'var(--surface2)',border:`1px solid ${confirmDel?'var(--danger)':'var(--border2)'}`,color:confirmDel?'var(--danger)':'var(--muted)',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .15s'}}>
          {confirmDel?'!':'✕'}
        </button>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard(){
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
  const [view,setView]=useState('tasks')
  const [viewMode,setViewMode]=useState('list')
  const [roleFromApi,setRoleFromApi]=useState('USER')
  const {user,login,logout}=useAuth()
  const navigate=useNavigate()

  useEffect(()=>{
    api.get('/api/users/me').then(r=>{
      setRoleFromApi(r.data.role||'USER')
      if(user) login(localStorage.getItem('token'),{...user,role:r.data.role,isPro:r.data.isPro})
    }).catch(()=>{})
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
    <button onClick={()=>setFilter(key)} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:9,fontSize:12,fontWeight:500,cursor:'pointer',
      background:filter===key?'var(--accent)':'var(--surface2)',color:filter===key?'#fff':'var(--muted)',
      border:filter===key?'none':'1px solid var(--border)',transition:'all .15s'}}>
      {label}<span style={{fontSize:10,padding:'1px 6px',borderRadius:5,background:filter===key?'rgba(255,255,255,.2)':'var(--surface3)',color:filter===key?'#fff':'var(--muted)'}}>{count}</span>
    </button>
  )

  function headerTitle(){
    if(view==='ai')return<>🤖 <span style={{color:'var(--accent2)'}}>AI Assistant</span></>
    if(view==='analytics')return<>📊 <span style={{color:'var(--accent2)'}}>Analytics</span></>
    if(view==='teams')return<>👥 <span style={{color:'var(--accent2)'}}>Teams</span></>
    if(view==='admin')return<>🛡️ <span style={{color:'var(--danger)'}}>Admin</span></>
    if(view==='profile')return<>👤 <span style={{color:'var(--accent2)'}}>My Profile</span></>
    return<>{greet}, <span style={{color:'var(--accent2)'}}>{user?.name||'there'}</span> ✦</>
  }

  return(
    <>
      <style>{G}</style>
      <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'var(--bg)'}}>

        {/* Sidebar overlay */}
        {sideOpen&&<div className="sidebar-overlay open" onClick={()=>setSideOpen(false)}/>}

        {/* Sidebar */}
        {sideOpen&&(
          <aside className="sidebar open" style={{width:236,flexShrink:0,background:'var(--surface)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',height:'100%',transition:'transform .25s ease'}}>
            {/* Logo */}
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'16px 14px',borderBottom:'1px solid var(--border)'}}>
              <div style={{width:34,height:34,borderRadius:10,background:'linear-gradient(135deg,var(--accent),var(--accent2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0,boxShadow:'0 4px 12px var(--glow)'}}>⚡</div>
              <span style={{fontSize:17,fontWeight:800,color:'var(--text)',fontFamily:'Syne,sans-serif'}}>TaskFlow</span>
            </div>

            <nav style={{flex:1,padding:'12px 10px',overflowY:'auto'}}>
              <p style={{fontSize:9,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',padding:'0 8px',marginBottom:6}}>TASKS</p>
              {navItems.map(item=>{
                const active=view==='tasks'&&filter===item.key
                return(
                  <button key={item.key} className="nav-item" onClick={()=>{setFilter(item.key);setView('tasks')}}
                    style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'9px 10px',borderRadius:10,marginBottom:2,cursor:'pointer',fontSize:13,fontWeight:500,textAlign:'left',transition:'all .12s',
                      background:active?'rgba(124,58,237,.1)':'transparent',color:active?'var(--accent2)':'var(--muted)',
                      border:active?'1px solid rgba(124,58,237,.2)':'1px solid transparent'}}>
                    <span style={{width:17,textAlign:'center'}}>{item.icon}</span>
                    <span style={{flex:1}}>{item.label}</span>
                    <span style={{fontSize:10,padding:'1px 7px',borderRadius:6,background:'var(--surface2)',color:'var(--muted)'}}>{item.count}</span>
                  </button>
                )
              })}

              <p style={{fontSize:9,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',padding:'16px 8px 6px'}}>INSIGHTS</p>
              {[['analytics','📊','Analytics',null],['ai','🤖','AI Assistant','NEW'],['teams','👥','Teams',null],['profile','👤','My Profile',null]].map(([v,ic,lb,badge])=>(
                <button key={v} className="nav-item" onClick={()=>setView(v)}
                  style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'9px 10px',borderRadius:10,marginBottom:2,cursor:'pointer',fontSize:13,fontWeight:500,textAlign:'left',transition:'all .12s',
                    background:view===v?'rgba(124,58,237,.1)':'transparent',color:view===v?'var(--accent2)':'var(--muted)',
                    border:view===v?'1px solid rgba(124,58,237,.2)':'1px solid transparent'}}>
                  <span style={{width:17,textAlign:'center'}}>{ic}</span>
                  <span style={{flex:1}}>{lb}</span>
                  {badge&&<span style={{fontSize:9,padding:'2px 6px',borderRadius:5,background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',fontWeight:700}}>{badge}</span>}
                </button>
              ))}

              <button onClick={()=>navigate('/pricing')} style={{width:'100%',display:'flex',alignItems:'center',gap:9,padding:'9px 10px',borderRadius:10,marginBottom:2,cursor:'pointer',fontSize:13,fontWeight:500,textAlign:'left',background:'rgba(255,217,61,.06)',border:'1px solid rgba(255,217,61,.15)',color:'var(--warn)'}}>
                <span style={{width:17,textAlign:'center'}}>⭐</span><span>Upgrade to Pro</span>
              </button>

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
              <div style={{margin:'14px 2px 0',padding:'13px 11px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:12}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:7}}>
                    <span style={{fontSize:17}}>⚡</span>
                    <div>
                      <p style={{fontSize:12,fontWeight:700,color:'var(--accent2)',fontFamily:'Syne,sans-serif',margin:0}}>Level {lvl.level}</p>
                      <p style={{fontSize:10,color:'var(--muted)',margin:0}}>{LVL[lvl.level]||'Legend'}</p>
                    </div>
                  </div>
                  <span style={{fontSize:11,color:'var(--muted)'}}>{lvl.focusScore}pts</span>
                </div>
                <div style={{background:'var(--surface3)',borderRadius:6,height:5,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,var(--accent),var(--accent2))',borderRadius:6,transition:'width .4s ease'}}/>
                </div>
                <p style={{fontSize:10,color:'var(--muted)',marginTop:5}}>{lvl.nextLevelAt-lvl.focusScore}pts to next</p>
              </div>

              {/* Badges */}
              {badges.length>0&&(
                <div style={{margin:'10px 2px 0',padding:'11px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:12}}>
                  <p style={{fontSize:9,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:8}}>BADGES</p>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {badges.map(b=>(
                      <div key={b.id} title={b.description} style={{padding:'3px 9px',borderRadius:20,fontSize:11,fontWeight:600,background:'rgba(124,58,237,.1)',border:'1px solid rgba(124,58,237,.2)',color:'var(--accent3)',cursor:'default'}}>
                        {b.emoji} {b.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {overdue>0&&(
                <div style={{margin:'10px 2px 0',padding:'11px',background:'rgba(255,107,107,.07)',border:'1px solid rgba(255,107,107,.2)',borderRadius:12}}>
                  <p style={{fontSize:11,fontWeight:600,color:'var(--danger)',marginBottom:3}}>⚠ {overdue} Overdue</p>
                  <p style={{fontSize:11,color:'var(--muted)'}}>{overdue} task{overdue>1?'s':''} past deadline</p>
                </div>
              )}
            </nav>

            {/* Profile */}
            <div style={{padding:'12px 13px',borderTop:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:9}}>
                <Avatar name={user?.name} size={34}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <p style={{fontSize:13,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',margin:0}}>{user?.name||'User'}</p>
                    {isAdmin&&<span style={{fontSize:9,padding:'1px 5px',borderRadius:4,background:'rgba(255,107,107,.15)',color:'var(--danger)',fontWeight:700,flexShrink:0}}>ADMIN</span>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:'var(--success)',boxShadow:'0 0 6px rgba(107,203,119,.6)'}}/>
                    <span style={{fontSize:10,color:'var(--muted)'}}>Lv.{lvl.level} Active</span>
                  </div>
                </div>
                <button onClick={()=>setView('profile')} title="Profile"
                  style={{width:30,height:30,borderRadius:8,background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--muted)',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>👤</button>
                <button onClick={()=>{logout();navigate('/login')}} title="Logout" style={{width:30,height:30,borderRadius:8,background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--muted)',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>⏻</button>
              </div>
            </div>
          </aside>
        )}

        {/* Main content */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {/* Header */}
          <header style={{flexShrink:0,display:'flex',alignItems:'center',gap:11,padding:'12px 22px',background:'var(--surface)',borderBottom:'1px solid var(--border)'}}>
            <button onClick={()=>setSideOpen(s=>!s)} style={{width:32,height:32,borderRadius:9,background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--muted)',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>☰</button>
            <div style={{flex:1,minWidth:0}}>
              <h1 style={{fontSize:15,fontWeight:700,color:'var(--text)',fontFamily:'Syne,sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{headerTitle()}</h1>
              <p style={{fontSize:11,color:'var(--muted)',marginTop:1}}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</p>
            </div>
            <NotificationBell />
            {view==='tasks'&&(
              <>
                <div className="header-search" style={{position:'relative'}}>
                  <span style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'var(--muted)',fontSize:13,pointerEvents:'none'}}>⌕</span>
                  <input type="text" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}
                    style={{paddingLeft:30,paddingRight:12,paddingTop:8,paddingBottom:8,borderRadius:10,background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)',fontSize:13,outline:'none',width:170}}
                    onFocus={focus} onBlur={blur}/>
                </div>
                {/* View switcher */}
                <div style={{display:'flex',gap:3,background:'var(--surface2)',borderRadius:9,padding:3,border:'1px solid var(--border)'}}>
                  {[['list','☰'],['kanban','⊞'],['calendar','📅']].map(([mode,ic])=>(
                    <button key={mode} onClick={()=>setViewMode(mode)} style={{width:30,height:26,borderRadius:6,border:'none',fontSize:13,cursor:'pointer',transition:'all .15s',background:viewMode===mode?'var(--accent)':'transparent',color:viewMode===mode?'#fff':'var(--muted)'}}>
                      {ic}
                    </button>
                  ))}
                </div>
                {overdue>0&&<div style={{padding:'5px 11px',borderRadius:8,background:'rgba(255,107,107,.1)',border:'1px solid rgba(255,107,107,.2)',color:'var(--danger)',fontSize:12,fontWeight:600,flexShrink:0}}>⚠ {overdue}</div>}
                <button onClick={openNew} style={{padding:'9px 18px',borderRadius:10,border:'none',background:'linear-gradient(135deg,var(--accent),var(--accent2))',color:'#fff',fontSize:13,fontWeight:700,boxShadow:'0 4px 14px var(--glow)',flexShrink:0,cursor:'pointer'}}
                  onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
                  onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                  + New Task
                </button>
              </>
            )}
          </header>

          {/* Content */}
          <div className="main-pad" style={{flex:1,overflowY:'auto',padding:22}}>
            {view==='profile'?<ProfilePage/>
            :view==='analytics'?<AnalyticsPanel/>
            :view==='ai'?<AIPanel onTaskParsed={t=>{setEditTask(null);setModal(true)}}/>
            :view==='teams'?<TeamsPanel/>
            :view==='admin'&&isAdmin?<AdminDashboard/>
            :(
              <>
                {/* Stats */}
                <div className="stat-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
                  {[
                    {label:'Completed',value:stats?.completedTasks??done,sub:`of ${tasks.length} total`,color:'var(--success)',icon:'✓',delay:0},
                    {label:'Focus Score',value:stats?.focusScore??0,sub:'points earned',color:'var(--accent2)',icon:'⚡',delay:70},
                    {label:'Day Streak',value:stats?.streak??0,sub:'days in a row',color:'var(--warn)',icon:'🔥',delay:140},
                    {label:'Pending',value:pending,sub:`${high} high priority`,color:'var(--danger)',icon:'⏳',delay:210},
                  ].map(s=>(
                    <div key={s.label} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:'18px 20px',position:'relative',overflow:'hidden',animation:`fadeUp .5s ease both`,animationDelay:`${s.delay}ms`}}>
                      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${s.color},transparent)`}}/>
                      <div style={{position:'absolute',top:12,right:14,fontSize:20,opacity:.08}}>{s.icon}</div>
                      <p style={{fontSize:9,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:9,fontFamily:'Syne,sans-serif'}}>{s.label}</p>
                      <p style={{fontSize:32,fontWeight:800,color:s.color,lineHeight:1,marginBottom:5,fontFamily:'Syne,sans-serif'}}>{s.value}</p>
                      <p style={{fontSize:11,color:'var(--muted)'}}>{s.sub}</p>
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
                      ? [1,2,3,4].map(i=><div key={i} className="skel" style={{height:64,marginBottom:8}}/>)
                      : filtered.length===0
                        ? <div style={{textAlign:'center',padding:'70px 0',animation:'fadeUp .4s ease'}}>
                            <div style={{fontSize:48,marginBottom:14}}>{search?'🔍':filter==='DONE'?'🎉':'📋'}</div>
                            <p style={{fontSize:16,fontWeight:700,color:'var(--text)',marginBottom:6,fontFamily:'Syne,sans-serif'}}>{search?'No results':filter==='DONE'?'No completed tasks':'No tasks yet'}</p>
                            <p style={{fontSize:13,color:'var(--muted)',marginBottom:22}}>{search?'Try a different search':'Click "+ New Task" to get started'}</p>
                            {!search&&<button onClick={openNew} style={{padding:'10px 26px',borderRadius:10,border:'none',background:'linear-gradient(135deg,var(--accent),var(--accent2))',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>+ Create First Task</button>}
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

        {/* Mobile bottom nav */}
        <nav className="bnav" style={{justifyContent:'space-around',alignItems:'center'}}>
          {[['tasks','📋','Tasks'],['analytics','📊','Stats'],['ai','🤖','AI'],['teams','👥','Teams']].map(([v,ic,lb])=>(
            <button key={v} onClick={()=>{setView(v);setSideOpen(false)}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'5px 12px',background:'none',border:'none',color:view===v?'var(--accent2)':'var(--muted)',fontSize:10,fontWeight:view===v?700:400,cursor:'pointer'}}>
              <span style={{fontSize:19}}>{ic}</span><span>{lb}</span>
              {view===v&&<div style={{width:4,height:4,borderRadius:'50%',background:'var(--accent2)'}}/>}
            </button>
          ))}
          <button onClick={()=>{logout();navigate('/login')}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'5px 12px',background:'none',border:'none',color:'var(--muted)',fontSize:10,cursor:'pointer'}}>
            <span style={{fontSize:19}}>⏻</span><span>Logout</span>
          </button>
        </nav>

        {/* Task Modal */}
        {modal&&<TaskModal task={editTask} onClose={()=>{setModal(false);setEditTask(null)}} onSave={handleSave} me={user}/>}

        {/* Toast */}
        {toast&&(
          <div style={{position:'fixed',bottom:80,right:16,padding:'12px 18px',borderRadius:12,fontSize:13,fontWeight:600,zIndex:300,
            background:toast.type==='success'?'rgba(107,203,119,.1)':'rgba(255,107,107,.1)',
            border:`1px solid ${toast.type==='success'?'rgba(107,203,119,.3)':'rgba(255,107,107,.3)'}`,
            color:toast.type==='success'?'var(--success)':'var(--danger)',
            backdropFilter:'blur(12px)',boxShadow:'0 8px 30px rgba(0,0,0,.4)',animation:'fadeUp .3s ease'}}>
            {toast.msg}
          </div>
        )}
      </div>
    </>
  )
}