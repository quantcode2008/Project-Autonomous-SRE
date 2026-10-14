import { prisma } from '../../config/database'
import { getPaginationBounds, buildPaginatedResponse, PaginatedResult } from '../../lib/pagination'
import { CreateItemInput, UpdateItemInput, ListItemsQuery } from './item.schema'

export class ItemService {
  /**
   * Create an item strictly assigned to the verified session user.
   */
  async createItem(userId: string, input: CreateItemInput) {
    return prisma.item.create({
      data: {
        title: input.title,
        description: input.description,
        userId,
      },
    })
  }

  /**
   * List items scoped strictly to the verified session user, with pagination and optional search.
   */
  async listItems(userId: string, query: ListItemsQuery): Promise<PaginatedResult<any>> {
    const { page, limit, skip, take } = getPaginationBounds(query)

    const where: any = { userId }
    if (query.search) {
      where.title = {
        contains: query.search,
        mode: 'insensitive',
      }
    }

    const [total, items] = await Promise.all([
      prisma.item.count({ where }),
      prisma.item.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return buildPaginatedResponse(items, total, page, limit)
  }

  /**
   * Get an item by ID, strictly constrained to the requesting user.
   * Returns null if item doesn't exist OR belongs to another user (anti-IDOR).
   */
  async getItemById(userId: string, id: string) {
    return prisma.item.findFirst({
      where: {
        id,
        userId,
      },
    })
  }

  /**
   * Update an item by ID, strictly constrained to the requesting user.
   * Returns null if item does not exist or belongs to another user.
   */
  async updateItem(userId: string, id: string, input: UpdateItemInput) {
    // Verify ownership first
    const existing = await prisma.item.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return null
    }

    return prisma.item.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
    })
  }

  /**
   * Delete an item by ID, strictly constrained to the requesting user.
   * Returns false if item does not exist or belongs to another user.
   */
  async deleteItem(userId: string, id: string): Promise<boolean> {
    const existing = await prisma.item.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return false
    }

    await prisma.item.delete({
      where: { id },
    })

    return true
  }
}

export const itemService = new ItemService()
