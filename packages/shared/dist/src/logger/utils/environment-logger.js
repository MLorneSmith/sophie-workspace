import { z } from 'zod';
// Parse log level from environment variables with fallbacks
export function getLogLevel() {
    const level = process.env.LOG_LEVEL ||
        process.env.API_LOG_LEVEL ||
        (process.env.NODE_ENV === 'development' ? 'debug' : 'info');
    return z.enum(['debug', 'info', 'warn', 'error'])
        .default('info')
        .parse(level);
}
// Create environment-aware logger
export function createEnvironmentLogger(serviceName) {
    return new EnvironmentLogger({
        enableLogging: process.env.DISABLE_LOGGING !== 'true',
        logLevel: getLogLevel(),
        environment: process.env.NODE_ENV || 'development',
        serviceName
    });
}
// Logger implementation
export class EnvironmentLogger {
    constructor(config) {
        this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
        this.config = config;
    }
    debug(message, data) {
        this.log(message, 'debug', data);
    }
    info(message, data) {
        this.log(message, 'info', data);
    }
    warn(message, data) {
        this.log(message, 'warn', data);
    }
    error(message, data) {
        this.log(message, 'error', data);
    }
    log(message, level, data) {
        if (!this.config.enableLogging)
            return;
        if (this.levels[level] < this.levels[this.config.logLevel])
            return;
        const timestamp = new Date().toISOString();
        const prefix = `[${this.config.serviceName}-${level.toUpperCase()}] ${timestamp}`;
        // In production, sanitize sensitive data
        const sanitizedData = this.config.environment === 'production' && data
            ? this.sanitizeData(data)
            : data;
        if (sanitizedData) {
            console[level === 'error' ? 'error' : 'log'](`${prefix} ${message}`, sanitizedData);
        }
        else {
            console[level === 'error' ? 'error' : 'log'](`${prefix} ${message}`);
        }
    }
    // Sanitize sensitive data in production
    sanitizeData(data) {
        if (this.config.environment !== 'production')
            return data;
        // Create a deep copy to avoid modifying the original
        const sanitized = JSON.parse(JSON.stringify(data));
        // Sanitize common sensitive fields
        const sensitiveFields = ['password', 'token', 'key', 'secret', 'authorization'];
        const sanitizeObject = (obj) => {
            if (!obj || typeof obj !== 'object')
                return;
            Object.keys(obj).forEach(key => {
                const lowerKey = key.toLowerCase();
                // Mask sensitive fields
                if (sensitiveFields.some(field => lowerKey.includes(field))) {
                    obj[key] = '[REDACTED]';
                }
                else if (typeof obj[key] === 'object') {
                    sanitizeObject(obj[key]);
                }
            });
        };
        sanitizeObject(sanitized);
        return sanitized;
    }
}
