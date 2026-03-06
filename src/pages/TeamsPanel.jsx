import React, { useState, useEffect } from 'react'
import api from '../services/api'

const css = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .team-card:hover { border-color: var(--accent2) !important; transform:translateY(-2px); }
  .t-btn:hover { opacity:.82; transform:translateY(-1px); }
`

function Spinner({size=14}){return <span style={{width:size,height:size,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite',flexShrink:0}}/>}

function Avatar({name,size=28}){
  return <div style={{width:size,height:size,borderRadius:size*.3,background:'linear-gradient(135deg,var(--accent),var(--accent2))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.4,fontWeight:800,color:'#fff',flexShrink:0}}>{(name?.[0]||'?').toUpperCase()}</div>
}

export default function TeamsPanel() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // list | create | team
  const [activeTeam, setActiveTeam] = useState(null)
  const [teamTasks, setTeamTasks] = useState([])
  const [newTeam, setNewTeam] = useState({name:'',description:''})
  const [inviteEmail, setInviteEmail] = useState('')
  const [newTask, setNewTask] = useState({title:'',description:'',priority:'MEDIUM',assigneeId:''})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [tab, setTab] = useState('board') // board | members | invite

  function flash(msg, type='success'){setToast({msg,type});setTimeout(()=>setToast(null),3000)}

  async function loadTeams() {
    try {
      const res = await api.get('/api/teams')
      setTeams(Array.isArray(res.data)?res.data:[])
    } catch { flash('Failed to load teams','error') }
    finally { setLoading(false) }
  }

  useEffect(()=>{loadTeams()},[])

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

  async function deleteTeam(teamId) {
    if (!confirm('Delete this team? This cannot be undone.')) return
    try {
      await api.delete(`/api/teams/${teamId}`)
      flash('Team deleted')
      await loadTeams()
      setView('list')
    } catch { flash('Failed to delete team','error') }
  }

  async function sendInvite() {
    if (!inviteEmail.trim()||!activeTeam) return
    setSaving(true)
    try {
      await api.post(`/api/teams/${activeTeam.id}/invite`,{email:inviteEmail})
      flash('✉️ Invite sent to ' + inviteEmail)
      setInviteEmail('')
    } catch { flash('Failed to send invite','error') }
    finally { setSaving(false) }
  }

  async function createTeamTask() {
    if (!newTask.title.trim()||!activeTeam) return
    setSaving(true)
    try {
      await api.post(`/api/teams/${activeTeam.id}/tasks`, newTask)
      flash('⚡ Task created!')
      setNewTask({title:'',description:'',priority:'MEDIUM',assigneeId:''})
      await loadTeamTasks(activeTeam.id)
    } catch { flash('Failed to create task','error') }
    finally { setSaving(false) }
  }

  function openTeam(team) {
    setActiveTeam(team)
    setView('team')
    setTab('board')
    loadTeamTasks(team.id)
  }

  const inp={width:'100%',padding:'10px 13px',background:'var(--surface2)',border:'1px solid var(--border2)',
    borderRadius:10,color:'var(--text)',fontSize:13,outline:'none',transition:'border-color .2s'}

  const btn=(color='var(--accent)')=>({padding:'10px 20px',borderRadius:10,border:'none',
    background:`linear-gradient(135deg,${color},${color}cc)`,color:'#fff',fontSize:13,fontWeight:600,
    cursor:'pointer',display:'flex',alignItems:'center',gap:7,transition:'all .15s'})

  const PRI_COLORS = {HIGH:'#ff6b6b',MEDIUM:'#ffd93d',LOW:'#6bcb77'}
  const STATUS_COLORS = {TODO:'#a78bfa',IN_PROGRESS:'#60a5fa',DONE:'#6bcb77'}

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,gap:12,flexDirection:'column'}}>
      <Spinner size={28}/>
      <p style={{color:'var(--muted)',fontSize:13}}>Loading teams…</p>
    </div>
  )

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:800,margin:'0 auto'}}>

        {/* TEAM LIST VIEW */}
        {view==='list' && (
          <>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,#0ea5e9,#38bdf8)',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,boxShadow:'0 4px 14px rgba(14,165,233,.3)'}}>👥</div>
                <div>
                  <h2 style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:'Syne,sans-serif',margin:0}}>Teams</h2>
                  <p style={{fontSize:12,color:'var(--muted)',margin:0}}>Collaborate with your team</p>
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
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                {teams.map((team,i)=>(
                  <div key={team.id} className="team-card" onClick={()=>openTeam(team)}
                    style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:20,
                      cursor:'pointer',transition:'all .2s',animation:`fadeUp .4s ease both`,animationDelay:`${i*60}ms`}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                      <div style={{width:42,height:42,borderRadius:12,background:'linear-gradient(135deg,var(--accent),var(--accent2))',
                        display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'#fff'}}>
                        {team.name?.[0]?.toUpperCase()||'T'}
                      </div>
                      <div>
                        <p style={{fontSize:15,fontWeight:700,color:'var(--text)',margin:0,fontFamily:'Syne,sans-serif'}}>{team.name}</p>
                        <p style={{fontSize:11,color:'var(--muted)',margin:0}}>{team.description||'No description'}</p>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div style={{display:'flex',gap:-6}}>
                        {team.members?.slice(0,5).map((m,mi)=>(
                          <div key={mi} title={m.name} style={{width:26,height:26,borderRadius:8,background:'linear-gradient(135deg,var(--accent),var(--accent2))',
                            border:'2px solid var(--surface)',display:'flex',alignItems:'center',justifyContent:'center',
                            fontSize:10,fontWeight:800,color:'#fff',marginLeft:mi>0?-8:0}}>
                            {(m.name?.[0]||'?').toUpperCase()}
                          </div>
                        ))}
                        {team.members?.length>5&&<div style={{width:26,height:26,borderRadius:8,background:'var(--surface3)',
                          border:'2px solid var(--surface)',display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:9,color:'var(--muted)',marginLeft:-8}}>+{team.members.length-5}</div>}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:11,color:'var(--muted)'}}>{team.memberCount} members</span>
                        <span style={{fontSize:10,padding:'2px 8px',borderRadius:6,fontWeight:700,
                          background:team.myRole==='OWNER'?'rgba(255,217,61,.15)':'rgba(255,255,255,.06)',
                          color:team.myRole==='OWNER'?'var(--warn)':'var(--muted)'}}>
                          {team.myRole}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* CREATE TEAM VIEW */}
        {view==='create' && (
          <div style={{animation:'fadeUp .3s ease'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
              <button onClick={()=>setView('list')} style={{width:32,height:32,borderRadius:9,background:'var(--surface2)',
                border:'1px solid var(--border)',color:'var(--muted)',cursor:'pointer',fontSize:16}}>←</button>
              <h2 style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:'Syne,sans-serif',margin:0}}>Create Team</h2>
            </div>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:24,maxWidth:480}}>
              <div style={{marginBottom:16}}>
                <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Team Name *</label>
                <input style={inp} placeholder="e.g. Design Team, Backend Squad" value={newTeam.name}
                  onChange={e=>setNewTeam(p=>({...p,name:e.target.value}))}
                  onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
              </div>
              <div style={{marginBottom:22}}>
                <label style={{display:'block',fontSize:10,fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',color:'var(--muted)',marginBottom:7}}>Description</label>
                <textarea style={{...inp,resize:'vertical',lineHeight:1.6}} rows={3} placeholder="What does this team work on?"
                  value={newTeam.description} onChange={e=>setNewTeam(p=>({...p,description:e.target.value}))}
                  onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setView('list')} style={{flex:1,padding:11,borderRadius:10,border:'1px solid var(--border)',
                  background:'var(--surface2)',color:'var(--muted)',fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
                <button className="t-btn" onClick={createTeam} disabled={saving||!newTeam.name.trim()} style={{...btn(),flex:2,justifyContent:'center',opacity:!newTeam.name.trim()?.5:1}}>
                  {saving?<><Spinner/> Creating…</>:'🚀 Create Team'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TEAM DETAIL VIEW */}
        {view==='team' && activeTeam && (
          <div style={{animation:'fadeUp .3s ease'}}>
            {/* Header */}
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
              <button onClick={()=>setView('list')} style={{width:32,height:32,borderRadius:9,background:'var(--surface2)',
                border:'1px solid var(--border)',color:'var(--muted)',cursor:'pointer',fontSize:16}}>←</button>
              <div style={{width:38,height:38,borderRadius:11,background:'linear-gradient(135deg,var(--accent),var(--accent2))',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'#fff'}}>
                {activeTeam.name?.[0]?.toUpperCase()||'T'}
              </div>
              <div>
                <h2 style={{fontSize:17,fontWeight:800,color:'var(--text)',fontFamily:'Syne,sans-serif',margin:0}}>{activeTeam.name}</h2>
                <p style={{fontSize:11,color:'var(--muted)',margin:0}}>{activeTeam.memberCount} members · {activeTeam.myRole}</p>
              </div>
            </div>

            {/* Tabs */}
            <div style={{display:'flex',gap:6,marginBottom:20}}>
              {[['board','📋','Task Board'],['members','👥','Members'],['invite','✉️','Invite']].map(([key,ic,lb])=>(
                <button key={key} onClick={()=>setTab(key)} style={{padding:'7px 16px',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer',
                  background:tab===key?'var(--accent)':'var(--surface2)',color:tab===key?'#fff':'var(--muted)',
                  border:tab===key?'none':'1px solid var(--border)',transition:'all .15s'}}>
                  {ic} {lb}
                </button>
              ))}
            </div>

            {/* TASK BOARD */}
            {tab==='board' && (
              <>
                {/* New task form */}
                <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:18,marginBottom:18}}>
                  <p style={{fontSize:13,fontWeight:700,color:'var(--text)',marginBottom:12}}>⚡ Add Team Task</p>
                  <div style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:10,marginBottom:10}}>
                    <input style={inp} placeholder="Task title…" value={newTask.title}
                      onChange={e=>setNewTask(p=>({...p,title:e.target.value}))}
                      onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
                    <select style={{...inp,width:'auto'}} value={newTask.priority} onChange={e=>setNewTask(p=>({...p,priority:e.target.value}))}>
                      <option value="HIGH">🔴 High</option>
                      <option value="MEDIUM">🟡 Medium</option>
                      <option value="LOW">🟢 Low</option>
                    </select>
                    <select style={{...inp,width:'auto'}} value={newTask.assigneeId} onChange={e=>setNewTask(p=>({...p,assigneeId:e.target.value}))}>
                      <option value="">Assign to…</option>
                      {activeTeam.members?.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <button className="t-btn" onClick={createTeamTask} disabled={saving||!newTask.title.trim()}
                    style={{...btn(),opacity:!newTask.title.trim()?.5:1}}>
                    {saving?<><Spinner/> Adding…</>:'+ Add Task'}
                  </button>
                </div>

                {/* Kanban columns */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                  {['TODO','IN_PROGRESS','DONE'].map(status=>{
                    const cols = {TODO:{label:'To Do',emoji:'📋',color:'#a78bfa'},IN_PROGRESS:{label:'In Progress',emoji:'⚡',color:'#60a5fa'},DONE:{label:'Done',emoji:'✅',color:'#6bcb77'}}
                    const col = cols[status]
                    const colTasks = teamTasks.filter(t=>t.status===status)
                    return (
                      <div key={status} style={{background:'var(--surface2)',borderRadius:14,padding:14}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                          <span style={{fontSize:14}}>{col.emoji}</span>
                          <span style={{fontSize:12,fontWeight:700,color:col.color}}>{col.label}</span>
                          <span style={{marginLeft:'auto',fontSize:10,padding:'1px 7px',borderRadius:6,background:'var(--surface3)',color:'var(--muted)'}}>{colTasks.length}</span>
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:8}}>
                          {colTasks.map(task=>(
                            <div key={task.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:12}}>
                              <p style={{fontSize:13,fontWeight:600,color:'var(--text)',margin:'0 0 6px',lineHeight:1.4}}>{task.title}</p>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                <span style={{fontSize:10,padding:'2px 7px',borderRadius:5,fontWeight:700,
                                  background:`${PRI_COLORS[task.priority]}18`,color:PRI_COLORS[task.priority]||'var(--muted)'}}>
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

            {/* MEMBERS */}
            {tab==='members' && (
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
                {activeTeam.members?.map((m,i)=>(
                  <div key={m.id} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',
                    borderBottom:i<activeTeam.members.length-1?'1px solid var(--border)':'none',
                    animation:`fadeUp .3s ease both`,animationDelay:`${i*40}ms`}}>
                    <Avatar name={m.name} size={36}/>
                    <div style={{flex:1}}>
                      <p style={{fontSize:14,fontWeight:600,color:'var(--text)',margin:0}}>{m.name}</p>
                      <p style={{fontSize:11,color:'var(--muted)',margin:0}}>{m.email}</p>
                    </div>
                    <span style={{fontSize:10,padding:'3px 10px',borderRadius:6,fontWeight:700,
                      background:m.role==='OWNER'?'rgba(255,217,61,.15)':m.role==='ADMIN'?'rgba(255,107,107,.12)':'rgba(255,255,255,.06)',
                      color:m.role==='OWNER'?'var(--warn)':m.role==='ADMIN'?'var(--danger)':'var(--muted)'}}>
                      {m.role==='OWNER'?'👑 Owner':m.role==='ADMIN'?'🛡️ Admin':'👤 Member'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* INVITE */}
            {tab==='invite' && (
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:22,maxWidth:440}}>
                <p style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:4}}>✉️ Invite by Email</p>
                <p style={{fontSize:12,color:'var(--muted)',marginBottom:18}}>They'll get an invite link valid for 7 days</p>
                <div style={{display:'flex',gap:10}}>
                  <input style={{...inp,flex:1}} type="email" placeholder="colleague@company.com"
                    value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&sendInvite()}
                    onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
                  <button className="t-btn" onClick={sendInvite} disabled={saving||!inviteEmail.trim()} style={btn()}>
                    {saving?<Spinner/>:'Send'}
                  </button>
                </div>
                <div style={{marginTop:20,padding:14,borderRadius:12,background:'rgba(14,165,233,.06)',border:'1px solid rgba(14,165,233,.15)'}}>
                  <p style={{fontSize:12,color:'#7dd3fc',margin:0}}>💡 The invite link will be sent to their email. They need to have a TaskFlow account to join, or create one when they click the link.</p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {toast&&(
        <div style={{position:'fixed',bottom:22,right:22,padding:'12px 18px',borderRadius:12,fontSize:13,fontWeight:600,zIndex:999,
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