import type { Request, Response, NextFunction } from "express"
import { verifySessionToken } from "./auth.utils.js"
import { prisma } from "../../lib/prisma.js"

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number
        role: string
        email: string
      }
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.cookie
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('lshs_session='))
    ?.slice('lshs_session='.length)

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" })
  }

  const payload = verifySessionToken(token)
  if (!payload) {
    return res.status(401).json({ success: false, message: "Session expired. Please sign in again." })
  }

  // Verify user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, email: true, isActive: true },
  })

  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: "Account not found or deactivated" })
  }

  req.user = { userId: user.id, role: user.role, email: user.email }
  next()
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" })
    }
    next()
  }
}