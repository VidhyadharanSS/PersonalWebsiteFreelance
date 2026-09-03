import { createHash, randomBytes, randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { execute, query } from '../lib/database.js'

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const email = String(req.body?.email || '').trim().toLowerCase()
  const token = String(req.body?.token || '')
  const password = String(req.body?.password || '')

  try {
    if (token && password) {
      if (password.length < 8) return res.status(400).json({ error: 'Password must contain at least 8 characters' })
      const rows = await query(
        'SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1',
        [hashToken(token)]
      )
      if (!rows.length) return res.status(400).json({ error: 'This reset link is invalid or expired' })
      await execute('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(password, 12), rows[0].user_id])
      await execute('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [rows[0].id])
      return res.status(200).json({ ok: true })
    }

    const user = (await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]))[0]
    if (user) {
      const rawToken = randomBytes(32).toString('hex')
      await execute(
        'INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
        [randomUUID(), user.id, hashToken(rawToken)]
      )
      const resetUrl = `${process.env.SITE_URL || 'http://localhost:5173'}/?reset_token=${rawToken}`
      if (process.env.RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'Zenith Pranavi <onboarding@resend.dev>',
            to: email,
            subject: 'Reset your ZPed password',
            html: `<p>Use this link within one hour to reset your password:</p><p><a href="${resetUrl}">Reset password</a></p>`,
          }),
        })
      }
    }
    return res.status(200).json({ ok: true, message: 'If that account exists, a reset link has been sent.' })
  } catch (error) {
    console.error('[auth/reset-password]', error.code || error.message)
    return res.status(500).json({ error: 'Password reset is temporarily unavailable' })
  }
}