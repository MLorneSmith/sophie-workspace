import "server-only";

import { getLogger } from "@kit/shared/logger";
import type { Database } from "@kit/supabase/database";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

import { createAdminDashboardService } from "../services/admin-dashboard.service";

/**
 * Default fallback data for when the dashboard cannot be loaded
 * Provides safe defaults that won't break the UI
 */
const DASHBOARD_FALLBACK = {
	subscriptions: 0,
	trials: 0,
	accounts: 0,
	teamAccounts: 0,
} as const;

/**
 * Configuration for retry behavior
 */
const RETRY_CONFIG = {
	maxAttempts: 2,
	baseDelay: 1000, // 1 second
} as const;

/**
 * Admin dashboard loader error
 */
export class AdminDashboardLoaderError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown,
		public readonly code: string = "DASHBOARD_LOAD_FAILED",
	) {
		super(message);
		this.name = "AdminDashboardLoaderError";
	}
}

/**
 * @name loadAdminDashboard
 * @description Load the admin dashboard data with error boundaries and graceful fallbacks.
 *
 * This loader implements:
 * - Error boundaries with structured logging
 * - Graceful degradation with safe fallback data
 * - Retry logic for transient failures
 * - Dependency injection support for testing
 * - React cache() for performance
 *
 * @param options - Optional configuration for dependency injection
 */
export const loadAdminDashboard = cache(adminDashboardLoader);

/**
 * Injectable dependencies for testing
 */
export interface AdminDashboardLoaderDeps {
	client?: SupabaseClient<Database>;
	logger?: Awaited<ReturnType<typeof getLogger>>;
	createService?: typeof createAdminDashboardService;
}

async function adminDashboardLoader(deps?: AdminDashboardLoaderDeps) {
	const logger = deps?.logger ?? (await getLogger());
	const ctx = {
		name: "admin-dashboard-loader",
		operation: "load_dashboard_data",
	};

	try {
		logger.info(ctx, "Loading admin dashboard data");

		const client = deps?.client ?? getSupabaseServerClient();
		const createService = deps?.createService ?? createAdminDashboardService;
		const service = createService(client);

		// Attempt to load data with retry logic for transient failures
		const data = await withRetry(
			() => service.getDashboardData(),
			RETRY_CONFIG,
			logger,
			ctx,
		);

		logger.info({ ...ctx, data }, "Admin dashboard data loaded successfully");
		return data;
	} catch (error) {
		// Log the error with full context
		logger.error(
			{ ...ctx, error },
			"Failed to load admin dashboard data, returning fallback",
		);

		// For admin dashboards, we want to surface errors rather than silently failing
		// But provide fallback data to prevent UI crashes
		const loaderError = new AdminDashboardLoaderError(
			"Failed to load admin dashboard data",
			error,
			error instanceof Error ? "SERVICE_ERROR" : "UNKNOWN_ERROR",
		);

		// In development, throw the error to help with debugging
		if (process.env.NODE_ENV === "development") {
			throw loaderError;
		}

		// In production, log and return fallback data
		logger.warn(
			{ ...ctx, fallback: DASHBOARD_FALLBACK },
			"Returning fallback dashboard data",
		);

		return DASHBOARD_FALLBACK;
	}
}

/**
 * Retry utility with exponential backoff for transient failures
 */
async function withRetry<T>(
	operation: () => Promise<T>,
	config: typeof RETRY_CONFIG,
	logger: Awaited<ReturnType<typeof getLogger>>,
	ctx: Record<string, unknown>,
): Promise<T> {
	let lastError: unknown;

	for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;

			if (attempt === config.maxAttempts) {
				// Don't retry on final attempt
				break;
			}

			// Only retry on potentially transient errors
			if (isRetryableError(error)) {
				const delay = config.baseDelay * 2 ** (attempt - 1);

				logger.warn(
					{ ...ctx, attempt, delay, error },
					`Dashboard load attempt ${attempt} failed, retrying in ${delay}ms`,
				);

				await new Promise((resolve) => setTimeout(resolve, delay));
			} else {
				// Don't retry on permanent errors (auth, permissions, etc.)
				break;
			}
		}
	}

	throw lastError;
}

/**
 * Determine if an error is worth retrying
 */
function isRetryableError(error: unknown): boolean {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();

		// Network/connection issues are retryable
		if (
			message.includes("network") ||
			message.includes("timeout") ||
			message.includes("connection")
		) {
			return true;
		}

		// Database temporary issues
		if (
			message.includes("temporary") ||
			message.includes("busy") ||
			message.includes("lock")
		) {
			return true;
		}
	}

	return false;
}

/**
 * Create a testable version of the loader with dependency injection
 * @example
 * ```typescript
 * const mockService = jest.fn().mockResolvedValue(mockData);
 * const data = await createTestableAdminDashboardLoader({
 *   createService: () => ({ getDashboardData: mockService })
 * })();
 * ```
 */
export function createTestableAdminDashboardLoader(
	deps: AdminDashboardLoaderDeps,
) {
	return () => adminDashboardLoader(deps);
}
