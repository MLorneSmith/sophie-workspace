import type React from "react";

import { cn } from "../../lib/utils";

interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
	variant?: "default" | "cyan";
}

const variantStyles: Record<
	NonNullable<GradientTextProps["variant"]>,
	string
> = {
	default: "bg-linear-to-r",
	cyan: "bg-[linear-gradient(135deg,var(--homepage-accent),#1a6fb5)]",
};

export const GradientText: React.FC<GradientTextProps> =
	function GradientTextComponent({
		className,
		children,
		variant = "default",
		...props
	}) {
		return (
			<span
				className={cn(
					"bg-clip-text text-transparent",
					variantStyles[variant],
					className,
				)}
				{...props}
			>
				{children}
			</span>
		);
	};
