import { type Request, type Response, type NextFunction } from 'express'
import { type ZodSchema, ZodError, type ZodIssue } from 'zod'

export const validateRequest = (
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source])
      ;(req as any)[source] = parsed
      next()
    } catch (err) {
      const zErr = err as ZodError
      const errors = zErr.issues.map((e: ZodIssue) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
      })
    }
  }
}