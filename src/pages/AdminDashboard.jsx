import React, { useEffect, useState } from 'react'
import api from '../services/api'

const css = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .admin-row:hover { background: var(--surface2) !important; }
  .act-btn:hover { opacity:.8; transform:scale(.97); }
`

function MiniBar({ data, color }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:2,height:40}}>
      {data.map((d,i) => (
        <div key={i} title={`${d.date}: ${d.count}`}
          style={{flex:1,borderRadius:'2px 2px 0 0',background:d.count>0?color:'rgba(255,255,255,.05)',
            height:`${Math.max((d.count/max)*100,d.count>0?8:2)}%`,transition:'height .3s'}}/>
      ))}
    </div>
  )
}

function StatBox({ label, value, sub, color, emoji, delay=0 }) {
  return (
    <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'18px 20px',
      position:'relative',overflow:'hidden',animation:`fadeUp .4s ease both`,animationDelay:`${delay}ms`}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${color},transparent)`}}/>
      <div style={{fontSize:22,marginBottom:8}}>{emoji}</div>
      <p style={{fontSize:28,fontWeight:800,color,fontFamily:'Syne,sans-serif',margin:'0 0 3px'}}>{value}</p>
      <p style={{fontSize:12,fontWeight:600,color:'var(--text)',margin:'0 0 2px'}}>{label}</p>
      <p style={{fontSize:11,color:'var(--muted)',margin:0}}>{sub}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('overview')
  const [toast, setToast] = useState(null)

  function flash(msg, type='success') { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  useEffect(() => {
    async function load() {
      try {
        const [sr, ur] = await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/admin/users'),
        ])
        setStats(sr.data)
        setUsers(Array.isArray(ur.data) ? ur.data : [])
      } catch(e) { flash('Failed to load admin data','error') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  async function handleBan(id) {
    try {
      const res = await api.post(`/api/admin/users/${id}/ban`)
      setUsers(u => u.map(x => x.id===id ? {...x, isBanned: res.data.banned} : x))
      flash(res.data.message)
    } catch { flash('Action failed','error') }
  }

  async function handleMakeAdmin(id) {
    try {
      const res = await api.post(`/api/admin/users/${id}/make-admin`)
      setUsers(u => u.map(x => x.id===id ? {...x, role: res.data.role} : x))
      flash('Role updated!')
    } catch { flash('Action failed','error') }
  }

  async function handleTogglePro(id) {
    try {
      const res = await api.post(`/api/admin/users/${id}/pro`)
      setUsers(u => u.map(x => x.id===id ? {...x, isPro: res.data.isPro} : x))
      flash(res.data.isPro ? '⭐ Pro granted!' : 'Pro removed')
    } catch { flash('Action failed','error') }
  }

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,gap:12,flexDirection:'column'}}>
      <div style={{width:32,height:32,border:'3px solid var(--accent)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      <p style={{color:'var(--muted)',fontSize:13}}>Loading admin data…</p>
    </div>
  )

  const tabBtn = (key, label, icon) => (
    <button onClick={()=>setTab(key)} style={{padding:'8px 18px',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',
      background:tab===key?'var(--accent)':'var(--surface2)',color:tab===key?'#fff':'var(--muted)',
      border:tab===key?'none':'1px solid var(--border)',transition:'all .15s'}}>
      {icon} {label}
    </button>
  )

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:1000,margin:'0 auto'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:22}}>
          <div style={{width:42,height:42,borderRadius:12,background:'linear-gradient(135deg,#ff6b6b,#f97316)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,boxShadow:'0 4px 14px rgba(249,115,22,.3)'}}>🛡️</div>
          <div>
            <h2 style={{fontSize:18,fontWeight:800,color:'var(--text)',fontFamily:'Syne,sans-serif',margin:0}}>Admin Dashboard</h2>
            <p style={{fontSize:12,color:'var(--muted)',margin:0}}>TaskFlow control panel</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:8,marginBottom:22}}>
          {tabBtn('overview','Overview','📊')}
          {tabBtn('users','Users','👥')}
        </div>

        {tab==='overview' && stats && (
          <>
            {/* Stat cards */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
              <StatBox emoji="👥" label="Total Users" value={stats.totalUsers} sub="registered accounts" color="var(--accent2)" delay={0}/>
              <StatBox emoji="🟢" label="Active (7d)" value={stats.activeUsers7d} sub={`${stats.activeUsers30d} in 30 days`} color="var(--success)" delay={60}/>
              <StatBox emoji="⭐" label="Pro Users" value={stats.proUsers} sub={`$${stats.estimatedRevenue}/mo est.`} color="var(--warn)" delay={120}/>
              <StatBox emoji="📋" label="Total Tasks" value={stats.totalTasks} sub="across all users" color="#60a5fa" delay={180}/>
            </div>

            {/* Charts row */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:20,animation:'fadeUp .4s ease both',animationDelay:'200ms'}}>
                <p style={{fontSize:13,fontWeight:700,color:'var(--text)',marginBottom:4,fontFamily:'Syne,sans-serif'}}>👥 New Users — Last 30 Days</p>
                <p style={{fontSize:11,color:'var(--muted)',marginBottom:14}}>Daily registrations</p>
                <MiniBar data={stats.userGrowth} color="var(--accent2)"/>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                  <span style={{fontSize:10,color:'var(--muted)'}}>{stats.userGrowth?.[0]?.date}</span>
                  <span style={{fontSize:10,color:'var(--muted)'}}>Today</span>
                </div>
              </div>
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:20,animation:'fadeUp .4s ease both',animationDelay:'250ms'}}>
                <p style={{fontSize:13,fontWeight:700,color:'var(--text)',marginBottom:4,fontFamily:'Syne,sans-serif'}}>📋 Tasks Created — Last 14 Days</p>
                <p style={{fontSize:11,color:'var(--muted)',marginBottom:14}}>Daily task creation</p>
                <MiniBar data={stats.tasksPerDay} color="var(--success)"/>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                  <span style={{fontSize:10,color:'var(--muted)'}}>{stats.tasksPerDay?.[0]?.date}</span>
                  <span style={{fontSize:10,color:'var(--muted)'}}>Today</span>
                </div>
              </div>
            </div>

            {/* Revenue card */}
            <div style={{background:'linear-gradient(135deg,rgba(124,58,237,.1),rgba(168,85,247,.05))',border:'1px solid rgba(124,58,237,.2)',borderRadius:16,padding:20,animation:'fadeUp .4s ease both',animationDelay:'300ms'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                <div>
                  <p style={{fontSize:13,fontWeight:700,color:'var(--text)',marginBottom:4}}>💰 Revenue Overview</p>
                  <p style={{fontSize:11,color:'var(--muted)'}}>Based on active Pro subscriptions at $9/mo</p>
                </div>
                <div style={{display:'flex',gap:20}}>
                  <div style={{textAlign:'center'}}>
                    <p style={{fontSize:26,fontWeight:800,color:'var(--warn)',fontFamily:'Syne,sans-serif',margin:0}}>${stats.estimatedRevenue}</p>
                    <p style={{fontSize:11,color:'var(--muted)'}}>Monthly Revenue</p>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <p style={{fontSize:26,fontWeight:800,color:'var(--success)',fontFamily:'Syne,sans-serif',margin:0}}>${stats.estimatedRevenue * 12}</p>
                    <p style={{fontSize:11,color:'var(--muted)'}}>Annual Run Rate</p>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <p style={{fontSize:26,fontWeight:800,color:'var(--accent2)',fontFamily:'Syne,sans-serif',margin:0}}>{stats.proUsers}</p>
                    <p style={{fontSize:11,color:'var(--muted)'}}>Pro Subscribers</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {tab==='users' && (
          <>
            {/* Search */}
            <div style={{position:'relative',marginBottom:16}}>
              <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--muted)',fontSize:14,pointerEvents:'none'}}>⌕</span>
              <input type="text" placeholder="Search users by name or email…" value={search} onChange={e=>setSearch(e.target.value)}
                style={{width:'100%',paddingLeft:34,paddingRight:14,paddingTop:10,paddingBottom:10,borderRadius:10,
                  background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text)',fontSize:13,
                  outline:'none',transition:'border-color .2s'}}
                onFocus={e=>e.target.style.borderColor='var(--accent)'}
                onBlur={e=>e.target.style.borderColor='var(--border)'}/>
            </div>

            {/* Users table */}
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden'}}>
              {/* Header */}
              <div style={{display:'grid',gridTemplateColumns:'2fr 2fr 80px 80px 80px 80px 160px',gap:8,
                padding:'10px 16px',background:'var(--surface2)',borderBottom:'1px solid var(--border)'}}>
                {['Name','Email','Role','Pro','Tasks','Score','Actions'].map(h=>(
                  <span key={h} style={{fontSize:10,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--muted)'}}>{h}</span>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div style={{padding:32,textAlign:'center',color:'var(--muted)',fontSize:13}}>No users found</div>
              ) : (
                filtered.map((u,i) => (
                  <div key={u.id} className="admin-row"
                    style={{display:'grid',gridTemplateColumns:'2fr 2fr 80px 80px 80px 80px 160px',gap:8,
                      padding:'12px 16px',borderBottom:'1px solid var(--border)',
                      background:u.isBanned?'rgba(255,107,107,.04)':'transparent',
                      opacity:u.isBanned?.7:1,transition:'background .15s',animation:`fadeUp .3s ease both`,animationDelay:`${i*20}ms`}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,minWidth:0}}>
                      <div style={{width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,var(--accent),var(--accent2))',
                        display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#fff',flexShrink:0}}>
                        {(u.name?.[0]||'?').toUpperCase()}
                      </div>
                      <div style={{minWidth:0}}>
                        <p style={{fontSize:13,fontWeight:600,color:'var(--text)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name}</p>
                        <p style={{fontSize:10,color:'var(--muted)',margin:0}}>
                          {u.lastLoginAt ? 'Active ' + new Date(u.lastLoginAt).toLocaleDateString('en-IN',{month:'short',day:'numeric'}) : 'Never logged in'}
                        </p>
                      </div>
                    </div>
                    <p style={{fontSize:12,color:'var(--muted)',margin:'auto 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email}</p>
                    <div style={{display:'flex',alignItems:'center'}}>
                      <span style={{fontSize:10,padding:'2px 8px',borderRadius:6,fontWeight:700,
                        background:u.role==='ADMIN'?'rgba(255,107,107,.15)':'rgba(255,255,255,.06)',
                        color:u.role==='ADMIN'?'var(--danger)':'var(--muted)'}}>
                        {u.role==='ADMIN'?'👑 ADMIN':'USER'}
                      </span>
                    </div>
                    <div style={{display:'flex',alignItems:'center'}}>
                      {u.isPro
                        ? <span style={{fontSize:10,padding:'2px 8px',borderRadius:6,fontWeight:700,background:'rgba(255,217,61,.15)',color:'var(--warn)'}}>⭐ PRO</span>
                        : <span style={{fontSize:10,color:'var(--muted)'}}>Free</span>}
                    </div>
                    <p style={{fontSize:13,fontWeight:600,color:'var(--text)',margin:'auto 0'}}>{u.taskCount||0}</p>
                    <p style={{fontSize:13,fontWeight:600,color:'var(--accent2)',margin:'auto 0'}}>{u.focusScore||0}</p>
                    <div style={{display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
                      <button className="act-btn" onClick={()=>handleBan(u.id)}
                        title={u.isBanned?'Unban user':'Ban user'}
                        style={{padding:'4px 8px',borderRadius:6,fontSize:10,fontWeight:700,cursor:'pointer',transition:'all .15s',
                          background:u.isBanned?'rgba(107,203,119,.15)':'rgba(255,107,107,.15)',
                          color:u.isBanned?'var(--success)':'var(--danger)',
                          border:`1px solid ${u.isBanned?'rgba(107,203,119,.3)':'rgba(255,107,107,.3)'}`}}>
                        {u.isBanned?'Unban':'Ban'}
                      </button>
                      <button className="act-btn" onClick={()=>handleMakeAdmin(u.id)}
                        style={{padding:'4px 8px',borderRadius:6,fontSize:10,fontWeight:700,cursor:'pointer',transition:'all .15s',
                          background:'rgba(255,107,107,.12)',color:'var(--danger)',border:'1px solid rgba(255,107,107,.25)'}}>
                        {u.role==='ADMIN'?'Demote':'Admin'}
                      </button>
                      <button className="act-btn" onClick={()=>handleTogglePro(u.id)}
                        style={{padding:'4px 8px',borderRadius:6,fontSize:10,fontWeight:700,cursor:'pointer',transition:'all .15s',
                          background:'rgba(255,217,61,.12)',color:'var(--warn)',border:'1px solid rgba(255,217,61,.25)'}}>
                        {u.isPro?'−Pro':'⭐Pro'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <p style={{fontSize:11,color:'var(--muted)',marginTop:10,textAlign:'right'}}>{filtered.length} of {users.length} users</p>
          </>
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