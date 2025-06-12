import { Suspense } from "react";

import { PricingTable } from "@kit/billing-gateway/marketing";
import { BackgroundBoxes } from "@kit/ui/background-boxes";
import { BlogPostCard } from "@kit/ui/blog-post-card";
import { CardSpotlight } from "@kit/ui/card-spotlight";
import { Hero, Pill, SecondaryHero } from "@kit/ui/marketing";

import billingConfig from "~/config/billing.config";
import { homepageContentConfig } from "~/config/homepage-content.config";
import pathsConfig from "~/config/paths.config";
import { withI18n } from "~/lib/i18n/with-i18n";

import ContainerScroll from "./_components/home-container-scroll-client";
import { CtaPresentationName } from "./_components/home-cta-presentation-name";
import LogoCloudMarquee from "./_components/home-logo-cloud-client";
import OptimizedImage from "./_components/home-optimized-image";
import StickyScrollReveal from "./_components/home-sticky-scroll-client";
import { TestimonialsMasonaryGridServer } from "./_components/home-testimonials-grid-server";

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

const componentSpacing = {
	card: "mb-4 sm:mb-6 md:mb-8",
	grid: "gap-4 sm:gap-6 lg:gap-8",
	stack: "space-y-4 sm:space-y-6 lg:space-y-8",
} as const;

const containerBase = "mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden" as const;

const defaultHeroImage = "/images/video-hero-preview.avif";

// Enhanced loading states
const SectionLoader: React.FC = () => (
	<div className="animate-pulse space-y-4">
		<div className="mx-auto h-8 w-2/3 rounded-md bg-gray-200 dark:bg-gray-800" />
		<div className="mx-auto h-4 w-1/2 rounded-md bg-gray-200 dark:bg-gray-800" />
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<div className="h-64 rounded-lg bg-gray-200 dark:bg-gray-800" />
			<div className="h-64 rounded-lg bg-gray-200 dark:bg-gray-800" />
			<div className="h-64 rounded-lg bg-gray-200 dark:bg-gray-800" />
		</div>
	</div>
);

