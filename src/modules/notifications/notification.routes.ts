import { Router } from "express"
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./notification.controller.js"
import { requireAuth } from "../auth/auth.middleware.js"

const router = Router()

// Order matters: "mark-all-read" must come before ":id/read"
router.get("/", requireAuth, getNotifications)
router.get("/unread-count", requireAuth, getUnreadNotificationCount)
router.patch("/mark-all-read", requireAuth, markAllNotificationsAsRead)
router.patch("/:id/read", requireAuth, markNotificationAsRead)

export default router