import React, { useState } from 'react'

export default function ExamPathsLocked() {
  const [email, setEmail]   = useState('')
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleNotify(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const waitlist = JSON.parse(localStorage.getItem('tf_waitlist') || '[]')
      waitlist.push({ email: email.trim(), ts: Date.now() })
      localStorage.setItem('tf_waitlist', JSON.stringify(waitlist))
      await new Promise(r => setTimeout(r, 800))
      setJoined(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ animation: 'fadeUp .4s ease', maxWidth: 600, margin: '0 auto' }}>
      {/* Hero card */}
      <div style={{ borderRadius: 24, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #1a0533 0%, #0f172a 50%, #1a0533 100%)', border: '1px solid rgba(124,58,237,.3)', boxShadow: '0 0 80px rgba(124,58,237,.15)', marginBottom: 20 }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,.3), transparent)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,.2), transparent)', pointerEvents: 'none' }}/>
        <div style={{ padding: '48px 40px', position: 'relative', zIndex: 1 }}>
          {/* Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(245,158,11,.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,.3)', letterSpacing: '1px', textTransform: 'uppercase' }}>🔒 Coming Soon</div>
            <div style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(124,58,237,.15)', color: '#a855f7', border: '1px solid rgba(124,58,237,.3)' }}>Premium Feature</div>
          </div>

          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#f0f0f8', fontFamily: 'Syne, sans-serif', marginBottom: 12, lineHeight: 1.2 }}>📚 Exam Paths</h1>
          <p style={{ fontSize: 16, color: 'rgba(240,240,248,.6)', marginBottom: 32, lineHeight: 1.6, maxWidth: 440 }}>
            Structured 24-week learning roadmaps with topic-by-topic guidance, MCQ quizzes, and progress tracking — built for serious exam aspirants.
          </p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
            {[['📋','132','Topics'],['🏛️','3','Phases'],['📝','MCQ','Quizzes']].map(([icon,val,label])=>(
              <div key={label} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#a855f7', fontFamily: 'Syne, sans-serif' }}>{val}</div>
                <div style={{ fontSize: 11, color: 'rgba(240,240,248,.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Paths preview */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(240,240,248,.3)', marginBottom: 12 }}>LAUNCHING WITH</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { icon:'🏛️', name:'TNPSC Group 4', status:'Ready', color:'#10b981' },
                { icon:'🏅', name:'UPSC Civil Services', status:'Soon', color:'#f59e0b' },
                { icon:'📊', name:'CAT MBA', status:'Soon', color:'#f59e0b' },
                { icon:'🏛️', name:'TNPSC Group 2', status:'Soon', color:'#f59e0b' },
              ].map(p=>(
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
                  <span style={{ fontSize: 16 }}>{p.icon}</span>
                  <span style={{ fontSize: 12, color: 'rgba(240,240,248,.7)', fontWeight: 500 }}>{p.name}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: p.status==='Ready'?'rgba(16,185,129,.15)':'rgba(245,158,11,.15)', color: p.color, textTransform: 'uppercase' }}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Waitlist */}
          {!joined ? (
            <form onSubmit={handleNotify}>
              <p style={{ fontSize: 13, color: 'rgba(240,240,248,.5)', marginBottom: 12 }}>Get notified when Exam Paths launches:</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#f0f0f8', fontSize: 13, outline: 'none', fontFamily: 'DM Sans, sans-serif' }}/>
                <button type="submit" disabled={loading || !email} style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,.4)', whiteSpace: 'nowrap', opacity: email ? 1 : 0.5 }}>
                  {loading ? '...' : '🔔 Notify Me'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>✅</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#6bcb77', margin: 0 }}>You're on the list!</p>
                <p style={{ fontSize: 12, color: 'rgba(240,240,248,.5)', margin: 0 }}>We'll notify you at {email} when Exam Paths launches.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          ['🗺️','Structured Roadmap','Day-by-day study plan across 24 weeks'],
          ['📝','Topic-wise MCQs','Practice questions after every topic'],
          ['📊','Progress Analytics','Track accuracy, XP earned, and streaks'],
          ['🏆','XP & Gamification','Earn points and compete on leaderboard'],
        ].map(([icon,title,desc])=>(
          <div key={title} style={{ padding: '18px 20px', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>{title}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}