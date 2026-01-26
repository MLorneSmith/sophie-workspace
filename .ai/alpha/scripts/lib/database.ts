/**

* Sandbox Database Management Module
*
* Handles database operations for E2B sandboxes including capacity checks,
* schema reset, migrations, and Payload CMS seeding.
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import process from "node:process";
import type { Sandbox } from "@e2b/code-interpreter";

import { WORKSPACE_DIR } from "../config/index.js";
import {
	getAllEnvVars,
	getSupabaseAccessToken,
	validateSupabaseTokensRequired,
} from "./environment.js";
import { emitOrchestratorEvent } from "./event-emitter.js";
import { getProjectRoot, releaseLock, updateLockResetState } from "./lock.js";

// ============================================================================
// Logging Helper
// ============================================================================

/**

* Create a conditional logger that only outputs when UI is disabled.
* When UI is enabled, all console output is suppressed to avoid interfering
* with the Ink-based dashboard.
 */
function createLogger(uiEnabled: boolean) {
	return {
		log: (...args: unknown[]) => {
			if (!uiEnabled) console.log(...args);
		},
		warn: (...args: unknown[]) => {
			if (!uiEnabled) console.warn(...args);
		},
		error: (...args: unknown[]) => {
			// Always log errors, even in UI mode
			console.error(...args);
		},
	};
}

// ============================================================================
// Database Capacity
// ============================================================================

/**

* Check if the sandbox database has sufficient capacity.
* Warns if approaching the 500MB limit.
*
* @returns true if database has capacity or check failed (non-blocking)
 */
export async function checkDatabaseCapacity(
	uiEnabled: boolean = false,
): Promise<boolean> {
	const { log, warn, error } = createLogger(uiEnabled);
	const dbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
	if (!dbUrl) {
		log("   ℹ️ No sandbox database configured, skipping capacity check");
		return true;
	}

	// Emit start event
	emitOrchestratorEvent("db_capacity_check", "Checking database capacity...");

	try {
		const result = execSync(
			`psql "${dbUrl}" -t -c "SELECT pg_database_size('postgres')"`,
			{ encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
		);

		const sizeBytes = parseInt(result.trim(), 10);
		const sizeMB = sizeBytes / (1024 * 1024);
		const limitMB = 500;
		const warningThreshold = 450;

		log(`   📊 Sandbox database size: ${sizeMB.toFixed(1)}MB / ${limitMB}MB`);

		if (sizeMB > warningThreshold) {
			warn(
				`   ⚠️ Database near capacity (${sizeMB.toFixed(1)}MB / ${limitMB}MB)`,
			);

			// Emit warning event
			emitOrchestratorEvent(
				"db_capacity_warning",
				`Database near capacity: ${sizeMB.toFixed(1)}MB / ${limitMB}MB`,
				{ sizeMB, limitMB, warningThreshold },
			);

			if (sizeMB > limitMB * 0.95) {
				error(
					"   ❌ Database at capacity. Reset required before orchestration.",
				);
				return false;
			}
		} else {
			// Emit success event
			emitOrchestratorEvent(
				"db_capacity_ok",
				`Database capacity OK: ${sizeMB.toFixed(1)}MB / ${limitMB}MB`,
				{ sizeMB, limitMB },
			);
		}

		return true;
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);

		// Check for authentication failures - these should fail loudly
		if (
			errorMessage.includes("password authentication failed") ||
			errorMessage.includes("FATAL:") ||
			errorMessage.includes("authentication failed")
		) {
			error(`   ❌ Database connection failed: ${errorMessage}`);
			error("   ⚠️ Check SUPABASE_SANDBOX_DB_URL credentials in .env");
			return false;
		}

		// psql might not be installed locally - that's OK, we'll check in sandbox
		log("   ℹ️ Could not check database size locally (psql not available)");
		return true;
	}
}

// ============================================================================
// Database Reset
// ============================================================================

/**

* Reset the sandbox database by dropping and recreating the public schema.
* Also applies base migrations from the local project.
*
* @throws Error if reset fails
 */
