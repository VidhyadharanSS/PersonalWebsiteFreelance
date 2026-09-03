// ═══════════════════════════════════════════════════════════════════════
// AUTH PROXY — Password Reset via Catalyst API
// ═══════════════════════════════════════════════════════════════════════

const CATALYST_API = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.in'
const PROJECT_ID = process.env.CATALYST_PROJECT_ID
const PROJECT_KEY = process.env.CATALYST_PROJECT_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const response = await fetch(
      `${CATALYST_API}/baas/v1/project/${PROJECT_ID}/project-user/forgotpassword`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'PROJECT_ID': PROJECT_KEY,
        },
        body: JSON.stringify({
          user_details: { email_id: email },
          platform_type: 'web',
        }),
      }
    )

    const data = await response.json()

    if (data.status !== 'success') {
      return res.status(400).json({
        error: data.message || 'Password reset failed',
      })
    }

    return res.status(200).json({
      message: 'Password reset link sent to your email',
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
