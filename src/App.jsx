import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login          from './pages/Login'
import Register       from './pages/Register'
import Dashboard      from './pages/Dashboard'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword  from './pages/ResetPassword'

import { ThemeProvider } from './context/ThemeContext'
import ThemePicker from './components/ThemePicker'

function Private({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function Public({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
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
          <ThemePicker />   {/* ← ADD THIS — shows on every page */}
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}