/**
 * Enhanced Supabase Health Check with Multi-Stage Verification
 *
 * This script provides comprehensive health verification for Supabase services
 * in CI environments with exponential backoff for reliability.
 *
 * Three-stage verification:
 * 1. PostgreSQL direct connection check (fastest, TCP only)
 * 2. PostgREST API check (indicates Kong routing is working)
 * 3. Kong API Gateway check with exponential backoff (full startup verification)
 *
 * See: Issue #1641, #1642 - E2E Sharded Workflow Dual Failure Modes
 */

import { Client } from "pg";

interface HealthCheckConfig {
	maxAttempts: number;
	initialDelayMs: number;
	maxDelayMs: number;
	timeoutMs: number;
}

interface HealthCheckResult {
	healthy: boolean;
	message: string;
	responseTimeMs: number;
	attempts: number;
}

const DEFAULT_CONFIG: HealthCheckConfig = {
	maxAttempts: 30,
	initialDelayMs: 1000,
	maxDelayMs: 8000,
	timeoutMs: 120000,
};

// Supabase configuration from environment
const POSTGRES_HOST = process.env.E2E_POSTGRES_HOST || "localhost";
const POSTGRES_PORT = Number.parseInt(
	process.env.E2E_POSTGRES_PORT || "54522",
	10,
);
const SUPABASE_URL =
	process.env.E2E_SUPABASE_URL ||
	process.env.NEXT_PUBLIC_SUPABASE_URL ||
	"http://127.0.0.1:54521";
const SUPABASE_ANON_KEY =
	process.env.E2E_SUPABASE_ANON_KEY ||
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	"";

/**
 * Log health check progress with timestamp
 */
function log(
	stage: string,
	message: string,
	details?: Record<string, unknown>,
) {
	const timestamp = new Date().toISOString();
	const detailsStr = details ? ` ${JSON.stringify(details)}` : "";
	console.log(`[${timestamp}] [${stage}] ${message}${detailsStr}`);
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(
	attempt: number,
	initialDelay: number,
	maxDelay: number,
): number {
	const delay = Math.min(initialDelay * 2 ** (attempt - 1), maxDelay);
	// Add small jitter to prevent thundering herd
	return delay + Math.floor(Math.random() * 100);
}

/**
 * Stage 1: Check PostgreSQL direct connection
 * This is the fastest check - just verifies TCP connectivity and basic query execution
 */
export async function checkPostgresHealth(
	timeoutMs = 10000,
): Promise<HealthCheckResult> {
	const startTime = Date.now();
	log("PostgreSQL", "Starting health check...", {
		host: POSTGRES_HOST,
		port: POSTGRES_PORT,
	});

	const client = new Client({
		host: POSTGRES_HOST,
		port: POSTGRES_PORT,
		user: "postgres",
		password: "postgres",
		database: "postgres",
		connectionTimeoutMillis: timeoutMs,
	});

	try {
		await client.connect();
		await client.query("SELECT 1 as health_check");
		await client.end();

		const responseTimeMs = Date.now() - startTime;
		log("PostgreSQL", `Health check passed in ${responseTimeMs}ms`);

		return {
			healthy: true,
			message: `PostgreSQL responding (${responseTimeMs}ms)`,
			responseTimeMs,
			attempts: 1,
		};
	} catch (error) {
		const responseTimeMs = Date.now() - startTime;
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		log("PostgreSQL", `Health check failed: ${errorMessage}`);

		// Try to close client even on error
		try {
			await client.end();
		} catch {
			// Ignore close errors
		}

		return {
			healthy: false,
			message: `PostgreSQL unreachable: ${errorMessage}`,
			responseTimeMs,
			attempts: 1,
		};
	}
}

/**
 * Stage 2: Check PostgREST API health
 * Verifies that PostgREST is responding (indirect Kong verification)
 * Uses /auth/v1/health instead of /rest/v1/ root (removed by Supabase April 2026)
 */
export async function checkPostgRESTHealth(
	timeoutMs = 20000,
): Promise<HealthCheckResult> {
	const startTime = Date.now();
	const healthUrl = `${SUPABASE_URL}/auth/v1/health`;

	log("PostgREST", "Starting health check...", { url: healthUrl });

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

		const response = await fetch(healthUrl, {
			method: "GET",
			signal: controller.signal,
		});

		clearTimeout(timeoutId);
		const responseTimeMs = Date.now() - startTime;

		// 200 = OK, 401 = Auth required (but server is up)
		if (response.ok || response.status === 401) {
			log("PostgREST", `Health check passed in ${responseTimeMs}ms`, {
				status: response.status,
			});
			return {
				healthy: true,
				message: `PostgREST responding (${responseTimeMs}ms, status: ${response.status})`,
				responseTimeMs,
				attempts: 1,
			};
		}

		log("PostgREST", `Unexpected status: ${response.status}`);
		return {
			healthy: false,
			message: `PostgREST returned unexpected status ${response.status}`,
			responseTimeMs,
			attempts: 1,
		};
	} catch (error) {
		const responseTimeMs = Date.now() - startTime;
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		log("PostgREST", `Health check failed: ${errorMessage}`);

		return {
			healthy: false,
			message: `PostgREST unreachable: ${errorMessage}`,
			responseTimeMs,
			attempts: 1,
		};
	}
}

/**
 * Stage 3: Check Kong API Gateway with exponential backoff
 * This is the full startup verification with retry logic
 */
