import { type Request, type Response, type NextFunction } from 'express'

export const notFoundHandler = (req: Request, res: Response) =>
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('🔥 Error:', err)

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
    })
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate record',
      meta: err.meta,
    })
  }

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  })
}