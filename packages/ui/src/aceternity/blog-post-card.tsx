"use client";

import { BookOpen, LineChart, Presentation, Sparkles } from "lucide-react";
import Image from "next/image";

import { cn } from "../lib/utils";

interface BlogPostCardProps {
	title: string;
	description: string;
	backgroundImage: string;
	authorImage?: string;
	authorName?: string;
	blogType?: string;
	readTimeMinutes?: number;
	iconType?: "presentation" | "chart" | "sparkles" | "book";
}

export function BlogPostCard({
	title,
	description,
	backgroundImage,
	authorImage = "/images/authors/michael.webp",
	authorName = "Michael Smith",
	blogType = "Guide",
	readTimeMinutes = 20,
	iconType = "book",
}: BlogPostCardProps) {
	// Render icon based on type
	const renderIcon = () => {
		const className = "h-4 w-4 text-gray-50";
		switch (iconType) {
			case "presentation":
				return <Presentation className={className} />;
			case "chart":
				return <LineChart className={className} />;
			case "sparkles":
				return <Sparkles className={className} />;
			default:
				return <BookOpen className={className} />;
		}
	};

	return (
		<div className="group/card w-full max-w-xs">
			<div
				className={cn(
					"card backgroundImage relative mx-auto flex h-96 max-w-sm cursor-pointer flex-col overflow-hidden rounded-md p-4 shadow-xl",
					"bg-cover",
				)}
				style={{ backgroundImage: `url(${backgroundImage})` }}
			>
				{/* Dark overlay that's always present */}
				<div className="absolute left-0 top-0 h-full w-full bg-black/65" />
				{/* Additional hover overlay */}
				<div className="absolute left-0 top-0 h-full w-full bg-black/0 transition duration-300 group-hover/card:bg-black/30" />

				<div className="z-10 flex flex-col space-y-3">
					<div className="flex flex-row items-center space-x-3">
						{renderIcon()}
						<span
							className="text-base font-medium"
							style={{ color: "#24a9e0" }}
						>
							{blogType}
						</span>
						<span className="text-base text-gray-400">
							{readTimeMinutes} minute read
						</span>
					</div>

					<h4 className="text-[1.75rem] relative z-10 font-heading font-bold text-gray-50 leading-tight">
						{title}
					</h4>
				</div>

				<div className="text content flex-1 mt-4">
					<p className="text-base relative z-10 text-gray-50/90 leading-relaxed">
						{description}
					</p>
				</div>

				<div className="z-10 flex flex-row items-center space-x-3 mt-4">
					<Image
						height="100"
						width="100"
						alt="Avatar"
						src={authorImage}
						className="h-8 w-8 rounded-full border-2 object-cover"
					/>
					<p className="text-base text-gray-50/90">{authorName}</p>
				</div>
			</div>
		</div>
	);
}
