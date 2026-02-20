"use client";

import { useReducedMotion } from "motion/react";
import Image from "next/image";

const ROW_1 = [
	{
		src: "/images/presentations/01-wide-awake-2.webp",
		alt: "Wide Awake yearly summary presentation with mountain landscape",
	},
	{
		src: "/images/presentations/04-saas-deck-5.webp",
		alt: "SaaS product deck with investment dashboard UI",
	},
	{
		src: "/images/presentations/05-soar-agency-1.webp",
		alt: "SOAR digital marketing agency bold typography slide",
	},
	{
		src: "/images/presentations/08-finance-waveup-1.webp",
		alt: "Finance pitch deck with growth chart and metrics",
	},
	{
		src: "/images/presentations/44-sales-dashboard-1.webp",
		alt: "Sales analytics dashboard with revenue metrics",
	},
	{
		src: "/images/presentations/12-dataviz-slide-1.webp",
		alt: "Data visualization presentation with energy usage charts",
	},
];

const ROW_2 = [
	{
		src: "/images/presentations/06-digital-transform-1.webp",
		alt: "Digital transformation keynote with conference silhouettes",
	},
	{
		src: "/images/presentations/43-fintech-dashboard-1.webp",
		alt: "Fintech dashboard with cashflow analytics",
	},
	{
		src: "/images/presentations/10-dataviz-pitchdeck-2.webp",
		alt: "Pitch deck with founder growth metrics",
	},
	{
		src: "/images/presentations/06-digital-transform-4.webp",
		alt: "Digital transformation dark theme slide",
	},
	{
		src: "/images/presentations/12-dataviz-slide-2.webp",
		alt: "Data analytics presentation with line charts",
	},
	{
		src: "/images/presentations/47-line-graph-dark-1.webp",
		alt: "Dark theme line graph analytics slide",
	},
];

function MarqueeRow({
	slides,
	direction,
	duration = 40,
}: {
	slides: ReadonlyArray<{ src: string; alt: string }>;
	direction: "left" | "right";
	duration?: number;
}) {
	const prefersReducedMotion = useReducedMotion();
	const doubled = [...slides, ...slides];

	return (
		<div className="flex overflow-hidden" aria-hidden="true">
			<div
				className="flex gap-3 sm:gap-4"
				style={
					prefersReducedMotion
						? undefined
						: {
								animation: `marquee-${direction} ${duration}s linear infinite`,
								willChange: "transform",
							}
				}
			>
				{doubled.map((slide, i) => (
					<div
						key={`${slide.src}-${i}`}
						className="relative w-[280px] flex-shrink-0 overflow-hidden rounded-lg border border-white/[0.08] sm:w-[360px] sm:rounded-xl lg:w-[420px]"
						style={{ aspectRatio: "16 / 10" }}
					>
						<Image
							src={slide.src}
							alt={slide.alt}
							fill
							className="object-cover"
							sizes="(max-width: 640px) 280px, (max-width: 1024px) 360px, 420px"
						/>
					</div>
				))}
			</div>
		</div>
	);
}

export function PresentationShowcase() {
	return (
		<div className="relative w-full overflow-hidden py-8 sm:py-12 lg:py-16">
			{/* Accessible description for screen readers */}
			<p className="sr-only">
				A showcase of presentation slides created with SlideHeroes, scrolling in
				a continuous banner.
			</p>

			<div className="flex flex-col gap-3 sm:gap-4">
				<MarqueeRow slides={ROW_1} direction="left" duration={45} />
				<MarqueeRow slides={ROW_2} direction="right" duration={50} />
			</div>

			{/* Edge fade masks */}
			<div
				className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-24 lg:w-32"
				style={{
					background:
						"linear-gradient(to right, rgb(0 0 0 / 0.9), transparent)",
				}}
			/>
			<div
				className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-24 lg:w-32"
				style={{
					background: "linear-gradient(to left, rgb(0 0 0 / 0.9), transparent)",
				}}
			/>
		</div>
	);
}
