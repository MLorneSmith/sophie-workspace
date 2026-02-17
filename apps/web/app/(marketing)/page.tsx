import dynamic from "next/dynamic";
import { Suspense } from "react";

import { homepageContentConfig } from "~/config/homepage-content.config";
import { withI18n } from "~/lib/i18n/with-i18n";

import { AnimateOnScroll } from "./_components/animate-on-scroll";
import { CausticsBackground } from "./_components/caustics-background";
import { HeroGradientEffect } from "./_components/hero-gradient-effect";
import { HomeFoundersMessage } from "./_components/home-founders-message";
import { HeroSection } from "./_components/home-hero-section";
import { PresentationShowcase } from "./_components/home-presentation-showcase";
import { ProductPreviewSection } from "./_components/home-product-preview-section";
import {
	BlogSkeleton,
	CtaSkeleton,
	FaqSkeleton,
	FeaturesSkeleton,
	HowItWorksSkeleton,
	LogoCloudSkeleton,
	StatisticsSkeleton,
	StickyScrollSkeleton,
	TestimonialsSkeleton,
} from "./_components/section-skeleton";

const LogoCloudMarquee = dynamic(
	() => import("./_components/home-logo-cloud-client"),
);
const HomeStatisticsSection = dynamic(() =>
	import("./_components/home-statistics-section").then((m) => ({
		default: m.HomeStatisticsSection,
	})),
);
const HomeStickyScroll = dynamic(
	() => import("./_components/home-sticky-scroll-client"),
);
const HomeHowItWorks = dynamic(() =>
	import("./_components/home-how-it-works-client").then((m) => ({
		default: m.HomeHowItWorks,
	})),
);
const HomeFeaturesGrid = dynamic(() =>
	import("./_components/home-features-grid-client").then((m) => ({
		default: m.HomeFeaturesGrid,
	})),
);

import { HomeTestimonialsSection } from "./_components/home-testimonials-section";

const HomeBlogSection = dynamic(() =>
	import("./_components/home-blog-section").then((m) => ({
		default: m.HomeBlogSection,
	})),
);
const HomeFaqSection = dynamic(() =>
	import("./_components/home-faq-section").then((m) => ({
		default: m.HomeFaqSection,
	})),
);
const HomeFinalCtaSection = dynamic(() =>
	import("./_components/home-final-cta-section").then((m) => ({
		default: m.HomeFinalCtaSection,
	})),
);

// Width system
const widths = {
	navigation: "max-w-7xl", // 1280px - Header & Footer
	content: "max-w-6xl", // 1152px - Standard content
	focused: "max-w-5xl", // 1024px - Hero & key messages
} as const;

// Standardized spacing system - Optimized for mobile
const spacing = {
	sm: "gap-4 my-4",
	md: "gap-6 my-6",
	lg: "gap-8 my-8",
	xl: "gap-12 my-12",
	section: "mt-8 sm:mt-12 md:mt-16 lg:mt-24",
} as const;

const containerBase = "mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden" as const;

function SectionDivider() {
	return (
		<div
			aria-hidden="true"
			className="mx-auto hidden h-px w-full max-w-7xl px-4 dark:block sm:px-6 lg:px-8"
			style={{
				background:
					"radial-gradient(ellipse at center, var(--homepage-border, #2a2a3a) 0%, transparent 70%)",
			}}
		/>
	);
}

