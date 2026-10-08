import type { Request, Response } from "express"
import { verifyFirebaseToken, findOrCreateUser } from "./auth.service.js"
import { signSessionToken, sanitizeUser } from "./auth.utils.js"
import { prisma } from "../../lib/prisma.js"

/* ─── CHECK EMAIL ──────────────────────────────────────
   Determines if an email belongs to an existing user.
   Returns only what the frontend needs: { exists, next }
   Never exposes user details, IDs, names, or roles.        */
export async function checkEmail(req: Request, res: Response) {
  const { email } = req.body as { email?: string }

  // Validate
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address.",
      code: "AUTH_INVALID_EMAIL",
    })
  }

  // Normalize — trim + lowercase, consistent with all other queries
  const normalizedEmail = email.trim().toLowerCase()

  try {
    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true, isActive: true },
    })

    // Deactivated account — block early
    if (existingUser && !existingUser.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated. Please contact an administrator.",
        code: "AUTH_ACCOUNT_DEACTIVATED",
      })
    }

    return res.json({
      success: true,
      data: {
        exists: Boolean(existingUser),
        next: existingUser ? "signin" : "signup",
      },
    })
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to check this email right now. Please try again.",
      code: "AUTH_EMAIL_CHECK_FAILED",
    })
  }
}

/* ─── SIGN UP (existing — keep as-is) ────────────────── */
export async function signUp(req: Request, res: Response) {
  const { idToken, name } = req.body as { idToken?: string; name?: string }

  if (!idToken) {
    return res.status(400).json({ success: false, message: "Missing Firebase ID token" })
  }

  const decoded = await verifyFirebaseToken(idToken)
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Invalid or expired Firebase token" })
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: decoded.email }, { firebaseUid: decoded.uid }] },
  })

  if (existing) {
    const token = signSessionToken({
      userId: existing.id, role: existing.role, email: existing.email,
    })
    setSessionCookie(res, token)
    return res.json({
      success: true,
      message: "Welcome back!",
      data: sanitizeUser(existing),
    })
  }

  const { user } = await findOrCreateUser(decoded, name)
  const sessionToken = signSessionToken({
    userId: user.id, role: user.role, email: user.email,
  })
  setSessionCookie(res, sessionToken)

  return res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: sanitizeUser(user),
  })
}

/* ─── SIGN IN (existing — keep as-is) ─────────────────── */
export async function signIn(req: Request, res: Response) {
  const { idToken } = req.body as { idToken?: string }

  if (!idToken) {
    return res.status(400).json({ success: false, message: "Missing Firebase ID token" })
  }

  const decoded = await verifyFirebaseToken(idToken)
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Invalid or expired Firebase token" })
  }

  const { user } = await findOrCreateUser(decoded)

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: "Your account has been deactivated. Contact an administrator.",
      code: "AUTH_ACCOUNT_DEACTIVATED",
    })
  }

  const sessionToken = signSessionToken({
    userId: user.id, role: user.role, email: user.email,
  })
  setSessionCookie(res, sessionToken)

  return res.json({
    success: true,
    message: "Signed in successfully",
    data: sanitizeUser(user),
  })
}

/* ─── GET CURRENT USER / SIGN OUT (existing — keep as-is) */
export async function getCurrentUser(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated" })
  }
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, name: true, firstName: true, lastName: true, email: true, role: true, isActive: true, createdAt: true },
  })
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }
  return res.json({ success: true, data: user })
}

export async function signOut(_req: Request, res: Response) {
  res.clearCookie("lshs_session", { path: "/" })
  return res.json({ success: true, message: "Signed out successfully" })
}

function setSessionCookie(res: Response, token: string) {
  res.cookie("lshs_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  })
}