import { Router, Request, Response } from 'express'
import { requireAuth, requireRole } from '../../auth/middleware'

export const userRouter = Router()

/**
 * GET /api/v1/me
 * Protected route: Returns identity derived strictly from verified session
 */
userRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  res.status(200).json({
    user: req.user,
    session: {
      id: req.session?.id,
      expiresAt: req.session?.expiresAt,
    },
  })
})

/**
 * GET /api/v1/admin/dashboard
 * Protected admin route: Requires verified ADMIN role
 */
userRouter.get('/admin/dashboard', requireAuth, requireRole('ADMIN'), (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to the Admin Dashboard',
    adminId: req.user?.id,
    timestamp: new Date().toISOString(),
  })
})
