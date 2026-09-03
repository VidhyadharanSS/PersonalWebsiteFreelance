import jwt from 'jsonwebtoken'

const COOKIE_NAME = 'zped_session'
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'zenithpranavi786@gmail.com,v72653666@gmail.com,admin@zped.org,vidhyadharanss@gmail.com,sanmugapriyaa786@gmail.com,hvdrksp2003@gmail.com')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean)

function jwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return secret
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(value => {
    const separator = value.indexOf('=')
    if (separator < 0) return [value.trim(), '']
    return [value.slice(0, separator).trim(), decodeURIComponent(value.slice(separator + 1))]
  }).filter(([key]) => key))
}

export function createSession(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    jwtSecret(),
    { expiresIn: '7d', issuer: 'zped' }
  )
}

export function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`)
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
}

export function getSession(req) {
  const token = parseCookies(req.headers.cookie || '')[COOKIE_NAME]
  if (!token) return null
  try {
    return jwt.verify(token, jwtSecret(), { issuer: 'zped' })
  } catch {
    return null
  }
}

export function requireUser(req, res) {
  const user = getSession(req)
  if (!user) res.status(401).json({ error: 'Authentication required' })
  return user
}

export function requireAdmin(req, res) {
  const user = requireUser(req, res)
  if (!user) return null
  if (user.role !== 'admin' && !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    res.status(403).json({ error: 'Administrator access required' })
    return null
  }
  return user
}

export function publicUser(user) {
  return {
    id: user.id,
    user_id: user.id,
    email: user.email,
    email_id: user.email,
    name: user.name,
    full_name: user.name,
    avatar_url: user.avatar_url || null,
    role: user.role || 'student',
  }
}