import React, { useState, useEffect, useRef, useCallback } from 'react'
import api from '../services/api'

const css = `
  @keyframes bellRing {
    0%,100%{transform:rotate(0)}
    15%{transform:rotate(18deg)}
    30%{transform:rotate(-16deg)}
    45%{transform:rotate(12deg)}
    60%{transform:rotate(-8deg)}
    75%{transform:rotate(4deg)}
  }
  @keyframes fadeDown {
    from{opacity:0;transform:translateY(-8px) scale(.97)}
    to{opacity:1;transform:translateY(0) scale(1)}
  }
  @keyframes notifIn {
    from{opacity:0;transform:translateX(8px)}
    to{opacity:1;transform:translateX(0)}
  }
  @keyframes spin { to{transform:rotate(360deg)} }
  .notif-item:hover { background: var(--surface2, #1a1a24) !important; }
  .notif-item.unread { border-left: 3px solid var(--accent, #7c3aed) !important; }
  .bell-btn:hover { background: rgba(255,255,255,.07) !important; }
`

const TYPE_CFG = {
  DUE_SOON:      { emoji:'⏰', color:'#ffd93d', bg:'rgba(255,217,61,.1)'   },
  OVERDUE:       { emoji:'🚨', color:'#ff6b6b', bg:'rgba(255,107,107,.1)'  },
  TASK_DONE:     { emoji:'✅', color:'#6bcb77', bg:'rgba(107,203,119,.1)'  },
  BADGE_EARNED:  { emoji:'🏆', color:'#a855f7', bg:'rgba(168,85,247,.1)'   },
  LEVEL_UP:      { emoji:'⚡', color:'#60a5fa', bg:'rgba(96,165,250,.1)'   },
  TEAM_INVITE:   { emoji:'👥', color:'#0ea5e9', bg:'rgba(14,165,233,.1)'   },
  TEAM_MESSAGE:  { emoji:'💬', color:'#a855f7', bg:'rgba(168,85,247,.1)'   },
  STREAK_AT_RISK:{ emoji:'🔥', color:'#ff6b6b', bg:'rgba(255,107,107,.1)'  },
}

