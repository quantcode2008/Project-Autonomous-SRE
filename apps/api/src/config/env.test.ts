import { describe, it, expect } from 'vitest'
import { validateApiEnv } from './env'

describe('validateApiEnv', () => {
  it('throws a descriptive error when required variables are missing', () => {
    expect(() => validateApiEnv({})).toThrow(/\[API STARTUP ERROR\] Invalid environment variables:/)
  })

  it('succeeds when all required variables are valid', () => {
    const validConfig = {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://sentinel:pass@localhost:5432/sentinel',
      REDIS_URL: 'redis://localhost:6379/0',
      INTERNAL_SERVICE_TOKEN: '0123456789abcdef0123456789abcdef',
      ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef',
      BETTER_AUTH_SECRET: '0123456789abcdef0123456789abcdef',
      BETTER_AUTH_URL: 'http://localhost:4000',
      ENGINE_URL: 'http://127.0.0.1:8000',
    }

    const env = validateApiEnv(validConfig as any)
    expect(env.DATABASE_URL).toBe(validConfig.DATABASE_URL)
    expect(env.PORT).toBe(4000)
  })
})
