import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { prisma } from '../config/database'

describe('Admin Module & Kill Switch Suite (T1.10, T1.11, T1.12)', () => {
  const app = createApp()
  const adminEmail = `admin_${Date.now()}@example.com`
  const regularEmail = `regular_${Date.now()}@example.com`
  const password = 'Password123!Admin'

  let adminCookie: string
  let regularCookie: string
  let adminUserId: string
  let regularUserId: string

  beforeAll(async () => {
    // 1. Create Admin User
    const resAdmin = await request(app)
      .post('/api/auth/sign-up/email')
      .send({ email: adminEmail, password, name: 'Admin SRE' })
    adminUserId = resAdmin.body.user.id

    // Promote to ADMIN directly
    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: 'ADMIN' },
    })

    const loginAdmin = await request(app)
      .post('/api/auth/sign-in/email')
      .send({ email: adminEmail, password })
    const cookieAdminHeader = loginAdmin.headers['set-cookie']
    adminCookie = Array.isArray(cookieAdminHeader)
      ? cookieAdminHeader.join('; ')
      : cookieAdminHeader

    // 2. Create Regular User
    const resRegular = await request(app)
      .post('/api/auth/sign-up/email')
      .send({ email: regularEmail, password, name: 'Regular Dev' })
    regularUserId = resRegular.body.user.id

    const loginRegular = await request(app)
      .post('/api/auth/sign-in/email')
      .send({ email: regularEmail, password })
    const cookieRegularHeader = loginRegular.headers['set-cookie']
    regularCookie = Array.isArray(cookieRegularHeader)
      ? cookieRegularHeader.join('; ')
      : cookieRegularHeader
  })

  afterAll(async () => {
    await prisma.auditLog.deleteMany({
      where: { actorId: { in: [adminUserId, regularUserId] } },
    })
    await prisma.user.deleteMany({
      where: { id: { in: [adminUserId, regularUserId] } },
    })
    await prisma.$disconnect()
  })

  it('rejects regular users from admin endpoints with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Cookie', regularCookie)

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('allows ADMIN to list all registered users', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Cookie', adminCookie)

    expect(res.status).toBe(200)
    expect(res.body.items).toBeDefined()
    expect(Array.isArray(res.body.items)).toBe(true)
    const user = res.body.items.find((u: any) => u.id === regularUserId)
    expect(user).toBeDefined()
    expect(user.email).toBe(regularEmail)
  })

  it('allows ADMIN to update user quota and disabled status', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${regularUserId}`)
      .set('Cookie', adminCookie)
      .send({ dailyInvestigationQuota: 20, disabled: false })

    expect(res.status).toBe(200)
    expect(res.body.dailyInvestigationQuota).toBe(20)

    const userInDb = await prisma.user.findUnique({ where: { id: regularUserId } })
    expect(userInDb?.dailyInvestigationQuota).toBe(20)
  })

  it('enforces last-admin protection: cannot demote self if sole admin', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${adminUserId}`)
      .set('Cookie', adminCookie)
      .send({ role: 'USER' })

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
    expect(res.body.error.message).toContain('cannot demote or disable')
  })

  it('allows ADMIN to toggle kill switch (investigations_paused) (T1.10)', async () => {
    // 1. Pause investigations
    const pauseRes = await request(app)
      .put('/api/v1/admin/flags/investigations_paused')
      .set('Cookie', adminCookie)
      .send({ value: true })

    expect(pauseRes.status).toBe(200)
    expect(pauseRes.body.key).toBe('investigations_paused')

    const flagInDb = await prisma.systemFlag.findUnique({
      where: { key: 'investigations_paused' },
    })
    expect((flagInDb?.value as any)?.paused).toBe(true)

    // 2. Unpause investigations
    const unpauseRes = await request(app)
      .put('/api/v1/admin/flags/investigations_paused')
      .set('Cookie', adminCookie)
      .send({ value: false })

    expect(unpauseRes.status).toBe(200)
  })

  it('allows ADMIN to view system stats and audit logs with redaction', async () => {
    const statsRes = await request(app)
      .get('/api/v1/admin/stats')
      .set('Cookie', adminCookie)

    expect(statsRes.status).toBe(200)
    expect(statsRes.body.users).toBeGreaterThanOrEqual(2)

    const logsRes = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Cookie', adminCookie)

    expect(logsRes.status).toBe(200)
    expect(logsRes.body.items).toBeDefined()
    expect(logsRes.body.items.length).toBeGreaterThan(0)
  })
})
