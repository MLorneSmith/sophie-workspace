import "server-only";

import { verifyCaptchaToken } from "@kit/auth/captcha/server";
import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import type { JWTUserData } from "@kit/supabase/types";
import { redirect } from "next/navigation";
import type { ZodType, z } from "zod";

/**
 * Factory for creating a Zod parser with error handling
 */
const zodParseFactory =
	<T extends ZodType>(schema: T) =>
	(data: unknown): z.infer<T> => {
		try {
			return schema.parse(data);
		} catch (err) {
			throw new Error(`Invalid data: ${err as string}`);
		}
	};

/**
 * @name enhanceAction
 * @description Enhance an action with captcha, schema and auth checks
 */
export function enhanceAction<
	Args,
	Response,
	Config extends {
		auth?: boolean;
		captcha?: boolean;
		schema?: z.ZodType<
			Config["captcha"] extends true ? Args & { captchaToken: string } : Args,
			z.ZodTypeDef
		>;
	},
>(
	fn: (
		params: Config["schema"] extends ZodType ? z.infer<Config["schema"]> : Args,
		user: Config["auth"] extends false ? undefined : JWTUserData,
	) => Response | Promise<Response>,
	config: Config,
) {
	return async (
		params: Config["schema"] extends ZodType ? z.infer<Config["schema"]> : Args,
	) => {
		type UserParam = Config["auth"] extends false ? undefined : JWTUserData;

		const requireAuth = config.auth ?? true;
		let user: UserParam = undefined as UserParam;

		// validate the schema passed in the config if it exists
		const data = config.schema
			? zodParseFactory(config.schema)(params)
			: params;

		// by default, the CAPTCHA token is not required
		const verifyCaptcha = config.captcha ?? false;

		// verify the CAPTCHA token. It will throw an error if the token is invalid.
		if (verifyCaptcha) {
			const token = (data as Args & { captchaToken: string }).captchaToken;

			// Verify the CAPTCHA token. It will throw an error if the token is invalid.
			await verifyCaptchaToken(token);
		}

		// verify the user is authenticated if required
		if (requireAuth) {
			// verify the user is authenticated if required
			const auth = await requireUser(getSupabaseServerClient());

			// If the user is not authenticated, redirect to the specified URL.
			if (!auth.data) {
				redirect(auth.redirectTo);
			}

			user = auth.data as UserParam;
		}

		return fn(data, user);
	};
}
