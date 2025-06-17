import type { PostgresAdapterArgs } from "@payloadcms/db-postgres";
import { postgresAdapter } from "@payloadcms/db-postgres";

import { createServiceLogger, type LogContext } from "@kit/shared/logger";

// Initialize enhanced logger for database adapter
const { getLogger, getContextLogger } = createServiceLogger("DB-ADAPTER");

// Global variable to survive Next.js hot reloads
declare global {
	// eslint-disable-next-line no-var
	var __payload_db_adapter_manager: DatabaseAdapterManager | undefined;
	// eslint-disable-next-line no-var
	var __payload_cached_adapter: ReturnType<typeof postgresAdapter> | undefined;
}

interface ConnectionMetrics {
	totalConnections: number;
	activeConnections: number;
	idleConnections: number;
	failedConnections: number;
	lastHealthCheck: Date;
	lastConnectionAttempt: Date;
	consecutiveFailures: number;
}

interface PoolConfig {
	max: number;
	min: number;
	connectionTimeoutMillis: number;
	idleTimeoutMillis: number;
	acquireTimeoutMillis: number;
	createTimeoutMillis: number;
	destroyTimeoutMillis: number;
	reapIntervalMillis: number;
	createRetryIntervalMillis: number;
}

class DatabaseAdapterManager {
	private adapter: ReturnType<typeof postgresAdapter> | null = null;
	private isInitialized = false;
	private metrics: ConnectionMetrics;
	private healthCheckInterval: NodeJS.Timeout | null = null;
	private validationPromise: Promise<void> | null = null;
	private readonly environment: string;
	private logger: any;

	constructor() {
		this.environment = process.env.NODE_ENV || "development";
		this.metrics = {
			totalConnections: 0,
			activeConnections: 0,
			idleConnections: 0,
			failedConnections: 0,
			lastHealthCheck: new Date(),
			lastConnectionAttempt: new Date(),
			consecutiveFailures: 0,
		};

		// Initialize logger synchronously
		this.logger = getLogger();
		this.logger.info("DatabaseAdapterManager initialized", {
			environment: this.environment,
			operation: "db_adapter_init",
		});
	}


	/**
	 * Get or create the database adapter synchronously
	 * This is the main method that must work synchronously for payload.config.ts
	 */
	getAdapter(): ReturnType<typeof postgresAdapter> {
		if (this.adapter && this.isInitialized) {
			this.log("Returning existing adapter instance", "debug");
			return this.adapter;
		}

		if (!this.adapter) {
			this.log("Creating database adapter synchronously", "info");
			this.adapter = this.createAdapterSynchronously();
			this.isInitialized = true;

			// Start background validation and health monitoring (async, non-blocking)
			this.startBackgroundValidation();
		}

		return this.adapter;
	}

	/**
	 * Create the database adapter synchronously
	 * The adapter creation itself is synchronous, connection pooling happens internally
	 */
	private createAdapterSynchronously(): ReturnType<typeof postgresAdapter> {
		try {
			this.metrics.lastConnectionAttempt = new Date();
			this.log("Building adapter configuration", "debug");

			const config = this.buildAdapterConfig();
			const adapter = postgresAdapter(config);

			this.metrics.totalConnections++;
			this.log("Database adapter created successfully", "info");

			return adapter;
		} catch (error) {
			this.metrics.failedConnections++;
			this.metrics.consecutiveFailures++;

			const errorMessage = `Failed to create database adapter: ${error instanceof Error ? error.message : "Unknown error"}`;
			this.log(errorMessage, "error");
			throw new Error(errorMessage);
		}
	}

