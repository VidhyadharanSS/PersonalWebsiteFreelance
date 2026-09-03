import { useState, useEffect, lazy, Suspense, useCallback } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import Navbar from './components/Navbar'
import Homepage from './components/Homepage'
import NotFound from './components/NotFound'
import OfflineBanner from './components/OfflineBanner'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'
import RegisterModal from './components/RegisterModal'
import AuthModal from './components/AuthModal'
import RefundModal from './components/RefundModal'
import SEOHead from './components/SEOHead'
import { useAuth } from './context/AuthContext'
import { ADMIN_EMAILS } from './lib/catalyst'

// Lazy load heavy components for code splitting
const LearnPage = lazy(() => import('./components/LearnPage'))
const Dashboard = lazy(() => import('./components/Dashboard'))
const AdminPanel = lazy(() => import('./components/AdminPanel'))

function LazyFallback() {
  return <LoadingSpinner message="Loading page..." />
}

export default function App() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [modalOpen, setModalOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [refundModalOpen, setRefundModalOpen] = useState(false)

  const isAdmin = user && ADMIN_EMAILS.includes(user.email?.toLowerCase())

  // Derive the current view from the route for SEO and navbar
  const getView = useCallback(() => {
    const path = location.pathname
    if (path.startsWith('/learn')) return 'learn'
    if (path === '/dashboard') return 'dashboard'
    if (path === '/admin') return 'admin'
    if (path === '/') return 'home'
    return 'home'
  }, [location.pathname])

  const view = getView()

  // Redirect away from protected routes when signed out
  useEffect(() => {
    if (!loading && !user && (location.pathname === '/dashboard' || location.pathname === '/admin')) {
      navigate('/', { replace: true })
    }
  }, [user, loading, location.pathname, navigate])

  const handleCTA = useCallback(() => setModalOpen(true), [])
  const handleSignIn = useCallback(() => setAuthModalOpen(true), [])
  const handleRefund = useCallback(() => setRefundModalOpen(true), [])

  const handleDashboard = useCallback(() => {
    navigate('/dashboard')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [navigate])

  const handleAdmin = useCallback(() => {
    navigate('/admin')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [navigate])

  const handleHome = useCallback(() => {
    navigate('/')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [navigate])

  const handleLearn = useCallback((slug) => {
    navigate(slug ? `/learn/${slug}` : '/learn')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [navigate])

  const handleSelectArticle = useCallback((slug) => {
    navigate(`/learn/${slug}`)
    setTimeout(() => document.getElementById('article')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [navigate])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo-wrap">
          <img src="/logo-icon.jpeg" alt="ZP" className="loading-logo" />
        </div>
        <div className="loading-spinner" />
        <p className="loading-text">zped <span style={{ fontSize: '0.5em', opacity: 0.7 }}>by Zenith Pranavi</span></p>
      </div>
    )
  }

  return (
    <ToastProvider>
      <SEOHead view={view} />
      <OfflineBanner />
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
        <ErrorBoundary>
          <Suspense fallback={<LazyFallback />}>
            <Routes>
              <Route
                path="/"
                element={<Homepage onCTA={handleCTA} onRefund={handleRefund} />}
              />
              <Route
                path="/learn"
                element={
                  <LearnPage
                    selectedSlug="biomolecules"
                    onSelectArticle={handleSelectArticle}
                    onHome={handleHome}
                  />
                }
              />
              <Route
                path="/learn/:slug"
                element={
                  <LearnPageWrapper
                    onSelectArticle={handleSelectArticle}
                    onHome={handleHome}
                  />
                }
              />
              <Route
                path="/dashboard"
                element={user ? <Dashboard /> : null}
              />
              <Route
                path="/admin"
                element={isAdmin ? <AdminPanel /> : null}
              />
              <Route
                path="*"
                element={<NotFound onHome={handleHome} onLearn={() => handleLearn()} />}
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
      <RegisterModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <RefundModal open={refundModalOpen} onClose={() => setRefundModalOpen(false)} />
    </ToastProvider>
  )
}

/**
 * Wrapper to extract slug from URL params for LearnPage
 */
function LearnPageWrapper({ onSelectArticle, onHome }) {
  const { slug } = useParams()
  return (
    <LearnPage
      selectedSlug={slug || 'biomolecules'}
      onSelectArticle={onSelectArticle}
      onHome={onHome}
    />
  )
}

// Need useParams for the wrapper
import { useParams } from 'react-router-dom'
