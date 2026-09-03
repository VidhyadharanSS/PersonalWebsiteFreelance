// ═══════════════════════════════════════════════════════════════════════
// AUTH PROXY — Sign Out
// ═══════════════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Clear any server-side session tokens/cookies
  res.setHeader('Set-Cookie', [
    'catalyst_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict',
    'catalyst_user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict',
  ])

  return res.status(200).json({ message: 'Signed out successfully' })
}
