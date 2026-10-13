import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      PORT: '4001',
      CORS_ORIGIN: 'http://localhost:3000',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/my_backend_db?schema=public',
      BETTER_AUTH_SECRET: 'test_secret_key_at_least_32_characters_long_123456',
      BETTER_AUTH_URL: 'http://localhost:4001',
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
  },
})
