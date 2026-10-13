type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  [key: string]: unknown
}

class Logger {
  private format(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    }

    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(entry)
    }

    const colors = {
      info: '\x1b[36m', // Cyan
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
      debug: '\x1b[90m', // Gray
    }
    const reset = '\x1b[0m'
    const color = colors[level] || reset

    const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
    return `${entry.timestamp} ${color}[${level.toUpperCase()}]${reset} ${message}${metaStr}`
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.log(this.format('info', message, meta))
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.format('warn', message, meta))
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(this.format('error', message, meta))
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.format('debug', message, meta))
    }
  }
}

export const logger = new Logger()
