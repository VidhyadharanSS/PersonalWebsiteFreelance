import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'

export default function AuthModal({ open, onClose }) {
  const { signIn, signUp, resetPassword } = useAuth()
  const toast = useToast()
  const [mode, setMode] = useState('signin') // signin | signup | forgot
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) {
      setMode('signin')
      setEmail('')
      setPassword('')
      setName('')
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

  const handleSignIn = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast('Please enter email and password.', 'warning')
    setLoading(true)
    try {
      const data = await signIn(email, password)
      const userName = data.user?.user_metadata?.name || email.split('@')[0]
      toast(`Welcome back, ${userName}!`, 'success')
      onClose()
    } catch (err) {
      toast(err.message || 'Sign in failed.', 'error')
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
              <input type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
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
              <input type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
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
              <a href="#" onClick={e => { e.preventDefault(); setMode('signin') }}>Back to Sign In</a>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