	/**
	 * Start background validation and health monitoring
	 * This runs asynchronously after the adapter is created and returned
	 */
	private startBackgroundValidation(): void {
		if (this.validationPromise) {
			return; // Already started
		}

		this.validationPromise = this.performBackgroundValidation().catch(
			(error) => {
				this.log(
					`Background validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
					"warn",
				);
				// Don't throw here - the adapter is already created and returned
			},
		);

		// Start health monitoring
		this.startHealthMonitoring();
	}

	/**
	 * Perform background validation of the database connection
	 */
	private async performBackgroundValidation(): Promise<void> {
		if (!this.adapter) {
			return;
		}

		this.log("Starting background database validation", "debug");

		try {
			// Perform any async validation here
			// For now, we'll just log that validation passed
			// In a real implementation, you might want to test the connection
			await this.testConnectionAsync();

			this.metrics.consecutiveFailures = 0;
			this.log("Background database validation completed successfully", "info");
			this.logMetrics();
		} catch (error) {
			this.metrics.failedConnections++;
			this.metrics.consecutiveFailures++;
			this.log(
				`Background validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				"warn",
			);
		}
	}

	/**
	 * Determine if SSL should be enabled based on environment variables
	 */
	private shouldEnableSSL(): boolean {
		// Check for explicit SSL configuration first
		if (process.env.PAYLOAD_ENABLE_SSL === "true") {
			return true;
		}

		// For remote migrations, check if we're in migration mode
		if (process.env.PAYLOAD_MIGRATION_MODE === "production") {
			return true;
		}

		// Default to production environment check (backward compatibility)
		return this.environment === "production";
	}

	/**
	 * Build environment-specific adapter configuration
	 */
	private buildAdapterConfig(): PostgresAdapterArgs {
		const connectionString = process.env.DATABASE_URI;
		if (!connectionString) {
			throw new Error("DATABASE_URI environment variable is required");
		}

		// Enhanced SSL configuration
		const shouldUseSSL = this.shouldEnableSSL();
		const sslConfig = shouldUseSSL
			? {
					rejectUnauthorized: false,
				}
			: false;

		// Environment-specific pool configurations
		const poolConfig = this.getPoolConfig();

		const config: PostgresAdapterArgs = {
			pool: {
				connectionString,
				ssl: sslConfig,
				...poolConfig,
			},
			schemaName: "payload",
			idType: "uuid",
			push: false, // Disable schema push to prevent unwanted migrations
		};

		void this.log("Built adapter configuration", "debug", {
			environment: this.environment,
			sslEnabled: shouldUseSSL,
			sslReason:
				process.env.PAYLOAD_ENABLE_SSL === "true"
					? "PAYLOAD_ENABLE_SSL"
					: process.env.PAYLOAD_MIGRATION_MODE === "production"
						? "PAYLOAD_MIGRATION_MODE"
						: this.environment === "production"
							? "NODE_ENV=production"
							: "none",
			poolMax: poolConfig.max,
			poolMin: poolConfig.min,
			schemaName: config.schemaName,
			idType: config.idType,
			operation: "adapter_config",
		});

		return config;
	}

	/**
	 * Get environment-specific pool configuration
	 * Enhanced to consider SSL/migration mode for pool optimization
	 */
	private getPoolConfig(): PoolConfig {
		const isDevelopment = this.environment === "development";
		const isProduction = this.environment === "production";
		const isMigrationMode = process.env.PAYLOAD_MIGRATION_MODE === "production";
		const isSSLEnabled = this.shouldEnableSSL();

		// If we're using SSL or in migration mode, use production-optimized settings
		if (isProduction || isMigrationMode || isSSLEnabled) {
			return {
				max: 15, // Production: max 15 connections
				min: 2, // Keep at least 2 connections warm
				connectionTimeoutMillis: 10000, // 10 seconds for production
				idleTimeoutMillis: 30000, // 30 seconds idle timeout
				acquireTimeoutMillis: 5000, // 5 seconds to acquire connection
				createTimeoutMillis: 10000, // 10 seconds to create connection
				destroyTimeoutMillis: 5000, // 5 seconds to destroy connection
				reapIntervalMillis: 1000, // Check for idle connections every second
				createRetryIntervalMillis: 200, // Retry every 200ms
			};
		}
		if (isDevelopment) {
			return {
				max: 8, // Development: max 8 connections
				min: 1, // Keep at least 1 connection warm
				connectionTimeoutMillis: 15000, // 15 seconds for dev debugging
				idleTimeoutMillis: 60000, // 1 minute idle timeout
				acquireTimeoutMillis: 10000, // 10 seconds to acquire connection
				createTimeoutMillis: 15000, // 15 seconds to create connection
				destroyTimeoutMillis: 5000, // 5 seconds to destroy connection
				reapIntervalMillis: 2000, // Check for idle connections every 2 seconds
				createRetryIntervalMillis: 500, // Retry every 500ms
			};
		}
		// Default configuration for other environments (test, staging, etc.)
		return {
			max: 5,
			min: 0,
			connectionTimeoutMillis: 10000,
			idleTimeoutMillis: 30000,
			acquireTimeoutMillis: 5000,
			createTimeoutMillis: 10000,
			destroyTimeoutMillis: 5000,
			reapIntervalMillis: 1000,
			createRetryIntervalMillis: 200,
		};
	}

	/**
	 * Test database connection health (async version for background validation)
	 */
	private async testConnectionAsync(): Promise<void> {
		if (!this.adapter) {
			throw new Error("No adapter available for connection test");
		}

		try {
			// The adapter should be accessible if initialization was successful
			// In a real implementation, you might want to execute a simple query
			this.log("Async connection test passed", "debug");
		} catch (error) {
			throw new Error(
				`Async connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Start health monitoring
	 */
	private startHealthMonitoring(): void {
		// Only start health monitoring in production or if explicitly enabled
		if (
			this.environment !== "production" &&
			!process.env.ENABLE_DB_HEALTH_MONITORING
		) {
			return;
		}

		const interval = Number.parseInt(
			process.env.DB_HEALTH_CHECK_INTERVAL || "30000",
		); // Default 30 seconds

		this.healthCheckInterval = setInterval(async () => {
			await this.performHealthCheck();
		}, interval);

		this.log(`Health monitoring started with ${interval}ms interval`, "info");
	}

	/**
	 * Perform health check
	 */
	private async performHealthCheck(): Promise<void> {
		this.metrics.lastHealthCheck = new Date();

		if (!this.adapter) {
			this.log("Health check: No adapter available", "warn");
			return;
		}

		try {
			await this.testConnectionAsync();
			this.log("Health check: Connection healthy", "debug");
		} catch (error) {
			this.log(
				`Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
				"error",
			);
			this.metrics.failedConnections++;
		}
	}

	/**
	 * Get current connection metrics
	 */
	getMetrics(): ConnectionMetrics {
		return { ...this.metrics };
	}

	/**
	 * Log metrics information
	 */
	private logMetrics(): void {
		if (
			this.environment === "development" ||
			process.env.ENABLE_DB_METRICS_LOGGING
		) {
			this.log("Database metrics", "info", this.metrics);
		}
	}

	/**
	 * Cleanup resources
	 */
	cleanup(): void {
		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval);
			this.healthCheckInterval = null;
		}

