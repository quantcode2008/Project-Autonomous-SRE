import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { auth } from '../src/auth/better-auth'
import { getMailService, setMailService, MailService } from '../src/lib/email'

describe('Authentication & Session Guard (Phase 2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('requireAuth Middleware & Protected Routes', () => {
    it('rejects access to /api/v1/me when no session cookie or token is provided (401)', async () => {
      // getSession returns null when no session is present
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce(null as any)

      const response = await request(app).get('/api/v1/me')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        error: 'Unauthorized: Active session required',
        code: 'UNAUTHORIZED',
      })
    })

    it('rejects access to /api/v1/me when session is expired or invalid (401)', async () => {
      // Simulate expired or tampered session token
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce(null as any)

      const response = await request(app)
        .get('/api/v1/me')
        .set('Cookie', ['better-auth.session_token=tampered_or_expired_token'])

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        error: 'Unauthorized: Active session required',
        code: 'UNAUTHORIZED',
      })
    })

    it('allows access to /api/v1/me with verified session and derives identity from session (200)', async () => {
      const mockUser = {
        id: 'usr_12345',
        email: 'engineer@acme.corp',
        name: 'DevOps Lead',
        role: 'USER',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockSession = {
        id: 'sess_67890',
        userId: 'usr_12345',
        token: 'valid_token_abc',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      } as any)

      const response = await request(app)
        .get('/api/v1/me')
        .set('Cookie', ['better-auth.session_token=valid_token_abc'])

      expect(response.status).toBe(200)
      expect(response.body.user).toMatchObject({
        id: 'usr_12345',
        email: 'engineer@acme.corp',
        name: 'DevOps Lead',
        role: 'USER',
      })
      expect(response.body.session).toMatchObject({
        id: 'sess_67890',
      })
    })

    it('blocks standard USER from accessing /api/v1/admin/dashboard (403 Forbidden)', async () => {
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce({
        user: {
          id: 'usr_normal',
          email: 'user@acme.corp',
          name: 'Regular User',
          role: 'USER',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: 'sess_user',
          userId: 'usr_normal',
          token: 'token_user',
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as any)

      const response = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Cookie', ['better-auth.session_token=token_user'])

      expect(response.status).toBe(403)
      expect(response.body).toEqual({
        error: 'Forbidden: Requires ADMIN role',
        code: 'FORBIDDEN',
      })
    })

    it('allows verified ADMIN to access /api/v1/admin/dashboard (200 OK)', async () => {
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce({
        user: {
          id: 'usr_admin',
          email: 'admin@acme.corp',
          name: 'Site Reliability Director',
          role: 'ADMIN',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: 'sess_admin',
          userId: 'usr_admin',
          token: 'token_admin',
          expiresAt: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as any)

      const response = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Cookie', ['better-auth.session_token=token_admin'])

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('adminId', 'usr_admin')
      expect(response.body).toHaveProperty('message', 'Welcome to the Admin Dashboard')
    })
  })

  describe('Better Auth Endpoint Behavior & Mail Service', () => {
    it('GET /api/auth returns 200 with directory of auth endpoints', async () => {
      const response = await request(app).get('/api/auth')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        name: 'Better Auth Gateway',
        status: 'active',
        endpoints: {
          signUp: 'POST /api/auth/sign-up/email',
          signIn: 'POST /api/auth/sign-in/email',
          signOut: 'POST /api/auth/sign-out',
          session: 'GET /api/auth/get-session',
        },
      })
    })

    it('handles wrong password rejection cleanly', async () => {
      // Simulate Better Auth rejecting credentials
      vi.spyOn(auth.api, 'signInEmail').mockRejectedValueOnce(
        new Error('Invalid email or password')
      )

      const response = await request(app)
        .post('/api/auth/sign-in/email')
        .send({
          email: 'user@acme.corp',
          password: 'wrong_password_123',
        })

      // Better Auth handler catches error and returns appropriate error status (400 or 500)
      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('dispatches emails through the pluggable MailService interface', async () => {
      const mockMailService: MailService = {
        sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
        sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
      }

      setMailService(mockMailService)

      await getMailService().sendVerificationEmail({
        to: 'newuser@acme.corp',
        url: 'http://localhost:4000/verify?token=abc123token',
        token: 'abc123token',
      })

      expect(mockMailService.sendVerificationEmail).toHaveBeenCalledWith({
        to: 'newuser@acme.corp',
        url: 'http://localhost:4000/verify?token=abc123token',
        token: 'abc123token',
      })

      await getMailService().sendPasswordResetEmail({
        to: 'user@acme.corp',
        url: 'http://localhost:4000/reset?token=xyz789reset',
        token: 'xyz789reset',
      })

      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledWith({
        to: 'user@acme.corp',
        url: 'http://localhost:4000/reset?token=xyz789reset',
        token: 'xyz789reset',
      })
    })
  })
})
