"use client";

import dynamic from "next/dynamic";

// Define the content item type
interface ContentItem {
	title: string;
	description: string[];
	imageSrc: string;
	content: React.ReactNode;
}

// Define the component props
interface StickyScrollRevealProps {
	content: ContentItem[];
}

const StickyScrollReveal = dynamic<StickyScrollRevealProps>(
	() =>
		import("@kit/ui/sticky-scroll-reveal").then((mod) => {
			const { StickyScrollReveal } = mod;
			return StickyScrollReveal;
		}),
	{
		ssr: false,
		loading: () => (
			<div className="animate-pulse space-y-4">
				<div className="h-[60vh] rounded-lg bg-gray-200 dark:bg-gray-800" />
				<div className="h-[60vh] rounded-lg bg-gray-200 dark:bg-gray-800" />
			</div>
		),
	},
);

export default StickyScrollReveal;
