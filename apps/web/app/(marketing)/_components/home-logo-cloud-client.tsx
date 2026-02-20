"use client";

import type { LogoCloudMarquee as BaseLogoCloudMarquee } from "@kit/ui/logo-marquee";
import dynamic from "next/dynamic";

import { homepageContentConfig } from "~/config/homepage-content.config";

const LogoCloudMarquee = dynamic<
	React.ComponentProps<typeof BaseLogoCloudMarquee>
>(() => import("@kit/ui/logo-marquee").then((mod) => mod.LogoCloudMarquee), {
	ssr: true,
	loading: () => (
		<div
			className="h-20 animate-pulse rounded-lg bg-muted"
			aria-hidden="true"
		/>
	),
});

export default function HomeLogoCloud() {
	return (
		<LogoCloudMarquee
			mode="single"
			title={homepageContentConfig.logoCloud.heading}
			description=""
			speed={homepageContentConfig.logoCloud.marqueeSpeed}
		/>
	);
}
