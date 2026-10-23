import { z } from 'zod'

export const projectSettingsSchema = z.object({
  services: z.array(z.string()).default(['checkout-service']),
  app_import: z.string().default('app.main:app'),
  requirements_path: z.string().default('requirements.txt'),
  source_dirs: z.array(z.string()).default(['app']),
  tests_dir: z.string().default('tests'),
  test_command: z.string().default('pytest -q'),
  lint_command: z.string().default('ruff check .'),
  protected_paths: z
    .array(z.string())
    .default(['.github/**', '.env*', 'Dockerfile*', 'requirements*.txt', 'pyproject.toml']),
  detection: z
    .object({
      window_minutes: z.number().default(5),
      min_requests: z.number().default(20),
      error_rate_threshold: z.number().default(0.05),
      resolve_after_minutes: z.number().default(10),
    })
    .default({}),
  auto_investigate: z.boolean().default(true),
  capture_request_bodies: z.boolean().default(true),
  redact_fields: z.array(z.string()).default(['password', 'token', 'authorization', 'card', 'secret']),
  retention_days: z.number().default(7),
})

export type ProjectSettings = z.infer<typeof projectSettingsSchema>

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  settings: projectSettingsSchema.partial().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

export const connectRepoSchema = z.object({
  provider: z.enum(['LOCAL', 'GITHUB']),
  location: z.string().min(1, 'Repository location is required'),
  defaultBranch: z.string().default('main'),
  token: z.string().optional(),
})

export type ConnectRepoInput = z.infer<typeof connectRepoSchema>

export const createIngestKeySchema = z.object({
  name: z.string().min(1, 'Key name is required').max(64),
})

export type CreateIngestKeyInput = z.infer<typeof createIngestKeySchema>
