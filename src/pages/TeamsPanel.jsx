import React, { useState, useEffect, useRef, useCallback } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const css = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes msgIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .team-card:hover { border-color: rgba(168,85,247,.4) !important; transform:translateY(-2px); box-shadow:0 8px 24px rgba(124,58,237,.15) !important; }
  .t-btn:hover { opacity:.85; transform:translateY(-1px); }
  .tab-btn:hover { background: var(--surface3) !important; }
  .msg-input:focus { border-color: var(--accent) !important; outline:none; }
  @media(max-width:600px){
    .kanban-grid { grid-template-columns: 1fr !important; }
    .task-form-grid { grid-template-columns: 1fr !important; }
  }
`

function Spinner({size=14}){
  return <span style={{width:size,height:size,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite',flexShrink:0}}/>
}

function Avatar({name,size=28,color}){
  const colors=['#7c3aed','#0ea5e9','#f59e0b','#10b981','#ef4444','#ec4899']
  const bg = color || colors[(name?.charCodeAt(0)||0)%colors.length]
  return <div style={{width:size,height:size,borderRadius:size*.28,background:`linear-gradient(135deg,${bg},${bg}bb)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.4,fontWeight:800,color:'#fff',flexShrink:0}}>{(name?.[0]||'?').toUpperCase()}</div>
}

// No more in-memory store — uses real backend API

