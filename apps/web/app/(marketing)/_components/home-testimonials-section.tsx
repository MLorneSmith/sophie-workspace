"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useState } from "react";

import { homepageContentConfig } from "~/config/homepage-content.config";

function highlightContent(content: string, highlights: string[]) {
	if (highlights.length === 0) {
		return <>{content}</>;
	}

	const pattern = highlights
		.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
		.join("|");
	const regex = new RegExp(`(${pattern})`, "gi");
	const parts = content.split(regex);

	return (
		<>
			{parts.map((part, i) => {
				const isHighlight = highlights.some(
					(h) => h.toLowerCase() === part.toLowerCase(),
				);
				if (isHighlight) {
					return (
						<strong key={`part-${i}`} className="font-semibold text-foreground">
							{part}
						</strong>
					);
				}
				return <span key={`part-${i}`}>{part}</span>;
			})}
		</>
	);
}

function getInitials(name: string) {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

function TestimonialCarousel({
	testimonials,
}: {
	testimonials: (typeof homepageContentConfig.testimonials.categories)[number]["testimonials"];
}) {
	const [index, setIndex] = useState(0);
	const current = testimonials[index]!;
	const count = testimonials.length;

	const prev = useCallback(
		() => setIndex((i) => (i - 1 + count) % count),
		[count],
	);
	const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);

	return (
		<div className="flex flex-col items-center">
			{/* Company logo */}
			<div className="mb-8 h-10 sm:mb-10">
				<img
					src={current.logo}
					alt={current.company}
					className="h-full w-auto object-contain"
				/>
			</div>

			{/* Quote with navigation arrows */}
			<div className="mb-8 flex w-full max-w-4xl items-center gap-4 sm:mb-10 sm:gap-6">
				<button
					type="button"
					onClick={prev}
					aria-label="Previous testimonial"
					className="flex-shrink-0 cursor-pointer rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-muted sm:p-3"
				>
					<ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
				</button>

				<blockquote className="flex-1 text-center">
					<p className="text-lg font-light leading-relaxed text-muted-foreground sm:text-xl md:text-2xl">
						&ldquo;{highlightContent(current.content, current.highlights)}
						&rdquo;
					</p>
				</blockquote>

				<button
					type="button"
					onClick={next}
					aria-label="Next testimonial"
					className="flex-shrink-0 cursor-pointer rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-muted sm:p-3"
				>
					<ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
				</button>
			</div>

			{/* Script signature */}
			<p
				className="mb-6 text-3xl text-foreground sm:mb-8 sm:text-4xl"
				style={{ fontFamily: "var(--font-script), cursive" }}
			>
				{current.name}
			</p>

			{/* Avatar + name + title */}
			<div className="flex items-center gap-4">
				<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-medium text-foreground">
					{getInitials(current.name)}
				</div>
				<div>
					<p className="text-sm font-semibold text-foreground">
						{current.name}
					</p>
					<p className="text-sm text-muted-foreground">{current.role}</p>
				</div>
			</div>

			{/* Dot indicators */}
			{count > 1 && (
				<div className="mt-6 flex gap-2 sm:mt-8" aria-hidden="true">
					{testimonials.map((_, i) => (
						<button
							key={testimonials[i]?.name}
							type="button"
							onClick={() => setIndex(i)}
							className={`h-1.5 rounded-full transition-all ${
								i === index ? "w-6 bg-foreground" : "w-1.5 bg-border"
							}`}
							aria-label={`Go to testimonial ${i + 1}`}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export function HomeTestimonialsSection() {
	const { testimonials } = homepageContentConfig;
	const categories = testimonials.categories;

	return (
		<div className="w-full">
			<h2 className="text-h3 sm:text-h2 mb-4 text-center text-foreground sm:mb-6">
				{testimonials.title} {testimonials.titleMuted}
			</h2>
			<p className="mx-auto mb-10 max-w-4xl text-center text-lg leading-relaxed text-muted-foreground sm:mb-14 sm:text-xl">
				{testimonials.subtitle}
			</p>

			<Tabs defaultValue={categories[0]?.value} className="w-full">
				<div className="mb-10 flex justify-center sm:mb-14">
					<TabsList className="h-auto gap-2 rounded-full border border-border bg-background p-1.5">
						{categories.map((cat) => (
							<TabsTrigger
								key={cat.value}
								value={cat.value}
								className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
							>
								{cat.label}
							</TabsTrigger>
						))}
					</TabsList>
				</div>

				{categories.map((cat) => (
					<TabsContent key={cat.value} value={cat.value} className="mt-0">
						<TestimonialCarousel testimonials={cat.testimonials} />
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}
