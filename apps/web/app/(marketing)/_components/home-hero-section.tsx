"use client";

export function HeroSection() {
	return (
		<section className="relative isolate flex min-h-[600px] items-center justify-center overflow-hidden bg-background">
			{/* Gradient Orb Background */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
			>
				<div className="h-[600px] w-[600px] rounded-full bg-[#24a9e0]/20 blur-[128px]" />
			</div>

			{/* Content will be added in T5 */}
			<div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
				{/* Placeholder for hero content */}
			</div>
		</section>
	);
}
