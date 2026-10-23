import { fromNodeHeaders } from 'better-auth/node'
import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../lib/errors'
import { auth, type AuthSession } from './better-auth'

declare global {
  namespace Express {
    interface Request {
      user?: AuthSession['user'] & {
        role: 'USER' | 'ADMIN'
        disabled: boolean
        dailyInvestigationQuota: number
      }
      session?: AuthSession['session']
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })

    if (!session || !session.user) {
      throw AppError.unauthenticated('Authentication required')
    }

    // Always re-verify user status directly from database to guarantee disabled status takes effect immediately
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      throw AppError.unauthenticated('User not found')
    }

    if (user.disabled) {
      throw AppError.forbidden('Account is disabled')
    }

    req.user = user as Express.Request['user']
    req.session = session.session
    next()
  } catch (err) {
    next(err)
  }
}

export function requireRole(role: 'USER' | 'ADMIN') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthenticated('Authentication required'))
    }

    if (role === 'ADMIN' && req.user.role !== 'ADMIN') {
      return next(AppError.forbidden('Administrator access required'))
    }

    next()
  }
}
