import cors from 'cors'
import express, { type Express, type Request, type Response } from 'express'
import helmet from 'helmet'
import pinoHttp from 'pino-http'
import { validateApiEnv } from './config/env'
import { checkDatabaseConnection } from './config/database'
import { logger } from './lib/logger'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth/better-auth'
import { errorHandler, notFoundHandler } from './middleware/error-handler'
import { originCheckMiddleware } from './middleware/origin-check'
import { apiRateLimiter, authRateLimiter } from './middleware/rate-limiter'
import { requestIdMiddleware } from './middleware/request-id'
import { accountRouter } from './modules/account/account.router'
import { ingestKeyRouter, projectRouter } from './modules/projects/project.router'
import { adminRouter } from './modules/admin/admin.router'
import { registerRouter } from './modules/auth/register.router'

export function createApp(): Express {
  const env = validateApiEnv()
  const app = express()

  // 1. Security & Core Infrastructure
  app.use(helmet())
  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
      exposedHeaders: ['X-Request-Id'],
    }),
  )
  app.use(requestIdMiddleware)

  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        genReqId: (req) => req.id,
      }),
    )
  }

  app.use(originCheckMiddleware)

  // 2. Health & Readiness (public to localhost / cluster)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  })

  app.get('/ready', async (_req: Request, res: Response) => {
    const isDbConnected = await checkDatabaseConnection()
    if (!isDbConnected) {
      res.status(503).json({ status: 'not_ready', database: 'disconnected' })
      return
    }
    res.status(200).json({ status: 'ready', database: 'connected' })
  })

  // 3. Mount Better Auth Router BEFORE express.json()
  app.all('/api/auth/*', authRateLimiter, toNodeHandler(auth))

  // 4. Body Parsing & Rate Limiting
  app.use(express.json({ limit: '1mb' }))
  app.use('/api/', apiRateLimiter)

  // 5. Mount API v1 Routers
  app.use('/api/v1', accountRouter)
  app.use('/api/v1/auth/register', registerRouter)
  app.use('/api/v1/projects', projectRouter)
  app.use('/api/v1/ingest-keys', ingestKeyRouter)
  app.use('/api/v1/admin', adminRouter)

  // 6. Error Handling
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
