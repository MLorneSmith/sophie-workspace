/**
 * Standardized logging utilities for migration scripts
 * Provides consistent formatting and levels for all migration logs
 */
import chalk from 'chalk';
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["SUCCESS"] = 2] = "SUCCESS";
    LogLevel[LogLevel["WARNING"] = 3] = "WARNING";
    LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
})(LogLevel || (LogLevel = {}));
export class Logger {
    constructor(context, minLevel = LogLevel.INFO) {
        this.context = context;
        this.minLevel = minLevel;
    }
    log(level, message, details) {
        if (level < this.minLevel)
            return;
        const timestamp = new Date().toISOString();
        const contextStr = this.context ? `[${this.context}]` : '';
        let formattedMessage = `${timestamp} ${contextStr} `;
        switch (level) {
            case LogLevel.DEBUG:
                formattedMessage += chalk.gray(`DEBUG: ${message}`);
                break;
            case LogLevel.INFO:
                formattedMessage += chalk.white(`INFO: ${message}`);
                break;
            case LogLevel.SUCCESS:
                formattedMessage += chalk.green(`SUCCESS: ${message}`);
                break;
            case LogLevel.WARNING:
                formattedMessage += chalk.yellow(`WARNING: ${message}`);
                break;
            case LogLevel.ERROR:
                formattedMessage += chalk.red(`ERROR: ${message}`);
                break;
        }
        console.log(formattedMessage);
        if (details) {
            if (typeof details === 'object') {
                console.log(chalk.gray(JSON.stringify(details, null, 2)));
            }
            else {
                console.log(chalk.gray(details));
            }
        }
    }
    debug(message, details) {
        this.log(LogLevel.DEBUG, message, details);
    }
    info(message, details) {
        this.log(LogLevel.INFO, message, details);
    }
    success(message, details) {
        this.log(LogLevel.SUCCESS, message, details);
    }
    warning(message, details) {
        this.log(LogLevel.WARNING, message, details);
    }
    error(message, details) {
        this.log(LogLevel.ERROR, message, details);
    }
    // Create a child logger with a sub-context
    child(subContext) {
        return new Logger(`${this.context}:${subContext}`, this.minLevel);
    }
    // Set the minimum log level
    setMinLevel(level) {
        this.minLevel = level;
    }
}
// Default logger instance
export const createLogger = (context, minLevel = LogLevel.INFO) => {
    return new Logger(context, minLevel);
};
// Helper function to get a simple scoped logger
export function getLogger(scope) {
    return createLogger(scope);
}
// Usage example:
// const logger = getLogger('BlogPostMigration');
// logger.info('Starting migration process');
// logger.success('Successfully migrated 5 posts');
// logger.warning('Some posts already exist', { count: 3 });
// logger.error('Failed to migrate post', { slug: 'example', error: 'Database error' });
