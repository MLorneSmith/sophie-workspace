"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
} from "@kit/ui/shadcn-sidebar";
import { BarChart, LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppLogo } from "~/components/app-logo";
import { ProfileAccountDropdownContainer } from "~/components/personal-account-dropdown-container";

export function AdminSidebar() {
	const path = usePathname();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className={"m-2"}>
				<AppLogo href={"/admin"} className="max-w-full" />
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Super Admin</SidebarGroupLabel>

					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuButton isActive={path === "/admin"} asChild>
								<Link className={"flex gap-2.5"} href={"/admin"}>
									<LayoutDashboard className={"h-4"} />
									<span>Dashboard</span>
								</Link>
							</SidebarMenuButton>

							<SidebarMenuButton
								isActive={path.includes("/admin/accounts")}
								asChild
							>
								<Link
									className={"flex size-full gap-2.5"}
									href={"/admin/accounts"}
								>
									<Users className={"h-4"} />
									<span>Accounts</span>
								</Link>
							</SidebarMenuButton>

							<SidebarMenuButton
								isActive={path.includes("/admin/tesimonials")}
								asChild
							>
								<Link
									className={"flex size-full gap-2.5"}
									href={"/admin/testimonials"}
								>
									<Users className={"h-4"} />
									<span>Testimonials</span>
								</Link>
							</SidebarMenuButton>

							<SidebarMenuButton
								isActive={path.includes("/admin/api-usage")}
								asChild
							>
								<Link
									className={"flex size-full gap-2.5"}
									href={"/admin/api-usage"}
								>
									<BarChart className={"h-4"} />
									<span>API Usage</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<ProfileAccountDropdownContainer />
			</SidebarFooter>
		</Sidebar>
	);
}
