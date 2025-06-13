"use client";

import { useCallback } from "react";

import type { z } from "zod";

import { useSignInWithEmailPassword } from "@kit/supabase/hooks/use-sign-in-with-email-password";

<<<<<<< HEAD
import { useCaptchaToken } from "../captcha/client";
import type { PasswordSignInSchema } from "../schemas/password-sign-in.schema";
import { AuthErrorAlert } from "./auth-error-alert";
import { PasswordSignInForm } from "./password-sign-in-form";
=======
import { useCaptchaToken } from '../captcha/client';
import { useLastAuthMethod } from '../hooks/use-last-auth-method';
import type { PasswordSignInSchema } from '../schemas/password-sign-in.schema';
import { AuthErrorAlert } from './auth-error-alert';
import { PasswordSignInForm } from './password-sign-in-form';
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

export function PasswordSignInContainer({
	onSignIn,
}: {
	onSignIn?: (userId?: string) => unknown;
}) {
<<<<<<< HEAD
	const { captchaToken, resetCaptchaToken } = useCaptchaToken();
	const signInMutation = useSignInWithEmailPassword();
	const isLoading = signInMutation.isPending;
	const isRedirecting = signInMutation.isSuccess;
=======
  const { captchaToken, resetCaptchaToken } = useCaptchaToken();
  const signInMutation = useSignInWithEmailPassword();
  const { recordAuthMethod } = useLastAuthMethod();
  const isLoading = signInMutation.isPending;
  const isRedirecting = signInMutation.isSuccess;
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

	const onSubmit = useCallback(
		async (credentials: z.infer<typeof PasswordSignInSchema>) => {
			try {
				const data = await signInMutation.mutateAsync({
					...credentials,
					options: { captchaToken },
				});

<<<<<<< HEAD
				if (onSignIn) {
					const userId = data?.user?.id;

					onSignIn(userId);
				}
			} catch {
				// wrong credentials, do nothing
			} finally {
				resetCaptchaToken();
			}
		},
		[captchaToken, onSignIn, resetCaptchaToken, signInMutation],
	);
=======
        // Record successful password sign-in
        recordAuthMethod('password', { email: credentials.email });

        if (onSignIn) {
          const userId = data?.user?.id;

          onSignIn(userId);
        }
      } catch {
        // wrong credentials, do nothing
      } finally {
        resetCaptchaToken();
      }
    },
    [
      captchaToken,
      onSignIn,
      resetCaptchaToken,
      signInMutation,
      recordAuthMethod,
    ],
  );
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

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
