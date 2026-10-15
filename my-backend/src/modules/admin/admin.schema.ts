import { z } from 'zod'

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  status: z.enum(['all', 'pending', 'approved']).default('all'),
})

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>

export const userParamSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
})

export type UserParam = z.infer<typeof userParamSchema>
