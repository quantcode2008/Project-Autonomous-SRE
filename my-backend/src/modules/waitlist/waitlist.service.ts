import { prisma } from '../../config/database'
import { getPaginationBounds, buildPaginatedResponse, PaginatedResult } from '../../lib/pagination'
import { CreateWaitlistInput, ListWaitlistQuery } from './waitlist.schema'

export interface WaitlistResponse {
  success: boolean
  message: string
  confirmationId: string
  isDuplicate?: boolean
}

export class WaitlistService {
  async joinWaitlist(input: CreateWaitlistInput): Promise<WaitlistResponse> {
    const existing = await prisma.waitlistEntry.findUnique({
      where: { email: input.email },
    })

    if (existing) {
      return {
        success: true,
        message: "You're already on the priority list! We will reach out shortly.",
        confirmationId: existing.confirmationId,
        isDuplicate: true,
      }
    }

    const confirmationId = `stn_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`

    const entry = await prisma.waitlistEntry.create({
      data: {
        email: input.email,
        role: input.role || 'developer',
        confirmationId,
      },
    })

    return {
      success: true,
      message: "You're on the early access priority list. We'll be in touch with onboarding credentials.",
      confirmationId: entry.confirmationId,
      isDuplicate: false,
    }
  }

  async listWaitlist(query: ListWaitlistQuery): Promise<PaginatedResult<any>> {
    const { page, limit, skip, take } = getPaginationBounds(query)

    const [total, items] = await Promise.all([
      prisma.waitlistEntry.count(),
      prisma.waitlistEntry.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return buildPaginatedResponse(items, total, page, limit)
  }
}

export const waitlistService = new WaitlistService()
