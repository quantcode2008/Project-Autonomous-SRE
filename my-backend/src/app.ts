import express, { Express, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { toNodeHandler } from 'better-auth/node'
import { env } from './config/env'
import { logger } from './lib/logger'
import { auth } from './auth/better-auth'
import { authRateLimiter, apiRateLimiter } from './middleware/rate-limiter'
import { errorHandler } from './middleware/error-handler'
import { notFoundHandler } from './middleware/not-found'
import { healthRouter } from './modules/health/health.router'
import { userRouter } from './modules/user/user.router'
import { waitlistRouter } from './modules/waitlist/waitlist.router'
import { itemRouter } from './modules/items/item.router'

export function createApp(): Express {
  const app = express()

  // 1. Security Headers
  app.use(helmet())

  // 2. Strict CORS - allowing only frontend origin with credentials
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
      exposedHeaders: ['Set-Cookie'],
    })
  )

  // 3. Body parsers with strict size limits
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))

  // 4. Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now()
    res.on('finish', () => {
      const duration = Date.now() - start
      logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`)
    })
    next()
  })

  // 5. Mount Better Auth endpoints with auth rate limiter
  app.get('/api/auth', (_req: Request, res: Response) => {
    res.json({
      name: 'Better Auth Gateway',
      status: 'active',
      endpoints: {
        signUp: 'POST /api/auth/sign-up/email',
        signIn: 'POST /api/auth/sign-in/email',
        signOut: 'POST /api/auth/sign-out',
        session: 'GET /api/auth/get-session',
      },
    })
  })
  app.use('/api/auth', authRateLimiter, toNodeHandler(auth))

  // 6. Application Routes
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'SentinelAI Backend API',
      status: 'online',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        v1: {
          me: '/api/v1/me',
          waitlist: '/api/v1/waitlist',
          items: '/api/v1/items',
        },
      },
    })
  })

  app.use('/health', healthRouter)
  app.use('/api/health', healthRouter)
  app.use('/api/v1', apiRateLimiter, userRouter)
  app.use('/api/v1/waitlist', waitlistRouter)
  app.use('/api/v1/items', itemRouter)

  // 7. 404 & Centralized Error Handling
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

export const app = createApp()
