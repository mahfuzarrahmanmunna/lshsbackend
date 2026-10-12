import { prisma } from "../../lib/prisma.js"
import {
  emitNotificationToUser,
  type NotificationPayload,
} from "../../lib/socket.js"
type NotificationType = string

// The generated PrismaClient type does not currently expose this model delegate.
const notificationModel = (prisma as any).notification

/* ─── Create notification (persist + emit) ─── */

interface CreateNotificationParams {
  userId: number
  title: string
  message: string
  type: NotificationType
  link?: string | null
  metadata?: Record<string, unknown> | null
}

export async function createNotification(params: CreateNotificationParams) {
  // 1. Persist to PostgreSQL FIRST — database is source of truth
  const notification = await notificationModel.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link ?? null,
      metadata: params.metadata ?? null,
    },
  })

  // 2. Build safe payload — no passwords, no tokens, no sensitive lead data
  const payload: NotificationPayload = {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    link: notification.link,
    metadata: notification.metadata as Record<string, unknown> | null,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
  }

  // 3. Emit via Socket.IO AFTER successful DB write
  //    If the user is offline, the emit silently fails —
  //    they'll see the notification on their next page load via REST API
  emitNotificationToUser(params.userId, payload)

  return notification
}

/* ─── Get user's notifications (paginated) ─── */

export async function getUserNotifications(
  userId: number,
  page: number = 1,
  limit: number = 20
) {
  const [notifications, total, unreadCount] = await Promise.all([
    notificationModel.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    notificationModel.count({ where: { userId } }),
    notificationModel.count({ where: { userId, isRead: false } }),
  ])

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    },
  }
}

/* ─── Get unread count ─── */

export async function getUnreadCount(userId: number): Promise<number> {
  return notificationModel.count({
    where: { userId, isRead: false },
  })
}

/* ─── Mark one as read (with ownership check) ─── */

export async function markAsRead(userId: number, notificationId: number) {
  // Verify ownership — user can only mark their own notifications
  const notification = await notificationModel.findFirst({
    where: { id: notificationId, userId },
  })

  if (!notification) {
    return null
  }

  if (notification.isRead) {
    return notification
  }

  return notificationModel.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  })
}

/* ─── Mark all as read ─── */

export async function markAllAsRead(userId: number) {
  const result = await notificationModel.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })

  return { count: result.count }
}