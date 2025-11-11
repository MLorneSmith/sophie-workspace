import "server-only";

const verifyEndpoint =
	"https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Determine which Turnstile secret to use based on environment
 *
 * For CI/CD, test environments, and non-production Vercel deployments,
 * use Cloudflare's official test secret that always passes validation
 * when used with the test sitekey.
 *
 * Test secret: 1x0000000000000000000000000000000AA (always accepts test tokens)
 */
function getCaptchaSecret(): string {
	const isTestEnvironment =
		process.env.NODE_ENV === "test" ||
		process.env.CI === "true" ||
		process.env.PLAYWRIGHT_TEST === "true" ||
		process.env.VERCEL_ENV === "development" ||
		process.env.VERCEL_ENV === "preview";

	if (isTestEnvironment) {
		// Cloudflare's official test secret - always passes with test sitekey
		return "1x0000000000000000000000000000000AA";
	}

	const secret = process.env.CAPTCHA_SECRET_TOKEN;

	if (!secret) {
		throw new Error("CAPTCHA_SECRET_TOKEN is not set");
	}

	// Security check: Prevent test secret from being used in production Vercel deployments
	if (
		process.env.VERCEL_ENV === "production" &&
		secret === "1x0000000000000000000000000000000AA"
	) {
		throw new Error(
			"❌ SECURITY: Cloudflare Turnstile test secret detected in production! " +
				"Set CAPTCHA_SECRET_TOKEN environment variable with your production secret.",
		);
	}

	return secret;
}

/**
 * @name verifyCaptchaToken
 * @description Verify the CAPTCHA token with the CAPTCHA service
 * @param token - The CAPTCHA token to verify
 */
export async function verifyCaptchaToken(token: string) {
	const secret = getCaptchaSecret();
	const formData = new FormData();

	formData.append("secret", secret);
	formData.append("response", token);

	const res = await fetch(verifyEndpoint, {
		method: "POST",
		body: formData,
	});

	if (!res.ok) {
		// TODO: Async logger needed
		// (await getLogger()).error("Captcha failed:", { data: res.statusText });

		throw new Error("Failed to verify CAPTCHA token");
	}

	const data = await res.json();

	if (!data.success) {
		throw new Error("Invalid CAPTCHA token");
	}
}
