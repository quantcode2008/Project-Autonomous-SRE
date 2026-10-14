import { z } from 'zod'

export const createItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title cannot exceed 120 characters'),
  description: z.string().trim().max(1000, 'Description cannot exceed 1000 characters').optional(),
})

export const updateItemSchema = z
  .object({
    title: z.string().trim().min(1, 'Title cannot be empty').max(120).optional(),
    description: z.string().trim().max(1000).optional(),
  })
  .refine(
    (data) => data.title !== undefined || data.description !== undefined,
    'At least one field must be provided for update'
  )

export const itemIdParamSchema = z.object({
  id: z.string().uuid('Invalid item ID format'),
})

export const listItemsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
})

export type CreateItemInput = z.infer<typeof createItemSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>
export type ItemIdParam = z.infer<typeof itemIdParamSchema>
export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>
