import { Router } from 'express'
import { validate } from '../../middleware/validate'
import { registrationController } from './registration.controller'
import {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
} from './registration.schema'

export const registrationRouter = Router()

registrationRouter.post(
  '/',
  validate({ body: registerSchema }),
  registrationController.register
)

registrationRouter.post(
  '/verify-otp',
  validate({ body: verifyOtpSchema }),
  registrationController.verifyOtp
)

registrationRouter.post(
  '/resend-otp',
  validate({ body: resendOtpSchema }),
  registrationController.resendOtp
)
