"use client";

import { type Variants, motion } from "motion/react";

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
}: {
	value: string;
	suffix?: string;
	prefix?: string;
	label: string;
}) {
	const numericValue = parseNumericValue(value);
	const hasDecimal = value.includes(".");

	const ref = useCountUp({
		target: numericValue,
		duration: 2,
		formatter: hasDecimal
			? (v) => v.toFixed(1)
			: (v) => Math.round(v).toLocaleString(),
	});

	return (
		<motion.li className="text-center" variants={itemVariants}>
			<div className="text-4xl font-bold tracking-tight text-[#24a9e0] sm:text-5xl">
				{prefix}
				<span ref={ref}>0</span>
				{suffix}
			</div>
			<p className="mt-2 text-sm font-medium text-muted-foreground sm:text-base">
				{label}
			</p>
		</motion.li>
	);
}

export function HomeStatisticsSection() {
	const { statistics } = homepageContentConfig;

	return (
		<motion.ul
			role="list"
			className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
			variants={containerVariants}
			initial="hidden"
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
				/>
			))}
		</motion.ul>
	);
}
