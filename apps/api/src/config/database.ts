import { PrismaClient } from '@prisma/client'
import { validateApiEnv } from './env'
import { logger } from '../lib/logger'

const env = validateApiEnv()

const databaseUrl = env.DATABASE_URL.includes('schema=')
  ? env.DATABASE_URL
  : `${env.DATABASE_URL}${env.DATABASE_URL.includes('?') ? '&' : '?'}schema=platform`

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log:
      env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  })

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    logger.error({ error }, 'Failed database connection check')
    return false
  }
}
