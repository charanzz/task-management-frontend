import React, { useState } from 'react'
import api from '../services/api'

const css = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  .sync-card:hover{border-color:rgba(124,58,237,.3)!important;transform:translateY(-2px)}
  .step-row:hover{background:rgba(255,255,255,.03)!important}
  .copy-btn:hover{background:rgba(124,58,237,.2)!important}
`
function Spin(){return <span style={{width:18,height:18,border:'2px solid #a855f7',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/>}

export default function GoogleCalendarSync({ tasks = [] }) {
  const [step, setStep]       = useState(0) // 0=intro, 1=setup, 2=done
  const [copied, setCopied]   = useState(false)
  const [exporting, setExp]   = useState(false)
  const [icsUrl, setIcsUrl]   = useState(null)

  // Build ICS calendar from tasks
  function buildICS() {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TaskFlow//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:TaskFlow Tasks',
      'X-WR-CALDESC:Your TaskFlow tasks synced to Google Calendar',
    ]
    const tasksWithDue = tasks.filter(t => t.dueDate && t.status !== 'DONE')
    tasksWithDue.forEach(t => {
      const due  = new Date(t.dueDate)
      const now  = new Date()
      const uid  = `task-${t.id}@todoperks.online`
      const dtst = formatICSDate(now)
      const dtdt = formatICSDate(due)
      const dend = formatICSDate(new Date(due.getTime() + 60*60*1000)) // +1hr

      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${uid}`)
      lines.push(`DTSTAMP:${dtst}`)
      lines.push(`DTSTART:${dtdt}`)
      lines.push(`DTEND:${dend}`)
      lines.push(`SUMMARY:${escICS(t.title)}${t.priority==='HIGH'?' 🔴':t.priority==='MEDIUM'?' 🟡':''}`)
      if (t.description) lines.push(`DESCRIPTION:${escICS(t.description)}`)
      lines.push(`STATUS:${t.status==='IN_PROGRESS'?'IN-PROCESS':'NEEDS-ACTION'}`)
      lines.push(`PRIORITY:${t.priority==='HIGH'?1:t.priority==='MEDIUM'?5:9}`)
      lines.push(`URL:https://www.todoperks.online`)
      lines.push('END:VEVENT')
    })
    lines.push('END:VCALENDAR')
    return lines.join('\r\n')
  }

  function formatICSDate(d) {
    return d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z'
  }
  function escICS(s) {
    return (s||'').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')
  }

  function downloadICS() {
    setExp(true)
    const ics  = buildICS()
    const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'})
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'taskflow-tasks.ics'; a.click()
    URL.revokeObjectURL(url)
    setIcsUrl(url)
    setTimeout(() => { setExp(false); setStep(1) }, 800)
  }

  function copy(text) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const dueTasks = tasks.filter(t => t.dueDate && t.status !== 'DONE')
  const gcalUrl  = 'https://calendar.google.com/calendar/r/settings/addbyurl'

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:580,margin:'0 auto',animation:'fadeUp .4s ease'}}>

        {/* Header */}
        <div style={{background:'linear-gradient(135deg,rgba(66,133,244,.1),rgba(52,168,83,.06))',
          border:'1px solid rgba(66,133,244,.2)',borderRadius:20,padding:'22px 24px',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:12}}>
            <div style={{width:52,height:52,borderRadius:15,flexShrink:0,
              background:'linear-gradient(135deg,#4285f4,#34a853)',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,
              boxShadow:'0 6px 20px rgba(66,133,244,.4)'}}>📅</div>
            <div>
              <h1 style={{fontSize:20,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:'0 0 3px'}}>Google Calendar Sync</h1>
              <p style={{fontSize:12,color:'#6b6b8a',margin:0}}>
                {dueTasks.length} tasks with due dates ready to sync
              </p>
            </div>
          </div>
          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
            {[
              { label:'Total tasks',   val:tasks.length,    color:'#f0f0f8' },
              { label:'With due date', val:dueTasks.length, color:'#4285f4' },
              { label:'High priority', val:tasks.filter(t=>t.priority==='HIGH'&&t.dueDate).length, color:'#ff6b6b' },
            ].map(s => (
              <div key={s.label} style={{textAlign:'center',padding:'10px',
                background:'rgba(0,0,0,.2)',borderRadius:10}}>
                <p style={{fontSize:20,fontWeight:800,color:s.color,fontFamily:'Syne,sans-serif',margin:'0 0 2px'}}>{s.val}</p>
                <p style={{fontSize:9,color:'#6b6b8a',margin:0,letterSpacing:'1px'}}>{s.label.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        {step === 0 && (
          <div style={{animation:'fadeUp .3s ease'}}>
            <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',
              borderRadius:18,padding:22,marginBottom:16}}>
              <p style={{fontSize:14,fontWeight:700,color:'#f0f0f8',margin:'0 0 16px'}}>How it works</p>
              {[
                ['1️⃣','Download your tasks as an .ics calendar file','Takes 1 second'],
                ['2️⃣','Open Google Calendar → Settings → Add calendar → From URL','Or import directly'],
                ['3️⃣','Paste the file URL or import the .ics file','All tasks appear as events'],
                ['4️⃣','Re-export anytime to keep Google Calendar updated','Manual sync'],
              ].map(([num,title,sub]) => (
                <div key={num} className="step-row" style={{display:'flex',gap:12,padding:'10px 12px',
                  borderRadius:10,marginBottom:6,transition:'background .15s'}}>
                  <span style={{fontSize:20,flexShrink:0}}>{num}</span>
                  <div>
                    <p style={{fontSize:13,fontWeight:600,color:'#f0f0f8',margin:'0 0 2px'}}>{title}</p>
                    <p style={{fontSize:11,color:'#6b6b8a',margin:0}}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={downloadICS} disabled={exporting||dueTasks.length===0}
              style={{width:'100%',padding:'15px',borderRadius:14,border:'none',
                background:dueTasks.length>0?'linear-gradient(135deg,#4285f4,#34a853)':'#22222f',
                color:'#fff',fontSize:15,fontWeight:700,cursor:dueTasks.length>0?'pointer':'default',
                display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                boxShadow:dueTasks.length>0?'0 8px 28px rgba(66,133,244,.4)':'none',
                transition:'all .2s'}}>
              {exporting ? <><Spin/> Generating…</> : `📥 Download .ics Calendar (${dueTasks.length} events)`}
            </button>
            {dueTasks.length === 0 && (
              <p style={{fontSize:12,color:'#6b6b8a',textAlign:'center',marginTop:8}}>
                Add due dates to your tasks to enable calendar sync
              </p>
            )}
          </div>
        )}

        {/* Step 2: Setup guide */}
        {step === 1 && (
          <div style={{animation:'fadeUp .3s ease'}}>
            <div style={{background:'rgba(107,203,119,.08)',border:'1px solid rgba(107,203,119,.2)',
              borderRadius:14,padding:'14px 18px',marginBottom:16,display:'flex',gap:10,alignItems:'center'}}>
              <span style={{fontSize:24}}>✅</span>
              <div>
                <p style={{fontSize:14,fontWeight:700,color:'#6bcb77',margin:'0 0 2px'}}>File downloaded!</p>
                <p style={{fontSize:12,color:'#6b6b8a',margin:0}}>Now import it into Google Calendar:</p>
              </div>
            </div>

            <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',borderRadius:18,
              padding:22,marginBottom:16}}>
              <p style={{fontSize:14,fontWeight:700,color:'#f0f0f8',margin:'0 0 16px'}}>Import to Google Calendar</p>

              {/* Option A */}
              <div style={{background:'rgba(66,133,244,.08)',border:'1px solid rgba(66,133,244,.2)',
                borderRadius:12,padding:'16px',marginBottom:12}}>
                <p style={{fontSize:13,fontWeight:700,color:'#4285f4',margin:'0 0 10px'}}>Option A — Import file (easiest)</p>
                {['Open Google Calendar on desktop (calendar.google.com)','Click the gear ⚙️ → Settings','Click "Import & export" in the left sidebar','Click "Select file" and choose taskflow-tasks.ics','Click Import'].map((s,i) => (
                  <div key={i} style={{display:'flex',gap:10,marginBottom:6}}>
                    <span style={{fontSize:11,fontWeight:700,color:'#4285f4',minWidth:18}}>{i+1}.</span>
                    <span style={{fontSize:12,color:'#9ca3af'}}>{s}</span>
                  </div>
                ))}
              </div>

              {/* Option B */}
              <div style={{background:'rgba(52,168,83,.08)',border:'1px solid rgba(52,168,83,.2)',
                borderRadius:12,padding:'16px'}}>
                <p style={{fontSize:13,fontWeight:700,color:'#34a853',margin:'0 0 10px'}}>Option B — Open Calendar directly</p>
                <button onClick={() => window.open(gcalUrl,'_blank')}
                  style={{width:'100%',padding:'11px',borderRadius:10,border:'none',
                    background:'linear-gradient(135deg,#4285f4,#34a853)',color:'#fff',
                    fontSize:13,fontWeight:700,cursor:'pointer',marginBottom:8}}>
                  🔗 Open Google Calendar Settings →
                </button>
                <p style={{fontSize:11,color:'#6b6b8a',margin:0}}>Then go to Import & export and upload the downloaded file</p>
              </div>
            </div>

            <div style={{display:'flex',gap:10}}>
              <button onClick={() => setStep(0)}
                style={{flex:1,padding:'12px',borderRadius:12,background:'transparent',
                  border:'1px solid rgba(255,255,255,.1)',color:'#6b6b8a',
                  fontSize:13,fontWeight:600,cursor:'pointer'}}>
                ← Re-export
              </button>
              <button onClick={() => setStep(2)}
                style={{flex:2,padding:'12px',borderRadius:12,border:'none',
                  background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',
                  fontSize:13,fontWeight:700,cursor:'pointer',
                  boxShadow:'0 4px 16px rgba(124,58,237,.4)'}}>
                ✅ I've imported it!
              </button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === 2 && (
          <div style={{textAlign:'center',padding:'32px 24px',background:'#111118',
            border:'1px solid rgba(107,203,119,.2)',borderRadius:18,animation:'fadeUp .3s ease'}}>
            <p style={{fontSize:52,marginBottom:12}}>🎉</p>
            <h2 style={{fontSize:22,fontWeight:800,color:'#6bcb77',fontFamily:'Syne,sans-serif',margin:'0 0 10px'}}>Sync Complete!</h2>
            <p style={{fontSize:13,color:'#6b6b8a',margin:'0 0 24px',lineHeight:1.7}}>
              Your TaskFlow tasks are now in Google Calendar.<br/>
              Re-export anytime to keep it updated.
            </p>
            <button onClick={() => { setStep(0); downloadICS() }}
              style={{padding:'12px 28px',borderRadius:12,border:'none',
                background:'linear-gradient(135deg,#4285f4,#34a853)',color:'#fff',
                fontSize:14,fontWeight:700,cursor:'pointer'}}>
              🔄 Re-sync Tasks
            </button>
          </div>
        )}

        {/* ICS format info */}
        <div style={{marginTop:16,padding:'12px 16px',background:'rgba(66,133,244,.05)',
          border:'1px solid rgba(66,133,244,.1)',borderRadius:12}}>
          <p style={{fontSize:11,color:'#6b6b8a',margin:0,lineHeight:1.7}}>
            💡 <strong style={{color:'#4285f4'}}>Works with:</strong> Google Calendar, Apple Calendar, Outlook, Notion Calendar, and any app that supports .ics format.
            High-priority tasks are marked as priority events.
          </p>
        </div>
      </div>
    </>
  )
}