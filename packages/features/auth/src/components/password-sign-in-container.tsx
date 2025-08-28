"use client";

import { useSignInWithEmailPassword } from "@kit/supabase/hooks/use-sign-in-with-email-password";
import { useCallback } from "react";
import type { z } from "zod";

import { useCaptchaToken } from "../captcha/client";
import type { PasswordSignInSchema } from "../schemas/password-sign-in.schema";
import { AuthErrorAlert } from "./auth-error-alert";
import { PasswordSignInForm } from "./password-sign-in-form";

export function PasswordSignInContainer({
	onSignIn,
}: {
	onSignIn?: (userId?: string) => unknown;
}) {
	const { captchaToken, resetCaptchaToken } = useCaptchaToken();
	const signInMutation = useSignInWithEmailPassword();
	const isLoading = signInMutation.isPending;
	const isRedirecting = signInMutation.isSuccess;

	const onSubmit = useCallback(
		async (credentials: z.infer<typeof PasswordSignInSchema>) => {
			try {
				const data = await signInMutation.mutateAsync({
					...credentials,
					options: { captchaToken },
				});

				if (onSignIn) {
					const userId = data?.user?.id;

					// Wait for the mutation to fully complete and session to be established
					await onSignIn(userId);
				}
			} catch {
				// wrong credentials, do nothing
			} finally {
				resetCaptchaToken();
			}
		},
		[captchaToken, resetCaptchaToken, signInMutation, onSignIn],
	);

	return (
		<>
			<AuthErrorAlert error={signInMutation.error} />

			<PasswordSignInForm
				onSubmit={onSubmit}
				loading={isLoading}
				redirecting={isRedirecting}
			/>
		</>
	);
}
