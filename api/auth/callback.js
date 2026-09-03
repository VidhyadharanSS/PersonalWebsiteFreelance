// ═══════════════════════════════════════════════════════════════════════
// AUTH CALLBACK — Exchange OAuth code for tokens
// ═══════════════════════════════════════════════════════════════════════

const ACCOUNTS_URL = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in'
const CLIENT_ID = process.env.ZOHO_CLIENT_ID
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET
const REDIRECT_URI = process.env.ZOHO_REDIRECT_URI || `${process.env.SITE_URL || ''}/api/auth/callback`
const CATALYST_API = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.in'
const PROJECT_ID = process.env.CATALYST_PROJECT_ID

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, state, error } = req.query

  if (error) {
    const redirectUrl = state ? Buffer.from(state, 'base64').toString() : '/'
    return res.redirect(302, `${redirectUrl}?auth_error=${error}`)
  }

  if (!code) {
    return res.status(400).json({ error: 'No authorization code received' })
  }

  try {
    // Exchange code for access + refresh tokens
    const tokenRes = await fetch(`${ACCOUNTS_URL}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      const redirectUrl = state ? Buffer.from(state, 'base64').toString() : '/'
      return res.redirect(302, `${redirectUrl}?auth_error=token_exchange_failed`)
    }

    // Fetch user details using the access token
    const userRes = await fetch(
      `${CATALYST_API}/baas/v1/project/${PROJECT_ID}/project-user/current`,
      {
        headers: { 'Authorization': `Zoho-oauthtoken ${tokenData.access_token}` },
      }
    )

    const userData = await userRes.json()
    const user = userData.data || {}

    // Build redirect URL with user info as hash params (secure, not logged by server)
    const redirectUrl = state ? Buffer.from(state, 'base64').toString() : '/'
    const userInfo = {
      user_id: user.user_id || '',
      email: user.email_id || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.user_type || 'App User',
    }

    const hashParams = new URLSearchParams({
      access_token: tokenData.access_token,
      expires_in: String(tokenData.expires_in || 3600),
      user: Buffer.from(JSON.stringify(userInfo)).toString('base64'),
    })

    return res.redirect(302, `${redirectUrl}#${hashParams.toString()}`)
  } catch (err) {
    console.error('OAuth callback error:', err)
    const redirectUrl = state ? Buffer.from(state, 'base64').toString() : '/'
    return res.redirect(302, `${redirectUrl}?auth_error=callback_failed`)
  }
}
