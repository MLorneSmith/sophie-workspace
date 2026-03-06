/**
 * PHASE 1 FIX: Server Health Check Utilities
 * Provides health check functions for Supabase, Next.js, and Payload servers.
 * Used to verify infrastructure health before running E2E tests.
 *
 * See: Issue #992 - E2E Test Infrastructure Systemic Architecture Problems
 */

export interface HealthCheckResult {
	healthy: boolean;
	message: string;
	responseTime?: number;
	statusCode?: number;
}

const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds per check

/**
 * Check if Supabase is healthy by hitting the health endpoint
 * Uses the auth endpoint which is always available
 */
export async function checkSupabaseHealth(): Promise<HealthCheckResult> {
	const supabaseUrl =
		process.env.E2E_SUPABASE_URL ||
		process.env.NEXT_PUBLIC_SUPABASE_URL ||
		"http://localhost:54321";

	try {
		const startTime = Date.now();
		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort(),
			HEALTH_CHECK_TIMEOUT,
		);

		// Check the auth health endpoint (/rest/v1/ root removed by Supabase April 2026)
		const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
			method: "GET",
			signal: controller.signal,
		});

		clearTimeout(timeoutId);
		const responseTime = Date.now() - startTime;

		if (response.ok || response.status === 401) {
			// 401 is expected without proper auth, but means server is up
			return {
				healthy: true,
				message: `Supabase healthy (${responseTime}ms)`,
				responseTime,
				statusCode: response.status,
			};
		}

		return {
			healthy: false,
			message: `Supabase returned status ${response.status}`,
			responseTime,
			statusCode: response.status,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		return {
			healthy: false,
			message: `Supabase unreachable: ${errorMessage}`,
		};
	}
}

/**
 * Check if the Next.js application is healthy
 * Attempts to load the main page and verify a 2xx/3xx response
 */
export async function checkNextJsHealth(): Promise<HealthCheckResult> {
	const baseUrl =
		process.env.PLAYWRIGHT_BASE_URL ||
		process.env.TEST_BASE_URL ||
		process.env.BASE_URL ||
		"http://localhost:3001";

	try {
		const startTime = Date.now();
		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort(),
			HEALTH_CHECK_TIMEOUT,
		);

		// Conditionally include Vercel bypass header for CI environments
		const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
		const headers: HeadersInit = bypassSecret
			? { "x-vercel-protection-bypass": bypassSecret }
			: {};

		const response = await fetch(baseUrl, {
			method: "HEAD",
			signal: controller.signal,
			redirect: "manual", // Don't follow redirects, just check server response
			headers,
		});

		clearTimeout(timeoutId);
		const responseTime = Date.now() - startTime;

		// 2xx = OK, 3xx = redirect (still means server is up)
		if (response.status >= 200 && response.status < 400) {
			return {
				healthy: true,
				message: `Next.js healthy (${responseTime}ms)`,
				responseTime,
				statusCode: response.status,
			};
		}

		return {
			healthy: false,
			message: `Next.js returned status ${response.status}`,
			responseTime,
			statusCode: response.status,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		return {
			healthy: false,
			message: `Next.js unreachable: ${errorMessage}`,
		};
	}
}

/**
 * Check if Payload CMS is healthy
 * Attempts to load the admin panel and verify response
 */
export async function checkPayloadHealth(): Promise<HealthCheckResult> {
	const payloadUrl =
		process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3021";

	try {
		const startTime = Date.now();
		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort(),
			HEALTH_CHECK_TIMEOUT,
		);

		// Conditionally include Vercel bypass header for CI environments
		// Falls back to main secret if Payload-specific secret is not set
		const bypassSecret =
			process.env.VERCEL_AUTOMATION_BYPASS_SECRET_PAYLOAD ||
			process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
		const headers: HeadersInit = bypassSecret
			? { "x-vercel-protection-bypass": bypassSecret }
			: {};

		// Check the API endpoint
		const response = await fetch(`${payloadUrl}/api/access`, {
			method: "GET",
			signal: controller.signal,
			headers,
		});

		clearTimeout(timeoutId);
		const responseTime = Date.now() - startTime;

		// Any response (even 401) means server is running
		if (response.status < 500) {
			return {
				healthy: true,
				message: `Payload healthy (${responseTime}ms)`,
				responseTime,
				statusCode: response.status,
			};
		}

		return {
			healthy: false,
			message: `Payload returned status ${response.status}`,
			responseTime,
			statusCode: response.status,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		return {
			healthy: false,
			message: `Payload unreachable: ${errorMessage}`,
		};
	}
}

/**
 * Run all health checks and return combined result
 */
export async function runAllHealthChecks(): Promise<{
	allHealthy: boolean;
	results: {
		supabase: HealthCheckResult;
		nextjs: HealthCheckResult;
		payload: HealthCheckResult;
	};
}> {
	const [supabase, nextjs, payload] = await Promise.all([
		checkSupabaseHealth(),
		checkNextJsHealth(),
		checkPayloadHealth(),
	]);

	// For E2E tests, Supabase and Next.js are required, Payload is optional
	const allHealthy = supabase.healthy && nextjs.healthy;

	return {
		allHealthy,
		results: {
			supabase,
			nextjs,
			payload,
		},
	};
}

/**
 * Log health check results in a formatted way
 */
export function logHealthCheckResults(results: {
	supabase: HealthCheckResult;
	nextjs: HealthCheckResult;
	payload: HealthCheckResult;
}): void {
	console.log("\n📋 Server Health Check Results:");
	console.log(
		`  ${results.supabase.healthy ? "✅" : "❌"} Supabase: ${results.supabase.message}`,
	);
	console.log(
		`  ${results.nextjs.healthy ? "✅" : "❌"} Next.js: ${results.nextjs.message}`,
	);
	console.log(
		`  ${results.payload.healthy ? "✅" : "⚠️"} Payload: ${results.payload.message}`,
	);
	console.log("");
}
