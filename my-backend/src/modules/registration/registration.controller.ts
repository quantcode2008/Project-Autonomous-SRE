import { Request, Response, NextFunction } from 'express'
import { registrationService } from './registration.service'

export class RegistrationController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await registrationService.register(req.body)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await registrationService.verifyOtp(req.body)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await registrationService.resendOtp(req.body)
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  }
}

export const registrationController = new RegistrationController()
