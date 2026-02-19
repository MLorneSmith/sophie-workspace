"use client";

import { cn } from "@kit/ui/utils";

interface GlassCardProps {
	children: React.ReactNode;
	className?: string;
	glow?: boolean;
	variant?: "default" | "elevated" | "featured";
}

const variantStyles: Record<NonNullable<GlassCardProps["variant"]>, string> = {
	default:
		"backdrop-blur-[12px] bg-[var(--homepage-surface)]/60 [@supports(not(backdrop-filter:blur(1px)))]:bg-[var(--homepage-surface)]",
	elevated:
		"backdrop-blur-[16px] bg-[var(--homepage-surface)]/75 [@supports(not(backdrop-filter:blur(1px)))]:bg-[var(--homepage-surface)]",
	featured:
		"backdrop-blur-[20px] bg-[var(--homepage-surface)]/85 border-[var(--homepage-accent)]/20 [@supports(not(backdrop-filter:blur(1px)))]:bg-[var(--homepage-surface)]",
};

export function GlassCard({
	children,
	className,
	glow = false,
	variant = "default",
}: GlassCardProps) {
	return (
		<div
			className={cn(
				"rounded-xl border border-[var(--homepage-border-subtle)] p-6",
				variantStyles[variant],
				glow && "shadow-[0_0_15px_var(--homepage-accent-glow)]",
				className,
			)}
		>
			{children}
		</div>
	);
}
