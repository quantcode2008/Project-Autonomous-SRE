import { app } from './app'
import { env } from './config/env'
import { logger } from './lib/logger'
import { prisma } from './config/database'

const server = app.listen(env.PORT, () => {
  logger.info(`Server started on http://localhost:${env.PORT} [${env.NODE_ENV}]`)
  logger.info(`Health check available at http://localhost:${env.PORT}/health`)
})

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Gracefully shutting down...`)
  server.close(async () => {
    logger.info('HTTP server closed.')
    await prisma.$disconnect()
    logger.info('Prisma disconnected.')
    process.exit(0)
  })

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
