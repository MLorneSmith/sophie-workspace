"use client";

import { NavigationMenuItem } from "@kit/ui/navigation-menu";
import { cn, isRouteActive } from "@kit/ui/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const getClassName = (path: string, currentPathName: string) => {
	const isActive = isRouteActive(path, currentPathName);

	return cn(
		"inline-flex w-max text-sm font-normal transition-colors duration-300",
		{
			"dark:text-white dark:hover:text-white/70": !isActive,
			"text-current dark:text-white": isActive,
		},
	);
};

export function SiteNavigationItem({
	path,
	children,
}: React.PropsWithChildren<{
	path: string;
}>) {
	const currentPathName = usePathname();
	const className = getClassName(path, currentPathName);

	return (
		<NavigationMenuItem key={path}>
			<Link className={className} href={path} as={path} prefetch={true}>
				{children}
			</Link>
		</NavigationMenuItem>
	);
}
