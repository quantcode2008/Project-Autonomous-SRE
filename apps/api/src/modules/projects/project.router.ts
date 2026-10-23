import {
  connectRepoSchema,
  createIngestKeySchema,
  createProjectSchema,
} from '@sentinel/shared'
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../auth/middleware'
import { paginationQuerySchema } from '../../lib/pagination'
import { validate } from '../../middleware/validate'
import { projectService } from './project.service'

export const projectRouter = Router()

// All project routes require authentication
projectRouter.use(requireAuth)

// 1. List Projects (owned only, paginated)
projectRouter.get(
  '/',
  validate({ query: paginationQuerySchema }),
  async (req, res, next) => {
    try {
      const { limit, cursor } = req.query as any
      const result = await projectService.listProjects(req.user!.id, limit, cursor)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },
)

// 2. Create Project
projectRouter.post(
  '/',
  validate({ body: createProjectSchema }),
  async (req, res, next) => {
    try {
      const project = await projectService.createProject(req.user!.id, req.body, req.ip)
      res.status(201).json(project)
    } catch (err) {
      next(err)
    }
  },
)

// 3. Create Seeded Demo Project
projectRouter.post('/demo', async (req, res, next) => {
  try {
    const demoProject = await projectService.createDemoProject(req.user!.id, req.ip)
    res.status(201).json(demoProject)
  } catch (err) {
    next(err)
  }
})

// 4. Get Project by ID
projectRouter.get('/:id', async (req, res, next) => {
  try {
    const project = await projectService.getProject(req.params.id as string, req.user!.id)
    res.status(200).json(project)
  } catch (err) {
    next(err)
  }
})

// 5. Update Project
const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  settings: z.record(z.unknown()).optional(),
})

projectRouter.patch(
  '/:id',
  validate({ body: updateProjectSchema }),
  async (req, res, next) => {
    try {
      const updated = await projectService.updateProject(
        req.params.id as string,
        req.user!.id,
        req.body,
        req.ip,
      )
      res.status(200).json(updated)
    } catch (err) {
      next(err)
    }
  },
)

// 6. Delete Project (soft delete)
projectRouter.delete('/:id', async (req, res, next) => {
  try {
    await projectService.deleteProject(req.params.id as string, req.user!.id, req.ip)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// 7. Connect Repository
projectRouter.put(
  '/:id/repo',
  validate({ body: connectRepoSchema }),
  async (req, res, next) => {
    try {
      const repo = await projectService.connectRepo(
        req.params.id as string,
        req.user!.id,
        req.body,
        req.ip,
      )
      res.status(200).json(repo)
    } catch (err) {
      next(err)
    }
  },
)

// 8. Verify Repository
projectRouter.post('/:id/repo/verify', async (req, res, next) => {
  try {
    const verification = await projectService.verifyRepo(req.params.id as string, req.user!.id)
    res.status(200).json(verification)
  } catch (err) {
    next(err)
  }
})

// 9. List Ingest Keys
projectRouter.get('/:id/ingest-keys', async (req, res, next) => {
  try {
    const keys = await projectService.listIngestKeys(req.params.id as string, req.user!.id)
    res.status(200).json(keys)
  } catch (err) {
    next(err)
  }
})

// 10. Mint Ingest Key (shown once!)
projectRouter.post(
  '/:id/ingest-keys',
  validate({ body: createIngestKeySchema }),
  async (req, res, next) => {
    try {
      const key = await projectService.createIngestKey(
        req.params.id as string,
        req.user!.id,
        req.body.name,
        req.ip,
      )
      res.status(201).json(key)
    } catch (err) {
      next(err)
    }
  },
)

// 11. Connection Status (onboarding polling)
projectRouter.get('/:id/connection-status', async (req, res, next) => {
  try {
    const status = await projectService.getConnectionStatus(req.params.id as string, req.user!.id)
    res.status(200).json(status)
  } catch (err) {
    next(err)
  }
})

// 12. Revoke Ingest Key Router
export const ingestKeyRouter = Router()
ingestKeyRouter.use(requireAuth)

ingestKeyRouter.delete('/:keyId', async (req, res, next) => {
  try {
    await projectService.revokeIngestKey(req.params.keyId as string, req.user!.id, req.ip)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})
