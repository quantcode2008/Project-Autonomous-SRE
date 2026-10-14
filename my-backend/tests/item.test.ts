import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { auth } from '../src/auth/better-auth'
import { prisma } from '../src/config/database'

describe('Protected Item CRUD & Tenant Isolation (Phase 3)', () => {
  const userA = {
    id: 'usr_alpha',
    name: 'Alice SRE',
    email: 'alice@acme.corp',
    role: 'USER',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const userB = {
    id: 'usr_beta',
    name: 'Bob DevOps',
    email: 'bob@acme.corp',
    role: 'USER',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const sessionA = {
    id: 'sess_alpha',
    userId: userA.id,
    token: 'token_alpha',
    expiresAt: new Date(Date.now() + 3600000),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const sessionB = {
    id: 'sess_beta',
    userId: userB.id,
    token: 'token_beta',
    expiresAt: new Date(Date.now() + 3600000),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('Unauthenticated & Validation Guards', () => {
    it('rejects unauthenticated requests with 401', async () => {
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce(null as any)

      const response = await request(app).get('/api/v1/items')

      expect(response.status).toBe(401)
      expect(response.body).toEqual({
        error: 'Unauthorized: Active session required',
        code: 'UNAUTHORIZED',
      })
    })

    it('rejects creation with empty title (400 VALIDATION_ERROR)', async () => {
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce({
        user: userA,
        session: sessionA,
      } as any)

      const response = await request(app)
        .post('/api/v1/items')
        .send({
          title: '',
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR')
      expect(response.body.details[0].field).toBe('title')
    })

    it('rejects invalid UUID param in GET /api/v1/items/:id (400)', async () => {
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce({
        user: userA,
        session: sessionA,
      } as any)

      const response = await request(app).get('/api/v1/items/not-a-valid-uuid')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR')
    })
  })

  describe('Tenant Scoping & CRUD Operations', () => {
    it('creates an item strictly assigned to session user', async () => {
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce({
        user: userA,
        session: sessionA,
      } as any)

      const mockCreatedItem = {
        id: '11111111-2222-3333-4444-555555555555',
        title: 'Kubernetes Ingress Controller',
        description: 'Monitors NGINX ingress error rates',
        userId: userA.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.spyOn(prisma.item, 'create').mockResolvedValueOnce(mockCreatedItem as any)

      const response = await request(app)
        .post('/api/v1/items')
        .send({
          title: 'Kubernetes Ingress Controller',
          description: 'Monitors NGINX ingress error rates',
        })

      expect(response.status).toBe(201)
      expect(response.body.id).toBe(mockCreatedItem.id)
      expect(response.body.userId).toBe(userA.id)
      expect(prisma.item.create).toHaveBeenCalledWith({
        data: {
          title: 'Kubernetes Ingress Controller',
          description: 'Monitors NGINX ingress error rates',
          userId: userA.id,
        },
      })
    })

    it('returns paginated items strictly scoped to the user', async () => {
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce({
        user: userA,
        session: sessionA,
      } as any)

      const mockItems = [
        {
          id: '11111111-2222-3333-4444-555555555555',
          title: 'Item Alpha',
          description: null,
          userId: userA.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.spyOn(prisma.item, 'count').mockResolvedValueOnce(1)
      vi.spyOn(prisma.item, 'findMany').mockResolvedValueOnce(mockItems as any)

      const response = await request(app)
        .get('/api/v1/items?page=1&limit=10')

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })
      expect(prisma.item.findMany).toHaveBeenCalledWith({
        where: { userId: userA.id },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('enforces maximum pagination limit of 100', async () => {
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce({
        user: userA,
        session: sessionA,
      } as any)

      // Query with limit 500 fails Zod schema boundary (max 100)
      const response = await request(app)
        .get('/api/v1/items?limit=500')

      expect(response.status).toBe(400)
      expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('IDOR Prevention: User B receives 404 when requesting User A item', async () => {
      // Bob is logged in
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce({
        user: userB,
        session: sessionB,
      } as any)

      // Prisma finds nothing because query explicitly filters where: { id, userId: userB.id }
      vi.spyOn(prisma.item, 'findFirst').mockResolvedValueOnce(null)

      const itemId = '11111111-2222-3333-4444-555555555555'
      const response = await request(app).get(`/api/v1/items/${itemId}`)

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        error: 'Item not found',
        code: 'NOT_FOUND',
      })
      expect(prisma.item.findFirst).toHaveBeenCalledWith({
        where: { id: itemId, userId: userB.id },
      })
    })

    it('IDOR Prevention: User B receives 404 when attempting to update User A item', async () => {
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce({
        user: userB,
        session: sessionB,
      } as any)

      vi.spyOn(prisma.item, 'findFirst').mockResolvedValueOnce(null)

      const itemId = '11111111-2222-3333-4444-555555555555'
      const response = await request(app)
        .patch(`/api/v1/items/${itemId}`)
        .send({ title: 'Tampered Title' })

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        error: 'Item not found',
        code: 'NOT_FOUND',
      })
    })

    it('IDOR Prevention: User B receives 404 when attempting to delete User A item', async () => {
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce({
        user: userB,
        session: sessionB,
      } as any)

      vi.spyOn(prisma.item, 'findFirst').mockResolvedValueOnce(null)

      const itemId = '11111111-2222-3333-4444-555555555555'
      const response = await request(app)
        .delete(`/api/v1/items/${itemId}`)

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        error: 'Item not found',
        code: 'NOT_FOUND',
      })
    })

    it('allows owner to update their own item', async () => {
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce({
        user: userA,
        session: sessionA,
      } as any)

      const itemId = '11111111-2222-3333-4444-555555555555'
      vi.spyOn(prisma.item, 'findFirst').mockResolvedValueOnce({
        id: itemId,
        title: 'Original Title',
        description: null,
        userId: userA.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      vi.spyOn(prisma.item, 'update').mockResolvedValueOnce({
        id: itemId,
        title: 'Updated Title',
        description: null,
        userId: userA.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const response = await request(app)
        .patch(`/api/v1/items/${itemId}`)
        .send({ title: 'Updated Title' })

      expect(response.status).toBe(200)
      expect(response.body.title).toBe('Updated Title')
    })

    it('allows owner to delete their own item', async () => {
      vi.spyOn(auth.api, 'getSession').mockResolvedValueOnce({
        user: userA,
        session: sessionA,
      } as any)

      const itemId = '11111111-2222-3333-4444-555555555555'
      vi.spyOn(prisma.item, 'findFirst').mockResolvedValueOnce({
        id: itemId,
        userId: userA.id,
      } as any)

      vi.spyOn(prisma.item, 'delete').mockResolvedValueOnce({} as any)

      const response = await request(app)
        .delete(`/api/v1/items/${itemId}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        deletedId: itemId,
      })
    })
  })
})
