var _a;
import { createRegistry } from "../registry";
// Use pino as the default logger provider
const LOGGER = ((_a = process.env.LOGGER) !== null && _a !== void 0 ? _a : "pino");
// Create a registry for logger implementations
const loggerRegistry = createRegistry();
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
// Export environment logger utilities (legacy compatibility)
export { createEnvironmentLogger, EnvironmentLogger, getLogLevel, } from "./utils/environment-logger";
// Export enhanced logger (new unified approach)
export { EnhancedLogger, createEnhancedLogger, createServiceLogger, createTestLogger, getEnhancedLoggerConfig, } from "./enhanced-logger";
