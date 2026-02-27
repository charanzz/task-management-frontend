import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const focus = e => { e.target.style.borderColor = 'var(--accent)' }
  const blur_ = e => { e.target.style.borderColor = 'var(--border2)' }

  const inputStyle = {
    display: 'block',
    width: '100%',
    padding: '12px 14px',
    background: 'var(--surface2)',
    border: '1px solid var(--border2)',
    borderRadius: 12,
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color .2s',
  }

  async function submit(e) {
    e.preventDefault()

    if (!email || !password) {
      setError('Please enter email and password.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await authAPI.login({
        email: email.trim(),
        password
      })

      // Support both plain string token & JSON response
      const token =
        typeof res.data === 'string'
          ? res.data
          : res.data?.token || res.data?.accessToken

      if (!token) throw new Error('No token in response')

      // Save full user info if backend sends it
      const userData = {
        id: res.data?.id,
        name: res.data?.name,
        email: res.data?.email || email.trim(),
      }

      login(token, userData)
      navigate('/dashboard')

    } catch (err) {
      const msg = err.response?.data
      setError(
        typeof msg === 'string'
          ? msg
          : msg?.message || 'Invalid email or password.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--ink)' }}>

      {/* LEFT PANEL */}
      <div style={{
        width: 420,
        flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        padding: '48px 44px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: 'var(--ink)'
          }}>⚡</div>

          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
            TaskFlow
          </span>
        </div>

        <p style={{ fontSize: 11, color: 'var(--muted)', opacity: .4 }}>
          © 2025 TaskFlow
        </p>
      </div>

      {/* RIGHT FORM */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
            Welcome back
          </h1>

          {error && (
            <div style={{
              background: 'rgba(248,113,113,.08)',
              border: '1px solid rgba(248,113,113,.25)',
              borderRadius: 10,
              padding: '11px 14px',
              fontSize: 13,
              color: 'var(--danger)',
              marginBottom: 18
            }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div style={{ marginBottom: 16 }}>
              <label>Email</label>
              <input
                style={inputStyle}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={focus}
                onBlur={blur_}
              />
            </div>

            <div style={{ marginBottom: 26 }}>
              <label>Password</label>
              <input
                style={inputStyle}
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={focus}
                onBlur={blur_}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: 13,
                borderRadius: 12,
                border: 'none',
                background: loading ? 'var(--surface3)' : 'var(--accent)',
                color: 'var(--ink)',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 22 }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 700 }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}