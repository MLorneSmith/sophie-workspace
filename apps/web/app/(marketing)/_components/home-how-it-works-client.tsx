"use client";

import {
	BookOpen,
	LayoutDashboard,
	type LucideIcon,
	Presentation,
	Sparkles,
} from "lucide-react";
import {
	type Variants,
	motion,
	useInView,
	useReducedMotion,
} from "motion/react";
import { useRef } from "react";

import type { HowItWorksStep } from "~/config/homepage-content.config";

const iconMap: Record<string, LucideIcon> = {
	BookOpen,
	LayoutDashboard,
	Presentation,
	Sparkles,
};

const containerVariants: Variants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.2,
			delayChildren: 0.3,
		},
	},
};

const itemVariants: Variants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface HowItWorksProps {
	title: string;
	subtitle: string;
	steps: HowItWorksStep[];
}

export function HomeHowItWorks({ title, subtitle, steps }: HowItWorksProps) {
	const sectionRef = useRef<HTMLDivElement>(null);
	const isInView = useInView(sectionRef, { once: true, amount: 0.3 });
	const prefersReducedMotion = useReducedMotion();

	const showLine = prefersReducedMotion || isInView;

	return (
		<div ref={sectionRef} className="w-full">
			<h2 className="mb-3 text-center text-3xl leading-snug font-bold sm:mb-4 md:text-4xl lg:text-5xl">
				{title}
			</h2>
			<p className="text-body sm:text-body-lg mx-auto mb-8 max-w-4xl text-center leading-relaxed text-muted-foreground sm:mb-12 dark:text-muted-foreground">
				{subtitle}
			</p>

			<motion.ol
				className="relative flex flex-col items-center gap-8 list-none p-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
				variants={prefersReducedMotion ? undefined : containerVariants}
				initial={prefersReducedMotion ? "visible" : "hidden"}
				whileInView="visible"
				viewport={{ once: true, amount: 0.3 }}
			>
				{/* Connecting line behind steps (hidden on mobile/column layout) */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute top-7 right-[calc(12.5%)] left-[calc(12.5%)] z-0 hidden h-0.5 bg-border sm:block"
					style={{
						transformOrigin: "left",
						transform: showLine ? "scaleX(1)" : "scaleX(0)",
						transition: prefersReducedMotion
							? "none"
							: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
					}}
				/>

				{steps.map((step) => {
					const Icon = iconMap[step.iconName];

					return (
						<motion.li
							key={step.stepNumber}
							className="relative z-10 flex w-full max-w-[240px] flex-col items-center text-center"
							variants={prefersReducedMotion ? undefined : itemVariants}
						>
							<div className="relative mb-4">
								<div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/10">
									{Icon ? <Icon className="h-6 w-6 text-primary" /> : null}
								</div>
								<span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
									{step.stepNumber}
								</span>
							</div>
							<h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
							<p className="text-sm leading-relaxed text-muted-foreground">
								{step.description}
							</p>
						</motion.li>
					);
				})}
			</motion.ol>
		</div>
	);
}
