"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

import { homepageContentConfig } from "~/config/homepage-content.config";

import { useCountUp } from "../_hooks/use-count-up";

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

function parseNumericValue(value: string): number {
	return Number.parseFloat(value.replace(/,/g, ""));
}

function StatBlock({
	value,
	suffix,
	prefix,
	label,
	skipAnimation,
}: {
	value: string;
	suffix?: string;
	prefix?: string;
	label: string;
	skipAnimation?: boolean;
}) {
	const numericValue = parseNumericValue(value);
	const hasDecimal = value.includes(".");

	const ref = useCountUp({
		target: numericValue,
		duration: 2,
		formatter: hasDecimal
			? (v) => v.toFixed(1)
			: (v) => Math.round(v).toLocaleString(),
		disabled: skipAnimation,
	});

	const fullValue = `${prefix ?? ""}${value}${suffix ?? ""}`;

	return (
		<motion.li
			className="text-center"
			variants={skipAnimation ? undefined : itemVariants}
		>
			<div className="text-4xl font-bold tracking-tight text-[#24a9e0] sm:text-5xl">
				<span className="sr-only">{fullValue}</span>
				<span aria-hidden="true">
					{prefix}
					<span ref={ref}>
						{skipAnimation
							? hasDecimal
								? numericValue.toFixed(1)
								: Math.round(numericValue).toLocaleString()
							: "0"}
					</span>
					{suffix}
				</span>
			</div>
			<p className="mt-2 text-sm font-normal text-muted-foreground sm:text-base">
				{label}
			</p>
		</motion.li>
	);
}

export function HomeStatisticsSection() {
	const prefersReducedMotion = useReducedMotion();
	const { statistics } = homepageContentConfig;

	return (
		<div>
			<h2 className="sr-only">Platform statistics</h2>
			<motion.ul
				role="list"
				className="grid grid-cols-2 gap-8 md:grid-cols-4"
				variants={prefersReducedMotion ? undefined : containerVariants}
				initial={prefersReducedMotion ? "visible" : "hidden"}
				whileInView="visible"
				viewport={{ once: true, amount: 0.3 }}
			>
				{statistics.map((stat) => (
					<StatBlock
						key={stat.label}
						value={stat.value}
						suffix={stat.suffix}
						prefix={stat.prefix}
						label={stat.label}
						skipAnimation={!!prefersReducedMotion}
					/>
				))}
			</motion.ul>
		</div>
	);
}
