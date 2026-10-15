import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.string().optional().default('developer'),
})

export type RegisterInput = z.infer<typeof registerSchema>

export const verifyOtpSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
})

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>

export const resendOtpSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
})

export type ResendOtpInput = z.infer<typeof resendOtpSchema>
