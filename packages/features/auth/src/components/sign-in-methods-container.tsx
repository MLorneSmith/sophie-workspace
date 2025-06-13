"use client";

<<<<<<< HEAD
import { useRouter } from "next/navigation";
=======
import { useCallback } from 'react';

import { useRouter } from 'next/navigation';
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

import type { Provider } from "@supabase/supabase-js";

import { isBrowser } from "@kit/shared/utils";
import { If } from "@kit/ui/if";
import { Separator } from "@kit/ui/separator";
import { Trans } from "@kit/ui/trans";

<<<<<<< HEAD
import { MagicLinkAuthContainer } from "./magic-link-auth-container";
import { OauthProviders } from "./oauth-providers";
import { PasswordSignInContainer } from "./password-sign-in-container";
=======
import { LastAuthMethodHint } from './last-auth-method-hint';
import { MagicLinkAuthContainer } from './magic-link-auth-container';
import { OauthProviders } from './oauth-providers';
import { OtpSignInContainer } from './otp-sign-in-container';
import { PasswordSignInContainer } from './password-sign-in-container';
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

export function SignInMethodsContainer(props: {
	inviteToken?: string;

	paths: {
		callback: string;
		joinTeam: string;
		returnPath: string;
	};

<<<<<<< HEAD
	providers: {
		password: boolean;
		magicLink: boolean;
		oAuth: Provider[];
	};
=======
  providers: {
    password: boolean;
    magicLink: boolean;
    otp: boolean;
    oAuth: Provider[];
  };
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950
}) {
	const router = useRouter();

	const redirectUrl = isBrowser()
		? new URL(props.paths.callback, window?.location.origin).toString()
		: "";

<<<<<<< HEAD
	const onSignIn = () => {
		// if the user has an invite token, we should join the team
		if (props.inviteToken) {
			const searchParams = new URLSearchParams({
				invite_token: props.inviteToken,
			});
=======
  const onSignIn = useCallback(() => {
    // if the user has an invite token, we should join the team
    if (props.inviteToken) {
      const searchParams = new URLSearchParams({
        invite_token: props.inviteToken,
      });
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

			const joinTeamPath = `${props.paths.joinTeam}?${searchParams.toString()}`;

			router.replace(joinTeamPath);
		} else {
			const returnPath = props.paths.returnPath || "/home";

<<<<<<< HEAD
			// otherwise, we should redirect to the return path
			router.replace(returnPath);
		}
	};

	return (
		<>
			<If condition={props.providers.password}>
				<PasswordSignInContainer onSignIn={onSignIn} />
			</If>
=======
      // otherwise, we should redirect to the return path
      router.replace(returnPath);
    }
  }, [props.inviteToken, props.paths.joinTeam, props.paths.returnPath, router]);

  return (
    <>
      <LastAuthMethodHint />

      <If condition={props.providers.password}>
        <PasswordSignInContainer onSignIn={onSignIn} />
      </If>
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

			<If condition={props.providers.magicLink}>
				<MagicLinkAuthContainer
					inviteToken={props.inviteToken}
					redirectUrl={redirectUrl}
					shouldCreateUser={false}
				/>
			</If>

<<<<<<< HEAD
			<If condition={props.providers.oAuth.length}>
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<Separator />
					</div>
=======
      <If condition={props.providers.otp}>
        <OtpSignInContainer shouldCreateUser={false} onSignIn={onSignIn} />
      </If>

      <If condition={props.providers.oAuth.length}>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950

					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background text-muted-foreground px-2">
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