export async function resetSandboxDatabase(
	uiEnabled: boolean = false,
): Promise<void> {
	const { log, warn, error } = createLogger(uiEnabled);
	const dbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
	if (!dbUrl) {
		log("   ℹ️ No sandbox database configured, skipping reset");
		return;
	}

	log("🔄 Resetting sandbox database...");
	emitOrchestratorEvent("db_reset_start", "Resetting sandbox database...");

	// Mark reset in progress
	updateLockResetState(true);

	const resetScript = `
-- Drop auth schema triggers before recreation to prevent "trigger already exists" errors
-- These triggers are created by migrations, so we must drop them before re-running migrations
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Reset public schema (preserves auth, storage managed by Supabase)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
COMMENT ON SCHEMA public IS 'standard public schema';

-- Reset migration history to allow fresh migration push
-- This is critical: without it, supabase db push fails with
-- "Remote migration versions not found in local migrations directory"
-- because the schema_migrations table retains orphan records after schema drop
TRUNCATE supabase_migrations.schema_migrations;
`;

	try {
		// Execute reset via psql
		execSync(`psql "${dbUrl}" -c "${resetScript.replace(/"/g, '\\"')}"`, {
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		});
		log("   ✅ Database schema reset (including migration history)");
		emitOrchestratorEvent(
			"db_reset_complete",
			"Database schema reset complete",
		);

		// Apply base migrations from local project
		const projectRoot = getProjectRoot();
		const webDir = path.join(projectRoot, "apps", "web");

		if (fs.existsSync(path.join(webDir, "supabase", "migrations"))) {
			log("   📦 Applying base migrations...");
			emitOrchestratorEvent(
				"db_migration_start",
				"Applying base migrations...",
			);
			try {
				execSync(`supabase db push --yes --db-url "${dbUrl}"`, {
					cwd: webDir,
					encoding: "utf-8",
					stdio: ["pipe", "pipe", "pipe"],
				});
				log("   ✅ Base migrations applied");
				emitOrchestratorEvent(
					"db_migration_complete",
					"Base migrations applied",
				);

				// Verify tables were created (pattern from /supabase-reset)
				log("   🔍 Verifying database tables...");
				emitOrchestratorEvent("db_verify", "Verifying database tables...");

				const verification = verifyTablesExist(dbUrl, undefined, uiEnabled);
				if (verification.success) {
					emitOrchestratorEvent(
						"db_verify",
						`Verified: ${verification.tableCount} table(s) created`,
						{ tableCount: verification.tableCount },
					);
				} else {
					// Don't block - log warning and continue
					warn(
						`   ⚠️ Table verification warning: found ${verification.tableCount} tables`,
					);
					emitOrchestratorEvent(
						"db_verify",
						`Warning: Only ${verification.tableCount} table(s) found after migrations`,
						{ tableCount: verification.tableCount, success: false },
					);
				}
			} catch (migrationErr) {
				// Verbose error logging instead of silent catch
				const errorMessage =
					migrationErr instanceof Error
						? migrationErr.message
						: String(migrationErr);
				const errorStack =
					migrationErr instanceof Error ? migrationErr.stack : undefined;

				warn(`   ⚠️ Migration push failed: ${errorMessage}`);
				if (errorStack) {
					log(`   Stack trace: ${errorStack}`);
				}

				// Emit error event for UI visibility
				emitOrchestratorEvent(
					"db_migration_complete",
					`Migration warning: ${errorMessage}`,
					{ error: errorMessage, success: false },
				);

				// Check if this is a critical error or just "no migrations"
				if (
					errorMessage.includes("no new migrations") ||
					errorMessage.includes("Already up to date")
				) {
					log("   ℹ️ No new migrations to apply");
				} else {
					warn("   ⚠️ Migration may have failed - continuing anyway");
				}
			}
		}

		// Mark reset complete
		updateLockResetState(false);
	} catch (err) {
		// On failure, release lock entirely so next run can retry
		error(`❌ Database reset failed: ${err}`);
		updateLockResetState(false);
		releaseLock();
		throw err;
	}
}

// ============================================================================
// Database Seeding
// ============================================================================

/**

* Seed the sandbox database with Payload CMS data.
* Runs Payload migrations and seeding via a sandbox instance.
*
* @param sandbox - The sandbox to use for seeding
* @returns true if seeding succeeded
 */
