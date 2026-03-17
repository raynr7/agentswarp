import { Hono } from 'hono'
import { SignJWT, jwtVerify } from 'jose'
import { compare, hash } from 'bcryptjs'
import type { Database } from 'better-sqlite3'

type Env = {
  Variables: {
    db: Database
  }
}

const auth = new Hono<Env>()

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

async function generateAccessToken(userId: string, email: string): Promise<string> {
  return await new SignJWT({ sub: userId, email, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET)
}

async function generateRefreshToken(userId: string, sessionId: string): Promise<string> {
  return await new SignJWT({ sub: userId, sessionId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

function createSession(
  db: Database,
  userId: string,
  refreshToken: string
): string {
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  db.prepare(
    `INSERT INTO sessions (id, user_id, refresh_token, expires_at, revoked, created_at)
     VALUES (?, ?, ?, ?, 0, datetime('now'))`
  ).run(sessionId, userId, refreshToken, expiresAt)
  return sessionId
}

// POST /api/auth/login
auth.post('/login', async (c) => {
  const db = c.get('db')

  let body: { email?: string; password?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { email, password } = body

  if (!email || typeof email !== 'string') {
    return c.json({ error: 'Email is required' }, 400)
  }
  if (!password || typeof password !== 'string') {
    return c.json({ error: 'Password is required' }, 400)
  }

  const user = db
    .prepare('SELECT id, email, name, password_hash, role FROM users WHERE email = ?')
    .get(email.toLowerCase().trim()) as
    | { id: string; email: string; name: string; password_hash: string | null; role: string }
    | undefined

  if (!user || !user.password_hash) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  const passwordValid = await compare(password, user.password_hash)
  if (!passwordValid) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  const accessToken = await generateAccessToken(user.id, user.email)
  const refreshToken = await generateRefreshToken(user.id, crypto.randomUUID())
  createSession(db, user.id, refreshToken)

  return c.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  })
})

// POST /api/auth/magic-request
auth.post('/magic-request', async (c) => {
  const db = c.get('db')

  let body: { email?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { email } = body

  if (!email || typeof email !== 'string') {
    return c.json({ error: 'Email is required' }, 400)
  }

  const normalizedEmail = email.toLowerCase().trim()

  let user = db
    .prepare('SELECT id, email FROM users WHERE email = ?')
    .get(normalizedEmail) as { id: string; email: string } | undefined

  if (!user) {
    // Auto-create a passwordless user
    const newId = crypto.randomUUID()
    db.prepare(
      `INSERT INTO users (id, email, name, role, created_at, updated_at)
       VALUES (?, ?, ?, 'user', datetime('now'), datetime('now'))`
    ).run(newId, normalizedEmail, normalizedEmail.split('@')[0])
    user = { id: newId, email: normalizedEmail }
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  db.prepare(
    `UPDATE users SET magic_code = ?, magic_code_expires = ? WHERE id = ?`
  ).run(otp, expiresAt, user.id)

  // In production, send via email. For now, log to console.
  console.log(`[AgentSwarp] Magic OTP for ${normalizedEmail}: ${otp} (expires: ${expiresAt})`)

  return c.json({ message: 'OTP sent' })
})

// POST /api/auth/magic-verify
auth.post('/magic-verify', async (c) => {
  const db = c.get('db')

  let body: { email?: string; code?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { email, code } = body

  if (!email || typeof email !== 'string') {
    return c.json({ error: 'Email is required' }, 400)
  }
  if (!code || typeof code !== 'string') {
    return c.json({ error: 'OTP code is required' }, 400)
  }

  const normalizedEmail = email.toLowerCase().trim()

  const user = db
    .prepare(
      `SELECT id, email, name, role, magic_code, magic_code_expires
       FROM users WHERE email = ?`
    )
    .get(normalizedEmail) as
    | {
        id: string
        email: string
        name: string
        role: string
        magic_code: string | null
        magic_code_expires: string | null
      }
    | undefined

  if (!user) {
    return c.json({ error: 'Invalid or expired OTP' }, 401)
  }

  if (!user.magic_code || user.magic_code !== code.trim()) {
    return c.json({ error: 'Invalid or expired OTP' }, 401)
  }

  if (!user.magic_code_expires || new Date(user.magic_code_expires) < new Date()) {
    return c.json({ error: 'OTP has expired' }, 401)
  }

  // Clear the OTP after successful verification
  db.prepare(
    `UPDATE users SET magic_code = NULL, magic_code_expires = NULL WHERE id = ?`
  ).run(user.id)

  const accessToken = await generateAccessToken(user.id, user.email)
  const refreshToken = await generateRefreshToken(user.id, crypto.randomUUID())
  createSession(db, user.id, refreshToken)

  return c.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  })
})

// POST /api/auth/refresh
auth.post('/refresh', async (c) => {
  const db = c.get('db')

  let body: { refreshToken?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { refreshToken } = body

  if (!refreshToken || typeof refreshToken !== 'string') {
    return c.json({ error: 'Refresh token is required' }, 400)
  }

  let payload: { sub?: string; sessionId?: string; type?: string }
  try {
    const verified = await jwtVerify(refreshToken, JWT_SECRET)
    payload = verified.payload as typeof payload
  } catch {
    return c.json({ error: 'Invalid or expired refresh token' }, 401)
  }

  if (payload.type !== 'refresh' || !payload.sub) {
    return c.json({ error: 'Invalid token type' }, 401)
  }

  const session = db
    .prepare(
      `SELECT id, user_id, refresh_token, expires_at, revoked
       FROM sessions WHERE refresh_token = ?`
    )
    .get(refreshToken) as
    | { id: string; user_id: string; refresh_token: string; expires_at: string; revoked: number }
    | undefined

  if (!session) {
    return c.json({ error: 'Session not found' }, 401)
  }

  if (session.revoked) {
    return c.json({ error: 'Session has been revoked' }, 401)
  }

  if (new Date(session.expires_at) < new Date()) {
    return c.json({ error: 'Session has expired' }, 401)
  }

  const user = db
    .prepare('SELECT id, email, name, role FROM users WHERE id = ?')
    .get(session.user_id) as
    | { id: string; email: string; name: string; role: string }
    | undefined

  if (!user) {
    return c.json({ error: 'User not found' }, 401)
  }

  const accessToken = await generateAccessToken(user.id, user.email)

  return c.json({ accessToken })
})

// POST /api/auth/logout
auth.post('/logout', async (c) => {
  const db = c.get('db')

  let body: { refreshToken?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const { refreshToken } = body

  if (!refreshToken || typeof refreshToken !== 'string') {
    return c.json({ error: 'Refresh token is required' }, 400)
  }

  const session = db
    .prepare('SELECT id FROM sessions WHERE refresh_token = ?')
    .get(refreshToken) as { id: string } | undefined

  if (!session) {
    return c.json({ error: 'Session not found' }, 404)
  }

  db.prepare(
    `UPDATE sessions SET revoked = 1 WHERE id = ?`
  ).run(session.id)

  return c.json({ message: 'Logged out' })
})

export default auth
