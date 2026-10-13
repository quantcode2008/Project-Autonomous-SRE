import { logger } from './logger'

export interface SendMailOptions {
  to: string
  url: string
  token: string
}

export interface MailService {
  sendVerificationEmail(options: SendMailOptions): Promise<void>
  sendPasswordResetEmail(options: SendMailOptions): Promise<void>
}

export class ConsoleMailService implements MailService {
  async sendVerificationEmail(options: SendMailOptions): Promise<void> {
    logger.info('================ EMAIL DISPATCH (DEV CONSOLE) ================')
    logger.info(`To: ${options.to}`)
    logger.info('Subject: Verify your email address')
    logger.info(`Verification URL: ${options.url}`)
    logger.info(`Token: ${options.token}`)
    logger.info('===============================================================')
  }

  async sendPasswordResetEmail(options: SendMailOptions): Promise<void> {
    logger.info('================ EMAIL DISPATCH (DEV CONSOLE) ================')
    logger.info(`To: ${options.to}`)
    logger.info('Subject: Reset your password')
    logger.info(`Password Reset URL: ${options.url}`)
    logger.info(`Token: ${options.token}`)
    logger.info('===============================================================')
  }
}

// In production, plug in ResendMailService, SendGridMailService, etc.
let activeMailService: MailService = new ConsoleMailService()

export function getMailService(): MailService {
  return activeMailService
}

export function setMailService(service: MailService): void {
  activeMailService = service
}
