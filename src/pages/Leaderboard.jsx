import React, { useState, useEffect } from 'react'
import api from '../services/api'

const css = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes crown{0%,100%{transform:translateY(0) rotate(-8deg)}50%{transform:translateY(-4px) rotate(8deg)}}
  .lb-row:hover{background:rgba(124,58,237,.06)!important;transform:translateX(3px)}
  .tab-lb:hover{background:rgba(255,255,255,.05)!important}
`

const LVL_NAMES = ['','Novice','Apprentice','Achiever','Hustler','Warrior','Champion','Master','Elite','Legend','God Mode']
const MEDALS = ['🥇','🥈','🥉']

function Avatar({ name, color, size = 38 }) {
  return (
    <div style={{ width:size,height:size,borderRadius:size*.28,flexShrink:0,
      background:`linear-gradient(135deg,${color},${color}99)`,
      display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:size*.42,fontWeight:800,color:'#fff',fontFamily:'Syne,sans-serif',
      boxShadow:`0 4px 12px ${color}44` }}>
      {(name?.[0]||'?').toUpperCase()}
    </div>
  )
}

function Spinner() {
  return <span style={{ width:22,height:22,border:'2px solid #a855f7',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite' }}/>
}

export default function Leaderboard() {
  const [tab, setTab]       = useState('global')   // global | weekly
  const [data, setData]     = useState(null)
  const [loading, setLoad]  = useState(true)

  useEffect(() => {
    setLoad(true)
    const url = tab === 'weekly' ? '/api/leaderboard/weekly' : '/api/leaderboard/global'
    api.get(url)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoad(false))
  }, [tab])

  const board = data?.board || []
  const myRank = data?.myRank
  const total  = data?.total

  return (
    <>
      <style>{css}</style>
      <div style={{ maxWidth:660,margin:'0 auto',animation:'fadeUp .4s ease' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,rgba(124,58,237,.12),rgba(255,217,61,.06))',
          border:'1px solid rgba(124,58,237,.2)',borderRadius:20,padding:'24px 24px 20px',marginBottom:20,
          position:'relative',overflow:'hidden' }}>
          <div style={{ position:'absolute',top:-40,right:-30,fontSize:90,opacity:.06,pointerEvents:'none' }}>🏆</div>
          <div style={{ display:'flex',alignItems:'center',gap:14 }}>
            <div style={{ width:48,height:48,borderRadius:14,background:'linear-gradient(135deg,#f59e0b,#fbbf24)',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,
              boxShadow:'0 6px 20px rgba(245,158,11,.4)',flexShrink:0 }}>🏆</div>
            <div>
              <h1 style={{ fontSize:20,fontWeight:800,color:'#f0f0f8',fontFamily:'Syne,sans-serif',margin:'0 0 4px' }}>
                Leaderboard
              </h1>
              <p style={{ fontSize:12,color:'#6b6b8a',margin:0 }}>
                {tab==='global' ? `Top performers across all ${total||'...'} users` : 'Most tasks completed this week'}
              </p>
            </div>
            {myRank && (
              <div style={{ marginLeft:'auto',textAlign:'center',flexShrink:0 }}>
                <p style={{ fontSize:26,fontWeight:800,color:'#ffd93d',fontFamily:'Syne,sans-serif',margin:0,lineHeight:1 }}>#{myRank}</p>
                <p style={{ fontSize:10,color:'#6b6b8a',margin:'3px 0 0' }}>your rank</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex',gap:4,background:'#111118',border:'1px solid rgba(255,255,255,.06)',
          borderRadius:14,padding:5,marginBottom:20 }}>
          {[['global','🌍','All-Time'],['weekly','📅','This Week']].map(([key,ic,lb]) => (
            <button key={key} className="tab-lb" onClick={() => setTab(key)}
              style={{ flex:1,padding:'9px',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',
                border:'none',transition:'all .15s',
                background:tab===key?'linear-gradient(135deg,#7c3aed,#a855f7)':'transparent',
                color:tab===key?'#fff':'#6b6b8a' }}>
              {ic} {lb}
            </button>
          ))}
        </div>

        {/* Top 3 podium */}
        {!loading && board.length >= 3 && (
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1.15fr 1fr',gap:10,marginBottom:20,alignItems:'end' }}>
            {[board[1], board[0], board[2]].map((entry, i) => {
              const rank = i===1 ? 0 : i===0 ? 1 : 2  // center is #1
              const heights = ['80px','100px','70px']
              const isMe = entry?.isMe
              return (
                <div key={entry?.id} style={{ textAlign:'center',animation:`fadeUp .5s ease ${i*0.1}s both` }}>
                  <div style={{ marginBottom:8 }}>
                    <Avatar name={entry?.name} color={entry?.avatarColor||'#7c3aed'} size={rank===0?52:44}/>
                  </div>
                  <p style={{ fontSize:11,fontWeight:700,color:isMe?'#a855f7':'#f0f0f8',margin:'0 0 2px',
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                    {isMe?'You':entry?.name?.split(' ')[0]}
                  </p>
                  <p style={{ fontSize:10,color:'#6b6b8a',margin:'0 0 6px' }}>
                    {tab==='weekly' ? `${entry?.weeklyCompleted||0} tasks` : `${entry?.focusScore||0} pts`}
                  </p>
                  <div style={{ height:heights[i],background:
                    rank===0?'linear-gradient(180deg,rgba(255,217,61,.2),rgba(255,217,61,.05))':
                    rank===1?'linear-gradient(180deg,rgba(168,168,168,.15),rgba(168,168,168,.05))':
                    'linear-gradient(180deg,rgba(205,127,50,.15),rgba(205,127,50,.05))',
                    border:`1px solid ${rank===0?'rgba(255,217,61,.3)':rank===1?'rgba(168,168,168,.2)':'rgba(205,127,50,.2)'}`,
                    borderRadius:'10px 10px 0 0',display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:8 }}>
                    <span style={{ fontSize:rank===0?26:22,animation:rank===0?'crown 2s ease infinite':'' }}>
                      {MEDALS[rank]}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Full list */}
        <div style={{ background:'#111118',border:'1px solid rgba(255,255,255,.06)',borderRadius:18,overflow:'hidden' }}>
          {loading ? (
            <div style={{ display:'flex',justifyContent:'center',padding:48 }}><Spinner/></div>
          ) : board.length === 0 ? (
            <div style={{ textAlign:'center',padding:'48px 24px' }}>
              <p style={{ fontSize:32,marginBottom:12 }}>🏆</p>
              <p style={{ fontSize:14,fontWeight:600,color:'#f0f0f8' }}>No data yet</p>
              <p style={{ fontSize:12,color:'#6b6b8a' }}>Complete tasks to appear on the leaderboard!</p>
            </div>
          ) : board.map((entry, i) => {
            const isTop3 = i < 3
            const isMe   = entry.isMe
            const score  = tab==='weekly' ? entry.weeklyCompleted : entry.focusScore
            const scoreLabel = tab==='weekly' ? 'tasks this week' : 'focus pts'
            return (
              <div key={entry.id} className="lb-row"
                style={{ display:'flex',alignItems:'center',gap:14,padding:'13px 18px',
                  borderBottom:'1px solid rgba(255,255,255,.04)',transition:'all .15s',
                  background:isMe?'rgba(124,58,237,.06)':'transparent',
                  animation:`slideIn .3s ease ${i*0.04}s both` }}>

                {/* Rank */}
                <div style={{ width:32,textAlign:'center',flexShrink:0 }}>
                  {isTop3 ? (
                    <span style={{ fontSize:20 }}>{MEDALS[i]}</span>
                  ) : (
                    <span style={{ fontSize:13,fontWeight:700,color:isMe?'#a855f7':'#4b5563',fontFamily:'Syne,sans-serif' }}>
                      #{i+1}
                    </span>
                  )}
                </div>

                <Avatar name={entry.name} color={entry.avatarColor||'#7c3aed'} size={36}/>

                {/* Info */}
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:2 }}>
                    <p style={{ fontSize:14,fontWeight:isMe?700:600,color:isMe?'#a855f7':'#f0f0f8',
                      margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                      {isMe ? '⭐ You' : entry.name}
                    </p>
                    {entry.isPro && <span style={{ fontSize:9,padding:'1px 6px',borderRadius:4,
                      background:'linear-gradient(135deg,#f59e0b,#fbbf24)',color:'#000',fontWeight:800 }}>PRO</span>}
                  </div>
                  <p style={{ fontSize:11,color:'#6b6b8a',margin:0 }}>
                    Lv.{entry.level} {LVL_NAMES[entry.level]||'Legend'} · 🔥 {entry.streak}d streak
                  </p>
                </div>

                {/* Score */}
                <div style={{ textAlign:'right',flexShrink:0 }}>
                  <p style={{ fontSize:16,fontWeight:800,color:isTop3?'#ffd93d':isMe?'#a855f7':'#f0f0f8',
                    fontFamily:'Syne,sans-serif',margin:'0 0 2px',lineHeight:1 }}>
                    {score?.toLocaleString()}
                  </p>
                  <p style={{ fontSize:9,color:'#6b6b8a',margin:0,letterSpacing:'1px',textTransform:'uppercase' }}>
                    {scoreLabel}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <p style={{ textAlign:'center',fontSize:11,color:'#4b5563',marginTop:14 }}>
          💡 Complete tasks, maintain streaks and earn focus points to climb the leaderboard
        </p>
      </div>
    </>
  )
}