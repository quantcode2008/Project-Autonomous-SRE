import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '../config/database'
import { env } from '../config/env'
import { getMailService } from '../lib/email'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.CORS_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url, token }) => {
      await getMailService().sendPasswordResetEmail({
        to: user.email,
        url,
        token,
      })
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      await getMailService().sendVerificationEmail({
        to: user.email,
        url,
        token,
      })
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'USER',
        input: false, // Disallow arbitrary client input setting admin role
      },
      isApproved: {
        type: 'boolean',
        defaultValue: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
          })
          if (!user) return

          // Admins always have access
          if (user.role === 'ADMIN') return

          if (!user.emailVerified) {
            throw new APIError('FORBIDDEN', {
              message: 'Please verify your email address with the OTP before signing in.',
            })
          }

          if (!user.isApproved) {
            throw new APIError('FORBIDDEN', {
              message:
                'Your registration is awaiting administrator approval. You will be able to sign in once approved.',
            })
          }
        },
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache
    },
  },
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  },
})

export type Session = typeof auth.$Infer.Session
