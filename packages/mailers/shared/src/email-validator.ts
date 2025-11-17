import { z } from "zod";

/**
 * Email validation schema with enhanced validation
 */
export const EmailSchema = z
	.string()
	.email("Invalid email format")
	.refine((email) => {
		// Block common test/fake email domains that cause bounces
		const blockedDomains = [
			"example.com",
			"test.com",
			"fake.com",
			"dummy.com",
			"invalid.com",
			"placeholder.com",
		];

		const domain = email.split("@")[1]?.toLowerCase();
		return domain ? !blockedDomains.includes(domain) : false;
	}, "Invalid email domain - test domains not allowed")
	.refine((email) => {
		// Block common test email patterns
		const testPatterns = [
			/^test@/,
			/^dummy@/,
			/^fake@/,
			/^example@/,
			/^placeholder@/,
		];

		return !testPatterns.some((pattern) => pattern.test(email.toLowerCase()));
	}, "Test email patterns not allowed");

/**
 * Environment-specific email routing
 */
export function getEmailRoutingConfig() {
	const env = process.env.NODE_ENV || "development";
	const isCI = process.env.CI === "true";

	return {
		isDevelopment: env === "development",
		isTest: env === "test" || isCI,
		isProduction: env === "production",
		shouldRouteToInBucket: env !== "production" && !isCI,
		shouldValidateEmailDomains: env === "production",
	};
}

/**
 * Validate email for sending based on environment
 */
export function validateEmailForSending(email: string): {
	isValid: boolean;
	error?: string;
	shouldSend: boolean;
} {
	const routing = getEmailRoutingConfig();

	try {
		// In production, enforce strict validation
		if (routing.isProduction || routing.shouldValidateEmailDomains) {
			EmailSchema.parse(email);
		}

		// In test environment, don't actually send emails
		if (routing.isTest) {
			return {
				isValid: true,
				shouldSend: false,
			};
		}

		return {
			isValid: true,
			shouldSend: true,
		};
	} catch (error) {
		return {
			isValid: false,
			error: error instanceof Error ? error.message : "Invalid email",
			shouldSend: false,
		};
	}
}

/**
 * Get appropriate sender email based on environment
 */
export function getSenderEmail(): string {
	const routing = getEmailRoutingConfig();

	if (routing.isProduction) {
		return process.env.EMAIL_SENDER || "noreply@slideheroes.com";
	}

	// For development/test, use safe test email
	return process.env.EMAIL_SENDER || "test@slideheroes.com";
}
