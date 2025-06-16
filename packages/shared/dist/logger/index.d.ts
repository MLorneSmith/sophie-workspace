import type { Logger } from "./logger";
/**
 * @name getLogger
 * @description Retrieves the logger implementation based on the LOGGER environment variable using the registry API.
 */
export declare function getLogger(): Promise<Logger>;
export type { Logger };
export { createEnvironmentLogger, EnvironmentLogger, getLogLevel, type LoggerConfig, type LogLevel, } from "./utils/environment-logger";
export { EnhancedLogger, createEnhancedLogger, createServiceLogger, createTestLogger, getEnhancedLoggerConfig, type EnhancedLoggerConfig, type LogContext, } from "./enhanced-logger";
export type { LogLevel as EnhancedLogLevel } from "./enhanced-logger";
//# sourceMappingURL=index.d.ts.map