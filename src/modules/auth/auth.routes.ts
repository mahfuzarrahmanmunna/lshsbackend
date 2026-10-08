import { Router } from "express"
import {
  checkEmail,
  signUp,
  signIn,
  getCurrentUser,
  signOut,
} from "./auth.controller.js"
import { requireAuth } from "./auth.middleware.js"

const router = Router()

// ── Unified auth flow ──
router.post("/check-email", checkEmail)      // Step 1: check if email exists
router.post("/signup", signUp)               // Step 2a: new user → create account
router.post("/signin", signIn)               // Step 2b: existing user → verify session
router.get("/me", requireAuth, getCurrentUser)
router.post("/signout", signOut)

export default router