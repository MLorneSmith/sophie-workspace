"use client";

import { cn } from "@kit/ui/utils";
import Link from "next/link";

interface TocItem {
	text: string;
	level: number;
	href: string;
	children?: TocItem[];
}

interface DocsTableOfContentsProps {
	data: TocItem[];
}

export function DocsTableOfContents({ data }: DocsTableOfContentsProps) {
	if (!data || data.length === 0) {
		return null;
	}

	return (
		<div className="hidden xl:block sticky top-20 w-64 shrink-0 self-start">
			<div className="space-y-2">
				<p className="font-semibold text-sm mb-4">On This Page</p>
				<nav className="space-y-1.5">
					{data.map((item) => (
						<TocItemComponent key={item.href} item={item} />
					))}
				</nav>
			</div>
		</div>
	);
}

function TocItemComponent({ item }: { item: TocItem }) {
	const hasChildren = item.children && item.children.length > 0;

	return (
		<div>
			<Link
				href={item.href}
				className={cn(
					"block text-sm text-muted-foreground hover:text-foreground transition-colors py-1",
					item.level === 2 && "pl-4",
					item.level === 3 && "pl-8",
				)}
			>
				{item.text}
			</Link>
			{hasChildren && (
				<div className="space-y-1.5 mt-1">
					{item.children?.map((child) => (
						<TocItemComponent key={child.href} item={child} />
					))}
				</div>
			)}
		</div>
	);
}
