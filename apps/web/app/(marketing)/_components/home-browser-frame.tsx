"use client";

import { cn } from "@kit/ui/utils";
import type { ReactNode } from "react";

interface BrowserFrameProps {
	children: ReactNode;
	className?: string;
	title?: string;
}

export function BrowserFrame({
	children,
	className,
	title = "SlideHeroes Canvas",
}: BrowserFrameProps) {
	return (
		<div className={cn("relative", className)}>
			{/* Glow effect beneath frame */}
			<div
				aria-hidden="true"
				className="absolute -inset-3 -z-10 rounded-2xl bg-[var(--homepage-accent-glow)] opacity-30 blur-2xl motion-safe:animate-[glowPulse_2.5s_ease-in-out_infinite] motion-reduce:opacity-20"
			/>

			{/* Rotating gradient border */}
			<div className="relative overflow-hidden rounded-xl p-px">
				<div
					aria-hidden="true"
					className="absolute -inset-[100%] motion-safe:animate-[borderRotate_3.5s_linear_infinite] motion-reduce:hidden"
					style={{
						background:
							"conic-gradient(from 0deg, var(--homepage-accent), transparent 30%, transparent 70%, var(--homepage-accent))",
					}}
				/>

				{/* Glass card body */}
				<div className="relative rounded-xl border border-[var(--homepage-border-subtle)] bg-[var(--homepage-surface)]/80 backdrop-blur-[16px] [@supports(not(backdrop-filter:blur(1px)))]:bg-[var(--homepage-surface)]">
					{/* macOS title bar */}
					<div className="flex items-center gap-2 border-b border-[var(--homepage-border-subtle)] px-4 py-3">
						<div className="flex gap-1.5">
							<span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
							<span className="h-3 w-3 rounded-full bg-[#febc2e]" />
							<span className="h-3 w-3 rounded-full bg-[#28c840]" />
						</div>
						<span className="flex-1 text-center text-xs font-medium text-[var(--homepage-text-muted)]">
							{title}
						</span>
						{/* Spacer to center title */}
						<div className="flex gap-1.5 opacity-0">
							<span className="h-3 w-3" />
							<span className="h-3 w-3" />
							<span className="h-3 w-3" />
						</div>
					</div>

					{/* Content area */}
					<div className="overflow-hidden">{children}</div>
				</div>
			</div>
		</div>
	);
}
