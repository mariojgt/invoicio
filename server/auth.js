import crypto from 'node:crypto'

const USERNAME = process.env.AUTH_USERNAME || 'admin'
const PASSWORD = process.env.AUTH_PASSWORD || 'invoicio'
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
const COOKIE_NAME = 'invoicio_session'

if (PASSWORD === 'invoicio') {
  console.warn('[invoicio] Using the default password — set AUTH_PASSWORD before exposing this to a network!')
}
if (!process.env.SESSION_SECRET) {
  console.warn('[invoicio] SESSION_SECRET not set — sessions will be invalidated on every restart.')
}

// Constant-time string comparison (hash first so lengths always match)
export function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest()
  const hb = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(ha, hb)
}

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
}

function createToken(username) {
  const payload = Buffer.from(JSON.stringify({ u: username, exp: Date.now() + SESSION_TTL_MS })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function verifyToken(token) {
  if (typeof token !== 'string') return null
  const dot = token.lastIndexOf('.')
  if (dot === -1) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!safeEqual(sig, sign(payload))) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!data.exp || data.exp < Date.now()) return null
    return data
  } catch {
    return null
  }
}

function getSession(req) {
  const header = req.headers.cookie || ''
  for (const part of header.split(';')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    if (part.slice(0, eq).trim() === COOKIE_NAME) {
      return verifyToken(decodeURIComponent(part.slice(eq + 1).trim()))
    }
  }
  return null
}

export function requireAuth(req, res, next) {
  const session = getSession(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated' })
  req.session = session
  next()
}

// Simple in-memory login rate limiting: 10 attempts / 15 min per IP
const attempts = new Map()
const MAX_ATTEMPTS = 10
const WINDOW_MS = 15 * 60 * 1000

function rateLimited(ip) {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > MAX_ATTEMPTS
}

export function registerAuthRoutes(app) {
  app.post('/api/auth/login', (req, res) => {
    if (rateLimited(req.ip)) {
      return res.status(429).json({ error: 'Too many login attempts. Try again in a few minutes.' })
    }
    const { username, password } = req.body || {}
    const userOk = safeEqual(username || '', USERNAME)
    const passOk = safeEqual(password || '', PASSWORD)
    if (!userOk || !passOk) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }
    attempts.delete(req.ip)
    res.cookie(COOKIE_NAME, createToken(USERNAME), {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_TTL_MS,
      path: '/'
    })
    res.json({ username: USERNAME })
  })

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie(COOKIE_NAME, { path: '/' })
    res.json({ ok: true })
  })

  app.get('/api/auth/me', (req, res) => {
    const session = getSession(req)
    if (!session) return res.status(401).json({ error: 'Not authenticated' })
    res.json({ username: session.u })
  })
}
