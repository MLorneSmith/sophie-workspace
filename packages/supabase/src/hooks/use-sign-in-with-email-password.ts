import type { SignInWithPasswordCredentials } from "@supabase/supabase-js";

import { useMutation } from "@tanstack/react-query";

import { useSupabase } from "./use-supabase";

export function useSignInWithEmailPassword() {
	const client = useSupabase();
	const mutationKey = ["auth", "sign-in-with-email-password"];

	const mutationFn = async (credentials: SignInWithPasswordCredentials) => {
		// Log the sign-in attempt for debugging
		if (
			process.env.NODE_ENV === "test" ||
			process.env.NODE_ENV === "development"
		) {
			// biome-ignore lint/suspicious/noConsole: Debug logging for auth in development/test
			console.log("[Auth Debug] Sign-in attempt:", {
				email: "email" in credentials ? credentials.email : undefined,
				phone: "phone" in credentials ? credentials.phone : undefined,
			});
		}

		const response = await client.auth.signInWithPassword(credentials);

		if (response.error) {
			// Log the actual error for debugging
			if (
				process.env.NODE_ENV === "test" ||
				process.env.NODE_ENV === "development"
			) {
				// biome-ignore lint/suspicious/noConsole: Debug logging for auth errors in development/test
				console.error("[Auth Debug] Sign-in error:", {
					error: response.error,
					message: response.error.message,
					status: response.error.status,
					code: response.error.code,
				});
			}
			throw response.error.message;
		}

		const user = response.data?.user;
		const identities = user?.identities ?? [];

		// if the user has no identities, it means that the email is taken
		if (identities.length === 0) {
			throw new Error("User already registered");
		}

		return response.data;
	};

	return useMutation({ mutationKey, mutationFn });
}
