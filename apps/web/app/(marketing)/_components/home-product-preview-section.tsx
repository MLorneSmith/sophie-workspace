"use client";

import { homepageContentConfig } from "~/config/homepage-content.config";

import { AnimateOnScroll } from "./animate-on-scroll";
import { BrowserFrame } from "./home-browser-frame";
import OptimizedImage from "./home-optimized-image";

const { src, alt, title } = homepageContentConfig.productPreview;

export function ProductPreviewSection() {
	return (
		<AnimateOnScroll
			className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"
			as="div"
		>
			<BrowserFrame title={title}>
				<OptimizedImage
					src={src}
					alt={alt}
					width={1200}
					height={800}
					className="h-full w-full object-cover"
					priority
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
					quality={85}
				/>
			</BrowserFrame>
		</AnimateOnScroll>
	);
}
