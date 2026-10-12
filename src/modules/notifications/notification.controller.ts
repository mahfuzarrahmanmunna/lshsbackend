import type { Request, Response } from "express"
import { z } from "zod"
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "./notification.service.js"

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
})

/* ─── GET /api/notifications ─── */
export async function getNotifications(req: Request, res: Response) {
  const parsed = paginationSchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid pagination parameters",
    })
  }

  const result = await getUserNotifications(
    req.user!.userId,
    parsed.data.page,
    parsed.data.limit
  )

  return res.json({
    success: true,
    data: result.notifications,
    pagination: result.pagination,
  })
}

/* ─── GET /api/notifications/unread-count ─── */
export async function getUnreadNotificationCount(req: Request, res: Response) {
  const count = await getUnreadCount(req.user!.userId)
  return res.json({ success: true, data: { count } })
}

/* ─── PATCH /api/notifications/:id/read ─── */
export async function markNotificationAsRead(req: Request, res: Response) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification ID",
    })
  }

  const notification = await markAsRead(req.user!.userId, id)

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found or does not belong to you",
    })
  }

  return res.json({
    success: true,
    message: "Notification marked as read",
    data: notification,
  })
}

/* ─── PATCH /api/notifications/mark-all-read ─── */
export async function markAllNotificationsAsRead(req: Request, res: Response) {
  const result = await markAllAsRead(req.user!.userId)
  return res.json({
    success: true,
    message: `${result.count} notification(s) marked as read`,
    data: result,
  })
}