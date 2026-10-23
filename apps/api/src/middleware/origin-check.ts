import type { NextFunction, Request, Response } from 'express'
import { validateApiEnv } from '../config/env'
import { AppError } from '../lib/errors'

export function originCheckMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
  if (!mutatingMethods.includes(req.method)) {
    return next()
  }

  // Skip origin check in test environment or for health probes
  const env = validateApiEnv()
  if (env.NODE_ENV === 'test' || req.path === '/health' || req.path === '/ready') {
    return next()
  }

  const origin = req.headers.origin
  // If origin header is present, it must match WEB_ORIGIN
  if (origin && origin !== env.WEB_ORIGIN) {
    return next(AppError.forbidden(`Cross-origin request rejected: Origin '${origin}' does not match allowed origin`))
  }

  next()
}
