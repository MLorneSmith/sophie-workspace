"use client";

import { PersonalAccountDropdown } from "@kit/accounts/personal-account-dropdown";
import { useSignOut } from "@kit/supabase/hooks/use-sign-out";
import type { JWTUserData } from "@kit/supabase/types";
import { Button } from "@kit/ui/button";
import { If } from "@kit/ui/if";
import { Trans } from "@kit/ui/trans";
import dynamic from "next/dynamic";
import Link from "next/link";

import featuresFlagConfig from "~/config/feature-flags.config";
import pathsConfig from "~/config/paths.config";

const ModeToggle = dynamic(
	() =>
		import("@kit/ui/mode-toggle").then((mod) => ({
			default: mod.ModeToggle,
		})),
	{ ssr: false },
);

const MobileModeToggle = dynamic(() =>
	import("@kit/ui/mobile-mode-toggle").then((mod) => ({
		default: mod.MobileModeToggle,
	})),
);

const paths = {
	home: pathsConfig.app.home,
};

const features = {
	enableThemeToggle: featuresFlagConfig.enableThemeToggle,
};

export function SiteHeaderAccountSection({
	user,
}: {
	user: JWTUserData | null;
}) {
	const signOut = useSignOut();

	if (user) {
		return (
			<PersonalAccountDropdown
				showProfileName={false}
				paths={paths}
				features={features}
				user={user}
				signOutRequested={() => signOut.mutateAsync()}
			/>
		);
	}

	return <AuthButtons />;
}

function AuthButtons() {
	return (
		<div className={"animate-in fade-in flex gap-x-2.5 duration-500"}>
			<div className={"hidden md:flex"}>
				<If condition={features.enableThemeToggle}>
					<ModeToggle />
				</If>
			</div>

			<div className={"md:hidden"}>
				<If condition={features.enableThemeToggle}>
					<MobileModeToggle />
				</If>
			</div>

			<div className={"flex items-center gap-x-2.5"}>
				<Button
					className={
						"hidden border-white text-white hover:bg-white/10 hover:text-white md:inline-flex"
					}
					asChild
					variant={"outline"}
				>
					<Link href={pathsConfig.auth.signIn}>
						<Trans i18nKey={"auth:signIn"} />
					</Link>
				</Button>

				<Button
					asChild
					className="bg-[#24A9E0] text-white hover:bg-[#24A9E0]/85"
				>
					<Link href={pathsConfig.auth.signUp}>
						<Trans i18nKey={"auth:signUp"} />
					</Link>
				</Button>
			</div>
		</div>
	);
}
