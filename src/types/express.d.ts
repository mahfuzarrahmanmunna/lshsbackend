import type { Request } from 'express'

export interface AuthPayload {
  userId: number
  role: string
  email: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}