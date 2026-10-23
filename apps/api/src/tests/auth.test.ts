import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { prisma } from '../config/database'

describe('Authentication & Authorization Suite (T1.3, T1.4)', () => {
  const app = createApp()
  const testEmail = `test_${Date.now()}@example.com`
  const testPassword = 'Password123!Secure'
  let sessionCookie: string
  let userId: string

  beforeAll(async () => {
    // Clean up any test user if exists
    await prisma.user.deleteMany({
      where: { email: { contains: 'test_' } },
    })
  })

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'test_' } },
    })
    await prisma.$disconnect()
  })

  it('signs up a new user via Better Auth', async () => {
    const res = await request(app)
      .post('/api/auth/sign-up/email')
      .send({
        email: testEmail,
        password: testPassword,
        name: 'Test SRE',
      })

    expect(res.status).toBe(200)
    expect(res.body.user).toBeDefined()
    expect(res.body.user.email).toBe(testEmail)
    expect(res.body.user.name).toBe('Test SRE')

    userId = res.body.user.id
    const userInDb = await prisma.user.findUnique({ where: { id: userId } })
    expect(userInDb).toBeDefined()
    expect(userInDb?.role).toBe('USER')
    expect(userInDb?.disabled).toBe(false)
  })

  it('signs in with email and password, returning session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/sign-in/email')
      .send({
        email: testEmail,
        password: testPassword,
      })

    expect(res.status).toBe(200)
    expect(res.body.user).toBeDefined()

    const cookies = res.headers['set-cookie']
    expect(cookies).toBeDefined()
    sessionCookie = Array.isArray(cookies) ? cookies.join('; ') : cookies
    expect(sessionCookie).toContain('better-auth.session_token')
  })

  it('GET /api/v1/me returns authenticated user identity', async () => {
    const res = await request(app)
      .get('/api/v1/me')
      .set('Cookie', sessionCookie)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(userId)
    expect(res.body.email).toBe(testEmail)
    expect(res.body.name).toBe('Test SRE')
    expect(res.body.role).toBe('USER')
    expect(res.body.quota).toBeDefined()
    expect(res.body.quota.daily).toBe(5)
  })

  it('rejects unauthenticated requests to protected endpoints with 401', async () => {
    const res = await request(app).get('/api/v1/me')
    expect(res.status).toBe(401)
    expect(res.body.error).toBeDefined()
    expect(res.body.error.code).toBe('UNAUTHENTICATED')
  })

  it('blocks disabled user from protected endpoints even with valid active session', async () => {
    // Disable user directly in database
    await prisma.user.update({
      where: { id: userId },
      data: { disabled: true },
    })

    const res = await request(app)
      .get('/api/v1/me')
      .set('Cookie', sessionCookie)

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
    expect(res.body.error.message).toContain('Account is disabled')

    // Re-enable user for remaining tests
    await prisma.user.update({
      where: { id: userId },
      data: { disabled: false },
    })
  })

  it('blocks non-admin user from admin routes with 403', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Cookie', sessionCookie)

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })
})
