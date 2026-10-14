import { Router } from 'express'
import { waitlistController } from './waitlist.controller'
import { createWaitlistSchema, listWaitlistQuerySchema } from './waitlist.schema'
import { validate } from '../../middleware/validate'
import { requireAuth, requireRole } from '../../auth/middleware'
import { apiRateLimiter } from '../../middleware/rate-limiter'

export const waitlistRouter = Router()

// Public endpoint with rate limiter and Zod body validation
waitlistRouter.post(
  '/',
  apiRateLimiter,
  validate({ body: createWaitlistSchema }),
  waitlistController.join
)

// Protected admin endpoint for listing waitlist registrations
waitlistRouter.get(
  '/',
  requireAuth,
  requireRole(['ADMIN']),
  validate({ query: listWaitlistQuerySchema }),
  waitlistController.list
)
