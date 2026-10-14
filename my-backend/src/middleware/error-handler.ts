import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from '../lib/logger'

export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode = 400, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // 1. Zod validation error
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
    return
  }

  // 2. Custom operational application error
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: 'APP_ERROR',
    })
    return
  }

  // 3. Body parser size limit exceeded
  if ('type' in err && (err as { type: string }).type === 'entity.too.large') {
    res.status(413).json({
      error: 'Payload too large',
      code: 'PAYLOAD_TOO_LARGE',
    })
    return
  }

  // 4. Database connection failure
  if (
    err.name === 'PrismaClientInitializationError' ||
    err.message?.includes("Can't reach database server")
  ) {
    logger.error('Database connection unavailable', {
      message: err.message,
      url: req.originalUrl,
      method: req.method,
    })
    res.status(503).json({
      error: 'Database service is temporarily unavailable. Please verify PostgreSQL is running.',
      code: 'DATABASE_UNAVAILABLE',
    })
    return
  }

  // 5. Unexpected server error
  logger.error('Unhandled internal server error', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  })

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
  })
}
