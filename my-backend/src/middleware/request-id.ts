import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

declare global {
  namespace Express {
    interface Request {
      id?: string
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Respect incoming X-Request-Id if valid UUID, otherwise generate a secure random UUID
  const incomingId = req.headers['x-request-id']
  const requestId = typeof incomingId === 'string' && incomingId.length <= 64 
    ? incomingId 
    : crypto.randomUUID()

  req.id = requestId
  res.setHeader('X-Request-Id', requestId)
  next()
}