function timeAgo(dt) {
  const diff = Math.floor((Date.now() - new Date(dt)) / 1000)
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

export default function NotificationBell() {
  const [open, setOpen]       = useState(false)
  const [notifs, setNotifs]   = useState([])
  const [unread, setUnread]   = useState(0)
  const [loading, setLoading] = useState(false)
  const [ringing, setRinging] = useState(false)
  const [filter, setFilter]   = useState('all') // all | unread
  const dropRef = useRef(null)
  const prevUnread = useRef(0)

  // Poll unread count every 15s
  const pollUnread = useCallback(async () => {
    try {
      const r = await api.get('/api/notifications/unread-count')
      const count = r.data.count ?? 0
      if (count > prevUnread.current) {
        setRinging(true)
        setTimeout(() => setRinging(false), 1200)
      }
      prevUnread.current = count
      setUnread(count)
    } catch {}
  }, [])

  useEffect(() => {
    pollUnread()
    const id = setInterval(pollUnread, 15000)
    return () => clearInterval(id)
  }, [pollUnread])

  // Load full list when opened
  useEffect(() => {
    if (!open) return
    setLoading(true)
    api.get('/api/notifications')
      .then(r => setNotifs(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function markRead(id) {
    await api.patch(`/api/notifications/${id}/read`)
    setNotifs(p => p.map(n => n.id === id ? {...n, read: true} : n))
    setUnread(p => Math.max(0, p - 1))
    prevUnread.current = Math.max(0, prevUnread.current - 1)
  }

  async function markAllRead() {
    await api.patch('/api/notifications/read-all')
    setNotifs(p => p.map(n => ({...n, read: true})))
    setUnread(0)
    prevUnread.current = 0
  }

  async function deleteNotif(e, id) {
    e.stopPropagation()
    await api.delete(`/api/notifications/${id}`)
    const wasUnread = notifs.find(n => n.id === id)?.read === false
    setNotifs(p => p.filter(n => n.id !== id))
    if (wasUnread) setUnread(p => Math.max(0, p - 1))
  }

  async function clearAll() {
    await api.delete('/api/notifications/clear-all')
    setNotifs([])
    setUnread(0)
    prevUnread.current = 0
  }

  const displayed = filter === 'unread' ? notifs.filter(n => !n.read) : notifs

  return (
    <>
      <style>{css}</style>
      <div ref={dropRef} style={{position:'relative'}}>

        {/* Bell button */}
        <button className="bell-btn" onClick={() => setOpen(o => !o)}
          style={{position:'relative',width:38,height:38,borderRadius:10,background:open?'rgba(124,58,237,.12)':'transparent',
            border:`1px solid ${open?'rgba(124,58,237,.3)':'rgba(255,255,255,.06)'}`,
            color: open ? '#a855f7' : '#6b6b8a',fontSize:18,display:'flex',alignItems:'center',
            justifyContent:'center',cursor:'pointer',transition:'all .15s',flexShrink:0}}>
          <span style={{display:'inline-block',animation:ringing?'bellRing .8s ease':'none',transformOrigin:'top center'}}>
            🔔
          </span>
          {unread > 0 && (
            <span style={{position:'absolute',top:4,right:4,minWidth:16,height:16,
              borderRadius:8,background:'linear-gradient(135deg,#ff6b6b,#ff4444)',
              color:'#fff',fontSize:9,fontWeight:800,display:'flex',alignItems:'center',
              justifyContent:'center',padding:'0 3px',border:'1.5px solid var(--surface,#111118)',
              lineHeight:1}}>
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div style={{position:'absolute',top:'calc(100% + 10px)',right:0,width:360,
            background:'var(--surface,#111118)',border:'1px solid rgba(255,255,255,.08)',
            borderRadius:18,boxShadow:'0 24px 64px rgba(0,0,0,.7)',zIndex:500,
            animation:'fadeDown .2s ease',overflow:'hidden',
            maxHeight:'80vh',display:'flex',flexDirection:'column'}}>

            {/* Header */}
            <div style={{padding:'16px 18px 12px',borderBottom:'1px solid rgba(255,255,255,.06)',flexShrink:0}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:16}}>🔔</span>
                  <h3 style={{fontSize:15,fontWeight:700,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:0}}>Notifications</h3>
                  {unread > 0 && (
                    <span style={{fontSize:10,padding:'2px 7px',borderRadius:20,background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',fontWeight:700}}>
                      {unread} new
                    </span>
                  )}
                </div>
                <div style={{display:'flex',gap:6}}>
                  {unread > 0 && (
                    <button onClick={markAllRead}
                      style={{fontSize:11,padding:'4px 10px',borderRadius:7,background:'rgba(124,58,237,.12)',border:'1px solid rgba(124,58,237,.2)',color:'#a855f7',cursor:'pointer',fontWeight:600}}>
                      Mark all read
                    </button>
                  )}
                  {notifs.length > 0 && (
                    <button onClick={clearAll}
                      style={{fontSize:11,padding:'4px 10px',borderRadius:7,background:'rgba(255,107,107,.08)',border:'1px solid rgba(255,107,107,.2)',color:'#ff6b6b',cursor:'pointer',fontWeight:600}}>
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Filter tabs */}
              <div style={{display:'flex',gap:4}}>
                {[['all',`All (${notifs.length})`],['unread',`Unread (${unread})`]].map(([key,label])=>(
                  <button key={key} onClick={()=>setFilter(key)}
                    style={{padding:'5px 12px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',transition:'all .15s',
                      background:filter===key?'var(--accent,#7c3aed)':'rgba(255,255,255,.05)',
                      color:filter===key?'#fff':'#6b6b8a',border:'none'}}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div style={{overflowY:'auto',flex:1}}>
              {loading ? (
                <div style={{display:'flex',justifyContent:'center',padding:32}}>
                  <span style={{width:22,height:22,border:'2px solid #a855f7',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/>
                </div>
              ) : displayed.length === 0 ? (
                <div style={{textAlign:'center',padding:'48px 24px'}}>
                  <div style={{fontSize:40,marginBottom:12}}>🔕</div>
                  <p style={{fontSize:14,fontWeight:600,color:'#f0f0f8',marginBottom:6,fontFamily:'Syne,sans-serif'}}>
                    {filter==='unread' ? 'All caught up!' : 'No notifications yet'}
                  </p>
                  <p style={{fontSize:12,color:'#6b6b8a'}}>
                    {filter==='unread' ? 'No unread notifications' : 'Complete tasks to get notifications'}
                  </p>
                </div>
              ) : (
                displayed.map((n, i) => {
                  const cfg = TYPE_CFG[n.type] || TYPE_CFG.TASK_DONE
                  return (
                    <div key={n.id} className={`notif-item${n.read ? '' : ' unread'}`}
                      onClick={() => { if (!n.read) markRead(n.id) }}
                      style={{display:'flex',gap:12,padding:'13px 16px',cursor:n.read?'default':'pointer',
                        borderBottom:'1px solid rgba(255,255,255,.04)',transition:'background .15s',
                        background:n.read?'transparent':'rgba(124,58,237,.03)',
                        borderLeft:n.read?'3px solid transparent':`3px solid ${cfg.color}`,
                        animation:`notifIn .25s ease both`,animationDelay:`${i*30}ms`}}>
                      {/* Icon */}
                      <div style={{width:36,height:36,borderRadius:10,background:cfg.bg,display:'flex',
                        alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0}}>
                        {cfg.emoji}
                      </div>
                      {/* Content */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
                          <p style={{fontSize:13,fontWeight:n.read?500:700,color:n.read?'#9ca3af':'#f0f0f8',
                            margin:'0 0 3px',lineHeight:1.3}}>
                            {n.title}
                          </p>
                          <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
                            {!n.read && <div style={{width:7,height:7,borderRadius:'50%',background:'#a855f7',flexShrink:0}}/>}
                            <button onClick={e=>deleteNotif(e,n.id)}
                              style={{width:18,height:18,borderRadius:5,background:'none',border:'none',
                                color:'#4b5563',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
                                opacity:.5}}
                              onMouseEnter={e=>e.currentTarget.style.opacity='1'}
                              onMouseLeave={e=>e.currentTarget.style.opacity='.5'}>
                              ✕
                            </button>
                          </div>
                        </div>
                        <p style={{fontSize:12,color:'#6b6b8a',margin:'0 0 5px',lineHeight:1.4,
                          overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                          {n.body}
                        </p>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:10,color:'#4b5563'}}>{n.createdAt ? timeAgo(n.createdAt) : ''}</span>
                          <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,background:cfg.bg,color:cfg.color,fontWeight:600}}>
                            {n.type?.replace(/_/g,' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {notifs.length > 0 && (
              <div style={{padding:'10px 16px',borderTop:'1px solid rgba(255,255,255,.06)',textAlign:'center',flexShrink:0}}>
                <p style={{fontSize:11,color:'#4b5563'}}>Showing last {Math.min(notifs.length, 50)} notifications</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}