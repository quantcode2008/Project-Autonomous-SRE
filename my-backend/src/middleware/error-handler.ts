import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
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
  const requestId = req.id || req.headers['x-request-id'] || 'unknown'

  // 1. Zod input validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      requestId,
      details: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
    return
  }

  // 2. Custom operational application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: 'APP_ERROR',
      requestId,
    })
    return
  }

  // 3. Body parser payload too large (413)
  if ('type' in err && (err as { type: string }).type === 'entity.too.large') {
    res.status(413).json({
      error: 'Request payload exceeds the maximum allowed size.',
      code: 'PAYLOAD_TOO_LARGE',
      requestId,
    })
    return
  }

  // 4. Malformed JSON syntax error in request body
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    res.status(400).json({
      error: 'Malformed JSON payload in request body.',
      code: 'MALFORMED_JSON',
      requestId,
    })
    return
  }

  // 5. Prisma ORM errors - sanitize to prevent database schema/column leakage
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.warn(`Prisma operational error [${err.code}]`, {
      code: err.code,
      url: req.originalUrl,
      method: req.method,
      requestId,
    })

    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'A resource with this unique identifier already exists.',
        code: 'CONFLICT',
        requestId,
      })
      return
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'The requested resource was not found.',
        code: 'NOT_FOUND',
        requestId,
      })
      return
    }

    if (err.code === 'P2003') {
      res.status(400).json({
        error: 'Invalid reference to a related resource.',
        code: 'FOREIGN_KEY_VIOLATION',
        requestId,
      })
      return
    }
  }

  // 6. Database connection failure
  if (
    err.name === 'PrismaClientInitializationError' ||
    err.message?.includes("Can't reach database server")
  ) {
    logger.error('Database connection unavailable', {
      message: err.message,
      url: req.originalUrl,
      method: req.method,
      requestId,
    })
    res.status(503).json({
      error: 'Database service is temporarily unavailable. Please retry shortly.',
      code: 'DATABASE_UNAVAILABLE',
      requestId,
    })
    return
  }

  // 7. Unhandled internal server error - never leak stack trace or internal details
  logger.error('Unhandled internal server error', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    requestId,
  })

  res.status(500).json({
    error: 'An unexpected internal error occurred. Please try again later.',
    code: 'INTERNAL_SERVER_ERROR',
    requestId,
  })
}
