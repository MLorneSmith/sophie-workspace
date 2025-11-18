import type { Provider } from "@supabase/supabase-js";

import { z } from "zod";

const providers: z.ZodType<Provider> = getProviders();

const AuthConfigSchema = z.object({
	captchaTokenSiteKey: z
		.string()
		.describe("The reCAPTCHA site key.")
		.optional(),
	displayTermsCheckbox: z
		.boolean()
		.describe("Whether to display the terms checkbox during sign-up.")
		.optional(),
	enableIdentityLinking: z
		.boolean()
		.describe("Allow linking and unlinking of auth identities.")
		.optional()
		.default(false),
	providers: z.object({
		password: z.boolean().describe("Enable password authentication."),
		magicLink: z.boolean().describe("Enable magic link authentication."),
		otp: z.boolean().describe("Enable one-time password authentication."),
		oAuth: providers.array(),
	}),
});

/**
 * Determine which Turnstile sitekey to use based on environment
 *
 * For CI/CD, test environments, and non-production Vercel deployments,
 * use Cloudflare's official test key that always passes validation.
 * This allows Playwright tests to run without being blocked by CAPTCHA challenges.
 *
 * Test sitekey: 1x00000000000000000000AA (works on any domain, always passes)
 */
function getCaptchaSiteKey(): string | undefined {
	const isTestEnvironment =
		process.env.NODE_ENV === "test" ||
		process.env.CI === "true" ||
		process.env.PLAYWRIGHT_TEST === "true" ||
		process.env.VERCEL_ENV === "development" ||
		process.env.VERCEL_ENV === "preview";

	if (isTestEnvironment) {
		// Cloudflare's official test sitekey - always passes
		return "1x00000000000000000000AA";
	}

	// Production sitekey from environment variable
	return process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;
}

const captchaSiteKey = getCaptchaSiteKey();

// Security check: Prevent test keys from being used in production Vercel deployments
if (
	process.env.VERCEL_ENV === "production" &&
	captchaSiteKey === "1x00000000000000000000AA"
) {
	throw new Error(
		"❌ SECURITY: Cloudflare Turnstile test keys detected in production deployment! " +
			"Set NEXT_PUBLIC_CAPTCHA_SITE_KEY environment variable with your production sitekey.",
	);
}

const authConfig = AuthConfigSchema.parse({
	// NB: This is a public key, so it's safe to expose.
	// In test/CI environments, uses Cloudflare's official test key.
	// Copy the production value from the Supabase Dashboard.
	captchaTokenSiteKey: captchaSiteKey,

	// whether to display the terms checkbox during sign-up
	displayTermsCheckbox:
		process.env.NEXT_PUBLIC_DISPLAY_TERMS_AND_CONDITIONS_CHECKBOX === "true",

	// whether to enable identity linking:
	// This needs to be enabled in the Supabase Console as well for it to work.
	enableIdentityLinking:
		process.env.NEXT_PUBLIC_AUTH_IDENTITY_LINKING === "true",

	// NB: Enable the providers below in the Supabase Console
	// in your production project
	providers: {
		password: process.env.NEXT_PUBLIC_AUTH_PASSWORD === "true",
		magicLink: process.env.NEXT_PUBLIC_AUTH_MAGIC_LINK === "true",
		otp: process.env.NEXT_PUBLIC_AUTH_OTP === "true",
		oAuth: ["google"],
	},
} satisfies z.infer<typeof AuthConfigSchema>);

export default authConfig;

function getProviders() {
	return z.enum([
		"apple",
		"azure",
		"bitbucket",
		"discord",
		"facebook",
		"figma",
		"github",
		"gitlab",
		"google",
		"kakao",
		"keycloak",
		"linkedin",
		"linkedin_oidc",
		"notion",
		"slack",
		"spotify",
		"twitch",
		"twitter",
		"workos",
		"zoom",
		"fly",
	]);
}
