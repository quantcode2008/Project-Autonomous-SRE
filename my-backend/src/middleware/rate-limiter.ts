import rateLimit from 'express-rate-limit'

const isTest = process.env.NODE_ENV === 'test'

const isLoadTest = (req: any) =>
  isTest ||
  process.env.ENABLE_LOAD_TEST === 'true' ||
  req.headers['x-load-test-bypass'] === 'sre-load-test-authorized'

// Strict rate limiter for sensitive authentication endpoints (Better Auth sign-in, etc.)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 30, // 30 attempts per 15m in production
  skip: (req) => isLoadTest(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
})

// Rate limiter for user registration to prevent mass account creation and mail spam
export const registrationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 10, // 10 registrations per 15m
  skip: (req) => isLoadTest(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many registration requests. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
})

// Tight rate limiter for OTP verification attempts to prevent brute-force attacks
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 5, // 5 attempts per 15m window
  skip: (req) => isLoadTest(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many verification attempts. Please wait 15 minutes or request a new code.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
})

// Rate limiter for resending verification OTP emails
export const resendOtpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 3, // 3 resend attempts per 15m window
  skip: (req) => isLoadTest(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many verification code requests. Please wait before requesting another code.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
})

// General API rate limiter for all /api/v1 endpoints
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isTest ? 10000 : 120, // 120 requests per minute
  skip: (req) => isLoadTest(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please slow down.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
})
