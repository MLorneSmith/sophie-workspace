import { Suspense } from "react";

import { homepageContentConfig } from "~/config/homepage-content.config";
import { withI18n } from "~/lib/i18n/with-i18n";

import { AnimateOnScroll } from "./_components/animate-on-scroll";
import { HomeComparisonSection } from "./_components/home-comparison-section";
import { HomeFeaturesGrid } from "./_components/home-features-grid-client";
import { HeroSection } from "./_components/home-hero-section";
import { HomeHowItWorks } from "./_components/home-how-it-works-client";
import LogoCloudMarquee from "./_components/home-logo-cloud-client";
import { HomePricingSection } from "./_components/home-pricing-section";
import { ProductPreviewSection } from "./_components/home-product-preview-section";
import { HomeStatisticsSection } from "./_components/home-statistics-section";
import HomeStickyScroll from "./_components/home-sticky-scroll-client";
import { HomeTestimonialsSection } from "./_components/home-testimonials-section";
import { HomeBlogSection } from "./_components/home-blog-section";

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

// Enhanced loading states
const SectionLoader: React.FC = () => (
	<div className="animate-pulse space-y-4">
		<div className="mx-auto h-8 w-2/3 rounded-md bg-muted dark:bg-muted" />
		<div className="mx-auto h-4 w-1/2 rounded-md bg-muted dark:bg-muted" />
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<div className="h-64 rounded-lg bg-muted dark:bg-muted" />
			<div className="h-64 rounded-lg bg-muted dark:bg-muted" />
			<div className="h-64 rounded-lg bg-muted dark:bg-muted" />
		</div>
	</div>
);

function Home() {
	return (
		<div className="bg-background dark:bg-background flex flex-col">
			{/* Hero Section */}
			<HeroSection />

			{/* Product Preview Section */}
			<div className="relative z-[1] -mt-[15vh] sm:-mt-[20vh] lg:-mt-[25vh]">
				<ProductPreviewSection />
			</div>

			{/* Logo Cloud Section */}
			<section className={`w-full ${spacing.section} bg-background`}>
				<div className={`${containerBase} ${widths.navigation}`}>
					<AnimateOnScroll>
						<Suspense
							fallback={
								<div className="h-20 animate-pulse rounded-lg bg-muted" />
							}
						>
							<LogoCloudMarquee />
						</Suspense>
					</AnimateOnScroll>
				</div>
			</section>

			{/* Statistics Section */}
			<section className={`w-full ${spacing.section} bg-background`}>
				<div className={`${containerBase} ${widths.content}`}>
					<AnimateOnScroll>
						<HomeStatisticsSection />
					</AnimateOnScroll>
				</div>
			</section>

			{/* Sticky Scroll Section */}
			<section
				className={`w-full ${spacing.section} bg-background dark:bg-background`}
			>
				<div className={`${containerBase} ${widths.content} mb-8`}>
					<h2 className="mb-3 text-center text-3xl leading-snug font-bold sm:mb-4 md:text-4xl lg:text-5xl">
						{homepageContentConfig.sticky.title}
					</h2>
					<p className="text-body sm:text-body-lg mx-auto max-w-4xl text-center leading-relaxed text-muted-foreground dark:text-muted-foreground">
						{homepageContentConfig.sticky.subtitle}
					</p>
				</div>
				<Suspense fallback={<SectionLoader />}>
					<HomeStickyScroll content={homepageContentConfig.sticky.content} />
				</Suspense>
			</section>

			{/* How It Works Section */}
			<section
				className={`${spacing.section} bg-background dark:bg-background`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<Suspense fallback={<SectionLoader />}>
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
				className={`${spacing.section} dark:bg-background bg-secondary/50`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<Suspense fallback={<SectionLoader />}>
						<HomeFeaturesGrid />
					</Suspense>
				</div>
			</section>

			{/* Comparison Section */}
			<section
				className={`${spacing.section} bg-background dark:bg-background`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<AnimateOnScroll>
						<Suspense fallback={<SectionLoader />}>
							<HomeComparisonSection />
						</Suspense>
					</AnimateOnScroll>
				</div>
			</section>

			{/* Testimonials Section */}
			<section
				className={`${spacing.section} bg-background dark:bg-background`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<HomeTestimonialsSection />
				</div>
			</section>

			{/* Pricing Section */}
			<section
				className={`${spacing.section} dark:bg-background bg-secondary/50`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<Suspense fallback={<SectionLoader />}>
						<HomePricingSection />
					</Suspense>
				</div>
			</section>

			{/* Blog Posts Section */}
			<section
				className={`${spacing.section} bg-background dark:bg-background pb-12`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<Suspense fallback={<SectionLoader />}>
						<HomeBlogSection />
					</Suspense>
				</div>
			</section>
		</div>
	);
}

export default withI18n(Home);
