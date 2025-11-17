import type { SupabaseClient } from "@supabase/supabase-js";

const ASSURANCE_LEVEL_2 = "aal2";

/**
 * @name checkRequiresMultiFactorAuthentication
 * @description Checks if the current session requires multi-factor authentication.
 * We do it by checking that:
 * 1. The next assurance level is AAL2
 * 2. The current assurance level is not AAL2
 * 3. The user has actually enrolled MFA factors
 *
 * This prevents redirecting users to MFA verification when they don't have MFA set up,
 * even if MFA is globally enabled in Supabase configuration.
 *
 * @param client
 */
export async function checkRequiresMultiFactorAuthentication(
	client: SupabaseClient,
) {
	// Suppress the getSession warning. Remove when the issue is fixed.
	// https://github.com/supabase/auth-js/issues/873
	// @ts-expect-error: suppressGetSessionWarning is not part of the public API
	client.auth.suppressGetSessionWarning = true;

	const assuranceLevel = await client.auth.mfa.getAuthenticatorAssuranceLevel();

	// @ts-expect-error: suppressGetSessionWarning is not part of the public API
	client.auth.suppressGetSessionWarning = false;

	if (assuranceLevel.error) {
		throw new Error(assuranceLevel.error.message);
	}

	const { nextLevel, currentLevel } = assuranceLevel.data;

	// Only require MFA if the next level should be AAL2 AND current level is not AAL2
	if (nextLevel === ASSURANCE_LEVEL_2 && nextLevel !== currentLevel) {
		// CRITICAL: Check if user actually has enrolled MFA factors
		// Without this check, users without MFA get redirected to verification page
		// and cannot proceed (no factors to verify)
		const { data: factors } = await client.auth.mfa.listFactors();
		const hasEnrolledFactors = factors?.totp && factors.totp.length > 0;

		return hasEnrolledFactors;
	}

	return false;
}
