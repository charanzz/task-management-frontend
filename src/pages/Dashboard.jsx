import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { taskAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const PRI = {
  HIGH:   { color:'#f87171', bg:'rgba(248,113,113,0.10)', label:'High',   pts:30 },
  MEDIUM: { color:'#fbbf24', bg:'rgba(251,191,36,0.10)',  label:'Medium', pts:15 },
  LOW:    { color:'#6ee7b7', bg:'rgba(110,231,183,0.10)', label:'Low',    pts:5  },
}

// Simple StatCard component
function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background:'var(--surface)',
      border:'1px solid var(--border)',
      borderRadius:12,
      padding:16
    }}>
      <p style={{ fontSize:12, color:'var(--muted)' }}>{label}</p>
      <h2 style={{ color }}>{value}</h2>
      <p style={{ fontSize:11, color:'var(--muted)' }}>{sub}</p>
    </div>
  )
}

export default function Dashboard() {

  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [toast, setToast] = useState(null)

  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Fetch tasks + stats
  const fetchAll = useCallback(async () => {
    try {
      const [taskRes, statsRes] = await Promise.all([
        taskAPI.getAll(),
        taskAPI.getStats().catch(() => ({ data: null }))
      ])

      setTasks(Array.isArray(taskRes.data) ? taskRes.data : [])
      setStats(statsRes.data)

    } catch (e) {
      console.error(e)
      flash('error', 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  function flash(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleCreate(data) {
    try {
      await taskAPI.create(data)
      setShowModal(false)
      fetchAll()
      flash('success', 'Task created!')
    } catch {
      flash('error', 'Could not create task')
    }
  }

  async function handleUpdate(id, data) {
    try {
      await taskAPI.update(id, data)
      setEditTask(null)
      setShowModal(false)
      fetchAll()
      flash('success', 'Task updated!')
    } catch {
      flash('error', 'Could not update task')
    }
  }

  async function handleToggle(id) {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE'

    try {
      await taskAPI.update(id, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        status: newStatus,
      })

      fetchAll()
      flash('success', 'Status updated!')
    } catch {
      flash('error', 'Could not update status')
    }
  }

  async function handleDelete(id) {
    try {
      await taskAPI.remove(id)
      fetchAll()
      flash('success', 'Task deleted')
    } catch {
      flash('error', 'Could not delete task')
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const done = tasks.filter(t => t.status === 'DONE').length
  const pending = tasks.filter(t => t.status === 'TODO').length
  const high = tasks.filter(t => t.priority === 'HIGH').length

  return (
    <div style={{ padding: 30 }}>

      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h2>
            Welcome, <span style={{ color:'var(--accent)' }}>{user?.name || 'User'}</span>
          </h2>
          <p>{tasks.length} total tasks</p>
        </div>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {/* STATS GRID */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <StatCard
          label="Completed"
          value={stats?.completedTasks ?? done}
          sub={`${tasks.length} total tasks`}
          color="var(--accent)"
        />
        <StatCard
          label="Focus Score"
          value={stats?.focusScore ?? '—'}
          sub="points earned"
          color="var(--accent2)"
        />
        <StatCard
          label="Day Streak"
          value={stats?.streak ?? 0}
          sub="consecutive days"
          color="var(--warn)"
        />
        <StatCard
          label="Pending"
          value={pending}
          sub={`${high} high priority`}
          color="var(--accent3)"
        />
      </div>

      {/* NEW TASK BUTTON */}
      <button onClick={() => { setEditTask(null); setShowModal(true) }}>
        + New Task
      </button>

      {/* TASK LIST */}
      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks yet</p>
      ) : (
        <div style={{ marginTop:20 }}>
          {tasks.map(task => (
            <div key={task.id} style={{
              border:'1px solid #ddd',
              padding:12,
              marginBottom:8,
              display:'flex',
              justifyContent:'space-between'
            }}>
              <div>
                <strong>{task.title}</strong>
                <p>{task.description}</p>
                <small>Status: {task.status}</small>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => handleToggle(task.id)}>Toggle</button>
                <button onClick={() => { setEditTask(task); setShowModal(true) }}>Edit</button>
                <button onClick={() => handleDelete(task.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{
          position:'fixed',
          bottom:20,
          right:20,
          padding:10,
          background: toast.type === 'success' ? 'green' : 'red',
          color:'#fff'
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}