"use client";

import { type Variants, motion, useReducedMotion } from "motion/react";
import Image from "next/image";

import { Badge } from "@kit/ui/badge";

const BLUR_PLACEHOLDER =
	"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48ZmlsdGVyIGlkPSJiIj48ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIyMCIvPjwvZmlsdGVyPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjYikiIGZpbGw9IiMxYTFhMjUiLz48L3N2Zz4=";

import { homepageContentConfig } from "~/config/homepage-content.config";

import { GlassCard } from "./glass-card";

const containerVariants: Variants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const itemVariants: Variants = {
	hidden: { opacity: 0, y: 24 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

interface HomeBlogCardProps {
	title: string;
	description: string;
	readTimeMinutes: number;
	categoryBadge?: string;
	thumbnailSrc?: string;
}

function HomeBlogCard({
	title,
	description,
	readTimeMinutes,
	categoryBadge,
	thumbnailSrc,
}: HomeBlogCardProps) {
	return (
		<article>
			<GlassCard className="group flex h-full flex-col overflow-hidden p-0">
				{thumbnailSrc && (
					<div className="overflow-hidden">
						<Image
							src={thumbnailSrc}
							alt={title}
							width={400}
							height={225}
							sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
							placeholder="blur"
							blurDataURL={BLUR_PLACEHOLDER}
							className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>
					</div>
				)}

				<div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
					{categoryBadge && (
						<Badge variant="secondary" className="w-fit text-xs">
							{categoryBadge}
						</Badge>
					)}

					<h3 className="line-clamp-2 text-lg font-semibold leading-snug">
						{title}
					</h3>

					<p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
						{description}
					</p>

					<span className="text-xs text-muted-foreground">
						{readTimeMinutes} min read
					</span>
				</div>
			</GlassCard>
		</article>
	);
}

export function HomeBlogSection() {
	const prefersReducedMotion = useReducedMotion();
	const { title, subtitle, posts } = homepageContentConfig.essentialReads;

	return (
		<div>
			<h2 className="text-h3 sm:text-h2 mb-3 text-center sm:mb-4">{title}</h2>
			<p className="text-body sm:text-body-lg mx-auto mb-8 max-w-4xl text-center leading-relaxed text-muted-foreground sm:mb-12 dark:text-muted-foreground">
				{subtitle}
			</p>

			<motion.ul
				role="list"
				className="mt-8 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8"
				variants={prefersReducedMotion ? undefined : containerVariants}
				initial={prefersReducedMotion ? "visible" : "hidden"}
				whileInView="visible"
				viewport={{ once: true, margin: "-100px" }}
			>
				{posts.map((post) => (
					<motion.li
						key={post.title}
						variants={prefersReducedMotion ? undefined : itemVariants}
					>
						<HomeBlogCard
							title={post.title}
							description={post.description}
							readTimeMinutes={post.readTimeMinutes}
							categoryBadge={post.categoryBadge}
							thumbnailSrc={post.thumbnailSrc}
						/>
					</motion.li>
				))}
			</motion.ul>
		</div>
	);
}
