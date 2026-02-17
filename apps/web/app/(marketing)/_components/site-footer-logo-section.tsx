"use client";

import { cn } from "@kit/ui/utils";

export function FooterLogoSection() {
	return (
		<div className="w-full py-2">
			<p className={cn("text-base text-foreground max-w-xl")}>
				<strong>SlideHeroes</strong> gives individuals and teams the
				presentation tools and skills to impress, convince, and close.
			</p>
		</div>
	);
}
