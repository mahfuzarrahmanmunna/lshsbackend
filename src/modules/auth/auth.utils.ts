import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "lshs-dev-secret-change-in-production"
const JWT_EXPIRES_IN = "7d"

export interface SessionPayload {
  userId: number
  role: string
  email: string
}

export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload
  } catch {
    return null
  }
}

export function sanitizeUser(user: any) {
  const { password, firebaseUid, ...safe } = user
  return safe
}