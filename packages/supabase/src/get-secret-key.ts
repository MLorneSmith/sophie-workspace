import "server-only";

import { z } from "zod";

const message =
	"Invalid Supabase Secret Key. Please add the environment variable SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.";

/**
 * @name getSupabaseSecretKey
 * @description Get the Supabase Service Role Key.
 * ONLY USE IN SERVER-SIDE CODE. DO NOT EXPOSE THIS TO CLIENT-SIDE CODE.
 */
export function getSupabaseSecretKey() {
	return z
		.string()
		.min(1, {
			message: message,
		})
		.parse(
			process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
		);
}

/**
 * Displays a warning message if the Supabase Service Role is being used.
 */
export function warnServiceRoleKeyUsage() {
	if (process.env.NODE_ENV !== "production") {
	}
}
