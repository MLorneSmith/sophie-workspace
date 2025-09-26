import { createRegistry } from "../registry/index.js";
import type { Logger, Logger as LoggerInstance } from "./logger";

// Import Logger and export it

// Define the type for the logger provider.  Currently supporting 'pino'.
type LoggerProvider = "pino" | "console";

// Use pino as the default logger provider
const LOGGER = (process.env.LOGGER ?? "pino") as LoggerProvider;

// Create a registry for logger implementations
const loggerRegistry = createRegistry<LoggerInstance, LoggerProvider>();

// Register the 'pino' logger implementation
loggerRegistry.register("pino", async () => {
	const { Logger: PinoLogger } = await import("./impl/pino");

	return PinoLogger;
});

// Register the 'console' logger implementation
loggerRegistry.register("console", async () => {
	const { Logger: ConsoleLogger } = await import("./impl/console");

	return ConsoleLogger;
});

/**
 * @name getLogger
 * @description Retrieves the logger implementation based on the LOGGER environment variable using the registry API.
 */
export async function getLogger() {
	return loggerRegistry.get(LOGGER);
}

// Export the Logger interface
export type { Logger };

// Export monitored logger utilities
export {
	_createClientLogger as createClientLogger,
	_createServerLogger as createServerLogger,
	createMonitoredLogger,
} from "./create-monitored-logger.js";
// Export enhanced types
export type { LogLevel as EnhancedLogLevel } from "./enhanced-logger.js";
// Export enhanced logger (new unified approach)
export {
	createEnhancedLogger,
	createServiceLogger,
	createTestLogger,
	EnhancedLogger,
	type EnhancedLoggerConfig,
	getEnhancedLoggerConfig,
	type LogContext,
} from "./enhanced-logger.js";
// Export environment logger utilities (legacy compatibility)
export {
	createEnvironmentLogger,
	EnvironmentLogger,
	getLogLevel,
	type LoggerConfig,
	type LogLevel,
} from "./utils/environment-logger.js";
