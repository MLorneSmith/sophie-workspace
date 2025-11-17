import { cn } from "@kit/ui/utils";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

interface DocsPageLinkProps {
	page: {
		title: string;
		url: string;
	};
	className?: string;
}

export function DocsPageLink({ page, className }: DocsPageLinkProps) {
	return (
		<Link
			href={page.url}
			className={cn(
				"group flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors",
				className,
			)}
		>
			<span className="font-medium">{page.title}</span>
			<ArrowRightIcon className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
		</Link>
	);
}
