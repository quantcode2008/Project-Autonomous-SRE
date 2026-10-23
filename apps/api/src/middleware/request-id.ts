import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

declare global {
  namespace Express {
    interface Request {
      id: string
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-request-id']
  const reqId =
    typeof incomingId === 'string' && incomingId.trim()
      ? incomingId.trim()
      : `req_${randomUUID().replace(/-/g, '').slice(0, 12)}`

  req.id = reqId
  res.setHeader('X-Request-Id', reqId)
  next()
}
