import {
	BorderedNavigationMenu,
	BorderedNavigationMenuItem,
} from "@kit/ui/bordered-navigation-menu";
import { If } from "@kit/ui/if";
import type { SidebarConfig } from "@kit/ui/sidebar";

import { AppLogo } from "~/components/app-logo";
import { ProfileAccountDropdownContainer } from "~/components/personal-account-dropdown-container";
import featuresFlagConfig from "~/config/feature-flags.config";

// home imports
import { HomeAccountSelector } from "../_components/home-account-selector";
import { UserNotifications } from "../_components/user-notifications";
import type { UserWorkspace } from "../_lib/server/load-user-workspace";

interface HomeMenuNavigationProps {
	workspace: UserWorkspace;
	navigationConfig: SidebarConfig;
}

export function HomeMenuNavigation(props: HomeMenuNavigationProps) {
	const { workspace, user, accounts } = props.workspace;
	const { navigationConfig } = props;

	const routes = navigationConfig.routes.reduce<
		Array<{
			path: string;
			label: string;
			Icon?: React.ReactNode;
			end?: boolean | ((path: string) => boolean);
		}>
	>((acc, item) => {
		if ("children" in item) {
			// Type assertion: Zod function type is compatible with our function type
			acc.push(...(item.children as typeof acc));
			return acc;
		}

		if ("divider" in item) {
			return acc;
		}

		acc.push(item as (typeof acc)[number]);
		return acc;
	}, []);

	return (
		<div className={"flex w-full flex-1 justify-between"}>
			<div className={"flex items-center space-x-8"}>
				<AppLogo />

				<BorderedNavigationMenu>
					{routes.map((route) => (
						<BorderedNavigationMenuItem {...route} key={route.path} />
					))}
				</BorderedNavigationMenu>
			</div>

			<div className={"flex justify-end space-x-2.5"}>
				<UserNotifications userId={user.id} />

				<If condition={featuresFlagConfig.enableTeamAccounts}>
					<HomeAccountSelector userId={user.id} accounts={accounts} />
				</If>

				<div>
					<ProfileAccountDropdownContainer
						user={user}
						account={workspace}
						showProfileName={false}
					/>
				</div>
			</div>
		</div>
	);
}