export async function seedSandboxDatabase(
	sandbox: Sandbox,
	uiEnabled: boolean = false,
): Promise<boolean> {
	const { log, warn, error } = createLogger(uiEnabled);
	const dbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
	if (!dbUrl) {
		log("   ℹ️ No sandbox database configured, skipping seeding");
		return true;
	}

	log("🌱 Seeding sandbox database...");

	try {
		// Step 1: Run Payload migrations
		log("   📦 Running Payload migrations...");
		emitOrchestratorEvent(
			"db_migration_start",
			"Running Payload migrations...",
		);
		const migrateResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR}/apps/payload &&` +
				"NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run payload migrate --forceAcceptWarning",
			{
				timeoutMs: 300000, // 5 minutes for migrations
				envs: getAllEnvVars(),
			},
		);

		if (migrateResult.exitCode !== 0) {
			error(`   ❌ Payload migration failed: ${migrateResult.stderr}`);
			return false;
		}
		log("   ✅ Payload migrations complete");
		emitOrchestratorEvent(
			"db_migration_complete",
			"Payload migrations complete",
		);

		// Step 2: Run Payload seeding
		log("   🌱 Running Payload seeding...");
		emitOrchestratorEvent("db_seed_start", "Running Payload seeding...");
		const seedResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR}/apps/payload && ` +
				"NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run seed:run --force",
			{
				timeoutMs: 600000, // 10 minutes for seeding
				envs: getAllEnvVars(),
			},
		);

		if (seedResult.exitCode !== 0) {
			error(`   ❌ Payload seeding failed: ${seedResult.stderr}`);
			return false;
		}
		log("   ✅ Payload seeding complete");
		emitOrchestratorEvent("db_seed_complete", "Payload seeding complete");

		// Step 3: Create Supabase auth users for E2E testing
		log("   👤 Creating Supabase auth test users...");
		emitOrchestratorEvent(
			"db_auth_seed_start",
			"Creating Supabase auth users...",
		);

		try {
			// Get sandbox Supabase credentials for auth user creation
			const sandboxUrl = process.env.SUPABASE_SANDBOX_URL;
			const sandboxServiceKey = process.env.SUPABASE_SANDBOX_SERVICE_ROLE_KEY;

			// Build environment with E2E-specific variables the setup script expects
			const authSeedEnvs: Record<string, string> = {
				...getAllEnvVars(),
				// Setup script looks for E2E_SUPABASE_URL and E2E_SUPABASE_SERVICE_ROLE_KEY
				...(sandboxUrl && { E2E_SUPABASE_URL: sandboxUrl }),
				...(sandboxServiceKey && {
					E2E_SUPABASE_SERVICE_ROLE_KEY: sandboxServiceKey,
				}),
			};

			const authSeedResult = await sandbox.commands.run(
				`cd ${WORKSPACE_DIR} && node apps/e2e/scripts/setup-test-users.js`,
				{
					timeoutMs: 60000, // 1 minute for auth setup
					envs: authSeedEnvs,
				},
			);

			if (authSeedResult.exitCode !== 0) {
				warn(`   ⚠️ Auth user seeding failed: ${authSeedResult.stderr}`);
				emitOrchestratorEvent(
					"db_auth_seed_failed",
					`Auth user seeding failed: ${authSeedResult.stderr}`,
					{ exitCode: authSeedResult.exitCode },
				);
				// Non-blocking - log warning but continue
			} else {
				log("   ✅ Supabase auth users created");
				emitOrchestratorEvent(
					"db_auth_seed_complete",
					"Auth users created successfully",
				);
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			warn(`   ⚠️ Auth seeding error (non-blocking): ${errorMessage}`);
			emitOrchestratorEvent(
				"db_auth_seed_error",
				`Auth seeding error: ${errorMessage}`,
				{ error: errorMessage },
			);
			// Continue anyway - feature can proceed without auth users
		}

		// Step 4: Quick verification
		log("   🔍 Verifying seeded data...");
		const verifyResult = await sandbox.commands.run(
			`psql "${dbUrl}" -t -c "SELECT COUNT(*) FROM payload.users" 2>/dev/null || echo "0"`,
			{ timeoutMs: 30000 },
		);

		const userCount = parseInt(verifyResult.stdout.trim(), 10);
		if (userCount > 0) {
			log(`   ✅ Verified: ${userCount} user(s) seeded`);
			emitOrchestratorEvent(
				"db_verify",
				`Verified: ${userCount} user(s) seeded`,
				{ userCount },
			);
		} else {
			warn(
				"   ⚠️ No users found after seeding (may be normal for some configs)",
			);
		}

		return true;
	} catch (err) {
		// Extract detailed error information from E2B CommandExitError or standard Error
		let errorMessage: string;
		if (err && typeof err === "object" && "stderr" in err) {
			// E2B CommandExitError has stderr property with actual error details
			const stderr = (err as { stderr: string }).stderr;
			const exitCode =
				"exitCode" in err ? (err as { exitCode: number }).exitCode : "unknown";
			errorMessage = `exit code ${exitCode}, stderr: ${stderr}`;
		} else if (err instanceof Error) {
			errorMessage = err.message;
		} else {
			errorMessage = String(err);
		}
		error(`❌ Seeding failed: ${errorMessage}`);
		return false;
	}
}

