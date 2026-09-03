// ═══════════════════════════════════════════════════════════════════════
// AUTH PROXY — Google OAuth via Zoho Catalyst
// ═══════════════════════════════════════════════════════════════════════
//
// Initiates the OAuth flow by redirecting to Zoho Accounts.
// After authorization, Zoho redirects back with an auth code.
// ═══════════════════════════════════════════════════════════════════════

const ACCOUNTS_URL = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in'
const CLIENT_ID = process.env.ZOHO_CLIENT_ID
const REDIRECT_URI = process.env.ZOHO_REDIRECT_URI || `${process.env.SITE_URL || ''}/api/auth/callback`
const SCOPES = 'ZohoCatalyst.tables.rows.CREATE,ZohoCatalyst.tables.rows.READ,ZohoCatalyst.tables.rows.UPDATE,ZohoCatalyst.tables.rows.DELETE,ZohoCatalyst.projects.users.READ'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const redirectUrl = req.query.redirect_url || process.env.SITE_URL || ''

  if (!CLIENT_ID) {
    return res.status(500).json({ error: 'OAuth not configured. Set ZOHO_CLIENT_ID in environment.' })
  }

  // Build Zoho OAuth authorization URL
  const authUrl = new URL(`${ACCOUNTS_URL}/oauth/v2/auth`)
  authUrl.searchParams.set('scope', SCOPES)
  authUrl.searchParams.set('client_id', CLIENT_ID)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
  authUrl.searchParams.set('state', Buffer.from(redirectUrl).toString('base64'))
  authUrl.searchParams.set('prompt', 'consent')

  return res.redirect(302, authUrl.toString())
}
