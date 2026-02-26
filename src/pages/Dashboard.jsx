import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { taskAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

// ── Helpers ────────────────────────────────────────────────────────────────
const PRI = {
  HIGH:   { color:'#f87171', bg:'rgba(248,113,113,0.1)',  label:'High',   pts:30 },
  MEDIUM: { color:'#fbbf24', bg:'rgba(251,191,36,0.1)',   label:'Medium', pts:15 },
  LOW:    { color:'#6ee7b7', bg:'rgba(110,231,183,0.1)',  label:'Low',    pts:5  },
}

function formatDue(ds) {
  if (!ds) return null
  const diff = Math.ceil((new Date(ds) - new Date()) / 86400000)
  if (diff < 0)  return { text:`${-diff}d overdue`, late:true }
  if (diff === 0) return { text:'Due today',    late:false }
  if (diff === 1) return { text:'Due tomorrow', late:false }
  return { text:`In ${diff}d`, late:false }
}

// ── Sub-components (all inline, no external imports needed) ─────────────────

function StatCard({ label, value, sub, color, icon, delay }) {
  return (
    <div className={`anim-up ${delay}`} style={{
      background:'var(--surface)', border:'1px solid var(--border)',
      borderRadius:16, padding:'20px 22px', position:'relative', overflow:'hidden',
      borderTop:`2px solid ${color}`,
    }}>
      <div style={{ position:'absolute', top:12, right:14, fontSize:40, opacity:0.06, pointerEvents:'none' }}>{icon}</div>
      <p style={{ fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>{label}</p>
      <p style={{ fontSize:38, fontWeight:800, color, lineHeight:1, marginBottom:6 }}>{value}</p>
      <p style={{ fontSize:11, color:'var(--muted)' }}>{sub}</p>
    </div>
  )
}

function TaskRow({ task, onToggle, onEdit, onDelete, index }) {
  const [confirmDel, setConfirmDel] = useState(false)
  const [hovered,    setHovered]    = useState(false)
  const isDone = task.status === 'DONE'
  const cfg    = PRI[task.priority] || PRI.MEDIUM
  const due    = formatDue(task.dueDate || task.due)

  const del = () => {
    if (confirmDel) { onDelete(); setConfirmDel(false) }
    else { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 3000) }
  }

  return (
    <div
      className={`anim-up`}
      style={{
        display:'flex', alignItems:'center', gap:14,
        padding:'14px 16px', borderRadius:14,
        background: hovered ? 'var(--surface2)' : 'var(--surface)',
        border:`1px solid ${hovered ? 'var(--border2)' : 'var(--border)'}`,
        transition:'all 0.15s', cursor:'default',
        opacity: isDone ? 0.55 : 1,
        animationDelay:`${index * 0.04}s`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Priority bar */}
      <div style={{ width:3, height:44, borderRadius:4, background:cfg.color, flexShrink:0, boxShadow:`0 0 8px ${cfg.color}60` }}/>

      {/* Checkbox */}
      <button onClick={onToggle} style={{
        width:22, height:22, borderRadius:7, flexShrink:0,
        background: isDone ? 'var(--accent)' : 'var(--surface2)',
        border:`2px solid ${isDone ? 'var(--accent)' : 'var(--border2)'}`,
        color:'var(--ink)', fontSize:11, fontWeight:700,
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', transition:'all 0.15s',
      }}>{isDone && '✓'}</button>

      {/* Text */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontSize:14, fontWeight:500,
          color: isDone ? 'var(--muted)' : 'var(--text)',
          textDecoration: isDone ? 'line-through' : 'none',
          marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }}>{task.title}</div>
        {task.description && (
          <div style={{ fontSize:11, color:'var(--muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{task.description}</div>
        )}
      </div>

      {/* Due */}
      {due && (
        <span style={{ fontSize:11, color: due.late ? 'var(--danger)' : 'var(--muted)', flexShrink:0, whiteSpace:'nowrap' }}>
          {due.late ? '⚠ ' : '📅 '}{due.text}
        </span>
      )}

      {/* Priority pill */}
      <span style={{
        fontSize:10, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase',
        padding:'3px 10px', borderRadius:8,
        background:cfg.bg, color:cfg.color, flexShrink:0,
      }}>{cfg.label}</span>

      {/* Score */}
      <span style={{ fontSize:12, fontWeight:700, color:cfg.color, minWidth:36, textAlign:'right', fontFamily:"'Fira Code',monospace", flexShrink:0 }}>+{cfg.pts}</span>

      {/* Actions — show on hover */}
      <div style={{ display:'flex', gap:6, opacity: hovered ? 1 : 0, transition:'opacity 0.15s', flexShrink:0 }}>
        <button onClick={onEdit} style={{
          width:30, height:30, borderRadius:8, fontSize:12,
          background:'var(--surface2)', border:'1px solid var(--border2)',
          color:'var(--muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
        }}>✎</button>
        <button onClick={del} style={{
          width:30, height:30, borderRadius:8, fontSize:12,
          background: confirmDel ? 'rgba(248,113,113,0.15)' : 'var(--surface2)',
          border:`1px solid ${confirmDel ? 'var(--danger)' : 'var(--border2)'}`,
          color: confirmDel ? 'var(--danger)' : 'var(--muted)', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s',
        }} title={confirmDel ? 'Click again to confirm' : 'Delete'}>
          {confirmDel ? '!' : '✕'}
        </button>
      </div>
    </div>
  )
}

function TaskModal({ task, onClose, onSubmit }) {
  const isEdit = !!task
  const [form, setForm] = useState({
    title:       task?.title       || '',
    description: task?.description || '',
    priority:    task?.priority    || 'MEDIUM',
    dueDate:     task?.dueDate     || task?.due || '',
    status:      task?.status      || 'TODO',
  })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Task title is required.'); return }
    setLoading(true); setError('')
    try { await onSubmit(form) }
    catch { setError('Something went wrong. Please try again.'); setLoading(false) }
  }

  const inputStyle = {
    width:'100%', padding:'11px 14px',
    background:'var(--surface2)', border:'1px solid var(--border2)',
    borderRadius:10, color:'var(--text)', fontFamily:'inherit',
    fontSize:13, outline:'none', transition:'border-color 0.2s',
    display:'block',
  }

  return (
    <div className="anim-in" style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
      backdropFilter:'blur(6px)', zIndex:100,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="anim-up" style={{
        width:'100%', maxWidth:500, background:'var(--surface)',
        border:'1px solid var(--border2)', borderRadius:20,
        overflow:'hidden', boxShadow:'0 24px 60px rgba(0,0,0,0.55)',
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontSize:17, fontWeight:700, color:'var(--text)' }}>{isEdit ? '✎ Edit Task' : '+ New Task'}</h2>
            <p style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>{isEdit ? 'Update task details' : 'Add a task to your board'}</p>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--muted)', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        {/* Body */}
        <form onSubmit={submit} style={{ padding:24 }}>
          {error && (
            <div style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.25)', borderRadius:10, padding:'11px 14px', marginBottom:16, fontSize:12, color:'var(--danger)' }}>⚠ {error}</div>
          )}

          {/* Title */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:7 }}>Task Title *</label>
            <input autoFocus type="text" placeholder="e.g. Implement refresh tokens" value={form.title}
              onChange={e => set('title', e.target.value)} style={inputStyle}
              onFocus={e => e.target.style.borderColor='var(--accent)'}
              onBlur={e => e.target.style.borderColor='var(--border2)'} />
          </div>

          {/* Description */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:7 }}>Description</label>
            <textarea placeholder="What needs to be done? (optional)" value={form.description}
              onChange={e => set('description', e.target.value)} rows={2}
              style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }}
              onFocus={e => e.target.style.borderColor='var(--accent)'}
              onBlur={e => e.target.style.borderColor='var(--border2)'} />
          </div>

          {/* Priority */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:7 }}>Priority</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {Object.entries(PRI).map(([val, cfg]) => (
                <button key={val} type="button" onClick={() => set('priority', val)} style={{
                  padding:'12px 8px', borderRadius:10, cursor:'pointer',
                  background: form.priority === val ? cfg.bg : 'var(--surface2)',
                  border:`1.5px solid ${form.priority === val ? cfg.color : 'var(--border)'}`,
                  color: form.priority === val ? cfg.color : 'var(--muted)',
                  fontFamily:'inherit', fontSize:11, fontWeight:600,
                  display:'flex', flexDirection:'column', alignItems:'center', gap:4, transition:'all 0.15s',
                }}>
                  <span style={{ fontSize:18 }}>{val==='HIGH'?'🔴':val==='MEDIUM'?'🟡':'🟢'}</span>
                  <span>{cfg.label}</span>
                  <span style={{ fontSize:10, opacity:0.7 }}>+{cfg.pts} pts</span>
                </button>
              ))}
            </div>
          </div>

          {/* Due + Status */}
          <div style={{ display:'grid', gridTemplateColumns: isEdit ? '1fr 1fr' : '1fr', gap:12, marginBottom:20 }}>
            <div>
              <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:7 }}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
                style={{ ...inputStyle, colorScheme:'dark' }}
                onFocus={e => e.target.style.borderColor='var(--accent)'}
                onBlur={e => e.target.style.borderColor='var(--border2)'} />
            </div>
            {isEdit && (
              <div>
                <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', marginBottom:7 }}>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}
                  style={{ ...inputStyle, cursor:'pointer' }}>
                  <option value="TODO">📋 To Do</option>
                  <option value="DONE">✅ Done</option>
                </select>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display:'flex', gap:10, paddingTop:16, borderTop:'1px solid var(--border)' }}>
            <button type="button" onClick={onClose} style={{ flex:1, padding:12, borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--muted)', fontFamily:'inherit', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex:1, padding:12, borderRadius:10, border:'none', background: loading ? 'var(--surface3)' : 'var(--accent)', color:'var(--ink)', fontFamily:'inherit', fontSize:13, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', transition:'all 0.15s' }}>
              {loading
                ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <span style={{ width:14, height:14, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }}/>
                    Saving…
                  </span>
                : isEdit ? '✓ Save Changes' : '⚡ Create Task'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Dashboard Page ────────────────────────────────────────────────────
export default function DashboardPage() {
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

  const fetchAll = useCallback(async () => {
    try {
      const [tr, sr] = await Promise.all([
        taskAPI.getAll(),
        taskAPI.getStats().catch(() => ({ data: null })),
      ])
      setTasks(tr.data || [])
      setStats(sr.data)
    } catch { showToast('error', 'Failed to load tasks') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreate = async (data) => {
    try { await taskAPI.create(data); setShowModal(false); fetchAll(); showToast('success', '⚡ Task created!') }
    catch { showToast('error', 'Could not create task') }
  }

  const handleUpdate = async (id, data) => {
    try { await taskAPI.update(id, data); setEditTask(null); setShowModal(false); fetchAll(); showToast('success', '✓ Task updated!') }
    catch { showToast('error', 'Could not update task') }
  }

  const handleToggle = async (id) => {
    try { await taskAPI.toggle(id); fetchAll(); showToast('success', '✓ Status updated!') }
    catch { showToast('error', 'Could not update status') }
  }

  const handleDelete = async (id) => {
    try { await taskAPI.delete(id); fetchAll(); showToast('success', 'Task deleted') }
    catch { showToast('error', 'Could not delete task') }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  // Filtered tasks
  const filtered = tasks.filter(t => {
    const ms = filter   === 'ALL' || t.status   === filter
    const mp = priority === 'ALL' || t.priority === priority
    const mq = !search  || t.title?.toLowerCase().includes(search.toLowerCase())
                        || t.description?.toLowerCase().includes(search.toLowerCase())
    return ms && mp && mq
  })

  const done    = tasks.filter(t => t.status === 'DONE').length
  const pending = tasks.filter(t => t.status === 'TODO').length
  const high    = tasks.filter(t => t.priority === 'HIGH').length

  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const WEEK = ['M','T','W','T','F','S','S']
  const todayIdx = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })()

  const btnBase = { padding:'8px 16px', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s', border:'none' }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--ink)', fontFamily:"'Bricolage Grotesque',sans-serif" }}>

      {/* ══ SIDEBAR ══ */}
      {sideOpen && (
        <aside className="anim-slide" style={{ width:228, flexShrink:0, background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', height:'100%' }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'20px 18px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'var(--ink)', flexShrink:0 }}>⚡</div>
            <span style={{ fontSize:17, fontWeight:800, color:'var(--text)' }}>TaskFlow</span>
            <span style={{ marginLeft:'auto', fontSize:9, fontWeight:700, letterSpacing:'1px', padding:'2px 7px', borderRadius:6, background:'rgba(110,231,183,0.1)', color:'var(--accent)', border:'1px solid rgba(110,231,183,0.2)' }}>PRO</span>
          </div>

          {/* Nav */}
          <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto' }}>
            <p style={{ fontSize:9, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', padding:'0 8px', marginBottom:6, opacity:0.5 }}>Tasks</p>
            {[
              { key:'ALL',  icon:'◈', label:'All Tasks',  count: tasks.length },
              { key:'TODO', icon:'◉', label:'To Do',       count: pending },
              { key:'DONE', icon:'✓', label:'Completed',   count: done },
            ].map(item => (
              <button key={item.key} onClick={() => setFilter(item.key)} style={{
                width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:10,
                background: filter === item.key ? 'rgba(110,231,183,0.08)' : 'transparent',
                color:      filter === item.key ? 'var(--accent)' : 'var(--muted)',
                border:     filter === item.key ? '1px solid rgba(110,231,183,0.15)' : '1px solid transparent',
                cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:500,
                textAlign:'left', marginBottom:2, transition:'all 0.12s',
              }}>
                <span style={{ fontSize:14, width:18, textAlign:'center' }}>{item.icon}</span>
                <span style={{ flex:1 }}>{item.label}</span>
                <span style={{ fontSize:10, padding:'1px 7px', borderRadius:6, background:'var(--surface2)', color:'var(--muted)' }}>{item.count}</span>
              </button>
            ))}

            <p style={{ fontSize:9, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--muted)', padding:'0 8px', margin:'16px 0 6px', opacity:0.5 }}>Insights</p>
            {[['◎','Productivity'],['⬡','Streaks'],['◷','Analytics']].map(([ic,lb],i) => (
              <button key={i} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:10, background:'transparent', border:'1px solid transparent', color:'var(--muted)', cursor:'pointer', fontFamily:'inherit', fontSize:13, textAlign:'left', marginBottom:2 }}
                onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <span style={{ fontSize:14, width:18, textAlign:'center' }}>{ic}</span>{lb}
              </button>
            ))}

            {/* Week card */}
            <div style={{ margin:'16px 0 0', padding:'14px 12px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:11, fontWeight:600, color:'var(--text)' }}>This Week</span>
                <span>🔥</span>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {WEEK.map((d,i) => (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                    <div style={{
                      width:'100%', aspectRatio:'1', borderRadius:5,
                      background: i < todayIdx ? 'rgba(110,231,183,0.2)' : i === todayIdx ? 'var(--accent)' : 'var(--surface)',
                      color:      i === todayIdx ? 'var(--ink)' : i < todayIdx ? 'var(--accent)' : 'var(--muted)',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700,
                    }}>{i <= todayIdx ? (i === todayIdx ? '★' : '✓') : ''}</div>
                    <span style={{ fontSize:7, color:'var(--muted)' }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </nav>

          {/* User footer */}
          <div style={{ padding:'14px 14px', borderTop:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg, var(--accent), var(--accent3))', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:'var(--ink)', flexShrink:0 }}>
                {(user?.username?.[0] || 'U').toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.username || 'User'}</p>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                  <div className="pip-green" style={{ width:6, height:6, borderRadius:'50%' }}/>
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

        {/* Topbar */}
        <header style={{ flexShrink:0, display:'flex', alignItems:'center', gap:12, padding:'14px 24px', background:'var(--surface)', borderBottom:'1px solid var(--border)' }}>
          <button onClick={() => setSideOpen(!sideOpen)} style={{ width:32, height:32, borderRadius:9, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--muted)', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>☰</button>

          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:15, fontWeight:700, color:'var(--text)', lineHeight:1 }}>
              {greet}, <span style={{ color:'var(--accent)' }}>{user?.username || 'there'}</span> ✦
            </h1>
            <p style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>
              {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
            </p>
          </div>

          {/* Search */}
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--muted)', fontSize:14 }}>⌕</span>
            <input type="text" placeholder="Search tasks…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft:34, paddingRight:14, paddingTop:8, paddingBottom:8, borderRadius:10, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:'inherit', fontSize:13, outline:'none', width:200, transition:'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor='var(--accent)'}
              onBlur={e => e.target.style.borderColor='var(--border)'} />
          </div>

          {/* Priority filter */}
          <select value={priority} onChange={e => setPriority(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:10, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--muted)', fontFamily:'inherit', fontSize:12, outline:'none', cursor:'pointer' }}>
            <option value="ALL">All Priority</option>
            <option value="HIGH">🔴 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">🟢 Low</option>
          </select>

          <button onClick={() => { setEditTask(null); setShowModal(true) }}
            style={{ ...btnBase, background:'var(--accent)', color:'var(--ink)', padding:'9px 18px', fontSize:13 }}>
            + New Task
          </button>
        </header>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:24 }}>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
            <StatCard label="Completed"   value={stats?.totalCompleted ?? done}    sub={`${done} this session`}       color="var(--accent)"  icon="✓" delay="d1" />
            <StatCard label="Focus Score" value={stats?.focusScore      ?? '—'}    sub="points earned"                color="var(--accent2)" icon="◎" delay="d2" />
            <StatCard label="Day Streak"  value={stats?.streak          ?? 0}      sub="consecutive days"             color="var(--warn)"    icon="🔥" delay="d3" />
            <StatCard label="Pending"     value={pending}                           sub={`${high} high priority`}      color="var(--accent3)" icon="⏳" delay="d4" />
          </div>

          {/* Filter tabs */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            {[
              { key:'ALL',  label:'All Tasks',  count: tasks.length },
              { key:'TODO', label:'To Do',       count: pending },
              { key:'DONE', label:'Completed',   count: done },
            ].map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                ...btnBase,
                background: filter === tab.key ? 'var(--accent)' : 'var(--surface2)',
                color:      filter === tab.key ? 'var(--ink)'    : 'var(--muted)',
                border:     filter === tab.key ? 'none'           : '1px solid var(--border)',
                display:'flex', alignItems:'center', gap:7,
              }}>
                {tab.label}
                <span style={{ fontSize:10, padding:'1px 7px', borderRadius:6, background: filter === tab.key ? 'rgba(0,0,0,0.15)' : 'var(--surface3)', color: filter === tab.key ? 'var(--ink)' : 'var(--muted)' }}>{tab.count}</span>
              </button>
            ))}
            <span style={{ marginLeft:'auto', fontSize:11, color:'var(--muted)' }}>{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Task list */}
          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height:72, animationDelay:`${i*0.08}s` }}/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="anim-in" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 0' }}>
              <div style={{ fontSize:52, marginBottom:16 }}>{search ? '🔍' : filter === 'DONE' ? '🎉' : '📋'}</div>
              <p style={{ fontSize:16, fontWeight:600, color:'var(--text)', marginBottom:6 }}>
                {search ? 'No tasks match your search' : filter === 'DONE' ? 'No completed tasks yet' : 'No tasks yet'}
              </p>
              <p style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>
                {search ? 'Try a different keyword' : 'Create your first task to get started'}
              </p>
              {!search && (
                <button onClick={() => setShowModal(true)} style={{ ...btnBase, background:'var(--accent)', color:'var(--ink)', padding:'11px 24px', fontSize:14 }}>
                  + Create Task
                </button>
              )}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {filtered.map((task, i) => (
                <TaskRow
                  key={task.id} task={task} index={i}
                  onToggle={() => handleToggle(task.id)}
                  onEdit={()   => { setEditTask(task); setShowModal(true) }}
                  onDelete={()  => handleDelete(task.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <TaskModal
          task={editTask}
          onClose={() => { setShowModal(false); setEditTask(null) }}
          onSubmit={editTask ? data => handleUpdate(editTask.id, data) : handleCreate}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="anim-up" style={{
          position:'fixed', bottom:24, right:24,
          padding:'12px 18px', borderRadius:12, fontSize:13, fontWeight:600,
          background: toast.type === 'success' ? 'rgba(110,231,183,0.1)' : 'rgba(248,113,113,0.1)',
          border:`1px solid ${toast.type === 'success' ? 'rgba(110,231,183,0.3)' : 'rgba(248,113,113,0.3)'}`,
          color: toast.type === 'success' ? 'var(--accent)' : 'var(--danger)',
          backdropFilter:'blur(12px)', zIndex:200,
          boxShadow:'0 8px 24px rgba(0,0,0,0.3)',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}