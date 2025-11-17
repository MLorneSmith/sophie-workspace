import { existsSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

/**
 * Load test environment variables from .env.test file
 * This function should be called at the beginning of test scripts
 */
export function loadTestEnv(): void {
	const envPath = join(process.cwd(), ".env.test");

	if (!existsSync(envPath)) {
		console.error("❌ .env.test file not found!");
		console.error(
			"Please create a .env.test file with the following variables:",
		);
		console.error("  - TEST_SUPABASE_URL");
		console.error("  - TEST_SUPABASE_SERVICE_ROLE_KEY");
		console.error("  - TEST_PDF_CO_API_KEY");
		console.error("  - TEST_USER_EMAIL");
		console.error("  - TEST_PAYLOAD_URL");
		process.exit(1);
	}

	// Load environment variables from .env.test
	const result = config({ path: envPath });

	if (result.error) {
		console.error("❌ Error loading .env.test file:", result.error);
		process.exit(1);
	}

	// Verify required variables are present
	const requiredVars = [
		"TEST_SUPABASE_URL",
		"TEST_SUPABASE_SERVICE_ROLE_KEY",
		"TEST_PDF_CO_API_KEY",
		"TEST_USER_EMAIL",
		"TEST_PAYLOAD_URL",
	];

	const missingVars = requiredVars.filter((varName) => !process.env[varName]);

	if (missingVars.length > 0) {
		console.error("❌ Missing required environment variables in .env.test:");
		missingVars.forEach((varName) => console.error(`  - ${varName}`));
		process.exit(1);
	}

	console.log("✅ Test environment variables loaded successfully");
}
