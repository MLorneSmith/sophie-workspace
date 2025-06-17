import type { MonitoringService } from "@kit/monitoring-core";
import { createServiceLogger } from "./enhanced-logger";

/**
 * Create a service logger with automatic monitoring integration
 * This is the recommended way to create loggers in the application
 * 
 * @param serviceName - The name of the service/component
 * @param monitoringPromise - Optional promise that resolves to a monitoring service
 * @returns Service logger with monitoring integration
 */
export function createMonitoredLogger(
	serviceName: string,
	monitoringPromise?: Promise<MonitoringService>,
) {
	// Create logger without monitoring initially
	let logger = createServiceLogger(serviceName);
	
	// If monitoring promise is provided, update the logger when it resolves
	if (monitoringPromise) {
		monitoringPromise
			.then((monitoring) => {
				// Recreate logger with monitoring service
				logger = createServiceLogger(serviceName, monitoring);
			})
			.catch((error) => {
				// Log error but continue without monitoring
				logger.getLogger().warn("Failed to initialize monitoring service", {
					error: error instanceof Error ? error.message : String(error),
					service: serviceName,
				// });
			});
	}
	
	return logger;
}

/**
 * Server-side helper to create a monitored logger
 * Automatically loads the monitoring service based on environment configuration
 * 
 * TODO: This function is temporarily disabled due to circular dependency issues
 * with @kit/monitoring. It should be re-enabled once the architecture is refactored.
 */
export async function _createServerLogger(serviceName: string) {
	// Fallback to regular logger for now
	return createServiceLogger(serviceName);
}

/**
 * Client-side helper to create a monitored logger
 * Uses a lighter-weight monitoring approach suitable for browsers
 */
export function _createClientLogger(serviceName: string) {
	// For now, return logger without monitoring
	// In the future, this could integrate with browser-based monitoring
	return createServiceLogger(serviceName);
}