import { useState, useEffect } from 'react'
import { ToastProvider } from './components/Toast'
import Navbar from './components/Navbar'
import Homepage from './components/Homepage'
import Dashboard from './components/Dashboard'
import RegisterModal from './components/RegisterModal'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { user, loading } = useAuth()
  const [view, setView] = useState('home') // 'home' | 'dashboard'
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!loading && user) setView('dashboard')
  }, [user, loading])

  const handleCTA = () => setModalOpen(true)
  const handleDashboard = () => { setView('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
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
      <Navbar onCTA={handleCTA} onDashboard={handleDashboard} onHome={handleHome} view={view} />
      {view === 'home' ? <Homepage onCTA={handleCTA} /> : <Dashboard />}
      <RegisterModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </ToastProvider>
  )
}