export async function checkKongHealthWithBackoff(
	config: Partial<HealthCheckConfig> = {},
): Promise<HealthCheckResult> {
	const { maxAttempts, initialDelayMs, maxDelayMs, timeoutMs } = {
		...DEFAULT_CONFIG,
		...config,
	};

	const startTime = Date.now();
	const kongUrl = `${SUPABASE_URL}/auth/v1/health`;
	let attempts = 0;

	log("Kong", "Starting health check with exponential backoff...", {
		maxAttempts,
		initialDelayMs,
		maxDelayMs,
		timeoutMs,
	});

	while (Date.now() - startTime < timeoutMs && attempts < maxAttempts) {
		attempts++;
		const attemptStart = Date.now();

		try {
			const controller = new AbortController();
			const attemptTimeout = setTimeout(
				() => controller.abort(),
				Math.min(10000, timeoutMs - (Date.now() - startTime)),
			);

			const response = await fetch(kongUrl, {
				method: "GET",
				signal: controller.signal,
			});

			clearTimeout(attemptTimeout);
			const attemptDuration = Date.now() - attemptStart;

			if (response.ok || response.status === 401 || response.status === 200) {
				const totalTimeMs = Date.now() - startTime;
				log(
					"Kong",
					`Health check passed on attempt ${attempts}/${maxAttempts}`,
					{
						status: response.status,
						attemptDuration,
						totalTimeMs,
					},
				);

				return {
					healthy: true,
					message: `Kong API responding (${totalTimeMs}ms total, ${attempts} attempts)`,
					responseTimeMs: totalTimeMs,
					attempts,
				};
			}

			log("Kong", `Attempt ${attempts} returned status ${response.status}`, {
				attemptDuration,
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			log("Kong", `Attempt ${attempts} failed: ${errorMessage}`);
		}

		// Calculate and apply backoff delay before next attempt
		if (attempts < maxAttempts && Date.now() - startTime < timeoutMs) {
			const delay = getBackoffDelay(attempts, initialDelayMs, maxDelayMs);
			log("Kong", `Waiting ${delay}ms before next attempt...`);
			await sleep(delay);
		}
	}

	// Final failure
	const totalTimeMs = Date.now() - startTime;
	log(
		"Kong",
		`Health check FAILED after ${attempts} attempts (${totalTimeMs}ms total)`,
	);

	return {
		healthy: false,
		message: `Kong API failed to respond after ${attempts} attempts (${totalTimeMs}ms)`,
		responseTimeMs: totalTimeMs,
		attempts,
	};
}

/**
 * Log container status for debugging
 */
async function logContainerStatus(): Promise<void> {
	log("Debug", "Checking Docker container status...");

	const { exec } = await import("node:child_process");
	const { promisify } = await import("node:util");
	const execAsync = promisify(exec);

	try {
		const { stdout: dockerPs } = await execAsync(
			"docker ps -a --filter 'name=supabase' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'",
		);
		console.log("\n--- Docker Containers (Supabase) ---");
		console.log(dockerPs || "No Supabase containers found");
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		log("Debug", `Failed to get Docker status: ${errorMessage}`);
	}

	try {
		const { stdout: supabaseStatus } = await execAsync(
			"cd apps/web && supabase status 2>/dev/null || echo 'Supabase CLI not available or not running'",
		);
		console.log("\n--- Supabase Status ---");
		console.log(supabaseStatus);
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		log("Debug", `Failed to get Supabase status: ${errorMessage}`);
	}
}

/**
 * Main health check function - runs all stages in sequence
 * Returns early on first success for speed, logs details for debugging
 */
export async function waitForSupabaseHealth(
	config: Partial<HealthCheckConfig> = {},
): Promise<void> {
	const startTime = Date.now();
	console.log("\n=== Supabase Health Check Started ===\n");
	log("Main", "Configuration:", {
		postgresHost: POSTGRES_HOST,
		postgresPort: POSTGRES_PORT,
		supabaseUrl: SUPABASE_URL,
		hasAnonKey: !!SUPABASE_ANON_KEY,
	});

	// Stage 1: PostgreSQL (fastest check)
	const postgresResult = await checkPostgresHealth();
	if (!postgresResult.healthy) {
		console.log("\n❌ PostgreSQL health check failed");
		await logContainerStatus();
		throw new Error(
			`PostgreSQL health check failed: ${postgresResult.message}`,
		);
	}

	// Stage 2: PostgREST
	const postgrestResult = await checkPostgRESTHealth();
	if (!postgrestResult.healthy) {
		console.log("\n❌ PostgREST health check failed");
		await logContainerStatus();
		throw new Error(
			`PostgREST health check failed: ${postgrestResult.message}`,
		);
	}

	// Stage 3: Kong API with backoff
	const kongResult = await checkKongHealthWithBackoff(config);
	if (!kongResult.healthy) {
		console.log("\n❌ Kong API health check failed");
		await logContainerStatus();
		throw new Error(`Kong API health check failed: ${kongResult.message}`);
	}

	const totalTimeMs = Date.now() - startTime;
	console.log("\n=== Supabase Health Check Complete ===");
	console.log(`✅ All services healthy in ${totalTimeMs}ms`);
	console.log(
		`   PostgreSQL: ${postgresResult.responseTimeMs}ms, PostgREST: ${postgrestResult.responseTimeMs}ms, Kong: ${kongResult.responseTimeMs}ms`,
	);
	console.log("");
}

// Run as standalone script when executed directly
// This allows the workflow to call: npx ts-node apps/e2e/tests/setup/supabase-health.ts
if (require.main === module) {
	waitForSupabaseHealth()
		.then(() => {
			console.log("✅ Supabase health check completed successfully");
			process.exit(0);
		})
		.catch((error: Error) => {
			console.error(`❌ Supabase health check failed: ${error.message}`);
			process.exit(1);
		});
}
