import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { taskAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import AIPanel from './AIPanel'
import AnalyticsPanel from './AnalyticsPanel'
import TeamsPanel from './TeamsPanel'
import AdminDashboard from './AdminDashboard'

const PRI = {
  HIGH:   { color:'#ff6b6b', bg:'rgba(255,107,107,0.12)', label:'High',   pts:30, emoji:'🔴' },
  MEDIUM: { color:'#ffd93d', bg:'rgba(255,217,61,0.12)',  label:'Medium', pts:15, emoji:'🟡' },
  LOW:    { color:'#6bcb77', bg:'rgba(107,203,119,0.12)', label:'Low',    pts:5,  emoji:'🟢' },
}

const STATUS = {
  TODO:        { color:'#a78bfa', label:'To Do',       emoji:'📋' },
  IN_PROGRESS: { color:'#60a5fa', label:'In Progress', emoji:'⚡' },
  DONE:        { color:'#6bcb77', label:'Done',        emoji:'✅' },
}

const LEVEL_NAMES = ['','Novice','Apprentice','Achiever','Hustler','Warrior','Champion','Master','Elite','Legend','God Mode']

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0a0f; --surface: #111118; --surface2: #1a1a24; --surface3: #22222f;
    --border: rgba(255,255,255,0.06); --border2: rgba(255,255,255,0.1);
    --text: #f0f0f8; --muted: #6b6b8a;
    --accent: #7c3aed; --accent2: #a855f7; --accent3: #c084fc;
    --glow: rgba(124,58,237,0.3); --danger: #ff6b6b; --warn: #ffd93d; --success: #6bcb77;
  }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes badgePop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
  .skeleton { background:linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 50%,var(--surface2) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:12px; }
  ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:var(--surface3);border-radius:4px}
  button{cursor:pointer;font-family:'DM Sans',sans-serif} input,textarea,select{font-family:'DM Sans',sans-serif}
  .nav-btn:hover { background: var(--surface2) !important; }
`

function Spinner({ size=16 }) {
  return <span style={{width:size,height:size,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite',flexShrink:0}}/>
}

function StatCard({ label, value, sub, color, icon, delay=0 }) {
  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:'20px 22px',position:'relative',overflow:'hidden',animation:`fadeUp .5s ease both`,animationDelay:`${delay}ms`}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${color},transparent)`}}/>
      <div style={{position:'absolute',top:14,right:16,fontSize:22,opacity:.1,userSelect:'none',pointerEvents:'none'}}>{icon}</div>
      <p style={{fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:10,fontFamily:'Syne, sans-serif'}}>{label}</p>
      <p style={{fontSize:34,fontWeight:800,color,lineHeight:1,marginBottom:6,fontFamily:'Syne, sans-serif',position:'relative',zIndex:1}}>{value}</p>
      <p style={{fontSize:11,color:'var(--muted)'}}>{sub}</p>
    </div>
  )
}

