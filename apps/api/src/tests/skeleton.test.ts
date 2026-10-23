import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createApp } from '../app'
import { AppError } from '../lib/errors'
import { errorHandler, notFoundHandler } from '../middleware/error-handler'
import { requestIdMiddleware } from '../middleware/request-id'
import { validate } from '../middleware/validate'

describe('Express Skeleton & Error Format (T1.1)', () => {
  it('GET /health returns 200 with status ok and X-Request-Id', async () => {
    const app = createApp()
    app.use(notFoundHandler)
    app.use(errorHandler)

    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.headers['x-request-id']).toBeDefined()
    expect(typeof res.body.uptime).toBe('number')
  })

  it('validates request body and formats errors per API_CONTRACT.md', async () => {
    const app = express()
    app.use(express.json())
    app.use(requestIdMiddleware)

    const testSchema = z.object({
      name: z.string().min(3, 'Name must be at least 3 characters'),
      count: z.number().positive('Count must be positive'),
    })

    app.post('/test-validate', validate({ body: testSchema }), (_req, res) => {
      res.json({ ok: true })
    })
    app.use(notFoundHandler)
    app.use(errorHandler)

    const res = await request(app)
      .post('/test-validate')
      .send({ name: 'ab', count: -1 })

    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
    expect(res.body.error.code).toBe('VALIDATION_FAILED')
    expect(res.body.error.requestId).toBeDefined()
    expect(Array.isArray(res.body.error.details)).toBe(true)
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'name' }),
        expect.objectContaining({ path: 'count' }),
      ]),
    )
  })

  it('formats 404 errors with standardized code and requestId', async () => {
    const app = createApp()

    const res = await request(app).get('/non-existent-route')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
    expect(res.body.error.requestId).toBeDefined()
  })

  it('formats custom AppError statuses and details', async () => {
    const app = express()
    app.use(requestIdMiddleware)
    app.get('/test-forbidden', () => {
      throw AppError.forbidden('Custom forbidden error')
    })
    app.use(notFoundHandler)
    app.use(errorHandler)

    const res = await request(app).get('/test-forbidden')
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
    expect(res.body.error.message).toBe('Custom forbidden error')
    expect(res.body.error.requestId).toBeDefined()
  })
})
