import type { NextFunction, Request, Response } from 'express'
import { type AnyZodObject, ZodError } from 'zod'
import { AppError } from '../lib/errors'

export interface ValidationSchemas {
  body?: AnyZodObject
  query?: AnyZodObject
  params?: AnyZodObject
}

export function validate(schemas: ValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body)
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query)
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params)
      }
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          path: e.path.join('.') || 'root',
          issue: e.message,
        }))
        next(AppError.badRequest('Validation failed', details))
        return
      }
      next(err)
    }
  }
}
