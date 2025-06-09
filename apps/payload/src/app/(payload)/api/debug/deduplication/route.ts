/**
 * Debug endpoint for monitoring request deduplication status
 *
 * This endpoint provides real-time information about:
 * - Current deduplication cache status
 * - API performance metrics
 * - Recent errors and debugging information
 *
 * Access: GET /api/debug/deduplication
 */

import { createEnvironmentLogger } from "@kit/shared/logger";
import { type NextRequest, NextResponse } from "next/server";
import {
	clearAPIErrorLog,
	getAPIMetrics,
	getRecentAPIErrors,
} from "../../../../../lib/enhanced-api-wrapper";
import {
	getDeduplicationManager,
	getDeduplicationStats,
} from "../../../../../lib/request-deduplication";

// Type for error objects with timestamp
interface ErrorWithTimestamp {
	timestamp: string;
	[key: string]: unknown;
}

// Type for deduplication manager with cache access
interface DeduplicationManagerWithCache {
	cache?: {
		clear(): void;
	};
}

const logger = createEnvironmentLogger("DEBUG-API");

// Only allow debug endpoints in non-production environments
const isProduction = process.env.NODE_ENV === "production";

export async function GET(request: NextRequest) {
	// Block access in production unless explicitly enabled
	if (isProduction && process.env.ENABLE_DEBUG_ENDPOINTS !== "true") {
		logger.warn("Attempted to access debug endpoint in production");
		return NextResponse.json(
			{ error: "Debug endpoints are disabled in production" },
			{ status: 403 },
		);
	}

	try {
		const url = new URL(request.url);
		const action = url.searchParams.get("action");

		// Handle specific actions
		if (action === "clear-errors") {
			clearAPIErrorLog();
			return NextResponse.json({
				success: true,
				message: "Error log cleared",
			});
		}

		// Get all debugging information
		const deduplicationStats = getDeduplicationStats();
		const apiMetrics = getAPIMetrics();
		const recentErrors = getRecentAPIErrors(20);

		const debugInfo = {
			timestamp: new Date().toISOString(),
			environment: process.env.NODE_ENV,

			// Request deduplication statistics
			deduplication: {
				...deduplicationStats,
				cacheSize: deduplicationStats.totalEntries,
				status: deduplicationStats.totalEntries > 0 ? "active" : "idle",
			},

			// API performance metrics
			api: {
				...apiMetrics,
				uptime: Date.now() - new Date(apiMetrics.lastRequestTime).getTime(),
				errorRate:
					apiMetrics.totalRequests > 0
						? `${(
								(apiMetrics.failedRequests / apiMetrics.totalRequests) * 100
							).toFixed(2)}%`
						: "0%",
			},

			// Recent errors for debugging
			recentErrors: recentErrors.map((error: ErrorWithTimestamp) => ({
				...error,
				timeSince: Date.now() - new Date(error.timestamp).getTime(),
			})),

			// Configuration status
			config: {
				enableLogging:
					process.env.NODE_ENV === "development" ||
					process.env.ENABLE_REQUEST_DEDUP_LOGGING === "true",
				logLevel: process.env.API_LOG_LEVEL || "info",
				nodeEnv: process.env.NODE_ENV,
			},

			// Health status
			health: {
				status: "healthy",
				checks: {
					deduplicationManager: "active",
					apiWrapper: "active",
					database: "unknown", // Could be enhanced with actual DB health check
				},
			},
		};

		// Add headers for debugging
		const response = NextResponse.json(debugInfo, {
			status: 200,
			headers: {
				"Cache-Control": "no-store, no-cache, must-revalidate",
				"X-Debug-Timestamp": new Date().toISOString(),
			},
		});

		return response;
	} catch (error) {
		logger.error("Error in debug endpoint", { error });
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { action } = body;

		switch (action) {
			case "clear-cache": {
				const manager = getDeduplicationManager();
				// Force cleanup by accessing the cache through proper typing
				(manager as DeduplicationManagerWithCache).cache?.clear();
				return NextResponse.json({
					success: true,
					message: "Deduplication cache cleared",
				});
			}

			case "clear-errors":
				clearAPIErrorLog();
				return NextResponse.json({
					success: true,
					message: "Error log cleared",
				});

			default:
				return NextResponse.json(
					{
						error: "Invalid action",
						availableActions: ["clear-cache", "clear-errors"],
					},
					{ status: 400 },
				);
		}
	} catch (error) {
		console.error("[DEBUG-ENDPOINT] Error processing debug action:", error);

		return NextResponse.json(
			{
				error: "Debug action error",
				message: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}
