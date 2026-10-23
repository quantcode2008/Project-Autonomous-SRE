import { projectSettingsSchema } from '@sentinel/shared'
import { prisma } from '../../config/database'
import { recordAudit } from '../../lib/audit'
import { decryptToken, encryptToken, generateIngestKey } from '../../lib/crypto'
import { engineClient } from '../../lib/engine-client'
import { AppError } from '../../lib/errors'
import { buildPagination, type PaginatedResult } from '../../lib/pagination'
import { validateRepoLocation } from './repo-validator'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'project'
}

export class ProjectService {
  async listProjects(
    ownerId: string,
    limit = 25,
    cursor?: string,
  ): Promise<PaginatedResult<any>> {
    const projects = await prisma.project.findMany({
      where: {
        ownerId,
        deletedAt: null,
      },
      include: {
        repo: {
          select: {
            id: true,
            provider: true,
            location: true,
            defaultBranch: true,
            tokenLast4: true,
            verifiedAt: true,
            lastError: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    return buildPagination(projects, limit)
  }

  async getProject(projectId: string, ownerId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId,
        deletedAt: null,
      },
      include: {
        repo: {
          select: {
            id: true,
            provider: true,
            location: true,
            defaultBranch: true,
            tokenLast4: true,
            verifiedAt: true,
            lastError: true,
          },
        },
      },
    })

    if (!project) {
      throw AppError.notFound('Project not found')
    }

    return project
  }

  async createProject(ownerId: string, data: { name: string; settings?: Record<string, unknown> }, ip?: string) {
    const slugBase = slugify(data.name)
    let slug = slugBase
    let counter = 1
    while (await prisma.project.findUnique({ where: { ownerId_slug: { ownerId, slug } } })) {
      slug = `${slugBase}-${counter++}`
    }

    const validatedSettings = projectSettingsSchema.parse(data.settings || {})

    const project = await prisma.project.create({
      data: {
        ownerId,
        name: data.name,
        slug,
        kind: 'CUSTOM',
        language: 'python',
        settings: validatedSettings as any,
      },
    })

    await recordAudit({
      actorId: ownerId,
      action: 'project.create',
      targetType: 'project',
      targetId: project.id,
      projectId: project.id,
      metadata: { name: project.name, slug: project.slug },
      ip,
    })

    // Upsert project mirror to engine asynchronously
    engineClient.upsertProjectMirror(
      project.id,
      {
        ownerId,
        name: project.name,
        slug: project.slug,
        language: project.language,
        settings: project.settings,
      },
      { userId: ownerId, projectId: project.id },
    ).catch(() => {})

    return project
  }

  async createDemoProject(ownerId: string, ip?: string) {
    const name = 'Checkout Service (Demo)'
    const slugBase = 'checkout-service-demo'
    let slug = slugBase
    let counter = 1
    while (await prisma.project.findUnique({ where: { ownerId_slug: { ownerId, slug } } })) {
      slug = `${slugBase}-${counter++}`
    }

    const defaultSettings = projectSettingsSchema.parse({
      services: ['checkout-service'],
      app_import: 'app.main:app',
      requirements_path: 'requirements.txt',
      source_dirs: ['app'],
      tests_dir: 'tests',
      test_command: 'pytest -q',
      lint_command: 'ruff check .',
    })

    const project = await prisma.project.create({
      data: {
        ownerId,
        name,
        slug,
        kind: 'DEMO',
        language: 'python',
        settings: defaultSettings as any,
        repo: {
          create: {
            provider: 'LOCAL',
            location: 'demo/checkout-service',
            defaultBranch: 'main',
            verifiedAt: new Date(),
          },
        },
      },
      include: {
        repo: {
          select: {
            id: true,
            provider: true,
            location: true,
            defaultBranch: true,
            tokenLast4: true,
            verifiedAt: true,
          },
        },
      },
    })

    // Automatically mint first ingest key for demo project
    const { key, prefix, hash } = generateIngestKey()
    const ingestKey = await prisma.ingestKey.create({
      data: {
        projectId: project.id,
        name: 'Default Demo Key',
        prefix,
        hash,
      },
    })

    await recordAudit({
      actorId: ownerId,
      action: 'project.create_demo',
      targetType: 'project',
      targetId: project.id,
      projectId: project.id,
      metadata: { name: project.name, slug: project.slug, kind: 'DEMO' },
      ip,
    })

    // Sync project mirror and ingest key to engine
    engineClient.upsertProjectMirror(
      project.id,
      {
        ownerId,
        name: project.name,
        slug: project.slug,
        language: project.language,
        settings: project.settings,
        repo: project.repo,
      },
      { userId: ownerId, projectId: project.id },
    ).catch(() => {})

    engineClient.upsertIngestKey(
      project.id,
      ingestKey.id,
      { prefix, hash },
      { userId: ownerId, projectId: project.id },
    ).catch(() => {})

    return {
      ...project,
      ingestKey: {
        id: ingestKey.id,
        name: ingestKey.name,
        prefix: ingestKey.prefix,
        key, // Plaintext shown once at creation!
      },
    }
  }

  async updateProject(
    projectId: string,
    ownerId: string,
    data: { name?: string; settings?: Record<string, unknown> },
    ip?: string,
  ) {
    const existing = await this.getProject(projectId, ownerId)

    const updateData: Record<string, unknown> = {}
    if (data.name) updateData.name = data.name
    if (data.settings) {
      updateData.settings = projectSettingsSchema.parse({
        ...(existing.settings as any),
        ...data.settings,
      })
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    })

    await recordAudit({
      actorId: ownerId,
      action: 'project.update',
      targetType: 'project',
      targetId: projectId,
      projectId,
      metadata: updateData,
      ip,
    })

    engineClient.upsertProjectMirror(projectId, updated, { userId: ownerId, projectId }).catch(() => {})
    return updated
  }

  async deleteProject(projectId: string, ownerId: string, ip?: string): Promise<void> {
    await this.getProject(projectId, ownerId)

    await prisma.project.update({
      where: { id: projectId },
      data: { deletedAt: new Date() },
    })

    await recordAudit({
      actorId: ownerId,
      action: 'project.delete',
      targetType: 'project',
      targetId: projectId,
      projectId,
      ip,
    })

    engineClient.deleteProjectMirror(projectId, { userId: ownerId, projectId }).catch(() => {})
  }

  async connectRepo(
    projectId: string,
    ownerId: string,
    data: { provider: 'LOCAL' | 'GITHUB'; location: string; defaultBranch?: string; token?: string },
    ip?: string,
  ) {
    await this.getProject(projectId, ownerId)
    validateRepoLocation(data.provider, data.location)

    let tokenEnc: string | null = null
    let tokenLast4: string | null = null

    if (data.token && data.token.trim()) {
      tokenEnc = encryptToken(data.token.trim())
      tokenLast4 = data.token.trim().slice(-4)
    }

    const repo = await prisma.repoConnection.upsert({
      where: { projectId },
      create: {
        projectId,
        provider: data.provider,
        location: data.location.trim(),
        defaultBranch: data.defaultBranch || 'main',
        tokenEnc,
        tokenLast4,
      },
      update: {
        provider: data.provider,
        location: data.location.trim(),
        defaultBranch: data.defaultBranch || 'main',
        ...(tokenEnc ? { tokenEnc, tokenLast4 } : {}),
        lastError: null,
      },
      select: {
        id: true,
        provider: true,
        location: true,
        defaultBranch: true,
        tokenLast4: true,
        verifiedAt: true,
        lastError: true,
      },
    })

    await recordAudit({
      actorId: ownerId,
      action: 'project.connect_repo',
      targetType: 'repo_connection',
      targetId: repo.id,
      projectId,
      metadata: { provider: data.provider, location: data.location },
      ip,
    })

    engineClient.upsertProjectMirror(
      projectId,
      { repo: { ...repo, tokenEnc } },
      { userId: ownerId, projectId },
    ).catch(() => {})

    return repo
  }

  async verifyRepo(projectId: string, ownerId: string) {
    await this.getProject(projectId, ownerId)
    return engineClient.verifyRepo(projectId, { userId: ownerId, projectId })
  }

  async listIngestKeys(projectId: string, ownerId: string) {
    await this.getProject(projectId, ownerId)

    return prisma.ingestKey.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        prefix: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createIngestKey(projectId: string, ownerId: string, name: string, ip?: string) {
    await this.getProject(projectId, ownerId)

    const { key, prefix, hash } = generateIngestKey()
    const ingestKey = await prisma.ingestKey.create({
      data: {
        projectId,
        name,
        prefix,
        hash,
      },
    })

    await recordAudit({
      actorId: ownerId,
      action: 'key.create',
      targetType: 'ingest_key',
      targetId: ingestKey.id,
      projectId,
      metadata: { name, prefix },
      ip,
    })

    engineClient.upsertIngestKey(
      projectId,
      ingestKey.id,
      { prefix, hash },
      { userId: ownerId, projectId },
    ).catch(() => {})

    return {
      id: ingestKey.id,
      name: ingestKey.name,
      prefix: ingestKey.prefix,
      key, // Shown ONCE in response
    }
  }

  async revokeIngestKey(keyId: string, ownerId: string, ip?: string): Promise<void> {
    const key = await prisma.ingestKey.findUnique({
      where: { id: keyId },
      include: { project: true },
    })

    if (!key || key.project.ownerId !== ownerId || key.project.deletedAt !== null) {
      throw AppError.notFound('Ingest key not found')
    }

    const revoked = await prisma.ingestKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    })

    await recordAudit({
      actorId: ownerId,
      action: 'key.revoke',
      targetType: 'ingest_key',
      targetId: keyId,
      projectId: key.projectId,
      ip,
    })

    engineClient.upsertIngestKey(
      key.projectId,
      keyId,
      { prefix: revoked.prefix, hash: revoked.hash, revokedAt: revoked.revokedAt?.toISOString() },
      { userId: ownerId, projectId: key.projectId },
    ).catch(() => {})
  }

  async getConnectionStatus(projectId: string, ownerId: string) {
    await this.getProject(projectId, ownerId)
    return engineClient.getConnectionStatus(projectId, { userId: ownerId, projectId })
  }
}

export const projectService = new ProjectService()
