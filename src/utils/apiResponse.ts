import type { Response } from 'express'

export const successResponse = (
  res: Response,
  message: string,
  data: any = {},
  status = 200
) => res.status(status).json({ success: true, message, data })

export const listResponse = (
  res: Response,
  data: any[],
  pagination: { page: number; limit: number; total: number; totalPages: number }
) =>
  res.status(200).json({ success: true, data, pagination })

export const errorResponse = (
  res: Response,
  message: string,
  status = 400,
  errors: any[] = []
) => res.status(status).json({ success: false, message, errors })