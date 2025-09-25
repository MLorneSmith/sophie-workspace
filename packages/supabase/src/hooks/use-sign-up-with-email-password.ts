import { useMutation } from "@tanstack/react-query";

import { useSupabase } from "./use-supabase";

interface Credentials {
	email: string;
	password: string;
	emailRedirectTo: string;
	captchaToken?: string;
}

export function useSignUpWithEmailAndPassword() {
	const client = useSupabase();
	const mutationKey = ["auth", "sign-up-with-email-password"];

	const mutationFn = async (params: Credentials) => {
		const { emailRedirectTo, captchaToken, ...credentials } = params;

		// Log the sign-up attempt for debugging
		if (
			process.env.NODE_ENV === "test" ||
			process.env.NODE_ENV === "development"
		) {
			// biome-ignore lint/suspicious/noConsole: Debug logging for auth in development/test
			console.log("[Auth Debug] Sign-up attempt:", {
				email: credentials.email,
				emailRedirectTo,
				hasCaptchaToken: !!captchaToken,
			});
		}

		const response = await client.auth.signUp({
			...credentials,
			options: {
				emailRedirectTo,
				captchaToken,
			},
		});

		if (response.error) {
			// Log the actual error for debugging
			if (
				process.env.NODE_ENV === "test" ||
				process.env.NODE_ENV === "development"
			) {
				// biome-ignore lint/suspicious/noConsole: Debug logging for auth errors in development/test
				console.error("[Auth Debug] Sign-up error:", {
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

	return useMutation({
		mutationKey,
		mutationFn,
	});
}
