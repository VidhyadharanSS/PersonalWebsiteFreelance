import { useState, useEffect } from 'react'
import { Sun, Moon, LogIn, LogOut, LayoutDashboard, ShieldCheck, Home, Menu, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ onCTA, onSignIn, onDashboard, onAdmin, onHome, view, isAdmin }) {
  const { theme, toggle } = useTheme()
  const { user, signOut, getUserName, getUserAvatar } = useAuth()
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

  useEffect(() => { setMobileOpen(false) }, [view])

  useEffect(() => {
    if (!mobileOpen) return
    const handle = (e) => {
      if (!e.target.closest('.mobile-drawer')) setMobileOpen(false)
    }
    document.addEventListener('click', handle)
    return () => document.removeEventListener('click', handle)
  }, [mobileOpen])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const scrollTo = (id) => {
    setMobileOpen(false)
    if (view !== 'home') {
      onHome()
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 300)
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
    setMobileOpen(false)
    try {
      await signOut()
      onHome()
    } catch { /* silent */ }
  }

  const avatarUrl = getUserAvatar()

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-container">
          {/* Brand */}
          <a href="#home" className="nav-brand" onClick={e => { e.preventDefault(); scrollTo('home') }}>
            <img src="/logo-icon.jpeg" alt="Zenith Pranavi" className="brand-logo-img" />
            <span className="brand-name">Zenith Pranavi</span>
          </a>

          {/* Desktop Nav Links */}
          <ul className="nav-links-desktop">
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

          {/* Desktop Actions */}
          <div className="nav-actions-desktop">
            <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
              {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <div className="nav-user-group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="nav-user-avatar-img" />
                ) : (
                  <div className="nav-user-avatar">{getUserName().charAt(0).toUpperCase()}</div>
                )}
                <span className="nav-user-name">{getUserName()}</span>
                {view !== 'dashboard' && (
                  <button className="btn btn-outline btn-nav btn-sm" onClick={onDashboard}>
                    <LayoutDashboard size={14} /> Dashboard
                  </button>
                )}
                {isAdmin && view !== 'admin' && (
                  <button className="btn btn-outline btn-nav btn-sm admin-btn" onClick={onAdmin}>
                    <ShieldCheck size={14} /> Admin
                  </button>
                )}
                {(view === 'dashboard' || view === 'admin') && (
                  <button className="btn btn-outline btn-nav btn-sm" onClick={onHome}>
                    <Home size={14} /> Home
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            ) : (
              <div className="nav-auth-group">
                <button className="btn btn-outline btn-nav btn-sm" onClick={onSignIn}>
                  <LogIn size={14} /> Sign In
                </button>
                <button className="btn btn-primary btn-nav btn-cta-nav" onClick={() => { onCTA('hero') }}>
                  <span className="btn-text-full">Free Discovery Call</span>
                  <span className="btn-text-short">Book Call</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile: theme + hamburger */}
          <div className="nav-mobile-right">
            <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
              {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="mobile-toggle"
              onClick={(e) => { e.stopPropagation(); setMobileOpen(!mobileOpen) }}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay + Drawer */}
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}
      <div className={`mobile-drawer${mobileOpen ? ' open' : ''}`}>
        <div className="mobile-drawer-header">
          <img src="/logo-icon.jpeg" alt="ZP" className="mobile-drawer-logo" />
          <span className="brand-name">Zenith Pranavi</span>
          <button className="mobile-drawer-close" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {user && (
          <div className="mobile-user-info">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="nav-user-avatar-img" />
            ) : (
              <div className="nav-user-avatar">{getUserName().charAt(0).toUpperCase()}</div>
            )}
            <div>
              <strong>{getUserName()}</strong>
              <span>{user.email}</span>
            </div>
          </div>
        )}

        <ul className="mobile-nav-links">
          {navItems.map(item => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`mobile-nav-link${activeSection === item.id ? ' active' : ''}`}
                onClick={e => { e.preventDefault(); scrollTo(item.id) }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="mobile-drawer-divider" />

        <div className="mobile-drawer-actions">
          {user ? (
            <>
              {view !== 'dashboard' && (
                <button className="mobile-action-btn" onClick={() => { setMobileOpen(false); onDashboard() }}>
                  <LayoutDashboard size={18} /> Dashboard
                </button>
              )}
              {isAdmin && view !== 'admin' && (
                <button className="mobile-action-btn mobile-action-admin" onClick={() => { setMobileOpen(false); onAdmin() }}>
                  <ShieldCheck size={18} /> Admin Panel
                </button>
              )}
              {(view === 'dashboard' || view === 'admin') && (
                <button className="mobile-action-btn" onClick={() => { setMobileOpen(false); onHome() }}>
                  <Home size={18} /> Home
                </button>
              )}
              <div className="mobile-drawer-divider" />
              <button className="mobile-action-btn mobile-action-danger" onClick={handleLogout}>
                <LogOut size={18} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <button className="mobile-action-btn" onClick={() => { setMobileOpen(false); onSignIn() }}>
                <LogIn size={18} /> Sign In / Sign Up
              </button>
              <button className="btn btn-primary btn-full mobile-cta-btn" onClick={() => { setMobileOpen(false); onCTA('hero') }}>
                Free Discovery Call
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
