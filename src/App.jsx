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
// If logged in → joins team via API then redirects to dashboard
// If not logged in → redirects to login first
function JoinTeamPage() {
  const { isAuthenticated } = useAuth()
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = React.useState('loading') // loading | success | error
  const [message, setMessage] = React.useState('')

  React.useEffect(() => {
    if (!isAuthenticated) {
      // Save token to localStorage, redirect to login
      if (token) localStorage.setItem('pendingTeamToken', token)
      window.location.href = '/login'
      return
    }
    if (!token) { setStatus('error'); setMessage('Invalid invite link.'); return }

    api.get(`/api/teams/join?token=${token}`)
      .then(res => {
        setStatus('success')
        setMessage(`You joined "${res.data.teamName}"! Redirecting…`)
        setTimeout(() => window.location.href = '/dashboard', 2000)
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.error || 'Invite expired or invalid.')
      })
  }, [isAuthenticated, token])

  const colors = { loading:'#a855f7', success:'#6bcb77', error:'#ff6b6b' }
  const icons  = { loading:'⏳', success:'🎉', error:'❌' }

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0f',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'DM Sans,sans-serif'}}>
      <div style={{background:'#111118',border:'1px solid rgba(255,255,255,.08)',borderRadius:20,padding:'40px 48px',textAlign:'center',maxWidth:400}}>
        <div style={{fontSize:48,marginBottom:16}}>{icons[status]}</div>
        <h2 style={{fontSize:20,fontWeight:800,color:'#f0f0f8',marginBottom:10,fontFamily:'Syne,sans-serif'}}>
          {status==='loading' ? 'Joining team…' : status==='success' ? 'Joined!' : 'Oops!'}
        </h2>
        <p style={{fontSize:13,color:colors[status]}}>{message}</p>
        {status==='error' && (
          <button onClick={()=>window.location.href='/dashboard'}
            style={{marginTop:20,padding:'10px 24px',borderRadius:10,border:'none',
              background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',
              fontSize:13,fontWeight:600,cursor:'pointer'}}>
            Go to Dashboard
          </button>
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