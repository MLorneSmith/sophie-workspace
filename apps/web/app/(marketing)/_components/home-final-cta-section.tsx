"use client";

import { CtaButton, GradientText } from "@kit/ui/marketing";
import { Check } from "lucide-react";
import Link from "next/link";

import type { FinalCtaConfig } from "~/config/homepage-content.config";

import { AnimateOnScroll } from "./animate-on-scroll";

interface HomeFinalCtaSectionProps {
	config: FinalCtaConfig;
}

export function HomeFinalCtaSection({ config }: HomeFinalCtaSectionProps) {
	return (
		<div className="relative isolate overflow-hidden py-16 sm:py-20 lg:py-28">
			{/* Gradient orb background */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
			>
				<div className="h-[500px] w-[500px] rounded-full bg-[#24a9e0]/20 blur-[80px]" />
			</div>

			{/* Content */}
			<div className="relative z-10">
				<AnimateOnScroll>
					<div className="flex flex-col items-center text-center">
						<h2 className="mb-4 text-3xl leading-tight font-bold sm:mb-6 sm:text-4xl lg:text-5xl">
							<GradientText variant="cyan">{config.headline}</GradientText>
						</h2>

						<p className="mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:mb-10 sm:text-xl">
							{config.subheadline}
						</p>

						{/* CTA buttons */}
						<div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:gap-4">
							<CtaButton>
								<Link href={config.primaryCta.href}>
									{config.primaryCta.label}
								</Link>
							</CtaButton>
							<CtaButton variant="outline">
								<Link href={config.secondaryCta.href}>
									{config.secondaryCta.label}
								</Link>
							</CtaButton>
						</div>

						{/* Trust badges */}
						<div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
							{config.trustBadges.map((badge) => (
								<div
									key={badge}
									className="flex items-center gap-2 text-sm text-muted-foreground"
								>
									<Check className="h-4 w-4 text-[var(--homepage-accent)]" />
									<span>{badge}</span>
								</div>
							))}
						</div>
					</div>
				</AnimateOnScroll>
			</div>
		</div>
	);
}
