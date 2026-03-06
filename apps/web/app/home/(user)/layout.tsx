import { UserWorkspaceContextProvider } from "@kit/accounts/components";
import { Page, PageMobileNavigation, PageNavigation } from "@kit/ui/page";
import { SidebarProvider } from "@kit/ui/shadcn-sidebar";
import { cookies } from "next/headers";
import { use } from "react";
import { z } from "zod";

import { AppLogo } from "~/components/app-logo";
import {
	getPersonalAccountNavigationConfig,
	personalAccountNavigationConfig,
} from "~/config/personal-account-navigation.config";
import { withI18n } from "~/lib/i18n/with-i18n";
import { getEnableCourses } from "~/lib/server/feature-flags.server";

// home imports
import { SkipToContent } from "./_components/dashboard/skip-to-content";
import { HomeMenuNavigation } from "./_components/home-menu-navigation";
import { HomeMobileNavigation } from "./_components/home-mobile-navigation";
import { HomeSidebar } from "./_components/home-sidebar";
import { loadUserWorkspace } from "./_lib/server/load-user-workspace";

function UserHomeLayout({ children }: React.PropsWithChildren) {
	const state = use(getLayoutState());

	if (state.style === "sidebar") {
		return <SidebarLayout>{children}</SidebarLayout>;
	}

	return <HeaderLayout>{children}</HeaderLayout>;
}

export default withI18n(UserHomeLayout);

function SidebarLayout({ children }: React.PropsWithChildren) {
	const workspace = use(loadUserWorkspace());
	const state = use(getLayoutState());
	const enableCourses = use(getEnableCourses());
	const navigationConfig = getPersonalAccountNavigationConfig(enableCourses);

	return (
		<UserWorkspaceContextProvider value={workspace}>
			<SkipToContent />

			<SidebarProvider defaultOpen={state.open} defaultPinned={state.pinned}>
				<Page style={"sidebar"}>
					<PageNavigation>
						<HomeSidebar
							workspace={workspace}
							navigationConfig={navigationConfig}
						/>
					</PageNavigation>

					<PageMobileNavigation className={"flex items-center justify-between"}>
						<MobileNavigation
							workspace={workspace}
							navigationConfig={navigationConfig}
						/>
					</PageMobileNavigation>

					{/* biome-ignore lint/correctness/useUniqueElementIds: layout renders once per page, skip-to-content targets this ID */}
					<main id="main-content">{children}</main>
				</Page>
			</SidebarProvider>
		</UserWorkspaceContextProvider>
	);
}

function HeaderLayout({ children }: React.PropsWithChildren) {
	const workspace = use(loadUserWorkspace());
	const enableCourses = use(getEnableCourses());
	const navigationConfig = getPersonalAccountNavigationConfig(enableCourses);

	return (
		<UserWorkspaceContextProvider value={workspace}>
			<SkipToContent />

			<Page style={"header"}>
				<PageNavigation>
					<HomeMenuNavigation
						workspace={workspace}
						navigationConfig={navigationConfig}
					/>
				</PageNavigation>

				<PageMobileNavigation className={"flex items-center justify-between"}>
					<MobileNavigation
						workspace={workspace}
						navigationConfig={navigationConfig}
					/>
				</PageMobileNavigation>

				{/* biome-ignore lint/correctness/useUniqueElementIds: layout renders once per page, skip-to-content targets this ID */}
				<main id="main-content">{children}</main>
			</Page>
		</UserWorkspaceContextProvider>
	);
}

function MobileNavigation({
	workspace,
	navigationConfig,
}: {
	workspace: Awaited<ReturnType<typeof loadUserWorkspace>>;
	navigationConfig: ReturnType<typeof getPersonalAccountNavigationConfig>;
}) {
	return (
		<>
			<AppLogo />

			<HomeMobileNavigation
				workspace={workspace}
				navigationConfig={navigationConfig}
			/>
		</>
	);
}

async function getLayoutState() {
	const cookieStore = await cookies();

	const LayoutStyleSchema = z.enum(["sidebar", "header", "custom"]);

	const layoutStyleCookie = cookieStore.get("layout-style");
	const sidebarOpenCookie = cookieStore.get("sidebar:state");

	const pinnedCookie = cookieStore.get("sidebar:pinned");

	const sidebarOpen = sidebarOpenCookie
		? sidebarOpenCookie.value === "false"
		: !personalAccountNavigationConfig.sidebarCollapsed;

	const parsedStyle = LayoutStyleSchema.safeParse(layoutStyleCookie?.value);

	const style = parsedStyle.success
		? parsedStyle.data
		: personalAccountNavigationConfig.style;

	const pinned = pinnedCookie?.value === "true";

	return {
		open: sidebarOpen,
		style,
		pinned,
	};
}
