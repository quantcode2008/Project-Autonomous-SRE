import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { EngineClient } from '../lib/engine-client'
import { AppError } from '../lib/errors'

describe('Engine Client Contract & Resilience Suite (T1.9)', () => {
  let server: http.Server
  let serverUrl: string
  const receivedHeaders: Record<string, string> = {}
  let failCount = 0

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      // Record incoming headers
      for (const [k, v] of Object.entries(req.headers)) {
        if (typeof v === 'string') {
          receivedHeaders[k.toLowerCase()] = v
        }
      }

      if (req.url?.includes('/simulate-retry')) {
        failCount++
        if (failCount < 2) {
          res.destroy() // abrupt socket close to trigger retry
          return
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, recovered: true }))
        return
      }

      if (req.url?.includes('/simulate-404')) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Not found' }))
        return
      }

      if (req.url?.includes('/simulate-503')) {
        res.writeHead(503, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Paused' }))
        return
      }

      // Default mock responses
      if (req.method === 'PUT' && req.url?.startsWith('/internal/projects/')) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
        return
      }

      if (req.url?.includes('/repo/verify')) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, commitSha: 'a1b2c3d4' }))
        return
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    })

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo
        serverUrl = `http://127.0.0.1:${addr.port}`
        resolve()
      })
    })
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  it('propagates internal token and request ID headers correctly', async () => {
    const client = new EngineClient(serverUrl, 'test_internal_token_123456')
    await client.upsertProjectMirror(
      'proj_123',
      { name: 'Test' },
      { userId: 'user_456', requestId: 'req_test_abc' },
    )

    expect(receivedHeaders['x-internal-token']).toBe('test_internal_token_123456')
    expect(receivedHeaders['x-request-id']).toBe('req_test_abc')
    expect(receivedHeaders['x-user-id']).toBe('user_456')
  })

  it('maps engine 404 response to AppError notFound', async () => {
    const client = new EngineClient(serverUrl, 'test_token')
    await expect(
      (client as any).request('/simulate-404', { retries: 0 }),
    ).rejects.toThrowError(AppError)
  })

  it('maps engine 503 response to AppError engineUnavailable', async () => {
    const client = new EngineClient(serverUrl, 'test_token')
    await expect(
      (client as any).request('/simulate-503', { retries: 0 }),
    ).rejects.toThrowError('Engine service is currently paused or unavailable')
  })

  it('retries on network failure with backoff and succeeds', async () => {
    failCount = 0
    const client = new EngineClient(serverUrl, 'test_token')
    const res = await (client as any).request('/simulate-retry', { retries: 3 })
    expect(res.ok).toBe(true)
    expect(res.recovered).toBe(true)
  })
})
