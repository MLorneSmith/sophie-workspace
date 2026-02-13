"use client";

import { Check, X } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import type { ComparisonItem } from "~/config/homepage-content.config";
import { homepageContentConfig } from "~/config/homepage-content.config";

const containerVariants: Variants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const itemVariants: Variants = {
	hidden: { opacity: 0, y: 16 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function ComparisonCard({
	title,
	items,
	variant,
}: {
	title: string;
	items: ComparisonItem[];
	variant: "without" | "with";
}) {
	const prefersReducedMotion = useReducedMotion();
	const isWithout = variant === "without";

	return (
		<div
			className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-sm ${
				isWithout
					? "border-border/50 bg-muted/30"
					: "border-[#24a9e0]/30 bg-[#24a9e0]/5"
			}`}
		>
			<h3
				className={`mb-6 text-xl font-semibold sm:text-2xl ${
					isWithout ? "text-muted-foreground" : "text-[#24a9e0]"
				}`}
			>
				{title}
			</h3>
			<motion.ul
				role="list"
				className="space-y-4"
				variants={prefersReducedMotion ? undefined : containerVariants}
				initial={prefersReducedMotion ? "visible" : "hidden"}
				whileInView="visible"
				viewport={{ once: true, amount: 0.3 }}
			>
				{items.map((item) => (
					<motion.li
						key={item.text}
						className="flex items-start gap-3"
						variants={prefersReducedMotion ? undefined : itemVariants}
					>
						{isWithout ? (
							<X
								className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
								aria-label="Not included"
							/>
						) : (
							<Check
								className="mt-0.5 h-5 w-5 shrink-0 text-[#24a9e0]"
								aria-label="Included"
							/>
						)}
						<span
							className={`text-sm leading-relaxed sm:text-base ${
								isWithout ? "text-muted-foreground" : "text-foreground"
							}`}
						>
							{item.text}
						</span>
					</motion.li>
				))}
			</motion.ul>
		</div>
	);
}

export function HomeComparisonSection() {
	const { comparison } = homepageContentConfig;

	return (
		<div className="w-full">
			<h2 className="mb-3 text-center text-3xl leading-snug font-bold sm:mb-4 md:text-4xl lg:text-5xl">
				{comparison.title}
			</h2>
			<p className="text-body sm:text-body-lg mx-auto mb-8 max-w-4xl text-center leading-relaxed text-muted-foreground sm:mb-12 dark:text-muted-foreground">
				{comparison.subtitle}
			</p>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
				<ComparisonCard
					title="Without SlideHeroes"
					items={comparison.withoutItems}
					variant="without"
				/>
				<ComparisonCard
					title="With SlideHeroes"
					items={comparison.withItems}
					variant="with"
				/>
			</div>
		</div>
	);
}
