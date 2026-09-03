import { query } from '../lib/database.js'
import { clearSessionCookie, getSession, publicUser } from '../lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const session = getSession(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated' })
  try {
    const user = (await query('SELECT * FROM users WHERE id = ? AND status = ? LIMIT 1', [session.id, 'active']))[0]
    if (!user) {
      clearSessionCookie(res)
      return res.status(401).json({ error: 'Not authenticated' })
    }
    return res.status(200).json({ user: publicUser(user) })
  } catch (error) {
    console.error('[auth/me]', error.code || error.message)
    return res.status(500).json({ error: 'Session validation failed' })
  }
}