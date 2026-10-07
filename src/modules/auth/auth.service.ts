import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../config/env.js'

type AuthUser = {
  id: number
  email: string
  name: string
  password: string
  role: string
  isActive: boolean
}

export const authService = {
  async login(email: string, password: string) {
    const normalizedEmail = (email ?? '').trim().toLowerCase()

    if (!normalizedEmail || !password) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 })
    }

    const user = (await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
      },
    })) as AuthUser | null

    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 })
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 })
    }

    if (!user.isActive) {
      throw Object.assign(new Error('Account inactive'), { status: 403 })
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
    )

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }
  },
}