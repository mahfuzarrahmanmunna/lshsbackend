import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import type { AuthPayload } from '../types/express.js'

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ success: false, message: 'Authentication required' })
    }

    const token = header.split(' ')[1]
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: 'User not found or inactive' })
    }

    req.user = { userId: user.id, email: user.email, role: user.role }
    next()
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid or expired token' })
  }
}

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, message: 'Insufficient permissions' })
    }
    next()
  }
}   