function Home() {
	return (
		// biome-ignore lint/correctness/useUniqueElementIds: skip-to-content anchor target, only rendered once
		<main
			id="main-content"
			className="bg-background dark:bg-background flex flex-col"
		>
			{/* Hero + Product Preview + Showcase — unified caustics background */}
			<div className="relative overflow-hidden bg-black">
				{/* Caustics background covers entire dark zone */}
				<CausticsBackground fallback={<HeroGradientEffect />} />

				{/* Hero Section */}
				<HeroSection />

				{/* Product Preview — overlaps hero */}
				<div className="relative z-[2] -mt-[22vh] sm:-mt-[28vh] lg:-mt-[35vh]">
					<ProductPreviewSection />
				</div>

				{/* Presentation Showcase */}
				<div className="relative z-[5]">
					<PresentationShowcase />
				</div>
			</div>

			{/* Founder's Message */}
			<HomeFoundersMessage />

			{/* Logo Cloud Section */}
			<section
				aria-label="Trusted by leading companies"
				className="w-full bg-black py-10 sm:py-12 md:py-16 lg:py-20"
			>
				<AnimateOnScroll>
					<Suspense fallback={<LogoCloudSkeleton />}>
						<LogoCloudMarquee />
					</Suspense>
				</AnimateOnScroll>
			</section>

			<SectionDivider />

			{/* Statistics Section */}
			<section
				aria-label="Platform statistics"
				className={"w-full bg-black py-10 sm:py-12 md:py-16 lg:py-20"}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<AnimateOnScroll>
						<Suspense fallback={<StatisticsSkeleton />}>
							<HomeStatisticsSection />
						</Suspense>
					</AnimateOnScroll>
				</div>
			</section>

			{/* Sticky Scroll Section */}
			<section
				aria-labelledby="sticky-scroll-heading"
				className="w-full bg-black pt-8 sm:pt-12 md:pt-16 lg:pt-24 pb-8 sm:pb-12 md:pb-16 lg:pb-24"
			>
				<div className={`${containerBase} ${widths.content} mb-8`}>
					{/* biome-ignore lint/correctness/useUniqueElementIds: aria-labelledby target, page rendered once */}
					<h2
						id="sticky-scroll-heading"
						className="text-h3 sm:text-h2 mb-3 text-center sm:mb-4"
					>
						{homepageContentConfig.sticky.title}
					</h2>
					<p className="text-body sm:text-body-lg mx-auto max-w-4xl text-center leading-relaxed text-muted-foreground dark:text-muted-foreground">
						{homepageContentConfig.sticky.subtitle}
					</p>
				</div>
				<Suspense fallback={<StickyScrollSkeleton />}>
					<HomeStickyScroll content={homepageContentConfig.sticky.content} />
				</Suspense>
			</section>

			<SectionDivider />

			{/* How It Works Section */}
			<section
				aria-label="How it works"
				className={`${spacing.section} relative z-10 overflow-hidden bg-black`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<Suspense fallback={<HowItWorksSkeleton />}>
						<HomeHowItWorks
							title={homepageContentConfig.howItWorks.title}
							subtitle={homepageContentConfig.howItWorks.subtitle}
							steps={homepageContentConfig.howItWorks.steps}
						/>
					</Suspense>
				</div>
			</section>

			<SectionDivider />

			{/* Features Section */}
			<section
				aria-label="Features"
				className={`${spacing.section} dark:bg-background bg-secondary/50`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<Suspense fallback={<FeaturesSkeleton />}>
						<HomeFeaturesGrid />
					</Suspense>
				</div>
			</section>

			{/* Testimonials Section */}
			<section
				aria-label="Testimonials"
				className={`${spacing.section} w-full bg-black py-10 sm:py-12 md:py-16 lg:py-20`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<Suspense fallback={<TestimonialsSkeleton />}>
						<HomeTestimonialsSection />
					</Suspense>
				</div>
			</section>

			{/* Blog Posts Section */}
			<section
				aria-label="Essential reads"
				className={`${spacing.section} bg-background dark:bg-background pb-12`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<Suspense fallback={<BlogSkeleton />}>
						<HomeBlogSection />
					</Suspense>
				</div>
			</section>

			{/* FAQ Section */}
			<section
				aria-label="Frequently asked questions"
				className={`${spacing.section} bg-background dark:bg-background pb-12`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<Suspense fallback={<FaqSkeleton />}>
						<HomeFaqSection />
					</Suspense>
				</div>
			</section>

			{/* Final CTA Section */}
			<section
				aria-label="Get started"
				className={`${spacing.section} bg-background dark:bg-background pb-12`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<Suspense fallback={<CtaSkeleton />}>
						<HomeFinalCtaSection config={homepageContentConfig.finalCta} />
					</Suspense>
				</div>
			</section>
		</main>
	);
}

export default withI18n(Home);
