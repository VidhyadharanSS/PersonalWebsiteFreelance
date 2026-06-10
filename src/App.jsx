import { useState, useEffect } from 'react'
import { ToastProvider } from './components/Toast'
import Navbar from './components/Navbar'
import Homepage from './components/Homepage'
import LearnPage from './components/LearnPage'
import Dashboard from './components/Dashboard'
import AdminPanel from './components/AdminPanel'
import RegisterModal from './components/RegisterModal'
import AuthModal from './components/AuthModal'
import RefundModal from './components/RefundModal'
import SEOHead from './components/SEOHead'
import { useAuth } from './context/AuthContext'
import { ADMIN_EMAILS } from './lib/supabase'

function getRouteState() {
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  if (path.startsWith('/learn')) {
    const slug = path.split('/')[2] || 'biomolecules'
    return { view: 'learn', learnSlug: slug }
  }
  if (path === '/dashboard') return { view: 'dashboard', learnSlug: 'biomolecules' }
  if (path === '/admin') return { view: 'admin', learnSlug: 'biomolecules' }
  return { view: 'home', learnSlug: 'biomolecules' }
}

export default function App() {
  const { user, loading } = useAuth()
  const initialRoute = getRouteState()
  const [view, setView] = useState(initialRoute.view)
  const [learnSlug, setLearnSlug] = useState(initialRoute.learnSlug)
  const [modalOpen, setModalOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [refundModalOpen, setRefundModalOpen] = useState(false)

  const isAdmin = user && ADMIN_EMAILS.includes(user.email?.toLowerCase())

  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteState()
      setView(route.view)
      setLearnSlug(route.learnSlug)
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const updatePath = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
    }
  }

  // Reset to home when user signs out
  useEffect(() => {
    if (!user && (view === 'dashboard' || view === 'admin')) {
      setView('home')
      window.history.replaceState({}, '', '/')
    }
  }, [user, view])

  const handleCTA = () => setModalOpen(true)
  const handleSignIn = () => setAuthModalOpen(true)
  const handleRefund = () => setRefundModalOpen(true)
  const handleDashboard = () => { setView('dashboard'); updatePath('/dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const handleAdmin = () => { setView('admin'); updatePath('/admin'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const handleHome = () => { setView('home'); updatePath('/'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const handleLearn = (slug) => {
    const nextSlug = slug || 'biomolecules'
    setView('learn')
    setLearnSlug(nextSlug)
    updatePath(slug ? `/learn/${slug}` : '/learn')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handleSelectArticle = (slug) => {
    setView('learn')
    setLearnSlug(slug)
    updatePath(`/learn/${slug}`)
    setTimeout(() => document.getElementById('article')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo-wrap">
          <img src="/logo-icon.jpeg" alt="ZP" className="loading-logo" />
        </div>
        <div className="loading-spinner" />
        <p className="loading-text">zped <span style={{fontSize:'0.5em',opacity:0.7}}>by Zenith Pranavi</span></p>
      </div>
    )
  }

  return (
    <ToastProvider>
      <SEOHead view={view} />
      <Navbar
        onCTA={handleCTA}
        onSignIn={handleSignIn}
        onDashboard={handleDashboard}
        onAdmin={handleAdmin}
        onHome={handleHome}
        onLearn={() => handleLearn()}
        view={view}
        isAdmin={isAdmin}
      />
      <div className="page-content">
        {view === 'home' && <Homepage onCTA={handleCTA} onRefund={handleRefund} />}
        {view === 'learn' && <LearnPage selectedSlug={learnSlug} onSelectArticle={handleSelectArticle} onHome={handleHome} />}
        {view === 'dashboard' && user && <Dashboard />}
        {view === 'admin' && isAdmin && <AdminPanel />}
      </div>
      <RegisterModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <RefundModal open={refundModalOpen} onClose={() => setRefundModalOpen(false)} />
    </ToastProvider>
  )
}
