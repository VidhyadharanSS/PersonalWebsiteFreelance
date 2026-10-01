import bcrypt from 'bcryptjs'
import { query } from '../lib/database.js'
import { createSession, publicUser, setSessionCookie } from '../lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

  try {
    const rows = await query('SELECT * FROM users WHERE email = ? AND status = ? LIMIT 1', [email, 'active'])
    const user = rows[0]
    if (!user?.password_hash || !await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    setSessionCookie(res, createSession(user))
    return res.status(200).json({ user: publicUser(user) })
  } catch (error) {
    console.error('[auth/signin]', error.code || error.message)
    return res.status(500).json({ error: 'Sign in is temporarily unavailable' })
  }
}