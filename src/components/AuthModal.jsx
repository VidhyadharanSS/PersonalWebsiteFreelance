import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { Eye, EyeOff } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function AuthModal({ open, onClose }) {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()
  const toast = useToast()
  const [mode, setMode] = useState('signin')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    if (open) {
      setMode('signin')
      setEmail('')
      setPassword('')
      setName('')
      setShowPw(false)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      // Redirect happens automatically — modal will close on page return
    } catch (err) {
      toast(err.message || 'Google sign in failed.', 'error')
      setGoogleLoading(false)
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast('Please enter email and password.', 'warning')
    setLoading(true)
    try {
      const data = await signIn(email, password)
      const userName = data.user?.user_metadata?.name || data.user?.user_metadata?.full_name || email.split('@')[0]
      toast(`Welcome back, ${userName}!`, 'success')
      onClose()
    } catch (err) {
      toast(err.message || 'Sign in failed. Check your email and password.', 'error')
    } finally { setLoading(false) }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) return toast('Please fill all fields.', 'warning')
    if (password.length < 6) return toast('Password must be at least 6 characters.', 'warning')
    setLoading(true)
    try {
      await signUp(email, password, name)
      toast(`Account created! Welcome, ${name}!`, 'success')
      onClose()
    } catch (err) {
      toast(err.message || 'Sign up failed.', 'error')
    } finally { setLoading(false) }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    if (!email) return toast('Please enter your email.', 'warning')
    setLoading(true)
    try {
      await resetPassword(email)
      toast('Password reset link sent! Check your email.', 'success')
    } catch (err) {
      toast(err.message || 'Failed to send reset link.', 'error')
    } finally { setLoading(false) }
  }

  if (!open) return null

  return (
    <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-auth" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        <div className="auth-modal-header">
          <img src="/logo-icon.jpeg" alt="ZP" className="auth-modal-logo" />
          <h3 className="auth-modal-title">
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h3>
          <p className="auth-modal-sub">
            {mode === 'signin' && 'Sign in to access your dashboard'}
            {mode === 'signup' && 'Join Zenith Pranavi today'}
            {mode === 'forgot' && 'Enter your email to receive a reset link'}
          </p>
        </div>

        {/* Google Sign In — shown for signin and signup */}
        {mode !== 'forgot' && (
          <>
            <button
              className="btn-google-signin"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <span className="btn-loader" />
              ) : (
                <>
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="auth-divider">
              <span>or use email</span>
            </div>
          </>
        )}

        {mode !== 'forgot' && (
          <div className="reg-auth-tabs">
            <button
              className={`reg-auth-tab${mode === 'signin' ? ' active' : ''}`}
              onClick={() => setMode('signin')}
            >Sign In</button>
            <button
              className={`reg-auth-tab${mode === 'signup' ? ' active' : ''}`}
              onClick={() => setMode('signup')}
            >Sign Up</button>
          </div>
        )}

        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="btn-loader" /> : 'Sign In'}
            </button>
            <p className="auth-link-row">
              <a href="#" onClick={e => { e.preventDefault(); setMode('forgot') }}>Forgot Password?</a>
            </p>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="btn-loader" /> : 'Create Account'}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="btn-loader" /> : 'Send Reset Link'}
            </button>
            <p className="auth-link-row">
              <a href="#" onClick={e => { e.preventDefault(); setMode('signin') }}>← Back to Sign In</a>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
