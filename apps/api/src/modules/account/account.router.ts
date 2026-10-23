import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../auth/middleware'
import { prisma } from '../../config/database'
import { validate } from '../../middleware/validate'

export const accountRouter = Router()

accountRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = req.user!
    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      quota: {
        daily: user.dailyInvestigationQuota,
        usedToday: 0,
      },
    })
  } catch (err) {
    next(err)
  }
})

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(100, 'Name cannot exceed 100 characters'),
})

accountRouter.patch('/me', requireAuth, validate({ body: updateAccountSchema }), async (req, res, next) => {
  try {
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: req.body.name },
    })
    res.status(200).json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      emailVerified: updated.emailVerified,
    })
  } catch (err) {
    next(err)
  }
})
