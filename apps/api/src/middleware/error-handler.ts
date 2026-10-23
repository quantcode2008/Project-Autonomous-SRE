import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../lib/errors'
import { logger } from '../lib/logger'

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Endpoint not found: ${req.method} ${req.originalUrl}`))
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.id || 'unknown'

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, err.message)
    }

    if (err.retryAfterSeconds) {
      res.setHeader('Retry-After', err.retryAfterSeconds)
    }

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    })
    return
  }

  // Unhandled operational / programming error: do not leak stack traces to client
  logger.error({ err, requestId }, 'Unhandled internal error')
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal error occurred',
      requestId,
    },
  })
}
