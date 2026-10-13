import { PrismaClient } from '@prisma/client'
import { logger } from '../lib/logger'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma
}

export interface DbHealthResult {
  connected: boolean
  latencyMs: number
  error?: string
}

export async function checkDatabaseConnection(): Promise<DbHealthResult> {
  const start = Date.now()
  try {
    // Light ping using raw query with timeout
    await prisma.$queryRaw`SELECT 1`
    return {
      connected: true,
      latencyMs: Date.now() - start,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown database error'
    logger.warn('Database health check ping failed', { error: errorMsg })
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: errorMsg,
    }
  }
}
