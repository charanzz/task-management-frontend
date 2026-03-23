import React, { useEffect, useState } from 'react'
import api from '../services/api'
import TopicViewer from './TopicViewer'
import QuizModal from './QuizModal'

export default function ExamPathDetail({ pathId, onBack }) {
  const [path, setPath] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedPhase, setExpandedPhase] = useState(0)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [quizTopic, setQuizTopic] = useState(null)

  const load = () => {
    api.get(`/api/paths/${pathId}`)
      .then(r => setPath(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [pathId])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3].map(i => <div key={i} className="skel" style={{ height: 80 }} />)}
    </div>
  )
  if (!path) return <p style={{ color: 'var(--muted)' }}>Path not found.</p>

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      {/* Back + Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>←</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'Syne,sans-serif', margin: 0 }}>{path.title}</h2>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>{path.audience} · {path.language}</p>
        </div>
      </div>

      {/* Overall Progress Card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,var(--accent),var(--accent2))' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>OVERALL PROGRESS</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent2)', fontFamily: 'Syne,sans-serif', margin: 0 }}>{path.progressPercent}%</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Task {path.completedTopics} of {path.totalTasks}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{path.totalWeeks} weeks · {path.language}</p>
          </div>
        </div>
        <div style={{ height: 8, background: 'var(--surface3)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ height: '100%', width: `${path.progressPercent}%`, background: 'linear-gradient(90deg,var(--accent),var(--accent2))', borderRadius: 4, transition: 'width .5s ease', boxShadow: '0 0 8px var(--glow)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            ['✅', path.completedTopics, 'TASKS DONE'],
            ['🔥', path.currentStreak, 'STREAK'],
            ['⚡', path.totalXpEarned, 'XP EARNED'],
            ['🎯', `${path.overallAccuracy}%`, 'ACCURACY'],
          ].map(([icon, val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 20, margin: 0 }}>{icon}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent2)', fontFamily: 'Syne,sans-serif', margin: 0 }}>{val}</p>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', color: 'var(--muted)', margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Phases */}
      {path.phases?.map((phase, idx) => (
        <div key={phase.id} style={{ marginBottom: 12 }}>
          {/* Phase header */}
          <div
            onClick={() => setExpandedPhase(expandedPhase === idx ? -1 : idx)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: expandedPhase === idx ? '14px 14px 0 0' : 14, cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: phase.completedTopics === phase.totalTopics ? 'rgba(107,203,119,.15)' : 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              {phase.completedTopics === phase.totalTopics ? '✅' : phase.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{phase.title}</p>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: 'var(--surface2)', color: 'var(--muted)' }}>{phase.completedTopics}/{phase.totalTopics}</span>
              </div>
              <div style={{ height: 3, background: 'var(--surface3)', borderRadius: 3, overflow: 'hidden', marginTop: 6, maxWidth: 200 }}>
                <div style={{ height: '100%', width: `${phase.progressPercent}%`, background: 'linear-gradient(90deg,var(--accent),var(--accent2))', borderRadius: 3 }} />
              </div>
            </div>
            <span style={{ color: 'var(--muted)', fontSize: 16, transition: 'transform .2s', transform: expandedPhase === idx ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
          </div>

          {/* Topics list */}
          {expandedPhase === idx && (
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 14px 14px', overflow: 'hidden' }}>
              {phase.topics?.map((topic, tIdx) => (
                <TopicRow
                  key={topic.id}
                  topic={topic}
                  index={tIdx + 1}
                  isLast={tIdx === phase.topics.length - 1}
                  onOpen={() => setSelectedTopic(topic)}
                  onQuiz={() => setQuizTopic(topic)}
                  onComplete={async () => {
                    await api.post(`/api/paths/topics/${topic.id}/complete`)
                    load()
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Topic Viewer Modal */}
      {selectedTopic && (
        <TopicViewer
          topic={selectedTopic}
          onClose={() => setSelectedTopic(null)}
          onComplete={async () => {
            await api.post(`/api/paths/topics/${selectedTopic.id}/complete`)
            setSelectedTopic(null)
            load()
          }}
          onStartQuiz={() => {
            setQuizTopic(selectedTopic)
            setSelectedTopic(null)
          }}
        />
      )}

      {/* Quiz Modal */}
      {quizTopic && (
        <QuizModal
          topic={quizTopic}
          onClose={() => { setQuizTopic(null); load() }}
        />
      )}
    </div>
  )
}

function TopicRow({ topic, index, isLast, onOpen, onQuiz, onComplete }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: isLast ? 'none' : '1px solid var(--border)', transition: 'background .15s', cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Status circle */}
      <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: topic.completed ? 'var(--accent)' : 'var(--surface3)', border: `2px solid ${topic.completed ? 'var(--accent)' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: topic.completed ? '#fff' : 'var(--muted)' }}>
        {topic.completed ? '✓' : index}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }} onClick={onOpen}>
        <p style={{ fontSize: 13, fontWeight: topic.completed ? 400 : 600, color: topic.completed ? 'var(--muted)' : 'var(--text)', textDecoration: topic.completed ? 'line-through' : 'none', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {topic.title}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>⏱ {topic.estimatedMinutes}min</span>
          <span style={{ fontSize: 10, color: 'var(--accent3)' }}>+{topic.xpReward} XP</span>
          {topic.hasQuiz && (
            <span style={{ fontSize: 10, color: topic.quizAttempted ? 'var(--success)' : topic.quizSkipped ? 'var(--muted)' : 'var(--warn)' }}>
              {topic.quizAttempted ? `📝 ${topic.quizAccuracy}%` : topic.quizSkipped ? '⏭ Skipped' : '📝 Quiz'}
            </span>
          )}
          {topic.resourceUrl && <span style={{ fontSize: 10, color: 'var(--muted)' }}>{topic.resourceType === 'youtube' ? '▶ Video' : '📄 PDF'}</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {topic.hasQuiz && !topic.quizAttempted && !topic.quizSkipped && topic.completed && (
          <button onClick={e => { e.stopPropagation(); onQuiz() }} style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(255,217,61,.1)', border: '1px solid rgba(255,217,61,.25)', color: 'var(--warn)', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>📝 Quiz</button>
        )}
        {!topic.completed && (
          <button onClick={e => { e.stopPropagation(); onOpen() }} style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(124,58,237,.1)', border: '1px solid rgba(124,58,237,.25)', color: 'var(--accent3)', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Study →</button>
        )}
      </div>
    </div>
  )
}