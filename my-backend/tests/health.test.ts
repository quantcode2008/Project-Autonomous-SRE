import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import * as databaseConfig from '../src/config/database'

describe('Health & Operational Endpoints', () => {
  it('GET /health returns 200 and healthy status when database is connected', async () => {
    // Mock healthy DB ping
    vi.spyOn(databaseConfig, 'checkDatabaseConnection').mockResolvedValueOnce({
      connected: true,
      latencyMs: 3,
    })

    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('status', 'ok')
    expect(response.body).toHaveProperty('uptimeSeconds')
    expect(response.body).toHaveProperty('timestamp')
    expect(response.body.database).toEqual({
      status: 'connected',
      latencyMs: 3,
    })
  })

  it('GET / returns 200 with service info and available endpoints', async () => {
    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      name: 'SentinelAI Backend API',
      status: 'online',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        v1: {
          me: '/api/v1/me',
          waitlist: '/api/v1/waitlist',
          items: '/api/v1/items',
        },
      },
    })
  })

  it('GET /health returns 503 and degraded status when database is disconnected', async () => {
    // Mock disconnected DB ping
    vi.spyOn(databaseConfig, 'checkDatabaseConnection').mockResolvedValueOnce({
      connected: false,
      latencyMs: 50,
      error: 'Connection refused',
    })

    const response = await request(app).get('/health')

    expect(response.status).toBe(503)
    expect(response.body).toHaveProperty('status', 'degraded')
    expect(response.body.database).toMatchObject({
      status: 'disconnected',
      error: 'Connection refused',
    })
  })

  it('GET /unmatched-route returns standard 404 JSON', async () => {
    const response = await request(app).get('/unmatched-route')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: 'Route not found: GET /unmatched-route',
      code: 'NOT_FOUND',
    })
  })
})
