import dynamic from "next/dynamic";
import { Suspense } from "react";

import { homepageContentConfig } from "~/config/homepage-content.config";
import { withI18n } from "~/lib/i18n/with-i18n";

import { AnimateOnScroll } from "./_components/animate-on-scroll";
import { HeroSection } from "./_components/home-hero-section";
import { ProductPreviewSection } from "./_components/home-product-preview-section";
import {
	BlogSkeleton,
	ComparisonSkeleton,
	CtaSkeleton,
	FeaturesSkeleton,
	HowItWorksSkeleton,
	LogoCloudSkeleton,
	PricingSkeleton,
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
const HomeComparisonSection = dynamic(() =>
	import("./_components/home-comparison-section").then((m) => ({
		default: m.HomeComparisonSection,
	})),
);
import { HomeTestimonialsSection } from "./_components/home-testimonials-section";
const HomePricingSection = dynamic(() =>
	import("./_components/home-pricing-section").then((m) => ({
		default: m.HomePricingSection,
	})),
);
const HomeBlogSection = dynamic(() =>
	import("./_components/home-blog-section").then((m) => ({
		default: m.HomeBlogSection,
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

const containerBase = "mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden" as const;

function Home() {
	return (
		<main id="main-content" className="bg-background dark:bg-background flex flex-col">
			{/* Hero Section */}
			<HeroSection />

			{/* Product Preview Section */}
			<div className="relative z-[1] -mt-[15vh] sm:-mt-[20vh] lg:-mt-[25vh]">
				<ProductPreviewSection />
			</div>

			{/* Logo Cloud Section */}
			<section
				aria-label="Trusted by leading companies"
				className={`w-full ${spacing.section} bg-background`}
			>
				<div className={`${containerBase} ${widths.navigation}`}>
					<AnimateOnScroll>
						<Suspense fallback={<LogoCloudSkeleton />}>
							<LogoCloudMarquee />
						</Suspense>
					</AnimateOnScroll>
				</div>
			</section>

			{/* Statistics Section */}
			<section
				aria-label="Platform statistics"
				className={`w-full ${spacing.section} bg-background`}
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
				className={`w-full ${spacing.section} bg-background dark:bg-background`}
			>
				<div className={`${containerBase} ${widths.content} mb-8`}>
					<h2
						id="sticky-scroll-heading"
						className="mb-3 text-center text-3xl leading-snug font-bold sm:mb-4 md:text-4xl lg:text-5xl"
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

			{/* How It Works Section */}
			<section
				aria-label="How it works"
				className={`${spacing.section} bg-background dark:bg-background`}
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

			{/* Comparison Section */}
			<section
				aria-label="Comparison"
				className={`${spacing.section} bg-background dark:bg-background`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<AnimateOnScroll>
						<Suspense fallback={<ComparisonSkeleton />}>
							<HomeComparisonSection />
						</Suspense>
					</AnimateOnScroll>
				</div>
			</section>

			{/* Testimonials Section */}
			<section
				aria-label="Testimonials"
				className={`${spacing.section} bg-background dark:bg-background`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<Suspense fallback={<TestimonialsSkeleton />}>
						<HomeTestimonialsSection />
					</Suspense>
				</div>
			</section>

			{/* Pricing Section */}
			<section
				aria-label="Pricing"
				className={`${spacing.section} dark:bg-background bg-secondary/50`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<Suspense fallback={<PricingSkeleton />}>
						<HomePricingSection />
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
