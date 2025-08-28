"use client";

import { isBrowser } from "@kit/shared/utils";
import { If } from "@kit/ui/if";
import { Separator } from "@kit/ui/separator";
import { Trans } from "@kit/ui/trans";
import type { Provider } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

import { MagicLinkAuthContainer } from "./magic-link-auth-container";
import { OauthProviders } from "./oauth-providers";
import { OtpSignInContainer } from "./otp-sign-in-container";
import { PasswordSignInContainer } from "./password-sign-in-container";

export function SignInMethodsContainer(props: {
	inviteToken?: string;

	paths: {
		callback: string;
		joinTeam: string;
		returnPath: string;
	};

	providers: {
		password: boolean;
		magicLink: boolean;
		oAuth: Provider[];
		otp?: boolean;
	};
}) {
	const router = useRouter();

	const redirectUrl = isBrowser()
		? new URL(props.paths.callback, window?.location.origin).toString()
		: "";

	const onSignIn = async () => {
		// Add a delay to ensure the session is properly established
		// This prevents a race condition where the client redirects before
		// the auth cookies are set, causing the middleware to not recognize
		// the authenticated state
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Force a hard navigation to ensure cookies are properly sent
		// Using window.location instead of router.replace ensures the browser
		// makes a full page request with the new auth cookies
		if (props.inviteToken) {
			const searchParams = new URLSearchParams({
				invite_token: props.inviteToken,
			});

			const joinTeamPath = `${props.paths.joinTeam}?${searchParams.toString()}`;

			window.location.href = joinTeamPath;
		} else {
			const returnPath = props.paths.returnPath || "/home";

			// Use window.location for a hard navigation to ensure cookies are sent
			window.location.href = returnPath;
		}
	};

	return (
		<>
			<If condition={props.providers.password}>
				<PasswordSignInContainer onSignIn={onSignIn} />
			</If>

			<If condition={props.providers.magicLink}>
				<MagicLinkAuthContainer
					inviteToken={props.inviteToken}
					redirectUrl={redirectUrl}
					shouldCreateUser={false}
				/>
			</If>

			<If condition={props.providers.otp}>
				<OtpSignInContainer
					inviteToken={props.inviteToken}
					shouldCreateUser={false}
				/>
			</If>

			<If condition={props.providers.oAuth.length}>
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<Separator />
					</div>

					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background text-foreground px-2">
							<Trans i18nKey="auth:orContinueWith" />
						</span>
					</div>
				</div>

				<OauthProviders
					enabledProviders={props.providers.oAuth}
					inviteToken={props.inviteToken}
					shouldCreateUser={false}
					paths={{
						callback: props.paths.callback,
						returnPath: props.paths.returnPath,
					}}
				/>
			</If>
		</>
	);
}
