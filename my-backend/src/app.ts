import express, { Express, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { toNodeHandler } from 'better-auth/node'
import { env } from './config/env'
import { logger } from './lib/logger'
import { auth } from './auth/better-auth'
import { authRateLimiter, apiRateLimiter } from './middleware/rate-limiter'
import { requestIdMiddleware } from './middleware/request-id'
import { errorHandler } from './middleware/error-handler'
import { notFoundHandler } from './middleware/not-found'
import { healthRouter } from './modules/health/health.router'
import { userRouter } from './modules/user/user.router'
import { waitlistRouter } from './modules/waitlist/waitlist.router'
import { itemRouter } from './modules/items/item.router'
import { registrationRouter } from './modules/registration/registration.router'
import { adminRouter } from './modules/admin/admin.router'

export function createApp(): Express {
  const app = express()

  // 1. Correlation Request ID
  app.use(requestIdMiddleware)

  // 2. Strict Security Headers via Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-site' },
      contentSecurityPolicy: false, // API server does not serve HTML documents
    })
  )

  // 3. Strict Whitelist CORS Configuration
  const allowedOrigins = [
    env.CORS_ORIGIN,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean)

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes(origin)) {
          return callback(null, true)
        }
        return callback(new Error(`CORS policy violation: origin ${origin} is not allowed`))
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie', 'X-Request-Id'],
      exposedHeaders: ['Set-Cookie', 'X-Request-Id'],
    })
  )

  // 4. Body parsers with strict 100kb payload size limit
  app.use(express.json({ limit: '100kb' }))
  app.use(express.urlencoded({ extended: false, limit: '100kb' }))

  // 5. Request logging with correlation ID and duration
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now()
    res.on('finish', () => {
      const duration = Date.now() - start
      logger.info(
        `[${req.id}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`
      )
    })
    next()
  })

  // 6. Mount Better Auth endpoints with auth rate limiter
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

  // 7. Root API Gateway Discovery
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

  // 8. Health and Status Checks
  app.use('/health', healthRouter)
  app.use('/api/health', healthRouter)

  // 9. Application v1 Routes protected by global apiRateLimiter
  app.use('/api/v1', apiRateLimiter)
  app.use('/api/v1', userRouter)
  app.use('/api/v1/waitlist', waitlistRouter)
  app.use('/api/v1/items', itemRouter)
  app.use('/api/v1/auth/register', registrationRouter)
  app.use('/api/v1/admin', adminRouter)

  // 10. 404 & Centralized Error Handling
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

export const app = createApp()
