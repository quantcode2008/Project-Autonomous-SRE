export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationMetadata {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: PaginationMetadata
}

export const MAX_PAGE_LIMIT = 100
export const DEFAULT_PAGE_LIMIT = 20

/**
 * Normalizes input page and limit to safe boundaries.
 */
export function getPaginationBounds(params?: PaginationParams): {
  page: number
  limit: number
  skip: number
  take: number
} {
  const rawPage = Number(params?.page)
  const rawLimit = Number(params?.limit)

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1
  const parsedLimit = Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_PAGE_LIMIT
  const limit = Math.min(parsedLimit, MAX_PAGE_LIMIT)

  const skip = (page - 1) * limit
  const take = limit

  return { page, limit, skip, take }
}

/**
 * Builds standard paginated response envelope.
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit) || 1

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}
