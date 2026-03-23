import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function ExamPaths({ onPathSelect }) {
  const [paths, setPaths] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/paths')
      .then(r => setPaths(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleEnroll(e, pathId) {
    e.stopPropagation()
    await api.post(`/api/paths/${pathId}/enroll`)
    const r = await api.get('/api/paths')
    setPaths(Array.isArray(r.data) ? r.data : [])
  }

  const enrolled = paths.filter(p => p.enrolled)
  const available = paths.filter(p => !p.enrolled && !p.comingSoon)
  const coming = paths.filter(p => p.comingSoon)

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📚</div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', fontFamily: 'Syne,sans-serif', margin: 0 }}>Exam Paths</h2>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Follow the path. Complete every task. Crack your exam.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {[1, 2, 3].map(i => <div key={i} className="skel" style={{ height: 200 }} />)}
        </div>
      ) : (
        <>
          {/* Enrolled paths */}
          {enrolled.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>MY ENROLLED PATHS</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
                {enrolled.map(p => <PathCard key={p.id} path={p} onSelect={() => onPathSelect(p.id)} onEnroll={null} />)}
              </div>
            </div>
          )}

          {/* Available paths */}
          {available.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>AVAILABLE PATHS</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
                {available.map(p => <PathCard key={p.id} path={p} onSelect={() => onPathSelect(p.id)} onEnroll={e => handleEnroll(e, p.id)} />)}
              </div>
            </div>
          )}

          {/* Coming soon */}
          {coming.length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>COMING SOON</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
                {coming.map(p => <PathCard key={p.id} path={p} onSelect={null} onEnroll={null} comingSoon />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PathCard({ path, onSelect, onEnroll, comingSoon }) {
  return (
    <div
      onClick={onSelect && !comingSoon ? onSelect : undefined}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 18, padding: 22, cursor: onSelect ? 'pointer' : 'default',
        opacity: comingSoon ? 0.6 : 1, transition: 'all .2s', position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { if (onSelect) { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: comingSoon ? 'var(--muted)' : 'linear-gradient(90deg,var(--accent),var(--accent2))' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: comingSoon ? 'var(--surface2)' : 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
          {path.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'Syne,sans-serif', margin: 0 }}>{path.title}</h3>
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(124,58,237,.15)', color: 'var(--accent3)', fontWeight: 700 }}>{path.category}</span>
            {path.enrolled && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(107,203,119,.12)', color: 'var(--success)', fontWeight: 700 }}>✓ Enrolled</span>}
            {comingSoon && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'var(--surface3)', color: 'var(--muted)', fontWeight: 700 }}>Coming Soon</span>}
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>{path.description}</p>
        </div>
      </div>

      {/* Stats row */}
      {!comingSoon && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
          {[['📋', path.totalTasks, 'Tasks'], ['📅', path.totalWeeks, 'Weeks'], ['👥', path.audience?.split(',')[0], 'Audience']].map(([icon, val, label]) => (
            <div key={label}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{icon} {val}</p>
              <p style={{ fontSize: 10, color: 'var(--muted)', margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar (enrolled) */}
      {path.enrolled && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Task {path.completedTopics} of {path.totalTasks}</span>
            <span style={{ fontSize: 11, color: 'var(--accent2)', fontWeight: 700 }}>{path.progressPercent}%</span>
          </div>
          <div style={{ height: 5, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${path.progressPercent}%`, background: 'linear-gradient(90deg,var(--accent),var(--accent2))', borderRadius: 3, transition: 'width .4s ease' }} />
          </div>
        </div>
      )}

      {/* Enrolled stats */}
      {path.enrolled && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
          {[['🔥', path.currentStreak, 'Streak'], ['⚡', path.totalXpEarned, 'XP']].map(([icon, val, label]) => (
            <div key={label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>{icon}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{val}</p>
                <p style={{ fontSize: 10, color: 'var(--muted)', margin: 0 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action button */}
      {!comingSoon && (
        <button
          onClick={path.enrolled ? onSelect : onEnroll}
          style={{
            width: '100%', padding: '11px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: path.enrolled ? 'linear-gradient(135deg,var(--accent),var(--accent2))' : 'var(--surface2)',
            color: path.enrolled ? '#fff' : 'var(--accent2)',
            fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans,sans-serif',
            boxShadow: path.enrolled ? '0 4px 14px var(--glow)' : 'none',
          }}
        >
          {path.enrolled ? '▶ Continue Path' : '+ Enroll Now'}
        </button>
      )}
    </div>
  )
}