import { prisma } from './database'
import { hashPassword } from 'better-auth/crypto'
import { logger } from '../lib/logger'
import crypto from 'crypto'

export const ADMIN_EMAIL = 'mirajmisba1@gmail.com'
export const ADMIN_PASS = 'MISBA1234'

export async function ensureAdminUser(): Promise<void> {
  try {
    const hashedPassword = await hashPassword(ADMIN_PASS)

    const existingUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
      include: { accounts: true },
    })

    if (!existingUser) {
      const userId = crypto.randomBytes(16).toString('hex')
      const accountId = crypto.randomBytes(16).toString('hex')

      await prisma.user.create({
        data: {
          id: userId,
          email: ADMIN_EMAIL,
          name: 'Miraj Misba (Admin)',
          role: 'ADMIN',
          isApproved: true,
          emailVerified: true,
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
      logger.info(`[ADMIN SEED] Created admin account: ${ADMIN_EMAIL}`)
    } else {
      // Ensure admin privileges & updated password
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: 'ADMIN',
          isApproved: true,
          emailVerified: true,
        },
      })

      const credentialAccount = existingUser.accounts.find(
        (a) => a.providerId === 'credential'
      )

      if (credentialAccount) {
        await prisma.account.update({
          where: { id: credentialAccount.id },
          data: { password: hashedPassword },
        })
      } else {
        await prisma.account.create({
          data: {
            id: crypto.randomBytes(16).toString('hex'),
            userId: existingUser.id,
            accountId: existingUser.id,
            providerId: 'credential',
            password: hashedPassword,
          },
        })
      }
      logger.info(`[ADMIN SEED] Verified and updated admin account: ${ADMIN_EMAIL}`)
    }
  } catch (error: any) {
    logger.error('[ADMIN SEED] Failed to ensure admin user', { message: error.message })
  }
}
