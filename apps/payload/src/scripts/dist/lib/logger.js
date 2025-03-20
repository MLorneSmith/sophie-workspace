/**
 * Simple logger utility for consistent logging across scripts
 */
// Log levels
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
// Current log level - can be set via environment variable
let currentLogLevel = LogLevel.INFO;
// Set the log level
export function setLogLevel(level) {
    currentLogLevel = level;
}
// Format the current timestamp
function getTimestamp() {
    return new Date().toISOString();
}
// Log a message with a specific level
function log(level, message, ...args) {
    if (level >= currentLogLevel) {
        const timestamp = getTimestamp();
        const prefix = `[${timestamp}] [${LogLevel[level]}]`;
        if (args.length > 0) {
            console.log(`${prefix} ${message}`, ...args);
        }
        else {
            console.log(`${prefix} ${message}`);
        }
    }
}
// Logger interface
export const logger = {
    debug: (message, ...args) => log(LogLevel.DEBUG, message, ...args),
    info: (message, ...args) => log(LogLevel.INFO, message, ...args),
    warn: (message, ...args) => log(LogLevel.WARN, message, ...args),
    error: (message, ...args) => log(LogLevel.ERROR, message, ...args),
    // Log a section header
    section: (title) => {
        if (LogLevel.INFO >= currentLogLevel) {
            console.log('\n' + '='.repeat(80));
            console.log(`[${getTimestamp()}] ${title}`);
            console.log('='.repeat(80));
        }
    },
    // Log a success message
    success: (message, ...args) => {
        if (LogLevel.INFO >= currentLogLevel) {
            const timestamp = getTimestamp();
            const prefix = `[${timestamp}] [SUCCESS]`;
            if (args.length > 0) {
                console.log(`${prefix} ${message}`, ...args);
            }
            else {
                console.log(`${prefix} ${message}`);
            }
        }
    },
};
