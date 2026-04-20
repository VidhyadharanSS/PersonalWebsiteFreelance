import { useState } from 'react'
import { ToastProvider } from './components/Toast'
import Navbar from './components/Navbar'
import Homepage from './components/Homepage'
import Dashboard from './components/Dashboard'
import AdminPanel from './components/AdminPanel'
import RegisterModal from './components/RegisterModal'
import AuthModal from './components/AuthModal'
import RefundModal from './components/RefundModal'
import { useAuth } from './context/AuthContext'
import { ADMIN_EMAILS } from './lib/supabase'

export default function App() {
  const { user, loading } = useAuth()
  const [view, setView] = useState('home')
  const [modalOpen, setModalOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [refundModalOpen, setRefundModalOpen] = useState(false)

  const isAdmin = user && ADMIN_EMAILS.includes(user.email?.toLowerCase())

  const handleCTA = () => setModalOpen(true)
  const handleSignIn = () => setAuthModalOpen(true)
  const handleRefund = () => setRefundModalOpen(true)
  const handleDashboard = () => { setView('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const handleAdmin = () => { setView('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const handleHome = () => { setView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p className="loading-text">Zenith Pranavi</p>
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
      {view === 'home' && <Homepage onCTA={handleCTA} onRefund={handleRefund} />}
      {view === 'dashboard' && <Dashboard />}
      {view === 'admin' && isAdmin && <AdminPanel />}
      <RegisterModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <RefundModal open={refundModalOpen} onClose={() => setRefundModalOpen(false)} />
    </ToastProvider>
  )
}
