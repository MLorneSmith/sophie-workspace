"use client";

import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import {
	BarChart3,
	BookOpen,
	Brain,
	GitBranch,
	LayoutDashboard,
	LayoutPanelTop,
	Layers,
	type LucideIcon,
	Presentation,
	Rocket,
	Sparkles,
	Target,
	UserCircle,
} from "lucide-react";
import { type MouseEvent as ReactMouseEvent, useState } from "react";

import { cn } from "@kit/ui/utils";

import type { IconName } from "~/config/homepage-content.config";

const IconMap: Record<IconName, LucideIcon> = {
	Brain,
	Presentation,
	BookOpen,
	LayoutDashboard,
	Sparkles,
	BarChart3,
	UserCircle,
	Target,
	Layers,
	GitBranch,
	LayoutPanelTop,
	Rocket,
};

interface BentoFeatureCardProps {
	title: string;
	description: string;
	iconName: IconName;
	size: "large" | "standard";
	className?: string;
}

export function BentoFeatureCard({
	title,
	description,
	iconName,
	size,
	className,
}: BentoFeatureCardProps) {
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);
	const [isHovering, setIsHovering] = useState(false);

	const prefersReducedMotion =
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	function handleMouseMove({
		currentTarget,
		clientX,
		clientY,
	}: ReactMouseEvent<HTMLDivElement>) {
		if (prefersReducedMotion) return;
		const { left, top } = currentTarget.getBoundingClientRect();
		mouseX.set(clientX - left);
		mouseY.set(clientY - top);
	}

	const maskImage = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, white, transparent 80%)`;

	const Icon = IconMap[iconName];

	return (
		<motion.article
			className={cn(
				"group/bento relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8",
				size === "large" && "col-span-1 sm:col-span-2",
				className,
			)}
			onMouseMove={handleMouseMove}
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
		>
			{/* Cursor-following glow overlay */}
			{!prefersReducedMotion && (
				<motion.div
					initial={false}
					animate={{ opacity: isHovering ? 1 : 0 }}
					transition={{ duration: 0.3 }}
					className="pointer-events-none absolute inset-0 z-0 rounded-xl"
					aria-hidden="true"
					style={{
						background:
							"radial-gradient(circle, rgba(6, 182, 212, 0.15), transparent 60%)",
						maskImage,
						WebkitMaskImage: maskImage,
					}}
				/>
			)}

			{/* Card content */}
			<div className="relative z-10 flex h-full flex-col gap-4">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
						<Icon className="h-5 w-5 text-cyan-400" />
					</div>
					<h3 className="text-lg font-semibold text-foreground">{title}</h3>
				</div>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{description}
				</p>
			</div>
		</motion.article>
	);
}
