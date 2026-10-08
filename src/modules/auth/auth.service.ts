import { adminAuth } from "../../lib/firebase-admin.js"
import { prisma } from "../../lib/prisma.js"
import type { Role } from "@prisma/client"

interface DecodedFirebaseToken {
  uid: string
  email?: string
  name?: string
  picture?: string
}

export async function verifyFirebaseToken(
  idToken: string
): Promise<DecodedFirebaseToken | null> {
  if (!adminAuth) return null

  try {
    const decoded = await adminAuth.verifyIdToken(idToken)
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    }
  } catch {
    return null
  }
}

export async function findOrCreateUser(
  decoded: DecodedFirebaseToken,
  name?: string
) {
  // Normalize email — always trim + lowercase
  const email = decoded.email?.trim().toLowerCase()
  if (!email) throw new Error("No email in Firebase token")

  let isNew = false

  const user = await prisma.$transaction(async (tx) => {
    // Double-check inside the transaction (race condition safety)
    const existing = await tx.user.findFirst({
      where: {
        OR: [{ email }, { firebaseUid: decoded.uid }],
      },
    })

    if (existing) {
      // Link firebaseUid if not yet linked (legacy user created before Firebase)
      const existingFirebaseUid = (
        existing as typeof existing & { firebaseUid?: string | null }
      ).firebaseUid

      if (!existingFirebaseUid) {
        const updated = await tx.user.update({
          where: { id: existing.id },
          data: { firebaseUid: decoded.uid, password: "" },
        })
        return updated
      }
      return existing
    }

    // Parse name
    const fullName = (name || decoded.name || email.split("@")[0]).trim()
    const nameParts = fullName.split(/\s+/)
    const firstName = nameParts[0] || fullName
    const lastName = nameParts.slice(1).join(" ") || null

    // First user becomes ADMIN, subsequent users default to STUDENT
    const userCount = await tx.user.count()
    const role: Role = userCount === 0 ? "ADMIN" : "STUDENT"

    isNew = true

    return tx.user.create({
      data: {
        name: fullName,
        firstName,
        lastName,
        email,
        firebaseUid: decoded.uid,
        password: "",
        role,
      },
    })
  })

  return { user, isNew }
}