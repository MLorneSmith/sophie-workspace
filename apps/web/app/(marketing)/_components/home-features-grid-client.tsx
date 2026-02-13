"use client";

import { type Variants, motion } from "motion/react";

import { homepageContentConfig } from "~/config/homepage-content.config";

import { BentoFeatureCard } from "./bento-feature-card";

const containerVariants: Variants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.15,
		},
	},
};

const itemVariants: Variants = {
	hidden: { opacity: 0, y: 24 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function HomeFeaturesGrid() {
	const { title, subtitle, cards } = homepageContentConfig.features;

	return (
		<div>
			<h2 className="mb-3 text-center text-3xl leading-snug font-bold sm:mb-4 md:text-4xl lg:text-5xl">
				{title}
			</h2>
			<p className="text-body sm:text-body-lg mx-auto mb-8 max-w-4xl text-center leading-relaxed text-muted-foreground sm:mb-12 dark:text-muted-foreground">
				{subtitle}
			</p>

			<motion.div
				role="grid"
				className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8"
				variants={containerVariants}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, margin: "-100px" }}
			>
				{cards.map((card) => (
					<motion.div key={card.title} variants={itemVariants}>
						<BentoFeatureCard
							title={card.title}
							description={card.description}
							iconName={card.iconName}
							size={card.size}
						/>
					</motion.div>
				))}
			</motion.div>
		</div>
	);
}
