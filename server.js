import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dataHandler from './api/data.js'
import sendEmailHandler from './api/send-email.js'
import callbackHandler from './api/auth/callback.js'
import googleHandler from './api/auth/google.js'
import meHandler from './api/auth/me.js'
import resetPasswordHandler from './api/auth/reset-password.js'
import signinHandler from './api/auth/signin.js'
import signoutHandler from './api/auth/signout.js'
import signupHandler from './api/auth/signup.js'

const app = express()
const port = Number(process.env.PORT || 3000)
const root = path.dirname(fileURLToPath(import.meta.url))

app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))

const routes = {
  '/api/data': dataHandler,
  '/api/send-email': sendEmailHandler,
  '/api/auth/callback': callbackHandler,
  '/api/auth/google': googleHandler,
  '/api/auth/me': meHandler,
  '/api/auth/reset-password': resetPasswordHandler,
  '/api/auth/signin': signinHandler,
  '/api/auth/signout': signoutHandler,
  '/api/auth/signup': signupHandler,
}

for (const [route, handler] of Object.entries(routes)) {
  app.all(route, (req, res) => Promise.resolve(handler(req, res)).catch(error => {
    console.error(`[server] ${route}:`, error)
    if (!res.headersSent) res.status(500).json({ error: 'Internal server error' })
  }))
}

if (process.env.NODE_ENV === 'development') {
  const { createServer } = await import('vite')
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' })
  app.use(vite.middlewares)
} else {
  app.use(express.static(path.join(root, 'dist'), { maxAge: '1y', index: false }))
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next()
    return res.sendFile(path.join(root, 'dist', 'index.html'))
  })
}

app.listen(port, () => console.log(`ZPed listening on http://localhost:${port}`))