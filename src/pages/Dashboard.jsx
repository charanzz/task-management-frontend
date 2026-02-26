import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { taskAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

// ─── constants ────────────────────────────────────────────────────────────────
const PRI = {
  HIGH:   { color:'#f87171', bg:'rgba(248,113,113,0.10)', label:'High',   pts:30 },
  MEDIUM: { color:'#fbbf24', bg:'rgba(251,191,36,0.10)',  label:'Medium', pts:15 },
  LOW:    { color:'#6ee7b7', bg:'rgba(110,231,183,0.10)', label:'Low',    pts:5  },
}
const WEEK = ['M','T','W','T','F','S','S']

function todayIndex() {
  const d = new Date().getDay()   // 0=Sun
  return d === 0 ? 6 : d - 1
}

function dueBadge(dateStr) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr) - Date.now()) / 86400000)
  if (diff < 0)  return { text: `${-diff}d overdue`, color:'var(--danger)' }
  if (diff === 0) return { text: 'Due today',        color:'var(--warn)'   }
  if (diff === 1) return { text: 'Due tomorrow',     color:'var(--muted)'  }
  return            { text: `In ${diff}d`,           color:'var(--muted)'  }
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span style={{ width:14, height:14, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }} />
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon, delay }) {
  return (
    <div className={`anim-up ${delay}`} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderTop:`2px solid ${color}`, borderRadius:16, padding:'20px 22px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:10, right:14, fontSize:38, opacity:.06, userSelect:'none' }}>{icon}</div>
      <p style={{ fontSize:9, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>{label}</p>
      <p style={{ fontSize:36, fontWeight:800, color, lineHeight:1, marginBottom:5 }}>{value}</p>
      <p style={{ fontSize:11, color:'var(--muted)' }}>{sub}</p>
    </div>
  )
}

// ─── TaskRow ──────────────────────────────────────────────────────────────────
function TaskRow({ task, onToggle, onEdit, onDelete, idx }) {
  const [hover, setHover] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const isDone = task.status === 'DONE'
  const cfg = PRI[task.priority] || PRI.MEDIUM
  const due = dueBadge(task.dueDate || task.due_date)

  function del() {
    if (confirmDel) { onDelete(); setConfirmDel(false) }
    else { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 3000) }
  }

  return (
    <div
      style={{
        display:'flex', alignItems:'center', gap:12, padding:'13px 15px', borderRadius:14,
        background: hover ? 'var(--surface2)' : 'var(--surface)',
        border:`1px solid ${hover ? 'var(--border2)' : 'var(--border)'}`,
        transition:'all .15s', marginBottom:6, opacity: isDone ? .55 : 1,
        animation:`fadeUp .4s ease both`, animationDelay:`${idx*.04}s`,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* priority bar */}
      <div style={{ width:3, height:40, borderRadius:4, flexShrink:0, background:cfg.color, boxShadow:`0 0 8px ${cfg.color}55` }} />

      {/* checkbox */}
      <button onClick={onToggle} style={{
        width:22, height:22, borderRadius:7, flexShrink:0, cursor:'pointer',
        background: isDone ? 'var(--accent)' : 'var(--surface2)',
        border:`2px solid ${isDone ? 'var(--accent)' : 'var(--border2)'}`,
        color:'var(--ink)', fontSize:11, fontWeight:800,
        display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s',
      }}>{isDone ? '✓' : ''}</button>

      {/* text */}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:14, fontWeight:500, color: isDone?'var(--muted)':'var(--text)', textDecoration: isDone?'line-through':'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>
          {task.title}
        </p>
        {task.description && (
          <p style={{ fontSize:11, color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task.description}</p>
        )}
      </div>

      {/* due */}
      {due && <span style={{ fontSize:11, color:due.color, flexShrink:0, whiteSpace:'nowrap' }}>{due.text}</span>}

      {/* priority pill */}
      <span style={{ fontSize:9, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', padding:'3px 10px', borderRadius:7, background:cfg.bg, color:cfg.color, flexShrink:0 }}>{cfg.label}</span>

      {/* pts */}
      <span style={{ fontSize:12, fontWeight:700, color:cfg.color, minWidth:34, textAlign:'right', fontFamily:'monospace', flexShrink:0 }}>+{cfg.pts}</span>

      {/* actions */}
      <div style={{ display:'flex', gap:5, opacity: hover?1:0, transition:'opacity .15s', flexShrink:0 }}>
        <button onClick={onEdit} style={{ width:28, height:28, borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border2)', color:'var(--muted)', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }}>✎</button>
        <button onClick={del} style={{
          width:28, height:28, borderRadius:8, cursor:'pointer', fontSize:13,
          background: confirmDel?'rgba(248,113,113,.15)':'var(--surface2)',
          border:`1px solid ${confirmDel?'var(--danger)':'var(--border2)'}`,
          color: confirmDel?'var(--danger)':'var(--muted)',
          display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s',
        }} title={confirmDel?'Click again to confirm delete':'Delete'}>
          {confirmDel ? '!' : '✕'}
        </button>
      </div>
    </div>
  )
}

// ─── TaskModal ────────────────────────────────────────────────────────────────
function TaskModal({ task, onClose, onSubmit }) {
  const isEdit = !!task
  const [f, setF] = useState({
    title:       task?.title       || '',
    description: task?.description || '',
    priority:    task?.priority    || 'MEDIUM',
    dueDate:     task?.dueDate     || '',
    status:      task?.status      || 'TODO',
  })
  const [err,     setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const iFocus = e => { e.target.style.borderColor = 'var(--accent)' }
  const iBlur  = e => { e.target.style.borderColor = 'var(--border2)' }

  const inp = { width:'100%', padding:'11px 13px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:10, color:'var(--text)', fontSize:13, outline:'none', fontFamily:'inherit', transition:'border-color .2s', display:'block' }

  async function submit(e) {
    e.preventDefault()
    if (!f.title.trim()) { setErr('Task title is required.'); return }
    setLoading(true); setErr('')
    try { await onSubmit(f) }
    catch { setErr('Something went wrong. Please try again.'); setLoading(false) }
  }

  return (
    <div className="anim-in"
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(6px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="anim-up"
        style={{ width:'100%', maxWidth:500, background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:20, overflow:'hidden', boxShadow:'0 24px 60px rgba(0,0,0,.6)' }}>

        {/* header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontSize:17, fontWeight:700, color:'var(--text)' }}>{isEdit ? '✎ Edit Task' : '+ New Task'}</h2>
            <p style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{isEdit ? 'Update task details' : 'Add a task to your board'}</p>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--muted)', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        {/* body */}
        <form onSubmit={submit} style={{ padding:22 }}>
          {err && <div style={{ background:'rgba(248,113,113,.08)', border:'1px solid rgba(248,113,113,.25)', borderRadius:9, padding:'10px 13px', fontSize:12, color:'var(--danger)', marginBottom:14 }}>⚠ {err}</div>}

          {/* title */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:9, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:7 }}>Task Title *</label>
            <input autoFocus style={inp} type="text" placeholder="e.g. Implement JWT refresh tokens"
              value={f.title} onChange={e => set('title', e.target.value)} onFocus={iFocus} onBlur={iBlur} />
          </div>

          {/* description */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:9, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:7 }}>Description</label>
            <textarea style={{ ...inp, resize:'vertical', lineHeight:1.6 }} rows={2} placeholder="What needs to be done? (optional)"
              value={f.description} onChange={e => set('description', e.target.value)} onFocus={iFocus} onBlur={iBlur} />
          </div>

          {/* priority */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:9, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:7 }}>Priority</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {Object.entries(PRI).map(([val, cfg]) => (
                <button key={val} type="button" onClick={() => set('priority', val)} style={{
                  padding:'11px 8px', borderRadius:10, cursor:'pointer', fontFamily:'inherit',
                  background: f.priority===val ? cfg.bg : 'var(--surface2)',
                  border:`1.5px solid ${f.priority===val ? cfg.color : 'var(--border)'}`,
                  color: f.priority===val ? cfg.color : 'var(--muted)',
                  fontSize:11, fontWeight:600, display:'flex', flexDirection:'column', alignItems:'center', gap:4, transition:'all .15s',
                }}>
                  <span style={{ fontSize:17 }}>{val==='HIGH'?'🔴':val==='MEDIUM'?'🟡':'🟢'}</span>
                  <span>{cfg.label}</span>
                  <span style={{ fontSize:10, opacity:.7 }}>+{cfg.pts} pts</span>
                </button>
              ))}
            </div>
          </div>

          {/* due + status row */}
          <div style={{ display:'grid', gridTemplateColumns: isEdit?'1fr 1fr':'1fr', gap:12, marginBottom:18 }}>
            <div>
              <label style={{ display:'block', fontSize:9, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:7 }}>Due Date</label>
              <input style={{ ...inp, colorScheme:'dark' }} type="date" value={f.dueDate}
                onChange={e => set('dueDate', e.target.value)} onFocus={iFocus} onBlur={iBlur} />
            </div>
            {isEdit && (
              <div>
                <label style={{ display:'block', fontSize:9, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:7 }}>Status</label>
                <select style={{ ...inp, cursor:'pointer' }} value={f.status} onChange={e => set('status', e.target.value)}>
                  <option value="TODO">📋 To Do</option>
                  <option value="DONE">✅ Done</option>
                </select>
              </div>
            )}
          </div>

          {/* footer */}
          <div style={{ display:'flex', gap:10, paddingTop:14, borderTop:'1px solid var(--border)' }}>
            <button type="button" onClick={onClose}
              style={{ flex:1, padding:12, borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--muted)', fontFamily:'inherit', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              style={{ flex:1, padding:12, borderRadius:10, border:'none', background: loading?'var(--surface3)':'var(--accent)', color:'var(--ink)', fontFamily:'inherit', fontSize:13, fontWeight:700, cursor: loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {loading ? <><Spinner /> Saving…</> : isEdit ? '✓ Save Changes' : '⚡ Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tasks,     setTasks]     = useState([])
  const [stats,     setStats]     = useState(null)
  const [filter,    setFilter]    = useState('ALL')
  const [priority,  setPriority]  = useState('ALL')
  const [search,    setSearch]    = useState('')
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTask,  setEditTask]  = useState(null)
  const [toast,     setToast]     = useState(null)
  const [sideOpen,  setSideOpen]  = useState(true)

  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // fetch
  const fetchAll = useCallback(async () => {
    try {
      const [tr, sr] = await Promise.all([
        taskAPI.getAll(),
        taskAPI.getStats().catch(() => ({ data: null })),
      ])
      setTasks(Array.isArray(tr.data) ? tr.data : [])
      setStats(sr.data)
    } catch (e) {
      console.error('fetch error', e)
      flash('error', '⚠ Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function flash(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  // CRUD
  async function handleCreate(data) {
    try { await taskAPI.create(data); setShowModal(false); fetchAll(); flash('success','⚡ Task created!') }
    catch { flash('error','Could not create task') }
  }
  async function handleUpdate(id, data) {
    try { await taskAPI.update(id, data); setEditTask(null); setShowModal(false); fetchAll(); flash('success','✓ Updated!') }
    catch { flash('error','Could not update task') }
  }
  async function handleToggle(id) {
    try { await taskAPI.toggle(id); fetchAll(); flash('success','✓ Status changed!') }
    catch { flash('error','Could not toggle status') }
  }
  async function handleDelete(id) {
    try { await taskAPI.remove(id); fetchAll(); flash('success','Task deleted') }
    catch { flash('error','Could not delete task') }
  }
  function handleLogout() { logout(); navigate('/login') }

  // filter
  const filtered = tasks.filter(t => {
    const ms = filter   === 'ALL' || t.status   === filter
    const mp = priority === 'ALL' || t.priority === priority
    const mq = !search  || (t.title?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()))
    return ms && mp && mq
  })

  const done    = tasks.filter(t => t.status   === 'DONE').length
  const pending = tasks.filter(t => t.status   === 'TODO').length
  const high    = tasks.filter(t => t.priority === 'HIGH').length
  const todayI  = todayIndex()

  const h = new Date().getHours()
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  const btn = (active, onClick, label, count) => (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
      background: active ? 'var(--accent)' : 'var(--surface2)',
      color:      active ? 'var(--ink)'    : 'var(--muted)',
      border:     active ? 'none'           : '1px solid var(--border)',
    }}>
      {label}
      {count !== undefined && (
        <span style={{ fontSize:10, padding:'1px 7px', borderRadius:6, background: active?'rgba(0,0,0,.15)':'var(--surface3)', color: active?'var(--ink)':'var(--muted)' }}>{count}</span>
      )}
    </button>
  )

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--ink)' }}>

      {/* ══ SIDEBAR ══ */}
      {sideOpen && (
        <aside className="anim-slide" style={{ width:224, flexShrink:0, background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

          {/* logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'18px 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'var(--ink)', flexShrink:0 }}>⚡</div>
            <span style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>TaskFlow</span>
            <span style={{ marginLeft:'auto', fontSize:9, fontWeight:700, letterSpacing:'1px', padding:'2px 8px', borderRadius:6, background:'rgba(110,231,183,.1)', color:'var(--accent)', border:'1px solid rgba(110,231,183,.2)' }}>PRO</span>
          </div>

          {/* nav */}
          <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto' }}>
            <p style={{ fontSize:9, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', padding:'0 8px', marginBottom:6, opacity:.5 }}>TASKS</p>
            {[
              { key:'ALL',  icon:'◈', label:'All Tasks', count: tasks.length },
              { key:'TODO', icon:'◉', label:'To Do',      count: pending },
              { key:'DONE', icon:'✓', label:'Completed',  count: done },
            ].map(item => (
              <button key={item.key} onClick={() => setFilter(item.key)} style={{
                width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:10,
                background: filter===item.key ? 'rgba(110,231,183,.08)' : 'transparent',
                color:      filter===item.key ? 'var(--accent)' : 'var(--muted)',
                border:     filter===item.key ? '1px solid rgba(110,231,183,.15)' : '1px solid transparent',
                cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:500, textAlign:'left', marginBottom:2, transition:'all .12s',
              }}>
                <span style={{ fontSize:14, width:18, textAlign:'center' }}>{item.icon}</span>
                <span style={{ flex:1 }}>{item.label}</span>
                <span style={{ fontSize:10, padding:'1px 7px', borderRadius:6, background:'var(--surface2)', color:'var(--muted)' }}>{item.count}</span>
              </button>
            ))}

            <p style={{ fontSize:9, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', padding:'0 8px', margin:'16px 0 6px', opacity:.5 }}>INSIGHTS</p>
            {[['◎','Productivity'],['⬡','Streaks'],['◷','Analytics']].map(([ic, lb], i) => (
              <button key={i} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:10, background:'transparent', border:'1px solid transparent', color:'var(--muted)', cursor:'pointer', fontFamily:'inherit', fontSize:13, textAlign:'left', marginBottom:2, transition:'background .12s' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <span style={{ fontSize:14, width:18, textAlign:'center' }}>{ic}</span>{lb}
              </button>
            ))}

            {/* week card */}
            <div style={{ margin:'16px 2px 0', padding:'14px 12px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:11, fontWeight:600, color:'var(--text)' }}>This Week</span>
                <span>🔥</span>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {WEEK.map((d, i) => (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                    <div style={{
                      width:'100%', aspectRatio:'1', borderRadius:5, fontSize:8, fontWeight:700,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      background: i===todayI ? 'var(--accent)' : i<todayI ? 'rgba(110,231,183,.2)' : 'var(--surface)',
                      color:      i===todayI ? 'var(--ink)'    : i<todayI ? 'var(--accent)'         : 'var(--muted)',
                    }}>{i<=todayI ? (i===todayI?'★':'✓') : ''}</div>
                    <span style={{ fontSize:7, color:'var(--muted)' }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </nav>

          {/* user */}
          <div style={{ padding:'13px 14px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,var(--accent),var(--accent3))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:'var(--ink)', flexShrink:0 }}>
                {(user?.username?.[0] || 'U').toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.username || 'User'}</p>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', boxShadow:'0 0 6px rgba(110,231,183,.6)' }} />
                  <span style={{ fontSize:10, color:'var(--muted)' }}>Active</span>
                </div>
              </div>
              <button onClick={handleLogout} title="Logout" style={{ width:30, height:30, borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--muted)', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>⏻</button>
            </div>
          </div>
        </aside>
      )}

      {/* ══ MAIN ══ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* topbar */}
        <header style={{ flexShrink:0, display:'flex', alignItems:'center', gap:12, padding:'13px 22px', background:'var(--surface)', borderBottom:'1px solid var(--border)' }}>
          <button onClick={() => setSideOpen(s => !s)} style={{ width:32, height:32, borderRadius:9, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--muted)', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>☰</button>

          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:15, fontWeight:700, color:'var(--text)', lineHeight:1 }}>
              {greet},{' '}<span style={{ color:'var(--accent)' }}>{user?.username || 'there'}</span>{' '}✦
            </h1>
            <p style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>
              {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
            </p>
          </div>

          {/* search */}
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--muted)', fontSize:15, pointerEvents:'none' }}>⌕</span>
            <input type="text" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft:34, paddingRight:14, paddingTop:8, paddingBottom:8, borderRadius:10, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:'inherit', fontSize:13, outline:'none', width:190, transition:'border-color .2s' }}
              onFocus={e => e.target.style.borderColor='var(--accent)'}
              onBlur={e => e.target.style.borderColor='var(--border)'} />
          </div>

          {/* priority dropdown */}
          <select value={priority} onChange={e => setPriority(e.target.value)}
            style={{ padding:'8px 11px', borderRadius:10, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--muted)', fontFamily:'inherit', fontSize:12, outline:'none', cursor:'pointer' }}>
            <option value="ALL">All Priority</option>
            <option value="HIGH">🔴 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">🟢 Low</option>
          </select>

          <button onClick={() => { setEditTask(null); setShowModal(true) }}
            style={{ padding:'9px 18px', borderRadius:10, border:'none', background:'var(--accent)', color:'var(--ink)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
            + New Task
          </button>
        </header>

        {/* content */}
        <div style={{ flex:1, overflowY:'auto', padding:22 }}>

          {/* stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
            <StatCard label="Completed"   value={stats?.totalCompleted ?? done}   sub={`${done} this session`}      color="var(--accent)"  icon="✓"  delay="d1" />
            <StatCard label="Focus Score" value={stats?.focusScore      ?? '—'}   sub="points earned"               color="var(--accent2)" icon="◎"  delay="d2" />
            <StatCard label="Day Streak"  value={stats?.streak          ?? 0}     sub="consecutive days"            color="var(--warn)"    icon="🔥" delay="d3" />
            <StatCard label="Pending"     value={pending}                          sub={`${high} high priority`}     color="var(--accent3)" icon="⏳" delay="d4" />
          </div>

          {/* filter tabs */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            {btn(filter==='ALL',  () => setFilter('ALL'),  'All Tasks', tasks.length)}
            {btn(filter==='TODO', () => setFilter('TODO'), 'To Do',     pending)}
            {btn(filter==='DONE', () => setFilter('DONE'), 'Completed', done)}
            <span style={{ marginLeft:'auto', fontSize:11, color:'var(--muted)' }}>{filtered.length} task{filtered.length!==1?'s':''}</span>
          </div>

          {/* tasks */}
          {loading ? (
            <div>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:70, marginBottom:8, animationDelay:`${i*.08}s` }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="anim-in" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'70px 0' }}>
              <div style={{ fontSize:50, marginBottom:14 }}>{search?'🔍':filter==='DONE'?'🎉':'📋'}</div>
              <p style={{ fontSize:16, fontWeight:600, color:'var(--text)', marginBottom:6 }}>
                {search ? 'No tasks match your search' : filter==='DONE' ? 'No completed tasks yet' : 'No tasks yet'}
              </p>
              <p style={{ fontSize:13, color:'var(--muted)', marginBottom:22 }}>
                {search ? 'Try a different keyword' : 'Click "+ New Task" to get started'}
              </p>
              {!search && (
                <button onClick={() => setShowModal(true)} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'var(--accent)', color:'var(--ink)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  + Create First Task
                </button>
              )}
            </div>
          ) : (
            <div>
              {filtered.map((task, i) => (
                <TaskRow key={task.id} task={task} idx={i}
                  onToggle={() => handleToggle(task.id)}
                  onEdit={()   => { setEditTask(task); setShowModal(true) }}
                  onDelete={()  => handleDelete(task.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* modal */}
      {showModal && (
        <TaskModal
          task={editTask}
          onClose={() => { setShowModal(false); setEditTask(null) }}
          onSubmit={editTask ? d => handleUpdate(editTask.id, d) : handleCreate}
        />
      )}

      {/* toast */}
      {toast && (
        <div className="anim-up" style={{
          position:'fixed', bottom:22, right:22, padding:'12px 18px', borderRadius:12, fontSize:13, fontWeight:600, zIndex:300,
          background: toast.type==='success' ? 'rgba(110,231,183,.1)' : 'rgba(248,113,113,.1)',
          border:`1px solid ${toast.type==='success' ? 'rgba(110,231,183,.3)' : 'rgba(248,113,113,.3)'}`,
          color: toast.type==='success' ? 'var(--accent)' : 'var(--danger)',
          backdropFilter:'blur(12px)', boxShadow:'0 8px 24px rgba(0,0,0,.35)',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}