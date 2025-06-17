import type { MonitoringService } from "@kit/monitoring-core";
import { z } from "zod";

// Enhanced log levels
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

// Enhanced logger configuration
export interface EnhancedLoggerConfig {
	// Service identification
	serviceName: string;
	environment: string;

	// Logging behavior
	enableLogging: boolean;
	logLevel: LogLevel;
	enableStructuredLogging: boolean;

	// Security features
	enableSanitization: boolean;
	sensitiveFields: string[];

	// Monitoring integration
	enableMonitoring: boolean;
	monitoringService?: MonitoringService;
	monitoringThreshold: LogLevel;

	// Output configuration
	provider: "pino" | "console";
}

// Enhanced log context
export interface LogContext {
	requestId?: string;
	userId?: string;
	sessionId?: string;
	operation?: string;
	duration?: number;
	[key: string]: unknown;
}

// Parse log level with validation
export function getLogLevel(): LogLevel {
	const level =
		process.env.LOG_LEVEL ||
		process.env.API_LOG_LEVEL ||
		(process.env.NODE_ENV === "development" ? "debug" : "info");

	return z
		.enum(["debug", "info", "warn", "error", "fatal"])
		.default("info")
		.parse(level);
}

// Get enhanced logger configuration
export function getEnhancedLoggerConfig(
	serviceName: string,
): EnhancedLoggerConfig {
	return {
		serviceName,
		environment: process.env.NODE_ENV || "development",
		enableLogging: process.env.DISABLE_LOGGING !== "true",
		logLevel: getLogLevel(),
		enableStructuredLogging:
			process.env.NODE_ENV === "production" ||
			process.env.ENABLE_STRUCTURED_LOGGING === "true",
		enableSanitization:
			process.env.NODE_ENV === "production" ||
			process.env.ENABLE_DATA_SANITIZATION === "true",
		enableMonitoring: process.env.ENABLE_MONITORING_LOGS === "true",
		monitoringThreshold: (process.env.MONITORING_LOG_THRESHOLD ??
			"error") as LogLevel,
		provider: (process.env.LOGGER ?? "pino") as "pino" | "console",
		sensitiveFields: [
			"password",
			"token",
			"key",
			"secret",
			"authorization",
			"cookie",
			"session",
			"credentials",
			"auth",
			"apikey",
		],
	};
}

