import rateLimit from 'express-rate-limit'
import { AppError } from '../lib/errors'

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, _res, next) => {
    next(AppError.rateLimited('Too many requests, please try again later.', 60))
  },
})

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, _res, next) => {
    next(AppError.rateLimited('Too many authentication attempts, please try again later.', 300))
  },
})