function LevelBar({ level, focusScore, nextLevelAt }) {
  const pct = Math.min(100, Math.round((focusScore % 100) / 100 * 100))
  return (
    <div style={{margin:'16px 2px 0',padding:'14px 12px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:12}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:18}}>⚡</span>
          <div>
            <p style={{fontSize:12,fontWeight:700,color:'var(--accent2)',fontFamily:'Syne, sans-serif'}}>Level {level}</p>
            <p style={{fontSize:10,color:'var(--muted)'}}>{LEVEL_NAMES[level]||'Legend'}</p>
          </div>
        </div>
        <span style={{fontSize:11,color:'var(--muted)'}}>{focusScore} pts</span>
      </div>
      <div style={{background:'var(--surface3)',borderRadius:6,height:6,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,var(--accent),var(--accent2))',borderRadius:6,transition:'width .4s ease'}}/>
      </div>
      <p style={{fontSize:10,color:'var(--muted)',marginTop:5}}>{nextLevelAt-focusScore} pts to next level</p>
    </div>
  )
}

function BadgeGrid({ badges }) {
  if (!badges?.length) return (
    <div style={{margin:'12px 2px 0',padding:'12px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:12}}>
      <p style={{fontSize:11,color:'var(--muted)',textAlign:'center'}}>Complete tasks to earn badges! 🏆</p>
    </div>
  )
  return (
    <div style={{margin:'12px 2px 0',padding:'12px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:12}}>
      <p style={{fontSize:9,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:8}}>BADGES</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {badges.map(b=>(
          <div key={b.id} title={b.description} style={{padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:'rgba(124,58,237,.1)',border:'1px solid rgba(124,58,237,.2)',color:'var(--accent3)',cursor:'default',animation:'badgePop .4s ease'}}>
            {b.emoji} {b.name}
          </div>
        ))}
      </div>
    </div>
  )
}

function TaskCard({ task, onToggle, onEdit, onDelete, idx }) {
  const [hover,setHover]=useState(false)
  const [confirmDel,setConfirmDel]=useState(false)
  const isDone=task.status==='DONE'
  const cfg=PRI[task.priority]||PRI.MEDIUM
  const scfg=STATUS[task.status]||STATUS.TODO

  function dueInfo() {
    if (!task.dueDate) return null
    const d=new Date(task.dueDate)
    const diff=Math.ceil((d-Date.now())/86400000)
    if (diff<0)  return {text:`${-diff}d overdue`,color:'var(--danger)'}
    if (diff===0) return {text:'Due today',color:'var(--warn)'}
    if (diff<=2)  return {text:`Due in ${diff}d`,color:'var(--warn)'}
    return {text:d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}),color:'var(--muted)'}
  }
  const due=dueInfo()

  function handleDel() {
    if (confirmDel){onDelete();setConfirmDel(false)}
    else{setConfirmDel(true);setTimeout(()=>setConfirmDel(false),3000)}
  }

  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:hover?'var(--surface2)':'var(--surface)',border:`1px solid ${hover?'var(--border2)':'var(--border)'}`,borderRadius:14,marginBottom:8,transition:'all .18s ease',opacity:isDone?.6:1,animation:`slideIn .35s ease both`,animationDelay:`${idx*.05}s`,position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:cfg.color,borderRadius:'3px 0 0 3px'}}/>
      <button onClick={onToggle} style={{width:22,height:22,borderRadius:7,flexShrink:0,background:isDone?cfg.color:'transparent',border:`2px solid ${isDone?cfg.color:'var(--border2)'}`,color:'#fff',fontSize:11,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}>{isDone?'✓':''}</button>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:14,fontWeight:500,color:isDone?'var(--muted)':'var(--text)',textDecoration:isDone?'line-through':'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:3}}>{task.title}</p>
        {task.description&&<p style={{fontSize:11,color:'var(--muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.description}</p>}
      </div>
      {due&&<span style={{fontSize:11,color:due.color,flexShrink:0,whiteSpace:'nowrap'}}>{due.text}</span>}
      <span style={{fontSize:10,fontWeight:600,padding:'3px 10px',borderRadius:20,background:`${scfg.color}18`,color:scfg.color,border:`1px solid ${scfg.color}30`,flexShrink:0}}>{scfg.emoji} {scfg.label}</span>
      <span style={{fontSize:10,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',padding:'3px 10px',borderRadius:7,background:cfg.bg,color:cfg.color,flexShrink:0}}>{cfg.label}</span>
      <span style={{fontSize:12,fontWeight:700,color:cfg.color,minWidth:34,textAlign:'right',fontFamily:'Syne, sans-serif',flexShrink:0}}>+{cfg.pts}</span>
      <div style={{display:'flex',gap:5,opacity:hover?1:0,transition:'opacity .15s',flexShrink:0}}>
        <button onClick={onEdit} style={{width:28,height:28,borderRadius:8,background:'var(--surface2)',border:'1px solid var(--border2)',color:'var(--muted)',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'}}>✎</button>
        <button onClick={handleDel} style={{width:28,height:28,borderRadius:8,fontSize:13,background:confirmDel?'rgba(255,107,107,.15)':'var(--surface2)',border:`1px solid ${confirmDel?'var(--danger)':'var(--border2)'}`,color:confirmDel?'var(--danger)':'var(--muted)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}} title={confirmDel?'Click again to confirm':'Delete'}>
          {confirmDel?'!':'✕'}
        </button>
      </div>
    </div>
  )
}

function TaskModal({ task, onClose, onSave }) {
  const isEdit = !!(task?.id)
  const [f,setF]=useState({
    title:       task?.title||'',
    description: task?.description||'',
    priority:    task?.priority||'MEDIUM',
    status:      task?.status||'TODO',
    dueDate:     task?.dueDate ? task.dueDate.split('T')[0] : '',
    dueTime:     task?.dueDate ? task.dueDate.split('T')[1]?.slice(0,5)||'09:00' : '09:00',
  })
  const [err,setErr]=useState('')
  const [loading,setLoading]=useState(false)
  const set=(k,v)=>setF(p=>({...p,[k]:v}))

  useEffect(()=>{
    const h=e=>{if(e.key==='Escape')onClose()}
    window.addEventListener('keydown',h)
    return ()=>window.removeEventListener('keydown',h)
  },[onClose])

  const inp={width:'100%',padding:'11px 14px',background:'var(--surface2)',border:'1px solid var(--border2)',borderRadius:10,color:'var(--text)',fontSize:13,outline:'none',transition:'border-color .2s',display:'block',colorScheme:'dark'}

  async function submit(e) {
    e.preventDefault()
    if (!f.title.trim()){setErr('Task title is required.');return}
    setLoading(true);setErr('')
    try {
      const dueDate=f.dueDate?`${f.dueDate}T${f.dueTime||'00:00'}:00`:null
      await onSave({title:f.title,description:f.description,priority:f.priority,status:f.status,dueDate})
    } catch {
      setErr('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.8)',backdropFilter:'blur(8px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:'100%',maxWidth:520,background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:20,overflow:'hidden',boxShadow:'0 30px 80px rgba(0,0,0,.7)',animation:'fadeUp .25s ease'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',borderBottom:'1px solid var(--border)',background:'linear-gradient(135deg,rgba(124,58,237,.08),transparent)'}}>
          <div>
            <h2 style={{fontSize:18,fontWeight:700,color:'var(--text)',fontFamily:'Syne, sans-serif'}}>{isEdit?'✎ Edit Task':'⚡ New Task'}</h2>
            <p style={{fontSize:11,color:'var(--muted)',marginTop:3}}>{isEdit?'Update task details':'Add a task to your board'}</p>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:9,background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--muted)',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>
        <form onSubmit={submit} style={{padding:22}}>
          {err&&<div style={{background:'rgba(255,107,107,.08)',border:'1px solid rgba(255,107,107,.2)',borderRadius:9,padding:'10px 14px',fontSize:12,color:'var(--danger)',marginBottom:14}}>⚠ {err}</div>}
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Task Title *</label>
            <input autoFocus style={inp} type="text" placeholder="What needs to be done?" value={f.title} onChange={e=>set('title',e.target.value)} onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Description</label>
            <textarea style={{...inp,resize:'vertical',lineHeight:1.6}} rows={2} placeholder="Add details... (optional)" value={f.description} onChange={e=>set('description',e.target.value)} onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Priority</label>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {Object.entries(PRI).map(([val,cfg])=>(
                <button key={val} type="button" onClick={()=>set('priority',val)} style={{padding:'11px 8px',borderRadius:10,background:f.priority===val?cfg.bg:'var(--surface2)',border:`1.5px solid ${f.priority===val?cfg.color:'var(--border)'}`,color:f.priority===val?cfg.color:'var(--muted)',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4,transition:'all .15s'}}>
                  <span style={{fontSize:18}}>{cfg.emoji}</span>
                  <span>{cfg.label}</span>
                  <span style={{fontSize:10,opacity:.7}}>+{cfg.pts} pts</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
            <div>
              <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Due Date</label>
              <input style={inp} type="date" value={f.dueDate} onChange={e=>set('dueDate',e.target.value)} onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
            </div>
            <div>
              <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Due Time</label>
              <input style={inp} type="time" value={f.dueTime} onChange={e=>set('dueTime',e.target.value)} onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
            </div>
          </div>
          {isEdit&&(
            <div style={{marginBottom:14}}>
              <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Status</label>
              <select style={{...inp,cursor:'pointer'}} value={f.status} onChange={e=>set('status',e.target.value)}>
                {Object.entries(STATUS).map(([val,s])=>(
                  <option key={val} value={val}>{s.emoji} {s.label}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{display:'flex',gap:10,paddingTop:14,borderTop:'1px solid var(--border)',marginTop:4}}>
            <button type="button" onClick={onClose} style={{flex:1,padding:12,borderRadius:10,border:'1px solid var(--border)',background:'var(--surface2)',color:'var(--muted)',fontSize:13,fontWeight:600}}>Cancel</button>
            <button type="submit" disabled={loading} style={{flex:2,padding:12,borderRadius:10,border:'none',background:loading?'var(--surface3)':'linear-gradient(135deg,var(--accent),var(--accent2))',color:'#fff',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:loading?'none':'0 4px 20px var(--glow)',transition:'all .2s'}}>
              {loading?<><Spinner size={14}/> Saving…</>:isEdit?'✓ Save Changes':'⚡ Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [tasks,setTasks]=useState([])
  const [stats,setStats]=useState(null)
  const [level,setLevel]=useState({level:1,focusScore:0,nextLevelAt:100})
  const [badges,setBadges]=useState([])
  const [filter,setFilter]=useState('ALL')
  const [search,setSearch]=useState('')
  const [loading,setLoading]=useState(true)
  const [showModal,setShowModal]=useState(false)
  const [editTask,setEditTask]=useState(null)
  const [aiTask,setAiTask]=useState(null)
  const [toast,setToast]=useState(null)
  const [sideOpen,setSideOpen]=useState(true)
  const [activeView,setActiveView]=useState('tasks')
  // activeView: 'tasks' | 'analytics' | 'ai' | 'teams' | 'admin'

  const {user,login,logout}=useAuth()
  const navigate=useNavigate()

  const [roleFromApi, setRoleFromApi] = useState(user?.role || 'USER')
  useEffect(() => {
    api.get('/api/users/me').then(r => {
      const role = r.data.role || 'USER'
      setRoleFromApi(role)
      if (user) {
        login(localStorage.getItem('token'), {...user, role, isPro: r.data.isPro})
      }
    }).catch(() => {})
  }, [])

  const isAdmin = roleFromApi === 'ADMIN'

  const fetchAll=useCallback(async()=>{
    try {
      const [tr,sr,lr,br]=await Promise.all([
        taskAPI.getAll(),
        taskAPI.getStats().catch(()=>({data:null})),
        api.get('/api/users/level').catch(()=>({data:{level:1,focusScore:0,nextLevelAt:100}})),
        api.get('/api/users/badges').catch(()=>({data:[]})),
      ])
      setTasks(Array.isArray(tr.data?.content)?tr.data.content:Array.isArray(tr.data)?tr.data:[])
      setStats(sr.data)
      if(lr.data) setLevel(lr.data)
      if(Array.isArray(br.data)) setBadges(br.data)
    } catch(e) {
      console.error(e)
      flash('error','⚠ Failed to load tasks')
    } finally { setLoading(false) }
  },[])

  useEffect(()=>{fetchAll()},[fetchAll])

  useEffect(()=>{
    if(!tasks.length) return
    if('Notification' in window&&Notification.permission==='default') Notification.requestPermission()
    const overdue=tasks.filter(t=>t.status!=='DONE'&&t.dueDate&&new Date(t.dueDate)<new Date())
    if(overdue.length&&Notification.permission==='granted') {
      new Notification('TaskFlow Reminder',{body:`You have ${overdue.length} overdue task${overdue.length>1?'s':''}!`,icon:'/favicon.ico'})
    }
  },[tasks])

  function flash(type,msg){setToast({type,msg});setTimeout(()=>setToast(null),3500)}

  async function handleSave(data) {
    if(editTask){await taskAPI.update(editTask.id,data);flash('success','✓ Task updated!')}
    else{await taskAPI.create(data);flash('success','⚡ Task created!')}
    setShowModal(false);setEditTask(null);setAiTask(null);fetchAll()
  }

  async function handleToggle(id) {
    const task=tasks.find(t=>t.id===id)
    if(!task) return
    const newStatus=task.status==='DONE'?'TODO':'DONE'
    try {
      await taskAPI.update(id,{title:task.title,description:task.description,priority:task.priority,dueDate:task.dueDate,status:newStatus})
      fetchAll()
      flash('success',newStatus==='DONE'?'🎉 Task completed! Check for new badges!':'↩ Marked as to do')
    } catch { flash('error','Could not update status') }
  }

  async function handleDelete(id) {
    try{await taskAPI.remove(id);fetchAll();flash('success','Task deleted')}
    catch{flash('error','Could not delete task')}
  }

  function handleAiTaskParsed(parsed) {
    setAiTask(parsed)
    setEditTask(null)
    setActiveView('tasks')
    setShowModal(true)
  }

  const filtered=tasks.filter(t=>{
    const mf=filter==='ALL'||t.status===filter
    const mq=!search||t.title?.toLowerCase().includes(search.toLowerCase())||t.description?.toLowerCase().includes(search.toLowerCase())
    return mf&&mq
  })

  const done=tasks.filter(t=>t.status==='DONE').length
  const pending=tasks.filter(t=>t.status!=='DONE').length
  const high=tasks.filter(t=>t.priority==='HIGH'&&t.status!=='DONE').length
  const h=new Date().getHours()
  const greet=h<12?'Good morning':h<17?'Good afternoon':'Good evening'
  const overdueCnt=tasks.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date()&&t.status!=='DONE').length

  const filterBtn=(key,label,count)=>(
    <button onClick={()=>setFilter(key)} style={{display:'flex',alignItems:'center',gap:7,padding:'8px 16px',borderRadius:10,fontSize:13,fontWeight:500,cursor:'pointer',background:filter===key?'var(--accent)':'var(--surface2)',color:filter===key?'#fff':'var(--muted)',border:filter===key?'none':'1px solid var(--border)',transition:'all .15s'}}>
      {label}
      <span style={{fontSize:10,padding:'1px 7px',borderRadius:6,background:filter===key?'rgba(255,255,255,.2)':'var(--surface3)',color:filter===key?'#fff':'var(--muted)'}}>{count}</span>
    </button>
  )

  const insightNavBtn=(view,icon,label,badge)=>(
    <button key={view} onClick={()=>setActiveView(view)}
      style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 10px',borderRadius:10,marginBottom:2,
        background:activeView===view?'rgba(124,58,237,.1)':'transparent',
        color:activeView===view?'var(--accent2)':'var(--muted)',
        border:activeView===view?'1px solid rgba(124,58,237,.2)':'1px solid transparent',
        cursor:'pointer',fontSize:13,fontWeight:500,textAlign:'left',transition:'all .12s'}}>
      <span style={{width:18,textAlign:'center'}}>{icon}</span>
      <span style={{flex:1}}>{label}</span>
      {badge&&<span style={{fontSize:9,padding:'2px 6px',borderRadius:6,background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',fontWeight:700}}>{badge}</span>}
    </button>
  )

  const navItems = [
    {key:'ALL',         icon:'◈', label:'All Tasks',  count:tasks.length},
    {key:'TODO',        icon:'○', label:'To Do',       count:tasks.filter(t=>t.status==='TODO').length},
    {key:'IN_PROGRESS', icon:'◉', label:'In Progress', count:tasks.filter(t=>t.status==='IN_PROGRESS').length},
    {key:'DONE',        icon:'✓', label:'Completed',   count:done},
  ]

  const headerTitle = () => {
    if (activeView==='ai')        return <span>🤖 <span style={{color:'var(--accent2)'}}>AI Assistant</span></span>
    if (activeView==='analytics') return <span>📊 <span style={{color:'var(--accent2)'}}>Analytics</span></span>
    if (activeView==='teams')     return <span>👥 <span style={{color:'var(--accent2)'}}>Teams</span></span>
    if (activeView==='admin')     return <span>🛡️ <span style={{color:'#ff6b6b'}}>Admin Dashboard</span></span>
    return <>{greet}, <span style={{color:'var(--accent2)'}}>{user?.name||'there'}</span> ✦</>
  }
  const headerSub = () => {
    if (activeView==='ai')        return 'Powered by Claude AI'
    if (activeView==='analytics') return 'Your productivity insights'
    if (activeView==='teams')     return 'Collaborate with your team'
    if (activeView==='admin')     return 'Manage users and platform'
    return new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})
  }

  return (
    <>
      <style>{css}</style>
      <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'var(--bg)',fontFamily:'DM Sans, sans-serif'}}>

        {sideOpen&&(
          <aside style={{width:240,flexShrink:0,background:'var(--surface)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',height:'100%'}}>
            {/* Logo */}
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'18px 16px',borderBottom:'1px solid var(--border)'}}>
              <div style={{width:34,height:34,borderRadius:10,background:'linear-gradient(135deg,var(--accent),var(--accent2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,color:'#fff',flexShrink:0,boxShadow:'0 4px 14px var(--glow)'}}>⚡</div>
              <span style={{fontSize:17,fontWeight:800,color:'var(--text)',fontFamily:'Syne, sans-serif'}}>TaskFlow</span>
            </div>

            <nav style={{flex:1,padding:'12px 10px',overflowY:'auto'}}>
              {/* Tasks section */}
              <p style={{fontSize:9,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',padding:'0 8px',marginBottom:6}}>TASKS</p>
              {navItems.map(item=>{
                const active = activeView==='tasks' && filter===item.key
                return (
                  <button key={item.key} onClick={()=>{setFilter(item.key);setActiveView('tasks')}}
                    style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 10px',borderRadius:10,marginBottom:2,background:active?'rgba(124,58,237,.1)':'transparent',color:active?'var(--accent2)':'var(--muted)',border:active?'1px solid rgba(124,58,237,.2)':'1px solid transparent',cursor:'pointer',fontSize:13,fontWeight:500,textAlign:'left',transition:'all .12s'}}>
                    <span style={{width:18,textAlign:'center'}}>{item.icon}</span>
                    <span style={{flex:1}}>{item.label}</span>
                    <span style={{fontSize:10,padding:'1px 7px',borderRadius:6,background:'var(--surface2)',color:'var(--muted)'}}>{item.count}</span>
                  </button>
                )
              })}

              {/* Insights section */}
              <p style={{fontSize:9,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',padding:'16px 8px 6px'}}>INSIGHTS</p>
              {insightNavBtn('analytics','📊','Analytics', null)}
              {insightNavBtn('ai','🤖','AI Assistant','NEW')}
              {insightNavBtn('teams','👥','Teams', null)}

              {/* Upgrade to Pro button */}
              <button onClick={()=>navigate('/pricing')}
                style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 10px',borderRadius:10,marginBottom:2,
                  background:'rgba(255,217,61,.06)',border:'1px solid rgba(255,217,61,.15)',
                  color:'var(--warn)',cursor:'pointer',fontSize:13,fontWeight:500,textAlign:'left',transition:'all .12s'}}>
                <span style={{width:18,textAlign:'center'}}>⭐</span>
                <span style={{flex:1}}>Upgrade to Pro</span>
              </button>

              {/* Admin section — only visible to admins */}
              {isAdmin && (
                <>
                  <p style={{fontSize:9,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',padding:'16px 8px 6px'}}>ADMIN</p>
                  {insightNavBtn('admin','🛡️','Admin Dashboard', null)}
                </>
              )}

              <LevelBar level={level.level} focusScore={level.focusScore} nextLevelAt={level.nextLevelAt}/>
              <BadgeGrid badges={badges}/>
              {overdueCnt>0&&(
                <div style={{margin:'12px 2px 0',padding:'12px',background:'rgba(255,107,107,.08)',border:'1px solid rgba(255,107,107,.2)',borderRadius:12}}>
                  <p style={{fontSize:11,fontWeight:600,color:'var(--danger)',marginBottom:4}}>⚠ Overdue Tasks</p>
                  <p style={{fontSize:11,color:'var(--muted)'}}>{overdueCnt} task{overdueCnt>1?'s':''} past deadline</p>
                </div>
              )}
            </nav>

            {/* User profile footer */}
            <div style={{padding:'13px 14px',borderTop:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:34,height:34,borderRadius:10,flexShrink:0,background:'linear-gradient(135deg,var(--accent),var(--accent2))',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,color:'#fff'}}>
                  {(user?.name?.[0]||'U').toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <p style={{fontSize:13,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.name||'User'}</p>
                    {isAdmin&&<span style={{fontSize:9,padding:'1px 6px',borderRadius:4,background:'rgba(255,107,107,.15)',color:'var(--danger)',fontWeight:700,flexShrink:0}}>ADMIN</span>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:5,marginTop:2}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:'var(--success)',boxShadow:'0 0 6px rgba(107,203,119,.6)'}}/>
                    <span style={{fontSize:10,color:'var(--muted)'}}>Lv.{level.level} · Active</span>
                  </div>
                </div>
                <button onClick={()=>{logout();navigate('/login')}} title="Logout" style={{width:30,height:30,borderRadius:8,background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--muted)',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>⏻</button>
              </div>
            </div>
          </aside>
        )}

        {/* Main content */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <header style={{flexShrink:0,display:'flex',alignItems:'center',gap:12,padding:'13px 24px',background:'var(--surface)',borderBottom:'1px solid var(--border)'}}>
            <button onClick={()=>setSideOpen(s=>!s)} style={{width:32,height:32,borderRadius:9,background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--muted)',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>☰</button>
            <div style={{flex:1}}>
              <h1 style={{fontSize:15,fontWeight:700,color:'var(--text)',fontFamily:'Syne, sans-serif'}}>{headerTitle()}</h1>
              <p style={{fontSize:11,color:'var(--muted)',marginTop:1}}>{headerSub()}</p>
            </div>
            {activeView==='tasks'&&(
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--muted)',fontSize:14,pointerEvents:'none'}}>⌕</span>
                <input type="text" placeholder="Search tasks…" value={search} onChange={e=>setSearch(e.target.value)}
                  style={{paddingLeft:34,paddingRight:14,paddingTop:8,paddingBottom:8,borderRadius:10,background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)',fontSize:13,outline:'none',width:200,transition:'border-color .2s'}}
                  onFocus={e=>e.target.style.borderColor='var(--accent)'}
                  onBlur={e=>e.target.style.borderColor='var(--border)'}/>
              </div>
            )}
            {overdueCnt>0&&activeView==='tasks'&&(
              <div style={{padding:'6px 12px',borderRadius:8,background:'rgba(255,107,107,.1)',border:'1px solid rgba(255,107,107,.2)',color:'var(--danger)',fontSize:12,fontWeight:600}}>⚠ {overdueCnt} overdue</div>
            )}
            {activeView==='tasks'&&(
              <button onClick={()=>{setEditTask(null);setAiTask(null);setShowModal(true)}} style={{padding:'9px 20px',borderRadius:10,border:'none',background:'linear-gradient(135deg,var(--accent),var(--accent2))',color:'#fff',fontSize:13,fontWeight:700,boxShadow:'0 4px 14px var(--glow)',transition:'all .2s',flexShrink:0}}
                onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
                onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                + New Task
              </button>
            )}
          </header>

          <div style={{flex:1,overflowY:'auto',padding:24}}>
            {activeView==='analytics' ? (
              <AnalyticsPanel/>
            ) : activeView==='ai' ? (
              <AIPanel onTaskParsed={handleAiTaskParsed}/>
            ) : activeView==='teams' ? (
              <TeamsPanel/>
            ) : activeView==='admin' && isAdmin ? (
              <AdminDashboard/>
            ) : (
              <>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
                  <StatCard label="Completed"   value={stats?.completedTasks??done}  sub={`of ${tasks.length} total`}  color="var(--success)" icon="✓"  delay={0}/>
                  <StatCard label="Focus Score" value={stats?.focusScore??0}          sub="points earned"               color="var(--accent2)" icon="⚡" delay={80}/>
                  <StatCard label="Day Streak"  value={stats?.streak??0}              sub="consecutive days"            color="var(--warn)"    icon="🔥" delay={160}/>
                  <StatCard label="Pending"     value={pending}                        sub={`${high} high priority`}    color="var(--danger)"  icon="⏳" delay={240}/>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                  {filterBtn('ALL','All Tasks',tasks.length)}
                  {filterBtn('TODO','To Do',tasks.filter(t=>t.status==='TODO').length)}
                  {filterBtn('IN_PROGRESS','In Progress',tasks.filter(t=>t.status==='IN_PROGRESS').length)}
                  {filterBtn('DONE','Completed',done)}
                  <span style={{marginLeft:'auto',fontSize:12,color:'var(--muted)'}}>{filtered.length} task{filtered.length!==1?'s':''}</span>
                </div>
                {loading?(
                  <div>{[1,2,3,4].map(i=><div key={i} className="skeleton" style={{height:66,marginBottom:8}}/>)}</div>
                ):filtered.length===0?(
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 0',animation:'fadeUp .4s ease'}}>
                    <div style={{fontSize:52,marginBottom:16}}>{search?'🔍':filter==='DONE'?'🎉':'📋'}</div>
                    <p style={{fontSize:17,fontWeight:700,color:'var(--text)',marginBottom:6,fontFamily:'Syne, sans-serif'}}>{search?'No tasks match your search':filter==='DONE'?'No completed tasks yet':'No tasks yet'}</p>
                    <p style={{fontSize:13,color:'var(--muted)',marginBottom:24}}>{search?'Try a different keyword':'Click "+ New Task" to get started'}</p>
                    {!search&&<button onClick={()=>setShowModal(true)} style={{padding:'10px 28px',borderRadius:10,border:'none',background:'linear-gradient(135deg,var(--accent),var(--accent2))',color:'#fff',fontSize:14,fontWeight:700,boxShadow:'0 4px 14px var(--glow)'}}>+ Create First Task</button>}
                  </div>
                ):(
                  <div>{filtered.map((task,i)=><TaskCard key={task.id} task={task} idx={i} onToggle={()=>handleToggle(task.id)} onEdit={()=>{setEditTask(task);setShowModal(true)}} onDelete={()=>handleDelete(task.id)}/>)}</div>
                )}
              </>
            )}
          </div>
        </div>

        {showModal&&(
          <TaskModal
            task={editTask || aiTask}
            onClose={()=>{setShowModal(false);setEditTask(null);setAiTask(null)}}
            onSave={handleSave}
          />
        )}

        {toast&&(
          <div style={{position:'fixed',bottom:22,right:22,padding:'13px 20px',borderRadius:12,fontSize:13,fontWeight:600,zIndex:300,background:toast.type==='success'?'rgba(107,203,119,.1)':'rgba(255,107,107,.1)',border:`1px solid ${toast.type==='success'?'rgba(107,203,119,.3)':'rgba(255,107,107,.3)'}`,color:toast.type==='success'?'var(--success)':'var(--danger)',backdropFilter:'blur(12px)',boxShadow:'0 8px 30px rgba(0,0,0,.4)',animation:'fadeUp .3s ease'}}>
            {toast.msg}
          </div>
        )}
      </div>
    </>
  )
}