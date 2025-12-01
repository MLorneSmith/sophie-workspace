/**
 * Enhanced credential validation utility for E2E tests
 * Provides environment-aware error handling and graceful degradation
 */

export interface CredentialValidationResult {
	isValid: boolean;
	reason?: string;
	environment: "CI" | "LOCAL";
	severity: "ERROR" | "WARNING";
}

export interface E2ECredentials {
	email: string;
	password: string;
	role: string;
}

// biome-ignore lint/complexity/noStaticOnlyClass: Utility class provides namespace and better organization for credential validation
export class CredentialValidator {
	/**
	 * Check if running in CI environment
	 */
	static readonly isCI =
		process.env.CI === "true" || !!process.env.GITHUB_ACTIONS;

	/**
	 * Enable verbose logging for credential validation
	 */
	static readonly verboseMode = process.env.E2E_VERBOSE === "true";

	/**
	 * Validate email format using a simple regex
	 */
	static isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	/**
	 * Validate E2E test credentials with environment-aware handling
	 */
	static validate(credentials: E2ECredentials): CredentialValidationResult {
		const { email, password, role } = credentials;
		const environment = CredentialValidator.isCI ? "CI" : "LOCAL";

		// Check for missing or empty values
		if (!email || email.trim() === "" || email === "undefined") {
			return {
				isValid: false,
				reason: `${role} email is missing or empty`,
				environment,
				severity: "ERROR",
			};
		}

		if (!password || password.trim() === "" || password === "undefined") {
			return {
				isValid: false,
				reason: `${role} password is missing or empty`,
				environment,
				severity: "ERROR",
			};
		}

		// Validate email format
		if (!CredentialValidator.isValidEmail(email)) {
			return {
				isValid: false,
				reason: `${role} email format is invalid: ${email}`,
				environment,
				severity: "ERROR",
			};
		}

		// Password strength validation (warning only in local dev)
		if (!CredentialValidator.isCI && password.length < 8) {
			console.warn(`⚠️ Warning: ${role} password is shorter than 8 characters`);
		}

		if (CredentialValidator.verboseMode) {
			console.log(`✅ ${role} credentials validated successfully`);
			console.log(`   Email: ${email}`);
			console.log(`   Password length: ${password.length} chars`);
			console.log(`   Environment: ${environment}`);
		}

		return {
			isValid: true,
			environment,
			severity: "ERROR", // Not used for valid credentials
		};
	}

	/**
	 * Handle credential validation errors with enhanced messaging
	 */
	static handleError(
		result: CredentialValidationResult,
		credentials: E2ECredentials,
	): never {
		const { role, email, password } = credentials;
		const emailStatus = email && email !== "undefined" ? "SET" : "NOT SET";
		const passwordStatus =
			password && password !== "undefined" ? "SET" : "NOT SET";

		if (result.environment === "CI") {
			console.error("❌ CI Environment - E2E Credential Validation Failed");
			console.error(`   Role: ${role}`);
			console.error(`   Reason: ${result.reason}`);
			console.error(`   Email: ${emailStatus}`);
			console.error(`   Password: ${passwordStatus}`);
			console.error("");
			console.error("🔧 Required GitHub Secrets:");
			console.error("   - E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD");
			console.error("   - E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD");
			console.error("   - E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
			console.error("");
			console.error("📋 Troubleshooting:");
			console.error(
				"   1. Verify GitHub Secrets are set in repository settings",
			);
			console.error("   2. Check secret names match exactly (case-sensitive)");
			console.error(
				"   3. Ensure secrets contain valid test account credentials",
			);
			console.error(
				"   4. Verify test accounts exist in the target environment",
			);
		} else {
			console.warn("⚠️ Local Development - E2E Credential Validation Failed");
			console.warn(`   Role: ${role}`);
			console.warn(`   Reason: ${result.reason}`);
			console.warn(`   Email: ${emailStatus}`);
			console.warn(`   Password: ${passwordStatus}`);
			console.warn("");
			console.warn("🔧 Local Setup Required:");
			console.warn("   1. Copy apps/e2e/.env.example to apps/e2e/.env.local");
			console.warn(
				"   2. Fill in the credential values from your test environment",
			);
			console.warn("   3. Ensure test accounts exist and are accessible");
			console.warn(
				"   4. Check Supabase local instance is running with seed data",
			);
		}

		throw new Error(
			`E2E ${role} credential validation failed: ${result.reason}. ` +
				(result.environment === "CI"
					? "Check GitHub Secrets configuration."
					: "Check your .env.local file."),
		);
	}

	/**
	 * Get credentials from environment with fallbacks
	 */
	static getCredentials(
		type: "test" | "owner" | "admin" | "payload-admin",
	): E2ECredentials {
		// Payload admin uses the same credentials as regular admin
		// (Payload CMS authenticates via Supabase with the same user)
		const envPrefix =
			type === "test"
				? "E2E_TEST_USER"
				: type === "owner"
					? "E2E_OWNER"
					: "E2E_ADMIN"; // Both "admin" and "payload-admin" use E2E_ADMIN

		const email = process.env[`${envPrefix}_EMAIL`] || "";
		const password = process.env[`${envPrefix}_PASSWORD`] || "";

		return {
			email,
			password,
			role: `${type} user`,
		};
	}

	/**
	 * Validate and get credentials with comprehensive error handling
	 */
	static validateAndGet(
		type: "test" | "owner" | "admin" | "payload-admin",
	): E2ECredentials {
		const credentials = CredentialValidator.getCredentials(type);
		const result = CredentialValidator.validate(credentials);

		if (!result.isValid) {
			CredentialValidator.handleError(result, credentials);
		}

		return credentials;
	}
}
