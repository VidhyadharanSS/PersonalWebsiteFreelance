// ═══════════════════════════════════════════════════════════════════════
// AUTH PROXY — Sign Up via Zoho Catalyst User Management API
// ═══════════════════════════════════════════════════════════════════════

const CATALYST_API = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.in'
const PROJECT_ID = process.env.CATALYST_PROJECT_ID
const ACCESS_TOKEN = process.env.CATALYST_SERVER_TOKEN // Server-side OAuth token

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }

    // Register user via Catalyst API
    const response = await fetch(
      `${CATALYST_API}/baas/v1/project/${PROJECT_ID}/project-user/signup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Zoho-oauthtoken ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          user_details: {
            first_name: name,
            last_name: '',
            email_id: email,
          },
          platform_type: 'web',
          redirect_url: req.headers.origin || process.env.SITE_URL || '',
        }),
      }
    )

    const data = await response.json()

    if (data.status !== 'success') {
      return res.status(400).json({
        error: data.message || 'Registration failed. Please try again.',
      })
    }

    return res.status(200).json({
      user_id: data.data?.user_details?.user_id,
      zuid: data.data?.user_details?.zuid,
      email_id: email,
      first_name: name,
      message: 'Account created. Please check your email to verify.',
    })
  } catch (error) {
    console.error('Signup error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
