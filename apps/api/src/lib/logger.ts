import pino from 'pino'

export const logger = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-internal-token"]',
      'body.password',
      'body.token',
      'body.key',
      '*.token',
      '*.password',
      '*.key',
    ],
    censor: '[REDACTED]',
  },
})
