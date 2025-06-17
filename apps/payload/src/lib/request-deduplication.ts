/**
 * Request Deduplication Middleware for Payload CMS
 *
 * This middleware prevents duplicate requests from being processed by creating
 * fingerprints based on request content and caching responses for a short duration.
 *
 * Key Features:
 * - Request fingerprinting based on method, path, and body content
 * - Intelligent timeout-based cache cleanup
 * - Support for critical endpoints like user creation
 * - Comprehensive logging for debugging
 * - Production-optimized performance
 */

import * as crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { createServiceLogger } from "@kit/shared/logger";

interface CachedResponse {
	body: string | null;
	status: number;
	statusText: string;
	headers: Record<string, string>;
}

interface RequestFingerprint {
	hash: string;
	timestamp: number;
	response: CachedResponse | null;
	isProcessing: boolean;
	requestCount: number;
}

interface DeduplicationConfig {
	/** Time in milliseconds to cache responses */
	cacheDuration: number;
	/** Time in milliseconds to wait for ongoing requests */
	processingTimeout: number;
	/** Maximum number of duplicate requests to track */
	maxDuplicates: number;
	/** Endpoints that should be protected from duplication */
	protectedEndpoints: string[];
	/** Enable debug logging */
	enableLogging: boolean;
}

class RequestDeduplicationManager {
	private cache = new Map<string, RequestFingerprint>();
	private cleanupInterval: NodeJS.Timeout | null = null;
	private readonly config: DeduplicationConfig;
	private readonly logger = createServiceLogger("REQUEST-DEDUP").getLogger();

	constructor(config?: Partial<DeduplicationConfig>) {
		this.config = {
			cacheDuration: 5000, // 5 seconds default
			processingTimeout: 30000, // 30 seconds for long-running requests
			maxDuplicates: 10,
			protectedEndpoints: [
				"/admin/create-first-user",
				"/api/users",
				"/api/auth",
				"/api/collections/users",
			],
			enableLogging:
				process.env.NODE_ENV === "development" ||
				process.env.ENABLE_REQUEST_DEDUP_LOGGING === "true",
			...config,
		};

		this.startCleanupInterval();
		this.log("Request deduplication manager initialized", "info");
	}

	/**
	 * Generate a unique fingerprint for the request
	 */
	private generateFingerprint(request: NextRequest, body?: string): string {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const method = request.method;
		const contentType = request.headers.get("content-type") || "";

		// Include relevant headers for fingerprinting
		const relevantHeaders = ["authorization", "x-payload-token", "user-agent"]
			.map((header) => `${header}:${request.headers.get(header) || ""}`)
			.join("|");

		// Create hash components
		const components = [
			method,
			pathname,
			url.search, // Include query parameters
			contentType,
			relevantHeaders,
			body || "",
		].join("::");

		// Generate SHA-256 hash
		return crypto.createHash("sha256").update(components).digest("hex");
	}

	/**
	 * Check if the request should be deduplicated
	 */
	private shouldDeduplicate(request: NextRequest): boolean {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const method = request.method;

		// Only deduplicate POST, PUT, PATCH requests
		if (!["POST", "PUT", "PATCH"].includes(method)) {
			return false;
		}

		// Check if the endpoint is in the protected list
		return this.config.protectedEndpoints.some(
			(endpoint) => pathname.includes(endpoint) || pathname.endsWith(endpoint),
		);
	}

	/**
	 * Convert NextResponse to cached response format
	 */
	private async serializeResponse(
		response: NextResponse,
	): Promise<CachedResponse> {
		const cloned = response.clone();
		const body = await cloned.text();

		const headers: Record<string, string> = {};
		cloned.headers.forEach((value, key) => {
			headers[key] = value;
		});

		return {
			body,
			status: cloned.status,
			statusText: cloned.statusText,
			headers,
		};
	}

