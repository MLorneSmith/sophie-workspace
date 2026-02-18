"use client";

import { QuoteIcon } from "lucide-react";
import Image from "next/image";

import { cn } from "../lib/utils";

// Base64 encoded SVG placeholder for avatars
const AVATAR_PLACEHOLDER =
	"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIHJ4PSI3NSIgZmlsbD0iI0UyRThGMCIvPgogIDxwYXRoIGQ9Ik03NSA3NUM4Ni4wNDU3IDc1IDk1IDY2LjA0NTcgOTUgNTVDOTUgNDMuOTU0MyA4Ni4wNDU3IDM1IDc1IDM1QzYzLjk1NDMgMzUgNTUgNDMuOTU0MyA1NSA1NUM1NSA2Ni4wNDU3IDYzLjk1NDMgNzUgNzUgNzVaIiBmaWxsPSIjOTRBM0I4Ii8+CiAgPHBhdGggZD0iTTc1IDg1QzUzLjUgODUgMzUgOTguNSAzNSAxMTVWMTI1SDExNVYxMTVDMTE1IDk4LjUgOTYuNSA4NSA3NSA4NVoiIGZpbGw9IiM5NEEzQjgiLz4KPC9zdmc+";

interface Testimonial {
	avatar_url?: string;
	name: string;
	content: string;
	title?: string;
	rating?: number;
	status?: string;
	created_at?: string;
}

type CardVariant = "light" | "glass";

interface TestimonialsMasonaryGridProps {
	testimonials: Testimonial[];
	variant?: CardVariant;
}

export function TestimonialsMasonaryGrid({
	testimonials,
	variant = "light",
}: TestimonialsMasonaryGridProps) {
	const [featured, ...rest] = testimonials;

	// Create a stable grid structure from remaining testimonials
	const gridSize = 4; // Number of columns
	const grid = Array.from({ length: gridSize }, (_, columnIndex) =>
		rest.filter((_, index) => index % gridSize === columnIndex),
	);

	return (
		<div>
			{/* Featured testimonial spanning 2 columns */}
			{featured && (
				<div className="mx-auto mb-4 max-w-7xl px-4 md:px-8">
					<Card
						variant={variant}
						className="col-span-2 md:max-w-[calc(50%-0.5rem)]"
					>
						<Quote className="text-lg">{featured.content}</Quote>
						<div className="mt-8 flex items-center gap-3">
							<Image
								src={featured.avatar_url || AVATAR_PLACEHOLDER}
								alt={featured.name}
								width={64}
								height={64}
								className="h-16 w-16 rounded-full"
							/>
							<div className="flex flex-col">
								<QuoteDescription
									variant={variant}
									className="text-sm font-medium"
								>
									{featured.name}
								</QuoteDescription>
								{featured.title && (
									<QuoteDescription variant={variant} className="text-xs">
										{featured.title}
									</QuoteDescription>
								)}
							</div>
						</div>
					</Card>
				</div>
			)}

			{/* Remaining testimonials in masonry grid */}
			<div className="mx-auto mt-0 grid max-w-7xl grid-cols-1 items-start gap-4 px-4 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
				{grid.map((testimonialsCol, columnIndex) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: Grid structure is stable and won't reorder
						key={`testimonials-col-${columnIndex}`}
						className="grid items-start gap-4"
					>
						{testimonialsCol.map((testimonial, idx) => (
							<Card
								key={`testimonial-${testimonial.name}-${columnIndex}-${idx}`}
								variant={variant}
							>
								<Quote>{testimonial.content}</Quote>
								<div className="mt-8 flex items-center gap-2">
									<Image
										src={testimonial.avatar_url || AVATAR_PLACEHOLDER}
										alt={testimonial.name}
										width={40}
										height={40}
										className="rounded-full"
									/>
									<div className="flex flex-col">
										<QuoteDescription variant={variant}>
											{testimonial.name}
										</QuoteDescription>
										{testimonial.title && (
											<QuoteDescription
												variant={variant}
												className="text-[10px]"
											>
												{testimonial.title}
											</QuoteDescription>
										)}
									</div>
								</div>
							</Card>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

export const Card = ({
	className,
	children,
	variant = "light",
}: {
	className?: string;
	children: React.ReactNode;
	variant?: CardVariant;
}) => {
	return (
		<div
			className={cn(
				"group relative rounded-xl border p-8",
				variant === "glass"
					? "border-white/10 bg-white/5 text-white shadow-[0_4px_24px_rgba(0,0,0,0.2)] backdrop-blur-md"
					: "border-transparent bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.10)] dark:bg-[rgba(40,40,40,0.30)] dark:shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset]",
				className,
			)}
		>
			{variant === "glass" ? (
				<QuoteIcon
					className="absolute top-3 left-3 scale-x-[-1]"
					size={40}
					strokeWidth={1.5}
					style={{ color: "#24a9e0" }}
					aria-hidden="true"
				/>
			) : (
				<QuoteIcon
					className="absolute top-2 left-2 scale-x-[-1] text-neutral-300"
					aria-hidden="true"
				/>
			)}
			{children}
		</div>
	);
};

export const Quote = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => {
	return (
		<p
			className={cn(
				"relative py-2 text-base font-normal text-black dark:text-white",
				className,
			)}
		>
			{children}
		</p>
	);
};

export const QuoteDescription = ({
	children,
	className,
	variant = "light",
}: {
	children: React.ReactNode;
	className?: string;
	variant?: CardVariant;
}) => {
	return (
		<p
			className={cn(
				"max-w-sm text-xs font-normal",
				variant === "glass"
					? "text-white/70"
					: "text-neutral-600 dark:text-neutral-400",
				className,
			)}
		>
			{children}
		</p>
	);
};
