import { execSync } from "node:child_process";
import path from "node:path";

/**
 * Clean up test data before running E2E tests
 * This ensures a clean state and prevents test conflicts
 */
export async function cleanupTestData(): Promise<void> {
	const cleanupSqlPath = path.join(
		__dirname,
		"../../scripts/cleanup-test-data.sql",
	);

	try {
		// Execute cleanup SQL using psql through Supabase
		// Use the Web database instance on port 54322
		const command = `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f ${cleanupSqlPath} 2>&1 || true`;

		// Try using npx supabase db execute if psql is not available
		const supabaseCommand =
			"cd apps/e2e && npx supabase db execute -f scripts/cleanup-test-data.sql 2>&1 || true";

		try {
			// Try psql first
			execSync(command, { stdio: "pipe" });
			console.log("✅ Test data cleaned up using psql");
		} catch {
			// Fall back to Supabase CLI
			try {
				execSync(supabaseCommand, { stdio: "pipe", cwd: process.cwd() });
				console.log("✅ Test data cleaned up using Supabase CLI");
			} catch (error) {
				console.warn("⚠️ Could not clean up test data:", error);
			}
		}
	} catch (error) {
		console.warn("⚠️ Test data cleanup failed:", error);
		// Don't throw - allow tests to continue even if cleanup fails
	}
}

/**
 * Clean up test users by email pattern
 */
export async function cleanupTestUsers(emailPattern: string): Promise<void> {
	try {
		const query = `DELETE FROM auth.users WHERE email LIKE '${emailPattern}'`;
		const command = `echo "${query}" | PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres 2>&1 || true`;

		execSync(command, { stdio: "pipe" });
		console.log(`✅ Cleaned up users matching: ${emailPattern}`);
	} catch (error) {
		console.warn(`⚠️ Could not clean up users: ${error}`);
	}
}
