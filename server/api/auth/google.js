import jwt from 'jsonwebtoken'

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Google sign-in is not configured' })
  }

  const siteUrl = process.env.SITE_URL || 'http://localhost:5173'
  let redirectUrl = siteUrl
  try {
    const requested = new URL(req.query.redirect_url || siteUrl)
    if (requested.origin === new URL(siteUrl).origin) redirectUrl = requested.toString()
  } catch { /* use the configured site URL */ }

  const state = jwt.sign({ redirectUrl }, process.env.JWT_SECRET, { expiresIn: '10m', issuer: 'zped-oauth' })
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', process.env.GOOGLE_REDIRECT_URI || `${siteUrl}/api/auth/callback`)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('prompt', 'select_account')
  return res.redirect(302, authUrl.toString())
}