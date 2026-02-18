"use client";

import {
	BookOpen,
	ClipboardList,
	Presentation,
	ArrowRight,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@kit/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@kit/ui/card";

interface WelcomeStep {
	icon: React.ElementType;
	title: string;
	description: string;
	href: string;
	cta: string;
	accentClass: string;
}

const steps: WelcomeStep[] = [
	{
		icon: ClipboardList,
		title: "Take Your Skills Assessment",
		description:
			"Discover your presentation strengths across 5 core categories in under 5 minutes.",
		href: "/home/assessment/survey",
		cta: "Start Assessment",
		accentClass:
			"bg-[#2431E0]/10 text-[#2431E0] dark:bg-[#2431E0]/15 dark:text-[#246CE0]",
	},
	{
		icon: BookOpen,
		title: "Begin the Course",
		description:
			"Learn proven techniques to structure, design, and deliver compelling presentations.",
		href: "/home/course",
		cta: "Start Learning",
		accentClass:
			"bg-[#24A9E0]/10 text-[#24A9E0] dark:bg-[#24A9E0]/15 dark:text-[#24E0DD]",
	},
	{
		icon: Presentation,
		title: "Create a Presentation",
		description:
			"Use AI-powered building blocks to craft your next presentation outline.",
		href: "/home/ai/blocks",
		cta: "Create Now",
		accentClass:
			"bg-[#24E09D]/10 text-[#24E09D] dark:bg-[#24E09D]/15 dark:text-[#24E09D]",
	},
];

export function WelcomeHero() {
	return (
		<Card className="border-none bg-gradient-to-br from-[#24a9e0]/[0.03] via-card to-[#24E0DD]/[0.03] shadow-sm dark:from-[#24a9e0]/[0.06] dark:via-card dark:to-[#24E0DD]/[0.04]">
			<CardHeader className="pb-2">
				<CardTitle className="font-heading text-2xl tracking-tight">
					Welcome to SlideHeroes
				</CardTitle>
				<CardDescription className="text-base">
					Your presentation coaching journey starts here. Pick a path below to
					get going.
				</CardDescription>
			</CardHeader>

			<CardContent>
				<div className="grid gap-3 sm:grid-cols-3">
					{steps.map((step) => (
						<StepCard key={step.href} step={step} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function StepCard({ step }: { step: WelcomeStep }) {
	const Icon = step.icon;

	return (
		<Link
			href={step.href}
			className="group flex flex-col rounded-lg border bg-card p-4 transition-all hover:border-[#24a9e0]/20 hover:shadow-sm dark:hover:shadow-none"
		>
			<div
				className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${step.accentClass}`}
			>
				<Icon className="h-5 w-5" aria-hidden="true" />
			</div>

			<h3 className="font-heading mb-1 text-sm font-semibold">{step.title}</h3>
			<p className="mb-4 flex-1 text-xs text-muted-foreground">
				{step.description}
			</p>

			<Button
				variant="ghost"
				size="sm"
				className="w-full justify-between text-xs"
				tabIndex={-1}
				aria-hidden="true"
			>
				{step.cta}
				<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
			</Button>
		</Link>
	);
}
