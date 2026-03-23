import React, { useState } from 'react'

export default function TopicViewer({ topic, onClose, onComplete, onStartQuiz }) {
  const [completing, setCompleting] = useState(false)
  const [done, setDone] = useState(topic.completed)

  async function handleComplete() {
    if (done) return
    setCompleting(true)
    await onComplete()
    setDone(true)
    setCompleting(false)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(8px)', zIndex: 200, animation: 'fadeUp .15s ease' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="modal-box" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.8)', animation: 'modalIn .25s ease', display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg,rgba(124,58,237,.07),transparent)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(124,58,237,.15)', color: 'var(--accent3)', fontWeight: 700 }}>STUDY TOPIC</span>
                  <span style={{ fontSize: 10, color: 'var(--accent3)' }}>+{topic.xpReward} XP</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>⏱ {topic.estimatedMinutes} min</span>
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', fontFamily: 'Syne,sans-serif', margin: 0, lineHeight: 1.4 }}>{topic.title}</h2>
                {topic.description && <p style={{ fontSize: 12, color: 'var(--muted)', margin: '6px 0 0' }}>{topic.description}</p>}
              </div>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>✕</button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {/* Resource link */}
            {topic.resourceUrl && (
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{topic.resourceType === 'youtube' ? '▶️' : '📄'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                    {topic.resourceType === 'youtube' ? 'Watch Video Lesson' : 'Read PDF / Article'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>External resource</p>
                </div>
                <a href={topic.resourceUrl} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '7px 14px', borderRadius: 9, background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  Open →
                </a>
              </div>
            )}

            {/* Notes / content */}
            {topic.content ? (
              <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {topic.content}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Study Notes Coming Soon</p>
                <p style={{ fontSize: 13 }}>Use the resource link above or your own study materials for this topic.</p>
                <p style={{ fontSize: 12, marginTop: 8 }}>Once you've studied the topic, mark it as complete below.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0 }}>
            {topic.hasQuiz && !topic.quizAttempted && !topic.quizSkipped && (
              <button onClick={onStartQuiz} style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid rgba(255,217,61,.3)', background: 'rgba(255,217,61,.08)', color: 'var(--warn)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                📝 Take Quiz
              </button>
            )}
            <button
              onClick={handleComplete}
              disabled={done || completing}
              style={{
                flex: 2, padding: 12, borderRadius: 12, border: 'none', cursor: done ? 'default' : 'pointer',
                background: done ? 'rgba(107,203,119,.1)' : completing ? 'var(--surface3)' : 'linear-gradient(135deg,var(--accent),var(--accent2))',
                color: done ? 'var(--success)' : '#fff',
                fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans,sans-serif',
                boxShadow: done || completing ? 'none' : '0 4px 16px var(--glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {done ? '✅ Completed!' : completing ? '⏳ Saving...' : '✓ Mark as Complete'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}