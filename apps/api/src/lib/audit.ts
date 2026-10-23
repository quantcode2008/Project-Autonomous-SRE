import type { AuditLog } from '@prisma/client'
import { prisma } from '../config/database'
import { logger } from './logger'

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'key',
  'apikey',
  'tokenenc',
  'accesstoken',
  'refreshtoken',
  'better_auth_secret',
  'internal_service_token',
])

export function redactMetadata(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(redactMetadata)
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]'
    } else if (value && typeof value === 'object') {
      result[key] = redactMetadata(value)
    } else {
      result[key] = value
    }
  }
  return result
}

export interface RecordAuditParams {
  actorId?: string | null
  action: string
  targetType?: string | null
  targetId?: string | null
  projectId?: string | null
  metadata?: Record<string, unknown> | null
  ip?: string | null
}

export async function recordAudit(params: RecordAuditParams): Promise<AuditLog | null> {
  try {
    const redactedMeta = params.metadata ? (redactMetadata(params.metadata) as any) : undefined

    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId || null,
        action: params.action,
        targetType: params.targetType || null,
        targetId: params.targetId || null,
        projectId: params.projectId || null,
        metadata: redactedMeta,
        ip: params.ip || null,
      },
    })
  } catch (error) {
    logger.error({ error, action: params.action }, 'Failed to record audit log')
    return null
  }
}
