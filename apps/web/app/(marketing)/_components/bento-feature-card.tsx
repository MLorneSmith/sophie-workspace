"use client";

import { cn } from "@kit/ui/utils";
import {
	Award,
	BarChart3,
	BookOpen,
	Brain,
	GitBranch,
	Layers,
	LayoutDashboard,
	LayoutPanelTop,
	type LucideIcon,
	Presentation,
	Rocket,
	ShieldCheck,
	Sparkles,
	Target,
	UserCircle,
} from "lucide-react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { type MouseEvent as ReactMouseEvent, useState } from "react";

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
	Award,
	ShieldCheck,
};

const CARD_COLORS = [
	"#2431E0",
	"#246CE0",
	"#24A9E0",
	"#24E0DD",
	"#24E09D",
	"#2431E0",
];

function hexToRgba(hex: string, alpha: number) {
	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface BentoFeatureCardProps {
	title: string;
	description: string;
	iconName: IconName;
	size: "large" | "standard";
	index?: number;
	className?: string;
}

export function BentoFeatureCard({
	title,
	description,
	iconName,
	index = 0,
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

	const color = CARD_COLORS[index % CARD_COLORS.length] ?? "#2431E0";
	const Icon = IconMap[iconName];

	return (
		<motion.article
			className={cn(
				"group/bento relative flex h-full cursor-default flex-col overflow-hidden rounded-xl bg-white/5 p-6 backdrop-blur-md sm:p-8",
				className,
			)}
			style={{
				border: `1px solid ${hexToRgba(color, 0.2)}`,
			}}
			onMouseMove={handleMouseMove}
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
			whileHover={
				prefersReducedMotion
					? undefined
					: {
							y: -4,
							boxShadow: `0 8px 30px ${hexToRgba(color, 0.25)}`,
							borderColor: hexToRgba(color, 0.5),
							transition: {
								type: "spring",
								stiffness: 400,
								damping: 20,
							},
						}
			}
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
						background: `radial-gradient(circle, ${hexToRgba(color, 0.15)}, transparent 60%)`,
						maskImage,
						WebkitMaskImage: maskImage,
					}}
				/>
			)}

			{/* Card content */}
			<div className="relative z-10 flex h-full flex-col gap-4">
				<div className="flex items-center gap-3">
					<motion.div
						className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
						style={{
							backgroundColor: hexToRgba(color, 0.12),
						}}
						animate={prefersReducedMotion ? undefined : { y: [0, -2, 0] }}
						transition={{
							duration: 3 + index * 0.4,
							repeat: Number.POSITIVE_INFINITY,
							ease: "easeInOut",
						}}
					>
						<Icon className="h-5 w-5" style={{ color }} />
					</motion.div>
					<h3 className="text-lg font-semibold text-foreground">{title}</h3>
				</div>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{description}
				</p>
			</div>
		</motion.article>
	);
}
