import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, SITE_URL } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        // Handle OAuth callback — exchange code for session (PKCE flow)
        const params = new URLSearchParams(window.location.search)
        const hash = window.location.hash

        if (params.has('code')) {
          const { error } = await supabase.auth.exchangeCodeForSession(params.get('code'))
          if (error) console.warn('Code exchange error:', error.message)
          // Clean URL
          window.history.replaceState(null, '', window.location.pathname)
        } else if (hash && (hash.includes('access_token') || hash.includes('type=signup'))) {
          // Implicit flow fallback
          window.history.replaceState(null, '', window.location.pathname)
        }
      } catch (e) {
        console.warn('Auth redirect handling:', e)
      }

      // Get existing session
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    init()

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, full_name: name },
        emailRedirectTo: SITE_URL
      }
    })
    if (error) throw error
    return data
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: SITE_URL,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
  }, [])

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: SITE_URL
    })
    if (error) throw error
  }, [])

  const getUserName = useCallback(() => {
    if (!user) return 'User'
    return user.user_metadata?.name
      || user.user_metadata?.full_name
      || user.email?.split('@')[0]
      || 'User'
  }, [user])

  const getUserAvatar = useCallback(() => {
    if (!user) return null
    return user.user_metadata?.avatar_url
      || user.user_metadata?.picture
      || null
  }, [user])

  return (
    <AuthContext.Provider value={{
      user, loading,
      signUp, signIn, signInWithGoogle, signOut, resetPassword,
      getUserName, getUserAvatar
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
