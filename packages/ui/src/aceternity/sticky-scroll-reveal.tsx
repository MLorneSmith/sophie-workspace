"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";

import {
	AnimatePresence,
	motion,
	useMotionValueEvent,
	useScroll,
} from "framer-motion";

import { cn } from "../lib/utils";

// Scroll thresholds for each image transition
const SCROLL_THRESHOLDS = {
	// First image: 0 to 0.25 (first quarter of scroll)
	FIRST_IMAGE_END: 0.3,

	// Second image: 0.25 to 0.45 (shorter middle section)
	SECOND_IMAGE_END: 0.4,

	// Third image: 0.45 onwards (more space for last section)
	// No threshold needed as it's the remainder
} as const;

// Content block spacing and sizing
const CONTENT_BLOCKS = {
	// Height of each content block
	BLOCK_HEIGHT: "10vh",

	// Top margin for first block
	FIRST_BLOCK_MARGIN: "5vh",

	// Top margin for subsequent blocks
	OTHER_BLOCK_MARGIN: "1vh",

	// Total container height
	CONTAINER_HEIGHT: "50vh",
} as const;

interface StickyScrollRevealProps {
	content: {
		title: string;
		description: string | string[];
		content?: React.ReactNode;
	}[];
	contentClassName?: string;
}

const springConfig = {
	duration: 0.15,
	ease: [0.25, 0.1, 0.25, 1],
} as const;

export function StickyScrollReveal({
	content,
	contentClassName,
}: StickyScrollRevealProps) {
	const [activeCard, setActiveCard] = useState(0);
	const [isVisible, setIsVisible] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const { scrollYProgress } = useScroll();

	useEffect(() => {
		if (!containerRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry) {
					setIsVisible(entry.intersectionRatio > 0.1);
				}
			},
			{
				threshold: [0, 0.1],
				rootMargin: "100px 0px",
			},
		);

		observer.observe(containerRef.current);
		return () => observer.disconnect();
	}, []);

	useMotionValueEvent(scrollYProgress, "change", (latest) => {
		const progress = Math.max(0, Math.min(1, latest));

		if (progress <= SCROLL_THRESHOLDS.FIRST_IMAGE_END) {
			setActiveCard(0);
		} else if (progress <= SCROLL_THRESHOLDS.SECOND_IMAGE_END) {
			setActiveCard(1);
		} else {
			setActiveCard(2);
		}
	});

	const renderDescription = (description: string | string[]) => {
		if (typeof description === "string") {
			return <p className="body">{description}</p>;
		}

		return (
			<ul className="body list-disc space-y-2 pl-5">
				{description.map((point, index) => (
					<li key={index}>{point}</li>
				))}
			</ul>
		);
	};

	return (
		<div
			ref={containerRef}
			className={cn(
				"relative mt-12 flex justify-center pt-16",
				"transition-opacity duration-200",
				isVisible ? "opacity-100" : "opacity-0",
			)}
			style={{ minHeight: CONTENT_BLOCKS.CONTAINER_HEIGHT }}
		>
			<div className="relative mx-auto flex w-full max-w-6xl px-4">
				{/* Left side - Text content */}
				<div className="w-full lg:w-1/2">
					<div className="flex flex-col">
						{content.map((item, index) => {
							const isActive = activeCard === index;
							return (
								<div
									key={item.title}
									className="flex min-h-screen items-center"
									style={{
										height: CONTENT_BLOCKS.BLOCK_HEIGHT,
										marginTop:
											index === 0
												? CONTENT_BLOCKS.FIRST_BLOCK_MARGIN
												: CONTENT_BLOCKS.OTHER_BLOCK_MARGIN,
									}}
								>
									<motion.div
										initial={false}
										animate={{
											opacity: isActive ? 1 : 0.3,
										}}
										transition={springConfig}
										style={{
											width: "100%",
										}}
									>
										<div
											className={cn(
												"h3 font-heading font-bold",
												isActive ? "text-foreground" : "text-muted-foreground",
											)}
										>
											{item.title}
										</div>

										<div
											className={cn(
												"mt-10 max-w-lg",
												isActive
													? "text-muted-foreground"
													: "text-muted-foreground/50",
											)}
										>
											{renderDescription(item.description)}
										</div>
									</motion.div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Right side - Sticky content */}
				<div className="hidden lg:block lg:w-1/2">
					<div className="sticky top-1/2 -translate-y-1/2">
						<AnimatePresence mode="wait">
							<motion.div
								key={activeCard}
								style={{
									width: "100%",
									height: "350px",
									borderRadius: "0.75rem",
									overflow: "hidden",
								}}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={springConfig}
							>
								<div className={cn("relative h-full w-full", contentClassName)}>
									<div className="absolute inset-0 h-full w-full">
										{content[activeCard]?.content}
									</div>
								</div>
							</motion.div>
						</AnimatePresence>
					</div>
				</div>
			</div>
		</div>
	);
}
