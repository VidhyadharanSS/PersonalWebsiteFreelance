import { useState, useEffect } from 'react'
import { ToastProvider } from './components/Toast'
import Navbar from './components/Navbar'
import Homepage from './components/Homepage'
import Dashboard from './components/Dashboard'
import AdminPanel from './components/AdminPanel'
import RegisterModal from './components/RegisterModal'
import AuthModal from './components/AuthModal'
import { useAuth } from './context/AuthContext'

const ADMIN_EMAILS = ['admin@zped.org', 'vidhyadharanss@gmail.com']

export default function App() {
  const { user, loading } = useAuth()
  const [view, setView] = useState('home')
  const [modalOpen, setModalOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const isAdmin = user && ADMIN_EMAILS.includes(user.email?.toLowerCase())

  useEffect(() => {
    if (!loading && user && view === 'home') {
      // Don't auto-redirect — let user decide
    }
  }, [user, loading])

  const handleCTA = () => setModalOpen(true)
  const handleSignIn = () => setAuthModalOpen(true)
  const handleDashboard = () => { setView('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const handleAdmin = () => { setView('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const handleHome = () => { setView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-body)' }}>
        <div className="btn-loader" style={{ width: 36, height: 36, borderWidth: 3, borderColor: 'var(--gold-pale)', borderTopColor: 'var(--gold)' }} />
      </div>
    )
  }

  return (
    <ToastProvider>
      <Navbar
        onCTA={handleCTA}
        onSignIn={handleSignIn}
        onDashboard={handleDashboard}
        onAdmin={handleAdmin}
        onHome={handleHome}
        view={view}
        isAdmin={isAdmin}
      />
      {view === 'home' && <Homepage onCTA={handleCTA} />}
      {view === 'dashboard' && <Dashboard />}
      {view === 'admin' && isAdmin && <AdminPanel />}
      <RegisterModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </ToastProvider>
  )
}
