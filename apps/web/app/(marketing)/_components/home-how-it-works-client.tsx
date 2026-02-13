"use client";

import {
	BookOpen,
	LayoutDashboard,
	type LucideIcon,
	Presentation,
	Sparkles,
} from "lucide-react";

import type { HowItWorksStep } from "~/config/homepage-content.config";

const iconMap: Record<string, LucideIcon> = {
	BookOpen,
	LayoutDashboard,
	Presentation,
	Sparkles,
};

interface HowItWorksProps {
	title: string;
	subtitle: string;
	steps: HowItWorksStep[];
}

export function HomeHowItWorks({ title, subtitle, steps }: HowItWorksProps) {
	return (
		<div className="w-full">
			<h2 className="mb-3 text-center text-3xl leading-snug font-bold sm:mb-4 md:text-4xl lg:text-5xl">
				{title}
			</h2>
			<p className="text-body sm:text-body-lg mx-auto mb-8 max-w-4xl text-center leading-relaxed text-muted-foreground sm:mb-12 dark:text-muted-foreground">
				{subtitle}
			</p>

			<ol className="relative flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-4 list-none p-0">
				{steps.map((step) => {
					const Icon = iconMap[step.iconName];

					return (
						<li
							key={step.stepNumber}
							className="relative z-10 flex w-full max-w-[240px] flex-col items-center text-center"
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
						</li>
					);
				})}
			</ol>
		</div>
	);
}
