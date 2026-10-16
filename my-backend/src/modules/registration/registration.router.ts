import { Router } from 'express'
import { validate } from '../../middleware/validate'
import {
  registrationRateLimiter,
  otpRateLimiter,
  resendOtpRateLimiter,
} from '../../middleware/rate-limiter'
import { registrationController } from './registration.controller'
import {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
} from './registration.schema'

export const registrationRouter = Router()

// Registration with rate limiting & schema validation
registrationRouter.post(
  '/',
  registrationRateLimiter,
  validate({ body: registerSchema }),
  registrationController.register
)

// OTP Verification with strict 5-attempt rate limit against brute-force
registrationRouter.post(
  '/verify-otp',
  otpRateLimiter,
  validate({ body: verifyOtpSchema }),
  registrationController.verifyOtp
)

// Resend OTP with throttling to prevent email flood
registrationRouter.post(
  '/resend-otp',
  resendOtpRateLimiter,
  validate({ body: resendOtpSchema }),
  registrationController.resendOtp
)
