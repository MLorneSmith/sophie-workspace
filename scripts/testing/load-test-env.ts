import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

/**
 * Load test environment variables from .env.test file
 * This function should be called at the beginning of test scripts
 *
 * Supports loading from either:
 * 1. scripts/.env.test (if running from scripts directory)
 * 2. apps/web/.env.test (fallback, with variable name mapping)
 */
export function loadTestEnv(): void {
	const __dirname = dirname(fileURLToPath(import.meta.url));
	const scriptsDir = join(__dirname, "..");
	const projectRoot = join(__dirname, "../..");

	// Try scripts/.env.test first, then apps/web/.env.test
	const scriptEnvPath = join(scriptsDir, ".env.test");
	const webEnvPath = join(projectRoot, "apps/web/.env.test");

	let envPath: string;
	let useWebEnv = false;

	if (existsSync(scriptEnvPath)) {
		envPath = scriptEnvPath;
	} else if (existsSync(webEnvPath)) {
		envPath = webEnvPath;
		useWebEnv = true;
	} else {
		console.error("❌ .env.test file not found!");
		console.error("Please create scripts/.env.test or apps/web/.env.test");
		process.exit(1);
	}

	// Load environment variables
	const result = config({ path: envPath });

	if (result.error) {
		console.error("❌ Error loading .env.test file:", result.error);
		process.exit(1);
	}

	// Map web env variable names to test script variable names
	// Always apply mapping since both scripts/.env.test and apps/web/.env.test
	// use the same NEXT_PUBLIC_* naming convention
	process.env.TEST_SUPABASE_URL =
		process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
	process.env.TEST_SUPABASE_SERVICE_ROLE_KEY =
		process.env.TEST_SUPABASE_SERVICE_ROLE_KEY ||
		process.env.SUPABASE_SERVICE_ROLE_KEY;
	process.env.TEST_USER_EMAIL =
		process.env.TEST_USER_EMAIL || "test1@slideheroes.com";
	process.env.TEST_PAYLOAD_URL =
		process.env.TEST_PAYLOAD_URL || "http://localhost:3020";
	process.env.TEST_PDF_CO_API_KEY =
		process.env.TEST_PDF_CO_API_KEY || process.env.PDF_CO_API_KEY || "";

	// Verify required variables are present (PDF_CO_API_KEY is optional for progress script)
	const requiredVars = ["TEST_SUPABASE_URL", "TEST_SUPABASE_SERVICE_ROLE_KEY"];

	const missingVars = requiredVars.filter((varName) => !process.env[varName]);

	if (missingVars.length > 0) {
		console.error("❌ Missing required environment variables:");
		for (const varName of missingVars) {
			console.error(`  - ${varName}`);
		}
		process.exit(1);
	}

	console.log(`✅ Test environment loaded from ${envPath}`);
}
