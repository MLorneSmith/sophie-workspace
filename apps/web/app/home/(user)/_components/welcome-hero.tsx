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
			"bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
	},
	{
		icon: BookOpen,
		title: "Begin the Course",
		description:
			"Learn proven techniques to structure, design, and deliver compelling presentations.",
		href: "/home/course",
		cta: "Start Learning",
		accentClass: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400",
	},
	{
		icon: Presentation,
		title: "Create a Presentation",
		description:
			"Use AI-powered building blocks to craft your next presentation outline.",
		href: "/home/ai/blocks",
		cta: "Create Now",
		accentClass:
			"bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
	},
];

export function WelcomeHero() {
	return (
		<Card className="border-none bg-gradient-to-br from-indigo-50/80 via-white to-teal-50/60 shadow-sm dark:from-indigo-950/30 dark:via-card dark:to-teal-950/20">
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
			className="group flex flex-col rounded-lg border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-md"
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
