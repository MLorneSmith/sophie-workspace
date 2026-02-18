"use client";

import { cn } from "@kit/ui/utils";
import { useId } from "react";

interface NoiseOverlayProps {
	opacity?: number;
	className?: string;
	mode?: "noise" | "grid";
}

export function NoiseOverlay({
	opacity = 0.05,
	className,
	mode = "noise",
}: NoiseOverlayProps) {
	const id = useId();
	const filterId = `${id}-noise-filter`;
	const patternId = `${id}-grid-pattern`;

	return (
		<div
			aria-hidden="true"
			className={cn(
				"pointer-events-none absolute inset-0 overflow-hidden",
				className,
			)}
			style={{ opacity }}
		>
			{mode === "noise" ? (
				<svg
					className="h-full w-full"
					xmlns="http://www.w3.org/2000/svg"
					role="none"
				>
					<filter id={filterId}>
						<feTurbulence
							type="fractalNoise"
							baseFrequency="0.65"
							numOctaves="3"
							stitchTiles="stitch"
						/>
					</filter>
					<rect
						width="100%"
						height="100%"
						filter={`url(#${filterId})`}
						fill="transparent"
					/>
				</svg>
			) : (
				<svg
					className="h-full w-full"
					xmlns="http://www.w3.org/2000/svg"
					role="none"
				>
					<defs>
						<pattern
							id={patternId}
							width="40"
							height="40"
							patternUnits="userSpaceOnUse"
						>
							<path
								d="M 40 0 L 0 0 0 40"
								fill="none"
								stroke="currentColor"
								strokeWidth="0.5"
								opacity="0.3"
							/>
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill={`url(#${patternId})`} />
				</svg>
			)}
		</div>
	);
}
