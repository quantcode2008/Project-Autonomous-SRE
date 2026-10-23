import { createApp } from './app'
import { validateApiEnv } from './config/env'
import { logger } from './lib/logger'

const env = validateApiEnv()
const app = createApp()

const server = app.listen(env.PORT, () => {
  logger.info(
    `[API] Server started on http://localhost:${env.PORT} (allowed origin: ${env.WEB_ORIGIN}) [${env.NODE_ENV}]`,
  )
})

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, closing API server...')
  server.close()
})

process.on('SIGINT', () => {
  logger.info('Received SIGINT, closing API server...')
  server.close()
})
