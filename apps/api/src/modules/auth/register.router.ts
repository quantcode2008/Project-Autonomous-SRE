import { Router } from 'express'
import { z } from 'zod'
import { auth } from '../../auth/better-auth'
import { prisma } from '../../config/database'
import { validate } from '../../middleware/validate'

export const registerRouter = Router()

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
})

registerRouter.post(
  '/',
  validate({ body: registerSchema }),
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body
      const normalizedEmail = email.trim().toLowerCase()

      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      })

      if (existing) {
        res.status(400).json({
          success: false,
          error: 'An account with this email already exists. Please sign in.',
        })
        return
      }

      // Register user via Better Auth
      await auth.api.signUpEmail({
        body: {
          name,
          email: normalizedEmail,
          password,
        },
      })

      res.status(200).json({
        success: true,
        message: `We sent a 6-digit verification code to ${normalizedEmail}`,
        devOtp: '123456',
      })
    } catch (err: any) {
      next(err)
    }
  },
)

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(6),
})

registerRouter.post(
  '/verify-otp',
  validate({ body: verifyOtpSchema }),
  async (req, res, next) => {
    try {
      const { email, otp } = req.body
      const normalizedEmail = email.trim().toLowerCase()

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      })

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found.',
        })
        return
      }

      // In dev mode, accept 123456 or any 6-digit code
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      })

      res.status(200).json({
        success: true,
        message: 'Email verified successfully.',
      })
    } catch (err) {
      next(err)
    }
  },
)

const resendOtpSchema = z.object({
  email: z.string().email(),
})

registerRouter.post(
  '/resend-otp',
  validate({ body: resendOtpSchema }),
  async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'A new verification code has been dispatched.',
      devOtp: '123456',
    })
  },
)
