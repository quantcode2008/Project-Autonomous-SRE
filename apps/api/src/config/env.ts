import { Role, Severity } from '@sentinel/shared'
import dotenv from 'dotenv'
import path from 'node:path'
import { z } from 'zod'

// Load root .env explicitly
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

export const apiEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(() => Number(process.env.API_PORT) || 4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  INTERNAL_SERVICE_TOKEN: z.string().min(16, 'INTERNAL_SERVICE_TOKEN must be at least 16 characters'),
  ENCRYPTION_KEY: z.string().min(16, 'ENCRYPTION_KEY must be at least 16 characters'),
  BETTER_AUTH_SECRET: z.string().min(16, 'BETTER_AUTH_SECRET must be at least 16 characters'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:4000'),
  ENGINE_URL: z.string().url().default('http://127.0.0.1:8000'),
})

export type ApiEnv = z.infer<typeof apiEnvSchema>

export function validateApiEnv(rawEnv: NodeJS.ProcessEnv = process.env): ApiEnv {
  const result = apiEnvSchema.safeParse(rawEnv)
  if (!result.success) {
    const errorDetails = result.error.errors.map((err) => `  - ${err.path.join('.')}: ${err.message}`).join('\n')
    const message = `[API STARTUP ERROR] Invalid environment variables:\n${errorDetails}`
    console.error(`\n❌ ${message}\n`)
    throw new Error(message)
  }
  return result.data
}
