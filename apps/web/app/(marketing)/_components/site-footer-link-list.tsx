"use client";

import React from "react";

import Link from "next/link";

import { cn } from "@kit/ui/utils";

interface FooterLinkListProps {
	title: string;
	items: readonly {
		title: string;
		href: string;
	}[];
}

export function FooterLinkList({ title, items }: FooterLinkListProps) {
	return (
		<ul>
			<li className={cn("mb-3 text-base font-medium")}>{title}</li>
			{items.map((item) => (
				<li key={item.href} className="mb-2">
					<Link
						href={item.href}
						className={cn(
							"text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white",
						)}
					>
						{item.title}
					</Link>
				</li>
			))}
		</ul>
	);
}
