import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { auth } from '../src/auth/better-auth'
import { prisma } from '../src/config/database'

describe('Waitlist & Early Access Module (Phase 3)', () => {
  const adminUser = {
    id: 'usr_admin',
    name: 'Admin User',
    email: 'admin@acme.corp',
    role: 'ADMIN',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const regularUser = {
    id: 'usr_regular',
    name: 'Regular User',
    email: 'user@acme.corp',
    role: 'USER',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('POST /api/v1/waitlist (Public Early Access Registration)', () => {
    it('successfully registers a new work email (201 Created)', async () => {
      vi.spyOn(prisma.waitlistEntry, 'findUnique').mockResolvedValueOnce(null)
      vi.spyOn(prisma.waitlistEntry, 'create').mockResolvedValueOnce({
        id: 'wl_test_1',
        email: 'lead@startup.io',
        role: 'sre',
        confirmationId: 'stn_abc_123',
        createdAt: new Date(),
      } as any)

      const response = await request(app)
        .post('/api/v1/waitlist')
        .send({
          email: 'lead@startup.io',
          role: 'sre',
        })

      expect(response.status).toBe(201)
      expect(response.body).toEqual({
        success: true,
        message: "You're on the early access priority list. We'll be in touch with onboarding credentials.",
        confirmationId: 'stn_abc_123',
        isDuplicate: false,
      })
      expect(prisma.waitlistEntry.create).toHaveBeenCalledWith({
        data: {
          email: 'lead@startup.io',
          role: 'sre',
          confirmationId: expect.stringMatching(/^stn_/),
        },
      })
    })

    it('handles duplicate registrations idempotently (200 OK)', async () => {
      vi.spyOn(prisma.waitlistEntry, 'findUnique').mockResolvedValueOnce({
        id: 'wl_existing',
        email: 'lead@startup.io',
        role: 'sre',
        confirmationId: 'stn_existing_999',
        createdAt: new Date(),
      } as any)

      const response = await request(app)
        .post('/api/v1/waitlist')
        .send({
          email: 'lead@startup.io',
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        message: "You're already on the priority list! We will reach out shortly.",
        confirmationId: 'stn_existing_999',
        isDuplicate: true,
      })
    })

    it('rejects invalid email format (400 Bad Request)', async () => {
      const response = await request(app)
        .post('/api/v1/waitlist')
        .send({
          email: 'not-an-email',
        })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
      expect(response.body.details[0].field).toBe('email')
    })
  })

  describe('GET /api/v1/waitlist (Admin Only List & Pagination)', () => {
    it('rejects unauthenticated requests (401)', async () => {
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce(null as any)

      const response = await request(app).get('/api/v1/waitlist')

      expect(response.status).toBe(401)
      expect(response.body.code).toBe('UNAUTHORIZED')
    })

    it('rejects standard USER role from viewing waitlist (403 Forbidden)', async () => {
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce({
        user: regularUser,
        session: { id: 'sess_reg', userId: regularUser.id },
      } as any)

      const response = await request(app).get('/api/v1/waitlist')

      expect(response.status).toBe(403)
      expect(response.body.code).toBe('FORBIDDEN')
    })

    it('allows ADMIN to view paginated waitlist registrations (200 OK)', async () => {
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce({
        user: adminUser,
        session: { id: 'sess_admin', userId: adminUser.id },
      } as any)

      const mockEntries = [
        {
          id: 'wl_1',
          email: 'lead@startup.io',
          role: 'sre',
          confirmationId: 'stn_1',
          createdAt: new Date(),
        },
      ]

      vi.spyOn(prisma.waitlistEntry, 'count').mockResolvedValueOnce(1)
      vi.spyOn(prisma.waitlistEntry, 'findMany').mockResolvedValueOnce(mockEntries as any)

      const response = await request(app).get('/api/v1/waitlist?page=1&limit=20')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })
    })
  })
})
