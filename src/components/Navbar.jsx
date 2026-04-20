import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ onCTA, onDashboard, onHome, view }) {
  const { theme, toggle } = useTheme()
  const { user, signOut, getUserName } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
      if (view !== 'home') return
      const sections = ['home', 'why', 'programs', 'pricing', 'how-it-works', 'contact']
      const pos = window.scrollY + 160
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i])
        if (el && el.offsetTop <= pos) { setActiveSection(sections[i]); break }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [view])

  const scrollTo = (id) => {
    setMobileOpen(false)
    if (view !== 'home') {
      onHome()
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 200)
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
    setActiveSection(id)
  }

  const navItems = [
    { id: 'why', label: 'Why Us' },
    { id: 'programs', label: 'Programs' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'contact', label: 'Contact' }
  ]

  const handleLogout = async () => {
    try {
      await signOut()
      onHome()
    } catch { /* silent */ }
  }

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-container">
        <a href="#home" className="nav-brand" onClick={e => { e.preventDefault(); scrollTo('home') }}>
          <img src="/logo-icon.jpeg" alt="Zenith Pranavi" className="brand-logo-img" />
          <span className="brand-name">Zenith Pranavi</span>
        </a>

        <ul className={`nav-links${mobileOpen ? ' active' : ''}`}>
          {navItems.map(item => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`nav-link${activeSection === item.id ? ' active' : ''}`}
                onClick={e => { e.preventDefault(); scrollTo(item.id) }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
            {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {!user ? (
            <button className="btn btn-primary btn-nav" onClick={() => onCTA('hero')}>
              FREE DISCOVERY CALL
            </button>
          ) : (
            <div className="user-menu-row">
              <div className="user-avatar">{getUserName().charAt(0).toUpperCase()}</div>
              <span className="user-greeting">Hello, <strong>{getUserName()}</strong></span>
              <button className="btn btn-outline btn-nav btn-sm" onClick={onDashboard}>Dashboard</button>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>

        <button
          className={`mobile-toggle${mobileOpen ? ' active' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}
