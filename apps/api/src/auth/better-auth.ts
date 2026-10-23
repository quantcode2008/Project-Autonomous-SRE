import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { APIError } from 'better-auth/api'
import { prisma } from '../config/database'
import { validateApiEnv } from '../config/env'
import { logger } from '../lib/logger'

const env = validateApiEnv()

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [
    env.WEB_ORIGIN,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url, token }) => {
      logger.info({ email: user.email }, 'Password reset email triggered')
      console.log(`\n📧 [DEV MAILER - PASSWORD RESET]\nTo: ${user.email}\nURL: ${url}\nToken: ${token}\n`)
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      logger.info({ email: user.email }, 'Email verification triggered')
      console.log(`\n📧 [DEV MAILER - EMAIL VERIFICATION]\nTo: ${user.email}\nURL: ${url}\nToken: ${token}\n`)
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'USER',
        input: false,
      },
      disabled: {
        type: 'boolean',
        defaultValue: false,
        input: false,
      },
      dailyInvestigationQuota: {
        type: 'number',
        defaultValue: 5,
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
          if (user?.disabled) {
            throw new APIError('FORBIDDEN', {
              message: 'Account is disabled',
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

export type AuthSession = typeof auth.$Infer.Session
