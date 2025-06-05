"use client";

import type { LogoCloudMarquee as BaseLogoCloudMarquee } from "@kit/ui/logo-marquee";
import dynamic from "next/dynamic";

const LogoCloudMarquee = dynamic<
	React.ComponentProps<typeof BaseLogoCloudMarquee>
>(() => import("@kit/ui/logo-marquee").then((mod) => mod.LogoCloudMarquee), {
	ssr: true,
	loading: () => (
		<div className="h-20 animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg" />
	),
});

export default LogoCloudMarquee;
