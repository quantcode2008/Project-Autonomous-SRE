import { execSync } from 'node:child_process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '../config/database'

describe('Seed Admin CLI (T1.12)', () => {
  const seedEmail = `seed_cli_${Date.now()}@example.com`
  let seedUserId: string

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        id: `seed_user_${Date.now()}`,
        name: 'Seed Test User',
        email: seedEmail,
        role: 'USER',
      },
    })
    seedUserId = user.id
  })

  afterAll(async () => {
    await prisma.auditLog.deleteMany({
      where: { actorId: seedUserId },
    })
    await prisma.user.deleteMany({
      where: { id: seedUserId },
    })
    await prisma.$disconnect()
  })

  it('fails with clear error message when user is not found', () => {
    expect(() => {
      execSync('npm run seed:admin -- non_existent_user_12345@example.com', {
        stdio: 'pipe',
      })
    }).toThrow()
  }, 15000)

  it('promotes an existing user to ADMIN role via CLI command', () => {
    const output = execSync(`npm run seed:admin -- ${seedEmail}`, {
      encoding: 'utf8',
    })

    expect(output).toContain('Successfully promoted user')
    expect(output).toContain('to ADMIN role')
  }, 15000)

  it('verifies in database that the user role was updated to ADMIN', async () => {
    const user = await prisma.user.findUnique({
      where: { id: seedUserId },
    })
    expect(user?.role).toBe('ADMIN')

    // Verify audit log was recorded
    const audit = await prisma.auditLog.findFirst({
      where: { actorId: seedUserId, action: 'admin.promote' },
    })
    expect(audit).toBeDefined()
  })
})
