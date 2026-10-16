import { prisma } from '../../config/database'
import { getPaginationBounds, buildPaginatedResponse, PaginatedResult } from '../../lib/pagination'
import { AppError } from '../../middleware/error-handler'
import { ListUsersQuery } from './admin.schema'

export interface AdminUserView {
  id: string
  name: string
  email: string
  role: string
  emailVerified: boolean
  isApproved: boolean
  createdAt: Date
}

export class AdminService {
  async listUsers(query: ListUsersQuery): Promise<PaginatedResult<AdminUserView>> {
    const { page, limit, skip, take } = getPaginationBounds(query)

    const where: any = {}
    if (query.status === 'pending') {
      where.isApproved = false
    } else if (query.status === 'approved') {
      where.isApproved = true
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          isApproved: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return buildPaginatedResponse(users, total, page, limit)
  }

  async approveUser(userId: string): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    if (user.role === 'ADMIN') {
      throw new AppError('Cannot modify status of an administrator account', 400)
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isApproved: true },
    })

    return {
      success: true,
      message: `User ${user.email} approved successfully. Sign in is now enabled.`,
    }
  }

  async rejectUser(userId: string): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    if (user.role === 'ADMIN') {
      throw new AppError('Cannot modify status of an administrator account', 400)
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isApproved: false },
    })

    return {
      success: true,
      message: `Approval for user ${user.email} has been revoked.`,
    }
  }
}

export const adminService = new AdminService()
