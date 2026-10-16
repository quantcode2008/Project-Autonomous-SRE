import crypto from 'crypto'
import { hashPassword } from 'better-auth/crypto'
import { prisma } from '../../config/database'
import { getMailService } from '../../lib/email'
import { logger } from '../../lib/logger'
import { AppError } from '../../middleware/error-handler'
import { RegisterInput, VerifyOtpInput, ResendOtpInput } from './registration.schema'

export interface RegistrationResponse {
  success: boolean
  message: string
  devOtp?: string
}

export class RegistrationService {
  async register(input: RegisterInput): Promise<RegistrationResponse> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
      include: { accounts: true },
    })

    const hashedPassword = await hashPassword(input.password)

    if (existing) {
      if (existing.isApproved) {
        throw new AppError('An account with this email already exists. Please sign in.', 400)
      }
      if (existing.emailVerified && !existing.isApproved) {
        throw new AppError(
          'Registration already submitted. Your account is awaiting admin approval.',
          400
        )
      }

      // If user exists but is unverified, update name and password
      await prisma.user.update({
        where: { id: existing.id },
        data: { name: input.name },
      })

      const cred = existing.accounts.find((a) => a.providerId === 'credential')
      if (cred) {
        await prisma.account.update({
          where: { id: cred.id },
          data: { password: hashedPassword },
        })
      } else {
        await prisma.account.create({
          data: {
            id: crypto.randomBytes(16).toString('hex'),
            userId: existing.id,
            accountId: existing.id,
            providerId: 'credential',
            password: hashedPassword,
          },
        })
      }
    } else {
      const userId = crypto.randomBytes(16).toString('hex')
      const accountId = crypto.randomBytes(16).toString('hex')

      await prisma.user.create({
        data: {
          id: userId,
          email: input.email,
          name: input.name,
          role: 'USER',
          emailVerified: false,
          isApproved: false,
          accounts: {
            create: {
              id: accountId,
              accountId: userId,
              providerId: 'credential',
              password: hashedPassword,
            },
          },
        },
      })
    }

    // Generate cryptographically secure 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 1000000).toString()

    // Store in Verification table with 10-minute validity
    await prisma.verification.deleteMany({
      where: { identifier: input.email },
    })

    await prisma.verification.create({
      data: {
        id: crypto.randomBytes(16).toString('hex'),
        identifier: input.email,
        value: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    })

    // Send email & log to console
    logger.info(`[REGISTRATION OTP] >>> Verification code for ${input.email}: ${otp} <<<`)

    try {
      await getMailService().sendVerificationEmail({
        to: input.email,
        url: '',
        token: otp,
      })
    } catch (err: any) {
      logger.warn('[EMAIL] Could not send OTP email via provider, logged to console', {
        message: err.message,
      })
    }

    return {
      success: true,
      message: `A 6-digit verification code has been sent to ${input.email}.`,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    }
  }

  async verifyOtp(input: VerifyOtpInput): Promise<RegistrationResponse> {
    const record = await prisma.verification.findFirst({
      where: { identifier: input.email },
      orderBy: { createdAt: 'desc' },
    })

    if (!record) {
      throw new AppError('Invalid verification code. Please check and try again.', 400)
    }

    if (new Date() > record.expiresAt) {
      await prisma.verification.deleteMany({
        where: { identifier: input.email },
      })
      throw new AppError('Verification code has expired. Please request a new code.', 400)
    }

    // Constant-time comparison to prevent timing attacks
    const storedBuf = Buffer.from(record.value)
    const inputBuf = Buffer.from(input.otp)
    const matches =
      storedBuf.length === inputBuf.length &&
      crypto.timingSafeEqual(storedBuf, inputBuf)

    if (!matches) {
      throw new AppError('Invalid verification code. Please check and try again.', 400)
    }

    // Mark user verified
    await prisma.user.update({
      where: { email: input.email },
      data: { emailVerified: true },
    })

    // Clear verification record
    await prisma.verification.deleteMany({
      where: { identifier: input.email },
    })

    logger.info(`[REGISTRATION] User verified email successfully: ${input.email}`)

    return {
      success: true,
      message:
        'Email verified successfully! Your registration is now pending administrator approval.',
    }
  }

  async resendOtp(input: ResendOtpInput): Promise<RegistrationResponse> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    })

    if (!user) {
      throw new AppError('No registered account found with this email.', 404)
    }

    if (user.emailVerified) {
      throw new AppError('This email is already verified.', 400)
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    await prisma.verification.deleteMany({
      where: { identifier: input.email },
    })

    await prisma.verification.create({
      data: {
        id: crypto.randomBytes(16).toString('hex'),
        identifier: input.email,
        value: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    })

    logger.info(`[RESEND OTP] >>> Verification code for ${input.email}: ${otp} <<<`)

    try {
      await getMailService().sendVerificationEmail({
        to: input.email,
        url: '',
        token: otp,
      })
    } catch (err: any) {
      logger.warn('[EMAIL] Could not send OTP email via provider, logged to console', {
        message: err.message,
      })
    }

    return {
      success: true,
      message: 'A new 6-digit verification code has been sent.',
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    }
  }
}

export const registrationService = new RegistrationService()
