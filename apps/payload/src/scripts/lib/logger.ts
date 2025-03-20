/**
 * Simple logger utility for consistent logging across scripts
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Current log level - can be set via environment variable
let currentLogLevel = LogLevel.INFO

// Set the log level
export function setLogLevel(level: LogLevel) {
  currentLogLevel = level
}

// Format the current timestamp
function getTimestamp() {
  return new Date().toISOString()
}

// Log a message with a specific level
function log(level: LogLevel, message: string, ...args: any[]) {
  if (level >= currentLogLevel) {
    const timestamp = getTimestamp()
    const prefix = `[${timestamp}] [${LogLevel[level]}]`

    if (args.length > 0) {
      console.log(`${prefix} ${message}`, ...args)
    } else {
      console.log(`${prefix} ${message}`)
    }
  }
}

// Logger interface
export const logger = {
  debug: (message: string, ...args: any[]) => log(LogLevel.DEBUG, message, ...args),
  info: (message: string, ...args: any[]) => log(LogLevel.INFO, message, ...args),
  warn: (message: string, ...args: any[]) => log(LogLevel.WARN, message, ...args),
  error: (message: string, ...args: any[]) => log(LogLevel.ERROR, message, ...args),

  // Log a section header
  section: (title: string) => {
    if (LogLevel.INFO >= currentLogLevel) {
      console.log('\n' + '='.repeat(80))
      console.log(`[${getTimestamp()}] ${title}`)
      console.log('='.repeat(80))
    }
  },

  // Log a success message
  success: (message: string, ...args: any[]) => {
    if (LogLevel.INFO >= currentLogLevel) {
      const timestamp = getTimestamp()
      const prefix = `[${timestamp}] [SUCCESS]`

      if (args.length > 0) {
        console.log(`${prefix} ${message}`, ...args)
      } else {
        console.log(`${prefix} ${message}`)
      }
    }
  },
}
