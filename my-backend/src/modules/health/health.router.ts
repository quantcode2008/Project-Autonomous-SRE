import { Router, Request, Response } from 'express'
import { checkDatabaseConnection } from '../../config/database'

export const healthRouter = Router()

healthRouter.get('/', async (req: Request, res: Response) => {
  const dbHealth = await checkDatabaseConnection()

  const payload = {
    status: dbHealth.connected ? 'ok' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'my-backend',
    database: {
      status: dbHealth.connected ? 'connected' : 'disconnected',
      latencyMs: dbHealth.latencyMs,
      ...(dbHealth.error && { error: dbHealth.error }),
    },
  }

  // 200 if DB is connected, 503 if DB is disconnected
  const statusCode = dbHealth.connected ? 200 : 503
  res.status(statusCode).json(payload)
})
