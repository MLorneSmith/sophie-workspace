"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	BarChart3,
	BookOpen,
	Brain,
	LayoutDashboard,
	type LucideIcon,
	Presentation,
	Sparkles,
} from "lucide-react";
import React, { useState } from "react";

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

interface CardItem {
	title: string;
	description: string;
	iconName: IconName;
}

interface HoverEffectProps {
	items: CardItem[];
	className?: string;
}

interface CardComponentProps {
	className?: string;
	children: React.ReactNode;
}

export function HoverEffect({ items, className }: HoverEffectProps) {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

	return (
		<div
			className={cn(
				"grid grid-cols-1 gap-4 py-10 md:grid-cols-2 lg:grid-cols-3",
				className,
			)}
		>
			{items.map((item, idx) => (
				<div
					key={`hover-card-${idx}-${item.title}`}
					className="group relative block h-full w-full p-2"
					onMouseEnter={() => setHoveredIndex(idx)}
					onMouseLeave={() => setHoveredIndex(null)}
					onFocus={() => setHoveredIndex(idx)}
					onBlur={() => setHoveredIndex(null)}
					role="presentation"
				>
					<AnimatePresence>
						{hoveredIndex === idx && (
							<motion.div
								style={{
									position: "absolute",
									inset: 0,
									display: "block",
									height: "100%",
									width: "100%",
									borderRadius: "1.5rem",
									backgroundColor: "rgb(229 229 229)",
								}}
								layoutId="hoverBackground"
								initial={{ opacity: 0 }}
								animate={{
									opacity: 1,
									transition: { duration: 0.15 },
								}}
								exit={{
									opacity: 0,
									transition: { duration: 0.15, delay: 0.2 },
								}}
							/>
						)}
					</AnimatePresence>
					<CardHover>
						<div className="flex items-center gap-4">
							{React.createElement(IconMap[item.iconName], {
								className: "h-8 w-8 text-zinc-100",
							})}
							<CardTitle>{item.title}</CardTitle>
						</div>
						<CardDescription>{item.description}</CardDescription>
					</CardHover>
				</div>
			))}
		</div>
	);
}

export function CardHover({ className, children }: CardComponentProps) {
	return (
		<div
			className={cn(
				"relative z-20 h-full w-full overflow-hidden rounded-2xl border border-transparent bg-black p-4 group-hover:border-slate-700 dark:border-white/[0.2]",
				className,
			)}
		>
			<div className="relative z-50">
				<div className="p-4">{children}</div>
			</div>
		</div>
	);
}

export function CardTitle({ className, children }: CardComponentProps) {
	return (
		<h4 className={cn("h4 font-heading font-bold text-zinc-100", className)}>
			{children}
		</h4>
	);
}

export function CardDescription({ className, children }: CardComponentProps) {
	return <p className={cn("body mt-8 text-zinc-400", className)}>{children}</p>;
}
