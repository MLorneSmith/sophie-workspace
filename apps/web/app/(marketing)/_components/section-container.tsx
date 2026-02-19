import { cn } from "@kit/ui/utils";

type BackgroundVariant = "default" | "surface" | "transparent";

const backgroundClasses: Record<BackgroundVariant, string> = {
	default: "bg-background dark:bg-[var(--homepage-bg)]",
	surface: "bg-secondary/50 dark:bg-[var(--homepage-surface)]",
	transparent: "bg-transparent",
};

interface SectionContainerProps {
	id?: string;
	className?: string;
	background?: BackgroundVariant;
	children: React.ReactNode;
}

export function SectionContainer({
	id,
	className,
	background = "default",
	children,
}: SectionContainerProps) {
	return (
		<section
			id={id}
			className={cn(
				"py-16 md:py-24 lg:py-32",
				backgroundClasses[background],
				className,
			)}
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
		</section>
	);
}