export default function TeamsPanel() {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // list | create | team
  const [activeTeam, setActiveTeam] = useState(null)
  const [teamTasks, setTeamTasks] = useState([])
  const [newTeam, setNewTeam] = useState({name:'',description:''})
  const [inviteEmail, setInviteEmail] = useState('')
  const [newTask, setNewTask] = useState({title:'',priority:'MEDIUM',assigneeId:''})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [tab, setTab] = useState('board') // board | members | invite | chat
  const [messages, setMessages] = useState([])
  const [msgText, setMsgText] = useState('')
  const msgEndRef = useRef(null)

  function flash(msg, type='success'){setToast({msg,type});setTimeout(()=>setToast(null),3000)}

  const loadTeams = useCallback(async () => {
    try {
      const res = await api.get('/api/teams')
      setTeams(Array.isArray(res.data)?res.data:[])
    } catch { flash('Failed to load teams','error') }
    finally { setLoading(false) }
  }, [])

  useEffect(()=>{loadTeams()},[loadTeams])

  // Scroll chat to bottom
  useEffect(()=>{
    if(tab==='chat') msgEndRef.current?.scrollIntoView({behavior:'smooth'})
  },[messages, tab])

  // Load chat messages when switching to chat tab (real API)
  useEffect(()=>{
    if(tab==='chat' && activeTeam) {
      api.get(`/api/teams/${activeTeam.id}/messages`)
        .then(r => setMessages(Array.isArray(r.data) ? r.data : []))
        .catch(() => setMessages([]))
    }
  },[tab, activeTeam])

  // Poll for new messages every 4s
  useEffect(()=>{
    if(tab!=='chat' || !activeTeam) return
    const id = setInterval(() => {
      api.get(`/api/teams/${activeTeam.id}/messages`)
        .then(r => setMessages(Array.isArray(r.data) ? r.data : []))
        .catch(() => {})
    }, 4000)
    return () => clearInterval(id)
  },[tab, activeTeam])

  async function loadTeamTasks(teamId) {
    try {
      const res = await api.get(`/api/teams/${teamId}/tasks`)
      setTeamTasks(Array.isArray(res.data)?res.data:[])
    } catch { setTeamTasks([]) }
  }

  async function createTeam() {
    if (!newTeam.name.trim()) return
    setSaving(true)
    try {
      await api.post('/api/teams', newTeam)
      flash('🎉 Team created!')
      setNewTeam({name:'',description:''})
      await loadTeams()
      setView('list')
    } catch { flash('Failed to create team','error') }
    finally { setSaving(false) }
  }

  async function deleteTeam() {
    if (!confirm(`Delete "${activeTeam.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/api/teams/${activeTeam.id}`)
      flash('Team deleted')
      await loadTeams()
      setView('list')
      setActiveTeam(null)
    } catch(e) { flash(e.response?.data?.error||'Failed to delete team','error') }
  }

  async function leaveTeam() {
    if (!confirm(`Leave "${activeTeam.name}"?`)) return
    try {
      await api.delete(`/api/teams/${activeTeam.id}/leave`)
      flash('You left the team')
      await loadTeams()
      setView('list')
      setActiveTeam(null)
    } catch(e) { flash(e.response?.data?.error||'Failed to leave team','error') }
  }

  async function sendInvite() {
    if (!inviteEmail.trim()||!activeTeam) return
    setSaving(true)
    try {
      await api.post(`/api/teams/${activeTeam.id}/invite`,{email:inviteEmail})
      flash('✉️ Invite sent to ' + inviteEmail)
      setInviteEmail('')
    } catch(e) { flash(e.response?.data?.error||'Failed to send invite','error') }
    finally { setSaving(false) }
  }

  async function createTeamTask() {
    if (!newTask.title.trim()||!activeTeam) return
    setSaving(true)
    try {
      await api.post(`/api/teams/${activeTeam.id}/tasks`, newTask)
      flash('⚡ Task created!')
      setNewTask({title:'',priority:'MEDIUM',assigneeId:''})
      await loadTeamTasks(activeTeam.id)
    } catch { flash('Failed to create task','error') }
    finally { setSaving(false) }
  }

  async function sendMessage() {
    if (!msgText.trim() || !activeTeam) return
    const text = msgText.trim()
    setMsgText('')
    try {
      const r = await api.post(`/api/teams/${activeTeam.id}/messages`, { text })
      setMessages(p => [...p, r.data])
    } catch {
      flash('Failed to send message', 'error')
    }
  }

  function openTeam(team) {
    setActiveTeam(team)
    setView('team')
    setTab('board')
    loadTeamTasks(team.id)
  }

  const isOwner = activeTeam?.myRole === 'OWNER'

  const inp={width:'100%',padding:'10px 13px',background:'var(--surface2)',border:'1px solid rgba(255,255,255,.1)',
    borderRadius:10,color:'var(--text)',fontSize:13,outline:'none',transition:'border-color .2s'}

  const btn=(color='linear-gradient(135deg,var(--accent),var(--accent2))')=>({
    padding:'10px 20px',borderRadius:10,border:'none',background:color,color:'#fff',
    fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:7,transition:'all .15s'
  })

  const PRI_COLORS = {HIGH:'#ff6b6b',MEDIUM:'#ffd93d',LOW:'#6bcb77'}

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,gap:12,flexDirection:'column'}}>
      <Spinner size={28}/>
      <p style={{color:'var(--muted)',fontSize:13}}>Loading teams…</p>
    </div>
  )

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:860,margin:'0 auto'}}>

        {/* ── TEAM LIST ── */}
        {view==='list' && (
          <>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22,flexWrap:'wrap',gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,#0ea5e9,#38bdf8)',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,boxShadow:'0 4px 14px rgba(14,165,233,.3)'}}>👥</div>
                <div>
                  <h2 style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:'Syne,sans-serif',margin:0}}>Teams</h2>
                  <p style={{fontSize:12,color:'var(--muted)',margin:0}}>{teams.length} workspace{teams.length!==1?'s':''}</p>
                </div>
              </div>
              <button className="t-btn" onClick={()=>setView('create')} style={btn()}>+ Create Team</button>
            </div>

            {teams.length===0 ? (
              <div style={{textAlign:'center',padding:'70px 0',animation:'fadeUp .4s ease'}}>
                <div style={{fontSize:54,marginBottom:16}}>👥</div>
                <p style={{fontSize:17,fontWeight:700,color:'var(--text)',marginBottom:8,fontFamily:'Syne,sans-serif'}}>No teams yet</p>
                <p style={{fontSize:13,color:'var(--muted)',marginBottom:24}}>Create a team and invite your collaborators</p>
                <button className="t-btn" onClick={()=>setView('create')} style={btn()}>+ Create First Team</button>
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
                {teams.map((team,i)=>(
                  <div key={team.id} className="team-card" onClick={()=>openTeam(team)}
                    style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:20,
                      cursor:'pointer',transition:'all .2s',animation:`fadeUp .4s ease both`,animationDelay:`${i*60}ms`,
                      boxShadow:'0 2px 12px rgba(0,0,0,.2)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                      <div style={{width:44,height:44,borderRadius:13,background:'linear-gradient(135deg,var(--accent),var(--accent2))',
                        display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:'#fff',fontWeight:800,
                        boxShadow:'0 4px 12px rgba(124,58,237,.3)'}}>
                        {team.name?.[0]?.toUpperCase()||'T'}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:15,fontWeight:700,color:'var(--text)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{team.name}</p>
                        <p style={{fontSize:11,color:'var(--muted)',margin:0}}>{team.memberCount||1} member{(team.memberCount||1)!==1?'s':''}</p>
                      </div>
                    </div>
                    {team.description&&<p style={{fontSize:12,color:'var(--muted)',marginBottom:12,lineHeight:1.5}}>{team.description}</p>}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div style={{display:'flex',gap:-6}}>
                        {team.members?.slice(0,4).map((m,j)=>(
                          <div key={m.id} style={{marginLeft:j?-8:0,zIndex:j}}>
                            <Avatar name={m.name} size={26}/>
                          </div>
                        ))}
                        {(team.memberCount||0)>4&&<div style={{width:26,height:26,borderRadius:8,background:'var(--surface2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'var(--muted)',marginLeft:-8}}>+{team.memberCount-4}</div>}
                      </div>
                      <span style={{fontSize:10,padding:'3px 10px',borderRadius:6,fontWeight:700,
                        background:team.myRole==='OWNER'?'rgba(255,217,61,.12)':'rgba(255,255,255,.06)',
                        color:team.myRole==='OWNER'?'var(--warn)':'var(--muted)'}}>
                        {team.myRole==='OWNER'?'👑 Owner':'👤 Member'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── CREATE TEAM ── */}
        {view==='create' && (
          <div style={{maxWidth:460,margin:'0 auto',animation:'fadeUp .3s ease'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
              <button onClick={()=>setView('list')} style={{width:32,height:32,borderRadius:9,background:'var(--surface2)',
                border:'1px solid var(--border)',color:'var(--muted)',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>
              <h2 style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:'Syne,sans-serif',margin:0}}>Create New Team</h2>
            </div>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:18,padding:24}}>
              <div style={{marginBottom:16}}>
                <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:8}}>Team Name *</label>
                <input style={inp} autoFocus placeholder="e.g. Design Team, Backend Squad…" value={newTeam.name}
                  onChange={e=>setNewTeam(p=>({...p,name:e.target.value}))}
                  onKeyDown={e=>e.key==='Enter'&&createTeam()}
                  onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}/>
              </div>
              <div style={{marginBottom:20}}>
                <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:8}}>Description</label>
                <textarea style={{...inp,resize:'vertical',lineHeight:1.6}} rows={3} placeholder="What does this team work on? (optional)"
                  value={newTeam.description} onChange={e=>setNewTeam(p=>({...p,description:e.target.value}))}
                  onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}/>
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setView('list')} style={{flex:1,padding:'11px',borderRadius:10,border:'1px solid var(--border)',background:'var(--surface2)',color:'var(--muted)',fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
                <button className="t-btn" onClick={createTeam} disabled={saving||!newTeam.name.trim()}
                  style={{...btn(),flex:2,justifyContent:'center',opacity:!newTeam.name.trim()?.5:1}}>
                  {saving?<><Spinner/> Creating…</>:'🚀 Create Team'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TEAM DETAIL ── */}
        {view==='team' && activeTeam && (
          <div style={{animation:'fadeUp .3s ease'}}>

            {/* Header */}
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,flexWrap:'wrap'}}>
              <button onClick={()=>setView('list')} style={{width:32,height:32,borderRadius:9,background:'var(--surface2)',
                border:'1px solid var(--border)',color:'var(--muted)',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>
              <div style={{width:38,height:38,borderRadius:11,background:'linear-gradient(135deg,var(--accent),var(--accent2))',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'#fff',fontWeight:800}}>
                {activeTeam.name?.[0]?.toUpperCase()||'T'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <h2 style={{fontSize:17,fontWeight:800,color:'var(--text)',fontFamily:'Syne,sans-serif',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{activeTeam.name}</h2>
                <p style={{fontSize:11,color:'var(--muted)',margin:0}}>{activeTeam.memberCount} member{activeTeam.memberCount!==1?'s':''} · {activeTeam.myRole}</p>
              </div>
              {/* Action buttons */}
              <div style={{display:'flex',gap:8}}>
                {isOwner ? (
                  <button onClick={deleteTeam}
                    style={{padding:'7px 14px',borderRadius:9,fontSize:12,fontWeight:600,cursor:'pointer',
                      background:'rgba(255,107,107,.1)',border:'1px solid rgba(255,107,107,.2)',
                      color:'var(--danger)',display:'flex',alignItems:'center',gap:6}}>
                    🗑 Delete
                  </button>
                ) : (
                  <button onClick={leaveTeam}
                    style={{padding:'7px 14px',borderRadius:9,fontSize:12,fontWeight:600,cursor:'pointer',
                      background:'rgba(255,217,61,.08)',border:'1px solid rgba(255,217,61,.2)',
                      color:'var(--warn)',display:'flex',alignItems:'center',gap:6}}>
                    🚪 Leave
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div style={{display:'flex',gap:6,marginBottom:20,flexWrap:'wrap'}}>
              {[
                ['board','📋','Tasks'],
                ['members','👥','Members'],
                ['chat','💬','Chat'],
                ['invite','✉️','Invite'],
              ].map(([key,ic,lb])=>(
                <button key={key} className="tab-btn" onClick={()=>setTab(key)}
                  style={{padding:'8px 16px',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',
                    background:tab===key?'var(--accent)':'var(--surface2)',
                    color:tab===key?'#fff':'var(--muted)',
                    border:tab===key?'none':'1px solid var(--border)',transition:'all .15s',
                    display:'flex',alignItems:'center',gap:6}}>
                  {ic} {lb}
                  {key==='chat'&&messages.length>0&&(
                    <span style={{fontSize:9,padding:'1px 5px',borderRadius:5,background:'rgba(255,255,255,.15)',color:'#fff'}}>
                      {messages.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── TASK BOARD ── */}
            {tab==='board' && (
              <>
                <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:18,marginBottom:18}}>
                  <p style={{fontSize:13,fontWeight:700,color:'var(--text)',marginBottom:12}}>⚡ Add Team Task</p>
                  <div className="task-form-grid" style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:10,marginBottom:10}}>
                    <input style={inp} placeholder="Task title…" value={newTask.title}
                      onChange={e=>setNewTask(p=>({...p,title:e.target.value}))}
                      onKeyDown={e=>e.key==='Enter'&&createTeamTask()}
                      onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}/>
                    <select style={{...inp,width:'auto'}} value={newTask.priority} onChange={e=>setNewTask(p=>({...p,priority:e.target.value}))}>
                      <option value="HIGH">🔴 High</option>
                      <option value="MEDIUM">🟡 Med</option>
                      <option value="LOW">🟢 Low</option>
                    </select>
                    <select style={{...inp,width:'auto'}} value={newTask.assigneeId} onChange={e=>setNewTask(p=>({...p,assigneeId:e.target.value}))}>
                      <option value="">Assign…</option>
                      {activeTeam.members?.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <button className="t-btn" onClick={createTeamTask} disabled={saving||!newTask.title.trim()}
                    style={{...btn(),opacity:!newTask.title.trim()?.5:1}}>
                    {saving?<><Spinner/> Adding…</>:'+ Add Task'}
                  </button>
                </div>

                <div className="kanban-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                  {['TODO','IN_PROGRESS','DONE'].map(status=>{
                    const cols={TODO:{label:'To Do',emoji:'📋',color:'#a78bfa'},IN_PROGRESS:{label:'In Progress',emoji:'⚡',color:'#60a5fa'},DONE:{label:'Done',emoji:'✅',color:'#6bcb77'}}
                    const col=cols[status]
                    const colTasks=teamTasks.filter(t=>t.status===status)
                    return (
                      <div key={status} style={{background:'var(--surface2)',borderRadius:14,padding:14}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                          <span style={{fontSize:14}}>{col.emoji}</span>
                          <span style={{fontSize:12,fontWeight:700,color:col.color}}>{col.label}</span>
                          <span style={{marginLeft:'auto',fontSize:10,padding:'1px 7px',borderRadius:6,background:'var(--surface3)',color:'var(--muted)'}}>{colTasks.length}</span>
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:8}}>
                          {colTasks.map(task=>(
                            <div key={task.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:12,animation:'fadeUp .25s ease'}}>
                              <p style={{fontSize:13,fontWeight:600,color:'var(--text)',margin:'0 0 6px',lineHeight:1.4}}>{task.title}</p>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                <span style={{fontSize:10,padding:'2px 7px',borderRadius:5,fontWeight:700,
                                  background:`${PRI_COLORS[task.priority]||'#888'}18`,color:PRI_COLORS[task.priority]||'var(--muted)'}}>
                                  {task.priority||'MEDIUM'}
                                </span>
                                {task.assignee&&(
                                  <div style={{display:'flex',alignItems:'center',gap:4}}>
                                    <Avatar name={task.assignee.name} size={20}/>
                                    <span style={{fontSize:10,color:'var(--muted)'}}>{task.assignee.name?.split(' ')[0]}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {colTasks.length===0&&<p style={{fontSize:11,color:'var(--muted)',textAlign:'center',padding:'12px 0'}}>No tasks</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* ── MEMBERS ── */}
            {tab==='members' && (
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
                {activeTeam.members?.map((m,i)=>(
                  <div key={m.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',
                    borderBottom:i<activeTeam.members.length-1?'1px solid var(--border)':'none',
                    animation:`fadeUp .3s ease both`,animationDelay:`${i*40}ms`}}>
                    <Avatar name={m.name} size={38}/>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:14,fontWeight:600,color:'var(--text)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.name}</p>
                      <p style={{fontSize:11,color:'var(--muted)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.email}</p>
                    </div>
                    <span style={{fontSize:10,padding:'4px 12px',borderRadius:20,fontWeight:700,flexShrink:0,
                      background:m.role==='OWNER'?'rgba(255,217,61,.12)':'rgba(255,255,255,.06)',
                      color:m.role==='OWNER'?'var(--warn)':'var(--muted)'}}>
                      {m.role==='OWNER'?'👑 Owner':'👤 Member'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── CHAT ── */}
            {tab==='chat' && (
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden',display:'flex',flexDirection:'column',height:480}}>
                {/* Chat header */}
                <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10,background:'linear-gradient(135deg,rgba(124,58,237,.06),transparent)'}}>
                  <span style={{fontSize:18}}>💬</span>
                  <div>
                    <p style={{fontSize:13,fontWeight:700,color:'var(--text)',margin:0}}>{activeTeam.name} · Discussion</p>
                    <p style={{fontSize:10,color:'var(--muted)',margin:0}}>Messages are session-only · {activeTeam.memberCount} members</p>
                  </div>
                </div>

                {/* Messages */}
                <div style={{flex:1,overflowY:'auto',padding:'16px 18px',display:'flex',flexDirection:'column',gap:12}}>
                  {messages.length===0 ? (
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:12}}>
                      <div style={{fontSize:40}}>💬</div>
                      <p style={{fontSize:14,fontWeight:700,color:'var(--text)',margin:0}}>No messages yet</p>
                      <p style={{fontSize:12,color:'var(--muted)',margin:0}}>Start the conversation with your team!</p>
                    </div>
                  ) : messages.map(msg=>{
                    const isMe = msg.sender?.email === user?.email || msg.sender?.id === user?.id
                    const senderName = msg.sender?.name || 'User'
                    const timeStr = msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : ''
                    return(
                    <div key={msg.id} style={{display:'flex',gap:10,flexDirection:isMe?'row-reverse':'row',animation:'msgIn .25s ease'}}>
                      <div style={{width:32,height:32,borderRadius:9,background:'linear-gradient(135deg,var(--accent),var(--accent2))',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:13,color:'#fff',flexShrink:0}}>
                        {(senderName?.[0]||'?').toUpperCase()}
                      </div>
                      <div style={{maxWidth:'70%'}}>
                        <p style={{fontSize:10,color:'var(--muted)',margin:'0 0 4px',textAlign:isMe?'right':'left'}}>{senderName} · {timeStr}</p>
                        <div style={{padding:'10px 14px',borderRadius:isMe?'14px 4px 14px 14px':'4px 14px 14px 14px',
                          background:isMe?'linear-gradient(135deg,var(--accent),var(--accent2))':'var(--surface2)',
                          border:isMe?'none':'1px solid var(--border)'}}>
                          <p style={{fontSize:13,color:isMe?'#fff':'var(--text)',margin:0,lineHeight:1.5,wordBreak:'break-word'}}>{msg.text}</p>
                        </div>
                      </div>
                    </div>
                  )})}
                  <div ref={msgEndRef}/>
                </div>

                {/* Message input */}
                <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',display:'flex',gap:10,alignItems:'center',background:'var(--surface)'}}>
                  <input
                    className="msg-input"
                    style={{...inp,flex:1,padding:'10px 14px',borderRadius:12}}
                    placeholder={`Message ${activeTeam.name}…`}
                    value={msgText}
                    onChange={e=>setMsgText(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}}}
                  />
                  <button onClick={sendMessage} disabled={!msgText.trim()}
                    style={{width:40,height:40,borderRadius:12,border:'none',flexShrink:0,
                      background:msgText.trim()?'linear-gradient(135deg,var(--accent),var(--accent2))':'var(--surface2)',
                      color:'#fff',fontSize:16,cursor:msgText.trim()?'pointer':'default',
                      display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}}>
                    ➤
                  </button>
                </div>
              </div>
            )}

            {/* ── INVITE ── */}
            {tab==='invite' && (
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:24,maxWidth:480}}>
                <p style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:4}}>✉️ Invite by Email</p>
                <p style={{fontSize:12,color:'var(--muted)',marginBottom:18}}>They'll get an invite link valid for 7 days</p>
                <div style={{display:'flex',gap:10,marginBottom:20}}>
                  <input style={{...inp,flex:1}} type="email" placeholder="colleague@company.com"
                    value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&sendInvite()}
                    onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}/>
                  <button className="t-btn" onClick={sendInvite} disabled={saving||!inviteEmail.trim()} style={btn()}>
                    {saving?<Spinner/>:'Send'}
                  </button>
                </div>
                <div style={{padding:14,borderRadius:12,background:'rgba(14,165,233,.06)',border:'1px solid rgba(14,165,233,.15)'}}>
                  <p style={{fontSize:12,color:'#7dd3fc',margin:0,lineHeight:1.6}}>💡 The invite link will be sent to their email. They need a TaskFlow account to join, or can create one when they click the link.</p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {toast&&(
        <div style={{position:'fixed',bottom:88,right:16,padding:'12px 18px',borderRadius:12,fontSize:13,fontWeight:600,zIndex:999,
          background:toast.type==='success'?'rgba(107,203,119,.1)':'rgba(255,107,107,.1)',
          border:`1px solid ${toast.type==='success'?'rgba(107,203,119,.3)':'rgba(255,107,107,.3)'}`,
          color:toast.type==='success'?'var(--success)':'var(--danger)',
          backdropFilter:'blur(12px)',boxShadow:'0 8px 30px rgba(0,0,0,.4)',animation:'fadeUp .3s ease'}}>
          {toast.msg}
        </div>
      )}
    </>
  )
}