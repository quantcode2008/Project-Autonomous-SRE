import { z } from 'zod'
import dotenv from 'dotenv'
import path from 'path'

// Load .env relative to current working directory or backend root
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters long'),
  BETTER_AUTH_URL: z.string().url('BETTER_AUTH_URL must be a valid URL').default('http://localhost:4000'),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('\x1b[31m[FATAL] Invalid environment configuration:\x1b[0m')
    for (const issue of result.error.issues) {
      console.error(`  - \x1b[33m${issue.path.join('.')}\x1b[0m: ${issue.message}`)
    }
    process.exit(1)
  }

  return result.data
}

export const env = loadEnv()