	/**
	 * Convert cached response back to NextResponse
	 */
	private deserializeResponse(cached: CachedResponse): NextResponse {
		const response = new NextResponse(cached.body, {
			status: cached.status,
			statusText: cached.statusText,
			headers: cached.headers,
		});

		return response;
	}

	/**
	 * Wait for an ongoing request to complete
	 */
	private async waitForOngoingRequest(
		fingerprint: string,
	): Promise<NextResponse | null> {
		const startTime = Date.now();

		while (Date.now() - startTime < this.config.processingTimeout) {
			const cached = this.cache.get(fingerprint);

			if (!cached) {
				return null; // Request was removed or never existed
			}

			if (!cached.isProcessing && cached.response) {
				this.log(
					`Request completed, returning cached response for fingerprint: ${fingerprint.slice(0, 8)}...`,
					"debug",
				);
				return this.deserializeResponse(cached.response);
			}

			// Wait 100ms before checking again
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		this.log(
			`Timeout waiting for ongoing request: ${fingerprint.slice(0, 8)}...`,
			"warn",
		);
		return null;
	}

	/**
	 * Process the request with deduplication
	 */
	async processRequest(
		request: NextRequest,
		handler: (req: NextRequest) => Promise<NextResponse>,
	): Promise<NextResponse> {
		// Quick exit if deduplication is not needed
		if (!this.shouldDeduplicate(request)) {
			return handler(request);
		}

		// Read the request body for fingerprinting
		let body = "";
		try {
			const clonedRequest = request.clone();
			body = await clonedRequest.text();
		} catch (error) {
			this.log(`Failed to read request body: ${error}`, "warn");
			// Continue without body in fingerprint
		}

		const fingerprint = this.generateFingerprint(request, body);
		const cached = this.cache.get(fingerprint);
		const now = Date.now();

		this.log(
			`Processing request with fingerprint: ${fingerprint.slice(0, 8)}...`,
			"debug",
		);

		// Check if we have a cached response that's still valid
		if (cached && !cached.isProcessing && cached.response) {
			const age = now - cached.timestamp;
			if (age < this.config.cacheDuration) {
				cached.requestCount++;
				this.log(
					`Returning cached response (age: ${age}ms, count: ${cached.requestCount})`,
					"info",
				);
				return this.deserializeResponse(cached.response);
			}
			// Cache expired, remove it
			this.cache.delete(fingerprint);
		}

		// Check if the same request is currently being processed
		if (cached?.isProcessing) {
			cached.requestCount++;
			this.log(
				`Duplicate request detected, waiting for ongoing processing (count: ${cached.requestCount})`,
				"info",
			);

			const waitResult = await this.waitForOngoingRequest(fingerprint);
			if (waitResult) {
				return waitResult;
			}

			// If waiting failed, fall through to process the request
			this.log(
				"Failed to wait for ongoing request, processing new one",
				"warn",
			);
		}

		// Mark as processing and execute the request
		this.cache.set(fingerprint, {
			hash: fingerprint,
			timestamp: now,
			response: null,
			isProcessing: true,
			requestCount: 1,
		});

		try {
			this.log("Executing original request handler", "debug");
			const response = await handler(request);

			// Cache the successful response
			const cacheEntry = this.cache.get(fingerprint);
			if (cacheEntry) {
				cacheEntry.response = await this.serializeResponse(response);
				cacheEntry.isProcessing = false;
				cacheEntry.timestamp = Date.now();
			}

			this.log("Request completed successfully, response cached", "debug");
			return response;
		} catch (error) {
			// Remove from cache on error to allow retry
			this.cache.delete(fingerprint);
			this.log(`Request failed, removed from cache: ${error}`, "error");
			throw error;
		}
	}

	/**
	 * Start the cleanup interval to remove expired entries
	 */
	private startCleanupInterval(): void {
		const intervalMs = Math.min(this.config.cacheDuration / 2, 30000); // Clean up every 30 seconds max

		this.cleanupInterval = setInterval(() => {
			this.cleanup();
		}, intervalMs);

		this.log(`Cleanup interval started: ${intervalMs}ms`, "debug");
	}

	/**
	 * Clean up expired cache entries
	 */
	private cleanup(): void {
		const now = Date.now();
		const initialSize = this.cache.size;
		let removed = 0;

		for (const [fingerprint, entry] of Array.from(this.cache.entries())) {
			const age = now - entry.timestamp;
			const maxAge = entry.isProcessing
				? this.config.processingTimeout
				: this.config.cacheDuration;

			if (age > maxAge) {
				this.cache.delete(fingerprint);
				removed++;
			}
		}

		if (removed > 0) {
			this.log(
				`Cleanup completed: removed ${removed}/${initialSize} entries`,
				"debug",
			);
		}

		// If cache is getting too large, remove oldest entries
		if (this.cache.size > this.config.maxDuplicates * 2) {
			const entries = Array.from(this.cache.entries()).sort(
				(a, b) => a[1].timestamp - b[1].timestamp,
			);

			const toRemove = entries.slice(
				0,
				entries.length - this.config.maxDuplicates,
			);
			for (const [fingerprint] of toRemove) {
				this.cache.delete(fingerprint);
			}

			this.log(
				`Cache size limit reached, removed ${toRemove.length} oldest entries`,
				"info",
			);
		}
	}

	/**
	 * Get current cache statistics
	 */
	getStats() {
		const stats = {
			totalEntries: this.cache.size,
			processingEntries: 0,
			completedEntries: 0,
			totalDuplicates: 0,
		};

		for (const entry of Array.from(this.cache.values())) {
			if (entry.isProcessing) {
				stats.processingEntries++;
			} else {
				stats.completedEntries++;
			}
			stats.totalDuplicates += entry.requestCount - 1;
		}

		return stats;
	}

	/**
	 * Shutdown the deduplication manager
	 */
	shutdown(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}

		this.cache.clear();
		this.log("Request deduplication manager shutdown", "info");
	}

