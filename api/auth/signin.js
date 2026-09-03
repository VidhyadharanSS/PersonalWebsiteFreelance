// ═══════════════════════════════════════════════════════════════════════
// AUTH PROXY — Sign In via Zoho OAuth Token Exchange
// ═══════════════════════════════════════════════════════════════════════
//
// For Catalyst-hosted apps, auth is handled by Catalyst's embedded login.
// For externally hosted apps (Vercel), we use OAuth token-based auth.
// ═══════════════════════════════════════════════════════════════════════

const CATALYST_API = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.in'
const PROJECT_ID = process.env.CATALYST_PROJECT_ID
const ACCESS_TOKEN = process.env.CATALYST_SERVER_TOKEN

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Verify user exists and get their details via Catalyst API
    // In production with Catalyst hosted auth, this would use session cookies
    // For custom auth, we validate against our Users data store table
    const response = await fetch(
      `${CATALYST_API}/baas/v1/project/${PROJECT_ID}/zcql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Zoho-oauthtoken ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          query: `SELECT * FROM Users WHERE email = '${email.replace(/'/g, "''")}'`,
        }),
      }
    )

    const data = await response.json()

    if (data.status !== 'success' || !data.data?.length) {
      // Fallback: check project users
      const userRes = await fetch(
        `${CATALYST_API}/baas/v1/project/${PROJECT_ID}/project-user?start=0&end=500`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Zoho-oauthtoken ${ACCESS_TOKEN}`,
          },
        }
      )
      const userData = await userRes.json()
      const matchedUser = userData.data?.find(u =>
        u.email_id?.toLowerCase() === email.toLowerCase()
      )

      if (!matchedUser) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      return res.status(200).json({
        user_id: matchedUser.user_id,
        zuid: matchedUser.zuid,
        email_id: matchedUser.email_id,
        first_name: matchedUser.first_name || '',
        last_name: matchedUser.last_name || '',
        user_type: matchedUser.user_type || 'App User',
        access_token: ACCESS_TOKEN,
        expires_in: 3600,
      })
    }

    const userRow = data.data[0]?.Users || data.data[0]
    return res.status(200).json({
      user_id: userRow?.ROWID || userRow?.user_id || '',
      email_id: email,
      first_name: userRow?.name || userRow?.first_name || email.split('@')[0],
      last_name: userRow?.last_name || '',
      access_token: ACCESS_TOKEN,
      expires_in: 3600,
    })
  } catch (error) {
    console.error('Signin error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
