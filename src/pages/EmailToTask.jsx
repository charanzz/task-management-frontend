import React, { useState, useEffect } from 'react'
import api from '../services/api'

const css = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes slideIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
  .copy-addr:hover{background:rgba(124,58,237,.2)!important;transform:scale(1.02)}
  .method-tab:hover{background:rgba(255,255,255,.06)!important}
`
function Spin(){return <span style={{width:18,height:18,border:'2px solid #a855f7',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/>}

export default function EmailToTask({ onTaskCreated }) {
  const [address, setAddress]   = useState(null)
  const [tab, setTab]           = useState('paste') // paste | forward
  const [subject, setSubject]   = useState('')
  const [body, setBody]         = useState('')
  const [parsing, setParsing]   = useState(false)
  const [result, setResult]     = useState(null)
  const [copied, setCopied]     = useState(false)
  const [addrLoading, setAddrL] = useState(true)

  useEffect(() => {
    api.get('/api/email-tasks/address')
      .then(r => { setAddress(r.data); setAddrL(false) })
      .catch(() => setAddrL(false))
  }, [])

  function copyAddr() {
    navigator.clipboard.writeText(address?.address || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function parse() {
    if (!subject.trim() && !body.trim()) return
    setParsing(true)
    setResult(null)
    try {
      const r = await api.post('/api/email-tasks/parse', { subject, body })
      setResult(r.data)
      onTaskCreated && onTaskCreated()
    } catch(e) {
      setResult({ error: 'Failed to parse. Please try again.' })
    }
    setParsing(false)
  }

  const PRI_COLOR = { HIGH:'#ff6b6b', MEDIUM:'#ffd93d', LOW:'#6bcb77' }

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:560,margin:'0 auto',animation:'fadeUp .4s ease'}}>

        {/* Header */}
        <div style={{background:'linear-gradient(135deg,rgba(16,185,129,.08),rgba(124,58,237,.06))',
          border:'1px solid rgba(16,185,129,.2)',borderRadius:20,padding:'22px 24px',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:52,height:52,borderRadius:15,flexShrink:0,
              background:'linear-gradient(135deg,#10b981,#059669)',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,
              boxShadow:'0 6px 20px rgba(16,185,129,.4)'}}>📧</div>
            <div>
              <h1 style={{fontSize:20,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:'0 0 3px'}}>Email → Task</h1>
              <p style={{fontSize:12,color:'#6b6b8a',margin:0}}>
                Turn any email into a task in seconds using AI
              </p>
            </div>
          </div>
        </div>

        {/* Method tabs */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,
          background:'#111118',border:'1px solid rgba(255,255,255,.07)',
          borderRadius:14,padding:5,marginBottom:20}}>
          {[['paste','📋','Paste Email Content'],['forward','📨','Forward to Address']].map(([v,ic,lb]) => (
            <button key={v} className="method-tab" onClick={() => setTab(v)}
              style={{padding:'10px',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',
                border:'none',transition:'all .15s',
                background:tab===v?'linear-gradient(135deg,#7c3aed,#a855f7)':'transparent',
                color:tab===v?'#fff':'#6b6b8a'}}>
              {ic} {lb}
            </button>
          ))}
        </div>

        {/* Tab: Paste email */}
        {tab === 'paste' && (
          <div style={{animation:'fadeUp .3s ease'}}>
            <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',
              borderRadius:18,padding:20,marginBottom:16}}>
              <p style={{fontSize:14,fontWeight:700,color:'#f0f0f8',margin:'0 0 16px'}}>
                Paste your email content below
              </p>

              <div style={{marginBottom:12}}>
                <label style={{fontSize:11,color:'#6b6b8a',fontWeight:700,letterSpacing:'1px',
                  display:'block',marginBottom:6}}>SUBJECT LINE</label>
                <input value={subject} onChange={e=>setSubject(e.target.value)}
                  placeholder="e.g. Meeting prep for Friday presentation"
                  style={{width:'100%',padding:'12px 14px',background:'#1a1a24',
                    border:'1px solid rgba(255,255,255,.1)',borderRadius:11,color:'#f0f0f8',
                    fontSize:14,boxSizing:'border-box',fontFamily:'DM Sans,sans-serif'}}/>
              </div>

              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,color:'#6b6b8a',fontWeight:700,letterSpacing:'1px',
                  display:'block',marginBottom:6}}>EMAIL BODY <span style={{fontWeight:400,color:'#4b5563'}}>(optional)</span></label>
                <textarea value={body} onChange={e=>setBody(e.target.value)}
                  placeholder="Paste the email body here… AI will extract the key task, priority, and due date"
                  rows={5}
                  style={{width:'100%',padding:'12px 14px',background:'#1a1a24',
                    border:'1px solid rgba(255,255,255,.1)',borderRadius:11,color:'#f0f0f8',
                    fontSize:13,boxSizing:'border-box',fontFamily:'DM Sans,sans-serif',
                    resize:'vertical',lineHeight:1.6}}/>
              </div>

              <button onClick={parse} disabled={(!subject.trim()&&!body.trim())||parsing}
                style={{width:'100%',padding:'14px',borderRadius:13,border:'none',
                  background:(subject.trim()||body.trim())&&!parsing?'linear-gradient(135deg,#7c3aed,#a855f7)':'#22222f',
                  color:'#fff',fontSize:15,fontWeight:700,
                  cursor:(subject.trim()||body.trim())&&!parsing?'pointer':'default',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:10,
                  boxShadow:(subject.trim()||body.trim())&&!parsing?'0 6px 24px rgba(124,58,237,.4)':'none',
                  transition:'all .2s'}}>
                {parsing ? <><Spin/> AI is reading your email…</> : '🤖 Convert to Task with AI'}
              </button>
            </div>

            {/* Result card */}
            {result && !result.error && (
              <div style={{background:'rgba(107,203,119,.08)',border:'1px solid rgba(107,203,119,.2)',
                borderRadius:18,padding:20,animation:'slideIn .4s ease'}}>
                <p style={{fontSize:13,fontWeight:700,color:'#6bcb77',margin:'0 0 14px'}}>✅ Task Created!</p>
                <div style={{background:'rgba(0,0,0,.3)',borderRadius:12,padding:'14px 16px',marginBottom:12}}>
                  <p style={{fontSize:15,fontWeight:700,color:'#f0f0f8',margin:'0 0 8px'}}>{result.title}</p>
                  {result.description && <p style={{fontSize:12,color:'#9ca3af',margin:'0 0 10px',lineHeight:1.5}}>{result.description.substring(0,200)}{result.description.length>200?'…':''}</p>}
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:11,padding:'3px 9px',borderRadius:20,fontWeight:700,
                      background:`${PRI_COLOR[result.priority]||'#6b6b8a'}18`,
                      color:PRI_COLOR[result.priority]||'#6b6b8a'}}>
                      {result.priority} priority
                    </span>
                    {result.dueDate && <span style={{fontSize:11,padding:'3px 9px',borderRadius:20,
                      background:'rgba(96,165,250,.1)',color:'#60a5fa',fontWeight:600}}>
                      📅 {new Date(result.dueDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                    </span>}
                    <span style={{fontSize:11,padding:'3px 9px',borderRadius:20,
                      background:'rgba(16,185,129,.1)',color:'#10b981',fontWeight:600}}>📧 email</span>
                    {result.fallback && <span style={{fontSize:10,padding:'3px 9px',borderRadius:20,
                      background:'rgba(255,255,255,.05)',color:'#6b6b8a'}}>basic parse</span>}
                  </div>
                </div>
                <button onClick={() => { setResult(null); setSubject(''); setBody('') }}
                  style={{width:'100%',padding:'10px',borderRadius:10,border:'1px solid rgba(107,203,119,.3)',
                    background:'transparent',color:'#6bcb77',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                  + Convert Another Email
                </button>
              </div>
            )}
            {result?.error && (
              <div style={{padding:'14px 18px',background:'rgba(255,107,107,.08)',
                border:'1px solid rgba(255,107,107,.2)',borderRadius:12,color:'#ff6b6b',fontSize:13}}>
                ❌ {result.error}
              </div>
            )}
          </div>
        )}

        {/* Tab: Forward address */}
        {tab === 'forward' && (
          <div style={{animation:'fadeUp .3s ease'}}>
            <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)',
              borderRadius:18,padding:22,marginBottom:16}}>
              <p style={{fontSize:14,fontWeight:700,color:'#f0f0f8',margin:'0 0 6px'}}>Your unique task inbox</p>
              <p style={{fontSize:12,color:'#6b6b8a',margin:'0 0 16px',lineHeight:1.6}}>
                Forward any email to this address and it will automatically become a task in TaskFlow.
              </p>

              {addrLoading ? <Spin/> : (
                <>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:16}}>
                    <div style={{flex:1,padding:'13px 16px',background:'#1a1a24',
                      border:'1px solid rgba(124,58,237,.2)',borderRadius:12,
                      fontFamily:'monospace',fontSize:14,color:'#a855f7',fontWeight:600,
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {address?.address || 'Loading…'}
                    </div>
                    <button className="copy-addr" onClick={copyAddr}
                      style={{padding:'13px 16px',borderRadius:12,border:'1px solid rgba(124,58,237,.25)',
                        background:copied?'rgba(107,203,119,.15)':'rgba(124,58,237,.1)',
                        color:copied?'#6bcb77':'#a855f7',fontSize:13,fontWeight:700,
                        cursor:'pointer',transition:'all .2s',flexShrink:0,whiteSpace:'nowrap'}}>
                      {copied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>

                  {/* Instructions */}
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {[
                      ['📬','Forward emails here','Any email forwarded to this address becomes a task'],
                      ['🏷️','Subject = Task title','The email subject line is used as the task title'],
                      ['⚡','Instant creation','Tasks appear in your dashboard immediately'],
                      ['🔒','Only your address','This inbox is unique to your account'],
                    ].map(([ic,title,sub]) => (
                      <div key={title} style={{display:'flex',gap:12,padding:'10px 12px',
                        background:'rgba(255,255,255,.03)',borderRadius:10,
                        border:'1px solid rgba(255,255,255,.05)'}}>
                        <span style={{fontSize:18,flexShrink:0}}>{ic}</span>
                        <div>
                          <p style={{fontSize:12,fontWeight:700,color:'#f0f0f8',margin:'0 0 1px'}}>{title}</p>
                          <p style={{fontSize:11,color:'#6b6b8a',margin:0}}>{sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div style={{padding:'12px 16px',background:'rgba(255,217,61,.05)',
              border:'1px solid rgba(255,217,61,.15)',borderRadius:12}}>
              <p style={{fontSize:11,color:'#6b6b8a',margin:0,lineHeight:1.7}}>
                ⚠️ <strong style={{color:'#ffd93d'}}>Note:</strong> Email forwarding requires webhook configuration on your email provider. Contact support or use the "Paste Email" tab above which works instantly.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}