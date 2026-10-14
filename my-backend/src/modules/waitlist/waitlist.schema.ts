import { z } from 'zod'

export const createWaitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid work email address'),
  role: z.enum(['developer', 'sre', 'devops', 'startup', 'other']).optional().default('developer'),
})

export const listWaitlistQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type CreateWaitlistInput = z.infer<typeof createWaitlistSchema>
export type ListWaitlistQuery = z.infer<typeof listWaitlistQuerySchema>
