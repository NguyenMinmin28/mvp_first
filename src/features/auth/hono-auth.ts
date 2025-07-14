import { Context } from "hono"
import { getToken } from "next-auth/jwt"

export async function getUserFromContext(
  c: Context
): Promise<{ id: string } | null> {
  try {
    // Get the raw request from Hono context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const req = c.req.raw as any

    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token?.sub) {
      return null
    }

    return { id: token.sub }
  } catch (error) {
    console.error("Error getting user from token:", error)
    return null
  }
}

/**
 * Custom auth middleware for Hono that works with NextAuth.js
 */
export function requireAuth() {
  return async (c: Context, next: () => Promise<void>) => {
    const user = await getUserFromContext(c)

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401)
    }

    // Set user in context for easy access in routes
    c.set("user", user)
    c.set("userId", user.id)

    await next()
  }
}

/**
 * Optional auth middleware that adds user info to context if available
 */
export function optionalAuth() {
  return async (c: Context, next: () => Promise<void>) => {
    const user = await getUserFromContext(c)

    if (user) {
      c.set("user", user)
      c.set("userId", user.id)
    }

    await next()
  }
}
