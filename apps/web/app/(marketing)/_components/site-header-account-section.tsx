"use client";

import { PersonalAccountDropdown } from "@kit/accounts/personal-account-dropdown";
import { useSignOut } from "@kit/supabase/hooks/use-sign-out";
import { Button } from "@kit/ui/button";
import { If } from "@kit/ui/if";
import { Trans } from "@kit/ui/trans";
import type { Session } from "@supabase/supabase-js";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";

import featuresFlagConfig from "~/config/feature-flags.config";
import pathsConfig from "~/config/paths.config";

import { BookDemoOverlay } from "./book-demo-overlay";

const ModeToggle = dynamic(() =>
	import("@kit/ui/mode-toggle").then((mod) => ({
		default: mod.ModeToggle,
	})),
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

interface SiteHeaderAccountSectionProps {
	session: Session | null;
}

export function SiteHeaderAccountSection({
	session,
}: SiteHeaderAccountSectionProps) {
	if (session) {
		return <AuthenticatedSection session={session} />;
	}

	return <AuthButtons />;
}

function AuthenticatedSection({ session }: { session: Session }) {
	const signOut = useSignOut();

	return (
		<PersonalAccountDropdown
			showProfileName={false}
			paths={paths}
			features={features}
			user={session.user}
			signOutRequested={() => signOut.mutateAsync()}
		/>
	);
}

function AuthButtons() {
	const [isBookDemoOpen, setIsBookDemoOpen] = useState(false);

	return (
		<>
			<div className={"md:hidden"}>
				<If condition={features.enableThemeToggle}>
					<MobileModeToggle />
				</If>
			</div>

			<div className={"animate-in fade-in flex gap-x-2.5 duration-500"}>
				<div className={"hidden md:flex"}>
					<If condition={features.enableThemeToggle}>
						<ModeToggle />
					</If>
				</div>

				<Button
					variant={"outline"}
					className="font-medium"
					onClick={() => setIsBookDemoOpen(true)}
				>
					<Trans i18nKey={"common:bookDemo"} defaults="Book a demo" />
				</Button>

				<Button asChild variant={"default"}>
					<Link href={pathsConfig.auth.signIn}>
						<Trans i18nKey={"auth:signIn"} />
					</Link>
				</Button>
			</div>

			<BookDemoOverlay
				isOpen={isBookDemoOpen}
				onClose={() => setIsBookDemoOpen(false)}
			/>
		</>
	);
}
