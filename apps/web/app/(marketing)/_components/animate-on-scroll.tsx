"use client";

import { type Variants, motion, useReducedMotion } from "motion/react";
import type { ElementType, ReactNode } from "react";

type MotionElement = "div" | "section" | "article" | "aside" | "main" | "span";

interface AnimateOnScrollProps {
	children: ReactNode;
	className?: string;
	variants?: Variants;
	delay?: number;
	as?: MotionElement;
}

const defaultVariants: Variants = {
	hidden: { opacity: 0, y: 24 },
	visible: { opacity: 1, y: 0 },
};

export function AnimateOnScroll({
	children,
	className,
	variants = defaultVariants,
	delay = 0,
	as = "div",
}: AnimateOnScrollProps) {
	const prefersReducedMotion = useReducedMotion();
	const Component = motion[as] as ElementType;

	if (prefersReducedMotion) {
		return <Component className={className}>{children}</Component>;
	}

	return (
		<Component
			className={className}
			variants={variants}
			initial="hidden"
			whileInView="visible"
			viewport={{ once: true, amount: 0.2 }}
			transition={{ duration: 0.6, delay, ease: [0, 0.71, 0.2, 1.01] }}
		>
			{children}
		</Component>
	);
}
