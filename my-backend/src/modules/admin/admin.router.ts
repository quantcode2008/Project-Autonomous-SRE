import { Router } from 'express'
import { requireAuth, requireRole } from '../../auth/middleware'
import { validate } from '../../middleware/validate'
import { adminController } from './admin.controller'
import { listUsersQuerySchema, userParamSchema } from './admin.schema'

export const adminRouter = Router()

// All admin routes strictly require verified session and ADMIN role
adminRouter.use(requireAuth, requireRole('ADMIN'))

adminRouter.get(
  '/users',
  validate({ query: listUsersQuerySchema }),
  adminController.listUsers
)

adminRouter.patch(
  '/users/:id/approve',
  validate({ params: userParamSchema }),
  adminController.approveUser
)

adminRouter.patch(
  '/users/:id/reject',
  validate({ params: userParamSchema }),
  adminController.rejectUser
)
