// ═══════════════════════════════════════════════════════════════════════
// AUTH CONTEXT — Zoho Catalyst Authentication
// ═══════════════════════════════════════════════════════════════════════
//
// Supports two authentication modes:
//   1. 'catalyst' — Full Catalyst hosted/embedded auth (when deployed on Catalyst)
//   2. 'custom'   — Custom email/password auth using Catalyst REST API
//
// For the 'custom' mode (default), credentials are verified via a serverless
// function that proxies to Catalyst's user management API.
//
// User data is stored in sessionStorage for the session lifetime.
// ═══════════════════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { catalyst, CATALYST_CONFIG, SITE_URL, ADMIN_EMAILS } from '../lib/catalyst'

const AuthContext = createContext()

// Session storage key
const USER_KEY = 'catalyst_user'

function persistUser(user) {
  if (user) {
    const serializable = {
      id: user.id || user.user_id || user.zuid || '',
      user_id: user.user_id || user.id || '',
      email: user.email || user.email_id || '',
      email_id: user.email_id || user.email || '',
      name: user.name || user.first_name || '',
      first_name: user.first_name || user.name || '',
      last_name: user.last_name || '',
      full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      avatar_url: user.avatar_url || user.picture || null,
      role: user.role || user.user_type || 'App User',
      user_metadata: user.user_metadata || {
        name: user.name || user.first_name || '',
        full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        avatar_url: user.avatar_url || null,
      },
    }
    sessionStorage.setItem(USER_KEY, JSON.stringify(serializable))
    localStorage.setItem(USER_KEY, JSON.stringify(serializable))
    return serializable
  }
  sessionStorage.removeItem(USER_KEY)
  localStorage.removeItem(USER_KEY)
  return null
}

function loadUser() {
  try {
    const stored = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // On mount, restore user from session
    const stored = loadUser()
    if (stored) {
      setUser(stored)
    }
    setLoading(false)
  }, [])

  /**
   * Sign up a new user
   * In custom mode: register via serverless API proxy → Catalyst User Management
   */
  const signUp = useCallback(async (email, password, name) => {
    // Call our serverless proxy which handles Catalyst user signup + password setup
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Sign up failed')

    const userData = persistUser({
      id: data.user_id || data.zuid || email,
      user_id: data.user_id || data.zuid || '',
      email: email,
      email_id: email,
      name: name,
      first_name: name,
      full_name: name,
    })

    setUser(userData)
    return data
  }, [])

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Sign in failed')

    // Store access token for API calls
    if (data.access_token) {
      catalyst.setAccessToken(data.access_token, data.expires_in || 3600)
    }

    const userData = persistUser({
      id: data.user_id || data.zuid || email,
      user_id: data.user_id || '',
      email: email,
      email_id: data.email_id || email,
      name: data.first_name || data.name || email.split('@')[0],
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || email.split('@')[0],
      avatar_url: data.avatar_url || null,
      role: data.user_type || 'App User',
    })

    setUser(userData)
    return data
  }, [])

  /**
   * Sign in with Google (OAuth)
   * Redirects to Catalyst's Google OAuth flow via serverless proxy
   */
  const signInWithGoogle = useCallback(async () => {
    // Redirect to our serverless proxy that initiates Catalyst OAuth
    const redirectUrl = encodeURIComponent(`${SITE_URL}/auth/callback`)
    window.location.href = `/api/auth/google?redirect_url=${redirectUrl}`
  }, [])

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch {
      // Sign out locally even if server call fails
    }
    persistUser(null)
    setUser(null)
  }, [])

  /**
   * Reset password
   */
  const resetPassword = useCallback(async (email) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Password reset failed')
    return data
  }, [])

  /**
   * Get display name
   */
  const getUserName = useCallback(() => {
    if (!user) return 'User'
    return user.name
      || user.full_name
      || user.first_name
      || user.email?.split('@')[0]
      || 'User'
  }, [user])

  /**
   * Get avatar URL
   */
  const getUserAvatar = useCallback(() => {
    if (!user) return null
    return user.avatar_url
      || user.user_metadata?.avatar_url
      || null
  }, [user])

  /**
   * Check if user is admin
   */
  const isAdmin = useCallback(() => {
    if (!user) return false
    const email = user.email || user.email_id || ''
    return ADMIN_EMAILS.includes(email.toLowerCase())
  }, [user])

  return (
    <AuthContext.Provider value={{
      user, loading,
      signUp, signIn, signInWithGoogle, signOut, resetPassword,
      getUserName, getUserAvatar, isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
