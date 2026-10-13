import { beforeAll, afterAll } from 'vitest'

beforeAll(() => {
  // Use Object.assign to safely populate process.env without TS readonly property errors
  Object.assign(process.env, {
    NODE_ENV: 'test',
    PORT: '4001',
    CORS_ORIGIN: 'http://localhost:3000',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/my_backend_db?schema=public',
    BETTER_AUTH_SECRET: 'test_secret_key_at_least_32_characters_long_123456',
    BETTER_AUTH_URL: 'http://localhost:4001',
  })
})

afterAll(async () => {
  // Global cleanup if needed
})
