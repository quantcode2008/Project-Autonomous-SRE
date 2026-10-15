import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { ADMIN_EMAIL, ADMIN_PASS } from '../src/config/seed-admin'

describe('Registration, OTP Verification & Admin Approval Flow', () => {
  const testEmail = `test_flow_${Date.now()}@acme.corp`
  const testPassword = 'Password123!'
  let devOtp: string
  let adminCookie: string
  let targetUserId: string

  it('1. Admin can sign in with fixed credentials', async () => {
    const res = await request(app)
      .post('/api/auth/sign-in/email')
      .set('Origin', 'http://localhost:3000')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASS })

    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('ADMIN')
    expect(res.headers['set-cookie']).toBeDefined()
    adminCookie = res.headers['set-cookie'][0]
  })

  it('2. User can register and receives OTP', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Origin', 'http://localhost:3000')
      .send({
        name: 'Test Flow User',
        email: testEmail,
        password: testPassword,
      })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.devOtp).toBeDefined()
    devOtp = res.body.devOtp
  })

  it('3. User cannot sign in before verifying email OTP (403)', async () => {
    const res = await request(app)
      .post('/api/auth/sign-in/email')
      .set('Origin', 'http://localhost:3000')
      .send({ email: testEmail, password: testPassword })

    expect(res.status).toBe(403)
    expect(res.body.message).toMatch(/verify your email/i)
  })

  it('4. Rejects invalid OTP (400)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/verify-otp')
      .set('Origin', 'http://localhost:3000')
      .send({ email: testEmail, otp: '000000' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Invalid verification code/i)
  })

  it('5. Successfully verifies valid OTP (200)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/verify-otp')
      .set('Origin', 'http://localhost:3000')
      .send({ email: testEmail, otp: devOtp })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toMatch(/pending administrator approval/i)
  })

  it('6. User cannot sign in while awaiting admin approval (403)', async () => {
    const res = await request(app)
      .post('/api/auth/sign-in/email')
      .set('Origin', 'http://localhost:3000')
      .send({ email: testEmail, password: testPassword })

    expect(res.status).toBe(403)
    expect(res.body.message).toMatch(/awaiting administrator approval/i)
  })

  it('7. Non-admin is blocked from admin routes (401 / 403)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Origin', 'http://localhost:3000')

    expect(res.status).toBe(401)
  })

  it('8. Admin lists users and approves the user (200)', async () => {
    const listRes = await request(app)
      .get('/api/v1/admin/users?status=pending')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', adminCookie)

    expect(listRes.status).toBe(200)
    const found = listRes.body.data.find((u: any) => u.email === testEmail)
    expect(found).toBeDefined()
    targetUserId = found.id

    const approveRes = await request(app)
      .patch(`/api/v1/admin/users/${targetUserId}/approve`)
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', adminCookie)

    expect(approveRes.status).toBe(200)
    expect(approveRes.body.success).toBe(true)
  })

  it('9. User can now sign in with ease after admin approval (200)', async () => {
    const res = await request(app)
      .post('/api/auth/sign-in/email')
      .set('Origin', 'http://localhost:3000')
      .send({ email: testEmail, password: testPassword })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe(testEmail)
  })
})
