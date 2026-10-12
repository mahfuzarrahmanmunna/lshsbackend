import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"
import { verifySessionToken } from "../modules/auth/auth.utils.js"
import { prisma } from "./prisma.js"

/* ─── Typed event contracts (shared shape with frontend) ─── */

export interface NotificationPayload {
  id: number
  title: string
  message: string
  type: string
  link: string | null
  metadata: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

interface ServerToClientEvents {
  "notification:new": (data: NotificationPayload) => void
}

interface ClientToServerEvents {
  "notification:mark_read": (id: number) => void
}

/* ─── Singleton ─── */

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | null = null

/* ─── Initialize Socket.IO on existing HTTP server ─── */

export function initSocket(server: HTTPServer) {
  const clientUrl = process.env.FRONTEND_URL || "http://localhost:3000"

  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: clientUrl,
      credentials: true,
    },
    path: "/socket.io/",
    transports: ["websocket", "polling"],
  })

  /* ── Auth middleware: verify session cookie on handshake ── */
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie
      if (!cookieHeader) {
        return next(new Error("Unauthorized"))
      }

      const cookies = parseCookies(cookieHeader)
      const token = cookies["lshs_session"]

      if (!token) {
        return next(new Error("Unauthorized"))
      }

      const payload = verifySessionToken(token)
      if (!payload) {
        return next(new Error("Unauthorized"))
      }

      // Verify user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, isActive: true, role: true },
      })

      if (!user || !user.isActive) {
        return next(new Error("Unauthorized"))
      }

      // Attach user info to socket — server decides the room, never the client
      ;(socket as any).userId = user.id
      ;(socket as any).userRole = user.role

      next()
    } catch {
      next(new Error("Unauthorized"))
    }
  })

  /* ── Connection handler ── */
  io.on("connection", (socket) => {
    const userId: number = (socket as any).userId

    // Join user's private room — only the server determines this
    socket.join(`user:${userId}`)

    console.log(`[Socket.IO] User ${userId} connected (${socket.id})`)

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] User ${userId} disconnected: ${reason}`)
    })

    // Client requests to mark a notification as read
    socket.on("notification:mark_read", async (notificationId: number) => {
      // Verify ownership and update atomically without relying on a generated delegate.
      await prisma.$executeRaw`
        UPDATE "Notification"
        SET "isRead" = true, "readAt" = ${new Date()}
        WHERE "id" = ${notificationId}
          AND "userId" = ${userId}
          AND "isRead" = false
      `
    })
  })

  console.log(`[Socket.IO] Initialized — CORS: ${clientUrl}`)
  return io
}

/* ─── Emit helper — used by notification service ─── */

export function emitNotificationToUser(userId: number, data: NotificationPayload): boolean {
  if (!io) {
    console.warn("[Socket.IO] emitNotificationToUser — server not initialized")
    return false
  }
  io.to(`user:${userId}`).emit("notification:new", data)
  return true
}

export function getIO() {
  return io
}

/* ─── Cookie parser ─── */

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  cookieHeader.split(";").forEach((cookie) => {
    const [key, ...valParts] = cookie.trim().split("=")
    if (key && valParts.length) {
      cookies[key.trim()] = valParts.join("=").trim()
    }
  })
  return cookies
}