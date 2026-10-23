import { prisma } from '../../config/database'
import { recordAudit } from '../../lib/audit'
import { engineClient } from '../../lib/engine-client'
import { AppError } from '../../lib/errors'
import { buildPagination, type PaginatedResult } from '../../lib/pagination'

export class AdminService {
  async listUsers(params: {
    q?: string
    role?: 'USER' | 'ADMIN'
    disabled?: boolean
    limit?: number
    cursor?: string
  }): Promise<PaginatedResult<any>> {
    const { q, role, disabled, limit = 25, cursor } = params

    const where: any = {}
    if (role) where.role = role
    if (typeof disabled === 'boolean') where.disabled = disabled
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        disabled: true,
        dailyInvestigationQuota: true,
        createdAt: true,
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const mappedUsers = users.map((u) => ({
      ...u,
      isApproved: !u.disabled,
    }))

    return buildPagination(mappedUsers, limit)
  }

  async updateUser(
    actorId: string,
    targetUserId: string,
    data: { role?: 'USER' | 'ADMIN'; disabled?: boolean; dailyInvestigationQuota?: number },
    ip?: string,
  ) {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    })

    if (!targetUser) {
      throw AppError.notFound('User not found')
    }

    // Last-admin and self-protection
    const isDemotingOrDisabling =
      (data.role && data.role !== 'ADMIN' && targetUser.role === 'ADMIN') ||
      (data.disabled === true && targetUser.role === 'ADMIN')

    if (isDemotingOrDisabling) {
      if (actorId === targetUserId) {
        throw AppError.forbidden('You cannot demote or disable your own admin account')
      }

      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', disabled: false },
      })

      if (adminCount <= 1) {
        throw AppError.forbidden('Cannot demote or disable the last active administrator')
      }
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        disabled: true,
        dailyInvestigationQuota: true,
        updatedAt: true,
      },
    })

    await recordAudit({
      actorId,
      action: 'admin.user_update',
      targetType: 'user',
      targetId: targetUserId,
      metadata: data,
      ip,
    })

    return updated
  }

  async listAuditLogs(params: {
    actorId?: string
    action?: string
    projectId?: string
    from?: string
    to?: string
    limit?: number
    cursor?: string
  }): Promise<PaginatedResult<any>> {
    const { actorId, action, projectId, from, to, limit = 50, cursor } = params

    const where: any = {}
    if (actorId) where.actorId = actorId
    if (action) where.action = action
    if (projectId) where.projectId = projectId
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    return buildPagination(logs, limit)
  }

  async getStats() {
    const [userCount, projectCount, adminCount, pausedFlag] = await Promise.all([
      prisma.user.count(),
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.systemFlag.findUnique({ where: { key: 'investigations_paused' } }),
    ])

    return {
      users: userCount,
      admins: adminCount,
      projects: projectCount,
      investigationsPaused: pausedFlag ? Boolean((pausedFlag.value as any)?.paused) : false,
    }
  }

  async getFlags() {
    return prisma.systemFlag.findMany()
  }

  async setInvestigationsPaused(actorId: string, paused: boolean, ip?: string) {
    const flag = await prisma.systemFlag.upsert({
      where: { key: 'investigations_paused' },
      create: {
        key: 'investigations_paused',
        value: { paused },
        updatedBy: actorId,
      },
      update: {
        value: { paused },
        updatedBy: actorId,
      },
    })

    await recordAudit({
      actorId,
      action: 'admin.flag_update',
      targetType: 'system_flag',
      targetId: 'investigations_paused',
      metadata: { paused },
      ip,
    })

    // Push immediately to engine
    engineClient.pushFlag('investigations_paused', paused).catch(() => {})

    return flag
  }

  async isInvestigationsPaused(): Promise<boolean> {
    const flag = await prisma.systemFlag.findUnique({
      where: { key: 'investigations_paused' },
    })
    return flag ? Boolean((flag.value as any)?.paused) : false
  }
}

export const adminService = new AdminService()
