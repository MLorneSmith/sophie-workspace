"use client";

import { cn } from "@kit/ui/utils";
import Image from "next/image";

import {
	getPostPlaceholderImage,
	transformImageUrl,
} from "~/lib/utils/image-utils";

// Client-safe logger wrapper with environment gating
const logger = {
	info: (...args: unknown[]) => {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Development logging for image loading
			console.info(...args);
		}
	},
};

type Props = {
	title: string;
	src: string;
	preloadImage?: boolean;
	className?: string;
};

export function CoverImage({ title, src, preloadImage, className }: Props) {
	// Transform the image URL to use the custom domain
	const transformedSrc = transformImageUrl(src) || "";

	return (
		<Image
			className={cn(
				"block rounded-xl object-cover duration-250" +
					" transition-all hover:opacity-90",
				{
					className,
				},
			)}
			src={transformedSrc}
			priority={preloadImage}
			alt={`Cover Image for ${title}`}
			fill
			onError={(e) => {
				// Fallback to placeholder if image fails to load
				const target = e.target as HTMLImageElement;
				target.src = getPostPlaceholderImage();
				logger.info("Image failed to load, using placeholder", {
					originalSrc: transformedSrc,
					title,
					timestamp: new Date().toISOString(),
				});
			}}
		/>
	);
}
