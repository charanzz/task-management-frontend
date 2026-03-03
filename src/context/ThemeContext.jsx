import React, { createContext, useContext, useState, useEffect } from 'react'

export const THEMES = {
  dark:   { name:'Midnight',    emoji:'🌑', vars:{ '--bg':'#0a0a0f','--surface':'#111118','--surface2':'#1a1a24','--surface3':'#22222f','--border':'rgba(255,255,255,0.06)','--border2':'rgba(255,255,255,0.1)','--text':'#f0f0f8','--muted':'#6b6b8a','--accent':'#7c3aed','--accent2':'#a855f7','--accent3':'#c084fc','--glow':'rgba(124,58,237,0.3)','--danger':'#ff6b6b','--warn':'#ffd93d','--success':'#6bcb77' }},
  purple: { name:'Purple Haze', emoji:'💜', vars:{ '--bg':'#0d0818','--surface':'#150d24','--surface2':'#1e1230','--surface3':'#281a3e','--border':'rgba(168,85,247,0.12)','--border2':'rgba(168,85,247,0.2)','--text':'#f0e8ff','--muted':'#8b6aaa','--accent':'#9333ea','--accent2':'#c026d3','--accent3':'#e879f9','--glow':'rgba(147,51,234,0.4)','--danger':'#ff6b6b','--warn':'#ffd93d','--success':'#6bcb77' }},
  ocean:  { name:'Ocean Blue',  emoji:'🌊', vars:{ '--bg':'#030d1a','--surface':'#071525','--surface2':'#0c1f33','--surface3':'#112840','--border':'rgba(14,165,233,0.1)','--border2':'rgba(14,165,233,0.2)','--text':'#e0f2fe','--muted':'#4a7fa0','--accent':'#0ea5e9','--accent2':'#38bdf8','--accent3':'#7dd3fc','--glow':'rgba(14,165,233,0.35)','--danger':'#ff6b6b','--warn':'#ffd93d','--success':'#6bcb77' }},
  forest: { name:'Forest',      emoji:'🌲', vars:{ '--bg':'#050f08','--surface':'#0a1a0e','--surface2':'#112216','--surface3':'#172d1e','--border':'rgba(34,197,94,0.1)','--border2':'rgba(34,197,94,0.2)','--text':'#dcfce7','--muted':'#4a7a5a','--accent':'#16a34a','--accent2':'#22c55e','--accent3':'#4ade80','--glow':'rgba(34,197,94,0.3)','--danger':'#ff6b6b','--warn':'#ffd93d','--success':'#4ade80' }},
  sunset: { name:'Sunset',      emoji:'🌅', vars:{ '--bg':'#110806','--surface':'#1c100c','--surface2':'#261612','--surface3':'#311d17','--border':'rgba(249,115,22,0.1)','--border2':'rgba(249,115,22,0.2)','--text':'#fff1e6','--muted':'#8a5a42','--accent':'#ea580c','--accent2':'#f97316','--accent3':'#fb923c','--glow':'rgba(249,115,22,0.35)','--danger':'#ff6b6b','--warn':'#ffd93d','--success':'#6bcb77' }},
  light:  { name:'Light',       emoji:'☀️', vars:{ '--bg':'#f5f5fa','--surface':'#ffffff','--surface2':'#f0f0f7','--surface3':'#e8e8f0','--border':'rgba(0,0,0,0.07)','--border2':'rgba(0,0,0,0.12)','--text':'#1a1a2e','--muted':'#7070a0','--accent':'#7c3aed','--accent2':'#a855f7','--accent3':'#7c3aed','--glow':'rgba(124,58,237,0.2)','--danger':'#e53e3e','--warn':'#d69e2e','--success':'#38a169' }},
}

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('taskflow-theme') || 'dark')

  useEffect(() => {
    const vars = THEMES[theme]?.vars || THEMES.dark.vars
    Object.entries(vars).forEach(([k,v]) => document.documentElement.style.setProperty(k, v))
    localStorage.setItem('taskflow-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() { return useContext(ThemeContext) }