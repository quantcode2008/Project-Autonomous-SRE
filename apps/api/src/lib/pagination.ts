import { z } from 'zod'

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().optional(),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

export interface PaginatedResult<T> {
  items: T[]
  nextCursor: string | null
}

export function buildPagination<T extends { id: string }>(
  items: T[],
  limit: number,
): PaginatedResult<T> {
  const hasMore = items.length > limit
  const resultItems = hasMore ? items.slice(0, limit) : items
  const nextCursor = hasMore ? resultItems[resultItems.length - 1].id : null

  return {
    items: resultItems,
    nextCursor,
  }
}
