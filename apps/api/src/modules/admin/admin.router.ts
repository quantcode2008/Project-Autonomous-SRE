import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireRole } from '../../auth/middleware'
import { paginationQuerySchema } from '../../lib/pagination'
import { validate } from '../../middleware/validate'
import { adminService } from './admin.service'

export const adminRouter = Router()

// All admin routes strictly require authenticated user with ADMIN role
adminRouter.use(requireAuth, requireRole('ADMIN'))

// 1. List Users
const listUsersQuerySchema = paginationQuerySchema.extend({
  q: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  disabled: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
})

adminRouter.get(
  '/users',
  validate({ query: listUsersQuerySchema }),
  async (req, res, next) => {
    try {
      const { q, role, disabled, limit, cursor } = req.query as any
      const result = await adminService.listUsers({ q, role, disabled, limit, cursor })
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },
)

// 2. Update User (Role, Disabled Flag, Quota)
const updateUserSchema = z.object({
  role: z.enum(['USER', 'ADMIN']).optional(),
  disabled: z.boolean().optional(),
  dailyInvestigationQuota: z.number().int().min(0).max(100).optional(),
})

adminRouter.patch(
  '/users/:id',
  validate({ body: updateUserSchema }),
  async (req, res, next) => {
    try {
      const updated = await adminService.updateUser(
        req.user!.id,
        req.params.id as string,
        req.body,
        req.ip,
      )
      res.status(200).json(updated)
    } catch (err) {
      next(err)
    }
  },
)

adminRouter.patch('/users/:id/approve', async (req, res, next) => {
  try {
    const updated = await adminService.updateUser(
      req.user!.id,
      req.params.id as string,
      { disabled: false },
      req.ip,
    )
    res.status(200).json({ ...updated, isApproved: true })
  } catch (err) {
    next(err)
  }
})

adminRouter.patch('/users/:id/reject', async (req, res, next) => {
  try {
    const updated = await adminService.updateUser(
      req.user!.id,
      req.params.id as string,
      { disabled: true },
      req.ip,
    )
    res.status(200).json({ ...updated, isApproved: false })
  } catch (err) {
    next(err)
  }
})

// 3. List Audit Logs
const listAuditLogsSchema = paginationQuerySchema.extend({
  actorId: z.string().optional(),
  action: z.string().optional(),
  projectId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

adminRouter.get(
  '/audit-logs',
  validate({ query: listAuditLogsSchema }),
  async (req, res, next) => {
    try {
      const { actorId, action, projectId, from, to, limit, cursor } = req.query as any
      const result = await adminService.listAuditLogs({
        actorId,
        action,
        projectId,
        from,
        to,
        limit,
        cursor,
      })
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },
)

// 4. Platform Stats
adminRouter.get('/stats', async (_req, res, next) => {
  try {
    const stats = await adminService.getStats()
    res.status(200).json(stats)
  } catch (err) {
    next(err)
  }
})

// 5. System Flags
adminRouter.get('/flags', async (_req, res, next) => {
  try {
    const flags = await adminService.getFlags()
    res.status(200).json(flags)
  } catch (err) {
    next(err)
  }
})

// 6. Kill Switch: Investigations Paused Flag
const setFlagSchema = z.object({
  value: z.boolean(),
})

adminRouter.put(
  '/flags/investigations_paused',
  validate({ body: setFlagSchema }),
  async (req, res, next) => {
    try {
      const flag = await adminService.setInvestigationsPaused(
        req.user!.id,
        req.body.value,
        req.ip,
      )
      res.status(200).json(flag)
    } catch (err) {
      next(err)
    }
  },
)