function Home() {
	return (
		<div className="bg-background dark:bg-background flex flex-col">
			{/* Hero Section */}
			<div className="relative isolate h-[90vh] min-h-[600px]">
				<BackgroundBoxes className="absolute inset-0">
					<div
						className={`flex flex-col items-center ${componentSpacing.stack}`}
					>
						<div className={`${containerBase} ${widths.focused} text-center`}>
							<Hero
								title=<span className="text-display leading-tight tracking-tight">
									{homepageContentConfig.hero.title}{" "}
									<i className="relative inline-block">
										faster
										<span className="animate-highlight absolute -bottom-2 left-0 h-3 w-full -rotate-1 bg-[#24a9e0]/40 [mask-image:linear-gradient(to_right,transparent,white_4%,white_96%,transparent)]" />
									</i>
								</span>
								subtitle={
									<span className="text-body sm:text-body-lg leading-relaxed text-gray-600 dark:text-gray-300">
										{homepageContentConfig.hero.subtitle}
									</span>
								}
							/>
						</div>
						<div className={`${containerBase} ${widths.focused}`}>
							<Suspense
								fallback={
									<div className="h-12 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
								}
							>
								<CtaPresentationName />
							</Suspense>
						</div>
					</div>
				</BackgroundBoxes>
			</div>

			{/* ContainerScroll Section */}
			<div className="relative z-[1] -mt-[15vh] sm:-mt-[20vh] lg:-mt-[25vh]">
				<ContainerScroll>
					<div className="relative h-full w-full">
						<div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent" />
						<OptimizedImage
							src={defaultHeroImage}
							alt="Hero Preview"
							width={1200}
							height={800}
							className="h-full w-full rounded-lg object-cover"
							priority
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
							quality={85}
						/>
					</div>
				</ContainerScroll>
			</div>

			{/* Logo Cloud Section */}
			<div className="bg-background dark:bg-background relative w-full border-y border-gray-100 dark:border-gray-800">
				<div className={`${containerBase} ${widths.navigation}`}>
					<Suspense
						fallback={
							<div className="h-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
						}
					>
						<LogoCloudMarquee className="[&_div[class*='bg-gradient-to-r']]:from-background [&_div[class*='bg-gradient-to-r']]:via-background/90 [&_div[class*='bg-gradient-to-l']]:from-background [&_div[class*='bg-gradient-to-l']]:via-background/90" />
					</Suspense>
				</div>
			</div>

			{/* Sticky Scroll Section */}
			<section
				className={`w-full ${spacing.section} bg-background dark:bg-background`}
			>
				<div className={`${containerBase} ${widths.content} mb-[20vh]`}>
					<h2 className="mb-3 text-center text-3xl leading-snug font-bold sm:mb-4 md:text-4xl lg:text-5xl">
						{homepageContentConfig.sticky.title}
					</h2>
					<p className="text-body sm:text-body-lg mx-auto max-w-4xl text-center leading-relaxed text-gray-600 dark:text-gray-300">
						{homepageContentConfig.sticky.subtitle}
					</p>
				</div>
				<Suspense fallback={<SectionLoader />}>
					<StickyScrollReveal
						content={homepageContentConfig.sticky.content.map(
							(item, index) => ({
								...item,
								content: (
									<OptimizedImage
										key={`sticky-${item.title}`}
										src={item.imageSrc}
										alt={item.title}
										width={1200}
										height={800}
										className="h-full w-full rounded-lg object-cover"
										priority={index === 0}
										loading={index === 0 ? "eager" : "lazy"}
										sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
										quality={85}
									/>
								),
							}),
						)}
					/>
				</Suspense>
			</section>

			{/* Features Section */}
			<section
				className={`${spacing.section} dark:bg-background bg-gray-50/50`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<h2 className="mb-3 text-center text-3xl leading-snug font-bold sm:mb-4 md:text-4xl lg:text-5xl">
						{homepageContentConfig.features.title}
					</h2>
					<p className="text-body sm:text-body-lg mx-auto mb-8 max-w-4xl text-center leading-relaxed text-gray-600 sm:mb-12 dark:text-gray-300">
						{homepageContentConfig.features.subtitle}
					</p>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
						{homepageContentConfig.features.cards.map((card) => (
							<Suspense
								key={`feature-${card.title}`}
								fallback={
									<div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
								}
							>
								<CardSpotlight
									heading={card.title}
									description={card.description}
									iconName={card.iconName}
								/>
							</Suspense>
						))}
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section
				className={`${spacing.section} bg-background dark:bg-background`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<h2 className="mb-3 text-center text-3xl leading-snug font-bold sm:mb-4 md:text-4xl lg:text-5xl">
						{homepageContentConfig.testimonials.title}
					</h2>
					<p className="text-body sm:text-body-lg mx-auto mb-8 max-w-4xl text-center leading-relaxed text-gray-600 sm:mb-12 dark:text-gray-300">
						{homepageContentConfig.testimonials.subtitle}
					</p>
					<Suspense fallback={<SectionLoader />}>
						<TestimonialsMasonaryGridServer />
					</Suspense>
				</div>
			</section>

			{/* Pricing Section */}
			<section
				className={`${spacing.section} dark:bg-background bg-gray-50/50`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<div
						className={`flex flex-col items-center justify-center ${componentSpacing.stack}`}
					>
						<SecondaryHero
							pill={<Pill>{homepageContentConfig.pricing.pill}</Pill>}
							heading={
								<span className="text-h3 sm:text-h2 mb-8 text-center leading-snug sm:mb-12">
									{homepageContentConfig.pricing.title}
								</span>
							}
							subheading={
								<p className="text-body sm:text-body-lg max-w-4xl leading-relaxed text-gray-600 dark:text-gray-300">
									{homepageContentConfig.pricing.subtitle}
								</p>
							}
						/>

						<div className="w-full overflow-x-auto pb-6 sm:pb-0">
							<Suspense fallback={<SectionLoader />}>
								<PricingTable
									config={billingConfig}
									paths={{
										signUp: pathsConfig.auth.signUp,
										return: pathsConfig.app.home,
									}}
								/>
							</Suspense>
						</div>
					</div>
				</div>
			</section>

			{/* Blog Posts Section */}
			<section
				className={`${spacing.section} bg-background dark:bg-background pb-12`}
			>
				<div className={`${containerBase} ${widths.content}`}>
					<h2 className="mb-3 text-center text-3xl leading-snug font-bold sm:mb-4 md:text-4xl lg:text-5xl">
						{homepageContentConfig.essentialReads.title}
					</h2>
					<p className="text-body sm:text-body-lg mx-auto mb-8 max-w-4xl text-center leading-relaxed text-gray-600 sm:mb-12 dark:text-gray-300">
						{homepageContentConfig.essentialReads.subtitle}
					</p>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
						{homepageContentConfig.essentialReads.posts.map((post) => (
							<Suspense
								key={`post-${post.title}`}
								fallback={
									<div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
								}
							>
								<BlogPostCard
									title={post.title}
									description={post.description}
									backgroundImage="/images/posts/blog-post-placeholder.png"
									iconType={post.iconType}
									blogType={post.blogType}
									readTimeMinutes={post.readTimeMinutes}
								/>
							</Suspense>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}

export default withI18n(Home);
