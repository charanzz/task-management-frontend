import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function QuizModal({ topic, onClose }) {
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.get(`/api/paths/topics/${topic.id}/quiz`)
      .then(r => {
        if (r.data && r.data.questions && r.data.questions.length > 0) {
          setQuiz(r.data)
        } else {
          setError('No questions available for this topic yet.')
        }
      })
      .catch(() => setError('Failed to load quiz. Please try again.'))
      .finally(() => setLoading(false))
  }, [topic.id])

  async function handleSkip() {
    await api.post(`/api/paths/topics/${topic.id}/quiz/skip`).catch(() => {})
    onClose()
  }

  async function handleSubmit() {
    const answeredKeys = Object.keys(answers)
    if (answeredKeys.length === 0) return
    setSubmitting(true)
    try {
      const payload = {
        answers: answeredKeys.map(qId => ({
          questionId: parseInt(qId),
          selectedOption: answers[qId],
        }))
      }
      const r = await api.post(`/api/paths/topics/${topic.id}/quiz/submit`, payload)
      setResult(r.data)
    } catch (e) {
      console.error('Quiz submit failed:', e)
      setError('Failed to submit quiz. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const OPTIONS = ['A', 'B', 'C', 'D']
  const optionText = (q, opt) => ({ A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD }[opt])
  const answered = Object.keys(answers).length

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(8px)', zIndex: 200 }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="modal-box" style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.8)', animation: 'modalIn .25s ease', display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg,rgba(255,217,61,.06),transparent)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28 }}>📝</div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'Syne,sans-serif', margin: 0 }}>Quiz — {topic.title}</h2>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
                  {quiz ? `${quiz.questions?.length} questions · Optional` : 'Loading...'}
                </p>
              </div>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map(i => <div key={i} className="skel" style={{ height: 100 }} />)}
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <p style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>Quiz Not Available</p>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>{error}</p>
              </div>
            ) : result ? (
              // Results view
              <div>
                <div style={{ textAlign: 'center', padding: '20px 0 24px', marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 52, marginBottom: 10 }}>
                    {result.accuracy >= 80 ? '🏆' : result.accuracy >= 60 ? '👍' : '📖'}
                  </div>
                  <p style={{ fontSize: 32, fontWeight: 800, color: result.accuracy >= 60 ? 'var(--success)' : 'var(--warn)', fontFamily: 'Syne,sans-serif', margin: 0 }}>{result.accuracy}%</p>
                  <p style={{ fontSize: 14, color: 'var(--muted)', margin: '4px 0 0' }}>{result.score} of {result.total} correct · +{result.xpEarned} XP</p>
                </div>
                {result.results?.map((r, i) => (
                  <div key={r.questionId} style={{ background: 'var(--surface2)', borderRadius: 12, padding: '14px 16px', marginBottom: 12, borderLeft: `3px solid ${r.correct ? 'var(--success)' : 'var(--danger)'}` }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>{i + 1}. {r.question}</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: r.explanation ? 6 : 0 }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: r.correct ? 'rgba(107,203,119,.15)' : 'rgba(255,107,107,.15)', color: r.correct ? 'var(--success)' : 'var(--danger)' }}>
                        Your answer: {r.selectedOption}
                      </span>
                      {!r.correct && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(107,203,119,.15)', color: 'var(--success)' }}>
                          Correct: {r.correctOption}
                        </span>
                      )}
                    </div>
                    {r.explanation && <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, fontStyle: 'italic' }}>{r.explanation}</p>}
                  </div>
                ))}
              </div>
            ) : (
              // Questions view
              quiz?.questions?.map((q, i) => (
                <div key={q.id} style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
                    <span style={{ color: 'var(--accent3)', marginRight: 6 }}>{i + 1}.</span>{q.question}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {OPTIONS.map(opt => {
                      const selected = answers[q.id] === opt
                      const text = optionText(q, opt)
                      if (!text) return null
                      return (
                        <button
                          key={opt}
                          onClick={() => setAnswers(p => ({ ...p, [q.id]: opt }))}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', background: selected ? 'rgba(124,58,237,.12)' : 'var(--surface2)', border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`, color: selected ? 'var(--accent3)' : 'var(--text)', transition: 'all .15s', fontFamily: 'DM Sans,sans-serif', width: '100%' }}
                        >
                          <span style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: selected ? 'var(--accent)' : 'var(--surface3)', color: selected ? '#fff' : 'var(--muted)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{opt}</span>
                          <span style={{ fontSize: 13 }}>{text}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {!result && !error && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0 }}>
              <button onClick={handleSkip} style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                ⏭ Skip
              </button>
              {!loading && (
                <button
                  onClick={handleSubmit}
                  disabled={answered === 0 || submitting}
                  style={{ flex: 2, padding: 12, borderRadius: 12, border: 'none', background: answered > 0 && !submitting ? 'linear-gradient(135deg,var(--accent),var(--accent2))' : 'var(--surface3)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: answered > 0 ? 'pointer' : 'not-allowed', opacity: answered > 0 ? 1 : 0.4, fontFamily: 'DM Sans,sans-serif', boxShadow: answered > 0 ? '0 4px 16px var(--glow)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  {submitting ? '⏳ Submitting...' : `Submit (${answered}/${quiz?.questions?.length ?? 0})`}
                </button>
              )}
            </div>
          )}
          {(result || error) && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <button onClick={onClose} style={{ width: '100%', padding: 12, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', boxShadow: '0 4px 16px var(--glow)' }}>
                ✓ Done
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}