"use client";

import { AccountSelector } from "@kit/accounts/account-selector";
import { SidebarContext } from "@kit/ui/shadcn-sidebar";
import { useRouter } from "next/navigation";
import { useContext } from "react";

import featureFlagsConfig from "~/config/feature-flags.config";
import pathsConfig from "~/config/paths.config";

const features = {
	enableTeamCreation: featureFlagsConfig.enableTeamCreation,
};

export function HomeAccountSelector(props: {
	accounts: Array<{
		label: string | null;
		value: string | null;
		image: string | null;
	}>;

	userId: string;
	collisionPadding?: number;
}) {
	const router = useRouter();
	const context = useContext(SidebarContext);

	return (
		<AccountSelector
			collapsed={!context?.open}
			collisionPadding={props.collisionPadding ?? 20}
			accounts={props.accounts}
			features={features}
			userId={props.userId}
			onAccountChange={(value) => {
				if (value) {
					const path = pathsConfig.app.accountHome.replace("[account]", value);
					router.replace(path);
				}
			}}
		/>
	);
}