// Enhanced logger implementation
export class EnhancedLogger {
	public readonly config: EnhancedLoggerConfig;
	private levels = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };
	public readonly monitoring?: MonitoringService;

	constructor(config: EnhancedLoggerConfig, monitoring?: MonitoringService) {
		this.config = config;
		this.monitoring = monitoring;
	}

	debug(message: string, context?: LogContext): void {
		this.log(message, "debug", context);
	}

	info(message: string, context?: LogContext): void {
		this.log(message, "info", context);
	}

	warn(message: string, context?: LogContext): void {
		this.log(message, "warn", context);
		this.sendToMonitoring("warn", message, context);
	}

	error(message: string, context?: LogContext): void {
		this.log(message, "error", context);
		this.sendToMonitoring("error", message, context);
	}

	fatal(message: string, context?: LogContext): void {
		this.log(message, "fatal", context);
		this.sendToMonitoring("fatal", message, context);
	}

	// Create child logger with additional context
	child(childContext: LogContext): EnhancedLogger {
		return new ChildLogger(this, childContext);
	}

	// Create request-scoped logger
	forRequest(
		requestId: string,
		additionalContext?: LogContext,
	): EnhancedLogger {
		return this.child({
			requestId,
			timestamp: new Date().toISOString(),
			...additionalContext,
		});
	}

	protected log(message: string, level: LogLevel, context?: LogContext): void {
		if (!this.config.enableLogging) return;
		if (this.levels[level] < this.levels[this.config.logLevel]) return;

		const logEntry = this.buildLogEntry(message, level, context);
		this.output(logEntry, level);
	}

	private buildLogEntry(
		message: string,
		level: LogLevel,
		context?: LogContext,
	) {
		const baseEntry = {
			timestamp: new Date().toISOString(),
			level,
			service: this.config.serviceName,
			environment: this.config.environment,
			message,
		};

		if (context) {
			const sanitizedContext = this.config.enableSanitization
				? this.sanitizeData(context) as LogContext
				: context;

			return { ...baseEntry, ...sanitizedContext };
		}

		return baseEntry;
	}

	private output(logEntry: Record<string, unknown>, level: LogLevel): void {
		if (this.config.enableStructuredLogging) {
			// Structured JSON output
			const output = JSON.stringify(logEntry);
			this.writeToConsole(output, level);
		} else {
			// Human-readable format
			const prefix = `[${this.config.serviceName}-${level.toUpperCase()}] ${logEntry.timestamp}`;
			const contextStr = this.formatContextForHumans(logEntry);
			const output = contextStr
				? `${prefix} ${logEntry.message} ${contextStr}`
				: `${prefix} ${logEntry.message}`;

			this.writeToConsole(output, level);
		}
	}

	private writeToConsole(output: string, level: LogLevel): void {
		switch (level) {
			case "debug":
				// biome-ignore lint/suspicious/noConsole: Logger implementation requires console access
				console.debug(output);
				break;
			case "info":
				// biome-ignore lint/suspicious/noConsole: Logger implementation requires console access
				console.info(output);
				break;
			case "warn":
				// biome-ignore lint/suspicious/noConsole: Logger implementation requires console access
				console.warn(output);
				break;
			case "error":
			case "fatal":
				// biome-ignore lint/suspicious/noConsole: Logger implementation requires console access
				console.error(output);
				break;
		}
	}

	private formatContextForHumans(logEntry: Record<string, unknown>): string {
		const context = { ...logEntry };
		delete context.timestamp;
		delete context.level;
		delete context.service;
		delete context.environment;
		delete context.message;

		const contextEntries = Object.entries(context);
		if (contextEntries.length === 0) return "";

		return contextEntries
			.map(([key, value]) => `${key}=${this.formatValue(value)}`)
			.join(" ");
	}

	private formatValue(value: unknown): string {
		if (typeof value === "string") return value;
		if (typeof value === "number" || typeof value === "boolean")
			return String(value);
		if (value instanceof Error) return value.message;
		return JSON.stringify(value);
	}

	private sendToMonitoring(
		level: LogLevel,
		message: string,
		context?: LogContext,
	): void {
		if (!this.config.enableMonitoring || !this.monitoring) return;
		if (this.levels[level] < this.levels[this.config.monitoringThreshold])
			return;

		try {
			if (level === "error" || level === "fatal") {
				// Send errors as exceptions
				const error =
					context?.error instanceof Error ? context.error : new Error(message);

				this.monitoring.captureException(error, {
					service: this.config.serviceName,
					level,
					message,
					context: this.sanitizeData(context || {}),
				// });
			} else {
				// Send warnings and other levels as events
				this.monitoring.captureEvent(`${level.toUpperCase()}: ${message}`, {
					service: this.config.serviceName,
					level,
					context: this.sanitizeData(context || {}),
				// });
			}
		} catch (monitoringError) 
			// Don't let monitoring failures break the application
			// biome-ignore lint/suspicious/noConsole: Error handling for monitoring failures
			console.error("Failed to send log to monitoring service:", monitoringError);
	}

	private sanitizeData(data: unknown): unknown {
		if (!this.config.enableSanitization) return data;
		if (!data || typeof data !== "object") return data;

		// Create a deep copy to avoid modifying the original
		const sanitized = JSON.parse(JSON.stringify(data));
		this.sanitizeObject(sanitized);
		return sanitized;
	}

	private sanitizeObject(obj: Record<string, unknown>): void 
		if (!obj || typeof obj !== "object") return;

		for (const key of Object.keys(obj)) {
			const lowerKey = key.toLowerCase();

			// Mask sensitive fields
			if (
				this.config.sensitiveFields.some((field) => lowerKey.includes(field))
			) {
				obj[key] = "[REDACTED]";
			} else if (typeof obj[key] === "object" && obj[key] !== null) {
				this.sanitizeObject(obj[key] as Record<string, unknown>);
			}
		}
}

// Child logger that inherits parent context
class ChildLogger extends EnhancedLogger {
	constructor(
		private parent: EnhancedLogger,
		private childContext: LogContext,
	) {
		super(parent.config, parent.monitoring);
	}

	protected log(message: string, level: LogLevel, context?: LogContext): void {
		const mergedContext = { ...this.childContext, ...context };
		super.log(message, level, mergedContext);
	}
}

// Factory function for creating enhanced loggers
export function createEnhancedLogger(
	serviceName: string,
	monitoring?: MonitoringService,
): EnhancedLogger {
	const config = getEnhancedLoggerConfig(serviceName);
	return new EnhancedLogger(config, monitoring);
}

// Service logger factory with convenience methods
export function createServiceLogger(
	serviceName: string,
	monitoring?: MonitoringService,
) {
	const logger = createEnhancedLogger(serviceName, monitoring);

	return {
		getLogger(): EnhancedLogger {
			return logger;
		},

		getRequestLogger(
			requestId: string,
			additionalContext?: LogContext,
		): EnhancedLogger {
			return logger.forRequest(requestId, additionalContext);
		},

		getContextLogger(context: LogContext): EnhancedLogger {
			return logger.child(context);
		},

		// Convenience methods for common logging patterns
		logApiCall(
			endpoint: string,
			method: string,
			statusCode: number,
			duration: number,
		): void {
			const level =
				statusCode >= 400 ? "error" : statusCode >= 300 ? "warn" : "info";
			logger[level]("API call completed", {
				operation: "api_call",
				endpoint,
				method,
				statusCode,
				duration,
			});
		},

		logDatabaseQuery(query: string, duration: number, rowCount?: number): void {
			logger.debug("Database query executed", {
				operation: "db_query",
				query: query.substring(0, 100) + (query.length > 100 ? "..." : ""),
				duration,
				rowCount,
			});
		},

		logUserAction(
			userId: string,
			action: string,
			success: boolean,
			context?: LogContext,
		): void {
			const level = success ? "info" : "warn";
			logger[level](`User action ${success ? "completed" : "failed"}`, {
				operation: "user_action",
				userId,
				action,
				success,
				...context,
			});
		},
	};
}

// Legacy compatibility functions
export function createEnvironmentLogger(serviceName: string): EnhancedLogger {
	return createEnhancedLogger(serviceName);
}

// Testing utilities
export function createTestLogger(serviceName = "TEST"): EnhancedLogger {
	const config: EnhancedLoggerConfig = {
		serviceName,
		environment: "test",
		enableLogging: true,
		logLevel: "debug",
		enableStructuredLogging: false,
		enableSanitization: false,
		enableMonitoring: false,
		monitoringThreshold: "error",
		provider: "console",
		sensitiveFields: [],
	};

	return new EnhancedLogger(config);
}
