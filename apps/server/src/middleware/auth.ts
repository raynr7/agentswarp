import { createMiddleware } from 'hono/factory'
import { jwtVerify, errors as joseErrors } from 'jose'
import type { MiddlewareHandler, Context } from 'hono'

export type AppBindings = {
  Variables: {
    userId: string
    sessionId: string
  }
}

const SKIP_PATHS = [
  '/api/health',
  '/api/ping',
]

const SKIP_PREFIXES = [
  '/api/auth/',
]

function shouldSkip(path: string): boolean {
  if (SKIP_PATHS.includes(path)) {
    return true
  }
  for (const prefix of SKIP_PREFIXES) {
    if (path.startsWith(prefix)) {
      return true
    }
  }
  return false
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  return new TextEncoder().encode(secret)
}

export const authMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
  const path = new URL(c.req.url).pathname

  if (shouldSkip(path)) {
    await next()
    return
  }

  const authHeader = c.req.header('Authorization')

  if (!authHeader) {
    return c.json(
      { error: 'Unauthorized', message: 'Missing Authorization header' },
      401
    )
  }

  if (!authHeader.startsWith('Bearer ')) {
    return c.json(
      { error: 'Unauthorized', message: 'Invalid Authorization header format. Expected: Bearer <token>' },
      401
    )
  }

  const token = authHeader.slice(7).trim()

  if (!token) {
    return c.json(
      { error: 'Unauthorized', message: 'Bearer token is empty' },
      401
    )
  }

  let secret: Uint8Array
  try {
    secret = getJwtSecret()
  } catch (err) {
    console.error('[authMiddleware] JWT_SECRET not configured:', err)
    return c.json(
      { error: 'Unauthorized', message: 'Server authentication configuration error' },
      401
    )
  }

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    })

    const userId = payload.sub ?? (payload['userId'] as string | undefined)
    const sessionId = payload['sessionId'] as string | undefined

    if (!userId) {
      return c.json(
        { error: 'Unauthorized', message: 'Token is missing required userId claim' },
        401
      )
    }

    if (!sessionId) {
      return c.json(
        { error: 'Unauthorized', message: 'Token is missing required sessionId claim' },
        401
      )
    }

    c.set('userId', userId)
    c.set('sessionId', sessionId)

    await next()
  } catch (err) {
    if (err instanceof joseErrors.JWTExpired) {
      return c.json(
        { error: 'Unauthorized', message: 'Token has expired. Please sign in again.' },
        401
      )
    }

    if (
      err instanceof joseErrors.JWTInvalid ||
      err instanceof joseErrors.JWSInvalid ||
      err instanceof joseErrors.JWSSignatureVerificationFailed
    ) {
      return c.json(
        { error: 'Unauthorized', message: 'Token is malformed or has an invalid signature.' },
        401
      )
    }

    if (err instanceof joseErrors.JWTClaimValidationFailed) {
      return c.json(
        { error: 'Unauthorized', message: `Token claim validation failed: ${err.message}` },
        401
      )
    }

    if (err instanceof joseErrors.JWKSNoMatchingKey) {
      return c.json(
        { error: 'Unauthorized', message: 'Token signing key does not match.' },
        401
      )
    }

    console.error('[authMiddleware] Unexpected JWT verification error:', err)
    return c.json(
      { error: 'Unauthorized', message: 'Token verification failed.' },
      401
    )
  }
}

export function requireAuth(c: Context<AppBindings>): { userId: string; sessionId: string } {
  const userId = c.get('userId')
  const sessionId = c.get('sessionId')

  if (!userId) {
    throw new Error(
      'requireAuth: userId is not set on context. Ensure authMiddleware is applied to this route.'
    )
  }

  if (!sessionId) {
    throw new Error(
      'requireAuth: sessionId is not set on context. Ensure authMiddleware is applied to this route.'
    )
  }

  return { userId, sessionId }
}
