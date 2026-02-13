import { SecondaryHero } from "@kit/ui/marketing";
import { Suspense } from "react";

import { homepageContentConfig } from "~/config/homepage-content.config";

import { AnimateOnScroll } from "./animate-on-scroll";
import { TestimonialsMasonaryGridServer } from "./home-testimonials-grid-server";

const SectionLoader: React.FC = () => (
	<div
		className="animate-pulse space-y-4"
		role="status"
		aria-label="Loading testimonials"
	>
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div className="h-48 rounded-xl bg-muted/30" />
			<div className="h-48 rounded-xl bg-muted/30" />
			<div className="h-48 rounded-xl bg-muted/30" />
			<div className="h-48 rounded-xl bg-muted/30" />
		</div>
	</div>
);

export function HomeTestimonialsSection() {
	const { testimonials } = homepageContentConfig;

	return (
		<div className="w-full">
			<SecondaryHero
				heading={
					<span className="text-h3 sm:text-h2 mb-4 text-center leading-snug sm:mb-6">
						{testimonials.title}
					</span>
				}
				subheading={
					<p className="text-body sm:text-body-lg max-w-4xl leading-relaxed text-muted-foreground dark:text-muted-foreground">
						{testimonials.subtitle}
					</p>
				}
			/>
			<AnimateOnScroll delay={0.2}>
				<Suspense fallback={<SectionLoader />}>
					<TestimonialsMasonaryGridServer />
				</Suspense>
			</AnimateOnScroll>
		</div>
	);
}
