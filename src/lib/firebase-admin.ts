// src/lib/firebase-admin.ts

import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app"
import { getAuth, type Auth } from "firebase-admin/auth"

let adminApp: App | null = null
let adminAuth: Auth | null = null

try {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (projectId && clientEmail && privateKey) {
    // Initialize only if not already initialized (HMR / restart safety)
    adminApp = getApps().length > 0 ? getApp() : initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    })
    adminAuth = getAuth(adminApp)
    console.log("✓ Firebase Admin initialized")
  } else {
    console.warn(
      "⚠ Firebase Admin NOT configured — auth routes will not work.\n" +
      "  Set these in your backend .env:\n" +
      "  FIREBASE_PROJECT_ID=lshs-3e4e1\n" +
      "  FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@lshs-3e4e1.iam.gserviceaccount.com\n" +
      "  FIREBASE_PRIVATE_KEY=\"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n\""
    )
  }
} catch (error) {
  console.error("✗ Firebase Admin initialization failed:", error)
}

export { adminAuth }
export default adminApp