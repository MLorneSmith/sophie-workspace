"use client";

import { m, type Variants } from "motion/react";
import type { ElementType } from "react";

interface LetterRevealProps {
	text: string;
	className?: string;
	as?: "h1" | "h2" | "span";
	children?: React.ReactNode;
}

const containerVariants: Variants = {
	initial: { opacity: 0 },
	animate: {
		opacity: 1,
		transition: {
			staggerChildren: 0.03,
			delayChildren: 0.1,
		},
	},
};

const letterVariants: Variants = {
	initial: { opacity: 0, y: 20 },
	animate: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring",
			damping: 20,
			stiffness: 300,
		},
	},
};

export function LetterReveal({
	text,
	className,
	as = "h1",
	children,
}: LetterRevealProps) {
	const Component = m[as] as ElementType;

	const letters = text.split("");

	return (
		<Component
			className={className}
			variants={containerVariants}
			initial="initial"
			whileInView="animate"
			viewport={{ once: true, amount: 0.5 }}
			aria-label={text}
		>
			{letters.map((letter, index) => (
				<m.span
					key={`${index}-${letter}`}
					variants={letterVariants}
					aria-hidden="true"
				>
					{letter === " " ? "\u00A0" : letter}
				</m.span>
			))}
			{children}
		</Component>
	);
}
