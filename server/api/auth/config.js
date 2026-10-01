export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  return res.status(200).json({
    googleEnabled: Boolean(
      process.env.GOOGLE_CLIENT_ID
      && process.env.GOOGLE_CLIENT_SECRET
      && process.env.JWT_SECRET
    ),
  })
}