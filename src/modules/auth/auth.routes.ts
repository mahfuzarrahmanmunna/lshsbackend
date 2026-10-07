import { Router } from 'express'
import { z } from 'zod'
import { successResponse } from '../../utils/apiResponse.js'
import { authService } from './auth.service.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const router = Router()

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }

  const result = await authService.login(parsed.data.email, parsed.data.password)
  return successResponse(res, 'Login successful', result)
})

export default router
