import dataHandler from '../server/api/data.js'
import sendEmailHandler from '../server/api/send-email.js'
import callbackHandler from '../server/api/auth/callback.js'
import authConfigHandler from '../server/api/auth/config.js'
import googleHandler from '../server/api/auth/google.js'
import meHandler from '../server/api/auth/me.js'
import resetPasswordHandler from '../server/api/auth/reset-password.js'
import signinHandler from '../server/api/auth/signin.js'
import signoutHandler from '../server/api/auth/signout.js'
import signupHandler from '../server/api/auth/signup.js'
import wikiHandler from '../server/api/wiki.js'

const routes = new Map([
  ['/api/data', dataHandler],
  ['/api/send-email', sendEmailHandler],
  ['/api/auth/callback', callbackHandler],
  ['/api/auth/config', authConfigHandler],
  ['/api/auth/google', googleHandler],
  ['/api/auth/me', meHandler],
  ['/api/auth/reset-password', resetPasswordHandler],
  ['/api/auth/signin', signinHandler],
  ['/api/auth/signout', signoutHandler],
  ['/api/auth/signup', signupHandler],
  ['/api/wiki', wikiHandler],
])

export default async function handler(req, res) {
  const pathname = new URL(req.url, 'https://zped.org').pathname.replace(/\/$/, '') || '/'
  const routeHandler = routes.get(pathname)
  if (!routeHandler) return res.status(404).json({ error: 'API route not found' })
  return routeHandler(req, res)
}
