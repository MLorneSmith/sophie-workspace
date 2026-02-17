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
			<h2 className="text-h3 sm:text-h2 mb-3 text-center sm:mb-4">
				{testimonials.title}
			</h2>
			<p className="text-body sm:text-body-lg mx-auto mb-8 max-w-4xl text-center leading-relaxed text-muted-foreground sm:mb-12 dark:text-muted-foreground">
				{testimonials.subtitle}
			</p>
			<AnimateOnScroll delay={0.2}>
				<Suspense fallback={<SectionLoader />}>
					<TestimonialsMasonaryGridServer />
				</Suspense>
			</AnimateOnScroll>
		</div>
	);
}