// ============================================================================
// Migration Sync (Post-Feature)
// ============================================================================

/**

* Sync feature-generated migrations to the remote sandbox database.
* This function is called after each feature completes to push any new
* migrations created by the feature to the remote database.
*
* The key issue this solves: `resetSandboxDatabase()` runs at startup BEFORE
* features create migrations. This function ensures migrations created during
* feature implementation are applied to the remote database.
*
* @param sandbox - The E2B sandbox instance
* @param featureLabel - Human-readable feature label for logging
* @param uiEnabled - Whether UI mode is enabled (suppresses console output)
* @returns true if sync succeeded or was skipped (non-blocking), false on error
 */
export async function syncFeatureMigrations(
	sandbox: Sandbox,
	featureLabel: string,
	uiEnabled: boolean = false,
): Promise<boolean> {
	const { log, warn, error } = createLogger(uiEnabled);

	// Validate Supabase tokens are configured (fail-fast)
	// Migration sync is critical - silent failures cause mysterious downstream errors
	const validation = validateSupabaseTokensRequired();
	if (!validation.isValid) {
		error(`❌ Cannot sync migrations: ${validation.message}`);
		throw new Error(
			`Migration sync failed: ${validation.message}\n` +
				"   Feature migrations cannot be applied without valid Supabase credentials.",
		);
	}

	log(`🔄 Syncing migrations after ${featureLabel}...`);

	try {
		// Step 1: Check if there are any pending migrations in the sandbox
		const migrationCheckResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR}/apps/web && ls -la supabase/migrations/*.sql 2>/dev/null | wc -l`,
			{ timeoutMs: 10000 },
		);

		const migrationCount = parseInt(
			migrationCheckResult.stdout.trim() || "0",
			10,
		);
		if (migrationCount === 0) {
			log("   ℹ️ No migrations found - skipping sync");
			return true;
		}

		log(
			`   📦 Found ${migrationCount} migration file(s), pushing to remote...`,
		);

		// Step 2: Push migrations to remote database using Supabase CLI
		// Note: The sandbox was linked to the project during createSandbox()
		const pushResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR}/apps/web && pnpm exec supabase db push --linked`,
			{
				timeoutMs: 300000, // 5 minutes for complex migrations
				envs: {
					SUPABASE_ACCESS_TOKEN: getSupabaseAccessToken() || "",
				},
			},
		);

		if (pushResult.exitCode !== 0) {
			// Check for specific error types
			const stderr = pushResult.stderr || "";
			const stdout = pushResult.stdout || "";

			if (
				stderr.includes("authentication failed") ||
				stderr.includes("Tenant or user not found")
			) {
				error(`   ❌ Migration sync auth failed: ${stderr}`);
				error(
					"   ⚠️ Check SUPABASE_ACCESS_TOKEN - get from https://supabase.com/dashboard/account/tokens",
				);
				return false;
			}

			if (
				stderr.includes("no new migrations") ||
				stdout.includes("no new migrations")
			) {
				log("   ℹ️ No new migrations to apply");
				return true;
			}

			warn(`   ⚠️ Migration push returned exit code ${pushResult.exitCode}`);
			warn(`   stderr: ${stderr}`);
			// Non-blocking - feature may have succeeded without DB changes
			return true;
		}

		log("   ✅ Migrations synced to remote database");

		// Step 3: Verify migrations were applied by checking table count
		const verifyResult = await sandbox.commands.run(
			`psql "${process.env.SUPABASE_SANDBOX_DB_URL}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>/dev/null || echo "0"`,
			{ timeoutMs: 30000 },
		);

		const tableCount = parseInt(verifyResult.stdout.trim() || "0", 10);
		if (tableCount > 0) {
			log(`   ✅ Verified: ${tableCount} public table(s) in database`);
		} else {
			log("   ℹ️ Could not verify table count (psql may not be available)");
		}

		return true;
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		warn(`⚠️ Migration sync failed (non-blocking): ${errorMessage}`);
		// Non-blocking - allow orchestrator to continue
		return true;
	}
}

// ============================================================================
// Database Verification
// ============================================================================

/**

* Verify that expected tables exist in the database after migrations.
* Used to detect silent migration failures.
*
* @param dbUrl - Database connection URL
* @param tableNames - Optional list of table names to verify. If not provided, checks for any public tables.
* @param uiEnabled - Whether UI mode is enabled
* @returns Object with success status and table count
 */
export function verifyTablesExist(
	dbUrl: string,
	tableNames?: string[],
	uiEnabled: boolean = false,
): { success: boolean; tableCount: number; missingTables?: string[] } {
	const { log, error } = createLogger(uiEnabled);

	try {
		// Query to count tables in public schema
		const query = tableNames
			? `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY(ARRAY[${tableNames.map((t) => `'${t}'`).join(",")}])`
			: `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'`;

		const result = execSync(`psql "${dbUrl}" -t -c "${query}"`, {
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		});

		if (tableNames) {
			// Check which tables were found
			const foundTables = result
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => line.length > 0);
			const missingTables = tableNames.filter((t) => !foundTables.includes(t));
			const success = missingTables.length === 0;

			if (success) {
				log(`   ✅ Verified: ${foundTables.length} table(s) exist`);
			} else {
				error(`   ❌ Missing tables: ${missingTables.join(", ")}`);
			}

			return {
				success,
				tableCount: foundTables.length,
				missingTables: missingTables.length > 0 ? missingTables : undefined,
			};
		}

		// Parse count result
		const tableCount = parseInt(result.trim(), 10);
		const success = tableCount > 0;

		if (success) {
			log(`   ✅ Verified: ${tableCount} public table(s) exist`);
		} else {
			error("   ❌ No public tables found after migrations");
		}

		return { success, tableCount };
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		error(`❌ Table verification failed: ${errorMessage}`);
		return { success: false, tableCount: 0 };
	}
}

