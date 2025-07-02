"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import {
	BarChart3,
	BookOpen,
	Brain,
	LayoutDashboard,
	type LucideIcon,
	Presentation,
	Sparkles,
} from "lucide-react";
import React, { type MouseEvent as ReactMouseEvent, useState } from "react";

import { cn } from "../lib/utils";

type IconName =
	| "Brain"
	| "Presentation"
	| "BookOpen"
	| "LayoutDashboard"
	| "Sparkles"
	| "BarChart3";

const IconMap: Record<IconName, LucideIcon> = {
	Brain,
	Presentation,
	BookOpen,
	LayoutDashboard,
	Sparkles,
	BarChart3,
};

interface CardSpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
	radius?: number;
	color?: string;
	heading?: string;
	description?: string;
	iconName?: IconName;
	bulletPoints?: string[];
}

export const CardSpotlight = ({
	radius = 350,
	color = "#262626",
	className,
	heading,
	description,
	iconName,
	bulletPoints,
	...props
}: CardSpotlightProps) => {
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);

	function handleMouseMove({
		currentTarget,
		clientX,
		clientY,
	}: ReactMouseEvent<HTMLDivElement>) {
		const { left, top } = currentTarget.getBoundingClientRect();
		mouseX.set(clientX - left);
		mouseY.set(clientY - top);
	}

	const [isHovering, setIsHovering] = useState(false);
	const handleMouseEnter = () => setIsHovering(true);
	const handleMouseLeave = () => setIsHovering(false);

	const maskImage = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, white, transparent 80%)`;

	return (
		<article
			className={cn(
				"group/spotlight relative h-full rounded-md border border-border bg-card p-8",
				className,
			)}
			onMouseMove={handleMouseMove}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			{...props}
		>
			<motion.div
				initial={false}
				animate={{
					opacity: isHovering ? 1 : 0,
				}}
				transition={{ duration: 0.3 }}
				style={{
					position: "absolute",
					inset: "-1px",
					borderRadius: "6px",
					background: `linear-gradient(90deg, ${color}, #3b82f6, #8b5cf6)`,
					maskImage,
					WebkitMaskImage: maskImage,
					pointerEvents: "none",
				}}
			/>
			<div className="relative z-10 flex h-full flex-col">
				<div className="flex items-center gap-4">
					{iconName &&
						React.createElement(IconMap[iconName], {
							className: "h-8 w-8 text-foreground",
						})}
					{heading && (
						<h3 className="h4 font-heading font-bold text-foreground">
							{heading}
						</h3>
					)}
				</div>
				{description && (
					<p className="body mt-8 text-muted-foreground">{description}</p>
				)}
				{bulletPoints && bulletPoints.length > 0 && (
					<ul className="mt-auto space-y-2">
						{bulletPoints.map((point, index) => (
							<li
								key={`bullet-${index}-${point.slice(0, 20)}`}
								className="text-sm text-muted-foreground"
							>
								• {point}
							</li>
						))}
					</ul>
				)}
			</div>
		</article>
	);
};
