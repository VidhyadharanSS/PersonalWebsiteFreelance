import { createContext, useContext, useState, useEffect } from 'react'

export const THEMES = [
  { id: 'light', label: 'Ivory', color: '#f5f0e8' },
  { id: 'dark', label: 'Midnight', color: '#0d1117' },
  { id: 'ocean', label: 'Ocean', color: '#0b6477' },
  { id: 'forest', label: 'Forest', color: '#315c48' },
]

const ThemeContext = createContext()

function getInitialTheme() {
  const saved = localStorage.getItem('zp-theme')
  if (THEMES.some(({ id }) => id === saved)) return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light'
    localStorage.setItem('zp-theme', theme)
  }, [theme])

  const selectTheme = (nextTheme) => {
    if (THEMES.some(({ id }) => id === nextTheme)) setTheme(nextTheme)
  }
  const toggle = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, themes: THEMES, selectTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
