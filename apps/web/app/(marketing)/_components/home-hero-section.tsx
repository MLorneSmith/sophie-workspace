"use client";

import { CtaButton } from "@kit/ui/marketing";
import { m, useReducedMotion, type Variants } from "motion/react";
import Link from "next/link";

import { homepageContentConfig } from "~/config/homepage-content.config";

const staggerContainer: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.15,
			delayChildren: 0.1,
		},
	},
};

const fadeUp: Variants = {
	hidden: { opacity: 0, y: 24 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] },
	},
};

const { hero } = homepageContentConfig;

export function HeroSection() {
	const prefersReducedMotion = useReducedMotion();

	return (
		<section
			aria-label="Hero"
			className="relative flex min-h-[600px] items-start justify-center pt-20 pb-24 lg:min-h-screen lg:pb-32"
		>
			{/* Content */}
			<m.div
				className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8"
				variants={prefersReducedMotion ? undefined : staggerContainer}
				initial={prefersReducedMotion ? "visible" : "hidden"}
				whileInView="visible"
				viewport={{ once: true, amount: 0.3 }}
			>
				{/* Headline */}
				<m.h1
					variants={prefersReducedMotion ? undefined : fadeUp}
					className="text-5xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[5.5rem]"
				>
					{hero.title}
				</m.h1>

				{/* Subtitle */}
				<m.p
					variants={prefersReducedMotion ? undefined : fadeUp}
					className="max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
				>
					{hero.subtitle}
				</m.p>

				{/* CTA Buttons */}
				<m.div
					variants={prefersReducedMotion ? undefined : fadeUp}
					className="flex w-full flex-col gap-4 pt-2 sm:w-auto sm:flex-row"
				>
					<CtaButton className="min-h-[44px] w-full sm:w-auto">
						<Link href={hero.ctaPrimary.href}>{hero.ctaPrimary.label}</Link>
					</CtaButton>
					<CtaButton
						variant="outline"
						className="min-h-[44px] w-full sm:w-auto"
					>
						<Link href={hero.ctaSecondary.href}>{hero.ctaSecondary.label}</Link>
					</CtaButton>
				</m.div>
			</m.div>
		</section>
	);
}
