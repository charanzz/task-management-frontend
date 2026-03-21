import React, { useState, useEffect } from 'react'
import api from '../services/api'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
  @keyframes pop{0%{transform:scale(.8);opacity:0}70%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(124,58,237,.3)}50%{box-shadow:0 0 40px rgba(124,58,237,.6)}}
  .path-card:hover{transform:translateY(-3px)!important;box-shadow:0 20px 60px rgba(0,0,0,.4)!important}
  .task-row:hover{background:rgba(124,58,237,.06)!important}
  .phase-btn:hover{opacity:.85!important}
  .mcq-option:hover{border-color:rgba(124,58,237,.5)!important;background:rgba(124,58,237,.06)!important}
  .mcq-option{transition:all .15s!important}
  .back-btn:hover{background:rgba(255,255,255,.08)!important}
  .continue-btn:hover{transform:translateY(-1px)!important;box-shadow:0 8px 28px rgba(124,58,237,.5)!important}
`

function Spinner() {
  return <span style={{width:20,height:20,border:'2px solid rgba(124,58,237,.3)',borderTopColor:'#a855f7',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/>
}

// ─── SCREEN 1: Path Selection ─────────────────────────────────────
function PathSelection({ onEnroll, trialDaysLeft, isPro }) {
  const [paths, setPaths] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(null)

  useEffect(() => {
    api.get('/api/paths').then(r => {
      setPaths(r.data.paths || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleEnroll(pathId) {
    setEnrolling(pathId)
    try {
      await api.post(`/api/paths/${pathId}/enroll`)
      onEnroll(pathId)
    } catch(e) {
      alert('Failed to enroll. Please try again.')
    }
    setEnrolling(null)
  }

  const hasAccess = isPro || trialDaysLeft > 0

  return (
    <div style={{maxWidth:800,margin:'0 auto',animation:'fadeUp .4s ease'}}>

      {/* Header */}
      <div style={{marginBottom:28}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
          <div style={{width:44,height:44,borderRadius:14,background:'linear-gradient(135deg,#7c3aed,#a855f7)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,
            boxShadow:'0 6px 20px rgba(124,58,237,.4)'}}>🗺️</div>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:'var(--text)',margin:0}}>Exam Paths</h1>
            <p style={{fontSize:12,color:'var(--muted)',margin:0}}>
              Follow the path. Complete every task. Crack your exam.
            </p>
          </div>
        </div>

        {/* Trial banner */}
        {!isPro && (
          <div style={{padding:'12px 16px',borderRadius:12,marginTop:16,
            background: trialDaysLeft > 0
              ? 'linear-gradient(135deg,rgba(255,217,61,.08),rgba(255,165,0,.05))'
              : 'linear-gradient(135deg,rgba(255,107,107,.08),rgba(255,0,0,.05))',
            border: `1px solid ${trialDaysLeft > 0 ? 'rgba(255,217,61,.3)' : 'rgba(255,107,107,.3)'}`,
            display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
            <div>
              <p style={{fontSize:13,fontWeight:700,
                color: trialDaysLeft > 0 ? '#ffd93d' : '#ff6b6b',margin:'0 0 2px'}}>
                {trialDaysLeft > 0
                  ? `🎁 Free Trial — ${trialDaysLeft} day${trialDaysLeft!==1?'s':''} remaining`
                  : '⚠️ Trial ended — Upgrade to continue'}
              </p>
              <p style={{fontSize:11,color:'var(--muted)',margin:0}}>
                {trialDaysLeft > 0
                  ? 'Full access to all exam paths during trial'
                  : 'Upgrade to Pro at ₹30/month to continue your path'}
              </p>
            </div>
            {trialDaysLeft <= 0 && (
              <button style={{padding:'8px 16px',borderRadius:10,border:'none',cursor:'pointer',
                background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',
                fontSize:12,fontWeight:700}}>
                Upgrade ₹30/mo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Path Cards */}
      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:60}}><Spinner/></div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {paths.map((path, i) => (
            <div key={path.id} className="path-card"
              style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:20,
                overflow:'hidden',transition:'all .25s',animation:`fadeUp .4s ease ${i*.1}s both`,
                cursor:'pointer',boxShadow:'0 4px 20px rgba(0,0,0,.2)'}}>

              {/* Banner */}
              <div style={{height:6,background:path.bannerColor||'linear-gradient(135deg,#7c3aed,#a855f7)'}}/>

              <div style={{padding:'20px 22px'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:16}}>

                  {/* Icon */}
                  <div style={{width:54,height:54,borderRadius:16,flexShrink:0,
                    background:path.bannerColor||'linear-gradient(135deg,#7c3aed,#a855f7)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:26,boxShadow:'0 6px 20px rgba(124,58,237,.35)'}}>
                    {path.icon}
                  </div>

                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                      <h2 style={{fontSize:18,fontWeight:800,color:'var(--text)',margin:0}}>
                        {path.title}
                      </h2>
                      <span style={{fontSize:10,padding:'2px 8px',borderRadius:6,fontWeight:700,
                        background:'rgba(124,58,237,.12)',color:'#a855f7',
                        border:'1px solid rgba(124,58,237,.2)'}}>
                        {path.examBody}
                      </span>
                      {path.enrolled && (
                        <span style={{fontSize:10,padding:'2px 8px',borderRadius:6,fontWeight:700,
                          background:'rgba(16,185,129,.1)',color:'#10b981',
                          border:'1px solid rgba(16,185,129,.2)'}}>
                          ✓ Enrolled
                        </span>
                      )}
                    </div>
                    <p style={{fontSize:12,color:'var(--muted)',margin:'0 0 12px',lineHeight:1.5}}>
                      {path.description}
                    </p>

                    {/* Stats row */}
                    <div style={{display:'flex',gap:16,marginBottom:12,flexWrap:'wrap'}}>
                      {[
                        {label:'Tasks',value:path.totalTasks},
                        {label:'Weeks',value:path.totalWeeks},
                        {label:'Audience',value:path.targetAudience},
                        {label:'Language',value:path.language},
                      ].map((s,i) => (
                        <div key={i}>
                          <p style={{fontSize:10,color:'var(--muted)',margin:'0 0 1px',textTransform:'uppercase',letterSpacing:'1px'}}>{s.label}</p>
                          <p style={{fontSize:12,fontWeight:700,color:'var(--text)',margin:0}}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Progress if enrolled */}
                    {path.enrolled && (
                      <div style={{marginBottom:14}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                          <span style={{fontSize:11,color:'var(--muted)'}}>
                            Task {path.tasksCompleted} of {path.totalTasks}
                          </span>
                          <span style={{fontSize:11,fontWeight:700,color:'#a855f7'}}>
                            {path.progressPercent}%
                          </span>
                        </div>
                        <div style={{height:6,borderRadius:6,background:'rgba(255,255,255,.06)',overflow:'hidden'}}>
                          <div style={{height:'100%',borderRadius:6,
                            background:'linear-gradient(90deg,#7c3aed,#a855f7)',
                            width:`${path.progressPercent}%`,transition:'width .5s'}}/>
                        </div>
                      </div>
                    )}

                    {/* Action button */}
                    {hasAccess ? (
                      <button className="continue-btn"
                        onClick={() => path.enrolled ? onEnroll(path.id) : handleEnroll(path.id)}
                        disabled={enrolling === path.id}
                        style={{padding:'10px 22px',borderRadius:11,border:'none',cursor:'pointer',
                          background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',
                          fontSize:13,fontWeight:700,transition:'all .2s',
                          boxShadow:'0 4px 16px rgba(124,58,237,.4)',
                          display:'flex',alignItems:'center',gap:8}}>
                        {enrolling === path.id ? <Spinner/> :
                          path.enrolled ? '▶ Continue Path' : '🚀 Start Path'}
                      </button>
                    ) : (
                      <button style={{padding:'10px 22px',borderRadius:11,border:'none',cursor:'pointer',
                        background:'rgba(255,255,255,.06)',color:'var(--muted)',
                        fontSize:13,fontWeight:700}}>
                        🔒 Upgrade to Access
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Coming Soon */}
          {[
            {title:'UPSC Civil Services',icon:'🏅',desc:'2-year roadmap for IAS/IPS preparation',tag:'Coming Soon'},
            {title:'CAT MBA',icon:'📊',desc:'6-month path for IIM admission',tag:'Coming Soon'},
            {title:'HSC Class 12',icon:'🎓',desc:'Tamil Nadu board complete preparation',tag:'Coming Soon'},
            {title:'Semester Exams',icon:'📝',desc:'Custom path for your college subjects',tag:'Coming Soon'},
          ].map((p,i) => (
            <div key={i} style={{background:'var(--surface)',border:'1px solid var(--border)',
              borderRadius:20,padding:'18px 22px',opacity:.5,
              animation:`fadeUp .4s ease ${(paths.length+i)*.08}s both`}}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:46,height:46,borderRadius:14,background:'rgba(255,255,255,.06)',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>
                  {p.icon}
                </div>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <p style={{fontSize:15,fontWeight:700,color:'var(--text)',margin:0}}>{p.title}</p>
                    <span style={{fontSize:9,padding:'2px 7px',borderRadius:5,
                      background:'rgba(255,255,255,.07)',color:'var(--muted)',fontWeight:700}}>
                      {p.tag}
                    </span>
                  </div>
                  <p style={{fontSize:12,color:'var(--muted)',margin:0}}>{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SCREEN 2: Roadmap View ───────────────────────────────────────
function RoadmapView({ pathId, onBack, onSelectTask }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedPhase, setExpandedPhase] = useState(1)

  useEffect(() => {
    api.get(`/api/paths/${pathId}/roadmap`).then(r => {
      setData(r.data)
      setExpandedPhase(r.data.phases?.find(p =>
        p.tasks?.some(t => t.current))?.phaseNumber || 1)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [pathId])

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:80}}><Spinner/></div>
  if (!data) return null

  const { path, phases, currentTask, tasksCompleted, progressPercent } = data

  return (
    <div style={{maxWidth:760,margin:'0 auto',animation:'fadeUp .4s ease'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <button className="back-btn" onClick={onBack}
          style={{width:36,height:36,borderRadius:10,background:'rgba(255,255,255,.06)',
            border:'1px solid var(--border)',color:'var(--muted)',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,transition:'background .15s'}}>
          ←
        </button>
        <div style={{flex:1}}>
          <h1 style={{fontSize:20,fontWeight:800,color:'var(--text)',margin:'0 0 2px'}}>
            🏛️ {path.title}
          </h1>
          <p style={{fontSize:12,color:'var(--muted)',margin:0}}>
            Task {tasksCompleted} of {path.totalTasks} completed · Week {data.currentWeek || 1} of {path.totalWeeks}
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',
        borderRadius:16,padding:'16px 20px',marginBottom:20}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
          <span style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>Overall Progress</span>
          <span style={{fontSize:13,fontWeight:800,color:'#a855f7'}}>{progressPercent}%</span>
        </div>
        <div style={{height:10,borderRadius:8,background:'rgba(255,255,255,.06)',overflow:'hidden',marginBottom:12}}>
          <div style={{height:'100%',borderRadius:8,
            background:'linear-gradient(90deg,#7c3aed,#a855f7,#ec4899)',
            width:`${progressPercent}%`,transition:'width .6s ease'}}/>
        </div>
        <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
          {[
            {label:'Tasks Done',value:tasksCompleted,color:'#10b981'},
            {label:'Streak',value:`${data.pathStreakDays||0} days`,color:'#f59e0b'},
            {label:'XP Earned',value:data.totalXpEarned||0,color:'#a855f7'},
            {label:'Accuracy',value:`${data.overallAccuracy||0}%`,color:'#60a5fa'},
          ].map((s,i) => (
            <div key={i}>
              <p style={{fontSize:10,color:'var(--muted)',margin:'0 0 1px',textTransform:'uppercase',letterSpacing:'1px'}}>{s.label}</p>
              <p style={{fontSize:16,fontWeight:800,color:s.color,margin:0,fontFamily:'monospace'}}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weak Subjects Alert */}
      {data.weakSubjects && (
        <div style={{padding:'12px 16px',borderRadius:12,marginBottom:16,
          background:'rgba(255,107,107,.06)',border:'1px solid rgba(255,107,107,.2)'}}>
          <p style={{fontSize:12,fontWeight:700,color:'#ff6b6b',margin:'0 0 2px'}}>
            ⚠️ Needs Extra Attention
          </p>
          <p style={{fontSize:11,color:'var(--muted)',margin:0}}>
            {data.weakSubjects.split(',').join(' · ')} — scored below 60% in these subjects
          </p>
        </div>
      )}

      {/* Phases */}
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {phases.map((phase) => {
          const isExpanded = expandedPhase === phase.phaseNumber
          const phaseProgress = phase.totalTasks > 0
            ? Math.round((phase.tasksCompleted / phase.totalTasks) * 100) : 0
          const isCurrentPhase = phase.tasks?.some(t => t.current)

          return (
            <div key={phase.id} style={{background:'var(--surface)',
              border:`1px solid ${isCurrentPhase ? 'rgba(124,58,237,.3)' : 'var(--border)'}`,
              borderRadius:16,overflow:'hidden',
              boxShadow: isCurrentPhase ? '0 0 20px rgba(124,58,237,.1)' : 'none'}}>

              {/* Phase Header */}
              <button className="phase-btn" onClick={() => setExpandedPhase(isExpanded ? 0 : phase.phaseNumber)}
                style={{width:'100%',padding:'16px 18px',background:'none',border:'none',
                  cursor:'pointer',display:'flex',alignItems:'center',gap:12,transition:'opacity .15s'}}>
                <div style={{width:38,height:38,borderRadius:12,flexShrink:0,
                  background:`${phase.color}18`,border:`1px solid ${phase.color}33`,
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
                  {phase.icon}
                </div>
                <div style={{flex:1,textAlign:'left'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                    <p style={{fontSize:14,fontWeight:700,color:'var(--text)',margin:0}}>
                      Phase {phase.phaseNumber}: {phase.title}
                    </p>
                    {isCurrentPhase && (
                      <span style={{fontSize:9,padding:'2px 6px',borderRadius:5,
                        background:'rgba(124,58,237,.15)',color:'#a855f7',fontWeight:700}}>
                        CURRENT
                      </span>
                    )}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{flex:1,height:4,borderRadius:4,background:'rgba(255,255,255,.06)',overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:4,background:phase.color,
                        width:`${phaseProgress}%`,transition:'width .5s'}}/>
                    </div>
                    <span style={{fontSize:10,color:'var(--muted)',flexShrink:0}}>
                      {phase.tasksCompleted}/{phase.totalTasks}
                    </span>
                  </div>
                </div>
                <span style={{color:'var(--muted)',fontSize:12,
                  transform:isExpanded?'rotate(180deg)':'none',transition:'transform .2s'}}>▼</span>
              </button>

              {/* Phase Tasks */}
              {isExpanded && (
                <div style={{borderTop:'1px solid var(--border)'}}>
                  <div style={{padding:'8px 0',maxHeight:400,overflowY:'auto'}}>
                    {phase.tasks?.map((task) => (
                      <div key={task.id} className="task-row"
                        onClick={() => !task.locked && onSelectTask(task.id)}
                        style={{display:'flex',alignItems:'center',gap:12,
                          padding:'11px 18px',cursor:task.locked?'default':'pointer',
                          transition:'background .15s',
                          opacity:task.locked?0.4:1}}>

                        {/* Status indicator */}
                        <div style={{width:28,height:28,borderRadius:9,flexShrink:0,
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:12,fontWeight:700,
                          background: task.completed ? 'rgba(16,185,129,.15)'
                            : task.current ? 'rgba(124,58,237,.15)'
                            : 'rgba(255,255,255,.04)',
                          border: `1px solid ${task.completed ? 'rgba(16,185,129,.3)'
                            : task.current ? 'rgba(124,58,237,.3)'
                            : 'rgba(255,255,255,.08)'}`,
                          color: task.completed ? '#10b981'
                            : task.current ? '#a855f7' : 'var(--muted)'}}>
                          {task.completed ? '✓' : task.locked ? '🔒' : task.taskNumber}
                        </div>

                        {/* Task info */}
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontSize:13,fontWeight:task.current?700:600,
                            color:task.current?'#a855f7':'var(--text)',
                            margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {task.icon} {task.topic}
                          </p>
                          <p style={{fontSize:10,color:'var(--muted)',margin:0}}>
                            {task.subject} · Week {task.weekNumber} · ~{task.estimatedMinutes}min · {task.totalQuestions} MCQs
                          </p>
                        </div>

                        {/* Right side */}
                        <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                          <span style={{fontSize:9,padding:'2px 6px',borderRadius:5,fontWeight:700,
                            background: task.difficulty==='EASY' ? 'rgba(16,185,129,.1)'
                              : task.difficulty==='MEDIUM' ? 'rgba(245,158,11,.1)'
                              : 'rgba(239,68,68,.1)',
                            color: task.difficulty==='EASY' ? '#10b981'
                              : task.difficulty==='MEDIUM' ? '#f59e0b' : '#ef4444'}}>
                            {task.difficulty}
                          </span>
                          {task.current && (
                            <span style={{fontSize:11,color:'#a855f7'}}>▶</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── SCREEN 3: Task + MCQ View ────────────────────────────────────
function TaskView({ taskId, onBack, onTaskComplete }) {
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState('detail') // detail | mcq | result
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    api.get(`/api/paths/tasks/${taskId}`).then(r => {
      setTask(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [taskId])

  function handleOptionSelect(option) {
    if (answers[task.questions[currentQ].id]) return // already answered
    const qId = task.questions[currentQ].id
    setSelected(option)
    setAnswers(prev => ({...prev, [qId]: option}))
  }

  function nextQuestion() {
    setSelected(null)
    if (currentQ < task.questions.length - 1) {
      setCurrentQ(q => q + 1)
    } else {
      submitTask()
    }
  }

  async function submitTask() {
    setSubmitting(true)
    const timeTaken = Math.round((Date.now() - startTime) / 60000)
    try {
      const r = await api.post(`/api/paths/tasks/${taskId}/submit`, {
        answers: Object.fromEntries(
          Object.entries(answers).map(([k,v]) => [k, v])
        ),
        timeTaken
      })
      setResult(r.data)
      setScreen('result')
    } catch(e) {
      alert('Submission failed. Please try again.')
    }
    setSubmitting(false)
  }

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:80}}><Spinner/></div>
  if (!task) return null

  // ── Task Detail Screen ──
  if (screen === 'detail') return (
    <div style={{maxWidth:680,margin:'0 auto',animation:'fadeUp .4s ease'}}>

      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <button className="back-btn" onClick={onBack}
          style={{width:36,height:36,borderRadius:10,background:'rgba(255,255,255,.06)',
            border:'1px solid var(--border)',color:'var(--muted)',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,transition:'background .15s'}}>
          ←
        </button>
        <div>
          <p style={{fontSize:11,color:'var(--muted)',margin:'0 0 2px',textTransform:'uppercase',letterSpacing:'1px'}}>
            Task {task.taskNumber} · Week {task.weekNumber} · Phase {task.phaseNumber}
          </p>
          <h1 style={{fontSize:20,fontWeight:800,color:'var(--text)',margin:0}}>
            {task.icon} {task.topic}
          </h1>
        </div>
      </div>

      {/* Already completed notice */}
      {task.alreadyCompleted && (
        <div style={{padding:'12px 16px',borderRadius:12,marginBottom:16,
          background:'rgba(16,185,129,.06)',border:'1px solid rgba(16,185,129,.2)'}}>
          <p style={{fontSize:12,fontWeight:700,color:'#10b981',margin:'0 0 2px'}}>
            ✓ Task Already Completed
          </p>
          <p style={{fontSize:11,color:'var(--muted)',margin:0}}>
            Previous score: {task.previousScore}% · You can attempt again to improve
          </p>
        </div>
      )}

      {/* Subject badge */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {[
          {label:task.subject,color:'#a855f7'},
          {label:task.taskType,color:'#60a5fa'},
          {label:task.difficulty,color:task.difficulty==='EASY'?'#10b981':task.difficulty==='MEDIUM'?'#f59e0b':'#ef4444'},
          {label:`${task.weightagePercent}% weightage`,color:'#f97316'},
        ].map((b,i) => (
          <span key={i} style={{fontSize:10,padding:'3px 10px',borderRadius:20,fontWeight:700,
            background:`${b.color}15`,color:b.color,border:`1px solid ${b.color}25`}}>
            {b.label}
          </span>
        ))}
      </div>

      {/* Instruction Card */}
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',
        borderRadius:16,padding:'18px 20px',marginBottom:14}}>
        <p style={{fontSize:11,color:'var(--muted)',margin:'0 0 8px',fontWeight:700,
          textTransform:'uppercase',letterSpacing:'1px'}}>📋 What To Do Today</p>
        <p style={{fontSize:14,color:'var(--text)',margin:0,lineHeight:1.7}}>
          {task.instruction}
        </p>
      </div>

      {/* Resource Card */}
      <div style={{background:'rgba(96,165,250,.06)',border:'1px solid rgba(96,165,250,.2)',
        borderRadius:16,padding:'16px 20px',marginBottom:14}}>
        <p style={{fontSize:11,color:'#60a5fa',margin:'0 0 8px',fontWeight:700,
          textTransform:'uppercase',letterSpacing:'1px'}}>📚 Resource</p>
        <p style={{fontSize:13,color:'var(--text)',margin:'0 0 6px',fontWeight:600}}>
          {task.resource}
        </p>
        {task.resourceUrl && (
          <a href={task.resourceUrl} target="_blank" rel="noreferrer"
            style={{fontSize:12,color:'#60a5fa',textDecoration:'none'}}>
            🔗 Open Resource →
          </a>
        )}
      </div>

      {/* Time estimate */}
      <div style={{display:'flex',gap:12,marginBottom:22}}>
        <div style={{flex:1,padding:'12px 14px',borderRadius:12,
          background:'rgba(255,255,255,.03)',border:'1px solid var(--border)',textAlign:'center'}}>
          <p style={{fontSize:11,color:'var(--muted)',margin:'0 0 2px'}}>Estimated Time</p>
          <p style={{fontSize:16,fontWeight:800,color:'var(--text)',margin:0}}>~{task.estimatedMinutes} min</p>
        </div>
        <div style={{flex:1,padding:'12px 14px',borderRadius:12,
          background:'rgba(255,255,255,.03)',border:'1px solid var(--border)',textAlign:'center'}}>
          <p style={{fontSize:11,color:'var(--muted)',margin:'0 0 2px'}}>MCQ Practice</p>
          <p style={{fontSize:16,fontWeight:800,color:'#a855f7',margin:0}}>{task.totalQuestions} Questions</p>
        </div>
      </div>

      {/* Start MCQs button */}
      {task.questions?.length > 0 && (
        <button className="continue-btn" onClick={() => setScreen('mcq')}
          style={{width:'100%',padding:'15px',borderRadius:14,border:'none',cursor:'pointer',
            background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',
            fontSize:15,fontWeight:700,boxShadow:'0 6px 24px rgba(124,58,237,.4)',
            transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
          ✏️ Start MCQ Practice — {task.totalQuestions} Questions
        </button>
      )}
    </div>
  )

  // ── MCQ Screen ──
  if (screen === 'mcq') {
    const q = task.questions[currentQ]
    const answeredQ = answers[q.id]
    const progress = ((currentQ + 1) / task.questions.length) * 100

    return (
      <div style={{maxWidth:640,margin:'0 auto',animation:'fadeUp .3s ease'}}>

        {/* MCQ Header */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
          <button className="back-btn" onClick={() => setScreen('detail')}
            style={{width:34,height:34,borderRadius:9,background:'rgba(255,255,255,.06)',
              border:'1px solid var(--border)',color:'var(--muted)',cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',transition:'background .15s'}}>
            ←
          </button>
          <div style={{flex:1}}>
            <p style={{fontSize:12,color:'var(--muted)',margin:'0 0 4px'}}>
              {task.topic} · Question {currentQ+1} of {task.questions.length}
            </p>
            <div style={{height:4,borderRadius:4,background:'rgba(255,255,255,.06)',overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:4,
                background:'linear-gradient(90deg,#7c3aed,#a855f7)',
                width:`${progress}%`,transition:'width .3s'}}/>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div style={{background:'var(--surface)',border:'1px solid var(--border)',
          borderRadius:18,padding:'22px 24px',marginBottom:16,animation:'pop .3s ease'}}>
          <p style={{fontSize:15,color:'var(--text)',margin:0,lineHeight:1.7,fontWeight:500}}>
            {q.questionText}
          </p>
        </div>

        {/* Options */}
        <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
          {['A','B','C','D'].map(opt => {
            const optText = q[`option${opt}`]
            if (!optText) return null

            let bgColor = 'var(--surface)'
            let borderColor = 'var(--border)'
            let textColor = 'var(--text)'

            if (answeredQ) {
              if (opt === answeredQ && opt === (result?.results?.[currentQ]?.correctOption)) {
                bgColor = 'rgba(16,185,129,.08)'
                borderColor = 'rgba(16,185,129,.4)'
                textColor = '#10b981'
              } else if (opt === answeredQ) {
                bgColor = 'rgba(239,68,68,.08)'
                borderColor = 'rgba(239,68,68,.4)'
                textColor = '#ef4444'
              }
            }
            if (opt === selected && !answeredQ) {
              bgColor = 'rgba(124,58,237,.08)'
              borderColor = 'rgba(124,58,237,.4)'
              textColor = '#a855f7'
            }

            return (
              <button key={opt} className="mcq-option"
                onClick={() => handleOptionSelect(opt)}
                disabled={!!answeredQ}
                style={{width:'100%',padding:'13px 16px',borderRadius:12,cursor:answeredQ?'default':'pointer',
                  background:bgColor,border:`1.5px solid ${borderColor}`,color:textColor,
                  fontSize:13,fontWeight:500,textAlign:'left',display:'flex',alignItems:'center',gap:12}}>
                <span style={{width:28,height:28,borderRadius:8,flexShrink:0,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  background:`${borderColor}20`,fontWeight:700,fontSize:12}}>
                  {opt}
                </span>
                {optText}
              </button>
            )
          })}
        </div>

        {/* Next button — shows after answering */}
        {answeredQ && (
          <button className="continue-btn" onClick={nextQuestion} disabled={submitting}
            style={{width:'100%',padding:'14px',borderRadius:12,border:'none',cursor:'pointer',
              background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',
              fontSize:14,fontWeight:700,boxShadow:'0 4px 16px rgba(124,58,237,.4)',
              transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            {submitting ? <Spinner/> :
              currentQ < task.questions.length - 1 ? 'Next Question →' : '✓ Submit & See Results'}
          </button>
        )}
      </div>
    )
  }

  // ── Result Screen ──
  if (screen === 'result' && result) return (
    <div style={{maxWidth:640,margin:'0 auto',animation:'pop .4s ease'}}>

      {/* Score Card */}
      <div style={{background:'var(--surface)',border:`2px solid ${result.scorePercent>=60?'rgba(16,185,129,.3)':'rgba(239,68,68,.3)'}`,
        borderRadius:20,padding:'28px 24px',textAlign:'center',marginBottom:20,
        boxShadow:`0 0 40px ${result.scorePercent>=60?'rgba(16,185,129,.1)':'rgba(239,68,68,.1)'}`}}>

        <div style={{fontSize:56,marginBottom:12,animation:'pop .5s ease'}}>
          {result.scorePercent >= 80 ? '🏆' : result.scorePercent >= 60 ? '✅' : '📚'}
        </div>

        <p style={{fontSize:42,fontWeight:800,color:result.scorePercent>=60?'#10b981':'#ef4444',
          margin:'0 0 4px',fontFamily:'monospace'}}>
          {result.scorePercent}%
        </p>
        <p style={{fontSize:16,fontWeight:600,color:'var(--text)',margin:'0 0 4px'}}>
          {result.correctAnswers} / {result.totalQuestions} correct
        </p>
        <p style={{fontSize:13,color:'var(--muted)',margin:'0 0 20px'}}>
          {result.needsRevision
            ? '📖 Score below 60% — revisit this topic before moving on'
            : '🎯 Great work! Moving to next task.'}
        </p>

        {/* Stats */}
        <div style={{display:'flex',gap:12,justifyContent:'center'}}>
          <div style={{padding:'12px 20px',borderRadius:12,
            background:'rgba(168,85,247,.08)',border:'1px solid rgba(168,85,247,.2)'}}>
            <p style={{fontSize:20,fontWeight:800,color:'#a855f7',margin:'0 0 2px'}}>+{result.xpEarned}</p>
            <p style={{fontSize:10,color:'var(--muted)',margin:0}}>XP EARNED</p>
          </div>
          {result.pathComplete ? (
            <div style={{padding:'12px 20px',borderRadius:12,
              background:'rgba(255,217,61,.08)',border:'1px solid rgba(255,217,61,.2)'}}>
              <p style={{fontSize:20,fontWeight:800,color:'#ffd93d',margin:'0 0 2px'}}>🏆</p>
              <p style={{fontSize:10,color:'var(--muted)',margin:0}}>PATH COMPLETE!</p>
            </div>
          ) : (
            <div style={{padding:'12px 20px',borderRadius:12,
              background:'rgba(96,165,250,.08)',border:'1px solid rgba(96,165,250,.2)'}}>
              <p style={{fontSize:13,fontWeight:700,color:'#60a5fa',margin:'0 0 2px'}}>
                Task {result.nextTaskNumber}
              </p>
              <p style={{fontSize:10,color:'var(--muted)',margin:0}}>NEXT UP</p>
            </div>
          )}
        </div>
      </div>

      {/* Answer Review */}
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',
        borderRadius:16,overflow:'hidden',marginBottom:16}}>
        <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)'}}>
          <p style={{fontSize:13,fontWeight:700,color:'var(--text)',margin:0}}>Answer Review</p>
        </div>
        <div style={{maxHeight:360,overflowY:'auto'}}>
          {result.results?.map((r, i) => (
            <div key={i} style={{padding:'14px 18px',
              borderBottom:'1px solid rgba(255,255,255,.04)',
              background:r.isCorrect?'rgba(16,185,129,.03)':'rgba(239,68,68,.03)'}}>
              <p style={{fontSize:12,fontWeight:600,color:'var(--text)',margin:'0 0 8px',lineHeight:1.5}}>
                {i+1}. {r.questionText}
              </p>
              <div style={{display:'flex',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                <span style={{fontSize:11,padding:'2px 8px',borderRadius:6,
                  background: r.isCorrect ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)',
                  color: r.isCorrect ? '#10b981' : '#ef4444',fontWeight:700}}>
                  {r.isCorrect ? '✓ Correct' : '✗ Wrong'}
                </span>
                {!r.isCorrect && (
                  <span style={{fontSize:11,padding:'2px 8px',borderRadius:6,
                    background:'rgba(16,185,129,.08)',color:'#10b981',fontWeight:600}}>
                    Correct: {r.correctOption}
                  </span>
                )}
                {r.source && (
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:6,
                    background:'rgba(255,255,255,.04)',color:'var(--muted)'}}>
                    {r.source}
                  </span>
                )}
              </div>
              {r.explanation && (
                <p style={{fontSize:11,color:'var(--muted)',margin:0,lineHeight:1.5,
                  padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,.03)'}}>
                  💡 {r.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{display:'flex',gap:10}}>
        <button onClick={onBack}
          style={{flex:1,padding:'13px',borderRadius:12,border:'1px solid var(--border)',
            background:'rgba(255,255,255,.04)',color:'var(--muted)',
            fontSize:13,fontWeight:600,cursor:'pointer'}}>
          ← Back to Roadmap
        </button>
        {!result.pathComplete && result.nextTaskId && (
          <button className="continue-btn" onClick={() => onTaskComplete(result.nextTaskId)}
            style={{flex:2,padding:'13px',borderRadius:12,border:'none',cursor:'pointer',
              background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',
              fontSize:13,fontWeight:700,boxShadow:'0 4px 16px rgba(124,58,237,.4)',
              transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            Next Task: {result.nextTaskTopic} →
          </button>
        )}
      </div>
    </div>
  )

  return null
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────
export default function ExamPaths() {
  const [screen, setScreen] = useState('selection') // selection | roadmap | task
  const [activePathId, setActivePathId] = useState(null)
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [trialDaysLeft, setTrialDaysLeft] = useState(15)
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    // Get trial info
    api.get('/api/stripe/status').then(r => setIsPro(r.data.isPro)).catch(()=>{})
    api.get('/api/users/me').then(r => {
      const created = new Date(r.data.createdAt)
      const diffDays = Math.floor((new Date() - created) / (1000*60*60*24))
      setTrialDaysLeft(Math.max(0, 15 - diffDays))
    }).catch(()=>{})

    // Check if user has active path — go straight to roadmap
    api.get('/api/paths/my-progress').then(r => {
      if (r.data.enrolled && r.data.status === 'ACTIVE') {
        setActivePathId(r.data.pathId)
        setScreen('roadmap')
      }
    }).catch(()=>{})
  }, [])

  function handleEnroll(pathId) {
    setActivePathId(pathId)
    setScreen('roadmap')
  }

  function handleSelectTask(taskId) {
    setActiveTaskId(taskId)
    setScreen('task')
  }

  function handleTaskComplete(nextTaskId) {
    setActiveTaskId(nextTaskId)
    setScreen('task')
  }

  return (
    <>
      <style>{css}</style>
      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>

        {screen === 'selection' && (
          <PathSelection
            onEnroll={handleEnroll}
            trialDaysLeft={trialDaysLeft}
            isPro={isPro}
          />
        )}

        {screen === 'roadmap' && (
          <RoadmapView
            pathId={activePathId}
            onBack={() => setScreen('selection')}
            onSelectTask={handleSelectTask}
          />
        )}

        {screen === 'task' && (
          <TaskView
            taskId={activeTaskId}
            onBack={() => setScreen('roadmap')}
            onTaskComplete={handleTaskComplete}
          />
        )}
      </div>
    </>
  )
}