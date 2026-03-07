import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login          from './pages/Login'
import Register       from './pages/Register'
import Dashboard      from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword  from './pages/ResetPassword'
import PricingPage    from './pages/PricingPage'

import { ThemeProvider } from './context/ThemeContext'
import ThemePicker from './components/ThemePicker'
import api from './services/api'

function Private({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function Public({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

// Handles /join-team?token=xxx
// Flow:
//   1. Always call GET /api/teams/join?token=xxx first (no auth needed)
//   2. Backend returns { requiresAuth: true, teamName, token } if not logged in
//   3. Frontend redirects to /login?token=xxx
//   4. After login, Login page redirects back here — now auth exists, join succeeds
function JoinTeamPage() {
  const { isAuthenticated } = useAuth()
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = React.useState('loading') // loading | needsLogin | success | error | alreadyMember
  const [teamName, setTeamName] = React.useState('')
  const [message, setMessage] = React.useState('')

  React.useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No invite token found in the URL.'); return }

    api.get(`/api/teams/join?token=${token}`)
      .then(res => {
        const data = res.data
        setTeamName(data.teamName || 'the team')

        if (data.requiresAuth) {
          // Not logged in — save token, go to login
          localStorage.setItem('pendingTeamToken', token)
          setStatus('needsLogin')
          // Auto-redirect after 1.5s
          setTimeout(() => {
            window.location.href = `/login?joinToken=${encodeURIComponent(token)}`
          }, 1500)
        } else {
          // Logged in + joined successfully
          setStatus('success')
          setMessage(data.message || `You joined "${data.teamName}"!`)
          localStorage.removeItem('pendingTeamToken')
          setTimeout(() => window.location.href = '/dashboard', 2200)
        }
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.error || 'This invite link is invalid or has expired.')
      })
  }, [token])

  // Also check on login: if user just logged in with a pending token, re-attempt join
  React.useEffect(() => {
    if (!isAuthenticated) return
    const pending = localStorage.getItem('pendingTeamToken')
    if (pending && pending === token && status === 'loading') {
      // Will be handled by the first useEffect
    }
  }, [isAuthenticated])

  const cfg = {
    loading:     { icon:'⏳', color:'#a855f7', title:'Checking invite…' },
    needsLogin:  { icon:'🔐', color:'#ffd93d', title:'Login required' },
    success:     { icon:'🎉', color:'#6bcb77', title:`Joined ${teamName}!` },
    alreadyMember: { icon:'✅', color:'#6bcb77', title:'Already a member!' },
    error:       { icon:'❌', color:'#ff6b6b', title:'Invite error' },
  }
  const s = cfg[status] || cfg.loading

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0f',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'DM Sans,sans-serif',padding:20}}>
      <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.08)',borderRadius:24,padding:'44px 48px',textAlign:'center',maxWidth:420,width:'100%',boxShadow:'0 24px 64px rgba(0,0,0,.6)'}}>
        {/* Logo */}
        <div style={{width:50,height:50,borderRadius:14,background:'linear-gradient(135deg,#7c3aed,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,margin:'0 auto 20px',boxShadow:'0 6px 20px rgba(124,58,237,.4)'}}>⚡</div>

        <div style={{fontSize:44,marginBottom:14}}>{s.icon}</div>
        <h2 style={{fontSize:21,fontWeight:800,color:'#f0f0f8',marginBottom:10,fontFamily:'Syne,sans-serif'}}>{s.title}</h2>

        {status==='loading' && (
          <p style={{fontSize:13,color:'var(--muted,#6b6b8a)'}}>Validating your invite link…</p>
        )}
        {status==='needsLogin' && (
          <>
            <p style={{fontSize:14,color:'#f0f0f8',marginBottom:6}}>You're invited to join <strong style={{color:'#a855f7'}}>{teamName}</strong></p>
            <p style={{fontSize:13,color:'#6b6b8a',marginBottom:20}}>Redirecting you to login…</p>
            <button onClick={()=>window.location.href=`/login?joinToken=${encodeURIComponent(token)}`}
              style={{padding:'11px 28px',borderRadius:11,border:'none',background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',width:'100%'}}>
              Log in to Join
            </button>
          </>
        )}
        {status==='success' && (
          <>
            <p style={{fontSize:14,color:'#f0f0f8',marginBottom:6}}>{message}</p>
            <p style={{fontSize:12,color:'#6b6b8a'}}>Redirecting to dashboard…</p>
          </>
        )}
        {status==='alreadyMember' && (
          <>
            <p style={{fontSize:13,color:'#6b6b8a',marginBottom:16}}>You're already a member of {teamName}.</p>
            <button onClick={()=>window.location.href='/dashboard'}
              style={{padding:'11px 28px',borderRadius:11,border:'none',background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',width:'100%'}}>
              Go to Dashboard
            </button>
          </>
        )}
        {status==='error' && (
          <>
            <p style={{fontSize:13,color:s.color,marginBottom:20}}>{message}</p>
            <button onClick={()=>window.location.href='/dashboard'}
              style={{padding:'11px 28px',borderRadius:11,border:'none',background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',width:'100%'}}>
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"                element={<Navigate to="/login" replace />} />
      <Route path="/login"           element={<Public><Login /></Public>} />
      <Route path="/register"        element={<Public><Register /></Public>} />
      <Route path="/forgot-password" element={<Public><ForgotPassword /></Public>} />
      <Route path="/reset-password"  element={<ResetPassword />} />
      <Route path="/dashboard"       element={<Private><Dashboard /></Private>} />
      <Route path="/pricing"         element={<Private><PricingPage /></Private>} />
      <Route path="/join-team"       element={<JoinTeamPage />} />
      <Route path="*"                element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <ThemePicker />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}