import { Request, Response, NextFunction } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import { auth, Session } from './better-auth'

// Augment Express Request interface with session-derived identity
declare global {
  namespace Express {
    interface Request {
      user?: Session['user']
      session?: Session['session']
    }
  }
}

/**
 * Authentication Guard Middleware
 * Derives user identity strictly from the verified Better Auth session.
 * Rejects requests with 401 Unauthorized if no valid session exists.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionData = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })

    if (!sessionData || !sessionData.user || !sessionData.session) {
      res.status(401).json({
        error: 'Unauthorized: Active session required',
        code: 'UNAUTHORIZED',
      })
      return
    }

    // Attach verified session and identity
    req.user = sessionData.user
    req.session = sessionData.session

    next()
  } catch {
    res.status(401).json({
      error: 'Unauthorized: Session verification failed',
      code: 'UNAUTHORIZED',
    })
  }
}

/**
 * Role-Based Access Control Guard
 * Requires the user to hold a specific role (e.g. 'ADMIN').
 */
export function requireRole(requiredRole: 'USER' | 'ADMIN') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized: Authentication required',
        code: 'UNAUTHORIZED',
      })
      return
    }

    const userRole = (req.user as { role?: string }).role || 'USER'

    if (userRole !== requiredRole) {
      res.status(403).json({
        error: `Forbidden: Requires ${requiredRole} role`,
        code: 'FORBIDDEN',
      })
      return
    }

    next()
  }
}
