import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import { execute, query } from '../lib/database.js'
import { createSession, setSessionCookie } from '../lib/auth.js'

function destination(state) {
  const fallback = process.env.SITE_URL || 'http://localhost:5173'
  try {
    return jwt.verify(state, process.env.JWT_SECRET, { issuer: 'zped-oauth' }).redirectUrl || fallback
  } catch {
    return fallback
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const redirectUrl = destination(req.query.state)
  if (req.query.error) return res.redirect(302, `${redirectUrl}?auth_error=${encodeURIComponent(req.query.error)}`)
  if (!req.query.code) return res.status(400).json({ error: 'No authorization code received' })

  try {
    const siteUrl = process.env.SITE_URL || 'http://localhost:5173'
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: req.query.code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || `${siteUrl}/api/auth/callback`,
        grant_type: 'authorization_code',
      }),
    })
    const tokens = await tokenResponse.json()
    if (!tokenResponse.ok || !tokens.access_token) throw new Error('Google token exchange failed')

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const profile = await profileResponse.json()
    if (!profileResponse.ok || !profile.email || !profile.email_verified) throw new Error('Google email is not verified')

    const email = profile.email.toLowerCase()
    await execute(
      `INSERT INTO users (id, email, name, avatar_url, google_id, auth_provider)
       VALUES (?, ?, ?, ?, ?, 'google')
       ON DUPLICATE KEY UPDATE name = VALUES(name), avatar_url = VALUES(avatar_url),
         google_id = VALUES(google_id), updated_at = CURRENT_TIMESTAMP`,
      [randomUUID(), email, profile.name || email.split('@')[0], profile.picture || null, profile.sub]
    )
    const user = (await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]))[0]
    setSessionCookie(res, createSession(user))
    const target = new URL(redirectUrl)
    target.searchParams.set('auth', 'success')
    return res.redirect(302, target.toString())
  } catch (error) {
    console.error('[auth/callback]', error.message)
    const target = new URL(redirectUrl)
    target.searchParams.set('auth_error', 'google_signin_failed')
    return res.redirect(302, target.toString())
  }
}