import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { prisma } from '../config/database'
import { decryptToken } from '../lib/crypto'

describe('Projects & Multi-Tenant Isolation Suite (T1.6, T1.7, T1.8)', () => {
  const app = createApp()
  const userAEmail = `usera_${Date.now()}@example.com`
  const userBEmail = `userb_${Date.now()}@example.com`
  const password = 'Password123!Secure'

  let cookieA: string
  let cookieB: string
  let userAId: string
  let userBId: string
  let projectAId: string

  beforeAll(async () => {
    // 1. Create User A
    const resA = await request(app)
      .post('/api/auth/sign-up/email')
      .send({ email: userAEmail, password, name: 'User A' })
    userAId = resA.body.user.id

    const loginA = await request(app)
      .post('/api/auth/sign-in/email')
      .send({ email: userAEmail, password })
    const cookieAHeader = loginA.headers['set-cookie']
    cookieA = Array.isArray(cookieAHeader) ? cookieAHeader.join('; ') : cookieAHeader

    // 2. Create User B
    const resB = await request(app)
      .post('/api/auth/sign-up/email')
      .send({ email: userBEmail, password, name: 'User B' })
    userBId = resB.body.user.id

    const loginB = await request(app)
      .post('/api/auth/sign-in/email')
      .send({ email: userBEmail, password })
    const cookieBHeader = loginB.headers['set-cookie']
    cookieB = Array.isArray(cookieBHeader) ? cookieBHeader.join('; ') : cookieBHeader
  })

  afterAll(async () => {
    await prisma.project.deleteMany({
      where: { ownerId: { in: [userAId, userBId] } },
    })
    await prisma.user.deleteMany({
      where: { id: { in: [userAId, userBId] } },
    })
    await prisma.$disconnect()
  })

  it('User A creates a custom project with valid settings', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Cookie', cookieA)
      .send({
        name: 'Alpha Microservice',
        settings: {
          services: ['alpha-svc'],
        },
      })

    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.name).toBe('Alpha Microservice')
    expect(res.body.slug).toBe('alpha-microservice')
    expect(res.body.kind).toBe('CUSTOM')
    expect(res.body.settings.services).toEqual(['alpha-svc'])

    projectAId = res.body.id
  })

  it('User A creates a seeded demo project with instant ingest key', async () => {
    const res = await request(app)
      .post('/api/v1/projects/demo')
      .set('Cookie', cookieA)
      .send({})

    expect(res.status).toBe(201)
    expect(res.body.kind).toBe('DEMO')
    expect(res.body.repo).toBeDefined()
    expect(res.body.repo.provider).toBe('LOCAL')
    expect(res.body.repo.location).toBe('demo/checkout-service')

    // Ingest key is returned once in response
    expect(res.body.ingestKey).toBeDefined()
    expect(res.body.ingestKey.key.startsWith('sk_ing_')).toBe(true)
  })

  it('User A connects a GitHub repo with encrypted token (T1.7)', async () => {
    const token = 'ghp_super_secret_github_access_token_12345'
    const res = await request(app)
      .put(`/api/v1/projects/${projectAId}/repo`)
      .set('Cookie', cookieA)
      .send({
        provider: 'GITHUB',
        location: 'https://github.com/sentinelai/sample-service',
        defaultBranch: 'main',
        token,
      })

    expect(res.status).toBe(200)
    expect(res.body.provider).toBe('GITHUB')
    expect(res.body.location).toBe('https://github.com/sentinelai/sample-service')
    expect(res.body.tokenLast4).toBe('2345')

    // Verify token is NEVER returned in response
    expect((res.body as any).token).toBeUndefined()
    expect((res.body as any).tokenEnc).toBeUndefined()

    // Verify token is encrypted in database with AES-256-GCM
    const repoInDb = await prisma.repoConnection.findUnique({
      where: { projectId: projectAId },
    })
    expect(repoInDb?.tokenEnc).toBeDefined()
    expect(repoInDb?.tokenEnc).not.toEqual(token)
    expect(decryptToken(repoInDb!.tokenEnc!)).toBe(token)
  })

  it('rejects invalid or non-allowlisted repo URLs (SSRF prevention)', async () => {
    const res = await request(app)
      .put(`/api/v1/projects/${projectAId}/repo`)
      .set('Cookie', cookieA)
      .send({
        provider: 'GITHUB',
        location: 'https://gitlab.com/attacker/repo', // Non-GitHub URL
      })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_FAILED')

    const resPathTraversal = await request(app)
      .put(`/api/v1/projects/${projectAId}/repo`)
      .set('Cookie', cookieA)
      .send({
        provider: 'LOCAL',
        location: 'demo/../../etc/passwd', // Path traversal
      })

    expect(resPathTraversal.status).toBe(400)
  })

  it('mints, lists, and revokes ingest keys (T1.8)', async () => {
    // 1. Mint key
    const createRes = await request(app)
      .post(`/api/v1/projects/${projectAId}/ingest-keys`)
      .set('Cookie', cookieA)
      .send({ name: 'Production Telemetry Key' })

    expect(createRes.status).toBe(201)
    expect(createRes.body.key.startsWith('sk_ing_')).toBe(true)
    const keyId = createRes.body.id

    // 2. List keys (only prefix returned)
    const listRes = await request(app)
      .get(`/api/v1/projects/${projectAId}/ingest-keys`)
      .set('Cookie', cookieA)

    expect(listRes.status).toBe(200)
    const foundKey = listRes.body.find((k: any) => k.id === keyId)
    expect(foundKey).toBeDefined()
    expect(foundKey.prefix).toBe(createRes.body.prefix)
    expect(foundKey.key).toBeUndefined() // Plaintext not in list

    // 3. Revoke key
    const deleteRes = await request(app)
      .delete(`/api/v1/ingest-keys/${keyId}`)
      .set('Cookie', cookieA)

    expect(deleteRes.status).toBe(204)

    const keyInDb = await prisma.ingestKey.findUnique({ where: { id: keyId } })
    expect(keyInDb?.revokedAt).toBeDefined()
  })

  it('CROSS-TENANT ISOLATION: User B cannot read, update, or delete User A project (T1.6)', async () => {
    // User B attempts to read User A's project
    const getRes = await request(app)
      .get(`/api/v1/projects/${projectAId}`)
      .set('Cookie', cookieB)

    expect(getRes.status).toBe(404) // Must return 404, never reveal existence
    expect(getRes.body.error.code).toBe('NOT_FOUND')

    // User B attempts to update User A's project
    const patchRes = await request(app)
      .patch(`/api/v1/projects/${projectAId}`)
      .set('Cookie', cookieB)
      .send({ name: 'Hacked by B' })

    expect(patchRes.status).toBe(404)

    // User B attempts to delete User A's project
    const deleteRes = await request(app)
      .delete(`/api/v1/projects/${projectAId}`)
      .set('Cookie', cookieB)

    expect(deleteRes.status).toBe(404)
  })
})
