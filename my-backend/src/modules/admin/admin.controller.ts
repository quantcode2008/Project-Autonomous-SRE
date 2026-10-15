import { Request, Response, NextFunction } from 'express'
import { adminService } from './admin.service'

export class AdminController {
  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.listUsers(req.query as any)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  }

  async approveUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string
      const result = await adminService.approveUser(id)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  }

  async rejectUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string
      const result = await adminService.rejectUser(id)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  }
}

export const adminController = new AdminController()
