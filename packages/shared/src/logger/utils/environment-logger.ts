import { z } from "zod";

// Define log levels
export type LogLevel = "debug" | "info" | "warn" | "error";

// Environment-aware logger configuration
export interface LoggerConfig {
	enableLogging: boolean;
	logLevel: LogLevel;
	environment: string;
	serviceName: string;
}

// Parse log level from environment variables with fallbacks
export function getLogLevel(): LogLevel {
	const level =
		process.env.LOG_LEVEL ||
		process.env.API_LOG_LEVEL ||
		(process.env.NODE_ENV === "development" ? "debug" : "info");

	return z
		.enum(["debug", "info", "warn", "error"])
		.default("info")
		.parse(level);
}

// Create environment-aware logger
export function createEnvironmentLogger(
	serviceName: string,
): EnvironmentLogger {
	return new EnvironmentLogger({
		enableLogging: process.env.DISABLE_LOGGING !== "true",
		logLevel: getLogLevel(),
		environment: process.env.NODE_ENV || "development",
		serviceName,
	});
}

// Logger implementation
export class EnvironmentLogger {
	private config: LoggerConfig;
	private levels = { debug: 0, info: 1, warn: 2, error: 3 };

	constructor(config: LoggerConfig) {
		this.config = config;
	}

	debug(message: string, data?: unknown): void {
		this.log(message, "debug", data);
	}

	info(message: string, data?: unknown): void {
		this.log(message, "info", data);
	}

	warn(message: string, data?: unknown): void {
		this.log(message, "warn", data);
	}

	error(message: string, data?: unknown): void {
		this.log(message, "error", data);
	}

	private log(message: string, level: LogLevel, data?: unknown): void {
		if (!this.config.enableLogging) return;

		if (this.levels[level] < this.levels[this.config.logLevel]) return;

		const timestamp = new Date().toISOString();
		const prefix = `[${this.config.serviceName}-${level.toUpperCase()}] ${timestamp}`;

		// In production, sanitize sensitive data
		const sanitizedData =
			this.config.environment === "production" && data
				? this.sanitizeData(data)
				: data;

		if (sanitizedData) {
			console[level === "error" ? "error" : "log"](
				`${prefix} ${message}`,
				sanitizedData,
			);
		} else {
			console[level === "error" ? "error" : "log"](`${prefix} ${message}`);
		}
	}

	// Sanitize sensitive data in production
	private sanitizeData(data: unknown): unknown {
		if (this.config.environment !== "production") return data;

		// Create a deep copy to avoid modifying the original
		const sanitized = JSON.parse(JSON.stringify(data));

		// Sanitize common sensitive fields
		const sensitiveFields = [
			"password",
			"token",
			"key",
			"secret",
			"authorization",
		];

		const sanitizeObject = (obj: Record<string, unknown>) => {
			if (!obj || typeof obj !== "object") return;

			for (const key of Object.keys(obj)) {
				const lowerKey = key.toLowerCase();

				// Mask sensitive fields
				if (sensitiveFields.some((field) => lowerKey.includes(field))) {
					obj[key] = "[REDACTED]";
				} else if (typeof obj[key] === "object" && obj[key] !== null) {
					sanitizeObject(obj[key] as Record<string, unknown>);
				}
			}
		};

		sanitizeObject(sanitized);
		return sanitized;
	}
}
