"use client";

import { type Variants, m, useReducedMotion } from "motion/react";

interface SocialProofStripProps {
	avatarCount?: number;
	label: string;
}

const avatarColors = [
	"bg-cyan-400",
	"bg-blue-400",
	"bg-indigo-400",
	"bg-purple-400",
	"bg-pink-400",
];

const containerVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.1 },
	},
};

const itemVariants: Variants = {
	hidden: { opacity: 0, scale: 0.8 },
	visible: { opacity: 1, scale: 1 },
};

export function SocialProofStrip({
	avatarCount = 5,
	label,
}: SocialProofStripProps) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<m.div
			className="flex flex-row items-center gap-3"
			variants={prefersReducedMotion ? undefined : containerVariants}
			initial={prefersReducedMotion ? "visible" : "hidden"}
			whileInView="visible"
			viewport={{ once: true }}
		>
			<div className="flex flex-row items-center" aria-hidden="true">
				{Array.from({ length: avatarCount }, (_, i) => (
					<m.div
						key={i}
						variants={prefersReducedMotion ? undefined : itemVariants}
						className={`flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-background ${avatarColors[i % avatarColors.length]} ${i > 0 ? "-ml-3" : ""}`}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="h-5 w-5 text-white/80"
							aria-hidden="true"
						>
							<path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
						</svg>
					</m.div>
				))}
			</div>

			<m.span
				variants={prefersReducedMotion ? undefined : itemVariants}
				className="text-sm text-muted-foreground"
			>
				{label}
			</m.span>
		</m.div>
	);
}
