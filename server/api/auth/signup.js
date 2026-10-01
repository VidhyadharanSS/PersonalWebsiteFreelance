import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { execute, query } from '../lib/database.js'
import { createSession, publicUser, setSessionCookie } from '../lib/auth.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  const name = String(req.body?.name || '').trim()
  if (!EMAIL_PATTERN.test(email) || !name) return res.status(400).json({ error: 'A valid name and email are required' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must contain at least 8 characters' })

  try {
    const id = randomUUID()
    const passwordHash = await bcrypt.hash(password, 12)
    await execute('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)', [id, email, passwordHash, name])
    const user = (await query('SELECT * FROM users WHERE id = ?', [id]))[0]
    setSessionCookie(res, createSession(user))
    return res.status(201).json({ user: publicUser(user) })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'An account with this email already exists' })
    console.error('[auth/signup]', error.code || error.message)
    return res.status(500).json({ error: 'Sign up is temporarily unavailable' })
  }
}