import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, SITE_URL } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      // Handle OAuth / email confirmation redirects
      const hash = window.location.hash
      const params = new URLSearchParams(window.location.search)

      if (hash.includes('access_token') || hash.includes('type=signup') || params.has('code')) {
        try {
          if (params.has('code')) {
            await supabase.auth.exchangeCodeForSession(params.get('code'))
          }
          window.history.replaceState(null, '', window.location.pathname)
        } catch (e) {
          console.warn('Auth redirect handling:', e)
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, name) => {
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
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signInWithGoogle = async () => {
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
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: SITE_URL })
    if (error) throw error
  }

  const getUserName = () => {
    if (!user) return 'User'
    return user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  }

  const getUserAvatar = () => {
    if (!user) return null
    return user.user_metadata?.avatar_url || user.user_metadata?.picture || null
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, signOut, resetPassword, getUserName, getUserAvatar }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
