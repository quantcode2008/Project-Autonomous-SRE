import { Request, Response, NextFunction } from 'express'
import { waitlistService } from './waitlist.service'

export class WaitlistController {
  async join(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await waitlistService.joinWaitlist(req.body)
      const statusCode = result.isDuplicate ? 200 : 201
      res.status(statusCode).json(result)
    } catch (err) {
      next(err)
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await waitlistService.listWaitlist(req.query as any)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  }
}

export const waitlistController = new WaitlistController()