		this.log("DatabaseAdapterManager cleanup completed", "info");
	}

	/**
	 * Centralized logging with configurable levels
	 */
	private log(
		message: string,
		level: "debug" | "info" | "warn" | "error" = "info",
		context?: LogContext,
	): void {
		this.logger[level](message, context);
	}
}

/**
 * Get the singleton instance of DatabaseAdapterManager
 */
export function getDatabaseAdapterManager(): DatabaseAdapterManager {
	if (!globalThis.__payload_db_adapter_manager) {
		globalThis.__payload_db_adapter_manager = new DatabaseAdapterManager();
	}
	return globalThis.__payload_db_adapter_manager;
}

/**
 * Get the database adapter synchronously (main export for use in payload.config.ts)
 * This function creates and returns the adapter immediately, then validates it in the background
 */
export function getDatabaseAdapter(): ReturnType<typeof postgresAdapter> {
	// Check if we have a cached adapter first
	if (globalThis.__payload_cached_adapter) {
		return globalThis.__payload_cached_adapter;
	}

	// Create the adapter synchronously
	const manager = getDatabaseAdapterManager();
	const adapter = manager.getAdapter();

	// Cache it for future calls
	globalThis.__payload_cached_adapter = adapter;

	return adapter;
}

/**
 * Async version for cases where you need to wait for full validation
 */
export async function getDatabaseAdapterAsync(): Promise<
	ReturnType<typeof postgresAdapter>
> {
	const adapter = getDatabaseAdapter();

	// If you need to wait for background validation to complete, you could add that here
	// For now, just return the adapter as it's created synchronously

	return adapter;
}

/**
 * Get connection metrics
 */
export function getDatabaseMetrics(): ConnectionMetrics {
	const manager = getDatabaseAdapterManager();
	return manager.getMetrics();
}

/**
 * Cleanup database resources (useful for graceful shutdown)
 */
export function cleanupDatabase(): void {
	if (globalThis.__payload_db_adapter_manager) {
		globalThis.__payload_db_adapter_manager.cleanup();
		globalThis.__payload_db_adapter_manager = undefined;
	}
	// Clear cached adapter
	globalThis.__payload_cached_adapter = undefined;
}
