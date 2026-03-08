import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const AVATAR_COLORS = [
  '#7c3aed','#a855f7','#0ea5e9','#06b6d4','#10b981',
  '#f59e0b','#ef4444','#ec4899','#6366f1','#14b8a6',
]

const TIMEZONES = [
  'Asia/Kolkata','Asia/Dubai','Asia/Singapore','Asia/Tokyo',
  'Europe/London','Europe/Paris','Europe/Berlin',
  'America/New_York','America/Chicago','America/Los_Angeles',
  'Australia/Sydney','Pacific/Auckland',
]

const LVL_NAMES = ['','Novice','Apprentice','Achiever','Hustler','Warrior','Champion','Master','Elite','Legend','God Mode']

const css = `
  @media(max-width:768px){
    .profile-stat-grid{grid-template-columns:1fr 1fr!important}
    .profile-hero-stats{display:none!important}
  }
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  .tab-btn:hover{background:var(--surface2)!important}
  .color-swatch:hover{transform:scale(1.15)!important}
  .stat-card:hover{border-color:var(--accent2)!important;transform:translateY(-2px)}
  .danger-btn:hover{background:rgba(255,107,107,.15)!important}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#22222f;border-radius:4px}
`

function Spinner({size=16}){
  return <span style={{width:size,height:size,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite',flexShrink:0}}/>
}

function AvatarBig({name, color, size=88}){
  return(
    <div style={{width:size,height:size,borderRadius:size*.28,
      background:`linear-gradient(135deg,${color},${color}99)`,
      display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:size*.42,fontWeight:800,color:'#fff',
      boxShadow:`0 8px 32px ${color}55`,flexShrink:0,
      fontFamily:'Syne,sans-serif',userSelect:'none'}}>
      {(name?.[0]||'?').toUpperCase()}
    </div>
  )
}

export default function ProfilePage(){
  const {user, login, logout} = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('profile') // profile | security | danger
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // Profile form
  const [name, setName]               = useState('')
  const [bio, setBio]                 = useState('')
  const [avatarColor, setAvatarColor] = useState('#7c3aed')
  const [timezone, setTimezone]       = useState('Asia/Kolkata')

  // Password form
  const [curPass, setCurPass]   = useState('')
  const [newPass, setNewPass]   = useState('')
  const [confPass, setConfPass] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Delete account
  const [delPass, setDelPass]       = useState('')
  const [delConfirm, setDelConfirm] = useState(false)

  useEffect(()=>{
    api.get('/api/users/profile')
      .then(r=>{
        const d = r.data
        setProfile(d)
        setName(d.name||'')
        setBio(d.bio||'')
        setAvatarColor(d.avatarColor||'#7c3aed')
        setTimezone(d.timezone||'Asia/Kolkata')
      })
      .catch(()=>flash('error','Failed to load profile'))
      .finally(()=>setLoading(false))
  },[])

  function flash(type, msg){ setToast({type,msg}); setTimeout(()=>setToast(null),3500) }

  async function saveProfile(){
    if(!name.trim()){ flash('error','Name cannot be empty'); return }
    setSaving(true)
    try{
      await api.put('/api/users/profile',{name,bio,avatarColor,timezone})
      setProfile(p=>({...p,name,bio,avatarColor,timezone}))
      // Update auth context so header updates
      const token = localStorage.getItem('token')
      if(token) login(token,{...user,name})
      flash('success','✓ Profile updated!')
    }catch(e){ flash('error', e.response?.data?.error||'Failed to save') }
    finally{ setSaving(false) }
  }

  async function changePassword(){
    if(!curPass||!newPass||!confPass){ flash('error','Fill in all password fields'); return }
    if(newPass.length<6){ flash('error','New password must be at least 6 characters'); return }
    if(newPass!==confPass){ flash('error','New passwords do not match'); return }
    setSaving(true)
    try{
      await api.put('/api/users/change-password',{currentPassword:curPass,newPassword:newPass})
      setCurPass(''); setNewPass(''); setConfPass('')
      flash('success','✓ Password changed!')
    }catch(e){ flash('error',e.response?.data?.error||'Incorrect current password') }
    finally{ setSaving(false) }
  }

  async function deleteAccount(){
    if(!delPass){ flash('error','Enter your password to confirm'); return }
    try{
      await api.delete('/api/users/account',{data:{password:delPass}})
      logout()
      navigate('/login')
    }catch(e){ flash('error',e.response?.data?.error||'Incorrect password') }
  }

  const inp = {
    width:'100%',padding:'11px 14px',background:'#1a1a24',
    border:'1px solid rgba(255,255,255,.1)',borderRadius:11,
    color:'#f0f0f8',fontSize:14,outline:'none',
    transition:'border-color .2s',fontFamily:'DM Sans,sans-serif'
  }
  const onFocus = e => e.target.style.borderColor='#7c3aed'
  const onBlur  = e => e.target.style.borderColor='rgba(255,255,255,.1)'

  if(loading) return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:14}}>
      <Spinner size={28}/>
      <p style={{color:'#6b6b8a',fontSize:13}}>Loading profile…</p>
    </div>
  )

  const level = profile ? Math.floor((profile.focusScore||0)/100)+1 : 1
  const pct   = profile ? Math.min(100,(profile.focusScore||0)%100) : 0
  const completionRate = profile?.totalTasks ? Math.round((profile.completedTasks/profile.totalTasks)*100) : 0

  return(
    <>
      <style>{css}</style>
      <div style={{maxWidth:740,margin:'0 auto',animation:'fadeUp .4s ease'}}>

        {/* ── Hero banner ── */}
        <div style={{background:'linear-gradient(135deg,rgba(124,58,237,.15),rgba(168,85,247,.08),transparent)',
          border:'1px solid rgba(124,58,237,.2)',borderRadius:20,padding:'28px 28px 24px',marginBottom:22,
          position:'relative',overflow:'hidden'}}>
          {/* Decorative bg circles */}
          <div style={{position:'absolute',top:-40,right:-40,width:200,height:200,borderRadius:'50%',background:'rgba(124,58,237,.07)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:-30,left:80,width:120,height:120,borderRadius:'50%',background:'rgba(168,85,247,.05)',pointerEvents:'none'}}/>

          <div style={{display:'flex',alignItems:'center',gap:22,flexWrap:'wrap',position:'relative',zIndex:1}}>
            <AvatarBig name={profile?.name} color={avatarColor} size={80}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:4}}>
                <h1 style={{fontSize:24,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:0}}>{profile?.name}</h1>
                {profile?.isPro&&<span style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:'linear-gradient(135deg,#f59e0b,#fbbf24)',color:'#000',fontWeight:800}}>⭐ PRO</span>}
                {profile?.role==='ADMIN'&&<span style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:'rgba(255,107,107,.15)',color:'#ff6b6b',fontWeight:700,border:'1px solid rgba(255,107,107,.3)'}}>🛡 ADMIN</span>}
              </div>
              <p style={{fontSize:13,color:'#6b6b8a',margin:'0 0 10px'}}>{profile?.email}</p>
              {profile?.bio&&<p style={{fontSize:13,color:'#9ca3af',margin:'0 0 12px',lineHeight:1.5,fontStyle:'italic'}}>"{profile.bio}"</p>}

              {/* Level bar */}
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:13,fontWeight:700,color:'#a855f7',fontFamily:'Syne,sans-serif',whiteSpace:'nowrap'}}>Lv.{level} {LVL_NAMES[level]||'Legend'}</span>
                <div style={{flex:1,height:6,background:'rgba(255,255,255,.07)',borderRadius:6,overflow:'hidden',minWidth:80}}>
                  <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#7c3aed,#a855f7)',borderRadius:6,transition:'width .5s ease'}}/>
                </div>
                <span style={{fontSize:11,color:'#6b6b8a',whiteSpace:'nowrap'}}>{profile?.focusScore||0} pts</span>
              </div>
            </div>

            {/* Quick stats */}
            <div style={{display:'flex',gap:16,flexShrink:0}}>
              {[
                {label:'Tasks Done',value:profile?.completedTasks||0,color:'#6bcb77',icon:'✓'},
                {label:'Streak',value:`${profile?.streak||0}d`,color:'#ffd93d',icon:'🔥'},
                {label:'Rate',value:`${completionRate}%`,color:'#a855f7',icon:'📈'},
              ].map(s=>(
                <div key={s.label} style={{textAlign:'center'}}>
                  <p style={{fontSize:22,fontWeight:800,color:s.color,fontFamily:'Syne,sans-serif',margin:0,lineHeight:1}}>{s.value}</p>
                  <p style={{fontSize:10,color:'#6b6b8a',margin:'4px 0 0',letterSpacing:'1px',textTransform:'uppercase'}}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Member since */}
          <p style={{fontSize:11,color:'#4b5563',margin:'16px 0 0',position:'relative',zIndex:1}}>
            Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : '—'}
            {profile?.lastLoginAt && ` · Last login ${new Date(profile.lastLoginAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}`}
          </p>
        </div>

        {/* ── Stat cards row ── */}
        <div className='profile-stat-grid' style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:22}}>
          {[
            {label:'Total Tasks',value:profile?.totalTasks||0,color:'#60a5fa',icon:'📋'},
            {label:'Completed',value:profile?.completedTasks||0,color:'#6bcb77',icon:'✅'},
            {label:'Overdue',value:profile?.overdueTasks||0,color:'#ff6b6b',icon:'⚠'},
            {label:'Focus Score',value:profile?.focusScore||0,color:'#a855f7',icon:'⚡'},
          ].map(s=>(
            <div key={s.label} className="stat-card"
              style={{background:'#111118',border:'1px solid rgba(255,255,255,.06)',borderRadius:14,
                padding:'16px 14px',textAlign:'center',transition:'all .2s',cursor:'default'}}>
              <p style={{fontSize:20,margin:'0 0 4px'}}>{s.icon}</p>
              <p style={{fontSize:24,fontWeight:800,color:s.color,fontFamily:'Syne,sans-serif',margin:'0 0 4px',lineHeight:1}}>{s.value}</p>
              <p style={{fontSize:10,color:'#6b6b8a',letterSpacing:'1px',textTransform:'uppercase',margin:0}}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{display:'flex',gap:4,marginBottom:20,background:'#111118',border:'1px solid rgba(255,255,255,.06)',borderRadius:14,padding:5}}>
          {[
            ['profile','👤','Edit Profile'],
            ['security','🔒','Security'],
            ['danger','⚠','Danger Zone'],
          ].map(([key,ic,lb])=>(
            <button key={key} className="tab-btn" onClick={()=>setTab(key)}
              style={{flex:1,padding:'10px 8px',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',
                background:tab===key?'linear-gradient(135deg,#7c3aed,#a855f7)':'transparent',
                color:tab===key?'#fff':'#6b6b8a',border:'none',transition:'all .18s',
                display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              {ic} {lb}
            </button>
          ))}
        </div>

        {/* ── Edit Profile tab ── */}
        {tab==='profile'&&(
          <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.06)',borderRadius:18,padding:26,animation:'fadeUp .3s ease'}}>

            {/* Avatar color picker */}
            <div style={{marginBottom:22}}>
              <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'#6b6b8a',marginBottom:14}}>AVATAR COLOR</label>
              <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                <AvatarBig name={name||profile?.name} color={avatarColor} size={60}/>
                <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                  {AVATAR_COLORS.map(col=>(
                    <button key={col} className="color-swatch" onClick={()=>setAvatarColor(col)}
                      style={{width:32,height:32,borderRadius:10,background:`linear-gradient(135deg,${col},${col}99)`,
                        border:avatarColor===col?'3px solid #fff':'3px solid transparent',
                        cursor:'pointer',transition:'transform .15s',flexShrink:0,
                        boxShadow:avatarColor===col?`0 0 0 2px ${col}`:'none'}}/>
                  ))}
                </div>
              </div>
            </div>

            {/* Name */}
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'#6b6b8a',marginBottom:8}}>DISPLAY NAME</label>
              <input style={inp} value={name} onChange={e=>setName(e.target.value)}
                placeholder="Your full name" onFocus={onFocus} onBlur={onBlur}/>
            </div>

            {/* Bio */}
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'#6b6b8a',marginBottom:8}}>
                BIO <span style={{fontWeight:400,textTransform:'none',letterSpacing:0,color:'#4b5563'}}>({bio.length}/300)</span>
              </label>
              <textarea style={{...inp,resize:'vertical',lineHeight:1.6,minHeight:80}} rows={3}
                placeholder="Tell your team a bit about yourself…"
                value={bio} onChange={e=>setBio(e.target.value.slice(0,300))}
                onFocus={onFocus} onBlur={onBlur}/>
            </div>

            {/* Email (read-only) */}
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'#6b6b8a',marginBottom:8}}>EMAIL</label>
              <input style={{...inp,background:'#0a0a0f',color:'#4b5563',cursor:'not-allowed'}}
                value={profile?.email||''} disabled/>
              <p style={{fontSize:11,color:'#4b5563',marginTop:5}}>Email cannot be changed.</p>
            </div>

            {/* Timezone */}
            <div style={{marginBottom:24}}>
              <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'#6b6b8a',marginBottom:8}}>TIMEZONE</label>
              <select style={{...inp,cursor:'pointer',colorScheme:'dark'}} value={timezone} onChange={e=>setTimezone(e.target.value)} onFocus={onFocus} onBlur={onBlur}>
                {TIMEZONES.map(tz=><option key={tz} value={tz}>{tz.replace('_',' ')}</option>)}
              </select>
            </div>

            <button onClick={saveProfile} disabled={saving}
              style={{width:'100%',padding:'13px',borderRadius:12,border:'none',
                background:saving?'#22222f':'linear-gradient(135deg,#7c3aed,#a855f7)',
                color:'#fff',fontSize:14,fontWeight:700,cursor:saving?'default':'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',gap:9,
                boxShadow:saving?'none':'0 4px 20px rgba(124,58,237,.4)',transition:'all .2s'}}>
              {saving?<><Spinner/> Saving…</>:'✓ Save Profile'}
            </button>
          </div>
        )}

        {/* ── Security tab ── */}
        {tab==='security'&&(
          <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.06)',borderRadius:18,padding:26,animation:'fadeUp .3s ease'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:22,padding:'14px 16px',background:'rgba(96,165,250,.06)',border:'1px solid rgba(96,165,250,.15)',borderRadius:12}}>
              <span style={{fontSize:20}}>🔒</span>
              <div>
                <p style={{fontSize:14,fontWeight:600,color:'#f0f0f8',margin:0}}>Change Password</p>
                <p style={{fontSize:12,color:'#6b6b8a',margin:0}}>Use a strong password with at least 6 characters</p>
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'#6b6b8a',marginBottom:8}}>CURRENT PASSWORD</label>
              <div style={{position:'relative'}}>
                <input style={inp} type={showPass?'text':'password'} value={curPass}
                  onChange={e=>setCurPass(e.target.value)} placeholder="Enter current password"
                  onFocus={onFocus} onBlur={onBlur}/>
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'#6b6b8a',marginBottom:8}}>NEW PASSWORD</label>
              <input style={inp} type={showPass?'text':'password'} value={newPass}
                onChange={e=>setNewPass(e.target.value)} placeholder="Enter new password"
                onFocus={onFocus} onBlur={onBlur}/>
              {/* Strength bar */}
              {newPass.length>0&&(
                <div style={{marginTop:8}}>
                  <div style={{display:'flex',gap:4,marginBottom:4}}>
                    {[1,2,3,4].map(i=>{
                      const strength = newPass.length<6?1:newPass.length<10?2:/[A-Z]/.test(newPass)&&/[0-9]/.test(newPass)?4:3
                      const colors = ['','#ff6b6b','#ffd93d','#60a5fa','#6bcb77']
                      return <div key={i} style={{flex:1,height:3,borderRadius:3,background:i<=strength?colors[strength]:'rgba(255,255,255,.08)',transition:'background .3s'}}/>
                    })}
                  </div>
                  <p style={{fontSize:10,color:'#6b6b8a'}}>
                    {newPass.length<6?'Too short':newPass.length<10?'Weak':/[A-Z]/.test(newPass)&&/[0-9]/.test(newPass)?'Strong':'Moderate'}
                  </p>
                </div>
              )}
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'2px',textTransform:'uppercase',color:'#6b6b8a',marginBottom:8}}>CONFIRM NEW PASSWORD</label>
              <input style={{...inp,borderColor:confPass&&confPass!==newPass?'#ff6b6b':'rgba(255,255,255,.1)'}}
                type={showPass?'text':'password'} value={confPass}
                onChange={e=>setConfPass(e.target.value)} placeholder="Repeat new password"
                onFocus={onFocus} onBlur={onBlur}/>
              {confPass&&confPass!==newPass&&<p style={{fontSize:11,color:'#ff6b6b',marginTop:5}}>Passwords don't match</p>}
            </div>

            <label style={{display:'flex',alignItems:'center',gap:9,cursor:'pointer',marginBottom:20}}>
              <input type="checkbox" checked={showPass} onChange={e=>setShowPass(e.target.checked)}
                style={{width:16,height:16,accentColor:'#7c3aed'}}/>
              <span style={{fontSize:13,color:'#9ca3af'}}>Show passwords</span>
            </label>

            <button onClick={changePassword} disabled={saving||!curPass||!newPass||newPass!==confPass}
              style={{width:'100%',padding:'13px',borderRadius:12,border:'none',
                background:saving||!curPass||!newPass||newPass!==confPass?'#22222f':'linear-gradient(135deg,#7c3aed,#a855f7)',
                color:'#fff',fontSize:14,fontWeight:700,
                cursor:saving||!curPass||!newPass||newPass!==confPass?'default':'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',gap:9,transition:'all .2s'}}>
              {saving?<><Spinner/> Changing…</>:'🔑 Change Password'}
            </button>
          </div>
        )}

        {/* ── Danger Zone tab ── */}
        {tab==='danger'&&(
          <div style={{background:'#111118',border:'1px solid rgba(255,107,107,.2)',borderRadius:18,padding:26,animation:'fadeUp .3s ease'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:22,padding:'14px 16px',background:'rgba(255,107,107,.06)',border:'1px solid rgba(255,107,107,.15)',borderRadius:12}}>
              <span style={{fontSize:22}}>⚠️</span>
              <div>
                <p style={{fontSize:14,fontWeight:700,color:'#ff6b6b',margin:0}}>Danger Zone</p>
                <p style={{fontSize:12,color:'#6b6b8a',margin:0}}>These actions are irreversible. Please be careful.</p>
              </div>
            </div>

            <div style={{padding:20,background:'rgba(255,107,107,.04)',border:'1px solid rgba(255,107,107,.12)',borderRadius:14}}>
              <p style={{fontSize:15,fontWeight:700,color:'#f0f0f8',marginBottom:6}}>Delete Account</p>
              <p style={{fontSize:13,color:'#6b6b8a',marginBottom:20,lineHeight:1.6}}>
                Permanently delete your account and all data — tasks, badges, streaks, everything. This <strong style={{color:'#ff6b6b'}}>cannot be undone</strong>.
              </p>

              {!delConfirm ? (
                <button className="danger-btn" onClick={()=>setDelConfirm(true)}
                  style={{padding:'11px 20px',borderRadius:10,background:'rgba(255,107,107,.08)',
                    border:'1px solid rgba(255,107,107,.25)',color:'#ff6b6b',fontSize:13,
                    fontWeight:600,cursor:'pointer',width:'100%',transition:'all .2s'}}>
                  🗑 Delete My Account
                </button>
              ):(
                <div style={{animation:'fadeUp .25s ease'}}>
                  <p style={{fontSize:13,color:'#ff6b6b',fontWeight:600,marginBottom:12}}>⚠ Enter your password to confirm deletion:</p>
                  <input style={{...inp,marginBottom:12,borderColor:'rgba(255,107,107,.3)'}}
                    type="password" placeholder="Your password" value={delPass}
                    onChange={e=>setDelPass(e.target.value)}
                    onFocus={e=>e.target.style.borderColor='#ff6b6b'}
                    onBlur={e=>e.target.style.borderColor='rgba(255,107,107,.3)'}/>
                  <div style={{display:'flex',gap:10}}>
                    <button onClick={()=>{setDelConfirm(false);setDelPass('')}}
                      style={{flex:1,padding:'11px',borderRadius:10,border:'1px solid rgba(255,255,255,.1)',
                        background:'transparent',color:'#6b6b8a',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                      Cancel
                    </button>
                    <button onClick={deleteAccount} disabled={!delPass}
                      style={{flex:2,padding:'11px',borderRadius:10,border:'none',
                        background:delPass?'linear-gradient(135deg,#dc2626,#ef4444)':'#22222f',
                        color:'#fff',fontSize:13,fontWeight:700,cursor:delPass?'pointer':'default',transition:'all .2s'}}>
                      💀 Permanently Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Toast */}
      {toast&&(
        <div style={{position:'fixed',bottom:80,right:16,padding:'13px 20px',borderRadius:12,fontSize:13,fontWeight:600,zIndex:300,
          background:toast.type==='success'?'rgba(107,203,119,.1)':'rgba(255,107,107,.1)',
          border:`1px solid ${toast.type==='success'?'rgba(107,203,119,.3)':'rgba(255,107,107,.3)'}`,
          color:toast.type==='success'?'#6bcb77':'#ff6b6b',
          backdropFilter:'blur(12px)',boxShadow:'0 8px 30px rgba(0,0,0,.5)',animation:'fadeUp .3s ease'}}>
          {toast.msg}
        </div>
      )}
    </>
  )
}