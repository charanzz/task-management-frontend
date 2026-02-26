import React, { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem('token') || null } catch { return null }
  })
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })

  const login = useCallback((newToken, userData) => {
    try { localStorage.setItem('token', newToken) } catch {}
    try { localStorage.setItem('user', JSON.stringify(userData)) } catch {}
    setToken(newToken)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    try { localStorage.removeItem('token'); localStorage.removeItem('user') } catch {}
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)