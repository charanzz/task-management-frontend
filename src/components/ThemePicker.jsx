import React, { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function ThemePicker() {
  const { theme, setTheme, themes } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <>
      <style>{`
        @keyframes popIn { from{opacity:0;transform:scale(.85) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .t-fab:hover { transform: scale(1.12) rotate(15deg) !important; }
        .t-card:hover { transform: translateY(-2px); border-color: var(--accent2) !important; }
      `}</style>

      {open && <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:998}}/>}

      {open && (
        <div style={{position:'fixed',bottom:86,right:22,width:316,zIndex:999,background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:20,padding:18,boxShadow:'0 20px 60px rgba(0,0,0,.6)',animation:'popIn .22s ease'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <div>
              <h3 style={{fontSize:15,fontWeight:800,color:'var(--text)',fontFamily:'Syne,sans-serif',margin:0}}>🎨 Choose Theme</h3>
              <p style={{fontSize:11,color:'var(--muted)',margin:'2px 0 0'}}>Personalise your workspace</p>
            </div>
            <button onClick={()=>setOpen(false)} style={{width:26,height:26,borderRadius:8,background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--muted)',cursor:'pointer',fontSize:12}}>✕</button>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
            {Object.entries(themes).map(([key,data])=>{
              const v = data.vars
              const active = theme === key
              return (
                <button key={key} className="t-card" onClick={()=>{setTheme(key);setOpen(false)}}
                  style={{padding:11,borderRadius:13,cursor:'pointer',background:v['--surface'],border:`2px solid ${active?v['--accent2']:'rgba(255,255,255,0.06)'}`,transition:'all .18s',textAlign:'left',boxShadow:active?`0 0 0 3px ${v['--accent']}33`:v['--card-shadow']||'none'}}>
                  {/* Color bar preview */}
                  <div style={{display:'flex',gap:3,marginBottom:8}}>
                    {[v['--accent'],v['--accent2'],v['--success'],v['--warn'],v['--danger']].map((c,i)=>(
                      <div key={i} style={{flex:1,height:5,borderRadius:3,background:c}}/>
                    ))}
                  </div>
                  {/* Mini UI preview */}
                  <div style={{height:22,borderRadius:7,background:v['--surface2'],marginBottom:7,border:`1px solid ${v['--border']}`}}/>
                  {/* Label */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontSize:12,fontWeight:700,color:v['--text']}}>{data.emoji} {data.name}</span>
                    {active && <span style={{fontSize:10,padding:'1px 7px',borderRadius:10,background:`linear-gradient(135deg,${v['--accent']},${v['--accent2']})`,color:'#fff',fontWeight:700}}>ON</span>}
                  </div>
                </button>
              )
            })}
          </div>

          <p style={{fontSize:10,color:'var(--muted)',textAlign:'center',marginTop:12}}>Saved automatically 💾</p>
        </div>
      )}

      {/* FAB */}
      <button className="t-fab" onClick={()=>setOpen(o=>!o)} title="Change Theme"
        style={{position:'fixed',bottom:22,right:22,width:52,height:52,borderRadius:'50%',border:'none',cursor:'pointer',zIndex:997,background:'linear-gradient(135deg,var(--accent),var(--accent2))',boxShadow:'0 4px 20px var(--glow)',fontSize:22,transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center'}}>
        {open ? '✕' : themes[theme].emoji}
      </button>
    </>
  )
}