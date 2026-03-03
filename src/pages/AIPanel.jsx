import React, { useState } from 'react'
import api from '../services/api'

const css = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  .ai-btn:hover { opacity:.85; transform:translateY(-1px); }
`

function Spinner({ size=14 }) {
  return <span style={{width:size,height:size,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite',flexShrink:0}}/>
}

function Section({ title, emoji, children }) {
  return (
    <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:16,overflow:'hidden',marginBottom:14}}>
      <div style={{padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,.06)',background:'linear-gradient(135deg,rgba(124,58,237,.08),transparent)',display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:18}}>{emoji}</span>
        <h3 style={{fontSize:14,fontWeight:700,color:'#f0f0f8',fontFamily:'Syne, sans-serif',margin:0}}>{title}</h3>
      </div>
      <div style={{padding:18}}>{children}</div>
    </div>
  )
}

function AIResult({ content }) {
  if (!content) return null
  const lines = content.split('\n').filter(Boolean)
  return (
    <div style={{marginTop:14,background:'rgba(124,58,237,.06)',border:'1px solid rgba(124,58,237,.15)',borderRadius:12,padding:16,animation:'fadeUp .3s ease'}}>
      {lines.map((line, i) => {
        const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f0f0f8">$1</strong>')
        return <p key={i} style={{fontSize:13,color:'#c0c0d8',lineHeight:1.7,margin:'0 0 6px'}} dangerouslySetInnerHTML={{__html:bold}}/>
      })}
    </div>
  )
}

export default function AIPanel({ onTaskParsed }) {
  // Priority suggester
  const [priTitle, setPriTitle] = useState('')
  const [priDesc,  setPriDesc]  = useState('')
  const [priResult, setPriResult] = useState(null)
  const [priLoading, setPriLoading] = useState(false)

  // Natural language
  const [nlInput, setNlInput] = useState('')
  const [nlResult, setNlResult] = useState(null)
  const [nlLoading, setNlLoading] = useState(false)

  // Daily digest
  const [digestResult, setDigestResult] = useState('')
  const [digestLoading, setDigestLoading] = useState(false)
  const [digestEmailLoading, setDigestEmailLoading] = useState(false)

  // Weekly coach
  const [coachResult, setCoachResult] = useState('')
  const [coachLoading, setCoachLoading] = useState(false)
  const [coachEmailLoading, setCoachEmailLoading] = useState(false)

  const [toast, setToast] = useState(null)

  function flash(msg, type='success') {
    setToast({msg, type})
    setTimeout(() => setToast(null), 3000)
  }

  const inp = {
    width:'100%', padding:'10px 13px',
    background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)',
    borderRadius:10, color:'#f0f0f8', fontSize:13, outline:'none',
    transition:'border-color .2s',
  }

  const btn = (color='#7c3aed') => ({
    padding:'10px 18px', borderRadius:10, border:'none',
    background:`linear-gradient(135deg,${color},${color}cc)`,
    color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer',
    display:'flex', alignItems:'center', gap:7, transition:'all .15s',
  })

  // 1. Suggest Priority
  async function handleSuggestPriority() {
    if (!priTitle.trim()) return
    setPriLoading(true); setPriResult(null)
    try {
      const res = await api.post('/api/ai/suggest-priority', { title: priTitle, description: priDesc })
      setPriResult(res.data)
    } catch { flash('AI request failed', 'error') }
    finally { setPriLoading(false) }
  }

  // 2. Parse Natural Language
  async function handleParseTask() {
    if (!nlInput.trim()) return
    setNlLoading(true); setNlResult(null)
    try {
      const res = await api.post('/api/ai/parse-task', { input: nlInput })
      setNlResult(res.data)
    } catch { flash('AI request failed', 'error') }
    finally { setNlLoading(false) }
  }

  // 3. Daily Digest
  async function handleGetDigest() {
    setDigestLoading(true); setDigestResult('')
    try {
      const res = await api.get('/api/ai/daily-digest')
      setDigestResult(res.data.digest)
    } catch { flash('Could not generate digest', 'error') }
    finally { setDigestLoading(false) }
  }

  async function handleSendDigest() {
    setDigestEmailLoading(true)
    try {
      await api.post('/api/ai/send-daily-digest')
      flash('✉️ Daily digest sent to your email!')
    } catch { flash('Could not send email', 'error') }
    finally { setDigestEmailLoading(false) }
  }

  // 4. Weekly Coach
  async function handleGetCoach() {
    setCoachLoading(true); setCoachResult('')
    try {
      const res = await api.get('/api/ai/weekly-coach')
      setCoachResult(res.data.tips)
    } catch { flash('Could not generate coaching tips', 'error') }
    finally { setCoachLoading(false) }
  }

  async function handleSendCoach() {
    setCoachEmailLoading(true)
    try {
      await api.post('/api/ai/send-weekly-coach')
      flash('🧠 Weekly coach sent to your email!')
    } catch { flash('Could not send email', 'error') }
    finally { setCoachEmailLoading(false) }
  }

  const PRI_COLORS = { HIGH:'#ff6b6b', MEDIUM:'#ffd93d', LOW:'#6bcb77' }

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:680,margin:'0 auto'}}>

        {/* Header */}
        <div style={{marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,#7c3aed,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,boxShadow:'0 4px 14px rgba(124,58,237,.4)'}}>🤖</div>
          <div>
            <h2 style={{fontSize:18,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne, sans-serif',margin:0}}>AI Assistant</h2>
            <p style={{fontSize:12,color:'#6b6b8a',margin:0}}>Powered by Claude AI</p>
          </div>
        </div>

        {/* 1. Smart Priority */}
        <Section emoji="🎯" title="Smart Priority Suggestion">
          <p style={{fontSize:12,color:'#6b6b8a',marginBottom:12}}>Let AI analyze your task and suggest the right priority level.</p>
          <input style={{...inp,marginBottom:9}} placeholder="Task title e.g. Fix payment bug on checkout page"
            value={priTitle} onChange={e=>setPriTitle(e.target.value)}
            onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}
          />
          <input style={{...inp,marginBottom:12}} placeholder="Description (optional)"
            value={priDesc} onChange={e=>setPriDesc(e.target.value)}
            onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}
          />
          <button className="ai-btn" onClick={handleSuggestPriority} disabled={priLoading||!priTitle.trim()} style={{...btn(),opacity:!priTitle.trim()?.5:1}}>
            {priLoading ? <><Spinner/> Analyzing…</> : '🎯 Suggest Priority'}
          </button>
          {priResult && (
            <div style={{marginTop:14,padding:'14px 16px',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,display:'flex',alignItems:'center',gap:14,animation:'fadeUp .3s ease'}}>
              <div style={{padding:'6px 16px',borderRadius:20,background:`${PRI_COLORS[priResult.priority]}18`,border:`1px solid ${PRI_COLORS[priResult.priority]}40`,color:PRI_COLORS[priResult.priority],fontSize:13,fontWeight:700,whiteSpace:'nowrap'}}>
                {priResult.priority}
              </div>
              <p style={{fontSize:13,color:'#a0a0b8',margin:0,lineHeight:1.5}}>{priResult.reason}</p>
            </div>
          )}
        </Section>

        {/* 2. Natural Language */}
        <Section emoji="💬" title="Natural Language Task Creation">
          <p style={{fontSize:12,color:'#6b6b8a',marginBottom:12}}>Describe your task naturally — AI will parse it into a structured task.</p>
          <input style={{...inp,marginBottom:12}} placeholder='e.g. "Call the client tomorrow at 3pm about the project proposal"'
            value={nlInput} onChange={e=>setNlInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleParseTask()}
            onFocus={e=>e.target.style.borderColor='#7c3aed'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}
          />
          <button className="ai-btn" onClick={handleParseTask} disabled={nlLoading||!nlInput.trim()} style={{...btn('#0ea5e9'),opacity:!nlInput.trim()?.5:1}}>
            {nlLoading ? <><Spinner/> Parsing…</> : '✨ Parse Task'}
          </button>
          {nlResult && (
            <div style={{marginTop:14,background:'rgba(14,165,233,.05)',border:'1px solid rgba(14,165,233,.2)',borderRadius:12,padding:16,animation:'fadeUp .3s ease'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                <div>
                  <p style={{fontSize:10,fontWeight:600,letterSpacing:'1.5px',textTransform:'uppercase',color:'#6b6b8a',margin:'0 0 4px'}}>Title</p>
                  <p style={{fontSize:14,fontWeight:600,color:'#f0f0f8',margin:0}}>{nlResult.title}</p>
                </div>
                <div>
                  <p style={{fontSize:10,fontWeight:600,letterSpacing:'1.5px',textTransform:'uppercase',color:'#6b6b8a',margin:'0 0 4px'}}>Priority</p>
                  <span style={{padding:'3px 12px',borderRadius:20,background:`${PRI_COLORS[nlResult.priority]}18`,color:PRI_COLORS[nlResult.priority],fontSize:12,fontWeight:700}}>{nlResult.priority}</span>
                </div>
                {nlResult.dueDate && (
                  <div>
                    <p style={{fontSize:10,fontWeight:600,letterSpacing:'1.5px',textTransform:'uppercase',color:'#6b6b8a',margin:'0 0 4px'}}>Due Date</p>
                    <p style={{fontSize:13,color:'#ffd93d',margin:0}}>{new Date(nlResult.dueDate).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</p>
                  </div>
                )}
                {nlResult.description && (
                  <div>
                    <p style={{fontSize:10,fontWeight:600,letterSpacing:'1.5px',textTransform:'uppercase',color:'#6b6b8a',margin:'0 0 4px'}}>Notes</p>
                    <p style={{fontSize:13,color:'#a0a0b8',margin:0}}>{nlResult.description}</p>
                  </div>
                )}
              </div>
              <button className="ai-btn" onClick={()=>{onTaskParsed&&onTaskParsed(nlResult);setNlInput('');setNlResult(null);flash('Task ready to create!')}} style={{...btn('#6bcb77'),fontSize:12,padding:'8px 14px'}}>
                ✓ Use This Task
              </button>
            </div>
          )}
        </Section>

        {/* 3. Daily Digest */}
        <Section emoji="☀️" title="Daily Digest">
          <p style={{fontSize:12,color:'#6b6b8a',marginBottom:12}}>Get a personalized AI summary of your productivity and what to focus on today.</p>
          <div style={{display:'flex',gap:9,flexWrap:'wrap'}}>
            <button className="ai-btn" onClick={handleGetDigest} disabled={digestLoading} style={btn('#f59e0b')}>
              {digestLoading ? <><Spinner/> Generating…</> : '☀️ Generate Digest'}
            </button>
            <button className="ai-btn" onClick={handleSendDigest} disabled={digestEmailLoading} style={{...btn('#6b7280'),fontSize:13}}>
              {digestEmailLoading ? <><Spinner/> Sending…</> : '📧 Send to Email'}
            </button>
          </div>
          {digestResult && <AIResult content={digestResult}/>}
        </Section>

        {/* 4. Weekly Coach */}
        <Section emoji="🧠" title="Weekly Productivity Coach">
          <p style={{fontSize:12,color:'#6b6b8a',marginBottom:12}}>Get personalized coaching tips based on your productivity patterns this week.</p>
          <div style={{display:'flex',gap:9,flexWrap:'wrap'}}>
            <button className="ai-btn" onClick={handleGetCoach} disabled={coachLoading} style={btn('#a855f7')}>
              {coachLoading ? <><Spinner/> Thinking…</> : '🧠 Get Coaching Tips'}
            </button>
            <button className="ai-btn" onClick={handleSendCoach} disabled={coachEmailLoading} style={{...btn('#6b7280'),fontSize:13}}>
              {coachEmailLoading ? <><Spinner/> Sending…</> : '📧 Send to Email'}
            </button>
          </div>
          {coachResult && <AIResult content={coachResult}/>}
        </Section>

      </div>

      {/* Toast */}
      {toast && (
        <div style={{position:'fixed',bottom:22,right:22,padding:'13px 20px',borderRadius:12,fontSize:13,fontWeight:600,zIndex:999,background:toast.type==='success'?'rgba(107,203,119,.1)':'rgba(255,107,107,.1)',border:`1px solid ${toast.type==='success'?'rgba(107,203,119,.3)':'rgba(255,107,107,.3)'}`,color:toast.type==='success'?'#6bcb77':'#ff6b6b',backdropFilter:'blur(12px)',boxShadow:'0 8px 30px rgba(0,0,0,.4)',animation:'fadeUp .3s ease'}}>
          {toast.msg}
        </div>
      )}
    </>
  )
}