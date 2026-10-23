import { validateApiEnv } from '../config/env'
import { AppError } from './errors'
import { logger } from './logger'

export interface EngineClientContext {
  userId?: string
  projectId?: string
  requestId?: string
}

export class EngineClient {
  private readonly baseUrl: string
  private readonly internalToken: string

  constructor(baseUrl?: string, internalToken?: string) {
    const env = validateApiEnv()
    this.baseUrl = (baseUrl || env.ENGINE_URL).replace(/\/$/, '')
    this.internalToken = internalToken || env.INTERNAL_SERVICE_TOKEN
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
      body?: unknown
      context?: EngineClientContext
      timeoutMs?: number
      retries?: number
    } = {},
  ): Promise<T> {
    const { method = 'GET', body, context = {}, timeoutMs = 5000, retries = 2 } = options
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Internal-Token': this.internalToken,
    }

    if (context.requestId) headers['X-Request-Id'] = context.requestId
    if (context.userId) headers['X-User-Id'] = context.userId
    if (context.projectId) headers['X-Project-Id'] = context.projectId

    let attempt = 0
    while (attempt <= retries) {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeoutMs)

        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        })

        clearTimeout(timer)

        if (response.status === 404) {
          throw AppError.notFound('Engine resource not found')
        }

        if (response.status === 429) {
          throw AppError.rateLimited('Engine rate limit exceeded')
        }

        if (response.status === 503) {
          throw AppError.engineUnavailable('Engine service is currently paused or unavailable')
        }

        if (!response.ok) {
          const errText = await response.text().catch(() => '')
          throw new AppError({
            statusCode: response.status >= 500 ? 502 : response.status,
            code: 'INTERNAL_ERROR',
            message: `Engine responded with status ${response.status}: ${errText}`,
          })
        }

        if (response.status === 204) {
          return null as unknown as T
        }

        return (await response.json()) as T
      } catch (err: any) {
        attempt++
        if (err instanceof AppError) {
          throw err
        }

        if (attempt > retries) {
          logger.error({ err, url, method, attempt }, 'Engine request failed after max retries')
          throw AppError.engineUnavailable(`Could not connect to engine service: ${err.message}`)
        }

        // Exponential backoff before next attempt
        await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)))
      }
    }

    throw AppError.engineUnavailable('Engine request failed')
  }

  async upsertProjectMirror(
    projectId: string,
    data: Record<string, unknown>,
    context?: EngineClientContext,
  ): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>(`/internal/projects/${projectId}`, {
      method: 'PUT',
      body: data,
      context,
    })
  }

  async deleteProjectMirror(
    projectId: string,
    context?: EngineClientContext,
  ): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>(`/internal/projects/${projectId}`, {
      method: 'DELETE',
      context,
    })
  }

  async upsertIngestKey(
    projectId: string,
    keyId: string,
    data: { prefix: string; hash: string; revokedAt?: string | null },
    context?: EngineClientContext,
  ): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>(`/internal/projects/${projectId}/ingest-keys/${keyId}`, {
      method: 'PUT',
      body: data,
      context,
    })
  }

  async verifyRepo(
    projectId: string,
    context?: EngineClientContext,
  ): Promise<{ ok: boolean; commitSha?: string; error?: string }> {
    return this.request<{ ok: boolean; commitSha?: string; error?: string }>(
      `/internal/projects/${projectId}/repo/verify`,
      {
        method: 'POST',
        context,
      },
    )
  }

  async getConnectionStatus(
    projectId: string,
    context?: EngineClientContext,
  ): Promise<{ connected: boolean; lastEventAt: string | null; eventsLast5m: number }> {
    return this.request<{ connected: boolean; lastEventAt: string | null; eventsLast5m: number }>(
      `/internal/projects/${projectId}/connection-status`,
      {
        method: 'GET',
        context,
      },
    )
  }

  async pushFlag(key: string, value: unknown, context?: EngineClientContext): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>(`/internal/flags/${key}`, {
      method: 'PUT',
      body: { value },
      context,
    })
  }

  async getDailyUsage(
    ownerId: string,
    context?: EngineClientContext,
  ): Promise<{ ownerId: string; day: string; investigations: number }> {
    return this.request<{ ownerId: string; day: string; investigations: number }>(
      `/internal/usage?ownerId=${encodeURIComponent(ownerId)}`,
      {
        method: 'GET',
        context,
      },
    )
  }
}

export const engineClient = new EngineClient()
