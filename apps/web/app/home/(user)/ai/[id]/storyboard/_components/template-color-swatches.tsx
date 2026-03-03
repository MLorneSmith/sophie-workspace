"use client";

import { cn } from "@kit/ui/utils";

interface TemplateColorSwatchesProps {
	/** Array of hex color codes */
	colors: string[];
	/** Additional CSS classes */
	className?: string;
}

/**
 * Color swatch preview component that displays a template's color palette
 */
export function TemplateColorSwatches({
	colors,
	className,
}: TemplateColorSwatchesProps) {
	return (
		<div
			className={cn("flex items-center gap-1", className)}
			data-testid="template-color-swatches"
		>
			{colors.map((color) => (
				<div
					key={color}
					className="h-3.5 w-3.5 rounded-full border border-black/10"
					style={{ backgroundColor: color }}
					title={`Color: #${color}`}
				/>
			))}
		</div>
	);
}
