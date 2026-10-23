export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVALID_STATE'
  | 'PAYLOAD_TOO_LARGE'
  | 'GATE_NOT_SATISFIED'
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  | 'PAUSED'
  | 'ENGINE_UNAVAILABLE'
  | 'INTERNAL_ERROR'

export interface ErrorDetail {
  path?: string
  issue: string
}

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: ErrorCode
  public readonly details?: ErrorDetail[]
  public readonly retryAfterSeconds?: number

  constructor(params: {
    statusCode: number
    code: ErrorCode
    message: string
    details?: ErrorDetail[]
    retryAfterSeconds?: number
  }) {
    super(params.message)
    this.name = 'AppError'
    this.statusCode = params.statusCode
    this.code = params.code
    this.details = params.details
    this.retryAfterSeconds = params.retryAfterSeconds
    Object.setPrototypeOf(this, new.target.prototype)
  }

  static badRequest(message: string, details?: ErrorDetail[]): AppError {
    return new AppError({ statusCode: 400, code: 'VALIDATION_FAILED', message, details })
  }

  static unauthenticated(message = 'Authentication required'): AppError {
    return new AppError({ statusCode: 401, code: 'UNAUTHENTICATED', message })
  }

  static forbidden(message = 'Access forbidden'): AppError {
    return new AppError({ statusCode: 403, code: 'FORBIDDEN', message })
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError({ statusCode: 404, code: 'NOT_FOUND', message })
  }

  static conflict(message: string, code: ErrorCode = 'CONFLICT'): AppError {
    return new AppError({ statusCode: 409, code, message })
  }

  static payloadTooLarge(message = 'Payload too large'): AppError {
    return new AppError({ statusCode: 413, code: 'PAYLOAD_TOO_LARGE', message })
  }

  static gateNotSatisfied(message: string, details?: ErrorDetail[]): AppError {
    return new AppError({ statusCode: 422, code: 'GATE_NOT_SATISFIED', message, details })
  }

  static rateLimited(message = 'Rate limit exceeded', retryAfterSeconds?: number): AppError {
    return new AppError({ statusCode: 429, code: 'RATE_LIMITED', message, retryAfterSeconds })
  }

  static quotaExceeded(message = 'Daily quota exceeded'): AppError {
    return new AppError({ statusCode: 429, code: 'QUOTA_EXCEEDED', message })
  }

  static paused(message = 'Platform investigations are currently paused'): AppError {
    return new AppError({ statusCode: 503, code: 'PAUSED', message })
  }

  static engineUnavailable(message = 'Engine service is unavailable'): AppError {
    return new AppError({ statusCode: 503, code: 'ENGINE_UNAVAILABLE', message })
  }
}