	/**
	 * Centralized logging
	 */
	private log(
		message: string,
		level: "debug" | "info" | "warn" | "error" = "info",
		data?: unknown,
	): void {
		if (!this.config.enableLogging && level === "debug") {
			return;
		}

		// Use enhanced logger with context data
		const context = data ? { requestDedup: data } : undefined;
		this.logger[level](message, context);
	}
}

// Global singleton instance
declare global {
	// eslint-disable-next-line no-var
	var __request_deduplication_manager: RequestDeduplicationManager | undefined;
}

/**
 * Get the singleton deduplication manager
 */
export function getDeduplicationManager(): RequestDeduplicationManager {
	if (!globalThis.__request_deduplication_manager) {
		globalThis.__request_deduplication_manager =
			new RequestDeduplicationManager();
	}
	return globalThis.__request_deduplication_manager;
}

/**
 * Create a deduplication wrapper for HTTP handlers
 */
export function withRequestDeduplication<
	T extends (req: NextRequest) => Promise<NextResponse>,
>(handler: T, _config?: Partial<DeduplicationConfig>): T {
	const manager =
		globalThis.__request_deduplication_manager ||
		new RequestDeduplicationManager(_config);

	return (async (req: NextRequest) => {
		return manager.processRequest(req, handler);
	}) as T;
}

/**
 * Middleware function that can be used in Next.js middleware.ts
 */
export async function requestDeduplicationMiddleware(
	request: NextRequest,
	next: () => Promise<NextResponse>,
): Promise<NextResponse> {
	const manager = getDeduplicationManager();
	return manager.processRequest(request, async () => next());
}

/**
 * Get deduplication statistics for monitoring
 */
export function getDeduplicationStats() {
	const manager = getDeduplicationManager();
	return manager.getStats();
}

/**
 * Cleanup function for graceful shutdown
 */
export function cleanupDeduplication(): void {
	if (globalThis.__request_deduplication_manager) {
		globalThis.__request_deduplication_manager.shutdown();
		globalThis.__request_deduplication_manager = undefined;
	}
}
