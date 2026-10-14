import { Request, Response, NextFunction } from 'express'
import { itemService } from './item.service'

export class ItemController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const item = await itemService.createItem(userId, req.body)
      res.status(201).json(item)
    } catch (err) {
      next(err)
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const result = await itemService.listItems(userId, req.query as any)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const id = req.params.id as string
      const item = await itemService.getItemById(userId, id)

      if (!item) {
        res.status(404).json({
          error: 'Item not found',
          code: 'NOT_FOUND',
        })
        return
      }

      res.status(200).json(item)
    } catch (err) {
      next(err)
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const id = req.params.id as string
      const updated = await itemService.updateItem(userId, id, req.body)

      if (!updated) {
        res.status(404).json({
          error: 'Item not found',
          code: 'NOT_FOUND',
        })
        return
      }

      res.status(200).json(updated)
    } catch (err) {
      next(err)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id
      const id = req.params.id as string
      const deleted = await itemService.deleteItem(userId, id)

      if (!deleted) {
        res.status(404).json({
          error: 'Item not found',
          code: 'NOT_FOUND',
        })
        return
      }

      res.status(200).json({
        success: true,
        deletedId: id,
      })
    } catch (err) {
      next(err)
    }
  }
}

export const itemController = new ItemController()