/**

* Verify that seed data exists in the database after seeding.
* Checks the payload.users table for at least one user.
*
* @param dbUrl - Database connection URL
* @param uiEnabled - Whether UI mode is enabled
* @returns Object with success status and user count
 */
export function verifySeededData(
	dbUrl: string,
	uiEnabled: boolean = false,
): { success: boolean; userCount: number } {
	const { log, warn, error } = createLogger(uiEnabled);

	try {
		const result = execSync(
			`psql "${dbUrl}" -t -c "SELECT COUNT(*) FROM payload.users" 2>/dev/null || echo "0"`,
			{ encoding: "utf-8" },
		);

		const userCount = parseInt(result.trim(), 10);
		const success = userCount > 0;

		if (success) {
			log(`   ✅ Verified: ${userCount} user(s) seeded`);
		} else {
			warn(
				"   ⚠️ No users found after seeding (may be normal for some configs)",
			);
		}

		return { success, userCount };
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		error(`❌ Seed verification failed: ${errorMessage}`);
		return { success: false, userCount: 0 };
	}
}

// ============================================================================
// Database Status
// ============================================================================

/**

* Check if the sandbox database appears to be seeded.
* Quick check to avoid re-seeding on resume.
* Checks BOTH payload.users AND auth.users to ensure complete seeding.
*
* @returns true if database appears to be fully seeded (both tables have data)
 */
export async function isDatabaseSeeded(
	uiEnabled: boolean = false,
): Promise<boolean> {
	const { log, warn } = createLogger(uiEnabled);
	const dbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
	if (!dbUrl) {
		return false;
	}

	try {
		// Check both payload.users AND auth.users tables have data
		// Warm start optimization requires BOTH to be seeded
		const result = execSync(
			`psql "${dbUrl}" -t -c "SELECT (SELECT COUNT(*) FROM payload.users) AS payload_count, (SELECT COUNT(*) FROM auth.users) AS auth_count" 2>/dev/null || echo "0|0"`,
			{ encoding: "utf-8" },
		);

		// Parse result: "payload_count | auth_count" format
		const parts = result
			.trim()
			.split("|")
			.map((s) => parseInt(s.trim(), 10));
		const payloadCount = parts[0] || 0;
		const authCount = parts[1] || 0;

		const isFullySeeded = payloadCount > 0 && authCount > 0;

		if (isFullySeeded) {
			log(
				`   ℹ️ Database fully seeded (${payloadCount} payload user(s), ${authCount} auth user(s))`,
			);
		} else if (payloadCount > 0 && authCount === 0) {
			log(
				`   ℹ️ Partial seed detected: ${payloadCount} payload user(s), 0 auth users - will re-seed`,
			);
		}

		return isFullySeeded;
	} catch (err) {
		// Verbose error logging instead of silent catch
		const errorMessage = err instanceof Error ? err.message : String(err);
		warn(`⚠️ Could not check if database is seeded: ${errorMessage}`);
		return false;
	}
}
