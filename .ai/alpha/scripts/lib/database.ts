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
import { getAllEnvVars } from "./environment.js";
import { getProjectRoot, releaseLock, updateLockResetState } from "./lock.js";

// ============================================================================
// Database Capacity
// ============================================================================

/**

* Check if the sandbox database has sufficient capacity.
* Warns if approaching the 500MB limit.
*
* @returns true if database has capacity or check failed (non-blocking)
 */
export async function checkDatabaseCapacity(): Promise<boolean> {
	const dbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
	if (!dbUrl) {
		console.log("   ℹ️ No sandbox database configured, skipping capacity check");
		return true;
	}

	try {
		const result = execSync(
			`psql "${dbUrl}" -t -c "SELECT pg_database_size('postgres')"`,
			{ encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
		);

		const sizeBytes = parseInt(result.trim(), 10);
		const sizeMB = sizeBytes / (1024 * 1024);
		const limitMB = 500;
		const warningThreshold = 450;

		console.log(
			`   📊 Sandbox database size: ${sizeMB.toFixed(1)}MB / ${limitMB}MB`,
		);

		if (sizeMB > warningThreshold) {
			console.warn(
				`   ⚠️ Database near capacity (${sizeMB.toFixed(1)}MB / ${limitMB}MB)`,
			);

			if (sizeMB > limitMB * 0.95) {
				console.error(
					"   ❌ Database at capacity. Reset required before orchestration.",
				);
				return false;
			}
		}

		return true;
	} catch {
		// psql might not be installed locally - that's OK, we'll check in sandbox
		console.log(
			"   ℹ️ Could not check database size locally (psql not available)",
		);
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
export async function resetSandboxDatabase(): Promise<void> {
	const dbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
	if (!dbUrl) {
		console.log("   ℹ️ No sandbox database configured, skipping reset");
		return;
	}

	console.log("🔄 Resetting sandbox database...");

	// Mark reset in progress
	updateLockResetState(true);

	const resetScript = `
-- Reset public schema (preserves auth, storage managed by Supabase)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
COMMENT ON SCHEMA public IS 'standard public schema';
`;

	try {
		// Execute reset via psql
		execSync(`psql "${dbUrl}" -c "${resetScript.replace(/"/g, '\\"')}"`, {
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		});
		console.log("   ✅ Database schema reset");

		// Apply base migrations from local project
		const projectRoot = getProjectRoot();
		const webDir = path.join(projectRoot, "apps", "web");

		if (fs.existsSync(path.join(webDir, "supabase", "migrations"))) {
			console.log("   📦 Applying base migrations...");
			try {
				execSync(`supabase db push --db-url "${dbUrl}"`, {
					cwd: webDir,
					encoding: "utf-8",
					stdio: ["pipe", "pipe", "pipe"],
				});
				console.log("   ✅ Base migrations applied");
			} catch {
				console.warn("   ⚠️ Migration push failed (may be OK if no migrations)");
			}
		}

		// Mark reset complete
		updateLockResetState(false);
	} catch (error) {
		// On failure, release lock entirely so next run can retry
		console.error(`❌ Database reset failed: ${error}`);
		updateLockResetState(false);
		releaseLock();
		throw error;
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
export async function seedSandboxDatabase(sandbox: Sandbox): Promise<boolean> {
	const dbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
	if (!dbUrl) {
		console.log("   ℹ️ No sandbox database configured, skipping seeding");
		return true;
	}

	console.log("🌱 Seeding sandbox database...");

	try {
		// Step 1: Run Payload migrations
		console.log("   📦 Running Payload migrations...");
		const migrateResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR}/apps/payload &&` +
				"NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run payload migrate --forceAcceptWarning",
			{
				timeoutMs: 300000, // 5 minutes for migrations
				envs: getAllEnvVars(),
			},
		);

		if (migrateResult.exitCode !== 0) {
			console.error(`   ❌ Payload migration failed: ${migrateResult.stderr}`);
			return false;
		}
		console.log("   ✅ Payload migrations complete");

		// Step 2: Run Payload seeding
		console.log("   🌱 Running Payload seeding...");
		const seedResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR}/apps/payload && ` +
				"NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run seed:run --force",
			{
				timeoutMs: 600000, // 10 minutes for seeding
				envs: getAllEnvVars(),
			},
		);

		if (seedResult.exitCode !== 0) {
			console.error(`   ❌ Payload seeding failed: ${seedResult.stderr}`);
			return false;
		}
		console.log("   ✅ Payload seeding complete");

		// Step 3: Quick verification
		console.log("   🔍 Verifying seeded data...");
		const verifyResult = await sandbox.commands.run(
			`psql "${dbUrl}" -t -c "SELECT COUNT(*) FROM payload.users" 2>/dev/null || echo "0"`,
			{ timeoutMs: 30000 },
		);

		const userCount = parseInt(verifyResult.stdout.trim(), 10);
		if (userCount > 0) {
			console.log(`   ✅ Verified: ${userCount} user(s) seeded`);
		} else {
			console.warn(
				"   ⚠️ No users found after seeding (may be normal for some configs)",
			);
		}

		return true;
	} catch (error) {
		console.error(`❌ Seeding failed: ${error}`);
		return false;
	}
}

// ============================================================================
// Database Status
// ============================================================================

/**

* Check if the sandbox database appears to be seeded.
* Quick check to avoid re-seeding on resume.
*
* @returns true if database appears to be seeded
 */
export async function isDatabaseSeeded(): Promise<boolean> {
	const dbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
	if (!dbUrl) {
		return false;
	}

	try {
		// Check if payload.users table exists and has data
		const result = execSync(
			`psql "${dbUrl}" -t -c "SELECT COUNT(*) FROM payload.users" 2>/dev/null || echo "0"`,
			{ encoding: "utf-8" },
		);
		const count = parseInt(result.trim(), 10);
		return count > 0;
	} catch {
		return false;
	}
}
