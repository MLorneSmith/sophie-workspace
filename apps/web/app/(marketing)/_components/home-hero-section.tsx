"use client";

import { CtaButton, GradientText, Pill } from "@kit/ui/marketing";
import { m, type Variants } from "motion/react";
import Link from "next/link";

import { homepageContentConfig } from "~/config/homepage-content.config";

import { LetterReveal } from "./home-hero-letter-reveal";
import { SocialProofStrip } from "./home-hero-social-proof";

const staggerContainer: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.2,
			delayChildren: 0.1,
		},
	},
};

const fadeUp: Variants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { type: "spring", damping: 25, stiffness: 200 },
	},
};

const { hero } = homepageContentConfig;

export function HeroSection() {
	return (
		<section className="relative isolate flex min-h-[600px] items-center justify-center overflow-hidden bg-background py-20 lg:min-h-screen">
			{/* Gradient Orb Background */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
			>
				<div className="h-[600px] w-[600px] rounded-full bg-[#24a9e0]/20 blur-[128px]" />
			</div>

			{/* Content */}
			<m.div
				className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8"
				variants={staggerContainer}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, amount: 0.3 }}
			>
				{/* Pill Badge */}
				<m.div variants={fadeUp}>
					<Pill>{hero.pillText}</Pill>
				</m.div>

				{/* Headline with Letter Reveal */}
				<LetterReveal
					text={`${hero.title} `}
					className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
				>
					<GradientText variant="cyan" className="inline">
						faster
					</GradientText>
				</LetterReveal>

				{/* Subtitle */}
				<m.p
					variants={fadeUp}
					className="max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
				>
					{hero.subtitle}
				</m.p>

				{/* CTA Buttons */}
				<m.div variants={fadeUp} className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
					<CtaButton className="min-h-[44px] w-full sm:w-auto">
						<Link href={hero.ctaPrimary.href}>{hero.ctaPrimary.label}</Link>
					</CtaButton>
					<CtaButton variant="outline" className="min-h-[44px] w-full sm:w-auto">
						<Link href={hero.ctaSecondary.href}>{hero.ctaSecondary.label}</Link>
					</CtaButton>
				</m.div>

				{/* Social Proof */}
				<m.div variants={fadeUp}>
					<SocialProofStrip
						avatarCount={hero.socialProof.avatarCount}
						label={hero.socialProof.label}
					/>
				</m.div>
			</m.div>
		</section>
	);
}
